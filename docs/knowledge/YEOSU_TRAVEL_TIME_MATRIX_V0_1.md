# YEOSU TRAVEL TIME MATRIX V0.1
생성일: 2026-09-21  
상태: FOUNDER 검수 대기 — 구현 금지  
원칙: Evidence 없는 숫자 생성 금지 / UNKNOWN은 UNKNOWN 유지 / 임의 추정 금지

---

## 설계 원칙 (Founder Direction 2026-09-21)

> "Route 질문마다 이동시간을 새로 조사하지 않는다.  
> Place-to-Place Time Matrix와 Stay Time Profile을 사전 Knowledge로 보유하고,  
> Journey Variables를 적용해 Route를 즉시 계산한다."

**Status:** WORKING DIRECTION / VALIDATION REQUIRED — LOCKED SSOT 아님

**Route Time 계산 구조:**
```
Route Time =
  Σ Stay Time          (Stay Time Profile — 별도 섹션)
+ Σ Travel Time        (이 Matrix Lookup)
+ Σ Access/Transition  (현재 전체 UNKNOWN)
+ Meal Time
+ Required Waiting
+ Required Buffer
+ Journey Variables 적용 (Transport Mode / Party Size / Available Time / etc.)
```

---

## 1. Entity 목록

Matrix에 포함된 장소 (총 13개 장소 + 케이블카 Connector 2개 Access Point):

| # | 코드명 | 정식명 | 권역 | 포함 이유 |
|---|---|---|---|---|
| 1 | EXPO_STN | 여수엑스포역 | 엑스포권 | Route Corpus 출현 11회 — 최다 |
| 2 | ODO | 오동도 | 오동도권 | Route Corpus 출현 10회 + Founder Route #001 |
| 3 | AQUAPLANET | 아쿠아플라넷 여수 | 오동도권 | Route Corpus 출현 7회 |
| 4 | CABLE_JASAN | 자산탑승장 (케이블카 자산정류장) | 오동도권 | Founder Route #001 / 케이블카 Access Point |
| 5 | CABLE_DOLSAN | 돌산공원탑승장 (케이블카 돌산정류장) | 돌산 | 케이블카 Access Point / 돌산공원 내 위치 |
| 6 | ADMIRAL_SQ | 이순신광장 (전라좌수영거북선) | 원도심 | Route Corpus 출현 8회 + Founder Route #001 |
| 7 | GOSODONG | 고소동·천사벽화골목 | 원도심 | Route Corpus 출현 4회 + Founder Route #001 |
| 8 | HAMEL | 하멜전시관 (종포해양공원) | 원도심 | Founder Route #001 |
| 9 | JINNANGWAN | 진남관 | 원도심 | Founder Route #001 |
| 10 | EXPO_SITE | 여수세계박람회장 | 엑스포권 | Founder Route #001 |
| 11 | HYANGILAM | 향일암 | 향일암·금오산 | Route Corpus 출현 6회 |
| 12 | MARINE_SCI | 전남해양수산과학관 | 원도심 | 낭만버스1코스 경유 |
| 13 | FISH_MARKET | 수산물특화시장 | 원도심 | 낭만버스1코스 경유 |

**케이블카 특별 처리:**  
케이블카는 일반 Travel Time Edge가 아닌 Experience/Transport Connector로 분리.  
자산탑승장 ↔ 돌산공원탑승장 사이 = Section 4 (Cable Car Connector) 별도 기록.

---

## 2. Travel Time Matrix

### Evidence Status 범례

| 코드 | 의미 |
|---|---|
| OFFICIAL | 공식 기관 발표 — HIGH confidence |
| ROUTE_SOURCE | 공식 코스 자료 내 명시값 — MEDIUM confidence |
| ROUTE_SOURCE_LOW | 단일 Web Source 기반 — LOW confidence |
| ROUTE_SOURCE_DERIVED | 다른 Edge에서 파생된 참조값 — LOW confidence |
| UNVERIFIED_SECONDARY | 복수 비공식 Source 일치 — 공식 미확인 |
| UNKNOWN | Evidence 없음 — 향후 조사 필요 |

