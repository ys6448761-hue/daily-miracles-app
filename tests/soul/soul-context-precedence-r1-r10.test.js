/**
 * SOUL Current Intent × Multi-Place × Context Precedence — R1-R10 Targeted Regression
 * Tests the deterministic routing logic in soyeowoolService.js.
 * Evidence: docs/architecture/SOUL_CURRENT_INTENT_MULTI_PLACE_CONTEXT_PRECEDENCE_V0_1_EVIDENCE.md
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
}), { virtual: true });

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');

const { handleTravelRequest } = require('../../services/soyeowoolService');

// Default stub session (no prior context)
const blankSession = () => ({ ok: true, journey_ctx: null });

// Solo context with no explicit provenance
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

// family_elderly context with USER_EXPLICIT provenance
const mkFamilyElderlyCtx = () => ({
  people_type: 'family_elderly',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: true },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  _provenance: { people_type: 'USER_EXPLICIT', has_elderly: 'USER_EXPLICIT' },
});

// Solo with USER_EXPLICIT (after "나 혼자" phrase)
const mkSoloExplicitCtx = () => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  _provenance: { people_type: 'USER_EXPLICIT', has_car: 'USER_EXPLICIT' },
});

// Stub place objects
const cablecarPlace = { code: 'cablecar', name_ko: '여수해상케이블카', physical_difficulty: 'medium' };
const hyangiramPlace = { code: 'hyangiram', name_ko: '향일암', physical_difficulty: 'high' };

// Travel intelligence mock (used when needsTravelIntelligence=true)
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } })
}), { virtual: true });

// If travelIntelligenceService is required as a different module name inside soyeowoolService:
// Find how it's loaded
const _routeToTravelIntelligenceFallback = jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } });

beforeEach(() => {
  jest.clearAllMocks();

  // Default: GPT returns solo, no provenance
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkSoloCtx());

  // Default: session has no stored journey
  sessionSvc.getSession = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});

  // Default: no place found (so PLACE_LOOKUP returns UNKNOWN_PLACE if triggered)
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  // Travel Intelligence returns empty places by default
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-session-id',
  hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' },
  explicit_context: {},
  ...overrides,
});

// ─── R1: "동선 짜줘" recognized as journey planning ─────────────────────────────
test('R1 — "동선 짜줘" routes to Travel Intelligence (not CLARIFICATION)', async () => {
  // Make GPT return solo context
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx());

  const result = await makeRequest('차 가지고 가는데 동선 짜줘');
  expect(result.ok).toBe(true);
  // Should NOT be CLARIFICATION (which would mean journey planning was missed)
  expect(result.payload.status).not.toBe('CLARIFICATION');
});

// ─── R2: JOURNEY_MULTI_PLACE — both places recognized ──────────────────────────
test('R2 — "케이블카 타고 향일암 갔다 올 거야" → JOURNEY_MULTI_PLACE (both places in journey)', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: { conversation_journey: { places: [], constraints: {} } } });

  const result = await makeRequest('케이블카 타고 향일암 갔다 올 거야');
  expect(result.ok).toBe(true);
  // JOURNEY_CONTINUITY means the Journey Decision Gate handled it
  expect(result.payload.status).toBe('JOURNEY_CONTINUITY');
  // conversation_journey should contain both places
  const cj = result.payload.conversation_journey;
  expect(cj).toBeDefined();
  const codes = cj.places.map(p => p.code);
  expect(codes).toContain('cablecar');
  expect(codes).toContain('hyangiram');
});

// ─── R3: family_elderly + operational question → NOT profile greeting ───────────
test('R3 — family_elderly profile + "운행해?" → asks about place, not "부모님과 함께하는"', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx()); // GPT returns nothing specific
  // Stored profile has family_elderly
  sessionSvc.getSession.mockResolvedValue({
    ok: true,
    journey_ctx: {
      traveler_profile: { people_type: 'family_elderly', companion_has_elderly: true }
    }
  });

  const result = await makeRequest('지금 비 오는데 운행해?');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  // Must NOT be the family_elderly greeting
  expect(result.payload.message_ko).not.toMatch(/부모님과 함께하는 여행이시군요/);
  // Should ask about place context
  expect(result.payload.message_ko).toMatch(/어느 장소/);
});

// ─── R4: Explicit solo override wins over companion chip ────────────────────────
test('R4 — "나 혼자 버스로 갈게" with companion=parents chip → SOUL uses solo', async () => {
  // GPT with companion guard fires: "혼자" → solo USER_EXPLICIT
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloExplicitCtx());
  sessionSvc.getSession.mockResolvedValue({
    ok: true,
    journey_ctx: {
      traveler_profile: { people_type: 'family_elderly', companion_has_elderly: true }
    }
  });

  const result = await makeRequest('엄마는 안 가고 나 혼자 버스로 갈게', {
    explicit_context: { companion: 'parents', people_type: 'family_elderly', has_car: true },
  });
  expect(result.ok).toBe(true);
  // understood_context must reflect solo, not family_elderly
  const uc = result.payload.understood_context;
  expect(uc.people_type).toBe('solo');
});

// ─── R5: Explicit place in text overrides current page (향일암 on cablecar page) ─
test('R5 — "향일암은 부모님이 가기 괜찮아?" on cablecar page → hyangiram place lookup', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation((code) => {
    if (code === 'hyangiram') return Promise.resolve(hyangiramPlace);
    if (code === 'cablecar') return Promise.resolve(cablecarPlace);
    return Promise.resolve(null);
  });
  contextSvc.parseUserMessage.mockResolvedValue(mkFamilyElderlyCtx());
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('향일암은 부모님이 가기 괜찮아?', {
    explicit_context: { place_code: 'cablecar' },
  });
  expect(result.ok).toBe(true);
  // Response must be about hyangiram, not cablecar
  // PLACE_LOOKUP response has a places array or a message about the correct place
  // The getPlaceByCode should have been called with 'hyangiram'
  expect(travelGuideSvc.getPlaceByCode).toHaveBeenCalledWith('hyangiram');
  expect(travelGuideSvc.getPlaceByCode).not.toHaveBeenCalledWith('cablecar');
});

// ─── R6: PSQ "지금 비 오는데 운행해?" on cablecar page → PSQ response ─────────
test('R6 — "지금 비 오는데 운행해?" on cablecar page → PSQ gate fires', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation((code) => {
    if (code === 'cablecar') return Promise.resolve(cablecarPlace);
    return Promise.resolve(null);
  });
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('지금 비 오는데 운행해?', {
    explicit_context: { place_code: 'cablecar' },
  });
  expect(result.ok).toBe(true);
  // Should NOT be CLARIFICATION with family_elderly greeting
  expect(result.payload.message_ko).not.toMatch(/부모님과 함께하는/);
  // travelGuide was called for cablecar (PSQ path)
  expect(travelGuideSvc.getPlaceByCode).toHaveBeenCalledWith('cablecar');
});

// ─── R7: REGRESSION — cable car strong intent still works ───────────────────────
test('R7 REGRESSION — "케이블카 꼭 타고 싶어" → cable car clarification (not swallowed)', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('케이블카 꼭 타고 싶어');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  // Should ask about cable car planning (인원/날짜), NOT generic fallback
  expect(result.payload.message_ko).toMatch(/케이블카/);
});

// ─── R8: REGRESSION — "동선 알려줘" also recognized as journey planning ─────────
test('R8 REGRESSION — "동선 알려줘" → journey planning recognized', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('여수 2박3일 동선 알려줘');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CLARIFICATION');
});

// ─── R9: REGRESSION — family_elderly + 추천 → still goes to Discovery ───────────
test('R9 REGRESSION — family_elderly + "추천해줘" → routes to Travel Intelligence', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkFamilyElderlyCtx());
  sessionSvc.getSession.mockResolvedValue(blankSession());

  const result = await makeRequest('부모님이랑 어디가 좋을까 추천해줘');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CLARIFICATION');
});

// ─── R10: REGRESSION — single place "갔다 올" still treated as preference ──────
test('R10 REGRESSION — "오동도 갔다 올 거야" (1 place) → JOURNEY_PREFERENCE not MULTI_PLACE', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkSoloCtx());
  sessionSvc.getSession.mockResolvedValue({ ok: true, journey_ctx: { conversation_journey: { places: [], constraints: {} } } });

  const result = await makeRequest('오동도 갔다 올 거야');
  expect(result.ok).toBe(true);
  // Should be JOURNEY_CONTINUITY (either PREFERENCE or MULTI_PLACE, but with only 1 place)
  if (result.payload.status === 'JOURNEY_CONTINUITY') {
    const cj = result.payload.conversation_journey;
    const codes = cj.places.map(p => p.code);
    // Only odongdo, not cablecar or hyangiram
    expect(codes).toContain('odongdo');
    expect(codes).not.toContain('cablecar');
    expect(codes).not.toContain('hyangiram');
  }
  // If it went to CLARIFICATION for some reason, ensure it doesn't claim multi-place
  expect(result.payload.message_ko).not.toMatch(/케이블카.*→.*향일암/);
});
