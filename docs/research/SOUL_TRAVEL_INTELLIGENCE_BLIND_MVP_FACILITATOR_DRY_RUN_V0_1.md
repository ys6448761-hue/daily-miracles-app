# SOUL Travel Intelligence
# Blind MVP Test — Facilitator Dry Run V0.1

**Date:** 2026-09-27
**Branch:** staging/storybook-c7a
**Base Checkpoint:** 20368ec
**Status:** FACILITATOR DRY RUN V0.1 — COMPLETE / NON-EVIDENTIARY

**Dry-Run Verdict:** `DR-B — FACILITATOR DRY RUN PASS WITH PROCEDURAL CORRECTIONS`
**Independent Review:** `DR-B — CONFIRMED / PASS WITH PROCEDURAL CORRECTIONS`

---

## Purpose

This document records the complete facilitator-side walkthrough of the approved Blind MVP Test Execution Package V0.1 using dummy identity DRYRUN-001.

This dry run is NON-EVIDENTIARY. It validates operational process only.

This dry run does NOT constitute:
- Participant Evidence
- user validation
- SOUL preference evidence
- Baseline comparison evidence
- BT-A/B/C/D evidence

Participant Evidence: NONE
Blind MVP Test: NOT YET EXECUTED
BT Verdict: NOT ASSIGNED

---

## Selected Profile

**DRYRUN-001 / Profile P2**

P2 selected to represent the 3/4 split (SOUL=A minority / SOUL=B majority) and to verify Layer 1 starting with SOUL=A (S5).

**P2 scenario-level assignment:**

| Scenario | Layer | SOUL Assignment | Card Version |
|---|---|---|---|
| S5 (L1 first) | L1 | SOUL=**A** | α |
| S6 (L1 second) | L1 | SOUL=B | β |
| S3 (L1 third) | L1 | SOUL=B | β |
| S1 (L1 fourth) | L1 | SOUL=B | β |
| S4 (L2 first) | L2 | SOUL=**A** | α (R1+R2) |
| S7 (L2 second) | L2 | SOUL=B | β (R1+R2) |
| S2 (L2 third) | L2 | SOUL=**A** | α (R1+R2) |

**SOUL=A count: 3 / SOUL=B count: 4 / Split: 3/4 ✓**

---

## 1. Profile Assignment Check

**PASS**

| Check Item | Result |
|---|---|
| Participant number → profile lookup integrity | ✓ P-001=P1, P-002=P2 lookup is immediate |
| Profile assignment without design interpretation | ✓ Table lookup only — self-contained |
| All 7 scenarios have A/B card version specified | ✓ Each scenario has α/β designation |
| Profile contains both SOUL=A and SOUL=B | ✓ P2: S2/S4/S5=A, S1/S3/S6/S7=B |
| Split is 4/3 or 3/4 | ✓ 3/4 confirmed |

---

## 2. Card Handling Check

**PASS WITH PROCEDURAL NOTE → OI-201**

The execution package scenario cards embed both versions in a single document using `[α: text] / [β: text]` facilitator-reference annotations. A facilitator can correctly identify the right response text.

However: participant-facing physical cards must not include `[α:]` / `[β:]` annotations. The package does not explicitly specify how to prepare clean participant-facing printed cards by stripping these facilitator labels.

| Check Item | Result |
|---|---|
| Correct scenario card identification | ✓ §E contains all cards |
| Correct A/B version identification by facilitator | ✓ α/β annotations allow facilitator distinction |
| No condition identity leak to participant | ✓ (conditional on OI-201 correction) |
| No facilitator-only α/β markers visible to participant | ✓ (requires print preparation) |
| No stale stimulus version contamination | ✓ Document version header present |

**OI-201 → §Operational Issues**

---

## 3. Layer 1 Flow Check

**PASS (all 4 scenarios)**

P2 L1 order: S5 → S6 → S3 → S1

**S5 (α: SOUL=A):** Situation → question → Response A (SOUL) / Response B (Baseline) → 6 A ratings → 6 B ratings → Forced Choice → reason → S5 LIVE_VERIFY trust scale. PASS.

**S6 (β: SOUL=B):** Situation → question → Response A (Baseline) / Response B (SOUL) → ratings → Forced Choice → reason → [after evaluation complete] S6 style leakage check. Leakage check correctly placed AFTER full evaluation. PASS.

**S3 (β: SOUL=B):** Situation → question → ratings → Forced Choice → reason → S3 INSUFFICIENT honesty scale. PASS.

**S1 (β: SOUL=B):** Situation → question → ratings → Forced Choice → reason. No S1-specific behavior question (correctly absent per §F). PASS.

---

## 4. Layer 2 Flow Check

**PASS (all 3 scenarios)**

P2 L2 order: S4 → S7 → S2

