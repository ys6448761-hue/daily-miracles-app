# SOUL Place Knowledge Authoring — Project State
# 2026-09-24

**Branch:** staging/storybook-c7a  
**Status:** Yi Sun-sin Square SAVED / GREEN — Jongpo Marine Park SAVED / GREEN — Hamel Lighthouse WE+Founder SAVED / GREEN — Cable Car WE+Founder SAVED / GREEN — CAND-OPS-003 CREATED / DRAFT — Review Plan SAVED / READY — Geumodo Blind Test Research SAVED / GREEN — Geumodo WE Review SAVED / PASS WITH CORRECTIONS — Geumodo WE Corrections SAVED / GREEN — Geumodo Founder Review SAVED / GREEN — Geumodo DreamTown Comparison SAVED / GREEN — Geumodo SOUL Utility Protocol SAVED / READY — Geumodo SOUL Utility A/B Execution SAVED / GREEN — Geumodo Blind Evaluation SAVED / GREEN — Geumodo Unblinding SAVED / GREEN — Blind Test Final Review SAVED / PASS (REVISION RECOMMENDED) — CAND-OPS-003 V0.2 Revision SAVED / PASS — Promotion Review SAVED / PASS — CAND-OPS-003 V0.2 = Candidate / Approved (Founder Approval 2026-09-25) — Post-Approval Operational Validation Scope V0.2 SAVED / READY — Operational Validation Execution Design SAVED / EXECUTION READY — **Wave 1 ER-OD-001 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 1 ER-HY-001 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 1 ER-CC-001 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **WAVE_1_COMPLETE (2026-09-27)** — **Wave 2 ER-OD-004 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 2 ER-HY-002 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 2 ER-HY-006 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 2 ER-CC-002 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 2 ER-REL-001 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **WAVE_2_COMPLETE (2026-09-27) — Cycles Completed: 9** — **Wave 3 ER-REL-002 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)** — **Wave 3 ER-CC-003 Collection COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27) — Cycles Completed: 11**  
**관련 설계:** SOUL Place Knowledge Schema + Authoring Plan V0.1 (대화 컨텍스트 기록)  
**Constraint:** Production / runtime / DB 변경 금지

---

## Authoring Pilot Overview

### Goal

SOUL이 안정적인 내부 지식만으로 일반적인 Yeosu 장소 질문에 여행 친구처럼 답하도록
place_knowledge 레이어 지식을 Founder Review 기반으로 구축한다.

### Workflow

```
Claude Draft → Founder Review → Approved Knowledge → (미래) DB migration
```

모든 field에 provenance 태그 포함.  
VERIFY_REQUIRED, LIVE_CHECK, DO_NOT_PROMOTE 항목은 명시적으로 분리.

---

## Place Knowledge Authoring Queue

| # | Place | place_code | Authoring | Founder Review | World Exp Review | Status | Document |
|---|---|---|---|---|---|---|---|
| 1 | 이순신광장 | lee_soon_shin_plaza | DONE | DONE | DONE | **SAVED / GREEN** | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_LEE_SOON_SHIN_PLAZA_V0_1.md` |
| 2 | 종포해양공원 | marine_park | DONE | DONE | DONE | **SAVED / GREEN** | `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_MARINE_PARK_V0_1.md` |
| 3 | 하멜등대 | hamel_lighthouse (신규) | DONE | DONE | DONE | **SAVED / GREEN** | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_HAMEL_LIGHTHOUSE_FOUNDER_V0_1.md` |
| 4 | 오동도 | odongdo | — | — | — | QUEUED | — |
| 5 | 향일암 | hyangiram | — | — | — | QUEUED | — |
| 6 | 케이블카 | cablecar | DONE | DONE | DONE | **SAVED / GREEN** | WE: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_WE_V0_1.md` / Founder: `docs/knowledge/YEOSU_PLACE_KNOWLEDGE_CABLE_CAR_FOUNDER_V0_1.md` |
| 7 | 자산공원 | jaisan_park | — | — | — | QUEUED | — |
| 8 | 돌산공원 | dolsan_nightscape | — | — | — | QUEUED | — |
| 9 | 낭만포차거리 | romantic_pojangmacha | — | — | — | QUEUED | — |
| 10 | 중앙시장 | jungang_market | — | — | — | QUEUED | — |
| 11 | 스카이타워 | sky_tower | — | — | — | QUEUED | — |
| 12 | 엑스포공원 | yeosu_expo_park | — | — | — | QUEUED | — |

### Hamel Lighthouse Blocker

| Blocker | Status |
|---|---|
| lat/lng 또는 주소 Founder 확인 | ✗ OPEN |
| admission_fee Founder 확인 | ✗ OPEN |
| travel_places migration 초안 | ✗ OPEN |
| `등대` → PLACE_SUFFIX_RE 추가 (code change) | ✗ OPEN |

World Experience Review + Founder Review V0.1 완료.  
Conflict Register A–D 전체 OPEN 유지 — Official Verification 미완료.  
신규 VERIFY_REQUIRED: 빨간/흰 등대 항로표지 공식 의미.  
blocker (lat/lng / admission_fee / PLACE_SUFFIX_RE / PLACE_ALIAS_MAP) 미해소.

---

## Current Next Action

**[SUPERSEDED — see latest checkpoint below] Wave 4 Readiness Check: COMPLETE (2026-09-28). Wave 4 entry condition MET. ONE NEXT ACTION (at that time): Execute ER-OD-002. Controlled Collection Cycles: 15.**

**CURRENT ONE NEXT ACTION (2026-09-28 — post HY-008 Option B decision): Begin Prepared Knowledge construction for the 3-place pilot (오동도, 향일암, 케이블카) using VERIFIED evidence. HY-003 KNOWN_LIMIT must be explicitly documented within Hyangiram prepared knowledge. Wave 4 operationally CLOSED. Controlled Collection Cycles: 25.**

**Founder HY-008 Governance Decision: OPTION_B_APPROVED (2026-09-28)**

```
Decision: Option B — Proceed with documented KNOWN_LIMIT
Artifact: docs/research/SOUL_YEOSU_HY_008_FOUNDER_GOVERNANCE_DECISION_V0_1.md
Starting HEAD: 53035d5 | Branch: staging/storybook-c7a

HY-003: PROVISIONALLY_SUPPORTED (UNCHANGED)
HY-003 disposition: ACCEPT_PROVISIONAL_WITH_BOUNDARY
HY-003 EP-3: PARTIAL_PASS (UNCHANGED)
HY-003 web upgrade path: EXHAUSTED
HY-003 reopen path: OPEN (Founder field validation — one elder descent observation closes EP-3)

HY-008: HARD_BLOCKED + TERMINAL_FOR_CURRENT_COLLECTION_PHASE
KNOWN_LIMIT: Elder-specific descent-friction pattern not sufficiently established to
  support a strong negative/suitability boundary. SOUL must ASK capability (not age),
  QUALIFY uncertainty, and NOT fabricate a non-recommendation threshold.
H-2 diagnostic contract: SOUL must NOT infer suitability from "부모님". Must trigger
  necessary ASK. Pilot tests MISSED_NECESSARY_ASK behavior (primary research question).

WAVE_4_COLLECTION_EXECUTION_COMPLETE: TRUE
ALL_WAVE_4_ERS_VERIFIED: FALSE (HY-008 TERMINAL_FOR_CURRENT_COLLECTION_PHASE)
Controlled Collection Cycles: 25 (UNCHANGED — governance decision ≠ evidence cycle)

Reopen conditions: OPEN (R1=Pilot H-2 integrity fail / R2=Founder natural field obs /
  R3=H-2 unsafe under QUALIFY / R4=Integrity Gate requires HY-008 / R5=new contradictory evidence)

Wave 5 (HY-009 + CX-001): NOT required before 3-place Pilot.
  HY-009 = P2 supporting depth (independent Wave 5 exit condition).
  CX-001 = system behavioral test verified during Pilot execution itself.
  Neither blocks Prepared Knowledge construction.

Canonical next phase: Prepared Knowledge construction → Internal Pilot → Integrity Gate → Founder Go/No-Go → Human Blind Test (HOLD)
YTC Coverage Check: NOT the immediate next action.

Prepared-Evidence Reuse Observation: EARLY_REPEAT_SIGNAL (Cycle 23: 0 new / Cycle 24: 3 new / Cycle 25: 2 new) — supports transition to preparation phase. NOT promoted.
Traveler Condition × Experience Requirement: RESEARCH_HYPOTHESIS (UNCHANGED)
Human Blind Test: HOLD (UNCHANGED — Option B does NOT release HBT)
BT Verdict: NOT ASSIGNED
Participant Evidence: NONE
Prepared Knowledge: RESEARCH_HYPOTHESIS ONLY → NEXT ACTION: begin construction
Prepared Context: RESEARCH_HYPOTHESIS ONLY
place_knowledge migration: NOT APPROVED
DB / Schema / Runtime / Production: NO CHANGE
ALL_WAVE_3_ERS_VERIFIED: FALSE (UNCHANGED)
```

**Wave 4 ER-OD-002 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28). EXPERIENCE_PATTERN_SUFFICIENT MET — 4 independent WE sources (EI-OD-002-A kidsfuninseoul WP family account; EI-OD-002-B Trip.com 2026 traveler moments; EI-OD-002-C TripAdvisor+guides synthesis; EI-OD-002-D Route Corpus R028+R040). Duration pattern: 30-60min minimum / 1-hour standard loop / 1-2 hours thorough / half-day if combined with Cable Car. Value drivers converged: forest trail immersion + lighthouse panoramic viewpoint + camellia season (Jan-March) + named features (Dragon Cave, Bamboo Tunnel, Musical Fountain). Physical scope: compact 0.12km²; 2.5km trail loop; family-accessible; single-visit completable. FOUNDER secondary not collected (not required for stop condition; gap noted). DOWNSTREAM: REL-003 all 4 dependencies now satisfied (REL-001 ✓ REL-002 ✓ OD-002 ✓ CC-005 ✓) → REL-003 = READY_FOR_COLLECTION. Controlled Collection Cycles: 15 → 16. Artifact: docs/research/SOUL_YEOSU_ER_OD_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md.**

**Wave 4a COMPLETE — ALL 6 REMAINING ERs VERIFIED_FOR_PREPARATION (2026-09-28). Cycles 17-22 executed. Phase 4-α (HY-005 Cycle 17, HY-004 Cycle 18, OD-005 Cycle 19, OD-007 Cycle 20, CC-004 Cycle 21) + Phase 4-β (REL-005 Cycle 22, executed LAST per Plan ordering). HY-005: 평지길 exists (WE 2 sources); starts ticket office; ~15 min; full temple access; BATCH_01 NOT_APPLICABLE; AUTHORITATIVE_FACT_SUFFICIENT. HY-004: No designated ascent rest stops (4 WE sources — informative negative); within-temple 경내 shade; flat route informal rest; EXPERIENCE_PATTERN_SUFFICIENT. OD-005: Causeway stroller-accessible; some island stair sections; playground/stamp tour/Dongbaek Train alternatives; "가족 산책 코스"; EXPERIENCE_PATTERN_SUFFICIENT. OD-007: Causeway 768m flat deck; ~10-15 min; "바다 위를 걷는 느낌"; minimal friction; "누구나 부담 없이"; EXPERIENCE_PATTERN_SUFFICIENT. CC-004: Regular cabin child-friendly (stroller folded); Crystal = glass floor anxiety + stroller restriction; 자산 = elevator+판타지뉴월드; 돌산 = elevator+café; no nursing rooms documented; under-36m free (OFFICIAL); EXPERIENCE_PATTERN_SUFFICIENT. REL-005: 돌산→자산 PREFERRED for Odongdo-combined itinerary (geographic + one-way ticket logic from REL-001/002 facts); EXPERT_JUDGMENT_SUFFICIENT. DOWNSTREAM: REL-006 transitions READY_FOR_COLLECTION (all 4 deps: REL-001 ✓ REL-002 ✓ REL-005 ✓ OD-003 ✓). Controlled Collection Cycles: 16 → 22. Wave 0 gap register updated. ONE NEXT ACTION: Wave 4b — execute REL-003 (READY_FOR_COLLECTION, all 4 deps satisfied) — Founder authorization required before proceeding.**

**Wave 4b ER-REL-003 Collection: VERIFIED_FOR_PREPARATION (2026-09-28)**

```
REL-003 Controlled Evidence Collection — Cycle 23 (2026-09-28)
  ER: ER-REL-003 — Time Estimate for Cable Car + Odongdo Combined Sequence
  Starting HEAD: be12cea | Branch: staging/storybook-c7a
  Final Status: VERIFIED_FOR_PREPARATION
  Stop Condition: SEMI_STABLE_PATTERN_WITH_TRIGGER — PASS (both deliverables complete)
  Collection Method: FULL REUSE — no new external evidence collection

  Evidence Components (all from admissible reuse):
    EI-REL-003-A: Cable car ride ~10 min one-way (CC-005-C, CONTEXTUAL)
    EI-REL-003-B: 자산→오동도 입구 ~5 min walk (REL-001-C / REL-002-A, STABLE)
    EI-REL-003-C: Causeway ~768m, ~10-15 min, flat deck (OD-007 WE, STABLE)
    EI-REL-003-D: Odongdo one-loop ~1 hour (OD-002-B Trip.com, STABLE)
    EI-REL-003-E: Odongdo 1-2 hr standard; 2+ hr photography (OD-002-C aggregated, STABLE)
    EI-REL-003-F: Tour bus 60 min; minimalist 30-60 min (OD-002-D Route Corpus, STABLE)
    EI-REL-003-G: "Combined Cable Car + Odongdo: half-day (3-4 hours)" (OD-002 §5.1, 4-source WE convergence, HIGH)
    EI-REL-003-H: 돌산 exit → 오동도 = taxi required (~10-12 min, exception case) (REL-002 MAP_ROUTE)
    EI-REL-003-I: Live trigger design — CC-005 operating status (OFFICIAL suspension rule)
  REL-005: PARTIAL_REUSE — identifies standard-case direction (자산 exit = 5 min connection) without importing direction judgment

  Combined Sequence Time Pattern (standard direction: 돌산→자산 one-way + Odongdo):
    Overhead: ride ~10 min + connection ~5 min + causeway ~10-15 min = ~25-30 min
    Minimum visit: ~1 to 1.5 hours total (30-60 min Odongdo + ~30 min overhead)
    Standard visit: ~2 to 2.5 hours total (1-2 hr Odongdo + ~30 min overhead)
    Thorough/photography: ~2.5 hours+ total
    WE half-day pattern: ~3-4 hours total (4-source convergence, HIGH confidence)

  Negative/Exception Knowledge:
    Available time < 1 hour → impractical
    Cable car suspended → sequence collapses; Odongdo-only possible
    Non-preferred direction (자산→돌산) → adds taxi overhead (~10-12 min); less efficient
    Late arrival (after ~17:00) → reduced content at Odongdo (train/lighthouse closure risk)

  Live Trigger Design (COMPLETE):
    Stale condition: CC-005 live trigger fires (강풍주의보/경보) OR Odongdo access point change
    Verification: CC-005 live-check (운행현황 / 061-664-7301) + OFFICIAL
    Fallback: describe sequence without time framing; QUALIFY; defer to CC-005 status

  Dependency transitions:
    REL-004: NOT_STARTED → READY_FOR_COLLECTION (all 3 deps: REL-001 ✓ REL-002 ✓ REL-003 ✓)
    REL-006: READY_FOR_COLLECTION (unchanged)
    HY-008: HARD BLOCKED (unchanged)
    HY-003: PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY (unchanged)

  Controlled Collection Cycles: 22 → 23
  Wave 4b Status: REL-003 VERIFIED; REL-004 READY; REL-006 READY; HY-008 HARD BLOCKED
  ALL_WAVE_3_ERS_VERIFIED: FALSE (unchanged — HY-003 ACCEPT_PROVISIONAL blocks)
  Traveler Condition × Experience Requirement: RESEARCH_HYPOTHESIS (POTENTIAL_RESEARCH_RELEVANCE noted for REL-003)
  Journey Knowledge: POTENTIAL_RESEARCH_RELEVANCE noted (Day Budget / Transport Logistics / Counterfactual)
  Human Blind Test: HOLD
  BT Verdict: NOT ASSIGNED
  Prepared Knowledge: RESEARCH_HYPOTHESIS ONLY
  Prepared Context: RESEARCH_HYPOTHESIS ONLY
  place_knowledge migration: NOT APPROVED
  DB / Schema / Runtime / Production: NO CHANGE

  Files created: docs/research/SOUL_YEOSU_ER_REL_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Files modified: docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_WAVE_0_V0_1.md | docs/architecture/SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md

  ONE NEXT ACTION: Wave 4b — execute ER-REL-004 (READY_FOR_COLLECTION, all 3 deps satisfied) OR ER-REL-006 (READY_FOR_COLLECTION, all 4 deps satisfied). REL-004 recommended first (canonical Wave 4b dependency chain: REL-003 → REL-004; REL-006 is independent). Founder authorization required before proceeding.
