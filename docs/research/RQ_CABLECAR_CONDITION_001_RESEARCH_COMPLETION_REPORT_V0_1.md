# RQ-CABLECAR-CONDITION-001
# Research Completion Report V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Final Checkpoint:** 8d94ac6
**Status:** RESEARCH COMPLETE / HORIZON CLOSED / FOLLOW-UP HOLD

---

## A. Purpose

This document serves as a handover-ready summary of the complete RQ-CABLECAR-CONDITION-001 research lifecycle. A future Lumi, developer, or researcher reading only this report should understand:

1. Why this RQ was opened
2. What evidence was examined
3. What was actually found
4. What was not established
5. Why the research was closed
6. Under what conditions it may reopen
7. What Phoenix learned
8. Where the project continues next

This is a completion/handover document. It is NOT a new evidence source. It does not add conclusions beyond what is already persisted in the referenced artifacts.

---

## B. Research Origin

**Parent RQ:** `RQ-SEQUENCE-001 — Journey Sequence Evidence Surface`

RQ-SEQUENCE-001 examined the 14-YTC corpus for repeated exact adjacencies and multi-step sequences. It found sample-bounded structural variation around cable-car use, including:

- ONE_WAY / ROUND_TRIP visit-type variation
- DOLSAN_TO_JASAN / JASAN_TO_DOLSAN directional variation
- Repeated exact 3-node sequence: `자산탑승장 → 케이블카 편도 → 돌산탑승장` (2 independent YTC)

Post-pattern Decision B determined: structural variation was established, but WHY had not been assessed. A narrow non-causal exploratory RQ was opened.

**Research Question:**

> 현재 corpus의 케이블카 방문 케이스에서, 방문 유형(편도/왕복) 및 편도 방향(돌산→자산/자산→돌산)의 차이와 함께 문서화된 source-stated conditions는 무엇인가?

**Research Type:** NARROW WHY-ORIENTED EXPLORATORY RQ — NON-CAUSAL

The RQ was intentionally non-causal from registration. It tested documented co-occurrence, not causation.

---

## C. Evidence Surface

**Eligible YTC:** YTC-001, YTC-002, YTC-005, YTC-006, YTC-007, YTC-008, YTC-009, YTC-011, YTC-012, YTC-013

**Total:** 10 YTC (all eligible)

**Independent comparison unit:** YTC

**Structural variables (2):**

| Variable | Values |
|---|---|
| VISIT_TYPE | ONE_WAY / ROUND_TRIP / MISSING |
| ONE_WAY_DIRECTION | DOLSAN_TO_JASAN / JASAN_TO_DOLSAN / MISSING / NOT_APPLICABLE |

**Condition fields (5 frozen):**

| Field | Values |
|---|---|
| PREDECESSOR_NODE | source-stated node immediately before cable-car activity |
| SUCCESSOR_NODE | source-stated node immediately after cable-car activity |
| TRAVEL_TYPE | Package/Group / Individual/Personal / Regional-linked |
| EXPLICIT_VEHICLE_CONTEXT | source-stated vehicle only |
| LODGING_DIRECTION | explicit lodging location only |

No additional condition fields were authorized or introduced.

---

## D. Extraction Result

**Verdict:** `E-B — EXTRACTION COMPLETE WITH MATERIAL MISSINGNESS`

**Integrity Review:** `PASS WITH MATERIAL MISSINGNESS`

**Field Coverage:**

| Field | Coverage | Material Missingness |
|---|---|---|
| VISIT_TYPE | 7/10 | — |
| ONE_WAY_DIRECTION | 4/5 among ONE_WAY | — |
| PREDECESSOR_NODE | 6/10 | 40% missing |
| SUCCESSOR_NODE | 10/10 | — |
| TRAVEL_TYPE | 10/10 | — |
| EXPLICIT_VEHICLE_CONTEXT | 2/10 | **80% missing** |
| LODGING_DIRECTION | 5/10 | **50% missing** |

**Frozen rules:**

`FIELD-SPECIFIC DENOMINATOR REQUIRED`

`MISSING ≠ NEGATIVE`

EXPLICIT_VEHICLE_CONTEXT was too sparse for supported cross-group comparison. The two documented vehicle cases (YTC-011: 자가용, YTC-012: 렌터카) are both ROUND_TRIP. Vehicle context is missing for all ONE_WAY cases. Absence of documentation ≠ absence of vehicle.

**Key per-YTC values (persisted, not re-extracted):**

| YTC | VISIT_TYPE | ONE_WAY_DIRECTION | TRAVEL_TYPE |
|---|---|---|---|
| 001 | MISSING | MISSING | Package/Group |
| 002 | MISSING | MISSING | Package/Group |
| 005 | MISSING | MISSING | Individual/Personal |
| 006 | ONE_WAY | MISSING | Package/Group |
| 007 | ONE_WAY | DOLSAN_TO_JASAN | Package/Group |
| 008 | ONE_WAY | DOLSAN_TO_JASAN | Package/Group |
| 009 | ONE_WAY | JASAN_TO_DOLSAN | Package/Group |
| 011 | ROUND_TRIP | N/A | Individual/Personal |
| 012 | ROUND_TRIP | N/A | Individual/Personal |
| 013 | ONE_WAY | JASAN_TO_DOLSAN | Regional-linked |

