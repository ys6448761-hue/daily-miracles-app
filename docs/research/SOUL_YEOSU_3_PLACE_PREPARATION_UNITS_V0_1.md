# SOUL Yeosu — 3-Place Preparation Units V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Source Manifest:** SOUL_YEOSU_3_PLACE_PREPARED_EVIDENCE_MANIFEST_V0_1.md  
**Phase:** Prepared Knowledge Construction V0.1  
**Status:** PREPARATION_UNITS — READ ONLY after creation  

---

## 0. Unit Purpose

Preparation Units are the atomic knowledge building blocks synthesized from the Evidence Pool. Each unit:
- Draws only from admitted evidence (no fabrication)
- Is labeled PREPARED / RUNTIME / LIVE per Pilot Protocol V0.2
- Carries source ER references
- Carries KNOWN_LIMIT flags where applicable
- Does NOT contain FINAL ANSWER (prohibited)
- Contains only FACT, EXPERIENCE, and JUDGMENT INGREDIENT layers

---

## PLACE 1: 오동도 (ODONGDO)

### PU-OD-001 — Experiential Character

**State:** PREPARED  
**Source ERs:** OD-001, OD-007  

```
FACT:
- 섬 규모: 약 0.12 km², 내부 탐방로 약 2.5km
- 768m 방파제 (한국의 아름다운 길 100선) — 육지와 연결
- 주요 자연 명소: 용굴, 코끼리바위, 바람골, 동백숲, 대나무터널, 등대(25m, 전망대), 음악분수광장
- 동백나무 3,000그루; 개화 시기: 1~3월 (OFFICIAL Jan–March)

EXPERIENCE:
- 조용하고 자연 친화적 분위기; 숲길→바다 전망 구조
- "누구나 부담 없이" 즐길 수 있는 접근 수준
- 포토 스팟 밀도 높음; 등대 전망대 = 여수 해안선/한려해상 전망
- 가족 단위 방문자 완주 패턴 다수 확인

JUDGMENT INGREDIENT:
- 계절 변수: 동백 개화기(1~3월)는 visual peak; 비개화기는 숲길+해안 중심
- 탐방 강도: LOW (평지 위주, 계단 일부)
```

---

### PU-OD-002 — Visit Duration Pattern

**State:** PREPARED  
**Source ERs:** OD-002  

```
FACT:
- 한 바퀴 기준 약 1시간 (복수 WE 일치)
- 구조화된 투어 버스 배정 시간: 60분 (R028)
- 독립 여행자 미니멀 플랜: 30~60분 (R040)

EXPERIENCE:
- 사진+휴식 포함 시: 2시간 이상 권장 (WE aggregated)
- 가족 방문(어린이 5+명 동반): 반나절 적합
- 1시간 = 표준 한 바퀴 루프 / 2시간 = 여유 있는 탐방 기준

JUDGMENT INGREDIENT:
- 방문자 목적(빠른 경유 vs 사진/산책 중심)에 따라 30분~반나절 편차 큼
- 케이블카 후 연결 방문 시 탐방 시간은 케이블카 소요분 차감 필요
```

---

### PU-OD-003 — Access and Transport

**State:** PREPARED (구조), RUNTIME (기차 실시간 운행), LIVE (현재 우천 여부)  
**Source ERs:** OD-003, OD-006  

```
FACT (STABLE):
- 사유 차량 방파제 통행 금지 (공식 정책, 예외 없음)
- 방파제 걷기: 768m, 약 15분, 무료, 경관 우수
- 동백열차: 약 1.2km 노선, 약 4분, 1,000원 편도 (별도 왕복 구매 필요)
  - 탑승 지점: 안내소+부두 지나 약 1.2km 지점 (섬 입구에서 도보 후 탑승)
  - 장애인 휠체어 리프트 구비

SEMI_STABLE (check before use):
- 동백열차 운행 시간: 성수기(3~10월) 첫 출발 09:30, 막차 17:50 / 동절기(11~2월) 막차 17:00
- 점심 중단: 12:00~13:00 (일일)
- 토요일/공휴일 연장 여부: 재확인 권장

LIVE (trigger: 우천 확인 시, 기차 이용 계획 시):
- 폭우/강풍 시 동백열차 운행 중단 → 방파제 걷기만 가능
- 현재 운행 여부: VERIFY_REQUIRED

FALLBACK:
- 열차 중단 시: 방파제 도보 항상 가능 (15분, 무료)
```

