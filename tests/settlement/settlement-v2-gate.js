#!/usr/bin/env node
/**
 * Settlement v2 Gate Test Runner
 *
 * 픽스처 기반 exact value 검증 (20TC)
 * PG_FEE_RATE = 0.035, Anchor = Gross - PG_Fee
 *
 * 실행: npm run test:settlement
 * Gate: 20/20 PASS + 합계불변성 + idempotency + 역분개
 */

const path = require('path');
const fs = require('fs');

// 픽스처 로드
const FIXTURE_PATH = path.join(__dirname, '..', 'fixtures', 'settlement_v2', 'cases.json');
const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf-8'));

// calculationService 로드 (DB 불필요 — calculate()는 순수함수)
const calcService = require('../../services/settlement/calculationService');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, tcId, field, expected, actual) {
  if (condition) {
    passed++;
  } else {
    failed++;
    const msg = `${tcId} [${field}]: expected ${expected}, got ${actual}`;
    failures.push(msg);
  }
}

console.log('=== Settlement v2 Gate Test ===');
console.log(`Fixture: ${fixture.version}, PG_FEE_RATE=${fixture.pg_fee_rate}`);
console.log(`Anchor formula: ${fixture.anchor_formula}`);
console.log(`Tolerance: ${fixture.tolerance}\n`);

// ─── Gate 1: 픽스처 20케이스 exact match ─────────────────────
console.log('--- Gate 1: Fixture 20 Cases ---\n');

fixture.cases.forEach(tc => {
  const result = calcService.calculate(tc.event);
  const exp = tc.expected;
  const id = tc.id;

  // 기본 금액
  assert(result.paid_amount === exp.paid, id, 'paid', exp.paid, result.paid_amount);
  assert(result.pg_fee === exp.pg_fee, id, 'pg_fee', exp.pg_fee, result.pg_fee);
  assert(result.net_cash === exp.net_cash, id, 'net_cash', exp.net_cash, result.net_cash);
  assert(result.anchor_amount === exp.anchor, id, 'anchor', exp.anchor, result.anchor_amount);

  // 풀 배분
  assert(result.pools.platform === exp.pools.platform, id, 'pool.platform', exp.pools.platform, result.pools.platform);
  assert(result.pools.creator === exp.pools.creator, id, 'pool.creator', exp.pools.creator, result.pools.creator);
  assert(result.pools.growth === exp.pools.growth, id, 'pool.growth', exp.pools.growth, result.pools.growth);
  assert(result.pools.risk === exp.pools.risk, id, 'pool.risk', exp.pools.risk, result.pools.risk);
  assert(result.pools.platform_actual === exp.pools.platform_actual, id, 'pool.platform_actual', exp.pools.platform_actual, result.pools.platform_actual);

  // 크리에이터 상세
  assert(result.creator_breakdown.original === exp.creator_breakdown.original, id, 'creator.original', exp.creator_breakdown.original, result.creator_breakdown.original);
  assert(result.creator_breakdown.remix_total === exp.creator_breakdown.remix_total, id, 'creator.remix_total', exp.creator_breakdown.remix_total, result.creator_breakdown.remix_total);
  assert(result.creator_breakdown.curation === exp.creator_breakdown.curation, id, 'creator.curation', exp.creator_breakdown.curation, result.creator_breakdown.curation);

  // 성장 상세
  assert(result.growth_breakdown.referrer === exp.growth_breakdown.referrer, id, 'growth.referrer', exp.growth_breakdown.referrer, result.growth_breakdown.referrer);
  assert(result.growth_breakdown.campaign === exp.growth_breakdown.campaign, id, 'growth.campaign', exp.growth_breakdown.campaign, result.growth_breakdown.campaign);
  assert(result.growth_breakdown.reserve === exp.growth_breakdown.reserve, id, 'growth.reserve', exp.growth_breakdown.reserve, result.growth_breakdown.reserve);

  // 합계 불변성 (Gate 2)
  const total = result.pools.platform_actual + result.pools.creator + result.pools.growth + result.pools.risk;
  const invariant = Math.abs(total - result.net_cash) <= fixture.tolerance;
  assert(invariant, id, 'balance_invariant', `net_cash=${result.net_cash}`, `sum=${total}`);

  // buyer_paid 불변성: paid = platform_actual + creator + growth + risk + pg_fee
  const buyerInvariant = result.pools.platform_actual + result.pools.creator + result.pools.growth + result.pools.risk + result.pg_fee;
  assert(buyerInvariant === result.paid_amount, id, 'buyer_paid_invariant', result.paid_amount, buyerInvariant);

  const status = failures.length === 0 || failures[failures.length - 1]?.startsWith(id) === false ? 'PASS' : 'FAIL';
  const hasNewFail = failures.some(f => f.startsWith(id));
  console.log(`  ${hasNewFail ? 'FAIL' : 'PASS'} ${id}: ${tc.name}`);
});

