'use strict';

const { buildSkeleton } = require('../../services/routeSkeletonService');

const BASE = {
  start_date: '2026-10-17',
  hotel_code: 'ramada',
  leisure_code: 'cable',
  guest_count: 2,
  candidates: []
};

function allItems(skeleton) {
  return skeleton.days.flatMap(d => d.items);
}

describe('routeSkeletonService', () => {

  // 1. LOCKED_PRESERVATION_hotel
  test('LOCKED: hotel always in Day 1 regardless of candidates', () => {
    const s = buildSkeleton(BASE);
    const day1 = s.days[0].items;
    const hotel = day1.find(it => it.commerce_code === 'ramada');
    expect(hotel).toBeDefined();
    expect(hotel.selection_status).toBe('LOCKED');
    expect(hotel.source).toBe('USER_SELECTED');
  });

  // 2. LOCKED_PRESERVATION_cable
  test('LOCKED: cable car always in Day 1 regardless of candidates', () => {
    const s = buildSkeleton(BASE);
    const day1 = s.days[0].items;
    const cable = day1.find(it => it.commerce_code === 'cable');
    expect(cable).toBeDefined();
    expect(cable.selection_status).toBe('LOCKED');
    expect(cable.source).toBe('USER_SELECTED');
  });

  // 3. DATE_DETERMINISM_day1
  test('Day 1 date equals start_date', () => {
    const s = buildSkeleton(BASE);
    expect(s.days[0].date).toBe('2026-10-17');
    expect(s.start_date).toBe('2026-10-17');
  });

  // 4. DATE_DETERMINISM_day2
  test('Day 2 date is start_date + 1', () => {
    const s = buildSkeleton(BASE);
    expect(s.days[1].date).toBe('2026-10-18');
    expect(s.end_date).toBe('2026-10-18');
  });

  // 5. ROUTE_QUOTE_FILTER_locked_only — all quotable=true items must be LOCKED
  test('only LOCKED items are quotable', () => {
    const s = buildSkeleton({
      ...BASE,
      candidates: [{ name_ko: '오동도', type: 'attraction', place_code: 'ODONGDO' }]
    });
    const items = allItems(s);
    const quotableItems = items.filter(it => it.quotable === true);
    quotableItems.forEach(it => {
      expect(it.selection_status).toBe('LOCKED');
    });
    expect(quotableItems.length).toBeGreaterThan(0); // at least hotel and cable
  });

  // 6. ROUTE_QUOTE_FILTER_suggested_excluded — SUGGESTED items not quotable
  test('SUGGESTED items are not quotable', () => {
    const s = buildSkeleton({
      ...BASE,
      candidates: [{ name_ko: '오동도', type: 'attraction', place_code: 'ODONGDO' }]
    });
    const items = allItems(s);
    const suggested = items.filter(it => it.selection_status === 'SUGGESTED');
    expect(suggested.length).toBeGreaterThan(0);
    suggested.forEach(it => {
      expect(it.quotable).toBe(false);
      expect(it.commerce_code).toBeNull();
    });
  });

  // 7. AI_FAILURE_FALLBACK — skeleton runs with empty candidates, LOCKED items present
  test('skeleton runs without itineraryService — LOCKED items present with empty candidates', () => {
    // buildSkeleton is a pure function with no AI calls — this directly verifies fallback safety
    const s = buildSkeleton({ ...BASE, candidates: [] });
    const items = allItems(s);
    const locked = items.filter(it => it.selection_status === 'LOCKED');
    expect(locked.length).toBeGreaterThanOrEqual(2); // at least hotel + cable
    const hasHotel = locked.some(it => it.commerce_code === 'ramada');
    const hasCable = locked.some(it => it.commerce_code === 'cable');
    expect(hasHotel).toBe(true);
    expect(hasCable).toBe(true);
  });

  // 8. CHECKOUT_MARKER — Day 2 includes hotel checkout (quotable=false, commerce_code=null)
  test('Day 2 includes hotel checkout marker (quotable=false)', () => {
    const s = buildSkeleton(BASE);
    const day2 = s.days[1].items;
    const checkout = day2.find(it => it.type === 'hotel' && it.name.includes('체크아웃'));
    expect(checkout).toBeDefined();
    expect(checkout.quotable).toBe(false);
    expect(checkout.commerce_code).toBeNull();
    expect(checkout.selection_status).toBe('LOCKED');
  });

  // 9. SUGGESTED_FROM_TGRESULT — cable car candidate de-duplicated, 오동도 appears as SUGGESTED
  test('cable car candidate de-duplicated; other candidates become SUGGESTED', () => {
    const s = buildSkeleton({
      ...BASE,
      candidates: [
        { name_ko: '오동도', type: 'attraction', place_code: 'ODONGDO' },
        { name_ko: '여수 해상케이블카', type: 'leisure', place_code: 'CABLE' } // should be de-duped
      ]
    });
    const items = allItems(s);
    const suggested = items.filter(it => it.selection_status === 'SUGGESTED');

    // 오동도 should be SUGGESTED
    const odongdo = suggested.find(it => it.name === '오동도');
    expect(odongdo).toBeDefined();

    // Cable car should NOT appear as SUGGESTED (it's already LOCKED)
    const cableSuggested = suggested.find(it => it.name && it.name.includes('케이블카'));
    expect(cableSuggested).toBeUndefined();

    // LOCKED cable should still exist
    const cableLocked = items.find(it => it.commerce_code === 'cable' && it.selection_status === 'LOCKED');
    expect(cableLocked).toBeDefined();
  });

  // 10. GUEST_COUNT_PRESERVED — party.count matches input guest_count
  test('party.count matches input guest_count', () => {
    const s = buildSkeleton(BASE);
    expect(s.party.count).toBe(2);
    expect(s.party.type).toBe('couple');
  });

  // Bonus: skeleton structure
  test('skeleton has two days with correct day numbers', () => {
    const s = buildSkeleton(BASE);
    expect(s.days).toHaveLength(2);
    expect(s.days[0].day).toBe(1);
    expect(s.days[1].day).toBe(2);
  });

  // Bonus: stay_type
  test('stay_type is 1n2d', () => {
    const s = buildSkeleton(BASE);
    expect(s.stay_type).toBe('1n2d');
  });

  // Bonus: no hotel → no checkout marker
  test('no hotel_code → no checkout marker in Day 2', () => {
    const s = buildSkeleton({ ...BASE, hotel_code: null });
    const day2 = s.days[1].items;
    const checkout = day2.find(it => it.name && it.name.includes('체크아웃'));
    expect(checkout).toBeUndefined();
  });
});
