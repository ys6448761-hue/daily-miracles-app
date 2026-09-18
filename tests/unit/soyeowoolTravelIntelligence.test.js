'use strict';

jest.mock('../../services/contextExtractionService', () => ({
  parseUserMessage: jest.fn()
}));

jest.mock('../../services/travelGuideService', () => ({
  recommend: jest.fn()
}));

const { handleTravelRequest } = require('../../services/soyeowoolService');
const contextExtractionService = require('../../services/contextExtractionService');
const travelGuideService = require('../../services/travelGuideService');

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_PRINCIPAL = {
  sowon_id: 'SOWON_TEST_001',
  principal_type: 'guest'
};

const SESSION_ID = 'test-session-001';

function makeSoulContextElderlyThreeHours() {
  return {
    session_id: 'extraction-generated-uuid',
    entry_point: null,
    user_mode: 'DEFAULT',
    country_code: 'KR',
    city_code: 'YEOSU',
    time_available_minutes: 180,
    people_type: 'family_elderly',
    companion_constraints: {
      has_kids: false,
      has_elderly: true,
      disability: null
    },
    meal_context: 'none',
    has_car: true,       // UNKNOWN → code default applied by contextExtractionService
    mobility_type: 'mixed', // UNKNOWN → code default
    wish_context: undefined,
    exclude_place_ids: [],
    must_visit_place_ids: [],
    _provenance: {
      time_available_minutes: 'USER_EXPLICIT',
      people_type: 'AI_INFERENCE',
      has_kids: 'UNKNOWN',
      has_elderly: 'USER_EXPLICIT',
      disability: 'UNKNOWN',
      meal_context: 'UNKNOWN',
      has_car: 'UNKNOWN',
      mobility_type: 'UNKNOWN',
      emotion_primary: 'UNKNOWN',
      emotion_tags: 'UNKNOWN'
    }
  };
}

function makeSoulContextUnknownTime() {
  const base = makeSoulContextElderlyThreeHours();
  return {
    ...base,
    time_available_minutes: 120, // UNKNOWN → code default 120 applied by contextExtractionService
    _provenance: {
      ...base._provenance,
      time_available_minutes: 'UNKNOWN'
    }
  };
}

function makeTgResultWithPlaces() {
  return {
    session_id: SESSION_ID,
    entry_point: 'YEOSU_GENERAL',
    user_mode: 'DEFAULT',
    places: [
      {
        place_code: 'ODONGDO',
        name_ko: '오동도',
        type: 'nature',
        stay_minutes: 60,
        travel_time_minutes: 15,
        reason: '어르신도 편하게 걸으실 수 있어요',
        safety_pass: true,
        live_status: 'OPEN',
        matching_score: 0.9,
        suitable_for: ['어르신', '가족'],
        emotion_tags: ['힐링'],
        accessibility_wheelchair: true,
        avg_stay_minutes: 60
      }
    ],
    food: null,
    cafes: null,
    benefits: null,
    message: 'Recommendations',
    course: null,
    journey_preferences: {}
  };
}

function makeTgResultEmpty() {
  return { ...makeTgResultWithPlaces(), places: [] };
}

