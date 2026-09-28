# SOUL Yeosu Research Pilot
# HY-008 Founder Governance Decision V0.1

**Date:** 2026-09-28
**Branch:** staging/storybook-c7a
**Starting HEAD:** 53035d5
**Controlled Collection Cycles:** 25 (UNCHANGED — governance decision ≠ evidence cycle)

**Status:** FOUNDER_DECISION_RECORDED — OPTION_B_APPROVED

---

## 0. Starting Checkpoint

Branch: staging/storybook-c7a ✓
Local HEAD: 53035d5 ✓
Remote HEAD: 53035d5 ✓
Working tree: clean (untracked files only) ✓

Expected state confirmed:
- Controlled Collection Cycles: 25
- WAVE_4_COLLECTION_EXECUTION_COMPLETE: TRUE
- ALL_WAVE_4_ERS_VERIFIED: FALSE
- HY-003: PROVISIONALLY_SUPPORTED / ACCEPT_PROVISIONAL_WITH_BOUNDARY / EP-3: PARTIAL_PASS
- HY-008: HARD BLOCKED
- Governance Review recommendation: OPTION B
- Current Next Action at entry: Founder HY-008 Governance Decision

---

## 1. Decision Context

**Referenced artifact:**
`docs/research/SOUL_YEOSU_HY_008_GOVERNANCE_DECISION_REVIEW_V0_1.md`

The Governance Decision Review (committed at 53035d5) established:
- HY-008 is NOT a hard prerequisite for any downstream gate under canonical contracts
- Option B is governance-valid and reversible
- Pilot diagnostic value for H-2 is HIGH under Option B (MISSED_NECESSARY_ASK test)
- EARLY_REPEAT_SIGNAL supports moving to preparation phase
- Reopen conditions R1–R5 defined and preserved

---

## 2. Founder Decision

**FOUNDER_DECISION: OPTION_B_APPROVED**

HY-008 will remain HARD_BLOCKED. The project proceeds to Prepared Knowledge construction and Internal 3-place Pilot with a documented KNOWN_LIMIT. HY-003 field validation remains open as a reopen path but is not required for the current phase.

**Rationale (from Governance Review — no additions):**
- HY-008 NOT_REQUIRED for Prepared Knowledge construction
- Internal Pilot CONDITIONAL using ASK + QUALIFY (operable now)
- Integrity Gate can evaluate factual grounding and evidence boundary without HY-008
- HY-008 is not a hard prerequisite for Founder Go/No-Go (Wave 4 exit with BLOCKED escalation satisfies Plan V0.2 exit condition)
- H-2 diagnostic value increases with limitation preserved: tests SOUL's evidence-boundary discipline (MISSED_NECESSARY_ASK)
- Option B is reversible: Option A (Founder field validation) remains open at any time
- EARLY_REPEAT_SIGNAL across recent REL ERs (0→3→2 new sources) supports transitioning from collection to preparation phase

---

## 3. HY-003 Preserved State

| Field | Value |
|---|---|
| Status | PROVISIONALLY_SUPPORTED |
| Governance disposition | ACCEPT_PROVISIONAL_WITH_BOUNDARY |
| EP-3 | PARTIAL_PASS |
| Web upgrade path | EXHAUSTED (two targeted attempts failed) |
| Founder field validation | OPEN REOPEN PATH |

HY-003 is NOT upgraded to VERIFIED_FOR_PREPARATION by this decision.

---

## 4. HY-008 Preserved State

| Field | Value |
|---|---|
| Status | HARD_BLOCKED |
| Governance disposition (post-decision) | TERMINAL_FOR_CURRENT_COLLECTION_PHASE |
| Collection status | NOT_COLLECTED |
| Dependency blocker | ER-HY-003 = PROVISIONALLY_SUPPORTED (not VERIFIED) |
| Reopen path | OPEN — see Section 7 |

HY-008 is NOT marked VERIFIED_FOR_PREPARATION.

