'use strict';

/**
 * recolorStar — 기존 별을 감정 gemstone glow 색으로 recolor
 *
 * 별을 추가하지 않는다. base 이미지 안의 기존 별을 recolor한다.
 *
 * 처리 흐름:
 *   1. 상위 1% 밝기 픽셀 클러스터 탐지 → 별 중심 위치 결정
 *      (단순 최고밝기 픽셀이 아닌 밀도 기반 — 고립 노이즈 픽셀 배제)
 *   2. 별 영역 crop
 *   3. grayscale 탈색 → multiply by glow_color (보석 색 입히기)
 *   4. 소프트 원형 alpha mask 적용
 *   5. 원본 이미지에 over blend 합성
 *
 * 이 방식은 별 원본 색상(흰색/청록/노란색 등)과 무관하게 동작한다.
 */

const fs   = require('fs');
const path = require('path');

const CONFIG = path.join(__dirname, '..', '..', '..', 'config', 'thumbnail');

let _colorMap = null;
function _loadColorMap() {
  if (!_colorMap)
    _colorMap = JSON.parse(fs.readFileSync(path.join(CONFIG, 'star-color-map.json'), 'utf-8'));
}

function _hexToRgb(hex) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/**
 * detectStarRegion(buf, channels, width, height)
 *
 * 이미지 상단 65% 에서 별 클러스터를 찾는다.
 * (하단 35% = 등대/건물 lamp 영역 제외)
 *
 * 알고리즘:
 *   1. 상위 1% 밝기 픽셀 수집
 *   2. 상위 20개 후보 각각의 주변 8% 반경 안 밝은 픽셀 수(밀도) 계산
 *   3. 밀도 가장 높은 후보 = 별 중심 (고립 노이즈 픽셀 배제)
 *   4. 해당 중심에서 밝기 50% 이상 범위로 radius 측정
 *
 * Returns { cx, cy, radius, peakLum }
 */
function detectStarRegion(buf, channels, width, height) {
  const N        = width * height;
  const skyLimit = Math.floor(height * 0.65);
  const lum      = new Float32Array(N);

  for (let i = 0; i < N; i++) {
    const p = i * channels;
    lum[i] = 0.299 * buf[p] + 0.587 * buf[p + 1] + 0.114 * buf[p + 2];
  }

  // 상단 65% 픽셀 수집 + 밝기 내림차순 정렬
  const skyPixels = [];
  for (let i = 0; i < N; i++) {
    if (Math.floor(i / width) >= skyLimit) continue;
    skyPixels.push({ lum: lum[i], x: i % width, y: Math.floor(i / width) });
  }
  skyPixels.sort((a, b) => b.lum - a.lum);

  // 상위 1% 임계값 기준 밝은 픽셀 목록
  const topN      = Math.max(1, Math.floor(skyPixels.length * 0.01));
  const topBright = skyPixels.slice(0, topN);

  // 상위 20개 후보 중 주변 clusterR 반경 안 밀도 계산
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

  const peakX   = bestPeak.x;
  const peakY   = bestPeak.y;
  const peakLum = bestPeak.lum;

  // 별 중심 기준 밝기 50% 이상 퍼진 거리 측정 → radius
  const halfMax = peakLum * 0.5;
  const searchR = Math.round(Math.min(width, height) * 0.15);
  let   maxDist = 8;

  for (let dy = -searchR; dy <= searchR; dy++) {
    for (let dx = -searchR; dx <= searchR; dx++) {
      const x = peakX + dx, y = peakY + dy;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (lum[y * width + x] >= halfMax) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > maxDist) maxDist = d;
      }
    }
  }

  const radius = Math.min(maxDist * 2.5, Math.min(width, height) * 0.15);
  return { cx: peakX, cy: peakY, radius, peakLum };
}

/**
 * recolorStar(imageBuffer, emotion) → Buffer
 *
 * 별 탐지 → crop → grayscale 탈색 → gemstone glow 합성 → alpha mask → over blend
 * base 이미지 원본은 절대 변경하지 않는다.
 */
async function recolorStar(imageBuffer, emotion) {
  const sharp = require('sharp');
  _loadColorMap();

  const color = _colorMap[emotion];
  if (!color)          throw new Error(`Unknown emotion: "${emotion}"`);
  if (color._reserved) throw new Error(`Emotion "${emotion}" is RESERVED.`);

  const { data, info } = await sharp(imageBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { cx, cy, radius, peakLum } = detectStarRegion(
    data, info.channels, info.width, info.height
  );

  if (peakLum < 160) {
    throw new Error(
      `별 탐지 실패: peak lum=${peakLum.toFixed(0)}/255 — base에 충분히 밝은 별이 없음`
    );
  }

  const W       = info.width, H = info.height;
  const R       = Math.round(radius * 1.5); // halo 포함 패딩
  const left    = Math.max(0, cx - R);
  const topEdge = Math.max(0, cy - R);
  const cw      = Math.min(W - left, R * 2);
  const ch      = Math.min(H - topEdge, R * 2);
  const lcx     = cx - left;    // crop 내부 기준 x
  const lcy     = cy - topEdge; // crop 내부 기준 y
  const glowRgb = _hexToRgb(color.glow);

  console.log(`  [detect] emotion=${emotion} cx=${cx} cy=${cy} r=${Math.round(radius)} lum=${peakLum.toFixed(0)} glow=${color.glow}`);

  // ── 1. 별 영역 crop ────────────────────────────────────
  const starCrop = await sharp(imageBuffer)
    .extract({ left, top: topEdge, width: cw, height: ch })
    .toBuffer();

  // ── 2. grayscale 탈색 ─────────────────────────────────
  // modulate saturation=0 → 3채널 sRGB 유지하면서 완전 탈색
  const desatCrop = await sharp(starCrop)
    .modulate({ saturation: 0 })
    .toBuffer();

  // ── 3. gemstone glow color 입히기 (multiply) ───────────
  // white × glow = glow_color  /  dark × glow = stays_dark
  const solidColor = await sharp({
    create: { width: cw, height: ch, channels: 3, background: glowRgb },
  }).png().toBuffer();

  const tintedCrop = await sharp(desatCrop)
    .composite([{ input: solidColor, blend: 'multiply' }])
    .png()
    .toBuffer();

  // ── 4. 소프트 원형 alpha mask ──────────────────────────
  // center: opaque → edge: transparent
  // dest-in: tintedCrop에서 mask alpha 있는 곳만 유지
  const maskSvg = Buffer.from(
    `<svg width="${cw}" height="${ch}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="m" cx="${lcx}" cy="${lcy}" r="${R}"
        gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="white" stop-opacity="1"/>
      <stop offset="55%"  stop-color="white" stop-opacity="0.85"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="${lcx}" cy="${lcy}" r="${R}" fill="url(#m)"/>
</svg>`
  );

  const maskedCrop = await sharp(tintedCrop)
    .ensureAlpha()
    .composite([{ input: maskSvg, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // ── 5. 원본 이미지에 합성 ──────────────────────────────
  return sharp(imageBuffer)
    .composite([{ input: maskedCrop, top: topEdge, left, blend: 'over' }])
    .png()
    .toBuffer();
}

module.exports = { recolorStar, detectStarRegion };