```

**Wave 4b ER-REL-006 Collection: VERIFIED_FOR_PREPARATION (2026-09-28)**

```
REL-006 Controlled Evidence Collection — Cycle 25 (2026-09-28)
  ER: ER-REL-006 — Vehicle Impact on Cable Car Direction/Exit Choice
  Starting HEAD: 87c3e59 | Branch: staging/storybook-c7a
  Final Status: VERIFIED_FOR_PREPARATION
  Stop Condition: EXPERT_JUDGMENT_SUFFICIENT — PASS
  Collection Method: 7 reused items (DIRECT/PARTIAL from deps) + 2 new LOCAL_OPERATOR sources

  REL-005 Admissibility: PARTIAL_REUSE — no-vehicle baseline judgment reused as reference point; vehicle condition not addressed in REL-005

  Evidence Accepted:
    EI-REL-006-R1 through R7: REL-001/002/005/OD-003/004 spatial + parking foundation (DIRECT/PARTIAL_REUSE)
    EI-REL-006-A: yeosucablecar.com/kr/information/guide (LOCAL_OPERATOR OFFICIAL) — two parking options for vehicles: 돌산 station lot OR 오동도 입구 lot (자산-adjacent); both stations valid boarding; "이용하기 편한 정류장에서 탑승"
    EI-REL-006-B: oh-my-post.com/yeosu-cable-car-parking/ (NON_OFFICIAL_AGGREGATOR) — 자산 area recommended for Odongdo+CC vehicle combination; 오동도 parking = elevator direct to 자산 boarding; round-trip from 자산 assumed for vehicle users

  Relationship Pattern (Vehicle Impact):
    Vehicle presence IS material to direction/station choice.
    With vehicle (자산/Odongdo area parking): 자산 = natural boarding station; round-trip from 자산 or 자산→돌산 one-way viable; 오동도 parking → elevator direct to 자산 탑승장
    With vehicle (돌산 parking): 돌산→자산 still logical, but car retrieval after Odongdo adds ~10-12min taxi back to 돌산
    Without vehicle (REL-005 baseline): 돌산→자산 one-way STRONGLY PREFERRED — no taxi needed; 자산 exit = 5min to Odongdo
    Exception: vehicle at 돌산 = no directional change from no-vehicle; impact is parking-location-dependent
    Peak qualifier: 자산 area nearly full weekend 14:00-20:00 → 돌산 parking viable alternative

  Stability: STABLE (vehicle-impact judgment); parking fees = SEMI_STABLE (not affecting directional judgment)
  Live Trigger: None for vehicle-impact judgment itself (CC-005 trigger applies to operating state — preserved)

  Reuse Metrics: 7 reused / 2 new; Prepared-Evidence Reuse Observation = EARLY_REPEAT_SIGNAL
  Traveler Condition: POTENTIAL_RESEARCH_RELEVANCE (vehicle = traveler state that directly changes directional recommendation — clearest ER-corpus example)
  Journey Knowledge: POTENTIAL_RESEARCH_RELEVANCE (Transport Logistics, Day Budget, Plan Change/Counterfactual)

  Dependency transitions: NONE (REL-006 has no downstream ER dependencies per Matrix)
  HY-008: HARD BLOCKED (unchanged)
  HY-003: PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY (unchanged)

  WAVE_4_COLLECTION_EXECUTION_COMPLETE: TRUE (all executable Wave 4 ERs in VERIFIED or terminal HARD_BLOCKED state)
  ALL_WAVE_4_ERS_VERIFIED: FALSE (HY-008 = HARD BLOCKED, not VERIFIED_FOR_PREPARATION)

  HY-008 Governance: Canonical options = (1) Founder field validation for HY-003 → EP-3 → HY-008 unblock, OR (2) Wave 4 closure with terminal block disposition. No field validation in this run.

  Controlled Collection Cycles: 24 → 25
  Wave 4b Status: REL-003 VERIFIED; REL-004 VERIFIED; REL-006 VERIFIED; HY-008 HARD BLOCKED

  Files created: docs/research/SOUL_YEOSU_ER_REL_006_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Files modified: docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_WAVE_0_V0_1.md | docs/architecture/SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md

  ALL_WAVE_3_ERS_VERIFIED: FALSE (unchanged — HY-003 ACCEPT_PROVISIONAL blocks)
  Traveler Condition × Experience Requirement: RESEARCH_HYPOTHESIS (POTENTIAL_RESEARCH_RELEVANCE confirmed for REL-006 as clearest example)
  Human Blind Test: HOLD
  BT Verdict: NOT ASSIGNED
  Prepared Knowledge: RESEARCH_HYPOTHESIS ONLY
  Prepared Context: RESEARCH_HYPOTHESIS ONLY
  place_knowledge migration: NOT APPROVED
  DB / Schema / Runtime / Production: NO CHANGE

  ONE NEXT ACTION: Wave 4 HY-008 Governance Decision — Founder chooses between (A) Founder field validation for HY-003 (open upgrade path, one field observation closes EP-3) or (B) Wave 4 closure with HY-008 in terminal HARD_BLOCKED state. Do NOT execute either option without Founder authorization.
```

**HY-008 Governance Decision Review: COMPLETE (2026-09-28)**

```
HY-008 Governance Decision Review (2026-09-28)
  Review Status: COMPLETE — Awaiting Founder Decision (A or B)
  Artifact: docs/research/SOUL_YEOSU_HY_008_GOVERNANCE_DECISION_REVIEW_V0_1.md
  Starting HEAD: ba2cc31 | Branch: staging/storybook-c7a

  HY-003: PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY (UNCHANGED)
  HY-003 EP-3: PARTIAL_PASS (UNCHANGED)
  HY-008: HARD BLOCKED (UNCHANGED)
  Controlled Collection Cycles: 25 (NO INCREMENT — governance review ≠ evidence cycle)
  Option A / B: AWAITING_FOUNDER_DECISION

  Key Findings:
    HY-008 Necessity Matrix:
      Prepared Knowledge construction: NOT_REQUIRED
      Internal Pilot execution: CONDITIONAL (valid under QUALIFY behavior)
      Integrity Gate: CONDITIONAL (PASS achievable with KNOWN_LIMIT)
      Founder Go/No-Go: NOT_REQUIRED (Wave 4 exit condition = BLOCKED with escalation = SATISFIED)
      Human Blind Test: NOT_REQUIRED for current state (HBT on HOLD)
    → HY-008 is NOT a hard prerequisite for any downstream gate under canonical contracts.

    Existing safe behavior (H-2): ASK capability + QUALIFY descent KNOWN_LIMIT — operable now.
    Founder judgment ingredients available as JUDGMENT_INGREDIENT: safety boundary ("consider not visiting") present.

    Option A benefits: Resolves EP-3 → HY-003 VERIFIED → HY-008 unblocks → expert non-recommendation boundary established.
    Option A cost: Requires Founder field observation at Hyangiram with elder traveler; timing uncertain; delays Pilot.
    Option B benefits: Pilot executes immediately; H-2 tests SOUL evidence-boundary discipline (diagnostic value); EARLY_REPEAT_SIGNAL supports moving to Pilot phase.
    Option B condition: HY-008 documented as KNOWN_LIMIT; reopen conditions defined.

    Pilot Diagnostic Value: HIGH under Option B — H-2 becomes canonical test of MISSED_NECESSARY_ASK behavior.
    Traveler Condition Hypothesis: POTENTIAL_RESEARCH_RELEVANCE confirmed — HY-003/HY-008 is the clearest 5-layer hypothesis demonstration in corpus.

    Reopen conditions (if Option B): Pilot failure on H-2 integrity / Founder natural field observation / H-2 unsafe under QUALIFY / Integrity Gate demands HY-008 / new contradictory evidence.
    Wave 4 closure semantics: WAVE_4_COLLECTION_EXECUTION_COMPLETE=TRUE (HY-008 BLOCKED with escalation satisfies Plan exit condition) / ALL_WAVE_4_ERS_VERIFIED=FALSE.

    Governance Recommendation: Option B (proceed with documented KNOWN_LIMIT) — Pilot executes now; Option A remains open for post-Pilot or natural field observation.
    Founder must confirm selection. Neither option executed.

  Invariants preserved:
    HY-003: PROVISIONALLY_SUPPORTED (UNCHANGED)
    ALL_WAVE_3_ERS_VERIFIED: FALSE (UNCHANGED)
    Traveler Condition × Experience Requirement: RESEARCH_HYPOTHESIS (UNCHANGED)
    Human Blind Test: HOLD (UNCHANGED)
    Prepared Knowledge / Context: RESEARCH_HYPOTHESIS ONLY (UNCHANGED)
    place_knowledge migration: NOT APPROVED (UNCHANGED)
    DB / Schema / Runtime / Production: NO CHANGE (UNCHANGED)

  ONE NEXT ACTION: Founder HY-008 Governance Decision — select Option A (field validation) or Option B (documented KNOWN_LIMIT, proceed to Pilot preparation). Do NOT execute downstream work without authorization.
```

**Wave 4b ER-REL-004 Collection: VERIFIED_FOR_PREPARATION (2026-09-28)**

```
REL-004 Controlled Evidence Collection — Cycle 24 (2026-09-28)
  ER: ER-REL-004 — Sequence Friction for Cable Car + Odongdo
  Starting HEAD: 75e3064 | Branch: staging/storybook-c7a
  Final Status: VERIFIED_FOR_PREPARATION
  Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT — PASS
  Collection Method: 3 new WE sources + 2 PARTIAL_REUSE from OD-007 + OD-002 §5.1

  REL-005 Admissibility: CONTEXT_ONLY — direction preference ≠ friction character

  Evidence Accepted:
    EI-REL-004-R1: OD-007 causeway WE (PARTIAL_REUSE) — 768m flat deck; "누구나 부담 없이"; "바다 위를 걷는 느낌"; 10-15 min
    EI-REL-004-R2: OD-002 §5.1 (PARTIAL_REUSE) — "half-day natural pairing" 4-source WE convergence
    EI-REL-004-R3: REL-003 exception conditions (PARTIAL_REUSE) — <1hr, suspension, late arrival
    EI-REL-004-A: searchingkorea.com — "아주 편리합니다"; Odongdo daytime → cable car at sunset recommended
    EI-REL-004-B: neoplats.com/37 (first-person) — nighttime Odongdo dark; 자산역 elevator until 22:00; reverse-direction return logistics anxiety; taxi resolution
    EI-REL-004-C: Trip.com users — "반나절 여행코스로 딱"; sunset cable car quality

  Relationship Pattern (Sequence Friction):
    Standard direction (돌산→자산, Odongdo follows): LOW friction — spatial proximity "아주 편리"; direct 5 min walk; causeway enjoyable
    Optimal timing: Odongdo daytime + cable car at sunset — experiential contrast; endorsed across 3 WE sources
    Physical transition: causeway 768m flat deck, "누구나 부담 없이" — no burden for most travelers
    Friction conditions:
      - Nighttime Odongdo: dark canopy ("컴컴한 숲") — trail experience significantly degraded
      - 자산역 elevator: operates until 22:00 only; 11-story stair after hours
      - Reverse direction (자산→돌산) one-way: return logistics anxiety; taxi required from 돌산
      - <1 hour available: impractical for combination
      - Cable car suspended: sequence collapses; Odongdo-only possible
    Variation: VAR-REL-004-01 (order: cable car first vs. Odongdo first — EXPERIENCE_VARIATION by timing)
               VAR-REL-004-02 (direction-specific return friction — CONDITION_VARIATION)

  Stability: STABLE (friction character); SEMI_STABLE (elevator timing policy)
  Live Trigger: None for friction character (CC-005 handles operating status per Matrix)

  Traveler Condition: POTENTIAL_RESEARCH_RELEVANCE (elevator accessibility, nighttime visual conditions)
  Journey Knowledge: POTENTIAL_RESEARCH_RELEVANCE (Day Budget, Transport Logistics, Counterfactual)

  Dependency transitions:
    REL-006: READY_FOR_COLLECTION (UNCHANGED — was already READY; REL-004 has no downstream deps)
    HY-008: HARD BLOCKED (unchanged)
    HY-003: PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY (unchanged)

  Controlled Collection Cycles: 23 → 24
  Wave 4b Status: REL-003 VERIFIED; REL-004 VERIFIED; REL-006 READY; HY-008 HARD BLOCKED
  ALL_WAVE_3_ERS_VERIFIED: FALSE (unchanged — HY-003 ACCEPT_PROVISIONAL blocks)
  Traveler Condition × Experience Requirement: RESEARCH_HYPOTHESIS (POTENTIAL_RESEARCH_RELEVANCE noted for REL-004)
  Human Blind Test: HOLD
  BT Verdict: NOT ASSIGNED
  Prepared Knowledge: RESEARCH_HYPOTHESIS ONLY
  Prepared Context: RESEARCH_HYPOTHESIS ONLY
  place_knowledge migration: NOT APPROVED
  DB / Schema / Runtime / Production: NO CHANGE

  Files created: docs/research/SOUL_YEOSU_ER_REL_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Files modified: docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_WAVE_0_V0_1.md | docs/architecture/SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md

  ONE NEXT ACTION: Wave 4b — execute ER-REL-006 (READY_FOR_COLLECTION, all 4 deps: REL-001 ✓ REL-002 ✓ REL-005 ✓ OD-003 ✓). Only remaining executable Wave 4b ER. Founder authorization required before proceeding.
```

```
Wave 4a ALL ERs COMPLETE — VERIFIED_FOR_PREPARATION (2026-09-28)
  Cycles: 17 (HY-005) → 18 (HY-004) → 19 (OD-005) → 20 (OD-007) → 21 (CC-004) → 22 (REL-005)
  Base: a7d35c9 (Wave 4a entry)
  Branch: staging/storybook-c7a

  Wave 4a ERs Completed:
    ER-HY-005 — Hyangiram Alternative Access Route (Cycle 17)
      Stop Condition: AUTHORITATIVE_FACT_SUFFICIENT
      Key: 평지길 exists; starts at ticket office; ~15 min; full temple access (대웅전/용왕전/관음전);
           gentle slope; bypasses stone gates; WE sources brunch.co.kr + comple.co.kr
      BATCH_01 reuse: NOT_APPLICABLE (admission/hours ≠ alternative route)
      File: docs/research/SOUL_YEOSU_ER_HY_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md

    ER-HY-004 — Hyangiram Rest Point Evidence (Cycle 18)
      Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT
      Key: No designated ascent rest stops (4 independent WE sources — informative negative);
           within-temple 경내 shade/seating after ascent; flat route enables informal pausing
      File: docs/research/SOUL_YEOSU_ER_HY_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md

    ER-OD-005 — Odongdo Child Suitability (Cycle 19)
      Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT
      Key: Causeway stroller-accessible (flat deck); some island stair sections (stroller must park);
           children's playground + stamp tour + Dongbaek Train alternatives;
           "가족 산책 코스"; best for 5+; under-5 manageable with Train
      File: docs/research/SOUL_YEOSU_ER_OD_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md

    ER-OD-007 — Odongdo Walking Friction from Access Point (Cycle 20)
      Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT
      Key: Causeway ~768m flat deck; ~10-15 min at leisurely pace; "바다 위를 걷는 느낌";
           "누구나 부담 없이"; Dongbaek Train alternative for those who cannot walk
      File: docs/research/SOUL_YEOSU_ER_OD_007_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md

    ER-CC-004 — Cable Car Per-Station Child Suitability (Cycle 21)
      Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT
      Key: Regular cabin = child-friendly (stroller folded OK);
           Crystal cabin = glass floor anxiety + stroller restriction (NOT recommended for young children);
           자산역: elevator + 판타지뉴월드 3F; 돌산역: elevator + large café;
           No nursing rooms documented at either station;
           Under-36m free (OFFICIAL — EI-CC-001-I REUSE)
      File: docs/research/SOUL_YEOSU_ER_CC_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md

    ER-REL-005 — Cable Car Direction Selection Judgment (Cycle 22) [Phase 4-β — executed LAST]
      Stop Condition: EXPERT_JUDGMENT_SUFFICIENT
      Key: 돌산 탑승 → 자산 하차 PREFERRED for Odongdo-combined itinerary;
           자산역 is ~5 min walk from 오동도 entrance (REL-001 fact);
           One-way ticket efficient in this direction (REL-002 fact);
           Exception: if not combining with Odongdo, direction is itinerary-neutral
      Downstream: REL-006 transitions → READY_FOR_COLLECTION
      File: docs/research/SOUL_YEOSU_ER_REL_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md

  Gap Register Updates:
    HY-004: NOT_STARTED → CLOSED (VERIFIED_FOR_PREPARATION)
    HY-005: NOT_STARTED → CLOSED (VERIFIED_FOR_PREPARATION)
    OD-005: NOT_STARTED → CLOSED (VERIFIED_FOR_PREPARATION)
    OD-007: NOT_STARTED → CLOSED (VERIFIED_FOR_PREPARATION)
    CC-004: PARTIALLY_SUPPORTED → CLOSED (VERIFIED_FOR_PREPARATION)
    REL-005: CONTEXT_ONLY → CLOSED (VERIFIED_FOR_PREPARATION)
    REL-006: NOT_STARTED → READY_FOR_COLLECTION

  Wave 4a Summary:
    Total ERs in Wave 4a: 7 (including OD-002 from prior cycle)
    OD-002: VERIFIED_FOR_PREPARATION (Cycle 16)
    Remaining 6: VERIFIED_FOR_PREPARATION (Cycles 17-22)
    Wave 4a Status: ALL COMPLETE

  Controlled Collection Cycles: 16 → 22
```

```
Wave 4 ER-OD-002 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)
  File: docs/research/SOUL_YEOSU_ER_OD_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: b038e2a (Wave 4 Readiness Check)

  ER: ER-OD-002 — Odongdo Visitor Experience Patterns
  Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT — 4/4 independent WE sources

  Starting State: FULL_GAP (OD-002 not started; OD-001-A duration deferred content available)

  Reused Items:
    EI-OD-001-A (deferred duration content): Family WP blog — half-day duration — REUSED as EI-OD-002-A
    Route Corpus R028: 60분 tour bus allocation — REUSED as EI-OD-002-D
    Route Corpus R040: 30~60분 소요 independent traveler — REUSED as EI-OD-002-D

  New Evidence Items:
    EI-OD-002-B: Trip.com traveler moments 2026 — "한 바퀴는 대체로 1시간 내외로 충분하다"; wooden deck trail; Dragon Cave/Wind Valley photo spots
    EI-OD-002-C: TripAdvisor+travel guide synthesis — 1-2 hours standard; 2+ hours photography; lighthouse panoramic view highlight

  Duration Pattern Synthesized:
    30-60 min: minimum purposeful (rushed/independent)
    ~1 hour: standard one-loop (tour bus standard)
    1-2 hours: recommended thorough visit
    2+ hours: unhurried with photography
    Half-day: combined Odongdo + Cable Car

  Value Drivers Converged:
    1. Forest trail immersion (2.5km canopy walk — thermal + sensory)
    2. Ocean panorama revelation (forest → cliff contrast)
    3. Lighthouse viewpoint (25m, panoramic Hallyeohaesang views)
    4. Camellia season (Jan-March, 3,000 trees — peak Feb-March)
    5. Named features: Dragon Cave, Bamboo Tunnel, Musical Fountain
    6. Accessibility: family-friendly, well-marked, compact completable

  Downstream Effect:
    REL-003: All 4 deps satisfied → REL-003 = READY_FOR_COLLECTION
    Unlocked: REL-003 → REL-004 chain (after REL-003 collection)

  FOUNDER Secondary: Not collected — not required for stop condition; gap noted for optional enrichment

  Controlled Collection Cycles: 15 → 16
