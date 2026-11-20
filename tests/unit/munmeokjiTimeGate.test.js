'use strict';

/**
 * PHX-MUYEOJEONG-FOOD §79 — 머먹지 식당 시간 게이트 Mock 테스트.
 * 외부 호출·DB 없음. 격리 Fixture 사용 (tests/fixtures/munmeoji/restaurants.fixture.json).
 * 경계 테스트는 다른 추천 조건이 충족된 Fixture 행을 사용한다 (Founder §79).
 */

const fs = require('fs');
const path = require('path');
const gate = require('../../services/munmeokjiTimeGate');

const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'munmeoji', 'restaurants.fixture.json'), 'utf8'));
const byName = (n) => FIX.restaurants.find((r) => r.name === n);
const byCode = (c) => FIX.restaurants.find((r) => r.code === c);
const JUNG = byName('궁전횟집');
const MYEONG = byName('명동게장본관');
const KKOT = byName('꽃돌게장1번가');
const BAEKCHUN = byName('백천선어마을');
const JANGGUN = byName('장군도횟집');
const ROTARY = byName('로타리식당');
const NIGHT = byCode('MOCK_야식집');
const CLOSED_WED = byCode('MOCK_궁전_수휴');

const v = (time, day = 'mon', travel_min) => ({ time, day, ...(travel_min !== undefined ? { travel_min } : {}) });
const keptNames = (rows, visit) => gate.applyRestaurantTimeGate(rows, visit).kept.map((r) => r.name);
const reasonOf = (rec, visit) => gate.statusAt(rec, visit);

describe('아침·혼밥 (오전 7시 / 8시)', () => {
  test('오전 7시 아침식사: 명동게장본관 개점 07:00 이므로 추천 가능', () => {
    expect(keptNames([MYEONG], v('07:00'))).toEqual(['명동게장본관']);
  });
  test('오전 7시: 궁전횟집 (11:00 개점) 은 영업 전이라 제외', () => {
    expect(reasonOf(JUNG, v('07:00')).reason).toBe(gate.REASON.OUT_OF_HOURS);
  });
  test('오전 8시 혼밥: 명동게장본관이 혼밥 적합 (suitable_for: solo) 으로 추천 가능', () => {
    expect(MYEONG.suitable_for).toContain('solo');
    expect(keptNames([MYEONG], v('08:00'))).toEqual(['명동게장본관']);
  });
});

describe('오후 3시 늦은 점심 / 브레이크타임', () => {
  test('오후 3시 늦은 점심: 궁전·명동 은 추천 가능', () => {
    expect(keptNames([JUNG, MYEONG], v('15:00'))).toEqual(['궁전횟집', '명동게장본관']);
  });
  test('브레이크타임 (15:00~17:00) 중 꽃돌게장1번가 추천 제외', () => {
    expect(reasonOf(KKOT, v('15:00')).reason).toBe(gate.REASON.BREAK_TIME);
    expect(reasonOf(KKOT, v('16:59')).reason).toBe(gate.REASON.BREAK_TIME);
  });
  test('브레이크 종료 직후 (17:00) 는 다시 추천 가능 (종료 시각 포함 안 함)', () => {
    expect(reasonOf(KKOT, v('17:00')).ok).toBe(true);
  });
});

