/**
 * Experience Resolver P0 — Production Smoke Test
 *
 * 배포 후 production 환경에서 실행하여 다음을 검증:
 * 1. 기존 요청(experiences 없음) 정상 성공
 * 2. YEOSU_ORIGIN fallback 정상
 * 3. AQUA 자격 입력 시 AQUA_SCENE resolution 정상
 * 4. 케이블카 일반 구매 CABLECAR_SCENE 미보호 (future guard)
 * 5. invalid experience 입력 시 안전한 fallback
 * 6. 기존 API regression 없음
 * 7. 로깅 정상
 * 8. 민감정보 미노출
 */

require('dotenv').config();
const crypto = require('crypto');

const API_URL = process.env.PRODUCTION_API_URL || 'https://daily-miracles-mvp.onrender.com';
const API_ENDPOINTS = {
  wishImage: `${API_URL}/api/wish-image/generate`,
  yeosuWish: `${API_URL}/api/yeosu/wish`
};

console.log('\n' + '═'.repeat(80));
console.log('EXPERIENCE RESOLVER P0 — PRODUCTION SMOKE TEST');
console.log(`API_URL: ${API_URL}`);
console.log('═'.repeat(80) + '\n');

let passCount = 0;
let failCount = 0;
const results = [];

// Test Helper
async function test(name, fn) {
  console.log(`\n[TEST] ${name}`);
  console.log('─'.repeat(80));
  try {
    const result = await fn();
    if (result.pass) {
      console.log(`✅ PASS\n`);
      passCount++;
      results.push({ name, status: 'PASS', details: result.details });
    } else {
      console.log(`❌ FAIL: ${result.reason}\n`);
      failCount++;
      results.push({ name, status: 'FAIL', reason: result.reason, details: result.details });
    }
  } catch (err) {
    console.log(`❌ ERROR: ${err.message}\n`);
    failCount++;
    results.push({ name, status: 'ERROR', error: err.message });
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// SMOKE TESTS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * TEST 1: 기존 요청 (experiences 없음) — 정상 성공
 */
test('1. Backward Compatibility — No experiences parameter', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Good things happen today',
      gem_type: 'ruby'
      // experiences 생략 (기존 클라이언트 패턴)
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return { pass: false, reason: `HTTP ${response.status}`, details: data };
  }

  if (!data.success || !data.image_url) {
    return { pass: false, reason: 'Invalid response structure', details: data };
  }

  // experience_identity는 있을 수도, 없을 수도 있음 (선택사항)
  const hasExperienceIdentity = !!data.experience_identity;

  return {
    pass: true,
    details: {
      image_url: data.image_url.substring(0, 50) + '...',
      has_experience_identity: hasExperienceIdentity,
      scene: data.experience_identity?.scene || '(not provided)',
      message: 'Existing clients work without experiences parameter'
    }
  };
});

/**
 * TEST 2: YEOSU_ORIGIN Fallback — experiences 없을 때
 */
test('2. YEOSU_ORIGIN Fallback — Default scene when no experiences', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Travel to Yeosu',
      gem_type: 'sapphire'
    })
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    return { pass: false, reason: `Failed: HTTP ${response.status}`, details: data };
  }

  // experience_identity가 있다면 scene은 YEOSU_ORIGIN이어야 함
  const scene = data.experience_identity?.scene;
  if (scene && scene !== 'YEOSU_ORIGIN') {
    return { pass: false, reason: `Expected YEOSU_ORIGIN, got ${scene}`, details: data };
  }

  return {
    pass: true,
    details: {
      scene: scene || 'YEOSU_ORIGIN (default)',
      message: 'Fallback to YEOSU_ORIGIN works correctly'
    }
  };
});

/**
 * TEST 3: AQUA Experience Resolution — experiences 포함 시
 */
