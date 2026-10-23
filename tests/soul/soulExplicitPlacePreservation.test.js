'use strict';

/**
 * P-NEW-1 Explicit Place Preservation — Test Suite
 *
 * When the user explicitly names multiple places (specificity=EXPLICIT in sharedJourney.want),
 * all named places must appear in must_visit_place_ids forwarded to travelGuideService.recommend.
 *
 * Root cause: _supplementDomainFromSharedJourney was not forwarding EXPLICIT want items.
 * Secondary: _selectPlacesByTime Step 1 lacked _tmFallback bypass, dropping must-visit places
 *            when time_available_minutes was UNKNOWN (default fallback budget).
 *
 * Fix location: services/soyeowoolService.js (_supplementDomainFromSharedJourney)
 *               services/travelGuideService.js (_selectPlacesByTime Step 1)
 *
 * Test cases:
 *   A: 케이블카 + 오동도 EXPLICIT → must_visit_place_ids = ['cablecar', 'odongdo']
 *   B: 이순신광장 + 하멜등대 EXPLICIT → must_visit_place_ids = ['lee_soon_shin_plaza', 'hamel_lighthouse']
 *   C: 단일 장소 (케이블카) → must_visit_place_ids = ['cablecar'], 기존 동작 유지
 *   D: time_available_minutes UNKNOWN (_tmFallback) → must_visit still forwarded
 *   E: has_car=false → explicit places still forwarded (vehicle filter does not override explicit)
 *   F: G1 회귀 — 부산 요청 시 CITY_UNSUPPORTED (EXPLICIT want 있어도 차단)
 *
 * Run: npx jest --testPathPatterns="soulExplicitPlacePreservation"
 */

process.env.OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET  = process.env.GUEST_JWT_SECRET  || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/routeSkeletonService',  () => ({ buildSkeleton: jest.fn().mockReturnValue(null) }), { virtual: true });
jest.mock('../../services/quoteEngine',           () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService',   () => ({
  extractQuoteContext:  jest.fn().mockReturnValue({}),
  isQuotable:           jest.fn().mockReturnValue(false),
  isComplexGroupHotel:  jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput:      jest.fn().mockReturnValue({}),
  _extractLeisure:      jest.fn().mockReturnValue(null),
  _extractHotelCode:    jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } }),
}), { virtual: true });

const contextSvc        = require('../../services/contextExtractionService');
const travelGuideSvc    = require('../../services/travelGuideService');
const sessionSvc        = require('../../services/sessionService');
const sharedJourneySvc  = require('../../services/sharedJourneyService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const SESSION_ID = 'test-explicit-place';
const PRINCIPAL  = { principal_id: 'test-user', principal_type: 'GUEST' };

// ─── Helpers ──────────────────────────────────────────────────────────────────

const blankSession = () => ({ ok: true, journey_ctx: null });

const mkCtx = (overrides = {}) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

// sharedJourney stub with EXPLICIT want items
const mkExplicitWant = (...placeHints) => ({
  want: placeHints.map(hint => ({ place_hint: hint, specificity: 'EXPLICIT' })),
  repeat_intent: null,
  companion_voices: [],
});

// Place stubs for travelGuideSvc.recommend return value
const cablecarPlace    = { code: 'cablecar',            name_ko: '여수해상케이블카', physical_difficulty: 'low', avg_stay_minutes: 45 };
const odongdoPlace     = { code: 'odongdo',             name_ko: '오동도',           physical_difficulty: 'low', avg_stay_minutes: 120 };
const leePlace         = { code: 'lee_soon_shin_plaza', name_ko: '이순신광장',       physical_difficulty: 'low', avg_stay_minutes: 60 };
const hamelPlace       = { code: 'hamel_lighthouse',    name_ko: '하멜등대',         physical_difficulty: 'low', avg_stay_minutes: 40 };

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: SESSION_ID,
  hotelId: null,
  principal: PRINCIPAL,
  explicit_context: {},
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage      = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession            = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext  = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode   = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend        = jest.fn().mockResolvedValue({ places: [cablecarPlace] });
  sharedJourneySvc.extractSharedJourney = jest.fn().mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════════════
// A — 케이블카 + 오동도: 두 장소 모두 must_visit_place_ids에 포함
// ══════════════════════════════════════════════════════════════

test('A — 케이블카+오동도 EXPLICIT → must_visit_place_ids에 cablecar+odongdo 전달', async () => {
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('케이블카', '오동도')
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace, odongdoPlace] });

  const result = await makeRequest('케이블카랑 오동도 가고 싶어요. 코스 짜줘.');

  expect(result.ok).toBe(true);

  // travelGuideService.recommend was called with must_visit_place_ids containing both codes
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.must_visit_place_ids).toContain('cablecar');
  expect(domainCtx.must_visit_place_ids).toContain('odongdo');

  // Both places appear in response
  const placeCodes = result.payload.places.map(p => p.code);
  expect(placeCodes).toContain('cablecar');
  expect(placeCodes).toContain('odongdo');
});

