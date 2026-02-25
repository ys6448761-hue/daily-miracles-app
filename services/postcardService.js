/**
 * postcardService.js
 * 1:1 (1024×1024) 포스트카드 이미지 합성
 *
 * - 소원 이미지 위에 씰/ID/날짜/캡션 오버레이
 * - sharp SVG composite 방식 (certificateService와 동일 패턴)
 * - 원본 이미지 풀블리드 → photo recognizability 최대
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const POSTCARD_DIR = path.join(__dirname, '..', 'public', 'images', 'postcards');

const CANVAS = { width: 1024, height: 1024 };
const SEAL = { top: 15, left: 20, height: 40 };
const INFO_BAND = { top: 904, height: 120 };

/**
 * 출력 디렉토리 보장
 */
function ensurePostcardDir() {
  try {
    if (!fs.existsSync(POSTCARD_DIR)) {
      fs.mkdirSync(POSTCARD_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[Postcard] 디렉토리 생성 실패:', err.message);
  }
}

/**
 * XML-safe 문자열 변환
 */
function safe(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 좌상단 씰 SVG (브랜드 마크)
 */
function createSealSvg() {
  const svg = `<svg width="${CANVAS.width}" height="${SEAL.height}" xmlns="http://www.w3.org/2000/svg">
  <text x="20" y="26" font-family="sans-serif" font-size="14" font-weight="300"
    fill="white" fill-opacity="0.7" letter-spacing="1">Daily Miracles</text>
</svg>`;
  return Buffer.from(svg);
}

/**
 * 하단 정보 밴드 SVG
 */
function createInfoBandSvg(date, postcardId, caption) {
  const svg = `<svg width="${CANVAS.width}" height="${INFO_BAND.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${CANVAS.width}" height="${INFO_BAND.height}" fill="black" fill-opacity="0.4" />
  <text x="30" y="28" font-family="sans-serif" font-size="13" fill="white" fill-opacity="0.7">${safe(date)}</text>
  <text x="994" y="28" text-anchor="end" font-family="sans-serif" font-size="13" fill="white" fill-opacity="0.7">${safe(postcardId)}</text>
  <line x1="30" y1="42" x2="994" y2="42" stroke="white" stroke-opacity="0.25" stroke-width="1" />
  <text x="512" y="75" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="500" fill="white" fill-opacity="0.95">${safe(caption)}</text>
  <text x="512" y="105" text-anchor="middle" font-family="sans-serif" font-size="11" fill="white" fill-opacity="0.45">하루하루의 기적 · Daily Miracles</text>
</svg>`;
  return Buffer.from(svg);
}

/**
 * 1:1 포스트카드 이미지 생성
 *
 * @param {Object} options
 * @param {string} options.imagePath   - 소스 이미지 경로
 * @param {string} options.date        - 날짜 (YYYY-MM-DD)
 * @param {string} options.postcardId  - 포스트카드 ID (예: PC-0209-0001)
 * @param {string} options.caption     - 1줄 캡션
 * @returns {Promise<{ postcardPath: string, filename: string, metadata: object }>}
 */
async function generatePostcard({ imagePath, date, postcardId, caption }) {
  ensurePostcardDir();

  if (!fs.existsSync(imagePath)) {
    throw new Error(`Source image not found: ${imagePath}`);
  }

  const timestamp = Date.now();
  const safeId = postcardId.replace(/[^a-zA-Z0-9-]/g, '');
  const filename = `pc_${timestamp}_${safeId}.png`;
  const outputPath = path.join(POSTCARD_DIR, filename);

  // 1) 소스 이미지 → 1024×1024 풀블리드
  const resizedImage = await sharp(imagePath)
    .resize(CANVAS.width, CANVAS.height, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  // 2) 씰 SVG
  const sealSvg = createSealSvg();

  // 3) 정보 밴드 SVG
  const infoBandSvg = createInfoBandSvg(date, postcardId, caption);

  // 4) 레이어 합성
  await sharp(resizedImage)
    .composite([
      { input: sealSvg, top: SEAL.top, left: 0 },
      { input: infoBandSvg, top: INFO_BAND.top, left: 0 }
    ])
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`[Postcard] Generated: ${filename} (${CANVAS.width}x${CANVAS.height})`);

  return {
    postcardPath: `/images/postcards/${filename}`,
    filename,
    metadata: {
      width: CANVAS.width,
      height: CANVAS.height,
      aspectRatio: '1:1',
      date,
      postcardId,
      caption,
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = { generatePostcard };
