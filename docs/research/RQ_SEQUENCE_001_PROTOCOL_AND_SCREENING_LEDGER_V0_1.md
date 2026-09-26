# RQ-SEQUENCE-001 — Journey Sequence Evidence Surface
# Protocol and Screening Ledger V0.1

**Date:** 2026-09-26  
**Branch:** staging/storybook-c7a  
**Base Checkpoint:** ea9edaa  
**Status:** CORRECTED BASELINE — C-01 / C-02 APPLIED / INTEGRITY REVIEW PASS WITH CORRECTIONS  
**Authoritative Screening Result:** This document reflects corrected values. Initial extraction classifications C-01/C-02 were updated per Independent Integrity Review. See `RQ_SEQUENCE_001_INTEGRITY_REVIEW_DECISION_V0_1.md`.

---

## A. Research Question

"실제 여수 여행 일정에서 문서상 연속적으로 확인 가능한 Journey Node Sequence는 어느 범위까지 관찰되는가?"

---

## B. Purpose / Non-goals

**Purpose:**  
Canonical Corpus(YTC-001~014)에서 source-stated adjacency를 추출하여 Sequence Evidence Surface를 확보한다.

**Non-goals (이번 단계에서 수행하지 않는 것):**

| 항목 | 상태 |
|---|---|
| Sequence Pattern Review | NOT PERFORMED |
| Evidence Sufficiency Decision | NOT YET DECIDED |
| Gateway / Hub 판단 | NOT CONCLUDED |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Optimal Route | NOT CREATED |
| Recommendation | NOT CREATED |
| Candidate 생성 | NO |
| Architecture 변경 | NO |
| place_knowledge migration | NOT APPROVED / HOLD |
| DB / Schema / Runtime / Production 변경 | NO CHANGE |

---

## C. Authoritative Inputs

| Source | File |
|---|---|
| First Sample (YTC-001~006) | `docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_FIRST_SAMPLE_V0_1.md` |
| Second Sample (YTC-007~014) | `docs/research/YEOSU_TRAVEL_SCHEDULE_CORPUS_PILOT_SECOND_SAMPLE_V0_1.md` |

Posterior corrections applicable:
- Second Sample Lumi Corrections 1–5 반영
- Cross-Corpus Review V0.2.1 반영 (YTC-014 lodging 정정 등)

---

## D. SEU Definition

`SEU — Sequence Evidence Unit`

최소 단위: `Node A → Node B`

**생성 조건:**  
두 Node의 전후 adjacency가 저장된 canonical source에서 실제로 지원될 때만 생성.

**생성 금지:**
- 같은 일정에 두 장소가 등장한다는 이유만
- 중간 node가 생략/불명확한 경우 A→C 임의 생성
- 지도/거리/상식으로 adjacency 추정
- Inter-day overnight gap 연결

---

## E. Scope Status Definitions

| Status | 정의 |
|---|---|
| `FULL_ITINERARY_SCOPE` | Source가 전체 여행 일정의 시작과 종료를 문서상 지원 |
| `SEGMENT_ONLY_SCOPE` | 전체 여행의 일부 구간만 저장. 해당 구간 시작/종료가 전체 여행의 시작/종료와 일치하지 않음 |
| `PARTIAL_ITINERARY_SCOPE` | 전체 여행의 시작 또는 종료가 식별되나 중간 일부가 명시적으로 생략됨 |
| `SCOPE_UNCLEAR` | Source 자체가 충분하지 않아 scope 파악 불가 |

---

## F. Sequence Quality Definitions

| Quality | 정의 |
|---|---|
| `CONTINUOUS_SEQUENCE` | 저장된 documented scope 내부에서 node order와 adjacency가 연속적으로 확인됨 |
| `PARTIAL_SEQUENCE` | 일부 범위만 저장되어 있으나, 제공된 범위 내부의 node order/adjoining relation은 확인 가능 |
| `COMPRESSED_SEQUENCE` | 순서는 일부 보이지만 표현이 축약되어 exact adjacency를 모두 보장할 수 없음 |
| `SEQUENCE_INCOMPLETE` | 순서 자체가 부족하거나 MISSING_DATA여서 sequence extraction 불가 |

**Critical distinctions:**

