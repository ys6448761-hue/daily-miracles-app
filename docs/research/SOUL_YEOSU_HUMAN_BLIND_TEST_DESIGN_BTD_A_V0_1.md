# SOUL Yeosu — Human Blind Test Design BTD-A V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Starting HEAD:** 44726be  
**Status:** BTD_A_DESIGN_STATUS: READY_FOR_EP_A  
**Preconditions:** Founder GO confirmed / HBT HOLD = RELEASED_FOR_PREPARATION / BTD-A NOT_YET_CREATED confirmed  
**Authorized Scope:** Design only — no participant recruitment, no EP-A creation, no HBT execution  

---

## Section 1. Purpose and Research Questions

### 1.1 Primary Research Question

> **"Phoenix가 충분히 준비되었을 때, 사람들은 SOUL의 응답을 실제 여수 현지 여행 전문가와 비슷한 것으로 경험하는가?"**

English reference:
> "When Phoenix is sufficiently prepared, do people experience SOUL's responses as resembling a real local travel expert?"

This question asks about **human experience of the response quality**, not about which model architecture performs best. It is a validation question, not a selection question.

### 1.2 Secondary Research Question

> "동일한 Evidence, 맥락, 한계, 사실 경계 조건에서, 사람들은 Condition A(사후 검색)와 Condition B(사전 활성화) 응답 사이에 의미 있는 차이를 인식하는가?"

English reference:
> "Do people perceive meaningful differences between Condition A and Condition B responses when Evidence, context, limitations, and factual boundaries are held equal?"

This is NOT: "Which model wins?" The study does not predefine a winner. A/B indistinguishability is a valid evidence outcome.

### 1.3 What This Study Establishes

Human Blind Test Evidence can establish:
- Whether SOUL responses are perceived as resembling local travel expertise
- Whether Condition A vs Condition B responses differ in perceived quality dimensions
- The distribution of human preference across scenarios
- Recurring reasons participants prefer or reject a response
- Scenario-specific patterns (e.g., H-2 diagnostic behavior under human observation)

What this study does NOT establish:
- Universal architectural superiority
- Causal mechanism of any preference difference
- Production readiness
- Generalization beyond the 3 pilot places and 9+MT-1 scenarios
- Permission to override Evidence integrity based on participant preference

---

## Section 2. Scope and Preconditions

### 2.1 Authorized Scope

| Item | Status |
|---|---|
| BTD-A design | AUTHORIZED |
| EP-A creation | NOT_YET_AUTHORIZED — separate step |
| DR-B creation | NOT_YET_AUTHORIZED — separate step |
| Participant recruitment | BLOCKED until EP-A complete |
| HBT execution | BLOCKED until DR-B complete |
| New place evidence collection | PROHIBITED |
| DB / schema / runtime changes | PROHIBITED |
| Promotion of any model as production-ready | PROHIBITED |

### 2.2 Preconditions (All Must Be True Before HBT Execution)

| Precondition | Current Status |
|---|---|
| Founder GO confirmed | YES (2026-09-28) |
| HBT HOLD released for preparation | YES (RELEASED_FOR_PREPARATION) |
| BTD-A exists and Founder-reviewed | BTD-A = CREATED (this document) — Founder review pending |
| EP-A exists and complete | NOT_YET_CREATED |
| DR-B completed | NOT_YET_CREATED |
| Pilot Integrity Gate ALL PASS | YES (all 4 dimensions × 2 arms) |
| Response stimuli frozen | BLOCKED until EP-A |
| H-2 stimulus frozen | YES — "부모님 모시고 가도 괜찮을까?" |
| Participant pool identified | BLOCKED until EP-A |

### 2.3 Preserved Invariants

The following invariants carry forward unchanged from Pilot phase:

| Invariant | Status |
|---|---|
| HY-003 | PROVISIONALLY_SUPPORTED — ACCEPT_PROVISIONAL_WITH_BOUNDARY |
| HY-008 | HARD_BLOCKED + TERMINAL_FOR_CURRENT_COLLECTION_PHASE |
| KL-001 (elder descent-friction — must ASK, not infer) | ACTIVE |
| KL-002 (HY-008 Option B — "부모님" insufficient for suitability judgment) | ACTIVE |
| Controlled Collection Cycles | 25 (unchanged) |
| Evidence Pool | 21 PUs (unchanged — no new collection) |

---

## Section 3. Conditions A and B

### 3.1 Condition A — Post-Question Retrieval

**Preparation mechanism:** SOUL selects relevant Prepared Knowledge units AFTER the participant's question is received.

**Participant-facing label:** 응답 가 (or 응답 나 — see Section 10 counterbalancing)

**Characteristics:**
- Knowledge units are identified based on the question received
- Context available at question time (shared visible context) is used
- No pre-activation of knowledge before the question arrives
- Response compiled from Model A Package (V0.1)

### 3.2 Condition B — Pre-Question Activation / Expert Anticipation

**Preparation mechanism:** SOUL pre-activates relevant Prepared Context from legitimately available Traveler State BEFORE the question arrives.

**Participant-facing label:** 응답 나 (or 응답 가 — see Section 10 counterbalancing)

**Characteristics:**
- Knowledge context is pre-loaded based on known Traveler State (e.g., destination = Yeosu, intent = visit specific places)
- Response can reference pre-positioned context proactively
- Same factual Evidence Pool as Condition A — only activation mechanism differs
- Response compiled from Model B Package (V0.1)

### 3.3 What Participants Are Told About the Conditions

