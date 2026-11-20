'use strict';

/**
 * PHX-MUYEOJEONG-FOOD §86 — 뭐 먹지? 운영 연결 최소 구현 격리 테스트.
 * 외부 호출·DB 없음 (db 는 mock). 쿠폰 계약은 소스 정적 확인 (supertest·DB 미설치 환경).
 */

jest.mock('../../database/db', () => ({ query: jest.fn() }));

const fs = require('fs');
const path = require('path');
const db = require('../../database/db');
const travelGuide = require('../../services/travelGuideService');
const { buildMunmeokjiAnswer } = require('../../services/munmeokjiRoute');

const KST = (s) => new Date(`${s}+09:00`);
const FIX = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'munmeoji', 'restaurants.fixture.json'), 'utf8'));
const REAL = FIX.restaurants.filter((r) => !r._mock);

// DB 형태 행 (travel_restaurants + menu_json). 메뉴는 menu_json 에서만 읽는다.
const dbRow = (over = {}) => ({
  code: 'T_DB_1', name: 'DB 테스트 식당', cuisine_type: '백반', address: '여수시 테스트로 1', phone: null,
  source_url: null, meal_context: ['lunch'], suitable_for: ['solo', 'family'], closed_day: '',
  opening_hours_json: {
    mon: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
    tue: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
    wed: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
    thu: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
    fri: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
    sat: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
    sun: { open: '10:00', close: '21:00', break: null, last_order: '20:00' },
  },
  menu_json: null, customer_public: true,
  ...over,
});

beforeEach(() => { jest.clearAllMocks(); });

describe('Q85-2 메뉴 Schema: 파일 존재·형식 (적용 아님)', () => {
  const mig = path.join(__dirname, '..', '..', 'database', 'migrations', '217_travel_restaurants_menu_json.sql');
  const rb = path.join(__dirname, '..', '..', 'database', 'migrations', '217_travel_restaurants_menu_json_rollback.sql');
  test('217 마이그레이션은 기존 컬럼을 건드리지 않고 menu_json JSONB 1개만 추가한다 (IF NOT EXISTS)', () => {
    const sql = fs.readFileSync(mig, 'utf8');
    expect(sql).toMatch(/ALTER TABLE travel_restaurants/);
    expect(sql).toMatch(/ADD COLUMN IF NOT EXISTS menu_json JSONB NULL/);
    expect(sql).not.toMatch(/DROP|RENAME|ALTER COLUMN|TYPE /i);
  });
  test('롤백 파일은 menu_json 만 제거한다', () => {
    const sql = fs.readFileSync(rb, 'utf8');
    expect(sql).toMatch(/DROP COLUMN IF EXISTS menu_json/);
    expect(sql).not.toMatch(/DROP COLUMN IF EXISTS (?!menu_json)/);
  });
});

describe('실제 DB 형태 메뉴 읽기 (menu_json)', () => {
  test('menu_json 배열 형태의 행을 DB 조회 결과로 받아 카드에 메뉴·가격을 연결한다', async () => {
    const row = dbRow({
      name: 'DB 식당 A',
      menu_json: [
        { name: '백반정식', price: 12000, note: '1인분' },
        { name: '추가 밥', price: 2000, addon: true },
      ],
    });
    db.query.mockResolvedValueOnce({ rows: [row] });
    const rows = await travelGuide._getRestaurants('KR', 'YEOSU', 'lunch');
    expect(rows).toHaveLength(1);
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 점심 먹을 곳', rows, now: KST('2026-11-23T12:00:00'), devPreview: false });
    const c = p.cards.find((x) => x.name === 'DB 식당 A');
    expect(c).toBeDefined();
    expect(c.lines.join('\n')).toMatch(/메뉴: 백반정식 12,000원 \(1인분\)/);
    expect(c.lines.join('\n')).not.toMatch(/추가 밥/);
  });

  test('menu_json 이 {items} 형태여도 같은 방식으로 읽는다', async () => {
    const row = dbRow({ name: 'DB 식당 B', menu_json: { source: 'Founder', checked_at: '2026-11-20', items: [{ name: '국밥', price: 9000 }] } });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 점심 먹을 곳', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    expect(p.cards[0].lines.join('\n')).toMatch(/국밥 9,000원/);
  });

  test('메뉴 정보가 없는 식당 (menu_json NULL) 도 정상 처리되고 가격을 만들지 않는다', () => {
    const row = dbRow({ name: 'DB 식당 C', menu_json: null });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 점심 먹을 곳', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    expect(p.cards[0].menu_main).toEqual([]);
    expect(p.cards[0].lines.some((l) => l.startsWith('메뉴:'))).toBe(false);
    expect(p.message_ko).not.toMatch(/원\b.*메뉴/);
  });

  test('가격이 없는 메뉴 항목은 표시하지 않는다 (임의 생성 금지)', () => {
    const row = dbRow({ menu_json: [{ name: '가격미확인 메뉴' }, { name: '확인된 메뉴', price: 5000 }] });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 점심 먹을 곳', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    const text = p.cards[0].lines.join('\n');
    expect(text).toMatch(/확인된 메뉴 5,000원/);
    expect(text).not.toMatch(/가격미확인 메뉴/);
  });
});

