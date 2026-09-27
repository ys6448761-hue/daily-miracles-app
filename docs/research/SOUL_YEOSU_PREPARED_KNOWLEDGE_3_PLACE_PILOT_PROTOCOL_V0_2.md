# SOUL Yeosu Prepared Knowledge
# 3-Place Pilot Protocol V0.2

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** f93cec7
**Status:** PROTOCOL MINOR REVISION — NOT YET EXECUTED

**Prior version:**
`docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_1.md`

**Research Handover basis:**
`docs/research/SOUL_YEOSU_PREPARED_TRAVEL_KNOWLEDGE_RESEARCH_HANDOVER_V0_1.md`

This document defines the research protocol only.
No actual Yeosu knowledge is collected here.
No pilot is executed.
No A/B scoring is produced.
No Candidate is created.

---

## Revision Note

**Source:** Independent Pre-execution Review of Protocol V0.1
**Prior verdict:** PASS WITH CORRECTIONS
**Scope:** Five corrections only — no redesign of research architecture

| Correction | Summary |
|---|---|
| C1 | Preparation Boundary operationalization — PREPARED/RUNTIME/LIVE state classification per knowledge unit |
| C2 | Preparation Reuse Ledger — minimum fields for tracking reuse across scenarios |
| C3 | Context Availability Rule — explicit rule for identical logical context availability to A and B |
| C4 | Hidden Transfer strengthened — NEAR/FARTHER distinction + semantic and combination leakage control |
| C5 | Single/Multi-turn consistency — all 9 Core Scenarios are single-turn fixtures; MT-1 is a separate Multi-Turn Context Variant |

All other sections inherit from V0.1 unchanged.

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
Traveler State trigger occurs (see §D Trigger Clarification)
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

### Model B Trigger Clarification [C1/C3 addition]

A Traveler State trigger for Model B occurs **only when information has actually been provided or observed** through the allowed pilot interaction.

Model B may not infer or anticipate unavailable future state.

Allowed trigger categories (abstract — no Yeosu facts):
- Companion signal supplied by the traveler
- Vehicle status signal supplied by the traveler
- Mobility constraint supplied by the traveler
- Time constraint supplied by the traveler
- Itinerary or next-place signal supplied by the traveler

Model B may begin context pre-activation as soon as any of the above signals are actually received. Not before.

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

### Context Availability Rule [C3]

> When the traveler provides a context signal, that signal becomes available to both Model A and Model B at the same logical moment.
>
> Neither model may receive traveler information earlier than the other.
>
> The experimental difference is not information availability.
>
> Model B may use already-available traveler context to pre-activate decision ingredients before a later Question/Event. Model A may retain the same context, but does not perform question-specific knowledge assembly until the relevant Question/Event occurs.

Clarifications:

- Model A is NOT forced to forget prior context. It retains traveler context through the conversation.
- Model B does NOT receive future context. It may only activate based on context already supplied.
- Same Context Availability ≠ Same Preparation Behavior.

This distinction must be preserved throughout execution.

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

**Leakage detection [C4 strengthened]:**

After protocol approval and before execution, preparation artifacts for both Model A and Model B are frozen. Before Hidden Transfer items are finalized, perform a collision review across both preparation artifacts checking for:

| Collision Type | Definition |
|---|---|
| DIRECT_COLLISION | The same or pre-written question or answer appears in preparation |
| SEMANTIC_COLLISION | A preparation artifact effectively encodes the same traveler-specific judgment required by the hidden item, even if worded differently |
| COMBINATION_COLLISION | The hidden item exactly reproduces a prepared traveler-state × place × decision combination such that no meaningful transfer is required |

If collision is material:
- Replace the hidden item before execution
- Record: collision type / replacement occurred YES/NO
- Do not expose the replacement item to preparation operators before preparation is fully frozen

This leakage control applies to Core Scenario anti-cheating as well: any Model B element that directly or semantically encodes a Core Scenario test answer is flagged and removed before comparison.

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

