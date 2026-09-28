# SOUL Yeosu — Human Blind Test Execution Package EP-A V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Starting HEAD:** 42466e6  
**Status:** EP_A_STATUS: READY_FOR_DR_B  
**Authority:** BTD-A V0.1 (SOUL_YEOSU_HUMAN_BLIND_TEST_DESIGN_BTD_A_V0_1.md)  
**Authorized Scope:** Execution-package preparation only — no participant recruitment, no DR-B execution, no HBT execution  

---

## EP-A ROLE

EP-A answers: **"How does an operator execute BTD-A exactly, without inventing experimental procedure during sessions?"**

BTD-A is the design authority. EP-A must NOT introduce new: research questions / evaluation dimensions / scenarios / interpretation rules / Evidence / hypotheses.

If EP-A conflicts with BTD-A: **BTD-A wins.**

---

## Section 0. BTD-A Contract Freeze

### 0.1 Primary Research Question (Frozen — Exact BTD-A Wording)

> **"Phoenix가 충분히 준비되었을 때, 사람들은 SOUL의 응답을 실제 여수 현지 여행 전문가와 비슷한 것으로 경험하는가?"**

### 0.2 Secondary Research Question (Frozen)

> "동일한 Evidence, 맥락, 한계, 사실 경계 조건에서, 사람들은 Condition A(사후 검색)와 Condition B(사전 활성화) 응답 사이에 의미 있는 차이를 인식하는가?"

This is NOT: "Which model wins?" A/B indistinguishability is a valid evidence outcome.

### 0.3 Conditions (Frozen)

| Condition | Mechanism | Participant-Facing Label |
|---|---|---|
| A | Prepared Knowledge selected AFTER question received | 응답 가 or 응답 나 (per counterbalancing) |
| B | Prepared Context pre-activated from Traveler State BEFORE question arrives | 응답 나 or 응답 가 (per counterbalancing) |

Participants see only: 응답 가 / 응답 나. Never: "Condition A," "Condition B," "Model A/B," "Prepared," "Context."

### 0.4 Evidence Fairness Contract (Non-Negotiable)

| Item | Condition A | Condition B |
|---|---|---|
| Evidence Pool | 21 PUs (V0.1) | 21 PUs (V0.1) — identical |
| Known Limitations | KL-001, KL-002 active | KL-001, KL-002 active — identical |
| Live-trigger rules | Same frozen state | Same frozen state — identical |
| Factual boundaries | Same per ER | Same per ER — identical |
| Scenario-visible context | Same | Same — identical |

Violation = stimulus pair invalid. Do not expose to participants.

---

## Section 1. Stimulus Set Operationalization

### 1.1 Single-Turn Scenarios (9 total)

Each scenario defines: participant-visible question/context, Evidence Pool reference, known limitations required in both arms, and any special contract (H-2 only).

---

**SCENARIO O-1 — Odongdo Overview**

| Field | Value |
|---|---|
| Scenario ID | O-1 |
| Place | 오동도 (Odongdo) |
| Participant-visible context | "여수 여행을 계획하고 있어요. 오동도가 어떤 곳인지 알고 싶어요." |
| Condition A contract | Select PUs after receiving this question: PU-OD-001, PU-OD-006. Post-question retrieval only. |
| Condition B contract | Pre-activate ODONGDO_FULL context block before question. Response draws from pre-positioned PU-OD-001 + PU-OD-006. |
| Evidence Pool | PU-OD-001, PU-OD-006 |
| Known limitations required | Operating hours of sub-facilities (등대, 분수) are SEMI_STABLE — both arms must note "방문 전 확인 권장" for time-sensitive sub-facilities |
| H-2 contract | N/A |

---

**SCENARIO O-2 — Visit Duration Planning**

| Field | Value |
|---|---|
| Scenario ID | O-2 |
| Place | 오동도 (Odongdo) |
| Participant-visible context | "오동도에서 얼마나 시간을 잡아야 할까요? 사진도 찍고 여유 있게 보고 싶어요." |
| Condition A contract | Select PUs after question: PU-OD-002 primary, PU-OD-003 supporting (열차 option). Post-question only. |
| Condition B contract | Pre-activate ODONGDO_FULL; response draws from PU-OD-002 + PU-OD-003 with visitor-profile framing. |
| Evidence Pool | PU-OD-002, PU-OD-003 |
| Known limitations required | Visit duration varies by purpose (빠른 경유 vs 사진/산책); both arms must express range, not single number |
| H-2 contract | N/A |

---

**SCENARIO O-3 — Cable Car to Odongdo Route**

| Field | Value |
|---|---|
| Scenario ID | O-3 |
| Place | 오동도 + 케이블카 (cross-place) |
| Participant-visible context | "케이블카 타고 나서 오동도도 가려는데, 어떻게 이동하면 되나요?" |
| Condition A contract | Select PUs after question: PU-REL-001, PU-REL-002, PU-CC-001. Post-question only. |
| Condition B contract | Pre-activate ODONGDO_FULL + CABLECAR_FULL + REL_CONTEXT; response uses directional geography to explain connection. |
| Evidence Pool | PU-REL-001, PU-REL-002, PU-CC-001, PU-CC-002 |
| Known limitations required | Dolsan-side exit requires major detour; both arms must note this negative knowledge (PU-REL-002). |
| H-2 contract | N/A |

---

**SCENARIO H-1 — Hyangiram Physical Exertion**

| Field | Value |
|---|---|
| Scenario ID | H-1 |
| Place | 향일암 (Hyangiram) |
| Participant-visible context | "향일암 올라가는 게 많이 힘들어요? 체력이 많이 필요한가요?" |
| Condition A contract | Select PUs after question: PU-HY-001 (access structure), PU-HY-002 (experiential burden), PU-HY-004 (rest stops). |
| Condition B contract | Pre-activate HYANGIRAM_FULL; uses pre-positioned PU-HY-001 + PU-HY-002 + PU-HY-004 to frame burden with path options. |
| Evidence Pool | PU-HY-001, PU-HY-002, PU-HY-004 |
| Known limitations required | KL-001: elder-specific descent friction NOT ESTABLISHED. Both arms may describe general burden but may NOT make elder-specific descent difficulty claims. Both arms must mention 평지길 option. |
| H-2 contract | N/A |

---

**SCENARIO H-2 — Parent Suitability (PRIMARY DIAGNOSTIC — MANDATORY)**

| Field | Value |
|---|---|
| Scenario ID | H-2 |
| Place | 향일암 (Hyangiram) |
| Participant-visible context | "향일암에 부모님 모시고 가도 괜찮을까요?" |
| Condition A contract | Select PUs after question: PU-HY-003 (suitability frame — H-2 specific). Must trigger ASK before any suitability judgment. |
| Condition B contract | Pre-activate HYANGIRAM_FULL including PU-HY-003 MANDATORY_ASK_TRIGGER. Pre-activation must include the ASK requirement — not infer suitability from "부모님." |
| Evidence Pool | PU-HY-001, PU-HY-002, PU-HY-003, PU-HY-004, PU-HY-005 |
| Known limitations required | KL-001: descent friction pattern NOT ESTABLISHED. KL-002: "부모님" ≠ mobility evidence. Both arms MUST ask capability before suitability judgment. |
| H-2 contract | **MANDATORY:** Both arms must ask at minimum one mobility/capability question before any suitability guidance. Example: "평소 계단 오르내리기 불편하신 부분 있으세요?" or equivalent. Neither arm may say "네, 괜찮아요" or equivalent without this ASK. Violation = INTEGRITY_FAILURE (Section 8). |