async function callSOUL(overrides = {}) {
  return handleTravelRequest({
    message: '고령의 부모님과 3시간 있어요',
    sessionId: SESSION_ID,
    hotelId: null,
    principal: MOCK_PRINCIPAL,
    ...overrides
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('soyeowoolService — Phase 1 TRAVEL_INTELLIGENCE', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    contextExtractionService.parseUserMessage.mockResolvedValue(makeSoulContextElderlyThreeHours());
    travelGuideService.recommend.mockResolvedValue(makeTgResultWithPlaces());
  });

  // T-S01
  test('USER_EXPLICIT 3h: time_available_minutes=180 preserved in understood_context', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.understood_context.time_available_minutes).toBe(180);
  });

  // T-S02
  test('USER_EXPLICIT has_elderly: preserved in companion_constraints and NOT in domainFallbacks', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.understood_context.companion_constraints.has_elderly).toBe(true);
    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx._domainFallbacks).not.toContain('has_elderly');
  });

  // T-S03
  test('UNKNOWN has_car: code default true applied to domainContext AND listed in _domainFallbacks', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.has_car).toBe(true);
    expect(domainCtx._domainFallbacks).toContain('has_car');
  });

  // T-S04
  test('UNKNOWN time: code default 120 in domainContext AND in _domainFallbacks', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeSoulContextUnknownTime());
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.time_available_minutes).toBe(120);
    expect(domainCtx._domainFallbacks).toContain('time_available_minutes');
  });

  // T-S05
  test('D5: sowon_id NOT present in travelGuideService domain context', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.sowon_id).toBeUndefined();
  });

  // T-S06
  test('D5: phone, name, wish_text absent from domain context', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    const domainCtx = travelGuideService.recommend.mock.calls[0][0];
    expect(domainCtx.phone).toBeUndefined();
    expect(domainCtx.name).toBeUndefined();
    expect(domainCtx.wish_text).toBeUndefined();
  });

  // T-S07
  test('source identifies travelGuideService/8-filter-cascade (TRAVEL_INTELLIGENCE)', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.source).toBe('travelGuideService/8-filter-cascade');
  });

  // T-S08
  test('travelGuideService.recommend called exactly once', async () => {
    await callSOUL();
    expect(travelGuideService.recommend).toHaveBeenCalledTimes(1);
  });

  // T-S09
  test('D11: RESULT confidence === null (Phase 1 semantics undefined)', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.confidence).toBeNull();
  });

  // T-S10
  test('D7: message_ko says 3시간 not 180분', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.message_ko).toContain('3시간');
    expect(result.payload.message_ko).not.toMatch(/180분/);
  });

  // T-S11
  test('D8: SOWON_ID carries from principal through to RESULT response', async () => {
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.sowon_id).toBe(MOCK_PRINCIPAL.sowon_id);
  });

  // T-S12
  test('UNKNOWN time → STATUS=PARTIAL and D6 soft clarification in message_ko', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue(makeSoulContextUnknownTime());
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.status).toBe('PARTIAL');
    expect(result.payload.message_ko).toContain('시간이 얼마나');
  });

  // T-S13
  test('places=[] → STATUS=NO_RESULT with next_options', async () => {
    travelGuideService.recommend.mockResolvedValue(makeTgResultEmpty());
    const result = await callSOUL();
    expect(result.ok).toBe(true);
    expect(result.payload.status).toBe('NO_RESULT');
    expect(result.payload.places).toHaveLength(0);
    expect(result.payload.next_options).toBeDefined();
    expect(result.payload.next_options.length).toBeGreaterThan(0);
  });

  // T-S14
  test('contextExtractionService error → ok=false, travelGuideService NOT called', async () => {
    contextExtractionService.parseUserMessage.mockResolvedValue({
      error: '죄송합니다. 다시 물어봐주세요.'
    });
    const result = await callSOUL();
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
    expect(travelGuideService.recommend).not.toHaveBeenCalled();
  });

  // T-S15 — Known limitation: multi-intent detection is NOT a Phase 1 capability
  test.todo(
    'MULTI_INTENT_V02_REQUIRED: ' +
    'Anti-case "지금은 아내와 여행 중인데, 다음 달에는 직원 12명이랑 다시 오려고 해. 1박2일 비용도 알고 싶어." ' +
    'currently collapses to a single TravelGuideContext via contextExtractionService (locked, unchanged). ' +
    'Phase 1 cannot detect multi-intent from extraction output — no safe non-generic signal exists. ' +
    'V0.2 required for segments[], parallel REQUEST envelopes, OFFER_DECISION combination. ' +
    'This test documents the known boundary. Do NOT encode the collapsed 2880-minute recommendation as correct Phase 1 behavior.'
  );
});
