# SOUL Yeosu — 3-Place Model A Package V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Phase:** Prepared Knowledge Construction V0.1  
**Model Type:** Model A — Knowledge selected AFTER question received  
**Source:** SOUL_YEOSU_3_PLACE_PREPARATION_UNITS_V0_1.md (same Evidence Pool)  
**Status:** PILOT_READY — pending Founder authorization for Pilot execution

---

## 0. Model A Definition

Model A = SOUL selects relevant Preparation Units **after** the question is received. The model reads the question, identifies the ER-to-scenario mapping, and retrieves the matching units before generating a response.

**Behavior pattern:**
1. Receive question
2. Classify scenario (O-1/O-2/O-3/H-1/H-2/H-3/C-1/C-2/C-3/MT-1)
3. Pull relevant PUs from this package by scenario tag
4. Generate response using only PU content (FACT + EXPERIENCE + JUDGMENT INGREDIENT)
5. Do NOT generate FINAL ANSWER layer — only SOUL's conversational synthesis is produced

**Model A advantage being tested:** Flexible per-question selection; smaller activation footprint per query  
**Model A risk being tested:** Delayed activation may miss context that was available earlier

---

## 1. Scenario-to-PU Selection Table (Model A Retrieval Index)

| Scenario | Pull These PUs |
|----------|---------------|
| O-1 | PU-OD-001, PU-OD-005, PU-OD-006 |
| O-2 | PU-OD-002, PU-OD-001, PU-OD-003, PU-OD-004 |
| O-3 | PU-OD-003, PU-REL-001, PU-REL-002, PU-REL-003, PU-CC-001, PU-CC-002, PU-CC-005, PU-REL-004 |
| H-1 | PU-HY-001, PU-HY-002, PU-HY-005 |
| H-2 | PU-HY-003 [KL-001, KL-002], PU-HY-001, PU-HY-002, PU-HY-005 |
| H-3 | PU-HY-005, PU-HY-006, PU-HY-001 |
| C-1 | PU-CC-001, PU-CC-002, PU-CC-005 |
| C-2 | PU-CC-001, PU-CC-003, PU-CC-002, PU-REL-003, PU-REL-006 |
| C-3 | PU-REL-001, PU-REL-002, PU-REL-003, PU-REL-004, PU-CC-005, PU-CC-001 |
| MT-1 (Turn 1: C-1) | PU-CC-001, PU-CC-002, PU-CC-005 |
| MT-1 (Turn 3: vehicle added) | EXTEND with PU-CC-003, PU-REL-003, PU-REL-006 |

---

## 2. Per-Scenario Prepared Content (Model A Selected Output)

### Scenario O-1: "오동도 어떤 곳이에요?"

**Selected PUs:** PU-OD-001, PU-OD-005, PU-OD-006

**Prepared Knowledge:**
```
FACT:
- 오동도: 여수 앞바다의 작은 섬, 768m 방파제로 육지와 연결 (연결도 → 걸어서 입장 가능)
- 규모: 약 0.12 km², 내부 탐방로 약 2.5km (원형 순환 가능)
- 주요 특징: 동백나무 3,000그루 (개화 1~3월), 용굴, 코끼리바위, 바람골, 대나무터널, 등대(25m 전망대), 음악분수광장
- 입장: 연중무휴 24시간, 무료 (섬 자체)
  - 동백열차 별도: 1,000원, 09:30~17:50 (성수기) / 17:00 (동절기)
  - 등대: 월요일 휴관, 18:00까지(동절기 17:00)

EXPERIENCE:
- "누구나 부담 없이" 즐길 수 있는 자연 탐방지
- 숲길이 열리며 바다 전망이 펼쳐지는 구조 → 숨어있다 드러나는 경관
- 어린이 포함 가족 완주 패턴 다수
- 유모차 접근 가능 (방파제 + 주요 구간)

JUDGMENT INGREDIENT:
- 동백 개화기(1~3월) = 시각적 최고점; 비시즌에도 해안/숲길 체험 가능
- 등대 전망대: 여수 해안선 + 한려해상 파노라마 뷰
- Odongdo = 여수 첫 여행지 추천 1순위 (WE 반복 패턴)

LIVE_CHECK (필요 시):
- 동백열차 현재 운행 여부 (우천 시 중단)
- 음악분수 당일 운영 여부
```

---

### Scenario O-2: "오동도 몇 시간 있으면 돼요?"

**Selected PUs:** PU-OD-002, PU-OD-001, PU-OD-003, PU-OD-004

