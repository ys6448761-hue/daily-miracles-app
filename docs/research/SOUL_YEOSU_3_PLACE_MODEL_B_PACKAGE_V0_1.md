# SOUL Yeosu — 3-Place Model B Package V0.1

**Date:** 2026-09-28  
**Branch:** staging/storybook-c7a  
**Phase:** Prepared Knowledge Construction V0.1  
**Model Type:** Model B — Context pre-activated from Traveler State BEFORE question received  
**Source:** SOUL_YEOSU_3_PLACE_PREPARATION_UNITS_V0_1.md (same Evidence Pool as Model A)  
**Status:** PILOT_READY — pending Founder authorization for Pilot execution

---

## 0. Model B Definition

Model B = SOUL activates a full place-context **before** the question arrives, based on Traveler State signals. When the question is received, the relevant knowledge is already "warm" and SOUL synthesizes from it without needing to first retrieve.

**Behavior pattern:**
1. Traveler State signals a place (e.g., traveler is at Hyangiram, or has declared they're heading there)
2. SOUL activates the full place context for that location
3. When question arrives, SOUL already holds all relevant PUs
4. SOUL synthesizes response from pre-loaded context

**Model B advantage being tested:** Richer context integration; reduces retrieval latency; companion relationship feel  
**Model B risk being tested:** Over-activation may load irrelevant knowledge; may bias response before question scope is clear

**CRITICAL:** Model A and Model B share IDENTICAL Evidence Pool. The facts, limitations, and KNOWN_LIMIT constraints are the same. The difference is activation timing, not content.

---

## 1. Traveler State Signals → Context Activation Map

| Traveler State Signal | Pre-Activate Context Blocks |
|----------------------|----------------------------|
| "오동도 가려고요" / 오동도 체류 중 | ODONGDO_FULL_CONTEXT |
| "향일암 가려고요" / 향일암 체류 중 | HYANGIRAM_FULL_CONTEXT |
| "케이블카 가려고요" / 케이블카 이용 의향 | CABLECAR_FULL_CONTEXT |
| "오동도 + 케이블카 같이" | ODONGDO_FULL + CABLECAR_FULL + REL_CONTEXT |
| "부모님이랑" + (향일암 context) | HYANGIRAM_FULL_CONTEXT + KL-001 + KL-002 ACTIVE |
| Vehicle signal + (cable car context) | CABLECAR_FULL + VEHICLE_EXTENSION |

---

## 2. Pre-Activated Context Blocks

### BLOCK: ODONGDO_FULL_CONTEXT

**Pre-loaded at:** Traveler declares 오동도 visit intent  
**Contains:** PU-OD-001, PU-OD-002, PU-OD-003, PU-OD-004, PU-OD-005, PU-OD-006, PU-OD-007

```
[ODONGDO ACTIVATED — SOUL holds:] 

CHARACTER:
- 섬 규모: 0.12km², 탐방로 2.5km, 방파제 768m (무료, 도보 15분)
- 동백나무 3,000그루 (개화 1~3월); 용굴, 등대(25m 전망대), 음악분수, 대나무터널
- "누구나 부담 없이" — 접근 장벽 낮음, 유모차 가능
- 입장: 24시간 무료 (섬 자체); 동백열차 1,000원 별도

DURATION:
- 기본 1시간 루프; 사진/여유: 2시간; 가족: 반나절 가능

ACCESS:
- 사유차량 진입 절대 금지 (방파제)
- 동백열차: 09:30~17:50(성수기)/17:00(동절기), 점심 중단 12:00~13:00
- 폭우 시 열차 중단 → 도보 방파제만 가능

PARKING:
- 오동도 공영주차장 237대, 1시간 무료, 이후 200원/10분
- 성수기 주말 오전 10시 이후 혼잡

LIVE_FLAGS:
- 동백열차 현재 운행: VERIFY (우천 시 중단)
- 음악분수 당일 운영: SEMI_STABLE (계절 시즌)
- 등대: 월요일 휴관, 18:00까지(동절기 17:00)

SEASONAL:
- 동백 개화기 1~3월 = 시각적 최고점
```

---

### BLOCK: HYANGIRAM_FULL_CONTEXT

**Pre-loaded at:** Traveler declares 향일암 visit intent  
**Contains:** PU-HY-001, PU-HY-002, PU-HY-003, PU-HY-004, PU-HY-005, PU-HY-006  
**⚠️ KNOWN_LIMIT KL-001 ACTIVE (KL-002 activates only when 부모님/어르신 signal received)**

```
[HYANGIRAM ACTIVATED — SOUL holds:]

PHYSICAL STRUCTURE:
- 접근: 임포주차장 → 숲길 → 계단 → 석문들 → 관음전
- 계단: ~398계단, 다단계 급경사
- 석문 7개: 해탈문(한 사람 폭, 허리 숙임 필수), 제2 석문(앞으로 굽힘)
- 경로 분기 (매표소):
  - 계단길: 급경사, 10분
  - 평지길: 완만, 15분
- 하산: 별도 완만 우회 경로 존재

EXPERIENTIAL BURDEN:
- 오름 시 숨 찬 + 땀: 일반적 반응 (체력 의존적)
- "fairly vertical" / "가파름" — 복수 소스 일치
- 여름 열기 = 강도 배가 요인
- 체력 좋은 성인: "어렵지 않음"
- 어린이(5세+) 완주 확인 (성인 동반)

KNOWN_LIMIT KL-001 (ACTIVE):
- 고령/신체 제한 하산 마찰 빈도 = NOT ESTABLISHED
- 신체 능력 ASK 선행 없이 연령 기반 사전 판단 금지

REST STOPS:
- 지정 쉼터 없음 (informative negative)
- 자신의 페이스로 쉬어가며 이동 가능

DURATION:
- 표준 방문: 45~90분 (매표소 기준)
- 계단길 오름: 10~15분; 암자 관람: ~30분; 하산: 10~20분

TRAVEL TIME:
- 엑스포역 기준: 자동차 ~36분 / 버스 ~1시간 30분

SUITABILITY FRAME (H-2 context — KL-002 activates when 부모님 mentioned):
- MUST ASK 이동능력 before any suitability statement
- 계단길 + 평지길 + 완만 하산 → 옵션 3가지 소개 가능
```

**KL-002 Activation Condition:**  
Signal: "부모님" OR "어르신" OR "연세 있으신" appears in question  
→ Immediately activate KL-002 MANDATORY ASK TRIGGER  
→ H-2 PILOT CONTRACT enforced (no yes/no without ASK)

---

### BLOCK: CABLECAR_FULL_CONTEXT

**Pre-loaded at:** Traveler declares cable car visit intent  
**Contains:** PU-CC-001, PU-CC-002, PU-CC-003, PU-CC-004, PU-CC-005

```
[CABLE CAR ACTIVATED — SOUL holds:]

STATION IDENTITY:
- 자산정류장[해야]: 육지, 자산공원, 오동도 인근, 엑스포역 약 1.5km
- 돌산정류장[놀아]: 돌산도(섬), 돌산공원 내
- 공식 병기: 자산[해야]정류장 / 돌산[놀아]정류장

ACCESS:
- 자산 측: 엑스포역 도보 20~25분 / 버스 / 택시 5~10분 / 오동도에서 도보 5분
- 돌산 측: 돌산대교 건너야 함 (버스 또는 자가용)

PARKING (자산 측 복합 구역):
- 오동도 주차타워: 237대, 1시간 무료, 200원/10분, 5,000원/일 최대
- 엑스포 주차장: 733대, 400원/10분, 13,000원/일 최대 (넓음)

CABIN:
- 일반(8인): 왕복 ₩17,000 / 편도 ₩14,000
- 크리스탈(6인, 바닥 투명): 왕복 ₩24,000 / 편도 ₩19,000

OPERATING (SEMI_STABLE):
- 시간: 09:30~21:30 (토 연장); 강풍주의보 시 중단
- 정기 점검: 수요일 패턴
- 요금 변동 가능: VERIFY 권장

LIVE_FLAGS:
- 현재 운행 여부: VERIFY ☎ 061-664-7301
- 성수기 대기: 최대 1~2시간 가능
```

---

### BLOCK: REL_CONTEXT (Cross-Place Relational)

**Pre-loaded at:** Multi-place intent signal (오동도 + 케이블카)  
**Contains:** PU-REL-001, PU-REL-002, PU-REL-003, PU-REL-004, PU-REL-005

```
[RELATIONAL CONTEXT ACTIVATED — SOUL holds:]

DIRECTIONAL GEOGRAPHY:
- 자산정류장 → 오동도: 도보 5분 (직접 연결)
- 돌산정류장 → 오동도: 돌산대교 건너야 함 (비현실적)
- 기본 권장: 돌산 탑승 → 자산 하차 → 오동도; OR 오동도 → 자산 탑승 → 돌산

COMBINED TIME:
- 케이블카 + 오동도 합산: 2.5~4시간 (대기 포함)
- 야간 오동도: 동백숲 어두움 유의

VEHICLE SIGNAL (pre-loaded if vehicle context detected):
- 자산 측 주차 + 편도 케이블카 + 택시 귀환 = 가장 유연한 차량 여행자 패턴
- 방향은 주차 위치에 따라 조정
```

---

## 3. Model B vs Model A Comparison (Pilot Observation Framework)

| Dimension | Model A | Model B |
|-----------|---------|---------|
| Activation Timing | After question | Before question (Traveler State) |
| Context Width | Narrow (per-question selection) | Wide (place-level full activation) |
| Evidence Pool | IDENTICAL | IDENTICAL |
| KNOWN_LIMIT Enforcement | Same | Same |
| H-2 Pilot Contract | Same | Same |
| Expected Advantage | Precision | Relationship continuity |
| Expected Risk | Narrower context | Over-activation / scope bias |

**Evaluation Questions:**
1. Does Model B produce richer responses when question is ambiguous?
2. Does Model A produce more precise responses when question is specific?
3. Does H-2 MISSED_NECESSARY_ASK test behave differently between A and B?
4. Does Model B's pre-loaded KL-001 flag prevent suitability overstep earlier?

---

## 4. Model B Package Integrity Gate

| Check | Result |
|-------|--------|
| Evidence Pool = Model A Evidence Pool (identical) | ✓ |
| H-2 DOES NOT contain yes/no suitability verdict | ✓ |
| H-2 KL-002 MANDATORY ASK TRIGGER defined | ✓ |
| KL-002 activation condition documented (signal: 부모님/어르신) | ✓ |
| KL-001 propagated to HYANGIRAM_FULL_CONTEXT | ✓ |
| FINAL ANSWER layer NOT present in any context block | ✓ |
| LIVE fields marked with LIVE_FLAGS | ✓ |
| SEMI_STABLE fields carry verify annotation | ✓ |
| All facts traceable to admitted ERs | ✓ |
| No fabricated facts outside Evidence Pool | ✓ |
| DB / Schema / Runtime / Production: NO CHANGE | ✓ |
