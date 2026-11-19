/**
 * PHX-SOUL-QA-001 Hybrid V1 — H1 Direct Response 회귀 테스트.
 * OpenAI는 mock이다. 외부 LLM 호출은 발생하지 않는다.
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
const { classifyDirect } = require('../../services/soulDirectResponse');

const mkCtx = (o = {}) => ({
  people_type: 'solo', has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120, group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' }, ...o,
});
const req = (message) => handleTravelRequest({
  message, sessionId: 'test-hybrid-h1', hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' }, explicit_context: {},
});

const ORIGINAL_FLAG = process.env.SOUL_HYBRID_V1;
beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
  mockCreate.mockReset();
  mockCreate.mockResolvedValue({ choices: [{ message: { content: '좋은 아침이에요. 오늘도 편안한 하루 되세요.' } }] });
});
afterEach(() => {
  if (ORIGINAL_FLAG === undefined) delete process.env.SOUL_HYBRID_V1; else process.env.SOUL_HYBRID_V1 = ORIGINAL_FLAG;
});

describe('H1 분류 규칙 (LLM 호출 없음)', () => {
  test('인사, 공감, 일반 상식은 Direct 대상이다', () => {
    expect(classifyDirect('좋은 아침이야, 소울아.', 0)).toBe(true);
    expect(classifyDirect('마음이 지쳐서 조용히 쉬고 싶어.', 0)).toBe(true);
    expect(classifyDirect('게장이 어떤 음식이야?', 0)).toBe(true);
  });
  test('장소, 혜택, 운영, 가격, 동행 조건이 있으면 Direct 대상이 아니다', () => {
    expect(classifyDirect('오동도 운영시간 알려줘', 1)).toBe(false);
    expect(classifyDirect('케이블카 얼마야?', 1)).toBe(false);
    expect(classifyDirect('돌산게장명가 소원패스 혜택은?', 0)).toBe(false);
    expect(classifyDirect('아이랑 같이 도보 코스 알려줘.', 0)).toBe(false);
    expect(classifyDirect('부모님과 여수 1박 2일 여행 일정을 만들어 줘.', 0)).toBe(false);
  });
});

describe('H1 플래그 비활성 (기본값) — 기존 응답 방식 유지', () => {
  test('플래그 미설정 시 인사는 Direct로 가지 않고 LLM을 호출하지 않는다', async () => {
    delete process.env.SOUL_HYBRID_V1;
    const r = await req('좋은 아침이야, 소울아.');
    expect(r.payload.status).not.toBe('DIRECT_RESPONSE');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(contextSvc.parseUserMessage).toHaveBeenCalled();
  });
});

describe('H1 플래그 활성 — Direct Response', () => {
  beforeEach(() => { process.env.SOUL_HYBRID_V1 = '1'; });

  test('인사는 조건 추출 없이 LLM 1회로 답한다', async () => {
    const r = await req('좋은 아침이야, 소울아.');
    expect(r.payload.status).toBe('DIRECT_RESPONSE');
    expect(r.payload.message_ko).toMatch(/좋은 아침/);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('공감과 일반 상식도 Direct로 답한다', async () => {
    const r1 = await req('마음이 지쳐서 조용히 쉬고 싶어.');
    expect(r1.payload.status).toBe('DIRECT_RESPONSE');
    const r2 = await req('게장이 어떤 음식이야?');
    expect(r2.payload.status).toBe('DIRECT_RESPONSE');
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('장소 정보 질문은 Direct로 가지 않는다 (Knowledge 경로 유지)', async () => {
    const r = await req('오동도 운영시간 알려줘');
    expect(r.payload.status).not.toBe('DIRECT_RESPONSE');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('케이블카 가격 질문(PSQ)은 Direct로 가지 않는다', async () => {
    const r = await req('케이블카 얼마야?');
    expect(r.payload.status).not.toBe('DIRECT_RESPONSE');
  });

  test('동행 조건이 있는 여행 요청은 Direct로 가지 않고 기존 조건 추출을 탄다', async () => {
    await req('아이랑 같이 도보 코스 알려줘.');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('LLM 실패 시 예외 없이 기존 흐름으로 되돌아간다', async () => {
    mockCreate.mockRejectedValueOnce(new Error('upstream down'));
    const r = await req('좋은 아침이야, 소울아.');
    expect(r.ok).toBe(true);
    expect(r.payload.status).not.toBe('DIRECT_RESPONSE');
  });

  test('응답 스키마 키는 기존 응답과 동일한 집합을 가진다', async () => {
    const r = await req('좋은 아침이야, 소울아.');
    const keys = Object.keys(r.payload).sort();
    expect(keys).toEqual(['understood_context', 'places', 'why_details', 'message_ko', 'status', 'intent',
      'presentation_mode', 'next_options', 'timestamp', 'shared_journey', 'quote', 'route', 'session_id'].sort());
  });
});