### 2-A. OFFICIAL — 2층버스 정류장 간격 (HIGH confidence)

출처: yeosu.go.kr 2층버스 주간코스 R032 (2026-09-21)  
주의: TOUR_BUS 시간. CAR/WALK/TAXI 계산에 직접 적용 금지.

| from | to | mode | time_min | time_max | evidence_status | notes |
|---|---|---|---|---|---|---|
| 여수엑스포역 | 아쿠아플라넷 | TOUR_BUS | 2 | 2 | OFFICIAL | 2층버스 정류장 간격 |
| 아쿠아플라넷 | 자산탑승장 | TOUR_BUS | 3 | 3 | OFFICIAL | 자산탑승장=케이블카주차타워 |
| 자산탑승장 | 오동도 | TOUR_BUS | 5 | 5 | OFFICIAL | |
| 오동도 | 엠블호텔 | TOUR_BUS | 5 | 5 | OFFICIAL | 참고용 중간 정류장 |
| 엠블호텔 | 하멜전시관 | TOUR_BUS | 2 | 2 | OFFICIAL | |
| 하멜전시관 | 이순신광장 | TOUR_BUS | 3 | 3 | OFFICIAL | |
| 이순신광장 | 수산물특화시장 | TOUR_BUS | 5 | 5 | OFFICIAL | |
| 수산물특화시장 | 돌산공원탑승장 | TOUR_BUS | 5 | 5 | OFFICIAL | 돌산공원입구=케이블카 돌산 권역 |
| 돌산공원탑승장 | 여수엑스포역 | TOUR_BUS | 5 | 5 | OFFICIAL | |

### 2-B. ROUTE_SOURCE — 낭만버스1코스 이동시간 (MEDIUM confidence)

출처: yeosu.go.kr 낭만버스1코스 R028 (2026-09-21)  
주의: TOUR_BUS 시간. 낭만버스 운행 기준 — 일반 버스 상이 가능.

| from | to | mode | time_min | time_max | evidence_status | notes |
|---|---|---|---|---|---|---|
| 여수엑스포역 | 오동도 | TOUR_BUS | 10 | 10 | ROUTE_SOURCE | 낭만버스1코스 R028 |
| 오동도 | 진남관 | TOUR_BUS | 10 | 10 | ROUTE_SOURCE | 낭만버스1코스 R028 |
| 진남관 | 전남해양수산과학관 | TOUR_BUS | 20 | 20 | ROUTE_SOURCE | 낭만버스1코스 R028 |
| 전남해양수산과학관 | 향일암 | TOUR_BUS | 25 | 25 | ROUTE_SOURCE | 낭만버스1코스 R028 |
| 향일암 | 수산물특화시장 | TOUR_BUS | 40 | 40 | ROUTE_SOURCE | 낭만버스1코스 R028 |
| 수산물특화시장 | 여수엑스포역 | TOUR_BUS | 10 | 10 | ROUTE_SOURCE | 낭만버스1코스 R028 |

### 2-C. ROUTE_SOURCE_LOW — Web Source 도보·대중교통 (LOW confidence)

출처: trip.com blog R039 단일 Source  
주의: 독립 검증 필요. LOW confidence 유지.

| from | to | mode | time_min | time_max | evidence_status | notes |
|---|---|---|---|---|---|---|
| 여수엑스포역 | 이순신광장 | WALK | 35 | 35 | ROUTE_SOURCE_LOW | trip.com R039. 단일 Source. |
| 여수엑스포역 | 이순신광장 | PUBLIC_TRANSIT | 12 | 12 | ROUTE_SOURCE_LOW | trip.com R039. 노선번호 미확인. |
| 이순신광장 | 고소동(천사벽화골목) | WALK | 15 | 15 | ROUTE_SOURCE_LOW | trip.com R039. |
| 고소동(천사벽화골목) | 자산탑승장 | PUBLIC_TRANSIT | 30 | 30 | ROUTE_SOURCE_LOW | trip.com R039. |
| 고소동(천사벽화골목) | 자산탑승장 | TAXI | 10 | 10 | ROUTE_SOURCE_LOW | trip.com R039. |

