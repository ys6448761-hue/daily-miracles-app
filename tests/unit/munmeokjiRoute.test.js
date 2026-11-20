'use strict';

/**
 * PHX-MUYEOJEONG-FOOD §81 — 고객 질문 기반 머먹지 추천 경로 Mock 테스트.
 * 외부 LLM·DB 없음. Fixture 행을 시각 조건과 함께 넣는다. 기준 시각은 Asia/Seoul.
 *  - 2026-11-23 = 월요일, 2026-11-24 = 화요일 (Asia/Seoul 확인)
 */

const fs = require('fs');
const path = require('path');
const intent = require('../../services/munmeokjiIntent');
const { buildMunmeokjiAnswer, isDevPreviewEnabled } = require('../../services/munmeokjiRoute');
const { guardPayload } = require('../../services/soulQualityGuard');

const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'munmeoji', 'restaurants.fixture.json'), 'utf8'));
const REAL = FIX.restaurants.filter((r) => !r._mock);

const KST = (s) => new Date(`${s}+09:00`); // 예: KST('2026-11-23T08:00:00')
const rowsFor = (slot) => (slot ? REAL.filter((r) => (r.meal_context || []).includes(slot)) : REAL);
const ask = (message, now, slotOverride) => {
  const slot = slotOverride !== undefined ? slotOverride : intent.parseVisit(message, now).slot;
  return buildMunmeokjiAnswer({ sessionId: 's', message, rows: rowsFor(slot || 'lunch'), now, devPreview: true });
};

describe('고객 질문 10종 (Asia/Seoul)', () => {
  test('1. 지금 아침 먹을 곳 알려줘 (월 08:00): 명동게장본관만, 풍산은 월요일 휴무·로타리는 LO 미확인으로 제외', () => {
    const p = ask('지금 아침 먹을 곳 알려줘.', KST('2026-11-23T08:00:00'));
    expect(p.message_ko).toContain('월요일 08:00 기준');
    expect(p.message_ko).toContain('명동게장본관');
    expect(p.message_ko).not.toContain('풍산식당');
    expect(p.message_ko).not.toContain('로타리식당');
    expect(p.munmeokji.visit.source).toBe('NOW');
    expect(p.munmeokji.visit.slot).toBe('breakfast');
  });

  test('2. 혼자 아침 먹고 싶어 (월 08:00): 혼밥 확인된 명동게장본관만', () => {
    const p = ask('혼자 아침 먹고 싶어.', KST('2026-11-23T08:00:00'));
    expect(p.message_ko).toContain('명동게장본관');
    expect(p.message_ko).not.toContain('풍산식당');
    expect(p.munmeokji.companion).toBe('solo');
  });

  test('3. 오후 3시에 늦은 점심 (명시 15:00): 궁전·명동 추천, 꽃돌은 브레이크타임 제외', () => {
    const p = ask('오후 3시에 늦은 점심 먹고 싶어.', KST('2026-11-23T08:00:00'));
    expect(p.munmeokji.visit.time).toBe('15:00');
    expect(p.munmeokji.visit.source).toBe('EXPLICIT');
    expect(p.munmeokji.visit.slot).toBe('late_lunch');
    expect(p.message_ko).toContain('궁전횟집');
    expect(p.message_ko).toContain('명동게장본관');
    expect(p.message_ko).not.toContain('• 꽃돌게장1번가');
    expect(p.message_ko).toContain('브레이크타임 1곳');
  });

  test('4. 아이와 함께 게장 (월 12:00): 명동·꽃돌 추천, 꽃돌 어린이 메뉴 표시, 궁전(회)·풍산 제외', () => {
    const p = ask('아이와 함께 게장을 먹고 싶어.', KST('2026-11-23T12:00:00'));
    expect(p.munmeokji.companion).toBe('kids');
    expect(p.message_ko).toContain('명동게장본관');
    expect(p.message_ko).toContain('꽃돌게장1번가');
    expect(p.message_ko).toContain('어린이 수제 돈가스 8,000원');
    expect(p.message_ko).not.toContain('궁전횟집');
    expect(p.message_ko).not.toContain('풍산식당');
  });

  test('5. 여수밤바다를 바라보며 회 (바다 전망 미확인): 임의 추천 없이 확인된 식당 없음 고지', () => {
    const p = ask('여수밤바다를 바라보면서 회를 먹고 싶어.', KST('2026-11-23T18:00:00'));
    expect(p.message_ko).toBe('바다 전망이 확인된 식당은 아직 없어요. 확인되지 않은 식당은 추천하지 않았어요.');
    expect(p.munmeokji.kept).toEqual([]);
  });

  test('6. 월요일에 풍산식당 갈 수 있어? (화 기준 → 월요일 질문): 정기휴무 안내', () => {
    const p = ask('월요일에 풍산식당 갈 수 있어?', KST('2026-11-24T10:00:00'));
    expect(p.munmeokji.visit.day).toBe('mon');
    expect(p.message_ko).toContain('풍산식당은 월요일 정기휴무예요.');
  });

  test('7. 오후 6시 30분에 풍산식당 (화): 추천 마감 18:20 이후라 불가 안내', () => {
    const p = ask('오후 6시 30분에 풍산식당 갈까?', KST('2026-11-24T10:00:00'));
    expect(p.munmeokji.visit.time).toBe('18:30');
    expect(p.message_ko).toContain('풍산식당은 화요일 18:30에 추천하기 어려워요.');
    expect(p.message_ko).toContain('추천 마감(18:20) 이후예요.');
  });

  test('8. 밤 11시에 식사할 곳 (23:00): 시간 게이트로 전부 제외, 임의 추천 없음', () => {
    // 실제 식사 시점 필터는 없는 행이므로 전체 행으로 시간 판단만 검증한다
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '밤 11시에 식사할 곳 알려줘.', rows: REAL, now: KST('2026-11-23T20:00:00'), devPreview: true });
    expect(p.munmeokji.visit.time).toBe('23:00');
    expect(p.munmeokji.visit.slot).toBe('late_night');
    expect(p.message_ko).toContain('지금 시간에 확인된 식당이 없어요');
    expect(p.munmeokji.kept).toEqual([]);
  });

  test('9. 꽃게탕 혼자 먹을 수 있어? (꽃돌 꽃게탕 최소 2인): 혼자 주문 어려움 안내', () => {
    const p = ask('꽃게탕 혼자 먹을 수 있어?', KST('2026-11-23T12:00:00'));
    expect(p.message_ko).toBe('꽃돌게장1번가의 꽃게탕은 2인 이상 주문 메뉴라 혼자 주문하기 어려워요.');
    expect(p.munmeokji.menu_item).toBe('꽃게탕');
  });

  test('10. 내일 아침 갈 식당 (월 20:00 → 화 08:00 기본 시각): 명동만, 기본 시각 기준 표시', () => {
    const p = ask('내일 아침에 갈 식당을 추천해 줘.', KST('2026-11-23T20:00:00'));
    expect(p.munmeokji.visit.day).toBe('tue');
    expect(p.munmeokji.visit.time).toBe('08:00');
    expect(p.munmeokji.visit.source).toBe('SLOT_DEFAULT');
    expect(p.message_ko).toContain('화요일 08:00 기준');
    expect(p.message_ko).toContain('명동게장본관');
    expect(p.message_ko).not.toContain('풍산식당');
  });
});

