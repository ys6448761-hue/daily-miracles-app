# PILOT-INTENT-002 — Hotel-to-Starlight SOUL Answer Gap 분석

생성일: 2026-10-24
상태: Pilot Evidence — 읽기 전용 / Runtime 변경 금지 / Founder 검토 대기
작성자: Claude Code (Antigravity 인스턴스)
근거: PILOT-INTENT-001_Traveler_Intent_8Keywords.md (K-5, K-6)
갱신: 2026-10-24 Phase A Evidence 추가 (신라스테이→이순신광장 CAR/WALK)

---

## 분석 대상 질문

> "신라스테이 여수에 묵는데 차를 호텔에 두고 여수 밤바다를 즐길 수 있을까요?"

이 질문은 K-5(여수 호텔 근처 가볼 만한 곳)와 K-6(여수 차 없이 여행하기)를 동시에 포함한다.

---

## Runtime 실제 처리 추적 (2026-10-24 기준)

### 처리 경로

| 단계 | 체크 항목 | 결과 |
|------|-----------|------|
| ① | DISCOVERY_OVERRIDES (근처/갈만/추천해/하고 싶 등) | **미발동** — "즐길 수 있을까요"는 패턴 미해당 |
| ② | PLACE_LOOKUP (alias 등록 장소 감지) | **미발동** — "신라스테이", "밤바다" 미등록 |
| ③ | MVP_HOTELS 호텔 코드 추출 | **미인식** — 신라스테이 = MVP_HOTELS 미등록 |
| ④ | JOURNEY_PLANNING 감지 | **미발동** — 일정 짜달라는 요청 없음 |
| ⑤ | 최종 경로 | **CLARIFICATION** — 여행 상황 파악 질문 생성 |

### MVP_HOTELS 등록 현황 (`quoteContextService.js:15`)

```js
const MVP_HOTELS = {
  '라마다': 'ramada', '라마다호텔': 'ramada', 'ramada': 'ramada',
  '케니': 'kenny', '케니호텔': 'kenny', 'kenny': 'kenny'
};
```

미등록: 신라스테이, 소노캄 여수, 여수 베네치아 호텔&스위트, 유탑 마리나 호텔&리조트

---

## 현재 답변 vs 목표 답변

### 현재 답변 (실제 Runtime)

SOUL은 CLARIFICATION 경로로 진입하여 여행 상황 파악 질문을 생성한다.

예시: "여행 계획 도와드릴게요. 몇 분이 함께 여수에 오시나요?"

질문 내용(신라스테이, 밤바다 산책, 차 없는 이동)에 대한 실질적 답변 없음.

### 목표 답변 (기존 지식 기반 구성)

다음 내용을 포함할 수 있어야 한다:

```
신라스테이에서 여수 해안 산책 출발점까지는 도보로 [N분] 거리예요.
차를 두고 이순신광장~종포해양공원~하멜등대 해안 구간(약 1.2km)을
천천히 걸으면 밤바다와 항구 야경을 즐길 수 있어요.
[종포해양공원: 잠시 쉬어가기 좋은 해안 공원] [하멜등대: 여수 밤바다 끝 감정 장소]
돌아오는 길도 같은 코스로 걸어오거나, 늦은 시간에는 택시를 이용하는 방법도 있어요.
호텔 주차는 체크인 시 문의해보세요.
```

---

## Phase A Evidence — 신라스테이 여수 → 이순신광장 (2026-10-24 확보)

출처: Founder 제공 네이버 지도 캡처 2장, 2026-10-24.
방향: **신라스테이 여수 → 이순신광장** (단방향 확인, 역방향 자동 생성 금지)
8×8 관광지 이동 매트릭스에 호텔 추가 금지.

| 교통수단 | 경로 유형 | 원본 소요시간 | 거리 | display 참고값 | 상태 |
|----------|-----------|--------------|------|----------------|------|
| CAR | 추천 경로 | 5분 | 1.9km | 약 5분 | EVIDENCE_VERIFIED |
| WALK | 추천 경로 | 26분 | 1.7km / 2,619보 | 약 25분 | EVIDENCE_VERIFIED |
| WALK | 대체 경로 | 27분 | 1.7km | 약 25분 | EVIDENCE_VERIFIED |

**display 참고값 주석:** 5분 단위 기준 적용 시 WALK 26→25분(-4%), 27→25분(-7%). 표시 정책은 이번 단계에서 변경하지 않는다.

**중복 확인:** CAND-EXP-002-B의 신라스테이 관련 기존 자료는 `낭만포차32번→신라스테이` 방향(WALK 21~22분, CAR 3분). 이번 Evidence는 `신라스테이→이순신광장` 방향 — 중복 없음.

---

## 누락 Evidence 목록

| # | 누락 항목 | 현재 상태 | 개선 레벨 |
|---|-----------|-----------|-----------|
| E1 | 신라스테이 `MVP_HOTELS` 등록 | 미등록 | 코드 변경 필요 |
| E2 | 신라스테이 → 이순신광장 이동시간 | **✓ Phase A 확보** (CAR 5분/1.9km, WALK 26분/1.7km) | **완료** |
| E3 | 이순신광장~하멜등대 1.2km/18~25분 Runtime 주입 | SSOT-ROUTE-003 Draft, Runtime 미연결 | 코드 변경 필요 (Phase 2) |
| E4 | 호텔 → 해안 산책 출발점 접근 안내 로직 | CAND-EXP-002-B Candidate, Runtime 미연결 | 코드 변경 필요 (Phase 2) |
| E5 | 야간 해안 구간 안전성 정보 | 미수집 | Evidence 수집 필요 |
| E6 | 복귀 경로 안내 (도보 복귀 vs 택시) | 미수집 | 간단한 정책 정의 필요 |
| E7 | 신라스테이 호텔 주차 정책 | 미검증 | 호텔 공식 확인 필요 |

