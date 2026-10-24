# Yeosu Founder Route #001 — Time Evidence
생성일: 2026-09-21
상태: EVIDENCE COLLECTION — 구현 금지
원칙: Founder 확정 순서 수정 금지 / 임의 시간 생성 금지 / Evidence 없으면 UNKNOWN

---

## Founder Route #001 확정 순서

Founder가 실제 사용한 Route Evidence. 임의 최적화·변경 금지.

```
① 오동도
② 여수세계박람회장
③ 해양레일바이크
④ 진남관
⑤ 이순신광장 (전라좌수영거북선)
⑥ 천사벽화골목 (고소동)
⑦ 하멜전시관
⑧ 자산 탑승장 (케이블카 Access Point — Founder 확정)
⑨ 여수해상케이블카
```

Transport Mode: **CAR** (INDIVIDUAL_FREE_TRAVEL) — Founder 2026-09-21 확정  
케이블카: **ROUND_TRIP** (자산→돌산→자산) — Founder 2026-09-21 확정  
해양레일바이크: **NOT_OPERATING** (FOUNDER_EVIDENCE 강화) — 2026-09-21

---

## Stop별 Evidence

---

### ① 오동도

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | ATTRACTION | — | — |
| area_zone | 오동도권 | — | — |
| travel_time_from_prev | 해당 없음 (출발점) | — | — |
| opening_hours | 상시 개방 (별도 폐장 없음) | ROUTE_SOURCE (복수 코스) | UNVERIFIED (공식 직접 확인 없음) |
| stay_time_min | 30분 | ROUTE_SOURCE (복수 코스 "30~60분이면 섬 한 바퀴") | UNVERIFIED_SECONDARY |
| stay_time_recommended | 60분 | 동일 | 동일 |
| stay_time_relaxed | UNKNOWN | — | — |
| admission_fee | 무료 (입도 무료) | — | UNVERIFIED |
| access_transition_overhead | UNKNOWN | — | — |
| operating_constraint | 없음 (별도 제약 미확인) | — | UNKNOWN |
| constraint_status | STATIC | — | — |
| evidence_source | ROUTE_SOURCE | — | — |
| evidence_status | UNVERIFIED_SECONDARY | — | — |

---

### ② 여수세계박람회장

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | ATTRACTION / EVENT_VENUE | — | — |
| area_zone | 엑스포권 | — | — |
| travel_time_from_prev (오동도→박람회장) | UNKNOWN | — | — |
| distance_note | 오동도와 인접 권역. 도보 가능 가능성 있으나 미확인 | 지도 기반 추정 — 사용 금지 | — |
| current_operation_status | UNKNOWN | — | — |
| notes | 2012 여수세계박람회 이후 공원화된 것으로 알려져 있으나 공식 현재 운영 형태 미검증 | — | NEEDS_OFFICIAL_VERIFY |
| stay_time | UNKNOWN | — | — |
| operating_constraint | UNKNOWN | — | — |
| evidence_status | UNKNOWN | — | — |

---

### ③ 해양레일바이크

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | LEISURE | — | — |
| area_zone | 오동도권 (돌산대교 인근) | Batch 01 | — |
| travel_time_from_prev (박람회장→레일바이크) | UNKNOWN | — | — |
| **운영 상태** | **CONFLICT_REQUIRES_RECHECK** | — | — |
| Batch 01 공식값 | 운영 중 (railtrip.co.kr, 2026-09-20) | OFFICIAL_WEBSITE | VERIFIED_CURRENT |
| Founder Evidence | 영업 안 함 (현장 인지) | FOUNDER_EVIDENCE | FOUNDER_EVIDENCE — 공식 확정 불가 |
| 재검증 필요 여부 | YES | — | NEEDS_OFFICIAL_VERIFY |
| stay_time | 레일 코스: 약 30분 내외 추정 (UNVERIFIED — 사용 금지) | — | UNKNOWN |
| current_hours | 3~10월 09:00~18:00 / 1·2·11·12월 09:00~17:00 (Batch 01) | OFFICIAL_WEBSITE | VERIFIED_CURRENT (운영 여부 재검증 전까지 이 시간도 CONDITIONAL) |
| Route #001 처리 | HISTORICAL_EVIDENCE — 현재 실행 가능성 미확인 | — | — |
| operating_constraint | 기상악화(풍속 20m/s 이상) 시 운행 중단 | Batch 01 | VERIFIED_CURRENT |

---

### ④ 진남관

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | ATTRACTION (역사·문화) | — | — |
| area_zone | 원도심 | — | — |
| travel_time_from_prev (레일바이크→진남관) | UNKNOWN | — | — |
| current_operation | 운영 중, 연중무휴 | GOVERNMENT_PORTAL (yeosu.go.kr) | VERIFIED_CURRENT (Batch 02) |
| opening_hours | 동절기 09:00~17:00 / 하절기 09:00~18:00 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| season_boundary | UNKNOWN (동/하절기 전환 기준일 미확인) | — | UNKNOWN |
| admission_fee | 무료 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| stay_time | UNKNOWN (단독 방문 기준) | — | — |
| parking | 1시간 무료 (승용차 80대) | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| operating_constraint | 연중무휴 | — | STATIC |
| evidence_status | VERIFIED_CURRENT (운영·시간·요금) / UNKNOWN (체류시간) | — | — |

---

### ⑤ 이순신광장 (전라좌수영거북선)

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | ATTRACTION (역사·문화·광장) | — | — |
| area_zone | 원도심 | — | — |
| travel_time_from_prev (진남관→이순신광장) | UNKNOWN | — | — |
| distance_note | 동일 원도심 권역. 진남관과 이순신광장 모두 동문로 인근. | 지도 기반 — 정확 시간은 UNKNOWN | — |
| current_operation | 이순신광장 = 24시간 개방 (야외 광장) | ROUTE_SOURCE (복수 코스) | UNVERIFIED (공식 직접 없음) |
| 전라좌수영거북선 | 내부 유물 관람 가능 여부 미확인 | — | UNKNOWN |
| stay_time | UNKNOWN | — | — |
| operating_constraint | 광장 자체: 없음 / 거북선 내부: UNKNOWN | — | — |
| evidence_status | UNVERIFIED (광장 개방) / UNKNOWN (거북선 내부) | — | — |

---