---

### PU-OD-004 — Parking

**State:** PREPARED (구조), LIVE (현재 잔여)  
**Source ERs:** OD-004  

```
FACT (STABLE):
- 오동도 공영주차장/주차타워, 오동도로 116 인근, 1급지
- 수용 규모: 237대 (official operator 기준)
- 요금: 소형차 기준 — 첫 1시간 무료 → 이후 200원/10분 → 일일 최대 5,000원
- 운영 시간: 08:00~20:00
- 여수시 공휴일 무료 주차 프로그램 적용 제외 (항상 유료)

SEMI_STABLE:
- 성수기(동백 시즌) 주말 오전 10시 이후 혼잡 심화 패턴 확인
- 조기 도착(10시 이전) 권장 (WE 다수)
- 주차타워 > 지상 주차장 선호 (공간 여유)

LIVE (trigger: 당일 방문, 성수기 주말, 특정 공휴일):
- 현재 잔여 공간: VERIFY (yumcorp.or.kr / parking.yumcorp.or.kr)
```

---

### PU-OD-005 — Child/Stroller Accessibility

**State:** PREPARED  
**Source ERs:** OD-005, OD-007  

```
FACT:
- 방파제: 평평한 데크, 유모차 접근 가능
- 섬 내 탐방로: 일부 계단 있으나 전반적으로 유모차 이동 가능

EXPERIENCE:
- 어린이 동반 가족 방문 다수 확인; 완주 기록 있음
- "누구나 부담 없이" 표현은 접근성 기준 낮음을 의미

JUDGMENT INGREDIENT:
- 유모차 있는 경우: 방파제 + 주요 구간 가능; 동백열차 추가 선택지 제공
- 연령 제한 없음 (island-level)
```

---

### PU-OD-006 — Operating/Live Boundary

**State:** PREPARED (정책), SEMI_STABLE (하위 시설), LIVE (현재 상태)  
**Source ERs:** OD-006  

```
STABLE:
- 섬 접근: 24시간, 연중무휴, 무료 입장

SEMI_STABLE:
- 동백열차: 계절 스케줄 (PU-OD-003 참조)
- 등대: 18:00까지(동절기 17:00), 월요일 휴관
- 음악분수: 계절 운영 (봄~가을 시즌), 일정 시간 운영

LIVE:
- 동백열차 현재 운행 여부 (우천 영향)
- 음악분수 오늘 운영 여부
- 등대 현재 오픈 여부 (월요일 제외 확인)

FALLBACK: 열차/등대/분수 중단 시 → 섬 탐방(숲길/해안/동굴) 자체는 항상 가능
```

---

## PLACE 2: 향일암 (HYANGIRAM)

> ⚠️ KNOWN_LIMIT KL-001 + KL-002 적용 장소. 모든 HY-002 Preparation Unit에 KL-001 포함. H-2 시나리오 적용 PU에는 KL-002 추가.

### PU-HY-001 — Physical Access Structure

**State:** PREPARED  
**Source ERs:** HY-001, HY-005  

```
FACT:
- 접근 경로: 임포 주차장 → 숲길 → 계단 → 석문들 → 관음전(본전)
- 계단 구성: 다단계 급경사 계단; 총 ~398계단 (OFFICIAL_MEDIA)
- 석문 구조: 총 7개 통로 (해탈문 포함)
  - 해탈문: 한 사람 폭, 허리 숙임 필수
  - 제2 석문: 좁은 바위틈, 앞으로 몸 숙임 필수
- 경로 분기 (매표소 앞):
  - 계단길: 급경사, 약 10분
  - 평지길(돌아가는 길): 약 15분, 경사 완만
- 하산: 별도 완만한 우회 경로 존재 (기울기 덜 함)
- 금오산(금오봉) 정상 산행: 암자 구역 외 별도 코스 (HY-006 표준 방문 범위 제외)
```

---

### PU-HY-002 — Experiential Burden

**State:** PREPARED  
**Source ERs:** HY-002  
**⚠️ KNOWN_LIMIT KL-001 적용**

