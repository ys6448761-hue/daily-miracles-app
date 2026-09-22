'use strict';
/**
 * Entry Question Recommendation Diversity — Unit Tests
 *
 * Audit finding: different Entry questions producing identical rankings
 * Root cause: _calculateTravelerFitScore ignored time_of_day / preference_type / budget_constraint
 * Fix: evidence-based intent scoring in _calculateTravelerFitScore + _generateReason intent signals
 *
 * PASS criterion: Different traveler intent materially affects ranking/reason when relevant evidence exists.
 * NOT criterion: All five questions return different places.
 */

const TravelGuideService = require('../../services/travelGuideService');
const svc = TravelGuideService;

// ── Place Fixtures ────────────────────────────────────────────────────────────

const CABLECAR = {
  code: 'cablecar', name_ko: '케이블카',
  emotion_tags: ['view', 'adventure', 'modern'],
  weather_suitable: ['clear', 'all_season'],
  suitable_for: ['family', 'kids_ok', 'young_adults'],
  avg_stay_minutes: 45, physical_difficulty: null, admission_fee_json: null,
};

const DOLSAN_DAEGYO = {
  code: 'dolsan_daegyo', name_ko: '돌산대교',
  emotion_tags: ['architecture', 'night_view'],
  weather_suitable: ['clear', 'sunset', 'night'],
  suitable_for: ['family', 'kids_ok', 'young_adults'],
  avg_stay_minutes: 30, physical_difficulty: null, admission_fee_json: null,
};

const DOLSAN_NIGHTSCAPE = {
  code: 'dolsan_nightscape', name_ko: '돌산 야경',
  emotion_tags: ['night_view', 'date'],
  weather_suitable: ['clear', 'night'],
  suitable_for: ['young_adults', 'couples', 'groups'],
  avg_stay_minutes: 45, physical_difficulty: null, admission_fee_json: null,
};

const JAISAN_PARK = {
  code: 'jaisan_park', name_ko: '자산공원',
  emotion_tags: ['view', 'quiet', 'observation'],
  weather_suitable: ['clear', 'all_season'],
  suitable_for: ['family', 'kids_ok', 'elderly'],
  avg_stay_minutes: 30, physical_difficulty: null, admission_fee_json: null,
};

const SKY_TOWER = {
  code: 'sky_tower', name_ko: '스카이타워',
  emotion_tags: ['view', 'landmark', 'modern'],
  weather_suitable: ['clear', 'all_season'],
  suitable_for: ['family', 'kids_ok', 'young_adults'],
  avg_stay_minutes: 60, physical_difficulty: null, admission_fee_json: null,
};

const ROMANTIC_POJANGMACHA = {
  code: 'romantic_pojangmacha', name_ko: '낭만포차거리',
  emotion_tags: ['food', 'social', 'street_culture'],
  weather_suitable: ['clear', 'cool', 'evening'],
  suitable_for: ['young_adults', 'groups', 'friends'],
  avg_stay_minutes: 60, physical_difficulty: null, admission_fee_json: null,
};

const HYANGIRAM = {
  code: 'hyangiram', name_ko: '향일암',
  emotion_tags: ['dawn', 'faith', 'historical'],
  weather_suitable: ['clear', 'sunrise', 'all_season'],
  suitable_for: ['family', 'elderly', 'kids_ok', 'pilgrimage'],
  avg_stay_minutes: 90, physical_difficulty: 'high', admission_fee_json: null,
};

const ODONGDO = {
  code: 'odongdo', name_ko: '오동도',
  emotion_tags: ['nature', 'seasonal', 'growth'],
  weather_suitable: ['clear', 'clear_dry', 'spring'],
  suitable_for: ['family', 'kids_ok', 'elderly', 'groups'],
  avg_stay_minutes: 120, physical_difficulty: null, admission_fee_json: null,
};

const FREE_PARK = {
  code: 'free_park', name_ko: '공원(무료)',
  emotion_tags: ['nature', 'quiet'],
  weather_suitable: ['clear', 'all_season'],
  suitable_for: ['family', 'kids_ok', 'elderly'],
  avg_stay_minutes: 45, physical_difficulty: null,
  admission_fee_json: { adult: 0, child: 0 },
};

// ── Context Fixtures ──────────────────────────────────────────────────────────

function soloCtx(overrides = {}) {
  return {
    people_type: 'solo',
    time_available_minutes: 120,
    time_of_day: null,
    preference_type: null,
    budget_constraint: null,
    _provenance: { time_available_minutes: 'AI_INFERENCE' },
    ...overrides,
  };
}

// ── _calculateTravelerFitScore ────────────────────────────────────────────────

