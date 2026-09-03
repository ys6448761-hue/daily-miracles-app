# Travel Guide V2 — Phase 2B Data Collection Report

**Date:** 2026-08-23  
**Phase:** 2B (Data Collection Planning)  
**Status:** ✅ COLLECTION TEMPLATES READY (No code changes, no DB writes)

---

## ORIGIN DEFINITIONS

### RAMADA_PLAZA_YEOSU

**Status:** REVIEW_REQUIRED ⚠️

**Current State:**
- GPS coordinates: UNKNOWN (not confirmed)
- Address: Partial (requires partner confirmation)
- Verification: BLOCKED until partner contact

**Required Actions:**
1. Contact Ramada property management
2. Confirm exact GPS coordinates (lat/lng)
3. Identify guest departure point for tours
4. Document in origin definitions

**Template:** `collections/phase2b_origin_definitions.json`

---

### YEOSU_EXPO_STATION

**Status:** SINGLE_SOURCE (using yeosu_expo_park coordinates as proxy)

**Current State:**
- Name: "여수역" (Yeosu Station)
- Coordinates: 34.75204, 127.74504 (from yeosu_expo_park)
- **CAUTION:** Location is approximate (park, not station)

**Verification Status:** SINGLE_SOURCE
- Source: travel_places.yeosu_expo_park (seeded data)
- Verified: 2026-08-21 (seed import date)
- Confidence: LOW (proxy location, not exact station exit)

**Required Actions:**
1. Verify actual train station location using Kakao/Naver official maps
2. Identify correct passenger boarding/exit points
3. Update coordinates if different from yeosu_expo_park

**Alternative:** Use YEOSU_EXPO_MAIN_GATE (same coordinates) for park entry

**Template:** `collections/phase2b_origin_definitions.json`

---

## ORIGIN VERIFICATION SOURCES

| Origin | Current Source | Verification Level | Action Needed |
|--------|---------------|--------------------|---------------|
| RAMADA_PLAZA_YEOSU | (none) | REVIEW_REQUIRED | Partner contact |
| YEOSU_EXPO_STATION | travel_places proxy | SINGLE_SOURCE | Map verification |

---

## RAMADA_TO_12 ROUTES

**Planned:** 12 routes from Ramada Plaza to core places (car only)

**Collection Template:** `collections/phase2b_car_routes_template.json`

**Routes:**
```
RAMADA → cablecar
RAMADA → dolsan_daegyo
RAMADA → dolsan_nightscape
RAMADA → hyangiram
RAMADA → jaisan_park
RAMADA → jungang_market
RAMADA → lee_soon_shin_plaza
RAMADA → marine_park
RAMADA → odongdo
RAMADA → romantic_pojangmacha
RAMADA → sky_tower
RAMADA → yeosu_expo_park
```

**Data Collection Plan:**

| Method | Source | Effort | Confidence |
|--------|--------|--------|------------|
| TaxiGo API | Routing service | 1-2 hours | SINGLE_SOURCE → CROSS_VERIFIED if Naver agrees |
| Ramada concierge | Partner | 30 min | SINGLE_SOURCE |
| Kakao/Naver Maps | Map services | 1 hour | SINGLE_SOURCE each |
| Field test | Actual drive | 3-4 hours | FIELD_VERIFIED |

**Verification Threshold:**
- Accept only CROSS_VERIFIED or FIELD_VERIFIED in production matrix
- Keep SINGLE_SOURCE in research collection for future reference

---

## EXPO_STATION_TO_12 ROUTES

**Planned:** 12 routes from Yeosu Expo Station to core places

**Collection Plan:**

| Destination | Transportation | Status | Notes |
|-------------|-----------------|--------|-------|
| All 12 places | Car (primary) | PLANNED | Use Kakao/Naver cross-verify |
| All 12 places | Bus (secondary) | DEFERRED | Requires Yeosu transit authority data |
| All 12 places | Walk (if <20min) | OPTIONAL | Field test only |

**Template:** `collections/phase2b_car_routes_template.json`

---

## VERIFICATION STATUS SUMMARY (Projected)

