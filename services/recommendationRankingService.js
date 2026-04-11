/**
 * recommendationRankingService.js — Signal-Aware Ranking Layer
 *
 * 기존 mode 추천 후보군 위에 galaxy_signals 기반 점수 재정렬을 얹는다.
 * 추천 내용은 건드리지 않는다. 순서만 조정.
 *
 * 설계 원칙:
 *   - mode 밖의 카드는 절대 섞지 않는다
 *   - signal은 보정값이지 본체가 아니다
 *   - 사용자는 이유를 몰라도 된다
 *
 * 운영 상수 (코드 수정 없이 변경 가능 — 향후 env로 분리 가능):
 */

'use strict';

const db = require('../database/db');

// ── 운영 상수 ─────────────────────────────────────────────────────────
const SIGNAL_CONTEXT_BONUS      = 3;
const SIGNAL_EMOTION_BONUS      = 2;
const SIGNAL_LENGTH_BONUS       = 1;
const RECENT_EXPOSURE_PENALTY   = 2;  // 최근 3일 내 노출 시
const IMMEDIATE_REPEAT_PENALTY  = 4;  // 직전 노출 카드
const SIGNAL_MIN_COUNT          = 2;  // 이 미만이면 ranking skip

// ── 항로별 Signal Affinity 매핑 ───────────────────────────────────────
// mode 추천 후보군의 각 route_code에 signal 친화도를 정의한다.
// nullable 필드 — 없으면 base_weight만 사용
const ROUTE_SIGNAL_AFFINITY = {
  yeosu_healing: {
    context: ['before_sleep', 'alone'],
    emotion: ['calm', 'fatigue', 'sadness'],
    length:  ['short', 'medium'],
    base_weight: 10,
  },
  daily_basic: {
    context: ['before_sleep', 'morning_commute'],
    emotion: ['neutral', 'calm'],
    length:  ['short'],
    base_weight: 8,
  },
  north_challenge_core: {
    context: ['morning_commute', 'moving'],
    emotion: ['desire', 'anxiety'],
    length:  ['medium', 'long'],
    base_weight: 10,
  },
  yeosu_activity: {
    context: ['moving', 'morning_commute'],
    emotion: ['desire', 'joy'],
    length:  ['short', 'medium'],
    base_weight: 9,
  },
  yeosu_reflection: {
    context: ['before_sleep', 'alone'],
    emotion: ['calm', 'neutral'],
    length:  ['medium', 'long'],
    base_weight: 10,
  },
  yeosu_social: {
    context: ['alone'],
    emotion: ['joy', 'sadness'],
    length:  ['medium'],
    base_weight: 10,
  },
  miracle_intro_route: {
    context: null,
    emotion: ['neutral'],
    length:  ['short'],
    base_weight: 7,
  },
};

// ── dominant signal 조회 ──────────────────────────────────────────────
async function getDominantSignals(journeyId) {
  const result = await db.query(
    `SELECT signal_type, signal_key, COUNT(*)::int AS count
     FROM galaxy_signals
     WHERE journey_id = $1
       AND created_at >= NOW() - INTERVAL '7 days'
     GROUP BY signal_type, signal_key
     ORDER BY signal_type, count DESC`,
    [journeyId]
  );

  const byType = {};
  for (const row of result.rows) {
    if (!byType[row.signal_type]) byType[row.signal_type] = row; // top 1 per type
  }

  return {
    context:       byType.context?.signal_key  ?? null,
    contextCount:  byType.context?.count        ?? 0,
    emotion:       byType.emotion?.signal_key   ?? null,
    emotionCount:  byType.emotion?.count        ?? 0,
    length:        byType.length?.signal_key    ?? null,
    lengthCount:   byType.length?.count         ?? 0,
  };
}

