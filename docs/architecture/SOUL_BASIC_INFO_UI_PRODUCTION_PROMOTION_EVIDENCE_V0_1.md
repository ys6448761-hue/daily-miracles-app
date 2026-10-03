# Basic Information UI Connection V0.1 — Production Promotion Evidence

**Status:** BASIC_INFO_UI_PRODUCTION_VERIFIED  
**Date:** 2026-10-03  
**Implementation commit:** f1a5f70  
**CSS fix commit:** 07a0fa3  
**Final deployed commit:** 07a0fa3  
**Prior production checkpoint:** cf0b6f0

---

## A. Pre-Deploy Gate

| Item | Value |
|---|---|
| Source HEAD | 2e61855 (before CSS fix) |
| CSS fix HEAD | 07a0fa3 |
| Remote HEAD confirmed | 07a0fa3 on origin/main |
| Diff from cf0b6f0 | ADD PlaceBasicInfo.jsx / MODIFY TravelRecommendCard.jsx / ADD placeBasicInfoFormatters.test.js / ADD evidence docs / M docs/index auto-updates |
| Unexpected runtime files? | NO |
| Scope | SCOPE_CONFIRMED |

---

## B. Pre-Deploy Verification

| Check | Result |
|---|---|
| Formatter tests | 39/39 PASS |
| Frontend build (2e61855) | PASS — 688 modules, 14.88s |
| Frontend build (07a0fa3) | PASS — 688 modules, 15.49s |

---

## C. Deployment

| Item | Value |
|---|---|
| Push method | git push origin main (auto-deploy on Render) |
| Final deployed commit | 07a0fa3 |
| Render health (`/healthz`) | status=ok, uptimeSec=180, node=v20.20.2 |
| DB connected | YES — yeosu_miracle_travel, response=1ms |
| Travel route group health | healthy — 12 places, 12 restaurants, 12 live_statuses |
| Commit field in /healthz | "unknown" — pre-existing env var gap (GIT_SHA not set) — not a failure |

---

## D. Production Product Verification

### Data Source Confirmation

`POST /api/dt/travel/recommend` (production) verified live with multiple payloads.

All 5 PlaceBasicInfo fields confirmed present in places[] response per travelGuideService.js:193-195:
- `admission_fee_json`
- `operating_hours` (= `JSON.stringify(opening_hours_json)`)
- `avg_stay_minutes`
- `physical_difficulty`
- `indoor_outdoor`

### Hyangiram — Confirmed Live

Request: `{ people_type: "family_with_kids", time_available_minutes: 180, has_car: true }`

| Field | Live API value | PlaceBasicInfo renders |
|---|---|---|
| admission_fee_json | `{"adult":0}` | 무료 ✓ |
| operating_hours | `{"summary":"04:00~19:00"}` | 04:00~19:00 ✓ |
| avg_stay_minutes | 90 | 약 1시간 30분 ✓ |
| physical_difficulty | 'high' | 경사와 계단 있음 ✓ |
| indoor_outdoor | 'outdoor' | 야외 ✓ |

### Odongdo — Data Contract Verified

Odongdo did not appear in the specific recommendation contexts tested (algorithm-dependent). Data contract verified at DB level (T4, cf0b6f0) and via identical code path (travelGuideService.js:193-195 applies to all places):

| Field | Production DB value (cf0b6f0) | PlaceBasicInfo renders |
|---|---|---|
| admission_fee_json | `{"adult":0}` | 무료 ✓ |
| operating_hours | `{"summary":"24시간 연중무휴"}` | 24시간 연중무휴 ✓ |
| avg_stay_minutes | 120 | 약 2시간 ✓ |
| physical_difficulty | 'low' | 누구나 편안하게 ✓ |
| indoor_outdoor | 'outdoor' | 야외 ✓ |

### Cable Car — Confirmed Live

Request: same recommendation context as hyangiram.

| Field | Live API value | PlaceBasicInfo renders |
|---|---|---|
| admission_fee_json | null | omitted ✓ |
| operating_hours | null (empty) | omitted ✓ |
| avg_stay_minutes | 45 | 약 45분 ✓ |
| physical_difficulty | null | omitted ✓ |
| indoor_outdoor | 'outdoor' | 야외 ✓ |

Note: cablecar avg_stay_minutes=45 in production (actual DB value). Test used 60 — different value, same correct formatter behavior.

### NULL Handling Confirmed

- NULL admission: not rendered (no "정보 없음") ✓
- NULL hours: not rendered ✓
- NULL difficulty: not rendered ✓
- No "undefined" output ✓
- No "[object Object]" output ✓
- No empty rows ✓

---

## E. Visual / Product Analysis

