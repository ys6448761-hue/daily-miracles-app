# SOUL Traveler Profile Continuity V0.1 — Implementation
Date: 2026-10-01
Branch: staging/storybook-c7a
Status: IMPLEMENTED / VERIFIED
Code changes: services/soyeowoolService.js
Tests: tests/unit/travelerProfileContinuity.test.js / travelerProfileIntegration.test.js

---

## 1. Scope

Explicit traveler facts (people_type, companion_constraints, has_car) now survive across turns.

**Approved:**
- people_type USER_EXPLICIT persists to journey_ctx.traveler_profile
- companion_constraints (has_elderly, has_kids) USER_EXPLICIT persists
- has_car USER_EXPLICIT persists (including explicit false)

**NOT approved (not implemented):**
- UNKNOWN → unconditional ASK gate
- Exploration memory (WANT/EXPERIENCED)
- must_visit / exclude_place_ids continuity
- New DB schema / migration
- New architecture

---

## 2. Persistence Representation

Stored as JSONB key `traveler_profile` inside `journey_ctx`:

```json
{
  "traveler_profile": {
    "people_type":           "family" | "couple" | ... | null,
    "companion_has_elderly": true | false | null,
    "companion_has_kids":    true | false | null,
    "has_car":               true | false | null
  }
}
```

null = "no explicit value stored for this field." Never overwrites a stored non-null value with null.

---

## 3. Provenance Rule

Only `_provenance[field] === 'USER_EXPLICIT'` values may be written to `traveler_profile`.
`UNKNOWN` and `AI_INFERENCE` provenance values produce `null` in `_extractExplicitTravelerFacts()` and are NOT persisted.

---

## 4. Re-injection Path

In the Travel Intelligence path (`_isDiscoveryIntent || _isJourneyPlanningIntent`), before `_buildDomainContext()`:

```
sessionService.getSession(sessionId)
  → _sessionCtxForTurn.traveler_profile
  → _applyPersistedTravelerProfile(soulContext, storedProfile)
  → enrichedSoulContext
  → _buildDomainContext(enrichedSoulContext, ...)
  → travelGuideService.recommend(domainContext)
```

The same `_sessionCtxForTurn` is reused by the skeleton write-back (removes the previously redundant second session read).

---

## 5. Precedence Contract

```
CURRENT USER_EXPLICIT  >  PERSISTED USER_EXPLICIT  >  CURRENT DEFAULT/UNKNOWN
```

- Current turn with USER_EXPLICIT provenance wins over any stored value.
- Stored value fills gaps only when current provenance is not USER_EXPLICIT.
- UNKNOWN current values NEVER overwrite stored explicit values.

---

## 6. Write Locations

| Path | Location | Nature |
|---|---|---|
| CLARIFICATION | After preferred_leisure block (~line 1396) | Non-blocking |
| Travel Intelligence | Before `_buildDomainContext()` (~line 1428) | Non-blocking |
| Skeleton write-back | Inside `if (_isJourneyPlanningIntent && quoteCtx)` | Alongside existing fields |

---

## 7. Helper Functions Added (services/soyeowoolService.js)

| Function | Purpose |
|---|---|
| `_extractExplicitTravelerFacts(soulContext)` | Returns USER_EXPLICIT fields only; null for non-explicit |
| `_mergeProfileFacts(currentFacts, stored)` | Merges current explicit + stored; current wins |
| `_applyPersistedTravelerProfile(soulContext, storedProfile)` | Re-injects stored facts with precedence |

---

## 8. Integration Test Results (A–D)

| Test | Description | Result |
|---|---|---|
| A1 | CLARIFICATION turn writes `traveler_profile` with family + has_elderly | PASS |
| A2 | DISCOVERY turn re-injects stored profile → `domainContext.people_type='family'` | PASS |
| B1 | CLARIFICATION turn writes `has_car=true` (USER_EXPLICIT) | PASS |
| B2 | Stored `has_car=false` overrides UNKNOWN default `true` in domainContext | PASS |
| C  | Both people_type and has_car accumulate and survive in domainContext | PASS |
| D  | All-UNKNOWN CLARIFICATION turn does NOT write traveler_profile | PASS |

### Explicit Override
T1 stored `people_type='family'`, T2 USER_EXPLICIT `people_type='couple'` → domainContext uses `'couple'`. **PASS**

### has_car=false Infrastructure
Stored `has_car=false` → UNKNOWN default overridden → `domainContext.has_car=false`. **PASS**

---

## 9. Full Suite Results

| Metric | Baseline | Final | Delta |
|---|---|---|---|
| Tests passed | 526 | 542 | +16 (new) |
| Tests failed | 55 | 55 | 0 |
| Suites passed | 34 | 36 | +2 (new) |
| Suites failed | 33 | 33 | 0 |

Zero new regressions.

---

## 10. Regression Results

| Regression | Status |
|---|---|
| Origin Preservation A/B/C/D | NONE — `_extractSemanticRoles()` and departure_origin/hotel_lodging write-back unchanged |
| Golden Question guest_count clarification | NONE — `_generateClarificationMessage()` unchanged; contextExtractionProvenance 17/17 PASS |
| Legacy Journey Presentation course-first | NONE — `_buildClientPayload()` course forwarding unchanged; CourseDisplay rendering unchanged |

---

## 11. Scope Integrity — PASS

All items NOT approved remain not implemented. Travel Time GOVERNANCE_HOLD maintained.

---

## 12. COVERAGE_GAP

**"차 안 가져갈게" → GPT `_source.has_car='explicit'` reliability**

Infrastructure is VERIFIED: `has_car=false` with `USER_EXPLICIT` provenance can be stored and re-injected correctly. However, whether the live GPT prompt reliably produces `_source.has_car='explicit'` for explicit negation sentences ("차 안 가져갈게") has not been tested with a live GPT call. Extraction faithfulness remains OPEN.

Do not fix in this scope.

---

## 13. OPEN Items

| Item | State |
|---|---|
| GPT explicit-negation extraction faithfulness | OPEN — COVERAGE_GAP |
| departure_origin → Journey Composer | OPEN — SEMANTIC_GAP |
| departure_origin → SOUL message | OPEN — PRESENTATION_GAP |
| Odongdo Place Identity | OPEN — PRESENTATION_GAP |
| Required-UNKNOWN → minimum ASK contract | OPEN — Next Action |
| Explicit must_visit / exclude continuity | OPEN — not approved |

## 14. HOLD / NOT APPROVED

- Exploration Memory (WANT/EXPERIENCED across turns)
- Exploration → must_visit auto-promotion
- New Memory Architecture
- Travel Time Matrix (GOVERNANCE_HOLD)

---

## 15. Evidence References

- `services/soyeowoolService.js` lines 326–387: three helper functions
- `services/soyeowoolService.js` lines 1396–1411: CLARIFICATION path write
- `services/soyeowoolService.js` lines 1428–1458: Travel Intelligence session read + re-injection + write
- `services/soyeowoolService.js` line 1543: skeleton write-back `traveler_profile` addition
- `tests/unit/travelerProfileContinuity.test.js`: helper-level Tests A–H
- `tests/unit/travelerProfileIntegration.test.js`: integration Traces A–D + Override + False
- Prior impl: `docs/architecture/SOUL_GOLDEN_QUESTION_ORIGIN_PRESERVATION_IMPL_V0_1.md`
- Prior impl: `docs/architecture/SOUL_LEGACY_JOURNEY_PRESENTATION_RESTORATION_IMPL_V0_1.md`