### ⑥ 천사벽화골목 (고소동)

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | ATTRACTION (문화·관광) | — | — |
| area_zone | 원도심 | — | — |
| current_official_name | 고소동 천사벽화골목 | GOVERNMENT_PORTAL (yeosu.go.kr) | VERIFIED_CURRENT (Batch 02) |
| current_address | 여수시 고소동 일원 (진입로 4개) | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| current_operation | 연중 무료 개방. 1,650m 10개 구간. | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| travel_time_from_prev (이순신광장→천사벽화골목) | WALK: 15분 (trip.com, ROUTE_SOURCE, LOW confidence) | ROUTE_SOURCE | LOW |
| stay_time | UNKNOWN | — | — |
| operating_constraint | 없음 (연중 개방) | — | STATIC |
| evidence_status | VERIFIED_CURRENT (운영) / UNKNOWN (체류시간) | — | — |

---

### ⑦ 하멜전시관

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | ATTRACTION (역사·문화) | — | — |
| area_zone | 원도심 (종포해양공원 내) | — | — |
| travel_time_from_prev (천사벽화골목→하멜전시관) | UNKNOWN | — | — |
| current_operation | 운영 중 | GOVERNMENT_PORTAL (yeosu.go.kr) | VERIFIED_CURRENT (Batch 02) |
| opening_hours | 09:00~18:00 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| closed_days | 매주 월요일 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| admission_fee | 무료 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| location | 종포해양공원 내 위치 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| stay_time | UNKNOWN (단독 방문 기준) | — | — |
| parking | 승용차 20대, 대형차 5대 무료 | GOVERNMENT_PORTAL | VERIFIED_CURRENT |
| operating_constraint | 월요일 휴관 | — | STATIC |
| evidence_status | VERIFIED_CURRENT (운영·시간·요금) / UNKNOWN (체류시간) | — | — |

---

### ⑧ 자산 탑승장 (케이블카 Access Point)

Founder Route #001에서 케이블카 Access Point로 확정.

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | BOARDING_POINT / ACCESS_POINT | — | — |
| entity_note | 여수해상케이블카 자산 탑승장 (자산정류장) | — | — |
| address | 전남 여수시 수정동 332-55 (오동도 주차타워 권역) | yeosu.go.kr | VERIFIED_CURRENT |
| area_zone | 오동도권 | — | — |
| travel_time_from_prev (하멜전시관→자산 탑승장) | UNKNOWN | — | — |
| operating_hours | 09:30~21:30 (UNVERIFIED_SECONDARY — 복수 비공식 Source 일치) | 나무위키+블로그 | UNVERIFIED_SECONDARY |
| boarding_wait | UNKNOWN | — | — |
| access_overhead | UNKNOWN (탑승장 접근 후 티켓 구매·탑승 대기) | — | — |
| operating_constraint | 강풍·낙뢰 시 임시 운휴 | 복수 Source | VERIFIED_CONSISTENT |
| formal_verify | BUSINESS_DIRECT_VERIFY_REQUIRED (061-664-7301) | — | — |
| evidence_status | UNVERIFIED_SECONDARY | — | — |

---

### ⑨ 여수해상케이블카

| 항목 | 값 | Source | Evidence Status |
|---|---|---|---|
| category | EXPERIENCE + TRANSPORT_CONNECTOR | — | — |
| entity_structure | 자산 탑승장 ↔ [케이블카] ↔ 돌산공원 탑승장 | — | — |
| experience_duration | CONFLICT: 약 10분 (나무위키) / 12~13분 (블로그) | 나무위키 vs 블로그 | CONFLICT_REQUIRES_RECHECK |
| operating_hours | 09:30~21:30 (UNVERIFIED_SECONDARY) | 복수 비공식 Source | UNVERIFIED_SECONDARY |
| 요금 | CONFLICT: 편도 14,000원 (나무위키) / 왕복 17,000원 (블로그) — 편도/왕복 구분 불명 | 나무위키 vs 블로그 | CONFLICT_REQUIRES_RECHECK |
| exit_point | 돌산공원 탑승장 (돌산읍 돌산로 3600-1) | yeosu.go.kr | VERIFIED_CURRENT |
| exit_zone | 돌산 | — | — |
| operating_constraint | 강풍·낙뢰 운휴 | 복수 Source | VERIFIED_CONSISTENT |
| evidence_status | UNVERIFIED_SECONDARY (시간·운영) / CONFLICT (편도시간·요금) | — | — |

---

## Travel Time Between Stops

Transport Mode: Founder 미명시. CAR/TAXI/PUBLIC_TRANSIT 모두 UNKNOWN.

| Edge | CAR | TAXI | PUBLIC_TRANSIT | WALK | Source | 비고 |
|---|---|---|---|---|---|---|
| 오동도 → 박람회장 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | — | 동일 권역 내 — 짧을 가능성, 추정 금지 |
| 박람회장 → 해양레일바이크 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | — | 레일바이크 위치: 돌산대교 인근 |
| 해양레일바이크 → 진남관 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | — | 권역 전환 (오동도권→원도심) |
| 진남관 → 이순신광장 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | — | 동일 원도심 권역 |
| 이순신광장 → 천사벽화골목 | UNKNOWN | UNKNOWN | UNKNOWN | 15분 (LOW) | ROUTE_SOURCE (trip.com) | 도보 15분 단일 Source — LOW confidence |
| 천사벽화골목 → 하멜전시관 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | — | 동일 원도심 권역 |
| 하멜전시관 → 자산 탑승장 | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | — | 오동도 주차타워 방면 |
| 자산 탑승장 → (탑승) → 돌산공원 탑승장 | — | — | — | — | 케이블카 편도 약 10~13분 (CONFLICT) | Layer 3 아님 — Experience 시간 |

---

## [UPDATE 2026-09-21] Founder Decision Confirmed

Founder Route #001에 대한 Founder 최종 결정 사항. 이하 기준으로 Timeline 계산 진행.

| 결정 항목 | 확정값 | 비고 |
|---|---|---|
| Transport Mode | CAR | 기본값. USER_EXPLICIT > default |
| Traveler Type | INDIVIDUAL_FREE_TRAVEL | 개인 자유여행 |
| 케이블카 이용 방식 | ROUND_TRIP (자산→돌산→자산) | 개인 기준 왕복 |
| 해양레일바이크 | NOT_OPERATING | FOUNDER_EVIDENCE 강화 — 실행 대상 제외 |
| 단체(5인 이상) | Passenger Route ≠ Vehicle Route | 케이블카 편도 시 버스와 합류 분리. 이번 Route에서는 미적용 |