Participants are told:
> "두 개의 응답 모두 동일한 여행 질문에 대한 답변입니다. 응답 방식이 조금 다를 수 있습니다. 두 응답을 비교해 주세요."

Participants are NOT told:
- Which is Condition A or B
- What "Prepared Knowledge" or "Prepared Context" means
- That one uses pre-activation vs. post-retrieval
- Internal model architecture terminology
- Pilot results, Integrity Gate results, or Founder expectations

---

## Section 4. Evidence Fairness Contract

### 4.1 Requirement

The Evidence Fairness Contract is a **validity requirement**, not a preference. Both conditions must use:

| Fairness Item | Condition A | Condition B |
|---|---|---|
| Evidence Pool | 21 PUs (V0.1) | 21 PUs (V0.1) — identical |
| Known limitations (KL-001, KL-002) | Active | Active — identical |
| Live-trigger rules | Same frozen state | Same frozen state — identical |
| Factual boundaries | Same per ER | Same per ER — identical |
| Scenario-visible context | Same | Same — identical |
| H-2 stimulus | "부모님 모시고 가도 괜찮을까?" | "부모님 모시고 가도 괜찮을까?" — identical |

### 4.2 What May Differ

Only the preparation and activation mechanism differs between conditions:
- WHEN knowledge is selected (before vs. after question)
- HOW context is positioned (pre-loaded vs. retrieved)

### 4.3 Violation Constitutes Invalidity

If any stimulus pair provides one arm with factual information unavailable to the other arm, the stimulus pair is **invalid and must be discarded** before participant evaluation.

---

## Section 5. Stimulus Architecture

### 5.1 Place Field

Three places from the verified Pilot Evidence Pool:

| Place | place_code | PUs available |
|---|---|---|
| 오동도 (Odongdo) | odongdo | PU-OD-001 through PU-OD-005 (+ REL) |
| 향일암 (Hyangiram) | hyangiram | PU-HY-001 through PU-HY-008 (+ REL) |
| 여수해상케이블카 (Cable Car) | cablecar | PU-CC-001 through PU-CC-006 (+ REL) |

### 5.2 Scenario Families as Stimulus Design Input

| Scenario ID | Place | Type | Question Family |
|---|---|---|---|
| O-1 | Odongdo | Single-turn | "오동도 어떤 곳이에요?" — overview/character |
| O-2 | Odongdo | Single-turn | 방문 시간/체류 시간 planning |
| O-3 | Odongdo | Single-turn | 케이블카 → 오동도 이동/경로 |
| H-1 | Hyangiram | Single-turn | 계단/체력 — "힘들어요?" |
| H-2 | Hyangiram | Single-turn | **Primary diagnostic** — "부모님 모시고 가도 괜찮을까?" |
| H-3 | Hyangiram | Single-turn | 이동 방법 — 차 없는 경우 |
| C-1 | Cable Car | Single-turn | 운영시간/요금 |
| C-2 | Cable Car | Single-turn | 적합성 판단 — 아이/가족 동반 |
| C-3 | Cable Car | Single-turn | 방문 시간대 선택 (낮 vs 야간) |
| MT-1 | Odongdo + Cross-place | Multi-turn | 복합 일정 조율 (multi-turn context retention) |

### 5.3 Stimulus Selection for HBT

**Single-turn stimuli:** All 9 scenarios (O-1 through C-3) are included as candidate stimuli.

**Minimum required per participant:** 5 scenarios (one from each place minimum; H-2 mandatory)

**Full protocol per participant:** All 9 single-turn scenarios (H-2 ALWAYS included — primary diagnostic)

**MT-1 handling:** Included as a separate block. Analysis kept separate from single-turn results.

**H-2 MANDATORY:** H-2 stimulus must appear in EVERY participant session. No participant session is valid without H-2 evaluation.

### 5.4 Visible Context per Stimulus

Each stimulus shows participants:
- The scenario question (Korean)
- Sufficient setting context to make the question understandable:
  - Participant role context (e.g., "여행을 계획 중인 사람")
  - Destination context (여수 방문 예정)
  - Place context (specific place for the scenario)
  - Any additional scenario-specific context (e.g., "차가 없는 상황에서" for H-3)

Intentionally ABSENT from participant view:
- Which arm/condition generated the response
- How the response was prepared
- Pilot scenario labels (O-1, H-2, etc.)
- Any internal research terminology

### 5.5 Stimulus Equivalence Check

Before EP-A freezes final stimuli:
- Both arms must respond to identical question text
- Both arms must have identical context visible
- Both arms must draw from identical Evidence Pool
- One reviewer (not the stimulus author) must confirm equivalence for each scenario pair before freezing

---

## Section 6. H-2 Boundary Contract

### 6.1 H-2 Scenario Definition

**Stimulus (frozen):** "부모님 모시고 가도 괜찮을까?" (향일암 context)

**Source:** HY-008 Governance Decision, Option B approved

### 6.2 Required Response Behavior (Both Arms)

For a response to be considered valid (non-violating) in H-2:

| Requirement | Description |
|---|---|
| ASK triggered | Before any suitability judgment, must ask about mobility/capability |
| ASK type | Capability-based (can they manage stairs?), NOT age/demographic-based |
| No unconditional suitability verdict | May NOT answer "네, 괜찮아요" based on "부모님" label alone |
| "부모님" insufficient | "부모님" alone does not establish mobility capability |
| QUALIFY REGISTER applied | Friction acknowledged + alternatives offered |
| KL-001 compliant | No age-only inference |
| KL-002 compliant | MANDATORY ASK before suitability judgment |

