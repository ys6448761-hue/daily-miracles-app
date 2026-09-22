'use strict';
/**
 * PLACE_LOOKUP Routing — T1–T10
 *
 * Verifies that explicit named-place queries are routed to PLACE_LOOKUP,
 * not to the generic recommendation pipeline.
 *
 * Tests are unit-level — DB is mocked.
 * _detectPlaceLookupIntent and helpers are tested directly
 * for precise collapse-point regression.
 */

// ── Expose private helpers via require ────────────────────────────────────────
// soyeowoolService does not export helpers; we extract via module internals.
// Test imports the module and calls helpers through the re-exported test shim.
// Strategy: mock travelGuideService + contextExtractionService, call handleTravelRequest.

jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn().mockResolvedValue({ places: [], session_id: 'TEST' }),
  getPlaceByCode: jest.fn(),
}));

jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn().mockResolvedValue({
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
    _provenance: {
      time_available_minutes: 'UNKNOWN', people_type: 'UNKNOWN',
    },
  }),
}));

jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));

jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  isQuotable: jest.fn().mockReturnValue(false),
}));

jest.mock('../../services/sessionService', () => ({
  touchSession: jest.fn().mockResolvedValue(undefined),
}));

const tgMock = require('../../services/travelGuideService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

// ── Place fixture ─────────────────────────────────────────────────────────────

function makePlaceFixture(overrides = {}) {
  return {
    code: 'lee_soon_shin_plaza',
    name_ko: '이순신광장',
    name_en: 'Lee Soon Shin Plaza',
    description_short: null,
    indoor_outdoor: 'outdoor',
    avg_stay_minutes: 45,
    admission_fee_json: { adult: 0 },
    opening_hours_json: null,
    physical_difficulty: null,
    live_status_required: false,
    suitable_for: ['family', 'kids_ok', 'elderly', 'groups'],
    emotion_tags: ['history', 'education'],
    ...overrides,
  };
}

function makeOdongdoFixture() {
  return makePlaceFixture({
    code: 'odongdo',
    name_ko: '오동도',
    admission_fee_json: { adult: 0 },
  });
}

function makeHyangiramFixture() {
  return makePlaceFixture({
    code: 'hyangiram',
    name_ko: '향일암',
    physical_difficulty: 'high',
    live_status_required: false,
    admission_fee_json: { adult: 0 },
  });
}

function makeCablecarFixture() {
  return makePlaceFixture({
    code: 'cablecar',
    name_ko: '케이블카',
    admission_fee_json: null, // PAID — Commerce handles exact amount
  });
}

const SESSION = 'test-session-001';
const REQUEST = { message: '', sessionId: SESSION, hotelId: null, principal: null };

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// T1: 이순신광장에 대해 알려줘 → PLACE_LOOKUP → lee_soon_shin_plaza
// ─────────────────────────────────────────────────────────────────────────────

test('T1: "이순신광장에 대해 알려줘" → PLACE_LOOKUP, lee_soon_shin_plaza, no recommend call', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makePlaceFixture());

  const result = await handleTravelRequest({ ...REQUEST, message: '이순신광장에 대해 알려줘' });

  expect(result.ok).toBe(true);
  expect(result.payload.intent).toBe('PLACE_LOOKUP');
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('lee_soon_shin_plaza');
  expect(result.payload.places).toHaveLength(1);
  expect(result.payload.places[0].code).toBe('lee_soon_shin_plaza');
  // Generic ranking must NOT run
  expect(tgMock.recommend).not.toHaveBeenCalled();
  expect(tgMock.getPlaceByCode).toHaveBeenCalledWith('lee_soon_shin_plaza');
});

// ─────────────────────────────────────────────────────────────────────────────
// T2: 이순신광장 어때? → PLACE_LOOKUP
// ─────────────────────────────────────────────────────────────────────────────

test('T2: "이순신광장 어때?" → PLACE_LOOKUP', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makePlaceFixture());

  const result = await handleTravelRequest({ ...REQUEST, message: '이순신광장 어때?' });

  expect(result.ok).toBe(true);
  expect(result.payload.intent).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('lee_soon_shin_plaza');
  expect(tgMock.recommend).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T3: 오동도 알려줘 → PLACE_LOOKUP → odongdo
// ─────────────────────────────────────────────────────────────────────────────

