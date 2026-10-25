# CUSTOM-ROUTE-V01-DESIGN
# 소원이 직접 입력형 맞춤 항로 V0.1 — 최소 설계

생성일: 2026-10-25
상태: DESIGN — 설계 완료, 구현 대기 (Founder Q1·Q2 결정 반영)
Branch: docs/production-qa-v01
근거: Guardian Decision — Sowoni Custom Route V0.1 (2026-10-25)
작성자: Claude Code (Antigravity fork)

참조:
- CAND-EXP-003: `docs/constitution/candidate/CAND-EXP-003_Wish_First_Adaptive_Route.md`
- PR #115 (cap fix SHA: d6323c9): `_applyClusterDiversity` context-aware maxCount — MERGED
- PR #121 (Stay Time DB Update): hamel=30, hyangiram=120 — MERGED, PRODUCTION LIVE
- PR #130: Production QA Evidence §12 — OPEN (docs branch, 미병합)

---

## §0. Evidence 정합성 확인

### A. 195분 확정 — 설계 에이전트 오류 수정

시나리오: hamel_lighthouse(stay=30) + hyangiram(stay=120) + 이동(hamel→hyangiram, op=45)

DB 기준 (migration 207, DEPLOYED_AND_VERIFIED 2026-10-25):
- hamel_lighthouse.avg_stay_minutes = **30** (NULL → 30)
- hyangiram.avg_stay_minutes = **120** (90 → 120)

파이프라인 계산 (`travelGuideService.js:351,364-371`):
```
totalStayMinutes       = 30 + 120 = 150
verifiedTravelMinutes  = 45  (VERIFIED_TRAVEL_EDGES 'hamel_lighthouse→hyangiram', op=45)
totalKnownMinutes      = 150 + 45 = 195
195 < 270 → fits_comfortably
```

**결론: 195분이 정확한 파이프라인 값.**
설계 에이전트 오류: hamel stay=45 (cablecar 값) 를 잘못 사용 → 165+45=210 오산. 실제: 150+45=**195**.

### B. 285분 vs 300분 — 근거

시나리오: hamel+hyangiram + meal(60) + cafe(30) + 270분

파이프라인 계산 (`travelGuideService.js:351,364-371`):
```
totalStayMinutes       = 150  (hamel=30 + hyangiram=120)
verifiedTravelMinutes  = 45
actualMealMinutes      = 60
actualCafeMinutes      = 30
totalKnownMinutes      = 150 + 45 + 60 + 30 = 285
```
estimated_total_range.min = 150+45+60 = 255 (카페 제외)
estimated_total_range.max = 150+45+60+30 = 285

**결론: 285분이 정확한 파이프라인 값.** 285 > 270 → `budget_exceeded`.
설계 에이전트 오류: hamel stay=45 잘못 사용 → 300으로 오산. 실제: **285**.
※ 식사/카페 옵션은 V0.1 제외 (GPT 추출 신뢰성 미검증).

### C. PR #130 병합 여부

```
git log --oneline (현재 브랜치: docs/production-qa-v01)
최신: 80902fd docs(evidence): §12 정합성 설명 추가
```

**PR #130: 현재 브랜치에서 OPEN, main 미병합.**
최신 Production SHA: `75223a6` (dep-dbenuu0ae00c73dovmq0, 2026-10-25 13:05 KST)

### D. PLACE_ALIAS_MAP 18개 vs travel_places DB

PLACE_ALIAS_MAP 고유 코드 (13개):
```
lee_soon_shin_plaza, odongdo, hyangiram, cablecar, jaisan_park,
dolsan_daegyo, dolsan_nightscape, romantic_pojangmacha, jungang_market,
sky_tower, marine_park, hamel_lighthouse, yeosu_expo_park
```

travel_places seed 001 고유 행 (13개):
```
hyangiram, dolsan_daegyo, dolsan_nightscape, lee_soon_shin_plaza,
romantic_pojangmacha, jungang_market, yeosu_expo_park, sky_tower,
marine_park, odongdo, cablecar, jaisan_park, hamel_lighthouse
```

**결론: 1:1 완전 일치. 불일치 없음.**
- PLACE_ALIAS_MAP에만 있고 DB에 없는 코드: 없음
- DB에 있고 PLACE_ALIAS_MAP에 없는 코드: 없음
- 별칭(alias) 18개 → unique code 13개 (복수 별칭이 같은 코드를 가리킴)