```

Wave 3 ER-REL-002 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_REL_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 9251378 (Wave 3 Readiness Check)

  ER: ER-REL-002 — 케이블카 출구별 오동도 경로/연결
  Stop Condition: RELATIONSHIP_SUFFICIENT — 10/10 PASS

  Starting State: PARTIAL_GAP (EI-REL-001-C + EI-REL-001-E PARTIALLY_REUSABLE)

  Reused Items:
    EI-REL-001-C: 자산정류장 → 오동도 입구 도보 ~5분 (MAP_ROUTE) — PARTIALLY_REUSABLE
    EI-REL-001-E: 돌산정류장 → 오동도: 거북선대교 경유 택시 10~12분 (DERIVED) — PARTIALLY_REUSABLE
    NEG-REL-001-001: 자산→돌산 편도 오동도 비효율 — SUPPORTING_ONLY
    EI-OD-003-A: 오동도 입구/방파제 15분 도보 (OFFICIAL) — CONTEXT_ONLY

  New Evidence Items:
    EI-REL-002-A: 자산정류장 = 오동도 입구 구내 위치 (WORLD_EXPERIENCE, neoplats.com)
    EI-REL-002-B: 자산→오동도 섬 내부 도보 ~20분 (MAP_ROUTE, South of Seoul blog)
    EI-REL-002-C: 거북선대교 744m 4차로 — 보행자 통로 미확인 (OFFICIAL, yeosu.go.kr)
    EI-REL-002-D: 돌산정류장 직통 버스 오동도 미확인 (MAP_ROUTE synthesized)

  NEG Items:
    NEG-REL-002-001: 자산→돌산 편도는 오동도 반대편 하차 — 오동도 도보 불가
    NEG-REL-002-002: 돌산정류장 → 오동도 도보 NOT PRACTICAL (다리=차도)
    NEG-REL-002-003: 5분=입구; 20분=섬 내부 — 범위 구분 필수 (SCOPE integrity)

  Conflicts:
    CONFLICT-REL-002-01: 5분 vs 20분 — SCOPE_DIFFERENCE RESOLVED
      5분 = 자산→방파제 입구; 20분 = 자산→섬 내부 (5분+15분 방파제 도보)

  Relationship Model:
    자산 EXIT → 오동도: DIRECT (같은 구내, 평지 도보, 차량 불필요)
    돌산 EXIT → 오동도: INDIRECT (거북선대교 차량 경유 필수, 택시 주모드)

  Unlocks: ER-REL-005 (dependencies: REL-001 ✓ + REL-002 ✓ now met)
  Gap Register Update: ER-REL-002 PARTIAL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Controlled Collection Cycles: 9 → 10
  Wave 3 Status: IN_PROGRESS (REL-002 ✓; remaining: CC-003, HY-003, HY-007, OD-006, CC-005)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 3 ER-HY-003 Collection: COMPLETE / PROVISIONALLY_SUPPORTED (2026-09-28)**

```
Wave 3 ER-HY-003 Collection: COMPLETE / PROVISIONALLY_SUPPORTED (2026-09-28)
  File: docs/research/SOUL_YEOSU_ER_HY_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 997ba01 (Wave 3 ER-CC-003)

  ER: ER-HY-003 — Hyangiram Elder Mobility Friction
  Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT — PARTIAL (EP-3 partial; 2 of 4 items MEDIUM confidence)
  ER Status: PROVISIONALLY_SUPPORTED (not VERIFIED — upgrade when EP-3 confirmed by direct elder descent account)

  Source Roles: WORLD_EXPERIENCE primary / FOUNDER secondary
  FOUNDER: NO_ASSETS_FOUND

  Starting State: FULL_GAP (Wave 0 line 567: NOT_ADDRESSED)

  Evidence Items:
    EI-HY-003-A: comple.co.kr — "무릎 관절을 생각해야 하는 그룹은 살방살방 걸어 평길로" (HIGH, direct WE)
    EI-HY-003-B: airial.travel — road route accessible but not all areas (HIGH, multi-WE aggregate)
    EI-HY-003-C: TripAdvisor r957655598 — mother-in-law couldn't walk steep vantage point (MEDIUM, synthesized)
    EI-HY-003-D: TripAdvisor (parents + wife) — completed via stair up / flat down (MEDIUM, synthesized)

  Negative Items:
    NEG-HY-003-1: FOUNDER NO_ASSETS_FOUND
    NEG-HY-003-2: No direct elder stone-gate account
    NEG-HY-003-3: Road route excludes stone gate passages entirely
    NEG-HY-003-4: No explicit elder descent friction account (inferred via route behavior)

  Key Pattern:
    Mobility-concerned visitors demonstrably self-select flat road path (EI-A direct observation)
    Flat road path: navigable but stone gate passages inaccessible (EI-B)
    Elder failure case: walking-difficulty elder could not manage steep section (EI-C)
    Elder completion case: parents completed with stair-up/flat-down strategy (EI-D)
    Mobility threshold: stone gates require stair route; road route = abbreviated visit

  Structural Context Reused: HY-001 path structure (CONTEXT) + HY-002-E official exception (CONTEXT)
  Stability: STABLE (no live trigger)
  CONFLICT registered: NONE
  Gap Register Update: ER-HY-003 FULL_GAP → CLOSED (PROVISIONALLY_SUPPORTED)
  Controlled Collection Cycles: 11 → 12
  Wave 3 Status: IN_PROGRESS (REL-002 ✓ + CC-003 ✓ + HY-003 ✓; remaining: HY-007, OD-006, CC-005)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 3 ER-HY-007 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)**

```
Wave 3 ER-HY-007 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)
  File: docs/research/SOUL_YEOSU_ER_HY_007_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 4067e23 (Wave 3 ER-HY-003)

  ER: ER-HY-007 — Travel Time Evidence to Hyangiram
  Stop Condition: RELATIONSHIP_SUFFICIENT — ALL 13 ITEMS PASS
  ER Status: VERIFIED_FOR_PREPARATION

  Source Roles: MAP_ROUTE primary / FOUNDER secondary (NO_ASSETS_FOUND)
  Starting State: PARTIAL_GAP (낭만버스 leg 전남해양수산과학관→향일암 25min PARTIALLY_REUSABLE)

  Evidence Items:
    EI-HY-007-A: Bus 111번 여수엑스포역→향일암(임포): ~1h-1h28m; 30-80분 배차 (SCHEDULE_DERIVED + WE)
    EI-HY-007-B: Car/Taxi 여수→향일암: ~36min, 32.6km via 돌산대교 (MAP_ROUTE_ESTIMATE, rome2rio)
    EI-HY-007-C: Official bus route structure confirmed 111/111-1/116 (OFFICIAL, yeosu.go.kr)
    EI-HY-007-D: Last-mile 임포 정류장→향일암 매표소: ~11분 도보 (WORLD_EXPERIENCE, walkview)
    EI-HY-007-E: 낭만버스1코스 전남해양수산과학관→향일암: 25분 (ROUTE_SOURCE, REUSED)

  Negative Items: 6 (NEG-HY-007-1 through 6)
    NEG-1: 낭만버스1코스 is TOUR format — NOT point-to-point transit; cumulative ~2h+ from 엑스포역
    NEG-2: Bus total = ~1h11m-1h39m door-to-entrance (bus + 11min last-mile walk)
    NEG-3: Car ~36min does NOT include parking search or hermitage ascent (HY-001 scope)
    NEG-4: HY-006 visit duration NOT combined with HY-007 (HY-008 synthesis scope)
    NEG-5: Bus frequency (30-80분 배차) adds 0-80min planning buffer
    NEG-6: Peak/holiday traffic unquantified; potentially adds 15-30+ min

  Stale-State Corrections Applied:
    Project State P1 → Matrix P0 (canonical)
    Wave 0 dep "Awaits HY-001" → Matrix ER-HY-006 (canonical)
    Readiness Check AUTHORITATIVE_FACT_SUFFICIENT → Plan RELATIONSHIP_SUFFICIENT (canonical)
    Wave 0 dual Wave 3/5 entry → Wave 3 only (canonical)

  Normalized Routes:
    Route 1: 여수엑스포역→향일암 BUS: ~1h11m-1h39m (bus + walk)
    Route 2: 여수 시내→향일암 CAR/TAXI: ~35-40min normal / +15-30min peak
    Route 3: 전남해양수산과학관→향일암 TOUR_BUS: 25min (CONTEXT leg only)

  Stability: SEMI_STABLE (route structure STABLE; timetable VOLATILE; traffic CONTEXTUAL)
  CONFLICT registered: CONFLICT-HY-007-01 ESTIMATE_VARIATION on bus time (RESOLVED)
  Updated files: SOUL_YEOSU_ER_HY_007_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md (CREATED) | Wave 0 gap register (4 HY-007 rows) | Project State
  Controlled Collection Cycles: 12 → 13
  Wave 3 Status: IN_PROGRESS (REL-002 ✓ + CC-003 ✓ + HY-003 [PS] + HY-007 ✓; remaining: OD-006, CC-005)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 3 ER-OD-006 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)**

```
Wave 3 ER-OD-006 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)
  ER: ER-OD-006 — Odongdo Live / Volatility Boundary
  Base: 898a6b0 (Wave 3 ER-HY-007)
  Wave: 3 | Cycle: 14
  Stop Condition: LIVE_BOUNDARY_SUFFICIENT — 11/11 PASS
  Source Roles: OFFICIAL primary / LOCAL_OPERATOR secondary
  Gap Transition: FULL_GAP → CLOSED
  Evidence Items: EI-OD-006-A through E (5 items) + NEG-OD-006-1 through 6 (6 NEG items)
  Reused: EI-OD-003-B/C (Dongbaek Train CONTEXT); OD-001/004 (CONTEXT_ONLY)
  Knowledge Fields: 15 classified (STABLE: 7 / SEMI_STABLE: 5 / VOLATILE: 4 / CONTEXTUAL: 2)
    STABLE: island access 24hr/연중무휴/free, walking route, vehicle restriction, train existence, fountain existence, lighthouse existence, no seasonal island closure
    SEMI_STABLE: train fare, train seasonal schedule, train lunch break structure, fountain season (March–Oct), lighthouse Monday closure + hours
    VOLATILE: train suspension now, fountain today, bloom today, extraordinary closure
    CONTEXTUAL: camellia bloom pattern, peak congestion seasonal pattern
  Live Boundary Table: per-field trigger/source/failure/fallback defined
  CONFLICT registered: CONFLICT-OD-006-01 (Dongbaek Train winter last departure 17:00 vs 17:30 — SCHEDULE_VARIATION, resolved in favor of 17:00)
  Stale-state correction: Wave 0 dep table "Awaits ER-OD-001" → canonical: None (corrected in Wave 0)
  Updated files: SOUL_YEOSU_ER_OD_006_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md (CREATED) | Wave 0 gap register (3 OD-006 rows) | Project State
  Controlled Collection Cycles: 13 → 14
  Wave 3 Status: IN_PROGRESS (REL-002 ✓ + CC-003 ✓ + HY-003 [PS] + HY-007 ✓ + OD-006 ✓; remaining: CC-005)
  DB / Schema / Runtime / Production: NO CHANGE
```

**HY-003 Targeted Upgrade: PROVISIONALLY_SUPPORTED PRESERVED (2026-09-28)**

```
HY-003 Targeted Upgrade (2026-09-28)
  Base: 3be9d70 (Wave 3 ER-CC-005)
  Target: EP-3 — elder-specific DESCENT friction
  Method: EI-HY-003-C/D direct verification + targeted external search (5 Korean queries, 4 English queries, 7 sources attempted)
  Direct Verification Results:
    EI-HY-003-C (TripAdvisor r957655598): HTTP 403 BLOCKED — FAILED
    EI-HY-003-D (TripAdvisor parents+wife): HTTP 403 BLOCKED — FAILED
  New Evidence Found: NONE qualifying (synthesis-only items, not elder-specific descent, or unreachable)
  EP-3 Result: PARTIAL_PASS (unchanged) — no direct HIGH-confidence elder descent friction account
  Final HY-003 Status: PROVISIONALLY_SUPPORTED (unchanged)
  WAVE_3_COLLECTION_EXECUTION_COMPLETE: TRUE
  ALL_WAVE_3_ERS_VERIFIED: FALSE (HY-003 blocks)
  Controlled Collection Cycles: 15 (not incremented — targeted upgrade, not a new collection cycle)
  Sources not yet searched: Naver Blog, Naver Map reviews, NaverCafe (Korean-language domestic platforms)
  Upgrade path remaining: One HIGH-confidence elder descent friction account from Korean domestic platforms
  Files created: SOUL_YEOSU_ER_HY_003_TARGETED_UPGRADE_V0_1.md
  Files modified: Wave 0 gap register (HY-003 upgrade attempt noted) | Project State
  DB / Schema / Runtime / Production: NO CHANGE
```

**HY-003 Targeted Upgrade Second Attempt: SECOND_TARGETED_ATTEMPT_FAILED (2026-09-28)**

```
HY-003 Targeted Upgrade Second Attempt (2026-09-28)
  Base: dc5f458 (HY-003 Targeted Upgrade #1)
  Target: EP-3 — elder-specific DESCENT friction
  Platforms: Naver Blog (BLOCKED) / Naver Map (NO_ACCESS) / Naver Cafe (NO_RESULT) / Korean web (SEARCHED)
  Query Families: 8 Korean query variants + 2 Naver Cafe site-specific + 2 English
  Sources directly accessed: ajunews.com (walking stick service), hankookilbo.com (2016 route diff), kr.trip.com/moments (review)
  New Evidence: EI-HY-003-E (LOCAL_OPERATOR walking stick service — SUPPORTING ONLY; not EP-3 closure)
    EI-HY-003-E: 임포상가번영회 free walking stick rental; 노약자 target; 하산 후 반납; confirms institutional recognition of elder burden including descent; NOT firsthand WE evidence
  EP-3 Result: PARTIAL_PASS (unchanged) — no HIGH-confidence firsthand elder descent friction account found
  Final HY-003 Status: PROVISIONALLY_SUPPORTED (unchanged)
  WAVE_3_COLLECTION_EXECUTION_COMPLETE: TRUE
  ALL_WAVE_3_ERS_VERIFIED: FALSE (HY-003 blocks)
  Controlled Collection Cycles: 15 (not incremented — targeted upgrade)
  No further web search authorized
  Governance note: HY-003 "Behavior if Missing: ASK" — SOUL can serve H-2 with qualified response; PROVISIONALLY_SUPPORTED does not block preparation
  Next: Founder/governance disposition decision (A: proceed with documented limitation, or B: Founder field validation)
  Files created: SOUL_YEOSU_ER_HY_003_TARGETED_UPGRADE_SECOND_ATTEMPT_V0_1.md
  Files modified: Wave 0 gap register (HY-003 row — second attempt noted) | Project State
  DB / Schema / Runtime / Production: NO CHANGE
```

**HY-003 Governance Disposition + Traveler Condition Hypothesis (2026-09-28)**

```
HY-003 Governance Disposition: ACCEPT_PROVISIONAL_WITH_BOUNDARY (2026-09-28)
  Base: 4530172 (HY-003 Second Targeted Upgrade Attempt)
  EP-3 with Founder input: PARTIAL_PASS (unchanged)
    Founder "descent = return burden" = FOUNDER_FIELD_KNOWLEDGE (structural, not elder-specific experience)
    Outcome B+C: Founder input useful for judgment; does NOT satisfy existing EP-3 evidence requirement;
    EP-3 requirement uses age-proxy where capability is the actual decision variable (Outcome C)
  Final HY-003 Status: PROVISIONALLY_SUPPORTED (unchanged — no forced upgrade)
  Web upgrade paths: EXHAUSTED (2 attempts)
  Canonical Matrix "Behavior if Missing: ASK" → SOUL may serve H-2 with ASK + QUALIFY
  SOUL behavior for H-2: ASK (capability-specific: stairs/slope) + QUALIFY (EP-3 KNOWN_LIMIT + alternative route)
  ER-HY-008: BLOCKED (requires HY-003 VERIFIED_FOR_PREPARATION per Plan V0.2 §Wave 4)
  Open upgrade path: Founder field validation (one observed elder descent account closes EP-3 at HIGH confidence)
  New Research Hypothesis: TRAVELER_CONDITION_X_EXPERIENCE_REQUIREMENT (RESEARCH_HYPOTHESIS — NOT Candidate)
  Hypothesis: SOUL compares traveler capability × experience friction → conditional judgment (not demographic label)
  JF V0.1 compatibility: Compatible; "Companion-specific constraints" node should surface capability, not age proxy
  Candidate gate: NOT YET — promotion evidence needed (multi-place verified, pilot evidence, Minimum ASK improvement)
  WAVE_3_COLLECTION_EXECUTION_COMPLETE: TRUE
  ALL_WAVE_3_ERS_VERIFIED: FALSE (HY-003 PROVISIONALLY_SUPPORTED)
  Controlled Collection Cycles: 15 (unchanged — governance disposition, no new collection cycle)
  Files created: SOUL_YEOSU_TRAVELER_CONDITION_EXPERIENCE_REQUIREMENT_HYPOTHESIS_V0_1.md
  Files modified: Wave 0 gap register (HY-003 disposition noted) | Project State
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 3 ER-CC-005 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)**

```
Wave 3 ER-CC-005 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-28)
  ER: ER-CC-005 — Yeosu Maritime Cable Car Live / Volatility Boundary
  Base: a19a639 (Wave 3 ER-OD-006)
  Wave: 3 | Cycle: 15
  Stop Condition: LIVE_BOUNDARY_SUFFICIENT — 13/13 PASS
  Source Roles: OFFICIAL/LOCAL_OPERATOR primary / FOUNDER secondary
  Founder Evidence: OPERATIONAL_DOMAIN_ABSENT (philosophical evidence present; operational parameters absent)
  Gap Transition: FULL_GAP → CLOSED
  Evidence Items: EI-CC-005-A through E (5 items, incl. BATCH_01 reused) + 9 NEG items
  Reused: EI-CC-001-A/B (STABLE station identity/route) + EI-CC-005-CTX-A (CONTEXT_ONLY)
  Knowledge Fields: 25 classified (STABLE: 5 / SEMI_STABLE: 12 / VOLATILE: 4 / CONTEXTUAL: 4)
    STABLE: service existence, station identity, route endpoints, weather suspension rule (강풍주의보/경보), rain≠suspension exception
    SEMI_STABLE: ticket categories, ticket prices (CONFLICT-CC-005-01 OPEN), operating hours (~09:30–21:30), Saturday extension, maintenance Wednesday pattern, year-round operation, online ticket condition, online same-day restriction, discount categories, last boarding rule, crystal cabin capacity (CONFLICT-B), maintenance schedule
    VOLATILE: current operation status, current weather suspension, current queue/wait, current ticket availability
    CONTEXTUAL: peak wait pattern (weekends/golden-hour), ride duration range (10–15min), speed adjustment (crowd management)
  Key rules:
    Weather suspension: 강풍주의보/경보 issued by official weather authority → STABLE rule; current state VOLATILE
    Rain: does NOT stop operations → STABLE exception
    Prices: CONFLICT-CC-005-01 (₩13k vs ₩17k standard round-trip; ₩20k vs ₩24k crystal) → SEMI_STABLE; VERIFY_REQUIRED
    Fallback: NO_VERIFIED_FALLBACK for operational suspension (cable car IS cross-sea route)
    Verification path: yeosucablecar.com 운행현황 (SSL issue noted) + 061-664-7301
  CONFLICTS registered: CONFLICT-CC-005-01 (PRICE_VARIATION; unresolved; corroborates WE CONFLICT-A) + CONFLICT-CC-005-02 (SCHEDULE_VARIATION opening time 09:00 vs 09:30; 09:30 majority-supported)
  Stale-state: Wave 0 dep table showed "Wave 2" for CC-005 — corrected to Wave 3 (canonical)
  Updated files: SOUL_YEOSU_ER_CC_005_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md (CREATED) | Wave 0 gap register (2 CC-005 rows) | Project State
  Controlled Collection Cycles: 14 → 15
  Wave 3 Collection Execution: WAVE_3_COLLECTION_EXECUTION_COMPLETE (all 6 cycles executed)
  Wave 3 Verification Status: 5 VERIFIED_FOR_PREPARATION + 1 PROVISIONALLY_SUPPORTED — NOT ALL_WAVE_3_ERS_VERIFIED
  HY-003: PROVISIONALLY_SUPPORTED — upgrade condition preserved (EP-3 requires direct elder descent friction account)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 3 ER-CC-003 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)**

```
Wave 3 ER-CC-003 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_CC_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: cb700b0 (Wave 3 ER-REL-002)

  ER: ER-CC-003 — Per-Station Vehicle Access and Parking
  Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT — 8/8 PASS

  Starting State: FULL_GAP — CONFLICT-F OPEN (blocking)

  CONFLICT-F Resolution:
    SCOPE_DIFFERENCE + INTERPRETATION_DIFFERENCE (CLOSED)
    Multiple facilities in 자산 compound have different rate structures.
    "무료/유료/시간별 요금" all describe SAME layered structure at different addresses.
    NOT a FACT_CONFLICT about any single facility.

  Reused Items:
    EI-CC-002-I: 자산 엘리베이터 탑 직결 (OFFICIAL, CC-002) — DIRECT_REUSE
    EI-OD-004: 오동도로 116, 237 spaces, 1hr free, 200원/10분 (LOCAL_OPERATOR) — DIRECT_REUSE

  New Evidence Items:
    EI-CC-003-A: 자산 4-lot compound map (oh-my-post, NON_OFFICIAL_AGGREGATOR)
    EI-CC-003-B: 자산 HIGH vehicle pressure (WE synthesis)
    EI-CC-003-C: 돌산 250-space primary lot, max 5,000원/day (oh-my-post)
    EI-CC-003-D: 돌산 2 free alternatives, 5–10분 walk (oh-my-post)
    EI-CC-003-E: 돌산 LOWER pressure than 자산 — comparative WE pattern

  Negative Items:
    NEG-CC-003-001: 자산 완전 무료 없음 (all lots paid after free window)
    NEG-CC-003-002: 엑스포 주차장 (777-4) = 12-15분 도보 (far from boarding)

  Key Structural Model:
    자산: PRIMARY = 오동도로 116 (237 spaces, 엘리베이터 직결); HIGH pressure; 4 lots total
    돌산: PRIMARY = 돌산로 3600-1 (250 spaces, max 5,000원/day); LOWER pressure; 2 free lots nearby
    SOUL Judgment: 오동도 목적 → 자산 권장; 주차비/여유 → 돌산 가능

  Unlocks: ER-CC-004 (dependency CC-003 now met)
  Gap Register Update: ER-CC-003 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  CONFLICT-F: OPEN → RESOLVED
  Controlled Collection Cycles: 10 → 11
  Wave 3 Status: IN_PROGRESS (REL-002 ✓ + CC-003 ✓; remaining: HY-003, HY-007, OD-006, CC-005)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 2 ER-REL-001 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)**

