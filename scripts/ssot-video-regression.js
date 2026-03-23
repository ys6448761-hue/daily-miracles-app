#!/usr/bin/env node
/**
 * SSOT Video Regression — 완전 독립 회귀 스크립트
 * AIL-2026-0219-VID-003
 *
 * demo-ad-creative.js 수정 없이 독립적으로 실행.
 * AdCreativeBuilder/Validator를 읽기 전용으로 사용.
 *
 * 실행: node scripts/ssot-video-regression.js
 * CI 순서: demo-ad-creative.js (1st) → ssot-video-regression.js (2nd)
 *
 * 출력: "304/304 PASS" 또는 "N/304 FAIL"
 * Exit: 0 (PASS) / 1 (FAIL)
 */

const AdCreativeBuilder = require('../services/adCreative/AdCreativeBuilder');
const AdCreativeValidator = require('../services/adCreative/AdCreativeValidator');
const CixVideoScorer = require('../services/videoJob/CixVideoScorer');

console.log('');
console.log('╔═══════════════════════════════════════════════════════╗');
console.log('║  SSOT Video Regression Test                          ║');
console.log('║  AdCreative 304 + CIx-Video 기본 검증                ║');
console.log('╚═══════════════════════════════════════════════════════╝');
console.log('');

// ═══════════════════════════════════════════════════════
// 1. AdCreative 4종 빌드 + 검증 (읽기 전용)
// ═══════════════════════════════════════════════════════

const configIds = ['healing-high', 'growth-high', 'healing-mid', 'growth-mid'];
const allResults = [];
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

for (const configId of configIds) {
  const creative = AdCreativeBuilder.build(configId);
  const validation = AdCreativeValidator.validateAll(creative);

  totalTests += validation.total;
  totalPassed += validation.passed;
  totalFailed += validation.failed;

  const status = validation.pass ? '✅' : '❌';
  console.log(`  ${status} ${configId}: ${validation.passed}/${validation.total}`);

  allResults.push({ configId, validation });
}

const adCreativeAllPass = allResults.every(r => r.validation.pass);

console.log('');
console.log(`  AdCreative: ${totalPassed}/${totalTests} (${totalFailed} FAIL)`);

// ═══════════════════════════════════════════════════════
// 2. CIx-Video 기본 검증
// ═══════════════════════════════════════════════════════

console.log('');
console.log('--- CIx-Video Scorer 기본 검증 ---');

let cixPass = true;

// 2-1. 가중치 합 1.0
const weights = CixVideoScorer.getWeights();
const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
if (Math.abs(weightSum - 1.0) > 0.001) {
  console.log(`  ❌ 가중치 합 != 1.0 (got ${weightSum})`);
  cixPass = false;
} else {
  console.log(`  ✅ 가중치 합 = ${weightSum}`);
}

// 2-2. 완벽 신호 → 100점
const perfectScore = CixVideoScorer.calculate({
  validator_result: 1.0,
  korean_integrity: 1.0,
  render_success_rate: 1.0,
  regeneration_rate: 0,
  override_usage: 0,
});
if (perfectScore !== 100) {
  console.log(`  ❌ 완벽 신호 점수 != 100 (got ${perfectScore})`);
  cixPass = false;
} else {
  console.log(`  ✅ 완벽 신호 = ${perfectScore}점`);
}

// 2-3. 최악 신호 → 0점
const worstScore = CixVideoScorer.calculate({
  validator_result: 0,
  korean_integrity: 0,
  render_success_rate: 0,
  regeneration_rate: 1.0,
  override_usage: 1.0,
});
if (worstScore !== 0) {
  console.log(`  ❌ 최악 신호 점수 != 0 (got ${worstScore})`);
  cixPass = false;
} else {
  console.log(`  ✅ 최악 신호 = ${worstScore}점`);
}

// 2-4. CIx Total 가중치 합
const totalWeights = CixVideoScorer.getTotalWeights();
const totalWeightSum = Object.values(totalWeights).reduce((a, b) => a + b, 0);
if (Math.abs(totalWeightSum - 1.0) > 0.001) {
  console.log(`  ❌ CIx Total 가중치 합 != 1.0 (got ${totalWeightSum})`);
  cixPass = false;
} else {
  console.log(`  ✅ CIx Total 가중치 합 = ${totalWeightSum}`);
}

// ═══════════════════════════════════════════════════════
// 3. Aurora Gate 회귀 (VID-003~004) — 고정 순서 편입
// ═══════════════════════════════════════════════════════

console.log('');
console.log('--- Aurora Gate 회귀 (VID-003~004) ---');

let auroraPass = true;
let auroraTests = 0;
let auroraPassCount = 0;

function auroraCheck(label, fn) {
  auroraTests++;
  try {
    const ok = fn();
    if (ok) {
      console.log(`  ✅ ${label}`);
      auroraPassCount++;
    } else {
      console.log(`  ❌ ${label}`);
      auroraPass = false;
    }
  } catch (err) {
    console.log(`  ❌ ${label}: ${err.message}`);
    auroraPass = false;
  }
}

// 3-1. videoScore 가중치 합 = 100
auroraCheck('videoScore 가중치 합 = 100', () => {
  const { WEIGHTS } = require('../services/aurora/videoScore');
  const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  return sum === 100;
});

// 3-2. videoScore threshold = 70
auroraCheck('videoScore 임계값 = 70', () => {
  const { THRESHOLD } = require('../services/aurora/videoScore');
  return THRESHOLD === 70;
});

