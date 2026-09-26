# RQ-JOURNEY-BOUNDARY-001 — Protocol and Boundary Ledger
# V0.1

**Date:** 2026-09-26  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** 385a8a1  
**Status:** PROTOCOL V0.1 + BOUNDARY LEDGER V0.1 — FOUNDER/LUMI REVIEW APPROVED  

---

## A. Research Question

실제 여수 여행 일정에서 문서상 확인 가능한 Journey Boundary는 어떤 형태로 관찰되는가?

---

## B. Boundary Layers

### Layer A — Complete Itinerary Boundary

Source가 전체 일정의 시작과 종료를 문서상 지원할 때만 기록한다.

`First Documented Journey Node → Last Documented Journey Node`

### Layer B — Documented Yeosu Segment Boundary

전체 itinerary가 없더라도 저장된 자료에서 여수 구간의 시작과 종료가 문서상 식별될 때 기록한다.

**중요:**  
Layer B는 실제 여수의 진입점/출구를 의미하지 않는다.  
현재 저장 자료에서 관찰 가능한 documented segment boundary일 뿐이다.

---

## C. Boundary Evidence Status Definitions

| Status | 정의 |
|---|---|
| `COMPLETE_BOUNDARY` | 해당 Layer의 시작과 종료 양쪽을 source가 지원 |
| `PARTIAL_BOUNDARY` | 저장된 일정 자체가 부분 일정이지만 documented segment의 양쪽 경계는 확인 가능 |
| `ONE_SIDED_BOUNDARY` | 시작 또는 종료 한쪽만 확인 가능 |
| `BOUNDARY_INCOMPLETE` | sequence 부족으로 boundary 추출 불가 |

**Critical Rule:**

`PARTIAL_BOUNDARY ≠ COMPLETE_BOUNDARY`

향후 denominator에서도 자동 합산하지 않는다.

---

## D. Evidence Rules

- GitHub Saved Corpus first
- Raw Evidence first
- No gap filling
- No geography/map inference
- No assumed gateway/hub
- No WHY inference
- No recommendation
- No external web/map/official-data supplementation
- Repository wording을 가능한 그대로 보존
- MISSING_DATA를 추론으로 채우지 않음

---

## E. Boundary Ledger V0.1

| YTC | Layer A Boundary | Layer A Status | Layer B Boundary | Layer B Status |
|---|---|---|---|---|
| YTC-001 | 용산역 → 용산역 | COMPLETE_BOUNDARY | 여수 미평동 숙소 → 장도 | COMPLETE_BOUNDARY |
| YTC-002 | 광화문 → 서울 | COMPLETE_BOUNDARY | 오동도 → 여수해상케이블카/돌산공원 | COMPLETE_BOUNDARY |
| YTC-003 | 여수 도착 15:00 → 귀가 | COMPLETE_BOUNDARY | 자산공원 일몰 → 꽃돌게장1번가 | COMPLETE_BOUNDARY |
| YTC-004 | MISSING_DATA → MISSING_DATA | BOUNDARY_INCOMPLETE | MISSING_DATA → MISSING_DATA | BOUNDARY_INCOMPLETE |
| YTC-005 | 여수 → 선암사 | COMPLETE_BOUNDARY | 두꺼비게장/아쿠아플라넷 → 오동도 | COMPLETE_BOUNDARY |
| YTC-006 | 용산역 → 용산역 | COMPLETE_BOUNDARY | 여수해상케이블카 편도 → 오동도 | COMPLETE_BOUNDARY |
| YTC-007 | 전체 일정 시작/종료 미지원 | BOUNDARY_INCOMPLETE | 돌산탑승장 → 오동도 | PARTIAL_BOUNDARY |
| YTC-008 | 전체 일정 시작/종료 미지원 | BOUNDARY_INCOMPLETE | 돌산탑승장 → 오동도 | PARTIAL_BOUNDARY |
| YTC-009 | 전체 일정 시작/종료 미지원 | BOUNDARY_INCOMPLETE | 자산탑승장 → 돌산공원 | PARTIAL_BOUNDARY |
| YTC-010 | MISSING_DATA → MISSING_DATA | BOUNDARY_INCOMPLETE | 향일암(계획) / 봉산동(실제) → 오동도/휴식 | PARTIAL_BOUNDARY |
| YTC-011 | MISSING_DATA → MISSING_DATA | BOUNDARY_INCOMPLETE | 돌산탑승장 → 돌산탑승장 귀환 | PARTIAL_BOUNDARY |
| YTC-012 | MISSING_DATA → MISSING_DATA | BOUNDARY_INCOMPLETE | 자산탑승장 → 자산탑승장 귀환 | PARTIAL_BOUNDARY |
| YTC-013 | MISSING_DATA → 광양 | ONE_SIDED_BOUNDARY | 오동도 → 돌산탑승장 | BOUNDARY_INCOMPLETE |
| YTC-014 | 순천 → MISSING_DATA | ONE_SIDED_BOUNDARY | 여수(향일암) → MISSING_DATA | ONE_SIDED_BOUNDARY |

