# Basic Information V0.2 Gap Prioritization — Parking / Address / Product Surface

**Status:** V0_2_IMPLEMENTATION_RECOMMENDED  
**Date:** 2026-10-03  
**Mode:** STRICT READ-ONLY / PRODUCT DECISION  
**Production checkpoint:** aecb37a  
**HEAD before:** aecb37a  
**No implementation. No DB change. No external research.**

---

## A. Current V0.1 Surface

`TravelRecommendCard` render hierarchy (per aecb37a):

```
[recommend-card]
  card-header:   name_ko + live_status
  card-body:
    reason        (💡 WHY recommended)
    stay_minutes  (⏱️ 장소 체류시간)
    car/bus       (🚗 이동 가능 ✓ 차 ✓ 버스)
    total_time    (🕐 총 소요 시간)
  PlaceBasicInfo:
    admission     (입장료)
    hours         (운영시간)
    avg_stay      (평균 체류)
    difficulty    (걷기 난이도)
    indoor_outdoor(환경)
  card-actions:
    지도에서 보기
    길찾기
```

---

## B. Parking Trace

### Canonical Source
- Column: `travel_places.parking_info VARCHAR(200)` (migration 200)
- Production data: hyangiram='공영주차장 2시간 무료', odongdo=NULL, cablecar=NULL
- Schema available since Day 1

### Current Connection State
- `/recommend` response: **NOT INCLUDED** (travelGuideService.js:176-208 does not map parking_info)
- SOUL service (soyeowoolService.js): **no reference** to parking_info
- has_car context: used in `_passesTransport()` for place filtering and accessibility display
- Card already shows "🚗 이동 가능" row — transport signaled, parking detail is NOT

### Decision Value (§A Classification)
**DECISION_SUPPORTING**

For car-driving travelers:
- "Can I park there?" — YES, parking_info answers this
- "What does it cost?" — YES, "공영주차장 2시간 무료" = free within stay time
- "Is the parking time-limited?" — YES, 2h limit aligns with avg_stay=90min

The value is particularly strong for hyangiram because:
1. Remote cliff location — parking availability is not obvious
2. 2h free limit aligns exactly with 90-min stay → actionable planning signal
3. Public parking (not private/hotel) — relevant logistical fact

Not DECISION_CRITICAL because you can discover parking on arrival, but high-value for planning.

### Three-Place Assessment
| Place | parking_info | Rendered |
|---|---|---|
| Hyangiram | 공영주차장 2시간 무료 | YES — decision-relevant for car-drivers |
| Odongdo | NULL | omitted gracefully |
| Cablecar | NULL | omitted gracefully |

Hyangiram-only value is acceptable — odongdo and cablecar silently omit (null-tolerant component).

### Connection Cost
- Backend: ADD 1 field to travelGuideService.js `topPlaces` map: `parking_info: p.parking_info || null`
- Frontend: ADD 1 conditional row to PlaceBasicInfo.jsx
- DB/schema: NO CHANGE
- New knowledge: NONE
- Response contract: backward-compatible additive (new field, no removal)

---

## C. Address Trace

### Canonical Source
- Column: `travel_places.address VARCHAR(300)` (migration 200)
- Production data: hyangiram='돌산읍 향일암로 1', odongdo=(seeded), cablecar='오동도로 61-11'
- All 3 places have address

### Current Connection State
- `/recommend` response: **NOT INCLUDED**
- Existing card: has "지도에서 보기" and "길찾기" action buttons which serve navigation

### Decision Value (§A Classification)
**REFERENCE_ONLY**

For each decision question:
- "whether to go?" — address does not affect this
- "when to go?" — address does not affect this
- "how difficult?" — address does not affect this
- "how to arrive?" — map/directions buttons already serve this
- "what to prepare?" — address does not affect this
- "what to do next?" — address does not affect this

Address primarily serves: navigation (covered by buttons), taxi (driver uses map), copy/share (detail layer), and administrative reference.

The existing card-actions ("지도에서 보기", "길찾기") already expose navigation affordance. Showing the raw address string ("돌산읍 향일암로 1") adds no incremental decision value over these actions.

