# RQ-CABLECAR-CONDITION-001
# Limited Co-occurrence Analysis Review V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 4f1940e
**Status:** COMPLETE / REVIEWED / PERSISTED

---

## A. Analysis Scope

| 항목 | 값 |
|---|---|
| Research Question | 현재 corpus의 케이블카 방문 케이스에서, 방문 유형(편도/왕복) 및 편도 방향(돌산→자산/자산→돌산)의 차이와 함께 문서화된 source-stated conditions는 무엇인가? |
| Research Type | NARROW WHY-ORIENTED EXPLORATORY RQ — NON-CAUSAL |
| Evidence Surface | `docs/research/RQ_CABLECAR_CONDITION_001_SOURCE_STATED_EXTRACTION_V0_1.md` |
| Extraction Verdict | E-B (COMPLETE WITH MATERIAL MISSINGNESS) |
| Analysis Type | LIMITED CO-OCCURRENCE ONLY |
| Comparison Unit | YTC |
| Structural Variables | VISIT_TYPE + ONE_WAY_DIRECTION |
| Condition Fields | PREDECESSOR_NODE / SUCCESSOR_NODE / TRAVEL_TYPE / EXPLICIT_VEHICLE_CONTEXT / LODGING_DIRECTION |
| Eligible YTC | 10 / 10 |
| New Evidence | NOT COLLECTED |
| Causality | FORBIDDEN |
| WHY | NOT ASSESSED |

---

## B. Overall Analytical Verdict

**OA-C**

`ONE OR MORE REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNALS OBSERVED`

**Independent Review:**

`CONFIRMED WITH SIGNAL-TIER DISTINCTION`

This verdict means repeated co-occurrence exists within the current sample.

It does NOT mean:

| Prohibited interpretation | Status |
|---|---|
| Causal relationship | NOT ESTABLISHED |
| Behavioral rule | NOT ESTABLISHED |
| Preference | NOT ESTABLISHED |
| Route rule | NOT CONCLUDED |
| Recommendation | NOT CREATED |
| Travel Grammar | NOT CONCLUDED |
| Traveler State Transition | NOT CONFIRMED |

---

## C. Primary C-2 Signals

Tier: `PRIMARY C-2`

---

### P-C2-01 — `ONE_WAY + Package/Group`

| 항목 | 값 |
|---|---|
| Comparison | VISIT_TYPE × TRAVEL_TYPE |
| Signal | ONE_WAY documented alongside Package/Group |
| Supporting YTC | YTC-006, YTC-007, YTC-008, YTC-009 |
| Independent Support | **4 YTC** |
| Analyzable Denominator | 7 YTC (VISIT_TYPE documented) |
| Excluded | YTC-001, YTC-002, YTC-005 (VISIT_TYPE MISSING) |
| Classification | **C-2 — REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNAL** |

Boundary:

Package/Group and Individual/Personal represent different decision-maker contexts. Even with clean within-sample separation, this does NOT establish that travel type determines visit type.

---

### P-C2-02 — `ROUND_TRIP + Individual/Personal`

| 항목 | 값 |
|---|---|
| Comparison | VISIT_TYPE × TRAVEL_TYPE |
| Signal | ROUND_TRIP documented alongside Individual/Personal |
| Supporting YTC | YTC-011, YTC-012 |
| Independent Support | **2 YTC** |
| Analyzable Denominator | 7 YTC (same as P-C2-01) |
| Excluded | YTC-001, YTC-002, YTC-005 (VISIT_TYPE MISSING) |
| Classification | **C-2 — REPEATED SAMPLE-BOUNDED CO-OCCURRENCE SIGNAL** |

Boundary:

No Package/Group case with documented VISIT_TYPE has ROUND_TRIP. No Individual/Personal case with documented VISIT_TYPE has ONE_WAY. However, 3 cases (YTC-001 Package, YTC-002 Package, YTC-005 Individual) have VISIT_TYPE MISSING — their potential contribution is unresolvable in the current corpus.

Decision-maker preservation: Package schedule decisions and individual traveler decisions are structurally different. These signals do NOT license behavioral generalization.

---

## D. Secondary C-2 Signal

Tier: `SECONDARY C-2 / WEAK REPEATED EXACT CO-OCCURRENCE`

---

### S-C2-01 — `ONE_WAY + 오동도 as immediate SUCCESSOR_NODE`

