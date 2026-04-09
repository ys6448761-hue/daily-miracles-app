/**
 * uxExperimentConfig.js — UX 실험 카탈로그 (SSOT)
 *
 * 규칙:
 *   1. 동시 2개 이하 실행
 *   2. 핵심 흐름(wish→star→growth) 변경 금지
 *   3. 결제/정책 자동 변경 금지
 *   4. 7일 데이터 미만 → 승격 금지 (minSample 기준)
 */

module.exports = {
  star_flow_layout_test: {
    problem:     'UX 문제',
    metric:      'star_creation_rate',
    target:      70,
    minSample:   200,
    windowDays:  7,
    autoPromote: true,
    variants: {
      A: { ctaPosition: 'bottom', emotionStep: 'after_star' },
      B: { ctaPosition: 'top',   emotionStep: 'same_screen' },
    },
  },

  emotion_ui_test: {
    problem:     '온보딩 문제',
    metric:      'growth_persist_rate',
    target:      50,
    minSample:   200,
    windowDays:  7,
    autoPromote: true,
    variants: {
      A: { ui: 'buttons_4' },
      B: { ui: 'card_2step' },
    },
  },
};
