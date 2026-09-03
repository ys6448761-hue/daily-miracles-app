# Travel Guide V2 — Phase 2A Audit Report

**Date:** 2026-08-23  
**Mode:** READ-ONLY Investigation (No code changes, no migrations, no DB writes)  
**Status:** ✅ AUDIT COMPLETE

---

## SUMMARY

Phase 2A prepares infrastructure for Phase 2B (Verified mobility data collection).

**Key Finding:** Ramada Plaza is NOT in travel_places; requires separate origin model.

All data audits preserve Phase 1 UNKNOWN semantics. No schema changes proposed.

---

## FINDINGS

### STEP 1 — CANONICAL ORIGIN AUDIT

**Current Origin Model (Phase 1B TypeScript):**
```typescript
origin?: {
  type: "partner_entry" | "station_entry" | "previous_place" | "manual_location" | "unknown";
  place_code?: string;        // If type=previous_place → links to travel_places.code
  lat?: number;               // If type=manual_location
  lng?: number;
  label: string;              // "Ramada Plaza", "Yeosu Expo Station", etc.
  source?: string;            // "QR_verified", "GPS_confirmed", "previous_session", "inferred"
}
```

**Current Status:**

| Origin | Model | Location | Status |
|--------|-------|----------|--------|
| Ramada Plaza | Needed: partner_entry (separate) | NOT in travel_places | Missing |
| Yeosu Expo Station | Hybrid: station_entry OR place_code | IS in travel_places (yeosu_expo_park) | ✅ Available |
| Previous Place | place_code reference | Links to travel_places.code | ✅ Ready |
| Manual/GPS | lat/lng | Free coordinates | ✅ Ready |
| Unknown | type='unknown' | Default if unspecified | ✅ Ready |

**Recommendation:**

**Option A: Hybrid Model (Recommended)**
- Ramada Plaza: Explicit origin record (NOT travel_places)
  ```json
  {
    type: "partner_entry",
    origin_id: "RAMADA_PLAZA_YEOSU",
    label: "여수 라마다 플라자",
    lat: 34.741234,
    lng: 127.735678
  }
  ```
- Yeosu Expo Station: Can be EITHER
  - `type: "station_entry", origin_id: "YEOSU_EXPO_STATION"`
  - OR `type: "previous_place", place_code: "yeosu_expo_park"`
  
**Rationale:**
- Separates hotel/station (partner locations) from tourist attractions
- Prevents mixing origin IDs with travel_places IDs
- Allows flexible partner locations (future hotels, entrances)
- travel_places.code stays for attractions only (12 core places)

---

### STEP 2 — CORE PLACE TRUTH

**Query Result: 12/12 Core Places Verified**

| Place Code | Name | Stay | Car | Bus | Wheelchair | Stroller |
|------------|------|------|-----|-----|-----------|----------|
| cablecar | 케이블카 | 45min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| dolsan_daegyo | 돌산대교 | 30min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| dolsan_nightscape | 돌산 야경 | 45min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| hyangiram | 향일암 | 90min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| jaisan_park | 자산공원 | 30min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| jungang_market | 중앙시장 | 75min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| lee_soon_shin_plaza | 이순신광장 | 45min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| marine_park | 해양공원 | 75min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| odongdo | 오동도 | 120min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| romantic_pojangmacha | 낭만포차거리 | 60min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| sky_tower | 스카이타워 | 60min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |
| yeosu_expo_park | 여수엑스포장 | 120min | ✓ | ❌ unknown | ❌ unknown | ❌ unknown |

**Data Completeness:**
- ✅ place_code: verified (unique, canonical)
- ✅ name_ko: verified
- ✅ lat/lng: verified
- ✅ avg_stay_minutes: verified
- ✅ access_by_car: all true (default)
- ❌ bus_accessible_status: ALL unknown (no routes mapped)
- ❌ wheelchair_accessibility_status: ALL unknown (no verification)
- ❌ stroller_accessibility_status: ALL unknown (no verification)

**Phase 1 UNKNOWN Preserved:** ✅
- No false defaults
- All unknown statuses persist indefinitely
- No time-based conversion to verified_no

---

### STEP 3 — EXISTING TRAVEL TIME STORAGE

**Audit Result:**

**No dedicated travel_time_matrix table exists.**

**Existing Travel-Related Tables:**
```
- travel_places         (core: 12 records, schema ready)
- travel_restaurants    (0 records, schema empty)
- travel_live_status    (12 records, all 'unknown')
- travel_guide_sessions (24 records, context = JSONB)
- travel_guide_events   (67 records)
- star_travel_log       (legacy, may reference old journey system)
- star_travel_logs      (legacy, may reference old journey system)
```

**Current Capability:**

