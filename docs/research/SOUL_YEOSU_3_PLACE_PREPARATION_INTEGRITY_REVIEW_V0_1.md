# SOUL Yeosu — 3-Place Preparation Integrity Review V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Phase:** Prepared Knowledge Construction V0.1  
**Reviewer Role:** Preparation quality gate (pre-Pilot)  
**Status:** INTEGRITY_REVIEW_COMPLETE

---

## 0. Integrity Review Purpose

This review verifies that the 4 Preparation artifacts (Evidence Manifest, Preparation Units, Model A Package, Model B Package) collectively satisfy the Integrity Gate defined in Pilot Protocol V0.2, **before** the Pilot is executed.

The 4 Integrity Gate criteria from Protocol V0.2:
1. **FACTUAL_GROUNDING** — Every SOUL response ingredient is traceable to admitted evidence
2. **EVIDENCE_BOUNDARY** — SOUL does not state facts outside the Evidence Pool  
3. **CONTEXT_FIDELITY** — SOUL maintains context across turns (especially MT-1)
4. **LIVE_CORRECTNESS** — SOUL correctly flags LIVE vs STABLE items

This pre-Pilot review checks that the Preparation artifacts correctly set up these conditions. The actual gate execution happens during and after Pilot runs.

---

## 1. FACTUAL_GROUNDING Review

**Criterion:** Every fact in every Preparation Unit and both Model Packages must be traceable to a VERIFIED_FOR_PREPARATION or PROVISIONALLY_SUPPORTED ER.

| Claim Type | Example Claim | Traceable To | Result |
|------------|--------------|--------------|--------|
| 섬 규모 0.12km² / 탐방로 2.5km | PU-OD-001 | OD-001 EI-OD-001-C | ✓ |
| 방파제 768m 평지 데크 | PU-OD-003, PU-OD-007 | OD-003 EI-OD-003-D, OD-007 | ✓ |
| 방문 시간 1시간 루프 | PU-OD-002 | OD-002 EI-OD-002-B (Trip.com) | ✓ |
| 동백열차 1,000원, 점심 중단 | PU-OD-003 | OD-003 EI-OD-003-B, OD-006 EI-OD-006-B | ✓ |
| 주차 237대, 1시간 무료 | PU-OD-004 | OD-004 EI-OD-004-A | ✓ |
| 계단 ~398개, 해탈문 1인 폭 | PU-HY-001 | HY-001 EI-HY-001-B; HY-002 (Hankookilbo) | ✓ |
| 계단길 10분 / 평지길 15분 | PU-HY-001, HY-005 | HY-005 EI-HY-005-A (comple.co.kr) | ✓ |
| 향일암 표준 방문 45~90분 | PU-HY-005 | HY-006 EI-HY-006-C (Daum 30~60분), EI-HY-006-B | ✓ |
| 자동차 엑스포역→향일암 36분 | PU-HY-006 | HY-007 (rome2rio.com MAP_ROUTE) | ✓ |
| 자산정류장 = 오동도 도보 5분 | PU-REL-001 | REL-001 EI-REL-001-C | ✓ |
| 케이블카 시간 09:30~21:30 | PU-CC-005 | CC-005 EI-CC-005-A (namu.wiki + BATCH_01) | ✓ |
| 일반캐빈 ₩17,000/편도₩14,000 | PU-CC-004 | CC-005 EI-CC-005-A; CC-004 | ✓ |
| 돌산→자산 방향 권장 | PU-REL-003 | REL-005 EXPERT_JUDGMENT_SUFFICIENT | ✓ |
| 야간 오동도 동백숲 어두움 | PU-REL-004 | REL-004 (nighttime Odongdo dark canopy) | ✓ |

**FACTUAL_GROUNDING Verdict: PASS**  
All sampled claims trace to admitted ER evidence. No fabricated facts detected.

---

## 2. EVIDENCE_BOUNDARY Review

**Criterion:** Preparation Units and Model Packages must NOT contain claims beyond the Evidence Pool. Specifically:
- No FINAL ANSWER layer
- No invented numbers/times/prices beyond evidence range
- No suitability verdicts without ASK (especially H-2)
- KNOWN_LIMIT claims must be correctly placed

### 2.1 FINAL ANSWER Check

| Artifact | Contains FINAL ANSWER | Result |
|----------|----------------------|--------|
| Preparation Units | No FINAL ANSWER layer in any PU | ✓ PASS |
| Model A Package | No FINAL ANSWER; all JUDGMENT INGREDIENT labeled | ✓ PASS |
| Model B Package | No FINAL ANSWER; all JUDGMENT INGREDIENT labeled | ✓ PASS |

