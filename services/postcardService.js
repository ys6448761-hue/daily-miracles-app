'use strict';

/**
 * postcardService.js
 * 1:1 (1024×1024) 포스트카드 이미지 합성
 *
 * - 소원 이미지 위에 씰/ID/날짜/캡션 오버레이
 * - SVG text 태그 금지 — opentype.js → SVG path 방식 (svgTextUtils.js)
 * - 레이아웃 좌표는 기존과 동일하게 유지
 */

const sharp    = require('sharp');
const path     = require('path');
const fs       = require('fs');
const { textPath } = require('./svgTextUtils');

const POSTCARD_DIR = path.join(__dirname, '..', 'public', 'images', 'postcards');

const W          = 1024;
const H          = 1024;
const SEAL_TOP   = 15;     // 씰 SVG top offset
const BAND_TOP   = 904;    // 정보 밴드 시작 y
const BAND_H     = 120;    // 정보 밴드 높이

function ensurePostcardDir() {
  if (!fs.existsSync(POSTCARD_DIR)) {
    fs.mkdirSync(POSTCARD_DIR, { recursive: true });
  }
}

/**
 * 전체 오버레이 SVG 빌드 (씰 + 정보 밴드, 1024×1024 좌표계)
 * 모든 텍스트는 opentype.js path — 시스템 폰트 의존 없음
 */
function buildOverlaySvg(date, postcardId, caption) {
  // ── 씰 "Daily Miracles" (좌상단, 절대 y = SEAL_TOP + 26 = 41) ──────
  const dSeal = textPath('Daily Miracles', {
    size: 14, y: SEAL_TOP + 26, align: 'left', x: 20,
  });

  // ── 날짜 (하단 밴드 내부 y=28 → 절대 y = BAND_TOP + 28 = 932) ───────
  const dDate = textPath(String(date), {
    size: 13, y: BAND_TOP + 28, align: 'left', x: 30,
  });

  // ── 포스트카드 ID (우측 끝 x=994) ────────────────────────────────────
  const dId = textPath(String(postcardId), {
    size: 13, y: BAND_TOP + 28, align: 'right', x: 994,
  });

  // ── 캡션 (중앙, y=BAND_TOP+75=979) ──────────────────────────────────
  const dCaption = textPath(String(caption), {
    size: 20, y: BAND_TOP + 75, align: 'center', canvasWidth: W, bold: true,
  });

  // ── 브랜드 태그 (중앙, y=BAND_TOP+105=1009) ──────────────────────────
  const dBrand = textPath('하루하루의 기적 · Daily Miracles', {
    size: 11, y: BAND_TOP + 105, align: 'center', canvasWidth: W,
  });

  return Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">

  <!-- 씰 -->
  <path d="${dSeal}" fill="rgba(255,255,255,0.7)"/>

  <!-- 하단 정보 밴드 배경 -->
  <rect x="0" y="${BAND_TOP}" width="${W}" height="${BAND_H}"
        fill="black" fill-opacity="0.4"/>
  <line x1="30" y1="${BAND_TOP + 42}" x2="994" y2="${BAND_TOP + 42}"
        stroke="white" stroke-opacity="0.25" stroke-width="1"/>

  <!-- 날짜 (좌) -->
  <path d="${dDate}" fill="rgba(255,255,255,0.7)"/>

  <!-- 포스트카드 ID (우) -->
  <path d="${dId}" fill="rgba(255,255,255,0.7)"/>

  <!-- 캡션 -->
  <path d="${dCaption}" fill="rgba(255,255,255,0.95)"
        stroke="rgba(255,255,255,0.3)" stroke-width="0.6"/>

  <!-- 브랜드 태그 -->
  <path d="${dBrand}" fill="rgba(255,255,255,0.45)"/>
</svg>`
  );
}

/**
 * 1:1 포스트카드 이미지 생성
 *
 * @param {{ imagePath: string, date: string, postcardId: string, caption: string }}
 * @returns {Promise<{ postcardPath: string, filename: string, metadata: object }>}
 */
async function generatePostcard({ imagePath, date, postcardId, caption }) {
  ensurePostcardDir();

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Source image not found: ${imagePath}`);
  }

  const timestamp = Date.now();
  const safeId    = postcardId.replace(/[^a-zA-Z0-9-]/g, '');
  const filename  = `pc_${timestamp}_${safeId}.png`;
  const outputPath = path.join(POSTCARD_DIR, filename);

  // 소스 이미지 → 1024×1024 풀블리드
  const resized = await sharp(imagePath)
    .resize(W, H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  // 오버레이 합성 (단일 SVG)
  await sharp(resized)
    .composite([{ input: buildOverlaySvg(date, postcardId, caption), top: 0, left: 0 }])
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`[Postcard] Generated: ${filename} (${W}x${H})`);

  return {
    postcardPath: `/images/postcards/${filename}`,
    filename,
    metadata: {
      width: W, height: H, aspectRatio: '1:1',
      date, postcardId, caption,
      generatedAt: new Date().toISOString(),
    },
  };
}

module.exports = { generatePostcard };