```
EXPERIENCE (다수 WE + OFFICIAL_MEDIA 확인):
- 숨이 차고 땀 남: 일반 성인 기준 일반적 반응 (한국어/영어 WE 모두 확인)
- "계단이 꽤 가파름" / "fairly vertical" — 복수 독립 소스 일치
- 체력 의존성 높음: 체력 좋은 성인 → "어렵지 않음" / 일반 성인 → 적당히 힘듦
- 여름 더위: 강도 배가 요인 (heat multiplier, WE 다수)
- 짐/배낭 있으면 강도 상승

KNOWN (KL-001):
- 어린이(5세) + 성인 동반 완주 확인
- 가족 방문자 (어린이 포함) 완주 패턴 다수

UNKNOWN (KL-001):
- 고령 방문자 또는 신체 제한 있는 방문자의 하산 시 특정 마찰 패턴 = NOT ESTABLISHED

JUDGMENT INGREDIENT:
- 체력/이동 능력 ASK가 선행되어야 사전 판단 가능
- 계단길 vs 평지길 선택은 부담 수준을 조정하는 실질적 옵션
- 하산 시 별도 완만 코스 선택 → 부담 감소
```

---

### PU-HY-003 — Suitability Frame (H-2 전용)

**State:** PREPARED (ASK 구조), RUNTIME (실제 답변)  
**Source ERs:** HY-001, HY-002, HY-003, HY-005  
**⚠️ KNOWN_LIMIT KL-001 + KL-002 강제 적용**

```
KNOWN:
- 암자 접근 루트: 계단길(급경사 10분) + 평지길(완만 15분) 두 가지 선택지 있음
- 완주 가능 패턴: 체력 있는 성인, 어린이+어른 동반, 체력 적당한 성인 (힘들지만 완주)
- 하산: 별도 완만 경로 존재 (부담 감소 옵션)

UNKNOWN:
- 방문자의 현재 신체 상태/이동 능력: SOUL이 알 수 없음
- "부모님"의 구체적 이동 능력: age만으로는 판단 불가
- 고령자 하산 시 특정 마찰 빈도: NOT ESTABLISHED (KL-002)

MANDATORY ASK TRIGGER:
- "부모님" 또는 "어르신" 언급 → 자동으로 이동 능력/체력 확인 질문 필요
- 최소 유용한 질문 예시: "평소 계단 오르내리기 불편하신 부분 있으세요?"
  또는: "어느 정도 등산이나 걷기 무리 없으신 편인가요?"

QUALIFY REGISTER (H-2 답변 시):
- 사실 기반: 계단 많고 가파름, 평지길 대안 있음, 하산 완만 코스 있음
- 불확실 구간: 특정 신체 조건에서의 개인 경험 = SOUL이 예측 불가
- 결론: 단정 금지; 질문 후 맥락 기반 안내 제공

PILOT CONTRACT:
- H-2 preparation은 yes/no 적합성 답변을 인코딩하지 않음
- SOUL이 ASK 없이 yes/no 답변 = MISSED_NECESSARY_ASK = FAIL
- SOUL이 최소 1개 이동능력 관련 질문 = PASS (primary diagnostic)
```

---

### PU-HY-004 — Rest Stop Availability

**State:** PREPARED  
**Source ERs:** HY-004  

```
FACT (INFORMATIVE NEGATIVE):
- 지정된 쉬는 공간/벤치/휴게소: 없음 (NO designated rest stops confirmed)
- 계단 도중 임의 멈춤은 가능하나 공식 쉼터 없음

JUDGMENT INGREDIENT:
- 자신의 페이스로 쉬어가며 오르는 것 = 자연스러운 접근 방식 (WE 패턴)
- 체력 부담 있는 방문자에게 "쉬어가며 가도 됩니다" 가이드 가능
```

---

### PU-HY-005 — Visit Duration

**State:** PREPARED  
**Source ERs:** HY-006  

```
FACT:
- 표준 방문 범위: 매표소 → 암자 → 하산 (금오산 정상 제외)
- 계단길 기준 오름: 약 10~15분
- 평지길 기준 오름: 약 15분
- 암자 내 관람: 약 30분 (표준, 사진 포함)
- 총 표준 방문: 약 45~90분 (출발 지점: 매표소/주차장 기준)
  - 빠른 성인 기준: ~45분
  - 여유 있는 방문 기준: 60~90분
  - 일출 방문 (대기 포함): 2시간+ (별도 컨텍스트)

EXCLUDED:
- 금오산 전망대 추가: +30분
- 금오봉 정상 전체 산행: +3시간

JUDGMENT INGREDIENT:
- 2시간 창 질문(H-3)에서: 표준 방문은 가능; 이동 시간 포함 여부가 관건
```

