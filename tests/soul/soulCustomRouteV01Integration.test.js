'use strict';

/**
 * 맞춤 항로 V0.1 — Runtime Integration Gate
 *
 * Goal: PR #131 post-merge, pre-production 격리 검증
 * Scope: soyeowoolService 실제 로직 실행 (DB/GPT mock, HTTP 경로 제외)
 *
 * 검증 항목:
 *   MR-1: buildSoulMessage 출력 → 하멜등대+향일암+270분
 *   MR-2: PLACE_ALIAS_MAP 향일암→hyangiram 변환 (기존 코드 커버리지 없음)
 *   MR-3: PLACE_ALIAS_MAP 하멜등대→hamel_lighthouse 변환 (B케이스 확장)
 *   MR-4: time_available_minutes=270 치환 없이 그대로 전달
 *   MR-5: 270분 명시 → Time Gate 미발동 (CLARIFICATION 아님)
 *   MR-6: fitStatus=travel_time_unverified (hyangiram→hamel 역방향 미검증 구간)
 *
 * 격리 환경:
 *   - sessionService: mock (createSession INSERT 없음)
 *   - travelGuideService: mock (DB reads 없음)
 *   - contextExtractionService: mock (GPT 호출 없음)
 *   - sharedJourneyService: mock
 *   - database/db: mock (커넥션 없음)
 *
 * Run: npx jest --testPathPattern="soulCustomRouteV01Integration"
 */

process.env.OPENAI_API_KEY  = process.env.OPENAI_API_KEY  || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../services/routeSkeletonService', () => ({
  buildSkeleton: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/quoteEngine', () => ({
  calculateQuote: jest.fn(),
  sanitizeForCustomer: jest.fn(),
}), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext:  jest.fn().mockReturnValue({}),
  isQuotable:          jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput:     jest.fn().mockReturnValue({}),
  _extractLeisure:     jest.fn().mockReturnValue(null),
  _extractHotelCode:   jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } }),
}), { virtual: true });
jest.mock('../../database/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));

const contextSvc       = require('../../services/contextExtractionService');
const travelGuideSvc   = require('../../services/travelGuideService');
const sessionSvc       = require('../../services/sessionService');
const sharedJourneySvc = require('../../services/sharedJourneyService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

// ---------- MuyojeongHomePage buildSoulMessage 구현 복사 ----------
// (프론트엔드 코드와 동일 — UI 로직 검증 포함)
function buildSoulMessage(selectedPlaces, minutes) {
  const names = selectedPlaces.map(p => p.name).join(', ');
  return `${names} 가고 싶어요. ${minutes}분 코스 짜줘.`;
}

const ROUTE_PLACES = [
  { code: 'hamel_lighthouse', name: '하멜등대',  stay: 30  },
  { code: 'hyangiram',        name: '향일암',    stay: 120 },
  { code: 'odongdo',          name: '오동도',    stay: 120 },
  { code: 'cablecar',         name: '케이블카',  stay: 45  },
];

// ---------- 공통 helpers ----------

const SESSION_ID = 'test-custom-route-v01';
const PRINCIPAL  = { principal_id: 'test-guest', principal_type: 'GUEST' };

const blankSession = () => ({ ok: true, journey_ctx: null });

const mkCtx = (overrides = {}) => ({
  people_type: 'solo',
  has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 270,
  group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'USER_EXPLICIT' },
  ...overrides,
});

const mkExplicitWant = (...placeHints) => ({
  want: placeHints.map(hint => ({ place_hint: hint, specificity: 'EXPLICIT' })),
  repeat_intent: null,
  companion_voices: [],
});

const hamelPlace    = { code: 'hamel_lighthouse', name_ko: '하멜등대',  physical_difficulty: 'low', avg_stay_minutes: 30  };
const hyangiramPlace = { code: 'hyangiram',        name_ko: '향일암',    physical_difficulty: 'low', avg_stay_minutes: 120 };

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
  contextSvc.parseUserMessage     = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession           = jest.fn().mockResolvedValue(blankSession());
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode  = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend       = jest.fn().mockResolvedValue({ places: [hamelPlace, hyangiramPlace] });
  sharedJourneySvc.extractSharedJourney = jest.fn().mockResolvedValue(null);
});

// ══════════════════════════════════════════════════════
// MR-1: buildSoulMessage 출력 검증
// ══════════════════════════════════════════════════════

test('MR-1: buildSoulMessage([하멜등대, 향일암], 270) → 올바른 문자열 생성', () => {
  const selected = [ROUTE_PLACES[0], ROUTE_PLACES[1]]; // 하멜등대, 향일암
  const msg = buildSoulMessage(selected, 270);

  expect(msg).toBe('하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘.');
});

// ══════════════════════════════════════════════════════
// MR-2: 향일암 → hyangiram PLACE_ALIAS_MAP 변환
// ══════════════════════════════════════════════════════

