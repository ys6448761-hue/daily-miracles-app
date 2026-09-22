'use strict';
/**
 * Presentation Mode — T1–T5, T13
 *
 * Verifies that soyeowoolService.handleTravelRequest() returns the correct
 * presentation_mode in the response payload for each Journey state.
 *
 * T1  DISCOVERING  — standard discovery query → 'DISCOVERING', place cards signal
 * T2  PLACE_LOOKUP → 'PLACE_KNOWLEDGE', quote/route null
 * T3  PLACE_UNKNOWN → 'PLACE_KNOWLEDGE', places empty
 * T4  ROUTE_READY  — routeSkeleton present, no calculated quote → 'ROUTE_READY'
 * T5  QUOTE_READY  — calculated quote → 'QUOTE_READY'
 * T13 unknown mode safe fallback — backend only; frontend fallback behavior is
 *     confirmed by the mode derivation logic in _buildClientPayload (DISCOVERING default)
 */

// ── Module-level mocks ────────────────────────────────────────────────────────

jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn(),
  getPlaceByCode: jest.fn(),
}));

jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn(),
}));

jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn(),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  isQuotable: jest.fn(),
  buildQuoteInput: jest.fn().mockReturnValue({}),
}));

jest.mock('../../services/quoteEngine', () => ({
  calculateQuote: jest.fn(),
  sanitizeForCustomer: jest.fn(),
  getDayType: jest.fn().mockReturnValue('mon-thu'),
}));

jest.mock('../../services/sessionService', () => ({
  touchSession: jest.fn().mockResolvedValue(undefined),
}));

// routeSkeletonService is require()'d inline — mock at module level
jest.mock('../../services/routeSkeletonService', () => ({
  buildSkeleton: jest.fn(),
}));

