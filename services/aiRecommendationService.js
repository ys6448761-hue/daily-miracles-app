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

// ── 트리거 기반 고정 메시지 (4개 위치) ───────────────────────
const DAILY_CAP = 2; // 하루 최대 노출 횟수

const TRIGGER_MESSAGES = {
  after_star: {
    type:    'action',
    message: '지금 이 단계에서는\n작은 행동 하나가 가장 큰 변화를 만들어요',
    cta:     '오늘의 행동 시작',
  },
  after_day1: {
    type:    'persist',
    message: '비슷한 사람들은 감정을 남겼을 때\n더 오래 유지됐어요',
    cta:     '감정 남기기',
  },
  before_day7: {
    type:    'persist',
    message: '여기서 멈추지 않은 사람들이\n가장 많이 변화했어요',
    cta:     '한 번 더 이어가기',
  },
  before_resonance: {
    type:    'social',
    message: '이 순간을 나눈 사람들이\n더 또렷해졌어요',
    cta:     '공명하기',
  },
};

// 오늘 이미 몇 번 노출됐는지
async function checkDailyCap(userId) {
  try {
    const { rows } = await db.query(
      `SELECT COUNT(*) AS cnt FROM dreamtown_flow
       WHERE user_id = $1 AND stage = 'recommendation' AND action = 'ai_suggest'
         AND created_at >= NOW() - INTERVAL '1 day'`,
      [userId]
    );
    return parseInt(rows[0]?.cnt, 10) || 0;
  } catch { return 0; }
}

// 트리거 추천 조회 — 일일 상한 초과 시 null 반환
async function getTriggerRecommendation(userId, trigger) {
  const msg = TRIGGER_MESSAGES[trigger];
  if (!msg) return null;

  try {
    const todayCount = await checkDailyCap(userId);
    if (todayCount >= DAILY_CAP) return null;

    flow.log({
      userId,
      stage:  'recommendation',
      action: 'ai_suggest',
      value:  { trigger, type: msg.type },
    }).catch(() => {});

    log.info('트리거 추천 노출', { userId, trigger, type: msg.type });
    return { trigger, ...msg };
  } catch {
    return null; // 오류 시 조용히 생략 — 추천 실패가 흐름을 막지 않음
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

module.exports = { getAIRecommendation, logAIClick, getAIKpi, getTriggerRecommendation };
