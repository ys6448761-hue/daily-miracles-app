# RQ-CABLECAR-CONDITION-001
# Research-Horizon Decision Review V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 4ac20a3
**Status:** COMPLETE / PERSISTED

**Independent Review:** `RH-D-C — APPROVED WITH EVIDENTIARY LANGUAGE CORRECTIONS`

---

## A. Decision

**RH-D-C**

`HOLD FOLLOW-UP UNTIL NEW INDEPENDENT EVIDENCE SURFACE APPEARS`

---

## B. Decision Rationale

Repeated OA-C signals are real within the current sample. The current evidence surface cannot support a meaningful WHY-oriented follow-up.

Decisive limitations:

1. No within-stratum VISIT_TYPE variation among the analyzed Package/Group and Individual/Personal cases
2. Different decision-maker contexts must not be treated as one behavioral process
3. Source-stated explanatory conditions are insufficient in the current corpus
4. A follow-up using the same evidence would largely restate existing OA-C findings

---

## C. Gate Results

| Gate | Rating | Weight |
|---|---|---|
| RH-01 Signal Strength | **PASS** | Standard |
| RH-02 Missingness Risk | **PARTIAL** | Standard |
| RH-03 Decision-Maker Confounding | **FAIL** | HIGH |
| RH-04 Condition Availability | **FAIL** | HIGH |
| RH-05 New Information Potential | **FAIL** | HIGH |
| RH-06 Causal Restraint | **PASS** | Standard |
| RH-07 MVP Utility | **PARTIAL** | HIGH |

Special-weight gates (RH-03, RH-04, RH-05, RH-07): 3 FAIL / 1 PARTIAL

---

## D. Gate Findings

### RH-01 — Signal Strength: PASS

Primary C-2 signals are genuine repeated co-occurrences within the current sample.

| Signal | Support |
|---|---|
| P-C2-01: ONE_WAY + Package/Group | 4 independent YTC |
| P-C2-02: ROUND_TRIP + Individual/Personal | 2 independent YTC |
| S-C2-01: ONE_WAY + 오동도 successor | 2 independent YTC (SECONDARY/WEAK) |

Signal strength does not block follow-up by itself. Whether a follow-up can be answered is a separate evaluation handled by subsequent gates.

---

### RH-02 — Missingness Risk: PARTIAL

| 필드 | Coverage | Assessment |
|---|---|---|
| VISIT_TYPE | 7/10 | Workable for VISIT_TYPE × TRAVEL_TYPE |
| ONE_WAY_DIRECTION | 4/5 among ONE_WAY | Adequate for directional observation |
| PREDECESSOR | 1/4 for direction-documented overlap | Critical gap for direction condition comparison |
| SUCCESSOR | 10/10 | Complete |
| TRAVEL_TYPE | 10/10 | Complete |
| EXPLICIT_VEHICLE_CONTEXT | 2/10 | Too sparse for cross-group comparison |
| LODGING_DIRECTION | 5/10 | No repeated pattern within ONE_WAY |

VISIT_TYPE × TRAVEL_TYPE surface is workable. Condition fields for WHY analysis are severely limited. Three VISIT_TYPE MISSING cases include two Package/Group (YTC-001, 002) and one Individual (YTC-005); their VISIT_TYPE resolution is unresolvable in the current corpus.

---

### RH-03 — Decision-Maker Confounding: FAIL

Current analyzable VISIT_TYPE distribution by travel type:

| Group | ONE_WAY | ROUND_TRIP |
|---|---|---|
| Package/Group (analyzed, n=4) | 4 | 0 |
| Individual/Personal (analyzed, n=2) | 0 | 2 |

Package/Group schedules encode decisions by travel agency schedule designers and tour operators.
Individual/Personal cases encode decisions by individual travelers and companions.

These are fundamentally different decision-making contexts. With zero within-group VISIT_TYPE variation among the currently analyzable cases, no within-group condition comparison is possible. Cross-group comparison treating both as a single decision process is methodologically invalid.

Package/Group and Individual/Personal represent different decision-maker contexts. The current evidence does not document the reasons producing their visit-type differences.

---

### RH-04 — Condition Availability: FAIL

The current corpus observes a difference. It does not possess evidence capable of examining why the difference exists.

| Condition | WHY Availability |
|---|---|
| Bus repositioning / operator efficiency | HYPOTHETICAL EXPLANATORY VARIABLES — NOT EVIDENCED IN CURRENT CORPUS |
| Parking preference | 1 source-stated case only (YTC-011 "주차") — ROUND_TRIP only |
| Time pressure / schedule constraint | NOT SOURCE-STATED |
| Operator cost logic | NOT SOURCE-STATED |
| SUCCESSOR (10/10) | Records what came after — does not document decision rationale |
| VEHICLE (2/10) | ROUND_TRIP cases only; insufficient for cross-group comparison |

The current corpus is a schedule corpus — it records sequences and travel types, not decision rationale. Package tour schedules do not include operator reasoning. Individual corpus cases in this surface do not state the reason for one-way or round-trip choice explicitly.

---

### RH-05 — New Information Potential: FAIL

A follow-up using only the current evidence surface would primarily restate the existing OA-C co-occurrence finding. The descriptive separation between Package/ONE_WAY and Individual/ROUND_TRIP is already fully captured. The conditions that could differentiate further are either too sparse or already captured.

