/**
 * test-benefit-engine.js — Benefit Engine API 검증
 * 실행: node scripts/test-benefit-engine.js
 */
'use strict';

const BASE  = process.env.API_BASE ?? 'http://localhost:4996';
const ADMIN = `${BASE}/api/admin/dt`;
const PUB   = `${BASE}/api/dt/products`;
const KEY   = 'dt-admin-2025';

let passed = 0, failed = 0;
function ok(label, cond, detail = '') {
  if (cond) { console.log(`  ✅ ${label}`); passed++; }
  else       { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}
async function req(method, url, body, headers = {}) {
  const opts = { method, headers: { 'Content-Type': 'application/json', ...headers } };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(url, opts);
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
const get   = (url, h)    => req('GET',    url, null, h);
const post  = (url, b, h) => req('POST',   url, b, h);
const patch = (url, b, h) => req('PATCH',  url, b, h);
const del   = (url, h)    => req('DELETE', url, null, h);
const auth  = { 'X-Admin-Key': KEY };

async function main() {
  console.log('\n🌟 DreamTown Benefit Engine 검증\n' + '═'.repeat(55));

  // ── 1. 지역 조회 ────────────────────────────────────────────────────
  console.log('\n📋 1. 지역 조회');
  {
    const r = await get(`${ADMIN}/regions`, auth);
    ok('GET /regions → 200', r.status === 200);
    ok('여수 포함', r.body.regions?.some(x => x.city_code === 'yeosu'), JSON.stringify(r.body.regions?.map(x=>x.city_code)));
  }

  // ── 2. 상품 목록 (시드 확인) ────────────────────────────────────────
  console.log('\n📋 2. 상품 목록 (여수 시드)');
  let productId;
  {
    const r = await get(`${PUB}?city_code=yeosu`);
    ok('GET /products → 200', r.status === 200);
    ok('8개 상품', r.body.products?.length === 8, `count=${r.body.products?.length}`);
    ok('weekday 상품 존재', r.body.products?.some(p => p.route_type === 'weekday'));
    ok('starlit 상품 존재', r.body.products?.some(p => p.route_type === 'starlit'));
    ok('family 상품 존재', r.body.products?.some(p => p.route_type === 'family'));
    ok('challenge 상품 존재', r.body.products?.some(p => p.route_type === 'challenge'));
    productId = r.body.products?.find(p => p.product_code === 'wp_cable_cruise')?.id;
  }

  // ── 3. 항로별 상품 ─────────────────────────────────────────────────
  console.log('\n📋 3. 항로별 상품 (weekday)');
  {
    const r = await get(`${PUB}/route/weekday?city_code=yeosu`);
    ok('GET /route/weekday → 200', r.status === 200);
    ok('2개 이하', (r.body.products?.length ?? 0) <= 2, `count=${r.body.products?.length}`);
    ok('wp_cable_cruise 포함', r.body.products?.some(p => p.product_code === 'wp_cable_cruise'));
    console.log(`     → 상품: ${r.body.products?.map(p=>p.title).join(', ')}`);
  }

  // ── 4. 관리자 인증 ─────────────────────────────────────────────────
  console.log('\n📋 4. 관리자 인증');
  {
    const r = await get(`${ADMIN}/regions`, {});
    ok('인증 없음 → 401', r.status === 401);
  }

  // ── 5. 파트너 생성 ─────────────────────────────────────────────────
  console.log('\n📋 5. 파트너 생성');
  let partnerId;
  {
    const r = await post(`${ADMIN}/partner`, {
      city_code: 'yeosu', name: '하늘카페 여수', category: 'cafe',
      address: '여수시 돌산읍', lat: 34.7018, lng: 127.7456,
      description: '해상케이블카 근처 오션뷰 카페'
    }, auth);
    ok('POST /partner → 201', r.status === 201, JSON.stringify(r.body));
    ok('partner_id 반환', !!r.body.partner?.id);
    ok('is_active=true', r.body.partner?.is_active === true);
    partnerId = r.body.partner?.id;
  }

  // ── 6. 혜택 추가 ───────────────────────────────────────────────────
  console.log('\n📋 6. 혜택 추가');
  let benefitId;
  {
    const r = await post(`${ADMIN}/benefit`, {
      partner_id:   partnerId,
      benefit_type: 'free',
      title:        '아메리카노 1잔 무료',
      description:  '케이블카 이용권 소지자에 한해 아메리카노 1잔 무료 제공',
      display_copy: '잠깐 쉬어갈 수 있어요 ☕',
      location_hint: '해상케이블카 하차장 도보 3분',
    }, auth);
    ok('POST /benefit → 201', r.status === 201, JSON.stringify(r.body));
    ok('benefit_id 반환', !!r.body.benefit?.id);
    ok('display_copy 저장', r.body.benefit?.display_copy?.includes('쉬어갈'));
    benefitId = r.body.benefit?.id;
  }

  // ── 7. 상품-혜택 연결 ──────────────────────────────────────────────
  console.log('\n📋 7. 상품-혜택 연결');
  let linkId;
  {
    const r = await post(`${ADMIN}/product-benefit`, {
      product_id: productId, benefit_id: benefitId, display_order: 0
    }, auth);
    ok('POST /product-benefit → 201', r.status === 201, JSON.stringify(r.body));
    ok('link_id 반환', !!r.body.link?.id);
    linkId = r.body.link?.id;
  }

  // ── 8. 상품 상세 조회 (혜택 포함) ─────────────────────────────────
  console.log('\n📋 8. 상품 상세 (혜택 자동 포함)');
  {
    const r = await get(`${PUB}/wp_cable_cruise`);
    ok('GET /products/wp_cable_cruise → 200', r.status === 200);
    ok('product 존재', !!r.body.product);
    ok('benefits 배열 존재', Array.isArray(r.body.benefits));
    ok('연결된 혜택 1개', r.body.benefits?.length >= 1, `count=${r.body.benefits?.length}`);
    ok('display_copy 반환', !!r.body.benefits?.[0]?.display_copy);
    ok('location_hint 반환', !!r.body.benefits?.[0]?.location_hint);
    ok('partner 정보 포함', !!r.body.benefits?.[0]?.partner?.name);
    console.log(`     → 혜택: "${r.body.benefits?.[0]?.display_copy}"`);
  }

  // ── 9. 비활성화 → 노출 안됨 ───────────────────────────────────────
  console.log('\n📋 9. 비활성화 → 혜택 노출 안됨');
  {
    await patch(`${ADMIN}/benefit/${benefitId}`, { is_active: false }, auth);
    const r = await get(`${PUB}/wp_cable_cruise`);
    ok('비활성화 후 혜택 0개', r.body.benefits?.length === 0, `count=${r.body.benefits?.length}`);
    // 복원
    await patch(`${ADMIN}/benefit/${benefitId}`, { is_active: true }, auth);
    const r2 = await get(`${PUB}/wp_cable_cruise`);
    ok('재활성화 후 혜택 복원', r2.body.benefits?.length >= 1);
  }

  // ── 10. 지역 추가 ─────────────────────────────────────────────────
  console.log('\n📋 10. 신규 지역 추가 (글로벌 확장 검증)');
  {
    const r = await post(`${ADMIN}/region`, {
      country_code: 'JP', city_code: 'tokyo', city_name: '도쿄', currency: 'JPY'
    }, auth);
    ok('POST /region → 201', r.status === 201, JSON.stringify(r.body));
    ok('city_code=tokyo', r.body.region?.city_code === 'tokyo');
  }

  // ── 11. 연결 해제 ─────────────────────────────────────────────────
  console.log('\n📋 11. 상품-혜택 연결 해제');
  {
    const r = await del(`${ADMIN}/product-benefit/${linkId}`, auth);
    ok('DELETE /product-benefit → 200', r.status === 200);
    const r2 = await get(`${PUB}/wp_cable_cruise`);
    ok('연결 해제 후 혜택 0개', r2.body.benefits?.length === 0);
  }

  console.log('\n' + '═'.repeat(55));
  console.log(`결과: ✅ ${passed}개 통과 / ❌ ${failed}개 실패`);
  if (failed > 0) process.exit(1);
}

main().catch(e => { console.error('❌ 오류:', e.message); process.exit(1); });