describe('시각·요일 해석 (Asia/Seoul)', () => {
  const now = KST('2026-11-23T08:00:00');
  test('오후 6시 30분 → 18:30, 오전 8시 → 08:00, 밤 11시 → 23:00, 18:30 → 18:30, 오후 6시 반 → 18:30', () => {
    expect(intent.parseExplicitTime('오후 6시 30분에')).toBe('18:30');
    expect(intent.parseExplicitTime('오전 8시')).toBe('08:00');
    expect(intent.parseExplicitTime('밤 11시')).toBe('23:00');
    expect(intent.parseExplicitTime('18:30 갈까')).toBe('18:30');
    expect(intent.parseExplicitTime('오후 6시 반')).toBe('18:30');
  });
  test('시각 표현이 없으면 null', () => {
    expect(intent.parseExplicitTime('아침 먹을 곳')).toBeNull();
  });
  test('내일 = 다음 날 (Asia/Seoul)', () => {
    expect(intent.parseVisit('내일 아침', now).day).toBe('tue');
  });
  test('월요일 (화요일에 물으면) = 다음 월요일', () => {
    expect(intent.parseVisit('월요일에 갈까', KST('2026-11-24T10:00:00')).day).toBe('mon');
  });
  test('UTC 기준으로는 전날이어도 Asia/Seoul 기준 요일을 쓴다 (2026-11-22T20:00Z = 11-23 월 05:00 KST)', () => {
    const v = intent.parseVisit('지금 아침', new Date('2026-11-22T20:00:00Z'));
    expect(v.day).toBe('mon');
    expect(v.time).toBe('05:00');
    expect(v.source).toBe('NOW');
  });
  test('지금 ≠ 방문 예정: 명시 시각이 있으면 현재 시각을 쓰지 않는다', () => {
    const v = intent.parseVisit('오후 7시에 갈래', now);
    expect(v.time).toBe('19:00');
    expect(v.source).toBe('EXPLICIT');
  });
  test('명시 시각만 있으면 식사 시점은 시각으로 추정한다 (19:00 → dinner)', () => {
    expect(intent.parseVisit('오후 7시에 갈래', now).slot).toBe('dinner');
    expect(intent.parseVisit('오후 7시에 갈래', now).slotSource).toBe('INFERRED_FROM_TIME');
  });
});