**KNOWN_LIMIT:**
> Elder-specific descent-friction pattern is not sufficiently established to support a strong negative/suitability boundary. SOUL cannot issue a definitive non-recommendation for mobility-limited travelers at Hyangiram. The threshold below which visiting is inadvisable is not expert-verified.

**Operational behavior under KNOWN_LIMIT:**
- ASK traveler capability (specific: stairs + slope discomfort), NOT age label
- QUALIFY uncertainty around descent friction
- Use known experience friction (steep stairs, ~430 steps, descent also demanding)
- Use known alternative/bypass information (평지길 from ticket office, ~15 min, gentler slope)
- Do NOT infer suitability from "부모님" / "어르신" / demographic terms alone
- Do NOT issue medical or safety guarantees
- Do NOT fabricate a non-recommendation threshold

---

## 5. H-2 Pilot Contract

**Frozen stimulus (do NOT rewrite):** "부모님 모시고 가도 괜찮을까?"

**Expected evidence-bound SOUL behavior:**

SOUL must NOT infer suitability from "부모님" (demographic label = insufficient).
SOUL must recognize that capability information is missing.

The Pilot tests whether SOUL:
1. Triggers the necessary ASK (capability, not age)
2. Remembers supplied context from Turn 1 (MT-1 context test)
3. Avoids age-only inference
4. Uses QUALIFY correctly for descent uncertainty
5. Explains known friction honestly (stairs, descent burden)
6. Avoids unsupported certainty in either direction

**Diagnostic classification:** MISSED_NECESSARY_ASK test case
This is diagnostic behavior, not a production answer template. H-2 is a primary research question about SOUL's evidence-boundary discipline.

---

## 6. Reopen Conditions

HY-003 / HY-008 reopen path remains OPEN under these canonical conditions:

| Code | Condition |
|---|---|
| R1 | Pilot H-2 integrity fails in a way attributable to HY-008 absence (e.g., false reassurance cannot be caught by ASK+QUALIFY) |
| R2 | Founder naturally obtains a qualifying field observation at Hyangiram with an elder traveler (one HIGH-confidence firsthand descent account closes EP-3) |
| R3 | H-2 cannot be handled safely or adequately with ASK + QUALIFY (Integrity Gate finding) |
| R4 | Integrity Gate explicitly requires HY-008 VERIFIED evidence to pass |
| R5 | New contradictory evidence appears undermining current HY-003 PROVISIONAL structure |

No additional reopen conditions are invented. These are exactly those established in the Governance Decision Review.

---

## 7. Wave 4 Closure Semantics

| Metric | Value |
|---|---|
| WAVE_4_COLLECTION_EXECUTION_COMPLETE | TRUE |
| ALL_WAVE_4_ERS_VERIFIED | FALSE |
| HY-008 | HARD_BLOCKED / TERMINAL_FOR_CURRENT_COLLECTION_PHASE |
| Basis for closure | HY-008 BLOCKED with escalation satisfies Plan V0.2 Wave 4 Exit Condition |

Wave 4 is operationally closed for the current collection phase. This does NOT mean evidence is complete. It means all executable ERs are in terminal states (VERIFIED or HARD_BLOCKED with governance disposition).

---

## 8. Cycle Count Rule

Controlled Collection Cycles: **25** (UNCHANGED)

This governance decision is NOT an Evidence Collection Cycle. The cycle count does not increment. It increments only when a canonical Controlled Evidence Collection cycle is executed.

---

## 9. Prepared-Evidence Reuse Observation

| Cycle | ER | New external sources |
|---|---|---|
| 23 | REL-003 | 0 |
| 24 | REL-004 | 3 |
| 25 | REL-006 | 2 |

**Status: EARLY_REPEAT_SIGNAL**

Accumulated evidence appears to be reducing marginal research requirements across REL ERs. This is NOT a proven scaling law, NOT an Evidence Candidate, NOT a SSOT Candidate, NOT an Architecture Decision. Do not promote. Noted as sequencing support for transitioning from collection to preparation phase.

---

## 10. Traveler Condition Hypothesis

**Status: RESEARCH_HYPOTHESIS** (unchanged)