### 6.3 Facilitator Rules for H-2

Facilitators must NOT:
- Explain expected response behavior for H-2 to participants
- Indicate that "asking a question" is the correct behavior
- Express surprise or approval at ASK behavior
- Hint that one arm handles H-2 better

Facilitators MUST:
- Present H-2 stimulus identically to other scenarios
- Note if a participant spontaneously comments on the ASK behavior

### 6.4 H-2 Integrity Failure Clause

If either arm provides a response that:
- Answers "네, 괜찮아요" (or equivalent) without mobility ASK, OR
- Uses "부모님" as sufficient basis for suitability judgment

→ Flag that response as **INTEGRITY_FAILURE** for that arm in that session.
→ Do NOT include that arm's H-2 rating in the primary analysis.
→ Report as a separate INTEGRITY_FAILURE observation.
→ Do NOT invalidate the entire session — evaluate valid arm only.

**Note:** Both arms passed H-2 in the Internal Pilot. This clause addresses the possibility of degradation in HBT stimulus generation.

---

## Section 7. Participant Profile Requirements

### 7.1 Eligibility

| Profile Field | Requirement | Rationale |
|---|---|---|
| 한국어 읽기 가능 | **REQUIRED** | Stimuli and evaluation instrument are in Korean |
| 디지털 메시징/AI 어시스턴트 사용 경험 | **REQUIRED** | Must be able to interpret text-based Q&A format without friction |
| 국내 여행 계획 또는 경험 | **REQUIRED** | Must have a reference for what useful travel guidance feels like |
| 만 18세 이상 | **REQUIRED** | Informed consent capacity |
| 여수 방문 경험 | USEFUL — recruit mix of YES/NO | Allows variation in familiarity without requiring prior knowledge |
| 부모님/어르신 동반 여행 경험 | USEFUL | Relevant to H-2 scenario interpretation |
| 어린이 동반 여행 경험 | USEFUL | Relevant to C-2 scenario interpretation |
| 만 25-65세 연령대 | USEFUL — target but not required | Represents the primary traveler demographic |
| 차량 보유/운전 경험 | USEFUL | Relevant to H-3 and routing scenarios |
| 향일암/오동도/케이블카 방문 경험 | NOT_REQUIRED — useful variation | Experienced visitors can assess accuracy; new visitors assess clarity |
| 여행업 종사자 | NOT_REQUIRED — exclude if possible | Professional evaluators distort the "lay traveler" target experience |

### 7.2 Exclusion Criteria

Do NOT recruit:
- Phoenix/SOUL team members or contributors
- Anyone briefed on the research hypothesis or internal Pilot results
- Anyone who has seen Model A or Model B package content

### 7.3 Demographic Balance Goals (Not Hard Requirements)

When possible, recruit across:
- Gender mix: no hard requirement
- Age: at least one participant in each decile: 20s, 30s, 40s, 50s
- Yeosu familiarity: at least 30% without prior Yeosu visit
- Senior travel: at least 20% with 부모님/어르신 동반 travel experience

---

## Section 8. Sample Size and Stopping Logic

### 8.1 Study Framing

This is an **exploratory human experience study**, not a confirmatory statistical trial. The goal is directional evidence and qualitative signal — not p-value significance thresholds.

### 8.2 Sample Targets

| Level | Count | Purpose |
|---|---|---|
| Minimum useful | 8 participants | Can detect directional patterns in Forced Choice and recurring qualitative themes |
| Target | 16 participants | More reliable frequency distributions; allows scenario-level sub-analysis |
| Extended (if needed) | Up to 24 | Only if target produces conflicting signals requiring clarification |

### 8.3 Stopping Conditions

Stop at target (16) UNLESS any of the following apply:

| Condition | Action |
|---|---|
| Forced Choice split is exactly 50/50 across all 9 scenarios at N=16 | Extend to N=24 to reduce noise |
| High invalid session rate (>25%) at N=16 | Extend and investigate source of invalidity |
| H-2 INTEGRITY_FAILURE flagged in >2 sessions | STOP HBT; convene review before continuing |

### 8.4 Invalid Session Replacement

- Every invalid session is replaced 1:1 with a new participant
- Replacement criteria: same Yeosu familiarity level (YES/NO) as invalidated participant
- Replacement cap: maximum 3 replacements per slot; beyond that, document as limitation

---

## Section 9. Blinding Protocol

### 9.1 Participant-Visible Information

Participants may know:
- They are comparing two text responses to the same travel question
- The responses are from an AI travel assistant called SOUL
- They should evaluate each response as a traveler, not as an AI evaluator

Participants must NOT know:
- Which response is Condition A or Condition B
- What "Prepared Context" or "Prepared Knowledge" means
- That one arm uses pre-question activation
- Internal hypothesis about which arm should perform better
- Pilot results or Integrity Gate outcomes
- Founder expectations
- That H-2 is a "primary diagnostic scenario"

### 9.2 Participant-Facing Labels

Response arms are presented with randomized neutral labels:
- **응답 가** and **응답 나**
- The binding of (Condition A → 응답 가) vs. (Condition A → 응답 나) is counterbalanced per participant per scenario
- Participants never see "Model A," "Model B," "Condition A," "Condition B"

### 9.3 Facilitator Restrictions

Facilitators must NOT:
- Use terms: Model A, Model B, Condition A, Condition B, Prepared Context, Prepared Knowledge, Pilot, Integrity Gate, Phoenix
- Explain WHY responses differ in structure or length
- Express preference for or against any response
- Indicate which response "passed" internal tests
- React to H-2 ASK behavior with approval or disapproval
- Suggest that "asking a question back" is the expected or correct behavior
- Answer participant questions about HOW responses are generated

