# RQ-CABLECAR-CONDITION-001
# Cable-Car Visit Condition Co-occurrence — Protocol V0.1

**Date:** 2026-09-26
**Branch:** staging/storybook-c7a
**Registered At:** 3278e11
**Status:** REGISTERED / NOT YET EXECUTED

---

## A. Research Question

**Korean:**

> 현재 corpus의 케이블카 방문 케이스에서, 방문 유형(편도/왕복) 및 편도 방향(돌산→자산/자산→돌산)의 차이와 함께 문서화된 source-stated conditions는 무엇인가?

**English working form:**

> Among cable-car visit cases in the current corpus, which source-stated conditions are documented alongside differences in visit type (one-way vs round-trip) and one-way direction (Dolsan→Jasan vs Jasan→Dolsan)?

**Research Type:** NARROW WHY-ORIENTED EXPLORATORY RQ — NON-CAUSAL

`alongside / 함께 문서화된` must NOT be replaced with causal wording.

---

## B. Origin

Opened by Decision B of RQ-SEQUENCE-001 Post-Pattern Research Decision.

Reference: `docs/research/RQ_SEQUENCE_001_POST_PATTERN_RESEARCH_DECISION_V0_1.md`

Parent research: RQ-SEQUENCE-001 Verdict C (COMPLETE / PERSISTED)

---

## C. Authorized Evidence Scope

**Authoritative corpus for extraction:**

| Source | File |
|---|---|
| First Sample (YTC-001~006) | `docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_FIRST_SAMPLE_V0_1.md` |
| Second Sample (YTC-007~014) | `docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_SECOND_SAMPLE_V0_1.md` |
| SEU Ledger | `docs/research/RQ_SEQUENCE_001_PROTOCOL_AND_SCREENING_LEDGER_V0_1.md` |

**Additional authorized inputs (provenance separate):**

| Source | Scope |
|---|---|
| Plan-Change research | Demonstrates condition-sensitive choice is corpus-documentable — NOT cable-car specific |
| Cross-Corpus Review V0.2.1 | Lodging direction per YTC |
| Transport research | Transport mode per YTC where source-stated |

**Forbidden inputs:**

| Source | Status |
|---|---|
| External web sources | FORBIDDEN |
| DIR-01~05 (prior directionality) | EXCLUDED — SOURCE_NOT_REPRODUCIBLE |
| Founder rationale | May NOT be inserted as corpus case evidence |
| World Experience reviews | May NOT be used as case evidence |
| Geographic / map inference | FORBIDDEN |

---

## D. Comparison Unit

`YTC` = independent comparison unit

`SEU ≠ independent case count`

SEU may provide adjacency structure within a YTC but does not constitute a separate case.

---

## E. Allowed Structural Variables

### Visit Type

| Value | Definition |
|---|---|
| `ONE_WAY` | 케이블카 편도 — 출발과 도착 탑승장이 다름 |
| `ROUND_TRIP` | 케이블카 왕복 — 출발 탑승장으로 귀환 |
| `MISSING / NOT_DOCUMENTED` | Source에서 확인 불가 |

### One-Way Direction

| Value | Definition |
|---|---|
| `DOLSAN_TO_JASAN` | 돌산 탑승장 출발 → 자산 탑승장 도착 |
| `JASAN_TO_DOLSAN` | 자산 탑승장 출발 → 돌산 탑승장 도착 |
| `MISSING / NOT_DOCUMENTED` | Source에서 확인 불가 |

Direction must be established by source-stated sequence, not geographic inference.

---

## F. Allowed Condition Fields

Exactly 5 fields. No additional fields may be introduced without a separate review.

### Field 1: PREDECESSOR_NODE

Source-stated node immediately before cable-car activity in the documented sequence.

If no source-stated predecessor: `MISSING / NOT_DOCUMENTED`

### Field 2: SUCCESSOR_NODE

Source-stated node immediately after cable-car activity in the documented sequence.

If no source-stated successor: `MISSING / NOT_DOCUMENTED`

### Field 3: TRAVEL_TYPE

Travel party/mode classification from corpus source-type label.

Values: Package/Group Tour / Individual/Personal / Regional-linked / Unknown

### Field 4: EXPLICIT_VEHICLE_CONTEXT

Vehicle or transport mode explicitly stated in the source for the cable car visit context.

**Critical rule:**

`bus/transit implied` or `bus assumed` does NOT qualify.

Only explicitly source-stated vehicle information qualifies.

If not explicitly stated: `MISSING / NOT_DOCUMENTED`

Examples that qualify: "돌산탑승장 주차" (YTC-011), "렌터카" (YTC-012), "버스*(MOVEMENT_EVENT)*" (YTC-007 within SEU)

Examples that do NOT qualify: inferred bus from package type, geographic assumption

### Field 5: LODGING_DIRECTION

Lodging location explicitly stated in the same trip context.

Values: 광양 / 여수 / 돌산 / 순천 / 기타 / MISSING / NOT_DOCUMENTED

