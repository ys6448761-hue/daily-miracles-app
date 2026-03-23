#!/usr/bin/env node
/**
 * Staging VideoJob 검증 스크립트
 * AIL-2026-0219-VID-004
 *
 * 실행: node scripts/ops/staging-videojob-check.js
 *
 * 검증 항목:
 *   1. 폰트 번들 존재 확인
 *   2. FontManager.resolve() 성공 확인
 *   3. DB 모드 확인 (production 시 필수)
 *   4. Feature Flags 상태 출력
 *   5. SRT → ASS 변환 + KOR-04 무결성 확인
 *   6. Migration 021 DDL 존재 확인
 */

const fs = require('fs');
const path = require('path');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  Staging VideoJob Check — AIL-VID-004                ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

let allPass = true;

function check(pass, label, detail) {
  const icon = pass ? '✅' : '❌';
  console.log(`  ${icon} ${label}: ${detail}`);
  if (!pass) allPass = false;
}

// ─── 1. 폰트 번들 존재 ──────────────────────────────────────
const fontPath = path.join(__dirname, '..', '..', 'assets', 'fonts', 'NotoSansKR-Regular.ttf');
const fontExists = fs.existsSync(fontPath);
check(fontExists, '폰트 번들', fontExists ? `${(fs.statSync(fontPath).size / 1024 / 1024).toFixed(1)} MB` : 'NOT FOUND');

// ─── 2. FontManager.resolve() ────────────────────────────────
const FontManager = require('../../services/videoJob/FontManager');
let resolvedPath = null;
try {
  resolvedPath = FontManager.resolve();
  check(true, 'FontManager', resolvedPath);
} catch (e) {
  check(false, 'FontManager', e.message.split('\n')[0]);
}

// ─── 3. DB 모드 ─────────────────────────────────────────────
const VideoJobStore = require('../../services/videoJob/VideoJobStore');
let storeMode = null;
try {
  const store = new VideoJobStore();
  storeMode = store.getMode();
  check(true, 'VideoJobStore 모드', `${storeMode.mode} (requireDb=${storeMode.requireDb})`);
} catch (e) {
  check(false, 'VideoJobStore', e.message);
}

// ─── 4. Feature Flags ───────────────────────────────────────
const ff = require('../../config/featureFlags');
const videoFlags = ff.video || {};
console.log('');
console.log('  --- Feature Flags (video) ---');
for (const [key, value] of Object.entries(videoFlags)) {
  const icon = value ? '🟢' : '🔴';
  console.log(`  ${icon} ${key}: ${value}`);
}

// ─── 5. SRT → ASS + KOR-04 ─────────────────────────────────
console.log('');
const SubtitleConverter = require('../../services/videoJob/SubtitleConverter');
const KoreanIntegrityGate = require('../../services/videoJob/KoreanIntegrityGate');

const testSrt = `1
00:00:00,000 --> 00:00:02,670
한글 테스트: 가나다라마바사

2
00:00:02,670 --> 00:00:05,340
조합형: 괜찮은 척 했죠? "따옴표" — 대시

3
00:00:05,340 --> 00:00:08,000
특수: 🙂 · ♪ 이모지 + 기호
`;

const ass = SubtitleConverter.srtToAss(testSrt);
const validation = SubtitleConverter.validateAss(ass);
check(validation.valid, 'SRT → ASS 변환', validation.valid ? 'valid' : validation.errors.join(', '));

const kor04 = KoreanIntegrityGate.verifyAssParse(ass);
check(kor04.pass, 'KOR-04 무결성', kor04.detail);

// ─── 6. Migration DDL ───────────────────────────────────────
const migrationPath = path.join(__dirname, '..', '..', 'database', 'migrations', '021_video_jobs.sql');
const migExists = fs.existsSync(migrationPath);
check(migExists, 'Migration 021', migExists ? '파일 존재' : 'NOT FOUND');

// ─── 7. ERROR_CODES 완전성 ──────────────────────────────────
const { ERROR_CODES } = require('../../services/videoJob/constants');
const requiredCodes = ['BUILD_FAILED', 'RENDER_FAILED', 'SUBTITLE_FAILED', 'PACKAGE_FAILED',
  'KOR_INTEGRITY_FAIL', 'FONT_NOT_FOUND', 'ZIP_UTF8_CORRUPTION'];
const missingCodes = requiredCodes.filter(c => !ERROR_CODES[c]);
check(missingCodes.length === 0, 'ERROR_CODES 완전성', missingCodes.length === 0 ? `${requiredCodes.length}개 OK` : `누락: ${missingCodes.join(', ')}`);

// ─── 최종 결과 ───────────────────────────────────────────────
console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log(`  결과: ${allPass ? '✅ ALL PASS — 배포 가능' : '❌ FAIL — 배포 차단'}`);
console.log('═══════════════════════════════════════════════════════');
console.log('');

process.exit(allPass ? 0 : 1);