**Route Intelligence 발견 (2026-09-21):**
- 단체 케이블카 편도 운영 시: 승객은 케이블카 이동, 버스는 별도 도로로 이동 후 돌산공원 탑승장에서 재합류
- 이 구조는 단체 운영 전용. 개인 자유여행에는 해당 없음
- 향후 단체 Route 설계 시 별도 분기 필요

---

## A. Evidence Report

### 확인된 Current Fact (VERIFIED_CURRENT)

| Entity | 확인 항목 | Source |
|---|---|---|
| 진남관 | 운영 중 / 09:00~17:00(동) ~18:00(하) / 무료 / 연중무휴 / 주차 1시간 무료 | Batch 02 — OFFICIAL |
| 하멜전시관 | 운영 중 / 09:00~18:00 / 월 휴관 / 무료 / 종포해양공원 내 | Batch 02 — OFFICIAL |
| 천사벽화골목 | 운영 중 / 연중 무료 / 1,650m | Batch 02 — OFFICIAL |
| 자산 탑승장 주소 | 수정동 332-55 / 자산4길 39 (동일 위치, 표기 차이) | yeosu.go.kr + triple.guide |
| 돌산공원 탑승장 주소 | 돌산읍 돌산로 3600-1 | yeosu.go.kr — OFFICIAL |
| 케이블카 강풍 운휴 | 강풍·낙뢰 시 임시 운휴 | 복수 Source |
| 케이블카 운영시간 | 09:30~21:30 (복수 비공식 Source 일치 — 성수기/토요일 연장 가능) | 나무위키+블로그+오마포 — UNVERIFIED_SECONDARY |
| 케이블카 요금 (왕복) | 일반 캐빈 17,000원 / 크리스탈 24,000원 | 복수 블로그 일치 — UNVERIFIED_SECONDARY |
| 케이블카 편도 탑승 소요 | 12~15분 (복수 Source 수렴: 12~13분, 13~15분) | UNVERIFIED_SECONDARY — CONFLICT 10분 → 범위 좁힘 |
| 케이블카 왕복 탑승 소요 | 약 25~30분 (탑승만, 돌산공원 체류 제외) | UNVERIFIED_SECONDARY |
| 진남관 → 이순신광장 (도보) | 약 5분 내외 | 블로그 — ROUTE_SOURCE LOW |

### Founder Evidence (승격 금지)

