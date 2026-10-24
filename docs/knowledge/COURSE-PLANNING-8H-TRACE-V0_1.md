# COURSE-PLANNING-8H-TRACE-V0_1
# 8시간 COURSE_PLANNING 런타임 경로 추적 + 5시간 동일 원인 보고

생성일: 2026-10-24
상태: READ-ONLY 분석 완료 + 로컬 재현
Production SHA: 4c160529f08616433bb639e0ce153044b998fca5
근거: Founder Decision — COURSE_PLANNING 8h Runtime Trace (2026-10-24)
작성자: Claude Code (Antigravity)

---

## 1. 입력 경로 확인

### MuyojeongHomePage TIME_OPTIONS 칩

```js
// dreamtown-frontend/src/pages/MuyojeongHomePage.jsx:60-64
{ label: '2~3시간', message: '여수에서 2~3시간 있어요. 어디 갈까요?' }
{ label: '반나절',  message: '여수에서 5시간 있어요. 어디 갈까요?' }
{ label: '하루',    message: '여수에서 8시간 있어요. 어디 갈까요?' }

// API 호출 (line 260-270):
POST /api/dt/travel/input/text
{ message: "여수에서 8시간 있어요. 어디 갈까요?", session_id, explicit_context: {} }
// 주의: time_available_minutes를 explicit_context에 전달하지 않음 — GPT 파싱에 의존
```

---

## 2. GPT 시간 파싱 단계

### contextExtractionService.js GPT 프롬프트 (line 247)

```
"time_available_minutes": 숫자 또는 null
  (언급한 시간을 분으로. "두 시간"=120, "반나절"=180, "1박2일"=null)
```

**중요**: 프롬프트에 "5시간", "8시간"에 대한 명시적 예시 없음.
단, GPT-4o-mini는 "8시간"=480분, "5시간"=300분을 정확히 추출 가능.

| 입력 메시지 | GPT 파싱 추정 | provenance | _domainFallbacks |
|------------|-------------|------------|-----------------|
| "여수에서 2~3시간 있어요" | ~150-180min | USER_EXPLICIT | time 미포함 |
| "여수에서 5시간 있어요" | 300min | USER_EXPLICIT | time 미포함 |
| "여수에서 8시간 있어요" | 480min | USER_EXPLICIT | time 미포함 |