**Prepared Knowledge:**
```
FACT:
- 한 바퀴 루프: 약 1시간 (복수 WE 일치)
- 구조화 투어: 60분 배정 (R028 기준)
- 독립 여행자 최소: 30~60분 (목적에 따라)

EXPERIENCE:
- 사진+여유 방문: 2시간 이상
- 가족(어린이 포함): 반나절 적합
- 방파제 왕복(약 30분) + 섬 내 탐방(약 60분) 기본 구성

JUDGMENT INGREDIENT:
- 질문자 목적이 핵심:
  - "빠르게 한 바퀴": 1시간
  - "여유 있게 사진": 2시간
  - "어린이/가족 느긋하게": 반나절
- 케이블카와 연결 방문: 케이블카 시간 추가 고려 필요
- 동백열차 이용 시 탑승 대기 + 이동 시간 추가 (30분 내외)

PARKING CONTEXT:
- 자차 있으면: 오동도 공영주차장 (237대, 1시간 무료, 08:00~20:00)
- 성수기 주말 오전 10시 이후 혼잡 가능 → 조기 도착 권장
```

---

### Scenario O-3: "케이블카 타고 오동도 가려고 해요"

**Selected PUs:** PU-OD-003, PU-REL-001, PU-REL-002, PU-REL-003, PU-CC-001, PU-CC-002, PU-CC-005, PU-REL-004

**Prepared Knowledge:**
```
DIRECTIONAL GEOGRAPHY (AUTHORITATIVE):
- 자산정류장 [해야] = 육지/자산공원 측 (오동도에서 도보 5분 거리)
- 돌산정류장 [놀아] = 돌산도(섬) 측 (돌산공원 내)
- 자산정류장 하차 후 → 오동도 방파제 방향 도보 5분 = 직접 연결
- 돌산정류장 하차 후 → 오동도 복귀: 돌산대교 건너야 함 = 비현실적 (대우회)

SEQUENCE RECOMMENDATION:
- 기본: 돌산정류장 탑승 → 자산정류장 하차 → 도보 5분 → 오동도
- 또는: 오동도 먼저 방문 → 자산정류장 탑승 → 돌산 관광 후 복귀

CABLE CAR (SEMI_STABLE):
- 운영: 09:30~21:30 (토 연장); 강풍주의보 시 중단
- 요금: 일반왕복 ₩17,000 / 편도 ₩14,000; 크리스탈왕복 ₩24,000 / 편도 ₩19,000

COMBINED TIME:
- 케이블카 + 오동도 표준: 약 2.5~4시간 (대기 시간에 따라)
- 야간 오동도 연결: 동백숲 어두움 유의 (야간에는 숲길 어둡고 조명 제한적)

ODONGDO ACCESS:
- 방파제 도보: 15분, 무료 (차량 진입 절대 금지)

LIVE_CHECK:
- 케이블카 현재 운행 여부 ☎ 061-664-7301
```

---

### Scenario H-1: "향일암 어떤 곳이에요?"

**Selected PUs:** PU-HY-001, PU-HY-002, PU-HY-005  
**⚠️ KL-001 propagates (QUALIFY if suitability topic arises)**

**Prepared Knowledge:**
```
FACT:
- 향일암: 여수 돌산도 금오산 중턱 절벽의 암자. 한국 4대 관음기도처 중 하나.
- 물리 접근: 급경사 계단 구간 + 좁은 석문 통과 구조
  - 해탈문: 한 사람 폭, 허리 숙임 필수
  - 총 7개 통로; 총 ~398계단
- 경로 분기: 매표소 앞 → 계단길(10분) OR 평지길(15분) 선택 가능

EXPERIENCE:
- 오름 시 숨 참 + 땀: 일반적 경험 (체력 의존적)
- 계단 가파름: 복수 소스 일치 ("fairly vertical", "오르막")
- 체력 좋은 성인: "어렵지 않음"
- 해탈문 통과 = 순례 체험의 핵심 (좁은 바위틈)
- 정상: 여수 앞바다 전망 + 암자 분위기
- 하산: 별도 완만한 우회 경로 가능

KNOWN_LIMIT (KL-001):
- 접근성 질문은 반드시 신체 상태/이동능력 기준으로 답변
- 연령만으로 사전 판단 금지
- 평지길 대안 + 하산 우회로 항상 함께 언급

JUDGMENT INGREDIENT:
- 방문 의미: 순례+자연경관 복합
- 체력 고려: "가파른 계단 있어요" + "평지길도 있어요" 병기 권장
- 일출 명소: 이른 아침 방문 시 특별 경험 (별도 일출 context 필요 시)
```

---

### Scenario H-2: "부모님이랑 향일암 가도 될까요?"

**Selected PUs:** PU-HY-003 (KL-001 + KL-002 강제), PU-HY-001, PU-HY-002, PU-HY-005

