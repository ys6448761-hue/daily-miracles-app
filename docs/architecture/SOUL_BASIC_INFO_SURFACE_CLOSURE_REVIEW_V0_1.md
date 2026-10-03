# Basic Information Surface Closure Review V0.1

**Status:** BASIC_INFO_SURFACE_CLOSED_CURRENT_PHASE  
**Date:** 2026-10-03  
**Mode:** STRICT READ-ONLY / PRODUCT DECISION  
**Production checkpoint:** 17aebc8  
**No implementation. No DB change. No external research.**

---

## A. Current Production Surface Review

### Full Card Hierarchy (production @ 17aebc8)

```
[recommend-card]
  card-header:   name_ko + live_status
  card-body:
    reason        (💡 WHY recommended — primary hook)
    stay_minutes  (⏱️ 장소 체류시간 — journey fit)
    accessibility (🚗 이동 가능 ✓ 차 ✓ 버스)
    total_time    (🕐 총 소요 시간)
  PlaceBasicInfo:
    입장료        (admission)
    운영시간      (hours)
    평균 체류     (avg_stay_minutes)
    걷기 난이도   (difficulty)
    환경          (indoor/outdoor)
    주차          (parking — null-tolerant, V0.2)
  card-actions:
    지도에서 보기
    길찾기
```

### Decision Supported by Each Field

| Field | Decision Supported |
|---|---|
| reason | WHY this place — primary recommendation signal |
| stay_minutes (card-body) | Journey logistics — does this fit my time? |
| accessibility | Transport mode match |
| total_required_time | Full planning horizon |
| 입장료 | 비용은? |
| 운영시간 | 언제 갈 수 있나? |
| 평균 체류 | 얼마나 걸리나? (place-level fact) |
| 걷기 난이도 | 걷기 어렵지 않나? |
| 환경 | 실내/실외인가? |
| 주차 | 차로 갈 때 알아야 할 것 |

### Redundancy Check

`stay_minutes` (card-body, raw "90분") and `평균 체류` (PlaceBasicInfo, formatted "약 1시간 30분") draw from the same `avg_stay_minutes` field (travelGuideService.js:180-181, both set).

Assessment: **NOTED_REDUNDANCY, NOT_A_GAP**.

Different presentation contexts: card-body positions it within journey logistics (between accessibility and total time); PlaceBasicInfo positions it within place-level facts. A traveler can read them independently without confusion. The formatting difference (raw minutes vs. formatted h/m) also serves different scanning needs. No action required at this phase.

### Density Assessment

Hyangiram renders 6 PlaceBasicInfo rows + 4 card-body rows + 2 action buttons = 12 items.

This is the maximum density of any place (only hyangiram has parking data). The card remains scannable because:
1. PlaceBasicInfo rows use consistent two-column label/value format
2. Null-omission means most places show 3-5 rows (not 6)
3. The recommendation reason is visually primary; detail rows are secondary

**Not too dense. Recommendation remains primary.**

---

## B. Trust Foundation Check

Six canonical traveler trust questions, evaluated against current surface:

| Question | Field | Hyangiram | Odongdo | Cable Car |
|---|---|---|---|---|
| 비용은? | 입장료 | 무료 ✓ | 무료 ✓ | null → omit (deliberate) |
| 언제 갈 수 있나? | 운영시간 | 04:00~19:00 ✓ | 24시간 연중무휴 ✓ | null → omit |
| 얼마나 걸리나? | 평균 체류 | 약 1시간 30분 ✓ | 약 2시간 ✓ | 약 45분 ✓ |
| 걷기/난이도는? | 걷기 난이도 | 경사와 계단 있음 ✓ | 누구나 편안하게 ✓ | null → omit |
| 실내/실외인가? | 환경 | 야외 ✓ | 야외 ✓ | 야외 ✓ |
| 차로 갈 때? | 주차 | 공영주차장 2시간 무료 ✓ | null → omit | null → omit |

NULL omission is valid product behavior — a missing field is silence, not a false value. A traveler who doesn't see a difficulty row can infer "data not available" without harm.

**Trust foundation: SUFFICIENT for all three places.**

---

## C. Three-Place Classification

### HYANGIRAM — SUFFICIENT

- 입장료: 무료 ✓ (from migration 216)
- 운영시간: 04:00~19:00 ✓ (from migration 217)
- 평균 체류: 약 1시간 30분 ✓ (seeded)
- 걷기 난이도: 경사와 계단 있음 ✓ (physical_difficulty='high')
- 환경: 야외 ✓ (seeded)
- 주차: 공영주차장 2시간 무료 ✓ (from migration 217, live API confirmed)

All 6 trust questions answered. Highest-data-completeness place. **SUFFICIENT.**

### ODONGDO — SUFFICIENT

- 입장료: 무료 ✓ (from migration 216)
- 운영시간: 24시간 연중무휴 ✓ (from migration 217)
- 평균 체류: 약 2시간 ✓ (seeded)
- 걷기 난이도: 누구나 편안하게 ✓ (physical_difficulty='low', from migration 217)
- 환경: 야외 ✓ (seeded)
- 주차: null → omitted (island approach — no parking data, acceptable)