### Three-Place Assessment
All 3 places have address — no null-tolerance issue. But REFERENCE_ONLY for all 3.

### Connection Cost
- Backend: 1 field addition
- Frontend: 1 condition in PlaceBasicInfo
- BUT: value does not justify cost at this surface

**Decision: Address is NOT recommended for V0.2 Basic Info surface.**

---

## D. Product Surface Review

V0.1 card is already moderately dense:
- 4 rows in card-body
- 5 rows in PlaceBasicInfo (hyangiram) / 2-3 rows (others)
- 2 action buttons

Adding parking for hyangiram: 6th PlaceBasicInfo row. Still within compact, scannable range.

The parking row reads: `주차 | 공영주차장 2시간 무료` — concise, immediately actionable.

"More data ≠ better guidance" — but parking for hyangiram IS guidance (specific, actionable, non-obvious from context).

---

## E. Contextual Presentation (has_car relevance)

**Current signal:** Card-body already shows "🚗 이동 가능 ✓ 차 ✓ 버스" — driver vs. non-driver visibility is implicit.

**For Option D (conditional visibility):**
- Requires: `has_car` threaded from TravelGuidePage → TravelRecommendCard → PlaceBasicInfo
- Architecture available: `has_car` is in `TravelGuidePage.context` state — could be passed via props
- Cost: prop threading across 2 component levels + parking_info backend addition
- Value: hides parking noise for non-car travelers

**Assessment:** Option D is architecturally feasible without new patterns. However, for V0.2:
- Non-car travelers seeing a NULL parking row = the row doesn't render (already null-tolerant)
- Hyangiram is the only place with parking — if a non-car traveler gets hyangiram recommended, they likely have a car or a taxi
- The marginal benefit of conditional hiding vs. always-null-omit does not justify added complexity

Recommendation: V0.2 unconditional (null-tolerant). V0.3 can introduce has_car conditional if product feedback indicates parking row appears unexpectedly.

**family_elderly relevance:**
- PU-HY-003 (elderly ASK) already fires based on physical_difficulty — this exists in Judgment V0.1
- family_elderly context + physical_difficulty is already surfaced in SOUL path
- No new BasicInfo behavior needed for family_elderly in V0.2

---

## F. Three-Place Check Summary

| Field | Hyangiram | Odongdo | Cablecar | Decision |
|---|---|---|---|---|
| parking_info | 공영주차장 2시간 무료 ✓ | NULL → omit | NULL → omit | ADD (V0.2) |
| address | 돌산읍 향일암로 1 | (seeded) | 오동도로 61-11 | DEFER |

Parking: valuable for hyangiram, graceful for others. Three-place safe.
Address: redundant across all 3. Defer.

---

## G. Option Assessment

### Option A: Add Parking + Address
- parking: DECISION_SUPPORTING ✓
- address: REFERENCE_ONLY — duplicates navigation buttons
- **Assessment: OVERREACH.** Address adds no value beyond existing card actions. Reject address.

### Option B: Add Parking only (no address)
- parking_info backend addition: 1 field
- PlaceBasicInfo frontend addition: 1 conditional row
- hyangiram: shows '공영주차장 2시간 무료' — actionable, decision-relevant
- odongdo/cablecar: null → omitted, no regression
- **Assessment: RECOMMENDED.** Smallest scope, clear value, zero schema change.

### Option C: V0.1 Sufficient
- V0.1 already provides strong surface (5 fields)
- BUT: parking for hyangiram is a known missing actionable field with real data in production
- Card already signals transport via "🚗 이동 가능" — parking extends this naturally
- **Assessment: VALID but suboptimal.** The data exists, the connection cost is minimal, the value is real. Deferring indefinitely is a missed easy win.

### Option D: Contextual parking (has_car conditional)
- Feasible architecturally (prop threading)
- Value: hides irrelevant row for non-car travelers
- Cost: threading + added complexity
- Reality check: hyangiram is the only place with parking — null-omission already handles non-hyangiram. Non-car travelers seeing hyangiram suggested likely have transport.
- **Assessment: VALID for V0.3, NOT needed for V0.2.** Unconditional null-tolerant is sufficient for now.

---

## H. Recommended Product Surface (V0.2)

