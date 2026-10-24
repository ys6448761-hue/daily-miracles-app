# COURSE-PLANNING-FULLDAY-IMPL-V0_1
# _applyClusterDiversity cap BUG 수정 구현 Evidence

생성일: 2026-10-24
상태: IMPLEMENTATION_READY — Git commit/push/PR 승인 대기
Basis: Founder Decision — COURSE_PLANNING Full-Day Candidate Cap Fix (2026-10-24)
설계 근거: COURSE-PLANNING-FULLDAY-DESIGN-V0_1.md

---

## 1. 변경 파일

| 파일 | 변경 종류 | 내용 |
|------|---------|------|
| `services/travelGuideService.js` | 수정 | 5줄 추가 + 1줄 변경 + 시그니처 변경 |
| `tests/soul/soulCoursePlanningFullDay.test.js` | 신규 | C-NEW-1~C-NEW-7 (21 tests) |

---

## 2. 실제 Diff

### services/travelGuideService.js

**[추가] recommend() Step 10 (라인 171-177):**

```js
// Before:
// 10. Experience Cluster Diversity (prevent geographic monopoly)
candidates = this._applyClusterDiversity(candidates);

// After:
// 10. Experience Cluster Diversity (prevent geographic monopoly)
// Compute targetCount preview before diversity filter so full_day (8h→5 stops) is respected.
const _previewTimeSlot = this._detectTimeSlot(context.time_available_minutes);
const _previewIsFallback = context._domainFallbacks?.includes('time_available_minutes');
const _previewRawTarget = this._getTargetStopCount(_previewTimeSlot, context.time_available_minutes);
const _diversityMax = _previewIsFallback ? Math.max(_previewRawTarget, 3) : _previewRawTarget;
candidates = this._applyClusterDiversity(candidates, _diversityMax);
```

**[변경] _applyClusterDiversity 시그니처 + 비교 연산자:**

```js
// Before:
_applyClusterDiversity(candidates) {
  ...
  if (selected.length === 3) { break; }
  ...
  if (selected.length < 3 && ...) {
    ...
    if (selected.length === 3) break;
  }
  ...
}

// After:
_applyClusterDiversity(candidates, maxCount = 3) {  // default=3 보호
  ...
  if (selected.length >= maxCount) { break; }       // === 3 → >= maxCount
  ...
  if (selected.length < maxCount && ...) {           // < 3 → < maxCount
    ...
    if (selected.length >= maxCount) break;          // === 3 → >= maxCount
  }
  ...
}
```

---

## 3. 신규 테스트 결과 (C-NEW-1~C-NEW-7)

```
PASS tests/soul/soulCoursePlanningFullDay.test.js

  C-NEW-1: 8h explicit → _diversityMax=5
    ✓ _detectTimeSlot(480) returns full_day
    ✓ _getTargetStopCount(full_day, 480) returns 5
    ✓ _applyClusterDiversity with maxCount=5 returns up to 5 candidates
    ✓ 8h result does NOT include both dolsan_daegyo and cablecar (cluster diversity)
    ✓ 8h result includes odongdo and lee_soon_shin_plaza (new candidates)

  C-NEW-2: 5h explicit → _diversityMax=3 preserved
    ✓ _detectTimeSlot(300) returns custom
    ✓ _getTargetStopCount(custom, 300) returns 3
    ✓ _applyClusterDiversity with maxCount=3 returns exactly 3 candidates
    ✓ 5h first 3 candidates match pre-fix behavior (cablecar, hamel, hyangiram)

  C-NEW-3: 2h explicit → _diversityMax=2 preserved
    ✓ _detectTimeSlot(120) returns custom
    ✓ _getTargetStopCount(custom, 120) returns 2
    ✓ _applyClusterDiversity with maxCount=2 returns exactly 2 candidates
    ✓ 2h candidates are cablecar and hamel (pre-fix behavior preserved)

  C-NEW-4: DOMAIN_FALLBACK time → _diversityMax=3 preserved
    ✓ DOMAIN_FALLBACK(time=120) → _previewRawTarget=2, _diversityMax=max(2,3)=3
    ✓ _applyClusterDiversity with FALLBACK maxCount=3 returns 3 candidates

  C-NEW-5: edge case maxCount=1
    ✓ _applyClusterDiversity with maxCount=1 returns exactly 1 candidate

  C-NEW-6: dolsan_area cluster — max 1 rep at any maxCount
    ✓ maxCount=5 → exactly 1 dolsan_area place in result
    ✓ maxCount=10 → exactly 1 dolsan_area place in result

  C-NEW-7: fallback fill — _cluster_diversity_relaxed
    ✓ small candidate pool triggers fallback fill to maxCount
    ✓ fallback does not exceed available candidates

  Backward compatibility: default maxCount=3
    ✓ _applyClusterDiversity() with no maxCount arg returns 3 candidates

Tests: 21 passed, 21 total
```

