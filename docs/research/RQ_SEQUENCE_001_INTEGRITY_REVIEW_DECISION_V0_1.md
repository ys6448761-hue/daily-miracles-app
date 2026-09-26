# RQ-SEQUENCE-001 — Journey Sequence Evidence Surface
# Independent Integrity Review Decision V0.1

**Date:** 2026-09-26  
**Branch:** staging/storybook-c7a  
**Reviewed Baseline Checkpoint:** ea9edaa  
**Final Verdict:** `PASS WITH CORRECTIONS`  
**Corrections Applied:** C-01 (APPROVED) / C-02 (APPROVED)

---

## A. Frozen Extraction Baseline (Pre-Correction)

| 항목 | 값 |
|---|---|
| YTC Screened | 14 / 14 |
| Total SEU | 104 |
| First Sample (YTC-001~006) | 78 |
| Second Sample (YTC-007~014) | 26 |

**Pre-correction Scope Distribution:**

| Scope | Count |
|---|---|
| FULL_ITINERARY_SCOPE | 5 |
| SEGMENT_ONLY_SCOPE | 7 |
| PARTIAL_ITINERARY_SCOPE | 1 |
| SCOPE_UNCLEAR | 1 |
| **Total** | **14** |

**Pre-correction Quality Distribution:**

| Quality | Count | YTC IDs |
|---|---|---|
| CONTINUOUS_SEQUENCE | 10 | YTC-001~003, 005~009, 011, 012 |
| PARTIAL_SEQUENCE | 1 | YTC-010 |
| COMPRESSED_SEQUENCE | 1 | YTC-013 |
| SEQUENCE_INCOMPLETE | 2 | YTC-004, 014 |
| **Total** | **14** | |

---

## B. Correction Ledger

### C-01 — YTC-010 Quality

| 항목 | 값 |
|---|---|
| YTC | YTC-010 |
| Existing Classification | `PARTIAL_SEQUENCE` |
| Audit Finding | documented segment 내 2 SEU 모두 source-stated adjacency. Plan-change Actual sequence: 향일암(계획축소/포기) → 봉산동 식사 → 오동도/휴식. 각 adjacency 직접 source-지원. within-segment sequence 연속성 확인됨. |
| Reason for PARTIAL in original | Plan-change sequence라는 이유로 분류 — Protocol 정의에 없는 기준 적용 |
| Correction | **`PARTIAL_SEQUENCE → CONTINUOUS_SEQUENCE`** |
| Protocol Basis | CONTINUOUS_SEQUENCE 정의: "저장된 documented scope 내부에서 node order와 adjacency가 연속적으로 확인됨" — 해당함. PARTIAL_SEQUENCE 정의: "제공된 범위 내부의 node order/adjoining relation은 확인 가능" — 이는 CONTINUOUS 기준과 동일하거나 낮은 bar. 연속성이 더 강하게 확인되므로 CONTINUOUS가 적합. |
| SEU Delta | 0 |
| Lumi Approval | **APPROVED** |

---

### C-02 — YTC-013 Quality

| 항목 | 값 |
|---|---|
| YTC | YTC-013 |
| Existing Classification | `COMPRESSED_SEQUENCE` |
| Audit Finding | Raw Schedule: `오동도 → 자산탑승장 → 케이블카 편도 → 돌산탑승장 → 광양` — "..." 또는 생략 표시 없음. 4개 adjacency 모두 source에서 직접 연결 표기. "exact adjacency를 보장할 수 없다"는 COMPRESSED 기준 불성립. |
| Reason for COMPRESSED in original | Boundary RQ에서 "compressed/incomplete"로 표현된 것의 영향. RQ-SEQUENCE-001 Protocol은 Boundary 분류를 복사하지 않는다는 원칙 미적용. |
| Correction | **`COMPRESSED_SEQUENCE → PARTIAL_SEQUENCE`** |
| Protocol Basis | COMPRESSED_SEQUENCE 정의: "순서는 일부 보이지만 표현이 축약되어 exact adjacency를 모두 보장할 수 없음" — 해당 안 함. Scope 제한(SEGMENT_ONLY)은 이미 반영됨. PARTIAL_SEQUENCE: 저장된 범위 내 adjacency 확인 가능 — 해당함. |
| Additional Constraint | 자동 CONTINUOUS 승격 금지 (원래 연구 지침) 여전히 유효 — PARTIAL ≠ CONTINUOUS |
| SEU Delta | 0 |
| Lumi Approval | **APPROVED** |

---

## C. Journey Node Ontology Audit

### MOVEMENT_EVENT Classification

**"투어버스" (YTC-006):**  
Source wording: `용산역 → 순천역 → 투어버스 → 남해`  
Audit classification: `MOVEMENT_EVENT / UNRESOLVED_NODE_TYPE`

**"버스" (YTC-007):**  
Source wording: `자산탑승장 → 버스 → 자산공원주차장 집결`  
Audit classification: `MOVEMENT_EVENT / UNRESOLVED_NODE_TYPE`

**Decision:** 이번 baseline에서 삭제하지 않는다.

| 이유 | 내용 |
|---|---|
| Source Fidelity | source wording을 가능한 그대로 보존 원칙 |
| No Gap Filling | 제거 시 source 미명시 adjacency 생성 불가피 (`순천역 → 남해`, `자산탑승장 → 자산공원주차장`) |
| Protocol 결정 | 향후 Protocol에서 MOVEMENT_EVENT 취급 기준 명확화 필요 |

**적용 제약:**  
`MOVEMENT_EVENT ≠ PLACE_NODE`  
향후 Pattern Review에서 무비판적 합산 금지.

---

### Cable Car Ontology