### E. PR #115 cap=3 수정 상태

SHA: `d6323c9` (MERGED) — `_applyClusterDiversity` context-aware maxCount 적용.
재조사 없음. 이미 Production 반영.

---

## §1. 장소 목록 + 검증 상태 정책

### 대표 8개 (첫 화면)

SOUL Phase 1 완료 장소 — experience_ko Founder 승인, Phase 1 CLOSED:

| 표시명 | place_code | avg_stay | SOUL Phase 1 |
|---|---|---|---|
| 하멜등대 | hamel_lighthouse | 30분 | ✅ CLOSED |
| 향일암 | hyangiram | 120분 | ✅ CLOSED |
| 오동도 | odongdo | 120분 | ✅ CLOSED |
| 케이블카 | cablecar | 45분 | ✅ CLOSED |
| 돌산공원 | dolsan_nightscape | 45분 | ✅ CLOSED |
| 돌산대교 | dolsan_daegyo | 30분 | ✅ CLOSED |
| 종포해양공원 | marine_park | 75분 | ✅ CLOSED |
| 이순신광장 | lee_soon_shin_plaza | 45분 | ✅ CLOSED |

### 전체 펼치기 (+5개)

PLACE_ALIAS_MAP에 있지만 SOUL Phase 1 미완료:

| 표시명 | place_code | avg_stay | SOUL Phase 1 |
|---|---|---|---|
| 자산공원 | jaisan_park | 30분 | ⏳ 미완료 |
| 낭만포차거리 | romantic_pojangmacha | 60분 | ⏳ 미완료 |
| 중앙시장 | jungang_market | 75분 | ⏳ 미완료 (TG 추천 전면 제외 상태) |
| 스카이타워 | sky_tower | 60분 | ⏳ 미완료 |
| 엑스포공원 | yeosu_expo_park | 120분 | ⏳ 미완료 |

### 검증 상태 표시 정책

- **이동시간 검증됨**: VERIFIED_TRAVEL_EDGES에 있는 구간 → 분 단위 표시
- **이동시간 미검증**: edge 없는 구간 → `travel_time_unverified` → "이동시간 확인 중" 문구
- **역방향 미검증 예시**: hyangiram→hamel_lighthouse edge 없음 → unverified 처리 (NAVER 측정 후속)
- 미검증 장소 선택 시 이동시간 없이 표시 — 거짓 정보 생성 금지

---

## §2. 입력→SOUL 메시지 변환 계약

### 입력 스펙

```
{
  selected_places: string[]   // place_codes, 1~N개 (PLACE_ALIAS_MAP 기준)
  available_minutes: number   // 임의 정수, 최소 60, 최대 540
  include_meal: boolean       // 선택 (default: false)
  include_cafe: boolean       // 선택 (default: false)
}
```

### 메시지 생성 함수 (pseudo-code)

```js
const PLACE_DISPLAY_KO = {
  hamel_lighthouse:    '하멜등대',
  hyangiram:           '향일암',
  odongdo:             '오동도',
  cablecar:            '케이블카',
  dolsan_nightscape:   '돌산공원',
  dolsan_daegyo:       '돌산대교',
  marine_park:         '종포해양공원',
  lee_soon_shin_plaza: '이순신광장',
  jaisan_park:         '자산공원',
  romantic_pojangmacha:'낭만포차거리',
  jungang_market:      '중앙시장',
  sky_tower:           '스카이타워',
  yeosu_expo_park:     '엑스포공원',
};

function buildSoulMessage({ selected_places, available_minutes, include_meal, include_cafe }) {
  const names = selected_places.map(c => PLACE_DISPLAY_KO[c]).join(', ');
  const parts = [`${names} 가고 싶어요.`];

  const options = [];
  if (include_meal) options.push('식사');
  if (include_cafe) options.push('카페');
  if (options.length > 0) parts.push(`${options.join('+')} 포함해서`);

  parts.push(`${available_minutes}분 코스 짜줘.`);
  return parts.join(' ');
}
```

### 예시