- `_identifyDomainFallbacks` (line 1001): `provenance[field] === 'UNKNOWN'`인 필드만 포함
- time이 USER_EXPLICIT → `_domainFallbacks`에 포함되지 않음
- COURSE_PLANNING Time Gate (PR #109) 미발동 → 코스 정상 반환

### 결론

GPT 파싱은 정상: "8시간" → 480min (USER_EXPLICIT).
`_domainFallbacks`에 `time_available_minutes` 미포함 → Time Gate 미발동.

---

## 3. _composeJourney 시간 슬롯 및 targetCount 계산

```js
// services/travelGuideService.js:302-311
const timeSlot = this._detectTimeSlot(timeMinutes);
const rawTarget = this._getTargetStopCount(timeSlot, timeMinutes);
const targetStops = context.requested_count
  ? Math.max(1, Math.min(5, context.requested_count))
  : defaultTarget;

// _detectTimeSlot(timeMinutes):
//   150-240 → half_day → 3 stops
//   360-540 → full_day → 5 stops
//   other   → custom   → ceil(time/120), 2~5
```

| 입력 | time_available_minutes | time slot | targetCount |
|------|----------------------|-----------|-------------|
| 2~3시간 | 120-150min | custom / half_day | 2-3 |
| 5시간 (반나절) | 300min | custom | 3 |
| 8시간 (하루) | 480min | **full_day** | **5** |

→ 8시간은 targetCount=5가 정상 계산됨 (설계 의도 확인)

---

## 4. _applyClusterDiversity — 원인 확정

### 코드 (travelGuideService.js:1162-1197)

```js
const EXPERIENCE_CLUSTERS = {
  dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar']
};

_applyClusterDiversity(candidates) {
  const selected = [];
  const seenClusters = new Set();

  for (const candidate of candidates) {
    const cluster = this._getCluster(candidate.code);
    if (cluster === null) {
      selected.push(candidate);
    } else if (!seenClusters.has(cluster)) {
      selected.push(candidate);
      seenClusters.add(cluster);
    }

    if (selected.length === 3) {  // ← 하드코딩 cap=3
      break;
    }
  }
  // Fallback: fill to 3 if diversity reduced results
  if (selected.length < 3 && candidates.length > selected.length) {
    ...fill to 3...
  }
  return selected;  // 항상 최대 3개 반환
}
```

**실행 경로 (Yeosu 일반 랭킹):**

```
입력 후보 (scoring 상위): cablecar, hamel_lighthouse, hyangiram, lee_soon_shin_plaza, odongdo, ...

순회:
  1. cablecar       → cluster=dolsan_area → 미등장 → SELECTED (seenClusters: {dolsan_area})
  2. hamel_lighthouse → cluster=null → SELECTED
  3. hyangiram      → cluster=null → SELECTED
     → selected.length === 3 → BREAK

반환: [cablecar, hamel_lighthouse, hyangiram]  (항상 3개)
```

### 로컬 재현 결과 (CODE VERIFIED)

```js
// node 로컬 실행
After _applyClusterDiversity:
  1. cablecar (avg_stay=45)
  2. hamel_lighthouse (avg_stay=null)
  3. hyangiram (avg_stay=90)
Count: 3

=== _selectPlacesByTime with 8h (targetCount=5, 480min) ===
Selected: [ 'cablecar', 'hamel_lighthouse', 'hyangiram' ]
placesTimeUsed: 135
totalStayMinutes: 135
```

Founder 관찰 ("8시간: 케이블카→하멜등대→향일암, 체류시간 135분")과 **정확히 일치** ✓

---

## 5. 5시간과 동일해진 최초 지점

```
[단계 1] _applyClusterDiversity (travelGuideService.js:172)
  → 13개 후보 → 3개 반환 (cablecar, hamel, hyangiram)
  → 이 시점에서 5h와 8h 모두 동일한 3개 후보

[단계 2] _selectPlacesByTime
  → 5h: targetCount=3, candidates=3 → 3개 선택 ✓
  → 8h: targetCount=5, candidates=3 → 최대 3개만 선택 가능
  → 결과: 동일 3곳
```

**동일해진 지점: `_applyClusterDiversity` (라인 172)**
`_composeJourney`가 targetCount=5를 계산하기 전, 이미 후보가 3개로 고정됨.

---

## 6. 시간별 코스 구성 단계 추적 요약

| 단계 | 2시간 | 5시간 | 8시간 |
|------|-------|-------|-------|
| GPT 파싱 | ~120min | 300min | 480min |
| time slot | custom | custom | full_day |
| targetCount | 2 | 3 | **5** |
| _applyClusterDiversity 반환 | 3개 | 3개 | **3개** (cap=3) |
| _selectPlacesByTime 선택 | 2개 | 3개 | **3개** (cap 제약) |
| totalStayMinutes | 45분 | 135분 | **135분** (동일) |

---

## 7. BUG / DATA_GAP / EXPECTED / UNKNOWN 판정

### BUG — _applyClusterDiversity cap=3 hardcoded (라인 1180)

**판정: BUG**

```js
if (selected.length === 3) {  // ← context-unaware cap
  break;
}
```

- `_composeJourney`가 targetCount=5 (full_day)를 계산하지만
- `_applyClusterDiversity`가 targetCount를 받지 않아 항상 3개로 고정
- `full_day` 시간 슬롯의 5-stop 설계가 사실상 dead code
- 영향: 8h 코스가 항상 5h 코스와 동일 결과

**현재 클러스터**: `EXPERIENCE_CLUSTERS = { dolsan_area: ['dolsan_daegyo', 'dolsan_nightscape', 'cablecar'] }`
- dolsan_area 클러스터 1개 → cablecar 선택 후 dolsan_daegyo/dolsan_nightscape 제외
- 나머지 모두 cluster=null → 순서대로 통과
- 결과: top-ranked 3곳 항상 동일 (cablecar, hamel, hyangiram)

### DATA_GAP — hamel_lighthouse.avg_stay_minutes=null

- null→0 처리로 체류시간 합계에 미기여 (기존 진단 유지)
- 별도 Founder Decision 대기 중

### EXPECTED — "이동시간 확인 중"

- P0-1 설계 유지. 변경 없음.

---

## 8. 최소 안전 개선안 1개

### 개선안: _applyClusterDiversity에 maxCount 파라미터 추가

**목적**: targetCount에 맞는 후보 수를 반환하여 full_day 5-stop 설계 활성화.

**현재 코드 (버그):**
```js
// travelGuideService.js:1162
_applyClusterDiversity(candidates) {
  ...
  if (selected.length === 3) break;  // hardcoded
  ...
  if (selected.length < 3 && ...) { ...fill to 3... }
}

// 호출 (line 172):
candidates = this._applyClusterDiversity(candidates);
```

**개선 방향 (코드 수정 필요 — Founder 승인 후):**
```js
// travelGuideService.js:1162 — signature 변경
_applyClusterDiversity(candidates, maxCount = 5) {  // default 5 (안전한 상한)
  ...
  if (selected.length >= maxCount) break;  // context-aware
  ...
  // fallback: fill to maxCount
}

// 호출 (line 172) — time 정보로 maxCount 계산:
const timeSlot = this._detectTimeSlot(context.time_available_minutes);
const diversityMax = timeSlot === 'full_day' ? 5 : 3;
candidates = this._applyClusterDiversity(candidates, diversityMax);
```

**개선 효과 시뮬레이션:**

```
8h (full_day, maxCount=5):
  After diversity: cablecar, hamel, hyangiram, lee_soon_shin, odongdo (5개)
  _selectPlacesByTime → 5개 선택 가능
  totalStayMinutes = 45+0+90+45+120 = 300분

5h (custom, maxCount=3):
  After diversity: cablecar, hamel, hyangiram (3개) — 변경 없음
  totalStayMinutes = 135분 — 변경 없음

2h (custom, maxCount=2):
  After diversity: cablecar, hamel (2개)
  _selectPlacesByTime → 2개 선택 — 변경 없음
```

**위험 평가:**
| 항목 | 수준 |
|------|------|
| 코드 변경 범위 | travelGuideService.js 2곳 (_applyClusterDiversity + 호출부) |
| DB 변경 | 없음 |
| 기존 테스트 영향 | 8h 코스 변경 → 기존 테스트 업데이트 필요 |
| 2h/5h 영향 | 없음 (same result) |
| 회귀 위험 | **MEDIUM** — 8h 코스가 변경되면 다른 장소 (lee_soon_shin, odongdo 등)가 포함됨. 해당 장소들의 SOUL 지식이 충분한지 사전 확인 필요 |

---

## 9. Founder 승인 요청 사항

1. **BUG 수정 여부**: `_applyClusterDiversity` cap=3 → context-aware maxCount로 변경
   - 수정 시: 8h 코스에 최대 5개 장소 표시 가능 (odongdo, lee_soon_shin 등 포함)
   - **전제 조건**: 새로 포함될 장소들의 SOUL 지식(experience_ko, parking_ko 등) 충분 여부 확인 필요

2. **수정 보류**: 현재 cap=3 유지 (8h=5h 동일 코스 의도적 유지)
   - 이 경우 `_getTargetStopCount('full_day')=5`가 사실상 dead code

---

## 10. 금지 항목 준수 확인

| 항목 | 결과 |
|------|------|
| 코드 수정 | ✓ 없음 |
| DB INSERT/UPDATE | ✓ 없음 |
| Production Deploy | ✓ 없음 |
| CAR 매트릭스 런타임 연결 | ✓ 없음 |
| Git commit/push/PR 생성 | ✓ 없음 |
| 미검증 이동시간 추정 | ✓ 없음 |
| Production 관찰과 재현 구분 | ✓ 재현=로컬 node 실행, Production=Founder 화면 관찰 |