**S4 (α: SOUL=A, R1+R2 both α):**
- R1: Response A (SOUL: "많이 지치셨나 봐요...") / Response B (Baseline: "지치셨군요...")
- PART 1 complete: Q1–Q6 ×2 + immediate preference + willingness + understood
- ★ STOP — R2 not yet distributed ✓
- Update: "이순신광장 근처에 있어요." — both conditions receive same update ✓
- R2: Response A (SOUL) / Response B (Baseline)
- R1 condition identity (SOUL=A) = R2 condition identity (SOUL=A) ✓

**S7 (β: SOUL=B, R1+R2 both β):**
- R1: Response A (Baseline: "향일암이 안 되셨군요...") / Response B (SOUL: "아쉬우셨겠어요...")
- STOP ✓ / Update: "향일암 근처인데 차가 있어요." ✓
- R1 condition identity (SOUL=B) = R2 condition identity (SOUL=B) ✓

**S2 (α: SOUL=A, R1+R2 both α):**
- R1: Response A (SOUL: "지금 정보만으로는...") / Response B (Baseline: "여수해상케이블카는 편도와...")
- STOP ✓ / Update: "자산 쪽에 있어요." ✓
- R1 condition identity (SOUL=A) = R2 condition identity (SOUL=A) ✓

All 3 Layer 2 scenarios: R1 condition identity = R2 condition identity ✓

---

## 5. Round-2 Concealment Classification

### DR-C2

`Manageable reveal risk — procedural safeguard needed`

The Layer 2 flow Step 3 explicitly states "★ STOP — Round 2 카드를 아직 배포하지 않는다". This text instruction is clear. However, the package does not specify a physical separation method (separate sealed envelope, separate card stack) that prevents accidental distribution if all scenario materials are in a single facilitator stack.

Classification: DR-C2 — not DR-C3 because Step 3 is explicit and Preflight item 7 already exists. A procedural preparation note resolves this.

**OI-202 → §Operational Issues**

---

## 6. Response-Form Flow Check

**PASS WITH PROCEDURAL NOTE → OI-203**

| Check Item | Result |
|---|---|
| 6 dimensions shown independently | ✓ Q1–Q6 individual items |
| No composite score | ✓ NO COMPOSITE explicitly stated in schema |
| A and B rated independently | ✓ Response A section / Response B section separate |
| Forced Choice 4 options | ✓ A / B / 둘 다 비슷함 / 둘 다 받고 싶지 않음 |
| Layer 2 fields at correct timing | ✓ PART 1 / PART 2 separated |
| BQ1–BQ8 after scenarios complete | ✓ Final cross-scenario questions |
| BQ1–BQ8 no A/B condition labels | ✓ Behavior-type questions |
| S6 leakage question after evaluation | ✓ "평가 완료 후 제시" specified |

**OI-203:** The Response B section is described as "동일 6개 항목 반복" without explicit section heading or independent numbering in the physical form specification. Without explicit "Response B" heading and independent numbering (B-Q1–B-Q6 or Q7–Q12), participants may confuse A ratings with B ratings on a physical printed form.

**OI-203 → §Operational Issues**

---

## 7. Observer-Blinding Verdict

### OB-B

`Observer may learn condition identity for logistical reasons; manageable if Observer_Condition_Aware=YES is recorded.`

In the expected MVP configuration (Founder/Lumi team operating as facilitator and observer), the observer will have logistical awareness of condition identity from managing the assignment cards. Complete condition blinding is operationally unavailable.

The package handles this correctly:
- `Observer_Condition_Aware = YES/NO` flag present in observer sheet ✓
- Record A/B reactions only; decode condition post-collection via randomization sheet ✓
- YES recording means elevated caution in analysis ✓

OB-C is not applicable: condition identity awareness is not structurally blocked. The Observer_Condition_Aware flag, when systematically recorded, enables analytical correction.

---

## 8. Facilitator Script Verdict

**PASS WITH PROCEDURAL NOTE → OI-204**

**Standard question walkthrough:**

| Expected Question | Standard Response Present | Condition Leak Risk | Philosophy Explanation Risk |
|---|---|---|---|
| "어느 답변이 맞는 거예요?" | ✓ Script table | None | None |
| "이 도우미가 왜 그런 질문을 한 건가요?" | ✓ Script table | None | None |
| "어느 쪽이 더 좋은 AI예요?" | ✓ Script table | None | None |
| "이게 실제 사용 가능한 앱인가요?" | **Not in table** | None | Low |

**OI-204:** "이게 실제 사용 가능한 앱인가요?" or "어디서 사용할 수 있어요?" may arise in real participant sessions. The answer is implied by the participant introduction but is not in the lookup table. A facilitator improvising this answer risks adding information about development status, launch timeline, or system identity.

**OI-204 → §Operational Issues**

---

## 9. Randomization Operational Check

