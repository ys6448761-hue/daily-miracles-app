# SOUL Yeosu Prepared Knowledge
# 3-Place Pilot Protocol V0.1

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 0fe8052
**Status:** PROTOCOL DESIGN — NOT YET EXECUTED

**Research Handover basis:**
`docs/research/SOUL_YEOSU_PREPARED_TRAVEL_KNOWLEDGE_RESEARCH_HANDOVER_V0_1.md`

This document defines the research protocol only.
No actual Yeosu knowledge is collected here.
No pilot is executed.
No A/B scoring is produced.
No Candidate is created.

---

## A. Purpose

This protocol defines how to compare two knowledge preparation models for SOUL under identical evidence and context conditions.

**Primary Research Question:**

> "지역 여행전문가 수준의 답변을 유지하면서, Phoenix가 어디까지 지식을 사전 준비하고 어디부터 런타임에 조립하는 것이 가장 효율적인가?"

**Working variable:** `Preparation Boundary`

Preparation Boundary is the research variable observed in this pilot. It is not a Framework, Candidate, or Architecture Decision.

---

## B. Research Questions

**Q1.** Prepared Knowledge만으로 충분한 질문은 무엇인가?

**Q2.** Prepared Context / Expert Anticipation이 실제 추가 가치를 만드는 상황은 무엇인가?

**Q3.** 실패가 Evidence / Preparation / Routing / Context / Verification / Judgment / Expression 중 어디에서 발생하는지 추적 가능한가?

---

## C. Non-Goals

This pilot does NOT:
- Determine the "best" universal architecture
- Validate a Phoenix Method
- Generalize to all Yeosu travel or all SOUL scenarios
- Test traveler preference (that is the Blind MVP)
- Establish causal model superiority
- Confirm production readiness
- Replace or modify the Blind MVP Test design

Human preference testing remains in the Blind MVP Test track (currently ON HOLD).
This pilot is a research feasibility / architecture-learning study.

---

## D. Models Under Comparison

### Model A — Prepared Knowledge

```
Question/Event occurs
→ Interpret current context
→ Retrieve relevant prepared knowledge
→ Assemble required knowledge
→ Determine VERIFY / ASK
→ Judgment
→ SOUL response
```

Knowledge is organized as retrievable units indexed to place, relationship, situation.
Assembly happens at runtime after the question arrives.

### Model B — Prepared Context / Expert Anticipation

```
Traveler State forms or changes
→ Activate relevant prepared context
→ Prepare decision ingredients (NOT final answers)
→ Question/Event occurs
→ Match against prepared context
→ Minimal adjustment
→ Required Live Verify / ASK only
→ Judgment
→ SOUL response
```

Knowledge is organized as pre-activated context blocks keyed to traveler state and anticipated situation. Assembly burden shifts to pre-runtime.

### Experimental Fairness Rule

Both models operate on:

```
SAME EVIDENCE POOL
SAME USER CONTEXT
SAME AVAILABLE FACTS
```

The difference is:
- **preparation timing** (pre-runtime vs. at-runtime)
- **knowledge organization** (retrieval units vs. context blocks)
- **runtime assembly burden** (assembled fresh vs. pre-activated)

The difference is NOT:
- information quantity (Model B cannot have more facts)
- evidence quality (neither model receives hidden superior evidence)
- test answer pre-knowledge (Model B cannot know the test questions in advance)

---

## E. Anti-Cheating Rule

Model B activates context before a question arrives. This creates a leakage risk.

**B may pre-activate:**
- Traveler state signals (companion type, vehicle, mobility constraints)
- Relevant place knowledge units
- Possible friction/conditions for each place
- Evidence availability and confidence levels
- Live trigger categories for each place
- Knowledge boundary markers (what requires verification)
- Likely information need patterns per traveler state

**B may NOT pre-prepare:**
- Final recommendations
- Best-place conclusions
- Pre-written test answers
- Unsupported preference rankings
- Causal conclusions
- Traveler-specific final judgments keyed to test questions

**Governing principle:**