9 Core Scenarios. All 9 are **single-turn fixtures**. **No actual Yeosu answers or facts are filled in this document.**

Each scenario is defined by design metadata only.

See §H for multi-turn design (MT-1 is a separate Multi-Turn Context Variant, not a Core Scenario).

---

### O-1 — Odongdo / Basic

| Field | Value |
|---|---|
| Scenario ID | O-1 |
| Place | 오동도 |
| Question | "오동도는 뭐가 좋아?" |
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
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
| Interaction Type | **Single-turn** |
| Intended Difficulty | High |
| **Desired Answer Properties** | Direction-aware judgment / sequence-aware / honest without fabrication |
| **Required Judgment Types** | JUDGMENT (direction selection for intended next destination) |
| **Required Knowledge Categories** | Cable Car directional outcome / Dolsan vs Jasan exit proximity to Odongdo / route feasibility |
| **Potential Evidence Categories** | RB-01 entity identity / Corpus directional data / Travel Time Matrix / Founder local |
| **Potential Live Requirement** | Operating hours; current cable car status |
| **Potential ASK Requirement** | Vehicle availability — may affect route; only if materially changes direction recommendation |

---

## H. Single-Turn and Multi-Turn Design [C5 corrected]

### Single-Turn Core Scenarios

**All 9 Core Scenarios (§G) are single-turn fixtures.**

Each scenario is self-contained: traveler asks one question; SOUL provides one response. The Core Scenario count is 9.

Used for: basic knowledge, simple situational judgment, relationship/sequence judgment.

### Multi-Turn Context Variant — MT-1

MT-1 is a **separate Multi-Turn Context Variant**, not a Core Scenario.
It does not add a 10th independent place-knowledge scenario.
It reuses Core Scenario intents (O-2 and C-2) within a multi-turn context continuity test.

Multi-turn sequences are designed to detect whether already-provided traveler context is correctly retained and NOT re-asked.

**MT-1 design structure (design only — no actual answers):**

```
MT-1 Context Establishment

Turn 1:
  Traveler says: [companion type + vehicle status + situation]
  (actual text defined at execution time, not here)

Turn 2:
  Traveler asks: O-2 intent (Odongdo situation question)
  Expected: SOUL uses Turn 1 context; does not re-ask companion/vehicle

Turn 3:
  Traveler asks: C-2 intent (Cable Car situation question)
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

**Summary:**

```
Core Scenario count: 9 (all single-turn)
Multi-turn context test: MT-1 (separate variant — not an additional scenario)
Total: 9 Core + 1 Multi-turn Variant
```

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

Desired Answer Properties remain structural qualities only. They are NOT:
- Reference answers
- Gold answers
- Recommendations
- Yeosu factual content

---

## J. Hidden Transfer Test Protocol [C4 strengthened]

### Purpose

Core Scenarios alone may cause preparation memorization. A model that pre-authors answers to the exact 9 questions would appear to perform well without actually having transferable knowledge.

The Hidden Transfer Test verifies generalization.

### Transfer Class Distinction [C4]

Hidden transfer items are classified into two observational classes before execution:

**NEAR TRANSFER**

A novel question or expression that uses a traveler-state / knowledge relationship close to prepared combinations, but is not the frozen Core Scenario wording.

Used to detect: whether preparation generalizes within familiar traveler-state × place × knowledge territory.

**FARTHER TRANSFER**

A question answerable from the same evidence pool but requiring a materially different combination or application of prepared knowledge than the Core Scenario combinations.

Used to detect: whether preparation generalizes across traveler-state or knowledge combination boundaries.

Important: "Farther" is relative within this small 3-place pilot. Do not claim general domain transfer from these results.

### Design

| Parameter | Value |
|---|---|
| Number of hidden transfer items | 2–4 per pilot run (exact number at execution) |
| Transfer class distribution | At least 1 NEAR and 1 FARTHER item per pilot run where possible |
| Generation timing | After Model A and B preparation is finalized and frozen |
| Freeze timing | Hidden transfer questions are not written until after all preparation is complete |
| Eligibility | Must be answerable using the same evidence pool used for Core Scenarios. No new facts may be secretly provided |
| Evaluation method | Same Integrity Gate + Failure Taxonomy as Core Scenarios |

### Leakage Prevention [C4 strengthened]

Before Hidden Transfer items are finalized, perform collision review against BOTH Model A and Model B preparation artifacts.

**Three collision types to check:**

| Collision Type | Definition | Action |
|---|---|---|
| DIRECT_COLLISION | Same or pre-written question or answer appears in preparation | Replace item |
| SEMANTIC_COLLISION | Preparation artifact effectively encodes the same traveler-specific judgment required by the hidden item, even if worded differently | Replace item |
| COMBINATION_COLLISION | Hidden item exactly reproduces a prepared traveler-state × place × decision combination such that no meaningful transfer is required | Replace item |

**Collision review procedure:**
- Preparation artifacts for BOTH A and B are frozen before Hidden Transfer items are finalized
- Hidden item creator/reviewer must not use hidden items to alter either preparation condition
- Record: collision type observed / replacement occurred YES/NO
- Do not expose replacement items to preparation operators before all preparation remains frozen
- Same Evidence Pool remains mandatory — no model receives new factual evidence through Hidden Transfer generation

### Interpretation

```
Core Scenarios: design validation
Hidden Transfer (NEAR): near-territory generalization validation
Hidden Transfer (FARTHER): cross-combination transfer validation
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

