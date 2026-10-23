'use strict';

/**
 * CAR_INFO / COURSE_PLANNING Separation — CI-1~CI-7
 *
 * V0.1 fix (2026-10-23):
 *   Frontend: "차량으로" chip query: "동선을 알려줘" → "주차 정보를 알려줘"
 *   Backend : _isJourneyPlanningIntent line 1196 에서 "동선" 제거
 *
 * Verifies actual API payload, not just classification function results.
 * (Founder: "분류 함수 결과만으로 PASS 판정 금지. 최종 API payload와 실제
 *   CourseDisplay 표시 조건까지 검증한다.")
 *
 * CI-1: 차량 new query + time DOMAIN_FALLBACK → course=null, TIME_OPTIONS 미노출
 *        [PRODUCTION-ACCURATE MOCK — 2-line fix 부족함 검증용]
 * CI-2: 차량 new query + has_car=true + explicit time → parking_ko 포함 (C-3 유지)
 * CI-3: "여수 여행코스를 짜줘" + DOMAIN_FALLBACK → Time Gate CLARIFICATION (T1 회귀)
 * CI-4: "여수 동선 짜줘" → recommend 호출 (line 1192 JourneyPlanning 유지)
 * CI-5: "여수 일정 알려줘" → recommend 호출 (line 1196 JourneyPlanning 유지)
 * CI-6: "여수 동선 알려줘" → Discovery (fix 후 line 1196에서 제거됨)
 * CI-7: Time Gate CLARIFICATION 응답 → course=null 보장
 *
 * Run: npx jest --testPathPatterns="soulCarInfoSeparation"
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

const contextSvc       = require('../../services/contextExtractionService');
const travelGuideSvc   = require('../../services/travelGuideService');
const sessionSvc       = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const SESSION_ID = 'test-car-info-separation';
const PRINCIPAL  = { principal_id: 'test-user', principal_type: 'GUEST' };

// 차량 버튼 new query (after fix)
const CAR_QUERY_NEW = '여수에서 차로 가기 좋은 곳과 주차 정보를 알려줘.';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const blankSession = () => ({ ok: true, journey_ctx: null });

// time DOMAIN_FALLBACK context — time_available_minutes provenance UNKNOWN
const mkCtxFallback = (overrides = {}) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'UNKNOWN' },
  ...overrides,
});

// explicit time context — no DOMAIN_FALLBACK for time
const mkCtxExplicitTime = (overrides = {}) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 180,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'USER_EXPLICIT' },
  ...overrides,
});

// Place stub: uses both `code` (client payload) and `place_code` (C-3 parking lookup key)
// cablecar has parking_ko in _PLACE_KNOWLEDGE: '자산(해야)·돌산(놀아) ...'
const cablecarPlace = {
  code: 'cablecar',
  place_code: 'cablecar',
  name_ko: '여수해상케이블카',
  physical_difficulty: 'low',
  avg_stay_minutes: 45,
  suitable_for: [],
  emotion_tags: [],
};

// Minimal course stub — simulates what travelGuideService._composeJourney produces
// travelGuideService.recommend() calls _composeJourney() unconditionally (line 194),
// so every recommend() call returns a course in production.
const mkCourse = () => ({
  type: 'course',
  version: 'v0',
  time_slot: 'half_day',
  available_minutes: 180,
  target_stop_count: 3,
  actual_stop_count: 1,
  blocks: [],
  summary: {
    total_known_activity_minutes: 45,
    total_stay_minutes: 45,
    estimated_meal_time: 60,
    estimated_cafe_time: 0,
    unknown_travel_segments: 0,
    estimated_total_range: null,
    fit_status: 'travel_time_unverified',
  },
});

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
  contextSvc.parseUserMessage     = jest.fn().mockResolvedValue(mkCtxFallback());
  sessionSvc.getSession           = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode  = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend       = jest.fn().mockResolvedValue({ places: [cablecarPlace] });
});

// ══════════════════════════════════════════════════════════════
// CI-1 — 차량 버튼 new query + time DOMAIN_FALLBACK
// DESIRED: course=null, next_options에 TIME_OPTIONS 없음
//
// [PRODUCTION-ACCURATE MOCK]
// travelGuideService.recommend() calls _composeJourney() unconditionally (line 194)
// → tgResult.course is always non-null in production
// PARTIAL status (time DOMAIN_FALLBACK) → next_options always gets TIME_OPTIONS (line 1917)
// → EXPECTED FAILURES reveal that 2-line fix alone is insufficient:
//     FAIL #1: payload.course !== null (course not suppressed by service)
//     FAIL #2: next_options contains TIME_OPTIONS (PARTIAL not suppressed for car-info)
// ══════════════════════════════════════════════════════════════

test('CI-1 — 차량 new query + DOMAIN_FALLBACK → course=null + TIME_OPTIONS 미노출 [insufficiency check]', async () => {
  // Production-accurate: TG generates course unconditionally
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace], course: mkCourse() });

  const result = await makeRequest(CAR_QUERY_NEW, { explicit_context: { has_car: true } });

  expect(result.ok).toBe(true);
  // DESIRED: car-info queries must not show course
  expect(result.payload.course).toBeNull();
  // DESIRED: car-info queries must not show time selection button
  expect(result.payload.next_options).not.toContain('시간이 얼마나 남으셨어요?');
});

// ══════════════════════════════════════════════════════════════
// CI-2 — has_car=true + explicit time → parking_ko 포함 (C-3 supplement 유지)
// _PLACE_KNOWLEDGE['cablecar'].parking_ko 가 message_ko에 추가되어야 한다.
// C-3은 status 무관하게 동작 (line 3269: has_car===true && places.length && !_isCourseMsg).
// ══════════════════════════════════════════════════════════════

test('CI-2 — has_car=true + explicit time + cablecar → message_ko에 parking_ko 포함', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtxExplicitTime({ has_car: true }));
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace] });

  const result = await makeRequest(CAR_QUERY_NEW, { explicit_context: { has_car: true } });

  expect(result.ok).toBe(true);
  // C-3: parking_ko from _PLACE_KNOWLEDGE['cablecar'] appended
  expect(result.payload.message_ko).toContain('주차 정보:');
  // Verified parking text for cablecar (yeosu.go.kr or operator-confirmed source)
  expect(result.payload.message_ko).toContain('자산(해야)·돌산(놀아)');
});

// ══════════════════════════════════════════════════════════════
// CI-3 — T1 regression: "코스 짜줘" + DOMAIN_FALLBACK → Time Gate 발동
// Time Gate V0.1이 차량 수정 후에도 정상 동작해야 한다.
// ══════════════════════════════════════════════════════════════

test('CI-3 — "여수 여행코스를 짜줘" + DOMAIN_FALLBACK → Time Gate CLARIFICATION (T1 회귀)', async () => {
  const result = await makeRequest('여수 여행코스를 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.course).toBeNull();
  expect(result.payload.next_options).toContain('시간이 얼마나 남으셨어요?');
  // Gate must block TG
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
});

// ══════════════════════════════════════════════════════════════
// CI-4 — "동선 짜줘" → _isJourneyPlanningIntent=true (line 1192 유지)
// _isCourseQuery=false이므로 Time Gate 미발동; recommend 호출됨.
// Fix에서 line 1192는 변경하지 않았으므로 이 패턴은 JourneyPlanning으로 유지.
// ══════════════════════════════════════════════════════════════

test('CI-4 — "여수 동선 짜줘" → JourneyPlanning line 1192 유지 — recommend 호출됨', async () => {
  const result = await makeRequest('여수 동선 짜줘.');

  expect(result.ok).toBe(true);
  // _isCourseQuery=false → Time Gate 미발동 → recommend 호출
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  // time DOMAIN_FALLBACK → PARTIAL (Time Gate 미발동이므로 CLARIFICATION 아님)
  expect(result.payload.status).toBe('PARTIAL');
});

// ══════════════════════════════════════════════════════════════
// CI-5 — "일정 알려줘" → _isJourneyPlanningIntent=true (line 1196 유지)
// fix는 line 1196에서 "동선"만 제거; "일정|코스|여행 계획"은 그대로 유지.
// ══════════════════════════════════════════════════════════════

test('CI-5 — "여수 일정 알려줘" → JourneyPlanning line 1196 유지 — recommend 호출됨', async () => {
  const result = await makeRequest('여수 일정 알려줘.');

  expect(result.ok).toBe(true);
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  expect(result.payload.status).toBe('PARTIAL');
});

// ══════════════════════════════════════════════════════════════
// CI-6 — "동선 알려줘" → Discovery (fix 후 JourneyPlanning에서 제거됨)
// Before fix: line 1196이 "동선"을 포함 → _isJourneyPlanningIntent=true
// After fix:  line 1196에서 "동선" 제거 → _isJourneyPlanningIntent=false
// _isDiscoveryIntent=true ("알려줘") → needsTravelIntelligence=true → recommend 호출
// ══════════════════════════════════════════════════════════════

test('CI-6 — "여수 동선 알려줘" → Discovery (fix 후 line 1196 제거) — recommend 호출됨', async () => {
  const result = await makeRequest('여수 동선 알려줘.');

  expect(result.ok).toBe(true);
  // Discovery path: _isDiscoveryIntent=true → needsTravelIntelligence=true → recommend called
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
  expect(result.payload.status).toBe('PARTIAL');
});

// ══════════════════════════════════════════════════════════════
// CI-7 — Time Gate CLARIFICATION 응답 → course=null 보장
// Time Gate 반환 payload에는 절대 course가 포함되면 안 된다.
// ══════════════════════════════════════════════════════════════

test('CI-7 — Time Gate CLARIFICATION 응답 → course=null + recommend 미호출', async () => {
  const result = await makeRequest('케이블카 포함해서 코스 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.status).toBe('CLARIFICATION');
  expect(result.payload.course).toBeNull();
  // Time Gate early-returns without calling TG
  expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
});
