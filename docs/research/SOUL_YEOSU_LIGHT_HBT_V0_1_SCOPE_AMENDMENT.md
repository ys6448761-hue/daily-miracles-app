# SOUL Yeosu — Light HBT V0.1 Scope Amendment
# 2026-09-28

**Branch:** staging/storybook-c7a  
**Status:** CREATED  
**Authority:** Founder decision — simplify first Human Blind Test  
**Constraint:** Production / runtime / DB 변경 금지

---

## 1. Founding Decision

Founder has decided to replace the full Deep HBT (BTD-A/EP-A/DR-B) with a lighter first
validation step. The Deep HBT artifacts are preserved as reference for later use if Light HBT
evidence justifies deeper evaluation.

**Rationale:** Minimum validation first. Test whether people perceive a meaningful difference
before investing in a full 6-dimension, 9-scenario, 60–80 minute study.

---

## 2. Light HBT Research Question

**PRIMARY RESEARCH QUESTION:**

> "사람은 SOUL의 준비된 여행 응답에서 의미 있는 차이를 인식하는가?"
>
> (Does a person perceive a meaningful difference in SOUL's prepared travel response?)

This is simpler than the Deep HBT question (which also asked about local-expert resemblance
and Condition A vs B comparison). Light HBT asks only: is there a perceptible difference?

---

## 3. Light HBT Parameters

| Parameter | Value |
|---|---|
| Expected duration | ~10 minutes per participant |
| Initial participants | 8 |
| Scenarios per participant | Exactly 2 |
| Comparison format | Blinded A/B response pair |
| Participant-facing labels | 응답 가 / 응답 나 |

### Participant Questions (exactly 2 per scenario comparison)

**Q1 — Forced Choice:**
"어느 답변이 실제 여행에서 더 도움이 될 것 같나요?"
→ ○ 응답 가 / ○ 비슷하다 / ○ 응답 나

**Q2 — Qualitative:**
"왜 그렇게 느끼셨나요?"
→ Short free-text or verbal reason (1–3 sentences)

No other questions. No 6-dimension ratings. No MT-1.

---

## 4. Light HBT vs Deep HBT Comparison

### Removed from Light HBT (preserved in Deep HBT design — BTD-A/EP-A/DR-B)

- Six independent 1–5 evaluation dimensions (전문성/유용성/맥락적합성/신뢰도/명확성/자연스러움)
- All 9 scenarios per participant
- MT-1 multi-turn comparison
- Long qualitative questionnaire (Prompt A + Prompt B extended)
- 60–80 minute session structure
- Extended participant profile/survey burden

### Preserved in Light HBT

- A/B blinding — participant sees 응답 가 / 응답 나 only; Condition A/B identity never revealed
- Same Evidence Pool per scenario for both arms
- Same factual/integrity boundaries (no unsupported claims in either arm)
- Deterministic counterbalancing (A not always first)
- H-2 safety boundary if H-2 is included in scenario selection
- No unsupported factual claims in either arm
- Participant preference does not override factual integrity

---

## 5. Scenario Selection and Assignment Design

### Scenario Selection (4 scenarios from 9)

Selected scenarios for Light HBT:

| Scenario | Place | Type | Justification |
|---|---|---|---|
| **O-1** | 오동도 | Basic orientation / logistics | Covers most common Yeosu visitor question |
| **O-2** | 오동도 | Family/stroller accessibility | Covers family-oriented dimension |
| **H-1** | 향일암 | Basic orientation / access | Covers different place type |
| **H-3** | 향일암 | Logistics / timing | Covers planning dimension; avoids H-2 complexity in ~10 min session |

**H-2 disposition:** H-2 (elder suitability) is excluded from Light HBT because:
- The H-2 boundary contract (capability ASK before suitability judgment) requires careful
  facilitator attention that adds operational overhead disproportionate to a ~10 min session
- KL-001/KL-002 active constraints add nuance that is better tested in Deep HBT
- H-2 remains reserved for Deep HBT where its diagnostic value can be fully exercised

Coverage: 2 place types (오동도, 향일암), 4 distinct scenario types (basic/family/access/logistics).

### P01–P08 Assignment Table

Counterbalancing: odd participants → Condition A appears as 응답 나; even participants → Condition A appears as 응답 가.

| Participant | Scenario 1 | Scenario 2 | A appears as |
|---|---|---|---|
| P01 | O-1 | H-1 | 응답 나 |
| P02 | O-2 | H-3 | 응답 가 |
| P03 | H-1 | O-2 | 응답 나 |
| P04 | H-3 | O-1 | 응답 가 |
| P05 | O-1 | H-3 | 응답 나 |
| P06 | O-2 | H-1 | 응답 가 |
| P07 | H-1 | O-1 | 응답 나 |
| P08 | H-3 | O-2 | 응답 가 |

**Validation:**

Arm-to-label balance: A=나 for P01/03/05/07 (4/8 = 50%); A=가 for P02/04/06/08 (4/8 = 50%). ✓

Scenario coverage across 8 participants:
- O-1: appears in P01(S1), P04(S2), P05(S1), P07(S2) = 4 times ✓
- O-2: appears in P02(S1), P03(S2), P06(S1), P08(S2) = 4 times ✓
- H-1: appears in P01(S2), P03(S1), P06(S2), P07(S1) = 4 times ✓
- H-3: appears in P02(S2), P04(S1), P05(S2), P08(S1) = 4 times ✓

Each scenario appears in exactly 4 participant assignments (≥2 required). ✓  
No operator choice required — assignment is fully deterministic from participant ID. ✓

---

## 6. DR-B-M-001~007 Re-evaluation for Light HBT

| Issue | Description | Light HBT Classification | Rationale |
|---|---|---|---|
| DR-B-M-001 | Stimulus presentation format | **STILL_REQUIRED_FOR_LIGHT_HBT** | Light HBT still shows A/B response pairs; format must be consistent across participants |
| DR-B-M-002 | "서로 다른 AI인가요?" clarification | **STILL_REQUIRED_FOR_LIGHT_HBT** | Participants may still ask this regardless of session length |
| DR-B-M-003 | "장소를 잘 모른다" clarification | **STILL_REQUIRED_FOR_LIGHT_HBT** | Participants may not know 오동도/향일암; Q1 asks about helpfulness for travel, not place knowledge |
| DR-B-M-004 | Single-dimension missing rating | **NOT_APPLICABLE_TO_LIGHT_HBT** | Light HBT has no 6-dimension scale; Q1 is a single Forced Choice (if skipped = INCOMPLETE); Q2 is optional |
| DR-B-M-005 | Session break protocol | **NOT_APPLICABLE_TO_LIGHT_HBT** | ~10 min session; break not operationally relevant; accessibility break always permitted informally |
| DR-B-M-006 | MT-1 incomplete trigger | **NOT_APPLICABLE_TO_LIGHT_HBT** | Light HBT has no MT-1 |
| DR-B-M-007 | ASSIGN_ERR severity | **STILL_REQUIRED_FOR_LIGHT_HBT** | Assignment errors can still occur; severity and handling must be defined |

**STILL_REQUIRED for Light HBT:** DR-B-M-001, DR-B-M-002, DR-B-M-003, DR-B-M-007 (4 items)  
**NOT_APPLICABLE to Light HBT:** DR-B-M-004, DR-B-M-005, DR-B-M-006 (3 items)  
**DEFERRED to Deep HBT:** None (all Not_Applicable items are simply irrelevant to Light HBT scope)

---

## 7. Existing Artifacts Status

| Artifact | Status | Classification |
|---|---|---|
| BTD-A V0.1 | PRESERVED | Deep HBT Design Reference — not executed unless Light HBT evidence justifies |
| EP-A V0.1 | PRESERVED | Deep HBT Execution Package Reference — not executed unless Deep HBT authorized |
| DR-B V0.1 | PRESERVED | Deep HBT Dry Run Reference — operability findings remain valid for Deep HBT |
| Recruitment Protocol V0.1 | PRESERVED | Valid for Light HBT — participant profile requirements and channels still apply |
| Founder Contact Decision V0.1 | PRESERVED | GO remains in effect for Light HBT contact |

---

## 8. Light HBT Execution Package Requirements

The Light HBT Execution Package (to be created in next run) must contain:

1. Exact 4-scenario selection with justification (confirmed: O-1, O-2, H-1, H-3)
2. Frozen scenario contexts — participant-visible question/context for each of 4 scenarios
3. Stimulus generation procedure — A/B response pair per scenario (same Evidence Pool, same limitations)
4. Pre-session integrity checklist (simplified): factual grounding / evidence boundary / blinding / A/B fairness
5. Deterministic counterbalancing table (P01–P08) — confirmed in Section 5 above
6. Facilitator script (~10 min version, 2 scenarios only)
7. Clarification rules for DR-B-M-001, 002, 003, 007 (4 STILL_REQUIRED items)
8. Stimulus presentation format specification (resolves DR-B-M-001)
9. ASSIGN_ERR severity and handling (resolves DR-B-M-007)
10. Simplified data capture template:
    `P_ID / Session_Date / Scenario_ID / Arm_GA (researcher) / Arm_NA (researcher) / FC_GA_choice / FC_NA_choice / Reason_GA (verbatim) / Reason_NA (verbatim) / Validity / Issue_Flag`
11. Invalid session rules (simplified — ARM_IDENTIFIED / WRONG_STIMULUS / FACILITATOR_REVEAL / TECHNICAL_FAILURE / INCOMPLETE_Q1)
12. Compensation placeholder — do not promise until Founder decides

---

## 9. Contact Authorization Status

| Status | Value |
|---|---|
| FOUNDER_PARTICIPANT_CONTACT_DECISION | GO (preserved) |
| CONTACT_AUTHORIZATION | GO (preserved) |
| SESSION_EXECUTION_AUTHORIZATION | BLOCKED (until Light HBT Execution Package validated) |
| RECRUITMENT_CONTACT_READINESS | AUTHORIZED (preserved) |
| HBT_SESSION_READINESS | BLOCKED_LIGHT_HBT_PACKAGE_NOT_CREATED |

---

## 10. Session Execution Gate

`HBT_SESSION_READINESS = BLOCKED_LIGHT_HBT_PACKAGE_NOT_CREATED`

Real participant sessions may not begin until:
1. Light HBT Execution Package V0.1 created
2. DR-B-M-001/002/003/007 resolved within the package
3. Package validated (internal review)
4. Compensation decision made (before session scheduling confirmation)

---

## 11. Participant Evidence / BT Verdict Boundary

| Status | Value |
|---|---|
| Participant Evidence | NONE |
| BT Verdict | NOT_ASSIGNED |
| HBT Executed | FALSE |

These remain unchanged. No data collected in this run.

---

## 12. ONE NEXT ACTION

Create **Light HBT V0.1 Execution Package** — including:
- Frozen scenario contexts for O-1, O-2, H-1, H-3
- Stimulus generation procedure and integrity checklist
- Facilitator script (~10 min)
- Clarification rules resolving DR-B-M-001/002/003/007
- Simplified data capture template
- Invalid session rules

Do NOT execute sessions. Do NOT contact participants.

---

## 13. Explicit Non-Actions

This run did NOT:
- Contact any participant
- Publish recruitment
- Schedule any session
- Collect personal information
- Collect Participant Evidence
- Execute Human Blind Test
- Assign BT Verdict
- Delete BTD-A, EP-A, or DR-B
- Modify EP-A or BTD-A
- Conduct web research
- Collect new place Evidence
- Create Architecture Decision or Candidate
- Change DB / schema / runtime / production
