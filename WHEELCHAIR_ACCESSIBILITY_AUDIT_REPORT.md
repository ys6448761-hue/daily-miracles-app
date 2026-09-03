# Wheelchair/Accessibility Filter Audit Report

**Date:** 2026-08-24  
**Status:** ⚠️ **CRITICAL SAFETY ISSUE IDENTIFIED**  
**Classification:** ACCESSIBILITY VIOLATION  
**Scope:** READ-ONLY AUDIT (no code changes made)

---

## EXECUTIVE SUMMARY

**Critical Bug Discovered:** Two conflicting wheelchair accessibility checks exist in the companion filter pipeline.

- **_passesAccessibility()** (line 270-285): ✅ CORRECT implementation using accessibility_wheelchair_status field
- **_passesCompanion()** (line 337-339): ❌ BROKEN implementation using non-existent suitable_for tag

**Result:** Wheelchair users receive 0/12 recommendations despite having accessible places available.

**Root Cause:** _passesCompanion() OVERRIDE occurs after _passesAccessibility() correctly handles accessibility.

---

## CURRENT_WHEELCHAIR_FILTER

### Filter 1: _passesAccessibility() — CORRECT

**Location:** services/travelGuideService.js, lines 270-285

```javascript
if (companion_constraints.disability === "wheelchair") {
  const wheelchairStatus = place.accessibility_wheelchair_status || 'unknown';

  if (wheelchairStatus === 'verified_yes') {
    return true;  // Include accessible places
  }
  if (wheelchairStatus === 'verified_no') {
    return false; // Exclude inaccessible places
  }
  if (wheelchairStatus === 'unknown') {
    // FAIL-SAFE: Include with warning
    place._warnings.push('wheelchair_accessibility_unverified');
    return true;
  }
}
```

**Semantics:** ✅ CORRECT
- Uses canonical field: `accessibility_wheelchair_status`
- Implements fail-safe: unknown → include with warning
- Handles verification levels: yes > unknown > no
- Respects Phase 1 safety principle

---

### Filter 2: _passesCompanion() — BROKEN

**Location:** services/travelGuideService.js, lines 337-339

```javascript
if (companion_constraints?.disability === "wheelchair") {
  return suitableFor.includes("wheelchair_accessible");
}
```

**Semantics:** ❌ BROKEN
- Uses wrong field: `suitable_for` array instead of `accessibility_wheelchair_status`
- Expects non-existent tag: `"wheelchair_accessible"` (not in database)
- Implicit rejection: if tag not found, returns false (REJECTS)
- No fail-safe: unlike accessibility filter, does not include+warn for unknown
- Violates Phase 1 principle: unknown should be fail-safe, not rejected

---

## CURRENT_STROLLER_FILTER

**Location:** services/travelGuideService.js, lines 288-302

```javascript
if (companion_constraints.has_kids && companion_constraints.kids_age < 3) {
  const strollerStatus = place.accessibility_stroller_status || 'unknown';

  if (strollerStatus === 'verified_yes') {
    return true;
  }
  if (strollerStatus === 'verified_no') {
    return false;
  }
  if (strollerStatus === 'unknown') {
    place._warnings.push('stroller_accessibility_unverified');
    return true;
  }
}
```

**Status:** ✅ CORRECT
- Uses canonical field: `accessibility_stroller_status`
- Implements fail-safe correctly
- No second check in _passesCompanion() affecting stroller users

---

## CANONICAL_ACCESSIBILITY_FIELDS

**Database schema uses:**

```
accessibility_wheelchair_status    (values: 'verified_yes', 'verified_no', 'unknown')
accessibility_stroller_status      (values: 'verified_yes', 'verified_no', 'unknown')
bus_accessible_status              (values: 'verified_yes', 'verified_no', 'unknown')
suitable_for                       (array of tags, NO accessibility tags)
```

**Current distribution (12 places):**
- accessibility_wheelchair_status: 100% unknown (0 verified_yes, 0 verified_no, 12 unknown)
- accessibility_stroller_status: 100% unknown
- bus_accessible_status: 100% unknown
- suitable_for: Does NOT contain 'wheelchair_accessible'

---

## FIELD_MISMATCHES

### Mismatch 1: Wheelchair Filter (CRITICAL)

| Aspect | Correct Field | Broken Field | Status |
|--------|---------------|--------------|--------|
| Used in _passesAccessibility | accessibility_wheelchair_status | — | ✅ |
| Used in _passesCompanion | — | suitable_for | ❌ |
| Expected value | verified_yes, verified_no, unknown | wheelchair_accessible tag | ❌ |
| Tag exists in DB | N/A | NO | ❌ CRITICAL |
| Filter order | Runs first (5th position) | Runs second (6th position) | ❌ OVERRIDE |

### Result

Both filters trigger on wheelchair disability:
1. _passesAccessibility() passes: `unknown → include with warning` ✅
2. _passesCompanion() rejects: `no tag → return false` ❌ OVERRIDES
3. Final result: **EXCLUDED** (broken filter wins)

---

## SAFETY_RISK

### Risk Level: CRITICAL ⚠️

### Violation Type: ACCESSIBILITY VIOLATION

### Impact: 100% REJECTION