```
PREPARE DECISION INGREDIENTS, NOT THE FINAL ANSWER.
```

**Leakage detection:** After protocol approval and before execution, a scenario freeze is applied. Any Model B preparation element that appears to directly encode a test scenario answer is flagged as LEAKAGE and removed from Model B context before comparison.

---

## F. 3-Place Pilot Scope

| # | Place | place_code |
|---|---|---|
| 1 | 오동도 | odongdo |
| 2 | 향일암 | hyangiram |
| 3 | 여수해상케이블카 | cablecar |

Cable Car has existing foundational knowledge assets from prior authoring work.
Odongdo and Hyangiram are queued.

**Scope interpretation:**
These 3 places are research fixtures. They do not represent Yeosu-wide priority ranking. Pilot findings cannot be generalized to all Yeosu places or all SOUL scenarios without further study.

---

## G. Core Scenario Design Matrix

9 Core Scenarios. **No actual Yeosu answers or facts are filled in this document.**

Each scenario is defined by design metadata only.

---

### O-1 — Odongdo / Basic

| Field | Value |
|---|---|
| Scenario ID | O-1 |
| Place | 오동도 |
| Question | "오동도는 뭐가 좋아?" |
| Interaction Type | Single-turn |
| Intended Difficulty | Low |
| **Desired Answer Properties** | Experiential description / place character / honest scope / no fabrication |
| **Required Judgment Types** | ANSWER (stable prepared knowledge) |
| **Required Knowledge Categories** | Place character / visitor experience / time expectation / access basics |
| **Potential Evidence Categories** | Official description / WE / Corpus place-node data |
| **Potential Live Requirement** | Operating hours if volatile; seasonal if applicable |
| **Potential ASK Requirement** | None anticipated — general orientation question |

---

### O-2 — Odongdo / Situation

| Field | Value |
|---|---|
| Scenario ID | O-2 |
| Place | 오동도 |
| Question | "아이랑 차 가지고 가도 괜찮아?" |
| Interaction Type | Single-turn |
| Intended Difficulty | Medium |
| **Desired Answer Properties** | Honest friction disclosure / parking reality / child-suitability / condition-aware |
| **Required Judgment Types** | ANSWER + potential LIVE_VERIFY (parking/access current state) |
| **Required Knowledge Categories** | Vehicle access / parking situation / child accessibility / mobility |
| **Potential Evidence Categories** | Field confirmation / WE friction data / Founder local knowledge |
| **Potential Live Requirement** | Current parking availability or policy if volatile |
| **Potential ASK Requirement** | Child age/mobility if materially affects answer |

---

### O-3 — Odongdo / Relationship

| Field | Value |
|---|---|
| Scenario ID | O-3 |
| Place | 오동도 / 여수해상케이블카 |
| Question | "케이블카 타고 오동도까지 같이 보면 어때?" |
| Interaction Type | Single-turn |
| Intended Difficulty | High |
| **Desired Answer Properties** | Honest sequence assessment / direction / time / feasibility without fabrication |
| **Required Judgment Types** | ANSWER + JUDGMENT (sequence/time/direction feasibility) |
| **Required Knowledge Categories** | Cable Car boarding direction / Odongdo access from each boarding point / time estimate / sequence friction |
| **Potential Evidence Categories** | Corpus sequence data / Travel Time Matrix / Field confirmation |
| **Potential Live Requirement** | Operating hours alignment; current cable car status |
| **Potential ASK Requirement** | Time available / direction preference / vehicle status — only if materially affects judgment |

---

### H-1 — Hyangiram / Basic

| Field | Value |
|---|---|
| Scenario ID | H-1 |
| Place | 향일암 |
| Question | "향일암 가기 힘들어?" |
| Interaction Type | Single-turn |
| Intended Difficulty | Medium |
| **Desired Answer Properties** | Honest difficulty description / physical access reality / no minimization or exaggeration |
| **Required Judgment Types** | ANSWER (stable physical-access knowledge) |
| **Required Knowledge Categories** | Approach difficulty / stairs / time / physical friction |
| **Potential Evidence Categories** | WE physical-friction data / Founder local / Field confirmation |
| **Potential Live Requirement** | Seasonal crowd or path condition if volatile |
| **Potential ASK Requirement** | Mobility constraints if not known — only if materially affects difficulty assessment |