## O. Cost Model [C1 and C2 additions]

**Two cost dimensions tracked separately:**

### Knowledge Unit Execution-State Classification [C1]

For every scenario execution, record each knowledge unit involved:

| Field | Definition |
|---|---|
| Knowledge Unit ID | Unique identifier for this unit (assigned at preparation time) |
| Unit category | Knowledge type (place character / friction / routing / live-volatile / etc.) |
| State | PREPARED / RUNTIME / LIVE |
| Model | A or B |
| Scenario / Event | Which scenario or MT turn this applies to |
| Used in final judgment? | YES / NO |
| Required but unavailable? | YES / NO |

**State definitions:**

| State | Definition |
|---|---|
| PREPARED | Unit was available and structured before the Question/Event occurred |
| RUNTIME | Unit was retrieved or assembled after the Question/Event occurred |
| LIVE | Unit requires current or volatile verification before use |

**Purpose:**

This classification is the operational observation mechanism for Preparation Boundary.

It allows the pilot to observe:
- What was prepared → what was actually used
- What had to be assembled at runtime → whether preparation was sufficient
- What required live verification → whether preparation claimed too much stability

**IMPORTANT — do NOT invent:**
- Optimal PREPARED/RUNTIME/LIVE ratios
- Numeric thresholds for Preparation Boundary
- Target percentages for any state
- Universal boundary positions

Preparation Boundary remains:
```
RESEARCH VARIABLE
NOT DECIDED
NOT Framework
NOT Candidate
NOT Architecture Decision
```

### Preparation Reuse Ledger [C2]

Track whether preparation cost is reused across multiple questions and events.

**Minimum fields:**

| Field | Definition |
|---|---|
| Knowledge Unit ID | Same as execution-state classification above |
| Model | A or B |
| Preparation operation/type | Authoring / structuring / linking / context pre-activation |
| Prepared once? | YES / NO |
| Scenarios/Events used in | List of Scenario IDs or MT turns where this unit was used |
| Use Count | Total number of times this unit contributed to an answer |
| Distinct Scenario Count | Number of distinct Core Scenario IDs where used |
| Hidden Transfer use | YES / NO (and transfer class if applicable) |
| Multi-turn reuse | YES / NO (if used in MT-1 turns) |
| Maintenance/Update event | YES / NO (if unit required updating during pilot) |
| Notes | Any anomaly or observation |

**Conceptual example only (no Yeosu facts):**

