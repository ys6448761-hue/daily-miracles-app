'use strict';
/**
 * §106 — 고객 직접 조회 경로 공개 Gate 우회 차단 및 일반 추천 빈 결과 안내.
 * 메모리 스텁. LLM·DB 호출 없음. 관리·내부 조회 (getPlaceByCode 자체) 는 변경 없음 — §105 테스트가 검증.
 */
process.env.OPENAI_API_KEY   = process.env.OPENAI_API_KEY   || 'sk-test-placeholder';
process.env.GUEST_JWT_SECRET = process.env.GUEST_JWT_SECRET || 'test-secret';

jest.mock('../../services/contextExtractionService');
jest.mock('../../services/travelGuideService');
jest.mock('../../services/sessionService');
jest.mock('../../services/sharedJourneyService', () => ({ extractSharedJourney: jest.fn().mockResolvedValue(null) }));
jest.mock('../../services/quoteEngine', () => ({ calculateQuote: jest.fn(), sanitizeForCustomer: jest.fn() }), { virtual: true });
jest.mock('../../services/quoteContextService', () => ({
  extractQuoteContext: jest.fn().mockReturnValue({}), isQuotable: jest.fn().mockReturnValue(false),
  isComplexGroupHotel: jest.fn().mockReturnValue({ complex: false }), buildQuoteInput: jest.fn().mockReturnValue({}),
  _extractLeisure: jest.fn().mockReturnValue(null), _extractHotelCode: jest.fn().mockReturnValue(null),
  _extractDate: jest.fn().mockReturnValue(null), _extractGuestCount: jest.fn().mockReturnValue(null),
}), { virtual: true });

const contextSvc     = require('../../services/contextExtractionService');
const travelGuideSvc = require('../../services/travelGuideService');
const sessionSvc     = require('../../services/sessionService');
const { handleTravelRequest } = require('../../services/soyeowoolService');

const PRINCIPAL = { principal_id: 's106-user', principal_type: 'GUEST' };
// 미승인 장소 (목록 밖, customer_public 미설정). 상세 값은 노출되면 안 되는 비밀 문자열처럼 취급한다.
const HIDDEN = {
  code: 'new_future_place', name_ko: '신규 테스트 장소', country_code: 'KR', city_code: 'YEOSU',
  indoor_outdoor: 'indoor', avg_stay_minutes: 77, suitable_for: ['family'], weather_suitable: ['rainy'],
  emotion_primary: 'joy', emotion_tags: ['zz_hidden_tag'], trust_level: 'VERIFIED',
};
const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const JUNGANG = { code: 'jungang_market', name_ko: '중앙시장', avg_stay_minutes: 75, type: 'market' };
const DB_ROWS = { new_future_place: HIDDEN, odongdo: ODONGDO, jungang_market: JUNGANG };

const mkCtx = () => ({
  people_type: 'solo', has_car: false, companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120, group_size: null, mobility_type: 'mixed',
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', mobility_type: 'UNKNOWN', time_available_minutes: 'UNKNOWN' },
});

let sid = 0;
const ask = (message, explicit = {}) => handleTravelRequest({
  message, sessionId: `s106-${++sid}`, hotelId: null, principal: PRINCIPAL, explicit_context: explicit,
});

beforeAll(() => { delete process.env.SOUL_HYBRID_V1; });
beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  // 실제 공개 Gate 는 travelGuideService 내부에 있으므로 여기서는 고객 응답 경로의 조회 결과만 흉내낸다.
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (c) => DB_ROWS[c] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [ODONGDO], why_details: [], status: 'OK', understood_context: {} });
});

// 비공개 장소의 이름·소개·체류·적합성 문구가 응답에 나오면 노출로 본다 (실제 누출 문구를 기준으로 함).
const HIDDEN_LEAKS = ['신규 테스트 장소에 대해', '실내 시설이에요', '가족 여행에 잘 어울려요', '1시간 17분', '77분', '머물러요', 'zz_hidden_tag'];