**Wheelchair users experience:**
- Request recommendations
- _passesAccessibility() identifies 12/12 places with 'unknown' status
- Correctly includes all with `wheelchair_accessibility_unverified` warning
- _passesCompanion() rejects ALL (0/12) because tag doesn't exist
- **Final: NO RECOMMENDATIONS** (0 out of 12 places)

### UNKNOWN Semantics Violation

```
Expected behavior (Phase 1):
  unknown → include with warning (fail-safe)

Accessibility filter:
  unknown → ✅ include with warning

Companion filter:
  unknown → ❌ exclude (breaks fail-safe)

Result: Conflicting semantics, safety compromised
```

### Severity Indicators

- Affects: All wheelchair users (100%)
- Affects: All parent w/ stroller & kids under 3 (via companion check if present)
- Consequence: Complete exclusion from service
- Compliance: Violates accessibility requirements (WCAG, ADA-like)

---

## CONTROLLED_CASE_RESULTS

### Test Case A: Wheelchair user + car

**Before _passesCompanion() override:**
- _passesAccessibility() result: ✅ 12/12 places pass
- All marked with `wheelchair_accessibility_unverified` warning

**After _passesCompanion() override:**
- _passesCompanion() result: ❌ 0/12 places pass
- All rejected due to missing `wheelchair_accessible` tag

**Final output:** 0 recommendations

### Test Case B: Wheelchair user + no car

**Before _passesCompanion() override:**
- _passesAccessibility() result: ✅ 12/12 places pass

**After _passesCompanion() override:**
- _passesCompanion() result: ❌ 0/12 places pass

**Final output:** 0 recommendations

### Test Case C: Stroller required + car

**Status:** ✅ Functioning correctly
- Only _passesAccessibility() checks stroller status
- No second check in _passesCompanion()
- Expected: 12/12 places would pass with warnings

### Test Case D: Stroller required + no car

**Status:** ✅ Functioning correctly

### Test Case E: No accessibility requirement

**Status:** ✅ Functioning correctly
- Accessibility constraints skipped

---

## ROOT_CAUSE

### Primary Cause

```
Two independent wheelchair checks:

1. _passesAccessibility() 
   - Checks accessibility_wheelchair_status (correct field)
   - Uses fail-safe semantics (include unknown + warn)
   - ✅ Correct implementation

2. _passesCompanion()
   - Checks suitable_for tag "wheelchair_accessible"
   - Tag does not exist in database
   - ❌ Incorrect assumption
   - Returns false for ALL places
   - OVERRIDES correct accessibility check
```

### Historical Context

Likely scenario:
- _passesAccessibility() was properly implemented with correct field and semantics
- _passesCompanion() was intended to handle companion-specific logic (kids, elderly)
- Someone added wheelchair check to _passesCompanion() using wrong field assumption
- Two checks were never reconciled; second overrides first in pipeline

---

## SAFE_FIX_SCOPE

**NOT INCLUDED IN THIS FIX** (out of scope for vocabulary alignment task)

**What would be required for a safe fix:**

1. **Remove wheelchair check from _passesCompanion()**
   - Line 337-339 should not check disability="wheelchair"
   - Let _passesAccessibility() handle all accessibility (correct field)

2. **Consolidate accessibility logic**
   - _passesAccessibility() is the canonical accessibility filter
   - It handles wheelchair, stroller, and elderly correctly

3. **Verify no other companion checks override accessibility**
   - kids_ok tag handling in _passesCompanion() is separate (correct)
   - elderly tag handling in _passesCompanion() is separate (now correct after vocabulary fix)

4. **Test thoroughly**
   - Wheelchair users should get recommendations with warnings
   - Stroller users should get recommendations with warnings
   - No change to other travelers

---

## PRODUCTION_SAFE_WITHOUT_FIX

**Status: NO**

The current code FAILS to serve wheelchair users. This is not safe to ship.

### Evidence

- 100% rejection rate: 0/12 recommendations for wheelchair users
- Violates fail-safe principle: unknown accessibility should include+warn
- Accessibility filter is correctly implemented but overridden
- This is a safety violation, not just a bug

### Minimum Safe Action

This bug MUST be fixed before any user-facing release featuring accessibility.

Current recommendations:
1. **Immediate:** Remove wheelchair check from _passesCompanion()
2. **Test:** Verify wheelchair users get recommendations with warnings
3. **Deploy:** After verification

---

## FINAL ASSESSMENT

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Correct field used | ❌ NO | suitable_for instead of accessibility_wheelchair_status |
| Non-existent tag | ❌ YES | "wheelchair_accessible" not in DB |
| Fail-safe implemented | ❌ NO | Rejects unknown instead of including+warning |
| UNKNOWN semantics | ❌ VIOLATED | Rejects instead of fail-safe |
| User impact | ❌ CRITICAL | 0/12 recommendations for wheelchair users |
| Accessibility | ❌ VIOLATED | Complete rejection of accessible features |
| Production ready | ❌ NO | Must be fixed before release |

---

**Status:** DOCUMENTED FOR FUTURE TASK  
**Priority:** CRITICAL (accessibility violation)  
**Timeline:** Must be fixed before production deployment  
**Scope:** Requires separate task/commit from this vocabulary fix
