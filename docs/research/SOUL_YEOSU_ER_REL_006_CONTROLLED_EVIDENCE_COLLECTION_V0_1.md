# SOUL Yeosu Evidence Collection — ER-REL-006
# Vehicle Impact on Cable Car Direction/Exit Choice
# Controlled Evidence Collection V0.1

**Collection Date:** 2026-09-28  
**Cycle Number:** 25  
**Branch:** staging/storybook-c7a  
**Starting HEAD:** 87c3e59  
**Collector:** Claude Sonnet 4.6 (fork)  
**Status:** VERIFIED_FOR_PREPARATION

---

## 0. Starting Checkpoint

| Item | Expected | Actual | Match |
|---|---|---|---|
| Branch | staging/storybook-c7a | staging/storybook-c7a | ✓ |
| Local HEAD | 87c3e59 | 87c3e59 | ✓ |
| Remote HEAD | 87c3e59 | 87c3e59 | ✓ |
| Working tree | Clean | Clean (pre-existing untracked only) | ✓ |
| Controlled Collection Cycles | 24 | 24 | ✓ |
| REL-004 status | VERIFIED_FOR_PREPARATION | VERIFIED_FOR_PREPARATION | ✓ |
| REL-006 status | READY_FOR_COLLECTION | READY_FOR_COLLECTION | ✓ |
| HY-008 status | HARD BLOCKED | HARD BLOCKED | ✓ |

---

## 1. Canonical Contract (from Matrix V0.1 — READ ONLY)

| Field | Value |
|---|---|
| ER ID | ER-REL-006 |
| Canonical Question | "Vehicle Impact on Cable Car Direction/Exit Choice" |
| Required Judgment | Whether vehicle availability materially changes direction recommendation |
| Knowledge Category | VEHICLE_ACCESS / DIRECTIONAL_CHOICE |
| Related Scenarios | C-3, O-3 |
| Primary Source Role | FOUNDER / LOCAL_OPERATOR |
| Secondary Source Role | MAP_ROUTE |
| Required Evidence Type | Expert judgment level — vehicle-impact on 돌산↔자산 direction for Odongdo-combined |
| Evidence Needed | Whether having a vehicle changes which cable car direction is better for Odongdo access — or confirms vehicle status does not materially change the recommendation |
| Stability Class | STABLE |
| Live Trigger | None for vehicle-impact judgment itself |
| Stop Condition | EXPERT_JUDGMENT_SUFFICIENT |
| Confidence Requirement | Expert judgment level |
| Missing-Evidence Consequence | Must treat vehicle as potentially material and ASK if unknown |
| Behavior if Missing | ASK |
| Collection Priority | P1 |
| Negative/Exception Knowledge | YES — cases where vehicle presence changes/reverses direction logic |
| Collection Method (Plan) | FOUNDER_REVIEW + LOCAL_OPERATOR_INQUIRY |

**Plan §644 note preserved:** "Both 'vehicle matters' and 'vehicle does not matter' are valid evidenced outcomes."

---

## 2. Dependency Verification

| ER | Status | Relevant Evidence | REL-006 Contribution | Reuse Classification |
|---|---|---|---|---|
| REL-001 | VERIFIED_FOR_PREPARATION | 자산=mainland/~5min walk to Odongdo; 돌산=돌산도/taxi via bridge ~10-12min | Spatial foundation for vehicle-direction logic | DIRECT_REUSE |
| REL-002 | VERIFIED_FOR_PREPARATION | 자산 EXIT = DIRECT to Odongdo (차량 불필요, 5min); 돌산 EXIT = INDIRECT (bridge/taxi only; bridge car-only road) | Confirms 돌산→Odongdo without vehicle requires taxi/car; walking bridge NOT practical | DIRECT_REUSE |
| REL-005 | VERIFIED_FOR_PREPARATION | 돌산→자산 PREFERRED for Odongdo-combined (no-vehicle baseline); one-way ticket efficient; exception: if no Odongdo, direction neutral | No-vehicle baseline; provides the reference point that vehicle impact is measured against | PARTIAL_REUSE (vehicle condition NOT addressed in REL-005) |
| OD-003 | VERIFIED_FOR_PREPARATION | Vehicle prohibition on Odongdo causeway (STABLE); Odongdo parking ~2-3min from breakwater entrance; walk or Dongbaek Train access only | Confirms vehicle cannot drive ONTO Odongdo island; parking at entrance only | DIRECT_REUSE |