travel_guide_sessions stores context as JSONB:
```sql
INSERT INTO travel_guide_sessions (session_id, context, ...)
VALUES ('uuid', '{"origin": {...}, "entry_point": "..."}', ...)
```

This allows travel time to be COMPUTED at recommendation time from:
- `context.origin.lat/lng` (if manual_location)
- `context.origin.place_code` (if previous_place)
- default partner origin (Ramada, Expo)

**But does NOT persist computed travel times.**

---

### STEP 4 — BUS DATA MODEL AUDIT

**Data Needed for No-Car Travelers (Future):**

```
For each origin → destination pair by bus:

- origin_code          (RAMADA_PLAZA_YEOSU, etc.)
- destination_code     (yeosu_expo_park, etc.)
- bus_route_number     (Yeosu city line 1, 2, etc.)
- boarding_stop        (name, address, lat/lng)
- destination_stop     (name, address, lat/lng)
- expected_ride_minutes (verified time, not estimated)
- walking_distance_m   (boarding point to start)
- walking_time_min     (estimated from distance)
- transfers_required   (boolean)
- accessibility_notes  (elevator, low-floor, etc.)
- service_limitations  (weekday only, no night service, etc.)
- source               (Yeosu City Transit Authority, OpenStreetMap)
- verified_at          (date of verification)
- confidence_level     ("high" / "medium" / "low")
```

**Current Schema Status:**

**No dedicated bus_routes table exists.**

**Options:**

| Option | Storage | Pros | Cons |
|--------|---------|------|------|
| A. New travel_bus_routes table | Structured | Clear schema, indexed | Creates new table |
| B. Extend travel_places | JSONB bus_details | Minimal schema change | Nests complex data |
| C. Key-value store (config) | JSON file | Fast lookup | Not queryable, stale |
| D. Reference external API | (future) | Always current | API dependency, latency |

**Recommendation:** **Option A (New Table)**
- Supports future query optimization
- Allows verification tracking
- Separates concerns (places vs. routes)
- Ready when Yeosu transit authority provides data

---

### STEP 5 — DATA COLLECTION TEMPLATE

**Ready for Phase 2B Implementation**

```
Collection scope:

A. Ramada Plaza → 12 core places (by car/taxi)
B. Yeosu Expo Station → 12 core places (by car/bus/walk)
C. [Future] Place-to-place connections (selected pairs)

Template Fields:

origin_code
origin_name_ko
origin_lat
origin_lng
destination_code
destination_name_ko
destination_lat
destination_lng
transport_mode              ("car" | "bus" | "walk" | "combined")
travel_time_minutes         (number, NOT estimated)
travel_time_confidence      ("verified" | "average" | "estimate")
source                      (Ramada concierge, Yeosu transit, Google Maps, local test)
source_type                 ("official" | "average_data" | "field_test" | "api_lookup")
collection_date             (YYYY-MM-DD)
verification_method         (TaxiGo, Kakao Map, Naver, local taxi quote, field drive)
verification_status         ("verified" | "preliminary" | "conflicting")
notes                       (weather, traffic, seasonal variation, special conditions)
```

**Data Entry Rules:**

| Condition | Value | Status |
|-----------|-------|--------|
| Verified by official source | number | VERIFIED |
| Multiple sources agree | number | VERIFIED |
| Single field test | number | PRELIMINARY |
| No source yet | null | UNKNOWN |
| Sources conflict | "REVIEW_REQUIRED" | CONFLICT |
| Pure estimate/guess | DO NOT ENTER | BLOCKED |

---

### STEP 6 — PHASE 1 UNKNOWN SEMANTICS VERIFICATION

**All UNKNOWN values preserved at production DB:**

```
travel_live_status:
  status = 'unknown'   (all 12 places)

travel_places:
  bus_accessible_status = 'unknown'          (all 12 places)
  accessibility_wheelchair_status = 'unknown' (all 12 places)
  accessibility_stroller_status = 'unknown'   (all 12 places)

travel_guide_sessions:
  travel_time_status = 'unknown' (from Phase 1B code)
  total_required_time_status = 'unknown' (from Phase 1B code)
```

**Rule Compliance:** ✅

- ✅ UNKNOWN is NOT converted to false/0/default
- ✅ Status field disambiguates unknown vs. verified
- ✅ No time-based conversion to verified_no
- ✅ Filters include unknown with warning (Phase 1)
- ✅ travel_time_minutes = null (not 0)

---

## SCHEMA GAPS

| Gap | Current State | Phase 2B Impact | Recommendation |
|-----|---------------|-----------------|-----------------|
| Ramada Plaza location | NOT in travel_places | Origin model needs separation | Create partner_origins or extend origin context |
| Bus routes | No table | No bus data queryable | Create travel_bus_routes (when data exists) |
| Travel time persistence | No matrix table | Computed at runtime only | Defer until matrix data collected |
| Travel time matrix | No matrix config | 0 all travel times | Create config/travelGuideMatrix.json (with verified data only) |
| Accessibility verification | Status field exists | P1 requirements met | No schema change needed |

