# Yeosu Travel Schedule Corpus Pilot V0.1 — Second Sample Research Evidence Report
# YTC-007 ~ YTC-014

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Prior HEAD:** 626b467  
**Status:** RESEARCH EVIDENCE — PASS WITH CORRECTIONS  
**Review:** Lumi Independent Review Applied  

---

## Document Structure

1. Raw Corpus Evidence — YTC-007~014 (Source of Truth for this document)
2. Original Researcher Interpretation — marked as-is, with correction flags
3. Lumi Independent Review Corrections (Corrections 1–5)
4. Corrected Hypothesis Status
5. Open WHY Questions

**Important:** Raw Evidence는 Correction을 이유로 삭제하지 않는다.  
잘못된 Interpretation은 정본 결론처럼 남기지 않고 `Original Researcher Interpretation — Corrected` 임을 명시한다.

---

## Section 1 — Raw Corpus Evidence

### YTC-007 — Group Package (모두투어)

| 항목 | 값 |
|---|---|
| Source Type | 여행사 패키지 일정표 |
| Agency | 모두투어 |
| Group Type | GROUP / PACKAGE |
| Transport | 대형 관광버스 |

**Raw Schedule:**

```
돌산탑승장 (돌산공원) → 케이블카 편도 → 자산탑승장 → 버스 → 자산공원주차장 집결 → 오동도 → 광양 숙박
```

**Cable Car:**
- 방향: 돌산탑승장 → 자산탑승장
- 이용 형태: 편도
- 버스 이동: 버스가 돌산탑승장에서 자산공원주차장으로 이동 후 재집결

**Accommodation:** 광양 숙박

**Next after Cable Car:** 오동도

---

### YTC-008 — Group Package (롯데관광)

| 항목 | 값 |
|---|---|
| Source Type | 여행사 패키지 일정표 |
| Agency | 롯데관광 |
| Group Type | GROUP / PACKAGE |
| Transport | 대형 관광버스 |

**Raw Schedule:**

```
돌산 탑승장 → 케이블카 편도 → 자산 탑승장 → 오동도 → 여수 숙박
```

**Cable Car:**
- 방향: 돌산 → 자산
- 이용 형태: 편도

**Notable:** 대체조항 존재 — 케이블카 미운행(강풍 등) 시 유람선으로 대체

**Accommodation:** 여수 숙박

**Next after Cable Car:** 오동도

---

### YTC-009 — Group Package (웹투어)

| 항목 | 값 |
|---|---|
| Source Type | 여행사 패키지 일정표 |
| Agency | 웹투어 |
| Group Type | GROUP / PACKAGE |
| Transport | 대형 관광버스 |

**Raw Schedule:**

```
자산탑승장 → 케이블카 편도 → 돌산탑승장 → 돌산공원 → 돌산 숙박
```

**Cable Car:**
- 방향: **자산 → 돌산** (YTC-007, YTC-008과 반대 방향)
- 이용 형태: 편도

**Accommodation:** 돌산 숙박

**Next after Cable Car:** 돌산공원

**Note:** 이 사례는 "돌산→자산 단방향 가설"의 반례. 자산→돌산 방향 패키지 Evidence.

---

### YTC-010 — Individual / Solo

| 항목 | 값 |
|---|---|
| Source Type | 개인 여행 블로그 / 후기 |
| Traveler Type | INDIVIDUAL / SOLO |
| Transport | 대중교통 + 도보 |

**Planned → Trigger → Actual (명시적 보존):**

| 단계 | 내용 |
|---|---|
| Planned | 향일암 정상/사찰 관람 및 사진 촬영 |
| Trigger | 장시간 버스 이동에 따른 멀미 + 무릎 통증 |
| Actual | 향일암 계획 축소/포기 → 조기 이동 → 택시 → 봉산동 식사 → 오동도/휴식 |

**Signal:** `TRAVELER_CONDITION`

