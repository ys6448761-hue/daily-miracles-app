'use strict';

/**
 * PHX-SOUL-QA-001 §58 — Clarify 정책 선별 구현 회귀 테스트 (Answer First, Clarify When Necessary)
 *
 * 4-A: 단일 장소 + 명시적 걷기·동반 신호 → 검증된 장소 정보로 먼저 답한다 (H06, H14)
 * 4-B: 여수·여행 문맥의 "어디부터" → 추천 경로 (H19). 장소 문맥·비여행 문장은 제외
 * 4-C: 명시되지 않은 solo 는 명시 값으로 확정하지 않는다. 세션 명시 동반 정보는 보존
 * 4-D: 여정·첫 방문 추천에서만 도보 연결 미검증 안내. 질문은 의도별 1개
 *
 * 외부 LLM 호출 없음. 추출 결과는 기록된 실제 추출 구조(provenance 포함)를 모사한다.
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
const { handleTravelRequest } = require('../../services/soyeowoolService');

const PRINCIPAL = { principal_id: 'clarify-test-user', principal_type: 'GUEST' };
const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const CABLE   = { code: 'cablecar', name_ko: '여수 해상케이블카', avg_stay_minutes: 45, type: 'leisure' };
const HAMEL   = { code: 'hamel_lighthouse', name_ko: '하멜등대', avg_stay_minutes: 30, type: 'attraction' };
const HYANG   = { code: 'hyangiram', name_ko: '향일암', avg_stay_minutes: 120, type: 'attraction' };
const DB_ROWS = { odongdo: ODONGDO, cablecar: CABLE, hamel_lighthouse: HAMEL, hyangiram: HYANG };

// 추출 결과 모사: 값은 기록된 실제 추출 형태, provenance 는 _source 의 explicit → USER_EXPLICIT 매핑
// 실제 contextExtraction 기본값과 맞춘다: time 미지정 → 120 (UNKNOWN), has_car null → true
const mkCtx = ({ people = 'solo', peopleProv = 'UNKNOWN', mobility = 'mixed', mobilityProv = 'UNKNOWN', time = null } = {}) => ({
  people_type: people,
  has_car: true,
  companion_constraints: { has_kids: people === 'family_with_kids', has_elderly: people === 'family_elderly' },
  meal_context: 'none',
  time_available_minutes: time == null ? 120 : time,
  group_size: null,
  mobility_type: mobility,
  _provenance: { people_type: peopleProv, has_car: 'UNKNOWN', mobility_type: mobilityProv, time_available_minutes: 'UNKNOWN' },
});

const ctxH06 = () => mkCtx({ mobility: 'walk', mobilityProv: 'USER_EXPLICIT' });
const ctxH14 = () => mkCtx({ people: 'family_with_kids', peopleProv: 'USER_EXPLICIT', mobility: 'walk', mobilityProv: 'USER_EXPLICIT' });
// H19 의 기록된 추출 오류: people_type=solo 가 explicit 으로 표시됨 (원문에 동반 표현 없음)
const ctxH19Recorded = () => mkCtx({ people: 'solo', peopleProv: 'USER_EXPLICIT' });

const CLARIFY_PHRASE = '어떤 여행을 계획하고 계신지';
const TIME_PATTERN = /(이동|도보)[^\n]{0,12}\d+\s*분|\d+\s*분[^\n]{0,8}(이동|도보)/;

// Clarify 보호 케이스는 Hybrid 플래그 unset (기존 기본 경로) 기준으로 고정한다.
// 플래그 ON 에서는 Hybrid 직접 응답이 먼저 답하므로 아래 별도 describe 에서 핵심 정책만 확인한다.
const _FLAG_SAVED = process.env.SOUL_HYBRID_V1;
beforeAll(() => { delete process.env.SOUL_HYBRID_V1; });
afterAll(() => { if (_FLAG_SAVED === undefined) delete process.env.SOUL_HYBRID_V1; else process.env.SOUL_HYBRID_V1 = _FLAG_SAVED; });

let sid = 0;
const req = (message, explicit = {}) => handleTravelRequest({
  message, sessionId: `clarify-session-${++sid}`, hotelId: null, principal: PRINCIPAL, explicit_context: explicit,
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (c) => DB_ROWS[c] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [ODONGDO, CABLE, HAMEL, HYANG], why_details: [], status: 'OK', understood_context: {} });
});

describe('4-A — H06·H14: 명시적 걷기·동반 신호 → 검증된 장소 정보로 먼저 답한다', () => {
  test('H06: 되묻기 없이 오동도 검증 정보와 연결 미검증 안내를 준다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH06());
    const r = await req('오동도에서 걸어서 둘러볼 만한 곳은?');
    const msg = r.payload.message_ko;
    expect(r.payload.status).not.toBe('CLARIFICATION');
    expect(msg).not.toContain(CLARIFY_PHRASE);
    expect(msg).toContain('방파제 길');            // experience_ko (검증 텍스트)
    expect(msg).toContain('걷는 부담');            // walking_ok (검증 텍스트)
    expect(msg).toContain('운영시간은 연중무휴');    // hours_ko
    expect(msg).toContain('장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요');
    expect(TIME_PATTERN.test(msg)).toBe(false);     // 이동시간 생성 금지
    expect(msg).not.toMatch(/\?\s*$/m);             // 필수 정보가 아니므로 추가 질문 없음
  });

  test('H14: 아이 동반 조건을 반영하고 선택적 질문 없이 답한다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH14());
    const r = await req('어린 자녀와 오동도를 걷고 싶어.');
    const msg = r.payload.message_ko;
    expect(r.payload.status).not.toBe('CLARIFICATION');
    expect(msg).toContain('아이와 함께하는 여행이시군요');
    expect(msg).toContain('아이와 함께라면 걷는 거리와 쉬는 시간을 고려');  // fit_ko (동반 신호 시에만)
    expect(msg).toContain('걷는 부담');
    expect(msg).not.toContain(CLARIFY_PHRASE);
    expect(TIME_PATTERN.test(msg)).toBe(false);
  });

  test('도보 정보가 없는 장소 + 걷기 신호: 검증 일반 정보 + 도보 적합성 미확인 명시 (전체 되묻기 금지)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ mobility: 'walk', mobilityProv: 'USER_EXPLICIT' }));
    const r = await req('하멜등대 걸어서 둘러볼 수 있어?');
    const msg = r.payload.message_ko;
    expect(r.payload.status).not.toBe('CLARIFICATION');
    expect(msg).toContain('도보 적합성은 아직 확인되지 않았어요');
    expect(msg).not.toContain(CLARIFY_PHRASE);
  });

  test('명시적 신호가 없으면 추출 mobility 만으로 4-A 답변을 만들지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ mobility: 'walk', mobilityProv: 'AI_INFERENCE' }));
    const r = await req('오동도에서 걸어서 둘러볼 만한 곳은?');
    expect(r.payload.intent).not.toBe('PLACE_ANSWER_FIRST');
    expect(r.payload.message_ko).not.toContain('도보 연결과 이동시간은 아직 확인되지 않았어요');
  });

  test('페이지 장소 문맥(explicit place_code)이 있으면 4-A 를 적용하지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH06());
    const r = await req('오동도에서 걸어서 둘러볼 만한 곳은?', { place_code: 'odongdo' });
    expect(r.payload.intent).not.toBe('PLACE_ANSWER_FIRST');
  });
});

describe('4-B — H19: 여수·여행 문맥의 "어디부터" → 추천 후보 + 숙박 여부 질문 1개', () => {
  test('H19: 후보 장소 안내, 연결 미검증 명시, 숙박 여부 질문 1개, 되묻기 대체 없음', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('처음 여수에 왔는데 어디부터 가면 좋을까?');
    const msg = r.payload.message_ko;
    expect(travelGuideSvc.recommend).toHaveBeenCalled();
    expect(msg).not.toContain(CLARIFY_PHRASE);
    expect(msg).toContain('확인된 장소 후보를 알려드릴게요');
    expect(msg).toContain('장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요');
    expect(msg).toContain('당일 여행이신가요, 아니면 숙박하시나요?');
    expect(r.payload.places.length).toBeGreaterThan(0);
    expect(TIME_PATTERN.test(msg)).toBe(false);
  });

  test('후보 목록은 travelGuide 결과에서만 온다 (서비스 코드 하드코딩 없음)', async () => {
    travelGuideSvc.recommend.mockResolvedValue({ places: [HYANG], why_details: [], status: 'OK', understood_context: {} });
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.places.map(p => p.name_ko || p.code)).not.toContain('오동도');
  });

  test('부정 사례: 장소 문맥(explicit place_code)이 있으면 추천 경로로 보내지 않는다 (Living Detail 보호)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    await req('여수 오동도 주변 어디부터 볼까?', { place_code: 'odongdo' });
    expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
  });

  test('부정 사례: 여수·여행 문맥이 없는 "어디부터" 는 추천 경로로 보내지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    await req('회의 자료를 어디부터 정리하면 좋을까?');
    expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
  });

  test('부정 사례: 여수 혜택 문의 + 어디부터 는 첫 방문 추천이 아니다 (혜택 분류 우선)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    const r = await req('여수 소원패스 혜택은 어디부터 받을 수 있어요?');
    expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
    expect(r.payload.status).not.toBe('DISCOVERING');
  });

  test('부정 사례: 여수 실시간 운행 문의 + 어디부터 는 첫 방문 추천이 아니다 (실시간 분류 우선)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    const r = await req('여수 케이블카 지금 운행하고 있어? 어디부터 확인해요?');
    expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
    expect(r.payload.status).not.toBe('DISCOVERING');
  });
});

describe('4-C — 추출 solo 확정 차단 및 세션 동반 정보 보존', () => {
  test('H19 기록된 solo(explicit) 오추론은 확정되지 않는다: 원문에 혼자 표현이 없으면 미확인(null)로 강등', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.understood_context.people_type).toBeNull();
    expect(travelGuideSvc.recommend.mock.calls[0][0].people_type).toBeNull();
  });

  test('고객이 혼자라고 명시하면 solo 를 유지한다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('나 혼자 처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.understood_context.people_type).toBe('solo');
  });

  test('"1인" 명시는 solo 를 유지한다 (혼자 표현 변형)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('1인 여행으로 처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.understood_context.people_type).toBe('solo');
  });

  test('세션에 명시된 동반 정보는 solo 강등 이후에도 보존된다 (기존 병합 경로)', async () => {
    sessionSvc.getSession.mockResolvedValue({
      ok: true,
      journey_ctx: { traveler_profile: { people_type: 'family_with_kids', companion_has_kids: true } },
    });
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.understood_context.people_type).toBe('family_with_kids');
  });

  test('미확인 solo 강등은 명시 Clarify 경로를 막지 않는다 (일반 질문은 기존대로 되묻기)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    const r = await req('뭔가 해볼까');
    expect(r.payload.status).toBe('CLARIFICATION');
    expect(r.payload.message_ko).toContain(CLARIFY_PHRASE);
  });
});

describe('4-D — 연결 미검증 안내는 관련 응답에만', () => {
  test('일반 장소 정보 응답에는 연결 미검증 문구를 덧붙이지 않는다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    const r = await req('오동도는 어떤 곳이야?');
    expect(r.payload.message_ko).not.toContain('도보 연결과 이동시간은 아직 확인되지 않았어요');
  });

  test('H10 여정 요청은 기존 시간 질문을 유지한다 (4-D 질문 분기)', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx({ people: 'group', mobility: 'walk', mobilityProv: 'USER_EXPLICIT' }));
    const r = await req('성인 가족 3명이 여행하는데 도보 코스를 알려줘.');
    expect(r.payload.message_ko).toContain('장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요');
    expect(r.payload.message_ko).toContain('시간이 얼마나 남으셨어요?');
    expect(r.payload.message_ko).not.toContain('숙박하시나요');
  });

  test('추천 결과에 course 일정 구조가 있어도 첫 방문 추천 응답에는 노출하지 않는다', async () => {
    travelGuideSvc.recommend.mockResolvedValue({
      places: [ODONGDO, HYANG], why_details: [], status: 'OK', understood_context: {},
      course: { type: 'course', blocks: [{ type: 'travel_transition', status: 'unknown' }] },
    });
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.course == null).toBe(true);
  });
});

describe('Hybrid flag ON — 핵심 정책 동일 (H06·H19)', () => {
  beforeAll(() => { process.env.SOUL_HYBRID_V1 = '1'; });
  afterAll(() => { delete process.env.SOUL_HYBRID_V1; });

  test('H06 (flag ON): 되묻기 없이 검증된 장소 정보와 연결 미검증 안내', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH06());
    const r = await req('오동도에서 걸어서 둘러볼 만한 곳은?');
    expect(r.payload.message_ko).not.toContain(CLARIFY_PHRASE);
    expect(r.payload.message_ko).toContain('장소 사이의 도보 연결과 이동시간은 아직 확인되지 않았어요');
  });

  test('H19 (flag ON): 후보 안내와 숙박 여부 질문 1개, solo 미확정', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(ctxH19Recorded());
    const r = await req('처음 여수에 왔는데 어디부터 가면 좋을까?');
    expect(r.payload.message_ko).toContain('당일 여행이신가요, 아니면 숙박하시나요?');
    expect(r.payload.understood_context.people_type).toBeNull();
  });
});

describe('Clarify 보호 유지', () => {
  test('신호가 없는 일반 요청은 기존 generic clarification 을 유지한다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue(mkCtx());
    const r = await req('여수 여행 좀 도와줘');
    expect(r.payload.status).toBe('CLARIFICATION');
    expect(r.payload.message_ko).toContain(CLARIFY_PHRASE);
  });
});