### 2.2 H-2 Yes/No Verdict Check (CRITICAL)

| Location | H-2 Content | Contains Yes/No Suitability Verdict | Result |
|----------|-------------|-------------------------------------|--------|
| PU-HY-003 | "부모님이랑 향일암 가도 될까요?" frame | NO — uses KNOWN/UNKNOWN/ASK structure | ✓ PASS |
| Model A H-2 | MANDATORY ASK STRUCTURE; QUALIFY REGISTER | NO | ✓ PASS |
| Model B H-2 | KL-002 activation → MANDATORY ASK TRIGGER | NO | ✓ PASS |

**H-2 Pilot Contract: SATISFIED IN PREPARATION**

### 2.3 Out-of-Evidence Claims Check

| Claim | In Evidence? | Notes |
|-------|-------------|-------|
| 버스 111번 향일암까지 1시간 27분 | YES (HY-007 walkview.co.kr) | ✓ |
| 택시 ₩40,000~₩48,000 엑스포→향일암 | YES (HY-007 rome2rio) | ✓ |
| 케이블카 성수기 대기 1~2시간 | YES (CC-005 WE pattern) | ✓ |
| 자산→오동도 도보 5분 | YES (REL-001 EI-REL-001-C) | ✓ |
| 하산 우회 코스 존재 | YES (HY-001 EI-HY-001-E) | ✓ |

**EVIDENCE_BOUNDARY Verdict: PASS**  
No fabricated out-of-evidence claims. H-2 correctly excludes suitability verdict.

---

## 3. CONTEXT_FIDELITY Review (MT-1 Focus)

**Criterion:** SOUL must maintain context across turns. MT-1 tests whether Turn 3 vehicle signal triggers correct PU extension.

### MT-1 Context Fidelity Check

| Turn | Signal | Expected Context State | Preparation Supports This? |
|------|--------|----------------------|---------------------------|
| Turn 1 (C-1) | "케이블카 어디서 타요?" | CC-001 + CC-002 + CC-005 active | ✓ (Model A C-1 retrieval; Model B CABLECAR_FULL pre-loaded) |
| Turn 2 | Traveler absorbs info | Context held | ✓ (no conflict) |
| Turn 3 | "차 있는데요" → vehicle signal | EXTEND with CC-003 + REL-003 + REL-006 | ✓ (Model A: adds vehicle PUs; Model B: VEHICLE_EXTENSION block activated) |
| Expected MT-1 output | Vehicle-aware recommendation with parking detail | Both packages support this | ✓ |

**Model A MT-1:** Retrieval index explicitly lists "Turn 3 vehicle added → extend with CC-003, REL-003, REL-006"  
**Model B MT-1:** VEHICLE_EXTENSION block pre-planned in activation map

**CONTEXT_FIDELITY Verdict: SETUP PASS**  
Preparation artifacts correctly structure MT-1 context extension. Actual fidelity tested during Pilot.

---

## 4. LIVE_CORRECTNESS Review

**Criterion:** SOUL must correctly distinguish STABLE vs SEMI_STABLE vs LIVE/VOLATILE fields. Preparation must correctly label these.

### Field Classification Audit

| Field | Preparation Label | Correct Classification | Result |
|-------|------------------|----------------------|--------|
| 오동도 섬 입장 (24시간 무료) | STABLE | STABLE (24hr official policy) | ✓ |
| 동백열차 운행 여부 (우천 시) | LIVE | VOLATILE (rain-suspension) | ✓ |
| 동백열차 시간표 | SEMI_STABLE | SEMI_STABLE (seasonal split, annual revision) | ✓ |
| 오동도 주차 요금 구조 | PREPARED (구조) | STABLE (structure); LIVE (잔여) | ✓ |
| 향일암 계단 구조 | PREPARED | STABLE | ✓ |
| 향일암 탐방 시간 범위 | PREPARED | STABLE pattern | ✓ |
| 향일암 자동차 이동 시간 | SEMI_STABLE | SEMI_STABLE (peak season variation) | ✓ |
| 케이블카 운행 여부 | LIVE | VOLATILE (wind suspension) | ✓ |
| 케이블카 운영 시간 (09:30~21:30) | SEMI_STABLE | SEMI_STABLE (verified but may change) | ✓ |
| 케이블카 요금 | SEMI_STABLE + VERIFY | SEMI_STABLE (CONFLICT-A exists) | ✓ |
| 자산정류장 위치 / 오동도 도보 5분 | STABLE | STABLE (geographic fact) | ✓ |

**LIVE_CORRECTNESS Verdict: PASS**  
All preparation labels correctly reflect stability classification from ER evidence.

