/**
 * SOUL Option 2 Level B — JOURNEY_ADD Emotional Continuity
 *
 * Coverage:
 *   Positive: emotional transition sentence generated when prior included place exists and both have roles
 *   Negative: no transition when first place / hyangiram involved / role missing
 *   Isolation: existing JOURNEY_ADD format preserved, PLACE_LOOKUP unaffected, CONSTRAINT_UPDATE unaffected
 *   Rendering: Korean names correct (no "undefined" in response)
 */

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/routeSkeletonService', () => ({ buildSkeleton: jest.fn().mockReturnValue(null) }), { virtual: true });
jest.mock('../../services/quoteEngine', () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput: jest.fn().mockReturnValue({}),
  _extractLeisure: jest.fn().mockReturnValue(null),
  _extractHotelCode: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } })
}), { virtual: true });

const contextSvc     = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc     = require('../../services/sessionService');

const { handleTravelRequest } = require('../../services/soyeowoolService');

const blankSession = () => ({ ok: true, journey_ctx: null });

const sessionWithPlaces = (places) => ({
  ok: true,
  journey_ctx: {
    conversation_journey: { places, constraints: {} },
    traveler_profile: {},
  },
});

const mkSoloCtx = (overrides = {}) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

const cablecarPlace     = { code: 'cablecar',          name_ko: '케이블카',     physical_difficulty: 'low' };
const odongdoPlace      = { code: 'odongdo',            name_ko: '오동도',       physical_difficulty: 'low' };
const marinePlace       = { code: 'marine_park',        name_ko: '종포해양공원', physical_difficulty: 'low' };
const dolsanNightPlace  = { code: 'dolsan_nightscape',  name_ko: '돌산공원',     physical_difficulty: 'low' };
const dolsanBridgePlace = { code: 'dolsan_daegyo',      name_ko: '돌산대교',     physical_difficulty: 'low' };
const hyangiramPlace    = { code: 'hyangiram',          name_ko: '향일암',       physical_difficulty: 'high' };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-level-b',
  hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' },
  explicit_context: {},
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

// ═══════════════════════════════════════════════════════════
// Positive — Transition sentence generated
// ═══════════════════════════════════════════════════════════

test('LB-P1 — cablecar→odongdo: transition sentence with 상승/재충전 roles', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'cablecar', status: 'included' },
  ]));

  const result = await makeRequest('오동도도 탈래', {
    explicit_context: { place_code: 'cablecar' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/오동도도 함께 넣을게요/);
  expect(result.payload.message_ko).toMatch(/지금까지:/);
  // Transition sentence must be present (케이블카의 상승에서, 오동도의 재충전으로 이어지는 여정이에요.)
  expect(result.payload.message_ko).toMatch(/케이블카의 상승에서/);
  expect(result.payload.message_ko).toMatch(/오동도의 재충전/);
  expect(result.payload.message_ko).toMatch(/이어지는 여정이에요/);
});

test('LB-P2 — odongdo→dolsan_nightscape: transition with 재충전/여운 roles', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanNightPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'odongdo', status: 'included' },
  ]));

  const result = await makeRequest('돌산공원도 탈래', {
    explicit_context: { place_code: 'odongdo' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/돌산공원도 함께 넣을게요/);
  expect(result.payload.message_ko).toMatch(/오동도의 재충전에서/);
  expect(result.payload.message_ko).toMatch(/돌산공원의 여운/);
  expect(result.payload.message_ko).toMatch(/이어지는 여정이에요/);
});

test('LB-P3 — dolsan_daegyo→dolsan_nightscape: transition with 흐름/여운 roles', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanNightPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'dolsan_daegyo', status: 'included' },
  ]));

  const result = await makeRequest('돌산공원도 탈래', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/돌산대교의 흐름에서/);
  expect(result.payload.message_ko).toMatch(/돌산공원의 여운/);
  expect(result.payload.message_ko).toMatch(/이어지는 여정이에요/);
});

test('LB-P4 — marine_park→cablecar: transition with 쉼/상승 roles', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'marine_park', status: 'included' },
  ]));

  const result = await makeRequest('케이블카도 탈래', {
    explicit_context: { place_code: 'marine_park' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/종포해양공원의 쉼에서/);
  expect(result.payload.message_ko).toMatch(/케이블카의 상승/);
  expect(result.payload.message_ko).toMatch(/이어지는 여정이에요/);
});

// ═══════════════════════════════════════════════════════════
// Negative — No transition
// ═══════════════════════════════════════════════════════════