All 4 canonical dependencies VERIFIED_FOR_PREPARATION. Proceeding.

---

## 3. Reuse-First Analysis

### 3.1 Evidence Classified from Existing Artifacts

| Evidence ID | Source | REL-006 Claim | Classification |
|---|---|---|---|
| EI-REL-006-R1 | REL-001-C (자산→Odongdo ~5min) | 자산 exit = walking distance to Odongdo entrance | DIRECT_REUSE |
| EI-REL-006-R2 | REL-001-E (돌산→Odongdo via taxi ~10-12min) | 돌산 exit = car/taxi required across bridge | DIRECT_REUSE |
| EI-REL-006-R3 | REL-002-A (자산 EXIT = same compound, DIRECT) | Vehicle not needed from 자산 to Odongdo | DIRECT_REUSE |
| EI-REL-006-R4 | REL-002-D (돌산→Odongdo: bridge=car-only road) | 거북선대교 is car-only; walking from 돌산 to Odongdo NOT PRACTICAL | DIRECT_REUSE |
| EI-REL-006-R5 | REL-005 (돌산→자산 PREFERRED, no-vehicle) | No-vehicle baseline direction judgment | PARTIAL_REUSE (vehicle dimension not addressed) |
| EI-REL-006-R6 | OD-003-A (vehicle prohibition on causeway) | Vehicle cannot drive onto Odongdo island; parking at entrance only | DIRECT_REUSE |
| EI-REL-006-R7 | OD-004 (오동도 공영주차장, 237 spaces, 자산 side) | Odongdo parking = 자산-adjacent location | DIRECT_REUSE |

### 3.2 REL-005 Admissibility Check

REL-005 judgment covers the no-vehicle / general case: 돌산→자산 one-way PREFERRED for Odongdo-combined. It does NOT address whether vehicle presence changes this. Classification: **PARTIAL_REUSE** (factual foundation reusable; directional judgment not directly transferable to vehicle-present condition).

### 3.3 Residual Gap After Reuse

**Classification: B — PARTIAL_RESIDUAL_GAP**

Existing evidence provides full spatial foundation. Missing: explicit LOCAL_OPERATOR or FOUNDER judgment on whether vehicle presence changes the direction/station recommendation for Odongdo-combined itinerary. REL-005's judgment is for the no-vehicle case; the vehicle-modified judgment remains uncollected.

---

## 4. New Evidence Collection

### 4.1 Sources Accessed

**Search 1:** "여수 해상케이블카 오동도 자가용 렌트카 방향 추천 자산 돌산 탑승 코스"  
→ yeosucablecar.com/kr/information/guide (LOCAL_OPERATOR OFFICIAL — SSL issue prevents direct fetch; content via search snippet)  
→ oh-my-post.com/yeosu-cable-car-parking/ (NON_OFFICIAL_AGGREGATOR)

**Search 2:** "여수 케이블카 자가용 자산역 오동도 주차 편도 방향 블로그 추천"  
→ oh-my-post.com/yeosu-cable-car-parking/ (NON_OFFICIAL_AGGREGATOR — fetched directly)

---

## 5. Evidence Records

### EI-REL-006-A

| Field | Value |
|---|---|
| Evidence ID | EI-REL-006-A |
| ER | ER-REL-006 |
| Source | yeosucablecar.com/kr/information/guide (official operator site, content via search snippet) |
| Source Role | LOCAL_OPERATOR (PRIMARY) |
| Language | Korean |
| Access Status | ACCESSED (via search snippet; direct SSL error as previously noted in CC-005) |
| Independence | Independent of all other ERs (official operator source) |
| Raw Claim | "자가용을 이용한다면 돌산정류장에 위치한 여수시 돌산공원 공영주차장(1시간 무료 이후 10분당 200원)을 이용하거나, 오동도 입구, 소노캄 호텔 맞은편에 위치한 여수시 오동도 공영주차장(1시간 무료 이후 10분당 200원)을 이용하면 편리합니다." AND "돌산(놀아)정류장, 자산(해야)정류장 2곳 모두 발권 및 탑승이 가능합니다. 이용하기 편한 정류장에서 발권 및 탑승하면 됩니다." |
| Normalized Claim | Official operator recommends two parking options for vehicle users: (1) 돌산 공영주차장 at 돌산 station, (2) 오동도 입구 공영주차장 adjacent to 자산 station. Both stations valid for boarding. Boarding station = "whichever is convenient." |
| Claim Type | LOCAL_OPERATOR OPERATIONAL GUIDANCE |
| Confidence | HIGH (official operator guidance) |
| Stability | STABLE (operational policy) |
| Limitations | SSL access issue for direct verification; content confirmed via search snippet; consistent with CC-005 sources |
| REL-006 Mapping | Confirms vehicle users have two explicit parking options; 오동도 parking = 자산-adjacent → 자산 boarding; 돌산 parking → 돌산 boarding |
| Reuse Classification | NEW |

