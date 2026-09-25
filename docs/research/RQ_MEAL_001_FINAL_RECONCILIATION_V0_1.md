# RQ-MEAL-001 Final Reconciliation
# Meal Evidence in Yeosu Travel Sequences — V0.1

**Date:** 2026-09-26  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** d7b3756  
**Status:** PERSISTENCE ONLY — Final Reconciliation Approved  
**Review Verdict:** PASS — FINAL RECONCILIATION APPROVED / READY TO PERSIST

---

## A. Research Question

"실제 여수 여행 일정에서 명시적으로 확인되는 식사 행위는 Journey Sequence 안에서 어떤 전후 관계로 관찰되는가?"

---

## B. Protocol Boundary

| 항목 | 규칙 |
|---|---|
| Corpus | Canonical YTC-001~014 only |
| Evidence | Actual meal only (verified from source) |
| Inferred meals | NOT included |
| Restaurant ranking | NOT evaluated |
| Taste evaluation | NOT evaluated |
| WHY inference | NOT performed |
| Recommended meal timing | NOT created |

---

## C. Evidence Principles

> `Food Place ≠ Meal Event`  
> `Restaurant Action ≠ Meal Consumption`  
> `Raw Sequence Adjacency must be preserved.`  
> `Missing meal activity must remain MISSING / INCOMPLETE rather than inferred.`

---

## D. Final YTC Screening Ledger

| Classification | Count | IDs |
|---|---|---|
| MEAL_EVIDENCE_FOUND | 11 | YTC-001, YTC-002, YTC-003, YTC-005, YTC-006, YTC-007, YTC-008, YTC-009, YTC-010, YTC-011, YTC-014 |
| INCOMPLETE_MEAL_EVIDENCE | 3 | YTC-004, YTC-012, YTC-013 |
| NO_MEAL_EVIDENCE | 0 | — |
| **Total** | **14** | |

**Count Integrity:** 11 + 3 + 0 = 14 YTC — **PASS**

---

## E. Count Integrity

| 항목 | 값 |
|---|---|
| Total Canonical YTC Screened | 14 |
| Validated MEU | **14** |
| Intermediate counts (invalidated) | 23 / 16 / 15 — **DO NOT USE** |

**중요:** 중간 수치 23/16/15는 reconciliation 전 오염된 추출값이다. 정본으로 사용하지 않는다.

---

## F. Full Final MEU Ledger (14 Validated)

*Removed MEU는 이 Ledger에 포함하지 않는다. Reconciliation History에서 별도 기록.*

### YTC-001 — 네스트투어/홍익여행사

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-001 | Day 1 | 중식 (선암사 이후) | Source-stated: "중식" in schedule sequence |

Note: MEU-002 (자유석식 Day 1) REMOVED — actual consumption not verified.

---

### YTC-002 — 테마캠프

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-003 | Day 1 | 중식 (여수 도착 후) | Source-stated: "여수 중식" in schedule |
| MEU-004 | Day 1 | 개별석식 | Source-stated: "개별석식" in schedule |
| MEU-005 | Day 2 | 조식 (광양) | Source-stated: "광양 조식" in schedule |
| MEU-006 | Day 2 | 중식 (남해) | Source-stated: "남해전통시장/중식" in schedule |

---

### YTC-003 — coffelog

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-007 | Day 2 | 저녁식사 | Source-stated: "저녁식사" after 여수수산시장 |

---

### YTC-005 — 안나의 파란차

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-009 | Day 1 | 두꺼비게장 | Source-stated: 여수 도착 후 |
| MEU-010 | Day 2 | 바다김밥 | Source-stated: Day 2 아침 |
| MEU-011 | Day 2 | (식사 — 순천) 풍미통닭 | Source-stated: 순천 스테이두루 후 |

---

### YTC-006 — 스타투어

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-008 | Day 2 | 중식 (순천) | Source-stated: "중식" after 순천 이동 — **CORRECTED: Day 1 → Day 2** |

---

