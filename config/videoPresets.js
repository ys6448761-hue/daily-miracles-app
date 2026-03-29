/**
 * videoPresets.js
 * 영상 duration 프리셋 — Hero8Renderer에서 참조
 *
 * 핵심 원칙: Hero8 내부 로직 불변, duration만 외부화
 * 비율(ratio)은 각 클립의 총 클립 시간 대비 기여도
 */

const VIDEO_PRESETS = {
  short: {
    duration: 6,
    ratio: {
      zoomIn: 0.35,
      pan:    0.35,
      outro:  0.30,
    },
  },
  default: {
    duration: 8,
    ratio: {
      zoomIn: 0.35,
      pan:    0.35,
      outro:  0.30,
    },
  },
  extended: {
    duration: 10,
    ratio: {
      zoomIn: 0.35,
      pan:    0.35,
      outro:  0.30,
    },
  },
};

module.exports = { VIDEO_PRESETS };