| 항목 | 내용 |
|---|---|
| 해양레일바이크 운영 상태 | "영업 안 함" — CONFLICT_REQUIRES_RECHECK (Batch 01 공식 "운영 중"과 불일치) |
| 케이블카 Access Point | 하멜전시관 → 자산 탑승장 선택 (Route #001 기준) |
| Access Point 권역 원칙 | 오동도권→자산 / 돌산권→돌산공원 / 원도심→양쪽 후보 |

### UNKNOWN 목록 (2026-09-21 업데이트)

**해소된 항목 (CONFIRMED → REMOVED):**
- ~~케이블카 운영시간~~ → UNVERIFIED_SECONDARY (복수 Source 일치: 09:30~21:30)
- ~~케이블카 요금 CONFLICT~~ → 왕복 기준 일치 (17,000원 일반 / 24,000원 크리스탈)
- ~~Transport Mode UNKNOWN~~ → CAR 확정 (Founder 2026-09-21)
- ~~케이블카 편도/왕복 UNKNOWN~~ → ROUND_TRIP 확정 (Founder 2026-09-21)

**여전히 UNKNOWN:**
- 여수세계박람회장 현재 운영 형태
- 해양레일바이크 현재 운영 여부 (CONFLICT — Founder Evidence vs 공식 사이트)
- 이순신광장 전라좌수영거북선 내부 관람 조건
- 케이블카 운영시간·요금 공식 확인 미완료 (061-664-7301 — BUSINESS_DIRECT_VERIFY_REQUIRED)
- 모든 Stop 체류시간 (오동도 30~60분, 천사벽화골목 최소 30분 이상 추정 제외)
- 모든 Edge CAR 이동시간 (7개 전체 — 지도 기반 정확 값 없음)

### Correction 완료

| 항목 | 내용 |
|---|---|
| 해양레일바이크 | VERIFIED_CURRENT 유지 + CONFLICT_REQUIRES_RECHECK 추가 |
| 케이블카 Entity | 단일 Place → 자산 탑승장 + 케이블카 + 돌산공원 탑승장 3요소 구조 |
| 케이블카→돌산공원 Edge | 무효화 → CORRECTED/PARTIAL_VALID |

---

## B. Founder View — CAR 기준 실제 여행 일정표

**Transport Mode: CAR / Traveler Type: INDIVIDUAL_FREE_TRAVEL**  
**출발 기준: 09:00**  
**케이블카: ROUND_TRIP (자산→돌산→자산)**

범례: `✓` = 운영 확인됨 / `⚠️` = 운영 불확실 / `XX:XX` = UNKNOWN (계산 불가) / `~` = 추정 (Evidence 없음, 사용 금지)

---

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUNDER ROUTE #001 — TIMELINE (CAR / 개인 / 09:00 출발)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① 오동도 (오동도권)
   도착:  09:00 [출발점 기준]
   체류:  30~60분 (ROUTE_SOURCE — LOW confidence)
   출발:  09:30~10:00
   운영:  상시 개방 (공식 미확인, UNVERIFIED)
   CAR →: UNKNOWN   ← Edge ①→② 미확보

② 여수세계박람회장 (엑스포권)
   도착:  XX:XX
   체류:  UNKNOWN
   출발:  XX:XX
   운영:  UNKNOWN (공원화 추정, 공식 미검증)
   CAR →: UNKNOWN   ← Edge ②→③ 미확보
   비고:  오동도권·엑스포권 인접. CAR 단거리 예상이나 정확값 없음.

③ 해양레일바이크 (오동도권 — 돌산대교 인근)
   ⚠️ NOT_OPERATING (FOUNDER_EVIDENCE)
      Batch 01 공식(railtrip.co.kr 2026-09-20)과 불일치 → CONFLICT_REQUIRES_RECHECK
      현재 일정표에서 실행 대상 제외
   도착:  XX:XX   [통과 또는 스킵]
   체류:  N/A
   CAR →: UNKNOWN   ← Edge ③→④ 미확보
   비고:  권역 전환 (오동도권→원도심). 상대적으로 긴 이동 예상.

④ 진남관 (원도심)
   도착:  XX:XX
   체류:  UNKNOWN
   출발:  XX:XX
   운영:  09:00~18:00 (하절기 기준) / 연중무휴 / 무료 ✓
   CAR →: 약 2~3분 / 도보 5분 내외 (ROUTE_SOURCE — LOW)
   비고:  진남관과 이순신광장은 동일 원도심 권역. 주차 overhead 고려 시 도보 유리.

⑤ 이순신광장 (원도심)
   도착:  XX:XX
   체류:  UNKNOWN
   출발:  XX:XX
   운영:  광장 24시간 개방 (UNVERIFIED) / 거북선 내부 UNKNOWN
   도보 →: 도보 15분 (ROUTE_SOURCE trip.com — LOW confidence) / CAR: overhead 큼
   비고:  진남관→이순신광장이 도보 5분이면, 이순신광장→천사벽화골목도 도보 권장.
           고소동 진입로 4곳 중 이순신광장 방면 진입 가능.

⑥ 천사벽화골목 고소동 (원도심)
   도착:  XX:XX
   체류:  UNKNOWN (1,650m 코스 — 최소 30분 이상 예상, ESTIMATE_ONLY)
   출발:  XX:XX
   운영:  연중 무료 개방 ✓
   CAR →: UNKNOWN   ← Edge ⑥→⑦ 미확보
   비고:  원도심 내 도보 이동 권장. 하멜전시관도 종포해양공원 내 위치.

⑦ 하멜전시관 (원도심 — 종포해양공원 내)
   도착:  XX:XX
   체류:  UNKNOWN
   출발:  XX:XX
   운영:  09:00~18:00 / 무료 ✓
   ⚠️ 월요일 휴관 — 월요일 방문 불가
   CAR →: UNKNOWN   ← Edge ⑦→⑧ 미확보
   비고:  자산탑승장(자산4길 39)까지 CAR 이동. 주차 후 탑승장 접근.

⑧ 자산탑승장 (오동도권 — 오동도 주차타워 권역)
   도착:  XX:XX
   boarding_wait:  UNKNOWN
   운영:  09:30~21:30 ✓ (UNVERIFIED_SECONDARY — 복수 Source 일치)
   → 케이블카 탑승

⑨ 여수해상케이블카 왕복 (자산→돌산→자산)
   편도 탑승:  약 12~15분 (UNVERIFIED_SECONDARY — 복수 Source 수렴)
   왕복 탑승:  약 25~30분 (탑승만, 돌산공원 체류 제외)
   운영:  09:30~21:30 ✓ (UNVERIFIED_SECONDARY)
   요금:  일반 캐빈 왕복 17,000원 / 크리스탈 24,000원 (UNVERIFIED_SECONDARY)
   ⚠️ 강풍·낙뢰 시 운휴 ✓
   돌산공원 체류:  UNKNOWN (Founder 결정값 없음)
   자산탑승장 복귀:  XX:XX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
총 Route 완료:  XX:XX (계산 불가)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 총 예상 Route Time (2026-09-21 업데이트)

**계산 가능한 구간 (근거값 보유):**
| 구간 | 시간 | 신뢰도 |
|---|---|---|
| 오동도 체류 | 30~60분 | LOW (ROUTE_SOURCE) |
| 케이블카 왕복 탑승 | 25~30분 | UNVERIFIED_SECONDARY |
| 진남관→이순신광장 이동 | 도보 5분 / CAR 2~3분 | LOW (ROUTE_SOURCE) |
| **계산 가능 소계** | **약 60~95분** | **Low confidence — 체류+편측 이동만** |

**계산 불가 (UNKNOWN 유지):**
- 7개 CAR Edge 이동시간 (지도 기반 값 미확보)
- 7개 Stop 체류시간 (오동도 제외)
- 돌산공원 체류시간 (케이블카 왕복 시)
- 해양레일바이크: NOT_OPERATING → 시간 0, 공백 발생

→ **총 Route Time: 계산 불가** — UNKNOWN이 시간 대부분을 차지

---

### Route를 막는 UNKNOWN (2026-09-21 잔여)

| 블로커 | 내용 | 해결 방법 | 우선순위 |
|---|---|---|---|
| 7개 CAR Edge 이동시간 | 지도 앱 경로 검색값 없음 | 네이버/카카오맵 경로 직접 조회 필요 | HIGH |
| 모든 Stop 체류시간 | Evidence 없음 | Field Evidence 또는 Founder 확인 | HIGH |
| 해양레일바이크 운영 여부 | FOUNDER_EVIDENCE vs Batch 01 공식 불일치 | railtrip.co.kr 재확인 / 직접 전화 | MEDIUM |
| 케이블카 공식 확인 | 운영시간·요금 공식 미확인 | 061-664-7301 전화 | MEDIUM |
| 여수박람회장 운영 형태 | 공원화 추정, 미검증 | 여수시 공식 확인 | LOW |

---

### Founder 질문 — 해소 완료 (3개 → 완료)

1. ~~교통수단~~ → **CAR 확정** (2026-09-21)
2. ~~케이블카 편도/왕복~~ → **ROUND_TRIP 확정** (2026-09-21)
3. ~~해양레일바이크 현재 상태~~ → **NOT_OPERATING (FOUNDER_EVIDENCE 강화)** (2026-09-21)

**잔여 미해결:**
- 각 Stop 체류시간 (Founder 예상값 또는 Field Evidence 필요)
- 돌산공원에서 얼마나 머무는지 (케이블카 왕복 후)

---

## ONE NEXT ACTION (2026-09-21 업데이트)

**Founder Decision 3개 모두 완료.** 다음 우선순위:

1. **7개 CAR Edge 이동시간** — 네이버지도·카카오맵 경로 조회로 확보 가능
   - 오동도 → 박람회장, 박람회장 → 레일바이크위치, 레일바이크위치 → 진남관
   - 이순신광장 → 천사벽화골목, 천사벽화골목 → 하멜전시관
   - 하멜전시관 → 자산탑승장
   - (진남관 → 이순신광장: 도보 5분 LOW, CAR 사용 비권장 — 확인 후 결정)

2. **Stop 체류시간** — Founder 예상 소요시간 확인 또는 Field Evidence
   - 최소: 박람회장, 진남관, 이순신광장, 천사벽화골목, 하멜전시관, 돌산공원(케이블카 왕복 후)

3. **케이블카 공식 확인** — 061-664-7301 (운영시간·요금 UNVERIFIED_SECONDARY → VERIFIED_CURRENT)

위 3개 해소 시 전체 Timeline 계산 가능.

**이 파일 업데이트 이후 자동으로 다음 단계 구현하지 않음. Founder 검수 대기.**

---

## [UPDATE 2026-09-21 B] Stay Time + CAR Edge + Timeline V2

### 현재 실행 Route (해양레일바이크 제외 — 2026-09-21 확정)

해양레일바이크는 원본 Route Evidence에 보존. 현재 실행에서는 제외.

```
① 오동도
② 여수세계박람회장
③ 진남관
④ 이순신광장 (전라좌수영거북선)
⑤ 천사벽화골목 (고소동)
⑥ 하멜전시관
⑦ 자산탑승장
⑧ 케이블카 자산→돌산
⑨ 돌산공원 (60분 체류)
⑩ 케이블카 돌산→자산
→ 종료
```

---

### FOUNDER_OPERATIONAL_STAY_TIME Evidence

Founder 실제 여행 운영 경험값. 공식 권장 체류시간 아님. 승격 금지.  
향후 Guide Evidence / SOWON Actual Journey Time과 비교 가능하도록 분리 보존.

| Stop | 체류시간 | Evidence Type | 비고 |
|---|---|---|---|
| 오동도 | 30~60분 | ROUTE_SOURCE LOW | 기존 값 유지 — Source 다름 |
| 여수세계박람회장 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 진남관 | 30~40분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 이순신광장 + 전라좌수영거북선 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 천사벽화골목 (고소동) | 60분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 하멜전시관 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME | Founder 운영 기준 |
| 돌산공원 | 60분 | FOUNDER_OPERATIONAL_STAY_TIME | 케이블카 자산→돌산 이후 둘러보기 기준 |

---

### CAR Edge Time Evidence (2026-09-21 Update)

현재 실행 Route 기준 Edge 목록. 도보 처리 구간 명시.

| Edge | Mode | 시간 | Source | Evidence Status |
|---|---|---|---|---|
| E1: 오동도→박람회장 | CAR | UNKNOWN | — | 인접 권역. 직접 CAR Evidence 없음. 참조: E001 TOUR_BUS 10분(엑스포역→오동도 역방향) |
| E2: 박람회장→진남관 | CAR | UNKNOWN | — | 직접 CAR Evidence 없음. 참조: E002-PUBLIC 12분(엑스포역→이순신광장, LOW) — 진남관은 이순신광장보다 엑스포역에 더 가까운 원도심 |
| E3: 진남관→이순신광장 | WALK | 약 5분 | ROUTE_SOURCE LOW (블로그) | 동일 원도심. CAR 이용 비권장 (주차 overhead) |
| E4: 이순신광장→천사벽화골목 | WALK | 15분 | ROUTE_SOURCE LOW (trip.com) | 동일 원도심. CAR 이용 비권장 |
| E5: 천사벽화골목→하멜전시관 | WALK | UNKNOWN | — | 동일 원도심. "벽화골목이 하멜등대 방향 1,004m" 언급(여수시청). 연결 구조 가능성이나 도보 시간 Evidence 없음 |
| E6: 하멜전시관→자산탑승장 | CAR | 약 10분 (참조값) | E004-TAXI (trip.com LOW) — 고소동→케이블카자산 TAXI 10분 | ROUTE_SOURCE_DERIVED LOW. 하멜전시관은 고소동과 동일 원도심 권역 |

**CAR Edge 조사 결과 요약:**
- WebSearch (2026-09-21): E1/E2 직접 이동시간값 미검출. 검색 결과 네이버지도·카카오맵 직접 조회 권장.
- E6: 기존 Time Knowledge E004-TAXI (고소동→케이블카 10분) 참조값 적용. 단일 Source LOW.
- E1/E2 UNKNOWN 유지. 임의 값 생성 금지.

---

### Founder View — Timeline V2 (CAR / 09:00 출발)

**출발: 09:00 / Transport: CAR / Traveler: INDIVIDUAL_FREE_TRAVEL / Cable Car: ROUND_TRIP**

범례: `✓`=운영확인 / `⚠️`=주의 / `XX:XX`=UNKNOWN / `[F]`=FOUNDER_OPERATIONAL_STAY_TIME / `[R]`=ROUTE_SOURCE LOW

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FOUNDER ROUTE #001 — TIMELINE V2
CAR / 개인 자유여행 / 09:00 출발 / 케이블카 왕복
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

① 오동도 (오동도권)
   도착:  09:00
   체류:  30~60분 [R]
   출발:  09:30~10:00
   운영:  상시 개방 (UNVERIFIED)
   이동→: CAR, UNKNOWN  ← E1 직접값 없음 (엑스포역↔오동도 TOUR_BUS 10분 참조만)

② 여수세계박람회장 (엑스포권)
   도착:  XX:XX  ← E1 UNKNOWN 전파
   체류:  30분 [F]
   출발:  XX:XX
   운영:  UNKNOWN (공원화 추정, 공식 미검증) ⚠️
   이동→: CAR, UNKNOWN  ← E2 직접값 없음 (엑스포역→이순신광장 PUBLIC 12분 참조만)

③ 진남관 (원도심)
   도착:  XX:XX  ← E2 UNKNOWN 전파
   체류:  30~40분 [F]
   출발:  XX:XX
   운영:  09:00~18:00 연중무휴 ✓
   주차:  1시간 무료 ✓
   이동→: 도보 약 5분 [R]  (CAR 이용 비권장 — 주차 overhead)

④ 이순신광장 + 전라좌수영거북선 (원도심)
   도착:  XX:XX + 5분 offset  [진남관 출발 기준 상대값]
   체류:  30분 [F]
   출발:  XX:XX + 35~45분 offset
   운영:  광장 상시 ✓ / 거북선 내부 UNKNOWN ⚠️
   이동→: 도보 15분 [R]

⑤ 천사벽화골목 고소동 (원도심)
   도착:  XX:XX + 50~60분 offset  [진남관 출발 기준]
   체류:  60분 [F]
   출발:  XX:XX + 110~120분 offset
   운영:  연중 무료 ✓
   비고:  1,650m 코스. 하멜등대 방향 1,004m로 이어지는 구조(여수시청).
   이동→: 도보 UNKNOWN  ← E5 직접값 없음

   ★ MEAL SLOT — 식당 미지정
     예상 시간대: 천사벽화골목 체류 중 또는 출발 직후
     절대시각: E1/E2 UNKNOWN으로 확정 불가
     (E1+E2가 확보되면 절대 Meal 시간대 계산 가능)

⑥ 하멜전시관 (원도심 — 종포해양공원)
   도착:  XX:XX  ← E5 UNKNOWN으로 절대시각 확정 불가
   체류:  30분 [F]
   출발:  XX:XX
   운영:  09:00~18:00 ✓
   ⚠️ 월요일 휴관
   이동→: CAR 약 10분 (E004-TAXI 참조값, ROUTE_SOURCE_DERIVED LOW)

⑦ 자산탑승장 (오동도권)
   도착:  XX:XX + 10분 offset  [하멜전시관 출발 기준 상대값]
   boarding_wait:  UNKNOWN
   운영:  09:30~21:30 ✓ (UNVERIFIED_SECONDARY)

⑧ 케이블카 자산→돌산
   탑승 소요:  약 12~15분 (UNVERIFIED_SECONDARY)

⑨ 돌산공원 탑승장 도착
   체류:  60분 [F]  ← 공원 둘러보기 기준
   운영:  24시간 무료 ✓

⑩ 케이블카 돌산→자산 복귀
   탑승 소요:  약 12~15분 (UNVERIFIED_SECONDARY)
   자산탑승장 복귀:  XX:XX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
최종 종료:  XX:XX (E1/E2/E5 UNKNOWN으로 절대시각 계산 불가)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 총 계산 가능 Route Time (V2)

**절대시각 계산 불가 구간 (E1/E2/E5 UNKNOWN):**

진남관 출발 기준 **상대 누적 시간 (계산 가능 구간)**:

| 구간 | 시간 | 비고 |
|---|---|---|
| 진남관 체류 | 30~40분 | FOUNDER_OPERATIONAL_STAY_TIME |
| 이동 도보 | 5분 | ROUTE_SOURCE LOW |
| 이순신광장 체류 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME |
| 이동 도보 | 15분 | ROUTE_SOURCE LOW |
| 천사벽화골목 체류 | 60분 | FOUNDER_OPERATIONAL_STAY_TIME |
| E5 이동 (천사벽화골목→하멜) | UNKNOWN | Evidence 없음 |
| 하멜전시관 체류 | 30분 | FOUNDER_OPERATIONAL_STAY_TIME |
| E6 이동 (하멜→자산탑승장) | 약 10분 | ROUTE_SOURCE_DERIVED LOW |
| 케이블카 탑승 왕복 | 25~30분 | UNVERIFIED_SECONDARY |
| 돌산공원 체류 | 60분 | FOUNDER_OPERATIONAL_STAY_TIME |
| **계산 가능 소계** | **265~270분 + E5** | E5 UNKNOWN 포함 불가 |

전체 Route 소요 (오동도 포함):
- 오동도: 30~60분
- E1 + 박람회장 30분 + E2: UNKNOWN
- 상기 계산 가능 소계: 265~270분 + E5
- **총 Route Time: 계산 불가 (E1/E2/E5 UNKNOWN)**

---

### 남은 UNKNOWN + Constraint (V2 업데이트)

| UNKNOWN 항목 | 이유 | 해결법 | 우선순위 |
|---|---|---|---|
| E1 CAR (오동도→박람회장) | 직접 Evidence 없음 | 네이버/카카오맵 직접 조회 | HIGH |
| E2 CAR (박람회장→진남관) | 직접 Evidence 없음 | 네이버/카카오맵 직접 조회 | HIGH |
| E5 도보 (천사벽화골목→하멜전시관) | 직접 Evidence 없음 | 현장 측정 또는 지도 조회 | HIGH |
| boarding_wait (케이블카) | 시간대별 상이 | 운영 전화 / Founder 경험값 | MEDIUM |
| 거북선 내부 관람 여부 | 공식 확인 없음 | 공식 확인 | LOW |
| 여수세계박람회장 운영 형태 | 공원화 추정, 미검증 | 공식 확인 | LOW |
| 주차 overhead (장소별) | 장소별 상이 | Guide Field Evidence | LOW |
| 케이블카 공식 확인 | UNVERIFIED_SECONDARY | 061-664-7301 | MEDIUM |

**Constraint:**
- ⚠️ 하멜전시관: 월요일 휴관 → 월요일 일정 불가
- ⚠️ 케이블카: 강풍·낙뢰 시 운휴 → 기상 확인 필요
- ⚠️ 해양레일바이크: CONFLICT_REQUIRES_RECHECK (원본 Route Evidence 보존, 현재 실행 제외)
- ⚠️ 여수세계박람회장: 현재 운영 형태 미확인 — 방문 불가 시 Route 수정 필요

**해소되면 계산 가능해지는 항목:**
- E1 확보 → 박람회장 절대 도착시각 확정
- E2 확보 → 진남관 절대 도착시각 확정 → 이후 전체 절대 Timeline 계산 가능
- E5 확보 → 하멜전시관 절대 도착시각 확정
- 3개 모두 확보 시 → 전체 Route 절대 종료시각 계산 가능

---

**이 파일 업데이트 이후 자동으로 다음 단계 구현하지 않음. Founder 검수 대기.**

---

## [UPDATE 2026-10-15] SOUL 여행코스 Edge Time Evidence

### 배경

Project Phoenix SOUL 여행코스에서 실제 사용되는 장소 간 이동시간을 Founder가 제공했다.
아래 값은 SOUL TG(travelGuideService) 연결을 위한 사전 Evidence 수집 단계이며 Runtime 미적용 상태이다.

원칙 (5-Layer Model 계승):
- Source 없는 값 저장 금지
- UNKNOWN은 UNKNOWN으로 유지
- A→B 값을 B→A에 자동 적용 금지
- CAR 값을 WALK/PUBLIC에 자동 적용 금지

### SOUL 코스별 적용 구조

**일반 코스 (ROUND_TRIP 기본):**
```
이순신광장 → EA → 자산탑승장(cablecar) → [케이블카 왕복] → 자산탑승장 → EB → 향일암
```

**부모님 코스:**
```
이순신광장 → EC → 자산공원(jaisan_park) → ED → 중앙시장(jungang_market)
```
※ jungang_market: Founder Decision 2026-10-15 — SOUL 추천 제외 대상. ED UNKNOWN 유지.

**케이블카 왕복 기본 원칙 (Founder Decision 2026-10-15):**
- 케이블카는 왕복(자산→돌산→자산) 기본
- 왕복 후 출발 기점 = 자산탑승장(`cablecar` place_code, 오동도로 61-11)
- 개인 코스 UI에서 편도/왕복 선택을 사용자에게 묻지 않음

---

### SOUL Course Edge Time Table (2026-10-15)

Source: FOUNDER_EVIDENCE (잠정 예상값)
Confidence: LOW
Verification: UNVERIFIED — 공식 측정값 아님. 네이버/카카오맵 실측 또는 현장 측정으로 검증 필요.

| Edge ID | From (place_code) | To (place_code) | Mode | Minutes | Source | Status |
|---|---|---|---|---|---|---|
| EA | `lee_soon_shin_plaza` (이순신광장) | `cablecar` (자산탑승장) | CAR | 10 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EB | `cablecar` (자산탑승장) | `hyangiram` (향일암) | CAR | 36 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EC | `lee_soon_shin_plaza` (이순신광장) | `jaisan_park` (자산공원) | CAR | 9 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| ED | `jaisan_park` (자산공원) | `jungang_market` (중앙시장) | CAR | **UNKNOWN** | — | UNKNOWN — jungang_market SOUL 추천 제외 (Founder 2026-10-15) |
| EE | `odongdo` (오동도) | `cablecar` (자산탑승장) | CAR | 3 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) |
| EF | `cablecar` (자산탑승장) | 수산물특화시장 | CAR | 7 | FOUNDER_EVIDENCE | UNVERIFIED (LOW) — **수산물특화시장: travel_places DB 미등록. place_code 없음.** TG Runtime 미연결. |