describe('식당 질문 판별 (무관한 질문은 새 경로로 가지 않는다)', () => {
  test('식당 질문은 true', () => {
    expect(intent.isMunmeokjiFoodQuestion('지금 아침 먹을 곳 알려줘.')).toBe(true);
    expect(intent.isMunmeokjiFoodQuestion('풍산식당 갈 수 있어?')).toBe(true);
  });
  test('기존 질문은 false (H02 게장 설명, H01 인사, H19 여정, 카페)', () => {
    expect(intent.isMunmeokjiFoodQuestion('게장이 어떤 음식이야?')).toBe(false);
    expect(intent.isMunmeokjiFoodQuestion('좋은 아침이야, 소울아.')).toBe(false);
    expect(intent.isMunmeokjiFoodQuestion('처음 여수에 왔는데 어디부터 가면 좋을까?')).toBe(false);
    expect(intent.isMunmeokjiFoodQuestion('바다가 보이는 여수 카페를 알려줘.')).toBe(false);
  });
  test('일정·코스 질문은 식당 경로로 가지 않는다', () => {
    expect(intent.isMunmeokjiFoodQuestion('아이와 먹을 점심 코스 짜줘')).toBe(false);
  });
});

describe('추천 불가 시 임의 추천 금지 · 공개 게이트', () => {
  test('운영 설정 (개발 미리보기 꺼짐) 에서는 미공개 행을 보여주지 않는다', () => {
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 아침 먹을 곳', rows: rowsFor('breakfast'), now: KST('2026-11-23T08:00:00'), devPreview: false });
    expect(p.message_ko).not.toContain('명동게장본관');
    expect(p.message_ko).toContain('지금 확인된 음식점 정보가 없어요');
  });
  test('customer_public=true 로 승인된 행은 운영에서도 보인다', () => {
    const approved = rowsFor('breakfast').map((r) => ({ ...r, customer_public: r.name === '명동게장본관' }));
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 아침 먹을 곳', rows: approved, now: KST('2026-11-23T08:00:00'), devPreview: false });
    expect(p.message_ko).toContain('명동게장본관');
  });
  test('개발 미리보기는 환경변수 명시 + 운영·Render 아님일 때만 켜진다', () => {
    expect(isDevPreviewEnabled({ MUNMEOKJI_DEV_PREVIEW: '1' })).toBe(true);
    expect(isDevPreviewEnabled({})).toBe(false);
    expect(isDevPreviewEnabled({ MUNMEOKJI_DEV_PREVIEW: '1', NODE_ENV: 'production' })).toBe(false);
    expect(isDevPreviewEnabled({ MUNMEOKJI_DEV_PREVIEW: '1', RENDER_SERVICE_ID: 'srv-x' })).toBe(false);
  });
  test('후보 없는 응답에는 식당 이름이 나오지 않는다', () => {
    const p = ask('밤 11시에 식사할 곳 알려줘.', KST('2026-11-23T20:00:00'));
    for (const r of REAL) expect(p.message_ko).not.toContain(r.name);
  });
});

describe('응답 가드 통과 (검증 시각 토큰)', () => {
  test('식당 응답의 시각은 응답이 만든 토큰으로 검증되어 가드가 대체하지 않는다', () => {
    const p = ask('지금 아침 먹을 곳 알려줘.', KST('2026-11-23T08:00:00'));
    const corpus = require('../../services/soyeowoolService').verifiedKnowledgeText + ' ' + p.verified_clock_tokens.join(' ');
    const g = guardPayload(p, '지금 아침 먹을 곳 알려줘.', { knowledgeText: corpus, buildFactFallback: () => null });
    expect(g.message_ko).toBe(p.message_ko);
    expect(g.status).toBe('PLACE_LOOKUP');
  });
});