`PARTIAL ≠ INCOMPLETE`  
`COMPRESSED ≠ CONTINUOUS`  
`Sequence continuity ≠ Complete itinerary coverage`  
`SEGMENT_ONLY_SCOPE + CONTINUOUS_SEQUENCE`는 논리적으로 유효 — Scope와 Quality는 독립 axis

---

## G. Journey Node Ontology (Audit Result)

| Node Type | 예시 | 비고 |
|---|---|---|
| `PLACE_NODE` | 오동도, 순천역, 향일암, 케이블카 탑승장 | 방문 목적지/물리적 위치 |
| `ACTIVITY_OR_EXPERIENCE_NODE` | 여수해상케이블카, 케이블카 편도/왕복 | 방문 경험 자체가 목적 |
| `MEAL_OR_REST_NODE` | 중식, 조식, 자유석식, 휴식 | Source-stated sequence element |
| `MOVEMENT_EVENT` | 투어버스(YTC-006), 버스(YTC-007) | Source가 독립 element로 표기. 아래 주의사항 참조 |

**MOVEMENT_EVENT 주의사항 (Unresolved Flag):**

`투어버스`(YTC-006)와 `버스`(YTC-007)는 source wording 보존 원칙 및 No Gap Filling 원칙에 따라 이번 baseline에서 SEU 노드로 보존된다.

- 제거 후 직접 adjacency(`순천역 → 남해`, `자산탑승장 → 자산공원주차장`) 생성은 source 미명시 — Gap Filling 위반
- 따라서 source에 명시된 대로 sequence element로 유지

단:
- `PLACE_NODE`와 동일하게 해석 금지
- 향후 Pattern Review에서 Place/Experience node와 무비판적으로 합산 금지
- 이것은 Architecture Decision이 아님
- 새 ontology SSOT/Candidate 생성 금지

`MOVEMENT_EVENT ≠ PLACE_NODE`

---

## H. Evidence Rules

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

## I. Hard Guardrails

`Repeated adjacency ≠ Route Pattern`  
`Documented order ≠ Preferred order`  
`Travel-agency sequence ≠ Traveler behavior`  
`Sequence continuity ≠ Complete itinerary coverage`  
`MOVEMENT_EVENT ≠ PLACE_NODE`

---

## J. YTC-001~014 Corrected Screening Ledger

*Note: This ledger reflects corrected Quality classifications after Independent Integrity Review (C-01, C-02 applied).*

---

### YTC-001

| 필드 | 값 |
|---|---|
| Canonical Source | First Sample V0.1 — 네스트투어/홍익여행사 |
| Documented Scope | 2박3일 전일정 (용산역 출발 → 용산역 귀환) |
| Scope Status | `FULL_ITINERARY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 용산역 (Day 1) |
| Last Supported Node | 용산역 (Day 3) |
| Supported Adjacency Count | **21** |

**Adjacency List:**

*Day 1 (6):*  
1. 용산역 → 순천역  
2. 순천역 → 선암사  
3. 선암사 → 중식  
4. 중식 → 순천만  
5. 순천만 → 여수 미평동 숙소  
6. 여수 미평동 숙소 → 자유석식  

*Day 2 (8):*  
7. 조식 → 향일암  
8. 향일암 → 교동시장/여수 풍물시장  
9. 교동시장/여수 풍물시장 → 진남관·이순신광장  
10. 진남관·이순신광장 → 케이블카 탑승장  
11. 케이블카 탑승장 → 여수해상케이블카  
12. 여수해상케이블카 → 오동도  
13. 오동도 → 장도  
14. 장도 → 광양 숙소  

*Day 3 (7):*  
15. 광양 → 남해 보리암  
16. 남해 보리암 → 중식  
17. 중식 → 독일마을  
18. 독일마을 → 이락사  
19. 이락사 → 충렬사  
20. 충렬사 → 순천역  
21. 순천역 → 용산역  

---

### YTC-002

| 필드 | 값 |
|---|---|
| Canonical Source | First Sample V0.1 — 테마캠프 |
| Documented Scope | 1박2일 전일정 (광화문 출발 → 서울 귀환) |
| Scope Status | `FULL_ITINERARY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 광화문 |
| Last Supported Node | 서울 |
| Supported Adjacency Count | **15** |
| Note | Cable Car Direction: MISSING_DATA |

**Adjacency List:**

