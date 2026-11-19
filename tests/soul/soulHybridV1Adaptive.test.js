/**
 * PHX-SOUL-QA-001 Hybrid V1 — Adaptive General Advice 연결 테스트 (H1 분기 wiring).
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

const mkCtx = (o = {}) => ({
  people_type: 'solo', has_car: false,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120, group_size: null,
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN' }, ...o,
});
const req = (message) => handleTravelRequest({
  message, sessionId: 'test-hybrid-adaptive', hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' }, explicit_context: {},
});
const llmJson = (obj) => ({ choices: [{ message: { content: JSON.stringify(obj) } }] });

const ORIGINAL_FLAG = process.env.SOUL_HYBRID_V1;
beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockResolvedValue(null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
  mockCreate.mockReset();
});
afterEach(() => {
  if (ORIGINAL_FLAG === undefined) delete process.env.SOUL_HYBRID_V1; else process.env.SOUL_HYBRID_V1 = ORIGINAL_FLAG;
});

describe('Adaptive 연결 (SOUL_HYBRID_V1 on)', () => {
  beforeEach(() => { process.env.SOUL_HYBRID_V1 = '1'; });

  test('GENERAL_ANSWER면 DIRECT_RESPONSE, intent GENERAL_ADVICE로 답하고 LLM은 1회다', async () => {
    mockCreate.mockResolvedValueOnce(llmJson({ route: 'GENERAL_ANSWER', answer: '편한 신발과 모자를 챙기면 좋아요.' }));
    const r = await req('여수 갈 때 뭘 챙겨야 해?');
    expect(r.ok).toBe(true);
    expect(r.payload.status).toBe('DIRECT_RESPONSE');
    expect(r.payload.intent).toBe('GENERAL_ADVICE');
    expect(r.payload.message_ko).toBe('편한 신발과 모자를 챙기면 좋아요.');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    // 기존 추출 흐름은 건너뛴다
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('NEED_PLACE 등 비 GENERAL route는 기존 흐름으로 넘어가고 DIRECT_RESPONSE를 만들지 않는다', async () => {
    mockCreate.mockResolvedValueOnce(llmJson({ route: 'NEED_PLACE', answer: '' }));
    const r = await req('부모님과 여행하는데 어떤 준비가 필요해?');
    expect(r.payload.intent).not.toBe('GENERAL_ADVICE');
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(contextSvc.parseUserMessage).toHaveBeenCalled();
  });

  // §29 정책 변경: 전화번호는 마스킹 후 핵심 질문으로 어댑티브 경로를 탄다. 원문 번호는 외부로 나가지 않는다.
  test('전화번호 포함 질문은 마스킹 후 어댑티브 경로로 처리되고 원문 번호는 외부로 나가지 않는다', async () => {
    mockCreate.mockResolvedValueOnce(llmJson({ route: 'GENERAL_ANSWER', answer: '준비물로 모자를 챙기세요.' }));
    const r = await req('010-1234-5678로 여행 준비물 알려줘');
    expect(r.payload.status).toBe('DIRECT_RESPONSE');
    expect(r.payload.intent).toBe('GENERAL_ADVICE');
    const sent = JSON.stringify(mockCreate.mock.calls.map(c => c[0].messages));
    expect(sent).not.toContain('010-1234-5678');
  });

  test('식별자·인증정보(카드번호)는 엔진 진입에서 차단되고 외부 호출이 없다', async () => {
    const r = await req('카드번호 1234-5678-9012-3456 로 여행 준비물 알려줘');
    expect(r.ok).toBe(true);
    expect(r.payload.status).toBe('PRIVACY_BLOCKED');
    expect(r.payload.message_ko).toContain('외부로 전송하지 않았어요');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(contextSvc.parseUserMessage).not.toHaveBeenCalled();
  });

  test('사실 민감어 질문은 어댑티브 LLM을 호출하지 않는다', async () => {
    await req('여기 무료로 이용할 수 있어?');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('Adaptive 연결 (SOUL_HYBRID_V1 off)', () => {
  beforeEach(() => { delete process.env.SOUL_HYBRID_V1; });

  test('플래그가 꺼지면 어댑티브 호출이 없고 GENERAL_ADVICE 응답도 없다', async () => {
    mockCreate.mockResolvedValueOnce(llmJson({ route: 'GENERAL_ANSWER', answer: '편한 신발을 챙기세요.' }));
    const r = await req('여수 갈 때 뭘 챙겨야 해?');
    expect(mockCreate).not.toHaveBeenCalled();
    expect(r.payload.intent).not.toBe('GENERAL_ADVICE');
  });

  test('플래그가 꺼져도 식별자·인증정보 차단은 적용된다 (§29)', async () => {
    const r = await req('카드번호 1234-5678-9012-3456 로 여행 준비물 알려줘');
    expect(r.payload.status).toBe('PRIVACY_BLOCKED');
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