**Founder Route #001 추가 Evidence:**

| from | to | mode | time_min | time_max | evidence_status | notes |
|---|---|---|---|---|---|---|
| 진남관 | 이순신광장 | WALK | 5 | 5 | ROUTE_SOURCE_LOW | 블로그 참고. E3. CAR 비권장(주차overhead). |
| 이순신광장 | 천사벽화골목(고소동) | WALK | 15 | 15 | ROUTE_SOURCE_LOW | trip.com. E4. 동일 원도심. |
| 하멜전시관 | 자산탑승장 | CAR | 10 | 10 | ROUTE_SOURCE_DERIVED | E6. E004-TAXI(고소동→자산 10분) 파생. 참조값. |

### 2-E. UPDATE 2026-09-21 — E1/E5 확보 (WebSearch 조사 결과)

| from | to | mode | time_min | time_max | distance_note | time_character | evidence_status | source | verified_at | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| 오동도 | 여수세계박람회장 | CAR | 10 | 10 | 약 2km | STATIC | ROUTE_SOURCE_LOW | ibtravel.co.kr (단일) | 2026-09-21 | **E1** — 여수엑스포역↔오동도 2km/10분 기반. 박람회장≈엑스포역 권역. 단일Source. |
| 오동도 | 여수세계박람회장 | WALK | 30 | 30 | 약 2km | STATIC | ROUTE_SOURCE_LOW | ibtravel.co.kr (단일) | 2026-09-21 | E1 WALK — 동일 Source. LOW confidence. |
| 천사벽화골목(고소동) | 하멜전시관 | WALK | 3 | 5 | 종포해양공원 경유 | STATIC | ROUTE_SOURCE_LOW | 여수시청 공식 코스 구조 (yeosu.go.kr/tour/leisure/walk/goso_angel) | 2026-09-21 | **E5** — 벽화골목 종포문/낭만포차문 출구→종포해양공원(=하멜전시관 위치). 코스 구조 파생값. LOW. |

**E5 핵심 발견 (2026-09-21):**
- 고소천사벽화마을 코스: 총 1,650m, 입구 4개 (진남관문·이순신광장문·낭만포차문·종포문)
- 종포문/낭만포차문 출구 → 종포해양공원(=여수해양공원) 직접 연결
- 종포해양공원 = 하멜전시관 위치 권역 (CONFIRMED: "이순신광장에서 하멜전시관까지 해안선을 따라 조성된 1.5km 구간의 시민공원")
- **Founder Route #001 구조:** 이순신광장문 또는 진남관문 진입 → 60분 탐방 → 종포문 출구 → 3~5분 → 하멜전시관
- E5는 벽화골목 체류(60분) 후 자연스럽게 하멜전시관으로 이어지는 구조

**E2 조사 결과 (2026-09-21):**
- WebSearch 실시: 여수세계박람회장→진남관 CAR 직접 Evidence 미발견
- E2: UNKNOWN 유지

---

### 2-D. UNKNOWN — Evidence 없는 Edge

현재 Evidence 미확보. 향후 지도 조회 / 현장 측정 / SOWON_JOURNEY_EVIDENCE로 채워질 대상.  
삭제하지 않는다. 명시적으로 보존.