**Cable Car:** 이 일정에서 케이블카 없음

**Accommodation:** 미기재

---

### YTC-011 — Individual / Family / 자가용

| 항목 | 값 |
|---|---|
| Source Type | 개인 여행 블로그 / 후기 |
| Traveler Type | INDIVIDUAL / FAMILY |
| Transport | 자가용 |

**Raw Schedule:**

```
돌산탑승장 주차 → 케이블카 왕복 (돌산↔자산) → 돌산탑승장 귀환
```

**Cable Car:**
- 방향: 왕복 (돌산↔자산)
- 이용 형태: 왕복

**Vehicle Position:** 차량이 돌산탑승장 측에 주차됨 → 왕복 직접 원인

**Planned → Actual:**

| 단계 | 내용 |
|---|---|
| Planned | 오동도 방문 |
| Trigger | 주차장 만차 / 진입 정체 + child condition |
| Actual | 오동도 포기 → 다른 장소/카페 일정으로 변경 |

**Signal:** `PARKING_FRICTION + COMPANION_STATE`

---

### YTC-012 — Individual / Couple / KTX+렌터카

| 항목 | 값 |
|---|---|
| Source Type | 개인 여행 블로그 / 후기 |
| Traveler Type | INDIVIDUAL / COUPLE |
| Transport | KTX 도착 + 렌터카 |

**Raw Schedule:**

```
자산탑승장 → 케이블카 왕복 (자산→돌산→자산) → 자산탑승장 귀환
```

**Cable Car:**
- 방향: 왕복 (자산↔돌산)
- 이용 형태: 왕복

**Vehicle Position:** 렌터카가 탑승장에 묶여 있지 않음 (YTC-011과 다른 조건)

**Trigger:** 돌산 측 귀환 대기 약 50분 + 왕복권 환불 불가

**Actual:** 기존 왕복 유지, 이후 식사 계획 변경

**Signal:** `WAITING_FRICTION / SCHEDULE_DELAY`

---

### YTC-013 — Regional Package / 지역 연계

| 항목 | 값 |
|---|---|
| Source Type | 여행사 / 지역 연계 패키지 일정표 |
| Group Type | GROUP / REGIONAL_PACKAGE |
| Transport | 대형 관광버스 |

**Raw Schedule:**

```
오동도 → 자산탑승장 → 케이블카 편도 → 돌산탑승장 → 광양 (광양=이동거점)
```

**Cable Car:**
- 방향: 자산 → 돌산
- 이용 형태: 편도

**Source-stated Rationale:** 광양을 지역 이동 거점 및 상품가격/운영 측면에서 활용

**Accommodation:** 광양 숙박 (Source-stated: 이동거점 + 상품가격)

---

### YTC-014 — Individual / Couple / 자가용

| 항목 | 값 |
|---|---|
| Source Type | 개인 여행 블로그 / 후기 |
| Traveler Type | INDIVIDUAL / COUPLE |
| Transport | 자가용 |

**Raw Schedule:**

```
순천 → 여수 → 향일암 방문 (완료) → ... → 이동
```

**Cable Car:** 이 일정에서 케이블카 없음

**Toward Hyangiram:**

| 항목 | 내용 |
|---|---|
| 방문 완료 여부 | 완료 (YTC-010과 다름) |
| Observed Signal | 더위/습도 — physical burden 언급 |
| Outcome | 방문 포기 아님. 완료 후 다음 일정 이동. |

**Signal:** `HEAT / HUMIDITY_PHYSICAL_BURDEN` (방문 포기 아님)

**Regional:** 순천→여수 연결 일정 포함

---

## Section 2 — Original Researcher Interpretation

> **중요:** 이 섹션은 Second Sample 원본 보고서에 기록된 Researcher Interpretation이다.  
> Raw Evidence와 동일한 Truth로 취급하지 않는다.  
> 이후 Lumi Independent Review Correction 대상이 포함되어 있다.  
> 원본의 판단 위치를 보존하기 위해 기록한다.

