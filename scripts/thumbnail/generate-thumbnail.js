'use strict';

/**
 * generate-thumbnail.js — 위치 기반 통합 베이스 이미지 생성
 *
 * 사용:
 *   node scripts/thumbnail/generate-thumbnail.js --location hamel
 *   node scripts/thumbnail/generate-thumbnail.js --location cablecar [--dry-run]
 *
 * 동작:
 *   outputs/prompts/thumbnail/{location}/*.txt
 *     → gpt-image-1 API (OPENAI_API_KEY 필요)
 *     → public/images/thumbnails/{location}/base/
 *
 * 전제: build-thumbnail.js --location {location} 으로 프롬프트를 먼저 생성할 것
 */

const path = require('path');
const { runGenerate } = require('./utils');

const args     = process.argv.slice(2);
const locIdx   = args.indexOf('--location');
const LOCATION = locIdx >= 0 ? args[locIdx + 1] : null;

if (!LOCATION) {
  console.error('Usage: node scripts/thumbnail/generate-thumbnail.js --location <location> [--dry-run]');
  console.error('  location: hamel | cablecar | cafe | hotel | ...');
  process.exit(1);
}

const ROOT = path.join(__dirname, '..', '..');

runGenerate({
  promptDir:     path.join(ROOT, 'outputs', 'prompts', 'thumbnail', LOCATION),
  outputDir:     path.join(ROOT, 'public', 'images', 'thumbnails', LOCATION, 'base'),
  dryRun:        args.includes('--dry-run'),
  skipBaseCheck: true,  // base/ 에 직접 생성 — 사전 존재 확인 불필요
}).catch(err => { console.error('❌ FAILED:', err.message); process.exit(1); });
