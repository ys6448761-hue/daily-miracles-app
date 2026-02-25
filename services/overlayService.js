/**
 * overlayService.js
 * 소원 이미지 하단 그래디언트 + 한국어 캡션 오버레이 합성
 *
 * - opentype.js로 번들 폰트(NotoSansKR-Regular.ttf) 직접 파싱
 * - 텍스트 → SVG <path> 변환 (시스템 폰트 무의존)
 * - sharp composite로 원본 이미지 위에 합성
 */

const sharp = require('sharp');
const opentype = require('opentype.js');
const path = require('path');
const fs = require('fs');
const FontManager = require('./videoJob/FontManager');

// ── 상수 ──────────────────────────────────────────────
const WISHES_IMAGE_DIR = path.join(__dirname, '..', 'public', 'images', 'wishes');
const OVERLAY_HEIGHT = 120;
const CAPTION_FONT_SIZE = 28;
const LINE_HEIGHT = 36;
const MAX_LINE_CHARS = 24;
const MAX_TOTAL_CHARS = MAX_LINE_CHARS * 2; // 48

// ── 폰트 싱글턴 (hard-fail) ──────────────────────────
let _font = null;

function getFont() {
  if (_font) return _font;

  const fontPath = FontManager.resolve(); // throws FONT_NOT_FOUND
  _font = opentype.loadSync(fontPath);

  if (!_font) {
    throw Object.assign(
      new Error(`FONT_LOAD_FAILED: opentype.js 파싱 실패 — ${fontPath}`),
      { errorCode: 'FONT_LOAD_FAILED' }
    );
  }

  return _font;
}

// ── 유틸 ──────────────────────────────────────────────

function xmlSafe(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function ensureDir() {
  if (!fs.existsSync(WISHES_IMAGE_DIR)) {
    fs.mkdirSync(WISHES_IMAGE_DIR, { recursive: true });
  }
}

// ── 캡션 처리 ─────────────────────────────────────────

/**
 * NFC 정규화 + 1~2줄 분할 (각 줄 최대 24자)
 * @param {string} raw
 * @returns {string[]}
 */
function processCaption(raw) {
  let text = String(raw).normalize('NFC').trim();
  text = xmlSafe(text);

  if (text.length > MAX_TOTAL_CHARS) {
    text = text.slice(0, MAX_TOTAL_CHARS);
  }

  if (text.length <= MAX_LINE_CHARS) {
    return [text];
  }

  // 중간 지점 근처 공백에서 분할
  const mid = Math.floor(text.length / 2);
  let splitAt = -1;

  for (let i = mid; i >= mid - 8 && i >= 0; i--) {
    if (text[i] === ' ') { splitAt = i; break; }
  }
  if (splitAt === -1) {
    for (let i = mid + 1; i <= mid + 8 && i < text.length; i++) {
      if (text[i] === ' ') { splitAt = i; break; }
    }
  }
  if (splitAt === -1) splitAt = MAX_LINE_CHARS;

  const line1 = text.slice(0, splitAt).trim();
  const line2 = text.slice(splitAt).trim().slice(0, MAX_LINE_CHARS);

  return line2 ? [line1, line2] : [line1];
}

// ── opentype.js 텍스트 → SVG path ────────────────────

function textToSvgPath(text, fontSize, x, y, fill, fillOpacity) {
  const font = getFont();
  const p = font.getPath(text, x, y, fontSize);
  const d = p.toPathData(2);
  return `<path d="${d}" fill="${fill}" fill-opacity="${fillOpacity}"/>`;
}

function measureTextWidth(text, fontSize) {
  const font = getFont();
  return font.getAdvanceWidth(text, fontSize);
}

// ── SVG 생성 ──────────────────────────────────────────

/**
 * 하단 그래디언트 + 캡션 SVG
 * @param {number} imgWidth
 * @param {number} imgHeight
 * @param {string[]} lines
 * @returns {Buffer}
 */
function createOverlaySvg(imgWidth, imgHeight, lines) {
  const bandTop = imgHeight - OVERLAY_HEIGHT;

  const textPaths = [];
  const totalTextHeight = lines.length * LINE_HEIGHT;
  const textStartY = bandTop + (OVERLAY_HEIGHT - totalTextHeight) / 2 + CAPTION_FONT_SIZE;

  for (let i = 0; i < lines.length; i++) {
    const w = measureTextWidth(lines[i], CAPTION_FONT_SIZE);
    const x = (imgWidth - w) / 2;
    const y = textStartY + i * LINE_HEIGHT;

    // 그림자 (+1,+1)
    textPaths.push(textToSvgPath(lines[i], CAPTION_FONT_SIZE, x + 1, y + 1, '#000000', 0.4));
    // 본문
    textPaths.push(textToSvgPath(lines[i], CAPTION_FONT_SIZE, x, y, '#FFFFFF', 0.95));
  }

  const svg = `<svg width="${imgWidth}" height="${imgHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bottomGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.65"/>
    </linearGradient>
  </defs>
  <rect x="0" y="${bandTop}" width="${imgWidth}" height="${OVERLAY_HEIGHT}" fill="url(#bottomGrad)"/>
  ${textPaths.join('\n  ')}
</svg>`;

  return Buffer.from(svg);
}

// ── 합성 메인 ─────────────────────────────────────────

/**
 * 오버레이 이미지 생성
 * @param {Object} opts
 * @param {string} opts.inputPath       - 소스 이미지 절대 경로
 * @param {string[]} opts.captionLines  - 처리된 캡션 줄 배열
 * @param {string} opts.originalFilename - 원본 파일명 (출력 명명용)
 * @returns {Promise<{ overlay_url: string, filename_overlay: string }>}
 */
async function generateOverlay({ inputPath, captionLines, originalFilename }) {
  ensureDir();

  const metadata = await sharp(inputPath).metadata();
  const imgWidth = metadata.width || 1024;
  const imgHeight = metadata.height || 1024;

  const overlaySvg = createOverlaySvg(imgWidth, imgHeight, captionLines);

  const baseName = path.basename(originalFilename, path.extname(originalFilename));
  const outputFilename = `overlay_${baseName}.png`;
  const outputPath = path.join(WISHES_IMAGE_DIR, outputFilename);

  await sharp(inputPath)
    .composite([{ input: overlaySvg, top: 0, left: 0 }])
    .png({ quality: 95 })
    .toFile(outputPath);

  return {
    overlay_url: `/images/wishes/${outputFilename}`,
    filename_overlay: outputFilename
  };
}

module.exports = { generateOverlay, processCaption, getFont };
