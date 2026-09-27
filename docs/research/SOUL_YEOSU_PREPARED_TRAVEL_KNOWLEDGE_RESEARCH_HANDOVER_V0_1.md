# SOUL Yeosu Prepared Travel Knowledge
# Research Direction Handover V0.1

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 5f5aca2
**Status:** RESEARCH DIRECTION OPENED — HANDOVER DOCUMENT

This document records the current judgment position and working direction.
This is NOT a research execution document.
No new knowledge is collected here.
No Candidate is created.
No Architecture Decision is made.

---

## 1. Why This Research Direction Was Opened

The Blind MVP Test Design, Execution Package, and Facilitator Dry Run are complete and confirmed (BTD-A / EP-A / DR-B). Recruitment preparation is ready (RR-A).

Before real participant sessions begin, a product observation raised the following concern:

Even with deeply researched Relationship/Judgment Knowledge, SOUL may fail to reach that knowledge with real users if:
- basic travel-information questions trigger generic fallback before reaching prepared knowledge
- already-provided traveler context triggers unnecessary re-asking
- conversation-state or intent routing issues divert queries away from prepared answers

If SOUL cannot reliably answer basic travel questions from its prepared knowledge, testing its deeper Relationship/Judgment behavior in a blind participant study risks measuring fallback behavior rather than the intended SOUL judgment behavior.

This research direction is opened to determine: is the current Prepared Knowledge foundation — and the structure for routing questions to it — sufficient before participant sessions begin?

**This does not mean the Blind MVP design is wrong.**
It means the product infrastructure that delivers SOUL behavior needs a parallel assessment.

---

## 2. Current Verified Project Checkpoint

| Asset | Status |
|---|---|
| Blind MVP Test Design V0.1 | BTD-A CONFIRMED / PERSISTED |
| Execution Package V0.1 | EP-A CONFIRMED / PERSISTED + Post-Dry-Run Procedural Corrections |
| Facilitator Dry Run V0.1 | DR-B CONFIRMED / PERSISTED |
| OI-201 ~ OI-204 | RESOLVED |
| Canonical Stimuli | FROZEN / UNCHANGED |
| Recruitment Package | RR-A CONFIRMED (not yet persisted — under Founder review) |
| Participant Evidence | NONE |
| Blind MVP Test | NOT YET EXECUTED |
| BT Verdict | NOT ASSIGNED |

---

## 3. Blind MVP HOLD Boundary

Participant recruitment and session execution are on HOLD pending this research direction review.

**HOLD means:**
- Do not invite participants
- Do not run screening sessions
- Do not conduct participant test sessions
- Do not collect Participant Evidence
- Do not assign BT verdict

**HOLD does NOT mean:**
- The Blind MVP design is invalid
- The Execution Package needs redesign
- The canonical stimuli need changing
- The recruitment preparation needs revision

**HOLD reason:** Assess Knowledge Foundation and orchestration readiness before exposing SOUL behavior to participant judgment.

**HOLD removal condition:** After Prepared Knowledge Pilot Protocol is designed, reviewed, and — at Founder discretion — partially or fully executed, with findings informing a go/no-go on participant recruitment timing.

---

## 4. Observed Product Problem

The following risks were observed in current product behavior. These are observations, not confirmed root causes.

**Observed risk patterns:**
- User has already provided a condition; SOUL re-asks a broad question anyway
- Basic travel-information question receives a generic fallback rather than a specific prepared answer
- Deeply researched Relationship/Judgment Knowledge is never reached because the conversation diverts earlier
- User may disengage before SOUL's strongest judgment behaviors appear

**Possible causes (not yet assessed):**
- Basic Knowledge coverage gap
- Question/Intent routing gap
- Retrieval or orchestration gap
- Fallback behavior configuration
- Conversation-state handling gap
- Live-verification trigger gap
- Other runtime behavior

**NO ROOT CAUSE CONCLUSION.**

These observations motivate a reverse-design pilot, not a root-cause fix.

---

## 5. Prepared Knowledge Working Model

Initial working model for how knowledge flows to an answer:

```
Raw Evidence
→ Prepared Knowledge
→ Intent / Place / Situation / Relationship
→ Required Live Verify
→ Minimum ASK
→ SOUL Answer
```

