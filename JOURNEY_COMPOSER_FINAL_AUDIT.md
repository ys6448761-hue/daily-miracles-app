# Journey Composer V0 — FINAL QUALITY AUDIT REPORT

**Date:** 2026-08-24  
**Audit Status:** ✅ COMPLETE  
**Deployment Status:** 🛑 BLOCKED (P0 issues require resolution)

---

## Executive Summary

Journey Composer V0 implementation is **functionally complete** and **backward compatible**, but has **two critical (P0) issues** that must be addressed before production deployment:

1. **Hardcoded travel duration range contradicts 'unknown' status** — Misleading to users
2. **No personalization by people_type** — All travelers get identical courses for same time

**Current Status:** Code works as designed, but design has flaws that need addressing.

---

## 1. ACTUAL COURSE CONTENT AUDIT

### 180 Minutes (반나절) Courses

All courses follow: **Place → Travel(10-30min) → Place → Meal(60min) → Cafe(30min)**

#### Family with kids
```
PLACE_CODES:     cablecar, jaisan_park
PLACE_NAMES:     케이블카, 자산공원
STAY_MINUTES:    45, 30
MEAL_BLOCK:      lunch, 60min (2 restaurants)
CAFE_BLOCK:      30min (2 cafes)
TRAVEL_TRANS:    1 segment (10-30min, status=unknown)
TOTAL_KNOWN:     75min stay + 90min meal/cafe = 165min
UNALLOCATED:     180 - 165 = 15min buffer
FIT_STATUS:      fits_comfortably ✓
```

#### Couple
```
PLACE_CODES:     dolsan_nightscape, jaisan_park
PLACE_NAMES:     돌산 야경, 자산공원
STAY_MINUTES:    45, 30
(Rest identical to family_with_kids)
```

#### Solo
```
PLACE_CODES:     cablecar, jaisan_park
(Identical to family_with_kids)
```

#### Friends
```
PLACE_CODES:     cablecar, jaisan_park
(Identical to family_with_kids)
```

### 480 Minutes (하루) Courses

All courses follow: **Place → Travel → Place → Travel → Place → Meal → Cafe**

#### All people types (family, couple, solo, friends)
```
FAMILY/SOLO:
  PLACE_CODES:   cablecar, hyangiram, jaisan_park
  
COUPLE:
  PLACE_CODES:   dolsan_nightscape, hyangiram, jaisan_park

PLACE_NAMES:     케이블카/돌산야경, 향일암, 자산공원
STAY_MINUTES:    45, 90, 30
MEAL_BLOCK:      lunch, 60min (2 restaurants)
CAFE_BLOCK:      30min (2 cafes)
TRAVEL_TRANS:    2 segments (each 10-30min, status=unknown)
TOTAL_KNOWN:     165min stay + 90min meal/cafe = 255min
UNALLOCATED:     480 - 255 = 225min buffer
FIT_STATUS:      fits_comfortably ✓
```

---

## 2. PERSONALIZATION ANALYSIS

### Unique Courses by Time

| Time | Unique Combos | Split | Finding |
|------|---------------|-------|---------|
| 180 min | 2 | 3 people get combo A / 1 person gets combo B | Minimal variation |
| 480 min | 2 | 3 people get combo A / 1 person gets combo B | Same split |

### Personalization Verdict

**Finding:** Only `couple` people_type receives a different place (dolsan_nightscape instead of cablecar).

**Root Cause:** Traveler fit scoring in the ranking algorithm affects place selection, BUT all places in the database pass the `suitable_for` filter for all people_types. Result: 3 people get cablecar (higher ranked), 1 person (couple) gets dolsan_nightscape.

**Assessment:** 
- ✓ Technically working (fit scoring is applied)
- ✗ Insufficient differentiation (all people_types receive nearly identical experiences)
- ⚠️ Risk: Marketing V0 as "personalized" when variation is minimal

**Recommendation:** Document that V0 provides "traveler-fit ranking" not "personalized course variation". True personalization would require places to have differential suitable_for tags or explicit course variants by people_type.

---

## 3. TRAVEL DURATION RANGE AUDIT

