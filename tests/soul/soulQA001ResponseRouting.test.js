/**
 * PHX-SOUL-QA-001 Phase 1 — 고객 경험 회귀 테스트 (T01~T06)
 *
 * Evidence: docs/knowledge/PHX-SOUL-QA-001_RESPONSE_ROUTING_INVESTIGATION.md
 * 기대값은 Founder 요구사항을 기준으로 작성했다. 코드 결과에 맞춰 기대값을 바꾸지 않는다.
 * 미해결 항목은 expect 대신 it.todo로 사유를 남긴다.
 */

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/routeSkeletonService', () => ({ buildSkeleton: jest.fn().mockReturnValue(null) }), { virtual: true });
jest.mock('../../services/quoteEngine', () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}),
  isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }),
  buildQuoteInput: jest.fn().mockReturnValue({}),
  _extractLeisure: jest.fn().mockReturnValue(null),
}), { virtual: true });
jest.mock('../../services/travelIntelligenceService', () => ({
  route: jest.fn().mockResolvedValue({ ok: true, tgResult: { places: [] } })
}), { virtual: true });

const contextSvc = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc = require('../../services/sessionService');

const { handleTravelRequest } = require('../../services/soyeowoolService');

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

// DB 행 stub. avg_stay_minutes는 travel_places 값(증거 문서 기준)을 따른다.
const PLACES = {
  odongdo:          { code: 'odongdo',          name_ko: '오동도',   avg_stay_minutes: 120 },
  cablecar:         { code: 'cablecar',         name_ko: '케이블카', avg_stay_minutes: 45 },
  hamel_lighthouse: { code: 'hamel_lighthouse', name_ko: '하멜등대', avg_stay_minutes: null },
  hyangiram:        { code: 'hyangiram',        name_ko: '향일암',   avg_stay_minutes: 120 },
};

const makeRequest = (message, overrides = {}) => handleTravelRequest({
  message,
  sessionId: 'test-soul-qa-001',
  hotelId: null,
  principal: { principal_id: 'test-user', principal_type: 'GUEST' },
  explicit_context: {},
  ...overrides,
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(code => Promise.resolve(PLACES[code] || null));
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [] });
});

// ── T01: 오동도 관람시간 — 장소명을 다시 묻지 않고, 운영시간을 체류시간으로 답하지 않는다 ──
describe('T01 오동도 관람시간 질문', () => {
  test('장소명을 다시 묻지 않고 체류시간을 안내한다', async () => {
    const result = await makeRequest('오동도 관람시간은 얼마나 잡으면 좋을까?');
    expect(result.ok).toBe(true);
    expect(result.payload.message_ko).not.toMatch(/어느 장소에 대해/);
    expect(result.payload.message_ko).toMatch(/오동도/);
    expect(result.payload.message_ko).toMatch(/120분/);
  });

  test('운영시간(hours_ko)을 관람 소요시간으로 표기하지 않는다', async () => {
    const result = await makeRequest('오동도 관람시간은 얼마나 잡으면 좋을까?');
    const msg = result.payload.message_ko;
    // 운영시간 문구는 "운영시간"이라는 명칭으로만 나와야 한다.
    expect(msg).toMatch(/운영시간은 .*예요/);
    expect(msg).not.toMatch(/관람 소요시간은 (연중무휴|09:00)/);
  });

  test('체류시간 값이 없으면 관람 소요시간이 미확인이라고 안내하고 숫자를 만들지 않는다', async () => {
    const result = await makeRequest('하멜등대 관람시간은 얼마나 잡아야 해?');
    expect(result.payload.message_ko).toMatch(/관람 소요시간 정보는 아직 확인되지 않았어요/);
    expect(result.payload.message_ko).not.toMatch(/\d+분/);
  });

  test('운영시간 질문은 운영시간으로 답한다', async () => {
    const result = await makeRequest('오동도 운영시간 알려줘');
    expect(result.payload.message_ko).toMatch(/운영시간/);
    expect(result.payload.message_ko).not.toMatch(/평균적으로/);
  });
});

// ── T02: 오동도 도보 관광 — 장소명을 다시 묻지 않는다 (코스 품질은 Pending) ─────────
describe('T02 오동도 도보 관광 질문', () => {
  test('오동도를 명시했을 때 장소명을 다시 묻지 않는다', async () => {
    const result = await makeRequest('오동도에서 걸어서 둘러볼 만한 곳을 알려줘.');
    expect(result.payload.message_ko).not.toMatch(/어느 장소에 대해/);
  });

  it.todo('T02 도보 중심 관광 코스 답변 — PENDING: 장소 기준 도보 코스는 routeSkeletonService(main 미포함) 복구 후 검증');
});

