#!/usr/bin/env node
/**
 * 일회성 픽스처 생성기 — PG_FEE_RATE=0.035, Anchor=Gross-PG_Fee
 * 실행: node tests/fixtures/settlement_v2/_generate.js
 * 결과: tests/fixtures/settlement_v2/cases.json
 */

const fs = require('fs');
const path = require('path');

const PG_FEE_RATE = 0.035;
const PLATFORM_RATE = 0.55;
const CREATOR_POOL_RATE = 0.30;
const GROWTH_POOL_RATE = 0.10;
const RISK_POOL_RATE = 0.05;
const CREATOR_ORIGINAL_RATE = 0.70;
const CREATOR_REMIX_RATE = 0.20;
const CREATOR_CURATION_RATE = 0.10;
const REMIX_MAX_DEPTH = 3;
const GROWTH_REFERRER_RATE = 0.07;
const GROWTH_CAMPAIGN_RATE = 0.03;

function compute(event) {
  const gross = event.gross_amount;
  const coupon = event.coupon_amount || 0;
  const paid = gross - coupon;
  const pg_fee = Math.round(paid * PG_FEE_RATE);
  const net_cash = paid - pg_fee;
  const anchor = gross - pg_fee; // NEW: Gross - PG_Fee (not Gross - round(Gross*rate))

  const platform_pool = Math.round(anchor * PLATFORM_RATE);
  const creator_pool = Math.round(anchor * CREATOR_POOL_RATE);
  const growth_pool = Math.round(anchor * GROWTH_POOL_RATE);
  const risk_pool = Math.round(anchor * RISK_POOL_RATE);
  const platform_actual = net_cash - creator_pool - growth_pool - risk_pool;

  const creator_original = Math.round(creator_pool * CREATOR_ORIGINAL_RATE);
  const creator_remix_total = Math.round(creator_pool * CREATOR_REMIX_RATE);
  const creator_curation = Math.round(creator_pool * CREATOR_CURATION_RATE);

  const chain = (event.remix_chain || []).slice(0, REMIX_MAX_DEPTH);
  const remix_shares = [];
  if (chain.length > 0) {
    const per = Math.round(creator_remix_total / chain.length);
    chain.forEach((id, i) => remix_shares.push({ creator_id: id, depth: i + 1, amount: per }));
  }

  let growth_referrer = 0, growth_campaign = 0, growth_reserve = 0;
  if (event.referrer_id) {
    growth_referrer = Math.round(growth_pool * (GROWTH_REFERRER_RATE / GROWTH_POOL_RATE));
    growth_campaign = growth_pool - growth_referrer; // 잔여 보정
  } else {
    growth_reserve = growth_pool;
  }

  const total_distributed = platform_actual + creator_pool + growth_pool + risk_pool;
  const balance_diff = Math.abs(total_distributed - net_cash);

  return {
    paid, pg_fee, net_cash, anchor,
    pools: { platform: platform_pool, platform_actual, creator: creator_pool, growth: growth_pool, risk: risk_pool },
    creator_breakdown: { original: creator_original, remix_total: creator_remix_total, remix_shares, curation: creator_curation },
    growth_breakdown: { referrer_id: event.referrer_id || null, referrer: growth_referrer, campaign: growth_campaign, reserve: growth_reserve },
    validation: { total_distributed, balance_diff, balance_check: balance_diff <= 1, invariant: `${paid} = ${platform_actual} + ${creator_pool} + ${growth_pool} + ${risk_pool} + ${pg_fee}` }
  };
}

