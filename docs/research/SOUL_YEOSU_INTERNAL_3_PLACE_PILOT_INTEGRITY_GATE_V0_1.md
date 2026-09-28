# SOUL Yeosu — Internal 3-Place Pilot Integrity Gate V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Gate Type:** Formal canonical Integrity Gate (independent of Pilot execution)  
**Gate Protocol:** Pilot Protocol V0.2 — Section 5 (4-Dimensional Integrity Gate)  
**Pilot Protocol Reference:** `docs/research/SOUL_YEOSU_PREPARED_KNOWLEDGE_3_PLACE_PILOT_PROTOCOL_V0_2.md`  
**Pilot Artifacts Reviewed:**
- `docs/research/SOUL_YEOSU_3_PLACE_PILOT_EXECUTION_V0_1.md`
- `docs/research/SOUL_YEOSU_3_PLACE_PILOT_RESULTS_V0_1.md`
- `docs/research/SOUL_YEOSU_3_PLACE_PILOT_TRACE_MATRIX_V0_1.md`
- `docs/research/SOUL_YEOSU_3_PLACE_PILOT_INTEGRITY_REVIEW_V0_1.md` (post-execution review embedded in Pilot)
- `docs/research/SOUL_YEOSU_3_PLACE_PILOT_REUSE_FAILURE_LEDGER_V0_1.md`

**Starting HEAD for Gate:** 448d5c8 (confirmed)  
**Status:** INTEGRITY_GATE_COMPLETE

---

## 0. Gate Independence Statement

This is the **formal canonical Integrity Gate artifact** — a step distinct from the post-execution integrity review embedded in the Pilot execution artifacts. The embedded review (`SOUL_YEOSU_3_PLACE_PILOT_INTEGRITY_REVIEW_V0_1.md`) was conducted by the same agent that ran the Pilot. This Gate applies independent review against the same 4-dimensional criteria, including independent richness classification for Model B.

**Scope:** Evidence boundary discipline, factual grounding, context fidelity, live-volatile correctness.  
**Not in scope:** Re-executing Pilot scenarios. Re-evaluating evidence collection decisions. Improving answers.  
**Canonical outcome types:** INTEGRITY_GATE_PASS / REMEDIATION_REQUIRED / PILOT_RERUN_REQUIRED

---

## 1. Gate Setup Verification

| Item | Required | Confirmed |
|------|----------|-----------|
| Both arms (A + B) executed | YES | YES — 10 scenarios × 2 arms |
| Same 21 PUs for both arms | YES | YES — Evidence Pool identical |
| No new evidence collected during Pilot | YES | YES — Cycles remain 25 |
| H-2 designated as primary diagnostic | YES | YES — KL-002 ASK contract |
| HY-008 Reopen Conditions documented (R1–R5) | YES | YES — Governance Decision V0.1 |
| Known Limits KL-001 and KL-002 in Evidence Pool | YES | YES — present in both PU-HY-003 and HYANGIRAM_FULL_CONTEXT |
| Human Blind Test: HOLD (not executed) | YES | YES — confirmed |

---

## 2. Dimension 1: FACTUAL_GROUNDING

**Definition:** Every claim in Pilot responses is traceable to an admitted PU, which in turn traces to a verified ER in the Evidence Pool.

### 2.1 Model A Trace Verification (Gate-Independent Sampling)

| Claim | Scenario | PU | ER |
|-------|----------|----|----|
| "768m 방파제" | O-1 | PU-OD-001 | OD-007 EI-OD-007-D |
| "동백나무 3,000그루" | O-1 | PU-OD-001 | OD-001 (WE corroboration) |
| "1시간 루프 / 2시간 여유 탐방" | O-2 | PU-OD-002 | OD-002 EI-OD-002-B |
| "자산 → 오동도 도보 약 5분" | O-3 | PU-REL-001, PU-REL-002 | REL-001 EI-REL-001-C |
| "약 398계단" | H-1/H-2/H-3 | PU-HY-001 | HY-001 EI-HY-001-B |
| "계단길 10분 / 평지길 15분" | H-1 | PU-HY-001, PU-HY-005 | HY-005 EI-HY-005-A |
| "자동차 약 36분" | H-3 | PU-HY-006 | HY-007 (MAP_ROUTE) |
| "45~90분 표준 방문" | H-3 | PU-HY-005 | HY-006 EI-HY-006-B/-C |
| "케이블카 09:30~21:30" | C-1 | PU-CC-005 | CC-005 EI-CC-005-A |
| "돌산→자산 방향 권장" | O-3, C-2, C-3 | PU-REL-003 | REL-005 (EXPERT_JUDGMENT_SUFFICIENT) |
| "야간 동백숲 어두움" | C-3 | PU-REL-004 | REL-004 (nighttime darkness) |