**비고 — 역방향 적용 금지:**
- EB (자산탑승장→향일암 CAR 36분): 반대 방향(향일암→자산탑승장)을 동일 시간으로 가정하지 않음
- EE (오동도→자산탑승장 CAR 3분): 반대 방향(자산탑승장→오동도) 별도 측정 필요

---

### 수산물특화시장 상태 (EF 관련)

| 항목 | 상태 |
|---|---|
| travel_places DB 등록 | **미등록** (`001_travel_places.sql` 부재) |
| place_code | **없음** |
| Route Corpus 등장 | YEOSU_ROUTE_CORPUS_V0_1.json에 entity_name으로 포함 (R028, R032, Edges) |
| SOUL TG Runtime 연결 | **불가** (place_code 미존재 → `_estimateTravelTime()` 조회 대상 없음) |
| 기존 Founder 결정 | soyeowoolService.js:2782 — "수산물특화시장 DB 미등록으로 제외만 적용" (기존 언급) |
| EF 저장 목적 | Evidence 보존. 향후 DB 등록 결정 시 참조용 |

중앙시장(`jungang_market`)과 수산물특화시장은 **별개 엔티티**:
- 중앙시장: `jungang_market` (W-3, 서동 중앙시장) — DB 등록됨, SOUL 추천 제외 결정
- 수산물특화시장: 원도심 권역 별도 장소 — DB 미등록, place_code 없음

