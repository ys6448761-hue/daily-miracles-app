// ═══════════════════════════════════════════════════════════
// Diagnostic API v1 Gate Test — SSOT-locked
//
// Pure unit tests — no HTTP server, no external services.
// 7 Gates, ~50 TC
//
// Run: node tests/diagnostic/diagnostic-v1-gate.js
// ═══════════════════════════════════════════════════════════

'use strict';

// Reset store before tests
global._diagV1Store = new Map();

const assert = require('assert');

const {
  validateSubmit,
  computeScores,
  submitDiagnostic,
  getTodaySegment,
  buildContent,
  WEIGHT_MATRIX,
  NUM_QUESTIONS,
} = require('../../services/diagnosticV1Service');

const { getModeById, getAllModes } = require('../../config/modesLoader');
const { ValidationError } = require('../../utils/errors');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ❌ ${name}`);
    console.log(`     ${e.message}`);
  }
}

function testThrows(name, fn, ErrorClass) {
  try {
    fn();
    failed++;
    console.log(`  ❌ ${name} — expected throw, did not throw`);
  } catch (e) {
    if (ErrorClass && !(e instanceof ErrorClass)) {
      failed++;
      console.log(`  ❌ ${name} — expected ${ErrorClass.name}, got ${e.constructor.name}`);
    } else {
      passed++;
      console.log(`  ✅ ${name} (threw ${e.constructor.name})`);
    }
  }
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Diagnostic API v1 Gate Test');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ═══════════════════════════════════════════════
// Gate 1: Scoring — Pure Mode Signals
// ═══════════════════════════════════════════════
console.log('--- Gate 1: Scoring ---');

const EXPECTED_MODES = [
  'overload', 'burnout', 'avoidance', 'distraction',
  'anxiety', 'comparison', 'hypersensitive', 'stuck',
];

// Each pure signal: Q_i=2, rest=0 → mode_i wins
for (let i = 0; i < 8; i++) {
  const answers = new Array(8).fill(0);
  answers[i] = 2;
  const expected = EXPECTED_MODES[i];

  test(`Q${i}=2 → ${expected} wins`, () => {
    const r = computeScores(answers, null);
    assert.strictEqual(r.winner_mode_id, expected,
      `expected ${expected}, got ${r.winner_mode_id}`);
    assert.ok(r.winner_score > 0, 'winner_score should be > 0');
    assert.strictEqual(r.tie, false, 'no tie for pure signal');
    assert.strictEqual(r.tie_breaker, null);
  });
}

test('Q0=2 → overload score=4 (weight 2×2)', () => {
  const r = computeScores([2, 0, 0, 0, 0, 0, 0, 0], null);
  assert.strictEqual(r.mode_scores['overload'], 4);
  assert.strictEqual(r.winner_score, 4);
});

test('all zeros → stuck fallback', () => {
  const r = computeScores([0, 0, 0, 0, 0, 0, 0, 0], null);
  assert.strictEqual(r.winner_mode_id, 'stuck');
  assert.strictEqual(r.winner_score, 0);
  assert.strictEqual(r.tie, false);
  assert.strictEqual(r.tie_breaker, null);
});

test('all max → mode_scores populated for all 8', () => {
  const r = computeScores([2, 2, 2, 2, 2, 2, 2, 2], null);
  for (const id of EXPECTED_MODES) {
    assert.ok(r.mode_scores[id] >= 0, `${id} should have a score`);
  }
  assert.ok(r.winner_score > 0);
});

test('mixed signal → winner has highest score', () => {
  // Q1=2 (burnout primary=4) + Q6=2 (hypersensitive primary=4, burnout cross=2)
  // burnout total = 4 + 2 = 6
  // hypersensitive total = 0 + 4 = 4
  const r = computeScores([0, 2, 0, 0, 0, 0, 2, 0], null);
  assert.strictEqual(r.winner_mode_id, 'burnout');
  assert.strictEqual(r.mode_scores['burnout'], 6);
  assert.strictEqual(r.mode_scores['hypersensitive'], 4);
});

// ═══════════════════════════════════════════════
// Gate 2: Tie-breaking
// ═══════════════════════════════════════════════
console.log('\n--- Gate 2: Tie-breaking ---');

test('TC-S05: [2,0,0,2,...] et=30 → overload/distraction tie → et_fast → overload', () => {
  const r = computeScores([2, 0, 0, 2, 0, 0, 0, 0], 30);
  // Manual check: Q0=2 → overload+=4,burn+=2,distr+=2,stuck+=2
  //               Q3=2 → overload+=2,distr+=4
  // overload=6, distraction=6 → TIE
  assert.strictEqual(r.mode_scores['overload'], 6, 'overload should be 6');
  assert.strictEqual(r.mode_scores['distraction'], 6, 'distraction should be 6');
  assert.strictEqual(r.tie, true, 'should detect tie');
  assert.strictEqual(r.tie_breaker, 'et_fast', 'tie_breaker should be et_fast');
  assert.strictEqual(r.winner_mode_id, 'overload',
    'overload wins (lower registry index)');
  assert.strictEqual(r.winner_score, 6);
});

test('TC-S06: [2,0,0,2,...] et=null → tie → alphabetical → distraction', () => {
  const r = computeScores([2, 0, 0, 2, 0, 0, 0, 0], null);
  assert.strictEqual(r.mode_scores['overload'], 6);
  assert.strictEqual(r.mode_scores['distraction'], 6);
  assert.strictEqual(r.tie, true, 'should detect tie');
  assert.strictEqual(r.tie_breaker, 'alphabetical', 'tie_breaker should be alphabetical');
  assert.strictEqual(r.winner_mode_id, 'distraction',
    'distraction wins (d < o alphabetically)');
});

test('et=59 → still et_fast', () => {
  const r = computeScores([2, 0, 0, 2, 0, 0, 0, 0], 59);
  assert.strictEqual(r.tie_breaker, 'et_fast');
});

test('et=60 → alphabetical (threshold)', () => {
  const r = computeScores([2, 0, 0, 2, 0, 0, 0, 0], 60);
  assert.strictEqual(r.tie_breaker, 'alphabetical');
});

// ═══════════════════════════════════════════════
// Gate 3: Validation
// ═══════════════════════════════════════════════
console.log('\n--- Gate 3: Validation ---');

testThrows('missing user_key → ValidationError',
  () => validateSubmit({ user_key: '', answers: [0, 0, 0, 0, 0, 0, 0, 0] }),
  ValidationError);

testThrows('null user_key → ValidationError',
  () => validateSubmit({ user_key: null, answers: [0, 0, 0, 0, 0, 0, 0, 0] }),
  ValidationError);

testThrows('answers length 7 → ValidationError',
  () => validateSubmit({ user_key: 'u1', answers: [0, 0, 0, 0, 0, 0, 0] }),
  ValidationError);

testThrows('answers length 9 → ValidationError',
  () => validateSubmit({ user_key: 'u1', answers: [0, 0, 0, 0, 0, 0, 0, 0, 0] }),
  ValidationError);

testThrows('answer=3 → ValidationError',
  () => validateSubmit({ user_key: 'u1', answers: [0, 0, 0, 0, 0, 0, 0, 3] }),
  ValidationError);

testThrows('answer=-1 → ValidationError',
  () => validateSubmit({ user_key: 'u1', answers: [0, 0, 0, 0, 0, 0, 0, -1] }),
  ValidationError);

testThrows('null answers → ValidationError',
  () => validateSubmit({ user_key: 'u1', answers: null }),
  ValidationError);

test('valid input passes', () => {
  // Should not throw
  validateSubmit({ user_key: 'u1', answers: [0, 1, 2, 0, 1, 2, 0, 1] });
});

// ═══════════════════════════════════════════════
// Gate 4: Idempotency
// ═══════════════════════════════════════════════
console.log('\n--- Gate 4: Idempotency ---');

// Reset store
global._diagV1Store = new Map();

test('first submit → idempotent=false', () => {
  const r = submitDiagnostic({
    user_key: 'idem-user',
    date: '2026-02-18',
    answers: [2, 0, 0, 0, 0, 0, 0, 0],
    et: null,
  });
  assert.strictEqual(r.idempotent, false);
  assert.strictEqual(r.result.mode_id, 'overload');
  assert.strictEqual(r.result.user_key, 'idem-user');
  assert.strictEqual(r.result.date, '2026-02-18');
});

test('same user_key+date → idempotent=true, same result', () => {
  const r = submitDiagnostic({
    user_key: 'idem-user',
    date: '2026-02-18',
    answers: [2, 0, 0, 0, 0, 0, 0, 0],
    et: null,
  });
  assert.strictEqual(r.idempotent, true);
  assert.strictEqual(r.result.mode_id, 'overload');
});

test('different date → new entry (idempotent=false)', () => {
  const r = submitDiagnostic({
    user_key: 'idem-user',
    date: '2026-02-19',
    answers: [0, 2, 0, 0, 0, 0, 0, 0],
    et: null,
  });
  assert.strictEqual(r.idempotent, false);
  assert.strictEqual(r.result.mode_id, 'burnout');
});

// ═══════════════════════════════════════════════
// Gate 5: SSOT Content — No Hardcoded Strings
// ═══════════════════════════════════════════════
console.log('\n--- Gate 5: SSOT Content ---');

for (const mode of getAllModes()) {
  test(`${mode.mode_id}: content matches registry`, () => {
    const content = buildContent(mode);
    assert.strictEqual(content.label_kr, mode.label_kr);
    assert.strictEqual(content.tagline, mode.tagline);
    assert.ok(
      mode.recommended_action_templates.includes(content.recommended_action),
      'recommended_action should be from templates',
    );
    // Reference equality — same array object, not a copy
    assert.strictEqual(content.ad_hook_keywords, mode.ad_hook_keywords,
      'ad_hook_keywords should be SSOT reference');
    assert.strictEqual(content.marketing_archetypes, mode.marketing_archetypes,
      'marketing_archetypes should be SSOT reference');
  });
}

test('submitDiagnostic result.content matches SSOT', () => {
  global._diagV1Store = new Map();
  const r = submitDiagnostic({
    user_key: 'ssot-check',
    date: '2026-02-18',
    answers: [0, 0, 0, 0, 2, 0, 0, 0], // anxiety
    et: null,
  });
  const registry = getModeById('anxiety');
  assert.strictEqual(r.result.content.label_kr, registry.label_kr);
  assert.strictEqual(r.result.content.tagline, registry.tagline);
  assert.ok(registry.recommended_action_templates.includes(r.result.content.recommended_action));
});

// ═══════════════════════════════════════════════
// Gate 6: Weight Matrix Invariants
// ═══════════════════════════════════════════════
console.log('\n--- Gate 6: Matrix Invariants ---');

const modeCount = getAllModes().length;

test('matrix rows === NUM_QUESTIONS (8)', () => {
  assert.strictEqual(WEIGHT_MATRIX.length, NUM_QUESTIONS);
});

test('each row has modeCount columns', () => {
  for (let q = 0; q < NUM_QUESTIONS; q++) {
    assert.strictEqual(WEIGHT_MATRIX[q].length, modeCount,
      `row ${q}: expected ${modeCount} cols, got ${WEIGHT_MATRIX[q].length}`);
  }
});

test('all weights non-negative', () => {
  for (let q = 0; q < NUM_QUESTIONS; q++) {
    for (let m = 0; m < modeCount; m++) {
      assert.ok(WEIGHT_MATRIX[q][m] >= 0,
        `WEIGHT_MATRIX[${q}][${m}]=${WEIGHT_MATRIX[q][m]} is negative`);
    }
  }
});

test('every mode is reachable (column sum > 0)', () => {
  const modes = getAllModes();
  for (let m = 0; m < modeCount; m++) {
    const colSum = WEIGHT_MATRIX.reduce((s, row) => s + row[m], 0);
    assert.ok(colSum > 0,
      `mode ${modes[m].mode_id} is unreachable (colSum=0)`);
  }
});

// ═══════════════════════════════════════════════
// Gate 7: getTodaySegment
// ═══════════════════════════════════════════════
console.log('\n--- Gate 7: Segment ---');

// Reset and insert a today entry
global._diagV1Store = new Map();
const { getKSTDateString } = require('../../utils/kstDate');
const today = getKSTDateString();

submitDiagnostic({
  user_key: 'seg-user',
  date: today,
  answers: [0, 0, 0, 0, 2, 0, 0, 0], // anxiety
  et: null,
});

test('diagnosed user → segment found', () => {
  const seg = getTodaySegment({ user_key: 'seg-user' });
  assert.ok(seg !== null);
  assert.strictEqual(seg.mode_id, 'anxiety');
  assert.strictEqual(seg.date, today);
  assert.ok(typeof seg.label_kr === 'string' && seg.label_kr.length > 0);
  assert.ok(Array.isArray(seg.ad_hook_keywords));
  assert.ok(Array.isArray(seg.marketing_archetypes));
});

test('undiagnosed user → null', () => {
  const seg = getTodaySegment({ user_key: 'nobody' });
  assert.strictEqual(seg, null);
});

test('segment label_kr matches registry', () => {
  const seg = getTodaySegment({ user_key: 'seg-user' });
  const registry = getModeById('anxiety');
  assert.strictEqual(seg.label_kr, registry.label_kr);
  assert.deepStrictEqual(seg.ad_hook_keywords, registry.ad_hook_keywords);
  assert.deepStrictEqual(seg.marketing_archetypes, registry.marketing_archetypes);
});

// ═══════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🧪 Results: ${passed} passed, ${failed} failed (total ${passed + failed})`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(failed > 0 ? 1 : 0);