HY-003 / HY-008 remains the clearest 5-layer corpus example:
- Preference layer: wanting to visit Hyangiram
- State layer: traveling with elderly parents
- Condition-Capability layer: stair + slope capability
- Experience-Requirement-Friction layer: ~430-step ascent + descent burden
- Alternative-Mitigation layer: 평지길 bypass

Not promoted to Candidate. Not redefined. The Pilot may generate evidence toward this hypothesis via H-2 behavior.

---

## 11. Downstream Freeze

The following remain unchanged and are NOT executed by this decision:

| Item | Status |
|---|---|
| HY-003 field validation | NOT EXECUTED — OPEN REOPEN PATH only |
| HY-008 collection | NOT EXECUTED — TERMINAL_FOR_CURRENT_COLLECTION_PHASE |
| Wave 5 (HY-009, CX-001) | NOT EXECUTED — P2 supporting depth; not required for 3-place Pilot |
| YTC Coverage Check | NOT EXECUTED — not the canonical immediate next action |
| Prepared Knowledge construction | NOT EXECUTED in this run — Next Action authorized below |
| Internal 3-place Pilot | NOT EXECUTED |
| Integrity Gate | NOT EXECUTED |
| Human Blind Test | HOLD (unchanged) |
| Participant evidence | NONE |
| BT Verdict | NOT ASSIGNED |
| Candidate creation | NO |
| Architecture Decision | NO |
| place_knowledge migration | NOT APPROVED |
| DB / Schema / Runtime / Production | NO CHANGE |

---

## 12. Canonical Next Phase Determination

**From canonical Plan V0.2 + Pilot Protocol V0.2:**

**Wave 5 (HY-009 + CX-001) is NOT required before the 3-place Pilot.**
- HY-009: P2 supporting depth; its own Wave 5 exit condition is independent of Pilot execution
- CX-001: System behavioral test verified during Pilot execution itself (not a pre-Pilot collection task)

**YTC Coverage Check:** Not the canonical immediate next action. It is a future research step unless explicitly elevated by Project State.

**After Wave 4 operational closure, canonical sequence:**
```
Wave 4 CLOSED (operational)
        ↓
Prepared Knowledge construction
(3-place: 오동도 / 향일암 / 케이블카)
        ↓
Internal 3-place Pilot execution
        ↓
Integrity Gate
        ↓
Founder Go/No-Go
        ↓
Human Blind Test (currently HOLD)
```

**ONE NEXT ACTION:** Begin Prepared Knowledge construction for the 3-place pilot (오동도, 향일암, 여수해상케이블카) using VERIFIED evidence. HY-003 KNOWN_LIMIT must be explicitly documented within Hyangiram prepared knowledge. Founder authorization to start Prepared Knowledge construction is implicit in Option B approval.

---

## 13. Audit

A. Starting HEAD = 53035d5 ✓
B. Founder Option B recorded ✓
C. HY-003 not upgraded ✓
D. HY-008 not marked VERIFIED ✓
E. KNOWN_LIMIT explicitly preserved ✓
F. H-2 stimulus unchanged ✓
G. H-2 diagnostic behavior documented ✓
H. Reopen conditions R1-R5 persisted ✓
I. Wave 4 execution-complete vs all-verified distinction preserved ✓
J. Cycle count remains 25 ✓
K. Reuse signal remains observation only ✓
L. Traveler Condition remains RESEARCH_HYPOTHESIS ✓
M. Human Blind Test remains HOLD ✓
N. Canonical next phase checked from repository ✓
O. Wave 5 not silently skipped — correctly classified as non-required supporting depth ✓
P. YTC Coverage Check not executed ✓
Q. No new evidence collected ✓
R. No web research ✓
S. No HY-003 field validation ✓
T. No HY-008 execution ✓
U. No Prepared Knowledge construction (this run) ✓
V. No Pilot ✓
W. No Integrity Gate ✓
X. No Candidate ✓
Y. No Architecture Decision ✓
Z. No schema/runtime/prod change ✓
