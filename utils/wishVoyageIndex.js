/**
 * 소원항해 지수(Wish Voyage Index) 계산 모듈
 * @module wishVoyageIndex
 */

/**
 * 소원항해 지수를 계산합니다.
 *
 * @param {Object} scores                      - 각 항목 점수 모음
 * @param {number} scores.execution            - 실행(Execution) 점수 0~20
 * @param {number} scores.readiness            - 준비도(Readiness) 점수 0~20
 * @param {number} scores.wish                 - 소원 명확도(Wish Clarity) 점수 0~20
 * @param {number} scores.partner              - 파트너 정렬(Partner Alignment) 점수 0~20
 * @param {number} scores.mood                 - 감정 상태(Mood) 점수 0~20
 * @returns {{score:number, level:string, factors:Object}} 계산 결과
 *   - score  : 최종 소원항해 지수 (50~100)
 *   - level  : 항해 레벨("준비항해" | "성장항해" | "순항항해" | "기적항해")
 *   - factors: 원래 입력 점수들
 */
function calculateWishVoyageIndex({
  execution,
  readiness,
  wish,
  partner,
  mood
}) {
  const factors = { execution, readiness, wish, partner, mood };

  // 1) 유효성 검사
  for (const [key, value] of Object.entries(factors)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`"${key}" 값은 숫자여야 합니다.`);
    }
    if (value < 0 || value > 20) {
      throw new Error(`"${key}" 값은 0~20 사이여야 합니다. (현재: ${value})`);
    }
  }

  // 2) 기본 점수 계산 (0~100)
  const base = execution + readiness + wish + partner + mood;

  // 3) 50~100 사이로 클램핑
  const score = Math.max(50, Math.min(base, 100));

  // 4) 점수 구간별 레벨 결정
  function getWishVoyageLevel(score) {
    if (score >= 90) return "기적항해";
    if (score >= 80) return "순항항해";
    if (score >= 70) return "성장항해";
    return "준비항해"; // 50~69
  }

  const level = getWishVoyageLevel(score);

  return {
    score,
    level,
    factors
  };
}

module.exports = {
  calculateWishVoyageIndex
};
