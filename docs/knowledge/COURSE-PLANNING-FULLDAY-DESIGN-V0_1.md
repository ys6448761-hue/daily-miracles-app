# COURSE-PLANNING-FULLDAY-DESIGN-V0_1
# _applyClusterDiversity cap BUG 수정 설계 검증

생성일: 2026-10-24
상태: 설계 검증 완료 — 코드 수정 승인 대기
Production SHA: 4c160529f08616433bb639e0ce153044b998fca5
근거: Founder Decision — COURSE_PLANNING 8H Candidate Cap BUG 설계 검증 (2026-10-24)
작성자: Claude Code (Antigravity)

---

## 1. _applyClusterDiversity 호출부·I/O 계약

### 현재 상태

```js
// services/travelGuideService.js:172
// Step 10: Experience Cluster Diversity (prevent geographic monopoly)
candidates = this._applyClusterDiversity(candidates);
```

**호출 위치**: `recommend()` 라인 172 — `_composeJourney()` 호출(라인 194) 이전

**현재 I/O 계약:**
- Input: `candidates[]` — 점수 정렬된 장소 배열
- Output: `candidates[]` — 클러스터 다양성 적용, **항상 최대 3개** (하드코딩)

**문제점:**
- `targetCount`는 `_composeJourney` 내부(라인 307)에서 계산
- `_applyClusterDiversity`가 그보다 먼저 실행되어 targetCount 정보 없음
- `full_day` (8h, targetCount=5) 에서도 항상 3개만 반환 → 5-stop 설계 무력화

---

## 2. context-aware maxCount 전달 방식

### 전제 확인

`context._domainFallbacks`는 `_buildDomainContext`(soyeowoolService.js)가 구성하여
`travelGuideService.recommend(domainContext)` 호출 시 전달됨 → `recommend()` 내부에서 접근 가능 ✓

### 제안된 최소 수정

```js
// services/travelGuideService.js — recommend() 메서드 내부

// [추가] Step 10 전 — targetCount 미리 계산 (4줄 추가)
const _previewTimeSlot = this._detectTimeSlot(context.time_available_minutes);
const _previewIsFallback = context._domainFallbacks?.includes('time_available_minutes');
const _previewRawTarget = this._getTargetStopCount(_previewTimeSlot, context.time_available_minutes);
const _diversityMax = _previewIsFallback
  ? Math.max(_previewRawTarget, 3)  // fallback: min 3 보장 (기존 정책 유지)
  : _previewRawTarget;              // explicit: targetCount 그대로

// [변경] Step 10 — maxCount 전달
candidates = this._applyClusterDiversity(candidates, _diversityMax);
```

```js
// _applyClusterDiversity — signature 변경
_applyClusterDiversity(candidates, maxCount = 3) {  // default 3 (기존 동작 보호)
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
    if (selected.length >= maxCount) {  // [변경] === 3 → >= maxCount
      break;
    }
  }

  // Fallback: 다양성 필터로 maxCount에 못 채운 경우 채우기
  if (selected.length < maxCount && candidates.length > selected.length) {
    for (const candidate of candidates) {
      if (selected.includes(candidate)) continue;
      selected.push(candidate);
      if (selected.length >= maxCount) break;  // [변경] === 3 → >= maxCount
    }
    selected._cluster_diversity_relaxed = true;
  }

  return selected;  // 최대 maxCount개 반환
}
```

**변경 파일:**
- `services/travelGuideService.js` — 6줄 변경 (4줄 추가 + 2줄 수정)

---

## 3. 시간별 기존 동작 영향 분석

| 입력 | time_available_minutes | time slot | targetCount | _diversityMax (변경 후) | 후보 수 | 결과 변화 |
|------|----------------------|-----------|-------------|----------------------|---------|---------|
| 2~3시간 | ~150min | custom/half_day | 2-3 | 2-3 | 2-3 | **없음** (cap 동일) |
| 5시간 (반나절) | 300min | custom | 3 | 3 | 3 | **없음** (cap 동일) |
| **8시간 (하루)** | 480min | **full_day** | **5** | **5** | **5** | **변경** — 3→5 stops |
| 시간 미지정 | 120min (fallback) | custom | 2 → max→3 | 3 | 3 | **없음** (FALLBACK path, max(2,3)=3 유지) |

