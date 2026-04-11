/**
 * ShortsRenderer.js
 * Hero8Renderer 재사용 — Shorts 전용 래퍼
 *
 * 추가 역할:
 *  - durationPreset 'short' 고정 (6초)
 *  - 9:16 비율은 Hero8Renderer가 QA_SETTINGS.videoRequirements (1080×1920)로 이미 처리
 *  - 신규 FFmpeg 로직 없음 — orchestration only
 */

const Hero8Renderer = require('../hero8/Hero8Renderer');

const SHORTS_PRESET = 'short';

class ShortsRenderer {
  constructor() {
    this._renderer = new Hero8Renderer();
  }

  /**
   * Shorts 렌더링
   * @param {Array}  keyframes - ImageGenerator 출력 (kf1/kf2/kf3)
   * @param {string} outputDir - 출력 디렉토리 (Packager.createOutputDir 결과)
   * @returns {Promise<{ path, size, duration, version, timing, effects }>}
   */
  async render(keyframes, outputDir) {
    return this._renderer.render(keyframes, outputDir, SHORTS_PRESET);
  }

  /** FFmpeg 설치 여부 위임 */
  async checkFFmpeg() {
    return this._renderer.checkFFmpeg();
  }
}

module.exports = ShortsRenderer;