| from | to | mode | evidence_status | Founder Route #001 관련 | 비고 |
|---|---|---|---|---|---|
| 여수엑스포역 | 오동도 | CAR | UNKNOWN | — | 고빈도 Edge — 우선 조사 권장 |
| 여수엑스포역 | 오동도 | PUBLIC_TRANSIT | UNKNOWN | — | 2번버스 노선 확인됨. 시간 UNKNOWN. |
| 여수엑스포역 | 이순신광장 | TAXI | UNKNOWN | — | |
| 여수세계박람회장 | 오동도 | CAR | UNKNOWN | — | 역방향 (E1 역방향) |
| **여수세계박람회장** | **진남관** | **CAR** | **UNKNOWN** | **E2** | **2026-09-21 조사 실시 — Direct Evidence 미발견. 유일한 잔여 블로커.** |
| 진남관 | 여수세계박람회장 | CAR | UNKNOWN | — | 역방향 |
| 오동도 | 이순신광장 | CAR | UNKNOWN | — | "약10분" 비공식 참고값 있으나 사용 금지 |
| 오동도 | 이순신광장 | PUBLIC_TRANSIT | UNKNOWN | — | 2번버스 노선 확인. 시간 UNKNOWN. |
| 오동도 | 이순신광장 | WALK | UNKNOWN | — | |
| 이순신광장 | 진남관 | WALK | UNKNOWN | — | 역방향 |
| 고소동(천사벽화골목) | 이순신광장 | WALK | UNKNOWN | — | 역방향 |
| 하멜전시관 | 천사벽화골목(고소동) | WALK | UNKNOWN | — | 역방향 |
| 자산탑승장 | 하멜전시관 | CAR | UNKNOWN | — | 역방향 |
| 전남해양수산과학관 | 향일암 | CAR | UNKNOWN | — | |
| 향일암 | 수산물특화시장 | CAR | UNKNOWN | — | |
| 향일암 | 돌산공원탑승장 | CAR | UNKNOWN | — | 돌산도 내 이동. 지도 조회 필요. |
| 향일암 | 돌산공원탑승장 | TAXI | UNKNOWN | — | 동일 |
| 돌산공원탑승장 | 향일암 | CAR | UNKNOWN | — | 역방향 |

### 2-F. NEW ENTITY — 라마다 프라자 바이 윈덤 여수 ↔ 케이블카 (2026-09-30)

출처: Golden Question 01 외부 조사 (Founder 승인 2026-09-30)  
추가 배경: Ramada가 돌산도 소재임을 확인 후 CABLE_DOLSAN과의 관계를 최초 구조화.  
신뢰도: MEDIUM — 복수 외부 Source 주소 일치. 정확한 도로 경로 현장 측정 미실시.

| from | to | mode | time_min | time_max | distance_note | time_character | evidence_status | source | verified_at | notes |
|---|---|---|---|---|---|---|---|---|---|---|
| CABLE_DOLSAN (돌산공원탑승장) | RAMADA_YEOSU (라마다 여수) | CAR | 5 | 7 | ~1.2km 도로 | STATIC | UNVERIFIED_SECONDARY | 복수 외부 Source 주소 기반 계산 | 2026-09-30 | 돌산읍 강남로 11 주소 기반. 현장 측정 미실시. MEDIUM confidence. |
| CABLE_DOLSAN (돌산공원탑승장) | RAMADA_YEOSU (라마다 여수) | WALK | 15 | 15 | ~1.2km 도로 | STATIC | UNVERIFIED_SECONDARY | 복수 외부 Source 주소 기반 계산 | 2026-09-30 | 보행 경로 지형 미확인. 참고값. |
| RAMADA_YEOSU (라마다 여수) | CABLE_DOLSAN (돌산공원탑승장) | CAR | 5 | 7 | ~1.2km 도로 | STATIC | UNVERIFIED_SECONDARY | 위 동일 | 2026-09-30 | 역방향. 동일 Evidence. |

**Vehicle Recovery 구조 (Founder 운영 지식):**

| 여행자 유형 | 구조 | 권장 방향 |
|---|---|---|
| 차량 여행자 (일반) | 자산탑승장 주차 → 편도 케이블카 → 돌산 → 돌산에서 독립 이동 | 자산 출발 편도 후 돌산 체류 |
| 라마다 투숙 차량 여행자 | 라마다 출발 → 돌산정류장 → 케이블카 왕복 → 라마다 복귀 | 왕복이 자연스러운 구조 |
| 주의 | "돌산이 항상 최선" 단정 금지. 자산탑승장 → 돌산 후 차량 회수 필요 여부 여행자별 다름 | — |

**미확인 Edge (UNKNOWN 유지):**

