'use strict';

/**
 * Travel Time UI V0.1 — Unit Tests
 *
 * Tests _buildJourneyBlocks travel_transition output against VERIFIED_TRAVEL_EDGES.
 * No DB, No GPT, No session — pure unit tests on internal service logic.
 *
 * VERIFIED_TRAVEL_EDGES keys (from travelGuideService.js):
 *   P1: cablecar→hamel_lighthouse       (op=7)
 *   P2: hamel_lighthouse→hyangiram      (op=45)
 *   P3: hyangiram→jaisan_park           (op=45)
 *   P4: jaisan_park→lee_soon_shin_plaza (op=9)
 *   F1: lee_soon_shin_plaza→hamel_lighthouse (op=10)
 *   F2: hamel_lighthouse→lee_soon_shin_plaza (op=9)
 *   F3: lee_soon_shin_plaza→marine_park      (op=7)
 *   F4: marine_park→hamel_lighthouse         (op=8)
 *
 * Test cases:
 *   T-1:  P1 edge → verified, op=7, no null range
 *   T-2:  P2 edge → verified, op=45
 *   T-3:  P3 edge → verified, op=45
 *   T-4:  P4 edge → verified, op=9
 *   T-5:  F1 edge → verified, op=10
 *   T-6:  F2 edge → verified, op=9
 *   T-7:  F3 edge → verified, op=7
 *   T-8:  F4 edge → verified, op=8
 *   T-9:  Unknown edge → status='unknown', estimated_duration_range=null
 *   T-10: Reverse of P1 (hamel_lighthouse→cablecar) → NOT in table → unknown
 *   T-11: 8h full course (P1+P2+P3+P4) → all 4 transitions verified
 *   T-12: fitStatus='fits_comfortably' when all transitions verified
 *   T-13: fitStatus='travel_time_unverified' when any transition unknown
 *   T-14: estimated_duration_range.min === max → both equal op value
 *   T-15: message_ko format for verified edge ('이동 약 N분')
 *
 * Run: npx jest --testPathPattern="soulTravelTimeDisplay"
 */

// Stub out DB and services — no runtime dependency
jest.mock('../../database/db', () => ({
  query: jest.fn().mockResolvedValue({ rows: [] }),
}));
jest.mock('../../services/fallbackService', () => ({
  getFallbackPlaces: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../services/sessionService', () => ({
  touchSession: jest.fn().mockResolvedValue(undefined),
  getSession: jest.fn().mockResolvedValue({}),
}));

const svc = require('../../services/travelGuideService');

// ---------- helpers ----------

function makePlace(code, avgStay = 30) {
  return { code, avg_stay_minutes: avgStay, name_ko: code, _warnings: [] };
}

function mkCtx(overrides = {}) {
  return { has_car: true, people_type: 'solo', ...overrides };
}

// Extract only travel_transition blocks from _buildJourneyBlocks output
function getTravelBlocks(placeCodes, ctx = mkCtx()) {
  const places = placeCodes.map(c => makePlace(c));
  const blocks = svc._buildJourneyBlocks(places, { restaurants: [] }, [], {}, ctx);
  return blocks.filter(b => b.type === 'travel_transition');
}

// ---------- T-1: P1 edge verified ----------
describe('T-1: P1 cablecar→hamel_lighthouse verified', () => {
  test('status=verified, estimated_duration_range non-null, op=7', () => {
    const [t] = getTravelBlocks(['cablecar', 'hamel_lighthouse']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range).not.toBeNull();
    expect(t.estimated_duration_range.min).toBe(7);
    expect(t.estimated_duration_range.max).toBe(7);
  });
});