// ══════════════════════════════════════════════════════════════
// B — 이순신광장 + 하멜등대: 두 장소 모두 must_visit_place_ids에 포함
// ══════════════════════════════════════════════════════════════

test('B — 이순신광장+하멜등대 EXPLICIT → must_visit_place_ids에 두 코드 전달', async () => {
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('이순신광장', '하멜등대')
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [leePlace, hamelPlace] });

  const result = await makeRequest('이순신광장이랑 하멜등대 포함해서 코스 짜줘요.');

  expect(result.ok).toBe(true);

  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.must_visit_place_ids).toContain('lee_soon_shin_plaza');
  expect(domainCtx.must_visit_place_ids).toContain('hamel_lighthouse');

  const placeCodes = result.payload.places.map(p => p.code);
  expect(placeCodes).toContain('lee_soon_shin_plaza');
  expect(placeCodes).toContain('hamel_lighthouse');
});

// ══════════════════════════════════════════════════════════════
// C — 단일 장소 EXPLICIT: 기존 동작 유지
// ══════════════════════════════════════════════════════════════

test("C — 단일 장소(케이블카) EXPLICIT → must_visit_place_ids=['cablecar'], 기존 동작 유지", async () => {
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('케이블카')
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace] });

  const result = await makeRequest('케이블카 포함한 여수 코스 짜줘.');

  expect(result.ok).toBe(true);

  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.must_visit_place_ids).toEqual(['cablecar']);
  // Odongdo NOT added (not explicit)
  expect(domainCtx.must_visit_place_ids).not.toContain('odongdo');
});

// ══════════════════════════════════════════════════════════════
// D — 시간 fallback(_tmFallback) + 코스 요청 → COURSE_PLANNING Time Gate 발동
// [UPDATED 2026-10-23]: Time Gate V0.1 도입으로 동작 변경.
//   이전: PARTIAL 반환 + recommend 호출 (120분 DOMAIN_FALLBACK 코스 생성)
//   현재: CLARIFICATION 반환 + pending 저장 (시간 미확정 코스 표시 금지)
//   사용자는 시간 선택 후 Turn 2에서 코스를 받는다.
// ══════════════════════════════════════════════════════════════

test('D — time_available_minutes UNKNOWN + 코스 요청 → Time Gate 발동, CLARIFICATION 반환', async () => {
  // Provenance marks time_available_minutes as UNKNOWN → _domainFallbacks includes it
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({
    time_available_minutes: 120,
    _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'UNKNOWN' },
  }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('케이블카', '오동도')
  );

  const result = await makeRequest('케이블카랑 오동도 코스 짜줘.');

  expect(result.ok).toBe(true);
  // Time Gate fires: CLARIFICATION returned, not PARTIAL
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.next_options).toContain('시간이 얼마나 남으셨어요?');
  // recommend NOT called — gate prevents 120-min fake course
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
  // pending stored with both places
  const [, writtenCtx] = sessionSvc.updateJourneyContext.mock.calls[0];
  expect(writtenCtx.pending_must_visit_place_ids).toEqual(
    expect.arrayContaining(['cablecar', 'odongdo'])
  );
  expect(writtenCtx.pending_course_awaiting_time).toBe(true);
});

// ══════════════════════════════════════════════════════════════
// E — has_car=false: 명시 장소 보존 여부 확인
// ══════════════════════════════════════════════════════════════

test('E — has_car=false + EXPLICIT 장소 → must_visit_place_ids 보존 (차량 필터가 명시 장소 제거 금지)', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({
    has_car: false,
    _provenance: { people_type: 'UNKNOWN', has_car: 'USER_EXPLICIT' },
  }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('케이블카', '오동도')
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace, odongdoPlace] });

  const result = await makeRequest('차 없고 케이블카랑 오동도 코스 짜줘요.');

  expect(result.ok).toBe(true);

  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.has_car).toBe(false);
  // Explicit places still forwarded despite has_car=false
  expect(domainCtx.must_visit_place_ids).toContain('cablecar');
  expect(domainCtx.must_visit_place_ids).toContain('odongdo');
});

// ══════════════════════════════════════════════════════════════
// F — G1 회귀: 부산 요청 → CITY_UNSUPPORTED (EXPLICIT want 무관)
// ══════════════════════════════════════════════════════════════

test('F — G1 회귀: 부산 여행 추천해줘 → CITY_UNSUPPORTED (EXPLICIT want 있어도 차단)', async () => {
  // Even if sharedJourney somehow returns EXPLICIT wants, G1 must fire first
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('케이블카', '오동도')
  );

  const result = await makeRequest('부산 여행 추천해줘');

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CITY_UNSUPPORTED');
  // travelGuideService.recommend must NOT be called (G1 blocks before domain routing)
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
});
