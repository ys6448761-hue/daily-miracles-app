# SOUL Golden Question — Origin Preservation V0.1 Implementation Evidence
Date: 2026-10-01
Branch: staging/storybook-c7a
Status: IMPLEMENTED / VERIFIED
Scope: Departure origin vs lodging role separation — explicit traveler state preservation

---

## 1. Problem Statement

"라마다에서 출발해서 케이블카 타려고 해" → `quoteContextService._extractHotelCode()` extracts
`hotel_code: 'ramada'` from ANY hotel name mention, including departure context.
`routeSkeletonService.buildSkeleton({ hotel_code: 'ramada' })` creates check-in/out lodging nodes.
Result: departure fact is silently converted to lodging semantics. **BUG.**

---

## 2. Approved Contract

**"Explicit semantic roles are additive, not mutually exclusive."**

Same place can hold departure AND lodging roles simultaneously (Sentence C).
Independent JSONB keys in journey_ctx: `departure_origin` and `hotel_lodging`.
`routeSkeletonService` reads `hotel_lodging` canonical_code only — unchanged.

---

## 3. Implementation

### Changed Files (3)

| File | Change |
|---|---|
| `services/contextExtractionService.js` | Added `departure_origin` / `hotel_lodging` to GPT prompt extraction rules, raw return schema, provenance mapping |
| `services/soyeowoolService.js` | Added `_extractSemanticRoles()` + `_hotelCodeForSkeleton()` helpers; replaced `quoteCtx.hotel_code` with `_hotelCodeForSkeleton()` in routeSkeletonService call; added departure_origin/hotel_lodging to journey_ctx write-back |
| `tests/unit/contextExtractionProvenance.test.js` | Updated T-CP07 provenance key count: 10→18 (additive fields) |

**diff: +54 lines / −7 lines. DB migration: NONE. routeSkeletonService: UNCHANGED.**

### Key Logic (soyeowoolService.js)

```javascript
const _DEPARTURE_SUFFIX = /에서\s*출발/;
const _LODGING_SUFFIX   = /에서\s*(숙박|1박|묵)/;

function _extractSemanticRoles(message) {
  const hotelCode = quoteContextService._extractHotelCode(message);
  if (!hotelCode) return { departure_origin: null, hotel_lodging: null };
  const name = _HOTEL_CODE_TO_KO[hotelCode] || hotelCode;
  return {
    departure_origin: _DEPARTURE_SUFFIX.test(message) ? { name, canonical_code: hotelCode, role: 'departure' } : null,
    hotel_lodging:    _LODGING_SUFFIX.test(message)   ? { name, canonical_code: hotelCode, role: 'lodging'   } : null,
  };
}

function _hotelCodeForSkeleton(message, quoteCtx) {
  const { departure_origin, hotel_lodging } = _extractSemanticRoles(message);
  if (departure_origin && !hotel_lodging) return null; // departure-only → no lodging nodes
  if (hotel_lodging) return hotel_lodging.canonical_code;
  return quoteCtx ? quoteCtx.hotel_code : null;       // legacy hotel_id path
}
```

Uses existing `quoteContextService._extractHotelCode()` + MVP_HOTELS mapping. No new resolver.

---

## 4. Verification Results

### A/B/C/D: 4/4 PASS

| Scenario | departure_origin | hotel_lodging | skeleton hotel_code | Result |
|---|---|---|---|---|
| A: "라마다에서 출발해서 케이블카" | ramada | null | **null** → no lodging nodes | PASS |
| B: "라마다에서 숙박하고 케이블카" | null | ramada | **ramada** → existing skeleton | PASS |
| C: "출발 + 숙박" same place | ramada | ramada | **ramada** (hotel_lodging wins) | PASS |
| D: no explicit role (legacy) | null | null | **ramada** (quoteCtx fallback) | PASS |

### Context Extraction (17/17 PASS)

contextExtractionProvenance.test.js — 17/17 PASS including T-CP07, departure_origin provenance, hotel_lodging provenance.

### guest_count clarification regression (57f744a): PASS

`_extractSemanticRoles` is inside `if (_isJourneyPlanningIntent(message) && quoteCtx)` block.
guest_count clarification path is upstream of this block — unaffected.

### Full Test Suite

| Metric | Before (57f744a) | After |
|---|---|---|
| Failed suites | 34 | **33** (−1 improvement) |
| Failed tests | 55 | 55 (unchanged) |
| Passed tests | 526 | 526 (unchanged) |

**New regression: 0.**

### Build: PASS

706 modules transformed. ✓ built in 14.65s. No compile errors.

---

## 5. Pre-existing Failures (not caused by this change)

| Suite | Root Cause |
|---|---|
| `soyeowoolTravelIntelligence` | quoteContextService mock missing `_extractLeisure` — pre-existing |
| `quoteBridgeTests` (3 tests) | DB connection failure in test env — pre-existing |
| `sharedJourneyAcceptance`, `coupleContextCorrection`, others | "Failed to retrieve session: AggregateError" — DB not running in test env — pre-existing |
| `contextExtractionService.test.js` | OPENAI_API_KEY not set — pre-existing |

---

## 6. Semantic Coverage Gap

| Pattern | Status |
|---|---|
| "에서 출발" | MATCHED (departure) ✓ |
| "에서 숙박", "에서 1박", "에서 묵" | MATCHED (lodging) ✓ |
| **"에서 자고"** | **COVERAGE_GAP** — LODGING_SUFFIX 미매칭 → legacy fallback → hotel_code preserved → existing behavior maintained. Not fixed in this scope. |

"에서 자고" falls back to legacy behavior (hotel_code from quoteCtx). This means "라마다에서 자고" still
produces lodging skeleton. Acceptable in V0.1 — only explicit `에서 숙박/1박/묵` patterns are semantic-role-aware.

---

## 7. HOLD Preserved

- **Travel Time Knowledge**: GOVERNANCE_HOLD maintained. Not touched.
- **course.blocks[] → CourseDisplay restoration**: Not in this scope.
- **Journey Quality improvements**: Not claimed resolved.
- **General Failure Safety**: Not claimed resolved.

---

## 8. What This Change Does NOT Solve

- Journey Composer V0 `course` field not yet in client payload (separate LEGACY_RESTORE task)
- opening_hours / admission_fee DB fields not passed to Composer (EXISTS_NOT_USED)
- Travel Time Matrix not connected (GOVERNANCE_HOLD)
- "에서 자고" and other lodging verb variants not covered by LODGING_SUFFIX

---

## 9. Current Next Action

**Legacy Journey Presentation Restoration V0.1 —**
`course.blocks[]` → client payload → existing CourseDisplay restoration scope verification.

NOT YET IMPLEMENTED. Scope verification required before implementation.
