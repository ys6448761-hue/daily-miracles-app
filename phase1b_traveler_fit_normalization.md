# PHASE 1B: TRAVELER FIT SCORING DESIGN

## FAILED CASE ROOT CAUSE ANALYSIS

### CASE D: family_elderly + 120min → NO RESULTS

**Root cause:** Companion constraint filter

```javascript
// Current code (line 324):
if (people_type === "family_elderly" && companion_constraints?.has_elderly) {
  return suitableFor.includes("elderly_ok");  // ← MISMATCH
}
```

**The problem:**
- Code checks for `"elderly_ok"` in suitable_for
- Database contains `"elderly"` (6 places have it)
- Vocabulary mismatch causes all places to fail this filter

**Places that SHOULD pass but don't:**
- hyangiram, jaisan_park, jungang_market, lee_soon_shin_plaza, marine_park, odongdo

**Status for Phase 1B:** NOT FIXING (out of scope, existing safety constraint)

---

### CASE E: solo + wheelchair + 120min → NO RESULTS

**Root cause:** Companion constraint filter + missing data

```javascript
// Current code (line 327):
if (companion_constraints?.disability === "wheelchair") {
  return suitableFor.includes("wheelchair_accessible");  // ← NOT FOUND
}
```

**The problem:**
- Code checks for `"wheelchair_accessible"` in suitable_for array
- NO places have this tag in suitable_for
- Accessibility data exists in separate field: `accessibility_wheelchair_status` (all = "unknown")
- Wrong field being checked

**Status for Phase 1B:** NOT FIXING (existing safety constraint, not traveler fit)

**Note:** All places have `accessibility_wheelchair_status = "unknown"` which should be included with warning (fail-safe), not excluded. This is handled elsewhere in the code.

---

## SUITABLE_FOR VOCABULARY (ACTUAL)

**Distinct tags found in 12 places:**

```
1. family (10 places) — indicates family-suitable
2. kids_ok (10 places) — indicates kids acceptable
3. young_adults (5 places) — indicates young adult appeal
4. elderly (6 places) — indicates elderly-suitable
5. couples (1 place) — indicates couple appeal
6. groups (5 places) — indicates group activity
7. foodies (1 place) — indicates food enthusiast appeal
8. friends (1 place) — indicates friend group activity
9. pilgrimage (1 place) — indicates spiritual/pilgrimage appeal
```

---

## NORMALIZATION MAPPING (Phase 1B)

### Input → Normalized Tags

**people_type: "family_with_kids"**
```
Matches in suitable_for:
  → "family"
  → "kids_ok"
Score trigger: place has ANY of these tags
```

**people_type: "couple"**
```
Matches in suitable_for:
  → "couples"
Note: Very limited! Only 1 place (dolsan_nightscape)
Fallback: None specified (couples not well-represented)
```

**people_type: "solo"**
```
Matches in suitable_for:
  → None explicit (solo not in DB vocabulary)
  → Could infer from NOT having family/kids/couples/groups
Note: No positive signal for solo travelers
Action: No traveler_fit boost (neutral)
```

**people_type: "family_elderly"**
```
Matches in suitable_for:
  → "elderly"
Note: DIFFERENT FROM CODE (code checks "elderly_ok", DB has "elderly")
Phase 1B uses actual DB tag: "elderly"
```

---

## SCORING RULE (Phase 1B)

### Traveler Fit Score Calculation

**Inputs:**
- place.suitable_for (array)
- context.people_type (string)

**Output:**
- traveler_fit_score (number)

**Logic:**

```javascript
function calculateTravelerFitScore(place, context) {
  const suitableFor = place.suitable_for || [];
  const { people_type } = context;

  let score = 0;

  // Map people_type to expected tags
  const expectedTags = getNormalizedTags(people_type);

  // Count explicit matches
  const matchCount = expectedTags.filter(tag => suitableFor.includes(tag)).length;

  if (matchCount > 0) {
    score = matchCount * 10;  // 10 points per tag match
  }

  return score;
}

function getNormalizedTags(people_type) {
  const mapping = {
    family_with_kids: ["family", "kids_ok"],
    couple: ["couples"],
    solo: [],  // No explicit tags in DB
    family_elderly: ["elderly"]
  };
  return mapping[people_type] || [];
}
```

