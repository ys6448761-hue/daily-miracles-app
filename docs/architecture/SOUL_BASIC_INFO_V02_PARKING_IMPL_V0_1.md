# Basic Information V0.2 — Parking Connection Implementation Evidence

**Status:** BASIC_INFO_V02_PARKING_IMPLEMENTED_AND_VERIFIED  
**Date:** 2026-10-03  
**Branch:** `integration/basic-info-v02-parking`  
**Implementation commit:** 7fc1f80  
**Prior production checkpoint:** db9ebbf (main)  
**Mode:** IMPLEMENT / TEST / EVIDENCE  
**Production NOT authorized in this task.**

---

## A. Scope Lock (from db9ebbf decision)

| Item | Value |
|---|---|
| Authorized scope | parking_info only (Option B from gap prioritization) |
| Address | DEFERRED — REFERENCE_ONLY classification |
| DB/schema change | NONE — parking_info already in travel_places since migration 200 |
| New knowledge | NONE |
| Migration | NONE |
| External research | NONE |

---

## B. Implementation — Backend

**File:** `services/travelGuideService.js`

**Change:** Added 1 field to `topPlaces` map in `/recommend` response builder:

```javascript
operating_hours: p.opening_hours_json ? JSON.stringify(p.opening_hours_json) : null,
parking_info: p.parking_info || null,   // ← ADDED (V0.2)
```

**Line position:** After `operating_hours` field (line ~196).  
**Contract:** Additive — new field, no existing field changed.  
**Null-safe:** `p.parking_info || null` — explicit null for places without data.

---

## C. Implementation — Frontend

**File:** `dreamtown-frontend/src/components/TravelGuide/PlaceBasicInfo.jsx`

**Changes:**

1. Extract parking from place prop:
```jsx
const parking = place.parking_info || null;
```

2. Update `hasAnyField` guard:
```jsx
const hasAnyField = admission || hours || stayTime || difficulty || indoorOutdoor || parking;
```

3. Add 주차 row (after 환경 row):
```jsx
{parking && (
  <div className="info-row">
    <span>주차</span>
    <span>{parking}</span>
  </div>
)}
```

**Render order (V0.2 complete):**
1. 입장료 (admission)
2. 운영시간 (hours)
3. 평균 체류 (stay time)
4. 걷기 난이도 (difficulty)
5. 환경 (indoor/outdoor)
6. 주차 (parking — NEW, null-tolerant)

**No formatter function added:** parking_info is a plain string — no transformation needed. Direct render.

---

## D. Three-Place Expected Behavior

| Place | parking_info (DB) | PlaceBasicInfo render |
|---|---|---|
| Hyangiram | 공영주차장 2시간 무료 | `주차 \| 공영주차장 2시간 무료` |
| Odongdo | NULL | 주차 row omitted |
| Cablecar | NULL | 주차 row omitted |

---

## E. Tests

**File:** `tests/unit/placeBasicInfoFormatters.test.js`  
**Command:** `node tests/unit/placeBasicInfoFormatters.test.js`

**Result: 45/45 PASS** (up from 39 in V0.1)

### New V0.2 tests (§G-1 through §G-6 + §K-10 update):

| Test | Coverage |
|---|---|
| §G-1 HY parking_info value | parking_info present in canonical object |
| §G-2 HY parking renders | place.parking_info passes through directly |
| §G-3 parking not hardcoded | different parking value → different output |
| §G-4 OD NULL parking omitted | null → null (row condition false) |
| §G-5 CC NULL parking omitted | null → null (row condition false) |
| §G-6 no hardcoded parking fact | verified by §G-3 |
| §K-10 updated | NOT_IN_RESPONSE → IN_RESPONSE (V0.2) |

### V0.1 regression (all preserved):

| Group | Tests | Result |
|---|---|---|
| §K-1 Hyangiram canonical | 5 | PASS |
| §K-2 Odongdo canonical | 5 | PASS |
| §K-3 Cablecar null handling | 5 | PASS |
| §K-4~9 formatter specs | 6 | PASS |
| §K-12~17 null safety | 12 | PASS |
| §K-18~19 regression | 2 | PASS |

---

## F. Frontend Build

**Command:** `cd dreamtown-frontend && npm run build`  
**Result:** ✓ built in 14.95s — 688 modules (same as V0.1)  
**No new chunk warnings.** No new bundle size increase.

---

## G. Zero-Mutation Lock — CONFIRMED

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

## H. Regression Check

| Check | Status |
|---|---|
| V0.1 formatter tests (39 original) | 45/45 PASS — all prior tests preserved |
| Frontend build | PASS — 688 modules |
| Hyangiram V0.1 fields | Unchanged (admission, hours, stay, difficulty, outdoor) |
| Odongdo parking=NULL | Omitted gracefully — no empty row |
| Cablecar parking=NULL | Omitted gracefully — no empty row |
| Card actions (map, directions) | No change |
| TravelRecommendCard layout | No change — PlaceBasicInfo is self-contained |
| UI-001/Judgment backend | No change (travelInputRoutes.js, soyeowoolService.js untouched) |
| Backend contract | Additive — new field, no existing field changed or removed |

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | Branch | `integration/basic-info-v02-parking` |
| 2 | Implementation commit | 7fc1f80 |
| 3 | Prior production checkpoint | db9ebbf (main) |
| 4 | Backend change | travelGuideService.js — 1 line: `parking_info: p.parking_info \|\| null` |
| 5 | Frontend change | PlaceBasicInfo.jsx — parking const + hasAnyField + 주차 row |
| 6 | Test file change | placeBasicInfoFormatters.test.js — §G-1~6 parking tests + §K-10 updated |
| 7 | Tests | 45/45 PASS |
| 8 | Frontend build | PASS — 688 modules |
| 9 | DB change | NONE |
| 10 | Migration | NONE |
| 11 | Schema change | NONE |
| 12 | Hyangiram parking expected render | `주차 \| 공영주차장 2시간 무료` |
| 13 | Odongdo parking | NULL → row omitted |
| 14 | Cablecar parking | NULL → row omitted |
| 15 | Hardcoded facts? | NO — direct pass-through of place.parking_info |
| 16 | Address included? | NO — DEFERRED (REFERENCE_ONLY) |
| 17 | V0.1 regression | NONE — 39 prior tests all PASS |
| 18 | Production deployment | NOT AUTHORIZED in this task |
| 19 | Decision | **BASIC_INFO_V02_PARKING_IMPLEMENTED_AND_VERIFIED** |
| 20 | Evidence path | `docs/architecture/SOUL_BASIC_INFO_V02_PARKING_IMPL_V0_1.md` |
| 21 | Exact ONE Current Next Action | **Basic Information V0.2 Parking — Production Promotion Founder GO Gate** |
