'use strict';

/**
 * gate6b-star-suppression.js — GATE 6b: hamel recolor halo suppression (v3)
 *
 * 수정 내역 v3:
 *   - 블렌딩 방식 변경: background 샘플 대신 BASE 이미지 픽셀 직접 사용
 *     result = base_pixel + (recolored_pixel - base_pixel) × keepRatio
 *     → keepRatio=0.05: 원본 base 95% 복원 (no flat color artifact)
 *     → 원본 하늘/항구 텍스처 그대로 살아남아 circular artifact 없음
 *   - 탐지: BASE 이미지에서 실행 (recolorStar와 동일 방식)
 *
 * 대상: sapphire / emerald / topaz 계열 15장
 * 사용:
 *   node scripts/thumbnail/gate6b-star-suppression.js           # 실행
 *   node scripts/thumbnail/gate6b-star-suppression.js --dry-run # 탐지만
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT     = path.join(__dirname, '..', '..');
const BASE_DIR = path.join(ROOT, 'public', 'images', 'thumbnails', 'hamel', 'base');
const FULL_DIR = path.join(ROOT, 'public', 'images', 'thumbnails', 'hamel', 'generated', 'full');

const DRY_RUN = process.argv.includes('--dry-run');

const TARGETS = ['sapphire', 'emerald', 'topaz'];

// Suppression parameters
// Inner hard zone (r <= SUPPRESS_R_HARD): keepRatio = KEEP_INNER (flat)
// Feather zone (SUPPRESS_R_HARD < r <= SUPPRESS_R_OUTER): linear KEEP_INNER → 1.0
const KEEP_INNER       = 0.05;  // 5% of glow at center = 95% restored to base
const SUPPRESS_R_HARD  = 245;   // hard zone covers recolorStar glow R=231
const SUPPRESS_R_OUTER = 330;   // feather to natural over 85px

const BASE_FILE_MAP = {
  base01: '01_confusion_hamel_base.png',
  base02: '02_pause_hamel_base.png',
  base03: '03_calm_hamel_base.png',
  base04: '04_curiosity_hamel_base.png',
  base05: '05_fragile_hope_hamel_base.png',
};

function parseBaseId(filename) {
  const m = filename.match(/(base\d+)\.png$/);
  return m ? m[1] : null;
}

function parseEmotion(filename) {
  const m = filename.match(/^hamel_([^_]+)_/);
  return m ? m[1] : null;
}

/**
 * detectGlowCenter — identical to recolorStar.detectStarRegion
 * Runs on BASE image to get the exact center used by recolorStar
 */
async function detectGlowCenter(baseImagePath) {
  const { data, info } = await sharp(baseImagePath)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const channels = 3;
  const N        = width * height;
  const skyLimit = Math.floor(height * 0.65);

  const lum = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const p = i * channels;
    lum[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }

  const skyPixels = [];
  for (let i = 0; i < N; i++) {
    if (Math.floor(i / width) >= skyLimit) continue;
    skyPixels.push({ lum: lum[i], x: i % width, y: Math.floor(i / width) });
  }
  skyPixels.sort((a, b) => b.lum - a.lum);

  const topN      = Math.max(1, Math.floor(skyPixels.length * 0.01));
  const topBright = skyPixels.slice(0, topN);
  const clusterR  = Math.round(Math.min(width, height) * 0.08);
  const clusterR2 = clusterR * clusterR;

  let bestScore = -1, bestPeak = null;
  for (const candidate of skyPixels.slice(0, 20)) {
    let score = 0;
    for (const p of topBright) {
      const dx = p.x - candidate.x, dy = p.y - candidate.y;
      if (dx * dx + dy * dy <= clusterR2) score++;
    }
    if (score > bestScore) { bestScore = score; bestPeak = candidate; }
  }

  return { cx: bestPeak.x, cy: bestPeak.y, peakLum: bestPeak.lum, width, height };
}

/**
 * suppressHalo — base-pixel blend approach
 *
 * result = base_pixel + (recolored_pixel - base_pixel) × keepRatio
 *
 * keepRatio=0.05 at center → 95% of original base texture restored
 * keepRatio=1.0 at outer edge → fully recolored (unchanged)
 *
 * NO flat background color → NO circular artifact
 */
