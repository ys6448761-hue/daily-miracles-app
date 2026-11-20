'use strict';

/**
 * PHX-MUYEOJEONG-FOOD §81 — SOUL 고객 질문 경로 (handleTravelRequest) 연결 테스트.
 * 식당 시간 질문은 LLM 이해 단계 (_understand) 를 거치지 않고 결정적으로 응답해야 한다.
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

const fs = require('fs');
const path = require('path');
const contextSvc     = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc     = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'munmeoji', 'restaurants.fixture.json'), 'utf8'));
const REAL = FIX.restaurants.filter((r) => !r._mock);
const PRINCIPAL = { principal_id: 'munmeoji-test-user', principal_type: 'GUEST' };

const _SAVED = { flag: process.env.SOUL_HYBRID_V1, preview: process.env.MUNMEOKJI_DEV_PREVIEW, node: process.env.NODE_ENV, render: process.env.RENDER };
beforeAll(() => {
  delete process.env.SOUL_HYBRID_V1;
  process.env.MUNMEOKJI_DEV_PREVIEW = '1';
  process.env.NODE_ENV = 'test';
  delete process.env.RENDER;
});
afterAll(() => {
  const restore = (k, v) => (v === undefined ? delete process.env[k] : (process.env[k] = v));
  restore('SOUL_HYBRID_V1', _SAVED.flag); restore('MUNMEOKJI_DEV_PREVIEW', _SAVED.preview);
  restore('NODE_ENV', _SAVED.node); restore('RENDER', _SAVED.render);
});

beforeEach(() => {
  jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
  // 2026-11-23 (월) 08:00 Asia/Seoul
  jest.setSystemTime(new Date('2026-11-23T08:00:00+09:00'));
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue({});
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc._getRestaurants = jest.fn(async (c, ci, meal) => REAL.filter((r) => (r.meal_context || []).includes(meal)));
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [], why_details: [], status: 'OK', understood_context: {} });
});
afterEach(() => { jest.useRealTimers(); });

const req = (message) => handleTravelRequest({
  message, sessionId: `munmeoji-${Math.random().toString(36).slice(2)}`, hotelId: null, principal: PRINCIPAL, explicit_context: {},
});

describe('식당 시간 질문은 LLM 이해 단계를 거치지 않고 결정적으로 응답한다', () => {
  test('지금 아침 먹을 곳: LLM 추출 호출 없음, 명동게장본관 안내', async () => {
    const r = await req('지금 아침 먹을 곳 알려줘.');
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
    expect(r.payload.intent).toBe('FOOD_RECOMMENDATION');
    expect(r.payload.message_ko).toContain('명동게장본관');
    expect(r.payload.message_ko).toContain('월요일 08:00 기준');
  });

  test('오후 3시 늦은 점심 (명시 시각): 시각 필터가 누락되지 않는다 (꽃돌 브레이크 제외)', async () => {
    const r = await req('오후 3시에 늦은 점심 먹고 싶어.');
    expect(r.payload.munmeokji.visit.time).toBe('15:00');
    expect(r.payload.message_ko).not.toContain('• 꽃돌게장1번가');
    expect(r.payload.message_ko).toContain('궁전횟집');
  });

  test('풍산식당 월요일 질문: 휴무 안내 (LLM 미사용)', async () => {
    jest.setSystemTime(new Date('2026-11-24T10:00:00+09:00')); // 화
    const r = await req('월요일에 풍산식당 갈 수 있어?');
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
    expect(r.payload.message_ko).toContain('풍산식당은 월요일 정기휴무예요.');
  });

  test('내일 아침 (기본 시각 08:00 표시), 같은 세션 전 턴 참조 로직은 그대로', async () => {
    const r = await req('내일 아침에 갈 식당을 추천해 줘.');
    expect(r.payload.message_ko).toContain('화요일 08:00 기준');
    expect(r.payload.message_ko).toContain('식사 시점 기본 시각');
  });
});

describe('식당 질문이 아닌 기존 질문은 기존 경로로 남는다', () => {
  test('게장 설명 질문 (H02 류) 은 식당 경로로 가지 않는다', async () => {
    const r = await req('게장이 어떤 음식이야?');
    expect(r.payload.intent).not.toBe('FOOD_RECOMMENDATION');
  });
  test('카페 질문 (H07 류) 은 기존 카페 경로를 탄다', async () => {
    const r = await req('바다가 보이는 여수 카페를 알려줘.');
    expect(r.payload.intent).toBe('CAFE_RECOMMENDATION');
  });
});

describe('고객 공개 게이트 (운영 설정)', () => {
  test('개발 미리보기가 꺼져 있으면 미공개 행은 노출되지 않는다', async () => {
    delete process.env.MUNMEOKJI_DEV_PREVIEW;
    try {
      const r = await req('지금 아침 먹을 곳 알려줘.');
      expect(r.payload.message_ko).not.toContain('명동게장본관');
      expect(r.payload.message_ko).toContain('확인된 음식점 정보가 없어요');
    } finally {
      process.env.MUNMEOKJI_DEV_PREVIEW = '1';
    }
  });
});