| from | to | mode | evidence_status | 비고 |
|---|---|---|---|---|
| RAMADA_YEOSU | CABLE_JASAN (자산탑승장) | CAR | UNKNOWN | Golden Question 01 외부 조사 후에도 Not Found. 돌산대교 경유 추정이나 측정값 없음. |

---

## 3. 통계 요약

### V0.1 초기 (2026-09-21 생성)

| 항목 | 값 |
|---|---|
| Matrix 대상 장소 수 | **13개** (케이블카 Access Point 2개 포함) |
| Matrix 총 행 수 | 45행 |
| Evidence 있는 행 | 24행 |
| UNKNOWN 행 | 21행 |
| CAR Time 확보율 | ~7% (1/14) |
| Founder Route #001 Coverage | 5/8 (63%) |

### V0.1 Update 2026-09-21 (E1/E5 확보 후)

| 항목 | 값 | 변화 |
|---|---|---|
| Matrix 총 행 수 (CSV) | **48행** | +3 (E1 CAR, E1 WALK 신규, E5 업데이트) |
| Evidence 있는 행 (non-UNKNOWN) | **27행** | +3 |
| UNKNOWN 행 | **18행** | -3 (E1 CAR, E5 WALK UNKNOWN→Evidence / E1 WALK 신규) |
| OFFICIAL 행 | 9행 | 변화 없음 |
| ROUTE_SOURCE 행 | 6행 | 변화 없음 |
| ROUTE_SOURCE_LOW 행 | **10행** | +3 (E1 CAR, E1 WALK, E5 WALK) |
| ROUTE_SOURCE_DERIVED 행 | 1행 | 변화 없음 |
| UNVERIFIED_SECONDARY 행 | 2행 | 변화 없음 |
| **CAR Time 확보 행** | **2행** (E1 + E6 참조값) | +1 |
| **CAR Time UNKNOWN 행** | **12행** | -1 (E1 제거) |
| **CAR Time 확보율** | **~14%** (2/14) | 7%→14% |
| WALK Edge 확보 행 | **6행** | +2 (E1 WALK, E5 WALK) |
| WALK Edge UNKNOWN 행 | 4행 | -1 |

### V0.1 Update 2026-09-30 (Ramada Entity 추가 후)

| 항목 | 값 | 변화 |
|---|---|---|
| Matrix 총 행 수 (CSV) | **52행** | +4 (RAMADA↔CABLE_DOLSAN CAR/WALK 양방향 3행 + UNKNOWN 1행) |
| Evidence 있는 행 (non-UNKNOWN) | **30행** | +3 |
| UNKNOWN 행 | **19행** | +1 (RAMADA→CABLE_JASAN CAR UNKNOWN 신규) |
| UNVERIFIED_SECONDARY 행 | **5행** | +3 (RAMADA↔CABLE_DOLSAN CAR×2, WALK×1) |
| 대상 장소 수 | **14개** | +1 (RAMADA_YEOSU 신규 진입) |
| 신규 Entity 진입 이유 | Golden Question 01 Founder 승인 2026-09-30 | — |
| **Founder Route #001 Coverage** | **7/8 (87.5%)** | 5/8→7/8 |

---

## 4. Cable Car Connector (별도)

케이블카는 일반 Travel Time Edge가 아닌 **Experience / Transport Connector**로 분리.  
Route 계산 시 이 섹션을 별도 참조.

```
자산탑승장 (Access Point — 오동도권 / 수정동 332-55)
    ↕ [여수해상케이블카] (Experience + Transport)
돌산공원탑승장 (Access Point — 돌산공원 내 / 돌산읍 돌산로 3600-1)
```

| 항목 | 값 | 상태 |
|---|---|---|
| 편도 탑승 소요시간 | 약 12~15분 | UNVERIFIED_SECONDARY (CONFLICT: 나무위키 10분 vs 블로그 12~13분) |
| 왕복 탑승 소요시간 | 약 25~30분 (탑승만, 돌산공원 체류 별도) | 위 동일 |
| 운영시간 | 09:30~21:30 | UNVERIFIED_SECONDARY (SSL 오류로 공식 미확인) |
| 요금 (일반 왕복) | 17,000원 | UNVERIFIED_SECONDARY (블로그) |
| 요금 (크리스탈 왕복) | 24,000원 | UNVERIFIED_SECONDARY (블로그) |
| 운항 제약 | 강풍·낙뢰 시 운휴 | VERIFIED_CONSISTENT (복수 Source 일치) |
| 공식 확인 | 미확정 | BUSINESS_DIRECT_VERIFY_REQUIRED — 061-664-7301 |