```
Wave 2 ER-REL-001 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_REL_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 1ca995b (Wave 2 ER-CC-002)

  ER: ER-REL-001 — 케이블카 방향별 도착지 및 지리적 관계
  Stop Condition: AUTHORITATIVE_FACT_SUFFICIENT — 10/10 PASS

  Evidence Items: 5 new (EI-REL-001-A through E) + 2 NEG items
    EI-REL-001-A: 자산정류장 = MAINLAND (오동도 주차타워 앞) — OFFICIAL yeosu.go.kr
    EI-REL-001-B: 돌산정류장 = DOLSAN ISLAND (돌산공원) — OFFICIAL yeosu.go.kr
    EI-REL-001-C: 자산정류장 → 오동도 입구 도보 ~5분 — MAP_ROUTE
    EI-REL-001-D: 방향A(자산→돌산) WE 확인: 오동도 방문 후 자산 탑승→돌산 하차 — WE
    EI-REL-001-E: 돌산정류장 → 오동도: 거북선대교 경유 (택시 10~12분) — MAP_ROUTE
    NEG-REL-001-001: 자산→돌산 편도는 오동도 접근에 비효율적
    NEG-REL-001-002: 돌산→자산 편도는 돌산 관광지 접근에 비효율적

  Conflicts: 2 resolved
    CONFLICT-REL-001-01: 자산정류장 주소 3종 — SCOPE_DIFFERENCE (같은 단지 내 건물별 주소)
    CONFLICT-REL-001-02: Route Corpus 돌산측을 오동도권으로 분류 — INTERPRETATION_DIFFERENCE (corpus 레이블 오류; OFFICIAL 우선)

  Unlocks: ER-REL-002 (gated on REL-001 + OD-003), ER-REL-005 (gated on REL-001 + REL-002)
  Controlled Collection Cycles: 8 → 9
  Wave 2 Status: COMPLETE (OD-004 ✓ + HY-002 ✓ + HY-006 ✓ + CC-002 ✓ + REL-001 ✓)
```

**Wave 2 ER-CC-002 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)**

```
Wave 2 ER-CC-002 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_CC_002_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 7c00202 (Wave 2 ER-HY-006)

  ER: ER-CC-002 — 케이블카 정류장별 접근 구조
  Stop Condition: AUTHORITATIVE_FACT_SUFFICIENT — ALL 15 CRITERIA PASS

  Evidence Items: 12 total (4 existing PARTIALLY_REUSABLE RB-03/Founder + 8 newly collected MAP_ROUTE/OFFICIAL)
  EXISTING (RB-03/Founder, PARTIALLY_REUSABLE — Hamel-specific approach):
    EI-CC-002-A: 자산 차량 (하멜등대→자산 1~2분)
    EI-CC-002-B: 자산 도보 (하멜등대→자산 5~10분, 평지)
    EI-CC-002-C: 돌산 차량 (하멜등대→돌산 5~10분)
    EI-CC-002-D: 돌산 도보 (하멜등대→돌산 20~30분)
  NEWLY COLLECTED (MAP_ROUTE / OFFICIAL):
    EI-CC-002-E: 자산 위치 (수정동 777-4; 여수엑스포역에서 1.5km) — OFFICIAL
    EI-CC-002-F: 자산 버스 (2·68·76·333·555번, 5~10분, ₩1,400~1,500) — MAP_ROUTE
    EI-CC-002-G: 자산 도보 (엑스포역→자산 1.5km/15~20분, 해안 평지) — MAP_ROUTE
    EI-CC-002-H: 자산 택시 (5~7분, ₩5,000~7,000) — MAP_ROUTE
    EI-CC-002-I: 자산 구조적 접근 (엘리베이터 타워, 무료, 09:00~22:00; 목조계단 대안 가파름) — OFFICIAL_PUBLIC
    EI-CC-002-J: 돌산 위치 (돌산읍 돌산로 3600-1, 돌산공원; 엑스포역에서 약 10km, 거북선대교 경유) — OFFICIAL
    EI-CC-002-K: 돌산 버스 (100·102·103·105·106·109·111·112·113·114·115·116·999번 등 돌산도 방면 다수) — OFFICIAL_PUBLIC
    EI-CC-002-L: 돌산 택시 (10~12분, ₩8,000~10,000) — MAP_ROUTE

  Key Access Asymmetry:
    자산정류장: 도보/버스/택시 모두 실용적 (엑스포역에서 1.5km)
    돌산정류장: 버스·택시 필요, 거북선대교 경유 필수 (엑스포역에서 10km)

  Conflict: CONFLICT-CC-002-01 (수정동 332-55 vs 수정동 777-4) — SCOPE_DIFFERENCE_RESOLVED (다른 건물, 같은 구내)
  Source Role Corrections: NONE (계약과 수집이 일치)

  SEMI_STABLE Live Trigger:
    안정 코어: 주소·버스 노선번호·도보거리·엘리베이터 존재·다리 경유 필수성
    변동: 버스 시간표·요금·공사 정보
    트리거 이벤트: 거북선대교 공사/폐쇄 / 자산 접근로 공사 / 버스 노선 개편 / 엘리베이터 운영 변경

  Dependencies Unlocked: ER-CC-003 (CC-001+CC-002 완료), ER-CX-001 requires CC-002 ✓
  Gap Register Update: ER-CC-002 PARTIAL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Controlled Collection Cycles: 7 → 8
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 1 ER-CC-001 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)**

```
Wave 1 ER-CC-001 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_CC_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: b76a686 (Wave 1 ER-OD-003)

  ER: ER-CC-001 — 케이블카 스테이션 정체성
  Stop Condition: AUTHORITATIVE_FACT_SUFFICIENT — ALL 12 CRITERIA PASS

  Evidence Items: 6 total (3 reused RB-01 + 3 newly collected)
  REUSED (RB-01):
    EI-CC-001-A: Namu Wiki — 자산 측 해야정류장, 돌산 측 놀아정류장 (SUPPORTING)
    EI-CC-001-B: oh-my-post.com — 자산정류장/해야, 돌산정류장/놀아 (NON_OFFICIAL_BLOG)
    EI-CC-001-C: Derived entity distinction — 자산공원≠탑승장, 돌산공원≠탑승장 (DERIVED)
  NEWLY COLLECTED (Wave 1 Phase B):
    EI-CC-001-D: yeosucablecar.com (OFFICIAL, search-indexed) — 자산[해야]정류장 / 돌산[놀아]정류장; etymology 해야="station where sun rises"
    EI-CC-001-E: 디지털여수문화대전 (OFFICIAL_PUBLIC) — "돌산공원 내 여수해상케이블카 돌산[놀아]정류장과 자산공원 내 자산[해야]정류장"
    EI-CC-001-F: ko.wikipedia.org (SUPPORTING) — 자산공원=오동도 entrance side; 돌산공원=돌산도 island side

  Station Identity Model Established:
    자산정류장 [해야] — 자산공원 내/인접, mainland 측 (육지)
    돌산정류장 [놀아] — 돌산공원 내/인접, island 측 (돌산도)
    Combined official form: 자산[해야]정류장 / 돌산[놀아]정류장
    Etymology: 해야 = "해가 뜨는 정류장" (official operator)

  Naming Hierarchy:
    Primary: 자산정류장 / 돌산정류장 (location-based, operator URL-level)
    Sub-brand: 해야 / 놀아 (brand identifiers in bracket/parentheses notation)
    NOT standalone primary: 해야정류장 / 놀아정류장 (sub-brand only form)

  Conflict: CONFLICT-CC-001-01 (해야정류장 vs 자산정류장 primacy) — RESOLVED
    Resolution: operator URL structure confirms 자산정류장 is primary

  RB-01 Admissibility:
    Fully reusable: 0 / Partially reusable: 3 (A, B, C) / Not admissible: 1 (INACCESSIBLE)
    Components avoided from re-collection: locally-used names (already in RB-01)
    Components newly collected: OFFICIAL naming confirmation + hierarchy resolution

  Reuse-Cycle Assessment: EXISTING KNOWLEDGE → REUSE → GAP ISOLATION → GAP-ONLY COLLECTION — ACHIEVED

  Dependencies Unlocked: ER-CC-002, ER-CC-005, ER-REL-001 (all Wave 2 — prerequisites met)
  Gap Register Update: ER-CC-001 PARTIAL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Collection Cycle Audit: A–V all PASS (22/22)
  Controlled Collection Cycles Completed: 4
  Wave 1: COMPLETE (all 4 ERs VERIFIED_FOR_PREPARATION)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 2 ER-OD-004 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)**

```
Wave 2 ER-OD-004 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_OD_004_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 45d8a38 (Wave 1 ER-CC-001)

  ER: ER-OD-004 — 오동도 주차 구조 (Odongdo Parking Evidence)
  Stop Conditions: AUTHORITATIVE_FACT_SUFFICIENT (13/13) + LIVE_TRIGGER_DESIGN_COMPLETE (10/10) — both PASS

  Evidence Items Registered: 5
    EI-OD-004-A: yumcorp.or.kr (OFFICIAL OPERATOR) — 237 spaces; 1급지; small vehicle: 1hr free, 200 won/10 min, 5,000 won daily max; hours 08:00–20:00
    EI-OD-004-B: polinews.co.kr + nspna.com (OFFICIAL/municipal) — always paid; excluded from 35-lot holiday free program; concentrated demand cited
    EI-OD-004-C: forourtour.com (WE) — ~2–3 min walk from breakwater entrance; first hour free confirmed; weekend adequate space (single observation)
    EI-OD-004-D: koreabycar.com (LOCAL_OPERATOR guide) — causeway entrance lot; ~1,000 KRW/hour (simplified approximation; superseded by EI-OD-004-A)
    EI-OD-004-E: multiple Korean WE accounts (WORLD_EXPERIENCE) — camellia season (late Feb–March) weekend after ~10am = high congestion; early arrival recommended; parking tower preferred over ground lots

  Core Structural Facts Established:
    - Facility: 오동도 공영주차장 / 주차타워; 116 Odongdo-ro; managed by 여수시도시관리공단, Grade 1 (1급지)
    - Location: ~2–3 min walk from Odongdo breakwater entrance
    - Capacity: 237 spaces (official operator; designed capacity); 60-vehicle OD-003 incidental reference = SUPPORTING_ONLY
    - Fee: small vehicle — first hour FREE; then 200 won/10 min; daily max 5,000 won
    - Hours: 08:00–20:00
    - Always paid (no free holiday exceptions — explicitly excluded from Yeosu city holiday free program)
    - Peak congestion pattern: camellia season (late Feb–March) + holiday weekends = HIGH demand
    - No distinct "Dongbaek parking lot" confirmed (OD-003 note was contextual reference to train, not a separate lot)

  SEMI_STABLE Live Trigger Design:
    Stable core: facility identity; location; fee structure type; always-paid policy; 237-space capacity; camellia season friction pattern
    Volatile: current availability; specific rates (may change with municipal revision); temporary closures
    Trigger: traveler asks about parking "now/today"; same-day decision; camellia season + weekend; major holiday; temporary restriction signal
    Verify source: yumcorp.or.kr / parking.yumcorp.or.kr (official operator portal)
    Fallback: state structural facts + recommend arriving before 10am during peak season + direct to verify official portal
    7 fallback scenarios defined (LIVE_SOURCE_AVAILABLE_AND_CLEAR → CAPACITY_VALUE_CONFLICT)

  Capacity Conflict: CONFLICT-OD-004-01 (60 vs 237) — PARTIALLY_RESOLVED
    Resolution: 237 = official operator managed capacity (authoritative); 60 = lower-scope or older reference; yumcorp authoritative
    Both preserved with scope annotations

  Dependency Unlocked: ER-OD-005 prerequisite partially satisfied (OD-001 + OD-003 + OD-004 all VERIFIED)
  Gap Register Update: ER-OD-004 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Collection Cycle Audit: 24/24 PASS
  Controlled Collection Cycles Completed: 5
  Wave 2 Status: IN_PROGRESS (1 of 5 Wave 2 ERs complete; CC-002, HY-002, REL-001, HY-006 remaining)
  DB / Schema / Runtime / Production: NO CHANGE
```

**Wave 1 ER-OD-003 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)**

```
Wave 1 ER-HY-001 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_HY_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: eef19a8 (Pre-Wave 1 Survey)

  ER: ER-HY-001 — 향일암 물리적 접근 구조
  Stop Condition: STRUCTURAL_FACT_WITH_WE_CORROBORATION — ALL 10 CRITERIA PASS

  Evidence Items Registered: 5
    EI-HY-001-A: yeosu.go.kr/en — staircase approach (OFFICIAL, STRUCTURAL_FACT)
    EI-HY-001-B: yeosu.go.kr/en + Daum article — rock gate passages + Haetalmun (OFFICIAL+MEDIA, STRUCTURAL_FACT)
    EI-HY-001-C: yeosu.go.kr/en — route sequence parking→forest→gates→main hall (OFFICIAL, STRUCTURAL_FACT)
    EI-HY-001-D: travel-stained.com — 7 passageways + fairly vertical stairs + child completed (WE, EXPERIENCE_PATTERN)
    EI-HY-001-E: seoulsearching.net — shuffle sideways passages + alternative descent + families observed (WE, EXPERIENCE_PATTERN)

  Key Structural Facts Established:
    - Multi-segment steep staircase approach (begins at entrance, continues throughout)
    - Haetalmun (해탈문): one-person width, bend at waist required — most constrained passage
    - Second stone gate: smaller, forward-bend required
    - 7 passage structures total (temple tradition + 2 independent WE sources)
    - Route: parking lot → forested ascent → successive stone gates → Gwaneumjeon main hall
    - Scope boundary: Geomosan summit trail is distinct from/beyond hermitage access

  Negative/Exception Knowledge: alternative descent path exists (winding, less steep); children with adults can complete; summit trail is distinct and more demanding

  Conflict Register: EXPERIENCE_VARIATION only (difficulty perception varies by fitness; structural facts consistent across all sources)

  Reuse Available For: ER-HY-002 (context), ER-HY-003 (structural foundation), ER-HY-008 (prerequisite satisfied)
  Audit: A–Q all PASS / 17 criteria verified

  Gap Register Update: ER-HY-001 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Wave 0 Gap Register: updated (HY-001 row only)
  DB / Schema / Runtime / Production: NO CHANGE
```

```
Wave 1 ER-OD-001 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_OD_001_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 4140b3d (Wave 1 ER-HY-001)

  ER: ER-OD-001 — 오동도 방문자 경험 프로파일
  Stop Condition: EXPERIENCE_PATTERN_SUFFICIENT — ALL 3 CRITERIA PASS

  Evidence Items Registered: 5
    EI-OD-001-A: kidsfuninseoul.wordpress.com — family visit, named landmarks, child-accessible (WE, EXPERIENCE_PATTERN)
    EI-OD-001-B: kupi.com visitor guide — atmosphere, flora, boardwalks, 2-3h scale (WE, EXPERIENCE_PATTERN)
    EI-OD-001-C: kosmedi.co.kr — 0.12 km², 2.5km trails, named rock formations (WE, STRUCTURAL_FACT+EXPERIENCE_PATTERN)
    EI-OD-001-D: thisis-southkorea.com (Aug 2025) — serene, small island, coastal trails (WE, EXPERIENCE_PATTERN)
    EI-OD-001-E: yeosu.go.kr OFFICIAL — 2.5km trail, Dragon Cave, bamboo tunnel, lighthouse, barefoot park (OFFICIAL, STRUCTURAL_FACT corroboration)

  Three Dimensions Established:
    ATMOSPHERE: tranquil/serene/nature-immersive; sea breeze + botanical scent; seasonal variation (bloom vs. non-bloom)
    PHYSICAL_SCALE: ~0.12 km² island; ~2.5 km internal trail network; circular route; accessible (5+); content-dense
    EXPERIENTIAL_DISTINCTIVENESS: camellia identity (3000 trees); named geology (Dragon Cave, Elephant Rock, etc.); forest+coastal integration; multi-mode visit (walk/photography/fountain/train)

  Distinction vs. Hyangiram: Odongdo = moderate/family-accessible/botanical+coastal / Hyangiram = physically demanding/pilgrimage/steep passage

  Conflict Register: CONFLICT-OD-001-01 (bloom season dates) — MINOR_VARIATION, LOW impact, resolved (use OFFICIAL Jan–March)

  Reuse Available For: OD-002 (scale context), OD-006, any inside-island ER
  Dependency Unlocked: OD-002 (awaits OD-001 — now satisfied), OD-006 (awaits OD-001 — now satisfied)

  Gap Register Update: ER-OD-001 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Wave 0 Gap Register: updated (OD-001 row — 3 locations)
  DB / Schema / Runtime / Production: NO CHANGE
```

