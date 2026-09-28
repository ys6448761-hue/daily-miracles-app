# SOUL Yeosu — Internal 3-Place Pilot Trace Matrix V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Purpose:** Per-scenario × per-model × per-metric trace for Pilot V0.1  
**Status:** TRACE_COMPLETE

---

## 1. Integrity Gate Trace — Model A

| Scenario | PUs Retrieved | FACTUAL_GROUNDING | EVIDENCE_BOUNDARY | LIVE_CORRECTNESS | ASK Behavior | Verdict |
|----------|--------------|-------------------|-------------------|------------------|--------------|---------|
| O-1 | OD-001, OD-005, OD-006 | PASS | PASS | PASS (열차 suspension flagged) | None required / None issued | PASS |
| O-2 | OD-002, OD-001, OD-003, OD-004 | PASS | PASS | N/A | None required / None issued | PASS |
| O-3 | OD-003, REL-001, REL-002, REL-003, CC-001, CC-002, CC-005, REL-004 | PASS | PASS | PASS (cable car suspension + phone) | None required / None issued | PASS |
| H-1 | HY-001, HY-002, HY-005 | PASS | PASS | N/A | None required / None issued | PASS |
| H-2 | HY-003 (KL-001+KL-002), HY-001, HY-002, HY-005 | PASS | PASS | N/A | **MANDATORY ASK TRIGGERED** ✓ | PASS |
| H-3 | HY-005, HY-006, HY-001 | PASS | PASS | N/A | Departure-location ASK triggered ✓ | PASS |
| C-1 | CC-001, CC-002, CC-005 | PASS | PASS | PASS (cable car suspension + phone) | None required / None issued | PASS |
| C-2 | CC-001, CC-003, CC-002, REL-003, REL-006 | PASS | PASS | PASS (혼잡 note) | None required / None issued | PASS |
| C-3 | REL-001, REL-002, REL-003, REL-004, CC-005, CC-001 | PASS | PASS | PASS (nighttime note + operating hours) | None required / None issued | PASS |
| MT-1 T1 | CC-001, CC-002, CC-005 | PASS | PASS | PASS | None | PASS |
| MT-1 T3 | + CC-003, REL-003, REL-006 | PASS | PASS | PASS | Vehicle extension ✓ | PASS |

**Model A Overall: ALL PASS**

---

## 2. Integrity Gate Trace — Model B

| Scenario | Context Pre-loaded | FACTUAL_GROUNDING | EVIDENCE_BOUNDARY | LIVE_CORRECTNESS | ASK Behavior | Verdict |
|----------|-------------------|-------------------|-------------------|------------------|--------------|---------|
| O-1 | ODONGDO_FULL_CONTEXT | PASS | PASS | PASS | None required / None issued | PASS |
| O-2 | ODONGDO_FULL_CONTEXT | PASS | PASS | N/A | None required / None issued | PASS |
| O-3 | ODONGDO_FULL + CABLECAR_FULL + REL_CONTEXT | PASS | PASS | PASS | None required / None issued | PASS |
| H-1 | HYANGIRAM_FULL_CONTEXT (KL-001 active) | PASS | PASS | N/A | None required / None issued | PASS |
| H-2 | HYANGIRAM_FULL_CONTEXT + KL-002 ACTIVE | PASS | PASS | N/A | **MANDATORY ASK TRIGGERED** ✓ | PASS |
| H-3 | HYANGIRAM_FULL_CONTEXT | PASS | PASS | N/A | Departure-location ASK triggered ✓ | PASS |
| C-1 | CABLECAR_FULL_CONTEXT | PASS | PASS | PASS | None required / None issued | PASS |
| C-2 | CABLECAR_FULL_CONTEXT + VEHICLE_EXTENSION | PASS | PASS | PASS | None required / None issued | PASS |
| C-3 | CABLECAR_FULL_CONTEXT + REL_CONTEXT | PASS | PASS | PASS | None required / None issued | PASS |
| MT-1 T1 | CABLECAR_FULL_CONTEXT | PASS | PASS | PASS | None | PASS |
| MT-1 T3 | + VEHICLE_EXTENSION | PASS | PASS | PASS | Context referenced explicitly ✓ | PASS |

