'use strict';

/**
 * CourseDisplay Connection — MuyojeongHomePage V1.2
 *
 * Verifies that when SOUL API returns course.blocks, the response payload
 * propagates the course field so the frontend CourseDisplay can render it.
 *
 * Context:
 *   - CourseDisplay existed in SoulCableCarPage but was NOT connected to MuyojeongHomePage.
 *   - Fix: import CourseDisplay + conditional render in MuyojeongHomePage.jsx.
 *   - Founder's Diagnostic: "차량으로 하루 8시간 여행할 거야. 케이블카, 하멜등대, 향일암을..."
 *     only showed message_ko — course blocks were invisible to the user.
 *
 * Test cases:
 *   T1: Multi-place 8-hour request → response.course.blocks propagated (non-null)
 *   T2: tgResult with no course → response.course is null (guard works)
 *   T3: course.blocks shape — place + travel_transition blocks present
 *   T4: travel_transition without duration_range → null (D2 honesty: no fake times)
 *   T5: PARTIAL response (no places) → course is null
 *   T6: Single-place course → course.blocks still propagated if tgResult provides it
 *
 * Run: npx jest --testPathPattern="soulCourseDisplayConnect"
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
const sharedJourneySvc = require('../../services/sharedJourneyService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const SESSION_ID = 'test-course-display';
const PRINCIPAL  = { principal_id: 'test-user', principal_type: 'GUEST' };

const blankSession = () => ({ ok: true, journey_ctx: null });

const mkCtx = (overrides = {}) => ({
  people_type: 'solo',
  has_car: true,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 480,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

const cablecarPlace = { code: 'cablecar',         name_ko: '여수해상케이블카', physical_difficulty: 'low', avg_stay_minutes: 45 };
const hamelPlace    = { code: 'hamel_lighthouse',  name_ko: '하멜등대',       physical_difficulty: 'low', avg_stay_minutes: 40 };
const hyangiramPlace = { code: 'hyangiram',        name_ko: '향일암',         physical_difficulty: 'medium', avg_stay_minutes: 60 };

// Minimal course shape that CourseDisplay expects
const mkCourse = (places, withTravelTime = false) => ({
  blocks: [
    ...places.flatMap((place, i) => {
      const placeBlock = { type: 'place', code: place.code, name_ko: place.name_ko, stay_minutes: place.avg_stay_minutes };
      if (i < places.length - 1) {
        return [
          placeBlock,
          {
            type: 'travel_transition',
            message_ko: `${place.name_ko}에서 이동합니다`,
            estimated_duration_range: withTravelTime ? { min: 10, max: 20 } : null,
          },
        ];
      }
      return [placeBlock];
    }),
  ],
  actual_stop_count: places.length,
  summary: { total_stay_minutes: places.reduce((sum, p) => sum + p.avg_stay_minutes, 0) },
  message_ko: null,
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
  contextSvc.parseUserMessage      = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession            = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext  = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode   = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend        = jest.fn().mockResolvedValue({ places: [cablecarPlace] });
  sharedJourneySvc.extractSharedJourney = jest.fn().mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════════════
// T1 — 3-place 8-hour request → course.blocks propagated
// ══════════════════════════════════════════════════════════════

test('T1 — 케이블카+하멜등대+향일암 8시간 → response.course.blocks 전달', async () => {
  const course = mkCourse([cablecarPlace, hamelPlace, hyangiramPlace]);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hamelPlace, hyangiramPlace],
    course,
  });

  // Note: message must contain course-intent pattern ("코스 짜줘") to reach TRAVEL_INTELLIGENCE.
  // "모두 가고 싶어" without course intent triggers Journey Decision Gate (different path).
  const result = await makeRequest('차량으로 하루 8시간. 케이블카, 하멜등대, 향일암 코스 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.course).not.toBeNull();
  expect(result.payload.course.blocks).toBeDefined();
  expect(result.payload.course.blocks.length).toBeGreaterThan(0);

  // All 3 place blocks present
  const placeCodes = result.payload.course.blocks
    .filter(b => b.type === 'place')
    .map(b => b.code);
  expect(placeCodes).toContain('cablecar');
  expect(placeCodes).toContain('hamel_lighthouse');
  expect(placeCodes).toContain('hyangiram');
});

// ══════════════════════════════════════════════════════════════
// T2 — tgResult with no course → response.course is null
// ══════════════════════════════════════════════════════════════

test('T2 — tgResult.course 없음 → response.course is null (CourseDisplay 미렌더)', async () => {
  travelGuideSvc.recommend.mockResolvedValue({ places: [cablecarPlace] }); // no course

  const result = await makeRequest('케이블카 추천해줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.course).toBeNull();
});

// ══════════════════════════════════════════════════════════════
// T3 — course.blocks shape: place + travel_transition interleaved
// ══════════════════════════════════════════════════════════════

test('T3 — course.blocks shape: place + travel_transition 교차 구조', async () => {
  const course = mkCourse([cablecarPlace, hamelPlace]);
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hamelPlace],
    course,
  });

  const result = await makeRequest('케이블카랑 하멜등대 코스 짜줘.');

  const blocks = result.payload.course.blocks;
  expect(blocks[0].type).toBe('place');
  expect(blocks[1].type).toBe('travel_transition');
  expect(blocks[2].type).toBe('place');
});

// ══════════════════════════════════════════════════════════════
// T4 — travel_transition with null duration (D2 honesty)
// ══════════════════════════════════════════════════════════════

test('T4 — travel_transition.estimated_duration_range null 허용 (이동시간 불명 D2 정직 규칙)', async () => {
  const course = mkCourse([cablecarPlace, hamelPlace], false); // withTravelTime = false
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace, hamelPlace],
    course,
  });

  const result = await makeRequest('케이블카랑 하멜등대 코스 짜줘.');

  const travelBlock = result.payload.course.blocks.find(b => b.type === 'travel_transition');
  expect(travelBlock).toBeDefined();
  // D2: null is valid — frontend shows single footer notice instead of fake time
  expect(travelBlock.estimated_duration_range).toBeNull();
});

// ══════════════════════════════════════════════════════════════
// T5 — PARTIAL response → course null (no blocks to display)
// ══════════════════════════════════════════════════════════════

test('T5 — 시간 정보 없는 요청(PARTIAL) → course null', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ time_available_minutes: null }));
  travelGuideSvc.recommend.mockResolvedValue({ places: [] }); // PARTIAL — no places selected

  const result = await makeRequest('어디 갈까요?');

  expect(result.ok).toBe(true);
  // When no places selected, course should be null
  expect(result.payload.course).toBeNull();
});

// ══════════════════════════════════════════════════════════════
// T6 — Single-place course → blocks propagated when provided
// ══════════════════════════════════════════════════════════════

test('T6 — 단일 장소 코스도 blocks 전달 시 course 포함', async () => {
  const singleCourse = {
    blocks: [{ type: 'place', code: 'cablecar', name_ko: '여수해상케이블카', stay_minutes: 45 }],
    actual_stop_count: 1,
    summary: { total_stay_minutes: 45 },
    message_ko: null,
  };
  travelGuideSvc.recommend.mockResolvedValue({
    places: [cablecarPlace],
    course: singleCourse,
  });

  const result = await makeRequest('케이블카 반나절 코스 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.course).not.toBeNull();
  expect(result.payload.course.blocks).toHaveLength(1);
  expect(result.payload.course.blocks[0].code).toBe('cablecar');
});
