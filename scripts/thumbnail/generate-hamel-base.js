'use strict';

/**
 * generate-hamel-base.js — Hamel GATE 6 base image generation (5장)
 *
 * 사용:
 *   node scripts/thumbnail/generate-hamel-base.js --dry-run        # 프롬프트 확인
 *   node scripts/thumbnail/generate-hamel-base.js --limit=1        # 1장만 (CEO 승인 확인용)
 *   node scripts/thumbnail/generate-hamel-base.js                  # 전체 5장 생성
 *   node scripts/thumbnail/generate-hamel-base.js --emotion=calm   # 특정 감정만
 *
 * 출력: public/images/thumbnails/hamel/base/
 * 검수 후: node scripts/thumbnail/build-thumbnail.js --location hamel --full25
 *
 * GATE 6 SSOT: config/thumbnail/hamel.json
 * DoD: base 5장 CEO 시각 검수 통과 전 full25 실행 금지
 */

require('dotenv').config();
const fs   = require('fs');
const path = require('path');

const ROOT       = path.join(__dirname, '..', '..');
const PROMPT_DIR = path.join(ROOT, 'outputs', 'prompts', 'thumbnail', 'hamel');
const BASE_DIR   = path.join(ROOT, 'public', 'images', 'thumbnails', 'hamel', 'base');

const MODEL   = process.env.DREAMTOWN_IMAGE_MODEL || 'gpt-image-1';
const SIZE    = process.env.DREAMTOWN_IMAGE_SIZE  || '1024x1536';
const COST_PER = 0.04;

const args        = process.argv.slice(2);
const DRY_RUN     = args.includes('--dry-run');
const limitArg    = args.find(a => a.startsWith('--limit='));
const LIMIT       = limitArg ? parseInt(limitArg.split('=')[1], 10) : Infinity;
const emoArg      = args.find(a => a.startsWith('--emotion='));
const EMO_FILTER  = emoArg ? emoArg.split('=')[1] : null;
const FORCE       = args.includes('--force');

// emotion → output filename mapping
const EMOTION_FILE_MAP = {
  confusion:    '01_confusion_hamel_base.png',
  pause:        '02_pause_hamel_base.png',
  calm:         '03_calm_hamel_base.png',
  curiosity:    '04_curiosity_hamel_base.png',
  fragile_hope: '05_fragile_hope_hamel_base.png',
};

function promptFileToEmotion(filename) {
  const m = filename.match(/^\d+_([^_]+(?:_[^_]+)?)_hamel_prompt\.txt$/);
  return m ? m[1] : null;
}

async function main() {
  if (!fs.existsSync(PROMPT_DIR)) {
    console.error('❌ 프롬프트 없음:', PROMPT_DIR);
    console.error('   먼저: node scripts/thumbnail/build-thumbnail.js --location hamel');
    process.exit(1);
  }

  const files = fs.readdirSync(PROMPT_DIR).filter(f => f.endsWith('_hamel_prompt.txt')).sort();
  if (files.length === 0) {
    console.error('❌ hamel prompt .txt 없음. build 먼저 실행하세요.');
    process.exit(1);
  }

  console.log(`\n=== Hamel GATE 6 Base Generation ===`);
  console.log(`model: ${MODEL} / size: ${SIZE}`);
  console.log(`prompts: ${files.length}개 / limit: ${LIMIT < Infinity ? LIMIT : '전체'}`);
  console.log(`estimated cost: ~$${(Math.min(files.length, LIMIT) * COST_PER).toFixed(2)} USD\n`);

  if (DRY_RUN) {
    console.log('--dry-run: 생성 없이 매핑 출력\n');
    files.forEach(f => {
      const emo = promptFileToEmotion(f);
      const out = emo ? EMOTION_FILE_MAP[emo] : '(매칭 실패)';
      const exists = out && fs.existsSync(path.join(BASE_DIR, out));
      console.log(`  ${f}  →  ${out}  ${exists ? '[exists]' : '[new]'}`);
    });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 미설정. .env 또는 환경변수로 주입 필요.');
    process.exit(1);
  }

  fs.mkdirSync(BASE_DIR, { recursive: true });

  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let created = 0, skipped = 0;

  for (const file of files) {
    if (created + skipped >= LIMIT) break;
    const emo = promptFileToEmotion(file);
    if (!emo) { console.warn('⚠️  감정 파싱 실패:', file); continue; }
    if (EMO_FILTER && emo !== EMO_FILTER) continue;

    const outFile = EMOTION_FILE_MAP[emo];
    if (!outFile) { console.warn('⚠️  매핑 없음:', emo); continue; }
    const outPath = path.join(BASE_DIR, outFile);

    if (fs.existsSync(outPath) && !FORCE) {
      console.log(`⏭  skip (exists): ${outFile}`);
      skipped++;
      continue;
    }

    const prompt = fs.readFileSync(path.join(PROMPT_DIR, file), 'utf-8').trim();
    console.log(`🎨 generating: ${emo} → ${outFile}`);

    const params = { model: MODEL, prompt, size: SIZE };
    if (MODEL.startsWith('dall-e-')) {
      params.response_format = 'b64_json';
      params.quality = 'standard';
      params.style = 'natural';
    }

    try {
      const result = await openai.images.generate(params);
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error('b64_json 없음');
      fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
      console.log(`✅ saved: ${outFile}`);
      created++;
    } catch (err) {
      console.error(`❌ 생성 실패 (${emo}):`, err.message);
    }
  }

  console.log(`\n완료 — 생성: ${created}장 / 스킵: ${skipped}장`);
  console.log(`출력: ${BASE_DIR}`);
  if (created > 0) {
    console.log('\n다음 단계:');
    console.log('  1. CEO 시각 검수 (base 5장 확인)');
    console.log('  2. 승인 후: node scripts/thumbnail/build-thumbnail.js --location hamel --full25');
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