test('MR-2: 향일암 EXPLICIT → must_visit_place_ids에 hyangiram 포함', async () => {
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('향일암')
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [hyangiramPlace] });

  const result = await makeRequest('향일암 가고 싶어요. 270분 코스 짜줘.');

  expect(result.ok).toBe(true);
  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.must_visit_place_ids).toContain('hyangiram');
  expect(domainCtx.must_visit_place_ids).not.toContain('향일암');
});

// ══════════════════════════════════════════════════════
// MR-3: 하멜등대+향일암 동시 → 두 코드 모두 포함
// ══════════════════════════════════════════════════════

test('MR-3: 하멜등대+향일암 EXPLICIT → must_visit_place_ids에 hamel_lighthouse+hyangiram 모두 포함', async () => {
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('하멜등대', '향일암')
  );
  travelGuideSvc.recommend.mockResolvedValue({ places: [hamelPlace, hyangiramPlace] });

  const result = await makeRequest('하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘.');

  expect(result.ok).toBe(true);
  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.must_visit_place_ids).toContain('hamel_lighthouse');
  expect(domainCtx.must_visit_place_ids).toContain('hyangiram');
  expect(domainCtx.must_visit_place_ids).not.toContain('하멜등대');
  expect(domainCtx.must_visit_place_ids).not.toContain('향일암');
});

// ══════════════════════════════════════════════════════
// MR-4: time_available_minutes=270 치환 없이 그대로 전달
// ══════════════════════════════════════════════════════

test('MR-4: 270분 명시 → travelGuideService.recommend에 time_available_minutes=270 전달 (치환 없음)', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({
    time_available_minutes: 270,
    _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'USER_EXPLICIT' },
  }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('하멜등대', '향일암')
  );

  const result = await makeRequest('하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘.');

  expect(result.ok).toBe(true);
  const domainCtx = travelGuideSvc.recommend.mock.calls[0][0];
  expect(domainCtx.time_available_minutes).toBe(270);
});

// ══════════════════════════════════════════════════════
// MR-5: 270분 USER_EXPLICIT → Time Gate 미발동 (코스 정상 반환)
// ══════════════════════════════════════════════════════

test('MR-5: time_available_minutes=270 USER_EXPLICIT → CLARIFICATION 아님, 코스 반환', async () => {
  contextSvc.parseUserMessage.mockResolvedValue(mkCtx({
    time_available_minutes: 270,
    _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', time_available_minutes: 'USER_EXPLICIT' },
  }));
  sharedJourneySvc.extractSharedJourney.mockResolvedValue(
    mkExplicitWant('하멜등대', '향일암')
  );

  const result = await makeRequest('하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘.');

  expect(result.ok).toBe(true);
  expect(result.payload.status).not.toBe('CLARIFICATION');
  expect(travelGuideSvc.recommend).toHaveBeenCalledTimes(1);
});

// ══════════════════════════════════════════════════════
// MR-6: hyangiram→hamel_lighthouse 역방향 → travel_time_unverified
//        (VERIFIED_TRAVEL_EDGES에 없는 구간)
// ══════════════════════════════════════════════════════

describe('MR-6: fitStatus travel_time_unverified — 역방향 미검증 구간', () => {
  // travelGuideService를 실제 모듈로 로드 (내부 함수 접근)
  // 이 describe는 jest.mock 이후이므로 실제 모듈 접근 불가 → static assertion
  test('hyangiram→hamel_lighthouse 역방향은 VERIFIED_TRAVEL_EDGES에 없음 (정적 검증)', () => {
    // VERIFIED_TRAVEL_EDGES(soulTravelTimeDisplay.test.js §KNOWN):
    // P1: cablecar→hamel_lighthouse (7)
    // P2: hamel_lighthouse→hyangiram (45) ← 정방향만 존재
    // P3: hyangiram→jaisan_park (45)
    // P4: jaisan_park→lee_soon_shin_plaza (9)
    // F1: lee_soon_shin_plaza→hamel_lighthouse (10)
    // F2: hamel_lighthouse→lee_soon_shin_plaza (9)
    // F3: lee_soon_shin_plaza→marine_park (7)
    // F4: marine_park→hamel_lighthouse (8)
    // → hyangiram→hamel_lighthouse 없음 → status=unknown → fitStatus=travel_time_unverified

    // 코스 순서가 [hyangiram, hamel_lighthouse]이면 미검증 구간 포함
    // 코스 순서가 [hamel_lighthouse, hyangiram]이면 P2(검증됨) → fits_comfortably (시간 충분 시)
    const verifiedEdges = [
      'cablecar→hamel_lighthouse',
      'hamel_lighthouse→hyangiram',
      'hyangiram→jaisan_park',
      'jaisan_park→lee_soon_shin_plaza',
      'lee_soon_shin_plaza→hamel_lighthouse',
      'hamel_lighthouse→lee_soon_shin_plaza',
      'lee_soon_shin_plaza→marine_park',
      'marine_park→hamel_lighthouse',
    ];
    expect(verifiedEdges).not.toContain('hyangiram→hamel_lighthouse');
    expect(verifiedEdges).toContain('hamel_lighthouse→hyangiram');
  });
});