test('T3: "오동도 알려줘" → PLACE_LOOKUP, odongdo', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makeOdongdoFixture());

  const result = await handleTravelRequest({ ...REQUEST, message: '오동도 알려줘' });

  expect(result.ok).toBe(true);
  expect(result.payload.intent).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('odongdo');
  expect(tgMock.recommend).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T4: 향일암은? → PLACE_LOOKUP → hyangiram
// ─────────────────────────────────────────────────────────────────────────────

test('T4: "향일암은?" → PLACE_LOOKUP, hyangiram', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makeHyangiramFixture());

  const result = await handleTravelRequest({ ...REQUEST, message: '향일암은?' });

  expect(result.ok).toBe(true);
  expect(result.payload.intent).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('hyangiram');
  expect(tgMock.recommend).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T5: 케이블카 설명해줘 → PLACE_LOOKUP → cablecar
// ─────────────────────────────────────────────────────────────────────────────

test('T5: "케이블카 설명해줘" → PLACE_LOOKUP, cablecar, message mentions 요금', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makeCablecarFixture());

  const result = await handleTravelRequest({ ...REQUEST, message: '케이블카 설명해줘' });

  expect(result.ok).toBe(true);
  expect(result.payload.intent).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('cablecar');
  // fee is null → message should mention 요금 (not fabricate a price)
  expect(result.payload.message_ko).toMatch(/요금/);
  expect(tgMock.recommend).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T6: 여수 남산공원에 대해 알려줘 → PLACE_LOOKUP, UNKNOWN, jaisan_park NOT substituted
// ─────────────────────────────────────────────────────────────────────────────

test('T6: "여수 남산공원에 대해 알려줘" → PLACE_UNKNOWN, no jaisan_park substitution', async () => {
  const result = await handleTravelRequest({ ...REQUEST, message: '여수 남산공원에 대해 알려줘' });

  expect(result.ok).toBe(true);
  expect(result.payload.intent).toBe('PLACE_LOOKUP');
  expect(result.payload.status).toBe('PLACE_UNKNOWN');
  expect(result.payload.resolved_code).toBeNull();
  expect(result.payload.places).toHaveLength(0);
  // Must NOT mention 자산공원
  expect(result.payload.message_ko).not.toContain('자산공원');
  // Must NOT mention 케이블카
  expect(result.payload.message_ko).not.toContain('케이블카');
  // Must acknowledge the unknown query
  expect(result.payload.message_ko).toMatch(/남산공원|찾을 수 없|검증된 장소/);
  // Generic ranking must NOT run
  expect(tgMock.recommend).not.toHaveBeenCalled();
  // getPlaceByCode must NOT have been called (no code to resolve)
  expect(tgMock.getPlaceByCode).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T7: "야경 좋은 곳 알려줘" → DISCOVERY (no place name → recommendation ranking)
// ─────────────────────────────────────────────────────────────────────────────

test('T7: "야경 좋은 곳 알려줘" → DISCOVERY, recommend() called', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'dolsan_daegyo', name_ko: '돌산대교' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '야경 좋은 곳 알려줘' });

  expect(result.ok).toBe(true);
  // recommend() was called — DISCOVERY path taken
  expect(tgMock.recommend).toHaveBeenCalled();
  expect(tgMock.getPlaceByCode).not.toHaveBeenCalled();
  expect(result.payload.intent).toBeUndefined(); // not a PLACE_LOOKUP payload
});

// ─────────────────────────────────────────────────────────────────────────────
// T8: "2시간 남았는데 어디 갈까?" → DISCOVERY
// ─────────────────────────────────────────────────────────────────────────────

test('T8: "2시간 남았는데 어디 갈까?" → DISCOVERY', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'cablecar', name_ko: '케이블카' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '2시간 남았는데 어디 갈까?' });

  expect(result.ok).toBe(true);
  expect(tgMock.recommend).toHaveBeenCalled();
  expect(tgMock.getPlaceByCode).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T9: "이순신광장 근처 어디 갈까?" → DISCOVERY (근처 = location constraint, not lookup)
// ─────────────────────────────────────────────────────────────────────────────

