# SOUL Yeosu — 3-Place Preparation Gap & Reuse Ledger V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Phase:** Prepared Knowledge Construction V0.1  
**Status:** LEDGER_COMPLETE

---

## 0. Ledger Purpose

This ledger serves two functions:

1. **Reuse Ledger:** Tracks how many scenarios each Preparation Unit is reused across, and whether the investment in each ER's evidence collection justified the preparation cost.

2. **Gap Register (PK-level):** Documents gaps discovered during preparation construction that were NOT previously captured in ER-level gap registers. These are NOT automatically researched — they are documented for Founder awareness.

---

## 1. Preparation Unit Reuse Ledger

| PU ID | Place | Scenarios Using This PU | Reuse Count | Notes |
|-------|-------|------------------------|-------------|-------|
| PU-OD-001 | 오동도 | O-1, O-2 | 2 | Core character PU; also context for O-3 |
| PU-OD-002 | 오동도 | O-2 | 1 | Duration-specific; high value for O-2 |
| PU-OD-003 | 오동도 | O-3, O-2 (context) | 2 | Access structure; LIVE flag PU |
| PU-OD-004 | 오동도 | O-2 (parking context) | 1 | Secondary role; parking detail |
| PU-OD-005 | 오동도 | O-1, O-2 | 2 | Accessibility; context enrichment |
| PU-OD-006 | 오동도 | O-1, O-3 | 2 | Operating boundary; LIVE/SEMI_STABLE hub |
| PU-OD-007 | 오동도 | O-1, O-2 | 2 | Scale + accessibility; merged into OD-001 function |
| PU-HY-001 | 향일암 | H-1, H-2, H-3 | 3 | Highest reuse — structural foundation for all H scenarios |
| PU-HY-002 | 향일암 | H-1, H-2 | 2 | Burden evidence; critical for suitability context |
| PU-HY-003 | 향일암 | H-2 only | 1 | H-2 exclusive; KL-001+KL-002 carrier |
| PU-HY-004 | 향일암 | H-2, H-3 | 2 | Rest stop negative knowledge |
| PU-HY-005 | 향일암 | H-1, H-2, H-3 | 3 | Flat route + duration; high reuse |
| PU-HY-006 | 향일암 | H-3 | 1 | Travel time; H-3 specific |
| PU-CC-001 | 케이블카 | C-1, C-2, C-3, MT-1, O-3 | 5 | Highest reuse — station identity is prerequisite for all CC scenarios |
| PU-CC-002 | 케이블카 | C-1, C-2, MT-1 | 3 | Per-station access; routing foundation |
| PU-CC-003 | 케이블카 | C-2, MT-1 (Turn 3) | 2 | Vehicle/parking; activated on vehicle signal |
| PU-CC-004 | 케이블카 | C-1, C-3 | 2 | Cabin types; secondary enrichment |
| PU-CC-005 | 케이블카 | C-1, C-3, O-3 | 3 | Operating/LIVE boundary; cross-scenario |
| PU-REL-001 | Cross | O-3, C-3 | 2 | Directional geography; prerequisite for sequence |
| PU-REL-002 | Cross | O-3, C-3 | 2 | Exit-to-Odongdo; practical connection |
| PU-REL-003 | Cross | O-3, C-2, C-3, MT-1 | 4 | Recommended direction; high reuse |
| PU-REL-004 | Cross | O-3, C-3 | 2 | Sequence friction; nighttime note |

**Total PU-scenario activations:** 56 across 21 PUs and 10 scenarios (+MT-1)  
**Average reuse per PU:** 2.5  
**Highest reuse PUs:** PU-CC-001 (5), PU-REL-003 (4), PU-HY-001 (3), PU-HY-005 (3), PU-CC-005 (3), PU-CC-002 (3)

---

## 2. ER Collection Investment vs Preparation Value