Facilitators MAY:
- Confirm: "Please read both responses before evaluating"
- Confirm: "All questions about the ratings form are OK to ask"
- Note verbatim participant spontaneous comments

### 9.4 Materials Blinding Verification

Before each session:
- Verify response labels assigned correctly per counterbalancing table
- Verify no Condition A/B labels appear in any participant-facing material
- Verify no internal research terminology appears in stimuli or rating forms
- Sign off on Leakage Check (Section 17)

---

## Section 10. Randomization and Counterbalancing

### 10.1 Within-Participant: Scenario Order

Scenario order is randomized per participant.

Rules:
- H-2 must not always appear first or last (risk: expectation-setting or fatigue)
- O/H/C scenarios should be interspersed, not grouped by place
- A predetermined set of valid orderings (min. 8) is enumerated in EP-A

EP-A will provide a specific scenario order assignment table indexed by participant slot.

### 10.2 Between-Participant: Arm-to-Label Binding

For each participant × scenario combination, the binding of (Condition A → 응답 가) or (Condition A → 응답 나) is assigned using a balanced design:

- Half of participants see Condition A as 응답 가 in any given scenario
- Half see Condition A as 응답 나
- Assignment is orthogonal to scenario order

EP-A will generate the specific assignment table. It must satisfy:
- Each scenario: 50% A=가, 50% A=나 (across participants)
- No participant sees the same arm always on the same side
- Assignment pre-committed before any participant data is collected

### 10.3 MT-1 Counterbalancing

MT-1 uses the same arm-to-label binding logic. MT-1 ordering within session: always after all single-turn scenarios to avoid multi-turn context contamination.

### 10.4 Determinism Requirement

The counterbalancing assignment table must be:
- Fully specified before HBT begins
- Deterministic (same input → same table, reproducibly)
- Committed to EP-A before any participant sees any stimulus

---

## Section 11. Evaluation Instrument

### 11.1 Six Independent Evaluation Dimensions

Each dimension is rated independently on a 1–5 scale. No composite score is produced. No dimension is weighted. No overall winner is calculated.

---

**Dimension 1: 전문성 (Expertise Feel)**

> 이 응답이 여수를 잘 아는 현지 여행 전문가에게서 온 것처럼 느껴지는가?

| Score | Anchor |
|---|---|
| 1 | 전혀 전문가 같지 않다. 일반적이고 막연한 느낌이다 |
| 3 | 어느 정도 전문가 같다. 일부 정보는 구체적이다 |
| 5 | 완전히 전문가 같다. 실제 여수를 잘 아는 사람이 직접 답한 느낌이다 |

---

**Dimension 2: 유용성 (Usefulness)**

> 이 응답이 실제 여행 계획이나 결정에 얼마나 도움이 되는가?

| Score | Anchor |
|---|---|
| 1 | 전혀 도움이 안 된다. 이 응답으로는 아무것도 결정할 수 없다 |
| 3 | 어느 정도 도움이 된다. 일부 정보는 활용할 수 있다 |
| 5 | 매우 도움이 된다. 이 응답만으로 계획하거나 결정할 수 있다 |

---

**Dimension 3: 맥락 적합성 (Contextual Fit)**

> 이 응답이 내가 처한 상황과 질문에 맞게 답하고 있는가?

| Score | Anchor |
|---|---|
| 1 | 내 상황과 전혀 맞지 않는다. 엉뚱한 내용을 답하고 있다 |
| 3 | 어느 정도 맞는다. 일부는 내 상황과 관련 있다 |
| 5 | 내 상황에 딱 맞는다. 내가 처한 상황을 정확히 이해한 것 같다 |

---

**Dimension 4: 신뢰도 (Trust)**

> 이 응답의 내용을 믿을 수 있다고 느껴지는가?

| Score | Anchor |
|---|---|
| 1 | 전혀 믿을 수 없다. 내용이 의심스럽거나 불확실하다 |
| 3 | 어느 정도 믿을 수 있다. 일부 내용은 확실해 보인다 |
| 5 | 완전히 믿을 수 있다. 내용이 신뢰할 만하고 근거가 있어 보인다 |

---

**Dimension 5: 명확성 (Clarity)**

> 이 응답이 이해하기 쉽고 명확하게 전달되는가?

| Score | Anchor |
|---|---|
| 1 | 전혀 명확하지 않다. 이해하기 어렵거나 혼란스럽다 |
| 3 | 어느 정도 명확하다. 대부분 이해할 수 있다 |
| 5 | 매우 명확하다. 쉽게 읽히고 핵심이 잘 전달된다 |

---

**Dimension 6: 자연스러움 (Naturalness)**

> 이 응답이 편안하고 자연스러운 대화처럼 느껴지는가?

| Score | Anchor |
|---|---|
| 1 | 매우 어색하다. 기계적이거나 형식적인 느낌이다 |
| 3 | 어느 정도 자연스럽다. 대화 같기도 하고 아니기도 하다 |
| 5 | 매우 자연스럽다. 마치 사람이 직접 말해주는 것 같다 |

---

### 11.2 Forced Choice

After rating both responses on all six dimensions, participants answer:

> **"두 응답 중 어느 것이 더 실제 여수 현지 전문가에 가까운 느낌을 주었나요?"**
>
> ○ 응답 가  
> ○ 비슷하다 (차이를 느끼지 못하겠다)  
> ○ 응답 나

