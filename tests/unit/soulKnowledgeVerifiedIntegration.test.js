'use strict';

/**
 * PHX-SOUL-QA-001 §64 — 공식 검증 관광 Knowledge 통합 회귀 테스트
 *
 * Founder 결정 반영:
 *  - Q63-1 오동도 체류: 90분 = 일정 배정 (안내 가능). 120분 = 근거 미확인 평균 → 평균으로 안내 금지. DB 변경 없음.
 *  - Q63-2 케이블카: 편도 약 13분 = 비공식 참고값. DB 45 = 근거 미확인 → 평균 미확인. 운영시간 미확인.
 *  - Q63-3 오동도: 섬 개방 = 상시 개방 (연중무휴). 동백열차 09:30~18:00 은 시설시간으로 분리. 09:00~17:00 금지.
 *  - F2: 출처가 확인된 사실만 사용. 계단은 2019 열린관광 기록임을 날짜로 표기.
 *  - 승인된 기존 값 유지: 하멜등대 30분, 향일암 120분.
 *
 * 외부 LLM 호출 없음. 기존 soulClarifyAnswerFirst.test.js 와 같은 mock 구조를 사용한다.
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

const PRINCIPAL = { principal_id: 'knowledge-test-user', principal_type: 'GUEST' };
// DB 값은 변경 없이 그대로 둔다 (§64: DB 변경 금지). 응답 경로에서 오동도 120 / 케이블카 45 는 노출되면 안 된다.
const ODONGDO = { code: 'odongdo', name_ko: '오동도', avg_stay_minutes: 120, type: 'attraction' };
const CABLE   = { code: 'cablecar', name_ko: '여수 해상케이블카', avg_stay_minutes: 45, type: 'leisure' };
const HAMEL   = { code: 'hamel_lighthouse', name_ko: '하멜등대', avg_stay_minutes: 30, type: 'attraction' };
const HYANG   = { code: 'hyangiram', name_ko: '향일암', avg_stay_minutes: 120, type: 'attraction' };
const DB_ROWS = { odongdo: ODONGDO, cablecar: CABLE, hamel_lighthouse: HAMEL, hyangiram: HYANG };

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
  message, sessionId: `knowledge-session-${++sid}`, hotelId: null, principal: PRINCIPAL, explicit_context: explicit,
});

beforeEach(() => {
  jest.clearAllMocks();
  contextSvc.parseUserMessage = jest.fn().mockResolvedValue(mkCtx());
  sessionSvc.getSession = jest.fn().mockResolvedValue({ ok: true, journey_ctx: null });
  sessionSvc.updateJourneyContext = jest.fn().mockResolvedValue({});
  travelGuideSvc.getPlaceByCode = jest.fn().mockImplementation(async (c) => DB_ROWS[c] || null);
  travelGuideSvc.recommend = jest.fn().mockResolvedValue({ places: [ODONGDO, CABLE, HAMEL, HYANG], why_details: [], status: 'OK', understood_context: {} });
});

describe('Q63-1 — 오동도 체류: 일정 배정 90분만 안내, 120분 평균 노출 금지 (H04·H17)', () => {
  test('H04: 체류 질문 → 일정 배정 90분 + 평균 체류 미확인', async () => {
    const r = await req('오동도 얼마나 머물면 돼?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('일정에서 약 90분');
    expect(msg).toContain('평균 체류시간은 확인되지 않았어요');
    expect(msg).not.toMatch(/120분/);
  });

  test('H17: 오동도 소요 시간 질문도 120분 평균을 노출하지 않는다', async () => {
    const r = await req('오동도 관람시간은 얼마나 걸려?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('일정에서 약 90분');
    expect(msg).not.toMatch(/120분/);
    expect(msg).not.toMatch(/평균 관람 시간은 약 120분/);
  });
});

describe('Q63-3 — 오동도 운영: 섬 개방시간과 동백열차 시설시간 분리 (H05)', () => {
  test('H05: 상시 개방 (연중무휴) + 동백열차 09:30~18:00 을 분리해 안내한다', async () => {
    const r = await req('오동도 몇 시에 열어?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('상시 개방 (연중무휴)');
    expect(msg).toContain('동백열차 운행시간은 09:30~18:00');
    expect(msg).toContain('12~13시 미운행');
  });

  test('09:00~17:00 을 섬 전체 운영시간으로 쓰지 않는다', async () => {
    const r = await req('오동도 운영시간 알려줘');
    expect(r.payload.message_ko).not.toMatch(/09:00~17:00/);
  });
});

describe('Q63-2 — 케이블카: 운영시간 미확인, 평균 이용시간 미확인, 편도 13분은 비공식 (H09·H18)', () => {
  test('H18: 케이블카 운영시간을 확정 표기하지 않는다 (09:30~21:30 금지)', async () => {
    const r = await req('케이블카 운영시간 알려줘');
    const msg = r.payload.message_ko;
    expect(msg).not.toMatch(/09:30~21:30/);
    expect(msg).toContain('운영시간은 아직 확인되지 않았어요');
  });

  test('H09: 케이블카 체류는 평균 미확인 (DB 45분 노출 금지)', async () => {
    const r = await req('케이블카 얼마나 머물러?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('평균 이용시간은 확인되지 않았어요');
    expect(msg).not.toMatch(/45분/);
  });

  test('케이블카 탑승 시간 질문은 평균 미확인 응답이며 12~13분·1.5km·45분을 노출하지 않는다', async () => {
    const r = await req('케이블카 탑승 시간은 얼마나 걸려?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('평균 이용시간은 확인되지 않았어요');
    expect(msg).not.toMatch(/12~13분|1.5km|45분/);
  });
});

describe('F2 — 오동도 산책·계단: 출처 확인된 사실만 사용 (H06·H14)', () => {
  test('H06: 방파제 15분 · 768m · 숲 산책로 2.5km 사실, 구간별 부담 미확인', async () => {
    contextSvc.parseUserMessage.mockResolvedValue({ ...mkCtx(), mobility_type: 'walk', _provenance: { ...mkCtx()._provenance, mobility_type: 'USER_EXPLICIT' } });
    const r = await req('오동도에서 걸어서 둘러볼 만한 곳은?');
    const msg = r.payload.message_ko;
    expect(msg).toMatch(/15분/);
    expect(msg).toContain('2.5km');
    expect(msg).toContain('768m');
    expect(msg).toContain('구간별로 걷는 부담은 확인되지 않았어요');
  });

  test('H14: 아이 동반 오동도 응답에 계단 구간을 2019년 기록으로 표기하고 현행 여부는 미확인으로 둔다', async () => {
    contextSvc.parseUserMessage.mockResolvedValue({ ...mkCtx(), people_type: 'family_with_kids', mobility_type: 'walk', _provenance: { ...mkCtx()._provenance, people_type: 'USER_EXPLICIT', mobility_type: 'USER_EXPLICIT' } });
    const r = await req('어린 자녀와 오동도를 걷고 싶어.');
    const msg = r.payload.message_ko;
    expect(msg).toContain('2019년');
    expect(msg).toContain('현재 여부는 확인되지 않았어요');
  });
});

describe('승인된 기존 값 유지 (하멜등대 30분, 향일암 120분)', () => {
  test('하멜등대 체류는 DB 30분을 그대로 안내한다', async () => {
    const r = await req('하멜등대 관람시간은 얼마나 걸려?');
    expect(r.payload.message_ko).toMatch(/약 30분/);
  });

  test('향일암 체류는 DB 120분을 그대로 안내한다', async () => {
    const r = await req('향일암 관람시간은 얼마나 걸려?');
    expect(r.payload.message_ko).toMatch(/약 120분/);
  });
});