describe('추천 마감 경계 (라스트오더 − 30분, 다른 조건 충족 Fixture 사용)', () => {
  test('꽃돌게장1번가: LO 20:00 → 19:29 추천, 19:30 제외', () => {
    expect(reasonOf(KKOT, v('19:29')).ok).toBe(true);
    expect(reasonOf(KKOT, v('19:30')).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
  test('명동게장본관: LO 20:20 → 19:49 추천, 19:50 제외', () => {
    expect(reasonOf(MYEONG, v('19:49')).ok).toBe(true);
    expect(reasonOf(MYEONG, v('19:50')).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
  test('궁전횟집: LO 20:30 → 19:59 추천, 20:00 제외', () => {
    expect(reasonOf(JUNG, v('19:59')).ok).toBe(true);
    expect(reasonOf(JUNG, v('20:00')).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
});

describe('정기휴무', () => {
  test('수요일 정기휴무 식당 (MOCK 수휴, 로타리식당) 은 수요일 추천 제외', () => {
    expect(reasonOf(CLOSED_WED, v('12:00', 'wed')).reason).toBe(gate.REASON.CLOSED_DAY);
    expect(reasonOf(ROTARY, v('12:00', 'wed')).reason).toBe(gate.REASON.CLOSED_DAY);
  });
  test('같은 식당도 수요일이 아닌 날에는 추천 가능', () => {
    expect(reasonOf(CLOSED_WED, v('12:00', 'mon')).ok).toBe(true);
  });
});

describe('자정 이후 영업 및 전날 영업', () => {
  test('금요일 18:00~02:00 스케줄 식당: 토요일 00:30 은 전날 영업으로 추천 가능', () => {
    const s = reasonOf(NIGHT, v('00:30', 'sat'));
    expect(s.ok).toBe(true);
    expect(s.governing).toBe('prev');
  });
  test('토요일 01:00 은 라스트오더 01:30 기준 −30분 (01:00) 이후라 제외', () => {
    expect(reasonOf(NIGHT, v('01:00', 'sat')).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
  test('토요일 03:00 은 전날 영업도 끝났고 당일 영업 전이라 제외', () => {
    expect(reasonOf(NIGHT, v('03:00', 'sat')).reason).toBe(gate.REASON.OUT_OF_HOURS);
  });
  test('당일 18:00~02:00 영업 중 저녁 20:00 은 추천 가능 (자정 넘김 스케줄 당일 구간)', () => {
    expect(reasonOf(NIGHT, v('20:00', 'sat')).ok).toBe(true);
  });
});

describe('미확인 영업정보 및 이동시간', () => {
  test('백천선어마을: 영업시간 미확인 → 시간 기준 추천 제외 (확정 안내 금지)', () => {
    expect(reasonOf(BAEKCHUN, v('12:00')).reason).toBe(gate.REASON.HOURS_UNKNOWN);
  });
  test('장군도횟집: 라스트오더 미확인 → 추천 마감을 계산하지 않고 제외', () => {
    expect(reasonOf(JANGGUN, v('15:00')).reason).toBe(gate.REASON.LAST_ORDER_UNKNOWN);
  });
  test('로타리식당: 라스트오더 미확인 → 제외 (수요일 휴무 포함)', () => {
    expect(reasonOf(ROTARY, v('12:00', 'mon')).reason).toBe(gate.REASON.LAST_ORDER_UNKNOWN);
  });
  test('이동시간 미확인: 마감을 조정하지 않고 TRAVEL_UNKNOWN 메모만 남긴다', () => {
    const s = reasonOf(JUNG, v('19:59'));
    expect(s.ok).toBe(true);
    expect(s.note).toContain('TRAVEL_UNKNOWN');
  });
  test('확인된 이동시간 35분: 궁전 마감 20:00 → 19:25 로 앞당김 (19:24 추천, 19:25 제외)', () => {
    expect(reasonOf(JUNG, v('19:24', 'mon', 35)).ok).toBe(true);
    expect(reasonOf(JUNG, v('19:25', 'mon', 35)).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
  test('확인된 이동시간이 30분 미만이면 마감을 조정하지 않는다 (20분: 19:59 추천)', () => {
    expect(reasonOf(JUNG, v('19:59', 'mon', 20)).ok).toBe(true);
  });
});

describe('업체 통합 (F017 계열) — 중복 추천 방지', () => {
  test('같은 group_code 행 3개가 모두 열려 있어도 추천 결과에는 1건만 남는다', () => {
    const rows = [byCode('F017_BEOMAT'), byCode('F017_KBAKSAK')];
    const out = gate.applyRestaurantTimeGate(rows, v('12:00'));
    expect(out.kept).toHaveLength(1);
    expect(out.kept[0].code).toBe('F017_BEOMAT');
  });
  test('group_code 가 없는 행은 code 기준으로 구분된다', () => {
    expect(gate.dedupeByGroup([JUNG, MYEONG])).toHaveLength(2);
  });
});

describe('네이버 상세 URL 과 Place ID (Schema 변경 없이)', () => {
  test('장소 상세 URL 에서 Place ID 를 얻는다 (궁전횟집 1231222553)', () => {
    expect(gate.naverDetailFromUrl(JUNG.source_url)).toEqual({
      placeId: '1231222553',
      url: 'https://map.naver.com/p/entry/place/1231222553',
    });
  });
  test('검색 URL 과 상세 URL 이 없는 행은 링크를 만들지 않는다', () => {
    expect(gate.naverDetailFromUrl('https://map.naver.com/p/search/궁전횟집')).toBeNull();
    expect(gate.naverDetailFromUrl(MYEONG.source_url)).toBeNull();
    expect(gate.naverDetailFromUrl(null)).toBeNull();
  });
});

describe('소원패스 혜택 노출 게이트 (미승인 혜택 노출 방지)', () => {
  const benefit = { title: '아메리카노 1잔 (2~4인 그룹)' };
  test('허용 목록이 비어 있으면 혜택을 노출하지 않는다 (현재 상태)', () => {
    expect(gate.benefitVisibleToCustomer({ name: '궁전횟집' }, { ...benefit, customer_public: true }, [])).toBe(false);
  });
  test('허용 목록에 있어도 고객 공개 승인이 없으면 노출하지 않는다', () => {
    expect(gate.benefitVisibleToCustomer({ name: '궁전횟집' }, { ...benefit, customer_public: false }, ['궁전횟집'])).toBe(false);
  });
  test('HOLD 상태면 허용 목록·공개 승인이 있어도 노출하지 않는다 (모이핀 10% 류)', () => {
    expect(gate.benefitVisibleToCustomer({ name: '궁전횟집' }, { ...benefit, customer_public: true, hold: true }, ['궁전횟집'])).toBe(false);
  });
  test('허용 목록 + 고객 공개 승인 + HOLD 아님이면 노출 가능', () => {
    expect(gate.benefitVisibleToCustomer({ name: '궁전횟집' }, { ...benefit, customer_public: true }, ['궁전횟집'])).toBe(true);
  });
});

describe('입력 검증 및 기존 동작 보존', () => {
  test('방문 시각이 없으면 입력을 그대로 돌려준다 (기존 SOUL 동작 보존)', () => {
    const rows = [JUNG, BAEKCHUN];
    const out = gate.applyRestaurantTimeGate(rows, undefined);
    expect(out.kept).toBe(rows);
    expect(out.excluded).toEqual([]);
  });
  test('잘못된 시각 형식은 INVALID_TIME 으로 제외한다 (추정하지 않음)', () => {
    expect(reasonOf(JUNG, { time: '25:00', day: 'mon' }).reason).toBe(gate.REASON.INVALID_TIME);
    expect(reasonOf(JUNG, { time: '12:00', day: 'xxx' }).reason).toBe(gate.REASON.INVALID_TIME);
  });
  test('전체 Fixture 를 월요일 12:00 에 돌리면: 미확인 3곳·야식(영업 전)·F017 중복 2건 제외', () => {
    const names = keptNames(FIX.restaurants, v('12:00', 'mon')).sort();
    expect(names).toEqual([
      'MOCK 범앗간 계열 A',
      'MOCK 수요일휴무 식당',
      '궁전횟집',
      '꽃돌게장1번가',
      '명동게장본관',
    ].sort());
  });
});

// ── §80: Founder 추가 확인 (2026-11-20) ───────────────────────────────────────
describe('§80 풍산식당 F001 — 매장 전화 확인 (LO 18:50, 추천 마감 18:20, 월요일 휴무)', () => {
  const FP = byName('풍산식당');
  test('월요일 추천 제외 (정기휴무)', () => {
    expect(reasonOf(FP, v('12:00', 'mon')).reason).toBe(gate.REASON.CLOSED_DAY);
  });
  test('화요일 오전 8시 영업 시작: 영업 시간 안이지만 저녁 LO 는 아침에 적용하지 않아 LO 미확인으로 제외 (§81)', () => {
    const s = reasonOf(FP, v('08:00', 'tue'));
    expect(s.ok).toBe(false);
    expect(s.reason).toBe(gate.REASON.LAST_ORDER_UNKNOWN);
  });
  test('오전 7시 59분은 영업 전이라 제외', () => {
    expect(reasonOf(FP, v('07:59', 'tue')).reason).toBe(gate.REASON.OUT_OF_HOURS);
  });
  test('오후 3시 ~ 5시 미만 브레이크타임 제외, 5시(17:00) 재개', () => {
    expect(reasonOf(FP, v('15:00', 'tue')).reason).toBe(gate.REASON.BREAK_TIME);
    expect(reasonOf(FP, v('16:59', 'tue')).reason).toBe(gate.REASON.BREAK_TIME);
    expect(reasonOf(FP, v('17:00', 'tue')).ok).toBe(true);
  });
  test('오후 6시 19분 추천 가능, 6시 20분 추천 마감 (LO 18:50 − 30분)', () => {
    expect(reasonOf(FP, v('18:19', 'tue')).ok).toBe(true);
    expect(reasonOf(FP, v('18:20', 'tue')).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
  test('오후 6시 50분 주문 마감 이후 제외', () => {
    expect(reasonOf(FP, v('18:50', 'tue')).reason).toBe(gate.REASON.AFTER_LAST_ORDER_CUTOFF);
  });
  test('오후 7시 40분 영업 종료 (종료 시각 포함 안 함) 이후 제외 (영업 종료 = OUT_OF_HOURS)', () => {
    expect(reasonOf(FP, v('19:40', 'tue')).reason).toBe(gate.REASON.OUT_OF_HOURS);
    expect(reasonOf(FP, v('19:41', 'tue')).reason).toBe(gate.REASON.OUT_OF_HOURS);
  });
  test('풍산식당 Founder 확인값에는 과거 표본 시간 근거가 남아 있지 않다 (phone_evidence 로 대체)', () => {
    expect(FP.evidence).toMatch(/2026-11-20/);
    expect(FP.opening_hours_json.status).toMatch(/전화 확인/);
  });
});

describe('§80 명동게장본관·궁전횟집 — 브레이크 없음 (Founder 확인)', () => {
  test('명동게장본관 오후 3시 추천 가능 (브레이크 규칙 미적용)', () => {
    expect(reasonOf(MYEONG, v('15:00', 'mon')).ok).toBe(true);
    expect(reasonOf(MYEONG, v('16:00', 'mon')).ok).toBe(true);
  });
  test('궁전횟집 오후 3시 추천 가능 (브레이크 규칙 미적용)', () => {
    expect(reasonOf(JUNG, v('15:00', 'mon')).ok).toBe(true);
    expect(reasonOf(JUNG, v('16:30', 'mon')).ok).toBe(true);
  });
});

describe('§80 꽃돌게장1번가 메뉴 — 최소 주문 인원·한정 메뉴·어린이 메뉴', () => {
  const menu = KKOT.menu;
  test('메뉴 기준일 2026-11-02 및 Founder 출처 기록', () => {
    expect(KKOT.menu_updated_at).toBe('2026-11-02');
    expect(KKOT.menu_source).toMatch(/Founder/);
  });
  test('1인 방문: 꽃게탕·갈치조림정식 (2인 이상) 제외, 꽃게정식 포함', () => {
    const names = gate.menuForParty(menu, 1).map((m) => m.name);
    expect(names).toContain('꽃게정식');
    expect(names).not.toContain('꽃게탕');
    expect(names).not.toContain('갈치조림정식');
  });
  test('2인 방문: 꽃게탕·갈치조림정식 포함', () => {
    const names = gate.menuForParty(menu, 2).map((m) => m.name);
    expect(names).toEqual(expect.arrayContaining(['꽃게탕', '갈치조림정식']));
  });
  test('일행 수를 모르면 최소 인원 메뉴는 확정하지 않고 제외', () => {
    const names = gate.menuForParty(menu, null).map((m) => m.name);
    expect(names).not.toContain('꽃게탕');
  });
  test('추가 메뉴 (addon) 는 본 메뉴 목록에 들어가지 않는다', () => {
    expect(gate.menuForParty(menu, 2).some((m) => m.addon)).toBe(false);
  });
  test('왕꽃게정식은 한정 수량으로 표시 (소진 가능성)', () => {
    const m = gate.menuForParty(menu, 1).find((x) => x.name === '왕꽃게정식');
    expect(m.limited_stock).toBe(true);
  });
  test('어린이 동반 추천 근거: 어린이 수제 돈가스 8,000원', () => {
    const kids = gate.kidsMenu(menu);
    expect(kids.map((m) => m.name)).toEqual(['어린이 수제 돈가스']);
    expect(kids[0].price).toBe(8000);
  });
  test('가격 기준: 꽃게정식 39,000 (1인), 꽃게탕 39,000 (2인 이상), 왕꽃게정식 50,000', () => {
    const p = (n) => menu.find((m) => m.name === n).price;
    expect(p('꽃게정식')).toBe(39000);
    expect(p('꽃게탕')).toBe(39000);
    expect(p('왕꽃게정식')).toBe(50000);
  });
});