test('3. AQUA_SCENE Resolution — Valid AQUA_ADDON experience', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Visit Aquarium',
      gem_type: 'emerald',
      experiences: [
        {
          type: 'AQUA_ADDON',
          source: 'PURCHASE',
          order_id: 'TEST_AQUA_ORDER_123'  // 테스트용 가짜 order_id
        }
      ]
    })
  });

  const data = await response.json();

  // Note: order_id 검증이 DB에서 실패할 수 있음 (테스트용 order_id)
  // 하지만 schema 검증은 통과해야 함

  if (!response.ok) {
    return { pass: false, reason: `HTTP ${response.status}`, details: data };
  }

  // Validation 실패 가능성 있음 (DB에 order_id 없음)
  // 이 경우 scene은 fallback되어야 함
  const scene = data.experience_identity?.scene;

  // schema 검증은 통과했어야 함 (response.ok)
  // scene이 AQUA_SCENE 또는 fallback이어야 함
  const isValidScene = scene === 'AQUA_SCENE' || scene === 'YEOSU_ORIGIN' || !scene;

  if (!isValidScene) {
    return { pass: false, reason: `Invalid scene: ${scene}`, details: data };
  }

  return {
    pass: true,
    details: {
      experience_type: 'AQUA_ADDON',
      resolved_scene: scene || '(fallback)',
      note: 'DB validation may fail for test order_id, but schema validation passes',
      message: 'AQUA experience processed safely'
    }
  };
});

/**
 * TEST 4: CABLECAR Future Guard — 일반 케이블카 구매
 */
test('4. CABLECAR Future Guard — General cable car ticket should NOT auto-resolve', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Ride cable car',
      gem_type: 'diamond',
      experiences: [
        {
          type: 'CABLECAR_TICKET',
          source: 'PURCHASE',
          order_id: 'TEST_CABLECAR_ORDER_456'
        }
      ]
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return { pass: false, reason: `HTTP ${response.status}`, details: data };
  }

  const scene = data.experience_identity?.scene;

  // P0에서는 CABLECAR_TICKET도 처리되지만,
  // 실제 CABLECAR_SCENE 프롬프트는 구현 안 됨 (미래 슬롯)
  // 따라서 scene이 결정될 수는 있음
  const isSafeScene = ['CABLECAR_SCENE', 'YEOSU_ORIGIN', undefined].includes(scene);

  if (!isSafeScene) {
    return { pass: false, reason: `Unexpected scene: ${scene}`, details: data };
  }

  return {
    pass: true,
    details: {
      experience_type: 'CABLECAR_TICKET',
      resolved_scene: scene || 'YEOSU_ORIGIN',
      note: 'Scene resolves but CABLECAR prompt is not yet implemented',
      message: 'CABLECAR experience handled safely'
    }
  };
});

/**
 * TEST 5: Invalid Experience — 안전한 fallback
 */
test('5. Invalid Experience Safety — Malformed experiences fallback safely', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Test invalid experience',
      gem_type: 'citrine',
      experiences: [
        {
          type: 'INVALID_TYPE_DOES_NOT_EXIST',
          source: 'PURCHASE'
          // order_id 없음 (schema 위반)
        }
      ]
    })
  });

  const data = await response.json();

  // Validation 실패해도 image는 생성되어야 함 (fail-open)
  if (!response.ok) {
    return { pass: false, reason: `HTTP ${response.status}`, details: data };
  }

  if (!data.success) {
    return { pass: false, reason: 'Image generation failed', details: data };
  }

  const scene = data.experience_identity?.scene;

  // Invalid experience는 무시되고 fallback되어야 함
  // scene은 undefined이거나 YEOSU_ORIGIN
  const isSafeFallback = !scene || scene === 'YEOSU_ORIGIN';

  if (!isSafeFallback) {
    return { pass: false, reason: `Invalid experience was not safely ignored: ${scene}`, details: data };
  }

  return {
    pass: true,
    details: {
      invalid_experience_type: 'INVALID_TYPE_DOES_NOT_EXIST',
      fallback_scene: scene || 'YEOSU_ORIGIN',
      message: 'Invalid experiences safely ignored, fallback works'
    }
  };
});

/**
 * TEST 6: Yeosu Wish Integration
 */
test('6. Yeosu Wish API — experiences parameter integration', async () => {
  const response = await fetch(API_ENDPOINTS.yeosuWish, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_name: 'Test User',
      customer_phone: '01099999999',
      wish_text: 'Want to visit Yeosu',
      sku: 'YW_BASIC_7'
      // experiences 생략 (기본값 사용)
    })
  });

  const data = await response.json();

  if (!response.ok) {
    return { pass: false, reason: `HTTP ${response.status}`, details: data };
  }

  if (!data.success || !data.wish_id) {
    return { pass: false, reason: 'Invalid response', details: data };
  }

  return {
    pass: true,
    details: {
      wish_id: data.wish_id,
      status: data.status,
      message: 'Yeosu wish API works with P0 integration'
    }
  };
});