**Design notes:**
- The neutral "비슷하다" option is included — do NOT force a preference when participants perceive equivalence
- Forced Choice is collected AFTER dimension ratings (not before) to avoid anchoring
- Forced Choice is analyzed descriptively — preference counts and proportions only
- Forced Choice does not determine a "winner" — it is one data point among many

### 11.3 Per-Scenario vs. Overall Evaluation

Each scenario produces:
- Six dimension ratings for 응답 가
- Six dimension ratings for 응답 나
- One Forced Choice (가 / 비슷하다 / 나)

No overall session-level composite rating is produced.

---

## Section 12. Qualitative Feedback Design

### 12.1 Rationale for Inclusion

Qualitative feedback is included as diagnostic support, NOT as primary data. Its purpose is to understand WHY participants prefer or reject a response — information that numeric ratings cannot capture.

### 12.2 Prompts

**Two open-ended prompts per session** (administered after all scenario evaluations are complete):

**Prompt A (Preference Reasoning):**
> "응답을 비교하면서 어느 쪽이 더 낫다고 느낀 순간이 있었다면, 그 이유를 자유롭게 써주세요."

**Prompt B (Discomfort or Concern):**
> "응답을 읽으면서 불편하거나 의심스러웠던 부분이 있었다면 알려주세요."

### 12.3 Administration Rules

- Prompts are open-ended — do NOT provide answer choices or examples
- Facilitators do NOT prompt for specific details (no follow-up questions unless participant asks for clarification about the prompt itself)
- Responses recorded verbatim
- Qualitative data analyzed separately from quantitative ratings (Section 19)

### 12.4 Scope Boundary

Qualitative feedback is for diagnostic understanding. Qualitative preference does NOT override the evaluation instrument ratings. Qualitative themes are reported descriptively — not used to adjudicate Forced Choice results.

---

## Section 13. MT-1 Multi-Turn Design

### 13.1 Inclusion Decision

**MT-1 is included** in the Human Blind Test, as a separate block distinct from single-turn scenarios.

### 13.2 MT-1 Stimulus Design Requirements

MT-1 must involve at least 3 turns, with:
- Turn 1: Initial place/itinerary question
- Turn 2: Follow-up that adds new context (e.g., participant reveals additional constraint or preference)
- Turn 3: Check whether the response correctly retains prior context and adapts to new information

The MT-1 stimulus must be frozen in EP-A. Both arms receive the identical turn sequence.

### 13.3 MT-1 Evaluation Dimensions

MT-1 is evaluated on the same six dimensions as single-turn scenarios. Additionally, MT-1 includes two MT-specific evaluation items:

**MT-specific Item A: 문맥 보존 (Context Retention)**
> "응답이 앞선 대화 내용을 기억하고 반영하고 있는가?"
>
> 1 = 이전 내용을 전혀 기억하지 못하는 것 같다 / 3 = 일부 기억하는 것 같다 / 5 = 이전 내용을 정확히 기억하고 반영한다

**MT-specific Item B: 맥락 적응 (Context Adaptation)**
> "새로운 정보가 주어졌을 때 응답이 그에 맞게 조정되었는가?"
>
> 1 = 새 정보를 무시한다 / 3 = 부분적으로 반영한다 / 5 = 새 정보를 정확히 반영하여 답변이 달라졌다

### 13.4 MT-1 Analysis Separation

MT-1 results are analyzed in a separate section of the DR-B report. MT-1 ratings are NOT merged with single-turn ratings. Forced Choice for MT-1 is collected separately and reported separately.

---

## Section 14. Live Information Control

### 14.1 Risk

Some ERs in the Evidence Pool have VOLATILE or SEMI_STABLE stability classifications (e.g., operating hours, ticket prices, crowd patterns). If these differ between Condition A and Condition B stimulus generation sessions, participants would be evaluating different live states — not the same situation.

### 14.2 Control Mechanism: Frozen State Protocol

All stimuli use a **frozen simulated state** for volatile and semi-stable items:

| Category | Mechanism |
|---|---|
| VOLATILE items (e.g., CC-001 operating hours during special events) | Use the standard operating state documented in PU-CC-005 — not live-checked |
| SEMI_STABLE items (e.g., CC-002 ticket prices) | Use the prices documented in PU-CC-004 + PU-CC-005 — not live-checked |
| STABLE items (distances, physical features, layout) | Use as documented |
| LIVE_BOUNDARY items (weather, crowd) | Both arms explicitly state "당일 날씨/혼잡도는 직접 확인 권장" — identical LIVE_BOUNDARY behavior |

### 14.3 No Live Browsing During HBT

Facilitators and researchers do NOT browse live information during participant sessions. The evaluation is of response behavior given a controlled state — not of the system's ability to retrieve real-time data.

### 14.4 State Documentation

EP-A must document the frozen state used for each VOLATILE/SEMI_STABLE ER before stimulus generation begins. Once documented, the state is fixed for all stimuli in that HBT run.

---

## Section 15. Response Freeze Rule

### 15.1 Freeze Requirement

Once EP-A generates final response stimuli for both Condition A and Condition B:

- **Stimuli are frozen** — no edits permitted after freeze
- **No post-hoc editing** based on expected participant preference
- **No arm-specific factual advantage** introduced after freeze
- **No new place research** permitted between stimulus generation and HBT execution

### 15.2 Freeze Checklist (EP-A responsibility)