---

## 5. KNOWN_LIMIT Propagation Review

| KNOWN_LIMIT | Declared in Manifest | In Preparation Units | In Model A | In Model B |
|-------------|---------------------|---------------------|------------|------------|
| KL-001 (HY-003 descent friction) | ✓ | ✓ PU-HY-002, PU-HY-003 | ✓ H-1, H-2 | ✓ HYANGIRAM_FULL_CONTEXT |
| KL-002 (HY-008 hard block, H-2 ASK contract) | ✓ | ✓ PU-HY-003 | ✓ H-2 MANDATORY ASK | ✓ KL-002 activation condition |

**Propagation completeness: FULL** — both KLs appear in all 4 artifacts.

---

## 6. Gap Discoveries During Preparation

The following gaps were identified during artifact construction. Per authorization: document but do NOT automatically research. Mark BLOCKING only if Pilot validity is compromised.

| Gap ID | Description | Blocking? | Action |
|--------|------------|-----------|--------|
| GAP-PK-001 | 버스 111번 정확한 배차 간격 (30~80분 범위 wide) | NO | H-3 answer usable as range; VERIFY before Pilot if needed |
| GAP-PK-002 | 케이블카 요금 CONFLICT-A 미해소 (₩17,000 vs ₩13,000 일반 왕복) | NO | SEMI_STABLE label and VERIFY annotation sufficient; range usable |
| GAP-PK-003 | 자산정류장 정확 주소 복수 표기 (수정동 332-55 vs 777-4 vs 오동도로 116) | NO | SCOPE_DIFFERENCE confirmed in REL-001; station identity STABLE; address discrepancy non-blocking |
| GAP-PK-004 | 향일암 하산 완만 코스 소요 시간 미확인 | NO | Not needed for H-3 (which asks about 오름 + 방문); mention as option |
| GAP-PK-005 | 돌산정류장 접근 버스 번호 미확인 | NO | CC-002 covers enough for C-2 (car context); bus detail = non-blocking |

**BLOCKING gap count: 0**  
**Pilot validity: NOT compromised by any identified gap**

---

## 7. ASK Category Readiness Review

Per Pilot Protocol V0.2, SOUL ASK behavior is classified as:
- UNNECESSARY_ASK: SOUL asks when answer is already in evidence
- CONTEXT_REASK: SOUL asks something traveler already stated
- MISSED_NECESSARY_ASK: SOUL answers without asking when asking was required

### H-2 (Primary Diagnostic) Readiness

| Condition | Preparation Status |
|-----------|-------------------|
| H-2 content does NOT contain yes/no answer | ✓ |
| H-2 content contains MANDATORY ASK TRIGGER | ✓ |
| Trigger condition defined: "부모님" / "어르신" signal | ✓ |
| Minimum useful question examples provided | ✓ |
| QUALIFY REGISTER defined (what to say after ASK) | ✓ |
| Both Model A and B enforce same contract | ✓ |

**H-2 Readiness: COMPLETE**

### H-3 (Secondary ASK Scenario) Readiness

H-3 asks "2시간이면 충분할까요" — SOUL needs departure location to answer fully.

| Condition | Preparation Status |
|-----------|-------------------|
| Departure location as key variable identified | ✓ (PU-HY-006 RUNTIME label) |
| SOUL ASK trigger: "지금 어디 계세요?" or "어디서 출발?" | ✓ (labeled in PU-HY-006) |
| Calculation if no ASK: can provide ranged answer (엑스포역 기준) | ✓ |

**H-3 Readiness: COMPLETE**

---

## 8. Overall Preparation Readiness Verdict

| Gate | Verdict |
|------|---------|
| FACTUAL_GROUNDING | PASS |
| EVIDENCE_BOUNDARY | PASS |
| CONTEXT_FIDELITY (setup) | PASS |
| LIVE_CORRECTNESS | PASS |
| KNOWN_LIMIT KL-001 propagation | PASS |
| KNOWN_LIMIT KL-002 + H-2 contract | PASS |
| H-2 yes/no verdict excluded | PASS |
| BLOCKING gap count | 0 |
| ASK readiness (H-2 + H-3) | COMPLETE |

### **PREPARATION_READY: YES**

All 4 pre-Pilot integrity conditions satisfied. Preparation artifacts are coherent, grounded, and correctly enforce all governance constraints including HY-008 Option B KNOWN_LIMIT.

**ONE NEXT ACTION:** Founder authorization for Internal 3-Place Pilot execution (9 scenarios + MT-1, Model A vs Model B, Pilot Protocol V0.2).

**DB / Schema / Runtime / Production: NO CHANGE**