async function suppressHalo(recoloredPath, basePath) {
  const { cx, cy, peakLum, width, height } = await detectGlowCenter(basePath);
  console.log(`  [detect/base] cx=${cx} cy=${cy} peakLum=${peakLum.toFixed(0)}`);

  if (DRY_RUN) {
    console.log(`  --dry-run: would blend toward base at (${cx},${cy})`);
    return false;
  }

  // Load both images as raw RGB
  const recoloredBuf = fs.readFileSync(recoloredPath);
  const baseBuf      = fs.readFileSync(basePath);

  const { data: rcData, info } = await sharp(recoloredBuf)
    .removeAlpha().raw().toBuffer({ resolveWithObject: true });

  const { data: bsData } = await sharp(baseBuf)
    .removeAlpha()
    .resize(info.width, info.height, { kernel: 'lanczos3' })
    .raw().toBuffer({ resolveWithObject: true });

  const { width: W, height: H, channels } = info;

  const out         = Buffer.from(rcData);
  const SR_HARD2    = SUPPRESS_R_HARD * SUPPRESS_R_HARD;
  const SR_OUTER2   = SUPPRESS_R_OUTER * SUPPRESS_R_OUTER;
  const featherSpan = SUPPRESS_R_OUTER - SUPPRESS_R_HARD;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx    = x - cx, dy = y - cy;
      const dist2 = dx * dx + dy * dy;
      if (dist2 >= SR_OUTER2) continue;

      let keepRatio;
      if (dist2 <= SR_HARD2) {
        keepRatio = KEEP_INNER;
      } else {
        const dist = Math.sqrt(dist2);
        const t    = (dist - SUPPRESS_R_HARD) / featherSpan;
        keepRatio  = KEEP_INNER + (1.0 - KEEP_INNER) * t;
      }

      const p = (y * W + x) * channels;

      // Blend: result = base + (recolored - base) × keepRatio
      // Equivalent: result = base × (1 - keepRatio) + recolored × keepRatio
      for (let c = 0; c < channels; c++) {
        const baseVal = bsData[p + c];
        const rcVal   = rcData[p + c];
        out[p + c]    = Math.max(0, Math.min(255, Math.round(baseVal + (rcVal - baseVal) * keepRatio)));
      }
    }
  }

  const result = await sharp(out, {
    raw: { width: W, height: H, channels },
  }).png().toBuffer();

  fs.writeFileSync(recoloredPath, result);
  return true;
}

async function main() {
  const { applyThumbnailText, getCopy } = require('../../services/thumbnailTextService');

  const allFiles = fs.readdirSync(FULL_DIR)
    .filter(f => f.endsWith('.png') && !f.includes('_text'))
    .filter(f => TARGETS.some(t => f.includes(`_${t}_`)))
    .sort();

  console.log(`\n=== GATE 6b v3 — Harbor Star Suppression (base-blend) ===`);
  console.log(`targets: ${TARGETS.join(', ')}`);
  console.log(`files: ${allFiles.length}장`);
  console.log(`method: result = base + (recolored - base) × keepRatio`);
  console.log(`keepInner=${KEEP_INNER} hardR=${SUPPRESS_R_HARD} outerR=${SUPPRESS_R_OUTER}`);
  if (DRY_RUN) console.log(`mode: --dry-run\n`);
  else         console.log();

  let modified = 0, skipped = 0, errors = 0;

  for (const file of allFiles) {
    const baseId   = parseBaseId(file);
    const baseFile = BASE_FILE_MAP[baseId];
    if (!baseFile) {
      console.warn(`⚠ baseId 파싱 실패: ${file} — skip`);
      skipped++; continue;
    }

    const recoloredPath = path.join(FULL_DIR, file);
    const basePath      = path.join(BASE_DIR, baseFile);

    if (!fs.existsSync(basePath)) {
      console.warn(`⚠ base 없음: ${basePath} — skip`);
      skipped++; continue;
    }

    console.log(`\n🎨 ${file}`);
    console.log(`   base: ${baseFile}`);

    try {
      const changed = await suppressHalo(recoloredPath, basePath);
      if (!changed) { skipped++; continue; }
      modified++;

      const emotion  = parseEmotion(file);
      const textFile = file.replace('.png', '_text.png');
      const textPath = path.join(FULL_DIR, textFile);
      const copy     = getCopy('hamel', emotion);
      await applyThumbnailText(recoloredPath, textPath, copy);
      console.log(`  ✅ done`);
    } catch (err) {
      console.error(`  ❌ error:`, err.message);
      errors++;
    }
  }

  console.log(`\n=== RESULT ===`);
  console.log(`modified:  ${modified}장`);
  console.log(`skipped:   ${skipped}장`);
  console.log(`errors:    ${errors}장`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