### Scoring examples:

```
family_with_kids + cablecar (family, kids_ok, young_adults):
  Expected tags: [family, kids_ok]
  Matches: 2 (family + kids_ok)
  Score: 20

family_with_kids + dolsan_nightscape (young_adults, couples, groups):
  Expected tags: [family, kids_ok]
  Matches: 0
  Score: 0

couple + dolsan_nightscape (young_adults, couples, groups):
  Expected tags: [couples]
  Matches: 1 (couples)
  Score: 10

solo + any place:
  Expected tags: []
  Matches: 0
  Score: 0 (no traveler fit boost)
```

---

## PLACEMENT IN PIPELINE

```
Filter sequence (unchanged):
  Safety
  → Live status
  → Time
  → Transport
  → Accessibility
  → Companion
  → Weather
  ↓
Candidates available (12 for successful cases)
  ↓
Emotion scoring (if WISH_TRAVELER)
  ↓
TRAVELER FIT SCORING (NEW Phase 1B) ← sorts by score
  ↓
Cluster diversity selection
  ↓
Top 3
```

---

## TRANSPARENCY LOGGING

**For debug output only (not in user-facing API):**

```
PLACE: cablecar
TRAVELER_INPUT: family_with_kids
NORMALIZED_EXPECTED_TAGS: ["family", "kids_ok"]
ACTUAL_PLACE_TAGS: ["family", "kids_ok", "young_adults"]
MATCHED_TAGS: ["family", "kids_ok"]
MATCH_COUNT: 2
TRAVELER_FIT_SCORE: 20
BASE_POSITION_IN_CANDIDATES: 1 (alphabetically first)
POSITION_AFTER_FIT_SORT: 1
POSITION_AFTER_CLUSTER_DIVERSITY: 1 (FINAL)
```

---

## EXPECTED BEHAVIOR

### Phase 1A Baseline (all cases identical):
```
cablecar (score: 20)
hyangiram (score: 0)
jaisan_park (score: 0)
```

### Phase 1B Expected with family_with_kids:
```
cablecar (score: 20) ← top
hyangiram (score: 0)
jaisan_park (score: 0)
```

### Phase 1B Expected with couple:
```
dolsan_nightscape (score: 10) ← top (only place with couples tag)
cablecar (score: 0)
hyangiram (score: 0)
```

### Phase 1B Expected with solo:
```
(unchanged from Phase 1A, no solo tags in DB)
cablecar
hyangiram
jaisan_park
```

---

## IMPORTANT CONSTRAINTS

1. **No emotion inference**
   - couple ≠ romantic (no emotion assumption)
   - family ≠ joy (no emotion assumption)
   - solo ≠ healing (no emotion assumption)

2. **Evidence-based only**
   - Score based only on suitable_for tags
   - No demographic stereotypes
   - No persona psychology

3. **Fallback safety**
   - Score is 0 if no match, not negative
   - Never filters places based on score
   - Low-score places still appear in top-3

4. **Deterministic**
   - Same input → same score
   - Score ties broken by database order
   - No randomness

5. **Backward compatible**
   - solo travelers get same results as Phase 1A (no tags = no boost)
   - no-people_type context remains unchanged

---

## MEASUREMENT PLAN

**Test cases:**

```
A: family_with_kids + car + 180
B: couple + car + 180
C: solo + car + 180
D: family_elderly + car + 180 (will fail due to existing elderly_ok mismatch)
E: family_with_kids + no-car + 240
F: couple + no-car + 240
G: no people_type + car + 180 (baseline)
```

**Expected variance:**

- Cases A, E: Same top-3 (family places score highest)
- Case B: Different top-3 (dolsan_nightscape has couples tag)
- Case C: Same as Phase 1A (no solo tags)
- Case D: FAILS (existing bug, not Phase 1B scope)
- Case G: Same as Phase 1A (no people_type input)

---

## REGRESSION VERIFICATION

Must verify:
- ✅ UNKNOWN semantics preserved
- ✅ food max 3
- ✅ cafes max 2
- ✅ benefits max 5
- ✅ identity unchanged
- ✅ credential flow unchanged
- ✅ cluster collision still 0%
- ✅ API backward compatible