---

## F. Screening Counts

### Layer A

| Status | Count | YTC IDs |
|---|---|---|
| COMPLETE_BOUNDARY | 5 | YTC-001, YTC-002, YTC-003, YTC-005, YTC-006 |
| ONE_SIDED_BOUNDARY | 2 | YTC-013, YTC-014 |
| BOUNDARY_INCOMPLETE | 7 | YTC-004, YTC-007, YTC-008, YTC-009, YTC-010, YTC-011, YTC-012 |
| **Total** | **14** | |

**Arithmetic:** 5 + 2 + 7 = 14 — **PASS**

### Layer B

| Status | Count | YTC IDs |
|---|---|---|
| COMPLETE_BOUNDARY | 5 | YTC-001, YTC-002, YTC-003, YTC-005, YTC-006 |
| PARTIAL_BOUNDARY | 6 | YTC-007, YTC-008, YTC-009, YTC-010, YTC-011, YTC-012 |
| ONE_SIDED_BOUNDARY | 1 | YTC-014 |
| BOUNDARY_INCOMPLETE | 2 | YTC-004, YTC-013 |
| **Total** | **14** | |

**Arithmetic:** 5 + 6 + 1 + 2 = 14 — **PASS**

---

## G. Key Notes

**YTC-004:** Sequence = MISSING_DATA (Historical/Possibly Stale) — Layer A/B 모두 BOUNDARY_INCOMPLETE.

**YTC-013:** 저장 자료에 압축 형태(`오동도 → 자산탑승장 → 케이블카 편도 → 돌산탑승장 → 광양`)만 존재. Layer B는 여수 구간 내부 일부만 포착되어 BOUNDARY_INCOMPLETE.

**YTC-014:** 일정 종료가 `...` 표기로 truncated. Layer A/B 모두 ONE_SIDED_BOUNDARY.

**YTC-010 Layer B:** Plan-change 사건으로 시작 노드가 계획(향일암)과 실제(봉산동) 양쪽 존재. Raw Evidence 그대로 보존. PARTIAL_BOUNDARY.

---

## H. Interpretation Guardrail

현재 단계에서는 다음을 결론 내리지 않는다.

| 항목 | 상태 |
|---|---|
| Gateway Pattern | NOT CONCLUDED |
| Hub Pattern | NOT CONCLUDED |
| Entry / Exit Pattern | NOT CONCLUDED |
| Regional Pattern | NOT CONCLUDED |
| Journey Boundary Pattern | NOT CONCLUDED |
| WHY | NOT ASSESSED |
| Recommended Start / End | NOT CREATED |
| Optimal Route | NOT CREATED |
| Journey Grammar | NOT CREATED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | HYPOTHESIS ONLY |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

## I. Research Status

**Protocol:** `V0.1 — FOUNDER/LUMI REVIEW APPROVED`  
**Boundary Ledger:** `V0.1 — COMPLETE`  
**Pattern Review:** `NOT STARTED`  
**Evidence Sufficiency Review:** `NOT YET EXECUTED`  
**Persistence:** `PERSISTED (2026-09-26)`

---

*RQ-JOURNEY-BOUNDARY-001 Protocol and Boundary Ledger V0.1 — 2026-09-26*