Working principle:

"Phoenix prepares travel knowledge to the state a local travel expert
would already be ready to judge from.
SOUL handles minimal adjustment, confirmation, and expression
matched to the current traveler's situation."

**This is a Research Hypothesis.**
Not an Architecture Decision.
Not a Candidate.

---

## 6. Reverse-Design Findings

Reverse-design review from "Good SOUL Answer" backward surfaced the following elements as potentially required. This list is exploratory, not exhaustive, and not yet validated.

```
REVERSE-DESIGN CANDIDATE ELEMENTS (HYPOTHESIS)

Answer Priority
  → Which answer does this traveler need most, given their situation?

Question → Knowledge Package Routing
  → How does an incoming question map to the right prepared knowledge block?

Known Conversation Context
  → What has the traveler already told us? What should not be re-asked?

Intent
  → What is the traveler actually trying to do?

Place
  → What specific place or location context applies?

Situation
  → What is the traveler's current state (tired, constrained, flexible)?

Relationship
  → How do relevant places/experiences connect?

Knowledge Usage Boundary / Contract
  → When is prepared knowledge sufficient? When must SOUL verify live?

Live Trigger
  → What conditions require a live check rather than prepared answer?

Verification Playbook
  → What is the verification path for each live-trigger type?

Failure / Conflict Handling
  → What happens when prepared knowledge conflicts with live reality?

Preparation Priority
  → Which knowledge blocks to prepare first given real traveler question frequency?

Negative / Exception Knowledge
  → What specifically SOUL should NOT claim without live verification?

Maintenance / Learning Loop
  → How does prepared knowledge stay current after initial authoring?
```

**Status of this list:** RESEARCH HYPOTHESIS ONLY.
Not approved architecture.
Not an implementation scope.

---

## 7. Prepared Context / Expert Anticipation Alternative Model

An alternative model emerged from reverse-design review ("Antigravity exploration" — deliberate inversion of the initial model).

**Model A — Prepared Knowledge Model**

```
Question
→ Prepared Knowledge retrieval
→ Minimal verify / ask
→ Judgment
→ Answer
```

**Model B — Prepared Context / Expert Anticipation Model**

```
Traveler State
→ Prepared Context
→ Expert Anticipation
→ Question / Event
→ Decision-ready Knowledge
→ Minimal Adjustment / Live Verify
→ SOUL Conversation
```

**Core hypothesis behind Model B:**

"What Phoenix needs to prepare is not completed answers
but the state in which a local expert would already be ready to judge."

**Role-separation hypothesis:**

Phoenix = the prepared expert brain of a local travel specialist
SOUL = the travel-friend who delivers that expertise naturally to the traveler

**Status of both models:** RESEARCH HYPOTHESIS.
Neither is confirmed.
Neither is promoted to Candidate.
The 3-place Pilot is designed to compare them.

---

## 8. Knowledge Source Roles

Working model of how each source contributes to prepared knowledge:

| Source | Role |
|---|---|
| Travel Schedule Corpus | How travelers actually travel — sequence, structure, duration |
| Traveler Question Corpus | What travelers wonder about — frequency, anxiety points, decision moments |
| Official Sources | Factual skeleton — names, hours, fees, policies |
| Maps / Transport Sources | Geography, route, movement time, boarding points |
| World Experience | How real people experience a place — sensory, emotional, practical |
| Local Operator | Current field reality — what has changed, what is stale |
| Founder | Local expert judgment — ground-truth corrections, place philosophy |
| Live Sources | What is actually possible right now — weather, queue, availability |
| Expert Anticipation Knowledge (HYPOTHESIS) | What a skilled local expert would proactively tell a traveler before being asked |

**Expert Anticipation Knowledge** status: HYPOTHESIS / NOT VALIDATED / NOT COLLECTED.

---

## 9. External vs. Phoenix-Owned Boundary

**Working boundary (hypothesis, not decision):**

External systems are better positioned to maintain:
- Maps and routing (real-time)
- Weather
- Volatile operating status (queue, closures, schedule)
- Other time-sensitive live/current facts

Phoenix does not unconditionally replicate or own these.
They are used as grounding/verification sources when needed.