| 항목 | 값 |
|---|---|
| Comparison | VISIT_TYPE × SUCCESSOR_NODE (cross-check) |
| Signal | ONE_WAY documented alongside 오동도 as immediate successor |
| Supporting YTC | YTC-006, YTC-008 |
| Independent Support | **2 YTC** |
| Analyzable Denominator | 7 YTC (VISIT_TYPE documented) |
| YTC-006 direction | MISSING |
| YTC-008 direction | DOLSAN_TO_JASAN |
| Other ONE_WAY successors | 버스*(MOVEMENT_EVENT)* / 돌산공원 / 광양 (3 additional ONE_WAY cases) |
| Classification | **C-2 — SECONDARY / WEAK** |

Limitations (must not be discarded):

* Total ONE_WAY cases = 5; 오동도 as successor appears in only 2/5
* This does NOT establish 오동도 as typical, required, Hub, or Gateway
* Direction-specific relationship cannot be established (YTC-006 direction MISSING)
* This does not establish a direction-specific successor relationship

Do not give this signal equal evidentiary weight to P-C2-01 / P-C2-02.

---

## E. C-1 / C-0 Findings

### E-1 — ONE_WAY_DIRECTION × SUCCESSOR_NODE

**Signal: C-1 — DESCRIPTIVE CO-OCCURRENCE ONLY**

Analyzable: 4 cases (direction documented)
Excluded: YTC-006 (direction MISSING)

DOLSAN_TO_JASAN:

| YTC | SUCCESSOR_NODE |
|---|---|
| YTC-007 | 버스*(MOVEMENT_EVENT)* |
| YTC-008 | 오동도 |

JASAN_TO_DOLSAN:

| YTC | SUCCESSOR_NODE |
|---|---|
| YTC-009 | 돌산공원 |
| YTC-013 | 광양 |

No repeated exact direction × successor combination within either direction group.
YTC-007 SUCCESSOR = `버스*(MOVEMENT_EVENT)*` preserved — NOT replaced with 오동도.

---

### E-2 — ONE_WAY_DIRECTION × PREDECESSOR_NODE

**Signal: C-0 — NO ANALYZABLE OVERLAP**

Analyzable for direction × predecessor: 1 case (YTC-013 only)

| YTC | DIRECTION | PREDECESSOR_NODE |
|---|---|---|
| YTC-007 | DOLSAN_TO_JASAN | MISSING |
| YTC-008 | DOLSAN_TO_JASAN | MISSING |
| YTC-009 | JASAN_TO_DOLSAN | MISSING |
| YTC-013 | JASAN_TO_DOLSAN | 오동도 |

DOLSAN_TO_JASAN: 0 documented predecessors.
JASAN_TO_DOLSAN: 1 documented predecessor.

`INSUFFICIENT DOCUMENTED OVERLAP FOR COMPARISON`

Single documented predecessor (YTC-013: 오동도) cannot be compared against a direction group with 0 documented predecessors.

---

### E-3 — VISIT_TYPE × EXPLICIT_VEHICLE_CONTEXT

**Signal: C-1 — DESCRIPTIVE ONLY**

| YTC | VISIT_TYPE | EXPLICIT_VEHICLE_CONTEXT |
|---|---|---|
| YTC-011 | ROUND_TRIP | 자가용 |
| YTC-012 | ROUND_TRIP | 렌터카 |

Vehicle coverage: 2/10

`EXPLICIT_VEHICLE_CONTEXT is too sparse for supported cross-group comparison in the current corpus.`

Both YTC cases with documented explicit vehicle context are ROUND_TRIP cases. Vehicle context is MISSING for 8/10 eligible YTC, including all 5 ONE_WAY cases.

`MISSING vehicle ≠ NO VEHICLE for one-way cases.`

---

### E-4 — Structural Variable × LODGING_DIRECTION

**Signal: C-1 — DESCRIPTIVE ONLY — NO COMPARATIVE SIGNAL CLAIMED**

Lodging coverage: 5/10

ONE_WAY + LODGING (analyzable n=3):

| YTC | ONE_WAY_DIRECTION | LODGING_DIRECTION |
|---|---|---|
| YTC-007 | DOLSAN_TO_JASAN | 광양 숙박 |
| YTC-008 | DOLSAN_TO_JASAN | 여수 숙박 |
| YTC-009 | JASAN_TO_DOLSAN | 돌산 숙박 |