*Full extraction matrix:* `docs/research/RQ_CABLECAR_CONDITION_001_SOURCE_STATED_EXTRACTION_V0_1.md`

---

## E. Limited Co-occurrence Result

**Overall Verdict:** `OA-C — ONE OR MORE REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNALS OBSERVED`

**Independent Review:** `CONFIRMED WITH SIGNAL-TIER DISTINCTION`

### Primary C-2 Signals

**P-C2-01:** `ONE_WAY + Package/Group`

Supporting YTC: 006, 007, 008, 009 (4 independent YTC)
Analyzable denominator: 7/10 (3 excluded: VISIT_TYPE MISSING)
Classification: C-2 — REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNAL

**P-C2-02:** `ROUND_TRIP + Individual/Personal`

Supporting YTC: 011, 012 (2 independent YTC)
Analyzable denominator: 7/10 (same)
Classification: C-2 — REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNAL

Boundary: Package/Group and Individual/Personal represent different decision-maker contexts. Even with clean within-sample separation, this does NOT establish that travel type determines visit type.

### Secondary C-2 Signal

**S-C2-01:** `ONE_WAY + 오동도 as immediate SUCCESSOR_NODE`

Supporting YTC: 006 (direction MISSING), 008 (DOLSAN_TO_JASAN) (2 independent YTC)
Classification: **SECONDARY / WEAK REPEATED EXACT CO-OCCURRENCE**

Limitations: 3 other ONE_WAY cases have different successors; direction-specific relationship cannot be established; 오동도 is NOT a Hub, Gateway, or required successor.

Secondary C-2 does not carry equal evidentiary weight to Primary C-2.

### C-1 / C-0 Findings

| Comparison | Signal | Notes |
|---|---|---|
| Direction × SUCCESSOR | C-1 | All direction-successor pairs unique within each direction group |
| Direction × PREDECESSOR | C-0 | Insufficient documented overlap (1/4 cases analyzable) |
| VISIT_TYPE × VEHICLE | C-1 | 2/10 vehicle; too sparse for cross-group comparison |
| Structural × LODGING | C-1 | All analyzable lodging combinations unique |

Special preserved values:
- `YTC-007 SUCCESSOR = 버스*(MOVEMENT_EVENT)*` — not replaced with 오동도
- `YTC-013 광양 ≠ 광양 숙박` — successor destination ≠ lodging evidence

*Full co-occurrence analysis:* `docs/research/RQ_CABLECAR_CONDITION_001_LIMITED_COOCCURRENCE_REVIEW_V0_1.md`

---

## F. What Was Established

Within the current 10 eligible YTC, persisted extraction, and analyzed denominators only:

1. Repeated sample-bounded co-occurrence exists in the current corpus (OA-C)
2. ONE_WAY is documented alongside Package/Group in 4 independent analyzable YTC (7/10 denominator)
3. ROUND_TRIP is documented alongside Individual/Personal in 2 independent analyzable YTC (7/10 denominator)
4. ONE_WAY + 오동도 immediate successor repeats in 2 independent YTC — secondary/weak signal
5. The current corpus provides a stronger descriptive surface for VISIT_TYPE × TRAVEL_TYPE than for direction-specific condition comparison
6. SUCCESSOR_NODE has complete documentation coverage in this RQ (10/10)

---

## G. What Was NOT Established

| Item | Status |
|---|---|
| WHY the visit-type variation exists | NOT CONCLUDED |
| Causality | NOT TESTABLE in this RQ |
| Traveler preference | NOT ESTABLISHED |
| Operator intent or logic | NOT ESTABLISHED |
| Travel type determining visit type | NOT ESTABLISHED |
| Vehicle determining ROUND_TRIP | NOT ESTABLISHED |
| Next destination determining direction | NOT ESTABLISHED |
| Optimal cable-car direction | NOT ESTABLISHED |
| Route Pattern | NOT CONCLUDED |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Recommendation Logic | NOT CREATED |
| 오동도 as Hub or Gateway | NOT CONCLUDED |

---

## H. Research-Horizon Decision

**Decision:** `RH-D-C — HOLD FOLLOW-UP UNTIL NEW INDEPENDENT EVIDENCE SURFACE APPEARS`

**Independent Review:** `APPROVED WITH EVIDENTIARY LANGUAGE CORRECTIONS`

| Gate | Rating | Weight |
|---|---|---|
| RH-01 Signal Strength | PASS | Standard |
| RH-02 Missingness Risk | PARTIAL | Standard |
| RH-03 Decision-Maker Confounding | **FAIL** | HIGH / decisive |
| RH-04 Condition Availability | **FAIL** | HIGH / decisive |
| RH-05 New Information Potential | **FAIL** | HIGH / decisive |
| RH-06 Causal Restraint | PASS | Standard |
| RH-07 MVP Utility | PARTIAL | HIGH |

