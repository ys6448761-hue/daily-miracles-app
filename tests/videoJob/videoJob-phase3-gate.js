#!/usr/bin/env node
/**
 * VideoJob Phase 3 Gate Test — CIx-Video 점수 + SSOT 회귀
 *
 * 실행: npm run test:videoJob:p3
 * Gate: G14-G18 (24 TC)
 */

const CixVideoScorer = require('../../services/videoJob/CixVideoScorer');
const AdCreativeBuilder = require('../../services/adCreative/AdCreativeBuilder');
const AdCreativeValidator = require('../../services/adCreative/AdCreativeValidator');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, testId, detail) {
  if (condition) {
    passed++;
  } else {
    failed++;
    const msg = `${testId}: ${detail}`;
    failures.push(msg);
    console.log(`  ❌ ${msg}`);
  }
}

console.log('═══════════════════════════════════════════════════════');
console.log('  VideoJob Phase 3 Gate Test (G14-G18)');
console.log('═══════════════════════════════════════════════════════\n');

// ─── G14: CIx-Video 가중치 (4 TC) ──────────────────────────
console.log('--- G14: CIx-Video Weights ---\n');

const weights = CixVideoScorer.getWeights();

// G14-01: 가중치 합 = 1.0
const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
assert(Math.abs(weightSum - 1.0) < 0.001, 'G14-01', `가중치 합 = ${weightSum} (expected 1.0)`);

// G14-02: 5개 factor 전부 존재
const expectedFactors = ['validator_result', 'korean_integrity', 'render_success_rate', 'regeneration_rate', 'override_usage'];
const allPresent = expectedFactors.every(f => weights[f] !== undefined);
assert(allPresent, 'G14-02', '5 factor 전부 존재');

// G14-03: CIx Total 가중치 합 = 1.0
const totalWeights = CixVideoScorer.getTotalWeights();
const totalSum = Object.values(totalWeights).reduce((a, b) => a + b, 0);
assert(Math.abs(totalSum - 1.0) < 0.001, 'G14-03', `CIx Total 가중치 합 = ${totalSum}`);

// G14-04: Total 3 components
assert(
  totalWeights.code !== undefined && totalWeights.ops !== undefined && totalWeights.video !== undefined,
  'G14-04', 'CIx Total: code, ops, video 존재'
);

console.log('');

// ─── G15: CIx-Video 점수 계산 (8 TC) ───────────────────────
console.log('--- G15: CIx-Video Scoring ---\n');

// G15-01: 완벽 신호 = 100
const perfect = CixVideoScorer.calculate({
  validator_result: 1.0,
  korean_integrity: 1.0,
  render_success_rate: 1.0,
  regeneration_rate: 0,
  override_usage: 0,
});
assert(perfect === 100, 'G15-01', `완벽 = ${perfect} (expected 100)`);

// G15-02: 최악 신호 = 0
const worst = CixVideoScorer.calculate({
  validator_result: 0,
  korean_integrity: 0,
  render_success_rate: 0,
  regeneration_rate: 1.0,
  override_usage: 1.0,
});
assert(worst === 0, 'G15-02', `최악 = ${worst} (expected 0)`);

// G15-03: 절반 신호
const half = CixVideoScorer.calculate({
  validator_result: 0.5,
  korean_integrity: 0.5,
  render_success_rate: 0.5,
  regeneration_rate: 0.5,
  override_usage: 0.5,
});
assert(half === 50, 'G15-03', `절반 = ${half} (expected 50)`);

// G15-04: validator만 완벽, 나머지 0
const validatorOnly = CixVideoScorer.calculate({
  validator_result: 1.0,
  korean_integrity: 0,
  render_success_rate: 0,
  regeneration_rate: 1.0,
  override_usage: 1.0,
});
assert(validatorOnly === 25, 'G15-04', `validator만 완벽 = ${validatorOnly} (expected 25)`);

// G15-05: 빈 신호 = 30 (역지표 기본값 0 → 1-0=1 → 0.15+0.15=0.30 × 100)
const empty = CixVideoScorer.calculate({});
assert(empty === 30, 'G15-05', `빈 신호 = ${empty} (expected 30)`);

