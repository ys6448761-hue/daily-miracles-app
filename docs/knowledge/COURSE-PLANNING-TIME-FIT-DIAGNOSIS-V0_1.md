# COURSE-PLANNING-TIME-FIT-DIAGNOSIS-V0_1

생성일: 2026-10-24
상태: READ-ONLY 진단 완료
Production SHA: 4c160529f08616433bb639e0ce153044b998fca5
근거: Founder Observation — COURSE_PLANNING Time Fit Review (2026-10-24)
작성자: Claude Code (Antigravity)

---

## Founder 관찰 요약

| 입력 | 코스 | 체류시간 합계 | 이동시간 |
|------|------|-------------|---------|
| 8시간 | 케이블카 → 하멜등대 → 향일암 | 135분 | 확인 중 |
| 5시간 | 케이블카 → 하멜등대 → 향일암 (동일) | 135분 | 확인 중 |
| 2시간 | 케이블카 → 하멜등대 | 45분 | 확인 중 |
| 공통 | 카페 휴식 카드 표시 | — | — |

---

## 1. "이동시간 확인 중" 표시 원인 (EXPECTED)

### 코드 경로

```js
// services/travelGuideService.js:492-500 (_buildJourneyBlocks)
blocks.push({
  type: 'travel_transition',
  estimated_duration_range: null,  // P0-1: null when status='unknown'
  status: 'unknown',               // V0: No verified travel time data
  message_ko: '이동시간 확인 중',
  note: 'Travel time will be calculated when route data becomes available'
});

// dreamtown-frontend/src/components/TravelGuide/CourseDisplay.jsx:148
{hasTravelUnknown && (
  <p className="course-travel-notice">장소 간 이동시간은 현재 안내가 어렵습니다</p>
)}
```

### 원인

- **모든** Yeosu `travel_transition` 블록이 `status: 'unknown'` (하드코딩)
- `_estimateTravelTime()` 결과로 `travel_time_minutes: null` 반환 (CAR 매트릭스 미연결)
- CourseDisplay: `estimated_duration_range=null` → 개별 블록에 "이동시간 확인 중" 표시 + 하단 공지

### 판정: **EXPECTED**

- PR #109 (Time Gate), PR #111 (CAR_INFO) 이전부터 동일한 설계
- CAR 매트릭스(Travel Time Matrix) GOVERNANCE_HOLD 상태 → 런타임 연결 미실행
- Comment: "Returns blocks WITHOUT exact times (no false precision)" — line 294

---

## 2. hamel_lighthouse.avg_stay_minutes = null (DATA_GAP)

### DB 확인 결과

```
SELECT code, name_ko, avg_stay_minutes FROM travel_places ORDER BY code;

code              | name_ko     | avg_stay_minutes
------------------|-------------|------------------
cablecar          | 케이블카    | 45
hamel_lighthouse  | 하멜등대    | null   ← 미입력
hyangiram         | 향일암      | 90
odongdo           | 오동도      | 120
dolsan_daegyo     | 돌산대교    | 30
dolsan_nightscape  | 돌산 야경  | 45
lee_soon_shin_plaza | 이순신광장 | 45
marine_park       | 해양공원    | 75
...
```

### null이 시스템에 미치는 영향

```js
// services/travelGuideService.js:446 (_selectPlacesByTime)
const timeNeeded = place.avg_stay_minutes;  // null for hamel

// JavaScript null coercion: placesTimeUsed + null = placesTimeUsed (null → 0)
if (_tmFallback || placesTimeUsed + timeNeeded <= availableForPlaces) {
  selected.push(place);
  placesTimeUsed += timeNeeded;  // += null → unchanged (null → 0)
}
```

**null coercion 결과:**
- `hamel_lighthouse`는 시간 예산을 0분 소비 → 어떤 시간 제약에서도 항상 추가됨
- `totalStayMinutes = selectedPlaces.reduce((sum, p) => sum + p.avg_stay_minutes, 0)`
  → `sum + null = sum` (null → 0) → hamel이 체류시간 합계에 기여하지 않음

**화면 표시:**
```js
// CourseDisplay.jsx:32
subtitle: block.stay_minutes != null ? `${block.stay_minutes}분 체류` : null
// → hamel 블록에는 "?분 체류" 문자 없음 (subtitle=null)
```