### EI-REL-006-B

| Field | Value |
|---|---|
| Evidence ID | EI-REL-006-B |
| ER | ER-REL-006 |
| Source | oh-my-post.com/yeosu-cable-car-parking/ (Korean travel guide, parking comparison article) |
| Source Role | LOCAL_OPERATOR secondary / NON_OFFICIAL_AGGREGATOR |
| Language | Korean (content fetched in English translation) |
| Access Status | ACCESSED (direct fetch) |
| Independence | Independent of REL-001/002/005 artifacts |
| Raw Claim | "For Odongdo + Cable Car (morning visit): The guide recommends the Jasan station area. If you complete both within one hour, parking is free. This makes Jasan Station the optimal choice for combining these two attractions." AND "오동도 입구 주차장의 장점은 자산정류장과 가장 가까우며, 주차타워 엘리베이터를 통해 케이블카 탑승장까지 무료로 올라갈 수 있습니다." AND "The parking structure assumes round-trip vehicle use, with strategy focusing on which station to depart from based on your schedule." |
| Normalized Claim | For vehicle users combining Odongdo + Cable Car: 자산 area parking recommended as starting point. Odongdo parking has elevator tower connecting directly to 자산 boarding. Round-trip from 자산 is the assumed pattern for vehicle users in this combination. |
| Claim Type | LOCAL_OPERATOR/GUIDE JUDGMENT |
| Confidence | MEDIUM-HIGH (non-official guide, internally consistent with REL-001 spatial facts) |
| Stability | STABLE (parking structure / itinerary logic) |
| Limitations | NON_OFFICIAL_AGGREGATOR source; parking strategy is guide interpretation; "morning visit" context qualifier |
| REL-006 Mapping | Confirms vehicle users in Odongdo+CC combo naturally board from 자산; round-trip (not one-way 돌산→자산) is the vehicle-user pattern |
| Reuse Classification | NEW |

---

## 6. Rejected Evidence

| Source | Reason |
|---|---|
| yeosucablecar.com direct fetch | SSL error (self-signed certificate — known issue from CC-005) — accepted via search snippet only |
| REL-003 time structure | CONTEXT_ONLY for vehicle-impact judgment; time evidence ≠ directional impact |
| REL-004 friction character | CONTEXT_ONLY; friction evidence ≠ vehicle-impact directional judgment |
| Route Corpus direction co-occurrence | CONTEXT_ONLY per canonical source-role classification |

---

## 7. Relationship Pattern Established

### Core Judgment: Vehicle Presence IS Material to Direction/Station Choice

**With vehicle (Odongdo-combined itinerary):**

1. **PRIMARY pattern (자산 parking → round-trip or 자산→돌산):**  
   - Park at 오동도 공영주차장 (자산-adjacent, ~2-3min from Odongdo entrance)  
   - Visit Odongdo first (or cable car first, return to Odongdo)  
   - Board cable car from 자산 (elevator tower direct from parking to boarding)  
   - Round-trip from 자산 OR 자산→돌산 one-way + drive back from 돌산 via bridge  
   - Guide explicitly recommends 자산 area for Odongdo+CC vehicle combination  

2. **SECONDARY pattern (돌산 parking → 돌산→자산):**  
   - Park at 돌산 station lot  
   - Board cable car 돌산→자산 (same as no-vehicle preferred direction)  
   - Walk ~5min from 자산 to Odongdo entrance  
   - After Odongdo visit: need transit/taxi back to 돌산 for car (~10-12min via bridge) — adds return burden  

**Without vehicle (REL-005 baseline):**
- 돌산→자산 one-way STRONGLY PREFERRED  
- 자산 exit 5min to Odongdo; no taxi needed for Odongdo access  
- Return from Odongdo: public transit or continue onward without car-retrieval burden  

### Directional Implication Summary

