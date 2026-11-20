'use strict';

/**
 * PHX-MUYEOJEONG-FOOD §79 — 식당 추천 경로 (travelGuideService._getFoodRecommendation) 통합 Mock 테스트.
 * DB 는 격리 Fixture 를 돌려주는 가짜 query 로 대체한다. 실제 연결 없음.
 */

jest.mock('../../database/db', () => {
  const fs = require('fs');
  const path = require('path');
  const fixture = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'munmeoji', 'restaurants.fixture.json'), 'utf8'));
  return {
    query: jest.fn(async (sql) => {
      if (/COUNT\(\*\)/i.test(sql)) return { rows: [{ count: String(fixture.restaurants.length) }] };
      if (/FROM travel_restaurants/i.test(sql)) {
        // 시간 필터는 서비스 쪽 게이트가 담당. 여기서는 Fixture 행을 그대로 돌려준다.
        return { rows: fixture.restaurants.map((r) => ({ ...r })) };
      }
      return { rows: [] };
    }),
  };
});

const travelGuide = require('../../services/travelGuideService');

const base = { country_code: 'KR', city_code: 'YEOSU', meal_context: 'lunch' };
const names = (out) => (out.restaurants || []).map((r) => r.name || (r.restaurant && r.restaurant.name) || r.code);

describe('식당 추천 경로 — 방문 시각 없음 (기존 동작 보존)', () => {
  test('visit 이 없으면 시간 게이트를 적용하지 않는다 (미확인 업체도 기존처럼 후보에 남는다)', async () => {
    const out = await travelGuide._getFoodRecommendation({ ...base });
    expect(out.time_gate_excluded).toBeUndefined();
    expect(out.message).not.toContain('지금 시간에');
  });
});

describe('식당 추천 경로 — 방문 시각 지정 (§79 게이트 적용)', () => {
  test('꽃돌게장1번가 브레이크타임 (15:00) 에는 추천 결과에 나오지 않는다', async () => {
    const out = await travelGuide._getFoodRecommendation({ ...base, visit: { time: '15:00', day: 'mon' } });
    const list = names(out);
    expect(list).not.toContain('꽃돌게장1번가');
  });

  test('19:30 에는 꽃돌게장1번가 (추천 마감 19:30) 가 빠지고, 19:29 에는 남는다', async () => {
    const at1929 = await travelGuide._getFoodRecommendation({ ...base, visit: { time: '19:29', day: 'mon' } });
    const at1930 = await travelGuide._getFoodRecommendation({ ...base, visit: { time: '19:30', day: 'mon' } });
    expect(names(at1929)).toContain('꽃돌게장1번가');
    expect(names(at1930)).not.toContain('꽃돌게장1번가');
  });

  test('미확인 영업정보 업체 (백천선어마을, 장군도횟집, 로타리식당) 는 시간 기준 추천에서 제외', async () => {
    const out = await travelGuide._getFoodRecommendation({ ...base, visit: { time: '12:00', day: 'mon' } });
    const list = names(out);
    expect(list).not.toContain('백천선어마을');
    expect(list).not.toContain('장군도횟집');
    expect(list).not.toContain('로타리식당');
  });

  test('모든 업체가 제외되면 확정 안내 없이 "확인된 음식점 정보가 없어요" 로 돌려준다', async () => {
    const out = await travelGuide._getFoodRecommendation({ ...base, visit: { time: '04:00', day: 'mon' } });
    expect(out.type).toBe('none');
    expect(out.data_status).toBe('unavailable');
    expect(out.message).toBe('지금 시간에 확인된 음식점 정보가 없어요');
    expect(Array.isArray(out.time_gate_excluded)).toBe(true);
  });
});
