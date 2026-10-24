'use strict';

/**
 * COURSE_PLANNING Full-Day Candidate Cap Fix — Unit Tests
 *
 * Tests the fix for _applyClusterDiversity hardcoded cap=3 bug.
 * These tests exercise travelGuideService internal methods directly —
 * NO DB, NO GPT, NO session dependency.
 *
 * Verifies:
 *   C-NEW-1: 8h explicit  → _diversityMax=5, candidates up to 5
 *   C-NEW-2: 5h explicit  → _diversityMax=3, candidates 3 (preserved)
 *   C-NEW-3: 2h explicit  → _diversityMax=2, candidates 2 (preserved)
 *   C-NEW-4: DOMAIN_FALLBACK time → _diversityMax=max(2,3)=3 (preserved)
 *   C-NEW-5: _diversityMax=1 edge → at least 1 candidate returned
 *   C-NEW-6: dolsan_area cluster — only 1 cluster rep regardless of maxCount
 *   C-NEW-7: fallback fill when diversity < maxCount
 *
 * Run: npx jest --testPathPattern="soulCoursePlanningFullDay"
 */

// Stub out db and services so travelGuideService can be imported without DB
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

// travelGuideService exports a singleton instance (not the class)
const svc = require('../../services/travelGuideService');

// ---------- helpers ----------

function makePlace(code, avgStay, cluster = null) {
  return { code, avg_stay_minutes: avgStay, _cluster: cluster };
}

// 13개 모의 후보 (production 장소 코드 기반, scoring 순서로 정렬됨)
const YEOSU_CANDIDATES = [
  makePlace('cablecar', 45),           // dolsan_area cluster
  makePlace('hamel_lighthouse', null), // no cluster
  makePlace('hyangiram', 90),          // no cluster
  makePlace('lee_soon_shin_plaza', 45),// no cluster
  makePlace('odongdo', 120),           // no cluster
  makePlace('marine_park', 75),        // no cluster
  makePlace('sky_tower', 60),          // no cluster
  makePlace('romantic_pojangmacha', 60),// no cluster
  makePlace('yeosu_expo_park', 120),   // no cluster
  makePlace('dolsan_daegyo', 30),      // dolsan_area cluster
  makePlace('dolsan_nightscape', 45),  // dolsan_area cluster
  makePlace('jaisan_park', 30),        // no cluster
];

// ---------- C-NEW-1: 8시간 → maxCount=5 ----------
describe('C-NEW-1: 8h explicit → _diversityMax=5', () => {
  test('_detectTimeSlot(480) returns full_day', () => {
    expect(svc._detectTimeSlot(480)).toBe('full_day');
  });

  test('_getTargetStopCount(full_day, 480) returns 5', () => {
    expect(svc._getTargetStopCount('full_day', 480)).toBe(5);
  });

  test('_applyClusterDiversity with maxCount=5 returns up to 5 candidates', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 5);
    expect(result.length).toBeGreaterThanOrEqual(4);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  test('8h result does NOT include both dolsan_daegyo and cablecar (cluster diversity)', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 5);
    const dolsanCodes = result.filter(p =>
      ['cablecar', 'dolsan_daegyo', 'dolsan_nightscape'].includes(p.code)
    );
    // Only 1 dolsan_area representative allowed
    expect(dolsanCodes.length).toBe(1);
  });

  test('8h result includes odongdo and lee_soon_shin_plaza (new candidates)', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 5);
    const codes = result.map(p => p.code);
    expect(codes).toContain('odongdo');
    expect(codes).toContain('lee_soon_shin_plaza');
  });
});

// ---------- C-NEW-2: 5시간 → maxCount=3 (preserved) ----------
describe('C-NEW-2: 5h explicit → _diversityMax=3 preserved', () => {
  test('_detectTimeSlot(300) returns custom', () => {
    expect(svc._detectTimeSlot(300)).toBe('custom');
  });

  test('_getTargetStopCount(custom, 300) returns 3', () => {
    expect(svc._getTargetStopCount('custom', 300)).toBe(3);
  });

  test('_applyClusterDiversity with maxCount=3 returns exactly 3 candidates', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 3);
    expect(result.length).toBe(3);
  });

  test('5h first 3 candidates match pre-fix behavior (cablecar, hamel, hyangiram)', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 3);
    expect(result[0].code).toBe('cablecar');
    expect(result[1].code).toBe('hamel_lighthouse');
    expect(result[2].code).toBe('hyangiram');
  });
});

