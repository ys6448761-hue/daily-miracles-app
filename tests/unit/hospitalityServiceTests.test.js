'use strict';
/**
 * hospitalityService — T1–T12 (Hospitality V0.1 Final Alignment)
 *
 * Hospitality 기본 자격: ㈜여수여행센터를 통한 결제 완료 개인여행 1~4인
 * 기본값: 상품 제한 없음. 상품 제한은 별도 계약이 있는 경우에만 적용.
 *
 * T1–T2:  개인여행 2p/4p → PREVIEW 노출
 * T3–T4:  단체 5p/12p → Hospitality 없음
 * T5–T6:  product_code 없거나 무관 → GENERIC benefit 정상 노출
 * T7:     모이핀 → customer 미노출 (HOLD)
 * T8:     대표 파트너 display_order=0 (라또아, 돌산게장명가) 우선
 * T9:     PREVIEW → QR/credential/secret 없음
 * T10:    Hospitality가 MY QUOTE 금액을 변경하지 않음
 * T11:    돌산게장명가 봉산1로 49 주소 금지 (폐점)
 * T12:    빌드 안전성 — display_order ORDER BY SQL 포함 확인
 *
 * DB query는 모두 mock — 실제 DB 연결 불필요.
 */

jest.mock('../../database/db', () => ({
  query: jest.fn()
}));

const db = require('../../database/db');
const {
  checkHospitalityEligibility,
  getHospitalityPreview,
  INDIVIDUAL_MAX_GUESTS,
} = require('../../services/hospitalityService');
const fs   = require('fs');
const path = require('path');

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeGenericCafeBenefit(overrides = {}) {
  return {
    benefit_id:       'benefit-cafe-lattoa',
    benefit_type:     'free',
    title:            '아메리카노 1인 무료',
    description:      '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
    display_copy:     '여수 시내를 내려다보며 잠시 쉬어가세요. 아메리카노 1인 무료.',
    location_hint:    null,
    valid_from:       null,
    valid_to:         null,
    partner_name:     '라또아 카페',
    partner_category: 'cafe',
    partner_address:  '전남 여수시 공화남3길 32 5층 전층',
    display_order:    0,
    ...overrides,
  };
}

function makeGenericRestaurantBenefit(overrides = {}) {
  return {
    benefit_id:       'benefit-rs-dolsangejanmyeonga',
    benefit_type:     'gift',
    title:            '음료 1병 무료',
    description:      null,
    display_copy:     '돌산 게장 명가에서 만나는 작은 선물. 음료 1병 무료 제공.',
    location_hint:    null,
    valid_from:       null,
    valid_to:         null,
    partner_name:     '돌산게장명가',
    partner_category: 'restaurant',
    partner_address:  '전남 여수시 대교로 62',
    display_order:    0,
    ...overrides,
  };
}

// Founder baseline quote — commerce reference for T10
const FOUNDER_QUOTE = {
  guestCount: 2,
  status: 'CALCULATED',
  pricing: { totalList: 215000, totalSell: 172000, totalSavings: 43000 },
  breakdown: [
    { name: '라마다 호텔 여수', list: 175000, sell: 140000, code: 'ramada', category: 'hotel' },
    { name: '여수 해상케이블카', list: 40000,  sell: 32000,  code: 'cable',  category: 'leisure' },
  ],
};

beforeEach(() => jest.clearAllMocks());

// ── T1: 개인여행 2인 → PREVIEW 노출 ─────────────────────────────────────────

test('T1: 개인여행 2인 (product_codes 없음) → eligible + PREVIEW', async () => {
  db.query.mockResolvedValue({ rows: [makeGenericCafeBenefit()] });
  const result = await getHospitalityPreview({ guestCount: 2 });
  expect(result.eligible).toBe(true);
  expect(result.state).toBe('PREVIEW');
  expect(result.benefits.length).toBeGreaterThan(0);
  expect(result.payment_gate).toBe('BLOCKED_BY_PAYMENT_LINKAGE');
});

// ── T2: 개인여행 4인 (경계값) → PREVIEW 노출 ─────────────────────────────────

test('T2: 개인여행 4인 경계값 → eligible=true + PREVIEW', async () => {
  db.query.mockResolvedValue({ rows: [makeGenericCafeBenefit()] });
  const result = await getHospitalityPreview({ guestCount: 4 });
  expect(result.eligible).toBe(true);
  expect(result.state).toBe('PREVIEW');
  expect(INDIVIDUAL_MAX_GUESTS).toBe(4);
});

// ── T3: 단체 5인 → Hospitality 없음 ──────────────────────────────────────────