Before freeze:
- [ ] Both arms generated from identical Evidence Pool (21 PUs)
- [ ] Both arms generated using identical scenario context
- [ ] Both arms include identical live-state markers for VOLATILE items
- [ ] Stimulus equivalence verified by independent reviewer
- [ ] No Condition A/B labels appear in any stimulus
- [ ] H-2 stimulus identical for both arms

After freeze:
- [ ] Stimuli stored in EP-A as read-only artifacts
- [ ] Version hash or similar identifier recorded
- [ ] No modifications permitted without full EP-A revision and re-review

### 15.3 Integrity of Freeze

If a factual error is discovered in a frozen stimulus after HBT begins:
- STOP that scenario for that session
- Invalidate sessions where the error appeared
- Correct the stimulus and re-freeze
- Resume only after new freeze checklist passes

---

## Section 16. Invalid Session Rules

### 16.1 Invalidation Triggers

A session is **INVALID** if any of the following occur:

| Trigger | Description |
|---|---|
| ARM_IDENTIFIED | Participant correctly identifies which response is Condition A or Condition B |
| MISSING_STIMULUS | Scenario stimulus was not shown or was shown incompletely |
| WRONG_STIMULUS | Wrong scenario or context shown for a given slot |
| DUPLICATE_ARM | Same arm (A or B) was shown on both sides of a comparison |
| FACILITATOR_REVEAL | Facilitator materially explains one arm's approach or expected outcome |
| INCOMPLETE_EVALUATION | Participant did not complete Forced Choice for H-2 (mandatory) |
| TECHNICAL_FAILURE | Technical failure prevented both responses from being visible simultaneously |

### 16.2 Non-Invalidation Clause

A session is **NOT invalid** due to:
- Participant rating one arm consistently lower than the other
- Participant expressing confusion about SOUL's approach
- Participant producing unexpected Forced Choice results
- Participant choosing 비슷하다 for all scenarios
- Results conflicting with internal Pilot findings

Unfavorable ratings are valid data. Do NOT discard sessions based on research-unfriendly outcomes.

### 16.3 Partial Invalidity

If H-2 is invalid (per Section 6.4 INTEGRITY_FAILURE) but other scenarios are valid:
- Mark H-2 as EXCLUDED for that participant
- Retain all other scenario ratings
- Replacement rule applies only to H-2 replacement participant, not full session

---

## Section 17. Leakage Control

### 17.1 Pre-Session Leakage Check

Before each session begins, the facilitator verifies:

| Item | Check |
|---|---|
| Response labels | 응답 가 / 응답 나 only — no A/B, Condition, Model terminology |
| Stimulus content | No internal terminology (Prepared Knowledge, Prepared Context, Evidence Pool, Pilot) |
| Rating form | No reference to expected outcomes, Pilot results, or Integrity Gate |
| Facilitator script | No arm-advantage language; no hypothesis confirmation language |
| Session materials | No Pilot results, Integrity Gate results, or Founder expectations visible |
| Briefing script | Uses only participant-appropriate language (see Section 9) |

### 17.2 Leakage Sources to Monitor

| Source | Risk | Control |
|---|---|---|
| Response length difference | Participants may infer which is "more prepared" from length | Both arms targets comparable length per scenario |
| Structural similarity to participant's prior SOUL interaction | Participant recognizes Condition B pre-activation pattern | Confirmed none of participants has prior SOUL access |
| Facilitator tone | Facilitator body language or phrasing cues preference | Standardized facilitator script in EP-A |
| Response header/metadata | Accidental label exposure | Stimulus generation review in freeze checklist |

### 17.3 Post-Session Check

After each session:
- Confirm no arm identity leak reported
- Record any participant spontaneous comments about "how the response was made"
- If ARM_IDENTIFIED: invalidate and investigate source

---

## Section 18. Analysis Plan (Pre-Registered)

This analysis plan is pre-registered — it must be applied as-is to participant data. No metrics may be added or changed after participant data collection begins.

### 18.1 Forced Choice Analysis

- Report absolute counts (N prefer 가, N prefer 비슷하다, N prefer 나)
- Report proportions (% per choice)
- Report per scenario
- Do NOT calculate an overall session winner
- Do NOT apply statistical significance testing to the primary report (exploratory study framing)

### 18.2 Six Dimensions Analysis

- Report mean and range for each dimension independently
- Report per scenario per arm
- Do NOT create composite score across dimensions
- Do NOT weight or average dimensions
- Do NOT produce overall "arm winner" from dimension scores

If exploratory comparison is desired: report dimension-level differences descriptively (e.g., "Condition B rated higher on Expertise Feel in O-1 — mean 4.2 vs 3.6"). Label as DESCRIPTIVE, not CONFIRMATORY.

### 18.3 Qualitative Analysis

- Code recurring themes from Prompt A responses (Preference Reasoning)
- Code recurring concerns from Prompt B responses (Discomfort/Concern)
- Report top themes descriptively
- Do NOT use qualitative coding to adjudicate Forced Choice
- Do NOT include qualitative content in dimension score calculations

### 18.4 Scenario-Level Analysis

- Report Forced Choice and dimension ratings separately for each of the 9 scenarios + MT-1
- Identify scenarios where one arm consistently outperforms the other vs. scenarios where arms are equivalent
- Highlight H-2 results in a dedicated subsection (primary diagnostic)

### 18.5 Single-Turn vs. MT-1 Separation

MT-1 results are always in a separate analysis section. MT-1 ratings are never averaged with single-turn ratings. MT-specific items (Context Retention, Context Adaptation) are reported separately.

### 18.6 Invalid Sessions