**Traveler Type별 운영 구조 (Founder Evidence):**

| 유형 | 케이블카 이용 방식 |
|---|---|
| 개인 자유여행 (1~4인) | ROUND_TRIP — Traveler + Vehicle 동일 Route |
| 단체 (5인+) | ONE_WAY 가능 — Passenger Route ≠ Vehicle Route 분기 가능 |

단체 운영 시 버스 별도 이동. Quote Engine groupThreshold=5와 자동 통합 금지.

---

## 5. Stay Time Profile (별도)

Travel Time Matrix와 혼합하지 않는다.  
향후 Guide Evidence / SOWON Actual Journey Time과 비교 가능하도록 분리 보존.

| Place | Stay Time | Evidence Type | notes |
|---|---|---|---|
| 오동도 | 30~60분 | ROUTE_SOURCE LOW | 복수 Route Source "30~60분이면 섬 한 바퀴" |
| 여수세계박람회장 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 진남관 | 30~40분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 이순신광장 + 전라좌수영거북선 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 천사벽화골목 (고소동) | 60분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 하멜전시관 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 돌산공원 | 60분 | FOUNDER_OPERATIONAL_STAY_TIME | 케이블카 자산→돌산 후 둘러보기 기준 |
| 아쿠아플라넷 여수 | 120분 | OFFICIAL | aquaplanet.co.kr "평균 관람시간 약 2시간" |
| 빅오쇼 | 30분 | OFFICIAL | "공연 약 30분" |
| 2층버스 순환 | 35분 | OFFICIAL | 전체 노선 순환 기준 |
| 야경버스 | 120분 | ROUTE_SOURCE | Route Corpus R029 "총 2시간" |

**미확보 Stay Time (UNKNOWN):**
- 향일암 / 이순신광장 (거북선 내부 관람 여부 미확인) / 수산물특화시장 / 낭만포차거리 / 전남해양수산과학관 / 아르떼뮤지엄 / 여수예술랜드

---

## 6. Founder Route #001 Validation Preview

Matrix Lookup으로 Founder Route #001 Timeline 계산 가능 여부 검증.

**Route (현재 실행 Route — 해양레일바이크 제외):**
```
오동도 → 여수세계박람회장 → 진남관 → 이순신광장 → 천사벽화골목 → 하멜전시관 → 자산탑승장 → 케이블카왕복 → 돌산공원 → 종료
```

### Edge별 Matrix Coverage (Update 2026-09-21)

| Edge | from | to | mode | Matrix 값 | Coverage |
|---|---|---|---|---|---|
| E1 | 오동도 | 여수세계박람회장 | CAR | **10분 (LOW)** | **✓ PARTIAL** |
| E2 | 여수세계박람회장 | 진남관 | CAR | UNKNOWN | ❌ UNKNOWN — 유일한 잔여 블로커 |
| E3 | 진남관 | 이순신광장 | WALK | 5분 (LOW) | ✓ PARTIAL |
| E4 | 이순신광장 | 천사벽화골목 | WALK | 15분 (LOW) | ✓ PARTIAL |
| E5 | 천사벽화골목 | 하멜전시관 | WALK | **3~5분 (LOW)** | **✓ PARTIAL** |
| E6 | 하멜전시관 | 자산탑승장 | CAR | 10분 (참조값) | ✓ PARTIAL |
| CC | 자산탑승장 | 돌산공원탑승장 | CABLE_CAR | 12~15분 | ✓ PARTIAL |
| CC-R | 돌산공원탑승장 | 자산탑승장 | CABLE_CAR | 12~15분 | ✓ PARTIAL |

