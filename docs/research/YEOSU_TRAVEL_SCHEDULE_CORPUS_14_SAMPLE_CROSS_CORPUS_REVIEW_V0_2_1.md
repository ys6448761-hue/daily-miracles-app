# Yeosu Travel Schedule Corpus Pilot — 14-Sample Cross-Corpus Evidence Review
# V0.2.1

**Review Version:** V0.2.1  
**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** e6b14ba  
**Status:** PERSISTENCE ONLY — Founder + Lumi Review Passed

---

## Review Integrity Summary

| 항목 | 결과 |
|---|---|
| Canonical Corpus | YTC-001 ~ YTC-014 |
| Corpus Reviewed | 14 / 14 |
| Count Integrity | **PASS** |
| Denominator Integrity | **PASS** |
| Cable Car Arithmetic | **PASS** |
| Lodging Arithmetic | **PASS** |
| Canonical ID Integrity | **PASS** |
| WHY / Observation Separation | **PASS** |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |

---

## Section 1 — Canonical Corpus Registry

| ID | Source / Identity | Type | Trip | Status |
|---|---|---|---|---|
| YTC-001 | 네스트투어 / 홍익여행사 | Group / Package | 2박3일 | PERSISTED |
| YTC-002 | 테마캠프 | Group / Package | 1박2일 | PERSISTED |
| YTC-003 | coffelog | Individual / Family | 2박3일 | PERSISTED |
| YTC-004 | 범스 라이프 | Individual / Historical | 2박3일 | PERSISTED / Sequence MISSING_DATA |
| YTC-005 | 안나의 파란차 | Regional / Individual | 2박3일 | PERSISTED |
| YTC-006 | 스타투어 | Regional / Package | 1박2일 | PERSISTED / POSSIBLY_STALE |
| YTC-007 | 모두투어 | Group / Package | MISSING_DATA | PERSISTED |
| YTC-008 | 롯데관광 | Group / Package | MISSING_DATA | PERSISTED |
| YTC-009 | 웹투어 | Group / Package | MISSING_DATA | PERSISTED |
| YTC-010 | 개인 솔로 | Individual / Solo | MISSING_DATA | PERSISTED |
| YTC-011 | 가족 / 자가용 | Individual / Family | MISSING_DATA | PERSISTED |
| YTC-012 | 커플 / KTX+렌터카 | Individual / Couple | MISSING_DATA | PERSISTED |
| YTC-013 | 지역 연계 패키지 | Regional / Package | MISSING_DATA | PERSISTED |
| YTC-014 | 커플 / 자가용 | Individual / Couple | MISSING_DATA | PERSISTED |

---

## Section 2 — Cable Car Evidence Summary

### 2-1. One-way / Round-trip

| ID | Cable Car Usage | Type | Direction |
|---|---|---|---|
| YTC-001 | YES | One-way | 돌산→자산 (Source-confirmed) |
| YTC-002 | YES | One-way | MISSING_DATA |
| YTC-003 | NO | — | — |
| YTC-004 | MISSING_DATA | MISSING_DATA | MISSING_DATA |
| YTC-005 | YES | MISSING_DATA | MISSING_DATA |
| YTC-006 | YES | One-way | MISSING_DATA |
| YTC-007 | YES | One-way | 돌산→자산 (Source-confirmed) |
| YTC-008 | YES | One-way | 돌산→자산 (Source-confirmed) |
| YTC-009 | YES | One-way | 자산→돌산 (Source-confirmed) |
| YTC-010 | NO | — | — |
| YTC-011 | YES | Round-trip | 돌산↔자산 |
| YTC-012 | YES | Round-trip | 자산↔돌산 |
| YTC-013 | YES | One-way | 자산→돌산 (Source-confirmed) |
| YTC-014 | NO | — | — |

### 2-2. Cable Car Direction Summary

**방향 Source-confirmed 건:**

| 방향 | IDs |
|---|---|
| 돌산→자산 | YTC-001, YTC-007, YTC-008 |
| 자산→돌산 | YTC-009, YTC-013 |
| 왕복 (돌산↔자산) | YTC-011 |
| 왕복 (자산↔돌산) | YTC-012 |
| MISSING_DATA | YTC-002, YTC-005, YTC-006 |

**Cable Car 양방향 운영:** EARLY SUPPORT FOR BIDIRECTIONAL OPERATION — 고정 단방향 아님

### 2-3. Package One-way Observation

Package / Group 일정 중 Cable Car를 사용한 사례:  
YTC-001, YTC-002, YTC-006, YTC-007, YTC-008, YTC-009, YTC-013

