/**
 * SOUL Short Operational Query Gate V0.1 — R1-R8 Test Suite
 *
 * Bug: short operational keywords (주차, 요금, etc. < 5 chars) in MuyojeongHomePage
 *      returned HTTP 400 ("좀 더 자세히 말씀해주세요") from contextExtractionService length guard.
 *
 * Fix:
 *  1. SHORT_OPERATIONAL gate: when no place_code + matches SHORT_OPERATIONAL_RE → PLACE_CONTEXT_REQUIRED
 *  2. _isPlaceSpecificQuery: added 주차/화장실/운영시간 so place_code+keyword → PSQ path (not 400)
 *
 * Scope: soyeowoolService.js only. DB/Schema/Route/JSX: unchanged.
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
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } })
}), { virtual: true });

const contextSvc    = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc    = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const blankSession = () => ({ ok: true, journey_ctx: null });
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

const dolsanPlace  = { code: 'dolsan_nightscape', name_ko: '돌산공원', physical_difficulty: 'low' };
const odongdoPlace = { code: 'odongdo',           name_ko: '오동도',   physical_difficulty: 'low' };
const cablecarPlace = { code: 'cablecar',          name_ko: '케이블카', physical_difficulty: 'low' };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-short-op',
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
// R1-R4: 장소 없는 단독 키워드 → PLACE_CONTEXT_REQUIRED (HTTP 200)
// ═══════════════════════════════════════════════════════════

test('R1 — "주차" (no place_code) → PLACE_CONTEXT_REQUIRED (HTTP 200, not 400)', async () => {
  const result = await makeRequest('주차');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_CONTEXT_REQUIRED');
  expect(result.payload.presentation_mode).toBe('CLARIFICATION');
  expect(result.payload.message_ko).toContain('장소');
});

test('R2 — "요금" (no place_code) → PLACE_CONTEXT_REQUIRED', async () => {
  const result = await makeRequest('요금');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_CONTEXT_REQUIRED');
  expect(result.payload.presentation_mode).toBe('CLARIFICATION');
});

test('R3 — "입장료" (no place_code) → PLACE_CONTEXT_REQUIRED', async () => {
  const result = await makeRequest('입장료');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_CONTEXT_REQUIRED');
});

test('R4 — "화장실" (no place_code) → PLACE_CONTEXT_REQUIRED', async () => {
  const result = await makeRequest('화장실');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_CONTEXT_REQUIRED');
});

// ═══════════════════════════════════════════════════════════
// R5-R6: 회귀 — alias PLACE_LOOKUP 유지
// ═══════════════════════════════════════════════════════════

test('R5 — "오동도" 단독 → PLACE_LOOKUP (short-op gate 미적용)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오동도');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('odongdo');
});

test('R6 — "케이블카" 단독 → PLACE_LOOKUP (short-op gate 미적용)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('케이블카');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('cablecar');
});

// ═══════════════════════════════════════════════════════════
// R7: place_code 있을 때 "주차" → PLACE_SPECIFIC_QUERY (PSQ 경로 유지)
// ═══════════════════════════════════════════════════════════

test('R7 — "주차" with place_code=dolsan_nightscape → PLACE_SPECIFIC_QUERY (PSQ 경로)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPlace) : Promise.resolve(null)
  );
  const result = await handleTravelRequest({
    message: '주차',
    sessionId: 'test-short-op-psq',
    hotelId: null,
    principal: { principal_id: 'test-user', principal_type: 'GUEST' },
    explicit_context: { place_code: 'dolsan_nightscape' },
  });
  expect(result.ok).toBe(true);
  // SHORT_OPERATIONAL gate must be skipped (place_code present) → PSQ path
  expect(result.payload.status).not.toBe('PLACE_CONTEXT_REQUIRED');
  // PSQ path returns PLACE_SPECIFIC_QUERY
  expect(result.payload.status).toBe('PLACE_SPECIFIC_QUERY');
});

// ═══════════════════════════════════════════════════════════
// R8: City Guard 회귀
// ═══════════════════════════════════════════════════════════

test('R8 — "순천에서 하루 보내고 싶어" → CITY_UNSUPPORTED (City Guard 회귀)', async () => {
  const result = await makeRequest('순천에서 하루 보내고 싶어');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
});