*Day 1 (9):*  
1. 광화문 → 양재  
2. 양재 → 죽전  
3. 죽전 → 여수 중식  
4. 여수 중식 → 오동도  
5. 오동도 → 고소동 천사벽화마을  
6. 고소동 천사벽화마을 → 향일암  
7. 향일암 → 개별석식  
8. 개별석식 → 여수해상케이블카/돌산공원  
9. 여수해상케이블카/돌산공원 → 광양 숙소  

*Day 2 (6):*  
10. 광양 조식 → 노량대교  
11. 노량대교 → 남해 보리암  
12. 남해 보리암 → 독일마을/원예예술촌  
13. 독일마을/원예예술촌 → 남해전통시장/중식  
14. 남해전통시장/중식 → 관음포 이락사  
15. 관음포 이락사 → 서울  

---

### YTC-003

| 필드 | 값 |
|---|---|
| Canonical Source | First Sample V0.1 — coffelog |
| Documented Scope | 2박3일 전일정 (여수 도착 → 귀가) |
| Scope Status | `FULL_ITINERARY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 여수 도착 (15:00, Day 1) |
| Last Supported Node | 귀가 (Day 3) |
| Supported Adjacency Count | **13** |
| Note | Day 3 낭만24포차→꽃돌게장1번가: plan-change adjacency (source-stated) |

**Adjacency List:**

*Day 1 (3):*  
1. 여수 도착 → 소노캄 체크인/휴식  
2. 소노캄 체크인/휴식 → 저녁 배달  
3. 저녁 배달 → 자산공원 일몰/호텔 주변 산책  

*Day 2 (7):*  
4. 간단한 아침 → 오동도 동백열차  
5. 오동도 동백열차 → 오동도  
6. 오동도 → 아쿠아플라넷  
7. 아쿠아플라넷 → 여수수산시장  
8. 여수수산시장 → 저녁식사  
9. 저녁식사 → 이순신광장  
10. 이순신광장 → 간식/휴식  

*Day 3 (3):*  
11. 체크아웃 → 낭만24포차 시도  
12. 낭만24포차 시도 → 꽃돌게장1번가 *(plan-change; 오픈시간 trigger; source-stated)*  
13. 꽃돌게장1번가 → 귀가  

---

### YTC-004

| 필드 | 값 |
|---|---|
| Canonical Source | First Sample V0.1 — 범스 라이프 |
| Documented Scope | Sequence = MISSING_DATA |
| Scope Status | `SCOPE_UNCLEAR` |
| Sequence Quality | `SEQUENCE_INCOMPLETE` |
| First Supported Node | MISSING_DATA |
| Last Supported Node | MISSING_DATA |
| Supported Adjacency Count | **0** |

---

### YTC-005

| 필드 | 값 |
|---|---|
| Canonical Source | First Sample V0.1 — 안나의 파란차 |
| Documented Scope | 2박3일 전일정 (여수+순천 여행) |
| Scope Status | `FULL_ITINERARY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 여수 (Day 1) |
| Last Supported Node | 선암사 (Day 3) |
| Supported Adjacency Count | **14** |
| Note | Day 1 아쿠아플라넷→아르떼뮤지엄: plan-change adjacency (source-stated) |

**Adjacency List:**

*Day 1 (7):*  
1. 여수 → 두꺼비게장  
2. 두꺼비게장 → 아쿠아플라넷  
3. 아쿠아플라넷 → 아르떼뮤지엄 *(plan-change; source-stated)*  
4. 아르떼뮤지엄 → 라마다 프라자 호텔  
5. 라마다 프라자 호텔 → 당머리첫집  
6. 당머리첫집 → 여수해상케이블카  
7. 여수해상케이블카 → 숙소  

*Day 2 (6):*  
8. 바다김밥 → 향일암  
9. 향일암 → 카페 퍼즈  
10. 카페 퍼즈 → 오동도  
11. 오동도 → 순천 스테이두루  
12. 순천 스테이두루 → 풍미통닭  
13. 풍미통닭 → 휴식  

*Day 3 (1):*  
14. 순천만국가정원 → 선암사  

---

### YTC-006