New information would require new independent evidence — not available in the current surface.

---

### RH-06 — Causal Restraint: PASS

A follow-up could technically maintain non-causal, sample-bounded framing. This gate PASS is insufficient by itself — given RH-03, RH-04, and RH-05 all FAIL, the ability to maintain causal restraint does not rescue the follow-up case.

---

### RH-07 — MVP Utility: PARTIAL

The current OA-C finding can inform future SOUL research/design by showing that visit type and travel type co-occur differently in the present corpus.

Allowed:

`The current finding can inform future SOUL research/design by showing that visit type and travel type co-occur differently in the present corpus.`

Not allowed:

* Use this finding as recommendation logic
* Infer traveler preference
* Tell SOUL to recommend ROUND_TRIP to individual travelers
* Tell SOUL to recommend ONE_WAY to groups
* Treat the Package/Individual separation as production behavior logic

`Recommendation Logic = NOT CREATED` remains frozen.

The MVP authoring queue (오동도, 향일암, 자산공원, 돌산공원) and SOUL integration represent higher-priority near-term work. A follow-up RQ would delay this without proportionate gain.

---

## E. Research Closure Status

`RQ-CABLECAR-CONDITION-001 Research Horizon: CLOSED / FOLLOW-UP HOLD`

**Closure reason:**

`Current corpus supports repeated sample-bounded descriptive co-occurrence but does not contain sufficient within-stratum variation or source-stated explanatory conditions for a meaningful WHY-oriented follow-up.`

**Preserved closure-state findings:**

| 항목 | 상태 |
|---|---|
| OA-C Verdict | CONFIRMED |
| P-C2-01: ONE_WAY + Package/Group | PRESERVED |
| P-C2-02: ROUND_TRIP + Individual/Personal | PRESERVED |
| S-C2-01: ONE_WAY + 오동도 successor | PRESERVED (SECONDARY/WEAK) |
| WHY | NOT CONCLUDED |
| Causality | NOT TESTABLE |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Recommendation Logic | NOT CREATED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

Closing this research horizon does NOT mean the signals are false. It means the current evidence surface has yielded its useful descriptive information and the current corpus cannot support the next research step.

---

## F. Reopen Conditions

The follow-up question retains potential value. Active collection is NOT authorized.

Reopen when one or more of the following conditions is met:

**RC-01**

New independent actual-trip evidence with explicit VISIT_TYPE plus relevant source-stated condition.

*(Multiple independent cases sufficient for within-stratum comparison — PROVISIONAL OPERATIONAL REOPEN THRESHOLD — NOT A VALIDATED STATISTICAL SUFFICIENCY STANDARD)*

**RC-02**

Source-stated traveler rationale for one-way/round-trip choice in individual-traveler cases — e.g., explicit written statement about direction choice, parking context, time availability, or next-destination preference.

*(Multiple independent cases with rationale — PROVISIONAL OPERATIONAL REOPEN THRESHOLD — NOT A VALIDATED STATISTICAL SUFFICIENCY STANDARD)*

**RC-03**

Operator-authored rationale for package one-way structure with verifiable provenance — e.g., tour company FAQ, booking page description, or schedule design document explaining the one-way direction logic.

**RC-04**

Materially improved vehicle/parking context coverage enabling cross-group comparison — i.e., explicit vehicle context documented for multiple additional cable-car visit cases beyond the current 2/10.

*(Multiple additional cases — PROVISIONAL OPERATIONAL REOPEN THRESHOLD — NOT A VALIDATED STATISTICAL SUFFICIENCY STANDARD)*

These reopen conditions do NOT authorize active collection. Collection would require separate Founder approval.

---

## G. Phoenix Learnings

Evidence-grounded learnings only. No Framework promotion. No Candidate.

**L-01:**
`The current schedule/itinerary corpus is effective for observing documented sequence and structural co-occurrence, but the present cases contain insufficient source-stated decision rationale for WHY analysis.`

**L-02:**
`Decision-maker provenance constrains which cases can be meaningfully compared. Package/operator contexts and individual-traveler contexts must remain stratified for explanatory research.`

**L-03:**
`Field-specific denominator discipline prevents missing cases from being silently interpreted as negative cases.`

**L-04:**
`SUCCESSOR_NODE has the strongest documentation coverage in this RQ (10/10), making it a comparatively strong descriptive sequence field; this does not by itself establish recommendation value.`

**L-05:**
`The current corpus establishes descriptive visit-type/travel-type co-occurrence only. Traveler tendency, preference, and recommendation logic remain unresolved.`

**L-06:**
`No within-stratum VISIT_TYPE variation is observed in the current analyzable sample; whether that reflects broader structure or sample composition remains unresolved.`

---

## H. Research Boundary

| 항목 | 상태 |
|---|---|
| Route Pattern | NOT CONCLUDED |
| WHY | NOT CONCLUDED |
| Causality | NOT TESTABLE |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Recommendation Logic | NOT CREATED |
| Candidate Generated | NO |
| Architecture Decision | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |
| DreamTown Founder Philosophy Candidate | HOLD |

---

*RQ-CABLECAR-CONDITION-001 Research-Horizon Decision Review V0.1 — 2026-09-26*