### Source of 10-30 Minute Range

**File:** `services/travelGuideService.js`  
**Function:** `_buildJourneyBlocks()` (line ~350)  
**Code:**
```javascript
{
  sequence: sequence++,
  type: 'travel_transition',
  estimated_duration_range: {
    min: 10,
    max: 30        // ← HARDCODED
  },
  status: 'unknown',
  note: 'Actual travel time depends on route and traffic'
}
```

### Semantic Analysis

| Aspect | Current | Issue |
|--------|---------|-------|
| Verified data source | None | ❌ Range is hardcoded |
| Calculated from coordinates | No | ❌ Not computed |
| Derived from API | No | ❌ Not from external data |
| Status | unknown | ✓ Correct |
| Contradiction | Range shown but status='unknown' | ⚠️ PROBLEM |

### P0 Issue: Semantic Inconsistency

**Problem:** 
- `status: 'unknown'` correctly indicates no verified travel time
- BUT `estimated_duration_range: {min:10, max:30}` implies knowledge
- **Contradiction:** How can we show a range for something marked 'unknown'?

**User Impact:**
- User sees "travel time: 10-30 minutes"
- User assumes this is an estimate (it's not, it's hardcoded)
- User plans their day based on false confidence in the range

**Fix Options:**

| Option | Pro | Con |
|--------|-----|-----|
| **A: Remove blocks if unknown** | Clear semantics | Less visual info |
| **B: Show "unknown" message** | Honest | Less helpful |
| **C: Wider range (5-60min)** | Safer bounds | Still hardcoded |
| **D: Document in release notes** | Minimal code change | Doesn't fix UI |

**Recommendation:** **Option B** — Replace hardcoded range with explicit "duration unknown" message when status='unknown'.

---

## 4. TIME-TO-STOP-COUNT MATRIX

### Test Results Across Time Values

```
Time    | Time Slot | Target | Actual | Fit Status
--------|-----------|--------|--------|------------------
60 min  | custom    | 2      | 0      | fits_comfortably
120 min | custom    | 2      | 1      | fits_comfortably
180 min | half_day  | 3      | 2      | fits_comfortably
240 min | half_day  | 3      | 2      | fits_comfortably
300 min | custom    | 3      | 3      | fits_comfortably
360 min | full_day  | 5      | 3      | fits_comfortably
420 min | full_day  | 5      | 3      | fits_comfortably
480 min | full_day  | 5      | 3      | fits_comfortably
```

### Algorithm Analysis

**Stop Count Formula:**
```javascript
function _getTargetStopCount(timeSlot, timeMinutes) {
  if (timeSlot === 'half_day') {           // 150-240 min
    return 3;
  } else if (timeSlot === 'full_day') {    // 360-540 min
    return 5;
  } else {                                 // custom
    return Math.max(2, Math.min(5, Math.ceil(timeMinutes / 120)));
  }
}
```

**Algorithm Type:** **A. Hardcoded by time band** (plus scaled formula for custom)

### Edge Case Testing

| Boundary | Value | Detected As | Target | Actual |
|----------|-------|-------------|--------|--------|
| 반나절 lower | 150 | half_day | 3 | 2 |
| 반나절 upper | 240 | half_day | 3 | 2 |
| 반나절 upper+1 | 241 | custom | 3 | ? |
| 하루 lower | 360 | full_day | 5 | 3 |
| 하루 upper | 540 | full_day | 5 | 3 |
| 하루 upper+1 | 541 | custom | 5 | ? |

### P1 Issue: Boundary Behavior

**Issue:** 241-359 minutes classified as 'custom', not 'full_day'

**Impact:** User selecting 350 minutes gets treated as "custom" not "하루", even though it's closer to 하루

**Verdict:** Minor; unlikely to affect users (they typically select 반나절 or 하루, not intermediate times)

---

## 5. FULL-DAY CAPACITY ANALYSIS

### 480-Minute Course Time Budget

