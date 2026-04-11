/**
 * aiGateway.js — AI 호출 중앙 게이트웨이 v2
 *
 * 기능:
 *   1. 캐시 확인 (dt_ai_cache)
 *   2. 유저별 DB 기반 한도 (dt_users.ai_calls_limit / is_premium)
 *   3. 일일 예산 확인 (AI_DAILY_BUDGET_KRW)
 *   4. AI 호출 + 결과 캐시 저장
 *   5. fallback + 업셀 트리거 (한도 초과 시 limitReached=true 반환)
 *   6. 모든 경로 로깅 (dt_ai_calls + dt_ai_events)
 *
 * 원칙:
 *   - 절대 throw하지 않는다. 어떤 상황에서도 { text, source } 반환
 *   - Premium 유저: 제한 없음
 *   - Boost 유저: ai_calls_limit 반영 (DB 기준)
 *   - 무료 유저: default 5회
 */

'use strict';

const crypto = require('crypto');
const db     = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('aiGateway');

// ── 환경변수 ──────────────────────────────────────────────────────────
const DEFAULT_FREE_LIMIT = parseInt(process.env.AI_MAX_CALLS_PER_USER ?? '5',     10);
const DAILY_BUDGET_KRW   = parseInt(process.env.AI_DAILY_BUDGET_KRW   ?? '30000', 10);
const CACHE_TTL_MIN      = parseInt(process.env.AI_CACHE_TTL_MINUTES   ?? '10080', 10); // 7일
const FALLBACK_ENABLED   =        (process.env.AI_FALLBACK_ENABLED     ?? 'true') === 'true';

// ── GPT 요금 추정 ─────────────────────────────────────────────────────
const COST_PER_1K = {
  'gpt-4.1-mini': { in: 0.40/1000*1350, out: 1.60/1000*1350 },
  'gpt-4o':       { in: 5.00/1000*1350, out: 15.0/1000*1350 },
  'gpt-4o-mini':  { in: 0.15/1000*1350, out: 0.60/1000*1350 },
  'gpt-4':        { in: 30.0/1000*1350, out: 60.0/1000*1350 },
};

function estimateCost(model, tIn, tOut) {
  const r = COST_PER_1K[model] ?? COST_PER_1K['gpt-4.1-mini'];
  return (tIn / 1000) * r.in + (tOut / 1000) * r.out;
}

// ── 캐시 키 ──────────────────────────────────────────────────────────
function makeCacheKey(service, userId, step, wishText) {
  const raw = `${service}:${userId ?? 'anon'}:${step}:${(wishText ?? '').slice(0, 100)}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 64);
}
function makePromptHash(str) {
  return crypto.createHash('sha256').update(str).digest('hex').slice(0, 64);
}

// ── 캐시 조회/저장 ────────────────────────────────────────────────────
async function checkCache(cacheKey) {
  try {
    const { rows } = await db.query(
      `SELECT response FROM dt_ai_cache WHERE cache_key = $1 AND expires_at > NOW() LIMIT 1`,
      [cacheKey]
    );
    if (rows[0]) {
      db.query(`UPDATE dt_ai_cache SET hit_count = hit_count + 1 WHERE cache_key = $1`, [cacheKey]).catch(() => {});
      return rows[0].response;
    }
  } catch (e) { log.warn('캐시 조회 실패', { err: e.message }); }
  return null;
}

async function saveCache(cacheKey, service, step, response) {
  try {
    const expiresAt = new Date(Date.now() + CACHE_TTL_MIN * 60 * 1000);
    await db.query(
      `INSERT INTO dt_ai_cache (cache_key, response, service, step, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (cache_key) DO UPDATE SET response = EXCLUDED.response, expires_at = EXCLUDED.expires_at, hit_count = 0`,
      [cacheKey, response, service, step, expiresAt]
    );
  } catch (e) { log.warn('캐시 저장 실패', { err: e.message }); }
}

// ── 유저 AI 상태 조회 (DB 기반) ──────────────────────────────────────
async function getUserAiStatus(userId) {
  if (!userId) {
    return { is_premium: false, ai_calls_limit: DEFAULT_FREE_LIMIT, ai_calls_used: 0, ai_tier: 'free' };
  }
  try {
    const { rows } = await db.query(
      `SELECT is_premium, ai_calls_limit, ai_calls_used, ai_tier, ai_boost_expires_at
       FROM dt_users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    if (!rows[0]) {
      return { is_premium: false, ai_calls_limit: DEFAULT_FREE_LIMIT, ai_calls_used: 0, ai_tier: 'free' };
    }
    const u = rows[0];

    // boost 만료 체크: 만료됐으면 limit 원복 (비동기 처리)
    if (u.ai_boost_expires_at && new Date(u.ai_boost_expires_at) < new Date() && u.ai_tier === 'boost') {
      db.query(
        `UPDATE dt_users SET ai_calls_limit = $1, ai_tier = 'free', ai_boost_expires_at = NULL WHERE id = $2`,
        [DEFAULT_FREE_LIMIT, userId]
      ).catch(() => {});
      u.ai_calls_limit = DEFAULT_FREE_LIMIT;
      u.ai_tier = 'free';
    }

    return u;
  } catch (e) {
    log.warn('유저 AI 상태 조회 실패', { err: e.message });
    return { is_premium: false, ai_calls_limit: DEFAULT_FREE_LIMIT, ai_calls_used: 0, ai_tier: 'free' };
  }
}