### 판정: **DATA_GAP**

- 코드 버그 아님 — null 처리는 graceful (크래시 없음)
- 하지만 하멜등대의 실제 체류시간(추정 30-60분)이 시간 예산에 미반영
- 사용자 입장: 2h 코스에서 "케이블카(45분)+하멜등대(체류시간 없음)" 표시됨
- 2h 예산에 하멜등대가 들어오는 이유: null=0으로 처리되어 예산 초과 없음

---

## 3. 시간별 코스 구성 분석 (CODE VERIFIED)

### 3-1. 시간 슬롯 감지 (_detectTimeSlot)

```js
// services/travelGuideService.js:374-381
_detectTimeSlot(timeMinutes) {
  if (timeMinutes >= 150 && timeMinutes <= 240) return 'half_day';   // 반나절: 3 stops
  if (timeMinutes >= 360 && timeMinutes <= 540) return 'full_day';   // 하루: 5 stops
  return 'custom';  // 직접선택: ceil(time/120) stops, 2~5 범위
}
```

### 3-2. TIME_OPTIONS 칩 (MuyojeongHomePage.jsx:60-64)

```js
{ label: '2~3시간', message: '여수에서 2~3시간 있어요. 어디 갈까요?' }
{ label: '반나절',  message: '여수에서 5시간 있어요. 어디 갈까요?' }
{ label: '하루',    message: '여수에서 8시간 있어요. 어디 갈까요?' }
```

**입력: 텍스트 메시지만 전송 (explicit_context.time_available_minutes 없음)**
→ GPT가 자연어에서 시간 파싱 → `_extractSoulContext` 결과로 time_available_minutes 결정

### 3-3. 시간별 예상 targetCount

| 입력 | GPT 파싱 추정 | time slot | targetCount |
|------|------------|-----------|-------------|
| "2~3시간" | 120-150min | custom/half_day | 2-3 stops |
| "5시간 (반나절)" | 300min | custom | 3 stops |
| "8시간 (하루)" | 480min | full_day | 5 stops |

### 3-4. 실제 place 선정 시뮬레이션 (2h)

```
time_available_minutes = 120, targetCount = 2

Rank 1: cablecar      (avg_stay=45)  → 0+45=45 ≤ 120  → SELECTED (placesTimeUsed=45)
Rank 2: hamel         (avg_stay=null)→ 45+null=45 ≤ 120 → SELECTED (placesTimeUsed=45, unchanged)
        [targetCount=2 reached]

totalStayMinutes = 45 + null = 45  ✓ (Founder 관찰과 일치)
```

### 3-5. 실제 place 선정 시뮬레이션 (5h)

```
time_available_minutes = 300, targetCount = 3

Rank 1: cablecar      (45)  → 0+45=45 ≤ 300   → SELECTED (45)
Rank 2: hamel         (null)→ 45+0=45 ≤ 300    → SELECTED (45)
Rank 3: hyangiram     (90)  → 45+90=135 ≤ 300  → SELECTED (135)
        [targetCount=3 reached]

totalStayMinutes = 45 + null + 90 = 135  ✓ (Founder 관찰과 일치)
```

---

## 4. 8시간 = 5시간 동일 코스 원인 (UNKNOWN)

### 예상 동작 vs 실제 관찰

| | 예상 | 실제 관찰 |
|---|------|---------|
| time_available_minutes | 480 | 알 수 없음 |
| time slot | full_day | 알 수 없음 |
| targetCount | 5 stops | — |
| 실제 코스 | 5곳 이상 | 3곳 (5h와 동일) |

### 가능한 원인 3가지

