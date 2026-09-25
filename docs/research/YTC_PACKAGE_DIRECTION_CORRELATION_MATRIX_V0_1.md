# YTC Package Direction Correlation Matrix V0.1

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** 3bd9bca  
**Status:** DESCRIPTIVE ANALYSIS / CANONICAL INTEGRITY REVIEWED  
**Review Result:** PASS WITH CORRECTIONS — REVISED MATRIX READY

---

## Scope

**Dataset:** Package-product Corpus only  
**Cases:** YTC-001, YTC-002, YTC-006, YTC-007, YTC-008, YTC-009, YTC-013  
**Package Cases:** 7  

**Excluded from this Matrix:** Individual / Regional Non-package cases (YTC-003, YTC-004, YTC-005, YTC-010, YTC-011, YTC-012, YTC-014)

**Approach:** Descriptive only. WHY 분석 금지. New Evidence 추가 금지. Canonical YTC 수정 금지.

---

## Section 1 — Per-Case Data

### 1-1. Full Matrix

| ID | Source | Direction | Odongdo Timing | Bus Repositioning |
|---|---|---|---|---|
| YTC-001 | 네스트투어/홍익여행사 | **DOLSAN → JASAN** | **AFTER_CABLE** | NOT EXPLICIT |
| YTC-002 | 테마캠프 | **MISSING_DATA** | **BEFORE_CABLE** | NOT EXPLICIT |
| YTC-006 | 스타투어 | **MISSING_DATA** | **AFTER_CABLE** | NOT EXPLICIT |
| YTC-007 | 모두투어 | **DOLSAN → JASAN** | **AFTER_CABLE** | EXPLICIT |
| YTC-008 | 롯데관광 | **DOLSAN → JASAN** | **AFTER_CABLE** | EXPLICIT |
| YTC-009 | 웹투어 | **JASAN → DOLSAN** | **BEFORE_CABLE** | EXPLICIT |
| YTC-013 | 지역 연계 패키지 | **JASAN → DOLSAN** | **BEFORE_CABLE** | EXPLICIT |

---

### 1-2. Per-Case Notes

#### YTC-001

| 항목 | 값 |
|---|---|
| Direction | DOLSAN → JASAN |
| Odongdo Timing | AFTER_CABLE |
| Bus Repositioning | NOT EXPLICIT (canonical raw에 버스 이동 명시 없음) |
| Lodging | 광양 |
| Previous Place (raw-supported) | 향일암, 교동시장/풍물시장, 진남관·이순신광장 (Day 2 sequence) |

**Field Discipline Note:**  
`Cable 직전 돌산권 일정` 표현 사용하지 않는다.  
Canonical raw sequence가 지원하는 수준으로만 기록.

---

#### YTC-002

| 항목 | 값 |
|---|---|
| Direction | MISSING_DATA |
| Odongdo Timing | BEFORE_CABLE |
| Bus Repositioning | NOT EXPLICIT |
| Lodging | 광양 |
| Previous Place | 오동도, 고소동 천사벽화마을, 향일암 → 케이블카 |

**Discipline Note:**  
Direction MISSING_DATA 유지. 추론으로 채우지 않는다.

---

#### YTC-006

| 항목 | 값 |
|---|---|
| Direction | MISSING_DATA |
| Odongdo Timing | AFTER_CABLE |
| Bus Repositioning | NOT EXPLICIT |
| Lodging | MISSING_DATA |
| Previous Place | Day 2 조식 직후 케이블카 |

**Discipline Note:**  
Direction MISSING_DATA 유지. Odongdo = AFTER_CABLE은 `케이블카 편도 → 오동도` Source raw 지원.

---

#### YTC-007

| 항목 | 값 |
|---|---|
| Direction | DOLSAN → JASAN |
| Odongdo Timing | AFTER_CABLE |
| Bus Repositioning | EXPLICIT (버스가 돌산탑승장에서 자산공원주차장으로 이동 후 재집결 — Source raw) |
| Lodging | 광양 |
| Previous Place | 돌산탑승장 |

---

#### YTC-008

| 항목 | 값 |
|---|---|
| Direction | DOLSAN → JASAN |
| Odongdo Timing | AFTER_CABLE |
| Bus Repositioning | EXPLICIT (버스가 반대편 탑승장으로 이동 — Source raw) |
| Lodging | 여수 |
| Previous Place | 돌산탑승장 |

