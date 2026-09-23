'use strict';
/**
 * Multi-Intent Journey Request — Acceptance Tests AT-1 through AT-7
 * Founder Decision: Multi-Intent Journey Request V0.1
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn()
}));

jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn(),
  getPlaceByCode: jest.fn()
}));

jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null)
}));

jest.mock('../../services/sessionService', () => ({
  getSession: jest.fn().mockResolvedValue(null),
  isSessionValid: jest.fn().mockResolvedValue(true),
  createSession: jest.fn().mockResolvedValue('test-session-multi-intent'),
  touchSession: jest.fn().mockResolvedValue(),
  updateJourneyContext: jest.fn().mockResolvedValue()
}));

// ─── Requires (after mocks) ──────────────────────────────────────────────────

const { handleTravelRequest }    = require('../../services/soyeowoolService');
const contextExtractionService   = require('../../services/contextExtractionService');
const travelGuideService         = require('../../services/travelGuideService');
const { _extractGuestCount }     = require('../../services/quoteContextService');

// ─── Fixtures ────────────────────────────────────────────────────────────────

const MOCK_COUPLE_SOUL_CONTEXT = {
  session_id: 'uuid-extraction',
  entry_point: null,
  user_mode: 'DEFAULT',
  country_code: 'KR',
  city_code: 'YEOSU',
  time_available_minutes: null,
  people_type: 'couple',
  companion_constraints: { has_kids: false, kids_age: undefined, has_elderly: false, disability: undefined },
  meal_context: 'none',
  has_car: true,
  mobility_type: 'mixed',
  wish_context: undefined,
  exclude_place_ids: [],
  must_visit_place_ids: [],
  time_of_day: null,
  preference_type: null,
  budget_constraint: null,
  group_size: 2,
  requested_count: null,
  mobility_constraint: null,
  _provenance: {
    time_available_minutes: 'UNKNOWN',
    people_type: 'USER_EXPLICIT',
    has_kids: 'UNKNOWN', has_elderly: 'UNKNOWN', disability: 'UNKNOWN',
    meal_context: 'UNKNOWN', has_car: 'UNKNOWN', mobility_type: 'UNKNOWN',
    emotion_primary: 'UNKNOWN', emotion_tags: 'UNKNOWN', time_of_day: 'UNKNOWN',
    preference_type: 'UNKNOWN', budget_constraint: 'UNKNOWN',
    group_size: 'USER_EXPLICIT', requested_count: 'UNKNOWN', mobility_constraint: 'UNKNOWN'
  }
};

const MOCK_PLACES = [
  {
    id: 1, code: 'odongdo', name_ko: '오동도',
    matching_score: 0.9,
    suitable_for: ['couples'], emotion_tags: ['healing'],
    avg_stay_minutes: 90, accessibility_wheelchair: false, accessibility_stroller: false
  },
  {
    id: 2, code: 'lee_soon_shin_plaza', name_ko: '이순신광장',
    matching_score: 0.85,
    suitable_for: [], emotion_tags: ['history'],
    avg_stay_minutes: 30, accessibility_wheelchair: true, accessibility_stroller: true
  }
];

const MOCK_CABLECAR_PLACE = {
  id: 10, code: 'cablecar', name_ko: '여수 해상케이블카',
  description_short: null,
  indoor_outdoor: 'outdoor', suitable_for: ['couples'],
  emotion_tags: ['adventure'], avg_stay_minutes: 60,
  admission_fee_json: null, opening_hours_json: null,
  physical_difficulty: null, live_status_required: false,
  weather_suitable: []
};

const TEST_SESSION = 'test-session-multi-intent-at';
const TEST_PRINCIPAL = { sowon_id: null };

// ─── Setup ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  contextExtractionService.parseUserMessage.mockResolvedValue({ ...MOCK_COUPLE_SOUL_CONTEXT });
  travelGuideService.recommend.mockResolvedValue({ places: [...MOCK_PLACES] });
  travelGuideService.getPlaceByCode.mockResolvedValue(MOCK_CABLECAR_PLACE);
});

// ─── AT-1 ────────────────────────────────────────────────────────────────────
// Fix 1: "탈거야" routes to _cableClar(), not place-knowledge question

test('AT-1: 케이블카 탈거야 → cableClar path, not "알고 싶으신 게 있으신가요?"', async () => {
  const result = await handleTravelRequest({
    message: '케이블카 탈거야',
    sessionId: TEST_SESSION,
    hotelId: null,
    principal: TEST_PRINCIPAL
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.presentation_mode).toBe('CLARIFICATION');
  // Must NOT be the place-knowledge question
  expect(result.payload.message_ko).not.toContain('알고 싶으신 게 있으신가요');
  // Must be the scheduling clarification
  expect(result.payload.message_ko).toContain('케이블카를 꼭 타고 싶으시군요');
  // Route and quote must be null (clarification response)
  expect(result.payload.route).toBeNull();
  expect(result.payload.quote).toBeNull();
});

// ─── AT-2 ────────────────────────────────────────────────────────────────────
// Fix 1: "와이프랑 케이블카 탈거야" (no overnight, no discovery verb) → cableClar

test('AT-2: 와이프랑 케이블카 탈거야 → cableClar path, not place-knowledge question', async () => {
  const result = await handleTravelRequest({
    message: '와이프랑 케이블카 탈거야',
    sessionId: TEST_SESSION,
    hotelId: null,
    principal: TEST_PRINCIPAL
  });
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.message_ko).not.toContain('알고 싶으신 게 있으신가요');
  expect(result.payload.message_ko).toContain('케이블카를 꼭 타고 싶으시군요');
});

// ─── AT-3 ────────────────────────────────────────────────────────────────────
// Full multi-intent → ROUTE_READY + hotel in route + leisure in route + acknowledgement

test('AT-3: 와이프랑 1박2일 라마다 케이블카 → ROUTE_READY, route has hotel+leisure, message_ko acknowledges', async () => {
  const result = await handleTravelRequest({
    message: '와이프랑 1박2일 라마다에서 자고 케이블카 탈거야 일정과 비용 알려줘',
    sessionId: TEST_SESSION,
    hotelId: null,
    principal: TEST_PRINCIPAL
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('ROUTE_READY');
  expect(result.payload.route).not.toBeNull();

  // Hotel present in route items
  const allItems = result.payload.route.days.flatMap(d => d.items || []);
  expect(allItems.some(i => i.type === 'hotel')).toBe(true);
  // Leisure present in route items
  expect(allItems.some(i => i.type === 'leisure')).toBe(true);

  // message_ko confirms hotel + cablecar — not the place-knowledge question
  expect(result.payload.message_ko).not.toContain('알고 싶으신 게 있으신가요');
  expect(result.payload.message_ko).toContain('라마다');
  expect(result.payload.message_ko).toContain('케이블카');
});

// ─── AT-4 ────────────────────────────────────────────────────────────────────
// Fix 1 must NOT affect pure place-knowledge queries
// "케이블카에 대해 알려줘" → PLACE_KNOWLEDGE (unchanged behavior)

test('AT-4: 케이블카에 대해 알려줘 → PLACE_KNOWLEDGE (not affected by Fix 1)', async () => {
  const result = await handleTravelRequest({
    message: '케이블카에 대해 알려줘',
    sessionId: TEST_SESSION,
    hotelId: null,
    principal: TEST_PRINCIPAL
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('PLACE_KNOWLEDGE');
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('cablecar');
  // contextExtractionService must NOT have been called (PLACE_LOOKUP is pre-GPT)
  expect(contextExtractionService.parseUserMessage).not.toHaveBeenCalled();
});

// ─── AT-5 ────────────────────────────────────────────────────────────────────
// Full message + explicit date → QUOTE_READY (isQuotable = true with hotel + date + guests)

test('AT-5: Full message with date → QUOTE_READY', async () => {
  const result = await handleTravelRequest({
    message: '와이프랑 1박2일 라마다에서 자고 케이블카 탈거야 10월 17일 일정과 비용 알려줘',
    sessionId: TEST_SESSION,
    hotelId: null,
    principal: TEST_PRINCIPAL
  });
  expect(result.ok).toBe(true);
  expect(result.payload.presentation_mode).toBe('QUOTE_READY');
  expect(result.payload.quote).not.toBeNull();
  expect(result.payload.quote.status).toBe('CALCULATED');
  // Route also present in QUOTE_READY
  expect(result.payload.route).not.toBeNull();
});

// ─── AT-6 ────────────────────────────────────────────────────────────────────
// Wife extraction: "와이프" → guest_count = 2

describe('AT-6: 와이프 guest_count extraction', () => {
  test('와이프랑 → guest_count = 2 (message pattern)', () => {
    expect(_extractGuestCount('와이프랑 라마다에서 자고', null)).toBe(2);
  });

  test('와이프랑 in full message → guest_count = 2', () => {
    expect(_extractGuestCount('와이프랑 1박2일 라마다에서 자고 케이블카 탈거야 일정과 비용 알려줘', null)).toBe(2);
  });

  test('domainContext group_size wins over message pattern', () => {
    // When GPT extracts group_size=2, that takes priority
    expect(_extractGuestCount('와이프랑 케이블카 탈거야', { group_size: 2 })).toBe(2);
  });

  test('existing couples still extract 2 (regression)', () => {
    expect(_extractGuestCount('남편이랑 여행', null)).toBe(2);
    expect(_extractGuestCount('아내랑 같이', null)).toBe(2);
    expect(_extractGuestCount('커플 여행', null)).toBe(2);
  });
});

// ─── AT-7 ────────────────────────────────────────────────────────────────────
// Key acceptance: SOUL naturally acknowledges Ramada + cablecar.
// Must NOT ask place-knowledge question. Must NOT return CLARIFICATION.
// With Fix B: message has "비용" + no date → acknowledgement includes date-ask.

test('AT-7: Full message → SOUL acknowledges Ramada+cablecar, asks for date (비용 + no date)', async () => {
  const result = await handleTravelRequest({
    message: '와이프랑 1박2일 라마다에서 자고 케이블카 탈거야 일정과 비용 알려줘',
    sessionId: TEST_SESSION,
    hotelId: null,
    principal: TEST_PRINCIPAL
  });
  expect(result.ok).toBe(true);
  const msg = result.payload.message_ko;

  // Must NOT ask about cablecar as if it were a place inquiry
  expect(msg).not.toContain('알고 싶으신 게 있으신가요');
  expect(msg).not.toContain('궁금하세요');

  // Must acknowledge both resolved choices (Fix 2)
  expect(msg).toContain('라마다');
  expect(msg).toContain('케이블카');

  // Must not be a generic clarification or discovery response
  expect(result.payload.status).not.toBe('CLARIFICATION');
  expect(result.payload.presentation_mode).not.toBe('CLARIFICATION');
  expect(result.payload.presentation_mode).not.toBe('PLACE_KNOWLEDGE');
  expect(result.payload.presentation_mode).not.toBe('DISCOVERING');

  // Fix B: message has "비용" + no date → SOUL should append date-ask
  expect(msg).toContain('날짜');
});

// ─── AT-8 ────────────────────────────────────────────────────────────────────
// Two-turn continuity: Turn 2 "10월 17일" → QUOTE_READY
// Session has journey_ctx from Turn 1 (hotel+leisure+guests, no date).

const sessionService = require('../../services/sessionService');

describe('AT-8: Two-turn continuity — date provision', () => {
  test('Turn 2 "10월 17일" → QUOTE_READY when session has hotel+leisure+guests', async () => {
    sessionService.getSession.mockResolvedValueOnce({
      journey_ctx: {
        hotel_code:  'ramada',
        leisure_code: 'cable',
        guest_count: 2,
        travel_date: null,
        nights:      1,
        route_id:    'ROUTE-DATELESS-TEST',
      }
    });

    const result = await handleTravelRequest({
      message: '10월 17일',
      sessionId: TEST_SESSION,
      hotelId: null,
      principal: TEST_PRINCIPAL
    });
    expect(result.ok).toBe(true);
    expect(result.payload.presentation_mode).toBe('QUOTE_READY');
    expect(result.payload.quote).not.toBeNull();
    expect(result.payload.quote.status).toBe('CALCULATED');
    // Route rebuilt with hotel+leisure preserved
    expect(result.payload.route).not.toBeNull();
    const allItems = result.payload.route.days.flatMap(d => d.items || []);
    expect(allItems.some(i => i.type === 'hotel' && i.selection_status === 'LOCKED')).toBe(true);
  });

  test('Turn 2 without stored hotel → does NOT enter date provision path', async () => {
    sessionService.getSession.mockResolvedValueOnce({
      journey_ctx: { hotel_code: null, travel_date: null }
    });

    const result = await handleTravelRequest({
      message: '10월 17일',
      sessionId: TEST_SESSION,
      hotelId: null,
      principal: TEST_PRINCIPAL
    });
    // Without hotel stored, date provision skips → falls through to normal path
    expect(result.ok).toBe(true);
    expect(result.payload.presentation_mode).not.toBe('QUOTE_READY');
  });
});