All three analyzable ONE_WAY + LODGING cases have different lodging locations.

DOLSAN_TO_JASAN × LODGING: 광양 숙박 (YTC-007) vs 여수 숙박 (YTC-008) — different. No repeated combination.

ROUND_TRIP × LODGING: 0 analyzable cases (YTC-011, YTC-012 both LODGING MISSING).

VISIT_TYPE MISSING + LODGING documented (additional observation — NOT connected to structural variable):

| YTC | TRAVEL_TYPE | LODGING_DIRECTION |
|---|---|---|
| YTC-001 | Package/Group | 광양 숙소 |
| YTC-002 | Package/Group | 광양 숙소 |

광양 숙소 repeated in 2 VISIT_TYPE-MISSING Package cases. Since VISIT_TYPE is MISSING, this cannot be placed into any structural group.

Canonical reminder: `YTC-013: 광양 ≠ 광양 숙박` — successor destination ≠ lodging evidence.

---

## F. Missingness / Denominator Audit

| Analysis | Eligible | Analyzable | Excluded (missing) | Denominator Reported |
|---|---|---|---|---|
| VISIT_TYPE × TRAVEL_TYPE | 10 | 7 | 3 (YTC-001,002,005) | PASS |
| Direction × SUCCESSOR | 5 ONE_WAY | 4 | 1 (YTC-006 direction MISSING) | PASS |
| Direction × PREDECESSOR | 4 direction-documented | 1 | 3 (predecessor MISSING) | PASS |
| VISIT_TYPE × VEHICLE | 10 | 2 (vehicle documented) | 8 | PASS |
| ONE_WAY × LODGING | 5 ONE_WAY | 3 | 2 (lodging MISSING) | PASS |
| VISIT_TYPE × SUCCESSOR (cross-check) | 10 | 7 (VISIT_TYPE documented) | 3 | PASS |

**Frozen Rules:**

`FIELD-SPECIFIC DENOMINATOR REQUIRED`

`MISSING ≠ NEGATIVE`

| MISSING 항목 | 의미하지 않는 것 |
|---|---|
| EXPLICIT_VEHICLE_CONTEXT missing | NO VEHICLE |
| LODGING_DIRECTION missing | NO LODGING |
| PREDECESSOR_NODE missing | JOURNEY STARTED AT BOARDING STATION |
| VISIT_TYPE missing | ONE_WAY or ROUND_TRIP |

---

## G. Evidence-Supported Statements

Within the current 10 eligible YTC corpus only:

1. ONE_WAY is documented alongside Package/Group in 4 independent cases (7 analyzable denominator; 3 excluded for VISIT_TYPE MISSING). — P-C2-01
2. ROUND_TRIP is documented alongside Individual/Personal in 2 independent cases (7 analyzable denominator). — P-C2-02
3. ONE_WAY is documented alongside 오동도 as immediate successor in 2 independent cases (YTC-006, YTC-008) — S-C2-01; 3 other ONE_WAY cases have different successors.
4. EXPLICIT_VEHICLE_CONTEXT is documented in 2 ROUND_TRIP cases only (자가용, 렌터카); vehicle context is undocumented for all ONE_WAY cases in this corpus.
5. DOLSAN_TO_JASAN and JASAN_TO_DOLSAN each appear in 2 analyzable cases; their immediate successors differ within each direction group.
6. Lodging directions among analyzable ONE_WAY cases (n=3) are all different: 광양 숙박 / 여수 숙박 / 돌산 숙박.
7. 3 YTC (YTC-001 Package, YTC-002 Package, YTC-005 Individual) have VISIT_TYPE MISSING — their conditions cannot be placed into any structural group.

---

## H. Prohibited Interpretations

| Prohibited claim | Why prohibited |
|---|---|
| Travel type determines visit type | Causal claim; C-2 = co-occurrence only; MISSING cases unresolved |
| Package travelers prefer one-way | Behavioral generalization; decision-maker difference |
| Individual travelers prefer round-trip | Behavioral generalization; decision-maker difference |
| 오동도 is typical / required successor for ONE_WAY | Only 2/7 ONE_WAY cases; 3 have different successors |
| DOLSAN_TO_JASAN leads to 오동도 | Only 1/2 DOLSAN_TO_JASAN has 오동도 as immediate successor |
| Round-trip travelers use cars | Vehicle too sparse; MISSING ≠ NO VEHICLE |
| Any direction is better / optimal / efficient | Value judgment; WHY not assessed |
| 오동도 is Hub or Gateway | Explicitly forbidden |
| Route Pattern confirmed | NOT CONCLUDED |
| Journey Grammar established | NOT CONCLUDED |
| WHY the variation occurs | NOT ASSESSED by this RQ |
| because / caused by / determines / influences | Causal language — FORBIDDEN |
| This explains why... | WHY RQ not opened |