// ── 최근 노출 이력 조회 ───────────────────────────────────────────────
async function getRecentExposures(journeyId) {
  const result = await db.query(
    `SELECT recommendation_id, created_at
     FROM recommendation_exposures
     WHERE journey_id = $1
       AND created_at >= NOW() - INTERVAL '3 days'
     ORDER BY created_at DESC`,
    [journeyId]
  );
  return result.rows; // [{ recommendation_id, created_at }]
}

// ── 단일 후보 점수 계산 ───────────────────────────────────────────────
function scoreCandidate(routeCode, dominant, recentExposures) {
  const affinity    = ROUTE_SIGNAL_AFFINITY[routeCode];
  const baseWeight  = affinity?.base_weight ?? 5;

  let score         = baseWeight;
  const breakdown   = { base: baseWeight, context: 0, emotion: 0, length: 0, repeat_penalty: 0 };

  if (affinity) {
    if (affinity.context && dominant.context && affinity.context.includes(dominant.context)) {
      score            += SIGNAL_CONTEXT_BONUS;
      breakdown.context = SIGNAL_CONTEXT_BONUS;
    }
    if (affinity.emotion && dominant.emotion && affinity.emotion.includes(dominant.emotion)) {
      score            += SIGNAL_EMOTION_BONUS;
      breakdown.emotion = SIGNAL_EMOTION_BONUS;
    }
    if (affinity.length && dominant.length && affinity.length.includes(dominant.length)) {
      score            += SIGNAL_LENGTH_BONUS;
      breakdown.length  = SIGNAL_LENGTH_BONUS;
    }
  }

  // 반복 방지
  const exposureIdx = recentExposures.findIndex(e => e.recommendation_id === routeCode);
  if (exposureIdx === 0) {
    // 직전 노출 (가장 최근)
    score                    -= IMMEDIATE_REPEAT_PENALTY;
    breakdown.repeat_penalty  = -IMMEDIATE_REPEAT_PENALTY;
  } else if (exposureIdx > 0) {
    // 최근 3일 내 노출
    score                    -= RECENT_EXPOSURE_PENALTY;
    breakdown.repeat_penalty  = -RECENT_EXPOSURE_PENALTY;
  }

  return { route_code: routeCode, score, breakdown };
}

/**
 * rank — 메인 진입점
 *
 * @param {string[]} candidateCodes  — mode 기반 후보 route_code 배열 (primary 먼저)
 * @param {string}   journeyId       — galaxy_signals 조회용
 * @returns {Promise<{ranked: string[], dominant, top_score, score_breakdown, signal_used: boolean}>}
 */
async function rank(candidateCodes, journeyId) {
  if (!journeyId || candidateCodes.length === 0) {
    return { ranked: candidateCodes, signal_used: false };
  }

  const [dominant, recentExposures] = await Promise.all([
    getDominantSignals(journeyId),
    getRecentExposures(journeyId),
  ]);

  // signal 데이터가 충분하지 않으면 기존 순서 유지
  const hasSignal = dominant.contextCount >= SIGNAL_MIN_COUNT
                 || dominant.emotionCount  >= SIGNAL_MIN_COUNT;

  if (!hasSignal) {
    return { ranked: candidateCodes, dominant, signal_used: false };
  }

  const scored = candidateCodes.map(code =>
    scoreCandidate(code, dominant, recentExposures)
  );

  scored.sort((a, b) => b.score - a.score);

  return {
    ranked:          scored.map(s => s.route_code),
    dominant,
    top_score:       scored[0]?.score,
    score_breakdown: scored.map(s => ({ route_code: s.route_code, ...s.breakdown })),
    signal_used:     true,
  };
}

/**
 * recordExposure — 추천 노출 기록 (recommendation_ranked 이후 호출)
 */
async function recordExposure(journeyId, routeCode) {
  await db.query(
    `INSERT INTO recommendation_exposures (journey_id, recommendation_id) VALUES ($1, $2)`,
    [journeyId, routeCode]
  );
}

module.exports = { rank, recordExposure };