### A. Founder Hypothesis Check (Original)

#### FH-01 — 여수 관광 후 광양 숙박 (Original Classification)

| 분류 | IDs |
|---|---|
| Supporting | YTC-007, YTC-013 |
| Counterexamples | YTC-001, YTC-002, YTC-008, YTC-009 |
| Ambiguous | YTC-003~006, YTC-010~012, YTC-014 |

Original Assessment: `MIXED`

Original Interpretation: 패키지 상품의 가격 등급 등에 따라 분기되는 현상일 수 있다고 기록.

⚠️ **Correction 4 Flag:** YTC-001/002의 Counterexample 분류는 First Sample Evidence 교차 검증 필요. — See Section 3, Correction 4.

---

#### FH-02 — 케이블카 → 오동도 연계 (Original Classification)

| 분류 | IDs |
|---|---|
| Supporting | YTC-002, YTC-007, YTC-008 |
| Counterexamples | YTC-009, YTC-013 |
| Ambiguous | YTC-011, YTC-012 |

Original Assessment: `MIXED`

Original Interpretation: `돌산→자산`과 `자산→돌산` 방향이 모두 존재한다.

Original Note: 방향 자체의 존재와 방향을 선택하게 만드는 WHY는 분리한다.

---

#### FH-03 — 패키지 케이블카 편도 운용 (Original Classification) — CORRECTED

| 분류 | IDs |
|---|---|
| Supporting | YTC-001, YTC-002, YTC-007, YTC-008, YTC-009, YTC-013 |
| Counterexamples | 없음 |

Original Assessment: `EARLY_SUPPORT`

**Original Report Language (Preserved, Not Adopted as Fact):**  
`조사된 모든 패키지에서 케이블카는 100% 편도로만 운영됨`

⚠️ **Correction 1 Flag:** `100%` 표현은 Observed Sample 경계를 모집단으로 일반화한 것. — See Section 3, Correction 1.

---

#### FH-04 — 개인 여행자 상태 트리거 (Original Classification)

| 분류 | IDs |
|---|---|
| Supporting | YTC-010, YTC-011, YTC-012 |

Original Assessment: `EARLY_SUPPORT`

Observed triggers:
- fatigue
- physical pain
- parking congestion
- child condition
- waiting delay
- schedule disruption

---

### B. Directional Edge Comparison (Original Report)

| 패턴 | 방향 | 이용 형태 | IDs |
|---|---|---|---|
| 돌산공원/향일암 → 케이블카 → 오동도 | 돌산→자산 | One-way | YTC-002, YTC-007, YTC-008 |
| 오동도 → 케이블카 → 돌산공원/호텔 | 자산→돌산 | One-way | YTC-001, YTC-009, YTC-013 |
| 돌산공원 ↔ 케이블카 왕복 | 왕복 | Round-trip | YTC-011 |
| 종포/자산 ↔ 케이블카 왕복 | 왕복 | Round-trip | YTC-012 |

**Walking Edge IDs (Original Report Mapping — First Sample 교차 검증 필요):**

| Edge | Original IDs |
|---|---|
| 이순신광장 → 종포해양공원 | YTC-004, YTC-005, YTC-010, YTC-012 |
| 종포해양공원 → 하멜등대 | YTC-004, YTC-005, YTC-010, YTC-012 |
| 하멜등대 → 낭만포차 | YTC-004, YTC-010, YTC-012 |

⚠️ **Cross-Check Flag:** 이 ID mapping은 기존 First Sample Raw Evidence로 검증된 ID만 최종 채택. First Sample Repository Persistence Pending이므로 현재 UNVERIFIED.

Original Report Conclusion: `Direction Reversal 발견` (돌산→자산 외 자산→돌산도 관찰됨)

---

### C. Planned Route → Trigger → Actual (Original — Preserved)