**Phoenix-candidate knowledge to accumulate:**
- Regional travel knowledge
- Experience knowledge
- Relationship knowledge (how places connect for a traveler)
- Friction conditions (what makes a place hard or easy)
- Local expert judgment (current field reality corrections)
- Evidence boundaries (what we know / what requires live check)
- Decision-ready prepared knowledge

**This boundary is a working hypothesis.**
It is validated in the Pilot, not declared in advance.

---

## 10. 3-Place Pilot Scope

Working Pilot scope (not final Yeosu prioritization):

1. 오동도 (Odongdo)
2. 향일암 (Hyangiram)
3. 여수해상케이블카 (Yeosu Maritime Cable Car)

Cable Car already has foundational knowledge assets from prior authoring work. Odongdo and Hyangiram are queued in the place knowledge authoring list.

**Pilot scope interpretation:**
These 3 places are selected to explore the research direction with manageable scope.
They do not represent the final Yeosu knowledge priority order.
They do not lock out other places.
Pilot execution does not begin in this run.

---

## 11. Model A vs. Model B Comparison Objective

The Pilot Protocol (to be designed separately) will compare:

**Model A:** Prepared Knowledge approach
**Model B:** Prepared Context / Expert Anticipation approach

Using: same place / same question / same evidence conditions where possible.

**Potential evaluation dimensions (not yet finalized):**
- Unnecessary ASK frequency
- Live verification call frequency
- Factual / reasoning error rate
- Answer usefulness (subjective, facilitator-assessed)
- Ability to handle novel questions not explicitly prepared for
- Retrieval burden / operational complexity

**Evaluation thresholds and success criteria:**
To be defined in the Pilot Protocol V0.1.
Not invented here.

---

## 12. Explicit Non-Conclusions

| Item | Status |
|---|---|
| Root cause of observed product problem | NOT CONCLUDED |
| Prepared Knowledge Model validated | NOT VALIDATED |
| Prepared Context Model validated | NOT VALIDATED |
| Expert Anticipation Knowledge validated | NOT VALIDATED |
| External/Phoenix boundary decided | NOT DECIDED |
| Model A vs Model B winner | NOT DETERMINED |
| Knowledge source roles finalized | NOT FINALIZED |
| Pilot evaluation criteria | NOT YET DEFINED |
| Yeosu knowledge priority order | NOT FINALIZED |
| Travel Grammar | NOT CONCLUDED |
| Journey Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| New Candidate | NOT CREATED |
| SSOT promotion | NONE |
| Architecture Decision | NONE |

---

## 13. Governance / Prohibited Actions

| Action | Status |
|---|---|
| Collect new Yeosu knowledge | PROHIBITED (this run) |
| Execute 3-place Pilot | PROHIBITED (this run) |
| Modify runtime | PROHIBITED |
| Modify production | PROHIBITED |
| Change DB / schema | PROHIBITED |
| Create place_knowledge migration | NOT APPROVED / HOLD |
| Alter canonical Blind MVP stimuli | PROHIBITED |
| Recruit participants | HOLD |
| Conduct participant sessions | HOLD |
| Generate Participant Evidence | HOLD |
| Assign BT verdict | HOLD |
| Create new Candidate | PROHIBITED (this run) |
| Promote to SSOT | PROHIBITED (this run) |
| Claim any hypothesis as established fact | PROHIBITED |

DreamTown Founder Philosophy Candidate: HOLD
Prepared Travel Knowledge: RESEARCH HYPOTHESIS
Prepared Context: RESEARCH HYPOTHESIS
Expert Anticipation Knowledge: RESEARCH HYPOTHESIS
AI Regional Travel Expert Training Method: RESEARCH HYPOTHESIS

---

## 14. Exact Current Next Action

`Design Prepared Knowledge vs Prepared Context 3-Place Pilot Protocol V0.1 for Odongdo, Hyangiram, and Yeosu Maritime Cable Car, using reverse design from desired SOUL answers to required judgment, prepared knowledge, and evidence; do not yet collect new knowledge, execute the pilot, recruit participants, or create/promote any Candidate.`

---

*SOUL Yeosu Prepared Travel Knowledge Research Direction Handover V0.1 — 2026-09-27*
