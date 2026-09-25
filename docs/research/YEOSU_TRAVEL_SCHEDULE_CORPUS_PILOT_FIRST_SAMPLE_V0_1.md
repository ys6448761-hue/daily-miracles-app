# Yeosu Travel Schedule Corpus Pilot V0.1 — First Sample Repository Persistence
# YTC-001 ~ YTC-006

**Date:** 2026-09-25  
**Branch:** staging/storybook-c7a  
**Prior HEAD:** f83dab2  
**Status:** RESEARCH EVIDENCE — REPOSITORY PERSISTENCE  
**Source:** Original First Sample Research Evidence recovered and persisted; no reconstruction from memory was used.

---

## Document Structure

1. Raw Corpus Evidence — YTC-001~006
2. First Sample Observations (OBSERVATION / EARLY SIGNAL / SAMPLE-BOUNDED only)
3. WHY_RESEARCH_REQUIRED Queue
4. Governance Guardrails

**Evidence Preservation Principle:**  
Source가 지원하지 않는 필드는 `MISSING_DATA` 또는 기존 Research Report의 missing 표현을 유지한다.  
새로운 Research, Source 재해석, 누락 필드 추정 금지.  
Founder Local/Expert Rationale를 Source Evidence로 혼합하지 않는다.

---

## Section 1 — Raw Corpus Evidence

---

### YTC-001

| 항목 | 값 |
|---|---|
| Corpus ID | YTC-001 |
| Source / Identity | 네스트투어 / 홍익여행사 |
| Source Type | Group / 실제 판매 일정표 |
| Trip Length | 2박3일 |
| Transport | KTX + 연계차량 |
| Group / Individual | GROUP |

**Raw Schedule:**

**Day 1:**
```
용산역 → 순천역 → 선암사 → 중식 → 순천만 → 여수 미평동 숙소 → 자유석식
```

**Day 2:**
```
조식 → 향일암 → 교동시장/여수 풍물시장 → 진남관·이순신광장 → 케이블카 탑승장 → 여수해상케이블카 → 오동도 → 장도 → 광양 숙소
```

**Day 3:**
```
광양 → 남해 보리암 → 중식 → 독일마을 → 이락사 → 충렬사 → 순천역 → 용산역
```

**Key Evidence:**

| 항목 | 값 |
|---|---|
| Accommodation | 광양 숙박 (Day 2 → Day 3) |
| Cable Car Direction | 돌산 놀아정류장 → 자산 해야정류장 |
| Cable Car Type | One-way (편도) |
| Next after Cable Car | 오동도 |
| Explicit Schedule Times | 존재 (Source-stated) |

**Important Note:**  
Explicit schedule timestamps는 해당 일정표의 schedule timestamp다.  
일반 이동시간으로 일반화 금지. `DERIVED_SCHEDULE_INTERVAL` 이상으로 승격 금지.

**Counterfactual Signal:** MISSING_DATA  
**WHY_RESEARCH_REQUIRED:** 여수 관광 후 광양 숙박 → WHY-Q1

---

### YTC-002

| 항목 | 값 |
|---|---|
| Corpus ID | YTC-002 |
| Source / Identity | 테마캠프 |
| Source Type | Group / 실제 판매 일정표 |
| Trip Length | 1박2일 |
| Transport | 관광버스 |
| Group / Individual | GROUP |

**Raw Schedule:**

**Day 1:**
```
광화문 → 양재 → 죽전 → 여수 중식 → 오동도 → 고소동 천사벽화마을 → 향일암 → 개별석식 → 여수해상케이블카/돌산공원 → 광양 숙소
```

**Day 2:**
```
광양 조식 → 노량대교 → 남해 보리암 → 독일마을/원예예술촌 → 남해전통시장/중식 → 관음포 이락사 → 서울
```

**Key Evidence:**

| 항목 | 값 |
|---|---|
| Accommodation | 광양 숙박 (Day 1 → Day 2) |
| Cable Car Type | One-way (편도) |
| Cable Car Direction | **MISSING_DATA — Source Evidence만으로 확정하지 않음** |
| Next sequence context | 여수해상케이블카/돌산공원이 Day 1 마지막 관광지 |