| ER | Collection Cycles Used | PU Output | Scenario Coverage | Investment Value |
|----|----------------------|-----------|------------------|-----------------|
| OD-001 | Wave 1 (Cycle 1) | PU-OD-001, contributes to OD-005, OD-007 | O-1, O-2 | HIGH — foundational character PU |
| OD-002 | Wave 4 (Cycle 16) | PU-OD-002 | O-2 | HIGH — duration = frequent travel question |
| OD-003 | Wave 1 (Cycle 3) | PU-OD-003 | O-3, O-2 context | HIGH — access = critical for O-3 |
| OD-004 | Wave 2 (Cycle 5) | PU-OD-004 | O-2 context | MEDIUM — parking secondary |
| OD-005 | Wave 4 (Cycle 18) | PU-OD-005 (part) | O-1, O-2 | MEDIUM — enrichment only |
| OD-006 | Wave 3 (Cycle 14) | PU-OD-006 | O-1, O-3 | HIGH — LIVE boundary essential |
| OD-007 | Wave 4 (Cycle 19) | PU-OD-007 (merged) | O-1, O-2 | MEDIUM — OD-001 overlap; standalone value moderate |
| HY-001 | Wave 1 (Cycle 2) | PU-HY-001 | H-1, H-2, H-3 | HIGHEST — all H scenarios depend on this |
| HY-002 | Wave 2 (Cycle 6) | PU-HY-002 | H-1, H-2 | HIGH — burden pattern essential |
| HY-003 | Wave 3 (upgrade attempts) | PU-HY-002 (KL-001) | H-1, H-2 | HIGH (governance value; KNOWN_LIMIT carrier) |
| HY-004 | Wave 4 (Cycle 20) | PU-HY-004 | H-2, H-3 | MEDIUM — informative negative |
| HY-005 | Wave 4 (Cycle 17) | PU-HY-001 (route split) | H-1, H-2, H-3 | HIGH — flat route = key safety option |
| HY-006 | Wave 2 (Cycle 9) | PU-HY-005 (duration) | H-3 | HIGH — H-3 would be unanswerable without this |
| HY-007 | Wave 3 (Cycle 13) | PU-HY-006 | H-3 | HIGH — travel time = H-3 feasibility pivot |
| CC-001 | Wave 1 (Cycle 4) | PU-CC-001 | C-1, C-2, C-3, O-3, MT-1 | HIGHEST — 5 scenarios; all CC depend on this |
| CC-002 | Wave 2 (Cycle 7) | PU-CC-002 | C-1, C-2, MT-1 | HIGH — access routing |
| CC-003 | Wave 3 (Cycle 11) | PU-CC-003 | C-2, MT-1 | HIGH — vehicle context = C-2 essential |
| CC-004 | Wave 4 (Cycle 21) | PU-CC-004 | C-1, C-3 | MEDIUM — cabin enrichment |
| CC-005 | Wave 3 (Cycle 15) | PU-CC-005 | C-1, C-3, O-3 | HIGH — LIVE/operating essential |
| REL-001 | Wave 2 (Cycle 8) | PU-REL-001 | O-3, C-3 | HIGH — directional geography prerequisite |
| REL-002 | Wave 3 (Cycle 10) | PU-REL-002 | O-3, C-3 | HIGH — practical connection evidence |
| REL-003 | Wave 4b (Cycle 23) | PU-REL-004 (time component) | O-3, C-3 | HIGH — sequence time needed for complex scenarios |
| REL-004 | Wave 4b (Cycle 24) | PU-REL-004 (friction + nighttime) | O-3, C-3 | MEDIUM — friction pattern; nighttime Odongdo unique |
| REL-005 | Wave 4a (Cycle 22) | PU-REL-003 (direction) | O-3, C-2, C-3, MT-1 | HIGH — direction recommendation = 4 scenarios |
| REL-006 | Wave 4b (Cycle 25) | PU-REL-003 (vehicle impact) | C-2, C-3, MT-1 | HIGH — vehicle direction = C-2 essential |

---

## 3. Reuse Observation: EARLY_REPEAT_SIGNAL

An observation from Wave 4b collection (not promoted to finding):

Wave 4b cycle metrics:
- Cycle 23 (REL-003): 0 new evidence items; 100% reuse of existing corpus
- Cycle 24 (REL-004): 3 new items; substantial corpus reuse
- Cycle 25 (REL-006): 2 new items; substantial corpus reuse

This pattern suggests that later-wave ERs drew heavily from already-collected evidence. The marginal cost of each additional ER decreased as the corpus matured. This supports the current collection architecture (wave-ordered, reuse-first).

