#!/usr/bin/env node
/**
 * Staging Settlement v2 검증 스크립트
 *
 * 실행: STAGING_URL=https://staging.dailymiracles.kr node scripts/ops/staging-settlement-check.js
 *
 * 검증 항목:
 * 1. /api/health → settlement: true
 * 2. POST /api/settlement/calculate (무쿠폰 10,000원)
 * 3. POST /api/settlement/calculate (쿠폰 5,000원 + 추천 + 리믹스)
 * 4. 합계 불변성 확인
 * 5. Idempotency 확인 (동일 입력 2회)
 */

const BASE_URL = process.env.STAGING_URL || 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function check(label, fn) {
  try {
    const result = await fn();
    if (result) {
      passed++;
      console.log(`  PASS ${label}`);
    } else {
      failed++;
      console.log(`  FAIL ${label}`);
    }
  } catch (err) {
    failed++;
    console.log(`  FAIL ${label}: ${err.message}`);
  }
}

async function fetchJson(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log(`\n=== Staging Settlement v2 Check ===`);
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Health check
  console.log('--- 1. Health Check ---');
  await check('/api/health → settlement module loaded', async () => {
    const { data } = await fetchJson('/api/health');
    return data.success && data.modules?.settlement === true;
  });

  // 2. Calculate 무쿠폰
  console.log('\n--- 2. Calculate (무쿠폰 10,000원) ---');
  let noCouponResult;
  await check('POST /api/settlement/calculate → success', async () => {
    const { status, data } = await fetchJson('/api/settlement/calculate', {
      method: 'POST',
      body: JSON.stringify({ gross_amount: 10000 })
    });
    noCouponResult = data.data;
    return status === 200 && data.success;
  });

  await check('paid=10000, pg_fee=350, anchor=9650', async () => {
    const r = noCouponResult;
    return r && r.paid_amount === 10000 && r.pg_fee === 350 && r.anchor_amount === 9650;
  });

  await check('balance invariant (pool sum = net_cash)', async () => {
    const r = noCouponResult;
    const sum = r.pools.platform_actual + r.pools.creator + r.pools.growth + r.pools.risk;
    return sum === r.net_cash;
  });

  // 3. Calculate 복합 (쿠폰 + 추천 + 리믹스)
  console.log('\n--- 3. Calculate (복합: 쿠폰+추천+리믹스) ---');
  let complexResult;
  await check('POST complex scenario → success', async () => {
    const { status, data } = await fetchJson('/api/settlement/calculate', {
      method: 'POST',
      body: JSON.stringify({
        gross_amount: 50000,
        coupon_amount: 5000,
        remix_chain: ['creator_a', 'creator_b'],
        referrer_id: 'ref_001'
      })
    });
    complexResult = data.data;
    return status === 200 && data.success;
  });

  await check('buyer_paid invariant (pool_actual+creator+growth+risk+pg_fee = paid)', async () => {
    const r = complexResult;
    const buyerSum = r.pools.platform_actual + r.pools.creator + r.pools.growth + r.pools.risk + r.pg_fee;
    return buyerSum === r.paid_amount;
  });

  await check('remix_shares length = 2', async () => {
    return complexResult?.creator_breakdown?.remix_shares?.length === 2;
  });

  await check('referrer > 0', async () => {
    return complexResult?.growth_breakdown?.referrer > 0;
  });

  // 4. Idempotency
  console.log('\n--- 4. Idempotency ---');
  await check('Same input → same output', async () => {
    const body = JSON.stringify({ gross_amount: 10000 });
    const r1 = await fetchJson('/api/settlement/calculate', { method: 'POST', body });
    const r2 = await fetchJson('/api/settlement/calculate', { method: 'POST', body });
    return JSON.stringify(r1.data) === JSON.stringify(r2.data);
  });

  // 결과
  console.log(`\n=== Staging Result: ${passed}/${passed + failed} passed ===`);
  if (failed > 0) {
    console.log('\nStaging NOT ready for production.');
    process.exit(1);
  } else {
    console.log('\nStaging READY for production!');
  }
}

run().catch(err => {
  console.error('Staging check failed:', err.message);
  process.exit(1);
});