### CROSS_VERIFIED_COUNT
**Expected:** 12-18 routes
- Scenario: TaxiGo + Kakao + Naver all agree within ±5 minutes
- Action: These routes eligible for production matrix

### SINGLE_SOURCE_COUNT
**Expected:** 4-8 routes
- Scenario: Only one routing service available or other sources differ
- Action: Keep in research collection, requires Phase 2C decision

### UNKNOWN_COUNT
**Expected:** 0-4 routes (if collection not completed)
- Status: travel_time_minutes = null, travel_time_status = "unknown"
- Action: Defer recommendation for this route until data available

### CONFLICT_COUNT
**Expected:** 0-2 routes
- Scenario: TaxiGo shows 20 min, Naver shows 35 min
- Status: REVIEW_REQUIRED
- Action: Field test or partner confirmation needed

---

## SAFE FOR MATRIX (Production-Ready)

**Eligibility Criteria:**
- Verification status = CROSS_VERIFIED OR FIELD_VERIFIED
- Traffic context documented (typical, min, max)
- Source explicitly recorded
- No unresolved conflicts

**Typical Entry:**
```json
{
  "origin": "RAMADA_PLAZA_YEOSU",
  "destination": "cablecar",
  "transport_mode": "car",
  "typical_minutes": 18,
  "range_min": 15,
  "range_max": 25,
  "verification_status": "CROSS_VERIFIED",
  "sources": ["TaxiGo", "Kakao Maps", "Naver Maps"],
  "verified_at": "2026-08-24"
}
```

**Expected Phase 2B Completion:** 12-18 routes safe for matrix

---

## NOT SAFE FOR MATRIX (Research Only)

**Ineligible Conditions:**
- SINGLE_SOURCE (only one routing service)
- UNKNOWN (no data collected)
- REVIEW_REQUIRED (conflicting sources)
- Guessed/estimated values

**Example Research Entry:**
```json
{
  "origin": "RAMADA_PLAZA_YEOSU",
  "destination": "odongdo",
  "transport_mode": "car",
  "typical_minutes": 22,
  "range_min": null,
  "range_max": null,
  "verification_status": "SINGLE_SOURCE",
  "sources": ["TaxiGo only"],
  "verified_at": "2026-08-24",
  "note": "Needs Kakao/Naver verification before production use"
}
```

**Action:** Store in `collections/` for future Phase 2C decision

---

## PUBLIC TRANSPORT COLLECTION SCHEMA

**Status:** DESIGNED, NOT COLLECTED

**Schema Location:** `collections/phase2b_public_transport_schema.json`

**Deferred To:** Phase 2C

**Reason:**
1. Car routes sufficient for V1 launch
2. Yeosu transit authority data not yet available
3. Phase 1 already warns no-car travelers (bus status = UNKNOWN)
4. Can launch "bus_accessible_status = UNKNOWN + warning" first

**When Phase 2C Begins:**
- Contact Yeosu City Transit Authority for official bus routes
- Collect boarding/destination stops with lat/lng
- Verify accessibility (low-floor bus, wheelchair, stroller)
- Document service limitations (weekday, seasonal)

---

## TRAFFIC SEMANTICS EXAMPLES

### Example 1: Consistent Data
```json
{
  "route": "RAMADA → cablecar",
  "source_1": { "name": "TaxiGo", "minutes": 18 },
  "source_2": { "name": "Kakao Map", "minutes": 17 },
  "source_3": { "name": "Naver Map", "minutes": 19 },
  "verification": "CROSS_VERIFIED (within ±5)",
  "typical_minutes": 18,
  "range": "17-19",
  "safe_for_matrix": true
}
```

### Example 2: Conflicting Data
```json
{
  "route": "RAMADA → odongdo",
  "source_1": { "name": "TaxiGo", "minutes": 22 },
  "source_2": { "name": "Kakao Map", "minutes": 28 },
  "verification": "REVIEW_REQUIRED (±6 difference)",
  "action_needed": "Field test or partner confirmation",
  "safe_for_matrix": false
}
```

### Example 3: Partial Data
```json
{
  "route": "RAMADA → jaisan_park",
  "source": { "name": "Concierge estimate", "minutes": 15 },
  "verification": "SINGLE_SOURCE",
  "traffic_context": "not specified",
  "action_needed": "Collect from map APIs to cross-verify",
  "safe_for_matrix": false
}
```

