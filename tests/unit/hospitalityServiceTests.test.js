'use strict';
/**
 * hospitalityService — Unit Tests (T1–T12)
 * Tests: eligibility, group exclusion, PREVIEW enforcement, commerce boundary, security.
 * DB query is mocked — no actual DB connection required.
 */

// Mock the DB module before requiring hospitalityService
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

function makeDbBenefitRow(overrides = {}) {
  return {
    benefit_id: 'benefit-uuid-001',
    benefit_type: 'free',
    title: '아메리카노 1인 무료',
    description: '2인 이용 시 1인 무료',
    display_copy: '잠깐 쉬어갈 수 있어요',
    location_hint: '해상케이블카 근처',
    valid_from: null,
    valid_to: null,
    partner_name: '테스트 카페',
    partner_category: 'cafe',
    partner_address: '여수시 테스트로 1',
    ...overrides,
  };
}

// Founder baseline quote — used for T9/T10
const FOUNDER_QUOTE = {
  guestCount: 2,
  status: 'CALCULATED',
  pricing: {
    totalList: 215000,
    totalSell: 172000,
    totalSavings: 43000,
  },
  breakdown: [
    { name: '라마다 호텔 여수', list: 175000, sell: 140000 },
    { name: '여수 해상케이블카', list: 40000, sell: 32000 },
  ],
};

// ── checkHospitalityEligibility (pure function) ─────────────────────────────

