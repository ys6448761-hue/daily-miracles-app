/**
 * SOUL Exact Alias Fix — R1-R12 Regression Suite
 * Bug: single place name input (no verb) was not routed to PLACE_LOOKUP
 * Fix: message.trim() === alias → isPlaceLookup:true in _detectPlaceLookupIntent
 * Scope: services/soyeowoolService.js only. No DB/Schema/Route/JSX changes.
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

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');
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

const odongdoPlace     = { code: 'odongdo',           name_ko: '오동도',   physical_difficulty: 'low' };
const cablecarPlace    = { code: 'cablecar',           name_ko: '케이블카', physical_difficulty: 'low' };
const hyangiramPlace   = { code: 'hyangiram',          name_ko: '향일암',   physical_difficulty: 'high' };
const dolsanPark       = { code: 'dolsan_nightscape',  name_ko: '돌산공원', physical_difficulty: 'low' };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-exact-alias',
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
// POSITIVE: 단독 장소명 → PLACE_LOOKUP (R1-R4)
// ═══════════════════════════════════════════════════════════

test('R1 — "오동도" 단독 입력 → PLACE_LOOKUP (odongdo)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오동도');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('odongdo');
});

test('R2 — "케이블카" 단독 입력 → PLACE_LOOKUP (cablecar)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('케이블카');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('cablecar');
});

test('R3 — "향일암" 단독 입력 → PLACE_LOOKUP (hyangiram)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'hyangiram' ? Promise.resolve(hyangiramPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('향일암');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('hyangiram');
});

test('R4 — "돌산공원" 단독 입력 → PLACE_LOOKUP (dolsan_nightscape)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'dolsan_nightscape' ? Promise.resolve(dolsanPark) : Promise.resolve(null)
  );
  const result = await makeRequest('돌산공원');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('dolsan_nightscape');
});

// ═══════════════════════════════════════════════════════════
// NEGATIVE: 오분류 방지 (R5-R12)
// ═══════════════════════════════════════════════════════════

test('R5 — "오늘 오동도" → NOT PLACE_LOOKUP (alias가 메시지 전체가 아님)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오늘 오동도');
  expect(result.ok).toBe(true);
  // alias is embedded, not the full message → should NOT be PLACE_LOOKUP
  expect(result.payload.status).not.toBe('PLACE_LOOKUP');
});

test('R6 — "오동도 근처" → NOT PLACE_LOOKUP (DISCOVERY_OVERRIDES 우선)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [odongdoPlace] });
  const result = await makeRequest('오동도 근처');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('PLACE_LOOKUP');
});

test('R7 — "오동도 추천해줘" → NOT PLACE_LOOKUP (DISCOVERY_OVERRIDES: 추천해)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [odongdoPlace] });
  const result = await makeRequest('오동도 추천해줘');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('PLACE_LOOKUP');
});

test('R8 — "케이블카 요금 알려줘" → 기존 MEDIUM_LOOKUP 경로 유지 (PLACE_LOOKUP)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('케이블카 요금 알려줘');
  expect(result.ok).toBe(true);
  // "알려줘" is MEDIUM_LOOKUP → still routes to PLACE_LOOKUP (existing behavior preserved)
  expect(result.payload.status).toBe('PLACE_LOOKUP');
});

test('R9 — "오동도에 대해 알려줘" → 기존 STRONG_LOOKUP 경로 유지 (PLACE_LOOKUP)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'odongdo' ? Promise.resolve(odongdoPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('오동도에 대해 알려줘');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('odongdo');
});

test('R10 — "향일암 어때?" → 기존 SUITABILITY_LOOKUP 경로 유지 (isSuitabilityQuery=true)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'hyangiram' ? Promise.resolve(hyangiramPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('향일암 어때?');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  // Suitability path → message_ko should include judgment language
  expect(result.payload.message_ko).toBeTruthy();
});

test('R11 — "어디 갈까" → DISCOVERY (alias 없음)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [] });
  const result = await makeRequest('어디 갈까');
  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('PLACE_LOOKUP');
});

test('R12 — "해상케이블카" (복합 alias) 단독 입력 → PLACE_LOOKUP (cablecar)', async () => {
  travelGuideSvc.getPlaceByCode.mockImplementation(code =>
    code === 'cablecar' ? Promise.resolve(cablecarPlace) : Promise.resolve(null)
  );
  const result = await makeRequest('해상케이블카');
  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('PLACE_LOOKUP');
  expect(result.payload.resolved_code).toBe('cablecar');
});