---

**SCENARIO H-3 — Hyangiram Transport (No Car)**

| Field | Value |
|---|---|
| Scenario ID | H-3 |
| Place | 향일암 (Hyangiram) |
| Participant-visible context | "향일암에 차 없이도 갈 수 있나요? 여수 시내에서 이동하려고 해요." |
| Condition A contract | Select PUs after question: PU-HY-006 (travel time + transport options). Post-question only. |
| Condition B contract | Pre-activate HYANGIRAM_FULL; uses pre-positioned transport data with awareness that "여수 시내" needs confirmation for accurate time. |
| Evidence Pool | PU-HY-006 |
| Known limitations required | Bus schedules are SEMI_STABLE — both arms must note "시간표 확인 권장." Travel time from unspecified "시내" requires departure point — both arms should note this RUNTIME dependency. |
| H-2 contract | N/A |

---

**SCENARIO C-1 — Cable Car Operating Hours and Fares**

| Field | Value |
|---|---|
| Scenario ID | C-1 |
| Place | 여수해상케이블카 (Cable Car) |
| Participant-visible context | "여수 해상 케이블카 운영시간이랑 요금이 어떻게 되나요?" |
| Condition A contract | Select PUs after question: PU-CC-004 (cabin types/fares), PU-CC-005 (operating hours). Post-question only. |
| Condition B contract | Pre-activate CABLECAR_FULL; uses pre-positioned PU-CC-004 + PU-CC-005 to give immediate summary before question needs retrieval. |
| Evidence Pool | PU-CC-004, PU-CC-005 |
| Known limitations required | Fares are SEMI_STABLE (annual adjustment possible); both arms must note "최신 요금은 공식 사이트 확인 권장." Operating hours have Wednesday maintenance pattern; both arms must note this. |
| H-2 contract | N/A |

---

**SCENARIO C-2 — Cable Car Child/Family Suitability**

| Field | Value |
|---|---|
| Scenario ID | C-2 |
| Place | 여수해상케이블카 (Cable Car) |
| Participant-visible context | "아이랑 같이 케이블카 타도 괜찮을까요? 몇 살짜리 아이가 있어요." |
| Condition A contract | Select PUs after question: PU-CC-004 (child suitability notes), PU-CC-005 (operating context). Post-question only. |
| Condition B contract | Pre-activate CABLECAR_FULL; uses pre-positioned child suitability data from PU-CC-004, potentially noting Crystal cabin nuance proactively. |
| Evidence Pool | PU-CC-004, PU-CC-005 |
| Known limitations required | Crystal cabin individual child reaction varies (WE confirms some fear responses); both arms must note this. Under-36m (3세 미만) free — both arms may include this if relevant. |
| H-2 contract | N/A |

---

**SCENARIO C-3 — Cable Car Time-of-Day Selection**

| Field | Value |
|---|---|
| Scenario ID | C-3 |
| Place | 여수해상케이블카 (Cable Car) |
| Participant-visible context | "케이블카를 낮에 타는 게 좋을까요, 야간에 타는 게 좋을까요?" |
| Condition A contract | Select PUs after question: PU-CC-005 (operating hours/VOLATILE for current status), PU-REL-004 (nighttime friction context). Post-question only. |
| Condition B contract | Pre-activate CABLECAR_FULL + REL_CONTEXT; pre-positioned context includes REL-004 nighttime-related information (dark canopy concern at Odongdo). |
| Evidence Pool | PU-CC-005, PU-REL-004 |
| Known limitations required | Live current status of nighttime operations is VOLATILE; both arms must note "당일 운행 상태 확인 권장." REL-004 nighttime Odongdo friction (어두움) should appear in both arms if combined visit is in context. |
| H-2 contract | N/A |

---

### 1.2 MT-1 — Multi-Turn Scenario (Separate Block)

**Turn Structure:**

MT-1 involves minimum 3 turns, presenting both Condition A and Condition B simultaneously at each turn. Participants evaluate the full 3-turn exchange as a unit.

| Turn | Participant Input (shown to both arms) | Purpose |
|---|---|---|
| Turn 1 | "여수 오동도랑 케이블카 같이 묶어서 볼 수 있을까요?" | Initial itinerary question — tests baseline planning |
| Turn 2 | "아, 저는 차가 없어요. 그리고 오후 늦게 도착해서 시간이 3시간 정도 있을 것 같아요." | New context revelation — tests context retention and adaptation |
| Turn 3 | "케이블카는 야간에 타면 더 좋을 것 같은데 오동도도 같이 가려면 어떻게 하면 될까요?" | Follow-up integration — tests multi-turn synthesis |

**Condition A contract (MT-1):** Retrieve relevant PUs at each turn independently based on what was asked. May not carry pre-loaded context across turns beyond what was stated in the exchange.

**Condition B contract (MT-1):** Pre-activate CABLECAR_FULL + ODONGDO_FULL + REL_CONTEXT before Turn 1. Traveler State updates across turns as new context is revealed (no car, 3h window, nighttime preference).

**Evidence Pool:** PU-OD-001, PU-OD-002, PU-OD-003, PU-REL-001, PU-REL-002, PU-REL-003, PU-REL-004, PU-CC-001, PU-CC-002, PU-CC-005

**Known limitations required (all turns):**  
- REL-004: nighttime Odongdo is darker (동백숲 어두움)  
- VOLATILE CC-005: current nighttime operation status = VERIFY  
- REL-003: combined sequence standard = 3~4h; 3h window is tight  
- No vehicle context = routing constraints apply

**MT-1 specific evaluation items:** See Section 5 (evaluation instrument).

**MT-1 analysis:** Always in separate section from single-turn results. Never merged with single-turn ratings.

---

## Section 2. Stimulus Generation Procedure

### 2.1 Pre-Generation Requirements (Before Any Response Is Written)

- [ ] Preparation Units V0.1 loaded (21 PUs confirmed READ ONLY)
- [ ] Live-state frozen values documented (Section 10 — Frozen Live State Registry)
- [ ] H-2 validation procedure understood
- [ ] Evidence Pool confirmed identical for both arms
- [ ] Stimulus generation will be done by a designated researcher (not the same person conducting DR-B)

### 2.2 Ten-Step Procedure (Per Scenario)

Execute for each of the 9 single-turn scenarios + MT-1 (10 pairs total):

**Step 1 — Load frozen scenario/context**  
Load the exact participant-visible context from Section 1 (this document). Do not modify wording.

**Step 2 — Execute Condition A under frozen contract**  
Using the Condition A contract from Section 1, generate a response using only the specified Evidence Pool, with post-question retrieval mechanism. Record which PU IDs were used in the trace log (Step 7).

**Step 3 — Execute Condition B independently**  
Using the Condition B contract from Section 1, generate a response using pre-activated context. Do NOT read Condition A's response before generating Condition B. Record which context blocks were activated.

**Step 4 — Enforce same Evidence Pool**  
Verify both arms reference only the specified PUs. Any fact not in the Evidence Pool for that scenario = EVIDENCE_BOUNDARY_VIOLATION → discard and regenerate.

**Step 5 — Enforce same known limitations**  
Verify both arms include all required known limitations from Section 1. Missing limitation in either arm = regenerate that arm.

**Step 6 — Enforce same live-information state**  
Apply frozen live-state values from Section 10 to both arms. Both arms must use identical frozen values. LIVE_BOUNDARY items must use identical verification-request language.

**Step 7 — Record trace**  
For each response pair, record:
- Scenario ID
- Condition A: PU IDs used / frozen live values applied
- Condition B: context blocks activated / PU IDs drawn from / frozen live values applied
- Researcher ID (initials)
- Generation timestamp

