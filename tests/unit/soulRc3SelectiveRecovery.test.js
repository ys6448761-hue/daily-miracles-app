'use strict';

/**
 * PHX-SOUL-QA-001 RC3 Selective Recovery (M1~M5) — 회귀 검증
 *
 * M1·M2: routeSkeletonService 실제 모듈 사용 (jest.mock 금지) → 모듈 복구가 실제 경로에서 동작하는지 확인
 * M3:    H04·H17 운영시간 문장에 "관람 소요시간이 아니라" 모순 문구가 없어야 한다 (시간 값은 불변)
 * M4:    실제 후보가 없으면 "골라봤어요" 추천 완료 표현을 쓰지 않는다 / 후보는 있으나 연결 미검증이면 구분 문구
 * M5:    숙박 조건(N박)이 없는 요청은 2일 일정을 만들지 않는다 / 명시적 1박2일은 1n2d 일정을 만든다
 *
 * 외부 LLM 호출 없음. contextExtractionService·travelGuideService·sessionService 는 mock.
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

const contextSvc       = require('../../services/contextExtractionService');
const travelGuideSvc   = require('../../services/travelGuideService');
const sessionSvc       = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const PRINCIPAL = { principal_id: 'rc3-test-user', principal_type: 'GUEST' };

const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const CABLE   = { code: 'cablecar', name_ko: '여수 해상케이블카', avg_stay_minutes: 45, type: 'leisure' };
const HAMEL   = { code: 'hamel_lighthouse', name_ko: '하멜등대', avg_stay_minutes: 30, type: 'attraction' };
const HYANG   = { code: 'hyangiram', name_ko: '향일암', avg_stay_minutes: 120, type: 'attraction' };

const mkCtx = (overrides = {}) => ({
  people_type:            'solo',
  has_car:                null,
  companion_constraints:  { has_kids: false, has_elderly: false },
  meal_context:           'none',
  time_available_minutes: null,
  group_size:             null,
  _provenance:            { people_type: 'UNKNOWN', has_car: 'UNKNOWN' },
  ...overrides,
});

let sid = 0;
const req = (message) => handleTravelRequest({
  message,
  sessionId: `rc3-session-${++sid}`,
  hotelId: null,
  principal: PRINCIPAL,
  explicit_context: {},
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (code) =>
    ({ odongdo: ODONGDO, cablecar: CABLE, hamel_lighthouse: HAMEL, hyangiram: HYANG })[code] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [ODONGDO, CABLE, HAMEL, HYANG], why_details: [], status: 'OK', understood_context: {} });
});

describe('M3 — H04·H17 관람 소요시간과 운영시간 의미 구분', () => {
  test('H04: 관람 시간 질문 응답에 모순 면책 문구가 없다', async () => {
    const r = await req('오동도 관람시간은 얼마나 걸려?');
    const msg = r.payload.message_ko || '';
    expect(msg).not.toContain('관람 소요시간이 아니라');
    expect(msg).toContain('120분');
  });

  test('H17: 한 바퀴 소요 질문도 같은 모순 문구가 없다', async () => {
    const r = await req('오동도를 한 바퀴 둘러보려면 얼마나 걸려?');
    expect(r.payload.message_ko || '').not.toContain('관람 소요시간이 아니라');
  });
});

describe('M5 — 숙박 조건 없는 당일 요청에 2일 일정 금지', () => {
  test('H10: 성인 가족 도보 코스(숙박 미명시)는 route.days를 만들지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people_type: 'group', group_size: 3 }));
    const r = await req('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    expect(r.payload.route == null || !Array.isArray(r.payload.route.days)).toBe(true);
    expect(r.payload.presentation_mode).not.toBe('ROUTE_READY');
  });

  test('H10: 숙박 미명시 시 journey_ctx에 nights를 임의로 1로 기록하지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people_type: 'group', group_size: 3 }));
    await req('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    const writes = sessionSvc.updateJourneyContext.mock.calls.map(c => c[1]);
    for (const w of writes) {
      expect(w.nights).not.toBe(1);
    }
  });

  test('H09: 반나절 복수 장소 요청은 다일 일정을 만들지 않는다', async () => {
    const r = await req('오동도와 케이블카 반나절 코스를 만들어 줘.');
    expect(r.payload.route == null || !Array.isArray(r.payload.route.days)).toBe(true);
  });

  test('H20: 명시적 1박 2일 요청은 1n2d 일정을 만든다 (기존 동작 보존)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people_type: 'family_elderly' }));
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route).toBeTruthy();
    expect(r.payload.route.stay_type).toBe('1n2d');
    expect(r.payload.route.days.length).toBe(2);
  });

  test('H20 후보 0건: 장소 항목 없는 표지 골격은 코스로 제시하지 않는다', async () => {
    travelGuideSvc.recommend.mockResolvedValue({ places: [], why_details: [], status: 'NO_RESULT', understood_context: {} });
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people_type: 'family_elderly' }));
    const r = await req('부모님과 여수 1박 2일 여행 일정을 만들어 줘.');
    expect(r.payload.route == null || !Array.isArray(r.payload.route.days)).toBe(true);
    expect(r.payload.presentation_mode).not.toBe('ROUTE_READY');
  });
});

describe('M4 — 추천 완료 표현은 실제 후보가 있을 때만', () => {
  test('후보 0건이면 "골라봤어요"를 쓰지 않고 후보 없음을 말한다', async () => {
    travelGuideSvc.recommend.mockResolvedValue({ places: [], why_details: [], status: 'NO_RESULT', understood_context: {} });
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people_type: 'group', group_size: 3 }));
    const r = await req('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    const msg = r.payload.message_ko || '';
    expect(msg).not.toContain('골라봤어요');
    expect(msg).toMatch(/찾지 못했어요|후보가 없어요/);
  });

  test('후보가 있으면 도보·이동 연결 미검증을 명시하고 이동시간을 만들지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people_type: 'group', group_size: 3 }));
    const r = await req('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    const msg = r.payload.message_ko || '';
    expect(msg).toMatch(/확인되지 않/);
    expect(msg).not.toMatch(/\d+분[^.\n]*(도보|이동)[^.\n]*(걸려|소요)/); // 검증되지 않은 이동시간을 만들지 않는다
  });
});