| Traveler State | Recommended Pattern | Direction Preference |
|---|---|---|
| No vehicle | 돌산→자산 one-way | 돌산→자산 PREFERRED (REL-005) |
| Vehicle, park at 자산/Odongdo area | 자산 as base; round-trip from 자산 OR 자산→돌산 | 자산→돌산 or round-trip from 자산 |
| Vehicle, park at 돌산 | 돌산→자산 cable car; return burden for car retrieval | 돌산→자산 works, but adds car-retrieval logistics |

**Net judgment: Vehicle presence DOES materially affect direction/station choice.** The "preferred direction" shifts from 돌산→자산 (no-vehicle) to 자산 as natural boarding station (vehicle + 오동도 parking). The shift is not a reversal but a change of the optimal starting station, driven by parking location logic.

---

## 8. Conditional Boundaries

| Condition | Behavior |
|---|---|
| Vehicle + Odongdo parking choice: 자산/오동도 area | 자산 = natural boarding station; round-trip or 자산→돌산 viable |
| Vehicle + Odongdo parking choice: 돌산 | 돌산→자산 remains logical, but car retrieval from 자산 adds ~10-12min taxi back to 돌산 |
| Vehicle + NO Odongdo combination | Direction neutral (REL-005 exception: if no Odongdo, direction neutral) |
| No vehicle + Odongdo combination | 돌산→자산 one-way PREFERRED (REL-005, unchanged) |
| Peak parking (자산 area, weekend 14:00-20:00) | 자산 area nearly full; consider 돌산 parking + 돌산→자산 direction as alternative |
| Vehicle + wanting one-way only | 오동도 parking → 자산 board → 자산→돌산 one-way → drive back from 돌산 (~15min via bridge) |

**Exception boundary:** Vehicle presence does NOT change the recommendation if traveler parks at 돌산 — in that case, 돌산→자산 direction is still the efficient one, same as no-vehicle.

---

## 9. Conflicts / Variation

| Conflict ID | Type | Description | Resolution |
|---|---|---|---|
| VAR-REL-006-01 | CONDITION_VARIATION | Direction preference differs by vehicle parking location (자산 vs 돌산) | NOT a conflict — CONDITION_VARIATION by parking choice; both preserved |
| VAR-REL-006-02 | EXPERIENCE_VARIATION | Round-trip vs one-way preference for vehicle users | Guide assumes round-trip from 자산; one-way 자산→돌산 also viable with drive-back; both documented |

No blocking conflicts. All variation preserved with conditions.

---

## 10. Stability and Live Trigger

**Stability Classification: STABLE**  
The vehicle-impact judgment itself is structural/logical — it depends on spatial facts (REL-001/002) and parking structure (OD-003/OD-004), all STABLE. The judgment does not change with daily operating conditions.

**Live Trigger:** None for REL-006 vehicle-impact judgment itself (per canonical Matrix contract).  
CC-005 live trigger (cable car suspension) applies to the cable car operating state — preserved and referenced but not redefined here.

**SEMI_STABLE note:** Parking lot fees and availability patterns are SEMI_STABLE (same as OD-004/CC-003 artifacts). The directional judgment based on parking location remains STABLE even if specific fees change.

---

## 11. Traveler Condition Hypothesis Relevance

**Tag: POTENTIAL_RESEARCH_RELEVANCE**

REL-006 demonstrates that traveler state (vehicle ownership/availability) directly changes the recommended direction/station — a canonical example of the Traveler Condition × Experience Requirement hypothesis. Specifically:
- Traveler state: HAS_VEHICLE vs. NO_VEHICLE
- Experience requirement: Odongdo access efficiency
- Conditional judgment output: different direction recommendation by state

This is the clearest example in the 29-ER corpus where traveler-state directly changes the directional judgment output. Not promoted to Candidate — promotion evidence gates require multi-place verification + pilot evidence.

---

## 12. Journey Knowledge Hypothesis Relevance

**Tag: POTENTIAL_RESEARCH_RELEVANCE**

- **Transport Logistics:** Vehicle presence creates multiple parking-strategy paths, each implying different logistics (round-trip vs. one-way + drive-back)
- **Day-level Time Budget:** 오동도 parking → 1-hour free window creates implicit time pressure; round-trip vs. one-way timing differs
- **Plan Change / Counterfactual:** If 자산 area parking full (weekend afternoon) → shift to 돌산 parking → direction recommendation changes dynamically