**Important Note:**  
Cable Car direction은 이 Research Evidence만으로 확정하지 않는다.  
schedule timestamps 간 차이 계산 시 `DERIVED_SCHEDULE_INTERVAL` 이상으로 승격 금지.

**Counterfactual Signal:** MISSING_DATA  
**WHY_RESEARCH_REQUIRED:** 여수 관광 후 광양 숙박 → WHY-Q1

---

### YTC-003

| 항목 | 값 |
|---|---|
| Corpus ID | YTC-003 |
| Source / Identity | coffelog |
| Source Type | Individual / 실제 가족여행 후기 |
| Trip Length | 2박3일 |
| Transport | MISSING_DATA |
| Group / Individual | INDIVIDUAL |
| Traveler Profile | 초등학생 자녀 동반 가족 |

**Raw Schedule:**

**Day 1:**
```
15:00 여수 도착 → 소노캄 체크인/휴식 → 저녁 배달 → 자산공원 일몰/호텔 주변 산책
```

**Day 2:**
```
간단한 아침 → 11:50 오동도 동백열차 → 오동도 → 아쿠아플라넷 → 여수수산시장 → 저녁식사 → 이순신광장 → 간식/휴식
```

**Day 3:**
```
체크아웃 → 낭만24포차 시도 → 오픈시간 때문에 변경 → 꽃돌게장1번가 → 귀가
```

**Counterfactual:**

| 단계 | 내용 |
|---|---|
| Planned | 낭만24포차 방문 |
| Trigger | 11:30 도착 / 12시 오픈 / 기다리기 어려움 |
| Actual | 꽃돌게장1번가로 변경 |

Signal: `OPENING_TIME_FRICTION`

**Source-stated Rationale:**  
관광지를 많이 넣기보다 아이들이 힘들지 않도록 이동시간을 줄이는 데 중점.  
(Provenance: SOURCE_STATED — 일반 Rule로 승격 금지)

**Cable Car:** MISSING_DATA (이 일정에서 케이블카 없음)  
**Accommodation:** 소노캄 (여수 내 — Day 1~2)  
**WHY_RESEARCH_REQUIRED:** MISSING_DATA

---

### YTC-004

| 항목 | 값 |
|---|---|
| Corpus ID | YTC-004 |
| Source / Identity | 범스 라이프 |
| Source Type | Individual / Historical Sample |
| Trip Length | 2박3일 |
| Transport | 항공 + 렌터카 |
| Group / Individual | INDIVIDUAL |
| Status | HISTORICAL / POSSIBLY_STALE |

**Raw Schedule:**

```
Sequence = MISSING_DATA
```

**Important:**  
Source에서 Day별 Raw Sequence가 충분히 확인되지 않았음.  
임의 재구성 금지. `MISSING_DATA` 유지.

**Accommodation:** MISSING_DATA  
**Cable Car:** MISSING_DATA  
**Counterfactual Signal:** MISSING_DATA  
**WHY_RESEARCH_REQUIRED:** MISSING_DATA

---

### YTC-005

| 항목 | 값 |
|---|---|
| Corpus ID | YTC-005 |
| Source / Identity | 안나의 파란차 |
| Source Type | Regional / 실제 부부여행 후기 |
| Trip Length | 2박3일 |
| Transport | 자차 |
| Group / Individual | INDIVIDUAL (부부) |
| Region | 여수 + 순천 |

**Note:** Part 1 + Part 2는 동일 여행 — Corpus 하나로 유지.

**Raw Schedule:**

**Day 1:**
```
여수 → 두꺼비게장 → 아쿠아플라넷 → (계획보다 일찍 종료) → 아르떼뮤지엄 추가 → 라마다 프라자 호텔 → 당머리첫집 → 여수해상케이블카 → 숙소
```

**Day 2:**
```
바다김밥 → 향일암 → 카페 퍼즈 → 오동도 → 순천 스테이두루 → 풍미통닭 → 휴식
```

