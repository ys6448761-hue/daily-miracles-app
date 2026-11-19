/**
 * PHX-SOUL-QA-001 Hybrid V1 — H2 Knowledge Fast Path 회귀 테스트.
 * 외부 LLM 호출 없음. 조건 추출 호출 횟수를 직접 검증한다.
 */

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

const mockCreate = jest.fn();
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockCreate } } })),
}));
jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/quoteEngine', () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput: jest.fn().mockReturnValue({}),
  _extractLeisure: jest.fn().mockReturnValue(null),
}), { virtual: true });

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');
const { classifyFastPath } = require('../../services/soulFastPath');

const mkCtx = (o = {}) => ({
  people_type: 'solo', has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120, group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' }, ...o,
});
const PLACES = {
  odongdo: { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120 },
  cablecar: { code: 'cablecar', name_ko: '케이블카', avg_stay_minutes: 45 },
};
const req = (message) => handleTravelRequest({
  message, sessionId: 'test-hybrid-h2', hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' }, explicit_context: {},
});

const ORIGINAL_FLAG = process.env.SOUL_HYBRID_V1;
beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(c => Promise.resolve(PLACES[c] || null));
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
  mockCreate.mockReset();
});
afterEach(() => {
  if (ORIGINAL_FLAG === undefined) delete process.env.SOUL_HYBRID_V1; else process.env.SOUL_HYBRID_V1 = ORIGINAL_FLAG;
});

describe('H2 분류 규칙', () => {
  test('혜택 문의와 실시간 운행 문의를 분류한다', () => {
    expect(classifyFastPath('돌산게장명가 소원패스 혜택은?', 0)).toBe('BENEFIT');
    expect(classifyFastPath('여수 케이블카는 지금 운행하고 있어?', 1)).toBe('LIVE');
  });
  test('일정 요청이 섞인 혜택 문장이나 장소가 없는 운행 문장은 Fast Path로 보지 않는다', () => {
    expect(classifyFastPath('소원패스 혜택 포함해서 1박 2일 일정 짜줘', 0)).toBeNull();
    expect(classifyFastPath('지금 운행하고 있어?', 0)).toBeNull();
  });
});

describe('H2 플래그 비활성 — 기존 흐름 유지', () => {
  test('플래그 미설정 시 혜택 문의는 기존처럼 추출을 거친다', async () => {
    delete process.env.SOUL_HYBRID_V1;
    const r = await req('돌산게장명가 소원패스 혜택은?');
    expect(r.payload.status).not.toBe('BENEFIT_NOT_CONFIRMED');
    expect(contextSvc.parseUserMessage).toHaveBeenCalled();
  });
});

describe('H2 플래그 활성 — Knowledge Fast Path', () => {
  beforeEach(() => { process.env.SOUL_HYBRID_V1 = '1'; });

  test('혜택 문의는 추출 없이 미확인 응답을 한다 (허위 혜택 없음)', async () => {
    const r = await req('돌산게장명가 소원패스 혜택은?');
    expect(r.payload.status).toBe('BENEFIT_NOT_CONFIRMED');
    expect(r.payload.message_ko).toMatch(/찾지 못했어요/);
    expect(r.payload.message_ko).not.toMatch(/무료|할인|아메리카노/);
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('실시간 운행 문의는 실시간 확인 불가와 확인된 운영시간을 답한다', async () => {
    const r = await req('여수 케이블카는 지금 운행하고 있어?');
    expect(r.payload.status).toBe('LIVE_UNAVAILABLE');
    expect(r.payload.message_ko).toMatch(/실시간 정보가 없어서 확인할 수 없어요/);
    expect(r.payload.message_ko).toMatch(/09:30~21:30/);
    expect(r.payload.message_ko).not.toMatch(/현재 운행하고 있어요/);
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('장소 정보 질문(입장 시각)은 추출 없이 운영시간으로 답한다', async () => {
    const r = await req('오동도는 몇 시부터 들어갈 수 있어?');
    expect(r.payload.intent).toBe('PLACE_HOURS_INFO');
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('카페 질문은 추출 없이 미지원 응답을 한다', async () => {
    const r = await req('바다가 보이는 여수 카페를 알려줘.');
    expect(r.payload.status).toBe('NOT_SUPPORTED_YET');
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('케이블카 가격 질문(PSQ 기존 경로)은 Fast Path가 가로채지 않는다', async () => {
    const r = await req('케이블카 얼마야?');
    expect(r.payload.status).not.toBe('LIVE_UNAVAILABLE');
    expect(r.payload.status).not.toBe('BENEFIT_NOT_CONFIRMED');
  });

  test('일정 요청이 섞인 혜택 문장은 Fast Path로 가지 않는다', async () => {
    const r = await req('소원패스 혜택 포함해서 1박 2일 일정 짜줘');
    expect(r.payload.status).not.toBe('BENEFIT_NOT_CONFIRMED');
  });
});