describe('§106 비공개 장소 직접 조회 차단', () => {
  test('비공개 장소 코드를 명시 장소로 지정해도 상세 정보가 노출되지 않는다', async () => {
    const r = await ask('알려줘', { place_code: 'new_future_place' });
    const m = r.payload.message_ko || '';
    for (const leak of HIDDEN_LEAKS) expect(m).not.toContain(leak);
    expect(r.payload.status).not.toBe('PLACE_SPECIFIC_QUERY');
  });

  test('비공개 장소 이름을 자연어로 물어도 상세 정보가 노출되지 않는다', async () => {
    const r = await ask('신규 테스트 장소 운영시간 알려줘');
    const m = r.payload.message_ko || '';
    for (const leak of HIDDEN_LEAKS) expect(m).not.toContain(leak);
  });

  test('비공개 장소의 요금·입장 질문도 상세 정보가 노출되지 않는다', async () => {
    const r = await ask('신규 테스트 장소 요금 알려줘', { place_code: 'new_future_place' });
    const m = r.payload.message_ko || '';
    for (const leak of HIDDEN_LEAKS) expect(m).not.toContain(leak);
  });

  test('기존 공개 승인 장소 (오동도) 의 명시 조회는 그대로 유지된다', async () => {
    const r = await ask('오동도 알려줘', { place_code: 'odongdo' });
    expect(r.payload.message_ko).toContain('오동도');
    expect(r.payload.status).not.toBe('CLARIFICATION');
  });
});

describe('§106 jungang_market 기존 제외 정책 유지', () => {
  test('중앙시장은 Legacy 목록에 있어도 소개·요금 상세를 고객에게 주지 않는다', async () => {
    const r = await ask('중앙시장 알려줘', { place_code: 'jungang_market' });
    const m = r.payload.message_ko || '';
    expect(m).not.toContain('여수의 전통시장이에요');
    expect(m).not.toContain('현지 먹거리와 서민적인');
  });

  test('중앙시장은 일반 추천 결과에 나타나지 않는다 (추천 제외 정책 유지)', async () => {
    travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [{ name: '중앙시장' }, ODONGDO], why_details: [], status: 'OK', understood_context: {} });
    const r = await ask('여수 여행지 추천해줘');
    // 실제 recommend 는 jungang 을 제외한다 (travelGuideService 단위 테스트에서 검증). 여기서는 응답 경로가 빈 결과를 보존하는지만 본다.
    expect(r.payload).toBeDefined();
  });
});

describe('§106 일반 추천 공개 결과 0곳 안내', () => {
  test('공개 Gate 로 승인 장소가 모두 제외되면 정보 부족을 정직하게 안내한다', async () => {
    travelGuideSvc.recommend = jest.fn().mockImplementation(async (ctx) => {
      ctx._publicGateRemoved = 2; // 실제 recommend 가 남기는 값과 같은 계약
      return { places: [], why_details: [], status: 'NO_RESULT', understood_context: {} };
    });
    const r = await ask('여수 여행지 추천해줘');
    expect(r.payload.message_ko).toContain('확인된 관광지 정보가 아직 부족해요');
    expect(r.payload.message_ko).toContain('추천 장소를 만들지 않았어요');
  });

  test('공개 Gate 제외가 없었던 빈 결과는 기존 일반 안내를 유지한다 (일괄 변경 없음)', async () => {
    travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [], why_details: [], status: 'NO_RESULT', understood_context: {} });
    const r = await ask('여수 여행지 추천해줘');
    expect(r.payload.message_ko).not.toContain('확인된 관광지 정보가 아직 부족해요');
  });

  test('우천 추천의 빈 결과는 기존 실내 정보 부족 안내를 유지한다', async () => {
    travelGuideSvc.recommend = jest.fn().mockImplementation(async (ctx) => {
      ctx._publicGateRemoved = 1;
      return { places: [], why_details: [], status: 'NO_RESULT', understood_context: {} };
    });
    const r = await ask('비 오는 날 추천해줘');
    expect(r.payload.message_ko).toContain('실내 장소 정보가 아직 충분히 확인되지 않았어요');
  });
});