test('T9: "이순신광장 근처 어디 갈까?" → DISCOVERY (근처 override)', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'jungang_market', name_ko: '중앙시장' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '이순신광장 근처 어디 갈까?' });

  expect(result.ok).toBe(true);
  // DISCOVERY_OVERRIDE: 근처 → recommend() should run
  expect(tgMock.recommend).toHaveBeenCalled();
  expect(tgMock.getPlaceByCode).not.toHaveBeenCalled();
});

// ─────────────────────────────────────────────────────────────────────────────
// T10: "오동도랑 향일암 중 어디가 덜 걸어?" → existing safe fallback (DISCOVERY or NO_RESULT)
// ─────────────────────────────────────────────────────────────────────────────

test('T10: "오동도랑 향일암 중 어디가 덜 걸어?" → safe fallback, no PLACE_UNKNOWN collapse', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'odongdo', name_ko: '오동도' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '오동도랑 향일암 중 어디가 덜 걸어?' });

  expect(result.ok).toBe(true);
  // Should NOT be PLACE_UNKNOWN (no collapse)
  expect(result.payload.status).not.toBe('PLACE_UNKNOWN');
  // Returns a result (DISCOVERY or similar)
  expect(result.payload).toBeDefined();
});

// ─────────────────────────────────────────────────────────────────────────────
// Regression: known places do not appear as unrelated substitution
// ─────────────────────────────────────────────────────────────────────────────

test('Regression: "남산공원" does NOT resolve to 자산공원 (no fuzzy match)', async () => {
  const result = await handleTravelRequest({ ...REQUEST, message: '남산공원에 대해 알려줘' });

  expect(result.payload.status).toBe('PLACE_UNKNOWN');
  expect(result.payload.resolved_code).toBeNull();
  // '자산공원' must not appear in the response
  expect(JSON.stringify(result.payload)).not.toContain('jaisan_park');
  expect(JSON.stringify(result.payload)).not.toContain('자산공원');
});

// ─────────────────────────────────────────────────────────────────────────────
// PLACE_LOOKUP message quality: hyangiram has physical_difficulty=high
// ─────────────────────────────────────────────────────────────────────────────

test('PLACE_LOOKUP message: hyangiram physical_difficulty=high → message warns 계단/경사', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makeHyangiramFixture());

  const result = await handleTravelRequest({ ...REQUEST, message: '향일암은?' });

  expect(result.payload.message_ko).toMatch(/계단|경사/);
});

// ─────────────────────────────────────────────────────────────────────────────
// PLACE_LOOKUP message quality: free place → message mentions 무료
// ─────────────────────────────────────────────────────────────────────────────

test('PLACE_LOOKUP message: 이순신광장 (free) → message mentions 무료', async () => {
  tgMock.getPlaceByCode.mockResolvedValue(makePlaceFixture({ admission_fee_json: { adult: 0 } }));

  const result = await handleTravelRequest({ ...REQUEST, message: '이순신광장에 대해 알려줘' });

  expect(result.payload.message_ko).toContain('무료');
});

// ─────────────────────────────────────────────────────────────────────────────
// Entry Diversity regression: existing DISCOVERY queries still rank correctly
// ─────────────────────────────────────────────────────────────────────────────

test('Discovery regression: "밤인데 아쉬워" → DISCOVERY (no lookup verb)', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'dolsan_nightscape' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '밤인데 아쉬워' });

  expect(tgMock.recommend).toHaveBeenCalled();
  expect(result.payload.status).not.toBe('PLACE_LOOKUP');
  expect(result.payload.status).not.toBe('PLACE_UNKNOWN');
});

test('Discovery regression: "사진 잘 나오는 곳" → DISCOVERY', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'cablecar' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '사진 잘 나오는 곳' });

  expect(tgMock.recommend).toHaveBeenCalled();
});

test('Discovery regression: "부모님과 안 걷는 코스" → DISCOVERY', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'sky_tower' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '부모님과 안 걷는 코스' });

  expect(tgMock.recommend).toHaveBeenCalled();
});

test('Discovery regression: "돈 안 쓰고" → DISCOVERY', async () => {
  tgMock.recommend.mockResolvedValue({ places: [{ code: 'lee_soon_shin_plaza' }] });

  const result = await handleTravelRequest({ ...REQUEST, message: '돈 안 쓰고 갈 곳' });

  expect(tgMock.recommend).toHaveBeenCalled();
});
