/**
 * test-credential-flow.js
 *
 * DreamTown 모바일 이용권 — 상태 전이 검증 스크립트
 *
 * 시나리오:
 *   1. 정상 플로우:   issue → verify → redeem → 토스트 확인
 *   2. 중복 사용:     redeem 2회 → 두 번째 차단
 *   3. 잘못된 QR:     존재하지 않는 token → reject
 *   4. 만료 이용권:   expires_at 과거 설정 → reject
 *   5. 미검증 redeem: verify 없이 redeem → reject
 *
 * 실행: node scripts/test-credential-flow.js
 * 환경변수: API_BASE (기본값: http://localhost:3000)
 */

'use strict';

require('dotenv').config();

const API   = process.env.API_BASE || 'http://localhost:3000';
const PCODE = 'test_partner_001';

let passed = 0;
let failed = 0;

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body:    body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// ── 시나리오 1: 정상 플로우 ──────────────────────────────────────────
async function scenario1() {
  console.log('\n📋 시나리오 1: 정상 플로우 (issue → verify → redeem)');

  // 1-1. issue
  const issued = await req('POST', '/api/dt/credentials/issue', {
    benefit_type: 'cablecar',
    galaxy_code:  'growth',
    issued_from:  'test',
  });
  ok('issue 성공', issued.ok, JSON.stringify(issued));
  if (!issued.ok) return null;

  const code = issued.credential_code;
  console.log(`     코드: ${code}`);

  // 1-2. 이용권 조회 (QR 포함)
  const view = await req('GET', `/api/dt/credentials/${code}`);
  ok('조회 성공', view.ok);
  ok('상태 ISSUED', view.status === 'ISSUED', view.status);
  ok('QR 이미지 있음', !!view.qr_data_url);

  // 1-3. QR 스캔 (scan API)
  const scan = await req('GET', `/api/dt/credentials/scan/${view.qr_token ?? 'NO_TOKEN'}`);
  // qr_token은 조회 응답에 없으므로 credential_code로 직접 verify
  // (scan은 파트너가 QR URL에서 token을 읽는 방식 — 여기선 verify로 대체)

  // 1-4. verify
  const verified = await req('POST', `/api/dt/credentials/${code}/verify`, {
    partner_code: PCODE,
  });
  ok('verify 성공', verified.ok, JSON.stringify(verified));
  ok('상태 VERIFIED', verified.status === 'VERIFIED', verified.status);

  // 1-5. redeem
  const redeemed = await req('POST', `/api/dt/credentials/${code}/redeem`, {
    partner_code: PCODE,
  });
  ok('redeem 성공', redeemed.ok, JSON.stringify(redeemed));
  ok('상태 REDEEMED', redeemed.status === 'REDEEMED', redeemed.status);
  ok('toast_message 있음', !!redeemed.toast_message, redeemed.toast_message);
  console.log(`     토스트: "${redeemed.toast_message}"`);

  return code;
}

// ── 시나리오 2: 중복 사용 차단 ──────────────────────────────────────
async function scenario2(redeemedCode) {
  console.log('\n📋 시나리오 2: 중복 사용 차단');

  if (!redeemedCode) {
    // 새 이용권 발급 후 redeem
    const issued = await req('POST', '/api/dt/credentials/issue', {
      benefit_type: 'cruise', galaxy_code: 'challenge', issued_from: 'test',
    });
    await req('POST', `/api/dt/credentials/${issued.credential_code}/verify`, { partner_code: PCODE });
    await req('POST', `/api/dt/credentials/${issued.credential_code}/redeem`, { partner_code: PCODE });
    redeemedCode = issued.credential_code;
  }

  const second = await req('POST', `/api/dt/credentials/${redeemedCode}/redeem`, {
    partner_code: PCODE,
  });
  ok('두 번째 redeem 차단', !second.ok, `ok=${second.ok}, error=${second.error}`);
  ok('REDEEMED 상태 반환', second.status === 'REDEEMED', second.status);
}

// ── 시나리오 3: 잘못된 QR ────────────────────────────────────────────
async function scenario3() {
  console.log('\n📋 시나리오 3: 잘못된 QR scan');

  const scan = await req('GET', '/api/dt/credentials/scan/INVALID_TOKEN_000000');
  ok('잘못된 QR reject', !scan.ok || scan.status === 404, `ok=${scan.ok}`);
}

// ── 시나리오 4: 만료 이용권 ──────────────────────────────────────────
async function scenario4() {
  console.log('\n📋 시나리오 4: 만료 이용권 (valid_days=0)');

  // valid_days=0 → valid_until이 현재 시각과 동일 → 즉시 만료
  const issued = await req('POST', '/api/dt/credentials/issue', {
    benefit_type: 'aqua', galaxy_code: 'healing',
    valid_days: 0, issued_from: 'test',
  });
  if (!issued.ok) { ok('만료 테스트 발급', false, issued.error); return; }

  // valid_until이 과거라면 verify 시 EXPIRED 반환
  const verified = await req('POST', `/api/dt/credentials/${issued.credential_code}/verify`, {
    partner_code: PCODE,
  });
  // valid_days=0이면 유효기간이 지금과 같아 만료 처리
  const isExpired = !verified.ok && (verified.status === 'EXPIRED' || verified.error?.includes('유효기간'));
  const isOkEdge  = verified.ok; // valid_days=0이라도 NOW()와 같으면 통과될 수 있음
  ok('만료 이용권 처리', isExpired || !isOkEdge, `ok=${verified.ok}, status=${verified.status}`);
}

// ── 시나리오 5: verify 없이 redeem ───────────────────────────────────
async function scenario5() {
  console.log('\n📋 시나리오 5: verify 없이 redeem (ISSUED 상태에서)');

  const issued = await req('POST', '/api/dt/credentials/issue', {
    benefit_type: 'yacht', galaxy_code: 'miracle', issued_from: 'test',
  });
  if (!issued.ok) { ok('미검증 redeem 테스트 발급', false, issued.error); return; }

  const redeemed = await req('POST', `/api/dt/credentials/${issued.credential_code}/redeem`, {
    partner_code: PCODE,
  });
  ok('ISSUED 상태 redeem 차단', !redeemed.ok, `ok=${redeemed.ok}, error=${redeemed.error}`);
}

// ── 실행 ─────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n🚀 DreamTown 이용권 플로우 테스트`);
  console.log(`   API: ${API}`);
  console.log('═'.repeat(50));

  try {
    const code = await scenario1();
    await scenario2(code);
    await scenario3();
    await scenario4();
    await scenario5();
  } catch (e) {
    console.error('\n💥 테스트 오류:', e.message);
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패`);

  if (failed > 0) process.exit(1);
})();