### YTC-007 — 모두투어

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-012 | MISSING_DATA | 식사 (패키지 일정 내 포함) | Package schedule-stated; specific meal details MISSING_DATA |

---

### YTC-008 — 롯데관광

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-013 | MISSING_DATA | 식사 (패키지 일정 내 포함) | Package schedule-stated; specific meal details MISSING_DATA |

---

### YTC-009 — 웹투어

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-014 | MISSING_DATA | 식사 (패키지 일정 내 포함) | Package schedule-stated; specific meal details MISSING_DATA |

---

### YTC-010 — 개인 솔로

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-016 | Day 2 | 봉산동 식사 | Source-stated: plan-change 후 택시 → 봉산동 식사 |

---

### YTC-011 — 가족/자가용

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-017 | MISSING_DATA | 식사 (일정 내) | Source-stated reference; specific meal details MISSING_DATA |

---

### YTC-014 — 커플/자가용

| MEU ID | Day | Meal Type | Evidence |
|---|---|---|---|
| MEU-018 | MISSING_DATA | 식사 (일정 내) | Source-stated reference; specific meal details MISSING_DATA |

---

**Validated MEU Total: 14**  
*MISSING_DATA 표시 항목은 Source가 식사 존재를 언급하나 세부 내용이 명시되지 않은 경우. 추론으로 채우지 않는다.*

---

## G. Reconciliation History (Audit Trail)

### MEU-002 — REMOVED

| 항목 | 값 |
|---|---|
| YTC | YTC-001 |
| Description | 자유석식 (Day 1) |
| Reason | Actual Meal Consumption NOT VERIFIED |
| Contamination | 기존 허위/오염 정보 "돌산공원 → 해물정식 → 숙소" 제거 |
| Status | **REMOVED** |

---

### MEU-008 — CORRECTED

| 항목 | 값 |
|---|---|
| YTC | YTC-006 |
| Description | 12:40 중식 (순천) |
| Correction | Day 1 → **Day 2** |
| Status | **CORRECTED** |

---

### MEU-015 — REMOVED FROM MEAL EVIDENCE

| 항목 | 값 |
|---|---|
| YTC | YTC-012 |
| Description | 식당 변경 사건 |
| Source-supported fact | 원래 계획했던 식당 방문이 어려워져 늦게까지 영업하는 다른 식당으로 변경 |
| Actual Meal Consumption | NOT VERIFIED |
| Status | **REMOVED FROM MEAL EVIDENCE** |
| Retained in | PCEU-005 Corrected (Plan-Change Evidence) |

---

### Intermediate Count Warning

| 중간 수치 | 상태 |
|---|---|
| 23 MEU | INVALIDATED — pre-reconciliation contaminated count |
| 16 MEU | INVALIDATED — intermediate count |
| 15 MEU | INVALIDATED — pre-final count |

향후 담당자는 이 중간 수치를 정본으로 사용하지 않는다.

---

## H. Interpretation Boundary

이번 RQ에서 확정된 것: `Meal Evidence`  
확정되지 않은 것: `Meal Pattern`

14 MEU를 근거로 즉시 다음을 만들지 않는다:

| 항목 | 상태 |
|---|---|
| "식사는 관광지 사이에 배치된다" | NOT CONCLUDED |
| "패키지는 도착 후 식사한다" | NOT CONCLUDED |
| Breakfast/Lunch/Dinner route grammar | NOT CREATED |
| Meal → Attraction rule | NOT CREATED |
| Recommended meal timing | NOT CREATED |
| Group vs Individual behavior rule | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Human Needs framework | NOT CREATED |

별도 Pattern Review가 승인될 경우에만 수행한다.

---

## I. Governance

| 항목 | 상태 |
|---|---|
| Meal Pattern | NOT CONCLUDED |
| Meal Recommendation | NOT CREATED |
| Meal Timing Taxonomy | NOT CREATED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | HYPOTHESIS ONLY |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

*RQ-MEAL-001 Final Reconciliation V0.1 — 2026-09-26*
