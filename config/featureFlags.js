/**
 * Feature Flags (Q5 확정: env 상수 기반)
 *
 * Settlement 피처 토글 패턴과 동일:
 *   - Render 대시보드에서 env 변경 → restart로 즉시 적용
 *   - 재배포 불필요
 *   - 기본값: MVP 1차 2종만 ON, 나머지 OFF
 *
 * 사용법:
 *   const { wu, isWuEnabled } = require('../config/featureFlags');
 *   if (!isWuEnabled('REL')) return res.status(503).json({ error: 'wu_disabled' });
 *
 * @since 2026-02-13
 */

// ═══════════════════════════════════════════════════════════
// WU 유형별 토글 (12종, MVP 1차는 2종만 ON)
// ═══════════════════════════════════════════════════════════
const wu = {
  // MVP 1차 (기본 ON)
  REL:          process.env.WU_REL_ENABLED !== 'false',
  SELF_ST_TXT:  process.env.WU_SELF_ST_TXT_ENABLED !== 'false',

  // 향후 확장 (기본 OFF)
  SELF_ST_IMG:  process.env.WU_SELF_ST_IMG_ENABLED === 'true',
  CAREER:       process.env.WU_CAREER_ENABLED === 'true',
  HEALTH:       process.env.WU_HEALTH_ENABLED === 'true',
  MONEY:        process.env.WU_MONEY_ENABLED === 'true',
  GROWTH:       process.env.WU_GROWTH_ENABLED === 'true',
  HEALING:      process.env.WU_HEALING_ENABLED === 'true',
  SOCIAL:       process.env.WU_SOCIAL_ENABLED === 'true',
  CREATIVE:     process.env.WU_CREATIVE_ENABLED === 'true',
  FAMILY:       process.env.WU_FAMILY_ENABLED === 'true',
  DREAM:        process.env.WU_DREAM_ENABLED === 'true',
};

// ═══════════════════════════════════════════════════════════
// 시스템 토글
// ═══════════════════════════════════════════════════════════
const system = {
  // 정산 (기존 settlement 패턴 통합)
  SETTLEMENT_INGEST:  process.env.SETTLEMENT_INGEST !== 'false',
  SETTLEMENT_ALLOC:   process.env.SETTLEMENT_ALLOC !== 'false',
  SETTLEMENT_PAYOUT:  process.env.SETTLEMENT_PAYOUT !== 'false',

  // 알림 (Q12: MVP는 OFF, RED 안전게이트 제외)
  NOTIFICATION_ALIMTALK: process.env.NOTIFICATION_ALIMTALK === 'true',
  NOTIFICATION_SMS:      process.env.NOTIFICATION_SMS === 'true',

  // RED 안전게이트 (항상 ON, 끌 수 없음)
  RED_SAFETY_GATE: true,
};

// ═══════════════════════════════════════════════════════════
// 헬퍼 함수
// ═══════════════════════════════════════════════════════════

/**
 * WU 유형이 활성화되어 있는지 확인
 * @param {string} wuType - WU 유형 코드 (REL, SELF_ST_TXT, ...)
 * @returns {boolean}
 */
function isWuEnabled(wuType) {
  return wu[wuType] === true;
}

/**
 * 현재 활성화된 WU 유형 목록 반환
 * @returns {string[]}
 */
function getEnabledWuTypes() {
  return Object.entries(wu)
    .filter(([, enabled]) => enabled)
    .map(([type]) => type);
}

/**
 * 전체 플래그 상태 반환 (ops/health check용)
 * @returns {Object}
 */
function getStatus() {
  return {
    wu,
    system,
    enabled_wu_types: getEnabledWuTypes(),
    total_wu_types: Object.keys(wu).length,
    enabled_wu_count: getEnabledWuTypes().length,
  };
}

module.exports = {
  wu,
  system,
  isWuEnabled,
  getEnabledWuTypes,
  getStatus,
};