5 of 6 trust questions answered. Parking null is acceptable — odongdo access is by ferry/walking by nature; absence of parking data does not create a planning harm. **SUFFICIENT.**

### CABLE CAR — PARTIAL_BUT_ACCEPTABLE

- 입장료: null → omitted (deliberate — migration 216 comment: "cablecar: PAID — leave null")
- 운영시간: null → omitted (no data)
- 평균 체류: 약 45분 ✓ (production confirmed)
- 걷기 난이도: null → omitted (no physical_difficulty data)
- 환경: 야외 ✓ (seeded)
- 주차: null → omitted

Cable car renders 2 PlaceBasicInfo rows. The traveler learns: "야외, 약 45분 체류." This is minimal but not blocking. The recommendation reason carries primary context. Action buttons (지도에서 보기, 길찾기) serve remaining needs.

The null fields for cable car are data entry gaps, not UI/code gaps. Filling them requires a data migration, which is a separate authorization. **PARTIAL_BUT_ACCEPTABLE** — the product surface is correct; the data state is known.

---

## D. Address Decision

**KEEP_DEFERRED**

Rationale:
- All 3 places have address in DB (travel_places.address)
- "지도에서 보기" and "길찾기" action buttons already serve the navigation use case
- Showing raw address string ("돌산읍 향일암로 1") inside PlaceBasicInfo adds no incremental decision value over these actions
- Address answers "where exactly" for navigation purposes — the buttons answer the same need with better UX
- REFERENCE_ONLY classification from V0.2 gap prioritization stands

---

## E. Parking V0.2 Outcome

**Improved the surface without unnecessary density.**

Hyangiram: `약 1시간 30분` stay + `공영주차장 2시간 무료` parking.

The two facts align precisely: 90min typical stay fits within the 120min free window. This alignment is genuinely useful for planning without requiring any synthesis in the product — the traveler reads both facts and draws their own conclusion.

The parking row renders for hyangiram only in the current three-place set. No row appears for odongdo or cablecar (null-omission). Density increase is single-place-scoped. No redundancy with other fields.

Assessment: **PARKING_V02_JUSTIFIED — clear value, no new density problem.**

---

## F. Contextual V0.3 Classification

### has_car → parking prominence

**USEFUL_LATER**

Currently: parking row renders unconditionally when non-null. Non-car travelers seeing hyangiram recommended likely have car or taxi (remote cliff location). Null-omission handles all other places. No confusion risk from current behavior.

V0.3 conditional would: show parking row only when `has_car=true`. Architecturally feasible (prop threading from TravelGuidePage). Not needed now — null-omission already handles the majority case.

### family_elderly → difficulty prominence

**USEFUL_LATER**

Currently: difficulty row renders unconditionally when non-null. PU-HY-003 (Judgment V0.1) already fires an ASK for elderly travelers encountering high-difficulty places — the Judgment layer handles this more effectively than visual prominence of a Basic Info row.

Visual difficulty prominence (e.g., bold, color, reordering) would be a V0.3 refinement. Not needed now.

---

## G. Remaining Connection Gaps

| Gap | Classification | Reason |
|---|---|---|
| Cable car admission_fee_json null | NEXT_PHASE | Data entry task, not a UI/code gap. Authorized separately. |
| Cable car opening_hours_json null | NEXT_PHASE | Data entry task. |
| Cable car physical_difficulty null | NEXT_PHASE | Data entry task. |
| Address not in PlaceBasicInfo | DEFERRED_REFERENCE | Navigation buttons already cover. KEEP_DEFERRED confirmed §D. |
| has_car conditional parking | NEXT_PHASE | V0.3. Not needed while null-omission handles it. |
| avg_stay_minutes redundancy with card-body | NOT_A_GAP | Different presentation contexts. Same value, different formatting/frame. |
| Odongdo parking null | NOT_A_GAP | Island approach — null is the correct state. |

**No PRODUCT_BLOCKING gaps identified.**

---

## H. Closure Criteria

| Criterion | Status |
|---|---|
| 1. Traveler receives sufficient factual grounding | YES — all 6 trust questions answered or acceptably null |
| 2. Fields are canonical and connected | YES — all live via DB → travelGuideService → /recommend → PlaceBasicInfo |
| 3. No decision-critical existing field disconnected | YES — no critical field disconnected; cable car gaps are data gaps, not connection gaps |
| 4. Recommendation remains primary | YES — reason/💡 leads; PlaceBasicInfo is subordinate detail |
| 5. Remaining gaps belong to later action/detail/context | YES — data entry (cable car), contextual presentation (V0.3), navigation (address) |
| 6. No data/schema repair required for closure | YES — no repair needed |

---

## I. Next Highest-Value Product Surface Gap

### Candidates from Existing Project State

