/**
 * test-settlement-flow.js
 *
 * DreamTown 정산 시스템 검증 스크립트
 *
 * 시나리오:
 *   1. 정상 배치: REDEEMED 이용권 → settlement 생성
 *   2. 중복 방지: batch 2회 실행 → 동일 항목 포함 안됨
 *   3. 상태 변경: pending → approved → paid
 *   4. 통계 확인
 *
 * 실행: node scripts/test-settlement-flow.js
 */

'use strict';

require('dotenv').config();

const API = process.env.API_BASE || 'http://localhost:3000';

let passed = 0;
let failed = 0;

async function req(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
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

async function scenario1() {
  console.log('\n📋 시나리오 1: 정상 배치 실행');

  // 배치 실행
  const batch = await req('POST', '/api/dt/settlements/batch', {});
  ok('배치 응답 ok', batch.ok, JSON.stringify(batch));
  console.log(`     생성: ${batch.created}건, 스킵: ${batch.skipped}건, 항목: ${batch.items}건`);

  // 목록 조회
  const list = await req('GET', '/api/dt/settlements');
  ok('목록 조회 ok', list.ok, JSON.stringify(list));
  console.log(`     전체 정산: ${list.count}건`);

  return list.settlements?.[0]?.id;
}

async function scenario2() {
  console.log('\n📋 시나리오 2: 중복 배치 방지');

  const first  = await req('POST', '/api/dt/settlements/batch', {});
  const second = await req('POST', '/api/dt/settlements/batch', {});

  // 두 번째 배치에서는 새로 생성된 정산이 없어야 함 (이미 included 처리됨)
  ok('중복 배치 새 항목 없음', second.items === 0, `items=${second.items}`);
}

async function scenario3(settlementId) {
  console.log('\n📋 시나리오 3: 승인 → 지급 상태 변경');

  if (!settlementId) {
    console.log('  ⚠️  정산 ID 없음 — 목록에서 조회');
    const list = await req('GET', '/api/dt/settlements?status=pending');
    settlementId = list.settlements?.[0]?.id;
    if (!settlementId) {
      console.log('  ⚠️  pending 정산 없음 — 시나리오 3 스킵');
      return;
    }
  }

  // 상세 조회
  const detail = await req('GET', `/api/dt/settlements/${settlementId}`);
  ok('상세 조회 ok', detail.ok, JSON.stringify(detail));
  ok('items 있음', Array.isArray(detail.items), `items type: ${typeof detail.items}`);

  // 승인
  const approved = await req('POST', `/api/dt/settlements/${settlementId}/approve`);
  ok('승인 성공', approved.ok, JSON.stringify(approved));
  ok('상태 approved', approved.status === 'approved', approved.status);

  // 중복 승인 차단
  const dupApprove = await req('POST', `/api/dt/settlements/${settlementId}/approve`);
  ok('중복 승인 차단', !dupApprove.ok, `ok=${dupApprove.ok}`);

  // 지급
  const paid = await req('POST', `/api/dt/settlements/${settlementId}/pay`);
  ok('지급 성공', paid.ok, JSON.stringify(paid));
  ok('상태 paid', paid.status === 'paid', paid.status);
  ok('paid_at 있음', !!paid.paid_at, paid.paid_at);
}

async function scenario4() {
  console.log('\n📋 시나리오 4: 통계 확인');

  const stats = await req('GET', '/api/dt/settlements/stats');
  ok('통계 조회 ok', stats.ok, JSON.stringify(stats));
  console.log(`     전체: ${stats.total_settlements}건`);
  console.log(`     pending: ${stats.pending_count} / approved: ${stats.approved_count} / paid: ${stats.paid_count}`);
  console.log(`     총액: ${stats.total_amount} / 지급완료: ${stats.paid_amount}`);
}

(async () => {
  console.log(`\n🚀 DreamTown 정산 시스템 테스트`);
  console.log(`   API: ${API}`);
  console.log('═'.repeat(50));

  try {
    const settlementId = await scenario1();
    await scenario2();
    await scenario3(settlementId);
    await scenario4();
  } catch (e) {
    console.error('\n💥 테스트 오류:', e.message);
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패`);
  if (failed > 0) process.exit(1);
})();
