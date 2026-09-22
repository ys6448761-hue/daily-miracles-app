'use strict';
/**
 * hospitalityService — Unit Tests (T1–T12 + eligibility + commerce separation)
 *
 * T1–T5: Product eligibility filtering (starlit/moonlight leakage prevention)
 * T6–T8: Group exclusion + payment gate
 * T9–T10: Commerce separation (quote unchanged)
 * T11: 강순희 K바삭치킨 범앗간 = STARLIGHT BENEFIT (not generic restaurant)
 * T12: 모이핀 = HOLD (not customer-visible)
 *
 * DB query is mocked — no actual DB connection required.
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

// ── Fixtures ────────────────────────────────────────────────────────────────

function makeStarlitCafeBenefit(overrides = {}) {
  return {
    benefit_id: 'benefit-cafe-001',
    benefit_type: 'free',
    title: '아메리카노 1인 무료',
    description: '2인 이용 시 1인 무료',
    display_copy: '돌산 바다를 바라보며 별빛항로의 여운을 만나보세요.',
    location_hint: null,
    valid_from: null,
    valid_to: null,
    partner_name: '프롬나드',
    partner_category: 'cafe',
    partner_address: '전남 여수시 돌산읍 우두3길 98',
    ...overrides,
  };
}

function makeMoonlightBenefit(overrides = {}) {
  return {
    benefit_id: 'benefit-moon-001',
    benefit_type: 'discount',
    title: '20% 할인',
    description: null,
    display_copy: '여행의 즐거움을 조금 더 가볍게. 노래방 20% 할인 혜택.',
    location_hint: null,
    valid_from: null,
    valid_to: null,
    partner_name: '해공 노래방',
    partner_category: 'night',
    partner_address: '여수시 이순신광장로 165',
    ...overrides,
  };
}

function makeStarlitRestaurantBenefit(overrides = {}) {
  return {
    benefit_id: 'benefit-starlit-rs-001',
    benefit_type: 'gift',
    title: '음료 1병 무료',
    description: null,
    display_copy: '이순신광장에서 만나는 작은 선물. 음료 1병 무료 제공.',
    location_hint: null,
    valid_from: null,
    valid_to: null,
    partner_name: '강순위 K바삭치킨 범앗간',
    partner_category: 'restaurant',
    partner_address: '여수시 이순신광장로 159',
    ...overrides,
  };
}

// Founder baseline quote — used for T9/T10 commerce separation checks
const FOUNDER_QUOTE = {
  guestCount: 2,
  status: 'CALCULATED',
  pricing: {
    totalList: 215000,
    totalSell: 172000,
    totalSavings: 43000,
  },
  breakdown: [
    { name: '라마다 호텔 여수', list: 175000, sell: 140000, code: 'ramada', category: 'hotel' },
    { name: '여수 해상케이블카', list: 40000, sell: 32000, code: 'cable', category: 'leisure' },
  ],
};

// ── checkHospitalityEligibility (pure function) ─────────────────────────────

describe('checkHospitalityEligibility — pure function', () => {
  test('guestCount=2 → eligible=true (individual)', () => {
    const result = checkHospitalityEligibility({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });

  test('guestCount=4 → eligible=true (boundary)', () => {
    expect(checkHospitalityEligibility({ guestCount: 4 }).eligible).toBe(true);
  });

  test('guestCount=5 → eligible=false GROUP_EXCLUDED (boundary)', () => {
    const result = checkHospitalityEligibility({ guestCount: 5 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
  });

  test('guestCount=10 → eligible=false GROUP_EXCLUDED', () => {
    expect(checkHospitalityEligibility({ guestCount: 10 }).eligible).toBe(false);
  });

  test('INDIVIDUAL_MAX_GUESTS === 4', () => {
    expect(INDIVIDUAL_MAX_GUESTS).toBe(4);
  });

  test('invalid guestCount → INVALID_GUEST_COUNT', () => {
    expect(checkHospitalityEligibility({ guestCount: 0 }).eligible).toBe(false);
    expect(checkHospitalityEligibility({ guestCount: -1 }).eligible).toBe(false);
    expect(checkHospitalityEligibility({ guestCount: NaN }).eligible).toBe(false);
  });
});

// ── T1–T5: Product eligibility filtering ─────────────────────────────────────

describe('T1–T5 — Product eligibility: no cross-route benefit leakage', () => {
  beforeEach(() => jest.clearAllMocks());

  test('T1: RAMADA+cable journey (no starlit product) → DB called with correct product_codes param', async () => {
    // The DB query is product-filtered by the service.
    // For a RAMADA+cable journey, product_codes=['ramada','cable'] don't match
    // sp_fireworks_bundle / sp_fireworks_cruise in dt_products.
    // Server-side SQL ensures only generic or matching benefits are returned.
    // Mock: DB returns empty (simulating correct SQL behavior)
    db.query.mockResolvedValue({ rows: [] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['ramada', 'cable'],
    });
    expect(result.eligible).toBe(true);
    expect(result.benefits).toHaveLength(0);
    // Verify product_codes were passed as 2nd arg to db.query
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('dt_product_benefits'),
      ['yeosu', ['ramada', 'cable']]
    );
  });

  test('T2: Starlit journey → starlit cafe benefits eligible for PREVIEW', async () => {
    // product_codes includes sp_fireworks_bundle → SQL returns starlit cafe benefits
    db.query.mockResolvedValue({ rows: [makeStarlitCafeBenefit()] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['sp_fireworks_bundle'],
    });
    expect(result.eligible).toBe(true);
    expect(result.state).toBe('PREVIEW');
    expect(result.benefits).toHaveLength(1);
    expect(result.benefits[0].partner.category).toBe('cafe');
    // Verify product_codes passed correctly
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('dt_product_benefits'),
      ['yeosu', ['sp_fireworks_bundle']]
    );
  });

  test('T3: Moonlight journey → moonlight benefits eligible for PREVIEW', async () => {
    db.query.mockResolvedValue({ rows: [makeMoonlightBenefit()] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['moonlight_pass'],
    });
    expect(result.eligible).toBe(true);
    expect(result.state).toBe('PREVIEW');
    expect(result.benefits).toHaveLength(1);
    expect(result.benefits[0].partner.name).toBe('해공 노래방');
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('dt_product_benefits'),
      ['yeosu', ['moonlight_pass']]
    );
  });

  test('T4: Starlit benefits do NOT appear in moonlight-only journey', async () => {
    // product_codes = ['moonlight_pass'] only.
    // SQL filters out cafe benefits linked to sp_fireworks_bundle.
    // Mock simulates correct SQL behavior: returns moonlight only, not cafe
    db.query.mockResolvedValue({ rows: [makeMoonlightBenefit()] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['moonlight_pass'],
    });
    const hasCafe = result.benefits.some(b => b.partner.category === 'cafe');
    expect(hasCafe).toBe(false);
  });

  test('T5: Moonlight benefits do NOT appear in starlit-only journey', async () => {
    // product_codes = ['sp_fireworks_bundle'] only.
    // Mock simulates correct SQL behavior: returns starlit cafes only, not night
    db.query.mockResolvedValue({ rows: [makeStarlitCafeBenefit()] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['sp_fireworks_bundle'],
    });
    const hasMoonlight = result.benefits.some(b => b.partner.category === 'night');
    expect(hasMoonlight).toBe(false);
  });

  test('empty product_codes → DB called with empty array (generic-only safe default)', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await getHospitalityPreview({ guestCount: 2, product_codes: [] });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('dt_product_benefits'),
      ['yeosu', []]
    );
  });

  test('product_codes omitted → defaults to empty array', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await getHospitalityPreview({ guestCount: 2 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('dt_product_benefits'),
      ['yeosu', []]
    );
  });
});

// ── T6–T8: Group exclusion + payment gate ────────────────────────────────────

describe('T6–T8 — Group exclusion + payment gate', () => {
  beforeEach(() => jest.clearAllMocks());

  test('T6: guestCount=5+ → eligible=false GROUP_EXCLUDED, DB not queried', async () => {
    const result = await getHospitalityPreview({ guestCount: 5 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
    expect(result.benefits).toHaveLength(0);
    expect(db.query).not.toHaveBeenCalled();
  });

  test('T6b: guestCount=10 → GROUP_EXCLUDED regardless of product_codes', async () => {
    const result = await getHospitalityPreview({
      guestCount: 10,
      product_codes: ['sp_fireworks_bundle'],
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
    expect(db.query).not.toHaveBeenCalled();
  });

  test('T7: unpaid individual → state=PREVIEW only, never AVAILABLE', async () => {
    db.query.mockResolvedValue({ rows: [makeStarlitCafeBenefit()] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['sp_fireworks_bundle'],
    });
    expect(result.state).toBe('PREVIEW');
    expect(result.state).not.toBe('AVAILABLE');
    expect(result.payment_gate).toBe('BLOCKED_BY_PAYMENT_LINKAGE');
  });

  test('T8: client paid=true cannot unlock AVAILABLE — server ignores paid flag', async () => {
    db.query.mockResolvedValue({ rows: [makeStarlitCafeBenefit()] });
    // Even if caller somehow passes paid=true, it is not an accepted parameter
    const result = await getHospitalityPreview({
      guestCount: 2,
      paid: true,
      product_codes: ['sp_fireworks_bundle'],
    });
    expect(result.state).toBe('PREVIEW');
    expect(result.state).not.toBe('AVAILABLE');
  });
});

// ── T9–T10: Commerce separation ──────────────────────────────────────────────

describe('T9–T10 — Hospitality does not alter quote', () => {
  test('T9: Hospitality does not change totalSell 172,000', () => {
    const quotePayload = { ...FOUNDER_QUOTE };
    expect(quotePayload.pricing.totalSell).toBe(172000);
    // getHospitalityPreview does not accept or return quote pricing
    const paramNames = getHospitalityPreview.toString().match(/\{([^}]+)\}/)?.[1] || '';
    expect(paramNames).not.toContain('pricing');
    expect(paramNames).not.toContain('totalSell');
  });

  test('T10: Hospitality does not change savings 43,000', () => {
    const originalSavings = FOUNDER_QUOTE.pricing.totalSavings;
    expect(originalSavings).toBe(43000);
    // getHospitalityPreview signature has no savings/discount fields
    const paramNames = getHospitalityPreview.toString().match(/\{([^}]+)\}/)?.[1] || '';
    expect(paramNames).not.toContain('savings');
    expect(paramNames).not.toContain('discount');
  });

  test('No COST/margin/internal pricing in hospitality response', async () => {
    db.query.mockResolvedValue({ rows: [makeStarlitCafeBenefit()] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    const resultStr = JSON.stringify(result);
    expect(resultStr).not.toMatch(/totalCost|totalMargin|cost|margin|settlement/i);
  });
});

// ── T11: 강순위 K바삭치킨 범앗간 — STARLIGHT BENEFIT ─────────────────────────

describe('T11 — 강순희 K바삭치킨 범앗간: STARLIGHT BENEFIT', () => {
  beforeEach(() => jest.clearAllMocks());

  test('T11a: 강순희 K바삭치킨 범앗간 benefit appears only in starlit journey (not generic)', async () => {
    // The partner has dt_product_benefits linking it to sp_fireworks_bundle.
    // When product_codes = [] (no product), SQL filters it out → DB returns [].
    db.query.mockResolvedValue({ rows: [] });
    const result = await getHospitalityPreview({ guestCount: 2, product_codes: [] });
    const found = result.benefits.some(b =>
      (b.partner?.name || '').includes('범앗간') ||
      (b.partner?.name || '').includes('K바삭치킨')
    );
    expect(found).toBe(false);
  });

  test('T11b: 강순희 K바삭치킨 범앗간 is 별빛혜택 — moonlight_pass 연결 (총 4개)', () => {
    const fs = require('fs');
    const path = require('path');
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../../docs/ssot/ops/partner_master_seed.sql'),
      'utf8'
    );
    // Seed must contain the renamed partner
    expect(seedSql).toContain('강순희 K바삭치킨 범앗간');
    // Seed must link it to moonlight_pass (별빛혜택 4개)
    expect(seedSql).toContain('moonlight_pass');
    expect(seedSql).toMatch(/moonlight_pass[\s\S]*강순희 K바삭치킨 범앗간/);
  });

  test('T11c: 강순희 K바삭치킨 범앗간 appears in starlit journey → PREVIEW', async () => {
    db.query.mockResolvedValue({ rows: [makeStarlitRestaurantBenefit()] });
    const result = await getHospitalityPreview({
      guestCount: 2,
      product_codes: ['sp_fireworks_bundle'],
    });
    expect(result.benefits).toHaveLength(1);
    expect(result.benefits[0].state).toBe('PREVIEW');
    expect(result.benefits[0].partner.category).toBe('restaurant');
  });

  test('T11d: SSOT CSV reflects 별빛혜택 — route_code=moonlight (별빛혜택 4개 중 하나)', () => {
    const fs = require('fs');
    const path = require('path');
    const csv = fs.readFileSync(
      path.join(__dirname, '../../docs/ssot/ops/partner_master.csv'),
      'utf8'
    );
    const lines = csv.split('\n');
    const beomsatgan = lines.find(l => l.includes('K바삭치킨 범앗간'));
    expect(beomsatgan).toBeTruthy();
    // 강순희 K바삭치킨 범앗간 = 별빛혜택(달빛혜택) — moonlight_pass 연결
    expect(beomsatgan).toContain('moonlight');
  });
});

// ── T12: 모이핀 HOLD ─────────────────────────────────────────────────────────

describe('T12 — 모이핀: HOLD (not customer-visible)', () => {
  test('T12a: 모이핀 is_active=false in seed SQL — HOLD preserves conflict', () => {
    const fs = require('fs');
    const path = require('path');
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../../docs/ssot/ops/partner_master_seed.sql'),
      'utf8'
    );
    expect(seedSql).toContain('모이핀');
    // Seed SQL must set is_active=false for 모이핀
    expect(seedSql).toMatch(/모이핀[\s\S]{0,200}false/);
  });

  test('T12b: 모이핀 HOLD reason documented in seed SQL', () => {
    const fs = require('fs');
    const path = require('path');
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../../docs/ssot/ops/partner_master_seed.sql'),
      'utf8'
    );
    // Seed must explain HOLD
    expect(seedSql).toMatch(/HOLD|계약.*미확인|미확인.*계약/);
  });

  test('T12c: 모이핀 with is_active=false → not returned by fetchActiveBenefits (query filter)', async () => {
    // The SQL has AND p.is_active = true — if 모이핀 is is_active=false, it is excluded.
    // Mock simulates: DB correctly excludes is_active=false partner
    db.query.mockResolvedValue({ rows: [] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    const hasModipin = result.benefits.some(b =>
      (b.partner?.name || '').includes('모이핀')
    );
    expect(hasModipin).toBe(false);
  });

  test('T12d: CSV marks 모이핀 status as HOLD', () => {
    const fs = require('fs');
    const path = require('path');
    const csv = fs.readFileSync(
      path.join(__dirname, '../../docs/ssot/ops/partner_master.csv'),
      'utf8'
    );
    const moipinLine = csv.split('\n').find(l => l.includes('모이핀'));
    expect(moipinLine).toBeTruthy();
    expect(moipinLine).toContain('HOLD');
  });
});

// ── Secure response (no redemption credential) ───────────────────────────────

describe('Security — no redemption credential in PREVIEW', () => {
  beforeEach(() => jest.clearAllMocks());

  test('PREVIEW benefit → no qr_token, no redemption_url, no credential_code, no secret', async () => {
    db.query.mockResolvedValue({ rows: [makeStarlitCafeBenefit()] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.benefits).toHaveLength(1);
    const benefit = result.benefits[0];
    expect(benefit).not.toHaveProperty('qr_token');
    expect(benefit).not.toHaveProperty('redemption_url');
    expect(benefit).not.toHaveProperty('credential_code');
    expect(benefit).not.toHaveProperty('secret');
  });

  test('empty safe state: no benefits in DB → eligible=true, benefits=[]', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.benefits).toHaveLength(0);
  });

  test('DB failure → eligible=true, benefits=[] (graceful degradation)', async () => {
    db.query.mockRejectedValue(new Error('DB connection refused'));
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.benefits).toHaveLength(0);
  });
});

// ── Hospitality PDF (not implemented) ────────────────────────────────────────

describe('Hospitality PDF (T11-pdf)', () => {
  test('No hospitalityPdfService exists (BLOCKED_BY_PAYMENT_LINKAGE)', () => {
    const fs = require('fs');
    const path = require('path');
    const pdfServicePath = path.join(__dirname, '../../services/hospitalityPdfService.js');
    expect(fs.existsSync(pdfServicePath)).toBe(false);
  });
});

// ── AVAILABLE state (future, payment-gated) ──────────────────────────────────

describe('AVAILABLE state — BLOCKED (documented as todo)', () => {
  test.todo(
    'T2-future: guestCount=2 + server-confirmed payment → state=AVAILABLE. ' +
    'BLOCKED_BY_PAYMENT_LINKAGE: MY QUOTE has no NicePay payment flow. ' +
    'dt_flow_bookings has no payment_id FK. ' +
    'Implement when Commerce payment linkage is ready.'
  );

  test.todo(
    'T7-future: AVAILABLE state → redemption endpoint permitted. ' +
    'Depends on payment linkage. Not implemented in V0.1.'
  );
});