| Gap | Evidence | Backend State |
|---|---|---|
| SoulCableCarPage.jsx not on main | UI-001 Production evidence: "Frontend wiring DEFERRED" | ALL backends LIVE (Judgment V0.1, UI-001, Soyeowool Phase 1) |
| Chip → Judgment Gap B (verb mismatch) | project_judgment_v01_ui_trace.md | Backend ready; Gap B = refinement |
| Journey presentation (CourseDisplay blocks) | project_legacy_journey_presentation_impl.md: OPEN — SEMANTIC_GAP / PRESENTATION_GAP | Backend partial |
| Hero image production parity (odongdo/hyangiram) | ASSET_GAP → gradient (project_place_identity_visual_routing_audit.md) | Frontend only |

### Decision: SOUL Conversational Surface — SoulCableCarPage.jsx Production Port

**Priority rationale:**

SoulCableCarPage.jsx is the primary traveler-facing AI concierge interface. All of its backend dependencies are verified live in production:
- Judgment V0.1: LIVE (d3e7f0e, Main confirmed)
- UI-001 explicit_context contract: LIVE (294c55c, Main confirmed)
- Soyeowool Phase 1: LIVE (1f5afab)
- PlaceBasicInfo: LIVE (17aebc8) — available in TravelGuidePage surface

The conversational surface is the highest-value product differentiator — it's what activates the AI-personalized travel guidance experience. Without it on main, all intelligence built in Project Phoenix is accessible only to API testers, not to travelers.

The port is frontend-only from main's perspective (no schema/DB/knowledge prerequisites unresolved). The UI-001 note explicitly documents the next step: "When that component is promoted, connect it to send explicit_context with chip state."

Journey presentation and Hero image gaps are valuable but secondary — they refine an experience the user can't yet reach. SoulCableCarPage port is the prerequisite for both.

**Selected next gap:** SOUL Conversational Surface — SoulCableCarPage.jsx Production Port

---

## J. Decision

**BASIC_INFO_SURFACE_CLOSED_CURRENT_PHASE**

Basic Information delivers sufficient factual grounding for the current product phase. Six trust-question fields are connected and live. Three-place surface is SUFFICIENT / PARTIAL_BUT_ACCEPTABLE. Remaining gaps are data-entry tasks or deliberate deferral — none are decision-critical connection failures.

No additional Basic Information work is justified before moving to a higher-value product gap.

---

## Completion Report

| # | Item | Value |
|---|---|---|
| 1 | HEAD before | 17aebc8 |
| 2 | Final evidence commit | (this document) |
| 3 | Evidence path | `docs/architecture/SOUL_BASIC_INFO_SURFACE_CLOSURE_REVIEW_V0_1.md` |
| 4 | Current Production Basic surface | 6 PlaceBasicInfo fields (null-tolerant) + 4 card-body rows + 2 action buttons |
| 5 | Hyangiram classification | SUFFICIENT — all 6 trust questions answered |
| 6 | Odongdo classification | SUFFICIENT — 5 of 6 answered; parking null acceptable |
| 7 | Cable Car classification | PARTIAL_BUT_ACCEPTABLE — 2 rows rendered; data gaps known, deliberate |
| 8 | Admission value assessment | High — answers 비용은 for all places that have data |
| 9 | Hours value assessment | High — answers 언제 갈 수 있나 (hyangiram / odongdo); cablecar gap is data task |
| 10 | Stay-time value assessment | Medium-high — present for all 3; partially redundant with card-body but different context |
| 11 | Difficulty value assessment | High for hyangiram/odongdo; cable car null acceptable |
| 12 | Indoor/outdoor value assessment | Medium — all 3 outdoor; consistent. Low marginal value for this three-place set but correct to include |
| 13 | Parking V0.2 assessment | PARKING_V02_JUSTIFIED — hyangiram-only, aligns with stay time, actionable |
| 14 | Address decision | KEEP_DEFERRED — REFERENCE_ONLY; navigation buttons cover the use case |
| 15 | has_car contextual presentation | USEFUL_LATER — V0.3 refinement; null-omission sufficient for now |
| 16 | family_elderly contextual presentation | USEFUL_LATER — Judgment V0.1 PU-HY-003 already handles ASK path |
| 17 | Remaining genuine gaps | Cable car data (NEXT_PHASE), address (DEFERRED_REFERENCE), conditional parking (NEXT_PHASE) |
| 18 | Any PRODUCT_BLOCKING gap? | NO |
| 19 | New knowledge needed? | NO |
| 20 | DB/schema work needed? | NO |
| 21 | External research? | NO |
| 22 | Closure decision | **BASIC_INFO_SURFACE_CLOSED_CURRENT_PHASE** |
| 23 | Highest-value next Product Surface gap | SOUL Conversational Surface — SoulCableCarPage.jsx Production Port |
| 24 | Reason for that priority | All backend prerequisites LIVE (Judgment V0.1, UI-001, Soyeowool Phase 1). Frontend-only gap. Prerequisite for all other SOUL experience refinements. Highest user-facing impact. |
| 25 | Project State | Basic Information: CLOSED current phase. V0.1+V0.2 LIVE at 17aebc8. SoulCableCarPage = staging only (next target). |
| 26 | Exact ONE Current Next Action | **SOUL Conversational Surface — SoulCableCarPage.jsx Production Port — Founder GO Gate** |