### 기존 Evidence 활용 가능 항목 (코드 연결 시)

| Evidence | 자료 위치 | 값 |
|----------|-----------|-----|
| 낭만포차32번→신라스테이 WALK 21~22분 | CAND-EXP-002-B | 역방향 참조 가능 (신라스테이→낭만포차32번 ≈ 유사 거리) |
| 이순신광장~하멜등대 해안 1.2km | SSOT-ROUTE-003 Draft | 실측 검증 후 사용 가능 |
| 종포해양공원 감정 역할: 쉼 | SSOT-LOC-001 Confirmed | 현재 사용 중 |
| 하멜등대 감정 역할: 소원 클라이맥스 | SSOT-LOC-001 Confirmed | 현재 사용 중 |

---

## 정보 추가 vs 코드 변경 구분

### 정보 추가만으로 해결 가능 (코드 변경 없음)

- [E2] 신라스테이→이순신광장(혹은 해안 출발점) 이동시간: Naver Map 1장
- [E5] 야간 해안 구간 접근성 메모
- [E6] 복귀 경로 정책 정의

### 코드 변경 필요 (현재 금지 — Founder 승인 필요)

- [E1] `quoteContextService.js:15` MVP_HOTELS에 신라스테이·소노캄·베네치아 추가
- [E3] 해안 산책 코스 SOUL 안내 경로 추가 (PSQ 또는 신규 JOURNEY_TYPE)
- [E4] 호텔별 해안 접근 안내 로직 추가

### 최소 코드 변경으로 가능한 부분 (Phase B 범위 예시)

```js
// quoteContextService.js MVP_HOTELS 예시 (승인 전 변경 금지)
const MVP_HOTELS = {
  ...기존...,
  '신라스테이': 'shinra_stay_yeosu',
  '소노캄': 'sono_calm_yeosu',
  '베네치아': 'venezia_yeosu',
};
```

---

## 별빛항로 감정 역할 충돌 여부

충돌 없음.

목표 답변의 코스(이순신광장 → 종포해양공원 → 하멜등대)는
SSOT-LOC-001 Confirmed 감정 흐름(연결 → 쉼 → 소원)과 완전히 일치한다.

역순 없음. 기존 장소 역할 침범 없음.

---

## 최소 개선안 (단계별)

### Phase A — 정보 레벨 (즉시 가능, 코드 변경 없음)

1. **신라스테이→이순신광장 이동시간 Evidence 수집** — **✓ 완료 (2026-10-24)**
   - CAR 추천: 5분 / 1.9km
   - WALK 추천: 26분 / 1.7km (대체: 27분 / 1.7km)
   - 출처: Founder 네이버 지도 캡처, 2026-10-24

2. **SSOT-ROUTE-003 실측 검증**
   - 이순신광장~하멜등대 1.2km / 18~25분 지도 실측 공식 확인 — 미완료

3. **복귀 경로 정책 정의**
   - "도보 복귀 가능 / 야간 늦은 시간엔 택시 대안" 문구를 Knowledge에 저장 — 미완료

### Phase B — 코드 레벨 (Founder 승인 후, 별도 PR)

1. `MVP_HOTELS`에 여수 주요 호텔 추가
2. 해안 산책 "차 없는 야간 코스" PSQ 경로 추가 — 신규 기능 (Guardian Preflight 발행 필요)
3. CAND-EXP-002-B Evidence Runtime 연결

---

## Phase A 완료 판정

| 항목 | 상태 |
|------|------|
| E2 신라스테이→이순신광장 Evidence | ✓ 완료 (CAR 5분/1.9km, WALK 26분/1.7km) |
| E5 야간 해안 구간 안전성 | 미수집 |
| E6 복귀 경로 정책 | 미정의 |
| SSOT-ROUTE-003 실측 검증 | 미완료 |

**Phase A 판정: PARTIAL COMPLETE**
E2(핵심 Evidence)는 확보. E5·E6·SSOT-ROUTE-003은 Phase B 코드 변경 착수와 독립적으로 추가 수집 가능.

## Phase B Guardian Preflight 준비 상태

| 검증 항목 | 상태 |
|-----------|------|
| A. 호텔 미인식 (MVP_HOTELS 미등록) | Evidence 확보 완료 — Preflight 발행 가능 |
| B. 밤바다 산책 의도 미인식 (DISCOVERY/PLACE_LOOKUP 미연결) | 원인 확인 완료 — Preflight 발행 가능 |
| 신라스테이→이순신광장 Evidence | ✓ 확보 |
| 해안 산책 코스 기준값 (SSOT-ROUTE-003) | Draft 상태 (실측 미완료) |

**Phase B Guardian Preflight 준비 상태: READY (Founder 승인 대기)**

## Next Action (Founder 결정 필요 — 1개만 지정)

| 번호 | 제안 | 이유 |
|------|------|------|
| **N-1** | **Phase B Guardian Preflight 발행 (MVP_HOTELS + 밤바다 산책 PSQ)** | Phase A Evidence 확보 완료. 두 원인 독립 검증 준비됨. Founder 승인 후 착수 가능. |
| N-2 | SSOT-ROUTE-003 실측 검증 먼저 (지도 실측 1건) | Phase B 코드 기반 강화. Phase B 착수 전 기준값 확정. |
| N-3 | Pilot 종료 — 현재 상태 유지 | 추가 작업 없음. |

---

## 저장 및 Git 상태

- 저장 위치: `docs/knowledge/PILOT-INTENT-002_Hotel_to_Starlight_Answer_Gap.md`
- Git commit: 미실행 (Founder 지시 없음)
- 기존 SSOT·Candidate·Runtime 변경 없음