| Case | Trigger | Signal |
|---|---|---|
| YTC-010 | 멀미 + 무릎 통증 | TRAVELER_CONDITION |
| YTC-011 | 주차 만차 + child condition | PARKING_FRICTION + COMPANION_STATE |
| YTC-012 | 대기 50분 + 왕복권 환불불가 | WAITING_FRICTION / SCHEDULE_DELAY |

---

### D. New Observation Signals (Original — Pending Lumi Correction)

Original Report에서 제안된 신호:

| 신호 | Original Status | Lumi Decision |
|---|---|---|
| `Vehicle Tethering Trap` | 제안됨 | → Correction 2 적용 — NEW_OBSERVATION_SIGNAL로 downgrade |
| `Hyangiram Physical Threshold` | 제안됨 | → Correction 3 적용 — NEW_OBSERVATION_SIGNAL로 downgrade |
| Cable Car directional reversal | 관찰됨 | 보존 — EARLY SUPPORT FOR BIDIRECTIONAL OPERATION |
| Individual Traveler State influence | 관찰됨 | 보존 — EARLY SUPPORT |
| Regional lodging/hub behavior | 관찰됨 | 보존 — OBSERVATION |

---

## Section 3 — Lumi Independent Review Corrections

**Review Decision:** `PASS WITH CORRECTIONS`

---

### Correction 1 — FH-03 Sample Boundary / `100%` Generalization

**Original Report Language (Not Adopted):**  
`패키지 케이블카 편도 100%` / `대형버스를 이용하는 단체는 100% 편도만 발권`

**Corrected Interpretation:**

Corpus ID 및 First Sample Evidence가 검증 가능한 경우:  
`Observed Sample: observed package samples with explicit cable-car usage/type showed repeated one-way operation.`

주의: YTC-006 포함 여부 및 denominator 정확도가 First Sample Repository Persistence Pending으로 현재 미검증. `6/6` 숫자를 확정 사용하지 않는다.

**금지:**
- 모든 여수 패키지는 편도다
- 대형버스는 반드시 편도다
- 편도가 패키지의 고정 Rule이다

**Corrected Status:** `OBSERVATION / EARLY SUPPORT / NOT RULE`

---

### Correction 2 — Vehicle Tethering

**Original Signal (Not Adopted as Architecture Term):** `Vehicle Tethering Trap`

**Corrected Signal:** `NEW_OBSERVATION_SIGNAL — Return / Round-trip Friction`

**YTC-011 — Vehicle Position Evidence (Preserved):**  
차량이 돌산탑승장 측에 주차됨 → traveler must return to Dolsan to recover vehicle  
→ Vehicle position과 round-trip choice의 직접 연결 Evidence로 보존.

**YTC-012 — 별도 조건 (YTC-011과 분리):**  
차량은 케이블카 승강장에 묶여 있지 않음.  
Vehicle Tethering Evidence로 사용하지 않는다.  
별도 조건으로 보존: planned round-trip / ticket type / refund constraint / waiting delay / next destination / lodging position / schedule impact

**이번 단계에서 생성하지 않는다:**
- `Vehicle Tethering Trap` Architecture term
- Travel Grammar Rule
- Recommendation Rule

---

### Correction 3 — Hyangiram Physical Friction

**Original Signal (Not Adopted as General Rule):** `Hyangiram Physical Threshold`

**Corrected Signal:** `NEW_OBSERVATION_SIGNAL — Hyangiram Physical-Friction`

**Evidence 분리:**

| Case | Observed Signal | Outcome |
|---|---|---|
| YTC-010 | 멀미 + 무릎 통증 | 향일암 계획 축소/포기 (방문 포기 사례) |
| YTC-014 | 더위/습도, physical burden 언급 | 방문 완료 후 이동 (포기 아님) |

**YTC-014를 방문 포기 사례로 분류하지 않는다.**