| 입력 | 생성 메시지 |
|---|---|
| places=[hamel, hyangiram], min=270 | "하멜등대, 향일암 가고 싶어요. 270분 코스 짜줘." |
| places=[cablecar], min=120, meal=true | "케이블카 가고 싶어요. 식사 포함해서 120분 코스 짜줘." |
| places=[hamel, hyangiram, odongdo], min=480, meal=true, cafe=true | "하멜등대, 향일암, 오동도 가고 싶어요. 식사+카페 포함해서 480분 코스 짜줘." |

### SOUL 파이프라인 처리 흐름

```
buildSoulMessage() 출력
  → POST /api/dt/travel/input/text { message, session_id }
  → sharedJourneyService.extractSharedJourney()
       ↳ GPT: want=[{place_hint:'하멜등대',specificity:'EXPLICIT'},{place_hint:'향일암',specificity:'EXPLICIT'}]
  → contextExtractionService: time_available_minutes=270 (USER_EXPLICIT, 치환 없음)
  → soyeowoolService P-NEW-1: must_visit_place_ids=['hamel_lighthouse','hyangiram']
  → travelGuideService.recommend(): anchor recovery → _selectPlacesByTime Step1 우선 선택
  → CourseDisplay 렌더링
```

### 검증됨 (sharedJourneyService 프롬프트 확인)

`sharedJourneyService.js:113`: GPT 프롬프트 `"want": [{ "place_hint": "string", "specificity": "EXPLICIT" }]`
배열 형식 → 복수 항목 모두 추출됨. `_normalize()` 내 `Array.map`으로 전체 보존.

---

## §3. 최소 UI 와이어프레임

배치 결정 (Q1): **코스 생성 전, 여행 가능 시간 입력과 같은 화면**

```
┌──────────────────────────────────────┐
│  어디 가고 싶으세요?                   │  ← 섹션 헤더
│                                      │
│  [하멜등대] [향일암] [오동도]          │
│  [케이블카] [이순신광장] [돌산공원]    │  ← 대표 8개 칩 (토글 선택)
│  [돌산대교] [종포해양공원]             │
│  [+ 더 보기 ▼]                       │  ← 미완료 5개 접힘
│                                      │
│  ── 얼마나 여행하실 건가요? ──        │
│                                      │
│  [ 2~3시간 ]  [ 반나절 ]  [ 하루 ]   │  ← 빠른 선택 칩 (기존 TIME_OPTIONS 재사용)
│  또는 직접 입력: [   270   ] 분      │  ← 숫자 입력 (임의 분, 60~540)
│                                      │
│  □ 식사 포함    □ 카페 포함          │  ← 선택 옵션 체크박스
│                                      │
│  ┌─────────────────────────────────┐ │
│  │  소울이에게 코스 추천받기  →    │ │  ← CTA 버튼 (장소 1개 이상 + 시간 선택 시 활성)
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

#### 상태 규칙

- 장소 0개 선택: CTA 버튼 비활성 (disabled)
- 장소 1개 이상 + 시간 선택: CTA 활성
- 시간 빠른선택 클릭 → 입력 필드 자동 채움 (2~3시간=150, 반나절=300, 하루=480)
- 직접 입력 시 빠른선택 칩 선택 해제
- 선택된 장소 칩: 시각적 강조 (배경색/체크 아이콘)

#### 기존 컴포넌트 재사용

- `TIME_OPTIONS` 칩 패턴: `MuyojeongHomePage.jsx:60-64` 그대로 재사용
- `CourseDisplay`: `MuyojeongHomePage.jsx:35` import 그대로 재사용
- `getOrEnsureGuestCredential`: `MuyojeongHomePage.jsx:34` 그대로 재사용
- SOUL POST 엔드포인트: `/api/dt/travel/input/text` 그대로 재사용

---

## §4. 시간 계산 Evidence

### 270분 기준 시나리오 (no meal, no cafe)

DB 값: hamel_lighthouse.avg_stay=30, hyangiram.avg_stay=120 (migration 207 DEPLOYED_AND_VERIFIED)

```
_selectPlacesByTime:
  mealReserve = 0, cafeReserve = 0
  availableForPlaces = 270
  Step1: hamel_lighthouse(30) ≤ 270 → 선택, placesTimeUsed=30
         hyangiram(120) ≤ 270-30=240 → 선택, placesTimeUsed=150
  Step2: targetStops=ceil(270/120)=3, 남은 slot=1 → 추가 장소 시간 허용 시 선택