```
Wave 1 ER-OD-003 Collection: COMPLETE / VERIFIED_FOR_PREPARATION (2026-09-27)
  File: docs/research/SOUL_YEOSU_ER_OD_003_CONTROLLED_EVIDENCE_COLLECTION_V0_1.md
  Base: 474ca82 (Wave 1 ER-OD-001)

  ER: ER-OD-003 — 오동도 차량/교통 접근 구조
  Stop Conditions: AUTHORITATIVE_FACT_SUFFICIENT (10/10) + LIVE_TRIGGER_DESIGN_COMPLETE (10/10) — both PASS

  Evidence Items Registered: 4
    EI-OD-003-A: yeosu.go.kr (Korean) — vehicle prohibition on causeway + 60-vehicle parking at entrance + 15-min walk (OFFICIAL)
    EI-OD-003-B: yeosu.go.kr Dongbaek Train page — hours 09:30–17:30, 1,000 won, capacity 192, wheelchair lift (OFFICIAL)
    EI-OD-003-C: comple.co.kr — 15-min departure frequency, boarding past dock, winter hours 17:00 cutoff (LOCAL_OPERATOR)
    EI-OD-003-D: Wikipedia EN — 768m causeway built 1935, paid shuttle confirmation (OFFICIAL SECONDARY)

  Core Structural Facts Established:
    - VEHICLE PROHIBITION: private vehicles not permitted on causeway (OFFICIAL, explicit)
    - Parking: Odongdo entrance, 60 vehicles (main lot)
    - Access Option A: Walk 768m causeway (~15 min, free, scenic — Korea's 100 Most Beautiful Roads)
    - Access Option B: Dongbaek Train (1,200m route, ~4 min, 1,000 won one-way, every 15 min)
    - Train suspension condition: heavy rain
    - Boarding location: past main information center + dock (~1.2km into park)
    - Round-trip: separate ticket purchase required each direction

  SEMI_STABLE Live Trigger Design:
    Stable core: vehicle prohibition policy; existence of walk + train options; 768m distance
    Volatile: train hours, prices, frequency; parking fees
    Verify source: yeosu.go.kr Dongbaek Train page (URL known) + 061-659-1821
    SOUL trigger: traveler asks specifically about current hours/price; rain conditions; Oct/Nov transition
    Fallback: state structural range → recommend verification; walk always available if train suspended

  Negative/Exception Knowledge: rain suspension → walk only; 60-car lot small for peak season; prohibition absolute (no exceptions); boarding 1.2km from entrance; round-trip = separate purchase

  Conflict Register: CONFLICT-OD-003-01 (train route 1,200m vs walking 768m — MINOR_VARIATION, resolved); CONFLICT-OD-003-02 (operating hours discrepancy — MINOR_VARIATION, seasonal split, resolved)

  Dependency Unlocked: ER-OD-004 prerequisite satisfied (parking detail wave)
  Gap Register Update: ER-OD-003 FULL_GAP → CLOSED (VERIFIED_FOR_PREPARATION)
  Collection Cycle Audit: 21/21 PASS
  DB / Schema / Runtime / Production: NO CHANGE
```

```
Pre-Wave 1 Existing Asset Survey: COMPLETE / NO_GAP_CHANGES (2026-09-27)
  File: docs/research/SOUL_YEOSU_PRE_WAVE_1_EXISTING_ASSET_SURVEY_V0_1.md
  Base: ba478a5 (Wave 0 완료)

  Survey Coverage: 10개 파일 전수 조사 (BATCH_01~06, ROUTE_CORPUS, TIME_MATRIX, ENTITY_MANIFEST, TIME_KNOWLEDGE)

  Per-ER Outcome:
    ER-OD-001: NO_RELEVANT_EXISTING_CLAIM — 오동도 Route 출현 10회 모두 CONTEXT_ONLY
    ER-OD-003: SECONDARY_CLAIM_ONLY — R040(tourtoctoc 2023) "동백열차" 언급, 갭 유형 변경 불가
    ER-HY-001: CONTEXT_ONLY_CONFIRMED — 운영 정보(시간/요금/버스) OFFICIAL 확보; 물리 구조 없음
    ER-CC-001: NO_NEW_OFFICIAL_SOURCE — Time Matrix 탑승장명 = ROUTE_SOURCE_DERIVED (OFFICIAL 아님)

  Gap Register: Wave 0 대비 변경 없음
    ER-OD-001: FULL_GAP (unchanged)
    ER-OD-003: FULL_GAP (unchanged; R040 corroboration candidate 기록됨)
    ER-HY-001: FULL_GAP (unchanged; operational facts already documented)
    ER-CC-001: PARTIAL_GAP (unchanged)

  Key Reuse Opportunities Identified:
    향일암 운영시간/요금/버스 → HY-005/HY-004/HY-006 수집 시 재사용 (신규 수집 불필요)
    R040 "동백열차" → ER-OD-003 Wave 1 코로보레이션 후보
    061-664-7301 → ER-CC-001 Wave 1 전화 확인 경로

  Over-collection Warning:
    향일암 운영 정보(Batch 01 OFFICIAL 확보) Wave 1에서 재수집 금지

  신규 Yeosu 증거 수집: 없음
  DB / Schema / Runtime / Production: NO CHANGE
```

```
Evidence Collection Wave 0: COMPLETE / WAVE_0_PASS (2026-09-27)
  File: docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_WAVE_0_V0_1.md
  Base: 99f839e (Collection Plan V0.2)

  Wave 0 Exit Conditions: ALL 6 PASS
    1. Provenance capture mechanism (20-field template): READY
    2. ER-to-Evidence linkage (all 29 ERs): COMPLETE
    3. Conflict tracking (8 conflicts from WE inherited): READY
    4. Reuse tracking (cross-ER asset sharing): COMPLETE
    5. Dependency states (all 29 ERs initialized): COMPLETE
    6. Gap Register: COMPLETE

  RB Asset Mapping Results:
    ASSET-003 (RB-01) → ER-CC-001: PARTIALLY_SUPPORTED (2 non-official sources; official SSL error)
    ASSET-004 (RB-02) → No ER primary need: CONTEXT_ONLY (ticket structure not in 29 ERs)
    ASSET-005 (RB-03) → ER-CC-002: PARTIALLY_SUPPORTED (자산 side from Hamel approach; FOUNDER_LOCAL)
    ASSET-001 (Cable Car WE) → ER-CC-003/005: CONTEXT_ONLY; ER-CC-004: PARTIAL_PATTERN
    ASSET-002 (Cable Car Founder) → ER-REL-005: CONTEXT_FRAME only

  Gap Register Summary:
    FULL GAP: 22 ERs (all OD + all HY + REL-001 through REL-006 except CC context items)
    PARTIAL GAP: 3 ERs (ER-CC-001, ER-CC-002, ER-CC-004)
    CONTEXT_ONLY — not sufficient: 2 ERs (ER-CC-003, ER-CC-005)
    VERIFIED_FOR_PREPARATION: 0 ERs
    SYSTEM_TEST_DEFERRED: 1 ER (ER-CX-001)

  Pre-Wave 1 Survey Required:
    YEOSU_2026_VERIFICATION_BATCH_01~06 — inspect for OD/HY/CC content
    YEOSU_ROUTE_CORPUS_V0_1, YEOSU_TIME_KNOWLEDGE_V0_1, YEOSU_TRAVEL_TIME_MATRIX_V0_1
    Potential: BATCH_03_TRANSPORT → ER-CC-002/REL-002; BATCH_04_ISLAND_ACCESS → ER-OD-003

  No new Odongdo/Hyangiram/Cable Car evidence collected in Wave 0
  All 29 Evidence Slots: NOT_COLLECTED (Wave 0 mapping only)
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Execute Wave 0]**

```
Controlled Evidence Collection Plan V0.2: COMPLETE / GATE B PASS (2026-09-27)
  File: docs/research/SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_2.md
  Base: 92e6276 (Readiness Review V0.1)

  Gate B Verdict: PASS — all 18 readiness findings CLOSED
    MAJOR CLOSED: 5 (F1–F5)
    MINOR CLOSED: 13 (F6–F18)
    New MAJOR defects: 0
    29 Evidence Requirements: ALL PRESERVED / NOT_COLLECTED

  V0.2 Key Changes vs V0.1:
    §5 Lifecycle: BLOCKED-DEPENDENCY status added; SYSTEM_TEST_DEFERRED status added;
      explicit PROVISIONALLY_SUPPORTED → VERIFIED_FOR_PREPARATION transition rule
    §6 Provenance: 18 fields (added Fields 17 Superseded By + 18 Recommended Refresh Window)
    §7 FOUNDER: FOUNDER REVIEW OUTPUT CONSTRAINT added (MAY produce judgment ingredients;
      MUST NOT produce final SOUL answer text or pre-written recommendation paragraphs)
    §9 Stop Conditions: STRUCTURAL_FACT_WITH_WE_CORROBORATION added (ER-HY-001 only)
    §15 Wave 0: Concrete 6-condition exit definition; general 5-step gap-collection procedure
    §15 Wave 4: Split into Wave 4a (7 independent) and Wave 4b (4 intra-wave dependents)
      Wave 4a: OD-002, OD-005, OD-007, HY-004, HY-005, CC-004, REL-005
      Wave 4b: HY-008, REL-003 (needs OD-002 from 4a), REL-004 (needs REL-003),
               REL-006 (needs REL-005 from 4a)
    §15 Wave 5: CX-001 removed; Wave 5 = HY-009 only
    §15 System Test Requirements: ER-CX-001 separate section; prerequisites expanded to 7 ERs
    §16 Matrix: ER-HY-001 stop condition = STRUCTURAL_FACT_WITH_WE_CORROBORATION
    §16 Matrix: ER-CX-001 prerequisites expanded (OD-003, OD-004, OD-007, CC-002, CC-003, CC-004)
    §17 Notes: SEMI_STABLE live trigger designs for 9 ERs (OD-003, OD-004, CC-002, CC-003,
      HY-004, HY-005, HY-007, REL-003, HY-009); elder-specific note for HY-003;
      RB-01 directional research link for REL-001; REL-001 stop condition scope boundary;
      OD-002/OD-007 scope boundary; HY-007 two representative starting locations;
      FOUNDER OUTPUT CONSTRAINT reiterated for HY-008/REL-005/REL-006
    §3 RB-02 description: corrected (ticket choice scope, not vehicle/parking)
    §0 Correction Summary Table: 18-row closure table (all CLOSED)

  V0.1 Collection Plan: PRESERVED UNCHANGED
  Evidence Requirement Matrix V0.1: PRESERVED UNCHANGED
  Protocol V0.2: PRESERVED UNCHANGED
  Actual Evidence Collection: NOT STARTED
  All 29 Evidence Slots: NOT_COLLECTED
  Pilot: NOT EXECUTED
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Produce Collection Plan V0.2 incorporating all five MAJOR corrections from Readiness Review V0.1]**

```
Readiness Review V0.1: COMPLETE / READY_WITH_CORRECTIONS (2026-09-27)
  File: docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_COLLECTION_READINESS_REVIEW_V0_1.md
  Starting HEAD: c5701d5

  Verdict: READY_WITH_CORRECTIONS
  MAJOR Findings: 5 (F1–F5)
    F1: Blocked-Dependency Propagation — no rule for downstream ERs when prerequisite BLOCKED
    F2: Intra-Wave-4 Dependency Order Not Enforced — REL-003→OD-002; REL-004→REL-003; REL-006→REL-005
    F3: SEMI_STABLE Live Trigger Design Gap — 9 requirements (OD-003, OD-004, CC-002, CC-003,
        HY-004, HY-005, HY-007, REL-003, HY-009) have Matrix live triggers with no collection design
    F4: ER-HY-001 Stop Condition Mismatch — Matrix requires WE corroboration; Plan assigns
        AUTHORITATIVE_FACT_SUFFICIENT only; premature closure risk
    F5: Judgment Contamination in Founder Synthesis — no rule prevents Founder review from
        producing pre-written SOUL answer text during HY-008, REL-005, REL-006 collection
  MINOR Findings: 13 (F6–F18) — details in Readiness Review V0.1 document

  Collection Plan V0.1: PRESERVED UNCHANGED
  Evidence Requirement Matrix V0.1: PRESERVED UNCHANGED
  Protocol V0.2: PRESERVED UNCHANGED
  Actual Evidence Collection: NOT STARTED
  All 29 Evidence Slots: NOT_COLLECTED
  Pilot: NOT EXECUTED
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Conduct a pre-collection readiness review of Controlled Evidence Collection Plan V0.1]**

```
Controlled Evidence Collection Plan V0.1: DESIGNED / PERSISTED (2026-09-27)
  File: docs/research/SOUL_YEOSU_3_PLACE_CONTROLLED_EVIDENCE_COLLECTION_PLAN_V0_1.md
  Base: c4e8b8b

  Scope: All 29 Evidence Requirements from Matrix V0.1
  Collection Waves: 6 waves (Wave 0 Infrastructure through Wave 5 Supporting Depth)
  Requirements per wave:
    Wave 0: Collection Infrastructure / Provenance Readiness (no ERs collected)
    Wave 1: ER-CC-001, ER-HY-001, ER-OD-001, ER-OD-003 (4 — high-reuse P0 foundations)
    Wave 2: ER-CC-002, ER-HY-002, ER-REL-001, ER-OD-004, ER-HY-006 (5 — first-level dependents)
    Wave 3: ER-CC-003, ER-HY-003, ER-HY-007, ER-REL-002, ER-OD-006, ER-CC-005 (6 — second-level + volatile boundary)
    Wave 4: ER-REL-005, ER-OD-002, ER-OD-005, ER-OD-007, ER-HY-004, ER-HY-005, ER-HY-008,
             ER-CC-004, ER-REL-003, ER-REL-004, ER-REL-006 (11 — relationship judgment + experience deepening)
    Wave 5: ER-HY-009, ER-CX-001 (2 — supporting depth + context system)

  Source Role Assignment: all 29 requirements
  Stop Condition Types: AUTHORITATIVE_FACT_SUFFICIENT / EXPERIENCE_PATTERN_SUFFICIENT /
    RELATIONSHIP_SUFFICIENT / LIVE_BOUNDARY_SUFFICIENT / EXPERT_JUDGMENT_SUFFICIENT / SYSTEM_TEST
  Provenance Schema: 16-field minimum (Evidence Item ID through Notes/Limitations)
  Conflict Taxonomy: 8 types (FACT / TEMPORAL / SCOPE / EXPERIENCE / CONTEXT / INTERPRETATION / STALE / UNKNOWN)
  Conflict Handling: defined per conflict type
  Escalation Triggers: 7 (MATERIAL_UNRESOLVED_CONFLICT / NO_SUITABLE_SOURCE / EVIDENCE_TOO_STALE /
    REPEATED_DISAGREEMENT / RELATIONSHIP_UNSUPPORTED / SCOPE_AMBIGUOUS / REQUIREMENT_MALFORMED)
  Escalation Outcomes: 6 (MORE_EVIDENCE / FOUNDER_REVIEW / LOCAL_OPERATOR_REVIEW /
    LIVE_VERIFY / REQUIREMENT_REVISION / UNKNOWN)
  Diminishing-Return Rule: defined (stop when pattern established — do not reward volume)
  Requirement Revision Guard: defined (freeze requirement, record challenge, separate revision run)
  Wave Exit Criteria: defined per wave
  Plan Completeness Audit: A through L — all PASS

  Existing Assets Mapped: RB-01/02/03 mapped to relevant ERs in Wave 0 instructions
  MT-1 (ER-CX-001) Handling: SYSTEM_TEST (not place evidence — verified at pilot execution only)
  Relationship Evidence: first-class object, Wave 1 anchors → Wave 2-3 connection → Wave 4 judgment
  Collection Lifecycle Statuses: NOT_STARTED / IN_COLLECTION / PROVISIONALLY_SUPPORTED /
    CONFLICTED / BLOCKED / VERIFIED_FOR_PREPARATION / LIVE_ONLY / UNKNOWN
  All Plan Collection Statuses: NOT_STARTED
  All Matrix Evidence Slots: NOT_COLLECTED

  Actual Evidence Collection: NOT STARTED
  Pilot: NOT EXECUTED / A/B Result: NONE
  Participant Evidence: NONE / BT Verdict: NOT ASSIGNED
  Candidate: NONE / Architecture Decision: NONE
  place_knowledge migration: NOT APPROVED / HOLD
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Design the controlled Evidence Collection Plan for the 3-place Evidence Requirement Matrix V0.1]**

```
3-Place Evidence Requirement Matrix V0.1: DESIGNED / PERSISTED (2026-09-27)
  File: docs/research/SOUL_YEOSU_3_PLACE_EVIDENCE_REQUIREMENT_MATRIX_V0_1.md
  Base: a7cdaae

  Gate A — Protocol V0.2 Correction Closure: PASS
    C1 (Preparation Boundary operationalization): CLOSED
    C2 (Preparation Reuse Ledger): CLOSED
    C3 (Context Availability Rule): CLOSED
    C4 (Hidden Transfer leakage control): CLOSED
    C5 (Single/Multi-turn consistency): CLOSED

  Matrix scope: 오동도 / 향일암 / 여수해상케이블카
  Core Scenarios covered: O-1, O-2, O-3, H-1, H-2, H-3, C-1, C-2, C-3
  Multi-Turn Variant: MT-1 (context system requirement ER-CX-001)

  Evidence Requirements: 28 place/relationship requirements + 1 context system requirement
    ER-OD-001 ~ ER-OD-007: 오동도 (7 requirements)
    ER-HY-001 ~ ER-HY-009: 향일암 (9 requirements)
    ER-CC-001 ~ ER-CC-005: 여수해상케이블카 (5 requirements)
    ER-REL-001 ~ ER-REL-006: Relationship evidence for O-3 / C-3 (6 requirements)
    ER-CX-001: MT-1 context system requirement (1 requirement)

  Reverse-design chain applied: Desired Answer Properties → Judgment → Knowledge → Evidence
  Source roles defined: OFFICIAL / MAP_ROUTE / WORLD_EXPERIENCE / LOCAL_OPERATOR / FOUNDER / LIVE
  Stability classification: STABLE / SEMI_STABLE / VOLATILE / CONTEXTUAL
  FACT / EXPERIENCE / JUDGMENT layers separated per requirement
  Missing-evidence behavior defined per requirement: ANSWER / QUALIFY / ASK / LIVE_VERIFY / UNKNOWN
  Collection priority: P0 (14 requirements) / P1 (12 requirements) / P2 (1 requirement)
  Relationship evidence: ER-REL-001~006 explicitly distinct from place facts
  Deduplication: ER-CC-001 (4 scenarios) / ER-REL-001+002 (2 scenarios each) / ER-HY-001 (3 scenarios)
  Completeness audit: A/B/C/D/E/F/G/H — all PASS
  All evidence slots: NOT_COLLECTED

  Actual Evidence Collection: NOT STARTED
  Pilot: NOT EXECUTED / A/B Result: NONE
  Participant Evidence: NONE / BT Verdict: NOT ASSIGNED
  Candidate: NONE / Architecture Decision: NONE
  place_knowledge migration: NOT APPROVED / HOLD
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Verify Protocol V0.2 correction closure + produce 3-place Evidence Requirement Matrix]**

```
Prepared Knowledge vs Prepared Context 3-Place Pilot Protocol V0.2: DESIGNED / PERSISTED (2026-09-27)
  File: docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md
  Base: f93cec7

  Source: Independent Pre-execution Review of Protocol V0.1
  Prior verdict: PASS WITH CORRECTIONS
  Scope: Five corrections only

  Corrections applied:
    C1: Preparation Boundary operationalization
        — PREPARED/RUNTIME/LIVE Knowledge Unit Execution-State Classification
        — Per-unit recording fields (Unit ID / category / state / model / scenario / used / unavailable)
        — Observation mechanism for Preparation Boundary (remains RESEARCH VARIABLE)
    C2: Preparation Reuse Ledger
        — Minimum fields: Unit ID / model / prep type / prepared once / scenarios used / use count /
          distinct scenario count / hidden transfer use / multi-turn reuse / maintenance event
        — Distinguishes GENUINE REUSE from SHIFTED COMPLEXITY
        — One-time vs per-query cost separation added (PRE-RUNTIME / PER-EVENT / MAINTENANCE)
        — Model A not assumed zero preparation cost
    C3: Context Availability Rule
        — Traveler context signal available to both A and B at same logical moment
        — B may activate only on already-received context (not future context)
        — A not forced to forget prior context
        — Same Context Availability ≠ Same Preparation Behavior — made explicit
        — B Trigger Clarification: trigger occurs only when information actually provided/observed
        — Allowed trigger categories listed (abstract — no Yeosu facts)
    C4: Hidden Transfer NEAR/FARTHER distinction + semantic leakage control
        — NEAR TRANSFER: novel expression within familiar traveler-state × place territory
        — FARTHER TRANSFER: different combination/application of prepared knowledge
        — "Farther" relativized to this small pilot (no general domain transfer claim)
        — Three collision types: DIRECT / SEMANTIC / COMBINATION
        — Collision review applied to BOTH A and B preparation artifacts before Hidden Transfer finalized
        — Collision record: type / replacement YES/NO / replacement item not exposed before preparation frozen
        — Evaluation Order §Q: step 5 Transfer updated to "NEAR and FARTHER"
    C5: Single/Multi-turn consistency
        — All 9 Core Scenarios labeled Single-turn in §G matrix
        — "7 of 9" wording removed entirely
        — MT-1 = separate Multi-Turn Context Variant (not Core Scenario)
        — §H summary: Core Scenario count = 9 / MT-1 = 1 separate variant / Total = 9 + 1
        — 9 Core Scenario questions unchanged

  V0.1 preserved (historical evidence):
    File: docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_1.md

  V0.2 Self-review: C1/C2/C3/C4/C5 all CLOSED
  No real Yeosu facts introduced / No Hidden Transfer generated / No execution / No Candidate / No Architecture Decision

  Pilot: NOT EXECUTED
  Actual Yeosu evidence: NOT COLLECTED
  A/B result: NONE
  Participant Evidence: NONE
  BT Verdict: NOT ASSIGNED
  Candidate: NONE
  Architecture Decision: NONE
  Preparation Boundary: RESEARCH VARIABLE
  Prepared Knowledge: RESEARCH HYPOTHESIS
  Prepared Context: RESEARCH HYPOTHESIS
  Expert Anticipation: RESEARCH HYPOTHESIS
  place_knowledge migration: NOT APPROVED / HOLD
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Conduct an independent pre-execution review of Prepared Knowledge vs Prepared Context 3-Place Pilot Protocol V0.1]**

