'use strict';

/**
 * makeOgImage — 포스트카드 원본 → OG 이미지 자동 생성
 *
 * 파일 저장:
 *   public/images/postcards/{accessKey}.png      ← 원본 복사본 (full)
 *   public/images/postcards/{accessKey}_og.png   ← 1200×630 OG 규격 (1.91:1)
 *
 * 반환:
 *   { full_url, og_url }  ← /images/postcards/... 상대 경로
 */

const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs');

const PUBLIC_ROOT = path.join(__dirname, '..', '..', '..', 'public');
const POSTCARDS   = path.join(PUBLIC_ROOT, 'images', 'postcards');

async function makeOgImage(sourceRelPath, accessKey) {
  const sourcePath = path.join(PUBLIC_ROOT, sourceRelPath.replace(/^\//, ''));

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`소스 파일 없음: ${sourcePath}`);
  }

  fs.mkdirSync(POSTCARDS, { recursive: true });

  const fullDest = path.join(POSTCARDS, `${accessKey}.png`);
  const ogDest   = path.join(POSTCARDS, `${accessKey}_og.png`);

  // 원본 복사 (포맷 정규화 — sharp가 PNG로 재인코딩)
  await sharp(sourcePath).png().toFile(fullDest);

  // OG 규격: 1200×630 (1.91:1) — cover + top (포스트카드 상단에 주요 피사체)
  await sharp(sourcePath)
    .resize(1200, 630, { fit: 'cover', position: 'top' })
    .png()
    .toFile(ogDest);

  return {
    full_url: `/images/postcards/${accessKey}.png`,
    og_url:   `/images/postcards/${accessKey}_og.png`,
  };
}

module.exports = { makeOgImage };