| 표현 | Ontology | 판정 |
|---|---|---|
| 여수해상케이블카 | ACTIVITY_OR_EXPERIENCE_NODE | 방문 경험 목적지 — VERIFIED |
| 케이블카 편도/왕복 | ACTIVITY_OR_EXPERIENCE_NODE | 방향/형태 qualifier 포함 경험 — VERIFIED |
| 케이블카 탑승장 | PLACE_NODE | 물리적 승강장 — VERIFIED |

Cable Car ≠ TRANSPORT_MODE_ONLY 판정: 여수해상케이블카는 여행자가 경험 목적으로 방문하는 대상이다. 투어버스/버스와 다른 분류는 정당하다.

---

## D. SEU Source-Support Audit (Flagged Items)

| SEU | Verdict | Basis |
|---|---|---|
| YTC-001: 케이블카 탑승장 → 여수해상케이블카 | VERIFIED | Source-stated sequence element 간 직접 adjacency |
| YTC-003: 낭만24포차 시도 → 꽃돌게장1번가 | VERIFIED | Plan-change Actual; source에 명시 ("꽃돌게장1번가로 변경") |
| YTC-005: 아쿠아플라넷 → 아르떼뮤지엄 | VERIFIED | Plan-change; "(계획보다 일찍 종료) → 아르떼뮤지엄 추가" source-stated |
| YTC-006: 순천역→투어버스, 투어버스→남해 | VERIFIED (with MOVEMENT_EVENT flag) | Source-stated sequence; flag preserved |
| YTC-007: 자산탑승장→버스, 버스→자산공원주차장 집결 | VERIFIED (with MOVEMENT_EVENT flag) | Source-stated sequence; flag preserved |
| YTC-010: 향일암 → 봉산동 식사 | VERIFIED | Plan-change Actual; 조기이동/택시 = MOVEMENT_EVENT (skip 정당); 봉산동 식사가 다음 place node |
| YTC-011: 왕복 케이블카 표현 | VERIFIED | "케이블카 왕복 (돌산↔자산)" source-stated; 3-node sequence 확인 |
| YTC-012: 왕복 케이블카 표현 | VERIFIED | "케이블카 왕복 (자산→돌산→자산)" source-stated; 3-node sequence 확인 |
| YTC-013: 4개 compressed adjacency | VERIFIED | 모두 source에서 직접 → 연결. COMPRESSED 기준 미성립 → C-02 적용 |
| YTC-014: 순천→여수, 여수→향일암 | VERIFIED | "..." 이전 두 adjacency 모두 source-stated |
| Inter-day overnight gap SEU 없음 | PASS | 모든 multi-day YTC에서 Day 간 unsupported adjacency 없음 확인 |

---

## E. Corrected Distributions

### Scope (변경 없음)

| Scope | Count |
|---|---|
| FULL_ITINERARY_SCOPE | 5 |
| SEGMENT_ONLY_SCOPE | 7 |
| PARTIAL_ITINERARY_SCOPE | 1 |
| SCOPE_UNCLEAR | 1 |
| **Total** | **14** |

### Quality (C-01, C-02 적용)

| Quality | Before | After |
|---|---|---|
| CONTINUOUS_SEQUENCE | 10 | **11** (+1 YTC-010) |
| PARTIAL_SEQUENCE | 1 | **1** (-1 YTC-010, +1 YTC-013) |
| COMPRESSED_SEQUENCE | 1 | **0** (-1 YTC-013) |
| SEQUENCE_INCOMPLETE | 2 | **2** (unchanged) |
| **Total** | **14** | **14** |

**Arithmetic check:** 11+1+0+2 = 14 — PASS

### SEU (변경 없음)

| 집계 | 값 |
|---|---|
| First Sample | 78 |
| Second Sample | 26 |
| **Corrected Total SEU** | **104** |
| Count Delta from corrections | **0** |

---

## F. Integrity Gates

| Gate | 판정 |
|---|---|
| Canonical source fidelity | **PASS** |
| No gap filling | **PASS** |
| No inference-created adjacency | **PASS** — inference SEU = 0 |
| Journey Node ontology consistency | **PASS WITH FLAG** — MOVEMENT_EVENT 보존; 향후 프로토콜 명확화 필요 |
| Scope consistency | **PASS** |
| Quality consistency | **PASS WITH CORRECTIONS** — C-01/C-02 적용 후 |
| SEU arithmetic (78+26=104) | **PASS** |
| No Pattern inference | **PASS** |
| No WHY inference | **PASS** |
| No external supplementation | **PASS** |
| Inter-day overnight gap check | **PASS** — unsupported SEU = 0 |

---

## G. Final Accepted Baseline

| 항목 | 값 |
|---|---|
| YTC Screened | **14 / 14** |
| Total SEU | **104** |
| First Sample subtotal | **78** |
| Second Sample subtotal | **26** |
| Inference-created SEU | **0** |
| Unsupported inter-day adjacency | **0** |
| MOVEMENT_EVENT flag | **Preserved (투어버스, 버스)** |

**Scope:** FULL=5 / SEGMENT=7 / PARTIAL_ITINERARY=1 / UNCLEAR=1  
**Quality:** CONTINUOUS=11 / PARTIAL=1 / COMPRESSED=0 / INCOMPLETE=2

**Final Verdict:** `PASS WITH CORRECTIONS`

---

## H. Governance

| 항목 | 상태 |
|---|---|
| Sequence Pattern Review | NOT PERFORMED |
| Evidence Sufficiency Decision | NOT YET DECIDED |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Gateway Pattern | NOT CONCLUDED |
| Hub Pattern | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

*RQ-SEQUENCE-001 Independent Integrity Review Decision V0.1 — 2026-09-26*