// ---------- C-NEW-3: 2시간 → maxCount=2 (preserved) ----------
describe('C-NEW-3: 2h explicit → _diversityMax=2 preserved', () => {
  test('_detectTimeSlot(120) returns custom', () => {
    expect(svc._detectTimeSlot(120)).toBe('custom');
  });

  test('_getTargetStopCount(custom, 120) returns 2', () => {
    // ceil(120/120) = 1, max(2,1) = 2
    expect(svc._getTargetStopCount('custom', 120)).toBe(2);
  });

  test('_applyClusterDiversity with maxCount=2 returns exactly 2 candidates', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 2);
    expect(result.length).toBe(2);
  });

  test('2h candidates are cablecar and hamel (pre-fix behavior preserved)', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 2);
    expect(result[0].code).toBe('cablecar');
    expect(result[1].code).toBe('hamel_lighthouse');
  });
});

// ---------- C-NEW-4: DOMAIN_FALLBACK time → maxCount=max(2,3)=3 (preserved) ----------
describe('C-NEW-4: DOMAIN_FALLBACK time → _diversityMax=3 preserved', () => {
  test('DOMAIN_FALLBACK(time=120) → _previewRawTarget=2, _diversityMax=max(2,3)=3', () => {
    const timeMinutes = 120; // fallback default
    const _previewIsFallback = true;
    const _previewTimeSlot = svc._detectTimeSlot(timeMinutes);
    const _previewRawTarget = svc._getTargetStopCount(_previewTimeSlot, timeMinutes);
    const _diversityMax = _previewIsFallback
      ? Math.max(_previewRawTarget, 3)
      : _previewRawTarget;
    expect(_diversityMax).toBe(3);
  });

  test('_applyClusterDiversity with FALLBACK maxCount=3 returns 3 candidates', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 3);
    expect(result.length).toBe(3);
  });
});

// ---------- C-NEW-5: edge case maxCount=1 ----------
describe('C-NEW-5: edge case maxCount=1', () => {
  test('_applyClusterDiversity with maxCount=1 returns exactly 1 candidate', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 1);
    expect(result.length).toBe(1);
    expect(result[0].code).toBe('cablecar');
  });
});

// ---------- C-NEW-6: cluster diversity enforced even at maxCount=5 ----------
describe('C-NEW-6: dolsan_area cluster — max 1 rep at any maxCount', () => {
  test('maxCount=5 → exactly 1 dolsan_area place in result', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 5);
    const dolsanReps = result.filter(p =>
      ['cablecar', 'dolsan_daegyo', 'dolsan_nightscape'].includes(p.code)
    );
    expect(dolsanReps.length).toBe(1);
  });

  test('maxCount=10 → exactly 1 dolsan_area place in result', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES, 10);
    const dolsanReps = result.filter(p =>
      ['cablecar', 'dolsan_daegyo', 'dolsan_nightscape'].includes(p.code)
    );
    expect(dolsanReps.length).toBe(1);
  });
});

// ---------- C-NEW-7: fallback fill when diversity reduces below maxCount ----------
describe('C-NEW-7: fallback fill — _cluster_diversity_relaxed', () => {
  test('small candidate pool triggers fallback fill to maxCount', () => {
    // Only 2 candidates available, maxCount=3 → fallback must fill
    const small = [
      makePlace('cablecar', 45),
      makePlace('dolsan_daegyo', 30), // same dolsan_area cluster → diversity skip
    ];
    const result = svc._applyClusterDiversity(small, 3);
    // Only 2 available total, so result = 2 (can't exceed available)
    expect(result.length).toBe(2);
    expect(result._cluster_diversity_relaxed).toBe(true);
  });

  test('fallback does not exceed available candidates', () => {
    const four = YEOSU_CANDIDATES.slice(0, 4);
    const result = svc._applyClusterDiversity(four, 5);
    expect(result.length).toBeLessThanOrEqual(4);
  });
});

// ---------- stability: default maxCount=3 (backward compat) ----------
describe('Backward compatibility: default maxCount=3', () => {
  test('_applyClusterDiversity() with no maxCount arg returns 3 candidates', () => {
    const result = svc._applyClusterDiversity(YEOSU_CANDIDATES);
    expect(result.length).toBe(3);
  });
});