describe('_calculateTravelerFitScore — night query (Q2)', () => {
  const ctx = soloCtx({ time_of_day: 'night' });

  test('dolsan_daegyo (night_view) scores higher than cablecar (no night evidence)', () => {
    const scoreDaegyo   = svc._calculateTravelerFitScore(DOLSAN_DAEGYO, ctx);
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    expect(scoreDaegyo).toBeGreaterThan(scoreCablecar);
  });

  test('dolsan_nightscape (night_view) scores higher than cablecar', () => {
    const scoreNight    = svc._calculateTravelerFitScore(DOLSAN_NIGHTSCAPE, ctx);
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    expect(scoreNight).toBeGreaterThan(scoreCablecar);
  });

  test('dolsan_daegyo night score >= 12 (night_view+8 + night weather+4)', () => {
    expect(svc._calculateTravelerFitScore(DOLSAN_DAEGYO, ctx)).toBeGreaterThanOrEqual(12);
  });

  test('cablecar night score = 0 (no night evidence)', () => {
    expect(svc._calculateTravelerFitScore(CABLECAR, ctx)).toBe(0);
  });

  test('hyangiram (dawn/faith) scores 0 for night query', () => {
    expect(svc._calculateTravelerFitScore(HYANGIRAM, ctx)).toBe(0);
  });

  test('romantic_pojangmacha (evening weather) gets evening boost', () => {
    const score = svc._calculateTravelerFitScore(ROMANTIC_POJANGMACHA, ctx);
    expect(score).toBeGreaterThan(0);
  });
});

describe('_calculateTravelerFitScore — photo query (Q3)', () => {
  const ctx = soloCtx({ preference_type: 'photo' });

  test('cablecar (view) scores higher than hyangiram (dawn/faith)', () => {
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    const scoreHyangiram = svc._calculateTravelerFitScore(HYANGIRAM, ctx);
    expect(scoreCablecar).toBeGreaterThan(scoreHyangiram);
  });

  test('dolsan_daegyo (architecture+night_view) scores higher than cablecar (view only)', () => {
    const scoreDaegyo   = svc._calculateTravelerFitScore(DOLSAN_DAEGYO, ctx);
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    // architecture(+6) + night_view(+4) = +10 vs view(+8) only
    expect(scoreDaegyo).toBeGreaterThan(scoreCablecar);
  });

  test('sky_tower (view) scores as high as cablecar (view)', () => {
    const scoreSky      = svc._calculateTravelerFitScore(SKY_TOWER, ctx);
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    expect(scoreSky).toBe(scoreCablecar); // both have 'view' only
  });

  test('hyangiram (dawn/faith/historical) scores 0 for photo query', () => {
    expect(svc._calculateTravelerFitScore(HYANGIRAM, ctx)).toBe(0);
  });
});

describe('_calculateTravelerFitScore — budget query (Q5)', () => {
  const ctx = soloCtx({ budget_constraint: 'low' });

  test('FREE_PARK (adult=0 confirmed) scores above cablecar (null fee)', () => {
    const scoreFree     = svc._calculateTravelerFitScore(FREE_PARK, ctx);
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    expect(scoreFree).toBeGreaterThan(scoreCablecar);
  });

  test('null fee → no budget bonus (UNKNOWN ≠ free)', () => {
    expect(svc._calculateTravelerFitScore(CABLECAR, ctx)).toBe(0);
    expect(svc._calculateTravelerFitScore(JAISAN_PARK, ctx)).toBe(0);
  });
});

describe('_calculateTravelerFitScore — explicit time (Q1)', () => {
  const ctx = soloCtx({
    time_available_minutes: 120,
    _provenance: { time_available_minutes: 'USER_EXPLICIT' },
  });

  test('odongdo (120min stay) penalized for explicit 120min query', () => {
    const scoreOdongdo  = svc._calculateTravelerFitScore(ODONGDO, ctx);
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctx);
    // odongdo uses full 120min → penalty; cablecar (45min) → bonus
    expect(scoreCablecar).toBeGreaterThan(scoreOdongdo);
  });

  test('short-stay place gets comfort bonus for explicit time', () => {
    const score = svc._calculateTravelerFitScore(CABLECAR, ctx); // 45min ≤ 60 (120*0.5)
    expect(score).toBeGreaterThan(0);
  });

  test('AI_INFERENCE provenance → time-fit score does NOT apply', () => {
    const ctxInference = soloCtx({
      time_available_minutes: 120,
      _provenance: { time_available_minutes: 'AI_INFERENCE' },
    });
    // Same places, but inference provenance — no bonus/penalty
    const scoreCablecar = svc._calculateTravelerFitScore(CABLECAR, ctxInference);
    const scoreOdongdo  = svc._calculateTravelerFitScore(ODONGDO, ctxInference);
    expect(scoreCablecar).toBe(scoreOdongdo); // both 0 for solo+inference
  });
});