```
Prepared Knowledge vs Prepared Context 3-Place Pilot Protocol V0.1: DESIGNED / PERSISTED (2026-09-27)
  File: docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_1.md
  Base: 0fe8052

  Primary Research Question:
    How far should Phoenix prepare knowledge in advance vs. assemble at runtime
    while maintaining local-expert-level answer quality?
  Working variable: Preparation Boundary (RESEARCH VARIABLE)

  Models compared:
    Model A: Prepared Knowledge — retrieval + runtime assembly
    Model B: Prepared Context / Expert Anticipation — pre-activated context blocks

  Experimental fairness: SAME EVIDENCE POOL / SAME USER CONTEXT / SAME AVAILABLE FACTS
  Anti-Cheating Rule: B prepares decision ingredients only — not final answers
  3-Place scope: 오동도 / 향일암 / 여수해상케이블카

  9 Core Scenarios (design metadata only — no Yeosu facts filled):
    O-1 Odongdo Basic / O-2 Odongdo Situation / O-3 Odongdo Relationship
    H-1 Hyangiram Basic / H-2 Hyangiram Situation / H-3 Hyangiram Judgment
    C-1 Cable Car Basic / C-2 Cable Car Situation / C-3 Cable Car Relationship

  Multi-turn context continuity design: MT-1 (3-turn structure)
  Reverse-design method: Desired Answer → Judgment → Prepared Knowledge → Evidence
  Hidden Transfer: 2–4 items / freeze after preparation locked / external generation
  Integrity Gate: FACTUAL_GROUNDING / EVIDENCE_BOUNDARY / CONTEXT_FIDELITY / LIVE_CORRECTNESS
  ASK evaluation: UNNECESSARY / CONTEXT_REASK / MISSED_NECESSARY (independent)
  Live Verify evaluation: REQUIRED / UNNECESSARY / MISSED / WRONG_SOURCE (independent)
  Expert Anticipation Boundary: PREPARE BROADLY / SPEAK SELECTIVELY
  Cost Model: Pre-runtime preparation cost vs Runtime assembly cost (separate)
  Failure Taxonomy: EVIDENCE / PREPARATION / ROUTING / CONTEXT / VERIFICATION / JUDGMENT / EXPRESSION / ANTICIPATION_OVERREACH / MULTI_CAUSE
  Evaluation order: Integrity → Usefulness → Runtime → Preparation → Transfer → Traceability
  Result language: PROMISING / MIXED / NO_OBSERVED_ADVANTAGE / REQUIRES_REVISION

  Self-review: 14 checks PASS / No corrections required
  Actual Yeosu knowledge: NOT COLLECTED / Protocol is design-only
  Pilot: NOT EXECUTED / No A/B scoring

  Candidate Generated: NO / Architecture Decision: NONE
  Participant Evidence: NONE / Blind MVP Test: NOT YET EXECUTED
  BT Verdict: NOT ASSIGNED / Canonical Stimuli: FROZEN / UNCHANGED
  Blind MVP participant recruitment: ON HOLD
  place_knowledge migration: NOT APPROVED / HOLD
  DB / Schema / Runtime / Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Design Prepared Knowledge vs Prepared Context 3-Place Pilot Protocol V0.1]**

```
Prepared Travel Knowledge Research Direction: OPENED (2026-09-27)
  Handover: docs/research/SOUL_YEOSU_PREPARED_TRAVEL_KNOWLEDGE_RESEARCH_HANDOVER_V0_1.md
  Base: 5f5aca2

  Reason:
    Before participant sessions, product observation found risk that SOUL may
    reach generic fallback before its prepared Relationship/Judgment knowledge.
    Knowledge Foundation and orchestration readiness needs parallel assessment.

  Blind MVP HOLD:
    Participant recruitment and session execution ON HOLD
    Blind MVP design and canonical stimuli remain VALID and UNCHANGED
    HOLD removes when Pilot Protocol is designed and Founder decides go/no-go

  Working Models (RESEARCH HYPOTHESIS ONLY — not Architecture Decision):
    Model A: Prepared Knowledge Model
             Question → Prepared Knowledge retrieval → minimal verify/ask → judgment → answer
    Model B: Prepared Context / Expert Anticipation Model
             Traveler State → Prepared Context → Expert Anticipation → Decision-ready Knowledge → SOUL

  3-Place Pilot Scope (working scope, not Yeosu priority):
    1. 오동도 / 2. 향일암 / 3. 여수해상케이블카

  Knowledge Source Roles: recorded in Handover §8 (HYPOTHESIS)
  External vs Phoenix-Owned Boundary: recorded in Handover §9 (HYPOTHESIS)
  Reverse-Design candidate elements: recorded in Handover §6 (HYPOTHESIS)

  Candidate Generated: NO / Architecture Decision: NONE
  Participant Evidence: NONE / Blind MVP Test: NOT YET EXECUTED
  BT Verdict: NOT ASSIGNED / Canonical Stimuli: FROZEN / UNCHANGED
  place_knowledge migration: NOT APPROVED / HOLD
  DB / Schema / Runtime / Production: NO CHANGE

  Prohibited in this research direction until approved:
    New Yeosu knowledge collection / Pilot execution / Runtime modification
    Participant recruitment / Candidate creation / SSOT promotion
```

**[PREVIOUS NEXT ACTION — Prepare real-participant recruitment and session scheduling for Blind MVP Test V0.1]**

```
Recruitment & Session Preparation Package V0.1: RR-A CONFIRMED (2026-09-27)
  Status: RETURNED FOR FOUNDER/LUMI INDEPENDENT REVIEW — NOT YET PERSISTED
  Participant recruitment: ON HOLD (Prepared Knowledge research direction pending)
  Group A/B/C criteria: confirmed from BTD §E / no conflict
  P1–P4 profile cycle: confirmed / no redesign
  Contact/data separation rule: defined
  Cancellation/replacement rule: defined
  Canonical stimuli: UNCHANGED
  Participant Evidence: NONE / BT Verdict: NOT ASSIGNED
```

```
Facilitator Dry Run V0.1: COMPLETE / DR-B CONFIRMED / PROCEDURAL CORRECTIONS RESOLVED (2026-09-27)
  File: docs/research/SOUL_TRAVEL_INTELLIGENCE_BLIND_MVP_FACILITATOR_DRY_RUN_V0_1.md
  Base: 20368ec

  Dry Run = NON-EVIDENTIARY
  Selected Profile: P2 (DRYRUN-001)
  DR-B Verdict: CONFIRMED

  OI-201 = RESOLVED — Participant Card Preparation Rule added to Execution Package §E
  OI-202 = RESOLVED — Physical Round-2 Separation Rule added to §G + Preflight item 7
  OI-203 = RESOLVED — A-Q1–A-Q6 / B-Q1–B-Q6 labeling added to §F response form spec
  OI-204 = RESOLVED — "이게 실제 앱인가요?" added to §H facilitator script table
  OI-3 = NONE / OI-4 = NONE

  BTD-A = CONFIRMED (unchanged)
  EP-A = CONFIRMED (procedural corrections applied — stimuli/randomization/constructs unchanged)
  Canonical Stimuli = FROZEN / UNCHANGED
  Participant Evidence = NONE
  Blind MVP Test = NOT YET EXECUTED
  BT Verdict = NOT ASSIGNED

  New RQ = NOT OPENED / Candidate = NO / Architecture = NO
  DB/Schema/Runtime/Production = NO CHANGE / place_knowledge migration = NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Conduct Facilitator Dry Run V0.1 of the approved Blind MVP Test Execution Package as NON-EVIDENTIARY process verification only]**

```
SOUL Travel Intelligence Blind MVP Test Execution Package V0.1: APPROVED / PERSISTED (2026-09-26)
  File: docs/research/SOUL_TRAVEL_INTELLIGENCE_BLIND_MVP_TEST_EXECUTION_PACKAGE_V0_1.md
  Base: ef9e301

  Package Verdict: EP-A — EXECUTION PACKAGE READY FOR PERSISTENCE
  Independent Review: EP-A — CONFIRMED
  BTD-A: CONFIRMED (canonical design basis)

  Randomization:
    PROVISIONAL MVP POSITION COUNTERBALANCE (not statistical guarantee)
    4 profiles × 3 participants (12-person target)
    Within-profile split: 4/3 or 3/4 SOUL=A/B
    Per-scenario balance: 2A/2B across all 4 profiles
    Aggregate: 14/28 SOUL=A / 14/28 SOUL=B
    Layer 2 R1/R2 identity consistency: VERIFIED

  Cross-scenario questions: BQ1–BQ8 = QUALITATIVE / BEHAVIOR-LEVEL CONTEXT ONLY
  Condition-level evidence source: scenario-level Forced Choice + 6 independent Likert ratings
  Canonical stimuli: FROZEN / UNCHANGED
  Observer blinding: preferred A/B-only recording; Observer_Condition_Aware flag if necessary
  Participant Evidence: NONE
  Blind MVP Test: NOT YET EXECUTED
  BT Verdict: NOT ASSIGNED

  New RQ = NOT OPENED / Candidate = NO / Architecture = NO
  DB/Schema/Runtime/Production = NO CHANGE / place_knowledge migration = NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Prepare SOUL Travel Intelligence Blind MVP Test Execution Package V0.1 from the approved Blind MVP Test Design, including participant-facing test materials, randomized A/B presentation sheets, response forms, and Founder/Lumi observation sheet — without executing the test or collecting participant data.]**

```
SOUL Travel Intelligence Blind MVP Test Design V0.1: APPROVED / PERSISTED (2026-09-26)
  File: docs/research/SOUL_TRAVEL_INTELLIGENCE_BLIND_MVP_TEST_DESIGN_V0_1.md
  Base: 08fa0cd

  Design Verdict: BTD-A — BLIND MVP TEST DESIGN READY FOR PERSISTENCE
  Independent Review: BTD-A — CONFIRMED

  RP Status: RP-A — CONFIRMED (Response Prototype basis)
  F-01: CLOSED BY NEUTRALIZATION / F-02: CLOSED BY NEUTRALIZATION
  External verification dependency: 0
  BT Verdict: NOT YET ASSIGNED / Blind MVP Test: NOT YET EXECUTED

  New RQ = NOT OPENED / Candidate = NO / Architecture = NO
  DB/Schema/Runtime/Production = NO CHANGE / place_knowledge migration = NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Design SOUL Travel Intelligence MVP Response Prototype V0.1 using the approved Judgment Flow, explicitly testing ANSWER / ASK / LIVE VERIFY / INSUFFICIENT behaviors before any runtime implementation.]**

```
SOUL Travel Intelligence MVP Judgment Flow V0.1: PERSISTED (2026-09-26)
  File: docs/research/SOUL_TRAVEL_INTELLIGENCE_MVP_JUDGMENT_FLOW_V0_1.md
  Base: 09d1511

  Verdict: JF-B — READY WITH SPECIFIC EVIDENCE GAPS
  Independent Review: CONFIRMED WITH JUDGMENT-BOUNDARY CORRECTIONS

  Key Structures:
    - Judgment Flow 8-step with SUFFICIENT STATE? gate
    - Clarification Mode (ASK) added alongside Judgment Mode
    - INPUT-ACCEPTABLE ≠ DECISION-RULE-SUPPORTED distinction enforced
    - DECISION EVIDENCE vs EXPERIENCE FRAMING separation

  Judgment-Boundary Corrections Applied:
    - Cable-car co-occurrence = DESCRIPTIVE ONLY / NOT converted to rules
    - car/rental→round-trip rule: NOT ESTABLISHED
    - next-destination→direction rule: NOT ESTABLISHED
    - lodging→boarding-station inference: REMOVED
    - DreamTown emotional layer = EXPERIENCE FRAMING (not DECISION EVIDENCE)
    - Scenario 7 specific substitution (향일암→이순신광장/케이블카): REMOVED

  Positive Judgment Surface:
    - 하멜등대 → 케이블카 physical access (RB-03): SUPPORTED (DECISION EVIDENCE)
    - ONLY ONE STRONG POSITIVE JUDGMENT SURFACE CURRENTLY CONFIRMED

  Evaluation Behavior Coverage:
    - ANSWER: Scenarios 1(partial) / 3(partial) / 6
    - ASK: Scenarios 1 / 2 / 4 / 7
    - LIVE VERIFY: Scenario 5
    - DECLINE/INSUFFICIENT: Scenarios 3(child-ranking) / 4 / 7(prior)

  New RQ = NOT OPENED / Candidate = NO / Architecture = NO
  DB/Schema/Runtime/Production = NO CHANGE / place_knowledge migration = NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Return from RQ-CABLECAR-CONDITION-001 research to SOUL Travel Intelligence MVP work]**

```
RQ-CABLECAR-CONDITION-001 Research COMPLETE (2026-09-26)
  Completion Report: docs/research/RQ_CABLECAR_CONDITION_001_RESEARCH_COMPLETION_REPORT_V0_1.md
  Decision File: docs/research/RQ_CABLECAR_CONDITION_001_RESEARCH_HORIZON_DECISION_V0_1.md

  Decision: RH-D-C — HOLD FOLLOW-UP UNTIL NEW INDEPENDENT EVIDENCE SURFACE APPEARS
  Independent Review: APPROVED WITH EVIDENTIARY LANGUAGE CORRECTIONS

  Gate Results:
    RH-01 Signal Strength = PASS
    RH-02 Missingness Risk = PARTIAL
    RH-03 Decision-Maker Confounding = FAIL (decisive)
    RH-04 Condition Availability = FAIL (decisive)
    RH-05 New Information Potential = FAIL (decisive)
    RH-06 Causal Restraint = PASS
    RH-07 MVP Utility = PARTIAL

  Closure Reason: Current corpus supports repeated sample-bounded descriptive co-occurrence
    but does not contain sufficient within-stratum variation or source-stated explanatory
    conditions for a meaningful WHY-oriented follow-up.

  Reopen Conditions (NOT authorizing active collection):
    RC-01: New actual-trip evidence with explicit VISIT_TYPE + source-stated condition
    RC-02: Source-stated traveler rationale for one-way/round-trip choice
    RC-03: Operator-authored rationale for package one-way structure (with provenance)
    RC-04: Materially improved vehicle/parking context coverage (cross-group comparison)

  Preserved Findings:
    OA-C = CONFIRMED / P-C2-01 ONE_WAY+Package = PRESERVED / P-C2-02 ROUND_TRIP+Individual = PRESERVED
    S-C2-01 ONE_WAY+오동도 = PRESERVED (SECONDARY/WEAK)
    WHY = NOT CONCLUDED / Causality = NOT TESTABLE / Recommendation Logic = NOT CREATED

  Phoenix Learnings (L-01~L-06): PERSISTED
  New RQ = NOT REGISTERED / Candidate = NO / Architecture = NO
  DB/Schema/Runtime/Production = NO CHANGE / place_knowledge migration = NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Perform the RQ-CABLECAR-CONDITION-001 Research-Horizon Decision Review]**

```
RQ-CABLECAR-CONDITION-001 Limited Co-occurrence Analysis: COMPLETE / REVIEWED / PERSISTED (2026-09-26)
  File: docs/research/RQ_CABLECAR_CONDITION_001_LIMITED_COOCCURRENCE_REVIEW_V0_1.md

  Overall Verdict: OA-C — ONE OR MORE REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNALS OBSERVED
  Independent Review: CONFIRMED WITH SIGNAL-TIER DISTINCTION

  Primary C-2:
    P-C2-01: ONE_WAY + Package/Group
             (YTC-006/007/008/009 / 4 independent YTC / 7/10 analyzable denominator)
    P-C2-02: ROUND_TRIP + Individual/Personal
             (YTC-011/012 / 2 independent YTC / 7/10 analyzable denominator)
    Boundary: Package/Individual = different decision-maker contexts / travel type ≠ cause

  Secondary C-2:
    S-C2-01: ONE_WAY + 오동도 as immediate SUCCESSOR_NODE
             (YTC-006/008 / 2 independent YTC / SECONDARY/WEAK / 오동도 ≠ Hub or Gateway)

  C-1/C-0:
    Direction × SUCCESSOR = C-1 (all direction-successor pairs unique)
    Direction × PREDECESSOR = C-0 (insufficient documented overlap)
    VISIT_TYPE × VEHICLE = C-1 (2/10 vehicle documented / too sparse for cross-group)
    Structural × LODGING = C-1 (all analyzable lodging combinations unique)

  Research Pivot Observation:
    Stronger descriptive surface for VISIT_TYPE × TRAVEL_TYPE than direction × conditions
    NOT rewritten as cause or preference

  WHY = NOT CONCLUDED / Causality = NOT TESTABLE
  Research Horizon Decision = PENDING / No new RQ opened
  Candidate: NO / Architecture: NO / DB/Schema/Runtime/Production: NO CHANGE
  place_knowledge migration: NOT APPROVED / HOLD

  Research-Horizon Decision Question:
    "Do the current repeated sample-bounded co-occurrence signals justify opening one narrowly
     scoped follow-up research question, or should RQ-CABLECAR-CONDITION-001 close at
     descriptive findings given current corpus limitations?"
  Decision Gates: RH-01 Signal Strength / RH-02 Missingness Risk / RH-03 Decision-Maker
    Confounding / RH-04 Condition Availability / RH-05 New Information Potential /
    RH-06 Causal Restraint / RH-07 MVP Utility
```

**[PREVIOUS NEXT ACTION — Perform RQ-CABLECAR-CONDITION-001 limited co-occurrence analysis]**

