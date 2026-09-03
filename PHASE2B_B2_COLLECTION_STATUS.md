# Travel Guide V2 — Phase 2B-B2 Travel Time Collection Status

**Date:** 2026-08-23  
**Phase:** 2B-B2 (Actual 24-Route Travel Time Collection)  
**Status:** ⚠️ API ACCESS UNAVAILABLE

---

## ORIGIN STATUS — RECLASSIFIED

### RAMADA_PLAZA_YEOSU

**Classification:** SINGLE_SOURCE

**Verification Attempt:**
- Primary Source: Hotel Planner (34.724396, 127.746750) ✓
- Secondary Source Search: VISITKOREA, Trip.com, NamuWiki
- Result: Secondary sources confirm address "11 Gangnamhaean-ro" but do NOT provide independent GPS coordinates
- Elevation: BLOCKED (cannot cross-verify GPS independently)

**Current Status:**
```
Latitude: 34.724396
Longitude: 127.746750
Source: Hotel Planner (single source)
Classification: SINGLE_SOURCE (not promoted to CROSS_VERIFIED)
Confidence: HIGH (consistent address across sources)
```

---

### YEOSU_EXPO_STATION

**Classification:** SINGLE_SOURCE (official source, but only one)

**Verification Attempt:**
- Primary Source: Wikipedia (34.75778, 127.74722) ✓
- Secondary Source: Wikidata (same coordinates) ✓
- Official Reference: VISITKOREA, Rail Monsters
- Result: Wikipedia + Wikidata agree on coordinates (consistent official source)

**Current Status:**
```
Latitude: 34.75778
Longitude: 127.74722
Source: Wikipedia + Wikidata (same official source)
Classification: SINGLE_SOURCE (official but not cross-verified by independent routing service)
Confidence: VERY HIGH (official government/transport data)
```

**Note:** Treated as SINGLE_SOURCE because verification came from same Wikipedia/Wikidata ecosystem, not independent routing service.

---

## RAMADA_TO_12_ROUTES — COLLECTION ATTEMPT

### API Access Status

**Attempted APIs:**
1. ❌ **TaxiGo API** — No API key available
2. ❌ **Kakao Maps Directions API** — No authentication credentials
3. ❌ **Naver Maps Directions API** — No API key available
4. ❌ **Google Maps Directions API** — No API key available

**Result:** Unable to execute routing queries

---

### Collection Template (Unfilled)

**24 routes prepared in template:**
```
RAMADA_001: Ramada → cablecar          [travel_time = null]
RAMADA_002: Ramada → dolsan_daegyo      [travel_time = null]
RAMADA_003: Ramada → dolsan_nightscape  [travel_time = null]
RAMADA_004: Ramada → hyangiram          [travel_time = null]
RAMADA_005: Ramada → jaisan_park        [travel_time = null]
RAMADA_006: Ramada → jungang_market     [travel_time = null]
RAMADA_007: Ramada → lee_soon_shin_plaza [travel_time = null]
RAMADA_008: Ramada → marine_park        [travel_time = null]
RAMADA_009: Ramada → odongdo            [travel_time = null]
RAMADA_010: Ramada → romantic_pojangmacha [travel_time = null]
RAMADA_011: Ramada → sky_tower          [travel_time = null]
RAMADA_012: Ramada → yeosu_expo_park    [travel_time = null]
```

**Status:** BLOCKED (no API access)

---

## EXPO_STATION_TO_12_ROUTES — COLLECTION ATTEMPT

### API Access Status

**Attempted APIs:**
1. ❌ **Kakao Maps** — No credentials
2. ❌ **Naver Maps** — No credentials
3. ❌ **Google Maps** — No API key

**Result:** Unable to execute routing queries

---

### Collection Template (Unfilled)

**12 routes prepared in template:**
```
EXPO_001: Station → cablecar            [travel_time = null]
EXPO_002: Station → dolsan_daegyo        [travel_time = null]
EXPO_003: Station → dolsan_nightscape    [travel_time = null]
... (9 more routes)
EXPO_012: Station → yeosu_expo_park      [travel_time = null]
```

