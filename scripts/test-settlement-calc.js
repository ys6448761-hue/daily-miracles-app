/**
 * test-settlement-calc.js
 *
 * calculateSettlement() 단위 테스트 — 서버 불필요
 *
 * 케이스:
 *   1. commission_rate: 30,000 / 20% → net 24,000
 *   2. net_amount:      30,000 / 24,000 고정 → commission 6,000
 *   3. 혼합:            파트너=rate, 특정 상품=net_amount override
 *   4. 오류: net_amount 미설정 → throw
 *   5. 오류: net > face_value  → throw
 *
 * 실행: node scripts/test-settlement-calc.js
 */

'use strict';

const { calculateSettlement } = require('../services/dtSettlementService');

let passed = 0, failed = 0;

function ok(label, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${label}`); passed++; }
  else           { console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

function throws(label, fn) {
  try {
    fn();
    console.log(`  ❌ ${label} — 예외 발생 안함`);
    failed++;
  } catch (e) {
    console.log(`  ✅ ${label} (${e.message})`);
    passed++;
  }
}

console.log('\n🧮 정산 계산 단위 테스트\n' + '═'.repeat(50));

// 케이스 1: commission_rate 기본
console.log('\n📋 케이스 1: commission_rate (30,000 / 20%)');
{
  const item   = { face_value: 30000 };
  const pc     = { settlement_policy_type: 'commission_rate', commission_rate: 0.20 };
  const result = calculateSettlement(item, pc, null);

  ok('policy_type = commission_rate', result.policy_type === 'commission_rate');
  ok('commission_rate = 0.2',         result.commission_rate === 0.2);
  ok('commission_amount = 6,000',     result.commission_amount === 6000,    `got ${result.commission_amount}`);
  ok('net_amount = 24,000',           result.net_amount === 24000,          `got ${result.net_amount}`);
}

// 케이스 2: net_amount 고정
console.log('\n📋 케이스 2: net_amount (30,000 / 입금가 24,000)');
{
  const item   = { face_value: 30000 };
  const pc     = { settlement_policy_type: 'net_amount', settlement_net_amount: 24000 };
  const result = calculateSettlement(item, pc, null);

  ok('policy_type = net_amount',     result.policy_type === 'net_amount');
  ok('commission_rate = null',       result.commission_rate === null);
  ok('net_amount = 24,000',          result.net_amount === 24000,        `got ${result.net_amount}`);
  ok('commission_amount = 6,000',    result.commission_amount === 6000,  `got ${result.commission_amount}`);
}

// 케이스 3: 혼합 — 파트너 rate, 특정 상품 net_amount override
console.log('\n📋 케이스 3: 혼합 (파트너=rate, 상품=net_amount override)');
{
  const item        = { face_value: 35000 };
  const partnerConf = { settlement_policy_type: 'commission_rate', commission_rate: 0.20 };
  const benefitConf = { settlement_policy_type: 'net_amount', net_amount: 28000 };
  const result      = calculateSettlement(item, partnerConf, benefitConf);

  ok('benefit config 우선 적용',     result.policy_type === 'net_amount');
  ok('net_amount = 28,000',          result.net_amount === 28000,        `got ${result.net_amount}`);
  ok('commission_amount = 7,000',    result.commission_amount === 7000,  `got ${result.commission_amount}`);
}

// 케이스 4: 기본값 fallback (설정 없음)
console.log('\n📋 케이스 4: 설정 없음 → default 20%');
{
  const item   = { face_value: 16000 };
  const result = calculateSettlement(item, null, null);

  ok('policy_type = commission_rate', result.policy_type === 'commission_rate');
  ok('commission_rate = 0.2',         result.commission_rate === 0.2);
  ok('net_amount = 12,800',           result.net_amount === 12800, `got ${result.net_amount}`);
}

// 케이스 5: 오류 — net_amount 미설정
console.log('\n📋 케이스 5: net_amount 정책인데 값 없음 → throw');
throws('net_amount 미설정 예외', () => {
  calculateSettlement(
    { face_value: 30000 },
    { settlement_policy_type: 'net_amount', settlement_net_amount: null },
    null
  );
});

// 케이스 6: 오류 — net > face_value
console.log('\n📋 케이스 6: net_amount > face_value → throw');
throws('net > face 예외', () => {
  calculateSettlement(
    { face_value: 10000 },
    { settlement_policy_type: 'net_amount', settlement_net_amount: 15000 },
    null
  );
});

console.log('\n' + '═'.repeat(50));
console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패`);
if (failed > 0) process.exit(1);