**Day 3:**
```
순천만국가정원 → 선암사
```

**Counterfactual Evidence (개별 보존 — 일반 Rule 승격 금지):**

| 사례 | Trigger | Actual |
|---|---|---|
| 아쿠아플라넷 일찍 종료 | 예상보다 일찍 종료 | 아르떼뮤지엄 추가 |
| 호텔 짚트랙 | 더위 | 짚트랙 포기 |
| 카페 퍼즈 | 더위 | 예정하지 않은 카페 휴식 |
| 낙안읍성 | 순천만국가정원 예상 체류시간 증가 | 낙안읍성 제외 |
| 향일암 이후 | 체력 저하 | 이후 일정 변경 기록 |

Signal: `TRAVELER_CONDITION / HEAT / UNEXPECTED_STAY_DURATION`

**Cable Car:** 여수해상케이블카 (Day 1)  
**Cable Car Direction:** MISSING_DATA (Source Evidence로 확정하지 않음)  
**Cable Car Type:** MISSING_DATA  
**Accommodation:** 라마다 프라자 호텔 (여수 Day 1) / 순천 스테이두루 (Day 2)  
**WHY_RESEARCH_REQUIRED:** 왜 개인 여행에서 Traveler State가 실제 다음 장소를 변경하는가 → WHY-Q4

---

### YTC-006

| 항목 | 값 |
|---|---|
| Corpus ID | YTC-006 |
| Source / Identity | 스타투어 |
| Source Type | Regional / Package |
| Trip Length | 1박2일 |
| Transport | KTX + 투어버스 |
| Group / Individual | GROUP (Package) |
| Region | 남해 + 여수 + 순천 |
| Status | POSSIBLY_STALE |

**Raw Schedule:**

**Day 1:**
```
용산역 → 순천역 → 투어버스 → 남해 → 점심 → 보리암 → 독일마을/원예예술촌 → 숙소 → 자유석식
```

**Day 2:**
```
조식 → 여수해상케이블카 편도 → 오동도 → 순천 이동 → 중식 → 순천만 생태공원/국가정원 → 순천역 → 용산역
```

**Key Evidence:**

| 항목 | 값 |
|---|---|
| Cable Car Type | One-way (편도) |
| Next after Cable Car | 오동도 |
| Cable Car Direction | **MISSING_DATA — 현재 Research Evidence만으로 추가 추정하지 않음** |

**Source Condition (보존):**  
일정/차량시간은 현지 기상·사정에 따라 변경 가능하다는 Source 조건.

**Accommodation:** MISSING_DATA (Day 1 숙소 — 지역 미확정)  
**Counterfactual Signal:** MISSING_DATA  
**WHY_RESEARCH_REQUIRED:** 왜 패키지에서 케이블카 편도가 나타나는가 → WHY-Q3

---

## Section 2 — First Sample Observations

> 모두 `OBSERVATION / EARLY SIGNAL / SAMPLE-BOUNDED` 수준. Rule 또는 확정 Pattern으로 승격하지 않는다.

### O-01 — 반복 Place 초기 신호

다음 장소들이 First Sample Corpus 내 여러 사례에서 반복 등장:

- 오동도
- 여수해상케이블카
- 향일암

Status: `EARLY SIGNAL / SAMPLE-BOUNDED`

---

### O-02 — Cable Car ↔ Odongdo 반복 Edge 초기 신호

케이블카와 오동도가 연속 배치되는 패턴이 반복 관찰됨.

참조 IDs: YTC-001, YTC-006 (confirmed in Source) / YTC-002 (context 확인 필요)

Status: `EARLY SIGNAL / SAMPLE-BOUNDED`

---

### O-03 — 광양 숙박 Observation

YTC-001, YTC-002에서 여수 관광 후 광양 숙박이 관찰됨.

Provenance: CORPUS (Source-stated in schedule)

Status: `OBSERVATION / SAMPLE-BOUNDED`  
WHY: → WHY-Q1

---

### O-04 — 순천역 Entry/Exit Hub 초기 신호

YTC-001, YTC-006에서 순천역이 여행의 Entry/Exit Hub로 기능하는 패턴 관찰.