*Full gate analysis:* `docs/research/RQ_CABLECAR_CONDITION_001_RESEARCH_HORIZON_DECISION_V0_1.md`

---

## I. Why Research Closed

The research closed because:

1. The descriptive co-occurrence signals were established (OA-C)
2. Package/Group and Individual/Personal represent different decision-maker contexts that cannot be treated as one behavioral process
3. No within-stratum VISIT_TYPE variation was observed in the current analyzable sample — without within-group variation, within-group condition comparison is impossible
4. Source-stated explanatory conditions were insufficient — the corpus records sequences, not decision rationale
5. Further analysis using the same corpus would largely restate existing OA-C findings rather than produce materially new information

`RQ-CABLECAR-CONDITION-001 Research Horizon: CLOSED / FOLLOW-UP HOLD`

Closing does NOT mean the signals are false. It means the current evidence surface has yielded its useful descriptive information.

---

## J. Reopen Conditions

The follow-up question retains potential value. No active collection is authorized.

**RC-01:** New independent actual-trip evidence with explicit VISIT_TYPE and relevant source-stated condition — multiple independent cases sufficient for within-stratum comparison *(PROVISIONAL OPERATIONAL REOPEN THRESHOLD — NOT A VALIDATED STATISTICAL SUFFICIENCY STANDARD)*

**RC-02:** Source-stated traveler rationale for one-way/round-trip choice in individual-traveler cases — multiple independent cases with explicit rationale *(PROVISIONAL OPERATIONAL REOPEN THRESHOLD — NOT A VALIDATED STATISTICAL SUFFICIENCY STANDARD)*

**RC-03:** Operator-authored rationale for package one-way/route structure with verifiable provenance

**RC-04:** Materially improved vehicle/parking context coverage sufficient for cross-group comparison *(PROVISIONAL OPERATIONAL REOPEN THRESHOLD — NOT A VALIDATED STATISTICAL SUFFICIENCY STANDARD)*

Reopen requires Founder approval. These conditions do not automatically authorize collection.

---

## K. Phoenix Learnings

Evidence-grounded only. No Framework promotion. No Candidate.

**L-01:** The current schedule/itinerary corpus is effective for observing documented sequence and structural co-occurrence, but the present cases contain insufficient source-stated decision rationale for WHY analysis.

**L-02:** Decision-maker provenance constrains which cases can be meaningfully compared. Package/operator contexts and individual-traveler contexts must remain stratified for explanatory research.

**L-03:** Field-specific denominator discipline prevents missing cases from being silently interpreted as negative cases.

**L-04:** SUCCESSOR_NODE has the strongest documentation coverage in this RQ (10/10), making it a comparatively strong descriptive sequence field; this does not by itself establish recommendation value.

**L-05:** The current corpus establishes descriptive visit-type/travel-type co-occurrence only. Traveler tendency, preference, and recommendation logic remain unresolved.

**L-06:** No within-stratum VISIT_TYPE variation is observed in the current analyzable sample; whether that reflects broader structure or sample composition remains unresolved.

---

## L. Evidence Lineage

| Document | Role |
|---|---|
| `docs/research/RQ_SEQUENCE_001_POST_PATTERN_RESEARCH_DECISION_V0_1.md` | Parent RQ closure + RQ-CABLECAR-CONDITION-001 registration origin |
| `docs/research/RQ_CABLECAR_CONDITION_001_PROTOCOL_V0_1.md` | Frozen protocol (comparison unit, variables, condition fields, provenance rules) |
| `docs/research/RQ_CABLECAR_CONDITION_001_SOURCE_STATED_EXTRACTION_V0_1.md` | Full 10-row extraction matrix + provenance + coverage + missingness |
| `docs/research/RQ_CABLECAR_CONDITION_001_LIMITED_COOCCURRENCE_REVIEW_V0_1.md` | OA-C verdict + signal classification + missingness audit |
| `docs/research/RQ_CABLECAR_CONDITION_001_RESEARCH_HORIZON_DECISION_V0_1.md` | RH-D-C + RH-01~07 gate results + reopen conditions + Phoenix learnings |
| `docs/architecture/SOUL_PLACE_KNOWLEDGE_AUTHORING_STATE_2026_09_24.md` | Project State — current next action |

---

## M. Governance

| 항목 | 상태 |
|---|---|
| Candidate Generated | NO |
| Architecture Changed | NO |
| SSOT Promotion | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |
| DreamTown Founder Philosophy Candidate | HOLD |

---

## N. Where the Project Continues

`Current Next Action:`

`Return from RQ-CABLECAR-CONDITION-001 research to the highest-priority SOUL Travel Intelligence MVP work using the now-closed research findings as bounded evidence, without opening a new WHY RQ.`

The research findings (OA-C, P-C2-01, P-C2-02) are available as bounded evidence for future SOUL design work. They are descriptive observations — not recommendation rules.

---

*RQ-CABLECAR-CONDITION-001 Research Completion Report V0.1 — 2026-09-26*
