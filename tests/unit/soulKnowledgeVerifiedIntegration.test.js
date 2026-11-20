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
  test('H05: 상시 개방 (연중무휴) + 동백열차 시설시간을 분리하고, 종료 시각 충돌을 확정 없이 안내한다 (§93 C1)', async () => {
    const r = await req('오동도 몇 시에 열어?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('상시 개방 (연중무휴)');
    // §93 C1: 동백열차 종료 시각 18:00 / 17:30 충돌을 함께 안내하고 한쪽으로 확정하지 않는다.
    expect(msg).toContain('운행 종료 시각은 출처마다 달라요');
    expect(msg).toContain('17:30');
    expect(msg).toContain('18:00');
    expect(msg).not.toContain('동백열차 운행시간은 09:30~18:00');
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

// ── §93 고객 안내 정확성 (C1·C2·C4 충돌 표기, C3 하멜 SSOT 정합, C5 미정의 역할 노출 차단) ──
const fs93 = require('fs');
const path93 = require('path');
const SRC93 = fs93.readFileSync(path93.join(__dirname, '../../services/soyeowoolService.js'), 'utf8');
const LOC93 = fs93.readFileSync(path93.join(__dirname, '../../docs/ssot/media/SSOT-LOC-001_DreamTown_Yeosu_Locations.md'), 'utf8');

describe('§93 C1 — 동백열차 종료 시각 충돌은 확정 없이 두 출처를 함께 안내', () => {
  test('오동도 운영 질문에 17:30 / 18:00 충돌과 방문일 확인 안내가 들어간다', async () => {
    const r = await req('오동도 몇 시에 열어?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('출처마다 달라요');
    expect(msg).toContain('17:30');
    expect(msg).toContain('18:00');
    expect(msg).toContain('방문일 시간표를 확인');
    expect(msg).not.toMatch(/동백열차 운행시간은 \d{2}:\d{2}~18:00이에요/);
  });
});

describe('§93 C2 — 향일암 개방 시작 충돌 (04:00 / 05:00)', () => {
  test('향일암 운영시간 질문은 개방 시작 04:00 또는 05:00 충돌을 표기하고 단일 04:00 기준값을 제시하지 않는다', async () => {
    const r = await req('향일암 몇 시에 열어?');
    const msg = r.payload.message_ko;
    expect(msg).toContain('개방 시작 04:00 또는 05:00');
    expect(msg).toContain('출처마다 다름');
    expect(msg).toContain('종료 19:00');
    expect(msg).not.toContain('04:00~19:00');
    expect(msg).toMatch(/확인/);
  });
});

describe('§93 C4 — 케이블카 성인 요금 충돌은 확정 요금으로 단정하지 않는다', () => {
  test('케이블카 요금 질문은 15,000원과 17,000원을 함께 안내하고 확정 표현을 쓰지 않는다', async () => {
    const r = await req('케이블카 입장료 어떻게 돼?', { place_code: 'cablecar' });
    const msg = r.payload.message_ko;
    expect(msg).toContain('출처마다 달라요');
    expect(msg).toContain('15,000원');
    expect(msg).toContain('17,000원');
    expect(msg).not.toContain('일반캐빈 왕복 약 17,000원');
  });

  test('케이블카 운영시간은 UNVERIFIED 로 유지되어 시각을 단정하지 않는다', async () => {
    const r = await req('케이블카 운영시간 알려줘');
    const msg = r.payload.message_ko;
    expect(msg).toContain('운영시간은 아직 확인되지 않았어요');
    expect(msg).not.toMatch(/\d{2}:\d{2}~\d{2}:\d{2}/);
  });
});

describe('§93 C3 — 하멜등대 감정 역할은 SSOT-LOC-001 정본과 일치한다', () => {
  test('SSOT-LOC-001 "6. 하멜등대" 역할·감정과 코드 emotional_role 이 같다', () => {
    const block = LOC93.slice(LOC93.indexOf('### 6. 하멜등대'), LOC93.indexOf('### 7. 호텔'));
    const role = block.match(/\| 역할 \| (.+?) \|/)[1].trim();
    const emo = block.match(/\| 감정 \| (.+?) \|/)[1].trim();
    const code = SRC93.match(/hamel_lighthouse: \{[\s\S]*?emotional_role: '([^']+)'/)[1];
    expect(role).toBe('전환');
    expect(emo).toBe('소원 / 별');
    expect(code.split(/[\/·]/)[0].trim()).toBe(role);
    expect(code).toContain('소원');
  });
});

describe('§93 C5 — SSOT 미정의 감정 역할은 고객 전환 문장에 출력하지 않는다', () => {
  test('전환 문장 출력 허용 장소는 SSOT-LOC-001 에 역할이 정의된 장소(4·5·6번)만이다', () => {
    const m = SRC93.match(/const _SSOT_ROLE_PLACE = new Set\(\[([^\]]+)\]\)/);
    const codes = m[1].split(',').map((s) => s.trim().replace(/'/g, ''));
    expect(codes.sort()).toEqual(['cablecar', 'hamel_lighthouse', 'marine_park'].sort());
    // SSOT 정의 확인: 4 케이블카 상승 / 5 종포해양공원 쉼 / 6 하멜등대 전환
    expect(LOC93).toMatch(/### 4\. 케이블카[\s\S]*?\| 역할 \| 상승 \|/);
    expect(LOC93).toMatch(/### 5\. 종포해양공원[\s\S]*?\| 역할 \| 쉼 \|/);
  });

  test('코드 전용 역할(오동도·돌산공원·돌산대교)은 데이터에 보존되되 SSOT 허용 집합에 없다', () => {
    expect(SRC93).toContain("emotional_role: '재충전 / 자연 회복'");
    expect(SRC93).toContain("emotional_role: '여운·다짐·마무리'");
    expect(SRC93).toContain("emotional_role: '흐름·전환'");
    const allowed = ['cablecar', 'hamel_lighthouse', 'marine_park'];
    for (const c of ['odongdo', 'dolsan_nightscape', 'dolsan_daegyo']) {
      expect(allowed).not.toContain(c);
    }
  });

  test('오동도 발 전환 문장에 미정의 역할 "재충전" 이 노출되지 않는다 (cablecar→odongdo)', async () => {
    travelGuideSvc.getPlaceByCode.mockResolvedValue(ODONGDO);
    const r = await req('오동도도 같이 갈래', { place_code: 'odongdo' });
    expect(r.payload.message_ko).not.toMatch(/재충전/);
  });
});