Status: `EARLY SIGNAL / SAMPLE-BOUNDED`

---

### O-05 — Individual Traveler State / Counterfactual 초기 신호

YTC-003, YTC-005에서 Opening Time, Heat, Fatigue, Unexpected Stay Duration에 따른 일정 변경이 관찰됨.

Status: `EARLY SIGNAL / SAMPLE-BOUNDED`  
WHY: → WHY-Q4

---

## Section 3 — WHY_RESEARCH_REQUIRED Queue

기존 Research에서 나온 질문만 유지. 새로운 WHY 생성 금지.

| ID | 질문 | 관련 IDs |
|---|---|---|
| WHY-Q1 | 왜 일부 단체 일정은 여수 관광 후 광양에서 숙박하는가? | YTC-001, YTC-002 |
| WHY-Q2 | 왜 케이블카와 오동도가 반복해서 연속 배치되는가? | YTC-001, YTC-006 |
| WHY-Q3 | 왜 패키지에서 케이블카 편도가 나타나는가? | YTC-001, YTC-002, YTC-006 |
| WHY-Q4 | 왜 개인 여행에서는 Traveler State가 실제 다음 장소를 변경하는가? | YTC-003, YTC-005 |

모든 WHY는 `WHY_RESEARCH_REQUIRED` 상태. 답을 새로 만들지 않는다.  
Founder Expert Rationale는 별도로 존재하며, 이 Raw Evidence Persistence에 섞지 않는다.

---

## Section 4 — Corpus Identity Note

**이번 persistence에서 사용한 canonical identity:** YTC-001~006 (네스트투어·홍익여행사 / 테마캠프 / coffelog / 범스라이프 / 안나의파란차 / 스타투어)

**별도 세트 (이번 범위 밖):**  
C-GRP-001, C-GRP-002, C-IND-001, C-IND-002, C-REG-001, C-REG-002는 YTC-001~006의 identity source로 사용하지 않는다.  
삭제 또는 새 Corpus 승격하지 않는다. 이번 persistence 범위 밖이다.

---

## Section 5 — Governance Guardrails

이번 작업에서 하지 않는다:

| 항목 | 상태 |
|---|---|
| 새로운 웹 조사 | NOT DONE |
| Source 재해석 | NOT DONE |
| 누락 필드 추정 | NOT DONE |
| Second Sample 역추론 | NOT DONE |
| Travel Grammar 확정 | NOT DONE |
| Mental Map 확정 | NOT DONE |
| Candidate 생성 | NOT DONE |
| Architecture 변경 | NOT DONE |
| Recommendation Rule 생성 | NOT DONE |
| SSOT Promotion | NOT DONE |
| Production / Runtime 반영 | PROHIBITED |
| DB / Schema / Migration 변경 | PROHIBITED |
| place_knowledge migration | NOT APPROVED / HOLD |

---

## Section 6 — Persistence Completeness

| ID | Schedule | Direction | Accommodation | Counterfactual | Notes |
|---|---|---|---|---|---|
| YTC-001 | COMPLETE | COMPLETE (돌산→자산, Source-supported) | COMPLETE (광양) | MISSING_DATA | — |
| YTC-002 | COMPLETE | MISSING_DATA (not confirmed from Source) | COMPLETE (광양) | MISSING_DATA | — |
| YTC-003 | COMPLETE | N/A (케이블카 없음) | COMPLETE (소노캄) | COMPLETE | Opening time trigger |
| YTC-004 | MISSING_DATA | MISSING_DATA | MISSING_DATA | MISSING_DATA | Historical / insufficient source |
| YTC-005 | COMPLETE | MISSING_DATA | COMPLETE (라마다+스테이두루) | COMPLETE | Multiple triggers |
| YTC-006 | COMPLETE | MISSING_DATA (편도 확인, 방향 미확정) | MISSING_DATA | MISSING_DATA | POSSIBLY_STALE |

---

*Yeosu Travel Schedule Corpus Pilot V0.1 — First Sample Repository Persistence V0.1 — 2026-09-25*