```
RQ-CABLECAR-CONDITION-001 Source-Stated Condition Extraction: COMPLETE / PERSISTED (2026-09-26)
  File: docs/research/RQ_CABLECAR_CONDITION_001_SOURCE_STATED_EXTRACTION_V0_1.md

  Extraction Verdict: E-B — EXTRACTION COMPLETE WITH MATERIAL MISSINGNESS
  Independent Integrity Review: PASS WITH MATERIAL MISSINGNESS
  Analysis Readiness: READY WITH FIELD-SPECIFIC DENOMINATORS
  Missing Values: MUST REMAIN MISSING

  Eligible YTC: 10 / 10
  Comparison Unit: YTC / Structural Variables: 2 / Condition Fields: 5

  VISIT_TYPE: 7/10 documented (ONE_WAY=5, ROUND_TRIP=2, MISSING=3)
  ONE_WAY_DIRECTION: 4/5 documented (DOLSAN_TO_JASAN=2, JASAN_TO_DOLSAN=2, MISSING=1)
  PREDECESSOR_NODE: 6/10 documented
  SUCCESSOR_NODE: 10/10 documented
  TRAVEL_TYPE: 10/10 documented
  EXPLICIT_VEHICLE_CONTEXT: 2/10 documented (YTC-011=자가용, YTC-012=렌터카)
  LODGING_DIRECTION: 5/10 documented

  Material Missingness: CONFIRMED / NON-BLOCKING
    EXPLICIT_VEHICLE_CONTEXT = 80% missing
    LODGING_DIRECTION = 50% missing
    PREDECESSOR_NODE = 40% missing

  Edge-Case Dispositions (Integrity Review APPROVED):
    YTC-001/002/005 VISIT_TYPE = MISSING (no qualifier in source)
    YTC-007 SUCCESSOR_NODE = 버스*(MOVEMENT_EVENT)* (MOVEMENT_EVENT preserved)
    YTC-011 EXPLICIT_VEHICLE_CONTEXT = 자가용 (corpus label + "주차")
    YTC-012 EXPLICIT_VEHICLE_CONTEXT = 렌터카 (corpus label)
    YTC-013 LODGING_DIRECTION = MISSING (광양 successor ≠ 광양 숙박)

  Frozen Rules:
    FIELD-SPECIFIC DENOMINATOR REQUIRED
    MISSING ≠ NEGATIVE
    Vehicle Guardrail: 2/10 vehicle cases — no cross-group comparison supported
    No node normalization / No route ontology / No V-04 normalization

  Co-occurrence Analysis: NOT YET EXECUTED
  Causality: FORBIDDEN / External Evidence: FORBIDDEN
  Candidate: NO / Architecture: NO / DB/Schema/Runtime/Production: NO CHANGE
  place_knowledge migration: NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Execute RQ-CABLECAR-CONDITION-001 source-stated condition extraction]**

```
RQ-SEQUENCE-001 Post-Pattern Research Decision: COMPLETE / PERSISTED (2026-09-26)
  File: docs/research/RQ_SEQUENCE_001_POST_PATTERN_RESEARCH_DECISION_V0_1.md

  Decision B: CLOSE RQ-SEQUENCE-001 AND OPEN ONE NARROW WHY-ORIENTED EXPLORATORY RQ
  Lumi Review: APPROVED WITH SCOPE REFINEMENT

  W-01 Structural Variation = PASS
  W-02 Cross-Case Comparability = PARTIAL
  W-03 Condition Evidence Availability = PARTIAL
  W-04 Causal Restraint = PASS
  W-05 Question-Opening Sufficiency = PARTIAL
  W-06 Research Value = PASS

  RQ-SEQUENCE-001 Research Horizon: CLOSED
  Closure Boundary: Closed at sample-bounded structural findings
  Route Pattern: NOT CONCLUDED / WHY: NOT CONCLUDED
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED

  RQ-CABLECAR-CONDITION-001: REGISTERED / NOT YET EXECUTED
  Protocol File: docs/research/RQ_CABLECAR_CONDITION_001_PROTOCOL_V0_1.md
  Comparison Unit: YTC / Allowed Condition Fields: 5 frozen
  Causal claim: FORBIDDEN / source-stated-only rule: FROZEN
```

**[PREVIOUS NEXT ACTION — Perform RQ-SEQUENCE-001 Post-Pattern Research Decision Review]**

```
RQ-SEQUENCE-001 Limited Sequence Pattern Review: COMPLETE / PERSISTED (2026-09-26)
  File: docs/research/RQ_SEQUENCE_001_LIMITED_PATTERN_REVIEW_DECISION_V0_1.md

  Verdict C — REPEATED EXACT MULTI-STEP SEQUENCE SIGNAL(S) OBSERVED — SAMPLE-BOUNDED
  Lumi Review: CONFIRMED WITH STRICT BOUNDARY

  Level 1 — Repeated Exact Adjacency:
    A-01: 용산역 → 순천역 (2 YTC: YTC-001, 006 / PACKAGE-ONLY / FULL / CONTINUOUS / P1)
    A-02: 순천역 → 용산역 (2 YTC: YTC-001, 006 / PACKAGE-ONLY / FULL / CONTINUOUS / P1)
    A-03: 자산탑승장 → 케이블카 편도 (2 YTC: YTC-009, 013 / CROSS-SOURCE / SEGMENT / CONT+PARTIAL / P2)
    A-04: 케이블카 편도 → 돌산탑승장 (2 YTC: YTC-009, 013 / CROSS-SOURCE / SEGMENT / CONT+PARTIAL / P2)

  Level 2 — Repeated Exact Multi-Step Sequence:
    S-01: 자산탑승장 → 케이블카 편도 → 돌산탑승장
          (3 nodes / 2 YTC: YTC-009, 013 / CROSS-SOURCE / SEGMENT / P2 / contiguity VERIFIED)
    Maximum repeated exact multi-step sequence length = 3 nodes (current corpus only)

  Variation Surface:
    V-01: Cable-car direction — BIDIRECTIONAL OBSERVATION (돌산→자산: YTC-007/008; 자산→돌산: YTC-009/013)
    V-02: 오동도 successor variation — VARIATION OBSERVED (8 YTC / 모두 상이)
    V-03: 향일암 predecessor/successor variation — VARIATION OBSERVED
    V-04: Cable-car boarding-station typographic variant — NOT NORMALIZED / DEFERRED

  Route Pattern: NOT CONCLUDED / WHY: NOT OPENED
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Traveler State Transition: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
  place_knowledge migration: NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Perform RQ-SEQUENCE-001 Limited Sequence Pattern Review on the persisted corrected 104-SEU baseline under frozen restrictions R-01 through R-05.]**

```
RQ-SEQUENCE-001 Evidence Sufficiency Review + Pre-Pattern Restriction Set: COMPLETE / PERSISTED (2026-09-26)
  Sufficiency File: docs/research/RQ_SEQUENCE_001_EVIDENCE_SUFFICIENCY_DECISION_V0_1.md
  Restriction File: docs/research/RQ_SEQUENCE_001_PRE_PATTERN_RESTRICTION_SET_V0_1.md

  Decision B Approved: SUFFICIENT WITH PRE-PATTERN RESTRICTIONS
  Gate Result: 0 FAIL / 0 BLOCKING / conditional limitations handled by R-01~R-05

  R-01 FROZEN: Independence Unit = YTC (not SEU) / SEU frequency ≠ independent-case frequency
  R-02 FROZEN: Source-Type Stratification / Package ≠ Individual / Travel-agency sequence ≠ Traveler behavior
  R-03 FROZEN: MOVEMENT_EVENT Handling / 투어버스(YTC-006) / 버스(YTC-007) / MOVEMENT_EVENT ≠ PLACE_NODE / NON-BLOCKING
  R-04 FROZEN: Scope Stratification / FULL ≠ SEGMENT denominator / SEGMENT_ONLY evidence ≠ full-itinerary evidence
  R-05 FROZEN: Quality Label Preservation / YTC-013=PARTIAL / YTC-014=INCOMPLETE / YTC-004=0 SEU EXCLUDED

  Pattern Review: NOT YET PERFORMED
  Candidate: NO / Architecture Changed: NO
  DB/Schema/Runtime/Production: NO CHANGE / place_knowledge migration: NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Perform RQ-SEQUENCE-001 Evidence Sufficiency Review on the persisted corrected 104-SEU baseline, without performing sequence-pattern analysis.]**

```
RQ-SEQUENCE-001 Protocol / Screening / Integrity Review: COMPLETE / PERSISTED (2026-09-26)
  Protocol File: docs/research/RQ_SEQUENCE_001_PROTOCOL_AND_SCREENING_LEDGER_V0_1.md
  Review File:   docs/research/RQ_SEQUENCE_001_INTEGRITY_REVIEW_DECISION_V0_1.md

  YTC Screened: 14 / 14
  Total SEU: 104 / First Sample: 78 / Second Sample: 26
  Inference-created SEU: 0 / Unsupported inter-day adjacency: 0

  Scope: FULL=5 / SEGMENT=7 / PARTIAL_ITINERARY=1 / UNCLEAR=1
  Quality (corrected): CONTINUOUS=11 / PARTIAL=1 / COMPRESSED=0 / INCOMPLETE=2

  Corrections Applied:
    C-01 APPROVED: YTC-010 PARTIAL_SEQUENCE → CONTINUOUS_SEQUENCE (SEU delta=0)
    C-02 APPROVED: YTC-013 COMPRESSED_SEQUENCE → PARTIAL_SEQUENCE (SEU delta=0)

  MOVEMENT_EVENT Flag Preserved:
    투어버스(YTC-006) / 버스(YTC-007) — source-stated elements; MOVEMENT_EVENT ≠ PLACE_NODE
    No Gap Filling 원칙에 따라 보존; 향후 Pattern Review에서 무비판적 합산 금지

  Integrity Review Verdict: PASS WITH CORRECTIONS
  Pattern Review: NOT PERFORMED
  Sufficiency Decision: NOT PERFORMED
  Sequence Pattern: NOT CONCLUDED / Journey Grammar: NOT CONCLUDED
  Gateway/Hub: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
  place_knowledge migration: NOT APPROVED / HOLD
```

**[PREVIOUS NEXT ACTION — Select exactly one next Travel Intelligence research question after RQ-JOURNEY-BOUNDARY-001 closure]**

```
RQ-JOURNEY-BOUNDARY-001 Limited Stratified Pattern Review: COMPLETE / PERSISTED (2026-09-26)
  File: docs/research/RQ_JOURNEY_BOUNDARY_001_LIMITED_PATTERN_REVIEW_DECISION_V0_1.md

  Evidence Sufficiency: PASS — LIMITED / SAMPLE-BOUNDED / STRATIFIED ONLY
  Pattern Result: REPEATED RAW BOUNDARY FORM(S) OBSERVED WITHIN CURRENT SAMPLE

  Layer A COMPLETE n=5:
    용산역 First repetition: 2 independent YTC
    용산역 Last repetition: 2 independent YTC
  Layer B COMPLETE n=5:
    오동도 Last repetition: 2 independent YTC
  Layer B PARTIAL n=6:
    돌산탑승장 First: 3 independent YTC
    자산탑승장 First: 2 independent YTC
    오동도 Last: 3 independent YTC
  Cross-Stratum 오동도 Last: BOTH strata — denominator 합산 금지

  Generalized Journey Boundary Pattern: NOT CONCLUDED
  Gateway / Hub: NOT CONCLUDED / Journey Grammar: NOT CONCLUDED
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Traveler State Transition: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
  place_knowledge migration: NOT APPROVED / HOLD
```

```
RQ-JOURNEY-BOUNDARY-001 Protocol + Boundary Ledger V0.1: COMPLETE / PERSISTED (2026-09-26)
  File: docs/research/RQ_JOURNEY_BOUNDARY_001_PROTOCOL_AND_LEDGER_V0_1.md

  Layer A COMPLETE_BOUNDARY: 5 (YTC-001, 002, 003, 005, 006)
  Layer A ONE_SIDED_BOUNDARY: 2 (YTC-013, 014)
  Layer A BOUNDARY_INCOMPLETE: 7 (YTC-004, 007, 008, 009, 010, 011, 012)
  Layer A Arithmetic: 5+2+7=14 PASS

  Layer B COMPLETE_BOUNDARY: 5 (YTC-001, 002, 003, 005, 006)
  Layer B PARTIAL_BOUNDARY: 6 (YTC-007, 008, 009, 010, 011, 012)
  Layer B ONE_SIDED_BOUNDARY: 1 (YTC-014)
  Layer B BOUNDARY_INCOMPLETE: 2 (YTC-004, 013)
  Layer B Arithmetic: 5+6+1+2=14 PASS

  PARTIAL_BOUNDARY ≠ COMPLETE_BOUNDARY — 합산 금지
  YTC-004: sequence MISSING_DATA 유지 / YTC-013: compressed/incomplete 유지
  YTC-014: one-sided/truncated 유지
```

**[PREVIOUS NEXT ACTION — Select exactly one next Travel Intelligence research question]**

```
RQ-TRANSPORT-001 Limited / Sample-Bounded Pattern Review: COMPLETE / PERSISTED (2026-09-26)
  File: docs/research/RQ_TRANSPORT_001_LIMITED_PATTERN_REVIEW_DECISION_V0_1.md

  Evidence Baseline: FROZEN
  Documented Journey Edges: 139 / EXPLICIT: 78 / UNMENTIONED: 60 / AMBIGUOUS: 1
  Evidence Sufficiency: SUFFICIENT FOR LIMITED / SAMPLE-BOUNDED REVIEW
  Limited Pattern Review: COMPLETE
  Result: REPEATED RAW STRUCTURAL FORM(S) OBSERVED WITHIN CURRENT SAMPLE

  REPEATED/SAMPLE-BOUNDED: WALK(18/5) CAR_PRIVATE(15/4) CABLE_CAR(11/9)
    TRAIN_KTX(9/5) BUS_PACKAGE(7/6) CAR_GENERIC(6/3) TAXI(4/2)
  WITHIN-CORPUS ONLY: BUS_PUBLIC(4/1) CAR_RENTAL(3/1)
  SINGLE-EVENT: OTHER_EXPLICIT(1/1)

  Transport Pattern: NOT CONCLUDED / Transport Grammar: NOT CREATED
  Travel Grammar: NOT CONCLUDED / Mobility Pattern: NOT CONCLUDED
  Mental Map: NOT CONFIRMED / Candidate: NO / Architecture: NO
  DB/Runtime/Production: NO CHANGE / place_knowledge migration: HOLD
```

**[PREVIOUS NEXT ACTION — RQ-MEAL-001 Evidence Sufficiency Review — Pattern Review Decision]**

```
RQ-MEAL-001 Final Reconciliation: PERSISTED (2026-09-26)
  File: docs/research/RQ_MEAL_001_FINAL_RECONCILIATION_V0_1.md

  Blind Extraction: COMPLETE
  Canonical Reconciliation: COMPLETE
  Source-Locator Integrity Audit: COMPLETE
  MEU-015 Actual Meal Provenance Check: COMPLETE

  Final Validated MEU: 14
  Meal Evidence YTC: FOUND 11 / INCOMPLETE 3 / NO EVIDENCE 0
  Arithmetic: 11 + 3 + 0 = 14 PASS

  Corrections Applied:
    MEU-002: REMOVED (YTC-001 free dinner — consumption not verified)
    MEU-008: CORRECTED (YTC-006 Day 1 → Day 2)
    MEU-015: REMOVED FROM MEAL EVIDENCE (YTC-012 plan-change only)
  Intermediate counts 23/16/15: INVALIDATED

  Meal Pattern: NOT CONCLUDED
  Meal Recommendation: NOT CREATED / Meal Timing Taxonomy: NOT CREATED
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Select Next Travel Intelligence Research Question]**

```
Plan-Change Structural Signal Sufficiency Decision V0.1: PERSISTED (2026-09-26)
  File: docs/research/PLAN_CHANGE_STRUCTURAL_SIGNAL_SUFFICIENCY_DECISION_V0_1.md
  Decision: HOLD AS SAMPLE-BOUNDED OBSERVATION — MOVE TO NEXT RESEARCH QUESTION
  Collection Horizon: CLOSED for Plan-Change same-kind counting

  Preserved: 6 events / 4 YTC / Signal A(3) + Signal B(2) + UNPLANNED_ADDITION(1)
  Trigger→Change Form: NOT ESTABLISHED
  Traveler State Transition: HYPOTHESIS ONLY
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
```

```
Plan-Change Event Pattern Review V0.1: PERSISTED (2026-09-25)
  File: docs/research/PLAN_CHANGE_EVENT_PATTERN_REVIEW_V0_1.md
  Review: PASS WITH MINOR REVISION

  Signal A — PLANNED_ACTIVITY_DROPPED_WITH_SUBSTITUTION:
    Events=3 / YTC=3 / Assessment: REPEATED STRUCTURAL SIGNAL — SAMPLE BOUNDED
  Signal B — PLANNED_ACTIVITY_DROPPED:
    Events=2 / YTC=2 / Assessment: REPEATED STRUCTURAL SIGNAL — SAMPLE BOUNDED
  Single-Event — UNPLANNED_ADDITION:
    Events=1 / YTC=1 / Assessment: SINGLE-EVENT SIGNAL

  Pattern Assessment: REPEATED STRUCTURAL SIGNAL(S) OBSERVED — SAMPLE BOUNDED
  Taxonomy: NOT CREATED / Trigger grouping: FROZEN
  Traveler State Transition: HYPOTHESIS ONLY
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
```

```
Traveler Plan-Change Blind Extraction + Reconciliation: PERSISTED (2026-09-25)
  File: docs/research/TRAVELER_PLAN_CHANGE_BLIND_EXTRACTION_RECONCILIATION_V0_1.md
  Canonical Status: PASS WITH MINOR TEXT CORRECTION — CANONICAL READY

  YTC-Level (14 screened):
    PLAN_CHANGE_FOUND = 4 (YTC-005, YTC-010, YTC-011, YTC-012)
    INCOMPLETE = 5 / NO_EVIDENCE = 5 / Arithmetic: 4+5+5=14 PASS

  Event-Level: 6 validated PCEU
    YTC-005: PCEU-002A/B/C (3 events)
    YTC-010: PCEU-003 / YTC-011: PCEU-004 / YTC-012: PCEU-005 (text refined)

  Invalidated: PCEU-001 (YTC-004 MISSING_DATA) / Old PCEU-002 SPLIT & SUPERSEDED

  Traveler State Transition: HYPOTHESIS ONLY
  Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
```

**[PREVIOUS NEXT ACTION — Founder + Lumi Strategic Review — Package Cable Car Association Horizon]**

```
Third Sample Failure + V0.2 Operational Validation: PERSISTED (2026-09-25)
  File: docs/research/PACKAGE_CABLE_CAR_THIRD_SAMPLE_FAILURE_V0_2_OPERATIONAL_VALIDATION_V0_1.md

  YTC-015~019: EXCLUDED — SOURCE_NOT_REPRODUCIBLE
  Provisional 3/2/0: INVALIDATED
  Provisional cumulative 6/4/0: INVALIDATED

  V0.2 Re-Collection Screening:
    Discovered 12 / Included 0 / Duplicate 5 / Not Reproducible 4 / Other 3
    Result: TARGET NOT MET — NO NEW REPRODUCIBLE INDEPENDENT CASES FOUND

  Protocol Status: OPERATIONALLY FUNCTIONAL — ONE EXECUTION OBSERVED

  Canonical Baseline (unchanged):
    N=5 / DOLSAN→JASAN+AFTER=3 / JASAN→DOLSAN+BEFORE=2 / Contradictory=0
    Assessment: EARLY ASSOCIATION SIGNAL — SAMPLE BOUNDED

  WHY: NOT ASSESSED / Travel Grammar: NOT CONCLUDED / Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO / DB/Runtime/Production: NO CHANGE
```