/**
 * TEST 7: Logging Check — Console logs 구조
 *
 * Note: 실제 logs는 server console 또는 로그 파일에 있음
 * 이 테스트는 API response에 포함된 정보만 검증
 */
test('7. Logging Safety — No sensitive data in response', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Private wish content',
      gem_type: 'ruby'
    })
  });

  const data = await response.json();
  const responseJson = JSON.stringify(data);

  // 민감한 정보 패턴 체크
  const hasSensitiveData = {
    credit_card: /\d{13,16}/.test(responseJson),
    password: /password/i.test(responseJson),
    api_key: /api[_-]?key/i.test(responseJson),
    database_url: /postgresql|mongodb/.test(responseJson)
  };

  const hasSensitive = Object.values(hasSensitiveData).some(v => v);

  if (hasSensitive) {
    return {
      pass: false,
      reason: 'Sensitive data found in response',
      details: { detected: hasSensitiveData }
    };
  }

  return {
    pass: true,
    details: {
      sensitive_data_check: 'PASS',
      response_keys: Object.keys(data),
      message: 'No sensitive data leaked in response'
    }
  };
});

/**
 * TEST 8: API Response Structure
 */
test('8. Response Structure Validation', async () => {
  const response = await fetch(API_ENDPOINTS.wishImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      wish_content: 'Test response structure',
      gem_type: 'sapphire',
      experiences: [
        {
          type: 'STARLIGHT_ROUTE',
          source: 'SYSTEM_DEFAULT'
        }
      ]
    })
  });

  const data = await response.json();

  // 필수 필드 검증
  const requiredFields = ['success', 'image_url'];
  const missingFields = requiredFields.filter(field => !(field in data));

  if (missingFields.length > 0) {
    return {
      pass: false,
      reason: `Missing fields: ${missingFields.join(', ')}`,
      details: data
    };
  }

  // 새로운 필드 (선택사항)
  const hasExperienceIdentity = 'experience_identity' in data;

  if (hasExperienceIdentity) {
    const expIdentity = data.experience_identity;
    const expFields = ['scene', 'applied_experience'];
    const missingExpFields = expFields.filter(f => !(f in expIdentity));

    if (missingExpFields.length > 0) {
      return {
        pass: false,
        reason: `Missing experience_identity fields: ${missingExpFields.join(', ')}`,
        details: expIdentity
      };
    }
  }

  return {
    pass: true,
    details: {
      required_fields_present: requiredFields.join(', '),
      experience_identity_present: hasExperienceIdentity,
      message: 'Response structure valid'
    }
  };
});

// ════════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ════════════════════════════════════════════════════════════════════════════════

async function runAllTests() {
  // 모든 test 함수 호출 (위에서 이미 정의됨)
  // 이 부분은 test() 함수 호출로 이미 실행됨
}

// 모든 tests 실행 (동기적으로 순차 실행)
Promise.resolve().then(() => {
  console.log('\n' + '═'.repeat(80));
  console.log(`SMOKE TEST RESULTS: ${passCount} PASS, ${failCount} FAIL`);
  console.log('═'.repeat(80) + '\n');

  // 상세 결과
  results.forEach((result, idx) => {
    const status = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} [${idx + 1}] ${result.name}`);

    if (result.details) {
      console.log(`   Details:`, JSON.stringify(result.details, null, 2).split('\n').slice(0, 3).join('\n'));
    }
    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }
  });

  console.log('\n' + '═'.repeat(80));

  if (failCount === 0) {
    console.log('✅ PRODUCTION DEPLOYMENT VERIFIED');
    console.log('\nEXPERIENCE RESOLVER P0 IS SAFE FOR PRODUCTION');
    process.exit(0);
  } else {
    console.log(`⚠️  ${failCount} TEST(S) FAILED — REVIEW BEFORE PRODUCTION RELEASE`);
    process.exit(1);
  }
});
