/**
 * test-env-detection.js
 *
 * P0+ 데이터 위생: env 태깅 8가지 검증 케이스 테스트
 */

const { detectEnvExtended, detectTestSignals, addEnvToPayload } = require('../../services/eventLogger');

// 테스트 결과 추적
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${err.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg} Expected: ${expected}, Got: ${actual}`);
  }
}

function assertTrue(value, msg = '') {
  if (!value) {
    throw new Error(`${msg} Expected truthy, Got: ${value}`);
  }
}

function assertFalse(value, msg = '') {
  if (value) {
    throw new Error(`${msg} Expected falsy, Got: ${value}`);
  }
}

console.log('\n========================================');
console.log('🧪 P0+ ENV 태깅 검증 테스트');
console.log('========================================\n');

// ========== 케이스 1 ==========
test('Case 1: X-DM-ENV:test + 정상 user_id → env=test', () => {
  const req = { headers: { 'x-dm-env': 'test' } };
  const payload = { user_id: 'real-user-123' };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'header:X-DM-ENV', 'inferred_by');
  assertFalse(result.conflict, 'conflict should be false');
});

// ========== 케이스 2 ==========
test('Case 2: X-DM-ENV:prod + user_id=TEST-... → env=prod + env_conflict=true', () => {
  const req = { headers: { 'x-dm-env': 'prod' } };
  const payload = { user_id: 'TEST-user-123' };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'prod', 'env');
  assertEqual(result.inferred_by, 'header:X-DM-ENV', 'inferred_by');
  assertTrue(result.conflict, 'conflict should be true');
  assertTrue(result.conflict_reasons.length > 0, 'should have conflict reasons');
  assertTrue(result.conflict_reasons.some(r => r.includes('user_id')), 'should include user_id reason');
});

// ========== 케이스 3 ==========
test('Case 3: 헤더 없음 + is_test:true → env=test', () => {
  const req = { headers: {} };
  const payload = { user_id: 'real-user-123', is_test: true };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'payload:is_test', 'inferred_by');
  assertFalse(result.conflict, 'conflict should be false');
});

// ========== 케이스 4 ==========
test('Case 4: 헤더 없음 + user_id=TEST-... → env=test', () => {
  const req = { headers: {} };
  const payload = { user_id: 'TEST-user-456' };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'pattern:user_id', 'inferred_by');
  assertFalse(result.conflict, 'conflict should be false');
});

// ========== 케이스 5 ==========
test('Case 5: 헤더 없음 + order_id에 TEST 포함 → env=test', () => {
  const req = { headers: {} };
  const payload = { user_id: 'real-user', order_id: 'ORD-TEST-001' };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'pattern:order_id', 'inferred_by');
  assertFalse(result.conflict, 'conflict should be false');
});

// ========== 케이스 5b: checkout_id ==========
test('Case 5b: 헤더 없음 + checkout_id에 TEST 포함 → env=test', () => {
  const req = { headers: {} };
  const payload = { user_id: 'real-user', checkout_id: 'CHK-TEST-001' };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'pattern:checkout_id', 'inferred_by');
});

// ========== 케이스 6 ==========
test('Case 6: 아무 신호 없음 → env=prod (기본값)', () => {
  const req = { headers: {} };
  const payload = { user_id: 'real-user-789', order_id: 'ORD-001' };

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'prod', 'env');
  assertEqual(result.inferred_by, 'default', 'inferred_by');
  assertFalse(result.conflict, 'conflict should be false');
});

// ========== 추가 케이스: addEnvToPayload 검증 ==========
test('addEnvToPayload: 확장 버전 envInfo 객체 처리', () => {
  const payload = { user_id: 'test-user', amount: 1000 };
  const envInfo = {
    env: 'prod',
    inferred_by: 'header:X-DM-ENV',
    conflict: true,
    conflict_reasons: ['user_id:TEST-abc']
  };

  const result = addEnvToPayload(payload, envInfo, null, 'webhook');

  assertEqual(result.env, 'prod', 'env');
  assertEqual(result.env_inferred_by, 'header:X-DM-ENV', 'env_inferred_by');
  assertTrue(result.env_conflict, 'env_conflict should be true');
  assertEqual(result.source, 'webhook', 'source');
});

// ========== detectTestSignals 단위 테스트 ==========
test('detectTestSignals: 다중 테스트 시그널 감지', () => {
  const payload = {
    user_id: 'TEST-user',
    order_id: 'ORD-TEST-001',
    is_test: true
  };

  const result = detectTestSignals(payload);

  assertTrue(result.hasTestSignal, 'hasTestSignal');
  assertTrue(result.reasons.length >= 3, 'should have at least 3 reasons');
});

test('detectTestSignals: 테스트 시그널 없음', () => {
  const payload = {
    user_id: 'real-user',
    order_id: 'ORD-001'
  };

  const result = detectTestSignals(payload);

  assertFalse(result.hasTestSignal, 'hasTestSignal should be false');
  assertEqual(result.reasons.length, 0, 'should have no reasons');
});

// ========== body/query에서 is_test 감지 ==========
test('Case 3b: req.body.is_test=true → env=test', () => {
  const req = { headers: {}, body: { is_test: true } };
  const payload = {};

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'body:is_test', 'inferred_by');
});

test('Case 3c: req.query.is_test="true" → env=test', () => {
  const req = { headers: {}, query: { is_test: 'true' }, body: {} };
  const payload = {};

  const result = detectEnvExtended(req, payload);

  assertEqual(result.env, 'test', 'env');
  assertEqual(result.inferred_by, 'query:is_test', 'inferred_by');
});

// ========== 결과 요약 ==========
console.log('\n========================================');
console.log(`🏁 테스트 결과: ${passed} passed, ${failed} failed`);
console.log('========================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('✨ 모든 env 태깅 검증 케이스 통과!\n');
}