| 필드 | 값 |
|---|---|
| Canonical Source | First Sample V0.1 — 스타투어 |
| Documented Scope | 1박2일 전일정 (용산역 출발 → 용산역 귀환) |
| Scope Status | `FULL_ITINERARY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 용산역 (Day 1) |
| Last Supported Node | 용산역 (Day 2) |
| Supported Adjacency Count | **15** |
| Note | "투어버스": MOVEMENT_EVENT / UNRESOLVED_NODE_TYPE — source-stated sequence element로 보존; Cable Car Direction: MISSING_DATA |

**Adjacency List:**

*Day 1 (8):*  
1. 용산역 → 순천역  
2. 순천역 → 투어버스 *(MOVEMENT_EVENT — source-stated)*  
3. 투어버스 → 남해  
4. 남해 → 점심  
5. 점심 → 보리암  
6. 보리암 → 독일마을/원예예술촌  
7. 독일마을/원예예술촌 → 숙소  
8. 숙소 → 자유석식  

*Day 2 (7):*  
9. 조식 → 여수해상케이블카 편도  
10. 여수해상케이블카 편도 → 오동도  
11. 오동도 → 순천 이동  
12. 순천 이동 → 중식  
13. 중식 → 순천만 생태공원/국가정원  
14. 순천만 생태공원/국가정원 → 순천역  
15. 순천역 → 용산역  

---

### YTC-007

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 모두투어 |
| Documented Scope | 케이블카 + 오동도 + 광양 숙박 segment |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 돌산탑승장(돌산공원) |
| Last Supported Node | 광양 숙박 |
| Supported Adjacency Count | **6** |
| Note | "버스": MOVEMENT_EVENT / UNRESOLVED_NODE_TYPE — source-stated sequence element로 보존 |

**Adjacency List (6):**  
1. 돌산탑승장(돌산공원) → 케이블카 편도  
2. 케이블카 편도 → 자산탑승장  
3. 자산탑승장 → 버스 *(MOVEMENT_EVENT — source-stated)*  
4. 버스 → 자산공원주차장 집결  
5. 자산공원주차장 집결 → 오동도  
6. 오동도 → 광양 숙박  

---

### YTC-008

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 롯데관광 |
| Documented Scope | 케이블카 + 오동도 + 여수 숙박 segment |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 돌산 탑승장 |
| Last Supported Node | 여수 숙박 |
| Supported Adjacency Count | **4** |

**Adjacency List (4):**  
1. 돌산 탑승장 → 케이블카 편도  
2. 케이블카 편도 → 자산 탑승장  
3. 자산 탑승장 → 오동도  
4. 오동도 → 여수 숙박  

---

### YTC-009

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 웹투어 |
| Documented Scope | 케이블카 + 돌산공원 + 돌산 숙박 segment |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 자산탑승장 |
| Last Supported Node | 돌산 숙박 |
| Supported Adjacency Count | **4** |
| Note | 방향: 자산→돌산 (YTC-007/008과 반대) |

**Adjacency List (4):**  
1. 자산탑승장 → 케이블카 편도  
2. 케이블카 편도 → 돌산탑승장  
3. 돌산탑승장 → 돌산공원  
4. 돌산공원 → 돌산 숙박  

---

### YTC-010

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 개인 솔로 |
| Documented Scope | Plan-change event segment (향일암→봉산동→오동도) |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` *(C-01 적용 — 이전: PARTIAL_SEQUENCE)* |
| First Supported Node | 향일암(계획 축소/포기) |
| Last Supported Node | 오동도/휴식 |
| Supported Adjacency Count | **2** |
| Note | "조기 이동", "택시"는 MOVEMENT_EVENT — place node 아님; within-segment adjacency 2개 모두 source-stated |

**Adjacency List (2):**  
1. 향일암(계획 축소/포기) → 봉산동 식사 *(plan-change; taxi; source-stated)*  
2. 봉산동 식사 → 오동도/휴식  

---

### YTC-011

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 가족/자가용 |
| Documented Scope | 케이블카 왕복 segment (돌산탑승장 주차→귀환) |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 돌산탑승장 주차 |
| Last Supported Node | 돌산탑승장 귀환 |
| Supported Adjacency Count | **2** |
| Note | 이후 "다른 장소/카페" 미특정 — adjacency 미생성 |

**Adjacency List (2):**  
1. 돌산탑승장 주차 → 케이블카 왕복(돌산↔자산)  
2. 케이블카 왕복(돌산↔자산) → 돌산탑승장 귀환  

---

### YTC-012

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 커플/KTX+렌터카 |
| Documented Scope | 케이블카 왕복 segment (자산탑승장→귀환) |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `CONTINUOUS_SEQUENCE` |
| First Supported Node | 자산탑승장 |
| Last Supported Node | 자산탑승장 귀환 |
| Supported Adjacency Count | **2** |
| Note | 이후 식사 계획 변경 — 대상 미특정 adjacency 미생성 |

