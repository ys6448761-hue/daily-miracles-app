# SOUL Yeosu — Internal 3-Place Pilot Reuse & Failure Ledger V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Purpose:** PU reuse accounting + failure taxonomy ledger for Pilot V0.1  
**Status:** LEDGER_COMPLETE

---

## 1. PU Reuse Accounting (Model A)

Model A selects PUs post-question. Total PU retrievals across 9 single-turn scenarios + MT-1:

| PU | Scenarios Used In | Retrieval Count |
|----|------------------|----------------|
| PU-OD-001 | O-1, O-2, O-3 | 3 |
| PU-OD-002 | O-2 | 1 |
| PU-OD-003 | O-2, O-3 | 2 |
| PU-OD-004 | O-2 | 1 |
| PU-OD-005 | O-1 | 1 |
| PU-OD-006 | O-1 | 1 |
| PU-HY-001 | H-1, H-2, H-3 | 3 |
| PU-HY-002 | H-1, H-2 | 2 |
| PU-HY-003 | H-2 only (KL-001+KL-002) | 1 |
| PU-HY-004 | NOT retrieved by Model A | 0 |
| PU-HY-005 | H-1, H-2, H-3 | 3 |
| PU-HY-006 | H-3 | 1 |
| PU-CC-001 | O-3, C-1, C-2, C-3, MT-1 | 5 |
| PU-CC-002 | O-3, C-1, C-2, MT-1 | 4 |
| PU-CC-003 | C-2, MT-1 T3 | 2 |
| PU-CC-004 | NOT retrieved by Model A for primary responses | 0 |
| PU-CC-005 | O-3, C-1, C-3, MT-1 | 4 |
| PU-REL-001 | O-3, C-3 | 2 |
| PU-REL-002 | O-3, C-3 | 2 |
| PU-REL-003 | O-3, C-2, C-3, MT-1 T3 | 4 |
| PU-REL-004 | O-3, C-3 | 2 |

**Model A PU usage:** 19 of 21 PUs retrieved at least once  
**PUs NOT retrieved by Model A:** PU-HY-004 (rest stops — no scenario directly asked), PU-CC-004 (pricing — not in Model A selection table for C-1)

**Model A: High reuse efficiency** — cross-scenario PU sharing is high (PU-CC-001 used 5×, PU-HY-001 used 3×, PU-CC-005 used 4×)

---

## 2. PU Reuse Accounting (Model B)

Model B pre-activates full context blocks. Effective PU coverage per context activation:

| Context Block | Activated For | PUs Covered |
|--------------|--------------|-------------|
| ODONGDO_FULL_CONTEXT | O-1, O-2, O-3 | OD-001 through OD-006 (6 PUs) |
| HYANGIRAM_FULL_CONTEXT | H-1, H-2, H-3 | HY-001 through HY-006 (6 PUs; KL-001 always active) |
| CABLECAR_FULL_CONTEXT | C-1, C-2, C-3, MT-1 | CC-001 through CC-005 (5 PUs) |
| REL_CONTEXT | O-3, C-3 | REL-001 through REL-005 (cross-place) |
| VEHICLE_EXTENSION | C-2, MT-1 T3 | CC-003 + REL-003 + REL-006 |

**Model B PU coverage:** 21 of 21 PUs covered across activated contexts  
**PU-HY-004 included:** In HYANGIRAM_FULL_CONTEXT → proactively included in H-1 response ✓  
**PU-CC-004 included:** In CABLECAR_FULL_CONTEXT → proactively included in C-1 response ✓

**Model B: Full coverage** — pre-loading ensures no gap; richness advantage traced to PU-HY-004 and PU-CC-004 availability

---

## 3. Cross-Pilot Reuse Signal (continued from controlled collection)

| Phase | Activity | New sources required |
|-------|----------|---------------------|
| Cycle 23 (REL-003) | Controlled collection | 0 new (full reuse) |
| Cycle 24 (REL-004) | Controlled collection | 3 new |
| Cycle 25 (REL-006) | Controlled collection | 2 new |
| **Pilot V0.1** | **Pilot execution (9 scenarios + MT-1 × 2 arms)** | **0 new** |

**Running reuse pattern:** 0 → 3 → 2 → 0

**EARLY_REPEAT_SIGNAL status: OBSERVATION (UNCHANGED)**  
The pattern continues — all 20 pilot response instances (10 scenarios × 2 arms) required zero new evidence. Still not a proven scaling law. Not promoted. Not an Evidence Candidate.

