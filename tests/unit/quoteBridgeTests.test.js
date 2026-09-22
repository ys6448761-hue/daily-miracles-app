'use strict';
/**
 * MY ROUTE → MY QUOTE Bridge Tests
 *
 * Tests the minimum bridge in soyeowoolService that invokes quoteEngine
 * after travel intelligence returns. Real quoteEngine/quotePriceData used —
 * prices are NOT hardcoded in assertions but validated against engine output.
 *
 * TEST 1 — Direct first quote: 2인/RAMADA/cable/2026-10-17 (sat)
 * TEST 2 — Hotel change: KENNY instead of RAMADA (same date/guests)
 * TEST 3 — Product removal: RAMADA only, no cable
 * TEST 4 — Complex group hotel → PENDING_HUMAN_QUOTE
 * TEST 5 — Security: no COST/margin in customer payload
 */

jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn()
}));

jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn()
}));

jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue({
    want: [], experienced: [], repeat_intent: null, companion_voices: [], voice_provenance: null
  })
}));

// Real quoteEngine + quotePriceData (NOT mocked — price validation)
const { handleTravelRequest } = require('../../services/soyeowoolService');
const contextExtractionService = require('../../services/contextExtractionService');
const travelGuideService        = require('../../services/travelGuideService');
const qe = require('../../services/quoteEngine');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SESSION_ID = 'bridge-test-session-001';
const PRINCIPAL  = { sowon_id: 'SOWON_BRIDGE_001', principal_type: 'guest' };

function makeSoulContextCouple() {
  return {
    session_id: 'ext-uuid',
    entry_point: null,
    user_mode: 'DEFAULT',
    country_code: 'KR',
    city_code: 'YEOSU',
    time_available_minutes: 120,
    people_type: 'couple',
    companion_constraints: { has_kids: false, has_elderly: false, disability: null },
    meal_context: 'none',
    has_car: true,
    mobility_type: 'mixed',
    wish_context: undefined,
    exclude_place_ids: [],
    must_visit_place_ids: [],
    time_of_day: null,
    preference_type: null,
    budget_constraint: null,
    group_size: 2,        // ← guest count signal
    requested_count: null,
    mobility_constraint: null,
    _provenance: {
      time_available_minutes: 'UNKNOWN', people_type: 'AI_INFERENCE',
      has_kids: 'UNKNOWN', has_elderly: 'UNKNOWN', disability: 'UNKNOWN',
      meal_context: 'UNKNOWN', has_car: 'UNKNOWN', mobility_type: 'UNKNOWN',
      emotion_primary: 'UNKNOWN', emotion_tags: 'UNKNOWN', time_of_day: 'UNKNOWN',
      preference_type: 'UNKNOWN', budget_constraint: 'UNKNOWN',
      group_size: 'USER_EXPLICIT', requested_count: 'UNKNOWN', mobility_constraint: 'UNKNOWN'
    }
  };
}

function makeSoulContextGroup10() {
  // Use 'family_elderly' so _isGroupQuoteRequest (pt === 'group') doesn't short-circuit
  // the flow before the Route→Quote bridge runs. The bridge itself detects guestCount≥5
  // and hotel selection → PENDING_HUMAN_QUOTE.
  return {
    ...makeSoulContextCouple(),
    people_type: 'family_elderly',
    group_size: 10,
    _provenance: { ...makeSoulContextCouple()._provenance, group_size: 'USER_EXPLICIT', people_type: 'USER_EXPLICIT' }
  };
}

function makeTgResult() {
  return {
    session_id: SESSION_ID,
    entry_point: 'YEOSU_GENERAL',
    user_mode: 'DEFAULT',
    places: [{ place_code: 'ODONGDO', name_ko: '오동도', type: 'nature', safety_pass: true, live_status: 'OPEN', matching_score: 0.8, suitable_for: ['커플'], emotion_tags: ['힐링'], avg_stay_minutes: 60 }],
    food: null, cafes: null, benefits: null, message: 'OK', course: null, journey_preferences: {}
  };
}

async function callSOUL(message, soulContextOverride) {
  return handleTravelRequest({ message, sessionId: SESSION_ID, hotelId: null, principal: PRINCIPAL });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  contextExtractionService.parseUserMessage.mockResolvedValue(makeSoulContextCouple());
  travelGuideService.recommend.mockResolvedValue(makeTgResult());
});

// ─── TEST 1: Direct quote — RAMADA + cable, 2인, 2026-10-17 (sat) ─────────────

