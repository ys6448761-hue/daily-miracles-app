/**
 * aiRecommendationService.js — 패턴 기반 항로 추천 엔진
 *
 * 원칙:
 *   - "나와 비슷한 사람들이 다음에 뭐 했는가"
 *   - 새 데이터 없음 — dreamtown_flow + star_profile만 활용
 *   - 유사 사용자 < 5명이면 룰 기반(recommendationService) fallback
 *   - 항상 1개만 반환
 *
 * 흐름:
 *   buildUserVector → getAllUserVectors → similarity top-20
 *   → findNextAction (유사 사용자가 진입한 stage 중 현재 유저에 없는 것)
 *   → generateAIRecommendation
 */

'use strict';

const db      = require('../database/db');
const flow    = require('./dreamtownFlowService');
const ruleBased = require('./recommendationService');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('aiRec');

// ── 현재 유저 feature 벡터 ────────────────────────────────────
async function buildUserVector(userId) {
  const { rows } = await db.query(
    `SELECT
       COUNT(*) FILTER (WHERE stage = 'growth')    AS growth_count,
       COUNT(*) FILTER (WHERE stage = 'resonance') AS resonance_count,
       COUNT(*) FILTER (WHERE stage = 'impact')    AS impact_count,
       MAX(1) FILTER (WHERE stage = 'star')        AS has_star,
       MAX(1) FILTER (WHERE stage = 'growth')      AS has_growth,
       MAX(1) FILTER (WHERE stage = 'resonance')   AS has_resonance,
       MAX(1) FILTER (WHERE stage = 'impact')      AS has_impact,
       MAX(1) FILTER (WHERE stage = 'connection')  AS has_connection
     FROM dreamtown_flow WHERE user_id = $1`,
    [userId]
  );
  const r = rows[0] ?? {};

  // 감정: 마지막 state_checkin value에서 추출
  const emoRow = await db.query(
    `SELECT value->>'state' AS emotion
     FROM dreamtown_flow
     WHERE user_id = $1 AND stage = 'wish' AND action = 'state_checkin'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );

  const stage = !r.has_star      ? 'wish'
              : !r.has_growth    ? 'growth'
              : !r.has_resonance ? 'resonance'
              : !r.has_impact    ? 'impact'
              : 'connection';

  return {
    stage,
    emotion:        emoRow.rows[0]?.emotion ?? null,
    growthCount:    parseInt(r.growth_count,    10) || 0,
    resonanceCount: parseInt(r.resonance_count, 10) || 0,
    impactCount:    parseInt(r.impact_count,    10) || 0,
    has_growth:    !!r.has_growth,
    has_resonance: !!r.has_resonance,
    has_impact:    !!r.has_impact,
    has_connection: !!r.has_connection,
  };
}

// ── 전체 유저 벡터 배치 조회 ──────────────────────────────────
async function getAllUserVectors(excludeUserId) {
  const { rows } = await db.query(
    `SELECT
       user_id,
       COUNT(*) FILTER (WHERE stage = 'growth')    AS growth_count,
       COUNT(*) FILTER (WHERE stage = 'resonance') AS resonance_count,
       COUNT(*) FILTER (WHERE stage = 'impact')    AS impact_count,
       MAX(1) FILTER (WHERE stage = 'star')        AS has_star,
       MAX(1) FILTER (WHERE stage = 'growth')      AS has_growth,
       MAX(1) FILTER (WHERE stage = 'resonance')   AS has_resonance,
       MAX(1) FILTER (WHERE stage = 'impact')      AS has_impact,
       MAX(1) FILTER (WHERE stage = 'connection')  AS has_connection
     FROM dreamtown_flow
     WHERE user_id != $1
     GROUP BY user_id`,
    [excludeUserId]
  );

  return rows.map(r => ({
    userId:         r.user_id,
    stage:         !r.has_star      ? 'wish'
                 : !r.has_growth    ? 'growth'
                 : !r.has_resonance ? 'resonance'
                 : !r.has_impact    ? 'impact'
                 : 'connection',
    growthCount:    parseInt(r.growth_count,    10) || 0,
    resonanceCount: parseInt(r.resonance_count, 10) || 0,
    impactCount:    parseInt(r.impact_count,    10) || 0,
    has_growth:    !!r.has_growth,
    has_resonance: !!r.has_resonance,
    has_impact:    !!r.has_impact,
    has_connection: !!r.has_connection,
  }));
}

// ── 유사도 점수 ───────────────────────────────────────────────
function similarity(a, b) {
  let score = 0;
  if (a.stage   === b.stage)   score += 2;
  if (a.emotion && a.emotion === b.emotion) score += 2;
  score -= Math.abs(a.growthCount    - b.growthCount);
  score -= Math.abs(a.resonanceCount - b.resonanceCount);
  return score;
}

// ── 유사 사용자 중 가장 많이 진입한 "다음 단계" ──────────────
function findNextAction(userVec, similarUsers) {
  // 현재 유저에 없는 단계를, 유사 사용자가 얼마나 가졌는지 카운트
  const candidates = [];

  if (!userVec.has_growth    && similarUsers.filter(u => u.has_growth).length    > 0) {
    candidates.push({ type: 'growth',    count: similarUsers.filter(u => u.has_growth).length });
  }
  if (!userVec.has_resonance && similarUsers.filter(u => u.has_resonance).length > 0) {
    candidates.push({ type: 'resonance', count: similarUsers.filter(u => u.has_resonance).length });
  }
  if (!userVec.has_impact    && similarUsers.filter(u => u.has_impact).length    > 0) {
    candidates.push({ type: 'impact',    count: similarUsers.filter(u => u.has_impact).length });
  }

  if (!candidates.length) return null;

  // 가장 많이 선택된 다음 단계
  candidates.sort((a, b) => b.count - a.count);
  return candidates[0];
}

// ── AI 추천 메시지 생성 ───────────────────────────────────────
const AI_MESSAGES = {
  growth: {
    type:    'action',
    message: '지금 당신과 비슷한 단계의 사람들은\n작은 행동을 시작한 후 더 오래 유지됐어요',
    cta:     '지금 시작하기',
  },
  resonance: {
    type:    'social',
    message: '지금 당신과 비슷한 단계의 사람들은\n감정을 나눈 후 더 또렷하게 지속됐어요',
    cta:     '공명하기',
  },
  impact: {
    type:    'impact',
    message: '지금 당신과 비슷한 단계의 사람들은\n경험을 나눈 후 연결이 깊어졌어요',
    cta:     '나눔하기',
  },
};

// ── 트리거 SSOT — 4개 외 추가 금지 ─────────────────────────
// Trigger 1: after_star    — 별 생성 직후 (강제 1회)
// Trigger 2: idle_after_star — 별 생성 후 30초 무행동 (클라이언트 감지 → 서버 검증)
// Trigger 3: day1_miss     — Day1 미시작 + 24시간 경과
// Trigger 4: day7_stall    — Day7 미완료 + 48시간 비활동

const DAILY_CAP    = 2;   // 하루 최대 노출 횟수
const COOLDOWN_MS  = 6 * 60 * 60 * 1000; // 같은 트리거 6시간 쿨다운

const TRIGGER_MESSAGES = {
  after_star: {
    type:    'action',
    message: '지금 이 단계에서는\n작은 행동 하나가 가장 큰 변화를 만들어요',
    cta:     '오늘의 행동 시작',
  },
  idle_after_star: {
    type:    'action',
    message: '여기서 멈춘 사람들이\n작은 행동 하나로 다시 움직였어요',
    cta:     '지금 이어가기',
  },
  day1_miss: {
    type:    'persist',
    message: '비슷한 사람들은 첫날을 시작했을 때\n가장 오래 이어졌어요',
    cta:     '지금 시작하기',
  },
  day7_stall: {
    type:    'persist',
    message: '여기서 멈추지 않은 사람들이\n가장 많이 변화했어요',
    cta:     '한 번 더 이어가기',
  },
};

// 하루 노출 횟수 + 같은 트리거 쿨다운 통합 확인
async function checkGate(userId, trigger) {
  try {
    const { rows } = await db.query(
      `SELECT action, value->>'trigger' AS trig, created_at
       FROM dreamtown_flow
       WHERE user_id = $1 AND stage = 'recommendation' AND action = 'trigger'
         AND created_at >= NOW() - INTERVAL '1 day'
       ORDER BY created_at DESC`,
      [userId]
    );

    // 하루 2회 상한
    if (rows.length >= DAILY_CAP) return false;

    // 같은 트리거 6시간 쿨다운
    const lastSame = rows.find(r => r.trig === trigger);
    if (lastSame) {
      const elapsed = Date.now() - new Date(lastSame.created_at).getTime();
      if (elapsed < COOLDOWN_MS) return false;
    }

    return true;
  } catch { return true; } // DB 오류 시 통과 (추천 실패보다 노출 우선)
}

// 멈춤 상태 자동 감지 (Trigger 3, 4) — 앱 진입 시 호출
async function detectStall(userId) {
  try {
    const { rows } = await db.query(
      `SELECT
         MAX(CASE WHEN stage='star'   AND action='create'       THEN created_at END) AS star_at,
         MAX(CASE WHEN stage='growth' AND action='day1_start'   THEN created_at END) AS day1_at,
         MAX(CASE WHEN stage='growth' AND action='day7_complete' THEN created_at END) AS day7_at,
         MAX(created_at) FILTER (WHERE stage='growth')                                AS last_growth_at
       FROM dreamtown_flow WHERE user_id = $1`,
      [userId]
    );
    const r   = rows[0] ?? {};
    const now = Date.now();

    const starAt      = r.star_at       ? new Date(r.star_at).getTime()       : null;
    const day1At      = r.day1_at       ? new Date(r.day1_at).getTime()       : null;
    const day7At      = r.day7_at       ? new Date(r.day7_at).getTime()       : null;
    const lastGrowthAt = r.last_growth_at ? new Date(r.last_growth_at).getTime() : null;

    // Trigger 3: 별은 있는데 Day1 미시작 + 24시간 경과
    if (starAt && !day1At && (now - starAt) > 24 * 60 * 60 * 1000) return 'day1_miss';

    // Trigger 4: Day1은 했는데 Day7 미완료 + 마지막 성장 활동 48시간 경과
    if (day1At && !day7At && lastGrowthAt && (now - lastGrowthAt) > 48 * 60 * 60 * 1000) return 'day7_stall';

    return null;
  } catch { return null; }
}

// 트리거 추천 조회 — 게이트 통과 시에만 반환
async function getTriggerRecommendation(userId, trigger) {
  const msg = TRIGGER_MESSAGES[trigger];
  if (!msg) return null;

  try {
    const pass = await checkGate(userId, trigger);
    if (!pass) return null;

    flow.log({
      userId,
      stage:  'recommendation',
      action: 'trigger',
      value:  { trigger, type: msg.type },
    }).catch(() => {});

    log.info('트리거 노출', { userId, trigger, type: msg.type });
    return { trigger, ...msg };
  } catch {
    return null;
  }
}

// ── 메인: AI 추천 조회 ────────────────────────────────────────
async function getAIRecommendation(userId) {
  const [userVec, allVectors] = await Promise.all([
    buildUserVector(userId),
    getAllUserVectors(userId),
  ]);

  // 유사 사용자 top-20
  const ranked = allVectors
    .map(u => ({ user: u, score: similarity(userVec, u) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
    .map(r => r.user);

  const MIN_SIMILAR = 5;
  const source = ranked.length >= MIN_SIMILAR ? 'ai' : 'rule';

  let nextAction = null;
  let recommendation = null;
  let similarCount = ranked.length;

  if (source === 'ai') {
    nextAction     = findNextAction(userVec, ranked);
    recommendation = nextAction ? AI_MESSAGES[nextAction.type] ?? null : null;
  }

  // fallback → 룰 기반
  if (!recommendation) {
    const rulResult = await ruleBased.getRecommendation(userId);
    // getRecommendation already logs 'show', re-use its output
    return {
      source:      'rule',
      stage:       rulResult.stage,
      gap:         rulResult.gap,
      recommendation: rulResult.recommendation,
      similar_count: similarCount,
    };
  }

  // AI 추천 로그
  flow.log({
    userId,
    stage:  'recommendation',
    action: 'ai_suggest',
    value:  { type: nextAction.type, similar_count: similarCount },
  }).catch(() => {});

  log.info('AI 추천 노출', { userId, type: nextAction.type, similarCount });

  return {
    source:      'ai',
    stage:       userVec.stage,
    gap:         nextAction.type,
    recommendation,
    similar_count: similarCount,
    pattern_support: nextAction.count,
  };
}

// ── 클릭 로그 ──────────────────────────────────────────────────
async function logAIClick(userId, gap) {
  await flow.log({
    userId,
    stage:  'recommendation',
    action: 'ai_click',
    value:  { type: gap },
  });
  log.info('AI 추천 클릭', { userId, gap });
}

// ── KPI: AI 추천 성능 ─────────────────────────────────────────
async function getAIKpi({ days = 7 } = {}) {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE action = 'ai_suggest') AS suggest_count,
         COUNT(*) FILTER (WHERE action = 'ai_click')   AS click_count
       FROM dreamtown_flow
       WHERE stage = 'recommendation'
         AND created_at >= NOW() - ($1 || ' days')::INTERVAL`,
      [days]
    );
    const r          = rows[0];
    const suggest    = parseInt(r.suggest_count, 10) || 0;
    const click      = parseInt(r.click_count,   10) || 0;
    const clickRate  = suggest > 0 ? Math.round((click / suggest) * 100) : null;

    return { period_days: days, suggest_count: suggest, click_count: click, click_rate: clickRate };
  } catch (e) {
    log.warn('AI KPI 집계 실패', { err: e?.message });
    return null;
  }
}

module.exports = { getAIRecommendation, logAIClick, getAIKpi, getTriggerRecommendation, detectStall };