```
Total Available: 480 minutes

KNOWN TIME USAGE:
  Place 1 stay:     45 min (cable car)
  Place 2 stay:     90 min (hyangiram)
  Place 3 stay:     30 min (jasam park)
  Subtotal places:  165 min

  Meal:             60 min
  Cafe:             30 min
  Subtotal meals:   90 min

TOTAL KNOWN:        255 min (53% of budget)

UNALLOCATED:        480 - 255 = 225 min (47% of budget)

TRAVEL TIME (unknown):
  2 segments × (10-30 min)
  Maximum: 2 × 30 = 60 min
  Minimum: 2 × 10 = 20 min
  Typical: 2 × 20 = 40 min
```

### Capacity Verdict

**Evaluation:**
- ✅ Course uses 53% of available time for known activities
- ✅ Remaining 47% (225 min) provides substantial buffer
- ✅ Even with 2× travel time (60 min), course stays well under budget
- ✅ Fit status "fits_comfortably" is **ACCURATE**

**Assessment:** Full-day course genuinely uses the day productively, not just padding. 480 minutes is appropriate for 3 places + meal + cafe + travel.

---

## 6. GEOGRAPHIC COHERENCE

### Course Sequences

**180-min course (2 places):**
```
Cable car (north coast/cable car station)
  ↓ travel (10-30 min)
Jaisan Park (northeast, park with sculptures)
```

**480-min course (3 places):**
```
Cable car (north coast)
  ↓ travel
Hyangiram (northeast, rocky outcrop)
  ↓ travel
Jaisan Park (northeast, park)
```

### Clustering Analysis

All selected places belong to Yeosu city cluster. No geographically scattered outliers.

**Dolsan Cluster Logic:**
- `cablecar` = cable car experience (north side)
- `dolsan_nightscape` = nightscape experience (dolsan area)
- These are distinct experiences but not far apart

**Assessment:**
- ✓ Geographic coherence is acceptable
- ✓ No absurd jumping (Yeosu is compact)
- ⚠️ No route optimization (places not ordered by proximity)
- Note: V0 does NOT optimize for shortest route; ranking-based order is acceptable for small city

---

## 7. DOLSAN SEMANTICS VERIFICATION

### Semantic Tags in Database

- `dolsan_daegyo` = 돌산대교 (bridge)
- `dolsan_nightscape` = 돌산 야경 (nightscape experience)
- `cablecar` = 케이블카 (cable car)

### Journey Composer Impact

Journey Composer V0 does NOT modify semantics. It only:
1. Selects places based on traveler fit ranking
2. Orders them as course blocks
3. Integrates meals/cafes

**Verdict:** ✓ Dolsan semantics remain intact. No regression.

---

## 8. MEAL/CAFE INTEGRATION ANALYSIS

### Integration Results

| Test Cases | With Meal | With Cafe | Both |
|------------|-----------|-----------|------|
| 8 total | 8/8 (100%) | 8/8 (100%) | 8/8 (100%) |

### Why Not 10/10 in Original Test?

Original test had 10 cases, but 2 custom-time cases (60min, 90min) may not have had meal_context.

**Actual result:** 100% meal/cafe integration (8/8 where meal_context='lunch')

**Verdict:** ✓ Meal/cafe integration is working correctly. Integration rate depends on meal_context input.

---

## 9. REGRESSION TEST RESULTS

### Test Suite: 9/9 PASS ✓

```
✓ Backward compatibility (places array)
✓ Backward compatibility (food field)
✓ Backward compatibility (cafes field)
✓ Course field exists
✓ Blocks array populated
✓ Time slot detected
✓ Stop count >= 1
✓ FIT status present
✓ Travel time remains unknown (status='unknown')
```

### Backward Compatibility Verdict

**Finding:** All old fields (`places`, `food`, `cafes`, `benefits`) are preserved in response.

**Old Client Impact:** ✓ ZERO — old clients continue to work without change

**New Client Impact:** ✓ Can opt-in to new `course` field for journey composition

---

## P0 ISSUES (BLOCKING)

### P0-1: Hardcoded Travel Range vs Unknown Status

**Severity:** CRITICAL — Semantic inconsistency

**Description:**
- Travel transition blocks show `estimated_duration_range: {min:10, max:30}`
- BUT status is marked as 'unknown'
- Contradiction: Can't show a range for something unknown