const tgMock  = require('../../services/travelGuideService');
const ctxMock = require('../../services/contextExtractionService');
const quoteMock = require('../../services/quoteContextService');
const qeMock  = require('../../services/quoteEngine');
const routeSkelMock = require('../../services/routeSkeletonService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

// ── Shared fixtures ───────────────────────────────────────────────────────────

const DISCOVERY_CTX = {
  people_type: 'solo',
  time_available_minutes: 120,
  companion_constraints: {},
  meal_context: 'none',
  has_car: true,
  mobility_type: 'mixed',
  wish_context: null,
  exclude_place_ids: [],
  must_visit_place_ids: [],
  time_of_day: null,
  preference_type: null,
  budget_constraint: null,
  group_size: null,
  requested_count: null,
  mobility_constraint: null,
  _provenance: { time_available_minutes: 'UNKNOWN', people_type: 'UNKNOWN' },
};

const SAMPLE_PLACE = {
  code: 'odongdo', name_ko: '오동도', name_en: 'Odongdo Island',
  indoor_outdoor: 'outdoor', avg_stay_minutes: 120,
  suitable_for: ['family'], emotion_tags: ['nature'],
  weather_suitable: ['clear'], admission_fee_json: { adult: 0 },
  opening_hours_json: null, physical_difficulty: null, live_status_required: true,
  live_status: 'open', warnings: [],
};

const LOOKUP_PLACE = {
  code: 'lee_soon_shin_plaza', name_ko: '이순신광장',
  description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 45,
  admission_fee_json: { adult: 0 }, opening_hours_json: null,
  physical_difficulty: null, live_status_required: false,
  suitable_for: ['family'], emotion_tags: ['history', 'education'],
  weather_suitable: ['clear', 'all_season'],
};

function setupDiscovery(overrides = {}) {
  ctxMock.parseUserMessage.mockResolvedValue({ ...DISCOVERY_CTX, ...overrides });
  tgMock.recommend.mockResolvedValue({ places: [SAMPLE_PLACE], session_id: 'test' });
  quoteMock.extractQuoteContext.mockReturnValue({});
  quoteMock.isQuotable.mockReturnValue(false);
  routeSkelMock.buildSkeleton.mockReturnValue(null);
}

// ── T1: DISCOVERING ───────────────────────────────────────────────────────────
test('T1 DISCOVERING: standard discovery query → presentation_mode=DISCOVERING', async () => {
  setupDiscovery();
  const result = await handleTravelRequest({
    message: '야경 좋은 곳 알려줘',
    sessionId: 'sess-t1',
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('DISCOVERING');
  expect(result.payload.places.length).toBeGreaterThan(0);
  expect(result.payload.quote).toBeNull();
  expect(result.payload.route).toBeNull();
});

// ── T2: PLACE_LOOKUP ──────────────────────────────────────────────────────────
test('T2 PLACE_LOOKUP: known alias → presentation_mode=PLACE_KNOWLEDGE', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(LOOKUP_PLACE);
  const result = await handleTravelRequest({
    message: '이순신광장에 대해 알려줘',
    sessionId: 'sess-t2',
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('PLACE_KNOWLEDGE');
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.quote).toBeNull();
  expect(result.payload.route).toBeNull();
});

// ── T3: PLACE_UNKNOWN ─────────────────────────────────────────────────────────
test('T3 PLACE_UNKNOWN: unknown place → presentation_mode=PLACE_KNOWLEDGE, places empty', async () => {
  // '남산공원' matches PLACE_SUFFIX_RE ('공원') + STRONG_LOOKUP_ANY ('에 대해')
  // but is NOT in PLACE_ALIAS_MAP → PLACE_UNKNOWN path
  const result = await handleTravelRequest({
    message: '남산공원에 대해 알려줘',
    sessionId: 'sess-t3',
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('PLACE_KNOWLEDGE');
  expect(result.payload.status).toBe('PLACE_UNKNOWN');
  expect(result.payload.places).toHaveLength(0);
  expect(result.payload.quote).toBeNull();
  expect(result.payload.route).toBeNull();
});

// ── T4: ROUTE_READY ───────────────────────────────────────────────────────────
test('T4 ROUTE_READY: routeSkeleton present, no calculated quote → presentation_mode=ROUTE_READY', async () => {
  // Set up context that triggers _isMultiDayTrip (message contains 1박2일)
  // and quoteCtx with travel_date
  ctxMock.parseUserMessage.mockResolvedValue({ ...DISCOVERY_CTX, group_size: 2 });
  tgMock.recommend.mockResolvedValue({ places: [SAMPLE_PLACE], session_id: 'test' });
  quoteMock.extractQuoteContext.mockReturnValue({ travel_date: '2026-10-15', hotel_code: null, leisure: null, guest_count: 2 });
  quoteMock.isQuotable.mockReturnValue(false); // no quote
  routeSkelMock.buildSkeleton.mockReturnValue({
    days: [
      { date: '2026-10-15', items: [{ name: '오동도', type: 'PLACE' }] },
      { date: '2026-10-16', items: [{ name: '향일암', type: 'PLACE' }] },
    ]
  });

  const result = await handleTravelRequest({
    message: '부모님이랑 여수 1박2일 일정 짜줘',
    sessionId: 'sess-t4',
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('ROUTE_READY');
  expect(result.payload.route).not.toBeNull();
  expect(result.payload.quote).toBeNull();
});

// ── T5: QUOTE_READY ───────────────────────────────────────────────────────────
test('T5 QUOTE_READY: calculated quote → presentation_mode=QUOTE_READY', async () => {
  ctxMock.parseUserMessage.mockResolvedValue({ ...DISCOVERY_CTX, group_size: 2 });
  tgMock.recommend.mockResolvedValue({ places: [SAMPLE_PLACE], session_id: 'test' });
  quoteMock.extractQuoteContext.mockReturnValue({ travel_date: '2026-10-15', hotel_code: 'kenny', leisure: 'cablecar', guest_count: 2 });
  quoteMock.isQuotable.mockReturnValue(true);
  // calculateQuote + sanitizeForCustomer return a CALCULATED quote
  qeMock.calculateQuote.mockReturnValue({ success: true, pricing: { totalSell: 172000, totalList: 209000, totalSavings: 37000 } });
  qeMock.sanitizeForCustomer.mockReturnValue({ status: 'CALCULATED', pricing: { totalSell: 172000, totalList: 209000, totalSavings: 37000 }, guestCount: 2, breakdown: [] });
  routeSkelMock.buildSkeleton.mockReturnValue(null); // no route for simple quote

  const result = await handleTravelRequest({
    message: '라마다 케이블카 포함 10월 15일 2인 얼마야?',
    sessionId: 'sess-t5',
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('QUOTE_READY');
  expect(result.payload.quote).not.toBeNull();
  expect(result.payload.quote.status).toBe('CALCULATED');
});

// ── T13: Unknown mode fallback — backend derivation always produces known mode ─
test('T13 Backend always produces a known presentation_mode (DISCOVERING default)', async () => {
  // Even with no quote and no route, DISCOVERING is returned (never undefined/null)
  setupDiscovery();
  const result = await handleTravelRequest({
    message: '어디 갈까',
    sessionId: 'sess-t13',
  });
  expect(result.ok).toBe(true);
  const mode = result.payload.presentation_mode;
  expect(['DISCOVERING', 'PLACE_KNOWLEDGE', 'ROUTE_READY', 'QUOTE_READY']).toContain(mode);
  expect(mode).not.toBeUndefined();
  expect(mode).not.toBeNull();
});

// ── T2b: PLACE_LOOKUP regression — 오동도 ────────────────────────────────────
test('T2b 오동도 PLACE_LOOKUP → PLACE_KNOWLEDGE, message includes identity', async () => {
  tgMock.getPlaceByCode.mockResolvedValue({
    code: 'odongdo', name_ko: '오동도',
    description_short: null, indoor_outdoor: 'outdoor', avg_stay_minutes: 120,
    admission_fee_json: { adult: 0 }, opening_hours_json: null,
    physical_difficulty: null, live_status_required: true,
    suitable_for: ['family', 'kids_ok'], emotion_tags: ['nature', 'seasonal', 'growth'],
    weather_suitable: ['clear', 'clear_dry', 'spring'],
  });
  const result = await handleTravelRequest({
    message: '오동도에 대해 알려줘',
    sessionId: 'sess-t2b',
  });
  expect(result.payload.presentation_mode).toBe('PLACE_KNOWLEDGE');
  expect(result.payload.message_ko).toContain('오동도에 대해 알려드릴게요.');
  expect(result.payload.message_ko).toContain('봄에 특히 아름다운');
});