Add `parking_info` to PlaceBasicInfo when non-null.

Final PlaceBasicInfo render order (V0.2):
1. 입장료 (admission)
2. 운영시간 (hours)
3. 평균 체류 (stay time)
4. 걷기 난이도 (difficulty)
5. 환경 (indoor/outdoor)
6. 주차 (parking — NEW, null-tolerant)

Address: NOT added. Existing map/directions action buttons cover navigation.

---

## I. Connection Cost (V0.2 Parking)

| Item | Change | Details |
|---|---|---|
| Backend | YES — minimal | Add `parking_info: p.parking_info \|\| null` to travelGuideService.js topPlaces map (1 line) |
| Frontend | YES — minimal | Add parking row to PlaceBasicInfo.jsx (5 lines including label) |
| DB/schema | NO | parking_info already in travel_places since migration 200 |
| New knowledge | NO | hyangiram parking_info already in production DB |
| Response contract | backward-compatible | new field, no existing field changed |

---

## J. Decision

**V0_2_IMPLEMENTATION_RECOMMENDED**

Scope: parking only. Address deferred.

Implementation requires Founder GO before execution.

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | HEAD before | aecb37a |
| 2 | Final evidence commit | (this document — pending) |
| 3 | Evidence path | `docs/architecture/SOUL_BASIC_INFO_V02_GAP_PRIORITIZATION_V0_1.md` |
| 4 | Current V0.1 surface | 5 PlaceBasicInfo rows + 4 card-body rows + 2 action buttons |
| 5 | Parking canonical source | `travel_places.parking_info` (migration 200). hyangiram='공영주차장 2시간 무료'. odongdo/cablecar=NULL. |
| 6 | Parking current connection state | NOT_IN_RESPONSE — not in travelGuideService topPlaces map |
| 7 | Parking decision value | DECISION_SUPPORTING — actionable for car-drivers (availability + free 2h = aligns with avg_stay 90min) |
| 8 | Address canonical source | `travel_places.address` (migration 200). All 3 places have data. |
| 9 | Address current connection state | NOT_IN_RESPONSE |
| 10 | Address decision value | REFERENCE_ONLY — map/directions buttons already serve navigation |
| 11 | has_car relevance | Card-body already shows "🚗 이동 가능 ✓ 차" — transport signaled. Conditional parking visibility = V0.3 (not needed now). |
| 12 | family_elderly relevance | PU-HY-003 (difficulty ASK) already handled by Judgment V0.1. No new BasicInfo behavior needed. |
| 13 | Hyangiram assessment | parking='공영주차장 2시간 무료' — decision-relevant, actionable, non-obvious |
| 14 | Odongdo assessment | parking=NULL → omitted gracefully. No regression. |
| 15 | Cable Car assessment | parking=NULL → omitted gracefully. No regression. |
| 16 | Option A assessment | OVERREACH — address is REFERENCE_ONLY, duplicates action buttons. Reject. |
| 17 | Option B assessment | RECOMMENDED — parking only, minimal cost, clear value, null-safe for all 3 places |
| 18 | Option C assessment | VALID but suboptimal — data exists, connection cost is minimal, deferring is a missed easy win |
| 19 | Option D assessment | VALID for V0.3 — has_car conditional is architecturally feasible but not needed when null-omission handles it |
| 20 | Recommended product surface | Add parking row (6th in PlaceBasicInfo). Address deferred. |
| 21 | Backend change required? | YES — minimal: 1 field in travelGuideService.js topPlaces map |
| 22 | Frontend change required? | YES — minimal: 1 conditional row in PlaceBasicInfo.jsx |
| 23 | DB/schema change required? | **NO** |
| 24 | New knowledge required? | NO — hyangiram parking data already in production |
| 25 | External research? | **NO** |
| 26 | Decision | **V0_2_IMPLEMENTATION_RECOMMENDED** — parking only (Option B). Address deferred. |
| 27 | Project State | V0.1 LIVE at aecb37a. V0.2 scope defined: parking_info addition. Awaiting Founder GO. |
| 28 | Exact ONE Current Next Action | **Basic Information V0.2 — Parking Connection — Founder GO Gate** |
