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

// ─── Gate 3b: Idempotency (DB 패턴 검증) ──────────────────────
console.log('\n--- Gate 3b: Idempotency (DB pattern) ---');
{
  // saveEvent 소스 코드에 ON CONFLICT (event_id) DO NOTHING 패턴 존재 확인
  const calcSource = fs.readFileSync(path.join(__dirname, '..', '..', 'services', 'settlement', 'calculationService.js'), 'utf-8');
  const hasOnConflict = calcSource.includes('ON CONFLICT (event_id) DO NOTHING');
  assert(hasOnConflict, 'IDEM-DB', 'on_conflict_pattern', true, hasOnConflict);

  // 순수함수 idempotency: 다양한 입력 3회 동일 결과
  const events = [
    { gross_amount: 33333, coupon_amount: 5000, remix_chain: ['a', 'b'], referrer_id: 'ref' },
    { gross_amount: 1000, coupon_amount: 0, remix_chain: [], referrer_id: null },
    { gross_amount: 100000, coupon_amount: 10000, remix_chain: ['c1', 'c2', 'c3'], referrer_id: 'top' },
  ];
  events.forEach((ev, i) => {
    const r1 = JSON.stringify(calcService.calculate(ev));
    const r2 = JSON.stringify(calcService.calculate(ev));
    const r3 = JSON.stringify(calcService.calculate(ev));
    assert(r1 === r2 && r2 === r3, `IDEM-PURE-${i}`, 'triple_run', 'identical', r1 === r2 && r2 === r3 ? 'identical' : 'differ');
  });

  const idemFails = failures.filter(f => f.startsWith('IDEM'));
  console.log(`  ${idemFails.length === 0 ? 'PASS' : 'FAIL'} ON CONFLICT pattern in saveEvent`);
  console.log(`  ${idemFails.length === 0 ? 'PASS' : 'FAIL'} Pure function 3x idempotency (3 events)`);
}

// ─── Gate 5: 추천/리믹스 분기 ────────────────────────────────
console.log('\n--- Gate 5: Referral/Remix Branching ---');
{
  // 추천 없음 → reserve = growth_pool 전액
  const noRef = calcService.calculate({ gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: null });
  assert(noRef.growth_breakdown.reserve === noRef.pools.growth, 'BRANCH', 'no_ref_reserve', noRef.pools.growth, noRef.growth_breakdown.reserve);
  assert(noRef.growth_breakdown.referrer === 0, 'BRANCH', 'no_ref_referrer', 0, noRef.growth_breakdown.referrer);

  // 추천 있음 → referrer + campaign = growth_pool
  const withRef = calcService.calculate({ gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: 'ref1' });
  assert(withRef.growth_breakdown.referrer + withRef.growth_breakdown.campaign === withRef.pools.growth, 'BRANCH', 'ref_sum', withRef.pools.growth, withRef.growth_breakdown.referrer + withRef.growth_breakdown.campaign);
  assert(withRef.growth_breakdown.reserve === 0, 'BRANCH', 'ref_no_reserve', 0, withRef.growth_breakdown.reserve);

  // 리믹스 없음 → remix_shares empty, remix_total은 미분배 상태
  const noRemix = calcService.calculate({ gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: null });
  assert(noRemix.creator_breakdown.remix_shares.length === 0, 'BRANCH', 'no_remix_shares', 0, noRemix.creator_breakdown.remix_shares.length);

  // 리믹스 4단계 → 3개만 적용
  const remix4 = calcService.calculate({ gross_amount: 10000, coupon_amount: 0, remix_chain: ['a', 'b', 'c', 'd'], referrer_id: null });
  assert(remix4.creator_breakdown.remix_shares.length === 3, 'BRANCH', 'remix_max3', 3, remix4.creator_breakdown.remix_shares.length);

  const branchFails = failures.filter(f => f.startsWith('BRANCH'));
  console.log(`  ${branchFails.length === 0 ? 'PASS' : 'FAIL'} No referrer → reserve full`);
  console.log(`  ${branchFails.length === 0 ? 'PASS' : 'FAIL'} With referrer → referrer+campaign=growth`);
  console.log(`  ${branchFails.length === 0 ? 'PASS' : 'FAIL'} Remix max depth=3`);
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