---

### H-2 — Hyangiram / Situation

| Field | Value |
|---|---|
| Scenario ID | H-2 |
| Place | 향일암 |
| Question | "부모님 모시고 가도 괜찮을까?" |
| Interaction Type | Single-turn |
| Intended Difficulty | High |
| **Desired Answer Properties** | Condition-aware judgment / honest physical friction / no false reassurance |
| **Required Judgment Types** | JUDGMENT (mobility/companion suitability) |
| **Required Knowledge Categories** | Physical access difficulty / elder mobility considerations / rest points / alternative access if exists |
| **Potential Evidence Categories** | WE friction / Founder local / Field confirmation |
| **Potential Live Requirement** | Current path condition if volatile |
| **Potential ASK Requirement** | Parent mobility level — high probability necessary ASK if not provided |

---

### H-3 — Hyangiram / Judgment

| Field | Value |
|---|---|
| Scenario ID | H-3 |
| Place | 향일암 |
| Question | "두 시간밖에 없는데 향일암까지 가는 게 좋을까?" |
| Interaction Type | Single-turn |
| Intended Difficulty | High |
| **Desired Answer Properties** | Time-aware honest judgment / no unsupported reassurance / actionable assessment |
| **Required Judgment Types** | JUDGMENT (time feasibility) |
| **Required Knowledge Categories** | Travel time to Hyangiram from likely location / visit duration / physical access time / return time |
| **Potential Evidence Categories** | Travel Time Matrix / Corpus data / Field confirmation |
| **Potential Live Requirement** | Current location of traveler (if not provided) |
| **Potential ASK Requirement** | Current location — high probability necessary ASK; departure time if ambiguous |

---

### C-1 — Cable Car / Basic

| Field | Value |
|---|---|
| Scenario ID | C-1 |
| Place | 여수해상케이블카 |
| Question | "케이블카 어디서 타?" |
| Interaction Type | Single-turn |
| Intended Difficulty | Low |
| **Desired Answer Properties** | Accurate boarding point description / both stations / no fabrication |
| **Required Judgment Types** | ANSWER (stable factual) |
| **Required Knowledge Categories** | Boarding station names / locations / access methods |
| **Potential Evidence Categories** | Official / RB-01 entity identity research / Founder local |
| **Potential Live Requirement** | Operating hours if volatile |
| **Potential ASK Requirement** | None anticipated for basic location question |

---

### C-2 — Cable Car / Situation

| Field | Value |
|---|---|
| Scenario ID | C-2 |
| Place | 여수해상케이블카 |
| Question | "아이랑 차로 왔는데 어떻게 타는 게 편해?" |
| Interaction Type | Single-turn |
| Intended Difficulty | Medium |
| **Desired Answer Properties** | Vehicle-aware boarding recommendation / parking reality / child consideration |
| **Required Judgment Types** | ANSWER + JUDGMENT (situation-aware boarding guidance) |
| **Required Knowledge Categories** | Boarding station access / parking / vehicle approach / child suitability |
| **Potential Evidence Categories** | RB-01/RB-02/RB-03 research / Founder local / Field confirmation |
| **Potential Live Requirement** | Current parking status if volatile |
| **Potential ASK Requirement** | Child age/mobility only if materially affects recommendation |

---

### C-3 — Cable Car / Relationship

| Field | Value |
|---|---|
| Scenario ID | C-3 |
| Place | 여수해상케이블카 / 오동도 |
| Question | "타고 나서 오동도 갈 건데 어느 쪽에서 타는 게 나아?" |
| Interaction Type | Single-turn |
| Intended Difficulty | High |
| **Desired Answer Properties** | Direction-aware judgment / sequence-aware / honest without fabrication |
| **Required Judgment Types** | JUDGMENT (direction selection for intended next destination) |
| **Required Knowledge Categories** | Cable Car directional outcome / Dolsan vs Jasan exit proximity to Odongdo / route feasibility |
| **Potential Evidence Categories** | RB-01 entity identity / Corpus directional data / Travel Time Matrix / Founder local |
| **Potential Live Requirement** | Operating hours; current cable car status |
| **Potential ASK Requirement** | Vehicle availability — may affect route; only if materially changes direction recommendation |