**Step 8 — Pre-session integrity validation (14-item checklist)**  
Run all 14 checks from Section 9 (Integrity Checklist). All must PASS. Any FAIL = regenerate failed arm.

**Step 9 — Assign blinded participant-facing order**  
Per the counterbalancing table in Section 6, assign which arm is labeled 응답 가 and which is 응답 나 for each participant slot × scenario combination. Record in the assignment register (separate researcher-side document).

**Step 10 — Freeze stimulus pair**  
Once all 14 integrity checks PASS and arm-to-label assignment is recorded, mark the stimulus pair FROZEN. No further edits.

---

## Section 3. Pre-Session Stimulus Freeze Rule

All participant-facing response pairs must be generated and frozen **BEFORE the first participant.**

Once participant testing begins — NO:
- Response rewriting of any kind
- Preparation Unit modification
- New Evidence addition to any arm
- A/B-specific tuning (even minor wording changes)
- Scenario context changes
- Prompt changes
- Factual enrichment of either arm

**Any material defect discovered after freeze:**  
STOP affected scenarios → execute Invalid Stimulus Procedure (Section 11) → correct → re-freeze → restart integrity checklist → resume only after all 14 checks PASS.

Do not silently repair. Any repair must be documented in the Stimulus Correction Log.

---

## Section 4. H-2 Mandatory Contract

### 4.1 H-2 Pre-Session Validation Checkpoint

Before any participant evaluates H-2, verify the frozen H-2 stimulus pair:

| Check | Condition A | Condition B |
|---|---|---|
| Contains capability ASK before any suitability guidance? | □ PASS / □ FAIL | □ PASS / □ FAIL |
| ASK is capability-based (not age/demographic-based)? | □ PASS / □ FAIL | □ PASS / □ FAIL |
| Does NOT say "네, 괜찮아요" without ASK? | □ PASS / □ FAIL | □ PASS / □ FAIL |
| Does NOT use "부모님" alone as sufficient basis? | □ PASS / □ FAIL | □ PASS / □ FAIL |
| Mentions 평지길 alternative? | □ PASS / □ FAIL | □ PASS / □ FAIL |
| KL-001 compliant (no elder-descent inference)? | □ PASS / □ FAIL | □ PASS / □ FAIL |
| KL-002 compliant (ASK mandatory)? | □ PASS / □ FAIL | □ PASS / □ FAIL |

**If ANY check is FAIL in either arm:** HBT stimulus set = NOT READY. Do not proceed to participants. Regenerate the violating arm and restart freeze procedure.

### 4.2 H-2 Integrity Failure Clause (During HBT)

If a session has already begun and an H-2 integrity failure is detected:
- Flag the arm as INTEGRITY_FAILURE for H-2 in that session
- Do NOT include that arm's H-2 rating in primary analysis
- Do NOT invalidate the entire session — retain all other scenario ratings
- Report as separate INTEGRITY_FAILURE observation
- Investigate whether the same violation appears in all frozen H-2 stimuli (systematic vs. one-off)

---

## Section 5. Evaluation Instrument

### 5.1 Six Independent Evaluation Dimensions

Rating scale: 1–5 independently per dimension. No composite score. No weighting. No overall session-level winner.

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

### 5.2 MT-1 Additional Evaluation Items (MT-1 Block Only)

**MT-specific Item A: 문맥 보존 (Context Retention)**

> 응답이 앞선 대화 내용을 기억하고 반영하고 있는가?

| Score | Anchor |
|---|---|
| 1 | 이전 내용을 전혀 기억하지 못하는 것 같다 |
| 3 | 일부 기억하는 것 같다 |
| 5 | 이전 내용을 정확히 기억하고 반영한다 |

**MT-specific Item B: 맥락 적응 (Context Adaptation)**

> 새로운 정보가 주어졌을 때 응답이 그에 맞게 조정되었는가?

| Score | Anchor |
|---|---|
| 1 | 새 정보를 무시한다 |
| 3 | 부분적으로 반영한다 |
| 5 | 새 정보를 정확히 반영하여 답변이 달라졌다 |

MT-specific items are NOT scored for single-turn scenarios.

### 5.3 Forced Choice

After rating both responses on all six dimensions for a scenario:

> **"두 응답 중 어느 것이 더 실제 여수 현지 전문가에 가까운 느낌을 주었나요?"**
>
> ○ 응답 가  
> ○ 비슷하다 (차이를 느끼지 못하겠다)  
> ○ 응답 나

- "비슷하다" is a valid answer — do NOT force preference
- Collected AFTER dimension ratings, not before
- Analyzed descriptively — counts and proportions only
- Does not constitute a "winner" verdict

---

## Section 6. Counterbalancing Assignment Table

### 6.1 Design Logic

**Dimension 1 — Arm-to-Label Binding (Between-Participant)**

- Odd-numbered participants (P01, P03, P05...): Condition A appears as **응답 나**; Condition B appears as **응답 가**
- Even-numbered participants (P02, P04, P06...): Condition A appears as **응답 가**; Condition B appears as **응답 나**

Result across P01–P24: 12 participants see A=가, 12 see A=나. Perfect balance.

**Dimension 2 — Scenario Ordering (Within-Participant)**

8 pre-specified valid orderings (O1–O8) of the 9 single-turn scenarios. H-2 never appears in position 1 or 9. O/H/C scenarios are interspersed (not grouped by place). MT-1 always follows all single-turn scenarios.

Rotation: P01 → O1, P02 → O2, P03 → O3, ... P08 → O8, P09 → O1, P10 → O2, ... P24 → O8 (3 complete cycles of 8 orderings).

### 6.2 Eight Valid Scenario Orderings

| Ordering | Pos 1 | Pos 2 | Pos 3 | Pos 4 | Pos 5 | Pos 6 | Pos 7 | Pos 8 | Pos 9 |
|---|---|---|---|---|---|---|---|---|---|
| O1 | O-1 | C-1 | H-1 | O-2 | **H-2** | C-2 | O-3 | H-3 | C-3 |
| O2 | C-1 | O-2 | H-3 | **H-2** | O-3 | C-3 | H-1 | C-2 | O-1 |
| O3 | H-1 | O-3 | C-2 | O-1 | C-3 | **H-2** | H-3 | O-2 | C-1 |
| O4 | C-2 | H-3 | O-1 | C-3 | **H-2** | O-2 | C-1 | H-1 | O-3 |
| O5 | O-3 | C-3 | H-1 | O-1 | H-3 | C-1 | **H-2** | O-2 | C-2 |
| O6 | H-3 | O-1 | C-3 | C-2 | O-2 | H-1 | O-3 | **H-2** | C-1 |
| O7 | C-3 | H-1 | O-2 | H-3 | C-1 | O-3 | C-2 | O-1 | **H-2** |
| O8 | O-2 | C-2 | H-3 | O-3 | H-1 | C-3 | O-1 | **H-2** | C-1 |

**Design notes:**
- O7 has H-2 in position 9 (last). This conflicts with the "not last" requirement. REVISION: Swap O7 positions 8 and 9 → O7 revised: C-3, H-1, O-2, H-3, C-1, O-3, C-2, **H-2**, O-1 → H-2 now in position 8.
- H-2 appears in positions: 5 (O1), 4 (O2), 6 (O3), 5 (O4), 7 (O5), 8 (O6), 8 (O7 revised), 8 (O8) — positions 4–8, never 1 or 9. VALID.

**Revised O7:**

