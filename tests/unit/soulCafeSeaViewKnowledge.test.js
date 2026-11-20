'use strict';

/**
 * PHX-SOUL-QA-001 §70 — H07·H15 검증된 바다 전망 카페 Knowledge 연결 테스트
 *
 * 기준 (Founder §70):
 *  - 검증된 바다 전망 카페 정보만 추천 (포트앤포트 1곳)
 *  - 충돌하는 주소·전화·영업시간 제외 (번지, 전화번호 미노출)
 *  - H15: 오동도와의 거리 미검증을 명시
 *  - 소원패스 혜택 고객 노출 제외 (아메리카노·무료·할인 문구 없음)
 *  - 모이핀 무료 혜택 차단 유지, 모이핀 10% 할인 HOLD (추천·언급 금지)
 *  - 바다 전망 미검증 카페는 추천하지 않음
 *
 * 외부 LLM 호출 없음. 기존 mock 구조 (soulClarifyAnswerFirst.test.js) 재사용.
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

const PRINCIPAL = { principal_id: 'cafe-test-user', principal_type: 'GUEST' };
const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const DB_ROWS = { odongdo: ODONGDO };

const mkCtx = () => ({
  people_type: 'solo',
  has_car: true,
  companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none',
  time_available_minutes: 120,
  group_size: null,
  mobility_type: 'mixed',
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', mobility_type: 'UNKNOWN', time_available_minutes: 'UNKNOWN' },
});

const _FLAG_SAVED = process.env.SOUL_HYBRID_V1;
beforeAll(() => { delete process.env.SOUL_HYBRID_V1; });
afterAll(() => { if (_FLAG_SAVED === undefined) delete process.env.SOUL_HYBRID_V1; else process.env.SOUL_HYBRID_V1 = _FLAG_SAVED; });

let sid = 0;
const req = (message, explicit = {}) => handleTravelRequest({
  message, sessionId: `cafe-session-${++sid}`, hotelId: null, principal: PRINCIPAL, explicit_context: explicit,
});

// 제외 대상: 번지·전화·혜택 문구·미검증 카페명
const EXCLUDED = [
  /28-52|28-58/,                 // 번지 (자료 간 충돌)
  /0507-|061-|010-/,             // 전화번호 (자료 간 충돌·미검증)
  /아메리카노|무료|할인|혜택|쿠폰|제휴/,   // 혜택 문구
  /모이핀/,
  /프롬나드|엠파스파레/,
  /더 포레스트랜드/,
  /라또아/,
  /카프아일랜드/,
  /메리엘|메리얼/,
  /하루 ?한방|카페하루/,
];

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (c) => DB_ROWS[c] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [], why_details: [], status: 'OK', understood_context: {} });
});

describe('H07 — "바다가 보이는 여수 카페를 알려줘."', () => {
  test('검증된 바다 전망 카페 (포트앤포트) 만 추천하고 영업시간을 공식 기준으로 안내한다', async () => {
    const r = await req('바다가 보이는 여수 카페를 알려줘.');
    const msg = r.payload.message_ko;
    expect(r.payload.intent).toBe('CAFE_RECOMMENDATION');
    expect(r.payload.status).toBe('PLACE_LOOKUP');
    expect(msg).toContain('포트앤포트');
    expect(msg).toContain('엘리스테이 여수 4층');
    expect(msg).toContain('오션뷰');
    expect(msg).toContain('11:00~21:00');
    expect(msg).toContain('다른 카페의 바다 전망은 아직 확인되지 않아');
  });

  test('충돌 값과 혜택 문구, 미검증 카페명을 노출하지 않는다', async () => {
    const r = await req('바다가 보이는 여수 카페를 알려줘.');
    const msg = r.payload.message_ko;
    for (const re of EXCLUDED) expect(msg).not.toMatch(re);
  });

  test('오동도 거리 caveat 는 H07 에 붙지 않는다', async () => {
    const r = await req('바다가 보이는 여수 카페를 알려줘.');
    expect(r.payload.message_ko).not.toContain('오동도와의 거리');
  });

  test('next_options 와 places 는 비어 있다 (추천 목록 생성 없음)', async () => {
    const r = await req('바다가 보이는 여수 카페를 알려줘.');
    expect(r.payload.next_options).toEqual([]);
    expect(r.payload.places).toEqual([]);
  });
});

describe('H15 — "오동도 근처에 바다가 보이는 카페가 있을까?"', () => {
  test('포트앤포트를 안내하고 오동도와의 거리가 미검증이라 "근처"라고 말할 수 없다고 명시한다', async () => {
    const r = await req('오동도 근처에 바다가 보이는 카페가 있을까?');
    const msg = r.payload.message_ko;
    expect(r.payload.status).toBe('PLACE_LOOKUP');
    expect(msg).toContain('포트앤포트');
    expect(msg).toContain('오동도와의 거리는 확인되지 않아서');
    expect(msg).toContain('오동도 근처라고 말할 수 없어요');
  });

  test('H15 도 충돌 값·혜택 문구·미검증 카페명을 노출하지 않는다', async () => {
    const r = await req('오동도 근처에 바다가 보이는 카페가 있을까?');
    for (const re of EXCLUDED) expect(r.payload.message_ko).not.toMatch(re);
  });
});

describe('범위 보존 — 기존 카페 경로는 바뀌지 않는다', () => {
  test('바다 언급 없는 카페 추천은 기존 준비 중 응답을 유지한다', async () => {
    const r = await req('여수 카페 추천해줘');
    expect(r.payload.status).toBe('NOT_SUPPORTED_YET');
    expect(r.payload.message_ko).toContain('카페 추천 기능은 아직 준비 중이에요');
  });

  test('장소 화면 (place_code) 의 카페 질문은 기존 PSQ 경로를 탄다 (카페 응답 아님)', async () => {
    const r = await req('바다가 보이는 카페 있어?', { place_code: 'odongdo' });
    expect(r.payload.intent).not.toBe('CAFE_RECOMMENDATION');
  });

  test('바다 질문이지만 카페가 아니면 카페 응답을 만들지 않는다', async () => {
    const r = await req('바다가 보이는 여수 관광지 알려줘');
    expect(r.payload.intent).not.toBe('CAFE_RECOMMENDATION');
  });
});