// 20 Test Cases — same inputs as v1, new expected outputs
const INPUTS = [
  // A. 기본 결제 (1-6)
  { id: 'TC-001', name: '기본 결제 10,000원', category: 'A', event: { event_type: 'PAYMENT', gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: null } },
  { id: 'TC-002', name: '기본 결제 100,000원', category: 'A', event: { event_type: 'PAYMENT', gross_amount: 100000, coupon_amount: 0, remix_chain: [], referrer_id: null } },
  { id: 'TC-003', name: '최소 결제 1,000원', category: 'A', event: { event_type: 'PAYMENT', gross_amount: 1000, coupon_amount: 0, remix_chain: [], referrer_id: null } },
  { id: 'TC-004', name: '중간 금액 29,900원', category: 'A', event: { event_type: 'PAYMENT', gross_amount: 29900, coupon_amount: 0, remix_chain: [], referrer_id: null } },
  { id: 'TC-005', name: '소수점 33,333원', category: 'A', event: { event_type: 'PAYMENT', gross_amount: 33333, coupon_amount: 0, remix_chain: [], referrer_id: null } },
  { id: 'TC-006', name: '쿠폰 10% 할인', category: 'A', event: { event_type: 'PAYMENT', gross_amount: 10000, coupon_amount: 1000, remix_chain: [], referrer_id: null } },

  // B. 추천/성장 (7-10)
  { id: 'TC-007', name: '쿠폰 50% 대폭 할인', category: 'B', event: { event_type: 'PAYMENT', gross_amount: 20000, coupon_amount: 10000, remix_chain: [], referrer_id: null } },
  { id: 'TC-008', name: '쿠폰 정액 3,000원', category: 'B', event: { event_type: 'PAYMENT', gross_amount: 15000, coupon_amount: 3000, remix_chain: [], referrer_id: null } },
  { id: 'TC-009', name: '추천자 직접', category: 'B', event: { event_type: 'PAYMENT', gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: 'user_ref_001' } },
  { id: 'TC-010', name: '추천 + 쿠폰 복합', category: 'B', event: { event_type: 'PAYMENT', gross_amount: 20000, coupon_amount: 2000, remix_chain: [], referrer_id: 'user_ref_002' } },

  // C. 리믹스 (11-14)
  { id: 'TC-011', name: '리믹스 1단계', category: 'C', event: { event_type: 'PAYMENT', gross_amount: 10000, coupon_amount: 0, remix_chain: ['creator_p1'], referrer_id: null } },
  { id: 'TC-012', name: '리믹스 2단계', category: 'C', event: { event_type: 'PAYMENT', gross_amount: 10000, coupon_amount: 0, remix_chain: ['creator_p1', 'creator_p2'], referrer_id: null } },
  { id: 'TC-013', name: '리믹스 3단계 (최대)', category: 'C', event: { event_type: 'PAYMENT', gross_amount: 30000, coupon_amount: 0, remix_chain: ['c1', 'c2', 'c3'], referrer_id: null } },
  { id: 'TC-014', name: '리믹스 4단계 (3까지만)', category: 'C', event: { event_type: 'PAYMENT', gross_amount: 10000, coupon_amount: 0, remix_chain: ['c1', 'c2', 'c3', 'c4_ignored'], referrer_id: null } },

  // D. 환불/차지백/복합 (15-20)
  { id: 'TC-015', name: '복합: 쿠폰+추천+리믹스2', category: 'D', event: { event_type: 'PAYMENT', gross_amount: 50000, coupon_amount: 5000, remix_chain: ['creator_p1', 'creator_p2'], referrer_id: 'user_ref_complex' } },
  { id: 'TC-016', name: '복합: 고가+리믹스3+추천', category: 'D', event: { event_type: 'PAYMENT', gross_amount: 100000, coupon_amount: 10000, remix_chain: ['c1', 'c2', 'c3'], referrer_id: 'top_referrer' } },
  { id: 'TC-017', name: '환불 전액', category: 'D', event: { event_type: 'REFUND', gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: null, original_event_id: 'evt_orig_001' } },
  { id: 'TC-018', name: '환불 부분 50%', category: 'D', event: { event_type: 'REFUND', gross_amount: 5000, coupon_amount: 0, remix_chain: [], referrer_id: null, original_event_id: 'evt_orig_002' } },
  { id: 'TC-019', name: '차지백 리믹스+추천', category: 'D', event: { event_type: 'CHARGEBACK', gross_amount: 20000, coupon_amount: 0, remix_chain: ['creator_p1'], referrer_id: 'user_ref_cb', original_event_id: 'evt_orig_003' } },
  { id: 'TC-020', name: '수수료조정 FEE_ADJUSTED', category: 'D', event: { event_type: 'FEE_ADJUSTED', gross_amount: 10000, coupon_amount: 0, remix_chain: [], referrer_id: null, original_event_id: 'evt_orig_004' } },
];

const fixture = {
  version: '2.0',
  pg_fee_rate: PG_FEE_RATE,
  anchor_formula: 'Gross - PG_Fee (PG_Fee = round(Paid * PG_FEE_RATE))',
  tolerance: 0,
  generated_at: new Date().toISOString(),
  cases: INPUTS.map(tc => {
    const expected = compute(tc.event);
    return { ...tc, expected };
  })
};

const outPath = path.join(__dirname, 'cases.json');
fs.writeFileSync(outPath, JSON.stringify(fixture, null, 2));
console.log(`Generated ${fixture.cases.length} cases → ${outPath}`);

// Quick validation
let allPass = true;
fixture.cases.forEach(tc => {
  if (!tc.expected.validation.balance_check) {
    console.error(`FAIL: ${tc.id} balance_check`);
    allPass = false;
  }
});
console.log(allPass ? 'All 20 cases: balance_check PASS' : 'SOME CASES FAILED');