// 3-3. CIx 전체 신호 ON → score ≥ 70
auroraCheck('Aurora CIx: 전체 ON → score ≥ 70', () => {
  const { calculate } = require('../services/aurora/videoScore');
  const r = calculate({
    gatePassed: true, subtitleIntegrity: true, fontBundleExists: true,
    artifactDurationOk: true, stateMachineComplete: true,
    currentStageDone: true, regressionPassed: true,
  });
  return r.score === 100 && r.passed;
});

// 3-4. CIx Gate 실패 → score < 70
auroraCheck('Aurora CIx: Gate 실패 → 릴리즈 불가', () => {
  const { calculate } = require('../services/aurora/videoScore');
  const r = calculate({
    gatePassed: false, subtitleIntegrity: false, fontBundleExists: false,
    artifactDurationOk: false, stateMachineComplete: false,
    currentStageDone: false, regressionPassed: false,
  });
  return r.score === 0 && !r.passed;
});

// 3-5. TEXT ZERO: unit.textOverlay → Gate hard fail
auroraCheck('TEXT ZERO: unit.textOverlay → Gate hard fail', () => {
  const { validateUnitCollision } = require('../services/aurora/collisionValidator');
  const errs = validateUnitCollision({ unitId: 'u1', anchor: 'a.png', textOverlay: 'forbidden' });
  return errs.some(e => e.includes('TEXT_EMBEDDED'));
});

// 3-6. TEXT ZERO: spec.textOverlay → Gate hard fail
auroraCheck('TEXT ZERO: spec.textOverlay → Gate hard fail', () => {
  const { validateSpec } = require('../services/aurora/collisionValidator');
  try {
    validateSpec({ textOverlay: 'bad', units: [{ unitId: 'u1', anchor: 'a.png' }] });
    return false; // throw 안 됨 → 실패
  } catch (e) {
    return e.message.includes('TEXT_EMBEDDED');
  }
});

// 3-7. KorGate: BOM 있는 텍스트 → KOR-03 FAIL
auroraCheck('KorGate KOR-03: BOM → FAIL', () => {
  const { checkNoBOM } = require('../services/aurora/KorGate');
  return !checkNoBOM('\uFEFF테스트').pass;
});

// 3-8. KorGate: BOM 없는 정상 텍스트 → KOR-03 PASS
auroraCheck('KorGate KOR-03: 정상 텍스트 → PASS', () => {
  const { checkNoBOM } = require('../services/aurora/KorGate');
  return checkNoBOM('괜찮은 척, 오늘도 했죠?').pass;
});

// 3-9. KorGate: U+FFFD 포함 → KOR-01 FAIL
auroraCheck('KorGate KOR-01: U+FFFD → FAIL', () => {
  const { checkHangulIntegrity } = require('../services/aurora/KorGate');
  return !checkHangulIntegrity('한글 \uFFFD 깨짐').pass;
});

// 3-10. KorGate: 정상 한글 → KOR-01 PASS
auroraCheck('KorGate KOR-01: 정상 한글 → PASS', () => {
  const { checkHangulIntegrity } = require('../services/aurora/KorGate');
  return checkHangulIntegrity('당신은 회복이 먼저 필요한 시기예요.').pass;
});

// 3-11. KorGate: ASS 폰트 명시 → KOR-05
auroraCheck('KorGate KOR-05: Noto Sans KR 명시 → PASS', () => {
  const { checkAssFont } = require('../services/aurora/KorGate');
  const assSnippet = '[V4+ Styles]\nStyle: Default,Noto Sans KR,48,...';
  return checkAssFont(assSnippet).pass;
});

// 3-12. subtitlePipeline: normalizeSrt BOM+CRLF 제거
auroraCheck('subtitlePipeline: normalizeSrt BOM/CRLF 제거', () => {
  const { normalizeSrt } = require('../services/aurora/subtitlePipeline');
  const raw = '\uFEFF1\r\n00:00:00,000 --> 00:00:02,000\r\n테스트\r\n';
  const normalized = normalizeSrt(raw);
  return !normalized.startsWith('\uFEFF') && !normalized.includes('\r');
});

// 3-13. subtitlePipeline: NFC 정규화
auroraCheck('subtitlePipeline: NFC 정규화', () => {
  const { normalizeSrt } = require('../services/aurora/subtitlePipeline');
  const nfd = '\u1112\u1161\u11AB'; // '한' NFD 분리형
  const normalized = normalizeSrt(nfd);
  return normalized === normalized.normalize('NFC');
});

console.log('');
console.log(`  Aurora Gate: ${auroraPassCount}/${auroraTests} PASS`);

// ═══════════════════════════════════════════════════════
// 최종 결과 (고정 순서)
// ═══════════════════════════════════════════════════════

console.log('');
console.log('═══════════════════════════════════════════════════════');
console.log(`  AdCreative: ${totalPassed}/${totalTests} PASS`);
console.log(`  CIx-Video:  ${cixPass ? 'PASS' : 'FAIL'}`);
console.log(`  Aurora Gate: ${auroraPassCount}/${auroraTests} ${auroraPass ? 'PASS' : 'FAIL'}`);
console.log('═══════════════════════════════════════════════════════');

const allPass = adCreativeAllPass && cixPass && auroraPass;
const allTotal = totalTests + 4 + auroraTests; // 304 + cix(4) + aurora
const allPassTotal = totalPassed + (cixPass ? 4 : 0) + auroraPassCount;
console.log(`\n  상태: ${allPass ? `✅ ${allPassTotal}/${allTotal} PASS` : '❌ SOME FAILED'}\n`);

process.exit(allPass ? 0 : 1);