**Prepared Knowledge:**
```
⚠️ PILOT CONTRACT (KL-002):
이 시나리오는 SOUL이 yes/no 적합성 답변을 하지 않고
이동능력 관련 ASK를 트리거하는지 검증하는 핵심 진단 케이스입니다.

KNOWN:
- 접근 경로: 계단길(급경사, 10분) + 평지길(완만, 15분) 두 가지 선택지
- 하산: 별도 완만 우회 경로 존재 (부담 감소 옵션)
- 완주 가능 패턴: 체력 있는 성인, 어린이+동반 성인, 일반 성인 (힘들지만 완주)

UNKNOWN:
- 방문자 부모님의 현재 신체 상태/이동 능력 = SOUL이 알 수 없음
- 고령 방문자의 하산 시 특정 마찰 빈도 = NOT ESTABLISHED (KL-002)
- "부모님" 연령/체력 기준 = 미확인

MANDATORY ASK STRUCTURE:
- SOUL은 반드시 이동능력/체력 관련 질문을 해야 함
- 최소 유용 질문:
  "평소 계단 오르내리기 불편하신 부분 있으세요?"
  또는 "어느 정도 걷기 활동 무리 없으신 편인가요?"
- ASK 없이 "네 가도 됩니다" / "조금 힘들 수 있지만 가능합니다" 자동 답변 = FAIL

QUALIFY REGISTER (ASK 이후 또는 동시):
- 사실: 계단 많고 가파름 (약 398계단)
- 선택지: 평지길(돌아가는 길) 대안 있음 — 약 15분, 완만
- 하산: 별도 완만 경로 사용 가능
- 불확실: 개인 신체 조건에 따라 경험 크게 달라짐
- 결론: 신체 조건 확인 후 안내 가능함을 표현
```

---

### Scenario H-3: "향일암 2시간이면 충분할까요?"

**Selected PUs:** PU-HY-005, PU-HY-006, PU-HY-001

**Prepared Knowledge:**
```
FACT:
- 표준 방문 (매표소→암자→하산): 약 45~90분
  - 빠른 성인: ~45분
  - 여유 방문: 60~90분
- 이동 시간 (여수엑스포역 기준):
  - 자동차/택시: 약 36분 편도 (약 ₩40,000~48,000)
  - 버스(111, 116번): 약 1시간 27~30분 (배차 간격 30~80분)

CALCULATION:
- 자동차 이용 시: 왕복 72분 이동 + 방문 45~90분 = 총 117~162분 (약 2~2.7시간)
  → 2시간 = 빠른 방문 기준 간신히 가능 / 여유 있는 방문은 부족
- 버스 이용 시: 왕복 약 3시간 이동만 → 2시간으로 왕복 불가능
- 출발지가 향일암 근처이면: 방문 45~90분 = 2시간 내 충분히 가능

JUDGMENT INGREDIENT:
- 핵심 변수: 출발지 + 이동 수단
- "2시간이면 충분할까요" → SOUL 반드시 ASK or QUALIFY:
  "지금 어디 계세요? / 어디서 출발하시나요?" → 이동 시간 포함 여부 기준 판단

EXCLUDED from 표준 방문:
- 금오산 전망대 추가: +30분
- 금오봉 정상 산행: +3시간 (별도 코스)
```

---

### Scenario C-1: "케이블카 어디서 타요?"

**Selected PUs:** PU-CC-001, PU-CC-002, PU-CC-005

**Prepared Knowledge:**
```
FACT:
- 두 개의 탑승장:
  자산정류장[해야] — 육지/자산공원 측, 오동도 인근, 여수엑스포역 약 1.5km
  돌산정류장[놀아] — 돌산도(섬), 돌산공원 내, 돌산대교 건너

자산정류장 접근:
  - 여수엑스포역: 도보 약 20~25분 / 버스 / 택시 약 5~10분
  - 오동도 입구에서: 도보 약 5분

돌산정류장 접근:
  - 시내에서: 버스 또는 자가용 (돌산대교 건너야 함)
  - 택시: 시내에서 약 10~15분

OPERATING (SEMI_STABLE):
  - 운영: 09:30~21:30 (토 연장); 강풍주의보 시 중단
  - 요금: 일반 왕복 ₩17,000 / 편도 ₩14,000
         크리스탈 왕복 ₩24,000 / 편도 ₩19,000
  - 정기 점검: 수요일 패턴 (VERIFY before visit)

LIVE: 현재 운행 여부 확인 ☎ 061-664-7301
```

---

### Scenario C-2: "차 있는데 케이블카 어디서 타야 해요?"

**Selected PUs:** PU-CC-001, PU-CC-003, PU-CC-002, PU-REL-003, PU-REL-006