---

## I. Research Pivot Observation

Record as observation only — NOT a new finding, NOT a Candidate:

`Within the current evidence surface, repeated co-occurrence is more visible in VISIT_TYPE × TRAVEL_TYPE than in ONE_WAY_DIRECTION × the frozen condition fields.`

This is a comparison of current evidence strength.

Allowed interpretation:

`The current corpus provides a stronger descriptive surface for visit type × travel type than for direction-specific condition comparison.`

This must NOT be rewritten as:

* travel type is the real cause
* direction is irrelevant
* package structure determines one-way
* individual structure determines round-trip

---

## J. WHY Boundary

`WHY = NOT CONCLUDED`

`CAUSALITY = NOT TESTABLE IN CURRENT RQ`

No WHY claim has been established.

---

## K. Research-Horizon Status

| 항목 | 상태 |
|---|---|
| RQ-CABLECAR-CONDITION-001 Source-Stated Extraction | COMPLETE / PERSISTED |
| Limited Co-occurrence Analysis | **COMPLETE / REVIEWED / PERSISTED** |
| Research Horizon Decision | **PENDING** |
| New RQ | NOT REGISTERED |
| WHY Protocol | NOT CREATED |

---

## L. Research-Horizon Decision Question

> `Do the current repeated sample-bounded co-occurrence signals justify opening one narrowly scoped follow-up research question, or should RQ-CABLECAR-CONDITION-001 close at descriptive findings given current corpus limitations?`

**Option A:** `CLOSE CURRENT RQ AT DESCRIPTIVE FINDINGS`

**Option B:** `OPEN ONE NARROW FOLLOW-UP RQ`

No preferred option is decided here.

---

## M. Research-Horizon Decision Review Framework (RH-01 ~ RH-07)

The next Research-Horizon Decision Review must assess:

| Gate | Question |
|---|---|
| RH-01 Signal Strength | Are Primary C-2 signals sufficiently repeated and independent? |
| RH-02 Missingness Risk | Would missing VISIT_TYPE / vehicle / lodging materially undermine further research? |
| RH-03 Decision-Maker Confounding | Can Package operator decisions and Individual traveler decisions be compared without falsely treating them as the same decision process? |
| RH-04 Condition Availability | Does the existing corpus contain enough source-stated conditions to investigate WHY without filling gaps? |
| RH-05 New Information Potential | Could a narrow follow-up RQ produce information not already contained in the descriptive co-occurrence result? |
| RH-06 Causal Restraint | Can a follow-up remain exploratory/non-causal? |
| RH-07 MVP Utility | Would resolving the question materially improve future SOUL contextual judgment, rather than merely deepen academic description? |

These gates are NOT scored in this document.

---

## N. Signal Classification Summary

| Analysis | Comparison | Signal | Supporting YTC | Denominator |
|---|---|---|---|---|
| A | ONE_WAY + Package/Group | **P-C2-01** | YTC-006, 007, 008, 009 | 7/10 |
| A | ROUND_TRIP + Individual/Personal | **P-C2-02** | YTC-011, 012 | 7/10 |
| A | ONE_WAY + Regional-linked | C-1 | YTC-013 | 7/10 |
| B | Direction × SUCCESSOR | C-1 | 4 cases | 4/5 |
| C | Direction × PREDECESSOR | **C-0** | — | 1/4 overlap |
| D | VISIT_TYPE × VEHICLE | C-1 | YTC-011, 012 (descriptive) | 2/10 |
| E | Structural × LODGING | C-1 | 3 analyzable | 3/5 lodging-documented ONE_WAY |
| Cross-check | ONE_WAY + 오동도 | **S-C2-01** | YTC-006, 008 | 7/10 |

---

## O. Research Boundary

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

*RQ-CABLECAR-CONDITION-001 Limited Co-occurrence Analysis Review V0.1 — 2026-09-26*