If lodging not source-stated for the relevant trip context: `MISSING / NOT_DOCUMENTED`

---

## G. Explicitly Excluded Conditions

The following conditions are outside the current evidence surface.

Do NOT infer or create:

| Condition | Status |
|---|---|
| Time pressure | MISSING / OUT OF EVIDENCE SURFACE |
| Weather | MISSING / OUT OF EVIDENCE SURFACE |
| Fatigue / energy | MISSING / OUT OF EVIDENCE SURFACE |
| Waiting time / queue | MISSING / OUT OF EVIDENCE SURFACE |
| Traveler emotion | MISSING / OUT OF EVIDENCE SURFACE |
| Traveler preference | MISSING / OUT OF EVIDENCE SURFACE |
| Traveler motivation | MISSING / OUT OF EVIDENCE SURFACE |
| Operator intent | MISSING / OUT OF EVIDENCE SURFACE |
| Parking difficulty (unless source-stated) | MISSING / OUT OF EVIDENCE SURFACE |
| Convenience / efficiency | MISSING / OUT OF EVIDENCE SURFACE |

---

## H. Provenance Rule

Every populated condition field must be:

`SOURCE-STATED`

or already preserved in a persisted corpus record with explicit provenance.

**Forbidden entry methods:**

| Method | Status |
|---|---|
| Inferred transport | FORBIDDEN |
| Inferred vehicle | FORBIDDEN |
| Inferred lodging direction | FORBIDDEN |
| Inferred traveler intent | FORBIDDEN |
| Geographic inference | FORBIDDEN |
| Map inference | FORBIDDEN |
| Semantic completion | FORBIDDEN |
| Founder assumption inserted as corpus fact | FORBIDDEN |
| World Experience as case evidence | FORBIDDEN |

---

## I. Missing-Data Rule

Missing data remains missing.

`Absence of evidence ≠ Evidence of absence`

Use explicit labels: `MISSING` / `NOT_DOCUMENTED` / `NOT_APPLICABLE`

Do not fill blanks.

---

## J. Evidence Pool Separation

| Pool | Role in This RQ |
|---|---|
| Sequence Evidence (RQ-SEQUENCE-001) | Documents cable-car visit structure and predecessor/successor |
| Plan-Change Evidence | Demonstrates condition-sensitive choice is corpus-documentable — does NOT explain cable-car structure |
| Founder Field Evidence | Provides separate local context — does NOT automatically explain corpus cases |
| Travel Agency Schedule | Documents operator sequence — ≠ traveler behavior |

These pools must NOT be merged as if they have identical provenance.

---

## K. No-Causality Rule

This RQ may test only:

`co-occurrence / documented alongside`

**Prohibited conclusions:**

| Prohibited statement | Why |
|---|---|
| X caused Y | causal claim |
| Travelers chose X because of Y | preference/causality |
| Vehicle determines visit type | causal claim |
| Next destination determines direction | causal claim |
| Package travelers prefer one-way | generalization of behavior |
| Individual travelers prefer round-trip | generalization of behavior |
| One direction is more efficient | optimization claim |
| One direction is better | value judgment |
| One direction should be recommended | recommendation logic |

Small-N alignment remains:

`SAMPLE-BOUNDED CO-OCCURRENCE`

unless separately justified by later research.

---

## L. Global Guardrails

`SEU frequency ≠ independent-case frequency`

`Travel-agency sequence ≠ Traveler behavior`

`SEGMENT_ONLY evidence ≠ full-itinerary evidence`

`MOVEMENT_EVENT ≠ PLACE_NODE`

`Repeated adjacency ≠ Route Pattern`

`Documented order ≠ Preferred order`

---

## M. Readiness Evidence (For RQ Opening — NOT Findings)

The following observations provide rationale for opening this RQ.
They are NOT findings of RQ-CABLECAR-CONDITION-001.

| Observation | Source |
|---|---|
| One-way directional variation observed | V-01, RQ-SEQUENCE-001 Pattern Review |
| One-way vs round-trip variation observed | SEU ledger structural analysis |
| Partial source-stated vehicle context available | YTC-011, 012, 007 |
| Predecessor/successor information available | SEU ledger |
| Travel-type information available | corpus source-type labels |
| Partial lodging-direction information | cross-corpus review |

Do NOT persist these as RQ-CABLECAR-CONDITION-001 conclusions.

---

## N. Governance

| 항목 | 상태 |
|---|---|
| Candidate Generated | NO |
| SSOT Promoted | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |
| DreamTown Founder Philosophy Candidate | HOLD |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |

---

## O. Execution Gate

This document registers the RQ and freezes its protocol.

Execution is authorized when:

1. This protocol is persisted in the repository
2. Founder/Lumi confirms execution readiness
3. No conflicting evidence surface review is in progress

Current status: `REGISTERED / NOT YET EXECUTED`

---

*RQ-CABLECAR-CONDITION-001 Protocol V0.1 — 2026-09-26*
