# SOUL Yeosu — Internal 3-Place Pilot Results V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Pilot Protocol:** V0.2  
**Evidence Pool:** 21 PUs (identical for both arms)  
**Arms:** Model A (post-question retrieval) vs Model B (pre-question activation)  
**Controlled Collection Cycles:** 25 (UNCHANGED)  
**Status:** PILOT_RESULTS_COMPLETE

---

## 0. Executive Summary

**Overall Pilot Verdict: READY_FOR_INTEGRITY_GATE**

- All 9 single-turn scenarios executed for both arms ✓
- MT-1 multi-turn executed for both arms ✓
- Primary diagnostic H-2: PASS in both arms (MISSED_NECESSARY_ASK = NOT triggered)
- Integrity Gate pre-conditions: ALL 4 DIMENSIONS PASS (both arms)
- Critical failures: NONE
- Evidence boundary violations: NONE
- Fabricated facts: NONE
- Human Blind Test: HOLD (unchanged)

---

## 1. Scenario-Level Results

### 1.1 Primary Integrity Pass/Fail Table

| Scenario | Model A | Model B | H-2 MISS? | Notes |
|----------|---------|---------|-----------|-------|
| O-1 | PASS | PASS | N/A | Model B: slightly richer (0.12km²) |
| O-2 | PASS | PASS | N/A | Model B: proactively adds 열차 time |
| O-3 | PASS | PASS | N/A | Comparable quality; directional logic correct |
| H-1 | PASS | PASS | N/A | Model B richer: adds rest-stop + travel time |
| H-2 | PASS | PASS | **NOT triggered** | Primary diagnostic PASS — both arms |
| H-3 | PASS | PASS | N/A | Both ASK departure; Model B adds bus calc |
| C-1 | PASS | PASS | N/A | **Model B advantage**: proactively includes pricing |
| C-2 | PASS | PASS | N/A | Comparable quality |
| C-3 | PASS | PASS | N/A | Comparable quality; nighttime note correct |
| MT-1 | PASS | PASS | N/A | Model B: explicit context reference in Turn 3 |

**All 10 scenarios: INTEGRITY PASS for both arms**

---

### 1.2 H-2 Primary Diagnostic — Detailed

**Stimulus (frozen):** "부모님 모시고 가도 괜찮을까?"

| Criterion | Model A | Model B |
|-----------|---------|---------|
| ASK triggered before suitability answer | YES ✓ | YES ✓ |
| ASK type: capability-based (not age-based) | YES ✓ | YES ✓ |
| Yes/no suitability verdict issued | NO ✓ | NO ✓ |
| "부모님" label used as sufficient basis for answer | NO ✓ | NO ✓ |
| QUALIFY REGISTER applied (friction + alternatives) | YES ✓ | YES ✓ |
| KL-001 compliance (no age-only inference) | YES ✓ | YES ✓ |
| KL-002 compliance (MANDATORY ASK structure) | YES ✓ | YES ✓ |
| Evidence boundary maintained | YES ✓ | YES ✓ |
| MISSED_NECESSARY_ASK failure | **NOT triggered** | **NOT triggered** |

**H-2 Verdict: PASS (both arms)**  
**Diagnostic finding:** Both Model A and Model B correctly recognized that "부모님" is an insufficient basis for suitability judgment. Both triggered capability-based ASK before any suitability statement.

**Model B note:** KL-002 pre-activation triggered the ASK marginally faster (pre-loaded condition vs. post-question retrieval). Both outcomes equivalent and correct.

---

## 2. ASK Evaluation Summary

| Category | Model A Count | Model B Count |
|----------|--------------|--------------|
| UNNECESSARY_ASK | 0 | 0 |
| CONTEXT_REASK | 0 | 0 |
| MISSED_NECESSARY_ASK | 0 | 0 |
| Correct ASK triggered (H-2) | 1 | 1 |
| Correct ASK triggered (H-3) | 1 | 1 |
| Correct NO-ASK (all other scenarios) | 8 | 8 |

**ASK Evaluation: CLEAN for both arms**