**Adjacency List (2):**  
1. 자산탑승장 → 케이블카 왕복(자산↔돌산)  
2. 케이블카 왕복(자산↔돌산) → 자산탑승장 귀환  

---

### YTC-013

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 지역 연계 패키지 |
| Documented Scope | 오동도→광양 compressed segment |
| Scope Status | `SEGMENT_ONLY_SCOPE` |
| Sequence Quality | `PARTIAL_SEQUENCE` *(C-02 적용 — 이전: COMPRESSED_SEQUENCE)* |
| First Supported Node | 오동도 |
| Last Supported Node | 광양 |
| Supported Adjacency Count | **4** |
| Note | 오동도 이전 일정 미기재. Scope 제한은 SEGMENT_ONLY로 반영. 4 adjacency 모두 직접 source-stated — COMPRESSED 기준 불성립. 자동 CONTINUOUS 승격 금지 유효. |

**Adjacency List (4):**  
1. 오동도 → 자산탑승장  
2. 자산탑승장 → 케이블카 편도  
3. 케이블카 편도 → 돌산탑승장  
4. 돌산탑승장 → 광양  

---

### YTC-014

| 필드 | 값 |
|---|---|
| Canonical Source | Second Sample V0.1 — 커플/자가용 |
| Documented Scope | 순천 → 여수 → 향일암 방문 완료 → "..." → 이동 |
| Scope Status | `PARTIAL_ITINERARY_SCOPE` |
| Sequence Quality | `SEQUENCE_INCOMPLETE` |
| First Supported Node | 순천 |
| Last Supported Node | 향일암 (이후 "..." 명시적 생략) |
| Supported Adjacency Count | **2** |
| Note | 향일암 이후 sequence는 source에서 "..."로 생략됨 — adjacency 미생성 |

**Adjacency List (2):**  
1. 순천 → 여수  
2. 여수 → 향일암  

---

## K. Corrected Count Summary

### Scope Distribution

| Scope Status | Count | YTC IDs |
|---|---|---|
| FULL_ITINERARY_SCOPE | 5 | YTC-001, 002, 003, 005, 006 |
| SEGMENT_ONLY_SCOPE | 7 | YTC-007, 008, 009, 010, 011, 012, 013 |
| PARTIAL_ITINERARY_SCOPE | 1 | YTC-014 |
| SCOPE_UNCLEAR | 1 | YTC-004 |
| **Total** | **14** | |

**Arithmetic:** 5+7+1+1 = 14 — PASS

### Quality Distribution (Corrected)

| Quality | Count | YTC IDs |
|---|---|---|
| CONTINUOUS_SEQUENCE | 11 | YTC-001, 002, 003, 005, 006, 007, 008, 009, 010, 011, 012 |
| PARTIAL_SEQUENCE | 1 | YTC-013 |
| COMPRESSED_SEQUENCE | 0 | — |
| SEQUENCE_INCOMPLETE | 2 | YTC-004, 014 |
| **Total** | **14** | |

**Arithmetic:** 11+1+0+2 = 14 — PASS

### SEU Count

| 집계 | 값 |
|---|---|
| First Sample (YTC-001~006) | 21+15+13+0+14+15 = **78** |
| Second Sample (YTC-007~014) | 6+4+4+2+2+2+4+2 = **26** |
| **Grand Total** | **104** |
| Inference-created SEU | **0** |
| Unsupported inter-day adjacency | **0** |

---

## L. Governance

| 항목 | 상태 |
|---|---|
| Sequence Pattern Review | NOT PERFORMED |
| Evidence Sufficiency Decision | NOT YET DECIDED |
| Gateway Pattern | NOT CONCLUDED |
| Hub Pattern | NOT CONCLUDED |
| Journey Grammar | NOT CONCLUDED |
| Travel Grammar | NOT CONCLUDED |
| Mental Map | NOT CONFIRMED |
| Traveler State Transition | NOT CONFIRMED |
| Candidate Generated | NO |
| Architecture Changed | NO |
| DB / Schema / Runtime / Production | NO CHANGE |
| place_knowledge migration | NOT APPROVED / HOLD |

---

*RQ-SEQUENCE-001 Protocol and Screening Ledger V0.1 — 2026-09-26*