**Current Code:**
```javascript
blocks.push({
  sequence: sequence++,
  type: 'travel_transition',
  estimated_duration_range: { min: 10, max: 30 },  // ← HARDCODED
  status: 'unknown',
  note: 'Actual travel time depends on route and traffic'
});
```

**Risk:** Users might interpret the 10-30min range as a real estimate, not a placeholder.

**Fix Required:** Before deployment, choose one:
- **Option A:** Remove range entirely; show "travel time unknown"
- **Option B:** Widen range to be safer (e.g., 5-60min)
- **Option C:** Document that range is placeholder in UI

**Recommended:** **Option A** — Replace hardcoded range with text "duration unknown" when status='unknown'

---

### P0-2: No Personalization by People Type

**Severity:** HIGH — False marketing claim

**Description:**
- Journey Composer V0 returns nearly identical courses for all people_types
- Only `couple` differs slightly (dolsan_nightscape vs cablecar)
- Claiming "personalized courses" would be misleading

**Current Behavior:**
```
180 min:
  family_with_kids: cablecar, jaisan_park
  couple:           dolsan_nightscape, jaisan_park  ← Only different place
  solo:             cablecar, jaisan_park
  friends:          cablecar, jaisan_park

480 min:
  family_with_kids: cablecar, hyangiram, jaisan_park
  couple:           dolsan_nightscape, hyangiram, jaisan_park  ← Only different place
  solo:             cablecar, hyangiram, jaisan_park
  friends:          cablecar, hyangiram, jaisan_park
```

**Root Cause:** Traveler fit affects ranking, but all places pass suitable_for filters. Limited DB data (12 places) means insufficient differentiation.

**Risk:** V0 might be marketed as "personalized" when it's mostly identical recommendations.

**Fix Required:**
- Document that V0 provides "traveler-fit ranking" not "differentiated courses"
- Do NOT claim courses are personalized by people_type
- Invest in more places with varied suitable_for tags for true personalization (Phase 1C+)

**Recommended:** Update marketing/documentation to clarify scope: "Journey Composer V0 ranks places by traveler fit but does not vary course structure by people_type."

---

## P1 ISSUES (MINOR)

### P1-1: Time Slot Boundary Edge Cases

**Severity:** LOW

**Description:**
- 180min is upper boundary of half_day (150-240min)
- 360min is lower boundary of full_day (360-540min)
- 241-359min classified as "custom" not intuitive

**Impact:** Minimal (users typically select 반나절/하루 buttons, not arbitrary minutes)

**No fix required for V0.**

---

### P1-2: Target vs Actual Stop Count Mismatch

**Severity:** LOW

**Description:**
- Target: 5 stops for 하루
- Actual: 3 stops returned
- Difference: Database only has 12 places; can't fill target

**Impact:** Expected behavior given data constraints. Not a bug.

**Resolution:** Document limitation. V0 returns min(target, available_candidates).

---

## UNKNOWN SEMANTICS VALIDATION

### Travel Time Status = 'unknown'

**Verification:** ✓ CORRECT

```javascript
_estimateTravelTime(place, context) {
  return {
    minutes: null,      // ← Explicitly null, not 0
    status: 'unknown',  // ← Correctly marked
    source: 'not_available'
  };
}
```

**Fail-safe:** Unknown time does NOT filter out; surfaces warning instead ✓

**Verdict:** Unknown semantics are CORRECT. The only issue is showing hardcoded range alongside unknown status (P0-1).

---

## FINAL VERDICT