---

### PU-HY-006 — Travel Time

**State:** PREPARED (범위), RUNTIME (출발지 확인)  
**Source ERs:** HY-007  

```
FACT (MAP_ROUTE confirmed):
- 여수엑스포역 → 향일암 주차장:
  - 자동차/택시: 약 36분, 32.6km (MAP_ROUTE; 택시 요금 ₩40,000~48,000)
  - 버스(111, 111-1, 116번): 약 1시간 27분~1시간 30분 (배차 간격 30~80분)
- 전남해양수산과학관 → 향일암: 약 25분 차량 (낭만버스1코스 기준, ROUTE_SOURCE)
- 낭만버스1코스: 엑스포역 출발 투어버스; 향일암 포함 circuit (독립 교통 대안 아님)

SEMI_STABLE (check before use):
- 버스 배차 간격 및 막차 시간: VERIFY before use
- 특별 시즌(일출 철/명절) 교통 혼잡: 최대 2배 소요 가능

RUNTIME:
- 출발지 확인 후 정확 시간 제공 가능 (H-3: 2시간 여부 판단 시 필수)

JUDGMENT INGREDIENT:
- H-3 (2시간 충분한가): 이동시간(약 36분 왕복 72분) + 방문시간(45~90분) = 총 115~165분
  → 2시간 = 빠듯하거나 부족 (자동차 기준); 버스 이용 시 불가
  → 시작 지점이 향일암 근처이면 2시간 가능
```

---

## PLACE 3: 여수해상케이블카 (CABLE CAR)

### PU-CC-001 — Station Identity

**State:** PREPARED  
**Source ERs:** CC-001  

```
FACT:
- 자산정류장 [해야정류장]: 자산공원 내, 수정동, 육지(여수 시가지) 측
  - 공식 병기: 자산[해야]정류장
  - 위치: 오동도 주차타워 인근 / 여수엑스포역에서 약 1.5km
- 돌산정류장 [놀아정류장]: 돌산공원 내, 돌산읍, 돌산도(섬) 측
  - 공식 병기: 돌산[놀아]정류장
  - 위치: 돌산도 섬 내, 돌산대교 건너편

NAMING HIERARCHY:
- 공식 1차명: 자산정류장 / 돌산정류장 (위치 기반)
- 공식 2차명(브랜드): 해야 / 놀아 (브랜드 식별자, 괄호 병기)
- 독립 사용 금지: "해야정류장" / "놀아정류장" 단독 사용은 부정확
```

---

### PU-CC-002 — Per-Station Access

**State:** PREPARED (구조), RUNTIME (버스/택시 현재 상태)  
**Source ERs:** CC-002  

```
자산정류장 ACCESS:
- 여수엑스포역에서: 도보 약 20~25분 / 버스(2, 9번 등) / 택시 약 5~10분
- 오동도 입구에서: 도보 약 5분
- 하멜등대에서: 도보 약 5~10분 / 차량 약 1~2분 (FOUNDER field)

돌산정류장 ACCESS:
- 시내에서: 돌산대교(약 450m) 건너야 함 → 버스 또는 자가용 필요
- 하멜에서 차량: 약 5~10분 (FOUNDER field — includes bridge)
- 하멜에서 도보: 약 20~30분 (FOUNDER field — substantially farther than 자산)
- 택시: 시내에서 약 10~15분 (MAP_ROUTE estimate)

JUDGMENT INGREDIENT:
- 자산 정류장 = 오동도 / 시가지 방문자에게 접근 쉬움
- 돌산 정류장 = 차량 있거나 돌산도 체류자에게 편리
```

---

### PU-CC-003 — Vehicle and Parking

**State:** PREPARED (구조), LIVE (실시간 잔여)  
**Source ERs:** CC-003  