---

## COLLECTION TIMELINE (Phase 2B Expected)

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| 1 | Partner contact: Ramada GPS coords | Operations | Confirmed coordinates |
| 1 | Map verification: Yeosu Expo Station | Research | Verified station location |
| 1-2 | TaxiGo/Kakao/Naver API queries (24 routes) | Data | Raw travel time data |
| 2 | Concierge confirmation (Ramada) | Partner | Secondary source comparison |
| 2-3 | Cross-verification & conflict resolution | Analyst | CROSS_VERIFIED routes identified |
| 3 | Field test (optional, 3-4 highest-variance routes) | Operations | FIELD_VERIFIED routes |
| 3 | Assemble phase2b_collection_results.json | Data | Final collection report |

---

## NEXT HANDOVER (Phase 2C)

**Phase 2B Output to Phase 2C:**
- ✅ Origin definitions (Ramada, Expo confirmed)
- ✅ 24 car routes collected and verified
- ✅ Public transport schema designed
- ✅ Matrix-eligible routes documented
- ✅ Conflicts identified and resolved

**Phase 2C Input Requirements:**
```
For each CROSS_VERIFIED or FIELD_VERIFIED route:
  origin_code
  destination_code
  typical_minutes (not null)
  range_min
  range_max
  verification_status ("CROSS_VERIFIED" or "FIELD_VERIFIED")
  sources (array of source names)
  verified_at (ISO date)

→ Assemble into config/travelGuideMatrix.json
→ Implement matrix lookup in _estimateTravelTime()
→ Test that unknown routes stay unknown
```

---

## PROPOSED PHASE 2C

**Objective:** Implement travel time matrix from Phase 2B data

**Steps:**
1. Review Phase 2B collection results
2. Create config/travelGuideMatrix.json with CROSS_VERIFIED + FIELD_VERIFIED routes only
3. Implement matrix lookup in services/travelGuideService.js `_estimateTravelTime()`
4. Test:
   - ✅ Verified routes return correct time
   - ✅ Unknown routes stay null + "unknown"
   - ✅ Filter behavior preserves Phase 1 semantics
5. Deploy Phase 2C to production
6. Monitor travel time accuracy against actual user feedback

**No-Car Travelers:**
- Continue Phase 1 behavior (bus status = UNKNOWN + warning)
- Defer to Phase 2D when Yeosu transit data available

---

## FILES CREATED (Phase 2B)

```
collections/phase2b_origin_definitions.json
  └─ Origin location specs for Ramada, Expo
  └─ Verification status and sources

collections/phase2b_car_routes_template.json
  └─ Template for 24-route data collection
  └─ Ramada (12 routes) + Expo (12 routes)
  └─ Fields: sources, traffic context, verification status

collections/phase2b_public_transport_schema.json
  └─ Schema design for bus routes (Phase 2C+)
  └─ Field structure (routing options, accessibility, transfers)
  └─ Deferral rationale

PHASE2B_DATA_COLLECTION_REPORT.md
  └─ This document
```

---

## CRITICAL RULES PRESERVED

✅ **Phase 1 UNKNOWN Semantics:**
- bus_accessible_status = "unknown" stays UNKNOWN (not ❌)
- accessibility_wheelchair_status = "unknown" stays UNKNOWN
- travel_time_minutes = null when status = "unknown"
- No null → 0 conversion
- No UNKNOWN → VERIFIED_NO conversion

✅ **Verification Levels:**
- UNKNOWN: No data
- SINGLE_SOURCE: One routing service
- CROSS_VERIFIED: 2+ sources within ±5 min
- FIELD_VERIFIED: Actual tested drive
- REVIEW_REQUIRED: Conflicting sources

✅ **Matrix Eligibility:**
- Only CROSS_VERIFIED or FIELD_VERIFIED enter production
- SINGLE_SOURCE stays in research collection
- UNKNOWN stays null

---

**✅ PHASE 2B COLLECTION READY**

**No code changes. No DB writes. No migrations. No commits.**

**Awaiting:** Partner confirmation (Ramada GPS) → Collection execution (Phase 2B)

