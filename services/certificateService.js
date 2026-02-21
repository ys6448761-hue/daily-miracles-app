/**
 * certificateService.js
 * 4:5 (1024×1280) 입항 증명서 이미지 생성
 *
 * - 기존 소원 이미지 위에 타이틀/날짜/ID/캡션 오버레이
 * - sharp SVG composite 방식 (DALL-E 호출 없음)
 * - Postcard/Wallpaper와 함께 패키지 3종 구성
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const CERT_DIR = path.join(__dirname, '..', 'public', 'images', 'certificates');

const CANVAS = { width: 1024, height: 1280 };
const IMAGE_AREA = { width: 960, height: 800, top: 140, left: 32 };
const TITLE_AREA = { top: 10, height: 120 };
const INFO_AREA = { top: 1120, height: 160 };

/**
 * 출력 디렉토리 보장
 */
function ensureCertDir() {
  try {
    if (!fs.existsSync(CERT_DIR)) {
      fs.mkdirSync(CERT_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn('[Certificate] 디렉토리 생성 실패:', err.message);
  }
}

/**
 * 브랜드 그라디언트 배경 SVG (1024×1280)
 */
function createGradientBackground() {
  const svg = `<svg width="${CANVAS.width}" height="${CANVAS.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#9B87F5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#F5A7C6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${CANVAS.width}" height="${CANVAS.height}" fill="url(#bg)" />
</svg>`;
  return Buffer.from(svg);
}

/**
 * 타이틀 SVG 오버레이
 */
function createTitleSvg() {
  const svg = `<svg width="${CANVAS.width}" height="${TITLE_AREA.height}" xmlns="http://www.w3.org/2000/svg">
  <text x="512" y="50" text-anchor="middle"
    font-family="sans-serif" font-size="26" font-weight="300"
    fill="white" fill-opacity="0.95" letter-spacing="4">YONGGUNG BOARDING CERTIFICATE</text>
  <text x="512" y="85" text-anchor="middle"
    font-family="sans-serif" font-size="15" font-weight="400"
    fill="white" fill-opacity="0.7" letter-spacing="2">입항 증명서</text>
</svg>`;
  return Buffer.from(svg);
}

/**
 * 하단 정보 밴드 SVG
 */
function createInfoBandSvg(date, boardingId, caption) {
  const safe = (str) => String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const svg = `<svg width="${CANVAS.width}" height="${INFO_AREA.height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${CANVAS.width}" height="${INFO_AREA.height}" fill="black" fill-opacity="0.4" />
  <text x="40" y="35" font-family="sans-serif" font-size="16" fill="white" fill-opacity="0.8">${safe(date)}</text>
  <text x="984" y="35" text-anchor="end" font-family="sans-serif" font-size="16" fill="white" fill-opacity="0.8">${safe(boardingId)}</text>
  <line x1="40" y1="55" x2="984" y2="55" stroke="white" stroke-opacity="0.3" stroke-width="1" />
  <text x="512" y="95" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="500" fill="white" fill-opacity="0.95">${safe(caption)}</text>
  <text x="512" y="135" text-anchor="middle" font-family="sans-serif" font-size="13" fill="white" fill-opacity="0.5">하루하루의 기적 · Daily Miracles</text>
</svg>`;
  return Buffer.from(svg);
}

/**
 * 4:5 입항 증명서 이미지 생성
 *
 * @param {Object} options
 * @param {string} options.imagePath  - 소스 이미지 경로 (절대 또는 상대)
 * @param {string} options.date       - 날짜 (YYYY-MM-DD)
 * @param {string} options.boardingId - 증명서 ID (예: YG-20260208-0001)
 * @param {string} options.caption    - 1줄 캡션 (captionService 결과)
 * @returns {Promise<{ certificatePath: string, filename: string, metadata: object }>}
 */
async function generateCertificate({ imagePath, date, boardingId, caption }) {
  ensureCertDir();

  // 입력 이미지 존재 확인
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Source image not found: ${imagePath}`);
  }

  const timestamp = Date.now();
  const safeId = boardingId.replace(/[^a-zA-Z0-9-]/g, '');
  const filename = `cert_${timestamp}_${safeId}.png`;
  const outputPath = path.join(CERT_DIR, filename);

  // 1) 그라디언트 배경 생성
  const bgBuffer = await sharp(createGradientBackground())
    .png()
    .toBuffer();

  // 2) 소스 이미지 리사이즈
  const resizedImage = await sharp(imagePath)
    .resize(IMAGE_AREA.width, IMAGE_AREA.height, {
      fit: 'cover',
      position: 'centre'
    })
    .png()
    .toBuffer();

  // 3) 타이틀 SVG
  const titleSvg = createTitleSvg();

  // 4) 정보 밴드 SVG
  const infoBandSvg = createInfoBandSvg(date, boardingId, caption);

  // 5) 레이어 합성
  await sharp(bgBuffer)
    .composite([
      { input: resizedImage, top: IMAGE_AREA.top, left: IMAGE_AREA.left },
      { input: titleSvg, top: TITLE_AREA.top, left: 0 },
      { input: infoBandSvg, top: INFO_AREA.top, left: 0 }
    ])
    .png({ quality: 95 })
    .toFile(outputPath);

  console.log(`[Certificate] Generated: ${filename} (${CANVAS.width}x${CANVAS.height})`);

  return {
    certificatePath: `/images/certificates/${filename}`,
    filename,
    metadata: {
      width: CANVAS.width,
      height: CANVAS.height,
      aspectRatio: '4:5',
      date,
      boardingId,
      caption,
      generatedAt: new Date().toISOString()
    }
  };
}

module.exports = { generateCertificate };