---

## COLLECTION TEMPLATE (Ready)

### Ramada Plaza → 12 Core Places

```json
{
  "origin": {
    "code": "RAMADA_PLAZA_YEOSU",
    "name_ko": "여수 라마다 플라자",
    "lat": 34.7412,
    "lng": 127.7357
  },
  "routes": [
    {
      "destination_code": "cablecar",
      "destination_name_ko": "케이블카",
      "transport_mode": "car",
      "travel_time_minutes": null,
      "source": "NOT_YET_COLLECTED",
      "verification_status": "unknown"
    },
    ...
  ]
}
```

---

## RISKS

| Risk | Severity | Impact | Mitigation |
|------|----------|--------|-----------|
| Ramada location not officially confirmed | MEDIUM | Wrong origin offset | Verify address with partner |
| Yeosu bus routes unstable (summer construction) | MEDIUM | Verified data becomes invalid quickly | Document seasonal variations |
| External API dependency (TaxiGo, Kakao) | LOW | Outdated data if not refreshed | Schedule monthly re-verification |
| No field test budget | HIGH | Only API-based estimates | Advocate for 1-2 field tests |
| Phase 1 unknown filters too permissive | LOW | Users still recommended to unverified places | Frontend adds explicit warnings (not tech problem) |

---

## RECOMMENDED PHASE 2B

**Phase 2B: Collection Readiness** (2-3 days)

1. **Confirm Ramada Partner Details**
   - Official address: verify with partner
   - GPS coordinates: 정확한 위치 확인
   - Partner contact: 이동시간 데이터 제공 가능성

2. **Collect Ramada → 12 Places (Car)**
   - Method: TaxiGo API (1-2 hours)
   - Field test: Ramada concierge quote (30 min)
   - Result: 12 verified travel times

3. **Collect Yeosu Expo → 12 Places (Bus + Car)**
   - Method: Yeosu city transit authority + Kakao Map
   - Limitation: Bus routes unverified (mark "preliminary")
   - Result: 12+ route options per place

4. **Assemble travel_time_matrix.json**
   - Format: origin → destination lookup
   - Version control: verification_date tracked
   - Fallback: travel_time_status = "unknown" for any missing route

5. **Do NOT:**
   - ❌ Guess travel times
   - ❌ Use default estimates as verified
   - ❌ Populate without source documentation
   - ❌ Modify UNKNOWN semantics
   - ❌ Create DB tables without data collection plan

---

## FILES TO CREATE (Phase 2B)

```
config/travelGuideMatrix.json
  - Ramada → 12 places (car)
  - Yeosu Expo → 12 places (bus + car)
  - Format: { meta: {...}, routes: {...} }
  - No guessed values, all sourced

database/migrations/207_travel_origins.sql (FUTURE)
  - (Only if separate origins table needed)
  - (Defer until Ramada confirmation)

collections/phase2b_data_sources.md
  - Evidence for each travel time
  - Verification method and date
  - Confidence level per route
```

---

## NEXT HANDOVER

**To Phase 2B implementer:**

1. Use this audit as baseline (exact place codes, status values)
2. Keep Phase 1 UNKNOWN semantics (no auto-conversion)
3. Collect travel times with explicit sources (no guesses)
4. Create config/travelGuideMatrix.json when data ready
5. Implement matrix lookup in _estimateTravelTime()
6. Test that unknown stays unknown (Phase 1 contracts)

**Do not:**
- Modify travel_places data
- Create new tables without evidence
- Populate bus_accessible_status without verification
- Change filter logic (Phase 1 semantics locked)
- Enable travel time before matrix complete

---

**END OF PHASE 2A AUDIT**

---

## APPENDIX: Current Origin Model (TypeScript)

```typescript
// From types/travelGuideContext.ts (Phase 1B)
origin?: {
  type: "partner_entry" | "station_entry" | "previous_place" | "manual_location" | "unknown";
  place_code?: string;           // If type=previous_place
  lat?: number;                  // If type=manual_location
  lng?: number;
  label: string;                 // "Ramada Plaza", "이전 장소", etc.
  source?: string;               // "QR_verified", "GPS_confirmed", "previous_session"
};
```

**Usage Example (Ramada Entry):**
```json
{
  "type": "partner_entry",
  "label": "여수 라마다 플라자",
  "source": "partner_setup",
  "lat": 34.7412,
  "lng": 127.7357
}
```

---

**AUDIT READY FOR PHASE 2B IMPLEMENTATION**