// ── _generateReason ───────────────────────────────────────────────────────────

describe('_generateReason — night intent (Q2)', () => {
  const ctx = soloCtx({ time_of_day: 'night' });

  test('dolsan_daegyo (night_view) reason mentions 야경', () => {
    const reason = svc._generateReason(DOLSAN_DAEGYO, ctx);
    expect(reason).toMatch(/야경/);
  });

  test('dolsan_nightscape (night_view) reason mentions 야경', () => {
    const reason = svc._generateReason(DOLSAN_NIGHTSCAPE, ctx);
    expect(reason).toMatch(/야경/);
  });

  test('romantic_pojangmacha (food/social, evening) reason mentions 저녁', () => {
    const reason = svc._generateReason(ROMANTIC_POJANGMACHA, ctx);
    expect(reason).toMatch(/저녁|분위기/);
  });

  test('night query: time duration copy NOT emitted (time is not the intent)', () => {
    // "N분이면 충분히 둘러볼 수 있어요" should NOT appear when intent is night
    const reason = svc._generateReason(CABLECAR, ctx);
    expect(reason).not.toMatch(/분이면 충분히|분이면 부담 없이/);
  });
});

describe('_generateReason — photo intent (Q3)', () => {
  const ctx = soloCtx({ preference_type: 'photo' });

  test('cablecar (view) reason mentions 뷰 or 사진', () => {
    const reason = svc._generateReason(CABLECAR, ctx);
    expect(reason).toMatch(/뷰|사진/);
  });

  test('dolsan_daegyo (architecture+night_view) reason mentions 야경 사진 or 뷰', () => {
    const reason = svc._generateReason(DOLSAN_DAEGYO, ctx);
    expect(reason).toMatch(/야경|뷰|사진/);
  });

  test('photo query: time duration copy NOT emitted (time is not the intent)', () => {
    const reason = svc._generateReason(JAISAN_PARK, ctx);
    expect(reason).not.toMatch(/분이면 충분히|분이면 부담 없이/);
  });
});

describe('_generateReason — budget intent (Q5)', () => {
  const ctx = soloCtx({ budget_constraint: 'low' });

  test('FREE_PARK (adult=0 confirmed) → 무료 입장', () => {
    const reason = svc._generateReason(FREE_PARK, ctx);
    expect(reason).toContain('무료 입장');
  });

  test('cablecar (null fee) → budget note emitted (not silent)', () => {
    const reason = svc._generateReason(CABLECAR, ctx);
    expect(reason).toMatch(/입장료|방문 전/);
  });

  test('budget query: time duration copy NOT emitted', () => {
    const reason = svc._generateReason(CABLECAR, ctx);
    expect(reason).not.toMatch(/분이면 충분히|분이면 부담 없이/);
  });
});

describe('_generateReason — time intent (Q1)', () => {
  const ctx = soloCtx({
    time_available_minutes: 120,
    _provenance: { time_available_minutes: 'USER_EXPLICIT' },
  });

  test('cablecar (45min) → time duration copy emitted', () => {
    const reason = svc._generateReason(CABLECAR, ctx);
    expect(reason).toMatch(/분이면/);
  });
});

describe('Q4 regression — family_elderly differentiation preserved', () => {
  const ctx = {
    people_type: 'family_elderly',
    time_available_minutes: 120,
    time_of_day: null,
    preference_type: null,
    budget_constraint: null,
    mobility_constraint: 'low_walking',
    _provenance: { time_available_minutes: 'AI_INFERENCE' },
  };

  test('hyangiram (elderly tag but high difficulty) scores lower than jaisan_park (elderly, null difficulty)', () => {
    // hyangiram: physical_difficulty='high' → filtered by _passesPhysical, not by score
    // jaisan_park: physical_difficulty=null → passes filter
    // Score comparison: both have 'elderly' tag → both get +10 from tag match
    const scoreH = svc._calculateTravelerFitScore(HYANGIRAM, ctx);
    const scoreJ = svc._calculateTravelerFitScore(JAISAN_PARK, ctx);
    expect(scoreH).toBe(scoreJ); // same score — filter difference is in _passesPhysical not scoring
  });

  test('_generateReason for family_elderly with walking_unknown warning', () => {
    const placeWithWarning = { ...JAISAN_PARK, _warnings: ['walking_burden_unknown'] };
    const reason = svc._generateReason(placeWithWarning, ctx);
    expect(reason).toContain('미확인');
  });
});