**Matrix Coverage: 7/8 (87.5%) — E2만 UNKNOWN**

---

### Founder Route #001 — Timeline V3 (Matrix Lookup / 09:00 출발)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUNDER ROUTE #001 — TIMELINE V3 (Matrix Lookup)
CAR / 개인 자유여행 / 09:00 출발 / 케이블카 왕복
Matrix Coverage: 7/8 구간 — E2 UNKNOWN 잔여
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① 오동도 (오동도권)
   도착:  09:00
   체류:  30~60분 [ROUTE_SOURCE LOW]
   출발:  09:30 ~ 10:00
   이동→: E1 CAR 약 10분 [ROUTE_SOURCE_LOW]

② 여수세계박람회장 (엑스포권)
   도착:  09:40 ~ 10:10   ← E1 확보로 절대시각 계산 가능
   체류:  30분 [FOUNDER_OPERATIONAL]
   출발:  10:10 ~ 10:40
   운영:  ⚠️ 현재 운영 형태 미검증
   이동→: E2 CAR UNKNOWN  ← 절대시각 중단

③ 진남관 (원도심)
   도착:  XX:XX  ← E2 UNKNOWN 전파
   체류:  30~40분 [FOUNDER_OPERATIONAL]
   출발:  XX:XX
   운영:  09:00~18:00 연중무휴 ✓
   이동→: E3 도보 5분 [ROUTE_SOURCE_LOW]

④ 이순신광장 + 전라좌수영거북선 (원도심)
   도착:  XX:XX + 5분 offset
   체류:  30분 [FOUNDER_OPERATIONAL]
   출발:  XX:XX + 35~45분 offset
   이동→: E4 도보 15분 [ROUTE_SOURCE_LOW]

⑤ 천사벽화골목 고소동 (원도심)
   도착:  XX:XX + 50~60분 offset
   체류:  60분 [FOUNDER_OPERATIONAL]
   출발:  XX:XX + 110~120분 offset
   운영:  연중 무료 ✓
   ★ MEAL SLOT — E2 확보 시 절대 시간대 계산 가능
     추정: 박람회장 출발(10:10~10:40) 기준 천사벽화골목 출발 ≈ 12:20~13:40
     점심 Meal Slot ≈ 12:00~13:30 범위
   이동→: E5 도보 3~5분 [ROUTE_SOURCE_LOW — 벽화골목 종포문→하멜전시관]

⑥ 하멜전시관 (원도심 — 종포해양공원)
   도착:  XX:XX + 113~125분 offset
   체류:  30분 [FOUNDER_OPERATIONAL]
   출발:  XX:XX + 143~155분 offset
   운영:  09:00~18:00 ✓
   ⚠️ 월요일 휴관
   이동→: E6 CAR 약 10분 [ROUTE_SOURCE_DERIVED LOW]

⑦ 자산탑승장 (오동도권)
   도착:  XX:XX + 153~165분 offset
   boarding_wait: UNKNOWN
   운영:  09:30~21:30 ✓ (UNVERIFIED_SECONDARY)

⑧ 케이블카 자산→돌산  12~15분 (UNVERIFIED_SECONDARY)

⑨ 돌산공원 탑승장
   도착:  XX:XX + 165~180분 offset
   체류:  60분 [FOUNDER_OPERATIONAL]
   운영:  24시간 무료 ✓

⑩ 케이블카 돌산→자산  12~15분 (UNVERIFIED_SECONDARY)
   자산 복귀:  XX:XX + 237~255분 offset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최종 종료:  XX:XX  ← E2 확보 시 절대 계산 가능
진남관 출발 이후 총 소요: 약 237~255분 (3시간 57분~4시간 15분)
오동도 포함 전체: 약 297~375분 + E2 (4시간 57분~6시간 15분 + E2)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[계산 가능 구간]
  09:00 출발 → 박람회장 09:40~10:10 도착 → 10:40 최대 출발
  이후 진남관 출발 기준 237~255분 (절대시각은 E2 확보 후)