**PASS**

**P2 operational walkthrough:**

| Check Item | Result |
|---|---|
| L1 scenario order: S5→S6→S3→S1 | ✓ Immediate table lookup |
| L1 A/B mapping: S5=α, S6=β, S3=β, S1=β | ✓ Profile column lookup |
| L2 scenario order: S4→S7→S2 | ✓ Immediate table lookup |
| L2 mapping: S4=α(R1+R2), S7=β(R1+R2), S2=α(R1+R2) | ✓ Layer 2 identity consistency matrix |
| S6 position: L1 second (2/4) | ✓ Not always same position ✓ |
| No manual inference required | ✓ Table lookup only |

**Other profiles spot-checked:**

P1 (4/3): SOUL=A: S1/S3/S6/S7=4, SOUL=B: S2/S4/S5=3 → 4/3 ✓ / L2 identity consistent ✓
P3 (4/3): SOUL=A: S1/S2/S4/S5=4, SOUL=B: S3/S6/S7=3 → 4/3 ✓ / L2 identity consistent ✓
P4 (3/4): SOUL=A: S3/S6/S7=3, SOUL=B: S1/S2/S4/S5=4 → 3/4 ✓ / L2 identity consistent ✓

**Per-scenario 2A/2B balance across all profiles:**

| S1 | S2 | S3 | S4 | S5 | S6 | S7 |
|---|---|---|---|---|---|---|
| 2A/2B ✓ | 2A/2B ✓ | 2A/2B ✓ | 2A/2B ✓ | 2A/2B ✓ | 2A/2B ✓ | 2A/2B ✓ |

No operational discrepancy found.

---

## 10. Raw Data Capture Check

**PASS**

All fields confirmed present (DRYRUN_FIELD_PRESENT = YES):

Background table: Participant_ID / Travel_Frequency / Yeosu_Experience / AI_App_Usage / Companion_Type / Group_A/B/C / Profile — all YES

Scenario response table: A_Q1–A_Q6 / B_Q1–B_Q6 / Forced_Choice / Qualitative_Reason / A_Condition / B_Condition — all YES

Layer 2 additional: R1_Forced_Choice / Continue_Willingness / Question_Understood / R2_Forced_Choice / Preference_Shift / Preference_Shift_Direction / Question_Value / Qualitative_Reason_R2 — all YES

Behavior / S6 leakage / BQ1–BQ8 / Observer tables: all YES

Observer_Condition_Aware field: YES ✓

All participant response fields have corresponding schema entries.

---

## 11. Privacy Check

**PASS**

| Field | Required |
|---|---|
| Real name | No — replaced by Participant_ID |
| Phone number | No |
| Exact address | No |
| Email / social ID | No |
| Photo / video | No — observer notes replace |

Anonymous Participant_ID sufficient for all operations. Participant_ID ↔ real person mapping is Founder-only custody.

---

## 12. Operational Issues Table

| Issue ID | Class | Location | Problem | Minimum Correction | Stimulus Modified |
|---|---|---|---|---|---|
| OI-201 | OI-2 (Procedural) | §E Scenario Cards | Package embeds α/β in single document. No explicit instruction for preparing clean participant-facing printed cards with annotations stripped. If printed with annotations visible, facilitator labels are exposed to participants. | Add facilitator preparation rule: "For each scenario, print α-version and β-version as separate physical cards. Remove all [α:] / [β:] annotations. Participant card shows only situation, question, Response A, Response B." | NO |
| OI-202 | OI-2 (Procedural) | §G Layer 2 Flow | Physical separation method for R2 cards is not specified. No "separate envelope" or "separate stack" instruction. Facilitator may accidentally distribute R1 and R2 cards together. | Add facilitator preparation rule: "For Layer 2 scenarios (S2/S4/S7), prepare R2 cards in a separate sealed or labeled facilitator envelope — or a physically separate card stack — from R1 cards. Confirm separation at Preflight item 7." | NO |
| OI-203 | OI-2 (Procedural) | §F Response Form | Response B section is described only as "동일 6개 항목 반복" with no explicit heading or independent numbering. Participants on a physical printed form may confuse A ratings with B ratings. | In physical form design: include explicit "Response B 평가" section heading and independent numbering (B-Q1–B-Q6 or Q7–Q12). | NO |
| OI-204 | OI-2 (Procedural) | §H Facilitator Script | "이게 실제 사용 가능한 앱인가요?" is not in the standard response table. Facilitator improvising this answer risks disclosing development status, launch timeline, or system identity. | Add to script table: "이게 실제 앱인가요?" / "어디서 사용할 수 있어요?" → "오늘은 응답 방식에 대한 피드백을 수집하는 자리예요. 서비스 출시 관련 내용은 오늘 범위 밖이에요." | NO |

**OI-3 (Measurement Risk): NONE**
**OI-4 (Execution Blocker): NONE**