**원인 A — GPT 파싱 불일치 (가능성 높음)**
- "여수에서 8시간 있어요"에서 GPT가 480min을 추출하지 못하거나
- `time_available_minutes` provenance가 DOMAIN_FALLBACK으로 결정되는 경우
- 단, DOMAIN_FALLBACK이면 Time Gate(PR #109)가 clarification 반환 → course 미표시
- 시나리오: GPT가 "8시간"을 다른 값으로 파싱 (예: 300min → custom → 3 stops)

**원인 B — 후보 장소 필터링 (조사 필요)**
- 8h targetCount=5에서 4th/5th 후보가 특정 필터(cluster diversity, 접근성 등)에서 탈락
- Yeosu DB 13개 장소 중 scoring 상위 5개가 실제로 채워지는지 미확인

**원인 C — 세션 컨텍스트 영향 (조사 필요)**
- 동일 session_id로 여러 time 옵션 테스트 시 이전 세션 컨텍스트가 영향
- must-visit 컨텍스트, 이미 방문한 장소 등

### 판정: **UNKNOWN**

- 런타임 추적(GPT 응답 로그) 없이 단정 불가
- 8h targetCount=5인데 3개만 반환된다면 원인 A/B/C 중 하나
- 코드 설계 자체는 5 stops를 지원하도록 구현되어 있음

---

## 5. 카페 휴식 카드 (EXPECTED)

```js
// services/travelGuideService.js:524
if (places.length >= 2 && cafeOptions.length > 0) {
  blocks.push({ type: 'cafe', ... });
}
```

- 2개 이상의 장소가 선정될 때 항상 카페 블록 추가
- 2h(2곳), 5h(3곳), 8h(3곳) 모두 카페 표시 = EXPECTED
- `cafeReserveMinutes`: meal_context 있을 때만 30분 예약 → meal 없으면 0

---

## 6. 체류시간 합계 레이블 (EXPECTED)

```js
// services/travelGuideService.js:350
total_stay_minutes: totalStayMinutes,  // 장소 체류시간만

// CourseDisplay.jsx:130
<span className="label">장소 체류시간 합계</span>
<span className="value">{course.summary?.total_stay_minutes}분</span>

// CourseDisplay.jsx:144
<p className="course-stay-note">※ 이동시간은 포함되지 않습니다</p>
```

- "장소 체류시간 합계"로 명시적 레이블 → 이동시간 제외 명시적 안내
- `message_ko: '관광·식사·휴식 기준으로 구성했어요. 장소 간 이동시간은 현재 확인 중입니다.'`
- 설계 의도 충실히 반영 = EXPECTED

---

## 7. 종합 판정표

| 관찰 항목 | 판정 | 근거 |
|-----------|------|------|
| "이동시간 확인 중" 표시 | **EXPECTED** | P0-1 설계 — travel_time_status='unknown' 하드코딩 |
| hamel_lighthouse 체류시간 없음 | **DATA_GAP** | avg_stay_minutes=null 미입력, null→0 처리 |
| 2h: 케이블카+하멜 (45분) | **EXPECTED** | null=0 처리로 2 stops 정상 선정 |
| 5h: 케이블카+하멜+향일암 (135분) | **EXPECTED** | 3 stops 정상 선정 |
| 8h = 5h 동일 코스 | **UNKNOWN** | 런타임 GPT 파싱 추적 필요 |
| 카페 휴식 카드 | **EXPECTED** | places.length ≥ 2 → 항상 표시 |
| "※ 이동시간은 포함되지 않습니다" | **EXPECTED** | CourseDisplay:144 명시 안내 |

---

## 8. 개선 후보 (Founder 승인 필요)

### 개선안 1 — hamel_lighthouse.avg_stay_minutes 입력 (DATA_GAP 해소)

**내용:** 하멜등대의 실측 체류시간을 DB에 입력
- 예상 체류시간: 30-45분 (해안 산책 + 하멜등대 관람)
- 적용 후: 시간 예산에 하멜등대 체류시간 반영
- 2h 코스에서 하멜등대가 exclude될 수 있음 (45+30=75 ≤ 120 → still fits)
- **위험 낮음**: DB INSERT only, 코드 변경 없음
- **Founder 승인 필요**: 실측 Evidence 확보 후 값 결정

### 개선안 2 — 8h 동일 코스 원인 확인

**내용:** "여수에서 8시간 있어요" 요청 시 GPT 파싱 결과 로그 확인
- `soyeowoolService._extractSoulContext` 결과에서 `time_available_minutes` 값과 provenance 확인
- 런타임 로그 분석 → 원인 A/B/C 판별
- **코드 수정 없음** — 진단 전용

---

## 9. 금지 항목 준수 확인

| 항목 | 결과 |
|------|------|
| 코드 수정 | ✓ 없음 |
| CAR 매트릭스 런타임 연결 | ✓ 없음 |
| 이동시간 추정값 임의 생성 | ✓ 없음 |
| Production Deploy | ✓ 없음 |
| Git commit/push/PR 생성 | ✓ 없음 |
