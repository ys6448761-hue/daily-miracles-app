'use strict';

/**
 * utils.js — thumbnail 파이프라인 공통 유틸
 *
 * 사용:
 *   const { EMOTION_ORDER, promptFilename, normalizeCopy, runGenerate, reclassifyPrompts } = require('./utils');
 */

const fs   = require('fs');
const path = require('path');

// 5-emotion 순서 SSOT — copy 배열 인덱스와 1:1 대응
const EMOTION_ORDER = ['confusion', 'pause', 'calm', 'curiosity', 'fragile_hope'];

// {num}_{emotion}_{location}_prompt.txt
function promptFilename(num, emotion, location) {
  return `${String(num).padStart(2, '0')}_${emotion}_${location}_prompt.txt`;
}

// {num}_{emotion}_{location}.png
function imageFilename(num, emotion, location) {
  return `${String(num).padStart(2, '0')}_${emotion}_${location}.png`;
}

// 구 포맷 ["line1","line2"] → 신 포맷 {emotion, lines:[...]} 정규화
function normalizeCopy(copy, fallbackEmotion) {
  if (Array.isArray(copy)) return { emotion: fallbackEmotion || null, lines: copy };
  return copy;
}

// 구 파일명 {num}_{location}_prompt.txt → {num}_{emotion}_{location}_prompt.txt
function reclassifyPrompts(promptDir, location, emotions) {
  if (!fs.existsSync(promptDir)) return;

  const oldPattern = new RegExp(`^(\\d+)_${location}_prompt\\.txt$`);
  const files = fs.readdirSync(promptDir)
    .filter(f => oldPattern.test(f))
    .sort();

  if (files.length === 0) return;

  console.log(`🔁 reclassify: ${files.length}개 파일 emotion 태그 삽입`);
  files.forEach((file, i) => {
    const emotion  = emotions[i] || `emotion${i + 1}`;
    const num      = file.match(/^(\d+)/)[1];
    const newName  = promptFilename(num, emotion, location);
    if (file !== newName) {
      fs.renameSync(path.join(promptDir, file), path.join(promptDir, newName));
      console.log(`  ${file} → ${newName}`);
    }
  });
}

// generate 공통 루프
// outputDir = public/images/thumbnails/{location}/generated/ (기본)
//           = public/images/thumbnails/{location}/base/      (generate-thumbnail.js 사용 시)
// skipBaseCheck: true → base/ 사전 존재 확인 건너뜀 (베이스 신규 생성 시)
async function runGenerate({ promptDir, outputDir, dryRun = false, skipBaseCheck = false }) {
  require('dotenv').config();

  if (!skipBaseCheck) {
    const baseDir = path.join(path.dirname(outputDir), 'base');
    const baseImages = fs.existsSync(baseDir)
      ? fs.readdirSync(baseDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f))
      : [];
    if (baseImages.length === 0) {
      console.error('❌ base 이미지 없음:', baseDir);
      console.error('  원본 5장을 base/ 폴더에 먼저 저장하세요. 생성 중단.');
      process.exit(1);
    }
    console.log(`📂 base 확인: ${baseImages.length}장 (${baseDir})`);
  }

  fs.mkdirSync(outputDir, { recursive: true });

  if (!fs.existsSync(promptDir)) {
    console.error('❌ 프롬프트 폴더 없음:', promptDir);
    process.exit(1);
  }

  const files = fs.readdirSync(promptDir).filter(f => f.endsWith('.txt')).sort();

  if (files.length === 0) {
    console.error('❌ .txt 파일 없음 — build 스크립트를 먼저 실행하세요');
    process.exit(1);
  }

  console.log(`📋 프롬프트 ${files.length}개 발견:`, files);

  if (dryRun) {
    console.log('\n--dry-run: 이미지 생성 없이 프롬프트 출력');
    for (const file of files) {
      const txt    = fs.readFileSync(path.join(promptDir, file), 'utf-8').trim();
      const outFile = promptToAssetFilename(file);
      console.log(`\n── ${file} → ${outFile} (${txt.length}자) ──`);
      console.log(txt.slice(0, 200) + (txt.length > 200 ? '…' : ''));
    }
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 없음. .env 설정 필요.');
    process.exit(1);
  }

  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  for (const file of files) {
    const outFile = promptToAssetFilename(file);  // {loc}_{emo}_{gem}_{num}.png
    const outPath = path.join(outputDir, outFile);

    if (fs.existsSync(outPath)) {
      console.log('⏭  Skip (already exists):', outFile);
      continue;
    }

    const prompt = fs.readFileSync(path.join(promptDir, file), 'utf-8').trim();
    console.log('🎨 Generating:', file, '→', outFile);

    const result = await openai.images.generate({
      model:  'gpt-image-1',
      prompt,
      size:   '1024x1024',
    });

    const b64 = result.data[0].b64_json;
    if (!b64) {
      console.error('❌ b64_json 없음 — 응답:', JSON.stringify(result.data[0]));
      process.exit(1);
    }

    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    console.log('✅ Saved:', outFile);
  }

  console.log(`\n✅ DONE: ${files.length}개 처리 완료`);
  console.log('📁', outputDir);
}