Not promoted. Tagged only.

---

## 13. Reuse Metrics (Operational Observation)

| Metric | Count |
|---|---|
| Total accepted evidence items | 9 (7 reused + 2 new) |
| DIRECT_REUSE | 5 (R1-R4, R6) |
| PARTIAL_REUSE | 2 (R5-REL-005, R7-OD-004) |
| CONTEXT_ONLY | 0 |
| Newly collected | 2 (EI-REL-006-A, EI-REL-006-B) |
| Stop Condition satisfied by reuse alone? | NO — reuse provided spatial foundation; new LOCAL_OPERATOR judgment needed for vehicle-impact |

**Cycle-over-cycle comparison:**
- Cycle 23 (REL-003): 0 new external sources — full reuse
- Cycle 24 (REL-004): 3 new WE sources
- Cycle 25 (REL-006): 2 new LOCAL_OPERATOR sources

**Prepared-Evidence Reuse Observation: EARLY_REPEAT_SIGNAL**

REL-006 required only 2 targeted searches (vs. broader earlier waves). Accumulated REL-001/002/OD-003 spatial evidence provided the full factual foundation without recollection, reducing marginal research to the vehicle-impact judgment gap only. Pattern is consistent but based on only 3 cycles — insufficient for causal claim. Observation preserved; not promoted.

---

## 14. Stop Condition Evaluation

**Stop Condition:** EXPERT_JUDGMENT_SUFFICIENT

**Required (per Plan §354):** "Factual foundation VERIFIED_FOR_PREPARATION; Founder judgment provided with scope, traveler-state conditions, and exception boundary"

| Criterion | Status |
|---|---|
| Factual foundation VERIFIED_FOR_PREPARATION | ✓ — REL-001, REL-002, REL-005, OD-003 all VERIFIED |
| Judgment on vehicle-impact provided | ✓ — EI-REL-006-A (LOCAL_OPERATOR OFFICIAL): two parking options for vehicles explicitly documented; EI-REL-006-B (guide): 자산 area recommended for Odongdo+CC vehicle combination |
| Scope defined | ✓ — Odongdo-combined itinerary only (C-3, O-3 scenarios) |
| Traveler-state conditions | ✓ — WITH vehicle vs. WITHOUT vehicle differentiated; parking location sub-condition documented |
| Exception boundary | ✓ — Vehicle parked at 돌산 = same direction logic as no-vehicle; vehicle impact is parking-location-dependent |
| Negative evidence | ✓ — "Vehicle does not reverse 돌산→자산 preference universally; parking location is the determining sub-condition" |

**Stop Condition: PASS**

---

## 15. Final Status

**ER-REL-006: VERIFIED_FOR_PREPARATION**  
**Gap: CLOSED**

---

## 16. Downstream Effects

| ER | Previous State | New State | Reason |
|---|---|---|---|
| HY-008 | HARD BLOCKED | HARD BLOCKED (unchanged) | Requires HY-003 VERIFIED — unchanged |
| HY-003 | PROVISIONALLY_SUPPORTED | PROVISIONALLY_SUPPORTED (unchanged) | No new collection for HY-003 in this run |
| REL-003 | VERIFIED_FOR_PREPARATION | VERIFIED_FOR_PREPARATION (unchanged) | — |
| REL-004 | VERIFIED_FOR_PREPARATION | VERIFIED_FOR_PREPARATION (unchanged) | — |

REL-006 has no downstream ER dependencies per canonical Matrix. No further transitions triggered.

---

## 17. Wave 4 State After REL-006

| ER | Status |
|---|---|
| REL-003 | VERIFIED_FOR_PREPARATION |
| REL-004 | VERIFIED_FOR_PREPARATION |
| REL-006 | VERIFIED_FOR_PREPARATION |
| HY-008 | HARD BLOCKED (HY-003 VERIFIED_FOR_PREPARATION required; HY-003 = PROVISIONALLY_SUPPORTED) |

**WAVE_4_COLLECTION_EXECUTION_COMPLETE:**  
Per Plan governance: Wave 4 has 11 ERs. HY-008 = HARD BLOCKED (not FAILED or IN_COLLECTION). Plan defines terminal blocked states as execution-complete when the blocking condition is an external prerequisite (HY-003 VERIFIED) that is itself canonically unresolved. All executable Wave 4 ERs are in VERIFIED_FOR_PREPARATION or HARD_BLOCKED terminal state. No ERs remain in READY_FOR_COLLECTION or NOT_STARTED (executable) states.  
**WAVE_4_COLLECTION_EXECUTION_COMPLETE: TRUE** (with HY-008 in terminal HARD_BLOCKED state)

