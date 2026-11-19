'use strict';

/**
 * PHX-SOUL-QA-001 §52 — Route Exposure Gate 핸들러 통합 검증 (OFF 및 부분 ON)
 * 이 파일도 DB·세션·추천 서비스를 mock 한 격리 테스트 하네스에서만 실행된다.
 */

process.env.OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({
  extractSharedJourney: jest.fn().mockResolvedValue(null),
}));
jest.mock('../../services/quoteEngine', () => ({
  calculateQuote: jest.fn(),
  sanitizeForCustomer: jest.fn(),
}), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext:  jest.fn().mockReturnValue({}),
  isQuotable:           jest.fn().mockReturnValue(false),
  isComplexGroupHotel:  jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput:      jest.fn().mockReturnValue({}),
  _extractLeisure:      jest.fn().mockReturnValue(null),
  _extractHotelCode:    jest.fn().mockReturnValue(null),
  _extractDate:         jest.fn().mockReturnValue(null),
  _extractGuestCount:   jest.fn().mockReturnValue(null),
}), { virtual: true });

const contextSvc     = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc     = require('../../services/sessionService');
const skeletonSvc    = require('../../services/routeSkeletonService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const PRINCIPAL = { principal_id: 'gate-test-user', principal_type: 'GUEST' };
const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const HYANG   = { code: 'hyangiram', name_ko: '향일암', avg_stay_minutes: 120, type: 'attraction' };

const mkCtx = (overrides = {}) => ({
  people_type: 'solo', has_car: null, companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: null, group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' }, ...overrides,
});

const GATE_KEYS = ['SOUL_ROUTE_SKELETON_ENABLED', 'SOUL_QA_ISOLATED', 'NODE_ENV'];
const saved = {};
beforeAll(() => { for (const k of GATE_KEYS) saved[k] = process.env[k]; });
afterAll(() => { for (const k of GATE_KEYS) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });

let sid = 0;
const req = (message) => handleTravelRequest({
  message, sessionId: `gate-session-${++sid}`, hotelId: null, principal: PRINCIPAL, explicit_context: {},
});

beforeEach(() => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
  delete process.env.SOUL_ROUTE_SKELETON_ENABLED;
  delete process.env.SOUL_QA_ISOLATED;
  delete process.env.NODE_ENV;
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx({ people_type: 'family_elderly' }));
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (c) => ({ odongdo: ODONGDO, hyangiram: HYANG })[c] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [ODONGDO, HYANG], why_details: [], status: 'OK', understood_context: {} });
});

describe('Gate OFF — 골격 미생성·route 미노출', () => {
  test('환경변수 미설정: 명시적 1박 2일도 route 없음, buildSkeleton 미호출', async () => {
    const spy = jest.spyOn(skeletonSvc, 'buildSkeleton');
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route == null).toBe(true);
    expect(r.payload.presentation_mode).not.toBe('ROUTE_READY');
    expect(spy).not.toHaveBeenCalled();
  });

  test('ROUTE 플래그만 ON: route 없음', async () => {
    process.env.SOUL_ROUTE_SKELETON_ENABLED = '1';
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route == null).toBe(true);
  });

  test('QA 식별자만 ON: route 없음', async () => {
    process.env.SOUL_QA_ISOLATED = '1';
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route == null).toBe(true);
  });

  test('두 값 ON이어도 NODE_ENV=production 이면 route 없음', async () => {
    process.env.SOUL_ROUTE_SKELETON_ENABLED = '1';
    process.env.SOUL_QA_ISOLATED = '1';
    process.env.NODE_ENV = 'production';
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route == null).toBe(true);
  });

  test('잘못된 값(true)은 OFF 로 처리: route 없음', async () => {
    process.env.SOUL_ROUTE_SKELETON_ENABLED = 'true';
    process.env.SOUL_QA_ISOLATED = 'true';
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route == null).toBe(true);
  });

  test('OFF 상태 세션 journey_ctx 에 route_id·nights 를 새로 기록하지 않는다 (pre-RC3 경로)', async () => {
    await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    const writes = sessionSvc.updateJourneyContext.mock.calls.map((c) => c[1]);
    for (const w of writes) expect(w.route_id).toBeUndefined();
  });
});

describe('Gate ON (격리 하네스) — 명시적 숙박은 골격 생성', () => {
  test('두 값 ON + 1박 2일: route 1n2d 생성', async () => {
    process.env.SOUL_ROUTE_SKELETON_ENABLED = '1';
    process.env.SOUL_QA_ISOLATED = '1';
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route.stay_type).toBe('1n2d');
  });
});