```
JOURNEY_COMPOSER_FINAL_AUDIT:

ACTUAL_180_COURSES:              2 unique combinations
ACTUAL_480_COURSES:              2 unique combinations
UNIQUE_COURSE_COUNT_BY_TRAVELER: 0 (identical for 3/4 people_types)

TIME_TO_STOP_COUNT_MATRIX:
  60min → 0 stops
  120min → 1 stop
  180min → 2 stops
  240min → 2 stops
  300min → 3 stops
  360min → 3 stops (target 5, limited by DB)
  420min → 3 stops (target 5, limited by DB)
  480min → 3 stops (target 5, limited by DB)

STOP_COUNT_ALGORITHM:           A. Hardcoded by time_slot + scaled custom
TRAVEL_DURATION_RANGE_SOURCE:   HARDCODED {min:10, max:30}
UNKNOWN_SEMANTICS_VALID:        YES (status='unknown' is correct)
FULL_DAY_KNOWN_USED_TIME:       255 min (53% of 480)
FULL_DAY_UNALLOCATED_TIME:      225 min (47% buffer)
GEOGRAPHIC_COHERENCE:           ACCEPTABLE (Yeosu compact)
DOLSAN_SEMANTICS_VALID:         YES (not changed by composer)
MEAL_CAFE_INTEGRATION:          100% (8/8 with meal_context='lunch')
REGRESSION_RESULTS:             9/9 PASS ✓

P0_ISSUES:
  1. HARDCODED_TRAVEL_RANGE (10-30min) contradicts status='unknown'
  2. NO_PERSONALIZATION (all people_types get near-identical courses)

P1_ISSUES:
  1. TIME_SLOT_BOUNDARIES (edge cases not tested)
  2. STOP_COUNT_MISMATCH (target 5, actual 3, expected due to DB size)

SAFE_TO_COMMIT:                 NO (unless P0 issues acknowledged in commit message)
SAFE_TO_PUSH:                   NO (requires P0 resolution strategy)
SAFE_TO_DEPLOY:                 NO (P0 issues must be fixed before release)

RECOMMENDED_MINIMUM_FIX:
  1. Replace hardcoded 10-30min range with explicit "duration unknown" text
  2. Update marketing copy: V0 provides "traveler-fit ranking" not "personalization"
  3. Document DB limitation: 12 places limits actual stops to max 3
  4. Add code comment explaining hardcoded boundaries

ESTIMATED_FIX_EFFORT:
  - Travel range fix: 15 min (code change + testing)
  - Documentation update: 30 min
  - Total: 45 min

APPROVAL_PATH:
  1. Address P0 issues (travel range + marketing claim)
  2. Update documentation/comments
  3. Rerun regression tests
  4. Final approval before merge to main
  5. Deploy to staging first
  6. Monitor for 24-48 hours
  7. Deploy to production

DEPLOYMENT_READINESS: 
  Status: HELD (awaiting P0 resolution)
  Estimated fix time: 45 minutes
  Expected completion: After P0 fixes + 1 regression run
```

---

## RECOMMENDATIONS

### Immediate Actions (Before Commit)

1. **Fix Travel Range Issue** 
   - Option: Replace hardcoded range with "duration unknown" message
   - Location: `_buildJourneyBlocks()` method
   - Effort: 15 min

2. **Update Marketing Language**
   - Change from "personalized courses" to "traveler-fit ranked courses"
   - Document that V0 does not vary course structure by people_type
   - Effort: 30 min

3. **Add Code Comments**
   - Explain hardcoded time boundaries
   - Document 12-place DB limitation
   - Document why couple gets different place (traveler fit scoring)
   - Effort: 15 min

### Post-Deployment Monitoring

- Monitor "course view" event rate
- Track user completion rates
- Collect feedback on travel time estimates
- Identify if users complain about insufficient place variation

### Phase 1C+ Enhancements (Evidence-Driven)

- If users request more place variety: Add more places with varied suitable_for tags
- If users complain about time estimates: Implement real travel time API
- If users want differentiated experiences: Implement explicit course variants by people_type

---

## Conclusion

**Journey Composer V0 is functionally complete and backward compatible**, but has **two critical issues** that must be resolved before production deployment:

1. **Semantic inconsistency** in travel duration range (P0-1)
2. **Marketing mismatch** on personalization (P0-2)

Both are fixable in ~45 minutes. The implementation logic is sound; the issues are in transparency and scoping.

**Recommended action:** Fix P0 issues, update documentation, then proceed to production deployment.

---

**Audit completed:** 2026-08-24  
**Status:** BLOCKED (P0 issues require resolution)  
**Next step:** Implement recommended fixes and rerun regression tests