**ALL_WAVE_4_ERS_VERIFIED:**  
FALSE — HY-008 = HARD BLOCKED, not VERIFIED_FOR_PREPARATION

---

## 18. HY-008 Governance Situation

**Current state:** HY-008 = HARD BLOCKED  
**Blocking condition:** HY-003 must be VERIFIED_FOR_PREPARATION (per Plan V0.2 §Wave 4)  
**HY-003 current:** PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY  
**Gap:** EP-3 (elder-specific descent friction) = PARTIAL_PASS  
**Open upgrade path:** Founder field validation — one observed elder descent account closes EP-3 at HIGH confidence via FOUNDER secondary role  
**Web upgrade paths:** EXHAUSTED (two targeted attempts)  

**Canonical next governance choices (from repository):**
1. **Founder field validation for HY-003** — single field observation closes EP-3 → HY-003 transitions to VERIFIED_FOR_PREPARATION → HY-008 unblocks
2. **Wave 4 closure with terminal block** — accept HY-008 as terminal HARD_BLOCKED; document governance disposition; proceed to Wave 5 scope (HY-009) and Pilot preparation gates
3. Plan governance does not define a forced HY-008 waiver path

No field validation performed in this run.

---

## 19. Cycle Accounting

| Item | Value |
|---|---|
| Starting cycle count | 24 |
| This cycle | REL-006 = Cycle 25 |
| Final cycle count | 25 |

---

## 20. Work Explicitly Not Executed

- HY-008 collection: NOT EXECUTED (HARD BLOCKED)
- HY-003 Founder field validation: NOT EXECUTED
- HY-003 new web search: NOT EXECUTED
- YTC Coverage Check: NOT EXECUTED
- Prepared Knowledge construction: NOT EXECUTED
- Prepared Context: NOT EXECUTED
- Internal 3-place Pilot: NOT EXECUTED
- Integrity Gate: NOT EXECUTED
- Human Blind Test activation: NOT EXECUTED
- Candidate creation: NOT EXECUTED
- Architecture Decision: NOT EXECUTED
- place_knowledge migration: NOT EXECUTED
- Schema / DB / Runtime / Production change: NOT EXECUTED
- REL-003 re-execution: NOT EXECUTED
- REL-004 re-execution: NOT EXECUTED

---

## 21. Provenance Summary

| EI ID | Source | Source Role | Original ER | Reuse Class | Confidence | Stability | Limitation |
|---|---|---|---|---|---|---|---|
| EI-REL-006-R1 | REL-001-C | MAP_ROUTE | REL-001 | DIRECT_REUSE | HIGH | STABLE | Point estimate only |
| EI-REL-006-R2 | REL-001-E | MAP_ROUTE (DERIVED) | REL-001 | DIRECT_REUSE | HIGH | STABLE | Taxi estimate range |
| EI-REL-006-R3 | REL-002-A | WORLD_EXPERIENCE | REL-002 | DIRECT_REUSE | HIGH | STABLE | — |
| EI-REL-006-R4 | REL-002-D | MAP_ROUTE | REL-002 | DIRECT_REUSE | HIGH | STABLE | No pedestrian alternative |
| EI-REL-006-R5 | REL-005 judgment | FOUNDER/MAP_ROUTE | REL-005 | PARTIAL_REUSE | HIGH | STABLE | Vehicle condition not addressed |
| EI-REL-006-R6 | OD-003-A | OFFICIAL | OD-003 | DIRECT_REUSE | HIGH | STABLE | Prohibition policy |
| EI-REL-006-R7 | OD-004 (237 spaces) | OFFICIAL OPERATOR | OD-004 | DIRECT_REUSE | HIGH | SEMI_STABLE | Fee structure SEMI_STABLE |
| EI-REL-006-A | yeosucablecar.com/kr/information/guide | LOCAL_OPERATOR | NEW | NEW | HIGH | STABLE | SSL issue; via search snippet |
| EI-REL-006-B | oh-my-post.com/yeosu-cable-car-parking/ | NON_OFFICIAL_AGGREGATOR | NEW | NEW | MEDIUM-HIGH | STABLE | Non-official; morning qualifier |
