# SOUL CAR INTENT RESPONSE UX Evidence

**Date**: 2026-10-27  
**Status**: SOUL_MAIN_CAR_INTENT_BROWSER_QA_OPEN  
**SHA**: e246f40 (provenance guard) / f8ece42 (state sync)  
**Authorized**: FOUNDER_VEHICLE_GUIDANCE_SIMPLIFIED (이전 세션) + SOUL_CAR_INTENT_RESPONSE_UX (이번 세션)

---

## §1 변경 목적

Founder Observation: '차량으로' 선택 시 장소 목록과 일반 주차 안내만 나와서 실질적인 차량 여행 도움을 느끼기 어렵다.

개선 원칙:
1. '차량으로' 의도 감지 시 차량 이용 장점 먼저 설명
2. 장소별 실용적 이동 팁 (parking_ko) 제공
3. 추천 장소·태그·SOUL 판단 변경 금지
4. 검증된 범위(향일암 임포주차장, 케이블카 탑승장별)만 사용

---

## §2 변경 내역 (services/soyeowoolService.js)

### 변경 1 — 인트로 텍스트 개선 (line 1886)

**Before:**
```
지금 상황에 맞는 곳을 찾아볼게요.
자차로 이동하기 좋은 곳을 골라봤어요.
```

**After:**
```
차를 가져오셨군요. 이동이 한결 자유롭겠어요.
자차로 다니기 좋은 곳을 골라봤어요.
```

### 변경 2 — PARTIAL has_car 장소 목록에 parking_ko 통합 (line 3308~3316)

**Before:** 장소명만 나열 (`· 이름`)

**After:** 장소명 아래 parking_ko 바로 표시
```
· 향일암
  혼잡할 때는 임포주차장을 이용한 후 도보로 이동하는 방법도 있어요. ...
· 여수 케이블카
  자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. ...
· 오동도
  (parking_ko 없음 — 장소명만 표시)
```

### 변경 3 — C-3 중복 방지 가드 추가 (line 3320)

```js
const _carPartialCovered = status === 'PARTIAL' && !explicit_context.place_code && enrichedSoulContext.has_car === true;
```

PARTIAL+has_car+no place_code 경우 이미 위에서 통합 표시되므로 별도 `주차 정보:` 섹션 스킵.  
SUCCESS path (has_car + explicit time) 또는 place_code 있는 경우 → C-3 정상 작동.

---

## §3 Before / After 예시

### Before (PARTIAL has_car, 차량 여행)
```
차량으로 둘러보기에 좋은 여수의 인기 장소예요.

지금 상황에 맞는 곳을 찾아볼게요.
자차로 이동하기 좋은 곳을 골라봤어요.

· 향일암
· 여수 케이블카
· 오동도

주차 정보:
  · 혼잡할 때는 임포주차장을 이용한 후 도보로 이동하는 방법도 있어요. ...
  · 자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. ...
```

### After (PARTIAL has_car, 차량 여행)
```
차량으로 둘러보기에 좋은 여수의 인기 장소예요.

차를 가져오셨군요. 이동이 한결 자유롭겠어요.
자차로 다니기 좋은 곳을 골라봤어요.

· 향일암
  혼잡할 때는 임포주차장을 이용한 후 도보로 이동하는 방법도 있어요. 실제 운영 상황과 이용 가능 여부는 방문 당일 현장에서 확인해보세요.
· 여수 케이블카
  자산(해야)·돌산(놀아) 양쪽 정류장 모두 접근 가능해요. 자산 탑승장은 주차 후 엘리베이터로 이동해요. 돌산 탑승장은 주차 후 도보로 이동해요.
· 오동도
```

---

## §4 테스트 결과

### 단위·회귀 (e246f40 기준)

| 테스트 | 결과 | 비고 |
|--------|------|------|
| soulCarInfoSeparation.test.js (7/7) | ✅ PASS | CI-2 포함 — SUCCESS path C-3 정상 작동 |
| 전체 회귀 (639/640) | ✅ PASS | R20 PRE-EXISTING 1개 — dolsan_daegyo |

### API 검증 (서버 PID 25068 / 2026-10-27 10:39 재시작 / e246f40 반영)

| 항목 | 검증 방법 | 결과 |
|------|---------|------|
| A. '차량으로' 버튼 → "차를 가져오셨군요." 인트로 | HTTP API | ✅ PASS |
| B. 케이블카 자산 엘리베이터·돌산 도보 안내 | HTTP API | ✅ PASS |
| C. 향일암 혼잡 시 임포주차장 안내 | HTTP API | ✅ PASS |
| D. "주차 정보:" 중복 섹션 없음 (`_carPartialCovered` 가드 작동) | HTTP API | ✅ PASS |
| E. 비차량 쿼리("여수 명소 추천해줘") — 차량 인트로 없음 | HTTP API | ✅ PASS |
| F. 기존 추천 장소·게이팅 불변 (TG_READY: 케이블카/하멜등대/향일암) | HTTP API | ✅ PASS |

### 브라우저 검증 — OPEN (자동화 불가)

| 항목 | 상태 |
|------|------|
| '차량으로' 버튼 클릭 → 화면 렌더링 확인 | OPEN — Founder 브라우저 확인 필요 |
| 모바일 뷰포트 | OPEN |

**브라우저 확인 URL**: `http://localhost:5000/muyojeong`  
서버 재시작: Founder 로컬에서 `node server.js` 재실행 필요 (e246f40 반영)

### has_car provenance 구분

| 경로 | `has_car` 값 | `_provenance.has_car` | 결과 |
|------|------------|----------------------|------|
| '차량으로' 버튼 (`explicit_context.has_car: true`) | `true` | `USER_EXPLICIT` | 차량 인트로 표시 ✅ |
| 일반 텍스트 쿼리 (차량 언급 없음) | `true` (backward-compat) | `UNKNOWN` | 차량 인트로 없음 ✅ |

---

## §5 변경하지 않은 것

| 항목 | 상태 |
|------|------|
| SOUL 추천 로직 | 변경 없음 |
| SOUL API/DB/Schema | 변경 없음 |
| CAR GOVERNANCE_HOLD | 유지 |
| `_estimateTravelTime()` V0 Stub | 유지 |
| _PLACE_KNOWLEDGE parking_ko 데이터 | 이전 세션(SOUL_VEHICLE_GUIDANCE_MINIMAL)에서 추가됨 — 이번 세션 추가 없음 |
| MAP 마커 상태 | 변경 없음 |

---

## §6 수정 파일

| 파일 | 변경 내용 |
|------|---------|
| `services/soyeowoolService.js` | 인트로 텍스트 1줄 + PARTIAL has_car 통합 표시 + _carPartialCovered 가드 |