- 편도: YTC-001, YTC-002, YTC-006, YTC-007, YTC-008, YTC-009, YTC-013 (7건)
- 왕복: 없음 (패키지 기준)

**Corrected Observation:** Observed package samples with explicit cable-car usage showed repeated one-way operation.  
**Status:** `EARLY SUPPORT / SAMPLE-BOUNDED / NOT GENERALIZED`  
**금지:** `모든 패키지 = 편도 Rule` 생성 금지

---

## Section 3 — Lodging Evidence Summary (Final, V0.2.1)

### 3-1. YTC-014 Lodging Final Correction

**Canonical Evidence (V0.2.1 확정):**

| 일차 | 내용 |
|---|---|
| Day 1 | 순천 관광 후 여수 이동 → 여수 돌산 펜션 숙박 |
| Day 2 | 돌산 펜션 체크아웃 → 여수 관광 → 여수 신월동 호텔 숙박 |
| Day 3 | 여수 관광 후 귀경 |

**YTC-014 Lodging = Yeosu Lodging**  
Multi-Region Lodging으로 분류하지 않는다.  
지역 간 Journey(순천→여수)와 숙박 지역을 혼동하지 않는다.

### 3-2. Final Lodging Arithmetic

| 분류 | IDs | 건수 |
|---|---|---|
| Gwangyang Lodging | YTC-001, YTC-002, YTC-007, YTC-013 | **4** |
| Yeosu Lodging | YTC-003, YTC-005, YTC-006(?), YTC-008, YTC-009, YTC-010, YTC-011, YTC-014 | **8** |
| Multi-Region Lodging | YTC-012 | **1** |
| Other / Ambiguous | YTC-004 | **1** |
| **Total** | | **4 + 8 + 1 + 1 = 14** |

**Lodging Arithmetic: PASS**

---

## Section 4 — Founder Hypothesis Status (Cross-Corpus Final)

### FH-01 — 여수 관광 후 광양 숙박

| 분류 | IDs |
|---|---|
| Supporting | YTC-001, YTC-002, YTC-007, YTC-013 |
| Yeosu Lodging (Non-supporting) | YTC-003, YTC-005, YTC-008, YTC-009, YTC-010, YTC-011, YTC-014 |
| Ambiguous / Other | YTC-004, YTC-006, YTC-012 |

**Status:** `MIXED / OBSERVATION EXISTS / WHY NOT CONFIRMED`

Provenance Note: Gwangyang lodging 사례 4건의 WHY는 다음을 포함할 수 있으나 현재 Corpus로 확정되지 않음:
- A. Corpus Observation (Source-stated)
- B. Founder Expert Rationale (FOUNDER_LOCAL / EXPERT_RATIONALE — 별도)
- C. YTC-013 Source-stated: 지역 이동거점 + 상품가격

세 Provenance를 혼합하지 않는다.

---

### FH-02 — 케이블카 → 오동도 연계 방향 고정

**Historical Result:** `MIXED` (유지)

**Observed:**
- 돌산→자산 후 오동도: YTC-001, YTC-007, YTC-008
- 자산→돌산 후 오동도 아님: YTC-009, YTC-013
- 자산→돌산 후 돌산권: YTC-009, YTC-013
- 왕복: YTC-011, YTC-012

**Cross-Corpus Refined:**  
`Conditional Directionality V0.1 — EARLY SUPPORT / CAUSAL CONDITIONS NOT CONFIRMED`

---

### FH-03 — 패키지 케이블카 편도 운용

**Status:** `EARLY SUPPORT / SAMPLE-BOUNDED / NOT RULE`

Observed package one-way cases: 7/7 (Cable Car 사용 패키지 기준)  
단, denominator와 정확한 ID 경계에 주의. `모든 패키지 편도` Rule로 승격하지 않는다.

---

### FH-04 — 개인 여행자 상태 트리거

**Status:** `EARLY SUPPORT`

| ID | Trigger | Signal |
|---|---|---|
| YTC-003 | Opening time | OPENING_TIME_FRICTION |
| YTC-005 | Heat, fatigue, unexpected stay | TRAVELER_CONDITION |
| YTC-010 | Motion sickness, knee pain | TRAVELER_CONDITION |
| YTC-011 | Parking congestion, child condition | PARKING_FRICTION + COMPANION_STATE |
| YTC-012 | Waiting delay, refund constraint | WAITING_FRICTION / SCHEDULE_DELAY |

---

## Section 5 — New Observation Signals (Corrected Status)