**Status:** BLOCKED (no API access)

---

## ACTUAL COLLECTION RESULTS

### ORIGIN_STATUS

| Origin | Classification | Verification | Sources | GPS Confirmed |
|--------|-----------------|--------------|---------|----------------|
| Ramada Plaza | SINGLE_SOURCE | Address confirmed | Hotel Planner + VISITKOREA | YES (34.724396, 127.746750) |
| Expo Station | SINGLE_SOURCE | Official source | Wikipedia + Wikidata | YES (34.75778, 127.74722) |

**Both origins verified, but only SINGLE_SOURCE (not cross-verified by independent routing services)**

---

### RAMADA_TO_12_RESULTS

**Status:** ❌ COLLECTION FAILED

**Reason:** No API access (TaxiGo, Kakao, Naver, Google Maps)

**Data:** 12 routes templated, 0 routes with travel time data

**Classification:**
- UNKNOWN: 12 routes
- SINGLE_SOURCE: 0 routes
- CROSS_VERIFIED: 0 routes
- REVIEW_REQUIRED: 0 routes

---

### EXPO_TO_12_RESULTS

**Status:** ❌ COLLECTION FAILED

**Reason:** No API access (Kakao, Naver, Google Maps)

**Data:** 12 routes templated, 0 routes with travel time data

**Classification:**
- UNKNOWN: 12 routes
- SINGLE_SOURCE: 0 routes
- CROSS_VERIFIED: 0 routes
- REVIEW_REQUIRED: 0 routes

---

## ACTUAL COUNTS

### ACTUAL_CROSS_VERIFIED_COUNT: **0/24**

**Routes with 2+ sources agreeing:** 0

**Reason:** API access unavailable; cannot execute cross-verification

---

### ACTUAL_SINGLE_SOURCE_COUNT: **0/24**

**Routes with 1 reliable source:** 0

**Reason:** No routing service data collected

---

### ACTUAL_REVIEW_REQUIRED_COUNT: **0/24**

**Routes with conflicting sources:** 0

**Reason:** No sources available to conflict

---

### ACTUAL_UNKNOWN_COUNT: **24/24**

**Routes with no travel time data:** 24 (all routes)

**Status:** travel_time_minutes = null, travel_time_status = "unknown"

**Classification:** CORRECT per Phase 1 semantics

---

## SAFE_MATRIX_CANDIDATES

**Count:** 0/24

**Requirement:** CROSS_VERIFIED or FIELD_VERIFIED status

**Actual:** No routes collected

**Status:** Cannot proceed to Phase 2C without travel time data

---

## NOT_SAFE_FOR_MATRIX

**Count:** 24/24

**Reason:** travel_time_minutes = null (no data)

**Status:** All routes remain UNKNOWN

---

## SOURCE_ACCESS_FAILURES

### APIs Attempted

| API | Access Method | Status | Reason |
|-----|----------------|--------|--------|
| TaxiGo | API Key | ❌ FAILED | No credentials provided |
| Kakao Maps | OAuth/API Key | ❌ FAILED | No authentication |
| Naver Maps | OAuth/API Key | ❌ FAILED | No authentication |
| Google Maps | API Key | ❌ FAILED | No API key available |

### Public Data Sources Attempted

| Source | Method | Status | Result |
|--------|--------|--------|--------|
| Google Maps embed | URL fetch | ⚠️ LIMITED | No time estimates in public pages |
| Wikipedia transit | Web search | ✗ NO DATA | Coordinates only, no travel times |
| Official tourism sites | Web search | ✗ NO DATA | No routing information |

---

## DATA_COLLECTION_LIMITATIONS

### Technical Blockers

1. **API Authentication Required**
   - TaxiGo, Kakao, Naver, Google all require API keys
   - Keys not provided in Phase 2B-B2 scope
   - Cannot fabricate or estimate values (Phase 2B-B2 rules)