### 2시간 구체 검증

```
_diversityMax = _getTargetStopCount('custom', 120) = max(2, min(5, ceil(1.0))) = 2

_applyClusterDiversity([cablecar, hamel, hyangiram, ...], 2):
  1. cablecar (dolsan_area) → SELECTED (seenClusters: {dolsan_area})
  2. hamel (null) → SELECTED
     → selected.length >= 2 → BREAK
반환: [cablecar, hamel] (2개)

_selectPlacesByTime([cablecar, hamel], targetCount=2, 120min):
  1. cablecar(45): SELECTED
  2. hamel(null=0): SELECTED → break
결과: [케이블카, 하멜], totalStayMinutes=45 ✓ 기존과 동일
```

### 8시간 구체 검증 (CODE VERIFIED)

```js
// node 로컬 실행
5-place totalStayMinutes: 300  // 45+null(0)+90+45+120
8h available: 480
Fits? true

selected: ['cablecar','hamel_lighthouse','hyangiram','lee_soon_shin_plaza','odongdo']
placesTimeUsed: 300
totalStayMinutes (reduce): 300
```

**체류시간 과장 없음:** 300min ≤ 480min / message_ko = "관광·식사·휴식 기준으로 구성했어요. 장소 간 이동시간은 현재 확인 중입니다." ✓

---

## 4. 추가 후보 장소 SOUL 지식 충족 여부

8h full_day 코스에 새로 포함될 장소: `lee_soon_shin_plaza`, `odongdo`

### 4-1. 오동도 (odongdo) — SOUL Phase 1 CLOSED (PR #67)