Invalid sessions are documented but not included in analysis. Replacement sessions are treated identically to original participants.

---

## Section 19. Interpretation Boundaries (Pre-Registered)

These interpretation rules are pre-registered. They apply regardless of how participant data distributes.

| Situation | Interpretation Rule |
|---|---|
| Condition B receives more Forced Choice preference across most scenarios | Record as directional preference evidence — NOT as "Model B is definitively superior" |
| Condition B preference co-occurs with repeated "너무 많은 정보" qualitative feedback | Record as tradeoff: richness vs. information load — NOT as simple victory |
| Condition A and Condition B are indistinguishable (Forced Choice ≈ 50% / dimensions ≈ equal) | This is **valid evidence**: preparation mechanism differences are not perceptible to travelers under these conditions |
| Participant preference conflicts with evidence integrity boundaries | Integrity boundaries are **non-negotiable** — do NOT use participant preference to justify violating Evidence |
| Participants prefer responses that express false certainty (e.g., unconditional H-2 answer) | Do NOT treat this as permission to remove ASK behavior — document as qualitative tension |
| H-2 preference data conflicts with KL-001/KL-002 requirements | KL-001/KL-002 requirements override participant preference |
| Dimension scores disagree with Forced Choice | Both are valid data — report descriptively, do not reconcile artificially |

**Core principle:** Human preference does not override factual integrity. Evidence boundary compliance is a non-negotiable baseline, not a tradeoff to be optimized by participant preference.

---

## Section 20. Participant Evidence and Verdict Boundary

### 20.1 Current Status (as of BTD-A creation)

| Item | Status |
|---|---|
| Participant Evidence | NONE |
| BT Verdict | NOT_ASSIGNED |
| Human Blind Test Execution | BLOCKED (EP-A + DR-B prerequisites) |
| Sessions Completed | 0 |

### 20.2 What "BT Verdict" Can Eventually Designate

After actual participant sessions are complete, the BT Verdict may be assigned as one of:

| Possible Verdict | Meaning |
|---|---|
| PREFERRED_B | Condition B received consistent Forced Choice preference (>60%) across most scenarios with supporting dimension evidence |
| PREFERRED_A | Condition A received consistent Forced Choice preference (>60%) across most scenarios |
| EQUIVALENT | A and B indistinguishable across most scenarios (Forced Choice ≈ 50/비슷하다 dominant) |
| SCENARIO_DEPENDENT | Strong scenario-specific patterns — no overall preference direction |
| INCONCLUSIVE | Insufficient sessions, excessive invalidity, or conflicting signals |

**Important:** BT Verdict does NOT automatically translate to architecture selection. It is one input among research evidence for future decisions.

### 20.3 What Cannot Be Done Before Actual Sessions

No verdict, directional claim, or preference statement may be issued based on:
- Internal Pilot results alone
- Integrity Gate results alone
- Founder expectation
- Model B richness advantage observed in Pilot

BT Verdict must wait for actual participant evidence.

---

## Section 21. EP-A Requirements

EP-A (Execution Package) must contain or specify:

| Requirement | Description |
|---|---|
| Stimulus generation procedure | Step-by-step procedure for generating frozen Condition A and Condition B responses for all 9 scenarios + MT-1 |
| Frozen stimulus artifacts | Complete frozen response pairs for all scenarios |
| Equivalence review evidence | Independent reviewer confirmation that each scenario pair uses identical context, Evidence Pool, and limitations |
| Counterbalancing assignment table | Arm-to-label binding for each participant slot × scenario combination |
| Scenario order assignment table | Randomized scenario order per participant slot |
| Participant briefing script | Verbatim participant-facing language for session introduction |
| Rating form | Korean-language instrument with 6 dimensions + Forced Choice + 2 qualitative prompts |
| Facilitator script | Step-by-step session facilitation instructions with prohibited language list |
| Session recording template | Fields for: participant ID, session date, scenario results, invalidity flags, qualitative verbatims |
| Invalid session procedure | Exact steps when invalidation trigger is detected |
| Leakage check form | Pre-session checklist (Section 17) |
| Frozen state documentation | Documented volatile/semi-stable values used for each relevant ER |
| H-2 integrity failure procedure | Steps if H-2 arm fails boundary contract |
| Replacement session assignment | How invalid sessions are replaced without disrupting counterbalancing |

---

## Section 22. DR-B Requirements

DR-B (Facilitator Dry Run) must verify:

| Requirement | Description |
|---|---|
| Facilitator readiness | Facilitator can deliver briefing script fluently without prohibited language |
| Leakage check | Dry run confirms no arm identity or internal terminology leaks in any material |
| Counterbalancing verification | Dry run confirms assignment table produces correct arm-to-label binding for sample participant slots |
| Stimulus display | Both responses display correctly and simultaneously for participant comparison |
| Rating form | Rating form is navigable without facilitator assistance |
| MT-1 flow | MT-1 multi-turn sequence flows correctly across turns |
| Invalid session procedure | Facilitator can correctly identify and execute invalidation response |
| H-2 boundary enforcement | Facilitator can correctly flag H-2 INTEGRITY_FAILURE without expressing surprise or preference |
| Timing calibration | Dry run confirms session can be completed within target time (estimated: 60–90 min for 9 scenarios + MT-1) |
| End-to-end rehearsal | At least one complete end-to-end dry run with an internal (non-participant) person acting as participant |

DR-B does NOT require actual participants. Internal team members acting as stand-ins is acceptable.

---

## Section 23. Design Self-Review Results

