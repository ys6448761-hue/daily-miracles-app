'use strict';
/**
 * §105 — 관광지 고객 공개 허용 목록 Gate 검증 (일반·우천·Fallback 추천).
 * DB 는 메모리 스텁. LLM 호출 없음. 신규 Seed 추가 없음.
 */
const fs = require('fs');
const path = require('path');

jest.mock('../../database/db', () => ({ query: jest.fn(), connect: jest.fn(), on: jest.fn() }));
jest.mock('../../services/sessionService', () => ({
  touchSession: jest.fn().mockResolvedValue({}),
  getSession: jest.fn().mockResolvedValue(null),
}));

const db = require('../../database/db');
const gate = require('../../services/touristPublicGate');
const travelGuideService = require('../../services/travelGuideService');
const fallbackService = require('../../services/fallbackService');

const SEED13 = JSON.parse(fs.readFileSync(path.join(__dirname, '../fixtures/public105/seed-13.copy.json'), 'utf8'));
const SEED_CODES = SEED13.map((r) => r.code).sort();

// 비공개 후보 (§103 Fixture 와 같은 성격, 운영 DB 아님)
const CANDIDATE_ARTE = {
  code: 'fixture_arte_museum_yeosu', name_ko: '아르떼뮤지엄 여수', country_code: 'KR', city_code: 'YEOSU',
  indoor_outdoor: 'indoor', avg_stay_minutes: null, suitable_for: ['family'], weather_suitable: ['rainy'],
  emotion_primary: null, emotion_tags: [], trust_level: 'VERIFIED', customer_public: false,
};
const CANDIDATE_MUSEUM = {
  code: 'fixture_nyeosu_meteorology_museum', name_ko: '국립여수해양기상과학관', country_code: 'KR', city_code: 'YEOSU',
  indoor_outdoor: 'indoor', avg_stay_minutes: null, suitable_for: ['family'], weather_suitable: ['rainy'],
  emotion_primary: null, emotion_tags: [], trust_level: 'VERIFIED', customer_public: false,
};
// 신규 Seed 행을 가정 (목록 밖, customer_public 미설정, trust_level VERIFIED)
const NEW_FUTURE_ROW = {
  code: 'new_future_place', name_ko: '신규 테스트 장소', country_code: 'KR', city_code: 'YEOSU',
  indoor_outdoor: 'indoor', avg_stay_minutes: 60, suitable_for: ['family'], weather_suitable: ['rainy'],
  emotion_primary: 'joy', emotion_tags: [], trust_level: 'VERIFIED',
};

const CONTEXT = (extra = {}) => ({
  country_code: 'KR', city_code: 'YEOSU', session_id: 's105', time_available_minutes: 180,
  exclude_place_ids: [], must_visit_place_ids: [], _domainFallbacks: [], ...extra,
});

function setRows(rows) {
  db.query.mockImplementation(async (sql) => {
    if (/FROM travel_places/i.test(sql)) return { rows, rowCount: rows.length };
    return { rows: [], rowCount: 0 };
  });
}
const names = (places) => (places || []).map((p) => p.name || p.name_ko || '');

beforeEach(() => { jest.clearAllMocks(); });

describe('§105 Legacy Approved Baseline', () => {
  test('허용 목록은 현재 Seed 13개 code 와 정확히 일치한다 (동적 로딩 없음)', () => {
    expect([...gate.LEGACY_APPROVED_BASELINE].sort()).toEqual(SEED_CODES);
    expect(gate.LEGACY_APPROVED_BASELINE.length).toBe(13);
  });

  test('목록은 동결되어 있다 (런타임 추가 불가)', () => {
    expect(Object.isFrozen(gate.LEGACY_APPROVED_BASELINE)).toBe(true);
  });
});

describe('§105 공통 판단 isCustomerPublicPlace', () => {
  test('목록의 기존 장소 (customer_public 미설정) → 허용', () => {
    expect(gate.isCustomerPublicPlace({ code: 'odongdo', trust_level: 'VERIFIED' })).toBe(true);
  });

  test('목록 밖 장소 → 비공개 (trust_level=VERIFIED 여도)', () => {
    expect(gate.isCustomerPublicPlace({ code: 'new_future_place', trust_level: 'VERIFIED' })).toBe(false);
  });

  test('목록에 있어도 customer_public=false 면 비공개 (명시 차단)', () => {
    expect(gate.isCustomerPublicPlace({ code: 'odongdo', customer_public: false })).toBe(false);
  });

  test('신규 Seed 행이 추가되어도 자동 공개되지 않는다', () => {
    expect(gate.isCustomerPublicPlace(NEW_FUTURE_ROW)).toBe(false);
  });

  test('실내 Candidate 2곳은 비공개', () => {
    expect(gate.isCustomerPublicPlace(CANDIDATE_ARTE)).toBe(false);
    expect(gate.isCustomerPublicPlace(CANDIDATE_MUSEUM)).toBe(false);
  });

  test('아쿠아플라넷 (목록 밖) 는 비공개', () => {
    expect(gate.isCustomerPublicPlace({ code: 'aquaplanet', name_ko: '아쿠아플라넷 여수' })).toBe(false);
  });

  test('code 가 없거나 객체가 아니면 비공개', () => {
    expect(gate.isCustomerPublicPlace(null)).toBe(false);
    expect(gate.isCustomerPublicPlace({})).toBe(false);
  });
});