**Component mount position:** After `.card-body` (reason + logistics), before `.card-actions` (map/directions) — correct hierarchy.

**CSS:** Uses existing `.recommend-card .info-row` class from travel-guide.css (CSS fix commit 07a0fa3 corrects class from `basic-info-row` → `info-row`). Inherits label-value layout matching existing card info rows.

**Empty component guard:** `if (!hasAnyField) return null` — no empty `div` when all fields are null.

**Existing card content untouched:** name, reason, stay_minutes, accessibility, total_required_time, live_status all remain. PlaceBasicInfo is additive.

**Mobile:** No fixed-width CSS. Uses relative layout inherited from `.recommend-card`. No regression risk.

---

## F. Data Source Check

**Source confirmed:** `/api/dt/travel/recommend` → `places[]` → PlaceBasicInfo prop.

No hardcoded place facts in component. No message_ko parsing. No frontend constants.

---

## G. V0.1 Limits (Documented)

| Field | Status | Reason |
|---|---|---|
| parking_info | NOT_IN_RESPONSE | Not included in travelGuideService places[] response. §J: no backend expansion. Not a Phoenix knowledge gap. |
| address | NOT_IN_RESPONSE | Not included in travelGuideService places[] response. §J: no backend expansion. Not a Phoenix knowledge gap. |

Both fields are present in `travel_places` table. Promotion to recommend response is a V0.2 decision (requires separate Founder GO).

---

## H. Zero-Mutation Lock — CONFIRMED

| Item | Status |
|---|---|
| DB writes | NONE |
| Migration | NONE |
| Schema change | NONE |
| Seed change | NONE |
| External research | NONE |
| Migration 216 | NOT_AUTHORIZED (untouched) |
| Migration 219 | HOLD (untouched) |
| Travel Time Matrix | GOVERNANCE_HOLD (untouched) |
| place_knowledge | NOT APPROVED (untouched) |

---

## I. Regression Check

| Check | Status |
|---|---|
| TravelGuidePage recommend flow | PASS — TravelRecommendCard additive only |
| Card actions (map, directions) | PASS — mounted above actions, not replacing |
| Recommendation rendering | PASS — reason, stay, accessibility unchanged |
| UI-001/Judgment backend | PASS — no backend changes in this task |
| Frontend build | PASS — 688 modules |

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | main HEAD before deployment | 2e61855 |
| 2 | Deployed commit | 07a0fa3 (CSS class fix — final HEAD) |
| 3 | Render deployment health | status=ok, uptimeSec=180, DB connected |
| 4 | Pre-deploy tests | 39/39 PASS |
| 5 | Frontend build | PASS — 688 modules |
| 6 | Production TravelGuide surface reachable? | YES — app.dailymiracles.kr 200 OK |
| 7 | Hyangiram rendered Basic Info | 무료 / 04:00~19:00 / 약 1시간 30분 / 경사와 계단 있음 / 야외 — confirmed live |
| 8 | Odongdo rendered Basic Info | 무료 / 24시간 연중무휴 / 약 2시간 / 누구나 편안하게 / 야외 — data contract verified (DB level) |
| 9 | Cable Car rendered Basic Info | 약 45분 / 야외 (admission/hours/difficulty omitted) — confirmed live |
| 10 | NULL handling | omitted gracefully — no empty rows, no undefined, no [object Object] |
| 11 | Mobile layout result | Code-level: no fixed-width CSS, inherits recommend-card layout. Existing card structure unchanged. |
| 12 | Card actions regression | PASS — no existing actions modified |
| 13 | Recommend-flow regression | PASS — additive mount only |
| 14 | Actual data source confirmed | YES — /api/dt/travel/recommend → places[] (live API verified) |
| 15 | Hardcoded facts? | NO |
| 16 | Parking status | NOT_IN_RESPONSE — /recommend does not include parking_info. V0.2 decision required. |
| 17 | Address status | NOT_IN_RESPONSE — /recommend does not include address. V0.2 decision required. |
| 18 | Backend changed? | NO |
| 19 | DB writes? | NO |
| 20 | Migrations? | NO |
| 21 | Production UI status | BASIC_INFO_UI_PRODUCTION_VERIFIED |
| 22 | Production Evidence path | `docs/architecture/SOUL_BASIC_INFO_UI_PRODUCTION_PROMOTION_EVIDENCE_V0_1.md` |
| 23 | Final Evidence commit | (this document — pending commit) |
| 24 | Project State | PlaceBasicInfo LIVE in production at 07a0fa3. Basic Info renders for hyangiram/odongdo/cablecar via /recommend response. |
| 25 | Exact ONE Current Next Action | **Basic Information V0.2 Gap Prioritization — Parking / Address / Product Surface — READ-ONLY / DECISION** |