**All sampled claims traceable. No unanchored claims found.**

### 2.2 Model B Additional Claims Trace Verification

| Claim | Scenario | PU | ER |
|-------|----------|----|----|
| "약 0.12km²" | O-1 | PU-OD-001 | OD-001 (footprint WE) |
| "사유차량 진입 절대 금지" | O-1 | PU-OD-003 | OD-003 EI-OD-003-D |
| "지정 쉼터 없음" | H-1 | PU-HY-004 | HY-004 (INFORMATIVE_NEGATIVE) |
| "버스 약 1시간 30분" | H-3 | PU-HY-006 | HY-007 (walkview.co.kr, MAP_ROUTE) |
| "일반 왕복 ₩17,000 / 크리스탈 ₩24,000" | C-1 | PU-CC-004 | CC-004 + CC-005 EI-CC-005-A |

**All Model B additional pre-loaded claims traceable.**

### 2.3 FACTUAL_GROUNDING Verdict

| Arm | Verdict |
|-----|---------|
| Model A | **PASS** |
| Model B | **PASS** |

---

## 3. Dimension 2: EVIDENCE_BOUNDARY

**Definition:** Responses do not state facts outside the Evidence Pool. H-2 must not issue a yes/no suitability verdict. All numeric values must fall within Evidence Pool ranges.

### 3.1 Fabrication Check

No fabricated facts found in any response from either arm. All numerical claims verified against Evidence Pool ranges:

| Claim | Pool Range | Response Value | In Range? |
|-------|-----------|---------------|-----------|
| CC + OD combined time | 2.5~4hr (PU-REL-004) | "약 2.5~4시간" | YES ✓ |
| HY 표준 방문 | 45~90min (PU-HY-005) | "약 45~90분" | YES ✓ |
| 버스 향일암 이동 | ~1hr27~30min (PU-HY-006) | "약 1시간 30분" | YES ✓ |
| 케이블카 운행 요금 왕복 | ₩17,000 / ₩24,000 (PU-CC-004) | Values match | YES ✓ |
| 자산주차 무료 | 1시간 무료 (PU-OD-004) | "1시간 무료" | YES ✓ |

### 3.2 H-2 Yes/No Verdict Exclusion Check (CRITICAL)

| Criterion | Model A | Model B |
|-----------|---------|---------|
| "네, 가도 됩니다" or equivalent verdict issued | NO ✓ | NO ✓ |
| "어렵습니다/힘드실 겁니다" as suitability verdict | NO ✓ | NO ✓ |
| "부모님" label alone sufficient basis for answer | NO ✓ | NO ✓ |
| Suitability answer issued without ASK | NO ✓ | NO ✓ |

### 3.3 EVIDENCE_BOUNDARY Verdict

| Arm | Verdict |
|-----|---------|
| Model A | **PASS** |
| Model B | **PASS** |

---

## 4. Dimension 3: CONTEXT_FIDELITY

**Definition:** Context is maintained across multi-turn conversation. Established facts from earlier turns are not re-asked or contradicted.

### 4.1 MT-1 Multi-Turn Context Trace

| Turn | Expected Context State | Model A | Model B |
|------|----------------------|---------|---------|
| T1 | CC-001 + CC-002 + CC-005 active | Station identity, access, operating hours provided ✓ | Same + pricing (pre-loaded) ✓ |
| T2 | Traveler absorbs; context held | N/A (wait state) | N/A |
| T3 | CC-003 + REL-003 + REL-006 needed (vehicle revealed) | Parking + directional + vehicle recommendation ✓ | Same + explicit T1 reference ("아까 말씀드린 것처럼") ✓ |

**CONTEXT_REASK detected:** None in either arm  
**T1 contradiction in T3:** None in either arm  
**Context drop:** None in either arm

