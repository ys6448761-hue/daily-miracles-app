# FOLLOW-UP ISSUE: Companion Filter Data Dictionary Mismatch

**Issue Type:** BUG - Data Dictionary Vocabulary Mismatch  
**Component:** Travel Guide Service - Companion Constraints Filter  
**Severity:** High (causes NO RESULTS for family_elderly travelers)  
**Status:** DOCUMENTED (not fixed in Phase 1A/1B, requires separate task)  
**Created:** 2026-08-24

---

## SUMMARY

The `_passesCompanion()` filter checks for `"elderly_ok"` in the `suitable_for` array, but the production database contains the tag `"elderly"` instead. This vocabulary mismatch causes all places to fail the filter for family_elderly travelers, resulting in NO RECOMMENDATIONS.

---

## IMPACT

**Affected travelers:** family_elderly with has_elderly=true  
**Test cases failing:** CASE D (6/6 attempted runs returned 0 results)  
**Places incorrectly filtered:** 6 places have the correct tag but fail the check

```
Places that SHOULD match but don't:
- hyangiram (향일암)
- jaisan_park (자산공원)
- jungang_market (중앙시장)
- lee_soon_shin_plaza (이순신광장)
- marine_park (해양공원)
- odongdo (오동도)
```

---

## ROOT CAUSE

**File:** `services/travelGuideService.js`  
**Line:** 324  
**Current code:**

```javascript
if (people_type === "family_elderly" && companion_constraints?.has_elderly) {
  return suitableFor.includes("elderly_ok");  // ← VOCABULARY MISMATCH
}
```

**Actual DB vocabulary:** `"elderly"` (not `"elderly_ok"`)

**Verification:**

```sql
SELECT code, suitable_for
FROM travel_places
WHERE country_code='KR' AND city_code='YEOSU'
-- Result: Places have "elderly" tag, not "elderly_ok"
```

---

## CLASSIFICATION

```
Category: DATA_DICTIONARY_VOCABULARY_MISMATCH
Scope: Travel Guide Service companion filtering
Root: Code was written with expected tag names that don't match DB reality
Type: Logic bug (wrong vocabulary, not missing data)
Severity: High (blocks entire traveler type)
```

---

## WHY NOT FIXED IN PHASE 1B

User instruction (Phase 1B brief):

> "Do NOT loosen safety/accessibility constraints merely to return results."

**Phase 1B scope:** Add evidence-based traveler fit scoring (optional personalization)  
**This bug scope:** Fix existing safety constraint (not Phase 1B)

**Rationale for separate task:**
1. Safety constraints are critical (not personalization)
2. Requires data dictionary audit across all companion filters
3. May indicate similar mismatches elsewhere
4. Needs careful review before changing (not rushed in personalization phase)

---

## NEXT SAFE ACTION

**Step 1: Audit all companion filter vocabulary**

Check all references to expected suitable_for tags:

```javascript
grep -n "suitableFor.includes" services/travelGuideService.js
```

Current references:
- Line 321: `"kids_ok"` ← Verify this matches DB
- Line 324: `"elderly_ok"` ← MISMATCH (should be "elderly")
- Line 327: `"wheelchair_accessible"` ← Verify this matches DB

**Step 2: Compare against actual DB vocabulary**

```sql
SELECT DISTINCT tag
FROM (
  SELECT unnest(suitable_for) as tag
  FROM travel_places
  WHERE country_code='KR' AND city_code='YEOSU'
) t
ORDER BY tag;
```

Expected result:
```
couples
elderly        ← Not "elderly_ok"
family
foodies
friends
groups
kids_ok        ← Verify correct
pilgrimage
young_adults
```

**Step 3: Create normalization mapping (non-destructive)**

Do NOT change DB. Add application-layer mapping:

```javascript
// Normalize companion filter vocabulary
function normalizeElderlySuitability(place) {
  const suitableFor = place.suitable_for || [];
  // Check both expected and actual tags
  return suitableFor.includes("elderly_ok") || suitableFor.includes("elderly");
}
```

**Step 4: Update filter logic**

Replace hard-coded tag checks with normalization:

```javascript
// BEFORE:
return suitableFor.includes("elderly_ok");

// AFTER (with normalization):
return this._isSuitableForElderly(place);

// New method:
_isSuitableForElderly(place) {
  const suitableFor = place.suitable_for || [];
  return suitableFor.includes("elderly_ok") || 
         suitableFor.includes("elderly");
}
```

**Step 5: Test thoroughly**

Verify family_elderly cases now return results:

```bash
node test_harness_phase1b.js
# CASE D should now return 6 places instead of 0
```

**Step 6: Create follow-up safety audit**

Check if similar mismatches exist in:
- Transport accessibility checks
- Accessibility checks
- Weather suitability checks
- Other companion constraints

---

## ACCEPTANCE CRITERIA FOR FIX

- [ ] All 6 elderly-suitable places return in family_elderly recommendations
- [ ] No unverified or unsafe assumptions made
- [ ] Existing safety requirements unchanged
- [ ] Other travelers (family_with_kids, couple, solo) unaffected
- [ ] All regression tests still pass
- [ ] Companion constraint semantics verified against DB

---

## DO NOT ACCEPT IF...

- ❌ Safety constraint is weakened
- ❌ Unverified places are added to recommendations
- ❌ Accessibility checks are bypassed
- ❌ Other traveler types are affected
- ❌ Code creates negative stereotypes about elderly travelers

---

## DOCUMENTATION

This issue was discovered during Phase 1A/1B validation:

**Phase 1A Commit:** cefef81 (cluster diversity)  
**Phase 1B Commit:** 8252169 (traveler fit scoring)  
**Discovered:** 2026-08-24 during family_elderly test case analysis  
**Audit Scripts:**
- audit_suitable_for_tags.js
- audit_failed_cases.js
- phase1b_traveler_fit_normalization.md

---

**STATUS:** DOCUMENTED FOR FUTURE TASK  
**PRIORITY:** HIGH (blocks family_elderly travelers)  
**TIMELINE:** Can be fixed independently after Phase 1B validation  
**BLOCKED BY:** Nothing (no other work depends on this fix)