---

## H. Single-Turn and Multi-Turn Design

### Single-Turn

Seven of the 9 Core Scenarios are designed as single-turn (self-contained question).

Used for: basic knowledge, simple situational judgment.

### Multi-Turn Context Continuity

Multi-turn sequences are designed to detect whether already-provided traveler context is correctly retained and NOT re-asked.

**Multi-turn design structure (design only — no actual answers):**

```
MT-1 Context Establishment

Turn 1:
  Traveler says: [companion type + vehicle status + situation]
  (actual text defined at execution time, not here)

Turn 2:
  Traveler asks: O-2 (Odongdo situation question)
  Expected: SOUL uses Turn 1 context; does not re-ask companion/vehicle

Turn 3:
  Traveler asks: C-2 (Cable Car situation question)
  Expected: SOUL retains Turn 1 context; applies to new place without re-asking
```

**Context tracking fields:**

| Field | Definition |
|---|---|
| Known_Context_Retention | Context provided in prior turn correctly carried forward |
| Context_Reask | System asked for information already supplied — FAILURE |
| Relevant_Context_Use | Carried context materially influenced answer |
| Irrelevant_Context_Overuse | Context applied where it did not change the answer — potential overreach |

Multi-turn sequences are defined at execution time within approved traveler-state templates. No actual Yeosu answers are pre-filled here.

---

## I. Reverse-Design Method

Every Core Scenario is designed reverse-first:

```
STEP 1 — Desired Answer Properties
  What should a good SOUL answer look like for this scenario?

STEP 2 — Required Judgment
  What kind of judgment does that answer require?
  (ANSWER / ASK / LIVE_VERIFY / JUDGMENT / INSUFFICIENT)

STEP 3 — Required Prepared Knowledge / Context
  What knowledge must already be prepared for that judgment to occur?

STEP 4 — Required Evidence Categories
  What evidence types must exist for that knowledge to be valid?
```

Collecting actual evidence for STEP 4 happens AFTER protocol approval — not in this document.

**Governing principle:**

```
Good SOUL Answer
→ Required Judgment
→ Required Prepared Knowledge
→ Required Evidence

NOT: Collect lots of information → later decide how to use it.
```

---

## J. Hidden Transfer Test Protocol

### Purpose

Core Scenarios alone may cause preparation memorization. A model that pre-authors answers to the exact 9 questions would appear to perform well without actually having transferable knowledge.

The Hidden Transfer Test verifies generalization.

### Design

| Parameter | Value |
|---|---|
| Number of hidden transfer items | 2–4 per pilot run (exact number at execution) |
| Generation timing | After Model A and B preparation is finalized and frozen |
| Freeze timing | Hidden transfer questions are not written until after all preparation is complete |
| Eligibility | Must be answerable using the same evidence pool used for Core Scenarios. No new facts may be secretly provided |
| Evaluation method | Same Integrity Gate + Failure Taxonomy as Core Scenarios |

### Leakage Prevention

- Hidden transfer questions are NOT included in preparation materials for either model
- They are generated by a separate party (Founder or Lumi) who has not seen the preparation documents
- Or generated after preparation is frozen and reviewed for collision with preparation content
- Any question that turns out to directly match a prepared element is replaced

### Interpretation

```
Core Scenarios: design validation
Hidden Transfer: generalization / transfer validation
```

If a model performs well on Core Scenarios but fails Hidden Transfer, preparation benefit is likely overfitted to known questions.

---

## K. Integrity Gate

Efficiency comparison is only valid if answer integrity passes.

The Integrity Gate is evaluated BEFORE efficiency metrics.