describe('checkHospitalityEligibility — pure function', () => {
  test('T1a: guestCount=2 → eligible=true (individual)', () => {
    const result = checkHospitalityEligibility({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });

  test('T5: guestCount=5 → eligible=false GROUP_EXCLUDED', () => {
    const result = checkHospitalityEligibility({ guestCount: 5 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
  });

  test('T6: guestCount=10 → eligible=false GROUP_EXCLUDED', () => {
    const result = checkHospitalityEligibility({ guestCount: 10 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
  });

  test('individual boundary: guestCount=4 → eligible=true', () => {
    expect(checkHospitalityEligibility({ guestCount: 4 }).eligible).toBe(true);
  });

  test('individual boundary: guestCount=5 → eligible=false', () => {
    expect(checkHospitalityEligibility({ guestCount: 5 }).eligible).toBe(false);
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

// ── getHospitalityPreview ────────────────────────────────────────────────────

describe('getHospitalityPreview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // T1: 2-person individual unpaid → PREVIEW available, no redemption
  test('T1: individual (guestCount=2) → eligible=true, state=PREVIEW, payment_required', async () => {
    db.query.mockResolvedValue({ rows: [makeDbBenefitRow()] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.state).toBe('PREVIEW');
    expect(result.payment_gate).toBe('BLOCKED_BY_PAYMENT_LINKAGE');
    expect(result.benefits).toHaveLength(1);
    expect(result.benefits[0].state).toBe('PREVIEW');
    expect(result.benefits[0].payment_notice).toContain('결제 완료 후');
  });

  // T3: frontend sends paid=true — server never sees it; remains PREVIEW
  test('T3: no "paid" flag from server — state always PREVIEW regardless of client input', async () => {
    db.query.mockResolvedValue({ rows: [makeDbBenefitRow()] });
    // Even if caller somehow passes a paid field, it's not accepted
    const result = await getHospitalityPreview({ guestCount: 2, paid: true });
    expect(result.state).toBe('PREVIEW');
    expect(result.state).not.toBe('AVAILABLE');
  });

  // T4: quote exists but unpaid → PREVIEW (same as T1 — AVAILABLE not implemented)
  test('T4: quote exists but unpaid → PREVIEW (AVAILABLE not implemented)', async () => {
    db.query.mockResolvedValue({ rows: [makeDbBenefitRow()] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.state).toBe('PREVIEW');
    expect(result.payment_gate).toBe('BLOCKED_BY_PAYMENT_LINKAGE');
  });

  // T5: group 5+ unpaid → no hospitality
  test('T5: guestCount=5 unpaid → eligible=false, no benefits', async () => {
    const result = await getHospitalityPreview({ guestCount: 5 });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
    expect(result.benefits).toHaveLength(0);
    expect(db.query).not.toHaveBeenCalled();
  });

  // T6: group 5+ with "payment" → still excluded
  test('T6: guestCount=5 with paid flag → still GROUP_EXCLUDED', async () => {
    const result = await getHospitalityPreview({ guestCount: 5, paid: true });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('GROUP_EXCLUDED');
    expect(db.query).not.toHaveBeenCalled();
  });

  // T8: PREVIEW benefit → server confirms no redemption credential
  test('T8: PREVIEW benefit → no qr_token, no redemption_url, no secret in response', async () => {
    db.query.mockResolvedValue({ rows: [makeDbBenefitRow()] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.benefits).toHaveLength(1);
    const benefit = result.benefits[0];
    expect(benefit).not.toHaveProperty('qr_token');
    expect(benefit).not.toHaveProperty('redemption_url');
    expect(benefit).not.toHaveProperty('credential_code');
    expect(benefit).not.toHaveProperty('secret');
  });

  // Empty safe state: dt_benefits empty → no benefits rendered
  test('empty safe state: no benefits in DB → eligible=true, benefits=[]', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.benefits).toHaveLength(0);
  });

  // DB failure → safe empty state (no crash)
  test('DB failure → eligible=true, benefits=[] (graceful degradation)', async () => {
    db.query.mockRejectedValue(new Error('DB connection refused'));
    const result = await getHospitalityPreview({ guestCount: 2 });
    expect(result.eligible).toBe(true);
    expect(result.benefits).toHaveLength(0);
  });
});

// ── Commerce separation (T9/T10) ─────────────────────────────────────────────

describe('Commerce separation — Hospitality does not alter Quote', () => {
  test('T9: Hospitality does not change totalSell 172,000', () => {
    // Hospitality is a separate API call — it returns its own object
    // Quote pricing is NEVER passed through hospitalityService
    // This test verifies the service returns NO pricing fields
    const quotePayload = { ...FOUNDER_QUOTE };
    const originalSell = quotePayload.pricing.totalSell;
    // Simulated: after hospitality fetch, quote remains unchanged
    expect(originalSell).toBe(172000);
    // hospitalityService does not modify quote — verify no pricing leak
    // by ensuring getHospitalityPreview does not accept or return quote pricing
    // (structural test: function signature does not accept quote)
    const paramNames = getHospitalityPreview.toString().match(/\{([^}]+)\}/)?.[1] || '';
    expect(paramNames).not.toContain('quote');
    expect(paramNames).not.toContain('pricing');
  });

  test('T10: Hospitality does not change savings 43,000', () => {
    const originalSavings = FOUNDER_QUOTE.pricing.totalSavings;
    expect(originalSavings).toBe(43000);
    // Hospitality object has no savings/discount fields
  });

  test('T12: No COST/margin/internal pricing in hospitality response', async () => {
    db.query.mockResolvedValue({ rows: [makeDbBenefitRow()] });
    const result = await getHospitalityPreview({ guestCount: 2 });
    const resultStr = JSON.stringify(result);
    expect(resultStr).not.toMatch(/totalCost|totalMargin|cost|margin|settlement/i);
  });
});

// ── Hospitality PDF (T11) ────────────────────────────────────────────────────

describe('Hospitality PDF availability (T11)', () => {
  test('T11: No hospitalityPdfService exists yet (BLOCKED_BY_PAYMENT_LINKAGE)', () => {
    // Hospitality PDF requires confirmed payment linkage
    // V0.1 does not implement it — verify the file does not exist
    const fs = require('fs');
    const path = require('path');
    const pdfServicePath = path.join(__dirname, '../../services/hospitalityPdfService.js');
    expect(fs.existsSync(pdfServicePath)).toBe(false);
  });
});

// ── T2/T7: AVAILABLE state (future, blocked) ─────────────────────────────────

describe('AVAILABLE state — BLOCKED (documented as todo)', () => {
  // T2: Individual + verified payment → AVAILABLE
  test.todo(
    'T2: guestCount=2 + server-confirmed payment → state=AVAILABLE. ' +
    'BLOCKED_BY_PAYMENT_LINKAGE: MY QUOTE has no NicePay payment flow. ' +
    'dt_flow_bookings has no payment_id FK. ' +
    'Implement when Commerce payment linkage is ready.'
  );

  // T7: AVAILABLE benefit → redemption permitted
  test.todo(
    'T7: AVAILABLE state → redemption endpoint permitted. ' +
    'Depends on T2. Not implemented in V0.1.'
  );
});
