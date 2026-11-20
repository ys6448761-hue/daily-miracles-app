'use strict';

/**
 * PHX-MUYEOJEONG-FOOD §84 — 고객 추천 카드 (메뉴·가격·혼밥·어린이·네이버 상세 링크) 격리 테스트.
 * 외부 호출·DB 없음. Fixture 만 사용. 혜택 문구는 카드에 없어야 한다.
 */

const fs = require('fs');
const path = require('path');
const { buildMunmeokjiAnswer } = require('../../services/munmeokjiRoute');
const gate = require('../../services/munmeokjiTimeGate');

const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'munmeoji', 'restaurants.fixture.json'), 'utf8'));
const REAL = FIX.restaurants.filter((r) => !r._mock);
const byName = (n) => REAL.find((r) => r.name === n);
const KST = (s) => new Date(`${s}+09:00`);
const run = (message, now, rows = REAL) => buildMunmeokjiAnswer({ sessionId: 's', message, rows, now, devPreview: true });
const cardOf = (p, name) => p.cards.find((c) => c.name === name);

describe('명동게장본관 메뉴 (원본 11행, 본 메뉴 9 + 추가 2)', () => {
  const m = byName('명동게장본관');
  test('원본 11행이 모두 Fixture 에 있고, 추가 메뉴 2개는 본 메뉴에서 제외된다', () => {
    expect(m.menu).toHaveLength(11);
    expect(m.menu.filter((x) => !x.addon)).toHaveLength(9);
    expect(m.menu.filter((x) => x.addon).map((x) => x.name).sort()).toEqual(['갈치조림 단품추가', '날치알밥']);
  });
  test('가격과 조건이 원문과 같다 (1인혼밥 18,000 + 상차림비 표시, 초등학생 13,000)', () => {
    const solo = m.menu.find((x) => x.name === '1인혼밥돌게장정식');
    expect(solo.price).toBe(18000);
    expect(solo.solo).toBe(true);
    expect(solo.note).toMatch(/상차림비/);
    const kid = m.menu.find((x) => x.name === '초등학생 돌게장정식');
    expect(kid.price).toBe(13000);
    expect(kid.kids).toBe(true);
    expect(kid.note).toMatch(/초등 이상 1인1메뉴/);
  });
  test('명동 카드 (월 12:00): 본 메뉴 9개만 표시, 추가 메뉴는 카드에 없다', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    const c = cardOf(p, '명동게장본관');
    expect(c.menu_main).toHaveLength(9);
    const line = c.lines.find((l) => l.startsWith('메뉴:'));
    expect(line).toMatch(/돌게장백반정식 16,000원/);
    expect(line).not.toMatch(/날치알밥|갈치조림 단품추가/);
  });
  test('혼밥 (월 08:00): 1인 메뉴 줄에 1인혼밥돌게장정식 18,000원 표시', () => {
    const p = run('혼자 아침 먹고 싶어.', KST('2026-11-23T08:00:00'));
    const c = cardOf(p, '명동게장본관');
    expect(c.lines.join('\n')).toMatch(/1인 메뉴: 1인혼밥돌게장정식 18,000원/);
  });
  test('아이 동반 (월 12:00): 어린이 메뉴 초등학생 돌게장정식 13,000원 (초등 이상 1인1메뉴)', () => {
    const p = run('아이와 함께 게장 먹고 싶어.', KST('2026-11-23T12:00:00'));
    const c = cardOf(p, '명동게장본관');
    expect(c.lines.join('\n')).toMatch(/어린이 메뉴: 초등학생 돌게장정식 13,000원 \(초등 이상 1인1메뉴\)/);
  });
});

describe('꽃돌게장1번가 메뉴 (꽃게정식 1인 39,000원 우선)', () => {
  test('카드 (월 12:00): 꽃게정식 39,000원 (1인 기준), 꽃게탕 2인 이상, 왕꽃게정식 한정 수량', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    const text = cardOf(p, '꽃돌게장1번가').lines.join('\n');
    expect(text).toMatch(/꽃게정식 39,000원 \(1인 기준\)/);
    expect(text).toMatch(/꽃게탕 39,000원 \(2인 이상 주문\)/);
    expect(text).toMatch(/왕꽃게정식 50,000원 \(1인 기준, 한정 수량\)/);
  });
  test('아이 동반 카드: 어린이 수제 돈가스 8,000원', () => {
    const p = run('아이와 함께 게장 먹고 싶어.', KST('2026-11-23T12:00:00'));
    expect(cardOf(p, '꽃돌게장1번가').lines.join('\n')).toMatch(/어린이 메뉴: 어린이 수제 돈가스 8,000원/);
  });
});

describe('네이버 상세 URL 연결 (확인된 것만)', () => {
  test('궁전횟집: 검증된 상세 URL 이 카드에 연결된다 (Place ID 1231222553)', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    const c = cardOf(p, '궁전횟집');
    expect(c.naver_url).toBe('https://map.naver.com/p/entry/place/1231222553');
    expect(c.lines.join('\n')).toContain('네이버 지도: https://map.naver.com/p/entry/place/1231222553');
  });
  test('상세 URL 이 없는 명동·꽃돌·풍산은 링크를 만들지 않는다', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    expect(cardOf(p, '명동게장본관').naver_url).toBeNull();
    expect(cardOf(p, '꽃돌게장1번가').naver_url).toBeNull();
    expect(p.message_ko).not.toMatch(/map\.naver\.com\/p\/entry\/place\/(?!1231222553)/);
  });
  test('검색 URL 과 형식이 다른 URL 은 상세 링크로 인정하지 않는다', () => {
    expect(gate.naverDetailFromUrl('https://map.naver.com/p/search/궁전횟집')).toBeNull();
    expect(gate.naverDetailFromUrl('https://map.naver.com/v5/search/궁전횟집')).toBeNull();
    expect(gate.naverDetailFromUrl('https://example.com/place/1231222553')).toBeNull();
    expect(gate.naverDetailFromUrl('https://map.naver.com/p/entry/place/1231222553')).not.toBeNull();
  });
});

describe('카드 전체: 혜택·미확인 정보 없음', () => {
  test('어떤 카드에도 아메리카노·무료·할인·쿠폰·제휴 문구가 없다 (허용 목록 빈 상태)', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    const all = JSON.stringify(p.cards) + p.message_ko;
    expect(all).not.toMatch(/아메리카노|무료|할인|쿠폰|제휴/);
  });
  test('궁전횟집 카드에는 메뉴 정보가 없으므로 메뉴 줄을 만들지 않는다 (가격 추정 금지)', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    const c = cardOf(p, '궁전횟집');
    expect(c.menu_main).toEqual([]);
    expect(c.lines.some((l) => l.startsWith('메뉴:'))).toBe(false);
  });
  test('카드 필드는 확인된 값 (이름·음식·영업·추천 마감·메뉴·링크) 으로만 구성된다', () => {
    const p = run('지금 점심 먹을 곳 알려줘.', KST('2026-11-23T12:00:00'));
    const c = cardOf(p, '명동게장본관');
    expect(Object.keys(c).sort()).toEqual(['code', 'cuisine', 'cutoff', 'hours', 'lines', 'menu_kids', 'menu_main', 'name', 'naver_url'].sort());
    expect(c.hours).toBe('07:00~21:00');
    expect(c.cutoff).toBe('19:50');
  });
});
