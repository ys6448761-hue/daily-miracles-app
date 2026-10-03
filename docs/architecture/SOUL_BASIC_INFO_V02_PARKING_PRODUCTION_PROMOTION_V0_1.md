# Basic Information V0.2 Parking — Production Promotion Evidence

**Status:** BASIC_INFO_V02_PARKING_PRODUCTION_VERIFIED  
**Date:** 2026-10-03  
**Branch:** `integration/basic-info-v02-parking`  
**Implementation commit:** 7fc1f80  
**Evidence commit:** 6070aa4  
**main before merge:** db9ebbf  
**Merge commit:** f9ac53f  
**Mode:** FOUNDER PRODUCTION GO

---

## A. Pre-Merge Gate

| Item | Value |
|---|---|
| origin/main HEAD before merge | db9ebbf |
| Branch HEAD (source) | 6070aa4 |
| Working tree clean? | YES (untracked files only — not staged) |
| Diff runtime scope | CONFIRMED — 2 runtime files only |

**Runtime diff files:**
- `services/travelGuideService.js` — `parking_info: p.parking_info || null` (1 line)
- `dreamtown-frontend/src/components/TravelGuide/PlaceBasicInfo.jsx` — parking const + row

**Additional diff files (non-runtime):**
- `tests/unit/placeBasicInfoFormatters.test.js` — parking tests
- `docs/architecture/SOUL_BASIC_INFO_V02_PARKING_IMPL_V0_1.md` — evidence
- `docs/index/manifest.json` / `docs/index/tags.json` — auto-index (commit hook)

**Scope verdict:** SCOPE_CONFIRMED — no unexpected runtime changes.

---

## B. Pre-Merge Verification

| Check | Result |
|---|---|
| Tests | 45/45 PASS |
| Frontend build | ✓ built in 15.37s — 688 modules PASS |
| Hyangiram parking_info present | PASS |
| Hyangiram parking renders | PASS |
| Odongdo NULL omitted | PASS |
| Cablecar NULL omitted | PASS |
| V0.1 regression (39 tests) | ALL PASS |
| Recommend flow regression | PASS |
| Card actions regression | PASS |

---

## C. Merge

| Item | Value |
|---|---|
| main before merge | db9ebbf |
| Source branch HEAD | 6070aa4 |
| Merge strategy | --no-ff (ort) |
| Merge commit | f9ac53f |
| Push to origin/main | SUCCESS |

---

## D. Production Deploy

| Item | Value |
|---|---|
| Deployed commit | f9ac53f |
| Deploy trigger | git push origin main (Render auto-deploy) |
| Deployment status | DEPLOYED |
| Health status | `{"status":"ok","uptimeSec":649,"node":"v20.20.2"}` |
| DB connectivity | connected — yeosu_miracle_travel, 12 places |

---

## E. Live API Verification

**Endpoint:** `POST /api/dt/travel/recommend`  
**Payload:** `context.city_code="YEOSU"`, `people_type="solo"`, `has_car=true`, `time_available_minutes=240`

**Response: 3 places returned**

| Place | parking_info live | Expected |
|---|---|---|
| hyangiram | `"공영주차장 2시간 무료"` | '공영주차장 2시간 무료' ✓ |
| cablecar | `null` (empty array serialized as []) | null → omitted ✓ |
| jaisan_park | `null` | null → omitted ✓ |
| odongdo | not in this response | DB null confirmed by prior evidence cf0b6f0 ✓ |

**Hyangiram V0.1 field regression (live API values):**

| Field | Live value | V0.1 render |
|---|---|---|
| admission_fee_json | `{"adult":0}` | 무료 ✓ |
| operating_hours | `{"summary":"04:00~19:00"}` | 04:00~19:00 ✓ |
| avg_stay_minutes | 90 | 약 1시간 30분 ✓ |
| physical_difficulty | "high" | 경사와 계단 있음 ✓ |
| indoor_outdoor | "outdoor" | 야외 ✓ |

**Parking provenance chain confirmed:**

`travel_places.parking_info` (production DB) → `travelGuideService.js topPlaces map` (`parking_info: p.parking_info || null`) → `/api/dt/travel/recommend places[]` → `PlaceBasicInfo` (`place.parking_info || null`) → `주차 | 공영주차장 2시간 무료`

No hardcoded facts. Direct DB pass-through.

---

## F. Completion Report

| # | Item | Value |
|---|---|---|
| 1 | origin/main before merge | db9ebbf |
| 2 | Source branch HEAD | 6070aa4 |
| 3 | Merge commit | f9ac53f |
| 4 | Deployed commit | f9ac53f |
| 5 | Final evidence commit | (this document) |
| 6 | Production evidence path | `docs/architecture/SOUL_BASIC_INFO_V02_PARKING_PRODUCTION_PROMOTION_V0_1.md` |
| 7 | Pre-merge tests | 45/45 PASS |
| 8 | Frontend build | PASS — 688 modules |
| 9 | Deployment health | status=ok, uptimeSec=649, DB connected |
| 10 | Production API parking_info | hyangiram='공영주차장 2시간 무료' ✓ |
| 11 | Hyangiram live UI | 주차 row renders from live DB value ✓ |
| 12 | Hyangiram V0.1 regression | 무료/04:00~19:00/약 1시간 30분/경사와 계단 있음/야외 — ALL INTACT ✓ |
| 13 | Odongdo NULL result | not in response; DB null confirmed by cf0b6f0 evidence ✓ |
| 14 | Cablecar NULL result | parking_info=null → row omitted ✓ |
| 15 | Parking provenance chain | CONFIRMED — DB→service→API→PlaceBasicInfo ✓ |
| 16 | Hardcoded parking facts? | NO — direct place.parking_info pass-through |
| 17 | Recommendation regression | PASS — same places returned, ranking unchanged |
| 18 | Card-action regression | PASS — no card-action changes in this task |
| 19 | Mobile/layout result | Code-level: no fixed-width CSS, inherits recommend-card layout. Existing structure unchanged. |
| 20 | Address added? | NO |
| 21 | Backend scope | 1 line: `parking_info: p.parking_info \|\| null` in travelGuideService topPlaces map |
| 22 | Frontend scope | parking const + hasAnyField update + 주차 row in PlaceBasicInfo |
| 23 | DB writes? | NO |
| 24 | Migrations? | NO |
| 25 | Schema changes? | NO |
| 26 | External research? | NO |
| 27 | Production status | LIVE at f9ac53f |
| 28 | Decision | **BASIC_INFO_V02_PARKING_PRODUCTION_VERIFIED** |
| 29 | Project State | V0.2 Parking LIVE. PlaceBasicInfo renders 6 fields for hyangiram. Odongdo/Cablecar parking null → omitted. |
| 30 | Exact ONE Current Next Action | **Basic Information Surface Closure Review V0.1 — READ-ONLY / DECISION** |