**Prepared Knowledge:**
```
VEHICLE CONTEXT:
- 자산정류장 측 주차 (자산공원 복합 구역):
  - 오동도 공영주차장/주차타워: 237대, 1시간 무료, 이후 200원/10분, 5,000원/일 최대
  - 동백 공영주차장: 112대, 1시간 무료
  - 여수엑스포 주차장: 733대, 400원/10분, 13,000원/일 최대 (24시간, 넓음)
  - 소규모 60대 주차장도 일부 있음 (30분 무료, 500원/30분)

- 돌산정류장 측 주차: 돌산공원 내 주차장 (유료); 성수기 가능

RECOMMENDATION:
- 자산 측 주차 = 일반적 (오동도 방향 연결 편리)
- 자산 탑승 → 돌산 하차 후: 돌산 관광 → 택시 또는 버스로 복귀
- 돌산 탑승 → 자산 하차: 자산에 이미 주차된 경우 자연스러운 귀환

DIRECTION × VEHICLE (REL-006):
- 차량 주차 위치가 방향 선택에 영향 → 먼저 주차 위치 결정 후 탑승 방향 선택
- 편도 + 택시 복귀: 가장 유연한 방식

LIVE:
- 성수기 자산 측 주차 혼잡 가능 → 이른 도착 권장
- 케이블카 운행 여부 확인 ☎ 061-664-7301
```

---

### Scenario C-3: "케이블카 타고 오동도도 가려고요"

**Selected PUs:** PU-REL-001, PU-REL-002, PU-REL-003, PU-REL-004, PU-CC-005, PU-CC-001

**Prepared Knowledge:**
```
DIRECTIONAL PLAN:
- 오동도와 케이블카 연결 방법:
  A) 오동도 먼저 → 자산정류장 탑승 → 돌산 관광 (자산=오동도 근처이므로 연결 용이)
  B) 돌산정류장 탑승 → 자산정류장 하차 → 도보 5분 → 오동도

- 돌산정류장 하차 후 오동도 이동: 비현실적 (돌산대교 건너야 함)

SEQUENCE RECOMMENDATION:
- 편도 이용 시: 돌산 탑승→자산 하차→오동도 OR 오동도→자산 탑승→돌산
- 왕복 이용 시: 자산 탑승→돌산→자산 귀환 → 오동도는 자산 인접이므로 전후 방문

COMBINED TIME ESTIMATE:
- 케이블카 + 오동도 = 약 2.5~4시간 (대기 시간 포함)
- 성수기 케이블카 대기: 최대 1~2시간 WE 확인

NIGHTTIME NOTE:
- 야간 오동도 방문 + 케이블카 연결: 동백숲 야간 어두움 유의
  (오동도 숲길 조명 제한적 → 야간 탐방 다소 어두울 수 있음)

LIVE_CHECK:
- 케이블카 야간 운행: 21:30까지 (강풍주의보 시 중단)
- 오동도 섬 자체: 24시간 개방 (동백열차는 17:00~18:00 이후 중단)
```

---

### MT-1: Multi-Turn — C-1 Base → Vehicle Context Added

**Turn 1 (C-1 base): 케이블카 어디서 타요?**  
→ Pull: PU-CC-001, PU-CC-002, PU-CC-005 (same as C-1)

**Turn 3 (traveler reveals: 차 있어요):**  
→ Extend with: PU-CC-003, PU-REL-003, PU-REL-006

**Model A Trigger Rule:**  
Detect vehicle-context signal in Turn 3 → add CC-003, REL-003, REL-006 units → integrate with Turn 1 context → produce revised recommendation

**Prepared Knowledge (Vehicle Extension):**
```
VEHICLE ADDITION (based on Turn 3 signal):
→ 차 있으시면: 자산정류장 측 주차 추천 (오동도 인근, 1,000+대 복합)
→ 편도 자산→돌산: 돌산 관광 후 택시 복귀 가능
→ 돌산→자산 편도: 자산 측 차량 자연 귀환
→ 주차 세부: 오동도 주차타워(237대, 1시간 무료), 엑스포 주차장(733대, 넓음)
```

---

## 3. Model A Package Integrity Gate

| Check | Result |
|-------|--------|
| All 10 scenarios covered | ✓ |
| H-2 DOES NOT contain yes/no suitability verdict | ✓ |
| H-2 MANDATORY ASK STRUCTURE present | ✓ |
| KL-001 applied to H-1, H-2 | ✓ |
| KL-002 applied to H-2 only | ✓ |
| FINAL ANSWER layer NOT present in any scenario | ✓ |
| LIVE fields marked as LIVE_CHECK | ✓ |
| SEMI_STABLE fields carry verify annotation | ✓ |
| All facts traceable to admitted ERs | ✓ |
| No fabricated facts outside Evidence Pool | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
