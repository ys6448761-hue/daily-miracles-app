'use strict';
/**
 * §97 — 자연어 라우팅 최소 수정 (M1–M6) Mock 검증. 실제 자연어 입력만 사용한다 (place_code 강제 없음).
 * 외부 LLM·DB 호출 없음. 금지 표현: 음악분수 종료 시각 확정, 방문 가능 단정, 전체 숲길 야간 권장.
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

const PRINCIPAL = { principal_id: 's97-user', principal_type: 'GUEST' };
const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const CABLE   = { code: 'cablecar', name_ko: '여수 해상케이블카', avg_stay_minutes: 45, type: 'leisure' };
const HAMEL   = { code: 'hamel_lighthouse', name_ko: '하멜등대', avg_stay_minutes: 30, type: 'attraction' };
const HYANG   = { code: 'hyangiram', name_ko: '향일암', avg_stay_minutes: 120, type: 'attraction' };
const DB_ROWS = { odongdo: ODONGDO, cablecar: CABLE, hamel_lighthouse: HAMEL, hyangiram: HYANG };
const mkCtx = () => ({
  people_type: 'solo', has_car: false, companion_constraints: { has_kids: false, has_elderly: false },
  meal_context: 'none', time_available_minutes: 120, group_size: null, mobility_type: 'mixed',
  _provenance: { people_type: 'UNKNOWN', has_car: 'UNKNOWN', mobility_type: 'UNKNOWN', time_available_minutes: 'UNKNOWN' },
});
const FORBIDDEN_FOUNTAIN_TIMES = /19:00|20:00|20:15|22:00|22:15/;

let sid = 0;
beforeAll(() => { delete process.env.SOUL_HYBRID_V1; });
beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (c) => DB_ROWS[c] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [ODONGDO, CABLE, HAMEL, HYANG], why_details: [], status: 'OK', understood_context: {} });
});
const ask = (message) => handleTravelRequest({
  message, sessionId: `s97-${++sid}`, hotelId: null, principal: PRINCIPAL, explicit_context: {},
});

describe('§97 M6·K1 — 음악분수 질문은 식당이 아니라 관광지 이용정보로 답한다', () => {
  test('1. 여름 저녁에 음악분수 볼 수 있어? → 운영기간 안내, 공연 시각 확정 없음, 식당 아님', async () => {
    const r = await ask('여름 저녁에 음악분수 볼 수 있어?');
    const m = r.payload.message_ko;
    expect(r.payload.status).toBe('PLACE_SPECIFIC_QUERY');
    expect(m).toContain('음악분수 정규 운영기간 안이에요');
    expect(m).toContain('바닥분수는 7~8월');
    expect(m).not.toMatch(FORBIDDEN_FOUNTAIN_TIMES);
    expect(m).not.toMatch(/음식점|식사 시점|토요일 18:00/);
  });

  test('2. 11월에 오동도 음악분수 볼 수 있어? → 정규 운영기간 밖이라 보장 없음', async () => {
    const r = await ask('11월에 오동도 음악분수 볼 수 있어?');
    const m = r.payload.message_ko;
    expect(m).toContain('11월은 음악분수 정규 운영기간(3~10월) 밖이라 공연을 보장하지 않아요');
    expect(m).not.toMatch(FORBIDDEN_FOUNTAIN_TIMES);
  });

  test('3. 비 오는 날 음악분수 볼 수 있어? → 우천·강풍 시 미운영', async () => {
    const r = await ask('비 오는 날 음악분수 볼 수 있어?');
    const m = r.payload.message_ko;
    expect(m).toContain('우천·강풍 시 운영하지 않아요');
    expect(m).toContain('비가 오는 날에는 공연이 없어요');
    expect(m).not.toMatch(FORBIDDEN_FOUNTAIN_TIMES);
  });

  test('음악분수 종료 시각을 질문하면 19:00/20:00 중 하나를 확정하지 않는다', async () => {
    const r = await ask('오동도 음악분수 몇 시까지야?');
    const m = r.payload.message_ko;
    expect(m).toContain('공연 종료 시각은 공식 안내 간 차이가 있어 확정하지 않아요');
    expect(m).not.toMatch(FORBIDDEN_FOUNTAIN_TIMES);
  });

  test('식사 질문은 식당 경로를 유지한다 (저녁 먹을 곳 / 저녁 식당 추천)', async () => {
    const a = await ask('저녁 먹을 곳 알려줘.');
    const b = await ask('저녁 식당 추천해줘.');
    expect(a.payload.status).toBe('PLACE_LOOKUP');
    expect(b.payload.status).toBe('PLACE_LOOKUP');
    expect(a.payload.message_ko).toMatch(/식사 시점|음식점/);
  });
});

describe('§97 M1·K1 — 동백열차 막차·장소별 요금', () => {
  test('4. 오동도 동백열차 막차 몇 시야? → 계절별 막차 원문 (3~10월 / 11~2월)', async () => {
    const r = await ask('오동도 동백열차 막차 몇 시야?');
    const m = r.payload.message_ko;
    expect(r.payload.status).toBe('PLACE_SPECIFIC_QUERY');
    expect(m).toContain('17:50');
    expect(m).toContain('17:40');
    expect(m).toContain('17:00');
    expect(m).toContain('16:45');
    expect(m).toContain('점심시간 12:00~13:00에는 운행하지 않아요');
  });

  test('5. 케이블카 요금 알려줘 → 장소별 요금 경로, 출처 충돌 표기 (확정 금지)', async () => {
    const r = await ask('케이블카 요금 알려줘');
    const m = r.payload.message_ko;
    expect(r.payload.status).toBe('PLACE_SPECIFIC_QUERY');
    expect(m).toContain('출처마다 달라요');
    expect(m).toContain('15,000원');
    expect(m).toContain('17,000원');
  });

  test('케이블카 얼마야? 도 장소별 요금 경로 (견적 흐름 아님)', async () => {
    const r = await ask('케이블카 얼마야?');
    expect(r.payload.status).toBe('PLACE_SPECIFIC_QUERY');
    expect(r.payload.message_ko).toContain('출처마다 달라요');
  });

  test('8. 여행 전체 예산 얼마야? → 일반 견적 흐름 보존 (장소 없음)', async () => {
    const r = await ask('여행 전체 예산 얼마야?');
    expect(r.payload.status).toBe('CLARIFICATION');
    expect(r.payload.message_ko).toContain('견적을 만들어드릴게요');
  });
});

describe('§97 M4 — 시각 포함 방문 가능 질문은 방문 가능을 단정하지 않는다', () => {
  test('4(시각). 오동도 밤 9시에 갈 수 있어? → "가실 수 있어요" 단정 없음, 시설 시간 확인 안내', async () => {
    const r = await ask('오동도 밤 9시에 갈 수 있어?');
    const m = r.payload.message_ko;
    expect(m).not.toContain('가실 수 있어요');
    expect(m).toContain('방문일 시간표를 확인해 주세요');
    expect(m).toContain('상시 개방');
  });

  test('9. 향일암 새벽 4시에 갈 수 있어? → 04:00/05:00 충돌, 방문일 공식 확인', async () => {
    const r = await ask('향일암 새벽 4시에 갈 수 있어?');
    const m = r.payload.message_ko;
    expect(m).toContain('04:00 또는 05:00');
    expect(m).toContain('방문일 공식 확인 후 결정');
    expect(m).not.toMatch(/갈 수 있어요\./);
  });

  test('오동도 밤에 숲길 걸어도 돼? → 전체 숲길 야간 이용 단정 없음', async () => {
    const r = await ask('오동도 밤에 숲길 걸어도 돼?');
    const m = r.payload.message_ko;
    expect(m).not.toContain('가실 수 있어요');
    expect(m).toContain('방문일 시간표를 확인해 주세요');
  });

  test('오동도 야경 보러 갈 수 있어? → 음악분수 공연 보장 없음', async () => {
    const r = await ask('오동도 야경 보러 갈 수 있어?');
    expect(r.payload.message_ko).not.toContain('가실 수 있어요');
  });
});

describe('§97 M5 — 우천 상황 추천은 기존 추천 경로 + §88 신호, 실내 근거 없으면 장소를 만들지 않는다', () => {
  test('10. 비 오는 날 어디 가지? → 추천 경로로 가고 rainy 신호가 전달된다', async () => {
    await ask('비 오는 날 어디 가지?');
    expect(travelGuideSvc.recommend).toHaveBeenCalled();
    const ctx = travelGuideSvc.recommend.mock.calls[0][0];
    expect(ctx.weather).toEqual({ condition: 'rainy' });
  });

  test('비 오는 날 추천해줘. → 기존 동작 유지 (rainy 신호 전달)', async () => {
    await ask('비 오는 날 추천해줘.');
    const ctx = travelGuideSvc.recommend.mock.calls[0][0];
    expect(ctx.weather).toEqual({ condition: 'rainy' });
  });

  test('검증된 실내 장소가 없으면 추천 장소를 만들지 않고 정보 부족을 안내한다', async () => {
    travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [], why_details: [], status: 'NO_RESULT', understood_context: {} });
    const r = await ask('비 오는 날 어디 가지?');
    expect(r.payload.message_ko).toContain('실내 장소 정보가 아직 충분히 확인되지 않았어요');
    expect(r.payload.message_ko).toContain('추천 장소를 만들지 않았어요');
  });

  test('비 오는 날 음악분수 질문은 장소 재질문이 아니라 우천 운영 규칙으로 답한다', async () => {
    const r = await ask('비 오는 날 음악분수 볼 수 있어?');
    expect(r.payload.message_ko).toContain('우천·강풍 시 운영하지 않아요');
  });
});

describe('§97 회귀 — 장소·운영 질문 보존', () => {
  test('하멜등대 운영시간 알려줘. → 미확인 응답 유지 (추측 없음)', async () => {
    const r = await ask('하멜등대 운영시간 알려줘.');
    expect(r.payload.message_ko).toContain('운영시간은 아직 확인되지 않았어요');
  });

  test('케이블카는 어떤 곳이야? → 소개 경로 유지 (PLACE_LOOKUP)', async () => {
    const r = await ask('케이블카는 어떤 곳이야?');
    expect(r.payload.status).toBe('PLACE_LOOKUP');
  });

  test('오늘 비 올까? → 날씨 소스 없음: 추천 경로로 가지 않는다 (범위 밖 질문)', async () => {
    await ask('오늘 비 올까?');
    expect(travelGuideSvc.recommend).not.toHaveBeenCalled();
  });
});