// ── 유저 ai_calls_used 증가 (AI 실제 호출 후) ─────────────────────────
async function incrementUserCallCount(userId) {
  if (!userId) return;
  try {
    await db.query(
      `UPDATE dt_users SET ai_calls_used = ai_calls_used + 1 WHERE id = $1`,
      [userId]
    );
  } catch (e) { log.warn('호출 수 증가 실패', { err: e.message }); }
}

// ── 일일 예산 조회 ────────────────────────────────────────────────────
async function getTodayBudgetUsed() {
  try {
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(cost_krw), 0) AS total FROM dt_ai_calls
       WHERE created_at >= CURRENT_DATE AND cache_hit = false`
    );
    return parseFloat(rows[0]?.total ?? '0');
  } catch (e) { return 0; }
}

// ── AI 호출 로그 ──────────────────────────────────────────────────────
async function logCall(opts) {
  const { userId, starId, service, step, model, promptHash,
    tokensIn = 0, tokensOut = 0, costKrw = 0,
    cacheHit = false, fallbackUsed = false, latencyMs = null } = opts;
  try {
    await db.query(
      `INSERT INTO dt_ai_calls
         (user_id, star_id, service_name, step, model, prompt_hash,
          tokens_in, tokens_out, cost_krw, cache_hit, fallback_used, latency_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [userId ?? null, starId ?? null, service, step ?? null, model ?? null, promptHash ?? null,
       tokensIn, tokensOut, costKrw, cacheHit, fallbackUsed, latencyMs]
    );
  } catch (e) { log.warn('AI 호출 로그 실패', { err: e.message }); }
}

