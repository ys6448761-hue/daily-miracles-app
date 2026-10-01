'use strict';
/**
 * Traveler Profile Continuity V0.1 — Unit tests A–H
 *
 * Tests for three helper functions added to soyeowoolService.js:
 *   _extractExplicitTravelerFacts(soulContext)
 *   _mergeProfileFacts(currentFacts, stored)
 *   _applyPersistedTravelerProfile(soulContext, storedProfile)
 *
 * Invariants under test:
 *   - Only USER_EXPLICIT provenance values may be persisted
 *   - UNKNOWN / AI_INFERENCE provenance values must NOT overwrite stored explicit facts
 *   - Precedence: CURRENT USER_EXPLICIT > PERSISTED USER_EXPLICIT > CURRENT DEFAULT/UNKNOWN
 *   - Explicit false (has_car: false) is a valid storable value (not treated as absent)
 */

const { runInNewContext } = require('vm');
const fs = require('fs');
const path = require('path');

// ─── Extract helpers from source ──────────────────────────────────────────────

const svcSrc = fs.readFileSync(
  path.join(__dirname, '../../services/soyeowoolService.js'), 'utf8'
);

function extractFn(src, name) {
  const start = src.indexOf(`function ${name}(`);
  if (start === -1) throw new Error(`Function ${name} not found in source`);
  let depth = 0, i = start;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) break; }
    i++;
  }
  return src.slice(start, i + 1);
}

const sandbox = {};
runInNewContext(`
  ${extractFn(svcSrc, '_extractExplicitTravelerFacts')}
  ${extractFn(svcSrc, '_mergeProfileFacts')}
  ${extractFn(svcSrc, '_applyPersistedTravelerProfile')}
  extractExplicitTravelerFacts = _extractExplicitTravelerFacts;
  mergeProfileFacts            = _mergeProfileFacts;
  applyPersistedTravelerProfile = _applyPersistedTravelerProfile;
`, sandbox);

const {
  extractExplicitTravelerFacts,
  mergeProfileFacts,
  applyPersistedTravelerProfile,
} = sandbox;

// ─── Fixtures ──────────────────────────────────────────────────────────────────