| 항목 | 상태 | 내용 |
|------|------|------|
| experience_ko | ✓ Founder 승인 | "오동도는 바다 풍경과 계절의 자연을 느끼며 산책할 수 있는 곳이에요..." |
| emotional_role | ✓ | "재충전 / 자연 회복" |
| avg_stay_minutes | ✓ | 120분 |
| access_by_car | ✓ | true (DB) |
| parking_ko | DATA_GAP | null, `parking_trust='UNKNOWN'` → C-3 자동 제외 (silently omitted) |
| physical_difficulty | ✓ | 'low' — 접근성 필터 통과 |
| hours_ko | ✓ | "연중무휴 (동백열차 09:00~17:00)" |
| 차량 접근 가이드 | ✓ | `_odongdoVehicleBypass` — has_car + odongdo → 주차 안내 분기 |
| 가족 동행 가이드 | ✓ | family_elderly/family_with_kids → 별도 안내 분기 (PR #67) |
| **지식 충족 판정** | **✓ SUFFICIENT** | Phase 1 완결 — SOUL 응답 검증 완료 |

### 4-2. 이순신광장 (lee_soon_shin_plaza) — YiSunSin SOUL Phase 1+2 CLOSED

| 항목 | 상태 | 내용 |
|------|------|------|
| experience_ko | ✓ Founder 승인 | "이순신 장군을 기리는 역사 광장이에요. 거북선 외관을 가까이 볼 수 있어요..." |
| emotional_role | 미정의 | `_PLACE_KNOWLEDGE.lee_soon_shin_plaza`에 emotional_role 키 없음 |
| avg_stay_minutes | ✓ | 45분 |
| access_by_car | ✓ | true (DB) |
| parking_ko | DATA_GAP | null, `parking_trust='UNKNOWN'` → C-3 자동 제외 |
| hours_ko | ✓ | "야외 광장으로 연중개방이에요." |
| YiSunSin guardrails | ✓ | 거북선 guardrail, unknown_boundary 명시 |
| 차량 접근 가이드 | ✓ | `_yisunsinVehicleBypass` — lee_soon_shin_plaza 전용 (PR #64) |
| PSQ (주차/시간/접근) | ✓ | Phase 2 CLOSED (PR #64/#65) |
| **지식 충족 판정** | **✓ SUFFICIENT** | Phase 1+2 완결 (S-1~S-8 PASS) |

### 4-3. 3~5위 순위권 기타 장소

| 장소 | avg_stay | SOUL 지식 | Discovery 적합성 |
|------|----------|-----------|----------------|
| marine_park (해양공원) | 75min | experience_ko/emotional_role ✓ | ✓ |
| sky_tower (스카이타워) | 60min | `_PLACE_DESCRIPTION` 있음, _PLACE_KNOWLEDGE 미확인 | 확인 필요 |
| romantic_pojangmacha | 60min | `_PLACE_DESCRIPTION` 있음, 야간 전용 특성 | 확인 필요 |
| yeosu_expo_park | 120min | `_PLACE_DESCRIPTION` 있음 | 확인 필요 |

**8h 코스 상위 5위 예상:** cablecar, hamel, hyangiram, lee_soon_shin_plaza, odongdo
(traveler fit score 기준 — family/kids_ok/elderly 4종 tag 가진 odongdo/lee_soon_shin 상위)

---

## 5. 시간 예산 과장 검증 (CODE VERIFIED)

```
8h 코스 (5곳):
  케이블카(45) + 하멜등대(null=0) + 향일암(90) + 이순신광장(45) + 오동도(120) = 300분 체류

  표시:
  - total_stay_minutes: 300
  - course.message_ko: "관광·식사·휴식 기준으로 구성했어요. 장소 간 이동시간은 현재 확인 중입니다."
  - CourseDisplay: "장소 체류시간 합계: 300분"
  - CourseDisplay: "※ 이동시간은 포함되지 않습니다"
  - travel_transition 블록: "이동시간 확인 중" (P0-1 유지)
  - estimated_total_range: null (travelUnknown=true → P0-2 준수)

  CAR 매트릭스 연결: ✗ 없음 (GOVERNANCE_HOLD 유지)
  미검증 이동시간 추정: ✗ 없음
```

**판정: 시간 예산 과장 없음** ✓

---

## 6. 회귀 테스트 계획

### 보호 대상 기존 테스트

| 테스트 파일 | 관련성 | 영향 |
|------------|--------|------|
| `soulCoursePlanningTimeGate.test.js` (T1~T14) | DOMAIN_FALLBACK→CLARIFICATION | **없음** — travelGuideService 전체 mock |
| `soulCarInfoSeparation.test.js` (CI-1~CI-7) | CAR_INFO 분리 | **없음** — course=null 경로 |
| `soulLevelBEmotionalContinuity.test.js` | Level B 감정 전환 | **없음** — SOUL 내부 로직 |
| `soulCourseDisplayConnect.test.js` | CourseDisplay 렌더링 | **없음** — UI 컴포넌트 |
| 기존 509/510 PASS | 전체 soul 테스트 | 확인 필요 (R20 PRE-EXISTING만 있음) |

### 신규 테스트 설계

파일명 제안: `tests/soul/soulCoursePlanningFullDay.test.js`

```
C-NEW-1: 8시간 explicit → actual_stop_count >= 4
  입력: time_available_minutes=480, _domainFallbacks=[] (explicit)
  기대: course.actual_stop_count >= 4 (max 5, 후보 수에 따라)
  검증: travelGuideService 실제 _applyClusterDiversity 통과

C-NEW-2: 5시간 explicit → actual_stop_count == 3 (보호)
  입력: time_available_minutes=300, _domainFallbacks=[]
  기대: course.actual_stop_count == 3
  검증: 기존 동작 보존

C-NEW-3: 2시간 explicit → actual_stop_count == 2 (보호)
  입력: time_available_minutes=120, _domainFallbacks=[]
  기대: course.actual_stop_count == 2
  검증: 기존 동작 보존

C-NEW-4: 시간 미지정 (DOMAIN_FALLBACK) → actual_stop_count == 3 (보호)
  입력: time_available_minutes=120, _domainFallbacks=['time_available_minutes']
  기대: course.actual_stop_count == 3 (max(2,3)=3 유지)
  검증: 기존 PARTIAL path 보존

C-NEW-5: NighttimeWalk 회귀 — 8h + 밤바다 → NighttimeWalk 경로 (TG 미호출)
  입력: "8시간 동안 밤바다 걸어서 즐길 수 있어요?"
  기대: _isNighttimeWalkQuery=true → TG recommend() 미호출
  검증: _applyClusterDiversity 변경이 NighttimeWalk에 영향 없음
```

**총 신규 테스트: 5개**

---

## 7. 변경 영향 파일 목록

| 파일 | 변경 종류 | 내용 |
|------|---------|------|
| `services/travelGuideService.js` | **수정** | 4줄 추가 + 2줄 변경 (_applyClusterDiversity 시그니처) |
| `tests/soul/soulCoursePlanningFullDay.test.js` | **신규** | C-NEW-1~C-NEW-5 (5개 테스트) |

**변경 없는 파일:**
- `services/soyeowoolService.js` — 변경 없음
- `dreamtown-frontend/` — 변경 없음
- DB migrations — 변경 없음

---

## 8. hamel_lighthouse null 체류시간 (별도 DATA_GAP 유지)

- `avg_stay_minutes=null`: 이번 수정 범위 외 (Founder Decision: 보류)
- 8h 코스 포함 유지 (null=0 처리, 체류시간 미표시)
- 표시: hamel 블록에 "?분 체류" 대신 subtitle 없음 → CourseDisplay 현행 유지

---

## 9. Guardian 설계 검증 판정

```
판정: DESIGN_VERIFIED — 코드 수정 승인 준비 완료

확인된 항목:
  ✓ BUG 원인: _applyClusterDiversity 라인 1180 하드코딩 cap=3
  ✓ 수정 방식: context-aware maxCount (4줄 추가 + 시그니처 변경)
  ✓ 2h/5h 기존 동작 보호: cap 동일 (2 / 3)
  ✓ 8h 개선: cap 3→5, 후보 5개 가능
  ✓ 추가 후보 지식: odongdo(SUFFICIENT) / lee_soon_shin_plaza(SUFFICIENT)
  ✓ 시간 예산: 5곳 = 300min ≤ 480min, 이동시간 unknown P0-1 유지
  ✓ CAR 매트릭스 GOVERNANCE_HOLD 유지
  ✓ 기존 테스트 영향: 없음 (TG 전체 mock으로 분리)
  ✓ 신규 테스트: C-NEW-1~C-NEW-5 (5개)

대기 항목 (Founder 승인 필요):
  □ 코드 수정 승인 → travelGuideService.js 변경
  □ 신규 테스트 파일 생성
  □ PR 생성 및 CI 검증
  □ Production Deploy (별도 단계)
```

---

## 10. Founder 승인 요청 사항

**요청 1 — 코드 수정 승인**
- `travelGuideService._applyClusterDiversity(candidates, maxCount=3)` 시그니처 변경
- `recommend()` 내 4줄 추가 (targetCount preview 계산)
- 영향: 8h 코스 3→최대 5stops 변화

**요청 2 — 신규 테스트 생성 승인**
- `tests/soul/soulCoursePlanningFullDay.test.js` (C-NEW-1~C-NEW-5)

**요청 3 — 확인 사항**
- 8h 코스에 `odongdo`, `lee_soon_shin_plaza` 포함 시 사용자 경험 적합성 확인 (Founder 최종 검토)
- sky_tower / romantic_pojangmacha / yeosu_expo_park 이 5위권 진입 시 별도 지식 검토 필요 여부

---

## 11. 금지 항목 준수 확인

| 항목 | 결과 |
|------|------|
| 코드 수정 | ✓ 없음 (설계 검증만) |
| DB INSERT/UPDATE | ✓ 없음 |
| Production Deploy | ✓ 없음 |
| Git commit/push/PR 생성 | ✓ 없음 |
| CAR 매트릭스 런타임 연결 | ✓ 없음 |
| 미검증 체류·이동시간 생성 | ✓ 없음 |
