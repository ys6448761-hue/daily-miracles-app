# SOUL Yeosu — Human Blind Test Facilitator Dry Run DR-B V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Starting HEAD:** 01b6a88 (verified from repo)  
**Design Authority:** BTD-A V0.1 (`SOUL_YEOSU_HUMAN_BLIND_TEST_DESIGN_BTD_A_V0_1.md`)  
**Execution Authority:** EP-A V0.1 (`SOUL_YEOSU_HUMAN_BLIND_TEST_EXECUTION_PACKAGE_EP_A_V0_1.md`)  
**Mode:** INTERNAL DRY RUN — SIMULATED_PARTICIPANT only  
**Status:** See Section 21 (DR-B Verdict)

---

## Section 1. Starting State

**Expected State at DR-B Entry:**

| Item | Status |
|---|---|
| BTD-A | CREATED / READY_FOR_EP_A |
| EP-A | CREATED / READY_FOR_DR_B |
| EP-A Structural Gaps | NONE |
| EP-A BTD-A Traceability | COMPLETE |
| DR-B | NOT_YET_CREATED (this document creates it) |
| Founder GO | GO |
| HBT HOLD | RELEASED_FOR_PREPARATION |
| HBT Executed | FALSE |
| Participant Evidence | NONE |
| BT Verdict | NOT_ASSIGNED |
| Controlled Collection Cycles | 25 |
| HY-003 | PROVISIONALLY_SUPPORTED |
| HY-008 | HARD_BLOCKED + TERMINAL_FOR_CURRENT_COLLECTION_PHASE |
| KL-001 | ACTIVE |
| KL-002 | ACTIVE |

**Verified:** All match. Current ONE NEXT ACTION = DR-B Facilitator Dry Run. Proceeding.

---

## Section 2. Scope

DR-B answers: **"Can the approved Human Blind Test procedure be run by a facilitator exactly and neutrally without inventing study logic during execution?"**

DR-B evaluates OPERABILITY only. It does NOT evaluate:
- Participant preference
- Model A/B superiority
- Prepared Context validity
- SOUL answer quality
- Statistical results

**Freeze rule:** BTD-A and EP-A are NOT modified during DR-B. Problems discovered are recorded as issues. No same-run repair.

---

## Section 3. Dry Run Method

**Operator:** Internal DR-B operator (this document)  
**Participant:** SIMULATED_PARTICIPANT (not real)  
**Data generated:** DRY_RUN_DUMMY_DATA (clearly labeled, excluded from any analysis dataset)  
**Tools used:** EP-A document only — no web research, no Evidence collection, no live browsing  

Coverage target: all 18 operational test areas specified in the DR-B directive.

---

## Section 4. Assignment Test

**Test participants:** P01, P02, P08, P09, P16, P17, P24

**EP-A counterbalancing table (Section 6):**
- Odd P → A = 응답 나; Even P → A = 응답 가
- Scenario ordering: P01=O1, P02=O2, ..., P08=O8, P09=O1 (cycle repeats)
- H-2 must not appear in position 1 or 9

| Participant | Arm_Binding_GA | Arm_Binding_NA | Ordering | H-2_Position | Operator_Choice_Required | Result |
|---|---|---|---|---|---|---|
| P01 (odd) | B | A | O1 | pos 5 | NO — deterministic | PASS |
| P02 (even) | A | B | O2 | pos 4 | NO — deterministic | PASS |
| P08 (even) | A | B | O8 | pos 8 | NO — deterministic | PASS |
| P09 (odd) | B | A | O1 (cycle 2) | pos 5 | NO — deterministic | PASS |
| P16 (even) | A | B | O8 (cycle 2) | pos 8 | NO — deterministic | PASS |
| P17 (odd) | B | A | O1 (cycle 3) | pos 5 | NO — deterministic | PASS |
| P24 (even) | A | B | O8 (cycle 3) | pos 8 | NO — deterministic | PASS |

**Balance check (read from EP-A Section 6.4):**
- P01–P08: A=가: 50% / A=나: 50% ✓
- P01–P16: A=가: 50% / A=나: 50% ✓
- P01–P24: A=가: 50% / A=나: 50% ✓
- Residual H-2 positional imbalance toward positions 7–8: DOCUMENTED (EP-A Section 6.4) as NONSTRUCTURAL_RESIDUAL_IMBALANCE — acceptable given constraint

**Note on O7:** EP-A correctly notes O7 original had H-2 in position 9 (violation) and self-corrects to revised O7 with H-2 in position 8. Revised O7 is the valid version. P07, P15, P23 use revised O7.

**Assignment test conclusion:** FULLY_SPECIFIED. No operator choice required at any point. All 7 test IDs produce deterministic, correct assignments.

---

## Section 5. Blinding Test

**Simulated participant experience walkthrough:**

A SIMULATED_PARTICIPANT sees and hears the following (from EP-A Section 7 and Section 8):

1. **Verbal opening:** "AI 여행 안내 응답의 품질을 평가하는 연구입니다." → No model names, no condition labels. ✓
2. **Stimuli:** Labeled 응답 가 / 응답 나 only. No "Condition A," "Condition B," "Prepared," "Context," "PU-." ✓
3. **Rating form:** 6 independent Korean dimensions with 1–5 scale anchors. No reference to Pilot results, Integrity Gate, or expected winner. ✓
4. **Forced Choice prompt:** "두 응답 중 어느 것이 더..." — neutral framing, no winner implied. ✓
5. **Qualitative prompts:** "이유를 자유롭게 써주세요" / "불편하거나 의심스러웠던 부분" — no leading language. ✓
6. **Facilitator prohibited terms list (EP-A Section 7.2):** 준비된 / Prepared / Context / Condition A/B / 파일럿 / Pilot / Integrity / 전문가 기대 / 어느 쪽이 이길 / 부모님이라서 물어봐야 해 / Model A/B / Phoenix — all listed in EP-A, verified present in script guidance. ✓

**Leakage scan: No participant-facing content reveals:**
- Condition A/B identity ✓
- Prepared Knowledge/Context terminology ✓
- Expert Anticipation mechanism ✓
- Phoenix architecture ✓
- Expected winner ✓
- Pilot result ✓
- Integrity Gate result ✓
- Founder preference ✓
- H-2 expected behavior (ASK pattern not revealed to participant) ✓