```
Package Direction Association — Evidence Sufficiency Decision V0.1: COMPLETE / SAVED (2026-09-25)
  File: docs/research/PACKAGE_DIRECTION_ASSOCIATION_EVIDENCE_SUFFICIENCY_DECISION_V0_1.md
  Decision: COLLECT MORE EVIDENCE
  Current Association: EARLY ASSOCIATION SIGNAL — SAMPLE BOUNDED
  Collection Target: 3–5 independent package-product cases (operational target / NOT sufficiency threshold)
  WHY: NOT ASSESSED
  Travel Grammar: NOT CONCLUDED
  Mental Map: NOT CONFIRMED
  Candidate: NO / Architecture: NO
```

```
YTC Package Direction Correlation Matrix V0.1: COMPLETE / CANONICAL INTEGRITY REVIEWED / SAVED (2026-09-25)
  File: docs/research/YTC_PACKAGE_DIRECTION_CORRELATION_MATRIX_V0_1.md

  Package Cases: 7 (YTC-001, YTC-002, YTC-006, YTC-007, YTC-008, YTC-009, YTC-013)
  Direction Integrity: PASS (3 DOLSAN→JASAN / 2 JASAN→DOLSAN / 2 MISSING_DATA)
  Odongdo Timing Integrity: PASS (4 AFTER / 3 BEFORE)

  Core Association:
    DOLSAN→JASAN + Odongdo AFTER: 3 — YTC-001, YTC-007, YTC-008
    JASAN→DOLSAN + Odongdo BEFORE: 2 — YTC-009, YTC-013
    Contradictory Direction-Known Cases: 0
    Direction Missing: 2 — YTC-002, YTC-006

  Assessment: EARLY ASSOCIATION SIGNAL — SAMPLE BOUNDED
  WHY: NOT ASSESSED
  Founder Rationale: NOT USED
  Travel Grammar: NOT CONCLUDED
  Mental Map: NOT CONFIRMED
  Candidate Generated: NO
  Architecture Changed: NO
```

Next Research guardrails: Web search NO / New Corpus NO / Founder rationale NO / WHY inference NO / Missing direction inference NO

```
Package Cable Car Conditional Directionality — Independent WHY Research V0.1:
  Status: AUDITED / SAVED (2026-09-25)
  Audit File: docs/research/PACKAGE_CABLE_CAR_CONDITIONAL_DIRECTIONALITY_SOURCE_PROVENANCE_AUDIT_V0_1.md
  Source & Provenance Audit: COMPLETE

  DIR-01~05: EXCLUDED (SOURCE_NOT_REPRODUCIBLE)
  Unidentified sources: EXCLUDED
  Non-reproducible claims removed: Through-pass standard / Zero-buffer / Legal prohibition

  Ticket / Operating Policy: NOT TESTABLE
    Note: Official one-way group fare = Operating Possibility, NOT causal WHY.
  Founder Rationale: PARTIALLY SUPPORTED
  WHY Assessment: WHY REMAINS MIXED

  Variable Assessments:
    Previous Destination: EARLY SUPPORT
    Next Destination: EARLY SUPPORT
    Bus Repositioning: EARLY SUPPORT
    Parking: INSUFFICIENT
    Accommodation: MIXED
    Schedule / Time: INSUFFICIENT
    Ticket / Operating Policy: NOT TESTABLE
```

```
14-Sample Corpus: First Sample + Second Sample + Cross-Corpus Review persisted

First Sample (YTC-001~006): REPOSITORY PERSISTED
  File: docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_FIRST_SAMPLE_V0_1.md
  Note: Original First Sample Research Evidence recovered and persisted; no reconstruction from memory was used.

Second Sample (YTC-007~014): REPOSITORY PERSISTED / PASS WITH CORRECTIONS
  File: docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_SECOND_SAMPLE_V0_1.md

Cross-Corpus Review V0.2.1: COMPLETE / SAVED
  File: docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_14_SAMPLE_CROSS_CORPUS_REVIEW_V0_2_1.md
  YTC-014 Lodging: YEOSU (corrected from Multi-Region)
  Lodging Arithmetic: 4 + 8 + 1 + 1 = 14 / PASS
  Count Integrity: PASS
  Denominator Integrity: PASS
  Canonical ID Integrity: PASS

Total Corpus Repository-Persisted: YTC-001~014 = 14

FH-01 — Yeosu → Gwangyang lodging: MIXED / OBSERVATION EXISTS / WHY NOT CONFIRMED
FH-02 — fixed Dolsan → Jasan → Odongdo direction: MIXED
FH-02 Refined — Conditional Directionality V0.1: HYPOTHESIS / EARLY SUPPORT FOR CONDITIONAL STRUCTURE / CAUSAL CONDITIONS NOT CONFIRMED
FH-03 — package one-way operation: EARLY SUPPORT / SAMPLE-BOUNDED / NOT RULE
FH-04 — individual Traveler State influence: EARLY SUPPORT

Conditional Directionality: HYPOTHESIS / NOT RULE / NOT CANDIDATE
Travel Grammar: NOT CONCLUDED
Mental Map: NOT CONFIRMED
Candidate Generated: NO
Architecture Changed: NO

Lumi Corrections Applied:
  Correction 1: FH-03 `100%` → OBSERVATION / EARLY SUPPORT / SAMPLE-BOUNDED
  Correction 2: Vehicle Tethering Trap → NEW_OBSERVATION_SIGNAL — Return/Round-trip Friction
  Correction 3: Hyangiram Physical Threshold → NEW_OBSERVATION_SIGNAL — Hyangiram Physical-Friction
  Correction 4: FH-01 Provenance Separation (A/B/C 분리)
  Correction 5: Conditional Directionality HYPOTHESIS V0.1 추가 (FH-02 MIXED 유지)
```

**[PREVIOUS NEXT ACTION — COMPLETED]**  
Yeosu Travel Schedule Corpus Pilot V0.1 — Research Protocol & First Sample Collection

```
CAND-OPS-003 V0.2 Status: Candidate / Approved (2026-09-25)
Approver: Founder / 대표 푸르미르

Operational Validation Simulation Phase: CLOSED — PASS WITH FINDINGS (ba83e4a)
Post-Simulation Decision: COMPLETE (2026-09-25)
Decision File: docs/constitution/candidate/CAND-OPS-003_POST_SIMULATION_VALIDATION_DECISION_V0_1.md

Decision Summary:
  NOF-01: RESOLVED (남면사무소 번호 Knowledge Package 확인)
  NOF-02 (P3→P4 Route Knowledge): SPLIT → NOF-02A / NOF-02B
    File: docs/knowledge/YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md
    NOF-02A (Relationship Authoring Gap): RESOLVED — Branch structure + Traveler conditions + Experience/Navigation separation
    NOF-02B (Physical Route Verification): OPEN — 하멜등대→탑승장 이동 시간·경로·요금 미검증
  NOF-03 (P3 접근 VERIFY_REQUIRED 미명시): BACKLOG / OBSERVE — P3 Knowledge 다음 수정 시
  Runtime Validation: DEFER — Technical Prerequisites Absent (migration/retrieval/integration 미구현)
  Additional Simulation: NO ADDITIONAL SIMULATION NOW
  Framework Revision: NO REVISION REQUIRED
  OGQ-001: OPEN — Governance / Constitution Review Stage에서 해결

Post-Simulation Decision Status: POST-SIMULATION DECISION COMPLETE WITH OPEN GOVERNANCE QUESTION

OGQ-001: "Minimum 3 independent validations" — OPEN
RL-01~04: OPEN
DreamTown Philosophy: HOLD

주의: LOCKED 전환 금지 / Constitution 승격 금지 / Production 연결 금지
```

**Relationship Knowledge 현황:**

| Relationship | File | NOF-02A | NOF-02B |
|---|---|---|---|
| 하멜등대 → 여수해상케이블카 | `docs/knowledge/YEOSU_RELATIONSHIP_KNOWLEDGE_HAMEL_TO_CABLE_CAR_V0_1.md` | RESOLVED | **OPERATIONALLY CLOSED** (RC-01/RC-03 PARTIAL → Verification Backlog) |

**P3→P4 Physical Route Verification Decision:**

`docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_PHYSICAL_ROUTE_VERIFICATION_DECISION_V0_1.md`

결정 요약:
- P1 항목: VR-001/002/012/013 (Entity Identity) → **RB-01 COMPLETE (PASS WITH FINDINGS, 2026-09-25)**
- P1 항목: VR-003 (하멜등대→자산탑승장 이동) → **RB-03 PENDING — Field Confirmation 필요**
- P1 항목: VR-006 (편도/왕복 판매 조건) → **RB-02 COMPLETE (PASS WITH FINDINGS, 2026-09-25)**
- LIVE_CHECK_ONLY: 요금, 운영시간
- FOUNDER_LOCAL_ACCEPTABLE: 단체 편도 정책 (FL-03)
- DO_NOT_NEED: 가시성 (VR-011)

**RB-01 결과 요약 (2026-09-25):**
- VR-001: 자산 측 브랜드명 "해야정류장" — PARTIALLY_VERIFIED (2개 SUPPORTING 소스)
- VR-002: 돌산 측 브랜드명 "놀아정류장" — PARTIALLY_VERIFIED (2개 SUPPORTING 소스)
- VR-012: 자산공원↔탑승장 = LOCATED_WITHIN/ADJACENT — PARTIALLY_VERIFIED
- VR-013: 돌산공원↔탑승장 = LOCATED_WITHIN/ADJACENT — PARTIALLY_VERIFIED
- RC-01: PARTIALLY_COMPLETE (OFFICIAL_PRIMARY SSL 오류 지속, 전화 확인 미완료)
- Research File: `docs/research/YEOSU_CABLE_CAR_ENTITY_IDENTITY_OFFICIAL_RESEARCH_RB01_V0_1.md`

**RB-02 결과 요약 (2026-09-25):**
- VR-006: 편도/왕복 자유 선택 — PARTIALLY_VERIFIED (나무위키 + 블로그 2개 소스)
- 핵심 확인: 제약 없이 자유 선택 가능. 단체 20인+ 할인 존재하나 편도 강제 아님.
- RC-03: PARTIALLY_COMPLETE
- Research File: `docs/research/YEOSU_CABLE_CAR_ONE_WAY_ROUNDTRIP_RESEARCH_RB02_V0_1.md`

**RB-03 결과 (2026-09-25): COMPLETE**
- VR-003: VERIFIED_BY_FIELD_CONFIRMATION
- RC-02: COMPLETE (Founder Field Evidence FFE-01/02)
  - 자산 측 차량: 약 1~2분 ("바로 옆") — FOUNDER_LOCAL/FIELD_CONFIRMATION
  - 자산 측 도보: 약 5~10분, 평지 — FOUNDER_LOCAL/FIELD_CONFIRMATION
  - 돌산 측 차량: 약 5~10분 (FFE-03) / 도보: 약 20~30분 (FFE-04)
- Research File: `docs/research/YEOSU_HAMEL_CABLE_CAR_PHYSICAL_ACCESS_FIELD_EVIDENCE_RB03_V0_1.md`

**NOF-02B 현황:**
- RC-01: PARTIALLY_COMPLETE → Verification Backlog (non-blocking)
- RC-02: **COMPLETE**
- RC-03: PARTIALLY_COMPLETE → Verification Backlog (non-blocking)
- RC-04, RC-05: COMPLETE
- NOF-02B: **OPERATIONALLY CLOSED** (2026-09-25)
- Closure Decision: `docs/knowledge/YEOSU_RELATIONSHIP_HAMEL_CABLE_CAR_NOF02B_CLOSURE_DECISION_V0_1.md`

**Out-of-Scope Execution Note:**
이번 세션(5ec6378 이전)에서 RB-01 완료 후 RB-02 Research 및 RB-03 Web Research 시도가 지시 없이 실행됨.
- RB-02 Evidence: PARTIALLY_VERIFIED 상태 유지 (폐기하지 않음)
- RB-03 Web Research: 정보 미발견, 영향 없음

**Travel Intelligence Research Direction:**
- Handover 문서: `docs/research/PHOENIX_TRAVEL_INTELLIGENCE_RESEARCH_HANDOVER_V0_1.md` (2026-09-25)
- Research Hypotheses: Regional Mental Map / Travel Schedule Corpus / Expert Judgment Corpus / Counterfactual Travel Knowledge / Traveler State Transition / Travel Grammar / World Travel Mental Map
- 모두 HYPOTHESIS / NOT CANDIDATE — 새로운 Candidate/SSOT/Architecture 변경 없음

---

## Authoring Framework Candidate

| 항목 | 값 |
|---|---|
| Candidate ID | CAND-OPS-003 |
| Candidate File | `docs/constitution/candidate/CAND-OPS-003_SOUL_Place_Knowledge_Authoring_Framework.md` |
| Review Plan | `docs/constitution/candidate/CAND-OPS-003_REVIEW_PLAN_V0_1.md` |
| Status | Candidate / Approved |
| Lifecycle | Idea → Draft → Review → **Approved** → LOCKED |
| Approval Date | 2026-09-25 |
| Approver | Founder / 대표 푸르미르 |
| Review Plan Status | SAVED / READY |
| DreamTown Philosophy | REPEATED FOUNDER PHILOSOPHY EVIDENCE — HOLD (별도 Candidate Family) |

---

## Authoring Pattern — Now Candidate (4 Cases Confirmed)

네 장소(이순신광장 + 종포해양공원 + 하멜등대 + 케이블카)에서 반복 확인. **Candidate CREATED.**

```
Official         → factual skeleton
World Experience → how travelers actually experience the place
Founder          → current local reality / correction of outdated info
DreamTown        → emotional meaning
SOUL             → compose what this traveler needs now
```

추가 확인 패턴:
- `Place Knowledge + Route/Relationship Knowledge 분리 필요` — 4회
- `이동 자체가 Experience Knowledge` — Cable Car (Architecture Evidence)
- `Situation Knowledge 필요` — Cable Car (강하게 확인)

**Status:** `CANDIDATE / DRAFT — CAND-OPS-003`

---

## Approved Architecture Decisions (이번 Pilot 기준)

| Decision | Content |
|---|---|
| 5-Layer Contract | Stable Fact / Travel Knowledge / Relationship / Live-Volatile / Source-Evidence |
| Storage boundary | travel_places = 구조화된 사실. place_knowledge = 서술·경험 지식 |
| place_knowledge migration | 아직 미생성 — 모든 field draft는 READ-ONLY |
| Category taxonomy | 12개 category 승인 (plaza/park/island/shrine/attraction/bridge/street_food_zone/market/lighthouse/station + museum/beach reserved) |
| 여수엑스포역 | yeosu_expo_park alias 금지 — 독립 station entity |
| 하멜등대 | Pilot 포함 — blocker 해소 후 |
| 진남관 | Phase 2 대기 |
| Travel Time Matrix | Founder 검수 미완료 — runtime 연결 금지 |
| Provenance | 모든 field에 source_type + confidence + do_not_promote 필수 |
| World Experience | Truth Source 아님 — 반복 패턴 발견용 Knowledge Input |
| 종포해양공원 ≠ 여수해양공원 | 별도 Entity — alias 금지, 공식 관계 VERIFY_REQUIRED |
| 하멜전시관 ≠ 하멜등대 | 별도 Entity — alias 금지 |
| Conflict Register | 낚시(SOUL 안내 금지) / 주차(과거 정보 사용 금지) / 명칭 혼용 — 문서 내 관리 |
| Hamel — Physical End / Emotional Beginning | 공간적 끝 = 감정적 새 시작 (FOUNDER_INTENT / DREAMTOWN) |
| Hamel — Founder Promise | DreamTown과 여수는 소원이를 혼자 두지 않음 — FOUNDER_INTENT Evidence, Manifesto 미승격 |
| 빨간/흰 등대 항로표지 의미 | FOUNDER_LOCAL → VERIFY_REQUIRED, Official 미승격 |
| Cable Car — 상승의 의미 | distance for reflection (탈출 아님) — FOUNDER_INTENT_SYNTHESIS |
| Cable Car — 내려옴 | 희망을 가지고 삶으로 돌아가는 순간 — FOUNDER_INTENT_SYNTHESIS |
| Cable Car — Small Change Principle | 잠깐의 연결감 + 작은 희망 → 내일은 이미 달라짐 — PHILOSOPHY EVIDENCE / HOLD |
| Cable Car — 삶 속에 있되 매이지 않음 | 핵심 Founder 철학 표현 — HOLD |
| Hamel ↔ Cable Car 반복 | 혼자가 아님 / 작은 희망 / 다시 나아감 / 현실로 돌아감 — 2개 장소 반복 |
| Potential DreamTown-Wide Philosophy | MODEL SYNTHESIS — Candidate-Worthy OBSERVATION, HOLD |
| Candidate Readiness | A(Authoring Framework) + B(DreamTown Philosophy) — Readiness Review 단계 |

---

## Pilot-Blocking Field Gap (전체 12 장소 기준)

| Gap | 현황 | 해소 경로 |
|---|---|---|
| identity_ko (2–3문장) | 12/12 1-sentence만 존재 (PLACE_IDENTITY_KO) | Authoring Pilot |
| companion_notes (nuanced) | 0/12 | Authoring Pilot |
| weather_notes (rain/hot/wind/cold) | 0/12 | Authoring Pilot (INFERRED 가능) |
| nighttime_char | 0/12 text | Authoring Pilot |
| local_tips | 0/12 | Authoring Pilot + Founder Local |
| admission_fee | 2/12 (sky_tower, lee_soon_shin_plaza 추정) | 공식 출처 확인 |
| nearby_places walk_minutes | 0/12 runtime | Travel Time Matrix Founder 검수 후 |
| transit_from_expo | 0/12 runtime | Travel Time Matrix + 버스 정보 확인 |

---

## Schema Reference (미적용, 설계 완료)

```sql
-- place_knowledge 테이블 (migration 미생성)
-- 주요 컬럼: place_code, identity_ko, highlights, companion_notes,
--            weather_notes, daytime_char, nighttime_char, local_tips,
--            photo_spots, seasonal_notes, nearby_places, transit_from_expo,
--            zone_co_visit, source_origin, verified_date, confidence,
--            authoring_notes
-- 상세 스키마: SOUL Place Knowledge Schema + Authoring Plan V0.1 참조
```

---

## Deployment Gate

| Action | Status |
|---|---|
| place_knowledge migration 생성 | **BLOCKED — schema Founder 최종 승인 후** |
| travel_places.category 컬럼 추가 | **BLOCKED — schema 승인 후** |
| PLACE_SUFFIX_RE `등대` 추가 (code) | **BLOCKED — 하멜등대 blocker 해소 후** |
| PLACE_ALIAS_MAP 하멜등대 추가 | **BLOCKED — 하멜등대 blocker 해소 후** |
| runtime 코드 변경 | **현재 LOCKED** |
| DB write / migration 적용 | **현재 LOCKED** |
| Production 변경 | **PROHIBITED** |