---

## 4. Failure Taxonomy Ledger

### 4.1 Critical Failures

**None.** No critical failures of any type occurred in either arm.

### 4.2 Non-Critical Observations

| ID | Type | Scenario | Arm | Description | Severity |
|----|------|----------|-----|-------------|----------|
| OBS-001 | ANTICIPATION (positive) | O-2 | A | Proactively mentioned cable car time addition (not asked) | Non-blocking; evidence-supported |
| OBS-002 | ANTICIPATION (positive) | C-1 | B | Proactively included pricing from pre-loaded context | Non-blocking; SEMI_STABLE/VERIFY annotated |
| OBS-003 | ANTICIPATION (positive) | H-1 | B | Proactively included rest stop info (PU-HY-004) and travel time | Non-blocking; all from admitted evidence |
| OBS-004 | ANTICIPATION (positive) | H-3 | B | Proactively included bus calculation (PU-HY-006) | Non-blocking; evidence-grounded |
| OBS-005 | CONTEXT_RICHNESS | MT-1 T3 | B | Explicit T1 context reference ("아까 말씀드린 것처럼") | Positive signal; richer fidelity |

**All observations classified as POSITIVE/NON-BLOCKING** — no evidence of over-reach or boundary violation.

### 4.3 Known Limit Handling Assessment

| KL | Scenario | Model A Handling | Model B Handling | Quality |
|----|----------|-----------------|-----------------|---------|
| KL-001 | H-1 | "체력 의존적" qualifier; no confident suitability statement | Same + pre-loaded context includes no-rest-stop nuance | Equivalent; Model B marginally richer |
| KL-001 | H-2 | ASK triggered; QUALIFY includes known friction | ASK triggered immediately; same QUALIFY content | Equivalent |
| KL-002 | H-2 | Post-retrieval ASK (PU-HY-003 pulled → ASK fired) | Pre-loaded KL-002 → ASK fired immediately on "부모님" detection | Equivalent correctness; Model B marginally faster |

---

## 5. GAP Handling Assessment (from Preparation Integrity Review)

| Gap ID | Description | Blocking? | Actual Effect in Pilot |
|--------|------------|-----------|------------------------|
| GAP-PK-001 | 버스 배차 간격 wide (30~80분) | NO | H-3 used "약 1시간 30분" range — acceptable; gap non-blocking as assessed |
| GAP-PK-002 | Cable car pricing CONFLICT-A | NO | Model B used ₩17,000 with SEMI_STABLE label; "VERIFY 권장" annotation present — non-blocking |
| GAP-PK-003 | 자산정류장 address discrepancy | NO | Station identity used correctly; address not needed for Pilot responses |
| GAP-PK-004 | 하산 완만 코스 시간 미확인 | NO | Mentioned as option ("완만한 우회 경로") without fabricating duration — correct |
| GAP-PK-005 | 돌산 접근 버스 번호 | NO | Not needed; C-2 (vehicle context); non-blocking |

**All 5 gaps correctly handled — none became blocking during Pilot execution.**

---

## 6. Evidence Pool Completeness Assessment

**21 PUs × 10 scenarios × 2 arms = Pilot complete**

| Category | PU Count | Scenarios Served | Any Gap Blocking? |
|----------|---------|-----------------|-------------------|
| Odongdo (OD-001~006) | 6 | O-1, O-2, O-3 | NO |
| Hyangiram (HY-001~006) | 6 | H-1, H-2, H-3 | NO |
| Cable Car (CC-001~005) | 5 | C-1, C-2, C-3, MT-1 | NO |
| Relational (REL-001~004) | 4 | O-3, C-2, C-3, MT-1 | NO |

**Evidence Pool Completeness for Pilot: SUFFICIENT**  
HY-008 absence (KL-002): Non-blocking — ASK+QUALIFY operationalization confirmed effective.

---

## 7. Ledger Audit

| Item | Status |
|------|--------|
| All PU retrievals logged (Model A) | ✓ |
| All context activations logged (Model B) | ✓ |
| Cross-pilot reuse signal updated | ✓ (remains OBSERVATION) |
| Zero critical failures confirmed | ✓ |
| All positive observations logged | ✓ |
| All 5 GAPs assessed post-Pilot | ✓ |
| Evidence pool completeness confirmed | ✓ |
| Reuse signal not promoted | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