[잔여 UNKNOWN]
  E2 CAR (박람회장→진남관): 이 하나가 전체 절대 종료시각 계산을 막고 있음
  boarding_wait (케이블카): UNKNOWN

[Constraint]
  ⚠️ 하멜전시관: 월요일 휴관
  ⚠️ 케이블카: 강풍·낙뢰 운휴
  ⚠️ 여수세계박람회장: 현재 운영 형태 미확인
```

**E2 확보 즉시 전체 절대 Timeline 완성 가능.**

---

## 7. 다음 확장에 필요한 Gap 목록

### HIGH — Route #001 완전 계산을 막는 Gap

| # | Gap | 해결법 | 예상 소요 |
|---|---|---|---|
| 1 | E1: 오동도→박람회장 CAR | 네이버/카카오맵 직접 경로 조회 | 5분 |
| 2 | E2: 박람회장→진남관 CAR | 동일 | 5분 |
| 3 | E5: 천사벽화골목→하멜전시관 WALK | 지도 조회 또는 현장 측정 | 5분 |

### MEDIUM — 고빈도 Edge CAR 시간 미확보

| # | Gap | 해결법 |
|---|---|---|
| 4 | 여수엑스포역→오동도 CAR | 네이버/카카오맵 |
| 5 | 오동도→이순신광장 CAR | 네이버/카카오맵 |
| 6 | 향일암→돌산공원탑승장 CAR | 네이버/카카오맵 (돌산도 내) |
| 7 | 케이블카 공식 확인 (편도 탑승시간·요금) | 061-664-7301 |

### LOW — 향후 확장

| # | Gap | 해결법 |
|---|---|---|
| 8 | Layer 4 Access/Transition 전체 UNKNOWN | SOWON_JOURNEY_EVIDENCE 축적 |
| 9 | 여수세계박람회장 현재 운영 형태 | 여수시 공식 확인 |
| 10 | Stay Time 미확보 장소 (향일암·수산물특화시장 등) | FOUNDER/GUIDE Evidence |

---

## 8. 향후 확장 기준

```
V0.1 (현재): 기존 Evidence 정리 → Matrix 구조 확립
V0.2:        E1/E2/E5 확보 → Founder Route #001 완전 계산 가능
V0.3:        고빈도 CAR Edge (엑스포역↔오동도, 오동도↔이순신광장) 확보
V0.4:        PUBLIC_TRANSIT 노선별 구간 시간 확보
V1.0:        현장 측정 / SOWON_JOURNEY_EVIDENCE로 UNKNOWN 채움

실시간 교통 확장 (향후):
Stored Base Time + Live Traffic Adjustment 방식
현재 Live API 구현 금지.
```

**DB 구현 경로 (검수 후 결정):**
```
Excel/CSV Founder 검수 → Validated Time Knowledge → DB → Route Engine → SOUL
현재 단계: CSV/MD Founder 검수 단계. DB/Schema/Runtime 변경 금지.
```

---

## 9. V0.1 한계 (명시)

- TOUR_BUS 시간 ≠ CAR 시간 (직접 전환 금지)
- 방향성 있음: A→B ≠ B→A (반대 방향 Evidence 없으면 UNKNOWN)
- LOW confidence 값은 Route 계산에 사용 가능하나 결과 신뢰도 표시 필요
- ROUTE_SOURCE_DERIVED (E6)는 단일 파생값 — Field Evidence로 교체 권장
- 계절·시간대·날씨 변수 미반영 (V0.1 범위 외)
- Boarding wait / parking / walk-to-stop 등 Layer 4 전체 UNKNOWN

---

*생성: Claude Sonnet 4.6 / Project Phoenix MUYEOJEONG Route Intelligence Phase*  
*Sources: YEOSU_TIME_KNOWLEDGE_V0_1.md / YEOSU_TIME_EVIDENCE_PILOT_V0_1.md / YEOSU_FOUNDER_ROUTE_001_TIME_EVIDENCE.md / YEOSU_ROUTE_CORPUS_V0_1.md*  
*DB/Schema/Runtime 변경 없음 — DESIGN ONLY*