describe('혼밥 및 최소 주문 인원 필터', () => {
  test('혼밥(1인): 최소 주문 인원 2 이상 메뉴는 1인 메뉴에서 제외된다', () => {
    const row = dbRow({
      menu_json: [
        { name: '1인정식', price: 10000, solo: true },
        { name: '2인 탕', price: 30000, min_party: 2 },
      ],
    });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '혼자 점심 먹고 싶어', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    const text = p.cards[0].lines.join('\n');
    expect(text).toMatch(/1인 메뉴: 1인정식 10,000원/);
    expect(text).not.toMatch(/2인 탕/);
  });
  test('일행 2명 이상 안내 (min_party 메뉴) 는 라벨과 함께 표시된다', () => {
    const row = dbRow({ menu_json: [{ name: '2인 탕', price: 30000, min_party: 2 }] });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '점심 먹을 곳', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    expect(p.cards[0].lines.join('\n')).toMatch(/2인 탕 30,000원 \(2인 이상 주문\)/);
  });
});

describe('네이버 상세 URL (검증된 것만)', () => {
  test('검증된 상세 URL 은 카드에 연결된다', () => {
    const row = dbRow({ source_url: 'https://map.naver.com/p/entry/place/1231222553' });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '점심 먹을 곳', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    expect(p.cards[0].naver_url).toBe('https://map.naver.com/p/entry/place/1231222553');
  });
  test('검색 URL 이나 없는 URL 은 카드에 연결하지 않는다', () => {
    const row = dbRow({ source_url: 'https://map.naver.com/p/search/DB 식당' });
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '점심 먹을 곳', rows: [row], now: KST('2026-11-23T12:00:00'), devPreview: true });
    expect(p.cards[0].naver_url).toBeNull();
  });
});

describe('Q85-4 카페 이름 경로: 미확인·충돌 주소·전화 차단, 일반 카페 이름은 유지', () => {
  test('info_status 가 verified 가 아니면 주소·전화를 싣지 않고 이름만 반환한다', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'p1', name: '엘리스테이 카페', category: 'cafe', phone: '0507-1371-2956', address: '돌산읍 백초길 28-52', info_status: 'unverified' }] });
    const out = await travelGuide._getCafePartners('KR', 'YEOSU');
    expect(out).toEqual([{ id: 'p1', name: '엘리스테이 카페', category: 'cafe' }]);
    expect(out[0].phone).toBeUndefined();
    expect(out[0].address).toBeUndefined();
  });
  test('info_status=verified 인 카페만 주소·전화를 싣는다', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'p2', name: '확인된 카페', category: 'cafe', phone: '061-000-0000', address: '여수시 test 1', info_status: 'verified' }] });
    const out = await travelGuide._getCafePartners('KR', 'YEOSU');
    expect(out[0].phone).toBe('061-000-0000');
    expect(out[0].address).toBe('여수시 test 1');
  });
  test('일반 카페 이름 노출 자체는 차단하지 않는다 (미검증 카페도 이름은 나온다)', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'p3', name: '미검증 카페', category: 'cafe', phone: null, address: null, info_status: 'unverified' }] });
    const out = await travelGuide._getCafePartners('KR', 'YEOSU');
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('미검증 카페');
  });
});

describe('승인 상태 분리: 추천 적합성 ≠ Production 공개', () => {
  test('4곳은 추천 적합성 승인, Production 공개는 HOLD (false)', () => {
    for (const n of ['풍산식당', '궁전횟집', '명동게장본관', '꽃돌게장1번가']) {
      const r = REAL.find((x) => x.name === n);
      expect(r.fit_approved_for_recommendation).toBe(true);
      expect(r.production_public).toBe(false);
      expect(r.customer_public).toBe(false);
    }
  });
  test('Production 공개 플래그가 꺼진 행은 운영 설정에서 카드로 나오지 않는다', () => {
    const p = buildMunmeokjiAnswer({ sessionId: 's', message: '지금 점심 먹을 곳', rows: REAL, now: KST('2026-11-23T12:00:00'), devPreview: false });
    expect(p.cards).toEqual([]);
  });
});

describe('기존 쿠폰 계약 (소스 정적 확인: starlightCouponRoutes.js)', () => {
  const src = (() => {
    const cands = [
      path.join(__dirname, '..', '..', 'routes', 'starlightCouponRoutes.js'),
      path.join(__dirname, '..', '..', '..', 'daily-miracles-mvp', 'routes', 'starlightCouponRoutes.js'),
    ];
    const hit = cands.find((p) => fs.existsSync(p));
    return hit ? fs.readFileSync(hit, 'utf8') : null;
  })();
  test('발급 허용 목록은 기본 빈 값 (미설정 = 전부 차단, fail-closed)', () => {
    if (!src) return; // 소스 위치가 다른 환경에서는 건너뜀 (기록은 §86 참조)
    expect(src).toMatch(/COUPON_VENUE_ALLOWLIST \|\| ''/);
    expect(src).toMatch(/return allowedVenues\(\)\.includes\(venueId\)/);
  });
  test('발급 라우트는 허용되지 않은 venue 에 403 을 돌려준다', () => {
    if (!src) return;
    expect(src).toMatch(/if \(!isVenueAllowed\(venue_id\)\)/);
    expect(src).toMatch(/status\(403\)/);
  });
  test('사용 기록은 coupon_id UNIQUE 로 중복 사용이 DB 에서 차단된다 (migration 215)', () => {
    const mig = path.join(__dirname, '..', '..', 'database', 'migrations', '215_starlight_coupons.sql');
    const alt = path.join(__dirname, '..', '..', '..', 'daily-miracles-mvp', 'database', 'migrations', '215_starlight_coupons.sql');
    const f = fs.existsSync(mig) ? mig : (fs.existsSync(alt) ? alt : null);
    if (!f) return;
    expect(fs.readFileSync(f, 'utf8')).toMatch(/coupon_id\s+UUID\s+NOT NULL UNIQUE/);
  });
});