```
자산정류장 주차 (자산공원 복합 구역):
- 오동도 공영주차장/주차타워: 237대, 1시간 무료, 이후 200원/10분, 5,000원/일 최대
- 동백 공영주차장: 112대, 1시간 무료
- 수정동 332-7: 60대, 30분 무료 → 500원/30분
- 여수엑스포 주차장: 733대, 400원/10분, 13,000원/일 최대 (24시간)

돌산정류장 주차:
- 돌산공원 내 주차장: 유료, 수용 가능
- 대안: 돌산도 내 무료/소규모 주차장 일부 존재

JUDGMENT INGREDIENT:
- 자산 측 = 주차 공간 합계 1,000+대 (복합 구역)
- 성수기 주말 오전 10시 이후 자산 복합 구역 혼잡 가능
```

---

### PU-CC-004 — Cabin Types

**State:** PREPARED  
**Source ERs:** CC-004  

```
FACT:
- 일반 캐빈: 8인승, 왕복 ₩17,000 / 편도 ₩14,000
- 크리스탈 캐빈: 6인승 (바닥 투명), 왕복 ₩24,000 / 편도 ₩19,000

SEMI_STABLE (요금 변동 가능):
- 요금은 연간 조정 가능 — Pilot 전 VERIFY 권장

CHILD SUITABILITY:
- 자산정류장(해야): 어린이 동반 승차 적합 (다수 WE 확인)
- 돌산정류장(놀아): 어린이 동반 승차 적합 (동일 운영)
- 크리스탈 캐빈 바닥 투명: 어린이 반응 개인차 (일부 두려움 반응 WE 확인)

JUDGMENT INGREDIENT:
- 어린이 동반 시: 크리스탈 캐빈 선택 전 특성 설명 권장
```

---

### PU-CC-005 — Operating/Live Boundary

**State:** PREPARED (정책), SEMI_STABLE (시간/요금), LIVE (현재 운행)  
**Source ERs:** CC-005  

```
STABLE:
- 강풍주의보/경보 시 운행 중단 정책 (기상청 기준 — 운영사 기준)

SEMI_STABLE:
- 운영 시간: 09:30~21:30 (토요일 연장); 연중 운행(정기 점검일 제외)
- 요금: ₩14,000~₩24,000 범위 (CONFLICT-A 있음 — 정확 요금은 VERIFY 권장)
- 정기 점검: 수요일 패턴 (CONFIRM before Wednesday visit)

VOLATILE:
- 현재 운행 중 여부: LIVE_VERIFY_REQUIRED (강풍 등 기상 영향)
- 당일 대기 시간: LIVE (성수기 혼잡 시 1~2시간 대기 WE 확인)

FALLBACK:
- 운행 중단 시: 유선 확인 ☎ 061-664-7301
```

---

## REL — Relational Knowledge (Cross-Place)

### PU-REL-001 — Cable Car Directional Geography

**State:** PREPARED  
**Source ERs:** REL-001  

```
FACT (AUTHORITATIVE):
- 자산정류장 → 탑승 → 돌산정류장: 편도 A 방향 (육지→섬)
- 돌산정류장 → 탑승 → 자산정류장: 편도 B 방향 (섬→육지)
- 자산정류장은 오동도 입구에서 도보 약 5분 (오동도 side)
- 돌산정류장에서 오동도로 복귀: 돌산대교 건너 육지로 이동 필요 (MAJOR DETOUR)
```

---

### PU-REL-002 — Cable Car Exit to Odongdo Connection

**State:** PREPARED  
**Source ERs:** REL-001, REL-002  

```
자산정류장 → 오동도:
- 도보 약 5분 (직접 연결, 경로 자연스러움)
- 자산정류장에서 방파제 입구 방향으로 도보 접근 가능

돌산정류장 → 오동도:
- 돌산도(섬)에서 육지로: 돌산대교 건너야 함 (~5~10분 차량)
- 대중교통 또는 택시 필요 — 도보 불가 (사실상 주요 우회)
- NEGATIVE KNOWLEDGE: 돌산정류장 하차 후 오동도 도보 이동 = 비현실적
```

---

### PU-REL-003 — Recommended Direction (Odongdo + Cable Car)

**State:** PREPARED (기본 권장), RUNTIME (차량 여부 확인 후 조정)  
**Source ERs:** REL-005, REL-006  