| Signal | Corrected Status |
|---|---|
| Return / Round-trip Friction (YTC-011) | NEW_OBSERVATION_SIGNAL — vehicle position → round-trip |
| Return / Round-trip Friction (YTC-012) | NEW_OBSERVATION_SIGNAL — ticket/wait/schedule constraint |
| Hyangiram Physical-Friction (YTC-010) | NEW_OBSERVATION_SIGNAL — visit abandoned |
| Hyangiram Physical-Friction (YTC-014) | NEW_OBSERVATION_SIGNAL — visit completed despite burden |

YTC-011과 YTC-012의 causal mechanism은 분리한다.  
YTC-010과 YTC-014는 동일한 실패 사례가 아니다.

---

## Section 6 — WHY_RESEARCH_REQUIRED Queue (Cross-Corpus)

| ID | 질문 | 관련 IDs |
|---|---|---|
| WHY-Q1 | 왜 일부 단체 일정은 여수 관광 후 광양에서 숙박하는가? | YTC-001, YTC-002, YTC-007, YTC-013 |
| WHY-Q2 | 왜 케이블카와 오동도가 반복해서 연속 배치되는가? | YTC-001, YTC-006, YTC-007, YTC-008 |
| WHY-Q3 | 왜 패키지에서 케이블카 편도가 나타나는가? 탑승 방향 선택은 무엇에 종속적인가? | YTC-001~009, YTC-013 |
| WHY-Q4 | 왜 개인 여행에서는 Traveler State가 실제 다음 장소를 변경하는가? | YTC-003, YTC-005, YTC-010~012 |

**Status:** 모두 `WHY_RESEARCH_REQUIRED`. 답을 새로 만들지 않는다.

---

## Section 7 — Cross-Corpus Observations

모두 `OBSERVATION / EARLY SIGNAL / SAMPLE-BOUNDED`. Rule 또는 확정 Pattern으로 승격하지 않는다.

| # | Observation | Supporting IDs |
|---|---|---|
| O-01 | 오동도 반복 등장 | YTC-001, YTC-002, YTC-003, YTC-006, YTC-007, YTC-008, YTC-012, YTC-013 |
| O-02 | 여수해상케이블카 반복 등장 | YTC-001, YTC-002, YTC-005, YTC-006, YTC-007, YTC-008, YTC-009, YTC-011, YTC-012, YTC-013 |
| O-03 | 향일암 반복 등장 | YTC-001, YTC-002, YTC-005, YTC-010, YTC-014 |
| O-04 | 케이블카 ↔ 오동도 연속 Edge 반복 | YTC-001, YTC-006, YTC-007, YTC-008 |
| O-05 | 광양 숙박 패턴 | YTC-001, YTC-002, YTC-007, YTC-013 |
| O-06 | 순천역 Entry/Exit Hub 패턴 | YTC-001, YTC-006 |
| O-07 | 케이블카 양방향 운영 | YTC-001, YTC-007, YTC-008 (돌산→자산) / YTC-009, YTC-013 (자산→돌산) |
| O-08 | 개인 여행자 Counterfactual Trigger | YTC-003, YTC-005, YTC-010, YTC-011, YTC-012 |

---

## Section 8 — Governance Boundaries

이번 Review에서 확인된 것은 `Corpus-level Observation / Early Support / Mixed Evidence` 수준이다.

다음으로 승격하지 않는다:

| 항목 | 상태 |
|---|---|
| RULE | NOT CREATED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| SSOT Promotion | NOT DONE |
| Candidate Generated | NO |
| Architecture Changed | NO |
| Recommendation Rule | NOT CREATED |
| Production / Runtime / DB / Schema 변경 | PROHIBITED |
| place_knowledge migration | NOT APPROVED / HOLD |

특히:  
`Package One-way Cable Car` → `EARLY SUPPORT / SAMPLE-BOUNDED / NOT GENERALIZED`  
`Conditional Cable Car Directionality` → `EARLY SUPPORT / SAMPLE-BOUNDED / NOT GENERALIZED`

---

## Section 9 — Cross-Corpus Review Version History

| Version | Date | Key Change |
|---|---|---|
| V0.1 | 2026-09-25 | First Sample + Second Sample initial review |
| V0.2 | 2026-09-25 | Lumi Corrections 1-5 applied (Second Sample) |
| V0.2.1 | 2026-09-25 | YTC-014 Lodging Final Correction (Yeosu, not Multi-Region). Lodging Arithmetic 4+8+1+1=14 PASS. |

---

*Yeosu Travel Schedule Corpus Pilot — 14-Sample Cross-Corpus Evidence Review V0.2.1 — 2026-09-25*