---

#### YTC-009

| 항목 | 값 |
|---|---|
| Direction | JASAN → DOLSAN |
| Odongdo Timing | BEFORE_CABLE |
| Bus Repositioning | EXPLICIT (버스가 자산탑승장 → 돌산탑승장 이동 — Source raw) |
| Lodging | 돌산 |
| Previous Place | 자산탑승장 |

---

#### YTC-013

| 항목 | 값 |
|---|---|
| Direction | JASAN → DOLSAN |
| Odongdo Timing | BEFORE_CABLE |
| Bus Repositioning | EXPLICIT (오동도 → 자산탑승장 → 케이블카 → 돌산탑승장 → 광양 순서 — Source raw) |
| Lodging | 광양 |
| Previous Place | 오동도 |

---

## Section 2 — Integrity Counts

### Direction Integrity

| 방향 | IDs | 건수 |
|---|---|---|
| DOLSAN → JASAN | YTC-001, YTC-007, YTC-008 | 3 |
| JASAN → DOLSAN | YTC-009, YTC-013 | 2 |
| MISSING_DATA | YTC-002, YTC-006 | 2 |
| **Total** | | **7** |

**Direction Integrity: PASS**

---

### Odongdo Timing Integrity

| Timing | IDs | 건수 |
|---|---|---|
| AFTER_CABLE | YTC-001, YTC-006, YTC-007, YTC-008 | 4 |
| BEFORE_CABLE | YTC-002, YTC-009, YTC-013 | 3 |
| **Total** | | **7** |

**Odongdo Timing Integrity: PASS**

---

### Bus Repositioning Integrity

| 분류 | IDs | 건수 |
|---|---|---|
| EXPLICIT | YTC-007, YTC-008, YTC-009, YTC-013 | 4 |
| NOT EXPLICIT | YTC-001, YTC-002, YTC-006 | 3 |
| **Total** | | **7** |

Bus repositioning을 Cable Direction의 WHY로 해석하지 않는다.  
`EXPLICIT`은 canonical raw에 직접 명시된 경우에만 사용.

---

## Section 3 — Direction-Known Cross-Tabulation

MISSING_DATA 2건(YTC-002, YTC-006)을 제외한 direction-known 5건만 교차 분석한다.  
MISSING_DATA 케이스를 특정 방향 association에 포함하지 않는다.

| | AFTER_CABLE | BEFORE_CABLE |
|---|---|---|
| **DOLSAN → JASAN** | YTC-001, YTC-007, YTC-008 (3건) | 0건 |
| **JASAN → DOLSAN** | 0건 | YTC-009, YTC-013 (2건) |

**Contradictory Direction-Known Cases:** 0

---

## Section 4 — Core Association Finding

**Descriptive Finding:**

> Among the five package-product cases with canonically confirmed cable-car direction, all three DOLSAN → JASAN cases place Odongdo after the cable car, while both JASAN → DOLSAN cases place Odongdo before the cable car. No opposite combination is observed within these five direction-known cases.

**Assessment:** `EARLY ASSOCIATION SIGNAL`

**반드시 함께 기록:**

`SAMPLE-BOUNDED OBSERVATION ONLY`

이 Finding은:
- NOT causal evidence
- NOT optimization rule
- NOT package rule
- NOT Travel Grammar
- NOT Mental Map confirmation

---

## Section 5 — MISSING_DATA Cases

| ID | Direction | Odongdo Timing | Implication |
|---|---|---|---|
| YTC-002 | MISSING_DATA | BEFORE_CABLE | Direction 불명으로 association 판단 불가 |
| YTC-006 | MISSING_DATA | AFTER_CABLE | Direction 불명으로 association 판단 불가 |

이 2건은 association signal 판단에서 제외한다.  
추론으로 Direction을 채우지 않는다.  
향후 Direction이 확인될 경우 Matrix 재검토 가능.

---

## Section 6 — Governance Status

| 항목 | 상태 |
|---|---|
| WHY | NOT ASSESSED |
| Founder Rationale | NOT USED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

*YTC Package Direction Correlation Matrix V0.1 — 2026-09-25*