| Question | Assessment |
|---|---|
| Can EP-A be created without inventing study logic? | YES — BTD-A specifies all design decisions EP-A needs to implement |
| Can DR-B test the procedure without redesigning it? | YES — DR-B verifies implementation, not design |
| Can two different operators run the same study using only BTD-A + EP-A? | YES — provided they follow EP-A facilitator script |
| Are participant instructions blind? | YES — Section 3.3 and Section 9.1 explicitly define blind boundaries |
| Are six dimensions understandable in Korean? | YES — each has Korean label, one-sentence meaning, and 3 anchors |
| Are dimensions sufficiently distinct? | YES — Expertise Feel / Usefulness / Contextual Fit / Trust / Clarity / Naturalness cover different evaluation axes with minimal overlap |
| Is Forced Choice unambiguous? | YES — three clear options with neutral "비슷하다" to prevent forced preference |
| Is A/B ordering counterbalanced? | YES — Section 10 specifies between-participant balanced binding |
| Are invalid session rules objective? | YES — Section 16 uses observable conditions, not result-based criteria |
| Is H-2 boundary enforceable? | YES — Section 6.4 specifies exact failure criteria and response procedure |
| Are integrity constraints preserved? | YES — Sections 6, 15, 19 all preserve Evidence boundary as non-negotiable |
| Can participant evidence be analyzed without post-hoc metric invention? | YES — Section 18 pre-registers all analysis metrics |

**BTD_A_DESIGN_STATUS: READY_FOR_EP_A**

---

## Section 24. Explicit Non-Actions

The following actions are explicitly NOT taken in BTD-A:

| Non-Action | Status |
|---|---|
| EP-A creation | NOT DONE — separate step |
| DR-B creation | NOT DONE — separate step |
| Participant recruitment | NOT DONE — BLOCKED |
| HBT execution | NOT DONE — BLOCKED |
| New evidence collection | NOT DONE — PROHIBITED |
| Web research | NOT DONE — PROHIBITED |
| DB / schema / runtime changes | NOT DONE — PROHIBITED |
| Response stimuli generation or freezing | NOT DONE — EP-A responsibility |
| Participant assignment | NOT DONE — EP-A responsibility |
| BT Verdict assignment | NOT DONE — requires actual sessions |
| Promotion of any architecture as winner | NOT DONE — requires BT Verdict |
| Modification of Pilot artifacts | NOT DONE — Pilot = CLOSED |
| Modification of Integrity Gate artifacts | NOT DONE — Gate = CLOSED |
| HY-003 re-evaluation | NOT DONE — unchanged: PROVISIONALLY_SUPPORTED |
| HY-008 reopen | NOT DONE — unchanged: HARD_BLOCKED, R1-R5 INACTIVE |
| KL-001/KL-002 modification | NOT DONE — preserved as active |

---

## Audit Checklist

| ID | Item | Status |
|---|---|---|
| A | Actual HEAD recorded (not assumed from prompt) | PASS — 44726be verified from git |
| B | Project State read first | PASS |
| C | Repository absence of prior BTD-A respected | PASS — confirmed NOT_YET_CREATED |
| D | No invented historical BTD-A | PASS |
| E | Founder GO preserved | PASS |
| F | HBT RELEASED_FOR_PREPARATION preserved | PASS |
| G | Research question defined | PASS |
| H | A/B conditions defined | PASS |
| I | Evidence fairness defined | PASS |
| J | Stimulus architecture defined | PASS |
| K | H-2 boundary defined | PASS |
| L | Participant profiles defined | PASS |
| M | Sample/stopping logic defined | PASS |
| N | Blinding defined | PASS |
| O | Randomization defined | PASS |
| P | Exactly six independent dimensions | PASS — 전문성/유용성/맥락 적합성/신뢰도/명확성/자연스러움 |
| Q | Forced Choice defined | PASS |
| R | No composite score | PASS |
| S | Qualitative feedback bounded | PASS — 2 prompts only |
| T | MT-1 separately handled | PASS |
| U | Live control defined | PASS |
| V | Response freeze rule defined | PASS |
| W | Invalid-session rules defined | PASS |
| X | Leakage rules defined | PASS |
| Y | Analysis pre-registered | PASS |
| Z | Interpretation boundaries defined | PASS |
| AA | Participant Evidence remains NONE | PASS |
| AB | BT Verdict remains NOT_ASSIGNED | PASS |
| AC | EP-A not created | PASS |
| AD | DR-B not created | PASS |
| AE | No recruitment/session | PASS |
| AF | No new Evidence/web research | PASS |
| AG | No Candidate/Architecture Decision | PASS |
| AH | No schema/runtime/prod change | PASS |
| AI | Project State updated | PENDING — to be done in this run |
| AJ | Exactly one Next Action | PASS — Create EP-A |
| AK | Next Action not executed | PASS |
| AL | Git diff inspected | PENDING |
| AM | Commit pushed | PENDING |
| AN | Local + remote HEAD verified | PENDING |

---

## ONE NEXT ACTION

**BTD_A_DESIGN_STATUS: READY_FOR_EP_A**

**ONE NEXT ACTION:** Create EP-A — Human Blind Test Execution Package V0.1

EP-A scope: stimulus generation procedure / frozen response artifacts for all 9 scenarios + MT-1 / participant assignment table / counterbalancing assignment table / facilitator script / rating form (Korean) / leakage check form / session recording template / invalid session procedure / frozen live state documentation

**Do NOT execute HBT. Do NOT recruit participants. Do NOT create DR-B in the same run as EP-A.**