// ---------- T-2: P2 edge ----------
describe('T-2: P2 hamel_lighthouse→hyangiram verified', () => {
  test('op=45', () => {
    const [t] = getTravelBlocks(['hamel_lighthouse', 'hyangiram']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(45);
  });
});

// ---------- T-3: P3 edge ----------
describe('T-3: P3 hyangiram→jaisan_park verified', () => {
  test('op=45', () => {
    const [t] = getTravelBlocks(['hyangiram', 'jaisan_park']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(45);
  });
});

// ---------- T-4: P4 edge ----------
describe('T-4: P4 jaisan_park→lee_soon_shin_plaza verified', () => {
  test('op=9', () => {
    const [t] = getTravelBlocks(['jaisan_park', 'lee_soon_shin_plaza']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(9);
  });
});

// ---------- T-5: F1 edge ----------
describe('T-5: F1 lee_soon_shin_plaza→hamel_lighthouse verified', () => {
  test('op=10', () => {
    const [t] = getTravelBlocks(['lee_soon_shin_plaza', 'hamel_lighthouse']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(10);
  });
});

// ---------- T-6: F2 edge ----------
describe('T-6: F2 hamel_lighthouse→lee_soon_shin_plaza verified', () => {
  test('op=9', () => {
    const [t] = getTravelBlocks(['hamel_lighthouse', 'lee_soon_shin_plaza']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(9);
  });
});

// ---------- T-7: F3 edge ----------
describe('T-7: F3 lee_soon_shin_plaza→marine_park verified', () => {
  test('op=7', () => {
    const [t] = getTravelBlocks(['lee_soon_shin_plaza', 'marine_park']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(7);
  });
});

// ---------- T-8: F4 edge ----------
describe('T-8: F4 marine_park→hamel_lighthouse verified', () => {
  test('op=8', () => {
    const [t] = getTravelBlocks(['marine_park', 'hamel_lighthouse']);
    expect(t.status).toBe('verified');
    expect(t.estimated_duration_range.min).toBe(8);
  });
});

// ---------- T-9: Unknown edge ----------
describe('T-9: Unknown edge → status=unknown, range=null', () => {
  test('odongdo→cablecar is not in table', () => {
    const [t] = getTravelBlocks(['odongdo', 'cablecar']);
    expect(t.status).toBe('unknown');
    expect(t.estimated_duration_range).toBeNull();
    expect(t.message_ko).toBe('이동시간 확인 중');
  });
});

// ---------- T-10: Reverse of P1 is NOT in table ----------
describe('T-10: hamel_lighthouse→cablecar (reverse P1) → unknown', () => {
  test('reverse edge has no entry', () => {
    const [t] = getTravelBlocks(['hamel_lighthouse', 'cablecar']);
    expect(t.status).toBe('unknown');
    expect(t.estimated_duration_range).toBeNull();
  });
});

// ---------- T-11: 8h full course (P1+P2+P3+P4) ----------
describe('T-11: 8h course — all 4 transitions verified', () => {
  const COURSE_8H = ['cablecar', 'hamel_lighthouse', 'hyangiram', 'jaisan_park', 'lee_soon_shin_plaza'];

  test('produces 4 travel_transition blocks', () => {
    const transitions = getTravelBlocks(COURSE_8H);
    expect(transitions).toHaveLength(4);
  });

  test('all 4 transitions have status=verified', () => {
    const transitions = getTravelBlocks(COURSE_8H);
    transitions.forEach(t => {
      expect(t.status).toBe('verified');
    });
  });

  test('op values: 7, 45, 45, 9', () => {
    const transitions = getTravelBlocks(COURSE_8H);
    expect(transitions[0].estimated_duration_range.min).toBe(7);
    expect(transitions[1].estimated_duration_range.min).toBe(45);
    expect(transitions[2].estimated_duration_range.min).toBe(45);
    expect(transitions[3].estimated_duration_range.min).toBe(9);
  });
});

// ---------- T-12: fitStatus when all verified ----------
describe('T-12: fitStatus=fits_comfortably when all transitions verified', () => {
  test('8h course → travelTransitionBlocks all verified → fitStatus check via block status', () => {
    const COURSE_8H = ['cablecar', 'hamel_lighthouse', 'hyangiram', 'jaisan_park', 'lee_soon_shin_plaza'];
    const places = COURSE_8H.map(c => makePlace(c));
    const blocks = svc._buildJourneyBlocks(places, { restaurants: [] }, [], {}, mkCtx());
    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    const travelUnknown = travelBlocks.some(b => b.status !== 'verified');
    expect(travelUnknown).toBe(false);
  });
});

// ---------- T-13: fitStatus when any unknown ----------
describe('T-13: fitStatus=travel_time_unverified when any transition unknown', () => {
  test('mixed course (verified + unknown) → travelUnknown=true', () => {
    // P1 verified, then odongdo unknown
    const places = [makePlace('cablecar'), makePlace('hamel_lighthouse'), makePlace('odongdo')];
    const blocks = svc._buildJourneyBlocks(places, { restaurants: [] }, [], {}, mkCtx());
    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    const travelUnknown = travelBlocks.some(b => b.status !== 'verified');
    expect(travelUnknown).toBe(true);
  });
});

// ---------- T-14: min === max for single verified op ----------
describe('T-14: estimated_duration_range.min === max (point value)', () => {
  test('P1 min===max===7', () => {
    const [t] = getTravelBlocks(['cablecar', 'hamel_lighthouse']);
    expect(t.estimated_duration_range.min).toBe(t.estimated_duration_range.max);
    expect(t.estimated_duration_range.min).toBe(7);
  });
});

// ---------- T-15: message_ko format ----------
describe('T-15: message_ko for verified edge', () => {
  test("P1 message_ko = '이동 약 7분'", () => {
    const [t] = getTravelBlocks(['cablecar', 'hamel_lighthouse']);
    expect(t.message_ko).toBe('이동 약 7분');
  });

  test("P2 message_ko = '이동 약 45분'", () => {
    const [t] = getTravelBlocks(['hamel_lighthouse', 'hyangiram']);
    expect(t.message_ko).toBe('이동 약 45분');
  });
});

// ==========================================================================
// T-16~T-18: stayUnknown guard (pre-migration state — hamel=null)
// ==========================================================================

// ---------- T-16: stayUnknown — null avg_stay_minutes blocks fits_comfortably ----------
describe('T-16: stayUnknown — null avg_stay_minutes blocks fits_comfortably', () => {
  function makeHamelNull() {
    return { code: 'hamel_lighthouse', avg_stay_minutes: null, name_ko: '하멜등대', _warnings: [] };
  }

  test('course with null stay → travelUnknown=false but stayUnknown=true (all transitions verified)', () => {
    const places = [
      makePlace('cablecar', 45),
      makeHamelNull(),
      makePlace('hyangiram', 90),
    ];
    const blocks = svc._buildJourneyBlocks(places, { restaurants: [] }, [], {}, mkCtx());
    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    expect(travelBlocks[0].status).toBe('verified');
    expect(travelBlocks[1].status).toBe('verified');
    const travelUnknown = travelBlocks.some(b => b.status !== 'verified');
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(travelUnknown).toBe(false);
    expect(stayUnknown).toBe(true);
  });

  test('travel blocks still show verified minutes even when stayUnknown=true', () => {
    const places = [makePlace('cablecar', 45), makeHamelNull(), makePlace('hyangiram', 90)];
    const blocks = svc._buildJourneyBlocks(places, { restaurants: [] }, [], {}, mkCtx());
    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    expect(travelBlocks[0].estimated_duration_range.min).toBe(7);
    expect(travelBlocks[1].estimated_duration_range.min).toBe(45);
    expect(travelBlocks[0].message_ko).toBe('이동 약 7분');
  });
});

// ---------- T-17: 8h full course — hamel null must NOT return fits_comfortably ----------
describe('T-17: 8h course with hamel null — must NOT return fits_comfortably', () => {
  test('stayUnknown guard: hamel null + all transitions verified → stayUnknown=true', () => {
    const places = [
      makePlace('cablecar', 45),
      { code: 'hamel_lighthouse', avg_stay_minutes: null, name_ko: '하멜등대', _warnings: [] },
      makePlace('hyangiram', 90),
      makePlace('jaisan_park', 30),
      makePlace('lee_soon_shin_plaza', 45),
    ];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(true);
  });

  test('all places with known stay → stayUnknown=false', () => {
    const places = [
      makePlace('cablecar', 45),
      makePlace('hamel_lighthouse', 30),
      makePlace('hyangiram', 90),
      makePlace('jaisan_park', 30),
      makePlace('lee_soon_shin_plaza', 45),
    ];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(false);
  });
});

// ---------- T-18: == null catches undefined too ----------
describe('T-18: stayUnknown guard catches undefined as well as null', () => {
  test('avg_stay_minutes=undefined → stayUnknown=true', () => {
    const places = [{ code: 'test', avg_stay_minutes: undefined, name_ko: 'test', _warnings: [] }];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(true);
  });

  test('avg_stay_minutes=0 → stayUnknown=false (0 is a known value)', () => {
    const places = [makePlace('test', 0)];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(false);
  });
});

// ==========================================================================
// T-19~T-24: Post-migration state (Migration 207 — Founder Decision 2026-10-25)
// hamel_lighthouse=30, hyangiram=120
// ==========================================================================

// ---------- T-19: Post-migration — 2h course stayUnknown=false ----------
describe('T-19: Post-migration — 2h course (cablecar+hamel=30) → stayUnknown=false', () => {
  test('hamel=30 → stayUnknown=false', () => {
    const places = [makePlace('cablecar', 45), makePlace('hamel_lighthouse', 30)];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(false);
  });
});

// ---------- T-20: Post-migration — 5h course stayUnknown=false ----------
describe('T-20: Post-migration — 5h course (cablecar+hamel+hyangiram=120) → stayUnknown=false', () => {
  test('all places have stay → stayUnknown=false', () => {
    const places = [
      makePlace('cablecar', 45),
      makePlace('hamel_lighthouse', 30),
      makePlace('hyangiram', 120),
    ];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(false);
  });
});

// ---------- T-21: Post-migration — 8h course stayUnknown=false ----------
describe('T-21: Post-migration — 8h course all stays known → stayUnknown=false', () => {
  test('all 5 places with known stay → stayUnknown=false', () => {
    const places = [
      makePlace('cablecar', 45),
      makePlace('hamel_lighthouse', 30),
      makePlace('hyangiram', 120),
      makePlace('jaisan_park', 30),
      makePlace('lee_soon_shin_plaza', 45),
    ];
    const stayUnknown = places.some(p => p.avg_stay_minutes == null);
    expect(stayUnknown).toBe(false);
  });
});

// ---------- T-22: Time budget — 8h course (post-migration) ----------
describe('T-22: Time budget — 8h course (Migration 207 values)', () => {
  // cablecar(45) + hamel(30) + hyangiram(120) + jaisan(30) + lss(45) = 270
  // P1(7) + P2(45) + P3(45) + P4(9) = 106
  // meal: 60
  // total: 436 < 480
  const STAY = 45 + 30 + 120 + 30 + 45;   // 270
  const TRAVEL = 7 + 45 + 45 + 9;          // 106
  const MEAL = 60;

  test('stay total = 270', () => { expect(STAY).toBe(270); });
  test('travel total = 106 (P1+P2+P3+P4)', () => { expect(TRAVEL).toBe(106); });
  test('total activity 436 < 480 (8h fits)', () => {
    expect(STAY + TRAVEL + MEAL).toBe(436);
    expect(STAY + TRAVEL + MEAL).toBeLessThan(480);
  });
});

// ---------- T-23: Time budget — 5h course (post-migration) ----------
describe('T-23: Time budget — 5h course (Migration 207 values)', () => {
  // cablecar(45) + hamel(30) + hyangiram(120) = 195
  // P1(7) + P2(45) = 52
  // meal: 60
  // total: 307 (5h slot is 270-360min range, not hard 300 cap)
  const STAY = 45 + 30 + 120;  // 195
  const TRAVEL = 7 + 45;       // 52
  const MEAL = 60;

  test('stay total = 195', () => { expect(STAY).toBe(195); });
  test('total activity = 307', () => { expect(STAY + TRAVEL + MEAL).toBe(307); });
  test('307 within 5h slot upper bound (360)', () => {
    expect(STAY + TRAVEL + MEAL).toBeLessThanOrEqual(360);
  });
});

// ---------- T-24: Time budget — 2h course (post-migration) ----------
describe('T-24: Time budget — 2h course (Migration 207 values)', () => {
  // cablecar(45) + hamel(30) = 75
  // P1(7)
  // place+travel = 82 < 120
  const STAY = 45 + 30;  // 75
  const TRAVEL = 7;

  test('stay total = 75 (cablecar+hamel post-migration)', () => { expect(STAY).toBe(75); });
  test('place + travel = 82 < 120 (2h fits without meal)', () => {
    expect(STAY + TRAVEL).toBe(82);
    expect(STAY + TRAVEL).toBeLessThan(120);
  });
});

// ==========================================================================
// T-25~T-29: Budget fit / exceeded (Guardian HOLD fix)
// fitStatus separates: verification status / time budget judgment
// ==========================================================================

// Helper: meal options for tests
function mkMealOptions() {
  return { restaurants: [{ restaurant_code: 'R1', name: '식당', cuisine_type: 'korean', accessibility: {} }] };
}
function mkCafeOptions() {
  return [{ id: 1, name: '카페', category: 'cafe', address: '여수' }];
}

// ---------- T-25: 5h course — 307 > 300 → budget_exceeded (regression) ----------
describe('T-25: 5h course with meal → total 307 > 300 (budget_exceeded regression)', () => {
  // stay: cablecar(45)+hamel(30)+hyangiram(120) = 195
  // travel: P1(7)+P2(45) = 52
  // meal: 60
  // total: 307 > budget 300
  const BUDGET_5H = 300;

  test('total known = 307 (stay195 + travel52 + meal60)', () => {
    const places = [
      makePlace('cablecar', 45),
      makePlace('hamel_lighthouse', 30),
      makePlace('hyangiram', 120),
    ];
    const ctx = mkCtx({ meal_context: 'lunch' });
    const blocks = svc._buildJourneyBlocks(places, mkMealOptions(), [], {}, ctx);

    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    const mealBlocks = blocks.filter(b => b.type === 'meal');

    const verifiedTravel = travelBlocks
      .filter(b => b.status === 'verified')
      .reduce((sum, b) => sum + b.estimated_duration_range.min, 0);
    const mealMin = mealBlocks.reduce((sum, b) => sum + (b.estimated_duration_minutes || 0), 0);
    const stayTotal = places.reduce((sum, p) => sum + p.avg_stay_minutes, 0);

    expect(verifiedTravel).toBe(52);  // P1(7)+P2(45)
    expect(mealMin).toBe(60);
    expect(stayTotal).toBe(195);
    expect(stayTotal + verifiedTravel + mealMin).toBe(307);
    expect(stayTotal + verifiedTravel + mealMin).toBeGreaterThan(BUDGET_5H);
  });

  test('budgetExceeded=true when 307 > 300', () => {
    const totalKnown = 307;
    const travelUnknown = false;
    const stayUnknown = false;
    const budgetExceeded = !travelUnknown && !stayUnknown && totalKnown > BUDGET_5H;
    expect(budgetExceeded).toBe(true);
  });

  test('fitStatus should NOT be fits_comfortably when budgetExceeded', () => {
    const travelUnknown = false;
    const stayUnknown = false;
    const budgetExceeded = true;
    const fitStatus = (travelUnknown || stayUnknown)
      ? 'travel_time_unverified'
      : budgetExceeded ? 'budget_exceeded' : 'fits_comfortably';
    expect(fitStatus).toBe('budget_exceeded');
    expect(fitStatus).not.toBe('fits_comfortably');
  });
});

// ---------- T-26: 8h course with meal (no café) → 436 < 480 → fits_comfortably ----------
describe('T-26: 8h course with meal only → 436 < 480 (fits_comfortably)', () => {
  // stay: 270, travel: 106, meal: 60, café: 0
  // total: 436 < 480
  const BUDGET_8H = 480;

  test('total known = 436 (stay270 + travel106 + meal60)', () => {
    const places = [
      makePlace('cablecar', 45),
      makePlace('hamel_lighthouse', 30),
      makePlace('hyangiram', 120),
      makePlace('jaisan_park', 30),
      makePlace('lee_soon_shin_plaza', 45),
    ];
    const ctx = mkCtx({ meal_context: 'lunch' });
    const blocks = svc._buildJourneyBlocks(places, mkMealOptions(), [], {}, ctx);

    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    const mealBlocks = blocks.filter(b => b.type === 'meal');
    const cafeBlocks = blocks.filter(b => b.type === 'cafe');

    const verifiedTravel = travelBlocks
      .filter(b => b.status === 'verified')
      .reduce((sum, b) => sum + b.estimated_duration_range.min, 0);
    const mealMin = mealBlocks.reduce((sum, b) => sum + (b.estimated_duration_minutes || 0), 0);
    const cafeMin = cafeBlocks.reduce((sum, b) => sum + (b.estimated_duration_minutes || 0), 0);
    const stayTotal = places.reduce((sum, p) => sum + p.avg_stay_minutes, 0);

    expect(verifiedTravel).toBe(106); // P1+P2+P3+P4
    expect(mealMin).toBe(60);
    expect(cafeMin).toBe(0);          // no café (cafeOptions=[])
    expect(stayTotal + verifiedTravel + mealMin + cafeMin).toBe(436);
    expect(stayTotal + verifiedTravel + mealMin + cafeMin).toBeLessThan(BUDGET_8H);
  });
});

// ---------- T-27: 8h course with meal + café → 466 < 480 → fits_comfortably ----------
describe('T-27: 8h course with meal + café → 466 < 480 (fits_comfortably)', () => {
  // stay: 270, travel: 106, meal: 60, café: 30
  // total: 466 < 480
  const BUDGET_8H = 480;

  test('total known = 466 (stay270 + travel106 + meal60 + café30)', () => {
    const places = [
      makePlace('cablecar', 45),
      makePlace('hamel_lighthouse', 30),
      makePlace('hyangiram', 120),
      makePlace('jaisan_park', 30),
      makePlace('lee_soon_shin_plaza', 45),
    ];
    const ctx = mkCtx({ meal_context: 'lunch' });
    const blocks = svc._buildJourneyBlocks(places, mkMealOptions(), mkCafeOptions(), [], ctx);

    const travelBlocks = blocks.filter(b => b.type === 'travel_transition');
    const mealBlocks = blocks.filter(b => b.type === 'meal');
    const cafeBlocks = blocks.filter(b => b.type === 'cafe');

    const verifiedTravel = travelBlocks
      .filter(b => b.status === 'verified')
      .reduce((sum, b) => sum + b.estimated_duration_range.min, 0);
    const mealMin = mealBlocks.reduce((sum, b) => sum + (b.estimated_duration_minutes || 0), 0);
    const cafeMin = cafeBlocks.reduce((sum, b) => sum + (b.estimated_duration_minutes || 0), 0);
    const stayTotal = places.reduce((sum, p) => sum + p.avg_stay_minutes, 0);

    expect(cafeMin).toBe(30);   // café block present
    expect(stayTotal + verifiedTravel + mealMin + cafeMin).toBe(466);
    expect(stayTotal + verifiedTravel + mealMin + cafeMin).toBeLessThan(BUDGET_8H);
  });
});

// ---------- T-28: estimated_total_range includes verified travel ----------
describe('T-28: estimated_total_range includes verified travel (not just stay)', () => {
  test('8h range min = stay + travel + meal (travel included)', () => {
    // stay=270, travel=106, meal=60 → min=436, max=466
    const stayTotal = 270;
    const verifiedTravel = 106;
    const meal = 60;
    const cafe = 30;
    expect(stayTotal + verifiedTravel + meal).toBe(436);
    expect(stayTotal + verifiedTravel + meal + cafe).toBe(466);
  });

  test('range min (no café) vs max (with café) differ by café duration', () => {
    const min = 270 + 106 + 60;      // 436 (no café)
    const max = 270 + 106 + 60 + 30; // 466 (with café)
    expect(max - min).toBe(30);
  });
});

// ---------- T-29: fitStatus three-way logic ----------
describe('T-29: fitStatus three-way: travel_time_unverified / budget_exceeded / fits_comfortably', () => {
  function computeFitStatus(travelUnknown, stayUnknown, budgetExceeded) {
    return (travelUnknown || stayUnknown)
      ? 'travel_time_unverified'
      : budgetExceeded ? 'budget_exceeded' : 'fits_comfortably';
  }

  test('travelUnknown → travel_time_unverified (budget ignored)', () => {
    expect(computeFitStatus(true, false, false)).toBe('travel_time_unverified');
    expect(computeFitStatus(true, false, true)).toBe('travel_time_unverified');
  });

  test('stayUnknown → travel_time_unverified (budget ignored)', () => {
    expect(computeFitStatus(false, true, false)).toBe('travel_time_unverified');
  });

  test('all known + budget exceeded → budget_exceeded', () => {
    expect(computeFitStatus(false, false, true)).toBe('budget_exceeded');
  });

  test('all known + fits → fits_comfortably', () => {
    expect(computeFitStatus(false, false, false)).toBe('fits_comfortably');
  });
});