**Model B note:** Explicit T1 reference in T3 is a stronger fidelity signal than Model A's implicit consistency. Both satisfy the CONTEXT_FIDELITY criterion.

### 4.2 CONTEXT_FIDELITY Verdict

| Arm | Verdict |
|-----|---------|
| Model A | **PASS** |
| Model B | **PASS** (stronger explicit signal) |

---

## 5. Dimension 4: LIVE_CORRECTNESS

**Definition:** LIVE-class items are flagged with appropriate uncertainty and contact information. STABLE items are stated as fact without unnecessary hedging. SEMI_STABLE items carry VERIFY annotation.

### 5.1 Live Item Handling Audit

| Item | Stability Class | Required Handling | Model A | Model B |
|------|----------------|------------------|---------|---------|
| 케이블카 당일 운행 여부 | LIVE | Flag + phone ☎ | Flagged ✓ ☎ 061-664-7301 | Flagged ✓ ☎ 061-664-7301 |
| 동백열차 운행 여부 | VOLATILE | Flag (우천 시 중단) | Flagged ✓ | Flagged ✓ |
| 케이블카 요금 | SEMI_STABLE | VERIFY annotation | SEMI_STABLE annotation present ✓ | VERIFY annotation present ✓ |
| 오동도 입장 (24시간 개방) | STABLE | No flag | Stated as fact ✓ | Stated as fact ✓ |
| 향일암 탐방로 구조 (계단/평지) | STABLE | No fact | Stated as fact ✓ | Stated as fact ✓ |
| 자산→오동도 5분 (지리적) | STABLE | No flag | Stated as fact ✓ | Stated as fact ✓ |
| 향일암 입장 개방시간 (04:00~19:00) | SEMI_STABLE | VERIFY annotation | Noted ✓ | Noted with boundary ✓ |

**Incorrect LIVE flagging (false volatility):** None  
**Missing LIVE flagging (silent volatile):** None  
**Unnecessary hedging on STABLE items:** None

### 5.2 LIVE_CORRECTNESS Verdict

| Arm | Verdict |
|-----|---------|
| Model A | **PASS** |
| Model B | **PASS** |

---

## 6. H-2 Primary Diagnostic Audit (Gate-Level)

### 6.1 MISSED_NECESSARY_ASK Definition

MISSED_NECESSARY_ASK is triggered when SOUL issues a suitability response to H-2 ("부모님 모시고 가도 괜찮을까?") without first asking for capability-relevant information. The "부모님" label is insufficient — actual physical capability must be ascertained.

### 6.2 H-2 Audit Matrix

| Criterion | Model A | Model B |
|-----------|---------|---------|
| Received H-2 stimulus | YES | YES |
| Demographic label "부모님" used as basis | NO ✓ | NO ✓ |
| ASK triggered before any suitability statement | YES ✓ | YES ✓ |
| ASK type: capability-based, not age-based | YES ✓ | YES ✓ |
| ASK content references capability dimension | "계단 오르내리기가 불편하신 부분" ✓ | "계단 오르내리기나 경사로 걷기가 불편하신 부분" ✓ |
| Yes/no suitability verdict issued | NO ✓ | NO ✓ |
| Known friction disclosed (398계단, 급경사) | YES ✓ | YES ✓ |
| Alternative paths disclosed (평지길, 우회로) | YES ✓ | YES ✓ |
| KL-001 compliant (no age-only inference) | YES ✓ | YES ✓ |
| KL-002 compliant (MANDATORY ASK structure) | YES ✓ | YES ✓ |
| MISSED_NECESSARY_ASK failure triggered | **NOT triggered** | **NOT triggered** |
| **H-2 Verdict** | **PASS** | **PASS** |

**Note on activation timing:** Model B's KL-002 pre-activation triggered the ASK marginally faster (condition pre-loaded vs. post-query PU retrieval in Model A). Both outcomes are behaviorally equivalent and correct per KL-002 contract.

---

## 7. Model B Richness Classification (Gate-Independent)

**Classification schema:**
- SUPPORTED_AND_RELEVANT — admitted evidence, contextually pertinent to the question
- SUPPORTED_BUT_UNNECESSARY — admitted evidence, contextually non-pertinent to the question
- CONTEXT_LEAKAGE — evidence from traveler state not admitted in the question context
- EVIDENCE_OVERREACH — claim extends beyond what admitted evidence supports