```
Unit: PK-XXX-01
Prepared once: YES
Used in: Scenario-A / Scenario-B / Hidden-1
Use Count: 3
Distinct Scenario Count: 3
Hidden Transfer use: YES (NEAR)
Multi-turn reuse: NO
```

**Purpose:**

The Reuse Ledger distinguishes:

```
GENUINE REUSE
— one preparation unit serves multiple scenarios,
  reducing per-question cost over time

from

SHIFTED COMPLEXITY
— preparation cost is high but each unit serves only one scenario,
  meaning total work has merely moved before runtime
```

Do not create monetary cost estimates. Do not create fake time estimates.

### One-Time vs. Per-Query Cost Separation

Separate cost accounting for:

**PRE-RUNTIME ONE-TIME PREPARATION**
- Authoring knowledge units
- Structuring (indexing, categorizing, linking)
- Context pre-activation preparation (Model B)

**PER-EVENT / PER-QUESTION RUNTIME WORK**
- Retrieval operations triggered
- Knowledge units assembled at runtime
- Judgment operations
- Live verification operations
- Clarification turns required

**MAINTENANCE / UPDATE WORK**
- Refresh or update of prepared units when facts change
- Changed volatile boundary (reclassify PREPARED → LIVE)
- Relinking or restructuring where applicable

For both Model A and Model B, record equivalent categories wherever applicable.

**Do not assume Model A has zero preparation cost.** Model A prepares knowledge units (authoring, structuring, indexing) — the difference is that B also performs question-specific context pre-activation before the question arrives.

**Research question:**

> Does pre-runtime preparation cost get reused enough across multiple questions/events to reduce overall operational burden?

No monetary estimates are required. No specific numeric thresholds are defined in advance.

**Principle:**