---

## 4. 전체 회귀 테스트 결과

```
Tests: 1 failed (PRE-EXISTING R20), 548 passed, 549 total

FAIL: R20 — soul-broad-place-r1-r24.test.js
  R20 — 돌산대교: "걸어서 건너갈 수 있어?" → JOURNEY_CONTINUITY (expected PLACE_SPECIFIC_QUERY)
  → PRE-EXISTING FAIL (이전부터 존재, 이번 변경과 무관)

신규 회귀: 0건
```

---

## 5. 2h / 5h / 8h / FALLBACK 로컬 재현 결과

```
2시간 (explicit, 120min):
  slot=custom rawTarget=2 diversityMax=2
  후보수=2 / 장소: cablecar, hamel_lighthouse
  totalStayMinutes=45 / 예산 내 ✓ (기존 동작 보존)

5시간 (explicit, 300min):
  slot=custom rawTarget=3 diversityMax=3
  후보수=3 / 장소: cablecar, hamel_lighthouse, hyangiram
  totalStayMinutes=135 / 예산 내 ✓ (기존 동작 보존)

8시간 (explicit, 480min):
  slot=full_day rawTarget=5 diversityMax=5
  후보수=5 / 장소: cablecar, hamel_lighthouse, hyangiram, lee_soon_shin_plaza, odongdo
  totalStayMinutes=300 / 예산 내 ✓ (300 ≤ 480 → 개선 확인)

시간 미지정 (FALLBACK, 120min):
  slot=custom rawTarget=2 diversityMax=max(2,3)=3
  후보수=3 / 장소: cablecar, hamel_lighthouse, hyangiram
  totalStayMinutes=135 / ✓ (기존 동작 보존)
```

---

## 6. 이동시간·체류시간 안전성 확인

| 항목 | 결과 |
|------|------|
| 이동시간 unknown | ✓ P0-1 유지 — `status: 'unknown'`, `message_ko: '이동시간 확인 중'` 하드코딩 불변 |
| CAR 매트릭스 GOVERNANCE_HOLD | ✓ 런타임 연결 없음 |
| hamel null 체류시간 | ✓ DATA_GAP 유지 — null→0 처리, subtitle 미표시 |
| totalStayMinutes 과장 없음 | ✓ 8h: 300min ≤ 480min |
| 미검증 체류시간 | ✓ 새로 입력한 avg_stay_minutes 없음 |
| DB INSERT/UPDATE | ✓ 없음 |
| Schema 변경 | ✓ 없음 |

---

## 7. Guardian 판정

```
판정: IMPLEMENTATION_READY

확인된 항목:
  ✓ BUG 수정: _applyClusterDiversity cap=3 → context-aware maxCount
  ✓ 2h/5h 기존 동작 보호: diversityMax=2/3 → 결과 동일
  ✓ 8h 개선: diversityMax=5 → 5개 후보 반환
  ✓ FALLBACK path 보호: max(rawTarget,3)=3 → 결과 동일
  ✓ 클러스터 다양성: dolsan_area 1개 대표 규칙 유지
  ✓ 신규 테스트 21/21 PASS
  ✓ 기존 테스트 548/549 PASS (R20 PRE-EXISTING 제외)
  ✓ 이동시간 P0-1 / CAR 매트릭스 HOLD / hamel DATA_GAP 모두 유지
  ✓ DB/Schema 변경 없음

대기 항목 (Founder 승인 필요):
  □ Git commit 승인
  □ PR 생성 승인
  □ Production Deploy (별도 단계)
```

---

## 8. 금지 항목 준수 확인

| 항목 | 결과 |
|------|------|
| DB INSERT/UPDATE | ✓ 없음 |
| Schema 변경 | ✓ 없음 |
| Production Deploy | ✓ 없음 |
| Render 설정 변경 | ✓ 없음 |
| CAR 매트릭스 런타임 연결 | ✓ 없음 |
| 체류시간 임의 입력 | ✓ 없음 |
| 범위 외 기능 수정 | ✓ 없음 |
| Git commit/push/PR 생성 | ✓ 없음 (Founder 승인 대기) |