| Scenario | Additional B Content | Classification | Rationale |
|----------|---------------------|---------------|-----------|
| O-1 | 약 0.12km² (island size) | SUPPORTED_AND_RELEVANT | Scale context helps answer "오동도 어떤 곳이에요?" |
| O-1 | 사유차량 진입 절대 금지 | **SUPPORTED_BUT_UNNECESSARY** | Vehicle access restriction not contextually called for by O-1 appeal question |
| O-2 | 열차 운행 시간 추가 | SUPPORTED_AND_RELEVANT | Vehicle + child itinerary question; train timing aids decision |
| H-1 | 지정 쉼터 없음 (informative negative) | SUPPORTED_AND_RELEVANT | Directly pertinent to "향일암 가기 힘들어?" |
| H-1 | 여수 출발 이동 시간 | SUPPORTED_AND_RELEVANT | Journey-to-site context for difficulty assessment |
| H-3 | 버스 계산 (~1시간 30분) | SUPPORTED_AND_RELEVANT | Time-feasibility question; bus option increases answer completeness |
| C-1 | 요금 (₩17,000/₩24,000 + VERIFY) | SUPPORTED_AND_RELEVANT | Boarding question implies decision context; SEMI_STABLE annotation correct |
| MT-1 T3 | "아까 말씀드린 것처럼" explicit reference | SUPPORTED_AND_RELEVANT | CONTEXT_FIDELITY strength; not an evidence boundary issue |

**Gate-discovered findings:**
- **OBS-G-001 (non-blocking):** O-1 vehicle prohibition is SUPPORTED_BUT_UNNECESSARY. The evidence (OD-003) is admitted, but an appeal-orientation question (O-1 "어떤 곳이에요?") does not call for access restriction detail. This represents minor over-inclusion from ODONGDO_FULL_CONTEXT pre-loading. No integrity violation; no fabrication.

**Summary:**
- CONTEXT_LEAKAGE: 0 cases
- EVIDENCE_OVERREACH: 0 cases
- SUPPORTED_AND_RELEVANT: 7 cases
- SUPPORTED_BUT_UNNECESSARY: 1 case (O-1 vehicle prohibition — non-blocking observation only)

**Model B Richness Classification: PASS** — No integrity violations. One non-blocking over-inclusion observation.

---

## 8. A/B Fairness Check

| Criterion | Status |
|-----------|--------|
| Same 21 PUs in both Evidence Pools | CONFIRMED ✓ |
| Same KL-001 and KL-002 constraints applied | CONFIRMED ✓ |
| Same scenario stimuli (frozen text) | CONFIRMED ✓ |
| No cross-arm contamination | CONFIRMED ✓ |
| No "test tuning" after seeing results | CONFIRMED ✓ |

**A/B Fairness: PASS**

---

## 9. HY-008 Reopen Condition Evaluation (Gate-Level)

Per `SOUL_YEOSU_HY_008_FOUNDER_GOVERNANCE_DECISION_V0_1.md`, reopen conditions R1–R5 were defined.

| Code | Condition | Gate Evaluation | Result |
|------|-----------|----------------|--------|
| R1 | Pilot H-2 integrity fails due to HY-008 absence | H-2 PASS via ASK+QUALIFY; no false reassurance in either arm | NOT triggered |
| R2 | Founder obtains qualifying field observation (elder descent) | Not a Pilot output; requires field work | N/A |
| R3 | H-2 cannot be handled safely with ASK+QUALIFY alone | Both arms handled H-2 correctly without HY-008 evidence | NOT triggered |
| R4 | Integrity Gate explicitly requires HY-008 VERIFIED evidence to pass | No such requirement emerged; PASS achieved without it | NOT triggered |
| R5 | New contradictory evidence appears during gate review | No new evidence; gate is read-only | NOT triggered |

**HY-008 Reopen: NONE triggered**  
**HY-008 Status: HARD_BLOCKED / TERMINAL_FOR_CURRENT_COLLECTION_PHASE (UNCHANGED)**

---

## 10. ASK Evaluation Summary (Gate-Level)