**금지:**
- 향일암은 노약자에게 접근 불가능하다
- 모든 여행자에게 Physical Threshold가 존재한다
- 우회 동선이 필수다
- YTC-010과 YTC-014가 동일한 실패 사례다

**Corrected Status:** `OBSERVATION SIGNAL / NOT RULE`

---

### Correction 4 — FH-01 Provenance Separation

다음을 하나의 원인으로 합치지 않는다.

**A. Corpus Observation (Provenance: WORLD_EXPERIENCE / CORPUS)**  
일부 일정에서 `Yeosu tourism → Gwangyang lodging` 패턴이 관찰된다.  
Supporting IDs: YTC-007, YTC-013

**B. Founder Expert Rationale (Provenance: FOUNDER_LOCAL / EXPERT_RATIONALE)**  
과거 여수의 객실 부족 및 상대적으로 높은 숙박비 때문에 여행사가 광양 숙박을 대안으로 활용했던 운영 맥락이 있었다.  
이 설명은 Official Fact 또는 현재 모든 상품의 보편적 원인으로 승격하지 않는다.

**C. YTC-013 Source-stated Rationale (Provenance: CORPUS / SOURCE_STATED)**  
광양을 지역 이동 거점 및 상품가격/운영 측면에서 활용한다는 Source 설명.

**First Sample Cross-Check:**

| Case | First Sample Status | Action |
|---|---|---|
| YTC-001 | First Sample Repository Pending — 광양 숙박 여부 미검증 | `FIRST_SAMPLE_EVIDENCE_CHECK_REQUIRED` |
| YTC-002 | First Sample Repository Pending — 광양 숙박 여부 미검증 | `FIRST_SAMPLE_EVIDENCE_CHECK_REQUIRED` |
| YTC-005 | First Sample Repository Pending | 단순 AMBIGUOUS 강제 낮춤 금지 — Counterfactual signal 존재 가능 |
| YTC-006 | First Sample Repository Pending | denominator 포함 여부 미검증 |

---

### Correction 5 — Conditional Directionality

**기존 FH-02 Result:** `MIXED` — 유지, 소급 수정하지 않는다.

**이번 Evidence에서 확인되는 사실:**

| 관찰 사실 | Status |
|---|---|
| `Dolsan → Jasan` operation exists | EARLY SUPPORT — BIDIRECTIONAL OPERATION EXISTS |
| `Jasan → Dolsan` operation exists | EARLY SUPPORT — BIDIRECTIONAL OPERATION EXISTS |
| Individual round-trip cases exist | OBSERVED |

**Causal Question (별도):**  
`왜 그 방향을 선택했는가` — 별도 WHY 연구 필요. 현재 Corpus로 Rule 확정 불가.

**New Refined Research Hypothesis:**

### HYPOTHESIS — Conditional Directionality V0.1

**Definition:**  
"여수해상케이블카의 이용 방향과 편도/왕복 선택은 고정된 관광 순서가 아니라 전후 목적지, 차량 위치, 숙박 위치, 이동수단 및 이후 일정 같은 조건과 관계가 있을 수 있다."

**Status:** `HYPOTHESIS / NOT RULE / NOT CANDIDATE`

**Evidence State:** `EARLY SUPPORT FOR CONDITIONAL STRUCTURE`

**Causal weight:** `INSUFFICIENT EVIDENCE`

**Founder Working Explanation (Provenance: FOUNDER_LOCAL / EXPERT_RATIONALE):**
- 다음 목적지가 오동도이면 돌산 → 자산이 자연스러울 수 있다.
- 다음 목적지가 향일암/돌산권이면 자산 → 돌산이 자연스러울 수 있다.

이 설명은 Corpus가 완전히 검증했다고 표현하지 않는다.

---

## Section 4 — Corrected Hypothesis Status

