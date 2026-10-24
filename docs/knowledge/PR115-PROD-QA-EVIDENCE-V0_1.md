# PR115-PROD-QA-EVIDENCE-V0_1
# _applyClusterDiversity cap Fix — Production UI Verification

생성일: 2026-10-24
상태: PROD_UI_VERIFIED
근거: Founder Production 실제 화면 3장 (2026-10-24)
배포: SHA `7567b59` / Deploy `dep-dbe621rncjis73d4d3h0`

---

## 1. 배포 정보

| 항목 | 값 |
|------|-----|
| Production SHA | `7567b59` (main HEAD, PR #116 포함) |
| Deploy ID | `dep-dbe621rncjis73d4d3h0` |
| 코드 변경 SHA | `d6323c9` (PR #115 — `_applyClusterDiversity` cap fix) |
| 배포 방식 | Manual Deploy (Auto-Deploy OFF) |
| 배포 일자 | 2026-10-24 KST |

---

## 2. Founder Production QA 결과 (화면 3장)

### 2h 코스
| 항목 | 값 |
|------|-----|
| 출력 장소 수 | **2개** |
| 체류시간 합계 | **45분** |
| targetCount (_diversityMax) | 2 (`custom`, ceil(120/120)=1 → max(2,1)=2) |
| 판정 | ✅ PASS — 코드 측정값(2) = 실제 화면(2) |

### 5h 코스
| 항목 | 값 |
|------|-----|
| 출력 장소 수 | **3개** |
| 체류시간 합계 | **135분** |
| targetCount (_diversityMax) | 3 (`custom`, ceil(300/120)=3 → max(2,3)=3) |
| 판정 | ✅ PASS — 코드 측정값(3) = 실제 화면(3) |

### 8h 코스
| 항목 | 값 |
|------|-----|
| 출력 장소 수 | **5개** |
| 체류시간 합계 | **210분** |
| 장소 순서 | 케이블카 → 하멜등대 → 향일암 → 자산공원 → 이순신광장 |
| targetCount (_diversityMax) | 5 (`full_day` → 5) |
| 판정 | ✅ PASS — 코드 측정값(5) = 실제 화면(5) |

---

## 3. 세 화면 공통 관찰 사항

| 항목 | 관찰 | 판정 |
|------|------|------|
| "이동시간 확인 중" 표시 | 장소 간 이동 카드에 공통 표시 | EXPECTED — `_estimateTravelTime()` V0 Stub, GOVERNANCE_HOLD 유지 중 |
| 장소 간 이동시간 합계 미포함 | 체류시간만 합산 | EXPECTED — 이동시간 null이므로 제외 (P0-2 설계) |
| 하멜등대 체류시간 미표시 | UI에서 체류시간 blank | EXPECTED — `avg_stay_minutes=null` (DATA_GAP, Founder Decision 2026-10-24) |
| 카페 휴식 별도 카드 | 체류합계 외 별도 블록 | EXPECTED — `_getCafePartners()` 분리 설계 |

---

## 4. 코드 검증 vs 실제 화면 검증 범위 구분

### 코드 검증 (단위 테스트, 2026-10-24)
- 대상: `_detectTimeSlot()`, `_getTargetStopCount()`, `_applyClusterDiversity()` 단위 함수
- 커버리지: `soulCoursePlanningFullDay.test.js` 21/21 PASS / 전체 회귀 548/549 PASS
- 한계: 실제 DB 데이터(avg_stay_minutes, 장소 목록) 미반영, mock 픽스처 기반

### 실제 화면 검증 (Founder Production QA, 2026-10-24)
- 대상: 실제 Production DB + 실제 추천 파이프라인 + 실제 UI 렌더링
- 확인 내용: 시간별 장소 수, 체류시간 합계, 장소 순서, UI 컴포넌트 표시 여부
- 한계: 3개 시나리오만 확인 (Founder 제공 화면 기준), 전체 엣지케이스 미검증

### 코드로만 확인된 것 (화면 미확인)
- `_cluster_diversity_relaxed` 플래그 동작
- DOMAIN_FALLBACK 경로 (time_available_minutes 미지정 시)
- mustVisitPlaceIds 동작

### 화면으로만 확인된 것 (코드 추론 아님)
- 8h 코스 실제 장소: **자산공원** 포함 (odongdo 미선택) — DB avg_stay_minutes 시간 제약 반영 결과
- 하멜등대 UI 체류시간 blank 표시 동작

---

## 5. DATA_GAP 및 HOLD 유지 확인

| 항목 | 상태 | 근거 |
|------|------|------|
| H1~H4 Edge Evidence | **MISSING** | 8h 코스 직접 Edge 미측정 (GOVERNANCE_HOLD와 무관, 별도 이슈) |
| hamel_lighthouse avg_stay_minutes | **null / DATA_GAP** | Production 화면에서 blank 확인 — Founder Decision 2026-10-24 (DB 입력 보류) |
| CAR Matrix GOVERNANCE_HOLD | **유지** | `_estimateTravelTime()` V0 Stub 그대로, 화면에서 "이동시간 확인 중" 확인 |
| F-1~F-4 Runtime Connected | **NO** | GOVERNANCE_HOLD 유지 중 |

---

## 6. Guardian 판정

```
변경 분류:   REPAIR (의도된 기능 복구)
구현 범위:   services/travelGuideService.js (_applyClusterDiversity cap 수정)
테스트:      21/21 신규 PASS / 548/549 회귀 PASS
Production:  PROD_UI_VERIFIED (Founder 화면 3장, 2026-10-24)

2h cap=2  → 화면 2개 ✅
5h cap=3  → 화면 3개 ✅
8h cap=5  → 화면 5개 ✅

DATA_GAP 유지:   hamel_lighthouse avg_stay_minutes = null
GOVERNANCE_HOLD: CAR Matrix Runtime 연결 없음
H1~H4:           MISSING (별도 이슈, 이번 수정 범위 외)

판정: PR #115 CLOSED — PROD_UI_VERIFIED
```

---

*생성: 2026-10-24 / Claude Code (Antigravity)*
*코드 수정 없음. Production QA 기록 전용.*
