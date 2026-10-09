/**
 * SOUL City Context Safety Guard V0.1 — R1-R11 Test Suite
 *
 * Guard location: handleTravelRequest() — first gate, before PLACE_LOOKUP and DISCOVERY.
 * Purpose: prevent unsupported-city requests (순천/광양) from receiving Yeosu results.
 *
 * Required Founder cases:
 *   "여수와 순천 중 어디가 좋을까?" → NOT multi-city → CITY_AMBIGUOUS
 *   "여수 말고 순천"                → CITY_UNSUPPORTED
 *   "순천은 다음에, 오늘은 여수"    → normal Yeosu flow (not blocked)
 *   "여수는 다음에, 오늘은 순천"    → CITY_UNSUPPORTED
 *   "광양은 빼고 여수에서만"         → normal Yeosu flow (not blocked)
 *   "여수 1박, 순천 1박, 광양 1박"   → MULTI_CITY_PARTIAL
 *   "오동도" / "케이블카"            → PLACE_LOOKUP (regression guard)
 *
 * Scope: soyeowoolService.js only. DB/Schema/Route/JSX: NONE.
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

const odongdoPlace  = { code: 'odongdo',  name_ko: '오동도',  physical_difficulty: 'low' };
const cablecarPlace = { code: 'cablecar', name_ko: '케이블카', physical_difficulty: 'low' };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-city-guard',
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
// R1-R3: 비교 / 다지역 / 미지원 지역 → 차단
// ═══════════════════════════════════════════════════════════

test('R1 — "여수와 순천 중 어디가 좋을까?" → CITY_AMBIGUOUS (MULTI_CITY 분류 금지)', async () => {
  const result = await makeRequest('여수와 순천 중 어디가 좋을까?');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_AMBIGUOUS');
  expect(result.payload.presentation_mode).toBe('CLARIFICATION');
  // 절대 MULTI_CITY_PARTIAL 이어선 안 됨
  expect(result.payload.status).not.toBe('MULTI_CITY_PARTIAL');
});

test('R2 — "여수 1박, 순천 1박, 광양 1박" → MULTI_CITY_PARTIAL', async () => {
  const result = await makeRequest('여수 1박, 순천 1박, 광양 1박');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('MULTI_CITY_PARTIAL');
  expect(result.payload.presentation_mode).toBe('CLARIFICATION');
});

test('R3 — "여수 말고 순천" → CITY_UNSUPPORTED', async () => {
  const result = await makeRequest('여수 말고 순천');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
  expect(result.payload.presentation_mode).toBe('CLARIFICATION');
});

// ═══════════════════════════════════════════════════════════
// R4-R5: 지연/제외 패턴 → 정상 여수 흐름 (차단 금지)
// ═══════════════════════════════════════════════════════════

test('R4 — "순천은 다음에, 오늘은 여수" → 차단 금지 (정상 여수 흐름)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('순천은 다음에, 오늘은 여수');
  expect(result.ok).toBe(true);
  // Guard must NOT intercept → status is NOT one of the guard statuses
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
  expect(result.payload.status).not.toBe('MULTI_CITY_PARTIAL');
  expect(result.payload.status).not.toBe('CITY_AMBIGUOUS');
});

test('R5 — "광양은 빼고 여수에서만" → 차단 금지 (정상 여수 흐름)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('광양은 빼고 여수에서만');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
  expect(result.payload.status).not.toBe('MULTI_CITY_PARTIAL');
  expect(result.payload.status).not.toBe('CITY_AMBIGUOUS');
});

// ═══════════════════════════════════════════════════════════
// R6: 미지원 도시가 현재 요청인 경우 → 차단
// ═══════════════════════════════════════════════════════════

test('R6 — "여수는 다음에, 오늘은 순천" → CITY_UNSUPPORTED', async () => {
  const result = await makeRequest('여수는 다음에, 오늘은 순천');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
});

// ═══════════════════════════════════════════════════════════
// R7-R8: 미지원 도시 단독/하고 싶어 → 차단 (DISCOVERY 경유 오안내 방지)
// ═══════════════════════════════════════════════════════════

test('R7 — "순천에서 하루 보내고 싶어" → CITY_UNSUPPORTED (DISCOVERY 경유 오안내 방지)', async () => {
  const result = await makeRequest('순천에서 하루 보내고 싶어');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
});

test('R8 — "광양 맛집 추천해줘" → CITY_UNSUPPORTED', async () => {
  const result = await makeRequest('광양 맛집 추천해줘');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
});

// ═══════════════════════════════════════════════════════════
// R9-R11: 회귀 — 여수 단독·장소 단독 → 정상 처리
// ═══════════════════════════════════════════════════════════

test('R9 — "어디 갈까" → 차단 금지 (guard 무관)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('어디 갈까');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CITY_UNSUPPORTED');
  expect(result.payload.status).not.toBe('MULTI_CITY_PARTIAL');
  expect(result.payload.status).not.toBe('CITY_AMBIGUOUS');
});

test('R10 — "오동도" 단독 입력 → PLACE_LOOKUP (city guard 통과 후 alias 처리)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오동도');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('odongdo');
});

test('R11 — "케이블카" 단독 입력 → PLACE_LOOKUP (city guard 통과 후 alias 처리)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('케이블카');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('cablecar');
});