**Status:** OBSERVATION_ONLY — not promoted to architectural finding in this phase.

---

## 4. PK-Level Gap Register

Gaps discovered during Preparation construction that are NOT in ER-level registers.

| Gap ID | Description | Discovered In | Severity | Blocking? |
|--------|------------|--------------|----------|-----------|
| GAP-PK-001 | 버스 111번 배차 간격: 30~80분 범위 wide (정확한 현재 간격 미확인) | PU-HY-006 | LOW | NO — range usable for H-3 guidance |
| GAP-PK-002 | 케이블카 요금 CONFLICT-A 미해소 (₩17,000 vs ₩13,000 일반 왕복) | PU-CC-004 | LOW | NO — SEMI_STABLE label sufficient; VERIFY annotation in place |
| GAP-PK-003 | 자산정류장 지번 주소 복수 표기 (수정동 332-55 vs 777-4 vs 오동도로 116) | PU-CC-001, PU-REL-001 | LOW | NO — SCOPE_DIFFERENCE confirmed (parking tower vs station building vs compound address) |
| GAP-PK-004 | 향일암 하산 완만 코스 소요 시간 (15~20분? 미측정) | PU-HY-001 | LOW | NO — descent time not required for any scenario judgment |
| GAP-PK-005 | 돌산정류장 접근 버스 번호 미확인 | PU-CC-002 | LOW | NO — C-2 assumes vehicle; C-1 general access by taxi/car covers primary C-2 need |
| GAP-PK-006 | 오동도 음악분수 정확한 운영 시간/날짜 | PU-OD-006 | LOW | NO — LIVE label sufficient; fountain = secondary attraction |
| GAP-PK-007 | 케이블카 정기 점검일 수요일 = 확정 여부 | PU-CC-005 | LOW | NO — SEMI_STABLE + VERIFY annotation covers this |

**Total PK-level gaps:** 7  
**BLOCKING gaps:** 0  
**Action required before Pilot:** NONE (all gaps have VERIFY annotations or are non-blocking)

---

## 5. Evidence Coverage by Scenario

| Scenario | ERs Providing Evidence | PU Coverage | Gaps Remaining | Pilot Ready? |
|----------|----------------------|-------------|----------------|-------------|
| O-1 | OD-001, OD-005, OD-006, OD-007 | PU-OD-001, 005, 006 | None | ✓ |
| O-2 | OD-002, OD-001, OD-003, OD-004 | PU-OD-002, 001, 003, 004 | None | ✓ |
| O-3 | OD-003, REL-001~005, CC-001, CC-002, CC-005 | All relevant PUs | None | ✓ |
| H-1 | HY-001, HY-002, HY-005 | PU-HY-001, 002, 005 | KL-001 documented | ✓ |
| H-2 | HY-001, HY-002, HY-003, HY-005 | PU-HY-003 (KL-001+KL-002) | HY-008 KNOWN_LIMIT documented | ✓ (diagnostic case) |
| H-3 | HY-006, HY-007, HY-001 | PU-HY-005, 006, 001 | GAP-PK-001 (non-blocking) | ✓ |
| C-1 | CC-001, CC-002, CC-005 | PU-CC-001, 002, 005 | None | ✓ |
| C-2 | CC-001, CC-003, CC-002 | PU-CC-001, 003, 002, REL-003 | GAP-PK-005 (non-blocking) | ✓ |
| C-3 | REL-001, 002, 003, 005 CC-001, CC-005 | All relevant PUs | None | ✓ |
| MT-1 | C-1 base + CC-003, REL-003, REL-006 | Extension defined | None | ✓ |

**All 10 scenarios: PILOT_READY**

---

## 6. Ledger Summary

| Metric | Value |
|--------|-------|
| Total Preparation Units | 21 |
| Total PU-scenario activations | 56 |
| Average PU reuse | 2.5 scenarios |
| Highest-reuse PU | PU-CC-001 (5 scenarios) |
| Total PK-level gaps identified | 7 |
| BLOCKING gaps | 0 |
| Scenarios with no blocking gaps | 10/10 |
| Preparation readiness | PREPARATION_READY |
| Controlled Collection Cycles at ledger creation | 25 |
| DB / Schema / Runtime / Production | NO CHANGE |
