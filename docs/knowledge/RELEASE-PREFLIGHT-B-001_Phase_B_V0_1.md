# RELEASE-PREFLIGHT-B-001 — Phase B V0.1 Production Release Preflight

생성일: 2026-10-24
상태: COMPLETED — Guardian: READY
작성자: Claude Code (Antigravity 인스턴스)
근거: Founder Decision — Phase B V0.1 Release Preflight (2026-10-24)

---

## 1. Shell Cleanup

| 항목 | 결과 |
|------|------|
| bcn6axgri (background polling shell) | STOPPED ✓ (TaskStop 실행) |

---

## 2. PR #113 확인

| 항목 | 값 |
|------|-----|
| 상태 | MERGED ✓ |
| Squash Merge SHA | `4c160529f08616433bb639e0ce153044b998fca5` |
| mergedAt | `2026-10-24T00:46:07Z` |
| PR head SHA (최종) | `441e7fbc2cf711560e5d4a1334f943994553bea7` |
| main 포함 여부 | CONFIRMED (`git log origin/main..4c16052` = empty) |

---

## 3. PR #114 상태

| 항목 | 값 |
|------|-----|
| 상태 | OPEN |
| mergeable | MERGEABLE |
| mergeStateStatus | UNSTABLE (approve-dec.yml PRE-EXISTING) |
| 변경 파일 | DREAMTOWN_STATUS.md 1개만 ✓ |
| CI (pull_request) | AIL Gate success / docker-smoke success |
| State Sync 전용 | CONFIRMED — 코드 변경 없음 |
| Guardian 판정 | MERGE READY (required checks 충족) |

---

## 4. Production 상태

| 항목 | 값 |
|------|-----|
| Health endpoint | `{"success":true,"database":"연결됨","db_response_ms":2}` |
| HTTP 상태 | 200 OK ✓ |
| Production 기동 시각 | `2026-10-23T05:57:45.180Z` |
| Production SHA (기록) | `696839a` (PR #105 deploy, dep-dbd790mq1p3s73coua40) |
| Render Auto-Deploy | OFF — PR #109/#111/#113 merge 후 자동 배포 미발생 CONFIRMED |

---

## 5. Release 범위 (696839a → 4c16052)

### 포함 PR

| PR | SHA | 분류 | 코드 변경 |
|----|-----|------|-----------|
| #106 | `ddda694` | docs only | 없음 |
| #109 | `997dfdc` | 코드 | COURSE_PLANNING Time Gate V0.1 |
| #110 | `f57deb0` | docs only | 없음 |
| #111 | `bbb5b96` | 코드 | CAR_INFO Separation V0.1 |
| #112 | `d0b5acc` | docs only | 없음 |
| #113 | `4c16052` | 코드 | Phase B V0.1 (Nighttime Walk) |

> **주의:** Phase B(PR #113) 단독이 아닌 PR #109(Time Gate) + PR #111(CAR_INFO) + PR #113(Phase B) 3개 동시 배포.

### 변경 파일 (코드 한정)

| 파일 | PR | 내용 |
|------|-----|------|
| `services/soyeowoolService.js` | #109 + #111 + #113 | Time Gate + CAR_INFO Separation + Nighttime Walk |
| `services/quoteContextService.js` | #113 | 신라스테이 MVP_HOTELS 추가 |
| `dreamtown-frontend/src/pages/MuyojeongHomePage.jsx` | #111 | "차량으로" chip query 문구 변경 |
| `tests/soul/soulCoursePlanningTimeGate.test.js` | #109 | 신규 테스트 |
| `tests/soul/soulCarInfoSeparation.test.js` | #111 | 신규 테스트 |
| `tests/soul/soulExplicitPlacePreservation.test.js` | #109 | 기존 테스트 업데이트 |

### DB/Migration/Env 확인

| 항목 | 결과 |
|------|------|
| DB migration 변경 | 없음 ✓ |
| 환경변수 변경 필요 | 없음 ✓ |
| infra config 변경 | 없음 ✓ |

---

## 6. CI 종합

| PR | AIL Gate | docker-smoke | 테스트 |
|----|----------|--------------|--------|
| #109 | ✓ (push) | ✓ (push) | T1-T18 18/18 PASS / soul 138/139 (R20 PRE-EXISTING) |
| #111 | ✓ (pr) | ✓ (pr) | CI-1~CI-7 7/7 / T1-T18 18/18 / soul 475/476 (R20 PRE-EXISTING) |
| #113 | ✓ (pr+push) | ✓ (pr+push) | 509/510 PASS (R20 PRE-EXISTING) |

---

## 7. 배포 후 검증 질문 3개

| # | 질문 | 예상 경로 | 예상 핵심 응답 |
|---|------|-----------|----------------|
| A | "신라스테이 여수에 묵는데 차를 두고 여수 밤바다를 즐길 수 있을까요?" | `_isNighttimeWalkQuery` → shinra_stay_yeosu 인식 | "신라스테이에서 이순신광장까지 걸어서 약 26분(1.7km)..." |
| B | "여수에서 밤바다 걸어서 즐길 수 있는 코스가 있을까요?" | `_isNighttimeWalkQuery` (호텔명 없음) | "이순신광장 해안을 따라 종포해양공원, 하멜등대까지..." |
| C | "여수에서 차로 가기 좋은 곳 알려줘" | `_isCarInfoQuery` → 기존 경로 (Phase B 영향 없음) | 주차/차량 안내 |

---

## 8. Rollback 준비

| 항목 | 값 |
|------|-----|
| Rollback 대상 버전 | `696839a` |
| Render Deploy ID | `dep-dbd790mq1p3s73coua40` |
| Rollback 방법 | Render Dashboard → 해당 deploy 재배포 |
| Render Auto-Deploy | OFF 유지 (수동 배포 후 OFF 유지) |

---

## 9. Advisory

| # | 내용 | 심각도 |
|---|------|--------|
| A-1 | PR #109 `[PENDING_CLEAR_WRITE_ERROR]` 로그 처리 미완료 — 자동 복구 미검증 | LOW — 기능 영향 없음 |
| A-2 | R20 PRE-EXISTING (dolsan_daegyo "걸어서" → JOURNEY_CONTINUITY) — 미수정 | PRE-EXISTING — 변경 없음 |

---

## Guardian Release 판정

```
판정: READY

모든 required CI (AIL Gate + docker-smoke) 3개 PR 전체 PASS.
DB/Migration/Env 변경 없음.
Production Health OK (HTTP 200, DB 2ms).
Render Auto-Deploy OFF — 자동 배포 위험 없음.
Rollback 경로 명확 (dep-dbd790mq1p3s73coua40).

Founder 별도 Production Deploy 승인 필요.
```