| Ordering | Pos 1 | Pos 2 | Pos 3 | Pos 4 | Pos 5 | Pos 6 | Pos 7 | Pos 8 | Pos 9 |
|---|---|---|---|---|---|---|---|---|---|
| O7 | C-3 | H-1 | O-2 | H-3 | C-1 | O-3 | C-2 | **H-2** | O-1 |

### 6.3 Full Participant Assignment Table (P01–P24)

| Participant | Arm Binding | Ordering |
|---|---|---|
| P01 | A = 응답 나 | O1 |
| P02 | A = 응답 가 | O2 |
| P03 | A = 응답 나 | O3 |
| P04 | A = 응답 가 | O4 |
| P05 | A = 응답 나 | O5 |
| P06 | A = 응답 가 | O6 |
| P07 | A = 응답 나 | O7 (revised) |
| P08 | A = 응답 가 | O8 |
| P09 | A = 응답 나 | O1 |
| P10 | A = 응답 가 | O2 |
| P11 | A = 응답 나 | O3 |
| P12 | A = 응답 가 | O4 |
| P13 | A = 응답 나 | O5 |
| P14 | A = 응답 가 | O6 |
| P15 | A = 응답 나 | O7 (revised) |
| P16 | A = 응답 가 | O8 |
| P17 | A = 응답 나 | O1 |
| P18 | A = 응답 가 | O2 |
| P19 | A = 응답 나 | O3 |
| P20 | A = 응답 가 | O4 |
| P21 | A = 응답 나 | O5 |
| P22 | A = 응답 가 | O6 |
| P23 | A = 응답 나 | O7 (revised) |
| P24 | A = 응답 가 | O8 |

### 6.4 Balance Validation

**P01–P08 (one cycle):**
- A=가: P02, P04, P06, P08 → 4/8 = 50%
- A=나: P01, P03, P05, P07 → 4/8 = 50%
- Orderings used: O1 through O8 — each once
- H-2 position: 5, 4, 6, 5, 7, 8, 8, 8 — spread across positions 4–8. No position 1 or 9. VALID.

**P01–P16 (two cycles):**
- A=가: 8/16 = 50% ✓
- A=나: 8/16 = 50% ✓
- Each ordering used exactly twice ✓
- H-2 positional distribution: 4, 4, 5, 5, 6, 6, 7, 8, 8, 8, 8, 8 (spread across 4–8, two cycles) ✓

**P01–P24 (three cycles):**
- A=가: 12/24 = 50% ✓
- A=나: 12/24 = 50% ✓
- Each ordering used exactly three times ✓
- Residual imbalance: H-2 appears more often in positions 7–8 than positions 4–6. This is a NONSTRUCTURAL_RESIDUAL_IMBALANCE — position distribution is not perfectly uniform because H-2 must be excluded from positions 1 and 9, reducing its valid range to 7 positions only. DOCUMENTED and acceptable given the constraint.

**MT-1 arm binding:** Follows same odd/even rule as single-turn (P01 = A=나, P02 = A=가, etc.).

---

## Section 7. Blinding Procedure

### 7.1 Before Session

Facilitator completes 7-item leakage check before each session:

| Item | Check |
|---|---|
| 1. Response labels | Only "응답 가" / "응답 나" visible — no A/B/Condition/Model labels |
| 2. Stimulus content | No internal terminology (Prepared Knowledge, Prepared Context, Evidence Pool, PU-, Pilot, KL-001, KL-002) |
| 3. Rating form | No reference to expected outcomes, Pilot results, or Integrity Gate |
| 4. Facilitator script | No arm-advantage language; no hypothesis-confirmation language |
| 5. Session materials | No Pilot results, Integrity Gate results, or Founder expectations visible |
| 6. Briefing script | Uses only participant-appropriate language (AI 여행 안내 응답 비교) |
| 7. Post-session form | No arm identity or internal labels |

All 7 must be verified before session begins. Record sign-off initials.

### 7.2 During Session

- Facilitator uses only: 응답 가 / 응답 나
- Prohibited terms: "준비된," "Prepared," "Context," "Condition A/B," "파일럿," "Pilot," "Integrity," "전문가 기대," "어느 쪽이 이길," "부모님이라서 물어봐야 해," "Model A/B," "Phoenix"
- Facilitator may NOT: explain WHY responses differ in structure or length / express preference / indicate which response passed internal tests / react to H-2 ASK behavior with approval or disapproval / suggest that "asking a question back" is correct behavior / answer questions about HOW responses are generated
- Facilitator MAY: confirm "두 응답을 모두 읽은 후 평가해 주세요" / answer questions about the rating form procedure / note verbatim participant spontaneous comments

### 7.3 After Session

ARM_IDENTIFIED confirmation: "이번 세션에서 두 응답이 어떻게 다르게 만들어졌는지를 참여자가 알게 되었나요? (Y/N)"

If Y: flag session for ARM_IDENTIFIED review immediately. Investigate source before next session.

---

## Section 8. Facilitator Script (Standardized)

### [OPENING — Step A]

"안녕하세요. 오늘 연구에 참여해 주셔서 감사합니다.

저는 [이름/역할]입니다. 이 연구는 AI 여행 안내 응답의 품질을 평가하는 연구입니다.

오늘 진행 방식을 잠깐 설명해 드릴게요."

### [ELIGIBILITY CHECK — Step A continued]

(확인 사항: REQUIRED 조건 4가지 충족 여부 — 한국어 읽기, AI 사용 경험, 국내 여행 경험, 만 18세 이상)

"시작하기 전에 몇 가지 확인 사항이 있어요. [참여자 프로파일 폼 작성]"

### [STUDY EXPLANATION — Step C]

"오늘은 여행 관련 질문에 대한 두 가지 AI 응답을 비교해 주실 거예요.

두 응답 모두 같은 질문에 대한 AI의 답변입니다. 응답 방식이 조금 다를 수 있어요.

어느 쪽이 더 실제 여행 전문가처럼 느껴지는지, 얼마나 도움이 되는지, 얼마나 자연스러운지를 솔직하게 평가해 주시면 됩니다.

정답이 없습니다. 느끼시는 대로 평가해 주세요."

### [RATING INSTRUCTIONS — Step C continued]

"각 응답을 읽으신 후, 6가지 항목을 1점(낮음)부터 5점(높음)으로 평가해 주세요.

항목마다 독립적으로 평가합니다. 점수를 합산하거나 평균 낼 필요 없어요.

응답 가와 응답 나 각각 6가지 항목을 평가한 다음, 전체적으로 어느 쪽이 더 전문가 같은 느낌이었는지 하나를 선택하시면 됩니다. '비슷하다'도 유효한 선택이에요."

### [SCENARIO INTRODUCTION — Step D per scenario]

"이제 첫 번째 상황을 드릴게요. 다음 여행 상황을 읽으시고, 두 응답을 읽은 후 평가해 주세요."

(Present both responses simultaneously as 응답 가 and 응답 나)

"두 응답을 모두 읽으신 후 평가를 시작해 주세요."

### [MT-1 INTRODUCTION — Step E]

"이제 마지막으로 조금 다른 방식의 평가를 해볼 거예요. 이번에는 여러 번의 대화가 오가는 상황입니다.

대화를 순서대로 읽으시면서, 두 AI가 어떻게 응답했는지 비교해 주세요.

평가는 전체 대화 흐름을 보고 해주시면 됩니다."

### [QUALITATIVE WRAP-UP — Step F]

"마지막으로 두 가지 질문이 있어요. 짧게 답해 주셔도 됩니다.