| Hypothesis | Corrected Status |
|---|---|
| FH-01 — Yeosu → Gwangyang lodging | MIXED / OBSERVATION EXISTS / WHY NOT CONFIRMED |
| FH-02 — fixed Dolsan → Jasan → Odongdo direction | MIXED (historical result preserved) |
| FH-02 Refined — Conditional Directionality V0.1 | HYPOTHESIS / EARLY SUPPORT FOR CONDITIONAL STRUCTURE / CAUSAL CONDITIONS NOT CONFIRMED |
| FH-03 — package one-way operation | EARLY SUPPORT / SAMPLE-BOUNDED / NOT RULE |
| FH-04 — individual Traveler State influence | EARLY SUPPORT |

| 항목 | 상태 |
|---|---|
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |

---

## Section 5 — Open WHY Questions

### WHY-01 — 패키지 케이블카 편도 운영

**Observed:** 여러 패키지 사례에서 케이블카 편도 이용이 나타나며 버스가 반대편 승강장으로 이동하는 구조가 관찰됨.

**Unknown:**
- 단체 발권 비용 구조 때문인가?
- 왕복 대기시간 통제 문제 때문인가?
- 버스 이동 동선 때문인가?
- 다음 관광지와 숙소 방향 때문인가?

**Status:** `WHY_RESEARCH_REQUIRED`

원본 보고서의 `패키지는 100% 편도` 표현을 WHY의 전제로 확정하지 않는다.

---

### WHY-02 — Cable Car Direction Choice

**Observed:** `돌산→자산`과 `자산→돌산` 양방향 모두 존재.

**Founder Expert Rationale (Working Explanation only, FOUNDER_LOCAL / EXPERT_RATIONALE):**
- 다음 목적지가 오동도이면 돌산→자산이 자연스러울 수 있음.
- 다음 목적지가 향일암/돌산권이면 자산→돌산이 자연스러울 수 있음.

**Research Question:** `케이블카 방향 선택은 next destination, lodging, bus operation, vehicle position, current location과 어떤 관계가 있는가?`

**Status:** `HYPOTHESIS / WHY_RESEARCH_REQUIRED`

---

### WHY-03 — Individual Round-trip Choice

**YTC-011과 YTC-012의 causal mechanism은 분리한다.**

- YTC-011: 차량이 돌산탑승장에 있음 → 직접 귀환 필요 → 왕복 선택
- YTC-012: 차량 없음(렌터카 비묶임) → 별도 조건(대기시간+왕복권환불불가)

**Research Question:** `왕복 선택에 차량 위치, 티켓 구조, 대기시간, 다음 일정 중 어떤 요인이 얼마나 작용하는가?`

**Status:** `WHY_RESEARCH_REQUIRED`

---

## Section 6 — Corpus Summary

| 항목 | 값 |
|---|---|
| Second Sample Corpus IDs | YTC-007~014 (8개) |
| First Sample Corpus | YTC-001~006 (6개) — completed in research context / repository persistence pending |
| Total Corpus Claimed | 14 |
| Corpus Repository Confirmed | YTC-007~014 (Second Sample only) |

---

## Section 7 — Governance Guardrails

이번 작업에서 하지 않는다:

| 항목 | 상태 |
|---|---|
| Candidate 생성 | NOT DONE |
| Architecture 변경 | NOT DONE |
| Travel Grammar 확정 | NOT DONE |
| Mental Map 확정 | NOT DONE |
| Recommendation Rule 생성 | NOT DONE |
| SSOT 승격 | NOT DONE |
| Production / Runtime 반영 | PROHIBITED |
| DB / Schema 변경 | PROHIBITED |
| place_knowledge migration | NOT APPROVED / HOLD |
| Founder Expert Rationale → Official Fact 승격 | NOT DONE |
| DreamTown Founder Philosophy Candidate | HOLD |

---

*Yeosu Travel Schedule Corpus Pilot V0.1 — Second Sample Research Evidence V0.1 — 2026-09-25*