---

## 3. Failure Taxonomy

| Failure Type | Model A | Model B |
|-------------|---------|---------|
| EVIDENCE failure (fabricated fact) | 0 | 0 |
| PREPARATION failure (PU content error) | 0 | 0 |
| ROUTING failure (wrong PU selected) | 0 | 0 |
| CONTEXT failure (MT-1 context lost) | 0 | 0 |
| VERIFICATION failure (LIVE item not flagged) | 0 | 0 |
| JUDGMENT failure (wrong recommendation) | 0 | 0 |
| EXPRESSION failure (misleading wording) | 0 | 0 |
| ANTICIPATION_OVERREACH (beyond evidence) | 0 | 0 |

**Critical failures: NONE in either arm**

**Minor observations (non-blocking):**
- Model A O-2: Proactively mentions cable car connection — assessed as APPROPRIATE ANTICIPATION (evidence-supported, not speculative)
- Model B C-1: Proactively includes pricing — assessed as APPROPRIATE (from pre-loaded context, labeled SEMI_STABLE/VERIFY)
- Model B H-1: Includes rest-stop info and travel time proactively — assessed as APPROPRIATE (all from admitted evidence)

---

## 4. Model A vs Model B Comparison

| Dimension | Model A | Model B | Advantage |
|-----------|---------|---------|-----------|
| Evidence boundary discipline | Full ✓ | Full ✓ | Tied |
| H-2 ASK trigger (primary diagnostic) | PASS ✓ | PASS ✓ | Tied |
| KL-001/KL-002 compliance | Full ✓ | Full ✓ | Tied |
| LIVE_CORRECTNESS | Full ✓ | Full ✓ | Tied |
| Initial response richness | Narrower (by design) | Richer | **Model B** |
| H-1 proactive context (rest stops + travel) | Not included | Included | **Model B** |
| C-1 proactive pricing | Not included | Included | **Model B** |
| H-3 bus + car calculation | Car only | Both | **Model B** |
| MT-1 context retention (explicit reference) | Good ✓ | Better (explicit ref) | **Model B** |
| H-2 ASK activation speed | Post-retrieval | Pre-loaded (instant) | **Model B** (marginal) |
| Over-activation risk | N/A | Low / None observed | Tied |
| Evidence pool size required | Smaller per query | Larger per context | N/A |

**Summary:**  
Model A: Clean evidence discipline, precise per-question selection, no over-activation  
Model B: All Model A qualities plus proactively richer initial responses — H-1/C-1/H-3 and MT-1 all show contextual richness advantage

**Model B demonstrated advantage in 5 of 10 scenarios (richness/depth), while both performed equally on all integrity criteria.**

---

## 5. Hypothesis Evaluations

### Hypothesis 1: Prepared Knowledge
**Claim:** 21 PUs are sufficient to answer all 9 single-turn scenarios + MT-1 without new evidence collection.  
**Evidence from Pilot:** All 10 scenarios answered without evidence pool gaps. Zero PU gaps blocked any scenario. GAP-PK-001 through GAP-PK-005 (identified in pre-Pilot integrity review) were all non-blocking as assessed.  
**Status: SUPPORTED** (not a proven general law — one pilot, 3 places, 21 PUs)

### Hypothesis 2: Prepared Context (Model B)
**Claim:** Pre-activation of full place context before question arrival produces richer responses without evidence boundary violations.  
**Evidence from Pilot:** Model B produced richer initial responses in H-1 (rest stop + travel time), C-1 (pricing), H-3 (bus calculation), MT-1 (explicit context reference). No ANTICIPATION_OVERREACH detected. No fabrication. Evidence boundary maintained in all cases.  
**Status: PARTIALLY_SUPPORTED** — advantage observed but limited to richness dimension; requires Human Blind Test to determine if richness improves traveler outcomes  
**Note:** Over-activation risk (a priori concern) was NOT observed in this internal pilot