---

### 참고 계산 (REFERENCE ONLY — Runtime 사용 금지)

아래는 현재 확보된 Founder Evidence 기준 시간 합산이다. UNVERIFIED 값이며 코스 검증 목적이 아닌 참고용 기록임.

| 코스 | 구간 | 체류합 | 이동합(Founder 예상) | 합계(참고) |
|---|---|---|---|---|
| 일반 (이순신광장→케이블카→향일암) | EA(10) + EB(36) | 45+45+90=180분 | 46분 | 226분 (참고) |
| EA+EB 합계 | 이순신광장→자산탑승장→향일암 | — | **46분** | — |

**케이블카 avg_stay_minutes=45 왕복 적절성:**
`travelGuideService.js` DB값 `avg_stay_minutes=45`. 왕복 탑승 소요 25~30분(UNVERIFIED_SECONDARY) + 돌산 체류 시간 포함 여부 **UNVERIFIED** 유지. 수정은 별도 Founder 결정 필요.

---

### 남은 UNKNOWN (2026-10-15 업데이트)

| Edge | 상태 | 우선순위 |
|---|---|---|
| ED 자산공원→중앙시장 | UNKNOWN — jungang_market 추천 제외로 측정 불필요 | N/A |
| EA~EE 역방향 (B→A) | 별도 측정 필요 | MEDIUM |
| CAR 외 수단 (WALK/PUBLIC) | 별도 측정 필요 | LOW |
| EF 수산물특화시장 place_code 등록 | DB 등록 결정 후 진행 | 보류 |
| 케이블카 avg_stay_minutes=45 왕복 포함 여부 | UNVERIFIED | MEDIUM |
| 기존 E1, E2, E5 (Route #001) | UNKNOWN 유지 | (Route #001 범위) |

---

*업데이트: 2026-10-15 — SOUL Course Edge EA~EF Founder Evidence 추가*
*Source: Founder 제공 잠정 예상값 (2026-10-15)*
*DB/Schema/Runtime 변경 없음. DESIGN & EVIDENCE ONLY.*

---

**이 파일 업데이트 이후 자동으로 다음 단계 구현하지 않음. Founder 검수 대기.**

---

## [UPDATE 2026-10-24] 원도심 권역 CAR Edge — Naver Maps Measured Evidence

### 배경

Founder가 네이버지도 측정값 4개를 직접 제공했다. (Founder Direction 2026-10-24)
기존 EA~EF(SOUL 코스 예상값)와 별도 섹션으로 보존한다.

**미접근 데이터 명시:**
- `YEOSU_SOUL_TRAVEL_STAY_TIME_V0_1.xlsx`: 저장소 미포함 — 이번 기록에 반영되지 않음
- Travel Time Matrix V0.1 (`YEOSU_TRAVEL_TIME_MATRIX_V0_1.md`+`.csv`): 현재 저장소에서 파일 미발견

**원칙 (EA~EF 동일 원칙 계승):**
- 역방향(B→A) 자동 생성 금지 — F-1/F-2는 각각 독립 측정값으로 기록
- Runtime Connected: NO — GOVERNANCE_HOLD 유지
- 기존 EA~EF 덮어쓰기 없음

---

### Naver Maps CAR Edge Time Table (2026-10-24)

Source: FOUNDER_PROVIDED_NAVER_MAPS
Mode: CAR (단방향 각각)
Verification: 네이버지도 Founder 직접 조회 측정값
Runtime Connected: NO

| Edge ID | From (place_code) | To (place_code) | Mode | Minutes | Distance | Source | Status |
|---|---|---|---|---|---|---|---|
| F-1 | `lee_soon_shin_plaza` (이순신광장) | `hamel_lighthouse` (하멜등대) | CAR | **5** | 1.5km | FOUNDER_PROVIDED_NAVER_MAPS | NAVER_MEASURED |
| F-2 | `hamel_lighthouse` (하멜등대) | `lee_soon_shin_plaza` (이순신광장) | CAR | **4** | 1.6km | FOUNDER_PROVIDED_NAVER_MAPS | NAVER_MEASURED |
| F-3 | `lee_soon_shin_plaza` (이순신광장) | `marine_park` (종포해양공원) | CAR | **2** | 658m | FOUNDER_PROVIDED_NAVER_MAPS | NAVER_MEASURED |
| F-4 | `marine_park` (종포해양공원) | `hamel_lighthouse` (하멜등대) | CAR | **3** | 866m | FOUNDER_PROVIDED_NAVER_MAPS | NAVER_MEASURED |

**비고 — 역방향 처리:**
- F-1 (이순신광장→하멜등대 5분) / F-2 (하멜등대→이순신광장 4분): 각각 독립 측정값. B→A가 A→B와 다름(1분 차이).
- F-3 / F-4 역방향: 아직 미측정 (F-3 역방향 = marine_park→lee_soon_shin_plaza, F-4 역방향 = hamel_lighthouse→marine_park)

---

### 장소 코드 정확성 확인

| place_code | name_ko | DB 등록 여부 | 검증 |
|-----------|---------|-----------|------|
| `lee_soon_shin_plaza` | 이순신광장 | ✓ (id 등록) | ✓ |
| `hamel_lighthouse` | 하멜등대 | ✓ (id=15, HML-7 2026-10-19) | ✓ |
| `marine_park` | 종포해양공원 | ✓ (등록됨) | ✓ |

---

### F-1~F-4와 8h 코스 H1~H4 관계

8h SOUL 코스: `cablecar → hamel_lighthouse → hyangiram → lee_soon_shin_plaza → odongdo`

| 8h Edge | F-1~F-4 직접 매핑 | 판정 |
|---------|-----------------|------|
| H1: cablecar → hamel_lighthouse | 없음 (F-1은 출발지가 lee_soon_shin_plaza) | ❌ MISSING |
| H2: hamel_lighthouse → hyangiram | 없음 | ❌ MISSING |
| H3: hyangiram → lee_soon_shin_plaza | 없음 | ❌ MISSING |
| H4: lee_soon_shin_plaza → odongdo | 없음 (F-1~F-4 목적지 다름) | ❌ MISSING |

**H1~H4: MISSING 유지 — F-1~F-4로 해소되지 않음. 네이버/카카오맵 별도 조회 필요.**

---

### 참고 계산 — 원도심 순환 (REFERENCE ONLY — Runtime 사용 금지)

이순신광장 기점으로 종포해양공원 경유 하멜등대까지:

| 구간 | Minutes | 거리 | Source |
|------|---------|------|--------|
| 이순신광장 → 종포해양공원 (F-3) | 2 | 658m | NAVER_MEASURED |
| 종포해양공원 → 하멜등대 (F-4) | 3 | 866m | NAVER_MEASURED |
| **이순신광장 → 종포해양공원 → 하멜등대 합계** | **5** | **1,524m** | 참고값 |
| 이순신광장 → 하멜등대 직행 (F-1) | 5 | 1.5km | NAVER_MEASURED |

*F-1(직행 5분) = F-3+F-4(경유 5분) — 수치 일치 확인 (참고용)*

---

### 남은 UNKNOWN (2026-10-24 추가)

| Edge | 상태 | 우선순위 |
|------|------|---------|
| H1: cablecar → hamel_lighthouse | MISSING | HIGH (8h 코스) |
| H2: hamel_lighthouse → hyangiram | MISSING | HIGH (8h 코스) |
| H3: hyangiram → lee_soon_shin_plaza | MISSING | HIGH (8h 코스) |
| H4: lee_soon_shin_plaza → odongdo | MISSING | HIGH (8h 코스) |
| F-3 역방향 (marine_park → lee_soon_shin_plaza) | 미측정 | MEDIUM |
| F-4 역방향 (hamel_lighthouse → marine_park) | 미측정 | MEDIUM |
| hamel_lighthouse avg_stay_minutes | null (DATA_GAP) | HIGH |
| Excel 데이터 반영 여부 | 미접근 | 확인 필요 |

---

*업데이트: 2026-10-24 — F-1~F-4 Naver Maps Measured Evidence 추가*
*Source: Founder 제공 네이버지도 측정값 (2026-10-24)*
*DB/Schema/Runtime 변경 없음. DESIGN & EVIDENCE ONLY.*
*승인: Founder Approval 2026-10-24 (로컬 기록 / Git commit/push 별도 승인)*

---

**이 파일 업데이트 이후 자동으로 다음 단계 구현하지 않음. Founder 검수 대기.**

---

*생성: Claude Sonnet 4.6 / MUYEOJEONG Route Intelligence Phase*  
*업데이트: 2026-09-21 B — FOUNDER_OPERATIONAL_STAY_TIME 6개 + CAR Edge 조사 + Timeline V2*  
*업데이트: 2026-10-15 — SOUL Course Edge EA~EF Founder Evidence 추가*  
*업데이트: 2026-10-24 — F-1~F-4 Naver Maps Measured Evidence 추가 (Founder Approval)*  
*Sources: Batch 01, Batch 02, Time Knowledge V0.1 (E002/E003/E004), WebSearch (2026-09-21), Naver Maps (2026-10-24)*  
*DB/Schema/Runtime 변경 없음. DESIGN & EVIDENCE ONLY.*
