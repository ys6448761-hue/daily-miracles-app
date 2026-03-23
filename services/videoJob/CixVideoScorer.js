/**
 * CixVideoScorer — CIx-Video 가중치 행렬 점수
 * AIL-2026-0219-VID-003
 *
 * CIx_total = w_code × CIx_code + w_ops × CIx_ops + w_video × CIx_video
 *
 * CIx_video 5 factors:
 *   validator_result    (0.25) - AdCreativeValidator 통과율
 *   korean_integrity    (0.25) - KOR Gate 5항목 통과율
 *   render_success_rate (0.20) - 렌더 성공/전체
 *   regeneration_rate   (0.15) - 키프레임 재생성 빈도 (낮을수록 좋음)
 *   override_usage      (0.15) - 수동 오버라이드 사용률 (낮을수록 좋음)
 */

const WEIGHTS = {
  validator_result:    0.25,
  korean_integrity:    0.25,
  render_success_rate: 0.20,
  regeneration_rate:   0.15,
  override_usage:      0.15,
};

const CIX_TOTAL_WEIGHTS = {
  code:  0.40,
  ops:   0.30,
  video: 0.30,
};

const THRESHOLDS = {
  excellent:  90,
  good:       80,
  acceptable: 70,
  critical:    0,
};

class CixVideoScorer {
  /**
   * CIx-Video 점수 계산 (0-100)
   * @param {Object} signals
   * @param {number} signals.validator_result    - 통과율 (0-1), 예: 304/304 = 1.0
   * @param {number} signals.korean_integrity    - KOR Gate 통과율 (0-1), 예: 5/5 = 1.0
   * @param {number} signals.render_success_rate - 렌더 성공률 (0-1)
   * @param {number} signals.regeneration_rate   - 재생성 비율 (0-1, 0이 최고)
   * @param {number} signals.override_usage      - 오버라이드 비율 (0-1, 0이 최고)
   * @returns {number} 0-100 점수
   */
  static calculate(signals) {
    let score = 0;

    // 긍정 지표 (높을수록 좋음): 그대로 반영
    score += (signals.validator_result || 0) * WEIGHTS.validator_result * 100;
    score += (signals.korean_integrity || 0) * WEIGHTS.korean_integrity * 100;
    score += (signals.render_success_rate || 0) * WEIGHTS.render_success_rate * 100;

    // 역지표 (낮을수록 좋음): 1 - value 로 변환
    score += (1 - (signals.regeneration_rate || 0)) * WEIGHTS.regeneration_rate * 100;
    score += (1 - (signals.override_usage || 0)) * WEIGHTS.override_usage * 100;

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * 상태 매핑
   */
  static getStatus(score) {
    if (score >= THRESHOLDS.excellent) return 'excellent';
    if (score >= THRESHOLDS.good) return 'good';
    if (score >= THRESHOLDS.acceptable) return 'acceptable';
    return 'critical';
  }

  /**
   * CIx_total 확장 계산
   * @param {number} cixCode - 코드 품질 점수 (0-100)
   * @param {number} cixOps - 운영 안정성 점수 (0-100)
   * @param {number} cixVideo - 영상 품질 점수 (0-100)
   * @returns {number} 0-100
   */
  static calculateTotal(cixCode, cixOps, cixVideo) {
    const total =
      (cixCode || 0) * CIX_TOTAL_WEIGHTS.code +
      (cixOps || 0) * CIX_TOTAL_WEIGHTS.ops +
      (cixVideo || 0) * CIX_TOTAL_WEIGHTS.video;
    return Math.round(Math.max(0, Math.min(100, total)));
  }

  /**
   * 가중치 반환 (검증용)
   */
  static getWeights() {
    return { ...WEIGHTS };
  }

  /**
   * CIx Total 가중치 반환
   */
  static getTotalWeights() {
    return { ...CIX_TOTAL_WEIGHTS };
  }

  /**
   * 임계치 반환
   */
  static getThresholds() {
    return { ...THRESHOLDS };
  }
}

module.exports = CixVideoScorer;