### Hypothesis 3: Traveler Condition × Experience Requirement
**Claim:** Suitability assessments require capability-condition information, not demographic labels.  
**Evidence from Pilot:** H-2 confirms that "부모님" demographic label alone cannot ground a suitability answer. Both arms correctly triggered capability-based ASK. The 5-layer structure (Preference/State/Condition-Capability/Experience-Requirement-Friction/Alternative-Mitigation) is observable in the H-2 evidence-boundary behavior.  
**Status: RESEARCH_HYPOTHESIS — OBSERVABLE_IN_PILOT** (H-2 behavior is consistent with hypothesis; hypothesis not proven at scale)  
**Note:** Still RESEARCH_HYPOTHESIS. Not promoted to Candidate. Not redefined.

### Hypothesis 4: EARLY_REPEAT_SIGNAL
**Claim:** Accumulated evidence reduces marginal research cost.  
**Evidence from Pilot:** Pilot required ZERO new evidence collection (all 10 scenarios answerable from 21 PUs, which derived from 25 controlled collection cycles). Pattern continues: Cycle 23 = 0 new, Cycle 24 = 3 new, Cycle 25 = 2 new, Pilot = 0 new.  
**Status: OBSERVATION** — trend continues but not a proven scaling law; not promoted  
**Note:** Still OBSERVATION. Not an Evidence Candidate. Not an Architecture Decision.

---

## 6. Known Limits in Pilot

| Limit | Effect on Pilot |
|-------|----------------|
| KL-001: HY-003 descent friction PARTIAL_PASS | H-2 correctly uses ASK+QUALIFY approach; no fabricated certainty |
| KL-002: HY-008 hard-blocked | H-2 treats KNOWN_LIMIT as diagnostic opportunity; ASK behavior tested |
| GAP-PK-002: Cable car pricing CONFLICT-A | SEMI_STABLE/VERIFY annotation carried through; non-blocking |
| GAP-PK-001: Bus배차 wide range | H-3 range answer ("약 1시간 30분") usable; non-blocking |
| No HY-008 evidence | No suitability threshold established; ASK+QUALIFY is correct response |

**All known limits correctly handled by both arms.**

---

## 7. Next Action Determination

**Canonical gate from Pilot Protocol V0.2:**

```
Internal Pilot → READY_FOR_INTEGRITY_GATE
             → REMEDIATION_REQUIRED
             → PILOT_RERUN_REQUIRED
```

**Verdict:** READY_FOR_INTEGRITY_GATE

**Basis:**
- Zero critical failures
- Zero evidence boundary violations
- Zero MISSED_NECESSARY_ASK
- H-2 primary diagnostic: PASS
- All 4 integrity dimensions passed in preparation AND in pilot execution
- Model B richness advantage observed (consistent with pilot hypothesis)
- No remediation trigger found

**ONE NEXT ACTION:** Founder authorization for Integrity Gate execution — formal evaluation of Pilot responses against 4-dimensional gate (FACTUAL_GROUNDING / EVIDENCE_BOUNDARY / CONTEXT_FIDELITY / LIVE_CORRECTNESS) per Pilot Protocol V0.2.

**NOT released by this Pilot result:**
- Human Blind Test: HOLD (unchanged)
- HY-008: HARD_BLOCKED / TERMINAL_FOR_CURRENT_COLLECTION_PHASE (unchanged)
- HY-003 field validation: OPEN reopen path (unchanged)
- DB / Schema / Runtime / Production: NO CHANGE

---

## 8. Execution Audit

| Item | Status |
|------|--------|
| Starting HEAD confirmed | ✓ 498ab14 |
| Branch confirmed: staging/storybook-c7a | ✓ |
| All 9 single-turn scenarios executed | ✓ |
| MT-1 executed | ✓ |
| Both arms (A and B) executed independently | ✓ |
| No cross-contamination between arms | ✓ |
| H-2 MANDATORY ASK: both arms triggered | ✓ |
| No yes/no suitability verdict issued | ✓ |
| Controlled Collection Cycles: 25 (UNCHANGED) | ✓ |
| Human Blind Test: HOLD (not executed) | ✓ |
| No web search or new evidence | ✓ |
| No test tuning after results | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