**Four integrity criteria:**

| Criterion | Definition |
|---|---|
| FACTUAL_GROUNDING | Is the answer supported by available evidence? No unsupported claims. |
| EVIDENCE_BOUNDARY | Does the answer avoid stronger claims than evidence allows? |
| CONTEXT_FIDELITY | Does the answer correctly use traveler-provided context? No ignored or fabricated context. |
| LIVE_CORRECTNESS | Does the answer correctly distinguish stable prepared knowledge from volatile current facts? |

**Gate outcome options:**

```
PASS         — all 4 criteria met
PARTIAL      — one or more criteria partially met; note which
FAIL         — one or more criteria materially violated
```

**Gate enforcement rule:**

```
If Integrity Gate = FAIL:
  Do not count lower retrieval/runtime burden as improvement.
  A faster but less reliable answer is NOT an improvement.
```

Numeric pass thresholds are not defined in this protocol. No approved evidence base exists for them. Integrity assessment is qualitative at this pilot stage, applied per-scenario.

---

## L. ASK Evaluation

Do not optimize only for fewer questions.

**Three ASK categories tracked independently:**

| Category | Definition |
|---|---|
| UNNECESSARY_ASK | Asked for information that was not needed to produce a useful answer |
| CONTEXT_REASK | Asked for information already supplied by the traveler |
| MISSED_NECESSARY_ASK | Failed to ask when missing information would materially change the judgment |

**Appropriate ASK behavior:**

```
Ask only for the minimum missing condition
that materially affects the answer.
```

CONTEXT_REASK is a failure regardless of model. MISSED_NECESSARY_ASK is also a failure. Only UNNECESSARY_ASK reflects a preparation efficiency gap.

---

## M. Live Verification Evaluation

**Four Live Verify categories tracked independently:**

| Category | Definition |
|---|---|
| REQUIRED_LIVE_VERIFY | Volatile fact that should be flagged for live check |
| UNNECESSARY_LIVE_VERIFY | Stable fact incorrectly flagged as requiring live check |
| MISSED_REQUIRED_LIVE_VERIFY | Volatile fact presented as stable without check |
| WRONG_VERIFICATION_SOURCE | Verification attempted via inappropriate source or method |

**Key principle:**

```
Live verification reduction is NOT automatically better.
Correctness first.
```

A model that eliminates live verification calls by presenting volatile facts as stable facts has failed, not improved.

---

## N. Expert Anticipation Boundary

Model B prepares broadly. But SOUL speaks selectively.

**Critical distinction:**

```
Preparing information ≠ Speaking all prepared information.
```

**Working principle:**

```
PREPARE BROADLY ENOUGH, SPEAK SELECTIVELY.
```

**Anticipation Overreach — tracked as failure type:**

An answer that speaks preparation content not relevant to the traveler's actual situation or question is ANTICIPATION_OVERREACH.

Conceptual examples (no actual Yeosu content):
- Unsolicited irrelevant advice about a place not asked about
- Information overload driven by prepared context rather than traveler need
- Assumption about traveler need presented as if stated by traveler

Anticipation Overreach does not disqualify Model B globally. It is a failure instance to be noted and traced.

---

## O. Cost Model

**Two cost dimensions tracked separately:**

### Pre-Runtime Preparation Cost

Measures how much work Model B (and Model A baseline) requires before a question arrives.

Tracked as:
- Number of knowledge units prepared per place
- Number of traveler-state × place context combinations prepared
- Estimated maintenance burden (how often prepared content needs updating)
- Preparation operations (authoring, structuring, linking)

### Runtime Assembly Cost

Measures how much work occurs after a question arrives.

Tracked as:
- New retrieval operations triggered
- Knowledge units newly assembled at runtime
- Judgment operations after question
- Live verification operations
- Clarification turns required
- Runtime knowledge assembly steps

**Research question:**

> Does pre-runtime preparation cost get reused enough across multiple questions/events to reduce overall operational burden?

No monetary estimates are required. No specific numeric thresholds are defined in advance.

**Principle:**