// ── UX 이벤트 로그 ───────────────────────────────────────────────────
async function logAiEvent({ userId, starId, eventName, productType, context }) {
  try {
    await db.query(
      `INSERT INTO dt_ai_events (user_id, star_id, event_name, product_type, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId ?? null, starId ?? null, eventName, productType ?? null,
       context ? JSON.stringify(context) : null]
    );
  } catch (e) { log.warn('AI 이벤트 로그 실패', { err: e.message }); }
}

// ── 템플릿 사용 로그 ──────────────────────────────────────────────────
async function logTemplateUsed({ userId, starId, service, step, day, galaxy }) {
  try {
    await db.query(
      `INSERT INTO dt_ai_calls (user_id, star_id, service_name, step, model, cache_hit, fallback_used, cost_krw)
       VALUES ($1,$2,$3,$4,'template',false,false,0)`,
      [userId ?? null, starId ?? null, service ?? 'templateBank', `${step}_day${day}_${galaxy}`]
    );
  } catch (e) { log.warn('템플릿 로그 실패', { err: e.message }); }
}

// ════════════════════════════════════════════════════════════════════
// 메인 call()
// ════════════════════════════════════════════════════════════════════
/**
 * @returns { text, source, limitReached?, usageInfo? }
 *   limitReached: true → UX에서 업셀 프롬프트 노출
 *   usageInfo: { used, limit, tier, remaining }
 */
async function call(options) {
  const {
    userId, starId, service, step, wishText = '', modelFn, fallback = '소원을 응원합니다.',
  } = options;

  const cacheKey = makeCacheKey(service, userId, step, wishText);
  const t0 = Date.now();

  // ── 1. 캐시 확인 ────────────────────────────────────────────────
  const cached = await checkCache(cacheKey);
  if (cached) {
    log.info('캐시 히트', { service, step, userId });
    await logCall({ userId, starId, service, step, cacheHit: true, latencyMs: Date.now() - t0 });
    return { text: cached, source: 'cache' };
  }

  // ── 2. 유저 AI 상태 (DB 기반) ──────────────────────────────────
  const userStatus = await getUserAiStatus(userId);
  const { is_premium, ai_calls_limit, ai_calls_used, ai_tier } = userStatus;

  const usageInfo = {
    used:      ai_calls_used,
    limit:     is_premium ? Infinity : ai_calls_limit,
    tier:      ai_tier,
    remaining: is_premium ? Infinity : Math.max(0, ai_calls_limit - ai_calls_used),
  };

  // Premium: 무제한
  const limitExceeded = !is_premium && (ai_calls_used >= ai_calls_limit);

  if (limitExceeded) {
    log.warn('유저 AI 호출 한도 초과', { userId, ai_calls_used, ai_calls_limit, ai_tier });

    // 한도 도달 이벤트 기록
    await logAiEvent({
      userId, starId,
      eventName: 'ai_limit_reached',
      context: { service, step, used: ai_calls_used, limit: ai_calls_limit, tier: ai_tier },
    });
    await logCall({ userId, starId, service, step, fallbackUsed: true, latencyMs: Date.now() - t0 });

    return { text: fallback, source: 'fallback', limitReached: true, usageInfo };
  }

  // ── 3. 일일 예산 확인 ──────────────────────────────────────────
  const todayUsed = await getTodayBudgetUsed();
  if (todayUsed >= DAILY_BUDGET_KRW) {
    log.warn('일일 예산 초과', { todayUsed, DAILY_BUDGET_KRW });
    await logCall({ userId, starId, service, step, fallbackUsed: true, latencyMs: Date.now() - t0 });
    return { text: fallback, source: 'fallback', usageInfo };
  }

  // ── 4. AI 호출 ─────────────────────────────────────────────────
  if (!modelFn) {
    return { text: fallback, source: 'fallback', usageInfo };
  }

  try {
    const result    = await modelFn();
    const text      = typeof result === 'string' ? result : result.text;
    const model     = result?.model     ?? 'gpt-4.1-mini';
    const tokensIn  = result?.tokensIn  ?? 0;
    const tokensOut = result?.tokensOut ?? 0;
    const costKrw   = estimateCost(model, tokensIn, tokensOut);
    const latencyMs = Date.now() - t0;
    const promptHash = makePromptHash(wishText + step);

    await saveCache(cacheKey, service, step, text);
    await logCall({ userId, starId, service, step, model, promptHash, tokensIn, tokensOut, costKrw, latencyMs });
    await incrementUserCallCount(userId);

    log.info('AI 호출 완료', { service, step, model, tokensOut, costKrw: costKrw.toFixed(2), latencyMs });

    return { text, source: 'ai', usageInfo: { ...usageInfo, used: ai_calls_used + 1, remaining: Math.max(0, usageInfo.remaining - 1) } };

  } catch (err) {
    log.error('AI 호출 실패 → fallback', { service, step, err: err.message });
    await logCall({ userId, starId, service, step, fallbackUsed: true, latencyMs: Date.now() - t0 });
    return { text: fallback, source: 'fallback', usageInfo };
  }
}

// ── 통계 (관리자용) ──────────────────────────────────────────────────
async function getStats({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE NOT cache_hit AND NOT fallback_used)     AS ai_calls,
         COUNT(*) FILTER (WHERE cache_hit)                               AS cache_hits,
         COUNT(*) FILTER (WHERE fallback_used)                           AS fallbacks,
         COALESCE(SUM(cost_krw) FILTER (WHERE NOT cache_hit), 0)        AS total_cost_krw,
         COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)      AS unique_users
       FROM dt_ai_calls WHERE created_at >= NOW() - INTERVAL '${days} days'`
    );
    return rows[0];
  } catch (e) { return null; }
}

async function getUserStats(userId) {
  try {
    const userStatus = await getUserAiStatus(userId);
    const { rows } = await db.query(
      `SELECT COALESCE(SUM(cost_krw), 0) AS total_cost_krw,
              COUNT(*) FILTER (WHERE cache_hit) AS cache_hits
       FROM dt_ai_calls WHERE user_id = $1`,
      [userId]
    );
    return {
      ai_calls_used:      userStatus.ai_calls_used,
      ai_calls_limit:     userStatus.ai_calls_limit,
      ai_calls_remaining: Math.max(0, userStatus.ai_calls_limit - userStatus.ai_calls_used),
      is_premium:         userStatus.is_premium,
      ai_tier:            userStatus.ai_tier,
      total_cost_krw:     parseFloat(rows[0]?.total_cost_krw ?? 0),
      cache_hits:         parseInt(rows[0]?.cache_hits ?? 0),
    };
  } catch (e) { return null; }
}

module.exports = {
  call, logTemplateUsed, logAiEvent,
  getStats, getUserStats, getUserAiStatus,
  DEFAULT_FREE_LIMIT, DAILY_BUDGET_KRW,
  // 하위 호환
  MAX_CALLS_PER_USER: DEFAULT_FREE_LIMIT,
};