---

## 13. Canonical Stimulus Freeze Check

| Stimulus | Modified |
|---|---|
| S1 SOUL / Baseline | NO |
| S2 SOUL R1/R2 / Baseline R1/R2 | NO |
| S3 SOUL / Baseline | NO |
| S4 SOUL R1/R2 / Baseline R1/R2 | NO |
| S5 SOUL / Baseline | NO |
| S6 SOUL / Baseline | NO |
| S7 SOUL R1/R2 / Baseline R1/R2 | NO |
| S2 update: "자산 쪽에 있어요." | NO |
| S4 update: "이순신광장 근처에 있어요." | NO |
| S7 update: "향일암 근처인데 차가 있어요." | NO |
| S6 style leakage handling | NO |

**CANONICAL STIMULI MODIFIED: NO — FROZEN / UNCHANGED**

No stimulus conflict or discrepancy found during dry run.

---

## 14. Three-Perspective Review

### World

Can a general facilitator with no research history operate the package?

The core structure (profile lookup, scenario order, form usage) is executable by table lookup alone. Preflight 13 items address the most common error paths. The Layer 2 Step 3 STOP instruction is clear. OI-201 through OI-204 all stem from "how to physically prepare" — not from gaps in research design. These are operational preparation issues resolvable by facilitator preparation notes without changing canonical documents.

### Phoenix

Does the package faithfully implement the approved BTD-A design without introducing new judgment?

Canonical stimulus integrity confirmed across all scenarios. No stage exposes SOUL/Baseline labels to participants (conditional on OI-201 correction). Six dimensions recorded independently. BQ1–BQ8 do not function as condition comparison evidence. Layer 2 R1/R2 condition consistency verified for all 3 scenarios across all 4 profiles. The package is a faithful operational implementation.

### Originality

Can real participant behavior reveal the value of the SOUL interaction model without facilitator contamination?

Forced Choice includes "둘 다 받고 싶지 않음" — negative outcome expression enabled. Facilitator script explicitly prohibits condition-biasing behavior. Observer sheet records behavior, not interpretation. OI-204 correction reduces facilitator improvisation risk. Within-participant mixed A/B assignment (all profiles) prevents single-participant position bias from contaminating full session results.

---

## 15. Governance

| Item | Status |
|---|---|
| Candidate Generated | NO |
| Participant Evidence | NONE |
| Blind MVP Test | NOT YET EXECUTED |
| BT Verdict | NOT ASSIGNED |
| Canonical Stimuli Modified | NO |
| New RQ | NO |
| Architecture Changed | NO |
| place_knowledge migration | NOT APPROVED / HOLD |
| DB / Schema / Runtime / Production | NO CHANGE |
| Repository HEAD | 20368ec (unchanged at dry-run time) |
| Files written | This report only |
| Commit | Pending — see §Commit |

---

## 16. Correction Disposition

| OI | Classification | Disposition |
|---|---|---|
| OI-201 | OI-2 Procedural | RESOLVED BY PROCEDURAL CORRECTION — rule added to Execution Package §E |
| OI-202 | OI-2 Procedural | RESOLVED BY PROCEDURAL CORRECTION — rule added to Execution Package §G + Preflight item 7 |
| OI-203 | OI-2 Procedural | RESOLVED BY PROCEDURAL CORRECTION — A-Q1–A-Q6 / B-Q1–B-Q6 labeling specification added to §F |
| OI-204 | OI-2 Procedural | RESOLVED BY PROCEDURAL CORRECTION — "이게 실제 앱인가요?" added to §H script table |

All four corrections: physical preparation notes or script table addition only.
No canonical stimulus was changed.
No measurement construct was changed.
No randomization was changed.
No evaluation dimension was changed.

---

## 17. Final Dry-Run Verdict

### DR-B

`FACILITATOR DRY RUN PASS WITH PROCEDURAL CORRECTIONS`

Core design: operationally sound.
Profile assignment: PASS.
Layer 1 flow: PASS.
Layer 2 flow: PASS (all 3 scenarios, R1/R2 identity consistent).
Round-2 concealment: DR-C2 — manageable.
Response-form flow: PASS (with OI-203 preparation note).
Observer blinding: OB-B — manageable.
Facilitator script: PASS (with OI-204 addition).
Randomization: PASS.
Raw data capture: PASS.
Privacy: PASS.

OI-201 / OI-202 / OI-203 / OI-204: RESOLVED BY PROCEDURAL CORRECTIONS
OI-3: NONE
OI-4: NONE
Canonical Stimuli: FROZEN / UNCHANGED
Participant Evidence: NONE
BT Verdict: NOT ASSIGNED

---

*SOUL Travel Intelligence Blind MVP Test — Facilitator Dry Run V0.1 — 2026-09-27*