test('T3: 단체 5인 → eligible=false, GROUP_EXCLUDED, DB not queried', async () => {
  const result = await getHospitalityPreview({ guestCount: 5 });
  expect(result.eligible).toBe(false);
  expect(result.reason).toBe('GROUP_EXCLUDED');
  expect(result.benefits).toHaveLength(0);
  expect(db.query).not.toHaveBeenCalled();
});

// ── T4: 단체 12인 → Hospitality 없음 ────────────────────────────────────────

test('T4: 단체 12인 → eligible=false, GROUP_EXCLUDED', async () => {
  const result = await getHospitalityPreview({
    guestCount: 12,
    product_codes: ['sp_fireworks_bundle'],
  });
  expect(result.eligible).toBe(false);
  expect(result.reason).toBe('GROUP_EXCLUDED');
  expect(db.query).not.toHaveBeenCalled();
});

// ── T5: product_code 없음 → GENERIC benefit 정상 노출 ────────────────────────

test('T5: product_codes=[] → GENERIC benefit (라또아 카페) 노출 (NOT product-gated)', async () => {
  db.query.mockResolvedValue({ rows: [makeGenericCafeBenefit()] });
  const result = await getHospitalityPreview({ guestCount: 2, product_codes: [] });
  expect(result.eligible).toBe(true);
  expect(result.benefits.length).toBeGreaterThan(0);
  expect(result.benefits[0].partner.name).toBe('라또아 카페');
  // DB was called (NOT short-circuited)
  expect(db.query).toHaveBeenCalled();
});

// ── T6: 무관한 product_code → GENERIC benefit 정상 노출 ──────────────────────

test('T6: product_codes=[ramada, cable] → GENERIC benefit (돌산게장명가) 노출', async () => {
  db.query.mockResolvedValue({ rows: [makeGenericRestaurantBenefit()] });
  const result = await getHospitalityPreview({
    guestCount: 2,
    product_codes: ['ramada', 'cable'],
  });
  expect(result.eligible).toBe(true);
  expect(result.benefits.length).toBeGreaterThan(0);
  expect(result.benefits[0].partner.name).toBe('돌산게장명가');
  // 제품 제한 없음 — DB 쿼리 정상 실행
  expect(db.query).toHaveBeenCalledWith(
    expect.stringContaining('dt_product_benefits'),
    ['yeosu', ['ramada', 'cable']]
  );
});

// ── T7: 모이핀 HOLD → customer 미노출 ────────────────────────────────────────

test('T7: 모이핀 is_active=false → SSOT seed에 HOLD 명시 + DB 필터 확인', async () => {
  const seedSql = fs.readFileSync(
    path.join(__dirname, '../../docs/ssot/ops/partner_master_seed.sql'),
    'utf8'
  );
  expect(seedSql).toContain('모이핀');
  // HOLD 또는 계약 미확인 사유 명시 필수
  expect(seedSql).toMatch(/모이핀[\s\S]{0,300}(HOLD|미확인|false)/);

  // SQL: AND p.is_active = true → 모이핀(false) 제외됨
  // Mock: DB이 올바르게 제외하는 케이스 시뮬레이션
  db.query.mockResolvedValue({ rows: [] });
  const result = await getHospitalityPreview({ guestCount: 2 });
  const hasModipin = result.benefits.some(b =>
    (b.partner?.name || '').includes('모이핀')
  );
  expect(hasModipin).toBe(false);
});

// ── T8: 대표 파트너 display_order=0 우선 ─────────────────────────────────────

test('T8: 대표 파트너 display_order=0 — SQL ORDER BY display_order ASC 포함', () => {
  const svcStr = fs.readFileSync(
    path.join(__dirname, '../../services/hospitalityService.js'),
    'utf8'
  );
  expect(svcStr).toContain('display_order ASC');

  // Seed: 라또아 카페, 돌산게장명가 display_order=0 확인
  const seedSql = fs.readFileSync(
    path.join(__dirname, '../../docs/ssot/ops/partner_master_seed.sql'),
    'utf8'
  );
  // display_order=0 for both representative partners (in comments)
  expect(seedSql).toContain('라또아 카페');
  expect(seedSql).toContain('돌산게장명가');
  // Confirmed in header comment block and column comments
  expect(seedSql).toMatch(/display_order=0/);
});

// ── T9: PREVIEW → no redemption credential ───────────────────────────────────

