'use strict';

/**
 * generate-page05.js — Storybook Page05 원본소스 이미지 생성
 *
 * SSOT: config/storybook/page05.json
 * Prompts: outputs/prompts/storybook/page05/{location}/
 * Output:  public/images/storybook/sources/page05/{location}/
 * Naming:  {location}_page05_{type}_base.png
 *
 * 사용:
 *   node scripts/storybook/generate-page05.js --dry-run              # 16개 목록 확인
 *   node scripts/storybook/generate-page05.js --sample               # 4장 샘플 (CEO 검수용)
 *   node scripts/storybook/generate-page05.js --all                  # 전체 16장
 *   node scripts/storybook/generate-page05.js --location cafe        # 특정 장소 4장
 *   node scripts/storybook/generate-page05.js --type widened_continuation  # 특정 타입 4장
 *   node scripts/storybook/generate-page05.js --location hamel --type wish_signal_continuation  # 1장
 *
 * DoD:
 *   --sample 4장 CEO 시각 검수 통과 전 --all 실행 금지
 */

const fs   = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const ROOT       = path.join(__dirname, '..', '..');
const CONFIG     = require(path.join(ROOT, 'config', 'storybook', 'page05.json'));
const PROMPT_DIR = path.join(ROOT, 'outputs', 'prompts', 'storybook', 'page05');
const OUT_BASE   = path.join(ROOT, 'public', 'images', 'storybook', 'sources', 'page05');

const MODEL = process.env.IMAGE_MODEL || 'gpt-image-1';
const SIZE  = process.env.IMAGE_SIZE  || (MODEL.startsWith('dall-e-') ? '1024x1792' : '1024x1536');  // gpt-image-1: 1024x1536 portrait

// Sample set: 1 per location (per phase1_samples in SSOT)
// cafe_01 = emotional_afterflow, cablecar_04 = widened_continuation
// hamel_03 = wish_signal_continuation, hotel_01 = emotional_afterflow
const SAMPLE_IDS = [1, 8, 11, 13];  // config source_manifest ids

const args = process.argv.slice(2);
const DRY_RUN  = args.includes('--dry-run');
const SAMPLE   = args.includes('--sample');
const ALL      = args.includes('--all');
const locIdx   = args.indexOf('--location');
const typeIdx  = args.indexOf('--type');
const LOC_FILTER  = locIdx  >= 0 ? args[locIdx  + 1] : null;
const TYPE_FILTER = typeIdx >= 0 ? args[typeIdx + 1] : null;

function promptPath(loc, type) {
  const files = fs.readdirSync(path.join(PROMPT_DIR, loc)).filter(f => f.endsWith('.txt'));
  const match = files.find(f => f.includes(`_${type}_`));
  if (!match) throw new Error(`prompt file not found for ${loc}/${type}`);
  return path.join(PROMPT_DIR, loc, match);
}

function outputPath(loc, type) {
  return path.join(OUT_BASE, loc, `${loc}_page05_${type}_base.png`);
}

function selectSources() {
  const all = CONFIG.source_manifest;
  if (DRY_RUN || ALL) return all;
  if (SAMPLE)         return all.filter(s => SAMPLE_IDS.includes(s.id));
  if (LOC_FILTER && TYPE_FILTER) return all.filter(s => s.location === LOC_FILTER && s.type === TYPE_FILTER);
  if (LOC_FILTER)     return all.filter(s => s.location === LOC_FILTER);
  if (TYPE_FILTER)    return all.filter(s => s.type === TYPE_FILTER);
  // no flags — default to dry-run
  console.log('※ 플래그 없음 — --dry-run으로 실행합니다.');
  return all;
}

async function main() {
  const sources = selectSources();

  console.log('═══════════════════════════════════════════════════');
  console.log('  Storybook Page05 Generator — DreamTown');
  console.log('═══════════════════════════════════════════════════');
  console.log(`📋 대상: ${sources.length}개`);
  console.log(`🧠 model: ${MODEL}  size: ${SIZE}`);
  if (DRY_RUN || (!SAMPLE && !ALL && !LOC_FILTER && !TYPE_FILTER)) {
    console.log(`\n--dry-run: 이미지 생성 없이 매핑만 출력\n`);
    sources.forEach((s, i) => {
      const pPath = (() => {
        try { return promptPath(s.location, s.type); } catch { return '⚠️ prompt 없음'; }
      })();
      const oPath = outputPath(s.location, s.type);
      const sampleMark = SAMPLE_IDS.includes(s.id) ? ' ★ sample' : '';
      console.log(`  [${String(s.id).padStart(2, '0')}] ${s.filename}${sampleMark}`);
      console.log(`        prompt: ${path.relative(ROOT, pPath)}`);
      console.log(`        output: ${path.relative(ROOT, oPath)}`);
    });
    console.log('\n※ 생성 실행 시 --sample (4장) 또는 --all (16장)');
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY 미설정. .env 필요.');
    process.exit(1);
  }

  if (SAMPLE) {
    console.log('\n📸 SAMPLE 모드: 4장 생성 (CEO 시각 검수용)');
    console.log('   cafe/01_emotional_afterflow, cablecar/04_widened_continuation,');
    console.log('   hamel/03_wish_signal_continuation, hotel/01_emotional_afterflow\n');
  }
  if (ALL) {
    console.log('\n🚀 ALL 모드: 전체 16장 생성\n');
  }

  const { OpenAI } = require('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  let created = 0, skipped = 0, failed = 0;
  for (const s of sources) {
    const pFile = (() => {
      try { return promptPath(s.location, s.type); } catch (e) {
        console.error(`❌ prompt 없음: ${s.location}/${s.type} — ${e.message}`);
        failed++;
        return null;
      }
    })();
    if (!pFile) continue;

    const oPath = outputPath(s.location, s.type);
    if (fs.existsSync(oPath)) {
      console.log(`⏭  skip (exists): ${s.filename}`);
      skipped++;
      continue;
    }

    fs.mkdirSync(path.dirname(oPath), { recursive: true });
    const prompt = fs.readFileSync(pFile, 'utf-8').trim();
    console.log(`🎨 generating [${s.id}/16]: ${s.filename}`);

    const params = { model: MODEL, prompt, size: SIZE };
    if (MODEL.startsWith('dall-e-')) {
      params.response_format = 'b64_json';
      params.quality         = process.env.IMAGE_QUALITY || 'standard';
      params.style           = process.env.IMAGE_STYLE   || 'natural';
    }

    const result = await openai.images.generate(params);
    const b64 = result.data[0].b64_json;
    if (!b64) {
      console.error(`❌ b64_json 없음 — response: ${JSON.stringify(result.data[0])}`);
      failed++;
      continue;
    }

    fs.writeFileSync(oPath, Buffer.from(b64, 'base64'));
    console.log(`✅ saved: ${path.relative(ROOT, oPath)}`);
    created++;
  }

  console.log('\n═══════════════════════════════════════════════════');
  console.log(`  DONE — created:${created} / skipped:${skipped} / failed:${failed} / total:${sources.length}`);
  console.log('═══════════════════════════════════════════════════');
  if (SAMPLE && created > 0) {
    console.log('\n📋 다음 단계: CEO 시각 검수');
    console.log('   검수 위치: public/images/storybook/sources/page05/');
    console.log('   검수 통과 후: node scripts/storybook/generate-page05.js --all');
  }
}

main().catch(err => {
  console.error('❌ FAILED:', err.message);
  process.exit(1);
});