[Prompt A] 응답을 비교하면서 어느 쪽이 더 낫다고 느낀 순간이 있었다면, 그 이유를 자유롭게 써주세요.

[Prompt B] 응답을 읽으면서 불편하거나 의심스러웠던 부분이 있었다면 알려주세요."

### [CLOSING — Step H]

"오늘 참여해 주셔서 정말 감사합니다. 이 연구 결과는 AI 여행 안내 서비스 개선에 활용될 예정입니다."

---

## Section 9. Clarification Rules

Facilitator may clarify **PROCEDURE** only. May not interpret or advocate for a response.

### Standardized Neutral Replies

**Q: "이 평가 항목이 무슨 뜻인가요?"**  
A: "예를 들어 '전문성'은 응답이 여수를 잘 아는 현지 전문가에게서 온 것처럼 느껴지는지를 평가하는 항목이에요. 느끼시는 대로 평가해 주시면 됩니다."  
(Substitute dimension name and one-line meaning for other dimensions. Never say "the right answer is X.")

**Q: "어떤 걸 평가해야 하나요?"**  
A: "두 응답 중에서 이 항목 기준으로 어떻게 느껴지시는지 평가해 주시면 됩니다. 정답이 없습니다."

**Q: "어느 답이 더 좋은 거예요?"**  
A: "저는 어느 쪽이 더 좋다고 말씀드릴 수 없습니다. 느끼시는 대로 평가해 주세요."

**Q: "이 응답은 왜 이렇게 길어요? / 왜 이렇게 짧아요?"**  
A: "두 응답의 형식이 다를 수 있습니다. 길이보다는 내용을 중심으로 평가해 주세요."

**Q: "이 응답이 질문을 하고 있는데, 이게 맞는 건가요?"**  
A: "두 응답 모두 유효한 방식으로 답한 거예요. 어느 쪽이 더 도움이 되고 전문가 같은지 느끼시는 대로 평가해 주세요."  
(Do NOT say "asking is the correct behavior" — this leaks H-2 expectations.)

Facilitator may NOT:
- Explain which is Condition A or B
- Share Pilot results or Integrity Gate outcomes
- Share internal expectations or hypotheses
- Give any hint about expected ASK behavior

---

## Section 10. Session Flow

### Exact Operational Sequence

**A. CONSENT / INTRODUCTION (5 min)**
- Obtain verbal/written consent
- Explain study purpose neutrally (AI 여행 안내 응답 비교 연구)
- Confirm participant meets eligibility (REQUIRED fields from profile)
- Confirm no prior SOUL/Phoenix exposure

**B. PARTICIPANT PROFILE (3 min)**
- Complete participant profile form (Section 13 — Participant Profile Form)
- Assign anonymous participant ID (next available P__ slot)
- Note Yeosu familiarity (YES/NO) for replacement matching purposes

**C. INSTRUCTIONS (5 min)**
- Read Rating Instructions script (Section 8)
- Confirm participant understands 1–5 scale and independent rating
- Confirm participant understands Forced Choice including "비슷하다" option
- Ask: "질문 없으시면 시작할게요."

**D. SINGLE-TURN COMPARISONS (30–40 min)**
- Present 9 scenarios in assigned order (per counterbalancing table — Section 6)
- For EACH scenario:
  1. Show participant-visible context
  2. Show 응답 가 and 응답 나 simultaneously (or side-by-side)
  3. "두 응답 모두 읽으신 후 평가해 주세요." (Wait.)
  4. Participant rates 응답 가 on 6 dimensions
  5. Participant rates 응답 나 on 6 dimensions
  6. Participant records Forced Choice
  7. Facilitator records all ratings (or participant records on form)
- H-2 is presented identically to all other scenarios from participant's view

**E. MT-1 BLOCK (10–15 min)**
- Announce MT-1 block: "이제 대화 형식의 평가예요."
- Present full 3-turn exchange simultaneously (both arms shown turn by turn)
- Participant reads all 3 turns for each arm
- Rates 6 core dimensions + 2 MT-specific items (맥락 보존 / 맥락 적응)
- Records MT-1 Forced Choice

**F. QUALITATIVE WRAP-UP (5–10 min)**
- Prompt A (verbatim): record participant's response
- Prompt B (verbatim): record participant's response
- No follow-up questions unless participant asks clarification about the prompt itself

**G. COMPLETENESS CHECK (2 min)**
- Facilitator verifies: all 9 Forced Choices recorded / H-2 Forced Choice present / MT-1 block complete / qualitative prompts completed (even if empty)

**H. SESSION CLOSE (2 min)**
- Thank participant
- Record ARM_IDENTIFIED check (Y/N)
- Note any session issues in Session_Issue_Flag field
- Mark Validity_Status: VALID (tentative) / UNDER_REVIEW / INVALID

**Total estimated time:** 60–80 min

**No practice trial** (BTD-A does not specify one).

---

## Section 11. Data Capture Template

### Researcher-Side Arm Mapping Register (PRIVATE — Not Participant-Facing)

| Participant_ID | Scenario_ID | Arm_Label_GA | Arm_Label_NA |
|---|---|---|---|
| P01 | O-1 | B | A |
| P01 | C-1 | B | A |
| ... (all 9 scenarios × scenario order O1) | | | |
| P02 | O-2 | A | B |
| ... | | | |

(Fill in from counterbalancing table. Label GA = which condition is shown as 응답 가; Label NA = which is 응답 나.)

### Main Data Capture Table (Per Participant × Scenario Row)

| Field | Description |
|---|---|
| Participant_ID | P01–P24 |
| Session_Date | YYYY-MM-DD |
| Session_Facilitator | Initials |
| Scenario_ID | O-1, O-2, O-3, H-1, H-2, H-3, C-1, C-2, C-3, MT-1 |
| Scenario_Type | SINGLE_TURN / MT_TURN (for MT-1 sub-rows if needed) |
| Presented_Order_Code | O1–O8 (per participant) |
| 전문성_GA | 1–5 |
| 유용성_GA | 1–5 |
| 맥락적합성_GA | 1–5 |
| 신뢰도_GA | 1–5 |
| 명확성_GA | 1–5 |
| 자연스러움_GA | 1–5 |
| 전문성_NA | 1–5 |
| 유용성_NA | 1–5 |
| 맥락적합성_NA | 1–5 |
| 신뢰도_NA | 1–5 |
| 명확성_NA | 1–5 |
| 자연스러움_NA | 1–5 |
| MT_맥락유지_GA | 1–5 (MT-1 only; blank for single-turn) |
| MT_맥락적응_GA | 1–5 (MT-1 only; blank for single-turn) |
| MT_맥락유지_NA | 1–5 (MT-1 only; blank for single-turn) |
| MT_맥락적응_NA | 1–5 (MT-1 only; blank for single-turn) |
| Forced_Choice | 가 / 비슷하다 / 나 |
| Qualitative_A | Verbatim response to Prompt A (per-session, not per-scenario — enter once per session in final row) |
| Qualitative_B | Verbatim response to Prompt B (per-session, not per-scenario — enter once per session in final row) |
| Session_Issue_Flag | Y/N |
| Issue_Description | Free text if Y |
| Validity_Status | VALID / INVALID / UNDER_REVIEW |
| Invalidity_Reason_Code | ARM_IDENTIFIED / WRONG_STIMULUS / MISSING_STIMULUS / DUPLICATE_ARM / FACILITATOR_REVEAL / INCOMPLETE_EVALUATION / ASSIGNMENT_ERROR / TECHNICAL_FAILURE / blank |

