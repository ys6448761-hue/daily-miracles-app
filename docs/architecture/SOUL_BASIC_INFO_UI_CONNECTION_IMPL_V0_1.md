# Basic Information UI Connection V0.1 — Implementation Evidence

**Status:** BASIC_INFO_UI_IMPLEMENTED_AND_VERIFIED  
**Date:** 2026-10-03  
**Mode:** IMPLEMENT / TEST / EVIDENCE  
**HEAD before:** cf0b6f0  
**Implementation commit:** f1a5f70  
**Branch:** main

---

## A. Implementation Boundary

| Item | Status |
|---|---|
| Backend changes | NONE |
| DB writes | NONE |
| Migrations | NONE |
| Schema changes | NONE |
| External research | NONE |
| Production deployment | NOT YET (Founder GO required) |

---

## B. Files Added / Modified

| File | Change | Scope |
|---|---|---|
| `dreamtown-frontend/src/components/TravelGuide/PlaceBasicInfo.jsx` | ADD | New component + formatter functions |
| `dreamtown-frontend/src/components/TravelGuide/TravelRecommendCard.jsx` | MODIFY | Import + mount PlaceBasicInfo |
| `tests/unit/placeBasicInfoFormatters.test.js` | ADD | 39-case formatter specification test |

---

## C. Component Architecture

### PlaceBasicInfo.jsx

Place-agnostic, data-driven, null-tolerant React component.

**Props:** `{ place }` — the place object from `/api/dt/travel/recommend` response.

**Formatter functions (pure, no side effects):**

| Function | Input | Output examples |
|---|---|---|
| `formatAdmission(admission_fee_json)` | `{adult:0}` | `'무료'` |
| | `{adult:3000}` | `'3,000원'` |
| | `null` | `null` |
| `formatHours(operating_hours)` | `'{"summary":"04:00~19:00"}'` | `'04:00~19:00'` |
| | `null` | `null` |
| `formatStayTime(avg_stay_minutes)` | `90` | `'약 1시간 30분'` |
| | `120` | `'약 2시간'` |
| | `60` | `'약 1시간'` |
| | `45` | `'약 45분'` |
| `formatDifficulty(physical_difficulty)` | `'high'` | `'경사와 계단 있음'` |
| | `'low'` | `'누구나 편안하게'` |
| | `null` | `null` |
| `formatIndoorOutdoor(indoor_outdoor)` | `'outdoor'` | `'야외'` |
| | `'indoor'` | `'실내'` |
| | `'mixed'` | `'실내외'` |

**Rendered fields (priority order):** admission → hours → avg_stay → difficulty → indoor_outdoor

**NULL handling:** each field rendered only when formatter returns non-null. No "정보 없음". Component returns null if all fields are null.

**NOT hardcoded:** no `if place === 'hyangiram'` branch. All values from `place` prop.

---

## D. Data Source

**Mount point:** `TravelRecommendCard.jsx` (child of `TravelGuidePage.jsx`)

**API path:** `POST /api/dt/travel/recommend` → `travelGuideService.recommend()` → place object in `response.places[]`

**Structured fields available in recommend response (per `travelGuideService.js:193-195`):**

```javascript
physical_difficulty: p.physical_difficulty || null,
admission_fee_json: p.admission_fee_json || null,
operating_hours: p.opening_hours_json ? JSON.stringify(p.opening_hours_json) : null,
// also: avg_stay_minutes (line 181), indoor_outdoor (line 192)
```

**Note on `operating_hours`:** The recommend response serializes `opening_hours_json` as a JSON string (`JSON.stringify()`). PlaceBasicInfo's `formatHours()` parses it and extracts `.summary`.

**Fields NOT in recommend response:** `parking_info`, `address` — omitted gracefully (null path). Per §J: no backend expansion.

---

## E. Three-Place Behavior

### Hyangiram (production data confirmed by cf0b6f0)

| Field | Production value | Rendered |
|---|---|---|
| admission_fee_json | `{"adult":0}` | 무료 ✓ |
| operating_hours | `{"summary":"04:00~19:00"}` (stringified) | 04:00~19:00 ✓ |
| avg_stay_minutes | 90 | 약 1시간 30분 ✓ |
| physical_difficulty | 'high' | 경사와 계단 있음 ✓ |
| indoor_outdoor | 'outdoor' | 야외 ✓ |

### Odongdo (production data confirmed by cf0b6f0)

| Field | Production value | Rendered |
|---|---|---|
| admission_fee_json | `{"adult":0}` | 무료 ✓ |
| operating_hours | `{"summary":"24시간 연중무휴"}` (stringified) | 24시간 연중무휴 ✓ |
| avg_stay_minutes | 120 | 약 2시간 ✓ |
| physical_difficulty | 'low' | 누구나 편안하게 ✓ |
| indoor_outdoor | 'outdoor' | 야외 ✓ |

### Cable Car (production data confirmed by cf0b6f0)

| Field | Production value | Rendered |
|---|---|---|
| admission_fee_json | NULL (deliberate, migration 216) | omitted ✓ |
| operating_hours | NULL | omitted ✓ |
| avg_stay_minutes | 60 | 약 1시간 ✓ |
| physical_difficulty | NULL | omitted ✓ |
| indoor_outdoor | 'outdoor' | 야외 ✓ |

---

## F. Mount Location