// --- 보석/별 색상 매핑 ---

const STAR_COLOR_MAP_PATH  = path.join(__dirname, '..', '..', 'config', 'thumbnail', 'star-color-map.json');
const GEMSTONE_MAP_PATH    = path.join(__dirname, '..', '..', 'config', 'thumbnail', 'gemstone-map.json');
let _starColorMap = null;
let _gemstoneMap  = null;

function getGemstone(emotion) {
  if (!_gemstoneMap) {
    try { _gemstoneMap = JSON.parse(fs.readFileSync(GEMSTONE_MAP_PATH, 'utf-8')); }
    catch (_) { _gemstoneMap = {}; }
  }
  return (_gemstoneMap[emotion] || {}).gemstone || 'unknown';
}

// {num}_{emotion}_{location}_prompt.txt → {location}_{emotion}_{gemstone}_{num}.png
// emotion은 언더스코어 포함 가능 (fragile_hope 등) — location은 고정 집합으로 우선 매칭
const KNOWN_LOCATIONS_RE = '(?:hamel|cafe|cablecar|hotel)';
function promptToAssetFilename(file) {
  const m = file.match(new RegExp(`^(\\d+)_(.+)_(${KNOWN_LOCATIONS_RE})_prompt\\.txt$`));
  if (!m) return file.replace(/_prompt\.txt$/, '.png').replace(/\.txt$/, '.png');
  const [, num, emotion, location] = m;
  return `${location}_${emotion}_${getGemstone(emotion)}_${num}.png`;
}

function getStarColor(emotion) {
  if (!_starColorMap) {
    try { _starColorMap = JSON.parse(fs.readFileSync(STAR_COLOR_MAP_PATH, 'utf-8')); }
    catch (_) { _starColorMap = {}; }
  }
  return _starColorMap[emotion] || { hex: '#9B87F5', glow: 'rgba(155,135,245,0.4)', label: 'default purple', prompt_desc: 'soft purple glow' };
}

// 5점 별 SVG path 생성 (cx/cy: 중심, R: 외반경)
function _starSvgPath(cx, cy, R) {
  const r = R * 0.38;
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    const rad   = i % 2 === 0 ? R : r;
    pts.push(`${(cx + rad * Math.cos(angle)).toFixed(2)},${(cy + rad * Math.sin(angle)).toFixed(2)}`);
  }
  return 'M ' + pts.join(' L ') + ' Z';
}

// 감정 색 별 오버레이 — 이미지 버퍼 위에 별 합성
async function drawStar(imageBuffer, emotion, opts = {}) {
  const sharp = require('sharp');
  const meta  = await sharp(imageBuffer).metadata();
  const W = meta.width, H = meta.height;
  const { cx = W * 0.5, cy = H * 0.22, R = 54 } = opts;
  const color = getStarColor(emotion);
  const d     = _starSvgPath(cx, cy, R);

  const svg = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <path d="${d}" fill="${color.hex}" filter="url(#glow)" opacity="0.88"/>
</svg>`
  );

  return sharp(imageBuffer)
    .composite([{ input: svg, blend: 'over' }])
    .png()
    .toBuffer();
}

// 썸네일 완성 오버레이: 별(감정색) + 상단/하단 한글 텍스트
// Korean text: opentype.js → SVG path (깨짐 방지)
async function createOverlay(imageBuffer, topText, bottomText, emotion) {
  const sharp    = require('sharp');
  const opentype = require('opentype.js');
  const meta = await sharp(imageBuffer).metadata();
  const W = meta.width, H = meta.height;
  const fontPath = path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansKR-Regular.ttf');
  const font = opentype.loadSync(fontPath);

  function textPathData(text, size, x, y) {
    return font.getPath(text, x, y, size).toPathData();
  }
  function centerX(text, size) {
    return (W - font.getAdvanceWidth(text, size)) / 2;
  }

  const topSize = 22, bottomSize = 18;
  const svgText = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <path d="${textPathData(topText, topSize, centerX(topText, topSize), 72)}" fill="rgba(255,255,255,0.92)"/>
  <path d="${textPathData(bottomText, bottomSize, centerX(bottomText, bottomSize), H - 44)}" fill="rgba(255,215,106,0.88)"/>
</svg>`
  );

  const withStar = await drawStar(imageBuffer, emotion);
  return sharp(withStar)
    .composite([{ input: svgText, blend: 'over' }])
    .png()
    .toBuffer();
}

module.exports = {
  EMOTION_ORDER,
  promptFilename,
  imageFilename,
  normalizeCopy,
  reclassifyPrompts,
  runGenerate,
  getStarColor,
  getGemstone,
  promptToAssetFilename,
  drawStar,
  createOverlay,
};
