/**
 * experiment.js — DreamTown A/B 실험 유틸리티
 *
 * 원칙:
 *   - 사용자당 1번 할당 (localStorage 고정)
 *   - 50:50 랜덤 분기
 *   - 서버 의존 없음
 *
 * SSOT: Coupon Experiment SSOT v1
 */

const LS_PREFIX = 'dt_exp_';

/**
 * 실험 ID에 대한 variant를 반환 (없으면 50:50으로 신규 할당)
 * @param {string} experimentId  — e.g. 'coupon_test_1'
 * @returns {'A' | 'B'}
 */
export function getOrAssignVariant(experimentId) {
  const key    = LS_PREFIX + experimentId;
  const stored = localStorage.getItem(key);
  if (stored === 'A' || stored === 'B') return stored;

  const variant = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(key, variant);
  return variant;
}

/**
 * 현재 할당된 variant 조회 (없으면 null)
 * @param {string} experimentId
 * @returns {'A' | 'B' | null}
 */
export function getVariant(experimentId) {
  const v = localStorage.getItem(LS_PREFIX + experimentId);
  return v === 'A' || v === 'B' ? v : null;
}

/**
 * 실험 초기화 (테스트용)
 * @param {string} experimentId
 */
export function resetVariant(experimentId) {
  localStorage.removeItem(LS_PREFIX + experimentId);
}