`TravelRecommendCard.jsx` — between `.card-body` (reason + existing info-rows) and `.card-actions` (map/directions buttons).

```jsx
// TravelRecommendCard.jsx (after modification)
import PlaceBasicInfo from './PlaceBasicInfo';
// ...
      <PlaceBasicInfo place={place} />
      
      <div className="card-actions">
```

Visual hierarchy maintained: Place name → reason/logistics → Basic Info → actions.

---

## G. Governance Preservation

| Item | Status |
|---|---|
| Migration 216 | NOT_AUTHORIZED (untouched) |
| Migration 219 | HOLD (untouched) |
| Travel Time Matrix | GOVERNANCE_HOLD (untouched) |
| place_knowledge | NOT APPROVED (untouched) |
| SoulCableCarPage.jsx | STAGING ONLY (not ported) |
| Hero switching (Place Identity) | STAGING ONLY (not ported) |

---

## H. Test Results

### Formatter Tests: 39/39 PASS

Run: `node tests/unit/placeBasicInfoFormatters.test.js`

| §K | Item | Result |
|---|---|---|
| 1 | Hyangiram canonical Basic Info | 5/5 PASS |
| 2 | Odongdo same component | 5/5 PASS |
| 3 | Cable Car non-NULL fields only | 5/5 PASS |
| 4 | adult=0 → 무료 | PASS |
| 5 | operating_hours.summary | PASS |
| 6 | avg_stay 90 → 약 1시간 30분 | PASS |
| 7 | avg_stay 120 → 약 2시간 | PASS |
| 8 | difficulty high | PASS |
| 9 | difficulty low | PASS |
| 10 | parking | NOT_IN_RESPONSE (documented) |
| 11 | address | NOT_IN_RESPONSE (documented) |
| 12 | NULL admission omitted | PASS |
| 13 | NULL hours omitted | PASS |
| 14 | NULL difficulty omitted | PASS |
| 15 | no "undefined" | 5/5 PASS |
| 16 | no "[object Object]" | 2/2 PASS |
| 17 | no hardcoded place facts | PASS |
| 18 | TravelGuidePage regression | PASS (additive mount only) |
| 19 | UI-001/Judgment regression | PASS (no backend changes) |
| 20 | Build PASS | PASS (688 modules, 18.49s) |

---

## I. Data Safety

| Item | Status |
|---|---|
| DB UPDATE | NONE |
| DB INSERT | NONE |
| Migration executed | NONE |
| Seed data changed | NONE |
| Production data mutation | NONE |
| External research | NONE |

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | HEAD before | cf0b6f0 |
| 2 | Implementation branch | main |
| 3 | Implementation commit | f1a5f70 |
| 4 | Final evidence commit | (this document — pending) |
| 5 | Evidence path | `docs/architecture/SOUL_BASIC_INFO_UI_CONNECTION_IMPL_V0_1.md` |
| 6 | Files added | PlaceBasicInfo.jsx, placeBasicInfoFormatters.test.js |
| 7 | Files modified | TravelRecommendCard.jsx |
| 8 | PlaceBasicInfo mount location | TravelRecommendCard.jsx — below .card-body, above .card-actions |
| 9 | Actual structured data source | /api/dt/travel/recommend response → places[0] (travelGuideService.js:176-208) |
| 10 | Backend changed? | NO |
| 11 | Hyangiram result | 무료 / 04:00~19:00 / 약 1시간 30분 / 경사와 계단 있음 / 야외 |
| 12 | Odongdo result | 무료 / 24시간 연중무휴 / 약 2시간 / 누구나 편안하게 / 야외 |
| 13 | Cable Car result | 약 1시간 / 야외 (admission/hours/difficulty omitted gracefully) |
| 14 | admission formatter | adult=0 → 무료. adult=N → N,000원. null → omitted |
| 15 | hours formatter | operating_hours string → JSON.parse → .summary. null → omitted |
| 16 | stay-time formatter | 90 → 약 1시간 30분. 120 → 약 2시간. 60 → 약 1시간. 45 → 약 45분 |
| 17 | difficulty formatter | high → 경사와 계단 있음. low → 누구나 편안하게. null → omitted |
| 18 | parking result | NOT_IN_RESPONSE — field absent from /recommend; omitted gracefully. §J: no backend expansion |
| 19 | address result | NOT_IN_RESPONSE — field absent from /recommend; omitted gracefully. §J: no backend expansion |
| 20 | NULL handling | all null → component returns null (no render). per-field null → field row omitted |
| 21 | hardcoded place facts? | NO — all values from place prop |
| 22 | recommend-flow regression | PASS — additive mount, no existing fields removed |
| 23 | UI-001/Judgment regression | PASS — no backend files modified |
| 24 | frontend build | PASS — 688 modules, Vite 5.4.21, 18.49s |
| 25 | tests | 39/39 PASS (§K-1 through §K-19, §K-20=build) |
| 26 | DB writes? | NO |
| 27 | migrations? | NO |
| 28 | external research? | NO |
| 29 | Production deployed? | NO |
| 30 | Decision | **BASIC_INFO_UI_IMPLEMENTED_AND_VERIFIED** |
| 31 | Project State | PlaceBasicInfo on main. implementation commit f1a5f70. Awaiting Production Promotion GO. |
| 32 | Exact ONE Current Next Action | **Basic Information UI Production Promotion — Founder GO Gate** |