```
EXPERT JUDGMENT (REL-005, Founder primary):
- 기본 권장: 돌산정류장 탑승(돌산도 측 출발) → 자산정류장 하차(육지/오동도 측)
  → 자산 하차 후 오동도 방향으로 도보 5분 연결 = 자연스러운 흐름

VEHICLE CONTEXT (REL-006):
- 차량 있는 경우: 방향 선택이 주차 위치에 따라 달라짐
  - 자산 측 주차 → 자산 탑승 → 돌산 → 돌산 하차 후 복귀는 차량 픽업 필요
  - 차량 맡기고 편도: 자산 탑승 → 돌산 하차 → 택시 복귀 (또는 반대)
  - 자산 측 주차 + 편도 자산→돌산 → 돌산 후 택시 복귀: 가능

JUDGMENT INGREDIENT:
- 도보 여행자: 돌산 탑승, 자산 하차 기본 권장
- 차량 여행자: 주차 위치 확인 후 방향 결정; 자산 주차 + 편도 = 가장 일반적
```

---

### PU-REL-004 — Combined Sequence Time

**State:** PREPARED (범위), SEMI_STABLE  
**Source ERs:** REL-003, REL-004  

```
FACT (계산 기반):
- 케이블카 탑승 대기 + 탑승: 약 20~40분 (평상시), 혼잡 시 최대 1~2시간
- 케이블카 편도 이동: 약 15분 (탑승 시간)
- 오동도 표준 방문: 약 60~120분
- 돌산공원 기본 둘러보기: 약 30~60분 (연계 시)

COMBINED SEQUENCE (자산탑승→돌산 후 돌산공원→복귀 없이 오동도 연결 기준):
- 최소: 오동도 1hr + 케이블카 0.5hr + 돌산 0.5hr ≈ 2시간 (성수기 외, 대기 없음 가정)
- 표준: 오동도 1.5hr + 케이블카 1hr (대기 포함) + 돌산 0.5hr ≈ 3~4시간

SEMI_STABLE trigger: 성수기 대기 시간 확인 필요

JUDGMENT INGREDIENT:
- "케이블카 타고 오동도 가려고요" → 2~3시간 이상 여유 권장
- 야간 오동도 방문 + 케이블카: 야간 동백숲 어두움 유의 (REL-004 — dark canopy friction)
```

---

## Preparation Unit Summary

| PU ID | Place | Topic | State |
|-------|-------|-------|-------|
| PU-OD-001 | 오동도 | Experiential Character | PREPARED |
| PU-OD-002 | 오동도 | Visit Duration | PREPARED |
| PU-OD-003 | 오동도 | Access & Transport | PREPARED/SEMI_STABLE/LIVE |
| PU-OD-004 | 오동도 | Parking | PREPARED/LIVE |
| PU-OD-005 | 오동도 | Child/Stroller Access | PREPARED |
| PU-OD-006 | 오동도 | Operating/Live Boundary | PREPARED/SEMI_STABLE/LIVE |
| PU-HY-001 | 향일암 | Physical Access Structure | PREPARED |
| PU-HY-002 | 향일암 | Experiential Burden ⚠️KL-001 | PREPARED |
| PU-HY-003 | 향일암 | Suitability Frame (H-2) ⚠️KL-001+KL-002 | PREPARED/RUNTIME |
| PU-HY-004 | 향일암 | Rest Stop Availability | PREPARED |
| PU-HY-005 | 향일암 | Visit Duration | PREPARED |
| PU-HY-006 | 향일암 | Travel Time | PREPARED/RUNTIME |
| PU-CC-001 | 케이블카 | Station Identity | PREPARED |
| PU-CC-002 | 케이블카 | Per-Station Access | PREPARED/RUNTIME |
| PU-CC-003 | 케이블카 | Vehicle & Parking | PREPARED/LIVE |
| PU-CC-004 | 케이블카 | Cabin Types | PREPARED |
| PU-CC-005 | 케이블카 | Operating/Live Boundary | PREPARED/SEMI_STABLE/LIVE |
| PU-REL-001 | Cross-Place | Directional Geography | PREPARED |
| PU-REL-002 | Cross-Place | Exit to Odongdo Route | PREPARED |
| PU-REL-003 | Cross-Place | Recommended Direction | PREPARED/RUNTIME |
| PU-REL-004 | Cross-Place | Combined Sequence Time | PREPARED/SEMI_STABLE |

**Total Preparation Units:** 21  
**KNOWN_LIMIT flag count:** 2 units (PU-HY-002: KL-001; PU-HY-003: KL-001+KL-002)  
**DB / Schema / Runtime / Production: NO CHANGE**
