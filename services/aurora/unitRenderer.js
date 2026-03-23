/**
 * Aurora Unit Renderer
 * anchor.png (+ optional keyframe alt) → uX.mp4
 *
 * 렌더 순서:
 *   1. keyframe 있음 → keyframeBlend(anchor, alt) → blend.mp4
 *   2. motionCompiler(dsl) → filter string
 *   3. FFmpeg: (blend.mp4 or anchor.png) + filter → uX.mp4
 */

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const { keyframeBlend } = require('./keyframeBlend');
const { motionCompiler } = require('./motionDSL');

/**
 * 단일 유닛 렌더
 *
 * @param {object} unit     AuroraSpec v1.2 unit
 * @param {string} tmpDir   임시 작업 디렉토리 (중간 파일 저장)
 * @param {string} outDir   최종 출력 디렉토리 (dist/aurora/units)
 * @returns {string}        출력 mp4 절대경로
 */
function renderUnit(unit, tmpDir, outDir) {
  const { unitId, anchor, keyframe, motion } = unit;

  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const outPath = path.join(outDir, `${unitId}.mp4`);

  // ── Step 1: Keyframe Blend ────────────────────────────────────────────────
  let sourceForMotion;

  if (keyframe) {
    const blendOut = path.join(tmpDir, `${unitId}_blend.mp4`);
    keyframeBlend(
      anchor,
      keyframe.alt,
      keyframe.mode,
      keyframe.start,
      keyframe.duration,
      blendOut
    );
    sourceForMotion = blendOut;
  } else {
    sourceForMotion = anchor; // 이미지 직접 사용
  }

  // ── Step 2: Motion DSL → filter string ───────────────────────────────────
  const dsl    = motion && motion.dsl ? motion.dsl : 'ZIN2';
  const filter = motionCompiler(dsl);

  // ── Step 3: FFmpeg 렌더 ───────────────────────────────────────────────────
  let args;

  if (keyframe) {
    // 소스: mp4 (이미 5초 클립)
    args = [
      '-y',
      '-i', sourceForMotion,
      '-vf', filter,
      '-t', '5',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      outPath,
    ];
  } else {
    // 소스: 정적 이미지 (loop 필요)
    args = [
      '-y',
      '-loop', '1',
      '-i', sourceForMotion,
      '-t', '5',
      '-vf', filter,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-preset', 'medium',
      outPath,
    ];
  }

  try {
    execFileSync('ffmpeg', args, { stdio: 'pipe' });
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString().slice(-3000) : err.message;
    throw new Error(`renderUnit [${unitId}] FFmpeg error:\n${stderr}`);
  }

  return outPath;
}

module.exports = { renderUnit };