test('TEST 1 — RAMADA+cable 2인 2026-10-17: quote CALCULATED, prices match engine baseline', async () => {
  const msg = '10월 17일 여자친구랑 둘이 여수 1박2일 가는데 라마다에서 자고 케이블카도 타고 싶어. 일정이랑 비용 알려줘.';
  const result = await callSOUL(msg);

  expect(result.ok).toBe(true);
  const q = result.payload.quote;
  expect(q).not.toBeNull();
  expect(q.status).toBe('CALCULATED');

  // Validate against real engine independently
  const expected = qe.sanitizeForCustomer(
    qe.calculateQuote({ guestCount: 2, hotel: 'ramada', leisure: 'cable', travelDate: '2026-10-17', region: 'yeosu' })
  );
  expect(q.pricing.totalSell).toBe(expected.pricing.totalSell);
  expect(q.pricing.totalList).toBe(expected.pricing.totalList);
  expect(q.pricing.totalSavings).toBe(expected.pricing.totalSavings);

  // Confirm baseline (sat 2인 ramada=140K + cable×2=32K = 172K, list=209K, savings=37K)
  expect(q.pricing.totalSell).toBe(172000);
  expect(q.pricing.totalList).toBe(209000);
  expect(q.pricing.totalSavings).toBe(37000);
});

// ─── TEST 2: Hotel change — RAMADA → KENNY (full re-statement) ───────────────

test('TEST 2 — KENNY+cable 2인 2026-10-17: different quote from RAMADA baseline', async () => {
  const msg = '케니호텔로 바꿔줘, 10월 17일이고 둘이야, 케이블카도 포함해서.';
  const result = await callSOUL(msg);

  expect(result.ok).toBe(true);
  const q = result.payload.quote;
  expect(q).not.toBeNull();
  expect(q.status).toBe('CALCULATED');

  // Validate against real engine
  const expected = qe.sanitizeForCustomer(
    qe.calculateQuote({ guestCount: 2, hotel: 'kenny', leisure: 'cable', travelDate: '2026-10-17', region: 'yeosu' })
  );
  expect(q.pricing.totalSell).toBe(expected.pricing.totalSell);

  // KENNY sat 2인=70K + cable weekend×2=32K = 102K (different from RAMADA 172K)
  expect(q.pricing.totalSell).toBe(102000);
  expect(q.pricing.totalSell).not.toBe(172000); // must differ from TEST 1

  // Breakdown should include kenny hotel
  const hotelItem = q.breakdown.find(b => b.category === 'hotel');
  expect(hotelItem).toBeDefined();
  expect(hotelItem.code).toBe('kenny');
});

// ─── TEST 3: Cable removed — hotel only ──────────────────────────────────────

test('TEST 3 — RAMADA 2인, no cable: hotel-only quote', async () => {
  const msg = '10월 17일 라마다 2명으로 예약하고 싶은데 케이블카는 빼줘.';
  const result = await callSOUL(msg);

  expect(result.ok).toBe(true);
  const q = result.payload.quote;
  expect(q).not.toBeNull();
  expect(q.status).toBe('CALCULATED');

  // No cable in breakdown
  const cableItem = q.breakdown.find(b => b.category === 'leisure');
  expect(cableItem).toBeUndefined();

  // Validate against real engine (hotel only)
  const expected = qe.sanitizeForCustomer(
    qe.calculateQuote({ guestCount: 2, hotel: 'ramada', travelDate: '2026-10-17', region: 'yeosu' })
  );
  expect(q.pricing.totalSell).toBe(expected.pricing.totalSell);
  // RAMADA sat 2인 = 140K only
  expect(q.pricing.totalSell).toBe(140000);
});

// ─── TEST 4: Complex group hotel → PENDING_HUMAN_QUOTE ───────────────────────

test('TEST 4 — 10인 라마다 2인1실 조식 포함: PENDING_HUMAN_QUOTE, no invented price', async () => {
  contextExtractionService.parseUserMessage.mockResolvedValue(makeSoulContextGroup10());

  const msg = '10명이고 라마다에서 2인1실 3개 4인1실 1개, 조식 포함으로 해줘.';
  const result = await callSOUL(msg);

  expect(result.ok).toBe(true);
  const q = result.payload.quote;
  expect(q).not.toBeNull();
  expect(q.status).toBe('PENDING_HUMAN_QUOTE');

  // Context preserved for handoff
  expect(q.quoteCtx).toBeDefined();
  expect(q.quoteCtx.hotel_code).toBe('ramada');
  expect(q.quoteCtx.guest_count).toBe(10);

  // No invented price — must NOT have pricing with totalSell
  expect(q.pricing).toBeUndefined();
  expect(q.breakdown).toBeUndefined();
});

// ─── TEST 5: Security — no COST/margin in customer payload ───────────────────

test('TEST 5 — Security: COST/margin/totalCost absent from quote payload', async () => {
  const msg = '10월 17일 여자친구랑 둘이 라마다 케이블카 포함해서 알려줘.';
  const result = await callSOUL(msg);

  expect(result.ok).toBe(true);
  const q = result.payload.quote;
  expect(q).not.toBeNull();
  expect(q.status).toBe('CALCULATED');

  // pricing must NOT have cost fields
  expect(q.pricing).toBeDefined();
  expect(q.pricing.totalCost).toBeUndefined();
  expect(q.pricing.totalMargin).toBeUndefined();

  // No breakdown item should have 'cost' key
  expect(q.breakdown).toBeDefined();
  q.breakdown.forEach(item => {
    expect(item).not.toHaveProperty('cost');
  });

  // Savings is visible
  expect(q.pricing.totalSavings).toBeGreaterThan(0);
});
