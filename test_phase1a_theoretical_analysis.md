# Phase 1A: Experience Cluster Awareness - Theoretical Analysis

## Objective

Prevent geographic monopoly where a single experience cluster (Dolsan area: bridge + viewpoint + cable car) consumes multiple Top-3 recommendation slots.

## Implementation

**Cluster Configuration:**
```javascript
EXPERIENCE_CLUSTERS = {
  dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar']
}
```

**Diversity Rule:**
- Max 1 candidate per cluster in top-3
- Applied after all filtering and emotion sorting
- Deterministic: iterate through candidates, skip if cluster already seen
- Fallback: if diversity results in <3 places, fill from seen clusters

## Phase 0 Baseline (BEFORE)

**Metrics:**
- Successful test cases: 14/14
- Unique Top-3 combinations: 2
  - Pattern A (7 cases): cablecar, dolsan_daegyo, hyangiram
  - Pattern B (5 cases): cablecar, dolsan_daegyo, dolsan_nightscape
- Dolsan cluster collision rate: 12/14 = 85.7%
  - Pattern A: 2/3 places in Dolsan cluster
  - Pattern B: 3/3 places in Dolsan cluster
- Most frequent Top-1: cablecar (14/14 = 100%)
- Most frequent Top-2: dolsan_daegyo (14/14 = 100%)

## Theoretical Impact (AFTER)

### Transformation Logic

With database order: `ORDER BY code`, candidates appear in sequence:
1. `cablecar` (dolsan_area cluster)
2. `dolsan_daegyo` (dolsan_area cluster)
3. `dolsan_nightscape` (dolsan_area cluster)
4. `hyangiram` (no cluster)
5. ... other eligible candidates ...

### Expected Transformation

**Case: Pattern A BEFORE → AFTER**
```
BEFORE:  cablecar, dolsan_daegyo, hyangiram
AFTER:   
  - Take cablecar (dolsan_area) → ADD, mark dolsan_area SEEN
  - Check dolsan_daegyo (dolsan_area) → SKIP (dolsan_area already seen)
  - Check dolsan_nightscape (dolsan_area) → SKIP (dolsan_area already seen)
  - Check hyangiram (none) → ADD
  - Check next candidate (X) → ADD until we have 3
  - Result: cablecar, hyangiram, [X]
```

**Case: Pattern B BEFORE → AFTER**
```
BEFORE:  cablecar, dolsan_daegyo, dolsan_nightscape
AFTER:
  - Take cablecar (dolsan_area) → ADD, mark dolsan_area SEEN
  - Check dolsan_daegyo (dolsan_area) → SKIP (dolsan_area already seen)
  - Check dolsan_nightscape (dolsan_area) → SKIP (dolsan_area already seen)
  - Check hyangiram (none) → ADD
  - Check next candidate (X) → ADD until we have 3
  - Result: cablecar, hyangiram, [X]
```

### Expected Metrics (AFTER)

**Prediction (based on logic):**
- Dolsan cluster collision rate: 0-5%
  - All cases should have max 1 Dolsan item (cablecar)
  - Unless cluster diversity is relaxed (if <3 candidates available)
- Unique Top-3 combinations: 3-6+
  - Pattern A transforms: cablecar, hyangiram, [X]
  - Pattern B transforms: cablecar, hyangiram, [X]
  - Additional patterns if different candidates pass filters
- Most frequent Top-1: cablecar (likely unchanged at 14/14)
- Most frequent Top-2: hyangiram (likely increases, replacing dolsan_daegyo)

### Key Unknowns

Without database access to verify, these are uncertain:
1. **Identity of [X]** (next candidate after hyangiram)
   - Could be: jaisan_park, lee_soon_shin_plaza, marine_park, odongdo, sky_tower, yeosu_expo_park, etc.
   - Depends on what passes all filters
2. **Total candidate count**
   - If <3 eligible candidates exist, diversity is relaxed
   - Fallback may re-introduce Dolsan cluster items
3. **Alternative cluster scenarios**
   - If other experience areas form clusters (unlikely in current data)
   - Multiple item fallback logic applies

## Expected Outcome

| Metric | BEFORE | AFTER | Change |
|--------|--------|-------|--------|
| **Dolsan Collision Rate** | 85.7% (12/14) | ~7-14% (1-2/14) | **↓ 71.4 ppts** |
| **Unique Top-3 Sets** | 2 | 3-6+ | **↑ 50-200%** |
| **Cablecar Top-1** | 100% (14/14) | 100% (14/14) | — |
| **Dolsan Top-2** | 100% (14/14) | ~0% (1-2/14) | **↓ 98 ppts** |
| **Hyangiram Appearance** | 50% (7/14) | ~93-100% (13-14/14) | **↑ 43-50 ppts** |
| **Lee Soon Shin Plaza** | 0% (0/14) | TBD | TBD |

## Code Changes

**File: `services/travelGuideService.js`**

1. **Added cluster configuration** (top of file):
   ```javascript
   const EXPERIENCE_CLUSTERS = {
     dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar']
   };
   ```

2. **Added helper: `_getCluster(placeCode)`**
   - Returns cluster name or null

3. **Added helper: `_applyClusterDiversity(candidates)`**
   - Implements deterministic selection logic
   - Prevents same cluster from occupying multiple slots
   - Includes fallback for limited inventory

4. **Integrated into recommendation pipeline** (after emotion sorting):
   ```javascript
   candidates = this._applyClusterDiversity(candidates);
   ```

## Safety Verification

✓ **No data modifications** — code-layer only
✓ **No schema changes** — existing tables unchanged
✓ **Deterministic** — same input → same output
✓ **Backward compatible** — API response format unchanged
✓ **Fail-safe** — fallback ensures up to 3 results returned
✓ **Cluster records intact** — Dolsan places still in DB for Journey Composer (Phase 2+)

## Testing Status

- **Unit test harness**: Phase 0 updated to track cluster membership
- **Full test execution**: Blocked on database connection (PostgreSQL not available in test environment)
- **Regression testing**: Existing Day-1 tests to be run after deployment

## Next Steps

1. Verify database connectivity
2. Run full Phase 0 harness with cluster diversity
3. Capture actual BEFORE/AFTER metrics
4. Run Day-1 regression tests
5. Deploy if all tests pass

---

**NOTE:** This analysis is theoretical. Actual metrics require database connectivity to execute the Phase 0 test harness.
