'use strict';

/**
 * SSOT: .claude/DEC/DEC-THUMBNAIL-PIPELINE-v2.md
 * Do not modify thumbnail pipeline logic without checking this DEC.
 *
 * build-thumbnail.js — 위치+감정 통합 프롬프트 빌더 + 샘플 합성
 *
 * 사용:
 *   node scripts/thumbnail/build-thumbnail.js --location hamel          # 프롬프트 생성
 *   node scripts/thumbnail/build-thumbnail.js --location hamel --emotion calm
 *   node scripts/thumbnail/build-thumbnail.js --test                    # 5감정 프롬프트 테스트
 *   node scripts/thumbnail/build-thumbnail.js --location hamel --sample5v2  # recolor 5장 (정식)
 *   node scripts/thumbnail/build-thumbnail.js --location hamel --full25     # FULL 25장 생성
 *   node scripts/thumbnail/build-thumbnail.js --location hamel --sample5    # [deprecated] overlay 합성
 */

const fs     = require('fs');
const path   = require('path');
const crypto = require('crypto');
const { EMOTION_ORDER, getStarColor, promptFilename, normalizeCopy, reclassifyPrompts } = require('./utils');

const ROOT = path.join(__dirname, '..', '..');
const args = process.argv.slice(2);

const TEST_MODE      = args.includes('--test');
const SAMPLE5_MODE   = args.includes('--sample5');
const SAMPLE5V2_MODE = args.includes('--sample5v2');
const FULL25_MODE    = args.includes('--full25');
const locIdx         = args.indexOf('--location');
const emoFilterIdx   = args.indexOf('--emotion');
const LOCATION       = locIdx >= 0 ? args[locIdx + 1] : (TEST_MODE ? 'hamel' : null);
const EMO_FILTER     = emoFilterIdx >= 0 ? args[emoFilterIdx + 1] : null;

// ─────────────────────────────────────────────────────────
// MODE FULL25: --full25  (5 base × 5 emotion = 25장 → generated/full/)
// ─────────────────────────────────────────────────────────
if (FULL25_MODE) {
  if (!LOCATION) {
    console.error('Usage: node build-thumbnail.js --location <loc> --full25');
    process.exit(1);
  }
  runFull25(LOCATION).catch(err => { console.error('❌', err.message); process.exit(1); });
  return;
}

// ─────────────────────────────────────────────────────────
// MODE A-v2: --sample5v2  (recolor → generated/sample_v2/) [정식]
// ─────────────────────────────────────────────────────────
if (SAMPLE5V2_MODE) {
  if (!LOCATION) {
    console.error('Usage: node build-thumbnail.js --location <loc> --sample5v2');
    process.exit(1);
  }
  runSample5v2(LOCATION).catch(err => { console.error('❌', err.message); process.exit(1); });
  return;
}

// ─────────────────────────────────────────────────────────
// MODE A: --sample5  [deprecated — overlay 방식, 보존용]
// ─────────────────────────────────────────────────────────
if (SAMPLE5_MODE) {
  if (!LOCATION) {
    console.error('Usage: node build-thumbnail.js --location <loc> --sample5');
    process.exit(1);
  }
  runSample5(LOCATION).catch(err => { console.error('❌', err.message); process.exit(1); });
  return;
}

// ─────────────────────────────────────────────────────────
// MODE B: --test | --location  (프롬프트 .txt 생성)
// ─────────────────────────────────────────────────────────
if (!LOCATION) {
  console.error('Usage: node build-thumbnail.js --location <loc> [--emotion <emo>]');
  console.error('       node build-thumbnail.js --test');
  console.error('       node build-thumbnail.js --location <loc> --sample5v2');
  console.error('       node build-thumbnail.js --location <loc> --sample5  (deprecated)');
  process.exit(1);
}

const ssot    = require(path.join(ROOT, 'config', 'thumbnail', `${LOCATION}.json`));
const OUT_DIR = TEST_MODE
  ? path.join(ROOT, 'outputs', 'prompts', 'thumbnail', '_test')
  : path.join(ROOT, 'outputs', 'prompts', 'thumbnail', LOCATION);

fs.mkdirSync(OUT_DIR, { recursive: true });

const TEST_SAMPLES = [
  { emotion: 'pause',        lines: ['잠시 멈춰 서 있었던', '파도 앞에서'] },
  { emotion: 'calm',         lines: ['바다가 말없이 있어줬던', '밤'] },
  { emotion: 'growth',       lines: ['멀리서 천천히', '자라던 소망'] },
  { emotion: 'fragile_hope', lines: ['다시 출발할 수 있을 것 같았던', '새벽'] },
  { emotion: 'passion',      lines: ['불꽃처럼 품었던', '마음'] },
];