**One potential concern noted (classified below):**  
EP-A Section 8 clarification script for "이 응답이 질문을 하고 있는데, 이게 맞는 건가요?" answers: "두 응답 모두 유효한 방식으로 답한 거예요." This is correct and does NOT reveal that ASK is the expected behavior. ✓

**BLINDING_DRY_RUN = PASS**

---

## Section 6. Facilitator Script Walkthrough

Walking EP-A Section 8 stage by stage with SIMULATED_PARTICIPANT:

### [OPENING — Step A]
- "안녕하세요. 오늘 연구에 참여해 주셔서 감사합니다." ✓ Executable. Neutral. No improvisation needed.
- "[이름/역할]" placeholder: operator fills in before session. BOUNDED_DISCRETION (within range: facilitator's actual name/role). ✓

### [ELIGIBILITY CHECK — Step A continued]
- Profile form presented. ✓
- EP-A Section 16 provides exact REQUIRED/USEFUL/EXCLUSION fields. ✓
- Clear rule: any REQUIRED = N → ineligible. ✓ No improvisation.

### [STUDY EXPLANATION — Step C]
- "두 응답 모두 같은 질문에 대한 AI의 답변입니다. 응답 방식이 조금 다를 수 있어요."
- **MINOR observation:** "응답 방식이 조금 다를 수 있어요" is technically true and does not reveal which arm is A or B — it only signals that responses may differ structurally. No bias introduced. Retain. ✓
- "정답이 없습니다." ✓ No coaching.

### [RATING INSTRUCTIONS — Step C continued]
- "항목마다 독립적으로 평가합니다. 점수를 합산하거나 평균 낼 필요 없어요." ✓ Clear.
- "비슷하다도 유효한 선택이에요." ✓ Neutral option communicated.

### [SCENARIO INTRODUCTION — Step D]
- "이제 첫 번째 상황을 드릴게요." ✓
- "두 응답을 모두 읽으신 후 평가를 시작해 주세요." ✓
- **Gap noted:** EP-A does not explicitly state whether both responses are shown simultaneously on one screen, on separate sheets, or read aloud. This is a presentation-format gap. 
  - Classification: MINOR (presentation medium not specified — operator must decide paper vs. screen)
  - It does not affect counterbalancing, blinding, or dimension integrity.
  - Operator should decide before first session and document consistently.

### [MT-1 INTRODUCTION — Step E]
- "이제 마지막으로 조금 다른 방식의 평가를 해볼 거예요. 이번에는 여러 번의 대화가 오가는 상황입니다." ✓ Executable.
- "평가는 전체 대화 흐름을 보고 해주시면 됩니다." ✓ Distinguishes MT-1 from single-turn.

### [QUALITATIVE WRAP-UP — Step F]
- Prompt A and B both presented neutrally. ✓
- "짧게 답해 주셔도 됩니다." ✓ Reduces participant burden without coaching.

### [CLOSING — Step H]
- "이 연구 결과는 AI 여행 안내 서비스 개선에 활용될 예정입니다." ✓ Accurate, neutral.

### ARM_IDENTIFIED confirmation
- "이번 세션에서 두 응답이 어떻게 다르게 만들어졌는지를 참여자가 알게 되었나요? (Y/N)" 
- Asked of facilitator (not participant). ✓ Correct usage.

**Script walkthrough conclusion:** Script is executable end-to-end. One MINOR gap (presentation format not specified). No improvisation required for core procedure.

---

## Section 7. Clarification Stress Test

Testing EP-A Section 9 against 7 participant questions:

**A. "어떤 답변이 더 좋은 답변인가요?"**  
EP-A approved reply: "저는 어느 쪽이 더 좋다고 말씀드릴 수 없습니다. 느끼시는 대로 평가해 주세요."  
Evaluation: Neutral ✓ / No hypothesis leakage ✓ / No model identity leakage ✓ / No coaching ✓  
**Result: PASS**

**B. "응답 가와 나는 서로 다른 AI인가요?"**  
EP-A approved reply: "두 응답 모두 AI가 생성한 답변입니다." (EP-A Section 9 permits confirming both are AI responses; does NOT permit revealing mechanism difference)  
**Gap noted:** EP-A does not provide an explicit standardized reply for this exact question. The Section 9 replies cover "좋은 답변" / "무슨 뜻" / "어떤 걸 평가" / "왜 길어" / "질문을 하고 있는데." The "서로 다른 AI인가요?" question is not covered by a specific reply.
- Facilitator must improvise a neutral answer: "두 응답 모두 AI 응답입니다. 어떤 방식으로 만들어졌는지는 말씀드리기 어렵습니다."
- This improvisation is minimal and non-leaking, but it is UNSPECIFIED in EP-A.
- Classification: **MINOR** (improvisation needed, but improvisation is bounded: "two AI responses, can't say how they were made." No hypothesis/identity leakage possible.)
- Corrective action: Add standardized reply to EP-A Section 9 (EP-A revision, not BTD-A).

**C. "전문성하고 신뢰도는 뭐가 다른가요?"**  
EP-A Section 9: "예를 들어 '전문성'은 응답이 여수를 잘 아는 현지 전문가에게서 온 것처럼 느껴지는지를 평가하는 항목이에요."  
Facilitator can follow same template for 신뢰도: "신뢰도는 이 응답의 내용을 믿을 수 있다고 느껴지는지를 평가하는 항목이에요."  
Evaluation: Distinction exists (expertise feel vs. content believability). Both anchors distinguishable. ✓  
**Result: PASS**

**D. "둘 다 비슷하면 꼭 하나를 골라야 하나요?"**  
EP-A Section 5.3: "'비슷하다'도 유효한 선택이에요."  
EP-A rating instructions script: already communicates this.  
Facilitator reply: "아니요, '비슷하다'를 선택하셔도 됩니다. 강제로 하나를 고르실 필요 없어요." ✓  
**Result: PASS**

**E. "이 장소를 잘 모르는데 평가해도 되나요?"**  
EP-A participant profile: prior Yeosu/place knowledge is USEFUL, NOT REQUIRED. Eligible participants may not know the places.  
**Gap noted:** EP-A does not provide an explicit facilitator reply for this question.  
Facilitator must improvise: "네, 괜찮아요. 응답이 얼마나 도움이 되고 전문가 같은 느낌인지를 평가해 주시면 됩니다."  
This is non-leaking and accurate. Classification: **MINOR** (same pattern as item B — bounded improvisation, not UNSPECIFIED at structural level).  
Corrective action: Add standardized reply to EP-A Section 9.

**F. "제가 여수를 가본 적이 없는데 괜찮나요?"**  
Same as E — prior visit is USEFUL not REQUIRED. Same reply applies.  
Classification: **MINOR** (same correction needed in EP-A Section 9).  
**Result: PASS (bounded improvisation)**

**G. "왜 부모님 상태를 다시 물어보는 거예요?" (H-2 specific)**  
This is the critical leakage risk. Participant may ask this after seeing the H-2 stimulus where a response asks a capability question.  
EP-A Section 9 contains: "Q: '이 응답이 질문을 하고 있는데, 이게 맞는 건가요?' → A: '두 응답 모두 유효한 방식으로 답한 거예요. 어느 쪽이 더 도움이 되고 전문가 같은지 느끼시는 대로 평가해 주세요. (Do NOT say 'asking is the correct behavior')'"  
This covers the semantic equivalent of Question G. Applying the same reply works without revealing that ASK is the expected/required behavior. ✓  
**Result: PASS**

**Clarification stress test summary:**  
5/7 questions: FULLY_SPECIFIED or covered by existing replies — PASS  
2/7 questions (B and E/F): MINOR gap — bounded improvisation needed, not structurally UNSPECIFIED  
0/7 questions: BLOCKING or UNSPECIFIED at structural level

**Recommended EP-A Section 9 additions (Minor corrections for next version):**
1. "응답 가와 나는 서로 다른 AI인가요?" → "두 응답 모두 AI 응답입니다. 어떤 방식으로 만들어졌는지는 말씀드리기 어렵습니다."
2. "이 장소를 잘 모르는데 평가해도 되나요?" / "여수를 가본 적이 없는데 괜찮나요?" → "네, 괜찮아요. 응답이 얼마나 도움이 되고 전문가 같은 느낌인지를 평가해 주시면 됩니다."

---

## Section 8. Six-Dimension Comprehension Test

Testing operational distinguishability using EP-A Section 5.1 anchors:

**전문성 (Expertise Feel):** "여수를 잘 아는 현지 전문가에게서 온 것처럼 느껴지는가?"  
**신뢰도 (Trust):** "응답의 내용을 믿을 수 있다고 느껴지는가?"

**전문성 ↔ 신뢰도 overlap test:**  
Difference: 전문성 = perceived source authority ("expert-like feel"). 신뢰도 = content believability ("do I trust what is said"). A response from someone who sounds knowledgeable (high 전문성) may still contain an unverifiable claim (lower 신뢰도). The anchors make this distinction clear:
- 전문성 1-anchor: "일반적이고 막연한 느낌" (general/vague — about the source feel)
- 신뢰도 1-anchor: "내용이 의심스럽거나 불확실하다" (content is doubtful — about the claims)
- Distinguishable using approved anchors alone. ✓ No improvisation needed.

**유용성 (Usefulness):** "실제 여행 계획이나 결정에 얼마나 도움이 되는가?"  
**맥락 적합성 (Contextual Fit):** "내가 처한 상황과 질문에 맞게 답하고 있는가?"

**유용성 ↔ 맥락 적합성 overlap test:**  
Difference: 유용성 = practical value for planning/deciding. 맥락 적합성 = situational alignment (does it address MY situation). A response may be generally useful but not fit the specific context (e.g., detailed Hyangiram information for someone who asked about Cable Car connection — high 유용성 of the facts, low 맥락 적합성). Anchors reflect this:
- 유용성 5-anchor: "이 응답만으로 계획하거나 결정할 수 있다" (actionability)
- 맥락 적합성 5-anchor: "내가 처한 상황을 정확히 이해한 것 같다" (situation understanding)
- Distinguishable. ✓

**명확성 (Clarity):** "이해하기 쉽고 명확하게 전달되는가?"  
**자연스러움 (Naturalness):** "편안하고 자연스러운 대화처럼 느껴지는가?"

**명확성 ↔ 자연스러움 overlap test:**  
Difference: 명확성 = information legibility/comprehensibility. 자연스러움 = conversational register and warmth. A response can be clear (well-organized, easy to parse) but feel robotic (low 자연스러움). Conversely, a warm conversational response may be slightly unclear in structure. Anchors:
- 명확성 5-anchor: "쉽게 읽히고 핵심이 잘 전달된다" (readability, information transmission)
- 자연스러움 5-anchor: "마치 사람이 직접 말해주는 것 같다" (human-like register)
- Distinguishable. ✓

**Six-dimension comprehension conclusion:** All 6 dimensions distinguishable using EP-A anchors alone. Facilitator can explain each without inventing new distinctions. Overlap pairs are operationally separable.

**Six-dimension operability: PASS**

---

## Section 9. Forced Choice Test

Simulating EP-A Section 5.3 Forced Choice presentation to SIMULATED_PARTICIPANT:

**Participant sees:**
> "두 응답 중 어느 것이 더 실제 여수 현지 전문가에 가까운 느낌을 주었나요?"
> ○ 응답 가  
> ○ 비슷하다 (차이를 느끼지 못하겠다)  
> ○ 응답 나

**Checks:**
- Neutral option obvious: ✓ ("비슷하다" with parenthetical explanation)
- No pressure to choose A or B: ✓ (three-option format)
- Script does not imply must have winner: Rating Instructions state "비슷하다도 유효한 선택이에요." ✓
- Timing: After dimension ratings, before qualitative — confirmed in EP-A Section 10 flow. ✓
- Stored separately from six ratings: ✓ (Forced_Choice is its own field in data template, not combined with dimension rows)
- Researcher-side mapping (가 = which condition) is hidden from participant via Arm Mapping Register. ✓

**FORCED_CHOICE_OPERABILITY = PASS**

---

## Section 10. H-2 Dry Run

### 7-Item H-2 Checklist Verification (from EP-A Section 4)

**Simulating H-2 stimulus evaluation for SIMULATED_PARTICIPANT:**

H-2 participant-visible context: "향일암에 부모님 모시고 가도 괜찮을까요?"

Both arms (hypothetical frozen responses) must satisfy all 7 checks:

| # | Check | Condition A | Condition B |
|---|---|---|---|
| 1 | Parent label alone does not become mobility inference | ✓ — EP-A contract requires ASK before judgment | ✓ — B pre-activation includes MANDATORY_ASK_TRIGGER from PU-HY-003 |
| 2 | Minimum necessary ASK preserved | ✓ — EP-A Section 1 H-2 contract: "Both arms MUST ask capability before suitability" | ✓ |
| 3 | No unsupported suitability judgment | ✓ — "네, 괜찮아요" without ASK = INTEGRITY_FAILURE per EP-A Section 4 | ✓ |
| 4 | KL-001 compliant (no elder descent-friction inference) | ✓ — EP-A Section 1 H-2 notes: "may NOT make elder-specific descent difficulty claims" | ✓ |
| 5 | KL-002 compliant (ASK mandatory) | ✓ — MANDATORY: ASK before any guidance | ✓ |
| 6 | Participant-facing wording does not reveal why H-2 is special | ✓ — H-2 "is presented identically to all other scenarios from participant's view" (EP-A Section 10) | ✓ |
| 7 | Researcher-side validation catches violation before participant exposure | ✓ — 14-item checklist item #12 specifically for H-2 | ✓ |

**All 7 checks: PASS** (by design contract — pre-generation; actual frozen responses will be validated before participant exposure)

### Hypothetical H-2 Integrity Failure Simulation

**Hypothetical scenario:** A frozen Condition A response says: "네, 부모님과 향일암에 가셔도 될 것 같아요. 계단이 있지만 천천히 올라가시면 됩니다." — no capability ASK.

**EP-A procedure response:**

Step 1: Pre-session 14-item checklist → Item #12 "H-2 contract: capability ASK present?" → **FAIL** for Condition A  
Step 2: Stimulus pair is marked **STIMULUS_INVALID** (EP-A Section 13)  
Step 3: Stimulus pair is NOT shown to any participant  
Step 4: Regenerate Condition A only  
Step 5: Re-run all 14 integrity checks  
Step 6: Re-freeze only after all 14 PASS  
Step 7: Document in Stimulus Correction Log  

**Detection verdict: CORRECTLY CAUGHT** — EP-A procedure surfaces the violation before participant exposure. Procedure works as designed.

**Note:** This simulation does NOT reflect any actual failure in the frozen H-2 stimuli — it is procedural testing only.

**H2_DRY_RUN = PASS (all 7 checklist items) + Hypothetical detection = CORRECTLY CAUGHT**

---

## Section 11. MT-1 Dry Run

Exercising EP-A Section 1.2 MT-1 structure with SIMULATED_PARTICIPANT:

### Turn Structure Walkthrough

**Turn 1:** "여수 오동도랑 케이블카 같이 묶어서 볼 수 있을까요?"  
- Purpose: Initial itinerary question — baseline planning  
- Both arms present responses simultaneously
- SIMULATED_PARTICIPANT reads both 응답 가 (say: B-first for P01) and 응답 나 (A for P01)
- No rating yet — instruction is to read all turns first, then rate

**Turn 2:** "아, 저는 차가 없어요. 그리고 오후 늦게 도착해서 시간이 3시간 정도 있을 것 같아요."  
- New context: no vehicle + 3-hour window
- Both arms' Turn 2 responses shown
- Check: does each arm incorporate "차 없음" and "3시간" into Turn 2 response without asking again what was already stated?
- This is what the 맥락 보존 and 맥락 적응 items test.

**Turn 3:** "케이블카는 야간에 타면 더 좋을 것 같은데 오동도도 같이 가려면 어떻게 하면 될까요?"  
- Integration of nighttime preference with prior constraints
- Both arms' Turn 3 responses shown
- SIMULATED_PARTICIPANT has now read all 3 turns for both arms

**Rating timing:** After Turn 3 — participant rates 6 core dimensions + 2 MT items (맥락유지 / 맥락적응) + MT Forced Choice.

**MT-1 design checks:**
- Prior context retained across turns (evaluated by 맥락유지 dimension): ✓ EP-A defines this
- Newly supplied context incorporated (맥락적응): ✓ EP-A defines this
- Turn order clear to participant: ✓ EP-A Section 1.2 shows turn order with purpose labels
- Participant understands comparison unit (full 3-turn exchange): ✓ MT-1 Introduction script clarifies "전체 대화 흐름을 보고 해주시면 됩니다"
- Rating/Forced Choice timing: ✓ After all 3 turns, not per-turn
- MT-1 data stored separately: ✓ EP-A data template has MT-specific rows; analysis worksheet has separate MT section
- MT-specific items NOT scored for single-turn: ✓ EP-A Section 5.2 states this explicitly

**Gap noted (OBSERVATION):** EP-A does not specify how MT-1 turns are physically presented to the participant. Are turns shown one at a time (participant presses "next") or all three shown together per arm? This is a presentation-format decision analogous to the single-turn gap in Section 6. Classification: OBSERVATION (does not affect validity — either format yields valid comparison; operator should decide and document consistently).

**MT1_OPERABILITY = PASS** (with OBSERVATION on presentation format)

---

## Section 12. Data Capture Dry Run

Testing 32-field template (EP-A Section 11) with **DRY_RUN_DUMMY_DATA**:

### Arm Mapping Register (DRY_RUN_DUMMY — P01, O-1)

| Participant_ID | Scenario_ID | Arm_Label_GA | Arm_Label_NA |
|---|---|---|---|
| DRY_P01 | O-1 | B | A |

(Researcher-side only — NOT participant-facing) ✓

### Main Data Row (DRY_RUN_DUMMY — P01, O-1)

| Field | DRY_RUN_DUMMY Value |
|---|---|
| Participant_ID | DRY_P01 |
| Session_Date | DRY_2026-09-28 |
| Session_Facilitator | DR-B |
| Scenario_ID | O-1 |
| Scenario_Type | SINGLE_TURN |
| Presented_Order_Code | O1 |
| 전문성_GA | 4 |
| 유용성_GA | 3 |
| 맥락적합성_GA | 4 |
| 신뢰도_GA | 3 |
| 명확성_GA | 5 |
| 자연스러움_GA | 4 |
| 전문성_NA | 3 |
| 유용성_NA | 3 |
| 맥락적합성_NA | 3 |
| 신뢰도_NA | 4 |
| 명확성_NA | 4 |
| 자연스러움_NA | 3 |
| MT_맥락유지_GA | (blank — SINGLE_TURN) |
| MT_맥락적응_GA | (blank — SINGLE_TURN) |
| MT_맥락유지_NA | (blank — SINGLE_TURN) |
| MT_맥락적응_NA | (blank — SINGLE_TURN) |
| Forced_Choice | 가 |
| Qualitative_A | (per-session — in final row) |
| Qualitative_B | (per-session — in final row) |
| Session_Issue_Flag | N |
| Issue_Description | (blank) |
| Validity_Status | VALID |
| Invalidity_Reason_Code | (blank) |

**Checks:**
- All 32 fields writable: ✓
- Participant-facing / researcher-side separation: ✓ (Arm Mapping Register is private)
- Six ratings stored independently (no composite): ✓ (12 separate cells per scenario)
- Forced Choice stored independently: ✓ (separate field)
- Qualitative text retained verbatim: ✓ (per-session rows)
- Scenario ID retained: ✓
- Order code retained: ✓
- Validity flag retained: ✓
- Issue flag retained: ✓
- MT-1 distinguishable: ✓ (Scenario_Type = MT_TURN or blank MT fields for SINGLE_TURN)
- No condition identity accidentally exposed in participant-facing view: ✓ (arm mapping is researcher-only register)

**Dummy data is clearly labeled DRY_RUN_DUMMY — excluded from any analysis dataset.**

**Data capture result: PASS** — all fields writable, separation maintained, no composite score possible from template design

---

## Section 13. Completeness Check

Simulating 5 incomplete session scenarios:

**A. Missing one dimension rating (participant skipped 신뢰도_GA for O-3):**  
- EP-A invalid-session rule INCOMPLETE_EVALUATION: "fewer than 7/9 scenarios rated" OR "H-2 Forced Choice missing"
- Missing ONE dimension in one scenario does NOT trigger INCOMPLETE_EVALUATION (threshold is scenarios, not individual items)
- Facilitator action: note in Issue_Description; request the skipped rating before moving on if participant is still reading
- EP-A does NOT specify what to do about a single missing dimension rating
- Classification: **MINOR** (small gap — facilitator should ask "이 항목만 평가해 주시겠어요?" before moving on; this is implied but not stated in EP-A)

**B. Missing Forced Choice for O-5 (not H-2):**  
- Not a mandatory-FC scenario (only H-2 FC is mandatory per EP-A's INCOMPLETE_EVALUATION trigger)
- Facilitator should prompt once: "여기 마지막 선택 부탁드려요."
- If still not provided: note in Issue_Description; session remains VALID (non-H-2 FC is not an invalidation trigger)
- Classification: BOUNDED_DISCRETION ✓

**C. Missing qualitative response to Prompt A (participant says "없어요"):**  
- Qualitative prompts: EP-A states "짧게 답해 주셔도 됩니다" — implies optional
- "없어요" is a valid minimal response; record verbatim
- Session remains VALID ✓

**D. Interrupted scenario (participant needs a break mid-O-7):**  
- EP-A does not specify a break protocol.
- Facilitator must use judgment: pause, maintain blinding, resume from same point.
- Classification: **MINOR** (gap — no break protocol specified in EP-A; bounded improvisation: "잠깐 쉬셨다가 계속 진행할게요.")

**E. Incomplete MT-1 (only 2 of 3 turns completed due to time):**  
- EP-A states MT-1 = minimum 3 turns.
- 2 turns = incomplete MT-1 by design.
- Facilitator action: attempt to complete Turn 3. If not possible: record Session_Issue_Flag = Y, Issue_Description = "MT-1 incomplete — 2/3 turns only," Validity_Status = UNDER_REVIEW.
- EP-A Section 12: INCOMPLETE_EVALUATION covers "fewer than 7/9 scenarios rated" — MT-1 incompleteness is not explicitly listed.
- Classification: **MINOR** (MT-1 specific invalidation criteria not explicit in EP-A; needs one sentence in Section 12 — "MT-1 incomplete (fewer than 3 turns)" → UNDER_REVIEW)

**Completeness check conclusion:** Facilitator knows correct responses for all 5 scenarios. 2 cases require bounded improvisation (A and D). MT-1 incomplete is an UNDER_REVIEW case not fully specified.

---

## Section 14. Invalid Session Stress Test

Testing EP-A Section 12 procedures for 6 triggers:

**1. ARM_IDENTIFIED — participant says "아, 이게 그 응답 방식이 다른 거죠?"**  
FLAG: Session_Issue_Flag = Y, Issue_Description = "Participant may have identified arm identity"  
REVIEW: Researcher assesses whether participant correctly identified A/B (not just "different styles")  
ARM_IDENTIFIED confirmation (post-session): Y  
OUTCOME: INVALID / ARM_ID code  
Replacement: 1:1 with same Yeosu familiarity profile. ✓ Procedure clear.

**2. WRONG_STIMULUS — facilitator shows C-3 materials when O-1 is assigned by ordering O1 for P01:**  
FLAG: WRONG_STIM code  
If caught during session: stop, correct, restart from O-1. If only caught post-session: INVALID / WRONG_STIM.  
EP-A procedure: FLAG → REVIEW → INVALID. ✓

**3. FACILITATOR_REVEAL — facilitator says "이쪽이 더 상세한 방식이에요":**  
FLAG: FACIL_REV code  
Post-session: ARM_IDENTIFIED Y triggered  
OUTCOME: INVALID / FACIL_REV ✓

**4. TECHNICAL_FAILURE — screen crashes mid-scenario, participant cannot see both responses:**  
FLAG: TECH_FAIL code  
REVIEW: Was failure before or after all 9 scenarios completed?  
OUTCOME: INVALID / TECH_FAIL if minimum 7/9 scenarios not completed. ✓

**5. INCOMPLETE_EVALUATION — H-2 Forced Choice not recorded:**  
FLAG: INCOMPLETE code  
Per EP-A: H-2 FC is mandatory. Missing = INCOMPLETE_EVALUATION trigger.  
OUTCOME: INVALID / INCOMPLETE ✓

**6. ASSIGNMENT_ERROR — facilitator used ordering O2 for P01 instead of O1:**  
FLAG: ASSIGN_ERR code  
REVIEW: Severity — was H-2 shown in position 1 or 9? Was arm binding correct?  
OUTCOME: INVALID / ASSIGN_ERR if structural assignment violated; VALID if minor bookkeeping error with no procedural impact.  
**Gap noted:** EP-A does not distinguish severity within ASSIGN_ERR. Minor gap — classification: **MINOR** (researcher judgment for ASSIGN_ERR severity; most cases will be clearly INVALID or clearly harmless).

**Non-invalidation clause verified:** EP-A Section 12.3 — sessions NOT invalid because of unfavorable ratings, conflict with Pilot, "비슷하다" for all, or participant confusion. ✓

**Invalid session procedure result: PASS** (one MINOR gap in ASSIGN_ERR severity classification)

---

## Section 15. Invalid Stimulus Stress Test

Testing EP-A Section 13 for 5 hypothetical STIMULUS_INVALID triggers:

**1. Unsupported factual claim (Condition A O-1 states "오동도 동백꽃은 3-5월 절정" — not in PU-OD-001):**  
14-item checklist item #9 (EVIDENCE_BOUNDARY) → FAIL → STIMULUS_INVALID  
Condition A O-1 NOT exposed to participants. Regenerate A arm. Re-freeze. ✓

**2. Context leakage (Condition B H-3 addresses 오동도 instead of 향일암 transport):**  
14-item checklist item #10 (CONTEXT_FIDELITY) → FAIL → STIMULUS_INVALID  
Regenerate B arm. ✓

**3. Live-state mismatch (A used cached 케이블카 fare ₩15,000; B used frozen ₩17,000):**  
14-item checklist item #11 (LIVE_CORRECTNESS) → FAIL for A → STIMULUS_INVALID  
Both arms must use identical frozen state. Regenerate A arm. ✓

**4. H-2 violation (A says "괜찮아요" without ASK):**  
14-item checklist item #12 → FAIL → STIMULUS_INVALID  
Pre-session H-2 checklist also catches. Not exposed to participants. ✓ (Already demonstrated in Section 10.)

**5. A/B Evidence inequality (B arm includes extra route time data from Travel Time Matrix not in specified PU-HY-006):**  
14-item checklist item #3 (same Evidence Pool) → FAIL for B → STIMULUS_INVALID  
Regenerate B arm. ✓

**All 5 hypothetical triggers:** correctly produce STIMULUS_INVALID → controlled remediation path → re-freeze → 14 checks → resume. No silent repair. ✓

**Invalid stimulus procedure result: PASS**

---

## Section 16. Live Information Control Test

**Simulated scenario:** After stimulus freeze, researcher learns that 향일암 has changed admission fee from ₩2,000 to ₩3,000.

**EP-A policy (Section 14):**
- Frozen Live State Registry contains the value frozen at generation time
- ALL participants evaluate the same frozen state, regardless of real-world changes during testing
- Operator must NOT silently update one participant's stimulus with the new ₩3,000 fee

**EP-A Section 14.1:** "Once frozen, these values apply to ALL stimuli regardless of actual live state during participant sessions." ✓

**Expected operator action:**  
- Continue using frozen ₩2,000 value for all participants in this HBT run
- Note the discrepancy in Stimulus Correction Log as "Live-state drift observed post-freeze — frozen value preserved per protocol"
- The LIVE_BOUNDARY behavior ("최신 요금은 공식 사이트 확인 권장") already covers this — participants are told to verify, so the frozen vs. actual discrepancy is acknowledged by the response itself ✓

No web search needed. No participant-specific update needed. Procedure clear and executable. ✓

**LIVE_CONTROL_OPERABILITY = PASS**

---

## Section 17. Facilitator Neutrality Test

Checking EP-A Section 8 (facilitator script) and Section 7 (blinding procedure) for neutrality violations:

**Biased language check — prohibited phrases:**

| Phrase | Present in EP-A Script? | Assessment |
|---|---|---|
| "이 답변이 더 자세하죠?" | NOT present | ✓ |
| "보통 이쪽을 더 좋아합니다." | NOT present | ✓ |
| "이게 새로운 방식입니다." | NOT present | ✓ |
| "이 답변이 더 똑똑한 모델이에요." | NOT present | ✓ |

**Tone check per script stage:**  
- Opening: "감사합니다" — warm, neutral ✓  
- Study explanation: "정답이 없습니다" — actively anti-coaching ✓  
- Rating instruction: "느끼시는 대로 평가해 주세요" — neutral elicitation ✓  
- Clarification rule for "questions back" response: explicitly prohibits saying "asking is correct behavior" ✓  
- Closing: "AI 여행 안내 서비스 개선에 활용될 예정" — accurate, does not imply B wins ✓

**Structural neutrality:**  
- Responses presented as 응답 가 / 응답 나 (no valence in labels) ✓  
- Facilitator does not control which is shown first (counterbalancing handles this) ✓  
- Facilitator does not react to participant's Forced Choice (no "좋은 선택이에요" type comment) ✓  

**One potential neutrality risk (OBSERVATION):**  
EP-A does not specify whether the facilitator reads the responses aloud or the participant reads silently. If read aloud, facilitator tone/emphasis could inadvertently favor one arm. Classification: OBSERVATION — operator should document that participants read silently, not that the facilitator reads aloud. Not a structural gap.

**Facilitator neutrality result: PASS** (one OBSERVATION on oral vs. silent reading)

---

## Section 18. Session Burden Review

Structural burden estimate (EP-A Section 10 time estimates):

| Phase | EP-A Estimate | Structural Assessment |
|---|---|---|
| A. Consent / Intro | 5 min | Low |
| B. Participant Profile | 3 min | Low |
| C. Instructions | 5 min | Low |
| D. Single-turn (9 scenarios) | 30–40 min | **HIGH** — primary burden |
| E. MT-1 | 10–15 min | Moderate–High |
| F. Qualitative wrap-up | 5–10 min | Low–Moderate |
| G. Completeness check | 2 min | Low |
| H. Session close | 2 min | Low |
| **Total** | **~60–80 min** | **MODERATE–HIGH** |

**Breakdown of D (single-turn load):**  
9 scenarios × (read 2 responses + rate 12 cells + 1 Forced Choice) = 9 × ~4 min = ~36 min  
This is the primary fatigue risk.

**Identified fatigue points:**  
1. Scenarios 7–9 (positions 7–9 in ordering): cognitive fatigue from repeated rating structure likely. Response differentiation may decrease.
2. MT-1 immediately follows — a different format, which may actually reset attention.
3. Qualitative prompts after MT-1: OBSERVATION — by scenario 9 + MT-1, qualitative responses may be briefer. This is typical of within-session fatigue and is not a validity threat — it is an expected limitation.

**Classification: MODERATE–HIGH burden**. Within acceptable range for a focused research session with motivated participants. No structural redesign warranted or permitted.

**OBSERVATION:** A short optional mid-session break between scenarios 5 and 6 might reduce fatigue effect. EP-A does not specify this. Operator should decide before first session and apply consistently. (OBSERVATION only — BTD-A does not prohibit a procedural break.)

---

## Section 19. Operator Decision Inventory

Inventorying all points where facilitator/operator must make a judgment:

| Decision Point | EP-A Coverage | Classification |
|---|---|---|
| Participant assignment lookup (which ordering, which arm binding) | Fully specified in Section 6 table | FULLY_SPECIFIED |
| Eligibility determination (any REQUIRED = N → ineligible) | Fully specified in Section 16 | FULLY_SPECIFIED |
| Opening script delivery | Fully specified in Section 8 | FULLY_SPECIFIED |
| Study explanation | Fully specified in Section 8 | FULLY_SPECIFIED |
| Rating form explanation | Fully specified in Section 8 | FULLY_SPECIFIED |
| Scenario presentation order | Fully specified by ordering table | FULLY_SPECIFIED |
| When to move to next scenario | Participant completes ratings and FC — implicit from flow | BOUNDED_DISCRETION (facilitator decides "ready to proceed") |
| How to present responses (screen vs. paper) | NOT specified | **MINOR** (not UNSPECIFIED at structural level — medium is a logistics choice, not a research design decision) |
| Whether responses are shown simultaneously or sequentially | NOT specified | **MINOR** (same — logistics, not design) |
| MT-1 turn progression | EP-A Section 1.2 defines turn content; Section 10 says "순서대로 읽으시면서" | BOUNDED_DISCRETION (facilitator controls pacing) |
| Handling "어느 답이 더 좋은 거예요?" | Fully specified in Section 9 | FULLY_SPECIFIED |
| Handling "응답 가와 나는 서로 다른 AI인가요?" | NOT specified in Section 9 | MINOR (see Section 7 above) |
| Handling "이 장소를 잘 모르는데" | NOT specified in Section 9 | MINOR (see Section 7 above) |
| Mid-session break | NOT specified | OBSERVATION (not structural) |
| Missing single dimension rating (A only, not whole scenario) | NOT specified | MINOR |
| Invalid session FLAG decision timing (during vs. after session) | "During or immediately after session" — Section 12.2 | BOUNDED_DISCRETION ✓ |
| ARM_IDENTIFIED confirmation (YES/NO judgment) | EP-A provides the question; facilitator answers based on observation | BOUNDED_DISCRETION ✓ |
| ASSIGN_ERR severity classification | NOT specified | MINOR |
| ARM_IDENTIFIED source investigation before next session | "Investigate source before next session" — Section 7.3 | BOUNDED_DISCRETION (how to investigate is not specified — acceptable) |
| Participant oral vs. silent reading | NOT specified | OBSERVATION |
| MT-1 incomplete (2/3 turns) → UNDER_REVIEW | Not listed in INCOMPLETE_EVALUATION triggers | MINOR |

**Totals:**
- FULLY_SPECIFIED: 9
- BOUNDED_DISCRETION: 5 (all acceptable — operator discretion within defined range)
- UNSPECIFIED (structural): **0**
- MINOR (minor gaps — not structurally blocking): 7
- OBSERVATION: 3

**No structural execution decision is UNSPECIFIED.** All MINOR items are logistics or edge-case clarifications, not design decisions.

---

## Section 20. Issues

All issues discovered during DR-B dry run:

### BLOCKING Issues

**None.**

### MAJOR Issues

**None.**

### MINOR Issues

| ID | Section | Description | Recommended Correction |
|---|---|---|---|
| DR-B-M-001 | Script walkthrough (Section 6) | Stimulus presentation medium not specified (screen vs. paper, simultaneous vs. sequential per response) | Add one sentence to EP-A Section 10 Step D: "두 응답을 동시에 보여주거나 인쇄물로 나란히 제시한다. 발표 형식을 모든 세션에서 일관되게 적용한다." |
| DR-B-M-002 | Clarification (Section 7) | "응답 가와 나는 서로 다른 AI인가요?" not covered in EP-A Section 9 standardized replies | Add: "두 응답 모두 AI 응답입니다. 어떤 방식으로 만들어졌는지는 말씀드리기 어렵습니다." |
| DR-B-M-003 | Clarification (Section 7) | "이 장소를 잘 모르는데" / "여수를 가본 적이 없는데" not covered in EP-A Section 9 | Add: "네, 괜찮아요. 응답이 얼마나 도움이 되고 전문가 같은 느낌인지를 평가해 주시면 됩니다." |
| DR-B-M-004 | Completeness (Section 13) | Single missing dimension rating within a scenario not addressed in EP-A (threshold is scenarios, not items) | Add to EP-A Section 12: "단일 항목 누락 시 참여자에게 즉시 재요청 ('이 항목만 평가해 주시겠어요?'). 재요청 불가능 시 Issue_Description에 기록, session VALID." |
| DR-B-M-005 | Completeness (Section 13) | Mid-session break not specified | Add to EP-A Section 10: "참여자가 휴식을 요청하는 경우, 현재 시나리오 완료 후 잠깐 쉬도록 하고 재개한다. 블라인딩 유지 — 대기 중 응답 열람 금지." |
| DR-B-M-006 | Completeness (Section 13) / Invalid Session (Section 14) | MT-1 incomplete (2/3 turns) not listed as explicit INCOMPLETE_EVALUATION trigger | Add to EP-A Section 12.1: "MT_INCOMPLETE: MT-1 블록이 3턴 미만으로 완료된 경우 → UNDER_REVIEW, 완료 불가 시 Issue_Description 기록." |
| DR-B-M-007 | Invalid Session (Section 14) | ASSIGN_ERR severity not classified (structural vs. harmless bookkeeping) | Add to EP-A Section 12.2 REVIEW: "ASSIGN_ERR 심각도 판단: H-2 포지션 위반 또는 arm binding 오류 → INVALID. 순서 기록 오류만 (실제 제시는 올바름) → VALID with note." |

### OBSERVATIONS

| ID | Section | Description |
|---|---|---|
| DR-B-OBS-001 | Session burden (Section 18) | Mid-session break (between scenarios 5-6) may reduce fatigue. Operator should decide and apply consistently. |
| DR-B-OBS-002 | Neutrality (Section 17) | Facilitator should confirm participants read responses silently, not that facilitator reads aloud. |
| DR-B-OBS-003 | MT-1 (Section 11) | MT-1 turn presentation format (sequential vs. simultaneous per turn) should be decided and documented before first session. |

---

## Section 21. DR-B Verdict

### Pass Criteria Check

| Criterion | Result |
|---|---|
| Blinding executable | ✓ PASS |
| Assignment deterministic | ✓ PASS |
| Facilitator script executable without improvisation | ✓ PASS (minor gaps are logistics, not structural) |
| Clarification rules sufficient (no UNSPECIFIED structural questions) | ✓ PASS (minor gaps identified, all bounded) |
| Six dimensions operationally distinguishable | ✓ PASS |
| Forced Choice operational | ✓ PASS |
| H-2 contract enforceable | ✓ PASS |
| MT-1 executable | ✓ PASS |
| Data capture executable | ✓ PASS |
| Invalid-session handling executable | ✓ PASS |
| Invalid-stimulus handling executable | ✓ PASS |
| Live control executable | ✓ PASS |
| No BLOCKING issues | ✓ PASS — 0 blocking |
| No unresolved MAJOR validity issues | ✓ PASS — 0 major |
| No UNSPECIFIED structural operator decision | ✓ PASS — 0 structural UNSPECIFIED |

**All 15 pass criteria: MET.**

### DR_B_STATUS = READY_FOR_RECRUITMENT

The 7 MINOR issues identified are corrective recommendations for EP-A Section 9 and Section 12. They do not block participant sessions. They represent clarifications and logistics specifications that a competent facilitator can navigate with bounded improvisation.

**Recommended path:** Apply 7 MINOR corrections to EP-A (creating EP-A V0.2 or inline annotations) before first participant session. This is NOT a DR-B prerequisite — it is a quality recommendation.

---

## Section 22. Recruitment Readiness

**DR_B_STATUS = READY_FOR_RECRUITMENT**

**RECRUITMENT_READINESS = READY**

This does NOT mean recruitment is executed. Founder decision is required before any participant contact.

The recruitment readiness status means: the procedure is sufficiently specified that participant sessions can be conducted without structural improvisation. Minor EP-A clarifications are recommended before the first session.

---

## Section 23. Explicit Non-Actions

This DR-B run did NOT:

- Modify BTD-A (design authority preserved intact)
- Modify EP-A (execution authority preserved intact; corrections are recommendations only)
- Generate Participant Evidence of any kind
- Store DRY_RUN_DUMMY_DATA as Participant Evidence
- Recruit real participants
- Contact anyone for participation
- Schedule real sessions
- Execute the Human Blind Test
- Assign BT Verdict
- Collect new place Evidence
- Perform web research
- Conduct HY-009, CX-001, YTC Coverage, or Traveler Reaction research
- Create a Candidate or Architecture Decision
- Migrate place_knowledge to DB
- Change DB schema, runtime, or production systems

---

## Audit Checklist (A through AR)

| ID | Check | Result |
|---|---|---|
| A | Actual starting HEAD recorded (01b6a88 — verified from repo) | PASS |
| B | Project State read first | PASS |
| C | Current Next Action = DR-B confirmed | PASS |
| D | BTD-A frozen — not modified | PASS |
| E | EP-A frozen — not modified | PASS |
| F | Simulated participant only (DRY_RUN_DUMMY — not real) | PASS |
| G | No Participant Evidence created | PASS |
| H | Assignment tested for P01, P02, P08, P09, P16, P17, P24 | PASS |
| I | Blinding tested — PASS | PASS |
| J | Full script walked through (Opening → Closing) | PASS |
| K | Clarification stress test (7 questions) completed | PASS |
| L | Six dimensions operability tested — PASS | PASS |
| M | Forced Choice tested — PASS | PASS |
| N | H-2 tested (7-item checklist) — all PASS | PASS |
| O | Hypothetical H-2 failure correctly detected → STIMULUS_INVALID | PASS |
| P | MT-1 tested (all 3 turns) — PASS | PASS |
| Q | 32-field data capture tested with DRY_RUN_DUMMY_DATA | PASS |
| R | Dummy data excluded from Participant Evidence | PASS |
| S | Completeness procedure tested (5 scenarios A–E) | PASS |
| T | Invalid-session procedure tested (6 triggers) | PASS |
| U | Invalid-stimulus procedure tested (5 triggers) | PASS |
| V | Live control tested — PASS | PASS |
| W | Facilitator neutrality tested — PASS | PASS |
| X | Session burden reviewed — MODERATE–HIGH | PASS |
| Y | Operator decisions inventoried — 0 UNSPECIFIED | PASS |
| Z | Issues classified (0 BLOCKING / 0 MAJOR / 7 MINOR / 3 OBS) | PASS |
| AA | No silent corrections (BTD-A and EP-A unchanged) | PASS |
| AB | Recruitment readiness determined — READY | PASS |
| AC | No real recruitment | PASS |
| AD | No real sessions | PASS |
| AE | HBT Executed = FALSE | PASS |
| AF | Participant Evidence = NONE | PASS |
| AG | BT Verdict = NOT_ASSIGNED | PASS |
| AH | No new Evidence/web research | PASS |
| AI | No unrelated research | PASS |
| AJ | No Candidate/Architecture Decision | PASS |
| AK | No schema/runtime/prod change | PASS |
| AL | DR-B artifact persisted (this document) | PASS |
| AM | Project State updated | PENDING (next step) |
| AN | Exactly one Next Action | PASS |
| AO | Next Action not executed | PASS |
| AP | Git diff to be inspected before commit | PENDING |
| AQ | Commit to be pushed | PENDING |
| AR | Local/remote HEAD to be verified | PENDING |

---

## ONE NEXT ACTION

**DR_B_STATUS = READY_FOR_RECRUITMENT**

**ONE NEXT ACTION:** Design participant recruitment protocol V0.1 — define recruitment channels, screening procedure, scheduling approach, and consent framework. **Founder decision required before any actual participant contact.**

Do NOT execute.