_composeJourney:
  totalStayMinutes       = 30+120 = 150
  verifiedTravelMinutes  = 45  (hamel→hyangiram VERIFIED op=45)
  actualMealMinutes      = 0
  actualCafeMinutes      = 0
  totalKnownMinutes      = 195
  195 < 270 → fits_comfortably ✅

estimated_total_range:
  min = 150+45+0 = 195
  max = 150+45+0+0 = 195
```

### 270분 + 식사 + 카페 (V0.1 미구현 참고용)

```
_selectPlacesByTime:
  mealReserve=60, cafeReserve=30 (hasMeal=true, 270≥180)
  availableForPlaces = 270-60-30 = 180
  Step1: hamel(30≤180)✓, hyangiram(30+120=150≤180)✓ → 두 장소 모두 선택

_composeJourney:
  totalKnownMinutes = 150+45+60+30 = 285
  285 > 270 → budget_exceeded ✅

estimated_total_range:
  min = 150+45+60 = 255  (카페 제외)
  max = 150+45+60+30 = 285
```

### 이동시간 미검증 케이스

```
역순 hyangiram→hamel_lighthouse:
  VERIFIED_TRAVEL_EDGES: 키 없음
  _buildJourneyBlocks: status='unknown'
  fitStatus = 'travel_time_unverified' (정직한 처리, 기능 오류 아님)
```

---

## §5. 테스트 및 수용 기준

| ID | 기준 | 판정 방법 | 예상 결과 |
|---|---|---|---|
| T1 | 장소 1개 선택 → SOUL 코스 응답 | response.status | COURSE_DISPLAY |
| T2 | 장소 2개 선택 → 두 장소 모두 course.blocks | blocks[].place_code 집합 | hamel, hyangiram 모두 포함 |
| T3 | 270분 입력 → time_available_minutes=270 | understood_context 필드 | 270 (치환 없음) |
| T4 | 선택 장소 누락 없음 | must_visit_place_ids ⊆ blocks | 100% 포함 |
| T5 | fitStatus 3-way | summary.fit_status | fits/exceeded/unverified |
| T6 | 식사 포함 시 mealReserve=60 | 총시간=stay+travel+60+cafe | 300분 |
| T7 | CAR GOVERNANCE_HOLD 유지 | _estimateTravelTime() 미변경 | Stub 유지 |
| T8 | 장소 0개 → CTA 비활성 | 버튼 disabled 상태 | disabled |
| T9 | 빠른선택 클릭 → 입력 자동채움 | input.value | 150/300/480 |
| T10 | 역순 하멜→향일암 | fitStatus | travel_time_unverified |

---

## §6. Open Items (구현 전 결정 대기)

| ID | 항목 | 우선순위 | 비고 |
|---|---|---|---|
| OI-1 | hyangiram→hamel_lighthouse reverse edge 측정 | 중간 | Founder NAVER 측정, V0.1 차단 아님 |
| OI-2 | jungang_market 표시 여부 | 낮음 | TG 추천 전면 제외 상태 (travelGuideService.js:56). "전체 펼치기"에 포함하되 코스에 미등장 가능성 명시 |
| OI-3 | desired_start_time 지원 여부 | 낮음 | 현재 파이프라인 미지원. V0.1 범위 제외, 별도 검토 |

---

## §7. 기존 설계 결정과 충돌 여부

**충돌 없음.**

- D2 결정: 새 질문은 페이지 깊이 추가, 교체 금지 → 기존 채팅 UI 교체 아님, 진입점 추가
- SOUL Product Vision V0.1: SOUL이 관계를 시작 → 장소 선택 칩이 관계 시작 진입점 역할
- CAR GOVERNANCE_HOLD: `_estimateTravelTime()` 미변경 유지
- CAND-EXP-003 Principles: Wish-First(소원이 장소 먼저 선택), 정보 투명성(미검증 구간 솔직 표시)

---

## Current Next Action (exactly 1)

**`MuyojeongHomePage.jsx`에 장소 선택 칩 + 시간 직접 입력 UI를 추가하는 V0.1 구현 착수. (Founder 구현 승인 후)**

---

*이 문서는 설계 단계 산출물. 코드 변경 없음. 구현은 별도 Preflight + Founder 승인 후 시작.*
