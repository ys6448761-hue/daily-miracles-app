'use strict';

/**
 * thumbnailTextService.js — 썸네일 텍스트 오버레이 (Sharp + opentype.js)
 *
 * 목적:
 *   AI 생성 이미지에 텍스트를 포함하지 않고, 별도 레이어로 합성.
 *   폰트 렌더링은 svgTextUtils.js(공통 유틸)를 경유 — 시스템 폰트 무관.
 *
 * 사용:
 *   const { applyThumbnailText, getCopy } = require('./thumbnailTextService');
 *   const copy = getCopy('hamel', 'calm');
 *   await applyThumbnailText('clean.png', 'text.png', copy);
 */

const fs           = require('fs');
const path         = require('path');
const sharp        = require('sharp');
const { textPath } = require('./svgTextUtils');

const CONFIG_DIR = path.join(__dirname, '..', 'config', 'thumbnail');

// ── copy SSOT 로더 ──────────────────────────────────────────────────
// config/thumbnail/{location}-copy.json + {location}.json → { line1, line2, bottom }
const _copyCache = {};

function getCopy(location, emotion) {
  const cacheKey = `${location}_${emotion}`;
  if (_copyCache[cacheKey]) return _copyCache[cacheKey];

  const copyPath = path.join(CONFIG_DIR, `${location}-copy.json`);
  const ssotPath = path.join(CONFIG_DIR, `${location}.json`);

  if (!fs.existsSync(copyPath)) throw new Error(`copy SSOT 없음: ${copyPath}`);
  if (!fs.existsSync(ssotPath)) throw new Error(`location SSOT 없음: ${ssotPath}`);

  const copies = JSON.parse(fs.readFileSync(copyPath, 'utf-8'));
  const ssot   = JSON.parse(fs.readFileSync(ssotPath, 'utf-8'));
  const bottom = ssot.text?.bottom || 'Daily Miracles · 여수';

  const entry = copies.find(c => (c.emotion || '') === emotion);
  if (!entry) throw new Error(`emotion '${emotion}' not found in ${copyPath}`);

  const result = { line1: entry.lines?.[0] || '', line2: entry.lines?.[1] || '', bottom };
  _copyCache[cacheKey] = result;
  return result;
}

// ── 텍스트 오버레이 합성 ────────────────────────────────────────────
/**
 * @param {string} inputPath  - 원본 clean PNG 경로
 * @param {string} outputPath - 텍스트 합성 완료 PNG 저장 경로
 * @param {{ line1: string, line2: string, bottom: string }} copy
 * @returns {Promise<string>} outputPath
 */
async function applyThumbnailText(inputPath, outputPath, { line1, line2, bottom }) {
  const imgBuf = fs.readFileSync(inputPath);
  const { width: W, height: H } = await sharp(imgBuf).metadata();

  // 폰트 크기 (이미지 폭 기준 비율)
  const SIZE1 = Math.round(W * 0.048);  // line1: ~49px (1024 기준)
  const SIZE2 = Math.round(W * 0.034);  // line2: ~35px
  const SIZEB = Math.round(W * 0.022);  // bottom: ~23px

  // Y 기준선
  const Y1 = Math.round(H * 0.096);
  const Y2 = Math.round(H * 0.148);
  const YB = Math.round(H * 0.956);

  // 그라디언트 영역 높이
  const TOP_GH = Math.round(H * 0.22);
  const BOT_GH = Math.round(H * 0.15);

  const p1 = textPath(line1,  { size: SIZE1, y: Y1, align: 'center', canvasWidth: W, bold: true });
  const p2 = textPath(line2,  { size: SIZE2, y: Y2, align: 'center', canvasWidth: W });
  const pb = textPath(bottom, { size: SIZEB, y: YB, align: 'center', canvasWidth: W });

  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tg" x1="0" y1="0" x2="0" y2="${TOP_GH}"
                    gradientUnits="userSpaceOnUse">
      <stop offset="0"   stop-color="#000" stop-opacity="0.60"/>
      <stop offset="1"   stop-color="#000" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="bg" x1="0" y1="${H - BOT_GH}" x2="0" y2="${H}"
                    gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000" stop-opacity="0.55"/>
    </linearGradient>
  </defs>

  <rect x="0" y="0" width="${W}" height="${TOP_GH}" fill="url(#tg)"/>
  <rect x="0" y="${H - BOT_GH}" width="${W}" height="${BOT_GH}" fill="url(#bg)"/>

  <path d="${p1}" fill="rgba(255,255,255,0.95)"
        stroke="rgba(255,255,255,0.45)" stroke-width="0.9"/>
  <path d="${p2}" fill="rgba(255,255,255,0.76)"/>
  <path d="${pb}" fill="rgba(255,213,100,0.88)"/>
</svg>`
  );

  await sharp(imgBuf)
    .composite([{ input: svg, blend: 'over' }])
    .png({ quality: 95 })
    .toFile(outputPath);

  return outputPath;
}

module.exports = { applyThumbnailText, getCopy };