function makeSoulContext(overrides = {}) {
  return {
    people_type: 'solo',
    companion_constraints: { has_kids: false, kids_age: null, has_elderly: false, disability: null },
    has_car: true,
    _provenance: {},
    ...overrides,
  };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Traveler Profile Continuity V0.1', () => {
  // Test A: _extractExplicitTravelerFacts — USER_EXPLICIT fields included; UNKNOWN excluded
  test('A: people_type USER_EXPLICIT extracted; UNKNOWN excluded', () => {
    const explicit = makeSoulContext({
      people_type: 'family',
      _provenance: { people_type: 'USER_EXPLICIT' },
    });
    const r = extractExplicitTravelerFacts(explicit);
    expect(r.people_type).toBe('family');

    const unknown = makeSoulContext({
      people_type: 'solo',
      _provenance: { people_type: 'UNKNOWN' },
    });
    const r2 = extractExplicitTravelerFacts(unknown);
    expect(r2.people_type).toBeNull();
  });

  // Test B: has_car — explicit true stored; null→true default excluded
  test('B: has_car USER_EXPLICIT true stored; null-default (UNKNOWN) excluded', () => {
    const explicit = makeSoulContext({
      has_car: true,
      _provenance: { has_car: 'USER_EXPLICIT' },
    });
    const r = extractExplicitTravelerFacts(explicit);
    expect(r.has_car).toBe(true);

    const defaultTrue = makeSoulContext({
      has_car: true,
      _provenance: { has_car: 'UNKNOWN' }, // null→true default, UNKNOWN provenance
    });
    const r2 = extractExplicitTravelerFacts(defaultTrue);
    expect(r2.has_car).toBeNull();
  });

  // Test C: companion_has_elderly — USER_EXPLICIT extracted; non-explicit excluded
  test('C: companion_has_elderly USER_EXPLICIT extracted; AI_INFERENCE excluded', () => {
    const explicit = makeSoulContext({
      companion_constraints: { has_kids: false, kids_age: null, has_elderly: true, disability: null },
      _provenance: { has_elderly: 'USER_EXPLICIT' },
    });
    const r = extractExplicitTravelerFacts(explicit);
    expect(r.companion_has_elderly).toBe(true);

    const inferred = makeSoulContext({
      companion_constraints: { has_kids: false, kids_age: null, has_elderly: true, disability: null },
      _provenance: { has_elderly: 'AI_INFERENCE' },
    });
    const r2 = extractExplicitTravelerFacts(inferred);
    expect(r2.companion_has_elderly).toBeNull();
  });

  // Test D: _mergeProfileFacts — current explicit overwrites stored value
  test('D: current USER_EXPLICIT wins over stored persisted value', () => {
    const current = { people_type: 'couple', companion_has_elderly: null, companion_has_kids: null, has_car: null };
    const stored  = { people_type: 'family', companion_has_elderly: null, companion_has_kids: null, has_car: true };
    const merged = mergeProfileFacts(current, stored);
    expect(merged.people_type).toBe('couple'); // current wins
    expect(merged.has_car).toBe(true);         // stored fills gap (null current)
  });

  // Test E: has_car explicit false stored and re-injected (negation scenario)
  test('E: has_car explicit false is stored and re-injected correctly', () => {
    // Extraction: explicit false → included as false (not null)
    const explicitFalse = makeSoulContext({
      has_car: false,
      _provenance: { has_car: 'USER_EXPLICIT' },
    });
    const facts = extractExplicitTravelerFacts(explicitFalse);
    expect(facts.has_car).toBe(false);

    // Merge: explicit false stored; next turn UNKNOWN has_car should get stored false
    const stored = mergeProfileFacts(facts, null);
    expect(stored.has_car).toBe(false);

    // Re-injection: next turn has UNKNOWN has_car (default true) → should get false from stored
    const nextTurn = makeSoulContext({
      has_car: true, // null→true default
      _provenance: { has_car: 'UNKNOWN' },
    });
    const enriched = applyPersistedTravelerProfile(nextTurn, stored);
    expect(enriched.has_car).toBe(false);
    expect(enriched._provenance.has_car).toBe('USER_EXPLICIT');
  });

  // Test F: _mergeProfileFacts — null in current does NOT overwrite stored
  test('F: UNKNOWN (null) current fact does not overwrite stored explicit', () => {
    const current = { people_type: null, companion_has_elderly: null, companion_has_kids: null, has_car: null };
    const stored  = { people_type: 'family', companion_has_elderly: true, companion_has_kids: null, has_car: false };
    const merged = mergeProfileFacts(current, stored);
    expect(merged.people_type).toBe('family');
    expect(merged.companion_has_elderly).toBe(true);
    expect(merged.has_car).toBe(false);
  });

  // Test G: _applyPersistedTravelerProfile — no stored profile → soulContext unchanged
  test('G: no stored profile — soulContext returned unchanged', () => {
    const ctx = makeSoulContext({ people_type: 'solo', _provenance: { people_type: 'UNKNOWN' } });
    const result = applyPersistedTravelerProfile(ctx, null);
    expect(result.people_type).toBe('solo');
    expect(result).toEqual(ctx);
  });

  // Test H: _applyPersistedTravelerProfile — current USER_EXPLICIT NOT overwritten by stored
  test('H: current USER_EXPLICIT is not overwritten by stored persisted value', () => {
    const ctx = makeSoulContext({
      people_type: 'couple',
      _provenance: { people_type: 'USER_EXPLICIT' },
    });
    const stored = { people_type: 'family', companion_has_elderly: null, companion_has_kids: null, has_car: null };
    const result = applyPersistedTravelerProfile(ctx, stored);
    expect(result.people_type).toBe('couple'); // current USER_EXPLICIT must not be overwritten
    expect(result._provenance.people_type).toBe('USER_EXPLICIT');
  });
});
