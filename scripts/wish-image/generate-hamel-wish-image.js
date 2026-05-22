'use strict';

/**
 * generate-hamel-wish-image.js — 하멜 "소원그림" 이미지 생성 (thumbnail 시스템 분리)
 *
 *   - thumbnail utils의 runGenerate(...)는 사용하지 않음 (filename 규칙·base 검사 분리 위해)
 *   - 본 스크립트는 wish-image 전용 entry point — ChatGPT image generation workflow compatible
 *   - 출력: outputs/wish-image/hamel/wish_hamel_{emotion}_{NN}.png
 *           (production asset 경로에 직접 쓰지 않음 — 검수 후 사용자 결정으로 이동)
 *
 * Vendor 중립 — OpenAI Images API 호환 (gpt-image-1 / dall-e-3 등 swap-able):
 *   IMAGE_MODEL ENV    — default 'gpt-image-1', 'dall-e-3' 등 가능
 *   IMAGE_SIZE  ENV    — 미지정 시 모델별 portrait default
 *                        (gpt-image-1 → 1024x1536, dall-e-3 → 1024x1792)
 *   SSOT §8-1: 9:16 vertical portrait orientation 강제
 *
 * 사용:
 *   node scripts/wish-image/generate-hamel-wish-image.js --dry-run                # 매핑만 출력
 *   node scripts/wish-image/generate-hamel-wish-image.js                          # 실제 생성 5장 (OPENAI_API_KEY 필요)
 *   node scripts/wish-image/generate-hamel-wish-image.js --emotion=confusion      # 특정 emotion 1장만
 *   node scripts/wish-image/generate-hamel-wish-image.js --limit=1                # 첫 N장만 (시범 검수용)
 *   IMAGE_MODEL=dall-e-3 node scripts/wish-image/generate-hamel-wish-image.js     # 모델 swap
 *
 * DoD:
 *   - 5장 검수 통과 전 LIMIT 확장 금지
 *   - production overwrite 금지
 */

const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..', '..');
const LOCATION   = 'hamel';
const PROMPT_DIR = path.join(ROOT, 'outputs', 'prompts', 'wish-image', LOCATION);

// asset_routing SSOT (config/wish-image/hamel.json)
const SSOT       = require(path.join(ROOT, 'config', 'wish-image', `${LOCATION}.json`));
const ROUTING    = SSOT.asset_routing || {};
const QA_DIR     = path.join(ROOT, ROUTING.qa_dir    || `outputs/wish-image/${LOCATION}`);
const FINAL_DIR  = path.join(ROOT, ROUTING.final_dir || `public/images/star-cache/yeosu_${LOCATION}`);

// --final flag: confirmed asset → star-cache; default: outputs/wish-image (QA)
const isFinal    = process.argv.includes('--final');
const OUT_DIR    = isFinal ? FINAL_DIR : QA_DIR;
// Vendor-neutral runtime config — SSOT §8-1 텍스트는 모델 무관, 실제 호출만 ENV로 선택
const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const SIZE  = process.env.IMAGE_SIZE  || (MODEL === 'dall-e-3' ? '1024x1792' : '1024x1536');

// {NN}_{emotion}_{location}_prompt.txt → {NN}_{emotion}_{gem}_{origin}_{location_short}.png
//   ex: 01_confusion_hamel_prompt.txt → 01_confusion_sapphire_yeosu_hamel.png
function promptToWishImageFilename(file) {
  const m = file.match(new RegExp(`^(\\d+)_(.+)_${LOCATION}_prompt\\.txt$`));
  if (!m) return null;
  const [, num, emotion] = m;
  const override = (SSOT.emotion_overrides || {})[emotion] || {};
  const gem      = override.gem || 'unknown';
  const origin   = ROUTING.origin || 'yeosu';
  const locShort = ROUTING.location_short || LOCATION;
  return `${num}_${emotion}_${gem}_${origin}_${locShort}.png`;
}

async function main() {
  require('dotenv').config();
  const dryRun = process.argv.includes('--dry-run');
  const emotionArg = process.argv.find(a => a.startsWith('--emotion='));
  const targetEmotion = emotionArg ? emotionArg.split('=')[1] : null;
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;

  fs.mkdirSync(OUT_DIR, { recursive: true });

  if (!fs.existsSync(PROMPT_DIR)) {
    console.error('❌ prompt 폴더 없음:', PROMPT_DIR);
    console.error('   먼저 빌드: node scripts/wish-image/build-hamel-wish-image.js');
    process.exit(1);
  }

  const files = fs.readdirSync(PROMPT_DIR).filter(f => f.endsWith('.txt')).sort();
  if (files.length === 0) {
    console.error('❌ .txt 없음 — build 먼저 실행하세요.');
    process.exit(1);
  }

  console.log(`📋 prompt: ${files.length}개`);
  console.log(`📁 출력:   ${OUT_DIR}`);
  console.log(`🧠 model:  ${MODEL} / size: ${SIZE}`);

  if (dryRun) {
    console.log('\n--dry-run: 이미지 생성 없이 매핑만 출력');
    files.forEach(f => {
      const out = promptToWishImageFilename(f);
      console.log(`  ${f}  →  ${out || '(매칭 실패)'}`);
    });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 미설정. .env 또는 ENV로 주입 필요.');
    process.exit(1);
  }

  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let created = 0, skipped = 0, processed = 0;
  for (const file of files) {
    if (processed >= limit) break;
    if (targetEmotion && !file.includes(`_${targetEmotion}_`)) continue;

    const outFile = promptToWishImageFilename(file);
    if (!outFile) {
      console.warn('⚠️  filename 매칭 실패, skip:', file);
      continue;
    }
    const outPath = path.join(OUT_DIR, outFile);
    if (fs.existsSync(outPath)) {
      console.log('⏭  already exists, skip:', outFile);
      skipped++;
      processed++;
      continue;
    }

    const prompt = fs.readFileSync(path.join(PROMPT_DIR, file), 'utf-8').trim();
    console.log('🎨 generating:', file, '→', outFile);

    // Vendor adapter — OpenAI Images API 호환 (모델별 옵션 분기)
    const params = { model: MODEL, prompt, size: SIZE };
    if (MODEL.startsWith('dall-e-')) {
      // dall-e-3는 default response_format='url'이라 b64_json 명시 필요
      params.response_format = 'b64_json';
      params.quality         = process.env.IMAGE_QUALITY || 'standard';
      params.style           = process.env.IMAGE_STYLE   || 'natural';
    }
    // gpt-image-1: default response가 b64_json — 추가 옵션 불필요

    const result = await openai.images.generate(params);

    const b64 = result.data[0].b64_json;
    if (!b64) {
      console.error('❌ b64_json 없음 — 응답:', JSON.stringify(result.data[0]));
      process.exit(1);
    }

    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    console.log('✅ saved:', outFile);
    created++;
    processed++;
  }

  console.log(`\n✅ DONE — created:${created} / skipped:${skipped} / total:${files.length}`);
  console.log(`📁 ${OUT_DIR}`);
  console.log('※ DoD 검수 통과 전 production asset 경로로 이동 금지.');
}

main().catch(err => {
  console.error('❌ FAILED:', err.message);
  process.exit(1);
});