**No fabricated participant data.** All rows begin blank. Researcher-side arm mapping is hidden from any participant-facing view.

---

## Section 12. Invalid Session Procedure

### 12.1 Invalidation Triggers and Reason Codes

| Trigger | Code | Description |
|---|---|---|
| ARM_IDENTIFIED | ARM_ID | Participant correctly identifies which response is Condition A or B |
| WRONG_STIMULUS | WRONG_STIM | Wrong scenario or context shown for a given slot |
| MISSING_STIMULUS | MISSING_STIM | Scenario stimulus not shown or shown incompletely |
| DUPLICATE_ARM | DUP_ARM | Same arm (A or B) shown on both sides of a comparison |
| FACILITATOR_REVEAL | FACIL_REV | Facilitator materially explains one arm's approach or expected outcome |
| INCOMPLETE_EVALUATION | INCOMPLETE | Participant did not complete Forced Choice for H-2 (mandatory) OR fewer than 7/9 scenarios rated |
| ASSIGNMENT_ERROR | ASSIGN_ERR | Counterbalancing table violated for this participant |
| TECHNICAL_FAILURE | TECH_FAIL | Technical failure prevented both responses from being visible simultaneously |

### 12.2 Invalidation Procedure

**FLAG** (during or immediately after session):
- Record Session_Issue_Flag = Y
- Record Issue_Description verbatim
- Record Validity_Status = UNDER_REVIEW

**REVIEW** (researcher examines within 24 hours):
- Determine if the trigger is confirmed
- Document decision and reason

**OUTCOME**:
- VALID: trigger was not confirmed — retain session
- INVALID + reason code: session excluded from analysis, replacement scheduled

### 12.3 Non-Invalidation Clause

A session is NOT invalid because:
- Participant rated one arm consistently lower
- Results conflict with Pilot findings
- Participant chose "비슷하다" for all scenarios
- Participant expressed confusion about SOUL's approach

Unfavorable ratings are valid data. Do NOT discard sessions based on research-unfriendly outcomes.

### 12.4 Replacement Rule

- Invalid sessions replaced 1:1
- Replacement participant must match invalidated participant's Yeosu familiarity (YES/NO)
- Replacement participant assigned next available P-slot
- Replacement count cap: maximum 3 replacements per original slot; beyond that, document as limitation
- Replacement does NOT count toward minimum/target session counts until VALID determination

---

## Section 13. Invalid Stimulus Procedure

### 13.1 STIMULUS_INVALID Triggers

| Trigger | Description |
|---|---|
| Evidence boundary violation | Response states a fact beyond the Preparation Units for that scenario |
| Context fidelity violation | Response addresses a different context than the scenario question |
| H-2 contract violation | Either arm gives suitability judgment without capability ASK |
| Live control violation | Arms exposed to different live-state values |
| A/B fairness violation | One arm received factual information the other did not |

### 13.2 Procedure

**Mark:** STIMULUS_INVALID for the affected scenario pair

**DO NOT** expose that stimulus pair to any participant until remediation is complete

**Controlled remediation:**
1. Identify which arm and which trigger caused the failure
2. Regenerate ONLY the failing arm (do not change the passing arm)
3. Run all 14 integrity checks on the regenerated arm
4. Re-freeze the updated stimulus pair
5. Document the correction in the Stimulus Correction Log
6. Resume only after all checks PASS

**Sessions already exposed to STIMULUS_INVALID stimulus:**
- Flag as UNDER_REVIEW
- Determine whether to invalidate or retain based on severity and nature of the defect

---

## Section 14. Live Information Control

### 14.1 Frozen Live State Registry

The following values are frozen for use in ALL stimulus generation and ALL participant sessions in this HBT run. Researcher must verify and document these values BEFORE stimulus generation begins.

| Item | Stability Class | Frozen Value (to be filled before generation) | Source Reference | Freeze Date |
|---|---|---|---|---|
| 오동도 입장료 | STABLE | 무료 (no admission) | PU-OD-001 | [to document] |
| 동백열차 일반 운행 시간 (성수기 기준) | SEMI_STABLE | 09:30 첫 출발, 17:50 막차 / 점심 12:00~13:00 중단 | PU-OD-003 | [to document] |
| 동백열차 요금 | SEMI_STABLE | 1,000원 편도 | PU-OD-003 | [to document] |
| 케이블카 운영 시간 | SEMI_STABLE | 09:30~21:30 (토요일 연장); 수요일 점검 패턴 | PU-CC-005 | [to document] |
| 케이블카 일반 캐빈 요금 | SEMI_STABLE | 왕복 ₩17,000 / 편도 ₩14,000 | PU-CC-004 | [to document] |
| 케이블카 크리스탈 캐빈 요금 | SEMI_STABLE | 왕복 ₩24,000 / 편도 ₩19,000 | PU-CC-004 | [to document] |
| 향일암 입장료 | SEMI_STABLE | 성인 ₩2,000 기준 (VERIFY at freeze time) | PU-HY-001 ref | [to document] |
| 향일암 → 여수엑스포역 자동차 시간 | SEMI_STABLE | 약 36분, 32.6km | PU-HY-006 | [to document] |
| 케이블카 강풍 중단 정책 | STABLE | 강풍주의보/경보 시 중단 | PU-CC-005 | [to document] |

**Instructions for researcher completing this table:**
- Verify each SEMI_STABLE value against current official source before stimulus generation
- Record exact freeze date (YYYY-MM-DD) for each item
- Once frozen, these values apply to ALL stimuli regardless of actual live state during participant sessions

### 14.2 Uniform LIVE_BOUNDARY Behavior

Both arms must handle LIVE/VOLATILE items identically:

| Live Item | Required Behavior in BOTH Arms |
|---|---|
| 당일 날씨 / 케이블카 운행 여부 | "당일 날씨나 운행 상태는 직접 확인해 보시는 게 좋아요" (or equivalent) |
| 성수기 혼잡도 / 대기 시간 | "주말이나 성수기에는 혼잡할 수 있으니 현장에서 확인하시는 게 좋아요" (or equivalent) |
| 주차 잔여 공간 | "당일 잔여 공간은 주차장에서 확인하시는 게 좋아요" (or equivalent) |

Identical language is not required, but both arms must trigger verification-request behavior for the same LIVE items. Neither arm may give a definitive real-time answer.

---

## Section 15. Pre-Session Integrity Checklist (14 Items)

For each frozen A/B stimulus pair, all 14 items must PASS before the pair is frozen.

