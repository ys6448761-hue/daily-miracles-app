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