// ── T03: 카페 질문 — 일반 관광코스로 대체하지 않고 미지원을 명시한다 ───────────────
describe('T03 카페 추천 질문', () => {
  test('카페 요청에 관광코스를 답하지 않고 기능 준비 중임을 명시한다', async () => {
    const result = await makeRequest('바다가 보이는 여수 카페를 추천해 줘.');
    expect(result.payload.status).toBe('NOT_SUPPORTED_YET');
    expect(result.payload.message_ko).toMatch(/카페 추천 기능은 아직 준비 중/);
    expect(result.payload.places).toEqual([]);
  });
});

// ── T04: 복수 장소 반나절 요청 — 두 장소 모두 유지, 단일 장소 clarification 금지 ──────
describe('T04 복수 장소 반나절 요청', () => {
  test('오동도와 케이블카를 모두 안내하고 케이블카 전용 clarification을 쓰지 않는다', async () => {
    const result = await makeRequest('오동도와 케이블카를 반나절 동안 여행하고 싶어.');
    expect(result.payload.status).toBe('MULTI_PLACE_INFO');
    expect(result.payload.message_ko).toMatch(/오동도/);
    expect(result.payload.message_ko).toMatch(/케이블카/);
    expect(result.payload.message_ko).not.toMatch(/케이블카에 대해 알고 싶으신/);
  });

  test('반나절 일정은 아직 구성할 수 없다고 명시한다 (완료된 것처럼 표시하지 않음)', async () => {
    const result = await makeRequest('오동도와 케이블카를 반나절 동안 여행하고 싶어.');
    expect(result.payload.message_ko).toMatch(/일정은 아직 구성해 드릴 수 없어요/);
  });
});

// ── T05: 성인 가족 — 아이 동반 표현이 없으면 family_with_kids로 추론하지 않는다 ──────
describe('T05 성인 가족 조건', () => {
  test('LLM이 family_with_kids로 추출해도 아이 표현이 없으면 group으로 보정한다', async () => {
    contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx({
      people_type: 'family_with_kids',
      companion_constraints: { has_kids: true, has_elderly: false },
      has_kids: true,
      _provenance: { people_type: 'AI_INFERENCE' },
    }));
    const result = await makeRequest('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    expect(result.ok).toBe(true);
    expect(result.payload.understood_context).toBeDefined();
    expect(result.payload.understood_context.people_type).not.toBe('family_with_kids');
  });

  test('실제 LLM 출력 형태(provenance=USER_EXPLICIT 표기)에서도 아이 표현이 없으면 group으로 보정한다', async () => {
    // 2026-11-19 실제 gpt-4o-mini 호출 결과: people_type=family_with_kids, provenance=USER_EXPLICIT
    contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx({
      people_type: 'family_with_kids',
      companion_constraints: { has_kids: false, has_elderly: false },
      group_size: 3,
      _provenance: { people_type: 'USER_EXPLICIT' },
    }));
    const result = await makeRequest('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    expect(result.payload.understood_context).toBeDefined();
    expect(result.payload.understood_context.people_type).not.toBe('family_with_kids');
  });

  test('아이 동반이 명시되면 family_with_kids를 유지한다 (대조군)', async () => {
    contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx({
      people_type: 'family_with_kids',
      companion_constraints: { has_kids: true, has_elderly: false },
      has_kids: true,
      _provenance: { people_type: 'USER_EXPLICIT' },
    }));
    const result = await makeRequest('아이랑 같이 도보 코스를 알려줘.');
    expect(result.payload.understood_context).toBeDefined();
    expect(result.payload.understood_context.people_type).toBe('family_with_kids');
  });
});

// ── T06: 이전 질문 참조 — 기억하지 못하면 정직하게 말한다 ───────────────────────────
describe('T06 이전 질문 참조', () => {
  test('이전 질문을 기억하지 못하는 상태를 정직하게 안내한다', async () => {
    const result = await makeRequest('아까 질문에 먼저 답변해 줘.');
    expect(result.payload.status).toBe('CONTEXT_NOT_AVAILABLE');
    expect(result.payload.message_ko).toMatch(/기억하지 못해요/);
  });

  it.todo('T06 직전 질문 문맥 유지 답변 — PENDING: 대화 문맥 저장은 이번 승인 범위 밖(EXTEND, 별도 승인 필요)');
});

// ── 공통 회귀 체크 ──────────────────────────────────────────────────────────────
describe('고객 응답 공통 규칙', () => {
  test('이동시간 문구는 실제 계산(미계산)과 모순되지 않는다 — 계산 안 된 이동시간을 고려했다고 말하지 않음', () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../../services/soyeowoolService.js'), 'utf8');
    // travelGuideService._estimateTravelTime 은 항상 minutes:null 이므로 "이동 시간까지 생각해서" 문구는 금지.
    expect(src).not.toMatch(/이동 시간까지 생각해서/);
    expect(src).toMatch(/장소 사이 이동시간은 아직 확인되지 않아/);
  });
});