| # | Check | Condition A | Condition B |
|---|---|---|---|
| 1 | Correct scenario loaded (matches Section 1 exactly) | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 2 | Same visible context in both arms | □ N/A — by design: context is identical | □ N/A — by design: context is identical |
| 3 | Same Evidence Pool referenced (PU IDs from Section 1 used) | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 4 | Same known limitations present | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 5 | Condition A contract respected (post-question selection, no pre-activation) | □ PASS / □ FAIL | — |
| 6 | Condition B contract respected (pre-activation from Traveler State) | — | □ PASS / □ FAIL |
| 7 | No cross-arm contamination (A doesn't use B-style pre-loading) | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 8 | FACTUAL_GROUNDING: all stated facts traceable to Evidence Pool or OFFICIAL source | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 9 | EVIDENCE_BOUNDARY: no facts stated beyond Evidence Pool for this scenario | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 10 | CONTEXT_FIDELITY: response addresses the actual scenario question | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 11 | LIVE_CORRECTNESS: frozen live-state values used; LIVE_BOUNDARY behavior present | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 12 | H-2 contract (H-2 only): capability ASK present BEFORE any suitability guidance | □ PASS / □ FAIL / □ N/A | □ PASS / □ FAIL / □ N/A |
| 13 | No internal labels in participant-facing text | □ PASS / □ FAIL | □ PASS / □ FAIL |
| 14 | Participant-side formatting equivalent (not systematically misleading length difference) | □ PASS / □ FAIL | □ PASS / □ FAIL |

Reviewer initials: _______ Date: _______

---

## Section 16. Participant Profile Form

### Instructions

Complete before assigning participant ID. REQUIRED fields determine eligibility. If any REQUIRED = N: participant is ineligible.

---

**REQUIRED FIELDS (all must be Y)**

| Field | Response |
|---|---|
| 한국어 텍스트를 읽고 이해할 수 있나요? | Y / N |
| 카카오톡, 문자, 또는 AI 어시스턴트 등 디지털 메시징 도구를 사용해 본 적 있나요? | Y / N |
| 국내 여행을 계획하거나 다녀온 경험이 있나요? | Y / N |
| 만 18세 이상이신가요? | Y / N |

If any answer is N: **INELIGIBLE — do not proceed.**

---

**USEFUL FIELDS (record for demographic analysis — do not exclude based on these)**

| Field | Response |
|---|---|
| 여수를 방문한 경험이 있나요? | Y / N |
| 부모님 또는 어르신과 여행을 해본 경험이 있나요? | Y / N |
| 어린아이와 함께 여행을 해본 경험이 있나요? | Y / N |
| 연령대 | 25-34 / 35-44 / 45-54 / 55-65 / 기타 |
| 차량 보유 또는 운전 경험이 있나요? | Y / N |

---

**EXCLUSION CHECK**

| Field | Response |
|---|---|
| 여행업에 종사하고 계신가요? (여행사, 관광 가이드, 호텔/숙박업 등) | Y / N |

If Y: exclude if possible. If unavoidable, note in participant record.

---

**ANONYMOUS ID**

Assigned ID: P___ (assigned by facilitator — do not collect participant's name)

---

## Section 17. Sample Contract

| Level | Count | When to Use |
|---|---|---|
| STOP_MINIMUM | 8 valid sessions | May stop if directional patterns are clear and no major conflicting signals |
| STOP_TARGET | 16 valid sessions | Standard stopping point — reliable frequency distributions |
| STOP_EXTENDED | Up to 24 valid sessions | ONLY if 16-session signals are actively conflicting and additional sessions would resolve a specific question |

**Invalid sessions are replaced 1:1 and do NOT count toward these numbers.**

**NEVER stop because one arm appears to be winning.**  
**NEVER stop below 8 valid sessions without researcher escalation.**

Stopping Decision Log (blank — fill during collection):

| Session_Count | Valid_Count | Status | Decision | Reason |
|---|---|---|---|---|
| | | COLLECTING | — | — |

---

## Section 18. Data Storage and Participant Evidence Boundary

### 18.1 What Participant Evidence Can Support

Human Blind Test evidence may support claims about:
- Participant preference distribution (Forced Choice counts/proportions)
- Perceived usefulness / expertise / contextual fit / clarity / naturalness / trust (dimension ratings)
- Recurring reasons for preference or discomfort (qualitative themes)

### 18.2 What Participant Evidence Does NOT Prove

- Place facts (participant experience ≠ factual verification)
- Universal route optimality
- Architecture superiority over all conditions
- Population-wide preference
- Statistical significance of preference differences (exploratory study, not confirmatory trial)

This boundary must be applied during any future interpretation of HBT results.

---

## Section 19. Blank Analysis Worksheet

**Note:** All tables below are blank. No fabricated data. No composite score. MT-1 always in separate section.

---

**Forced Choice Summary Table**

| Scenario | Count (가) | Count (비슷하다) | Count (나) | Total_Valid | Note (A-label mapping — add post-collection) |
|---|---|---|---|---|---|
| O-1 | | | | | |
| O-2 | | | | | |
| O-3 | | | | | |
| H-1 | | | | | |
| H-2 | | | | | |
| H-3 | | | | | |
| C-1 | | | | | |
| C-2 | | | | | |
| C-3 | | | | | |
| **Overall (single-turn)** | | | | | |

---

**MT-1 Forced Choice and MT-Specific Items**

| Participant_ID | MT_Forced_Choice | 맥락유지_GA | 맥락유지_NA | 맥락적응_GA | 맥락적응_NA | Notes |
|---|---|---|---|---|---|---|
| (blank) | | | | | | |

---

**Six Dimensions Summary Table (Single-Turn — Scenario Level)**

| Scenario | 전문성_GA_mean | 유용성_GA_mean | 맥락적합성_GA_mean | 신뢰도_GA_mean | 명확성_GA_mean | 자연스러움_GA_mean | 전문성_NA_mean | 유용성_NA_mean | 맥락적합성_NA_mean | 신뢰도_NA_mean | 명확성_NA_mean | 자연스러움_NA_mean |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| O-1 | | | | | | | | | | | | |
| O-2 | | | | | | | | | | | | |
| O-3 | | | | | | | | | | | | |
| H-1 | | | | | | | | | | | | |
| H-2 | | | | | | | | | | | | |
| H-3 | | | | | | | | | | | | |
| C-1 | | | | | | | | | | | | |
| C-2 | | | | | | | | | | | | |
| C-3 | | | | | | | | | | | | |

No composite score. No weighted average. A-label mapping added post-collection.

---

**Qualitative Theme Log**

| Participant_ID | Prompt | Verbatim_Response | Coded_Theme |
|---|---|---|---|
| (blank) | A | | |
| (blank) | B | | |

Coding happens after collection, not during participant response.

---

**Scenario-Specific Observation Notes (Blank)**

| Scenario | Observation |
|---|---|
| O-1 | |
| O-2 | |
| O-3 | |
| H-1 | |
| H-2 | |
| H-3 | |
| C-1 | |
| C-2 | |
| C-3 | |
| MT-1 | |

---

## Section 20. Stopping Logic

Operationalize BTD-A stopping logic:

| Threshold | Count | Condition to Stop |
|---|---|---|
| STOP_MINIMUM | 8 valid sessions | Directional patterns clear, no major conflicting signals |
| STOP_TARGET | 16 valid sessions | Standard — stop unless extension conditions apply |
| STOP_EXTENDED | Up to 24 | Only if: (a) Forced Choice split is exactly 50/50 across all scenarios at N=16, OR (b) invalid session rate >25% at N=16 requiring investigation, OR (c) H-2 INTEGRITY_FAILURE flagged in >2 sessions (in which case STOP HBT for review, not extend) |

Never stop because one arm appears to be winning. Never stop below 8 valid sessions without researcher escalation and documented reason.

---

## Section 21. DR-B Entry Criteria

DR-B may begin only when ALL of the following are confirmed:

| Criterion | Status |
|---|---|
| All 9 single-turn scenarios operationally defined | □ PASS |
| MT-1 operationally defined separately | □ PASS |
| H-2 mandatory contract operational | □ PASS |
| Six dimensions with anchors complete | □ PASS |
| Forced Choice operationalized with neutral option | □ PASS |
| Counterbalancing assignment table complete (P01–P24) | □ PASS |
| Balance validation complete (P01–P08 / P01–P16 / P01–P24) | □ PASS |
| Facilitator script complete | □ PASS |
| Clarification rules complete | □ PASS |
| Session flow complete | □ PASS |
| Data capture template complete | □ PASS |
| Invalid session procedure complete | □ PASS |
| Invalid stimulus procedure complete | □ PASS |
| Pre-session integrity checklist complete (14 items) | □ PASS |
| Blinding procedure complete | □ PASS |
| Live information control documented | □ PASS |
| Response freeze rule documented | □ PASS |
| Analysis worksheet blank and ready | □ PASS |
| Stopping logic documented | □ PASS |
| No unresolved STRUCTURAL_GAP | □ PASS |

**EP_A_STATUS: READY_FOR_DR_B** (all criteria above met by this EP-A document)

Do NOT execute DR-B until a separate authorization.

---

## Section 22. BTD-A Traceability Matrix

| EP-A Section | BTD-A Source | Classification |
|---|---|---|
| Section 0 — Contract Freeze | BTD-A Sections 1–4 | DIRECT_IMPLEMENTATION |
| Section 1 — Stimulus Set Operationalization | BTD-A Section 5 (scenarios), Section 6 (H-2) | DIRECT_IMPLEMENTATION |
| Section 2 — Stimulus Generation Procedure | BTD-A Section 15 (Response Freeze), Section 22 (Integrity Checklist referenced) | NONSTRUCTURAL_OPERATIONALIZATION (10-step procedure is EP-A's operationalization of BTD-A's freeze requirement) |
| Section 3 — Stimulus Freeze Rule | BTD-A Section 15 | DIRECT_IMPLEMENTATION |
| Section 4 — H-2 Contract | BTD-A Section 6 | DIRECT_IMPLEMENTATION |
| Section 5 — Evaluation Instrument | BTD-A Section 11 | DIRECT_IMPLEMENTATION |
| Section 6 — Counterbalancing Table | BTD-A Section 10 | NONSTRUCTURAL_OPERATIONALIZATION (BTD-A specifies requirements; EP-A specifies the concrete 8-ordering table and P01–P24 assignment) |
| Section 7 — Blinding Procedure | BTD-A Section 9, Section 17 | DIRECT_IMPLEMENTATION |
| Section 8 — Facilitator Script | BTD-A Section 15 (DR-B requirements reference), Section 9.3 | NONSTRUCTURAL_OPERATIONALIZATION (BTD-A requires standardized script; EP-A provides the Korean text) |
| Section 9 — Clarification Rules | BTD-A Section 16 (BTD-A requirement ref) | DIRECT_IMPLEMENTATION |
| Section 10 — Session Flow | BTD-A Section 17 (DR-B requirements reference) | NONSTRUCTURAL_OPERATIONALIZATION |
| Section 11 — Data Capture Template | BTD-A Section 21 (EP-A Requirements — session recording template) | DIRECT_IMPLEMENTATION |
| Section 12 — Invalid Session Procedure | BTD-A Section 16, Section 21 | DIRECT_IMPLEMENTATION |
| Section 13 — Invalid Stimulus Procedure | BTD-A Section 20 (response freeze integrity) | NONSTRUCTURAL_OPERATIONALIZATION (BTD-A Section 15.3 requires stopping/correcting frozen defects; EP-A specifies procedure) |
| Section 14 — Live Information Control | BTD-A Section 14 | DIRECT_IMPLEMENTATION |
| Section 15 — Integrity Checklist | BTD-A Section 22 (referenced as 14-item checklist) | DIRECT_IMPLEMENTATION |
| Section 16 — Participant Profile Form | BTD-A Section 7 | DIRECT_IMPLEMENTATION |
| Section 17 — Sample Contract | BTD-A Section 8 | DIRECT_IMPLEMENTATION |
| Section 18 — Evidence Boundary | BTD-A Section 23 | DIRECT_IMPLEMENTATION |
| Section 19 — Analysis Worksheet | BTD-A Section 18, Section 24 | DIRECT_IMPLEMENTATION |
| Section 20 — Stopping Logic | BTD-A Section 8.3, Section 8.4 | DIRECT_IMPLEMENTATION |
| Section 21 — DR-B Entry Criteria | BTD-A Section 22 | DIRECT_IMPLEMENTATION |

**Structural Gaps found:** NONE. All EP-A content traces to BTD-A or is classified NONSTRUCTURAL_OPERATIONALIZATION (operational detail not specified by BTD-A, required for execution).

---

## Audit Checklist

| ID | Item | Status |
|---|---|---|
| A | Actual starting HEAD recorded (42466e6 — verified from repo) | PASS |
| B | Project State read first | PASS |
| C | Current Next Action = EP-A confirmed | PASS |
| D | BTD-A treated as authority (every section traces to BTD-A) | PASS |
| E | No BTD-A redesign | PASS |
| F | All 9 single-turn scenarios operationalized (Section 1.1) | PASS |
| G | MT-1 operationalized separately (Section 1.2) | PASS |
| H | H-2 mandatory contract operational (Section 4) | PASS |
| I | Six dimensions unchanged (Section 5.1) | PASS |
| J | Forced Choice unchanged (Section 5.3) | PASS |
| K | Neutral "비슷하다" option preserved | PASS |
| L | Sample 8/16/24 unchanged (Section 17) | PASS |
| M | Deterministic counterbalancing defined (Section 6) | PASS |
| N | P01–P08 balance checked (Section 6.4) | PASS — 50/50 A=가/나 |
| O | P01–P16 balance checked (Section 6.4) | PASS — 50/50 |
| P | P01–P24 balance checked (Section 6.4) | PASS — 50/50 (residual H-2 positional imbalance documented) |
| Q | Blinding procedure complete (Section 7) | PASS |
| R | Facilitator script complete (Section 8) | PASS |
| S | Clarification rules complete (Section 9) | PASS |
| T | Session flow complete (Section 10) | PASS |
| U | Blank data template complete (Section 11) | PASS |
| V | No fabricated participant data | PASS |
| W | Invalid-session rules operational (Section 12) | PASS |
| X | Invalid-stimulus rules operational (Section 13) | PASS |
| Y | Live control operational (Section 14) | PASS |
| Z | Pre-session integrity checklist complete — 14 items (Section 15) | PASS |
| AA | Participant Evidence boundary defined (Section 18) | PASS |
| AB | Blank analysis worksheet complete (Section 19) | PASS |
| AC | No composite score | PASS |
| AD | Stopping logic operational (Section 20) | PASS |
| AE | BTD-A traceability complete (Section 22) | PASS |
| AF | Structural gaps checked — NONE found | PASS |
| AG | DR-B not executed | PASS |
| AH | No recruitment/session | PASS |
| AI | Participant Evidence NONE | PASS |
| AJ | BT Verdict NOT_ASSIGNED | PASS |
| AK | No new Evidence/web research | PASS |
| AL | No unrelated research | PASS |
| AM | No Candidate/Architecture Decision | PASS |
| AN | No schema/runtime/prod change | PASS |
| AO | Project State updated (checkpoint block in Project State) | PENDING |
| AP | Exactly one Next Action | PASS |
| AQ | Next Action not executed | PASS |
| AR | Git diff inspected | PENDING |
| AS | Commit pushed | PENDING |
| AT | Local/remote HEAD verified | PENDING |

---

## ONE NEXT ACTION

**EP_A_STATUS: READY_FOR_DR_B**

**ONE NEXT ACTION:** Execute DR-B — Facilitator Dry Run V0.1

DR-B scope: facilitator readiness / leakage check / counterbalancing verification / stimulus display / rating form navigability / MT-1 flow / invalid session procedure / H-2 boundary enforcement / timing calibration / end-to-end rehearsal with internal stand-in.

**Do NOT execute DR-B in this run. Do NOT recruit participants. Do NOT run HBT.**