// G15-06: 클램핑 — 초과값 100 제한
const over = CixVideoScorer.calculate({
  validator_result: 2.0,
  korean_integrity: 2.0,
  render_success_rate: 2.0,
  regeneration_rate: -1.0,
  override_usage: -1.0,
});
assert(over === 100, 'G15-06', `초과값 클램핑 = ${over} (expected 100)`);

// G15-07: 현실적 시나리오 (304/304 pass, KOR 4/5, render 95%, regen 10%, override 5%)
const realistic = CixVideoScorer.calculate({
  validator_result: 1.0,
  korean_integrity: 0.8,
  render_success_rate: 0.95,
  regeneration_rate: 0.1,
  override_usage: 0.05,
});
assert(realistic >= 80 && realistic <= 95, 'G15-07', `현실적 시나리오 = ${realistic} (expected 80-95)`);

// G15-08: calculateTotal
const total = CixVideoScorer.calculateTotal(90, 85, 80);
const expected = Math.round(90 * 0.4 + 85 * 0.3 + 80 * 0.3);
assert(total === expected, 'G15-08', `calculateTotal(90,85,80) = ${total} (expected ${expected})`);

console.log('');

// ─── G16: 상태 임계치 (4 TC) ────────────────────────────────
console.log('--- G16: Status Thresholds ---\n');

assert(CixVideoScorer.getStatus(95) === 'excellent', 'G16-01', `95 → excellent`);
assert(CixVideoScorer.getStatus(85) === 'good', 'G16-02', `85 → good`);
assert(CixVideoScorer.getStatus(75) === 'acceptable', 'G16-03', `75 → acceptable`);
assert(CixVideoScorer.getStatus(60) === 'critical', 'G16-04', `60 → critical`);

console.log('');

// ─── G17: SSOT 회귀 (4 TC — 4 configIds × 304) ────────────
console.log('--- G17: SSOT Regression ---\n');

const configIds = ['healing-high', 'growth-high', 'healing-mid', 'growth-mid'];

configIds.forEach(configId => {
  const creative = AdCreativeBuilder.build(configId);
  const validation = AdCreativeValidator.validateAll(creative);
  assert(
    validation.pass,
    `G17-${configId}`,
    `${configId}: ${validation.passed}/${validation.total} ${validation.pass ? 'PASS' : 'FAIL'}`
  );
});

console.log('');

// ─── G18: CIx Total 통합 (4 TC) ────────────────────────────
console.log('--- G18: CIx Total Integration ---\n');

// G18-01: 모두 100
assert(CixVideoScorer.calculateTotal(100, 100, 100) === 100, 'G18-01', 'all 100 → 100');

// G18-02: 모두 0
assert(CixVideoScorer.calculateTotal(0, 0, 0) === 0, 'G18-02', 'all 0 → 0');

// G18-03: video만 100
const videoOnly = CixVideoScorer.calculateTotal(0, 0, 100);
assert(videoOnly === 30, 'G18-03', `video만 100 → ${videoOnly} (expected 30)`);

// G18-04: 경계값 — code 100, ops 0, video 70
const boundary = CixVideoScorer.calculateTotal(100, 0, 70);
const boundaryExpected = Math.round(100 * 0.4 + 0 * 0.3 + 70 * 0.3);
assert(boundary === boundaryExpected, 'G18-04', `경계값 = ${boundary} (expected ${boundaryExpected})`);

console.log('');

// ─── 최종 결과 ───────────────────────────────────────────────
console.log('═══════════════════════════════════════════════════════');
console.log(`  Phase 3 결과: ${passed} PASS / ${failed} FAIL (총 ${passed + failed})`);
console.log('═══════════════════════════════════════════════════════');

if (failures.length > 0) {
  console.log('\n  실패 항목:');
  failures.forEach(f => console.log(`    - ${f}`));
}

console.log(`\n  상태: ${failed === 0 ? '✅ ALL PASS' : '❌ SOME FAILED'}\n`);
process.exit(failed === 0 ? 0 : 1);
