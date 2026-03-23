/**
 * Aurora Keyframe Blend
 * base.png + alt.png → 5초 블렌드 클립 (intermediate.mp4)
 *
 * 지원 모드: SOFT_REVEAL | BLINK_FAST | GRADUAL_FADE
 */

const { execFileSync } = require('child_process');

const BLEND_MODES = ['SOFT_REVEAL', 'BLINK_FAST', 'GRADUAL_FADE'];

// 모드별 기본값
const DEFAULTS = {
  SOFT_REVEAL:  { start: 1.0, duration: 1.2 },
  BLINK_FAST:   { start: 1.0, duration: 0.15 },
  GRADUAL_FADE: { start: 1.0, duration: 2.0 },
};

/**
 * 두 이미지를 xfade로 블렌드하여 5초 mp4 생성
 *
 * @param {string} basePath  base 이미지 절대경로 (anchor)
 * @param {string} altPath   alt 이미지 절대경로 (keyframe.alt)
 * @param {string} mode      SOFT_REVEAL | BLINK_FAST | GRADUAL_FADE
 * @param {number} [start]   xfade offset (초), 미지정 시 mode 기본값
 * @param {number} [duration] xfade duration (초), 미지정 시 mode 기본값
 * @param {string} outPath   출력 mp4 절대경로
 */
function keyframeBlend(basePath, altPath, mode, start, duration, outPath) {
  const def = DEFAULTS[mode];
  if (!def) {
    throw new Error(`Unknown keyframe mode: "${mode}". Valid: ${BLEND_MODES.join(', ')}`);
  }

  const xStart    = (start    !== undefined && start    !== null) ? start    : def.start;
  const xDuration = (duration !== undefined && duration !== null) ? duration : def.duration;

  // xfade filter: base → alt, 5초 총 길이
  // [0:v] = base (5s loop), [1:v] = alt (5s loop)
  const filterComplex =
    `[0:v][1:v]xfade=transition=fade:duration=${xDuration}:offset=${xStart},format=yuv420p[v]`;

  const args = [
    '-y',
    '-loop', '1', '-t', '5', '-r', '30', '-i', basePath,
    '-loop', '1', '-t', '5', '-r', '30', '-i', altPath,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-t', '5',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    outPath,
  ];

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe' });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().slice(-3000) : err.message;
    throw new Error(`keyframeBlend FFmpeg error [${mode}]:\n${stderr}`);
  }
}

module.exports = { keyframeBlend, BLEND_MODES };