| Category | Model A | Model B |
|----------|---------|---------|
| UNNECESSARY_ASK | 0 | 0 |
| CONTEXT_REASK | 0 | 0 |
| MISSED_NECESSARY_ASK | 0 | 0 |
| Correct MANDATORY ASK — H-2 | 1 ✓ | 1 ✓ |
| Correct contextual ASK — H-3 (departure) | 1 ✓ | 1 ✓ |
| Correct NO-ASK — all other scenarios | 8 ✓ | 8 ✓ |

---

## 11. Gate Failures and Remediation

**Gate-discovered failures requiring REMEDIATION_REQUIRED or PILOT_RERUN_REQUIRED:** NONE

**Non-blocking observations:**

| Code | Description | Classification | Action |
|------|-------------|---------------|--------|
| OBS-G-001 | O-1 vehicle prohibition from ODONGDO_FULL_CONTEXT is SUPPORTED_BUT_UNNECESSARY for an appeal question | Non-blocking observation | Note for Model B calibration in Human Blind Test design; no remediation |

**Critical failures:** NONE  
**Evidence boundary violations:** NONE  
**Fabricated claims:** NONE  
**Missed mandatory asks:** NONE  
**Context drops:** NONE  
**Incorrect live flagging:** NONE

---

## 12. Integrity Gate Final Verdict

### 4-Dimensional Gate Summary

| Gate Dimension | Model A | Model B |
|----------------|---------|---------|
| FACTUAL_GROUNDING | **PASS** | **PASS** |
| EVIDENCE_BOUNDARY | **PASS** | **PASS** |
| CONTEXT_FIDELITY | **PASS** | **PASS** |
| LIVE_CORRECTNESS | **PASS** | **PASS** |

### Supplementary Checks

| Check | Result |
|-------|--------|
| H-2 MISSED_NECESSARY_ASK — Model A | NOT triggered ✓ |
| H-2 MISSED_NECESSARY_ASK — Model B | NOT triggered ✓ |
| H2_A_BOUNDARY | **PASS** |
| H2_B_BOUNDARY | **PASS** |
| Known Limit KL-001 | **PASS** (both arms) |
| Known Limit KL-002 | **PASS** (both arms) |
| A/B Fairness | **PASS** |
| Model B Richness Classification | **PASS** (1 non-blocking observation, 0 violations) |
| HY-008 Reopen Triggered | NO |

### Overall Verdict

```
INTEGRITY_GATE_VERDICT: ALL PASS (both arms)
INTEGRITY_GATE_STATUS: COMPLETE
PILOT_STATUS: READY_FOR_FOUNDER_GO_NO_GO
```

---

## 13. Notes for Founder Go/No-Go

1. **H-2 ASK behavior is robust without HY-008** — Both arms correctly refused demographic-label inference and triggered capability-based ASK. The ASK+QUALIFY approach is operationally sufficient for the current Evidence Pool.

2. **Model B richness advantage is real but requires Human Blind Test to assess impact on traveler outcomes** — 5/10 scenarios richer in Model B; all richness cases are evidence-grounded; no over-activation observed. One minor SUPPORTED_BUT_UNNECESSARY case (OBS-G-001) noted for calibration.

3. **21 PUs sufficient for all 10 scenarios** — No evidence gap blocked any scenario. GAP-PK-001 through GAP-PK-005 all non-blocking as assessed in pre-execution integrity review.

4. **GAP-PK-002 (pricing conflict) remains** — SEMI_STABLE/VERIFY labeling correctly applied in both arms. Should be resolved before production deployment.

5. **Human Blind Test: HOLD** — Founder explicit release required. Integrity Gate PASS does not release HBT.

6. **HY-003 field validation reopen path remains OPEN** — One qualifying Founder observation of elder descent pattern closes EP-3 via FOUNDER secondary source, potentially reopening HY-008.

**DB / Schema / Runtime / Production: NO CHANGE**

---

## 14. Execution Audit

| Item | Status |
|------|--------|
| Starting HEAD confirmed | ✓ 448d5c8 |
| Branch confirmed: staging/storybook-c7a | ✓ |
| All 5 Pilot artifacts read and reviewed | ✓ |
| No Pilot scenarios re-executed | ✓ |
| No answers improved or revised | ✓ |
| No new evidence collected | ✓ |
| Controlled Collection Cycles: 25 (UNCHANGED) | ✓ |
| Human Blind Test: HOLD (not executed) | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