test('LB-N1 — first place added (empty journey): no transition sentence', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('오동도도 탈래', {
    explicit_context: { place_code: 'odongdo' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/오동도도 함께 넣을게요/);
  // No transition sentence when no prior place
  expect(result.payload.message_ko).not.toMatch(/이어지는 여정이에요/);
});

test('LB-N2 — hyangiram as new place: no transition (hyangiram has no emotional_role)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'hyangiram' ? Promise.resolve(hyangiramPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'cablecar', status: 'included' },
  ]));

  const result = await makeRequest('향일암도 탈래', {
    explicit_context: { place_code: 'cablecar' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/향일암도 함께 넣을게요/);
  // No transition — hyangiram has no emotional_role
  expect(result.payload.message_ko).not.toMatch(/이어지는 여정이에요/);
});

test('LB-N3 — hyangiram as prior place: no transition (prior has no emotional_role)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'hyangiram', status: 'included' },
  ]));

  const result = await makeRequest('오동도도 탈래', {
    explicit_context: { place_code: 'odongdo' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).toMatch(/오동도도 함께 넣을게요/);
  // No transition — prior hyangiram has no emotional_role
  expect(result.payload.message_ko).not.toMatch(/이어지는 여정이에요/);
});

// ═══════════════════════════════════════════════════════════
// Isolation — Existing JOURNEY_ADD format preserved
// ═══════════════════════════════════════════════════════════

test('LB-I1 — Korean name correct (no "undefined") for marine_park in JOURNEY_ADD', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'marine_park' ? Promise.resolve(marinePlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('해양공원도 탈래', {
    explicit_context: { place_code: 'marine_park' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).not.toMatch(/undefined/);
  expect(result.payload.message_ko).toMatch(/종포해양공원도 함께 넣을게요/);
});

test('LB-I2 — Korean name correct (no "undefined") for dolsan_nightscape in JOURNEY_ADD', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanNightPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('돌산공원도 탈래', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).not.toMatch(/undefined/);
  expect(result.payload.message_ko).toMatch(/돌산공원도 함께 넣을게요/);
});

test('LB-I3 — Korean name correct (no "undefined") for dolsan_daegyo in JOURNEY_ADD', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_daegyo' ? Promise.resolve(dolsanBridgePlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('돌산대교도 탈래', {
    explicit_context: { place_code: 'dolsan_daegyo' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).not.toMatch(/undefined/);
  expect(result.payload.message_ko).toMatch(/돌산대교도 함께 넣을게요/);
});

test('LB-I4 — JOURNEY_ADD response still contains "지금까지:" list', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'odongdo', status: 'included' },
  ]));

  const result = await makeRequest('케이블카도 탈래', {
    explicit_context: { place_code: 'odongdo' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.message_ko).toMatch(/지금까지:/);
  expect(result.payload.message_ko).toMatch(/케이블카도 함께 넣을게요/);
});

// ═══════════════════════════════════════════════════════════
// Isolation — PLACE_LOOKUP unaffected by emotional_role addition
// ═══════════════════════════════════════════════════════════

test('LB-I5 — PLACE_LOOKUP cablecar: experience_ko returned, no transition sentence', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('케이블카 어때요?', {
    explicit_context: { place_code: 'cablecar' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).toMatch(/여수 바다 위를 가로지르는/);
  expect(result.payload.message_ko).not.toMatch(/이어지는 여정이에요/);
});

test('LB-I6 — PLACE_LOOKUP dolsan_nightscape: experience_ko returned, no transition sentence', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanNightPlace) : Promise.resolve(null)
  );
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('돌산공원 어때요?', {
    explicit_context: { place_code: 'dolsan_nightscape' },
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.message_ko).not.toMatch(/이어지는 여정이에요/);
});

// ═══════════════════════════════════════════════════════════
// Isolation — CONSTRAINT_UPDATE not affected (no transition)
// ═══════════════════════════════════════════════════════════

test('LB-I7 — CONSTRAINT_UPDATE: no transition sentence in response', async () => {
  sessionSvc.getSession.mockResolvedValue(sessionWithPlaces([
    { code: 'cablecar', status: 'included' },
    { code: 'odongdo', status: 'included' },
  ]));

  const result = await makeRequest('걷기 많이 힘든데 가능해?', {
    explicit_context: {},
  });

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  expect(result.payload.message_ko).not.toMatch(/이어지는 여정이에요/);
});