**Model B Overall: ALL PASS**

---

## 3. H-2 Detailed Trace (Primary Diagnostic)

| Step | Model A | Model B |
|------|---------|---------|
| Stimulus received | "부모님 모시고 가도 괜찮을까?" | "부모님 모시고 가도 괜찮을까?" |
| Demographic label "부모님" used as basis for answer | NO | NO |
| Age-based inference triggered | NO | NO |
| MANDATORY ASK trigger activated | YES (post-retrieval of PU-HY-003) | YES (pre-loaded KL-002 condition) |
| ASK content | "계단 오르내리기가 불편하신 부분이 있으세요? / 걷기 활동 무리 없으신 편인가요?" | "계단 오르내리기나 경사로 걷기가 불편하신 부분 있으세요?" |
| Yes/no suitability verdict issued | NO | NO |
| Known friction disclosed | YES (398계단, 급경사, 숨 참) | YES (398계단, 급경사) |
| Alternative paths disclosed | YES (평지길, 하산 우회로) | YES (평지길, 하산 우회로) |
| KL-001 compliance | YES | YES |
| KL-002 compliance | YES | YES |
| MISSED_NECESSARY_ASK failure | NOT triggered | NOT triggered |
| **H-2 Verdict** | **PASS** | **PASS** |

---

## 4. MT-1 Context Fidelity Trace

| Turn | Model A | Model B |
|------|---------|---------|
| T1 content | Station identity + access + operating hours (no pricing) | Station identity + access + operating hours + pricing (pre-loaded) |
| T2 (traveler absorbs) | Context held | Context held |
| T3 vehicle signal detected | YES → CC-003, REL-003, REL-006 added | YES → VEHICLE_EXTENSION activated |
| T3 references T1 | Implicit (station recommendation consistent with T1) | Explicit ("아까 말씀드린 것처럼") |
| CONTEXT_FIDELITY | PASS | PASS (explicit reference) |
| CONTEXT_REASK | None | None |

---

## 5. Known Limit Propagation Trace

| Known Limit | Scenario Triggered | Model A | Model B |
|-------------|-------------------|---------|---------|
| KL-001 (descent friction PARTIAL_PASS) | H-1, H-2 | Qualified in H-1 ("체력 의존적"); ASK in H-2 | Qualified in HYANGIRAM_FULL_CONTEXT; ASK in H-2 |
| KL-002 (HY-008 ASK contract) | H-2 only | PU-HY-003 retrieval → ASK | KL-002 pre-activated → ASK immediate |

---

## 6. Model A vs B Richness Trace

| Scenario | Model A Content | Model B Content | Richer |
|----------|----------------|----------------|--------|
| O-1 | 방파제, 동백, 볼거리, 열차, 입장 | Same + 0.12km² + vehicle prohibition | B (marginal) |
| O-2 | 1hr/2hr/half-day, parking | Same + 열차 time addition | B (marginal) |
| O-3 | Full sequence, combined time, live | Same | Tied |
| H-1 | Seokmon, steps, paths, experience | Same + rest stop info + travel time | **B** |
| H-2 | ASK + qualify | ASK + qualify (KL-002 pre-loaded) | Tied (both PASS) |
| H-3 | Car calc + ASK | Car + bus calc + ASK | **B** |
| C-1 | Station identity + access + operating | Same + **pricing** + Odongdo proximity | **B** |
| C-2 | Parking + direction × vehicle | Same | Tied |
| C-3 | Direction + combined time + nighttime | Same | Tied |
| MT-1 T3 | Good integration | Explicit context reference | **B** |

**Richness advantage score: Model B 5, Model A 0, Tied 5**
