/**
 * constellationService.js
 * Constellation / Cluster 기능 인터페이스 (비활성 상태)
 *
 * ⚠️  현재 상태: 데이터 축적 단계 — 모든 함수는 빈 결과 반환
 *     런칭 이후 활성화 예정 (constellation UI 노출 금지)
 *
 * TODO 활성화 시 구현 순서:
 *   1. getClusterCandidates  — emotion_tag 기반 그룹핑
 *   2. generateConstellationPreview — constellation_type / pose 결정
 *   3. getRisingStars        — star_logs 24h 상승률 계산
 */

'use strict';

/**
 * emotion_tag 기반으로 클러스터 후보군 조회
 * @param {object} db - pg client / pool
 * @returns {Promise<Array>}
 */
async function getClusterCandidates(db) {
  // TODO: dt_stars.emotion_tag 기준 그룹핑, resonance_count 가중치 적용
  return [];
}

/**
 * 클러스터로부터 constellation_type / pose 결정
 * @param {{ stars: Array, galaxy_code: string }} cluster
 * @returns {Promise<null>}
 */
async function generateConstellationPreview(cluster) {
  // TODO: 감정 분포 분석 → constellation_type, pose 결정
  return null;
}

/**
 * 최근 24h 상승률 기준 상승 중인 별 목록
 * @param {object} db - pg client / pool
 * @returns {Promise<Array>}
 */
async function getRisingStars(db) {
  // TODO: star_logs 집계 (24h resonance 증가량 / baseline) → top N 반환
  return [];
}

module.exports = {
  getClusterCandidates,
  generateConstellationPreview,
  getRisingStars,
};
