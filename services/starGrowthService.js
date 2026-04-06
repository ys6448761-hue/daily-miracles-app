'use strict';

/**
 * starGrowthService.js
 *
 * 별의 시간 기반 성장 단계 계산 (순수 함수).
 *
 * 절대 규칙:
 *   ❌ DB에 stage 저장 금지 — 항상 계산형 유지
 *   ❌ 랜덤 금지
 *   ✅ 동일 입력 → 동일 결과
 */

// ── 단계 정의 ────────────────────────────────────────────────────
const STAGES = [
  {
    name:      'Radiance',
    condition: (days, impactCount) => days >= 100 && impactCount > 0,
    trigger:   'Star → Radiance',
    message:   '당신의 빛이 주변까지 닿고 있어요',
  },
  {
    name:      'Star',
    condition: (days, _imp, logCount) => days >= 30 && logCount >= 3,
    trigger:   'Spark → Star',
    message:   '이제 하나의 별로 자리 잡고 있어요',
  },
  {
    name:      'Spark',
    condition: (days) => days >= 3,
    trigger:   'Seed → Spark',
    message:   '빛이 흔들리지 않기 시작했어요',
  },
  {
    name:      'Seed',
    condition: () => true,     // fallback
    trigger:   null,
    message:   null,
  },
];

/**
 * 생성일 기준 경과 일수
 * @param {string|Date} date
 * @returns {number}
 */
function getDaysSince(date) {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 별의 성장 단계 계산
 *
 * @param {object} params
 * @param {string|Date} params.created_at
 * @param {number}      params.impact_count  공명 총 횟수
 * @param {number}      params.log_count     항해 기록 수
 * @returns {{ stage: string, days: number, trigger: string|null, message: string|null }}
 */
function getStarStage({ created_at, impact_count = 0, log_count = 0 }) {
  const days = getDaysSince(created_at);

  for (const s of STAGES) {
    if (s.condition(days, impact_count, log_count)) {
      return {
        stage:   s.name,
        days,
        trigger: s.trigger,
        message: s.message,
      };
    }
  }

  // 방어 — STAGES에 항상 fallback(Seed) 있어서 도달 불가
  return { stage: 'Seed', days, trigger: null, message: null };
}

module.exports = { getStarStage, getDaysSince };