const copies = TEST_MODE
  ? TEST_SAMPLES
  : (() => {
      const raw = require(path.join(ROOT, 'config', 'thumbnail', `${LOCATION}-copy.json`));
      reclassifyPrompts(OUT_DIR, LOCATION, EMOTION_ORDER);
      return raw;
    })();

function characterSection(ssotChar) {
  if (!ssotChar) return '';
  if (ssotChar.description) {
    const lines = [`Character:\n${ssotChar.description}`];
    if (ssotChar.appearance) lines.push(`Appearance: ${ssotChar.appearance}`);
    if (ssotChar.pose)        lines.push(`Pose: ${ssotChar.pose}`);
    if (ssotChar.rule)        lines.push(ssotChar.rule);
    return lines.join('\n');
  }
  // 구형 호환 (position + pose)
  return `Character:\n${ssotChar.name}: ${ssotChar.position}, ${ssotChar.pose}`;
}

function buildPrompt(ssot, emotion, lines) {
  const starColor = getStarColor(emotion);
  const charBlock = characterSection(ssot.character);
  const loc       = ssot.location || LOCATION || 'unknown';

  // color / star 전체를 Object.entries로 출력 (undefined/빈값 제외)
  const colorLines = Object.entries(ssot.color || {})
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${v}`);

  const starLines = Object.entries(ssot.star || {})
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(([k, v]) => `${k}: ${v}`);

  const parts = [
    `DreamTown ${loc} thumbnail illustration.`,
    '',
    'Scene:',
    ssot.scene?.description ?? '',
    '',
    'Must include:',
    ...(ssot.scene?.must_include ?? []).map(s => `- ${s}`),
    '',
    'Style:',
    ...(ssot.style?.required ?? []).map(s => `- ${s}`),
    '',
    'Do NOT:',
    ...(ssot.style?.forbidden ?? []).map(s => `- ${s}`),
    '',
    'Color:',
    ...colorLines,
    '',
    'Star:',
    ...starLines,
    `Star color: ${starColor.label} (${starColor.hex}). ${starColor.prompt_desc}`,
    'No color mixing. No neon effects. No rainbow colors.',
    '',
  ];

  if (ssot.composition?.flow) {
    parts.push('Composition:', ssot.composition.flow, '');
  }

  if (charBlock) {
    parts.push(charBlock, '');
  }

  parts.push(
    `Emotion: ${emotion}`,
    '',
    'Copy (to be overlaid — do NOT render in image):',
    `"${lines[0]}"`,
    `"${lines[1]}"`,
    '',
    `Bottom (to be overlaid — do NOT render in image): "${ssot.text?.bottom ?? ''}"`,
  );

  return parts
    .filter(p => p !== undefined && p !== null)
    .join('\n')
    .trim();
}

let count = 0;
copies.forEach((rawCopy, i) => {
  const copy    = normalizeCopy(rawCopy, EMOTION_ORDER[i]);
  const emotion = copy.emotion || EMOTION_ORDER[i];
  if (EMO_FILTER && emotion !== EMO_FILTER) return;
  const lines    = copy.lines;
  const num      = String(i + 1).padStart(2, '0');
  const filename = promptFilename(num, emotion, LOCATION);
  const prompt   = buildPrompt(ssot, emotion, lines);
  const starInfo = getStarColor(emotion);
  fs.writeFileSync(path.join(OUT_DIR, filename), prompt, 'utf-8');
  console.log(`✅ ${filename}  →  star: ${starInfo.label} (${starInfo.hex})`);
  count++;
});

console.log(`\nDONE — ${count}개 프롬프트 → ${OUT_DIR}`);


// ─────────────────────────────────────────────────────────
// sample5 합성 함수
// ─────────────────────────────────────────────────────────
async function runSample5(location) {
  const { drawStar }                 = require('./lib/drawStar');
  const { getStarPositionByFilename } = require('./lib/starPosition');
  const sharp                        = require('sharp');

  const baseDir   = path.join(ROOT, 'public', 'images', 'thumbnails', location, 'base');
  const sampleDir = path.join(ROOT, 'public', 'images', 'thumbnails', location, 'generated', 'sample');
  const gemMap    = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'config', 'thumbnail', 'emotion-gem-map.json'), 'utf-8'
  ));
  const colorMap  = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'config', 'thumbnail', 'star-color-map.json'), 'utf-8'
  ));

  fs.mkdirSync(sampleDir, { recursive: true });

  if (!fs.existsSync(baseDir)) throw new Error(`base 폴더 없음: ${baseDir}`);

  const baseFiles = fs.readdirSync(baseDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f))
    .sort();

  if (baseFiles.length < 5) {
    throw new Error(`base 이미지 최소 5장 필요 (현재: ${baseFiles.length}장)`);
  }

  const EMOTIONS = ['confusion', 'pause', 'calm', 'curiosity', 'fragile_hope'];

  // MD5 스냅샷 (변경 없음 검증용)
  const md5snap = baseFiles.slice(0, 5).map(f => {
    const buf = fs.readFileSync(path.join(baseDir, f));
    return { file: f, md5: crypto.createHash('md5').update(buf).digest('hex') };
  });

  console.log(`\n🎨 --sample5 합성 시작: ${location}\n`);

  for (let i = 0; i < 5; i++) {
    const emotion  = EMOTIONS[i];
    const baseFile = baseFiles[i];
    const baseId   = `base${String(i + 1).padStart(2, '0')}`;
    const gemstone = (gemMap[emotion] || {}).gemstone || 'unknown';
    const hex      = (colorMap[emotion] || {}).hex     || '?';

    const imgBuf = fs.readFileSync(path.join(baseDir, baseFile));
    const meta   = await sharp(imgBuf).metadata();
    const pos    = getStarPositionByFilename(baseFile, meta.width, meta.height);
    const out    = await drawStar(imgBuf, pos.x, pos.y, emotion);

    const outName = `${location}_${emotion}_${gemstone}_${baseId}.png`;
    fs.writeFileSync(path.join(sampleDir, outName), out);
    console.log(`✅ ${outName}  [${hex}]  [pos: ${pos.type} (${pos.x},${pos.y})]`);
  }

  // MD5 검증
  console.log('\n🔒 base 무변경 검증 (MD5):');
  let allPass = true;
  for (const { file, md5: before } of md5snap) {
    const buf   = fs.readFileSync(path.join(baseDir, file));
    const after = crypto.createHash('md5').update(buf).digest('hex');
    const pass  = before === after;
    if (!pass) allPass = false;
    console.log(`  ${pass ? '✅' : '❌'} ${file}  ${before.slice(0, 8)}`);
  }

  if (!allPass) throw new Error('base MD5 불일치 — 원본이 변경되었습니다!');
  console.log(`\n✅ DONE → ${sampleDir}`);
}


// ─────────────────────────────────────────────────────────
// sample5v2 — recolor 방식 (정식)
// base의 기존 별을 gemstone glow color로 재색상
// ─────────────────────────────────────────────────────────
async function runSample5v2(location) {
  const { recolorStar } = require('./lib/recolorStar');

  const baseDir   = path.join(ROOT, 'public', 'images', 'thumbnails', location, 'base');
  const sampleDir = path.join(ROOT, 'public', 'images', 'thumbnails', location, 'generated', 'sample_v2');
  const gemMap    = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'config', 'thumbnail', 'emotion-gem-map.json'), 'utf-8'
  ));
  const colorMap  = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'config', 'thumbnail', 'star-color-map.json'), 'utf-8'
  ));

  fs.mkdirSync(sampleDir, { recursive: true });
  if (!fs.existsSync(baseDir)) throw new Error(`base 폴더 없음: ${baseDir}`);

  // _NEW 파일 제외 (별 없는 base → recolor 불가)
  const baseFiles = fs.readdirSync(baseDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('_NEW'))
    .sort();

  if (baseFiles.length < 5)
    throw new Error(`base 이미지 최소 5장 필요 (현재: ${baseFiles.length}장, _NEW 제외)`);

  const EMOTIONS = ['confusion', 'pause', 'calm', 'curiosity', 'fragile_hope'];

  // MD5 스냅샷
  const md5snap = baseFiles.slice(0, 5).map(f => {
    const buf = fs.readFileSync(path.join(baseDir, f));
    return { file: f, md5: crypto.createHash('md5').update(buf).digest('hex') };
  });

  console.log(`\n🎨 --sample5v2 (recolor) 시작: ${location}\n`);

  for (let i = 0; i < 5; i++) {
    const emotion  = EMOTIONS[i];
    const baseFile = baseFiles[i];
    const baseId   = `base${String(i + 1).padStart(2, '0')}`;
    const gemstone = (gemMap[emotion]  || {}).gemstone || 'unknown';
    const glow     = (colorMap[emotion] || {}).glow    || '?';

    const imgBuf = fs.readFileSync(path.join(baseDir, baseFile));
    const out    = await recolorStar(imgBuf, emotion);

    const outName = `${location}_${emotion}_${gemstone}_${baseId}_v2.png`;
    fs.writeFileSync(path.join(sampleDir, outName), out);
    console.log(`✅ ${outName}  glow:[${glow}]`);
  }

  // MD5 검증
  console.log('\n🔒 base 무변경 검증 (MD5):');
  let allPassV2 = true;
  for (const { file, md5: before } of md5snap) {
    const buf   = fs.readFileSync(path.join(baseDir, file));
    const after = crypto.createHash('md5').update(buf).digest('hex');
    const pass  = before === after;
    if (!pass) allPassV2 = false;
    console.log(`  ${pass ? '✅' : '❌'} ${file}  ${before.slice(0, 8)}`);
  }

  if (!allPassV2) throw new Error('base MD5 불일치 — 원본이 변경되었습니다!');
  console.log(`\n✅ DONE → ${sampleDir}`);
}


// ─────────────────────────────────────────────────────────
// full25 — 5 base × 5 emotion = 25장 (recolor, 정식)
// ─────────────────────────────────────────────────────────
async function runFull25(location) {
  const { recolorStar } = require('./lib/recolorStar');

  const baseDir  = path.join(ROOT, 'public', 'images', 'thumbnails', location, 'base');
  const fullDir  = path.join(ROOT, 'public', 'images', 'thumbnails', location, 'generated', 'full');
  const gemMap   = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'config', 'thumbnail', 'emotion-gem-map.json'), 'utf-8'
  ));
  const colorMap = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'config', 'thumbnail', 'star-color-map.json'), 'utf-8'
  ));

  fs.mkdirSync(fullDir, { recursive: true });
  if (!fs.existsSync(baseDir)) throw new Error(`base 폴더 없음: ${baseDir}`);

  const baseFiles = fs.readdirSync(baseDir)
    .filter(f => /\.(png|jpg|jpeg)$/i.test(f) && !f.includes('_NEW'))
    .sort();

  if (baseFiles.length < 5)
    throw new Error(`base 이미지 최소 5장 필요 (현재: ${baseFiles.length}장, _NEW 제외)`);

  const EMOTIONS = ['confusion', 'pause', 'calm', 'curiosity', 'fragile_hope'];

  const md5snap = baseFiles.slice(0, 5).map(f => {
    const buf = fs.readFileSync(path.join(baseDir, f));
    return { file: f, md5: crypto.createHash('md5').update(buf).digest('hex') };
  });

  console.log(`\n🎨 --full25 시작: ${location}  (5 base × 5 emotion = 25장)\n`);

  const manifestItems = [];
  let count = 0;

  for (let bi = 0; bi < 5; bi++) {
    const baseFile = baseFiles[bi];
    const baseId   = `base${String(bi + 1).padStart(2, '0')}`;
    const imgBuf   = fs.readFileSync(path.join(baseDir, baseFile));

    for (const emotion of EMOTIONS) {
      const gemstone = (gemMap[emotion]   || {}).gemstone || 'unknown';
      const glow     = (colorMap[emotion] || {}).glow    || '?';
      const outName  = `${location}_${emotion}_${gemstone}_${baseId}.png`;

      const out = await recolorStar(imgBuf, emotion);
      fs.writeFileSync(path.join(fullDir, outName), out);
      count++;

      manifestItems.push({
        emotion,
        gemstone,
        base: baseId,
        sourceFile: baseFile,
        imageUrl: `/images/thumbnails/${location}/generated/full/${outName}`,
      });

      console.log(`✅ [${String(count).padStart(2, '0')}/25] ${outName}  glow:[${glow}]`);
    }
    console.log();
  }

  // manifest.json
  const manifest = {
    location,
    generated: new Date().toISOString(),
    count: manifestItems.length,
    emotions: EMOTIONS,
    bases: baseFiles.slice(0, 5),
    items: manifestItems,
  };
  fs.writeFileSync(
    path.join(fullDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
    'utf-8'
  );

  // MD5 검증
  console.log('🔒 base 무변경 검증 (MD5):');
  let allPass = true;
  for (const { file, md5: before } of md5snap) {
    const buf   = fs.readFileSync(path.join(baseDir, file));
    const after = crypto.createHash('md5').update(buf).digest('hex');
    const pass  = before === after;
    if (!pass) allPass = false;
    console.log(`  ${pass ? '✅' : '❌'} ${file}  ${before.slice(0, 8)}`);
  }

  if (!allPass) throw new Error('base MD5 불일치!');

  const emotionCounts = {};
  for (const item of manifestItems) {
    emotionCounts[item.emotion] = (emotionCounts[item.emotion] || 0) + 1;
  }
  console.log('\n📊 emotion별 생성 수:');
  for (const [emo, cnt] of Object.entries(emotionCounts)) {
    console.log(`  ${emo}: ${cnt}장 ${cnt === 5 ? '✅' : '❌'}`);
  }
  console.log(`\n✅ DONE — ${manifestItems.length}장 → ${fullDir}`);
  console.log(`📋 manifest → ${path.join(fullDir, 'manifest.json')}`);
}
