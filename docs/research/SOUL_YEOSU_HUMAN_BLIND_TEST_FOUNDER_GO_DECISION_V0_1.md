# SOUL Yeosu — Human Blind Test Founder Go/No-Go Decision V0.1
# Date: 2026-09-28

**Branch:** staging/storybook-c7a  
**Starting HEAD:** 49500e4  
**Pilot Protocol:** SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md  
**Decision Type:** Founder Go/No-Go for Human Blind Test track

---

## I. Decision Basis

### Integrity Gate Evidence

| Dimension | Model A | Model B | Verdict |
|---|---|---|---|
| FACTUAL_GROUNDING | PASS | PASS | PASS |
| EVIDENCE_BOUNDARY | PASS | PASS | PASS |
| CONTEXT_FIDELITY | PASS | PASS | PASS |
| LIVE_CORRECTNESS | PASS | PASS | PASS |
| H-2 MISSED_NECESSARY_ASK | NOT triggered | NOT triggered | PASS |
| KL-001 (elder descent-friction) | COMPLIANT | COMPLIANT | PASS |
| KL-002 (HY-008 Option B boundary) | COMPLIANT | COMPLIANT | PASS |

**INTEGRITY_GATE_VERDICT: ALL PASS (both arms)**

### Internal Pilot Evidence

- Scenarios: 9 place scenarios (O-1/2/3, H-1/2/3, C-1/2/3) + MT-1
- Gate-Discovered Failures: NONE
- Failure Taxonomy: Zero critical failures (both arms)
- Minor observations: OBS-G-001 (Model B O-1 vehicle prohibition — SUPPORTED_BUT_UNNECESSARY, non-blocking)
- Model B richness advantage: 5/10 scenarios (all SUPPORTED_AND_RELEVANT or SUPPORTED_BUT_UNNECESSARY — 0 violations)
- UNNECESSARY_ASK: 0 | CONTEXT_REASK: 0 | MISSED_NECESSARY_ASK: 0

---

## II. Founder GO Decision

**DECISION: GO**

**Basis:**
- Integrity Gate: ALL PASS (4/4 dimensions × 2 arms)
- H-2 Primary Diagnostic: PASS (both arms — core KL-001/KL-002 compliance confirmed)
- Model B richness advantage: observed and classified as non-violating
- EARLY_REPEAT_SIGNAL: pattern 0→3→2→0 (observable, not promoted)
- HY-008/HY-003 KNOWN_LIMITS: preserved and correctly operational in both arms

**Non-Claims (explicitly NOT established by this GO):**
- This GO does NOT establish that Model B is definitively superior to Model A
- This GO does NOT release any traveler to SOUL conversations
- This GO does NOT approve place_knowledge DB migration
- This GO does NOT constitute production readiness
- This GO does NOT certify HY-003 (향일암 elder accessibility) beyond KNOWN_LIMIT boundary

---

## III. HBT Asset Revalidation

### Artifacts Searched

| Artifact ID | Expected Function | Repository Status |
|---|---|---|
| BTD-A | Blind Test Design — stimulus/control/blinding protocol | NOT_YET_CREATED |
| EP-A | Execution Package — participant brief, observer script | NOT_YET_CREATED |
| DR-B | Dry Run design — pre-HBT calibration run | NOT_YET_CREATED |

**Finding:** BTD-A / EP-A / DR-B do not exist as files in the repository. These are Human Blind Test design artifacts for the "Blind MVP Test" track. They have not been created. They cannot be classified VALID_AS_IS or REQUIRES_REDESIGN — they are NOT_YET_CREATED.

---

## IV. HOLD Release Semantics

**Previous HOLD status:** HOLD (Human Blind Test pending Founder explicit release)

**HOLD transition:**

```
HOLD
  → RELEASED_FOR_PREPARATION
```

**NOT:**

```
HOLD
  → RELEASED_FOR_EXECUTION
```

**Reasoning:** Execution readiness requires BTD-A (Blind Test Design) at minimum. BTD-A does not exist. The GO decision releases the track for design preparation, not for participant recruitment or test execution. Execution remains BLOCKED until BTD-A/EP-A/DR-B are created and validated.

---

## V. Human Blind Test Track — Current Execution Readiness

| Prerequisite | Status |
|---|---|
| Internal Pilot complete + Integrity Gate ALL PASS | ✓ CONFIRMED |
| Founder GO decision | ✓ THIS DOCUMENT |
| BTD-A (Blind Test Design) | ✗ NOT_YET_CREATED |
| EP-A (Execution Package) | ✗ NOT_YET_CREATED |
| DR-B (Dry Run design) | ✗ NOT_YET_CREATED |
| HBT participant recruitment | ✗ BLOCKED (BTD-A prerequisite) |
| HBT execution | ✗ BLOCKED (BTD-A + EP-A + DR-B prerequisite) |

**HBT Execution Readiness: BLOCKED — BTD-A must be designed before any execution step.**

---

## VI. Pilot Protocol Context

Per Pilot Protocol V0.2, explicit distinction:

> "This pilot does NOT constitute a Human preference test — that is the Blind MVP Test track."  
> "Human preference testing remains in the Blind MVP Test track (currently ON HOLD). This pilot is a research feasibility / architecture-learning study."

This Pilot (internal, 3-place, A/B) has fulfilled its stated purpose:
- Primary research question answered: "어디까지 사전 준비하고 어디부터 런타임에 조립하는 것이 가장 효율적인가?"
  - Finding: 21 PUs sufficient for all 10 scenarios; 0 evidence gaps blocked execution
  - Model B pre-activation shows richness advantage in 5/10 scenarios without integrity violation
  - Model A post-question retrieval equally valid for integrity; less rich in specific cases

---

## VII. ONE Next Action

**Design Human Blind Test architecture — BTD-A (Blind Test Design)**

Scope of BTD-A:
- Define stimulus design: what questions traveler participants will receive
- Define blinding protocol: how Model A vs Model B arms are presented without identity disclosure
- Define evaluation criteria: what evaluators are asked to rate (realism, helpfulness, trust)
- Define control conditions: ensuring fairness between arms
- Define sample size and participant profile requirements

**BTD-A is the single prerequisite that, when created and Founder-approved, unlocks EP-A and DR-B design.**

---

## VIII. Known Limits Preserved

| KL | Description | HBT Status |
|---|---|---|
| KL-001 | HY-003 elder descent-friction KNOWN_LIMIT | Must be preserved in BTD-A stimulus design (H-2 scenario type to be included) |
| KL-002 | HY-008 Option B governance boundary | Reopen conditions R1-R5 remain INACTIVE; BTD-A must not fabricate HY-008 answers |

---

## IX. State Change Summary

| Item | Before GO | After GO |
|---|---|---|
| Founder Go/No-Go | PENDING | GO |
| Human Blind Test HOLD | HOLD | RELEASED_FOR_PREPARATION |
| BTD-A | NOT_YET_CREATED | NOT_YET_CREATED (preparation now authorized) |
| HBT Execution | BLOCKED | BLOCKED (BTD-A prerequisite) |
| Controlled Collection Cycles | 25 | 25 (UNCHANGED) |
| DB / Schema / Runtime / Production | NO CHANGE | NO CHANGE |

---

*Artifact type: Founder governance decision*  
*Track: Human Blind Test (Blind MVP Test) — separate from Internal Pilot track*  
*Internal Pilot track status: COMPLETE (this document does not govern it)*