```
DO NOT claim Model B is better merely because runtime retrieval is lower.

If preparation cost is very high and benefits only one scenario,
it may not represent genuine efficiency gain.

The Reuse Ledger, combined with One-Time/Per-Query separation,
is the instrument for answering this question.
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

**Note on SHIFTED_COMPLEXITY:**

SHIFTED_COMPLEXITY is NOT a failure taxonomy code. It is an observed cost pattern derived from comparing:
- Pre-runtime Preparation Cost
- Runtime Assembly Cost
- Reuse Ledger

If preparation cost is high and reuse is low, the pattern is observed and recorded — but it does not receive a failure code. It informs the research question about Preparation Boundary.

---

## Q. Evaluation Order

Evaluation must proceed in this order. Efficiency may never override Integrity.

```
1. INTEGRITY         (Integrity Gate — §K)
2. USEFULNESS        (did the answer serve the traveler's actual need?)
3. RUNTIME BURDEN    (retrieval, assembly, verification, ASK turns)
4. PREPARATION COST  (authoring, maintenance, pre-activation burden)
5. TRANSFER          (Hidden Transfer performance — NEAR and FARTHER)
6. FAILURE TRACEABILITY (failure cause localization)
```

**Preparation Cost interpretation [C2 addition]:**

When interpreting step 4, use the Reuse Ledger (§O) alongside raw preparation counts.

A lower Runtime Burden cannot be interpreted as operational advantage without examining:
- One-time preparation cost (how much work was done pre-runtime)
- Reuse across scenarios (how many scenarios benefited from that preparation)
- Maintenance/update burden (whether prepared units need refreshing)

Only when Runtime Burden reduction is accompanied by adequate reuse does it suggest genuine operational improvement.

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

V0.2 is successful if it produces evidence to answer:

1. Where is Prepared Knowledge alone sufficient?
2. Where does Prepared Context / Expert Anticipation add observable value?
3. What Preparation Boundary appears operationally useful across the 3 places?
4. Can failures be localized to a specific knowledge/judgment layer?
5. Does any runtime efficiency gain preserve answer integrity?
6. Does preparation cost appear reusable across multiple scenarios per place?
7. Can the method handle hidden transfer questions — both NEAR and FARTHER — using the same evidence pool?

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

## W. Self-Review Findings — V0.2

*(Conducted before persistence)*

**C1 — Preparation Boundary Operationalization:**

| Check | Finding |
|---|---|
| Can Preparation Boundary be observed through PREPARED/RUNTIME/LIVE unit states? | YES — Knowledge Unit Execution-State Classification §O defines all three states with per-unit recording fields |
| Do state definitions prevent conflation? | YES — PREPARED (before question), RUNTIME (after question), LIVE (volatile verification) are mutually exclusive by definition |
| Are numeric thresholds or optimal ratios introduced? | NO — explicitly prohibited. Preparation Boundary remains RESEARCH VARIABLE |

C1: CLOSED

**C2 — Preparation Reuse Ledger:**

| Check | Finding |
|---|---|
| Can one-time preparation reuse across multiple scenarios be recorded? | YES — Reuse Ledger §O includes Scenarios/Events used in, Use Count, Distinct Scenario Count |
| Does the Ledger distinguish GENUINE REUSE from SHIFTED COMPLEXITY? | YES — comparison of Preparation Cost vs Reuse Count produces the observable pattern |
| Are monetary or time estimates invented? | NO — explicitly prohibited |
| Is one-time vs per-query cost separation present? | YES — PRE-RUNTIME / PER-EVENT / MAINTENANCE buckets defined separately |

C2: CLOSED

**C3 — Context Availability Rule:**

| Check | Finding |
|---|---|
| Do A and B receive traveler context at the same logical moment? | YES — Context Availability Rule §D states both receive context at identical logical moment |
| Is Model A forced to forget prior context? | NO — explicitly clarified |
| Does Model B receive future context? | NO — Trigger Clarification §D states B may only activate based on context already supplied |
| Is Same Context Availability ≠ Same Preparation Behavior made explicit? | YES — stated explicitly in Context Availability Rule |

C3: CLOSED

**C4 — Hidden Transfer Leakage Control:**

| Check | Finding |
|---|---|
| Can direct AND semantic/combination leakage be detected? | YES — three collision types defined: DIRECT / SEMANTIC / COMBINATION |
| Is collision review applied to BOTH A and B preparation artifacts? | YES — explicitly stated in §E and §J |
| Is NEAR/FARTHER distinction defined? | YES — §J defines both transfer classes with distinct observational purposes |
| Is "Farther" relativized to this pilot? | YES — "Farther is relative within this small 3-place pilot" stated explicitly |
| Is replacement procedure defined? | YES — collision type recorded, replacement item not exposed to preparation operators |

C4: CLOSED

**C5 — Single/Multi-Turn Consistency:**

| Check | Finding |
|---|---|
| Is the "7 of 9" wording corrected? | YES — removed entirely. All 9 Core Scenarios are labeled Single-turn in §G |
| Is MT-1 separated from Core Scenarios? | YES — §H explicitly states MT-1 is a separate Multi-Turn Context Variant, not a Core Scenario |
| Is the 9 + 1 structure internally consistent across §G and §H? | YES — §G matrix shows all 9 as Single-turn; §H summary states "Core Scenario count: 9 / Multi-turn context test: MT-1" |
| Are the 9 Core Scenario questions unchanged? | YES — no scenario question was modified |

C5: CLOSED

**Additional checks:**

| Check | Finding |
|---|---|
| No real Yeosu facts introduced? | NO — scenario matrix contains design metadata only |
| No Hidden Transfer questions generated? | NO — protocol design only |
| No test execution? | NO — PROHIBITED |
| No Candidate? | NO |
| No Architecture Decision? | NO |
| No formal new Research Question? | NO |
| No migration/schema/runtime/production change? | NO |
| All V0.1 non-revised sections preserved? | YES — all sections not touched by C1–C5 carry through unchanged |

**Corrections made before persistence:** Five corrections applied (C1–C5). No additional corrections required. V0.2 is internally consistent.

---

*SOUL Yeosu Prepared Knowledge 3-Place Pilot Protocol V0.2 — 2026-09-27*