```
DO NOT claim Model B is better merely because runtime retrieval is lower.
If preparation cost is very high and benefits only one scenario,
it may not represent genuine efficiency gain.
```

---

## P. Failure Taxonomy

Every observed failure must be traceable where possible.

| Code | Definition |
|---|---|
| EVIDENCE_GAP | Required source knowledge is absent — not available even if well-prepared |
| PREPARATION_GAP | Evidence exists but was not converted into usable prepared knowledge |
| ROUTING_GAP | Prepared knowledge exists but wrong knowledge was selected or activated |
| CONTEXT_GAP | Traveler context was lost, ignored, or incorrectly reused |
| VERIFICATION_GAP | Live verification was missing, unnecessary, or used wrong source |
| JUDGMENT_GAP | Available evidence and context were sufficient but judgment was incorrect or unsupported |
| EXPRESSION_GAP | Underlying judgment was acceptable but SOUL expression was poor or misleading |
| ANTICIPATION_OVERREACH | Model B spoke context the traveler did not need; information not relevant to actual question |
| MULTI_CAUSE | More than one layer materially contributed — both coded |

**Multi-cause handling:**

Do not force a single cause without evidence. When two layers both materially contributed to a failure, both are coded.

---

## Q. Evaluation Order

Evaluation must proceed in this order. Efficiency may never override Integrity.

```
1. INTEGRITY       (Integrity Gate — §K)
2. USEFULNESS      (did the answer serve the traveler's actual need?)
3. RUNTIME BURDEN  (retrieval, assembly, verification, ASK turns)
4. PREPARATION COST (authoring, maintenance, pre-activation burden)
5. TRANSFER        (Hidden Transfer performance)
6. FAILURE TRACEABILITY (failure cause localization)
```

Usefulness is assessed structurally in this pilot. Human preference testing is a separate track (Blind MVP Test — ON HOLD).

---

## R. Result Language Boundary

3-place Pilot findings must use bounded language only.

**Allowed verdict vocabulary (per scenario, per model, or overall):**

```
PROMISING            — consistent positive signal across integrity + usefulness + transfer
MIXED                — positive signal in some areas, negative in others
NO_OBSERVED_ADVANTAGE — no consistent difference between A and B on this scenario type
REQUIRES_REVISION    — systematic failure in a traceable layer; preparation or routing needs rework
```

**Not allowed:**

- "Model B is better" (causal superiority claim)
- "This validates Prepared Context" (SSOT/architecture promotion)
- "Yeosu knowledge is complete" (generalization)
- "SOUL is ready for production" (readiness claim)
- "Traveler prefer Model B" (human preference — not tested in this pilot)

Final verdict vocabulary may be refined at the conclusion of execution, but must remain research-bounded throughout.

---

## S. Possible Post-Pilot Outcomes

These are observation possibilities recorded in advance to prevent post-hoc interpretation.

```
OBSERVATION POSSIBILITY 1:
  Model A may be sufficient for simple, stable-fact questions (O-1, C-1).
  Model B may add value for context-rich / relationship / judgment scenarios (H-2, H-3, C-3, O-3).

OBSERVATION POSSIBILITY 2:
  Preparation costs for Model B may be high relative to benefit
  if most traveler questions are simple and single-turn.

OBSERVATION POSSIBILITY 3:
  A future adaptive or hybrid model may emerge from evidence,
  where preparation depth is calibrated to scenario type.
```

**None of these are pre-decided outcomes.**
No "Adaptive Prepared Intelligence" Candidate or Architecture is created.
Model C is not introduced as a third experimental condition.

---

## T. Protocol Success Conditions

V0.1 is successful if it produces evidence to answer:

1. Where is Prepared Knowledge alone sufficient?
2. Where does Prepared Context / Expert Anticipation add observable value?
3. What Preparation Boundary appears operationally useful across the 3 places?
4. Can failures be localized to a specific knowledge/judgment layer?
5. Does any runtime efficiency gain preserve answer integrity?
6. Does preparation cost appear reusable across multiple scenarios per place?
7. Can the method handle hidden transfer questions using the same evidence pool?