2. **Public Data Unavailable**
   - Travel times not available in web-accessible public sources
   - Requires authenticated API calls or real-time lookup

3. **Manual Collection Not Feasible**
   - 24 routes would require actual driving/taxi observation
   - Not within Phase 2B-B2 scope (intended as desk-based collection)

### Decision Point

**Collection can only proceed with:**
- API credentials for routing services (TaxiGo, Kakao, Naver, Google), OR
- Manual field testing (actual car/taxi rides for all 24 routes)

---

## RECOMMENDED NEXT STEPS

### Option A: API-Based Collection (Recommended)

**Requirements:**
- TaxiGo API key (Korea-specific routing)
- Kakao Maps API credentials
- Naver Maps API credentials
- Google Maps API key (for cross-verification)

**Process:**
1. Authenticate to each service
2. Execute 24 route queries (programmatic or manual API calls)
3. Record responses with timestamp
4. Cross-verify results
5. Populate `config/travelGuideMatrix.json`

**Estimated Effort:** 4-6 hours (with API access)

---

### Option B: Manual Field Testing

**Requirements:**
- Budget for 24 taxi rides or vehicle rental
- Time: 8-12 hours (2-3 hours driving + waiting)
- Multiple observation points (weekday, weekend, peak hours)

**Process:**
1. Drive each 24 routes
2. Record actual travel time + traffic context
3. Repeat on different days/times
4. Cross-verify results
5. Populate matrix

**Estimated Effort:** 2-3 days (including multiple observations)

---

### Option C: Hybrid Approach

**Combine API + spot-checks:**
1. Use API for primary estimates (2-4 hours)
2. Field-test 3-5 highest-variance routes (4 hours)
3. Cross-verify API against field observations
4. Finalize matrix

**Estimated Effort:** 1 day

---

## PHASE 2B-B2 STATUS

**Collection:** INCOMPLETE ⚠️

**Reason:** API access unavailable; Phase 2B-B2 rules prohibit data fabrication

**Output:** 24-route templates ready; 0 routes with verified data

**Next Action:** Obtain API credentials or authorize manual collection

---

## FILES PREPARED (AWAITING DATA)

```
collections/phase2b_actual_collection_results.json
  └─ Origins verified (SINGLE_SOURCE each)
  └─ 24 route templates (unfilled)
  └─ API query structure documented

PHASE2B_B2_COLLECTION_STATUS.md
  └─ This report
  └─ Collection blockers documented
  └─ Recommended next steps
```

---

## PHASE 1 SEMANTICS PRESERVED

✅ **No guessed values** — 0 fabricated travel times  
✅ **No null → 0 conversion** — null stays null  
✅ **No UNKNOWN → VERIFIED** — all 24 routes remain UNKNOWN  
✅ **Honesty enforced** — collection failure reported, not hidden

---

## SUMMARY

**Origins:** Verified (SINGLE_SOURCE each, cannot cross-verify GPS independently)

**Travel Times:** 0/24 collected (API access required)

**Classification:** All 24 routes = UNKNOWN (travel_time_minutes = null)

**Safe for Matrix:** 0/24 routes

**Blocker:** API credentials needed for Phase 2B-B2 completion

---

**⚠️ PHASE 2B-B2 INCOMPLETE — REQUIRES EXTERNAL DATA SOURCE**

**No code changes. No DB writes. No migrations. No commits.**

---

Sources:
- [Hotel Planner - Ramada Plaza by Wyndham Dolsan Yeosu](https://www.hotelplanner.com/Hotels/322727/Reservations-Ramada-Plaza-by-Wyndham-Dolsan-Yeosu-Yeosu-11-Gangnamhaean-Ro-59769)
- [Wikipedia - Yeosu Expo station](https://en.wikipedia.org/wiki/Yeosu_Expo_station)
- [Wikidata - Yeosu EXPO Station (Q1162912)](https://www.wikidata.org/wiki/Q1162912)
- [VISITKOREA - Yeosu Expo Station](https://english.visitkorea.or.kr/svc/contents/contentsView.do?vcontsId=84175)