// ─── Gate 3: Idempotency ─────────────────────────────────────
console.log('\n--- Gate 3: Idempotency ---');
{
  const event = fixture.cases[0].event;
  const r1 = calcService.calculate(event);
  const r2 = calcService.calculate(event);
  const idem = JSON.stringify(r1) === JSON.stringify(r2);
  assert(idem, 'IDEM', 'idempotency', 'identical', idem ? 'identical' : 'different');
  console.log(`  ${idem ? 'PASS' : 'FAIL'} Idempotency: same input → same output`);
}

// ─── Gate 4: 역분개 ──────────────────────────────────────────
console.log('\n--- Gate 4: Reversal ---');
{
  // TC-017 환불 전액: 역분개 결과의 절대값이 원래 결과와 동일해야 함
  const originalEvent = { gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: null };
  const original = calcService.calculate(originalEvent);
  const reversal = calcService.calculateReversal(originalEvent);

  assert(reversal.is_reversal === true, 'REV', 'is_reversal', true, reversal.is_reversal);
  assert(reversal.paid_amount === -original.paid_amount, 'REV', 'paid_negated', -original.paid_amount, reversal.paid_amount);
  assert(reversal.pg_fee === -original.pg_fee, 'REV', 'pg_fee_negated', -original.pg_fee, reversal.pg_fee);
  assert(reversal.pools.creator === -original.pools.creator, 'REV', 'creator_negated', -original.pools.creator, reversal.pools.creator);
  assert(reversal.pools.growth === -original.pools.growth, 'REV', 'growth_negated', -original.pools.growth, reversal.pools.growth);
  assert(reversal.pools.risk === -original.pools.risk, 'REV', 'risk_negated', -original.pools.risk, reversal.pools.risk);

  // 부분 환불 (50%)
  const partialRev = calcService.calculateReversal(originalEvent, 5000);
  assert(partialRev.reversal_ratio === 0.5, 'REV-PARTIAL', 'ratio', 0.5, partialRev.reversal_ratio);
  assert(partialRev.paid_amount === -Math.round(original.paid_amount * 0.5), 'REV-PARTIAL', 'paid_half', -Math.round(original.paid_amount * 0.5), partialRev.paid_amount);

  console.log(`  ${failures.some(f => f.startsWith('REV')) ? 'FAIL' : 'PASS'} Full reversal negation`);
  console.log(`  ${failures.some(f => f.startsWith('REV-PARTIAL')) ? 'FAIL' : 'PASS'} Partial reversal (50%)`);
}

// ─── 결과 ────────────────────────────────────────────────────
console.log(`\n=== Result: ${passed}/${passed + failed} passed ===`);

if (failures.length > 0) {
  console.log(`\nFailed assertions (${failures.length}):`);
  failures.forEach(f => console.log(`  - ${f}`));
  process.exit(1);
} else {
  console.log('\nAll gates PASS!');
}