describe('§105 일반 추천 (travelGuideService.recommend)', () => {
  test('기존 Seed 13곳만 있으면 기존처럼 추천이 나온다', async () => {
    setRows(SEED13);
    const r = await travelGuideService.recommend(CONTEXT());
    expect(names(r.places).length).toBeGreaterThan(0);
    const seedNames = new Set(SEED13.map((x) => x.name_ko));
    for (const n of names(r.places)) expect(seedNames.has(n)).toBe(true);
  });

  test('목록 밖 장소 (실내 Candidate·신규 행) 는 일반 추천에서 제외된다', async () => {
    setRows([...SEED13, CANDIDATE_ARTE, CANDIDATE_MUSEUM, NEW_FUTURE_ROW]);
    const r = await travelGuideService.recommend(CONTEXT());
    const out = names(r.places);
    expect(out).not.toContain('아르떼뮤지엄 여수');
    expect(out).not.toContain('국립여수해양기상과학관');
    expect(out).not.toContain('신규 테스트 장소');
  });
});

describe('§105 우천 추천 (weather rainy)', () => {
  test('목록 밖 실내 Candidate 는 우천 추천에서 제외된다', async () => {
    setRows([...SEED13, CANDIDATE_ARTE, CANDIDATE_MUSEUM]);
    const r = await travelGuideService.recommend(CONTEXT({ weather: { condition: 'rainy' } }));
    const out = names(r.places);
    expect(out).not.toContain('아르떼뮤지엄 여수');
    expect(out).not.toContain('국립여수해양기상과학관');
  });

  test('기존 공개 승인 Seed 장소만 있는 우천 추천은 허용 목록 안의 장소만 낸다', async () => {
    setRows(SEED13);
    const r = await travelGuideService.recommend(CONTEXT({ weather: { condition: 'rainy' } }));
    const seedNames = new Set(SEED13.map((x) => x.name_ko));
    for (const n of names(r.places)) expect(seedNames.has(n)).toBe(true);
  });

  test('허용 목록 밖 장소만 남으면 추천을 만들지 않는다 (정보 부족)', async () => {
    setRows([CANDIDATE_ARTE, CANDIDATE_MUSEUM, NEW_FUTURE_ROW]);
    const r = await travelGuideService.recommend(CONTEXT({ weather: { condition: 'rainy' } }));
    expect(names(r.places)).toEqual([]);
  });
});

describe('§105 대체 추천 (fallbackService)', () => {
  test('대체 후보 조회는 목록 밖 장소를 제외한다', async () => {
    setRows([...SEED13, CANDIDATE_ARTE, NEW_FUTURE_ROW]);
    const cands = await fallbackService._getAllCandidates(CONTEXT());
    const codes = cands.map((c) => c.code);
    expect(codes).not.toContain('fixture_arte_museum_yeosu');
    expect(codes).not.toContain('new_future_place');
    for (const c of codes) expect(SEED_CODES).toContain(c);
  });

  test('목록 밖 장소만 있으면 대체 후보는 비어 있다', async () => {
    setRows([CANDIDATE_MUSEUM, NEW_FUTURE_ROW]);
    const cands = await fallbackService._getAllCandidates(CONTEXT());
    expect(cands).toEqual([]);
  });
});

describe('§105 우회 가능성 보고 (확장하지 않음)', () => {
  test('getPlaceByCode 는 공개 필터를 거치지 않는다 (직접 조회 경로, 보고 대상)', async () => {
    db.query.mockImplementation(async () => ({ rows: [NEW_FUTURE_ROW], rowCount: 1 }));
    const row = await travelGuideService.getPlaceByCode('new_future_place');
    // 현재 동작 기록: 직접 조회는 필터되지 않는다. 노출 경로는 추천 목록이며 추천 Gate 로 차단된다.
    expect(row && row.code).toBe('new_future_place');
  });
});