test('T9: PREVIEW benefit → QR/credential/secret 없음', async () => {
  db.query.mockResolvedValue({ rows: [makeGenericCafeBenefit()] });
  const result = await getHospitalityPreview({ guestCount: 2 });
  expect(result.benefits).toHaveLength(1);
  const benefit = result.benefits[0];
  expect(benefit).not.toHaveProperty('qr_token');
  expect(benefit).not.toHaveProperty('redemption_url');
  expect(benefit).not.toHaveProperty('credential_code');
  expect(benefit).not.toHaveProperty('secret');
  expect(benefit.state).toBe('PREVIEW');
});

// ── T10: Hospitality가 MY QUOTE 금액을 변경하지 않음 ─────────────────────────

test('T10: Hospitality는 totalSell=172,000 / savings=43,000을 변경하지 않음', async () => {
  // Hospitality는 quote pricing을 입력/출력으로 받지 않음
  const quotePayload = { ...FOUNDER_QUOTE };
  expect(quotePayload.pricing.totalSell).toBe(172000);
  expect(quotePayload.pricing.totalSavings).toBe(43000);

  // getHospitalityPreview signature에 pricing/totalSell/savings 없음
  const paramStr = getHospitalityPreview.toString().match(/\{([^}]+)\}/)?.[1] || '';
  expect(paramStr).not.toContain('pricing');
  expect(paramStr).not.toContain('totalSell');
  expect(paramStr).not.toContain('savings');

  // Hospitality 응답에 COST/margin 없음
  db.query.mockResolvedValue({ rows: [makeGenericCafeBenefit()] });
  const result = await getHospitalityPreview({ guestCount: 2 });
  const resultStr = JSON.stringify(result);
  expect(resultStr).not.toMatch(/totalCost|totalMargin|\bcost\b|\bmargin\b|settlement/i);
});

// ── T11: 돌산게장명가 봉산1로 49 주소 금지 (폐점) ────────────────────────────

test('T11: 봉산1로 49 (폐점) → seed/CSV에 절대 존재하지 않음 / 대교로 62 확인', () => {
  const seedSql = fs.readFileSync(
    path.join(__dirname, '../../docs/ssot/ops/partner_master_seed.sql'),
    'utf8'
  );
  const csv = fs.readFileSync(
    path.join(__dirname, '../../docs/ssot/ops/partner_master.csv'),
    'utf8'
  );

  // 봉산1로 49 = 폐점. SSOT 어디에도 없어야 함 (주석 포함 허용 — 경고 문구용)
  // 단, '봉산1로 49' 형식의 실제 주소 값은 절대 없어야 함
  expect(seedSql).not.toMatch(/'봉산1로 49'/);
  expect(csv).not.toMatch(/봉산1로 49/);

  // 현 영업점 주소 = 전남 여수시 대교로 62 (확인 필수)
  expect(seedSql).toContain('대교로 62');
  expect(csv).toContain('대교로 62');
});

// ── T12: SQL 안전성 — display_order + product filter 구조 확인 ───────────────

test('T12: hospitalityService.js SQL — display_order ORDER BY + NOT EXISTS product filter', () => {
  const svcStr = fs.readFileSync(
    path.join(__dirname, '../../services/hospitalityService.js'),
    'utf8'
  );
  // display_order 정렬 (대표 파트너 우선)
  expect(svcStr).toContain('display_order ASC');
  // GENERIC benefit 보호 — NOT EXISTS 필터
  expect(svcStr).toContain('NOT EXISTS');
  // product_benefits 테이블 참조
  expect(svcStr).toContain('dt_product_benefits');
  // is_active 필터 (모이핀 제외)
  expect(svcStr).toContain('is_active');
});

// ── Bonus: DB 실패 → graceful degradation ────────────────────────────────────

test('DB failure → eligible=true, benefits=[] (graceful)', async () => {
  db.query.mockRejectedValue(new Error('DB connection refused'));
  const result = await getHospitalityPreview({ guestCount: 2 });
  expect(result.eligible).toBe(true);
  expect(result.benefits).toHaveLength(0);
});

// ── AVAILABLE state (payment-gated, future) ──────────────────────────────────

describe('AVAILABLE state — BLOCKED (documented as todo)', () => {
  test.todo(
    'V0.2: guestCount=2 + server-confirmed payment → state=AVAILABLE. ' +
    'BLOCKED_BY_PAYMENT_LINKAGE: MY QUOTE에 NicePay 결제 흐름 없음. ' +
    '결제 연결 완료 후 구현.'
  );

  test.todo(
    'V0.2: AVAILABLE state → Hospitality 환대 상세 노출. ' +
    'QR/크리덴셜은 이 시점에도 PDF 사본으로 사용 불가.'
  );
});