This is a research feasibility / architecture-learning pilot.
Not a validation study.
Not a production readiness test.

---

## U. Governance

| Action | Status |
|---|---|
| Collect actual new Yeosu knowledge | PROHIBITED (this run) |
| Web research Odongdo / Hyangiram / Cable Car facts | PROHIBITED (this run) |
| Execute Pilot | PROHIBITED (this run) |
| Generate actual test answers | PROHIBITED (this run) |
| Score A/B | PROHIBITED (this run) |
| Recruit participants | HOLD |
| Conduct Blind MVP sessions | HOLD |
| Generate Participant Evidence | HOLD |
| Assign BT verdict | HOLD |
| Modify runtime / production | PROHIBITED |
| Modify DB / schema | PROHIBITED |
| Create place_knowledge migration | NOT APPROVED / HOLD |
| Alter canonical Blind MVP stimuli | PROHIBITED |
| Create Candidate | PROHIBITED (this run) |
| Promote to SSOT | PROHIBITED (this run) |
| Claim hypothesis as established fact | PROHIBITED |

Existing status:
- Blind MVP assets: VALID / UNCHANGED
- Participant Evidence: NONE
- BT Verdict: NOT ASSIGNED
- Prepared Knowledge: RESEARCH HYPOTHESIS
- Prepared Context: RESEARCH HYPOTHESIS
- Expert Anticipation: RESEARCH HYPOTHESIS
- Preparation Boundary: RESEARCH VARIABLE

---

## V. Explicit Non-Conclusions

| Item | Status |
|---|---|
| Prepared Knowledge Model validated | NOT VALIDATED |
| Prepared Context Model validated | NOT VALIDATED |
| Model A vs Model B winner | NOT DETERMINED |
| Preparation Boundary decided | NOT DECIDED |
| Expert Anticipation Knowledge validated | NOT VALIDATED |
| External/Phoenix knowledge boundary decided | NOT DECIDED |
| 3-place pilot results generalized | NOT APPLICABLE |
| Travel Grammar concluded | NOT CONCLUDED |
| New Candidate created | NONE |
| SSOT promoted | NONE |
| Architecture Decision made | NONE |

---

## W. Self-Review Findings

*(Conducted before persistence — see §21 of protocol brief)*

The following checks were applied:

| Check | Finding |
|---|---|
| A/B distinction operationally observable? | YES — preparation timing and organization are distinct and trackable |
| Does B receive hidden information or answer leakage? | ADDRESSED — Anti-Cheating Rule §E and leakage detection before execution |
| Same Evidence Pool guaranteed? | YES — Experimental Fairness Rule §D explicitly requires it |
| Can Core Scenarios cause overfitting? | PARTIALLY — Hidden Transfer Test §J is designed to detect this |
| Is Hidden Transfer protected? | YES — freeze timing and external generation ensure protection |
| Could lower retrieval hide lower accuracy? | ADDRESSED — Integrity Gate §K enforced before efficiency metrics |
| Are MISSED_NECESSARY_ASK omissions detectable? | YES — tracked independently in §L |
| Is preparation cost measured separately? | YES — §O separates pre-runtime from runtime cost |
| Can B create information overload? | ADDRESSED — Anticipation Overreach tracked in §N and §P |
| Can failure cause be traced without forced attribution? | YES — MULTI_CAUSE allows dual coding in §P |
| Does 3-place scope accidentally imply generalization? | ADDRESSED — §F and §R explicitly bound scope and result language |
| Is Model C being prematurely introduced? | NO — §S records it only as an observation possibility, not a condition |
| Are any actual Yeosu facts being inserted? | NO — scenario matrix §G contains design metadata only |
| Did any research hypothesis accidentally become architecture? | NO — all working models remain RESEARCH HYPOTHESIS throughout |

**Corrections made before persistence:** None required. Protocol is internally consistent.

---

*SOUL Yeosu Prepared Knowledge 3-Place Pilot Protocol V0.1 — 2026-09-27*
