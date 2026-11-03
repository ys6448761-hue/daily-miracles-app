# PR #140 병합 준비 상태 검증 Evidence

**Task:** PHX-COMMERCE-MIG-003 후속 — PR #140 병합 준비 검증
**Date:** 2026-11-03
**Result:** HOLD

---

## §1 PR #140 기본 상태

| 항목 | 값 |
|------|-----|
| PR 번호 | #140 |
| 상태 | OPEN |
| head | staging/storybook-c7a |
| base | main |
| mergedAt | null (미병합) |
| mergeable | **CONFLICTING** |
| mergeStateStatus | **DIRTY** |
| changedFiles | 633 |
| additions | +166,486 lines |
| deletions | -3,038 lines |
| 마지막 staging 커밋 | 2026-10-02 |

---

## §2 CI 검사 결과

| 검사 | 상태 |
|------|------|
| Vercel – daily-miracles-app | **FAILURE** |
| Vercel – daily-miracles-app-21z3 | **FAILURE** |
| Vercel Preview Comments | SUCCESS |

Vercel 배포 2개 FAILURE — 병합 전 원인 확인 필요.

---

## §3 충돌 분석

### 3-1. 브랜치 분기점

```
Merge base: cc577d2c45e5412b80a2a73d50264f960de44a0f
main 분기 이후 변경 파일: 387개
staging 분기 이후 변경 파일: 633개
양쪽 모두 변경 (충돌 후보): 26개
```

### 3-2. 충돌 후보 파일 (26개)

**핵심 파일:**

| 파일 | 충돌 위험도 |
|------|-----------|
| server.js | 🔴 CRITICAL — main +77줄 / staging +3,012줄 |
| routes/dreamtownRoutes.js | 🔴 HIGH |
| routes/nicepayRoutes.js | 🔴 HIGH |
| routes/identityRoutes.js | 🔴 HIGH |
| services/soyeowoolService.js | 🔴 HIGH |
| services/sharedJourneyService.js | 🟡 MEDIUM |
| dreamtown-frontend/src/App.jsx | 🟡 MEDIUM |
| dreamtown-frontend/src/pages/SoulCableCarPage.jsx | 🟡 MEDIUM |
| middleware/authenticatedPrincipal.js | 🟡 MEDIUM |
| DREAMTOWN_STATUS.md | 🟢 LOW (문서) |
| docs/index/manifest.json | 🟢 LOW (자동 생성) |

---

## §4 Migration 번호 충돌 — 중요

**동일 번호 207에 서로 다른 Migration 존재:**

| 브랜치 | 파일명 | 내용 |
|--------|-------|------|
| main | `207_travel_places_stay_time_v01.sql` | travel_places stay time 보정 |
| staging | `207_voyage_wish_owner.sql` | voyage_wishes owner_sowon_id 추가 |

두 파일 모두 `207_*.sql` 번호를 사용함. main에 병합 시 두 파일이 공존하게 되어 Migration 실행 순서 및 관리 혼란 발생 가능.

**판단:** 병합 전 번호 재지정 또는 Founder 결정 필요.

---

## §5 Migration 217과의 관계

| 항목 | 상태 |
|------|------|
| Migration 217 Production APPLIED | ✅ VERIFIED (2026-11-03) |
| Migration 217 위치 | docs/commerce-phase1-v01 (PR #139) |
| PR #140과 217 파일 충돌 | 없음 — PR #140에 217 파일 없음 |
| PR #140 병합 후 217 Production 상태 | 영향 없음 (DB는 이미 적용됨) |

Migration 217은 PR #140과 독립. PR #140 병합 여부와 무관하게 Production DB에 ticket_order_id/ticket_paid_at 컬럼 존재.

---

## §6 PR #139 상태 (docs/commerce-phase1-v01 → main)

| 항목 | 값 |
|------|-----|
| state | OPEN |
| mergeable | **MERGEABLE** |
| mergeStateStatus | UNSTABLE (CI 불안정) |

PR #139는 충돌 없음. UNSTABLE은 CI 일시적 상태일 가능성 있음.

---

## §7 판정

| 검증 항목 | 결과 |
|----------|------|
| GitHub 병합 가능 상태 | **CONFLICTING — 충돌 존재** |
| CI 상태 | **FAILURE (Vercel 2개)** |
| Migration 207 번호 충돌 | **존재 — 결정 필요** |
| server.js 충돌 규모 | **main +77줄 vs staging +3,012줄 — 수동 해결 필요** |
| Migration 217 의존성 충돌 | 없음 |
| Production 데이터 위험 | 없음 (Migration은 이미 독립 적용 완료) |

**판정: HOLD**

병합을 위해 필요한 작업:
1. server.js 및 핵심 routes/services 충돌 수동 해결
2. Migration 207 번호 충돌 결정 (staging 207을 208 또는 다른 번호로 재지정?)
3. Vercel CI FAILURE 원인 확인 및 해결
4. 충돌 해결 후 GitHub Actions 재실행

---

## §8 권고사항

PR #140은 633개 파일 +166,486줄 변경의 대형 PR이며 마지막 커밋이 2026-10-02로 1개월 이상 경과했습니다.

선택지:
- **A) 충돌 해결 후 병합** — 공수 큼. staging 브랜치를 main으로 rebase 후 충돌 수동 해결.
- **B) 필요 파일만 cherry-pick** — FLOW 관련 파일만 선택 병합. 안전하나 작업량 검토 필요.
- **C) 현재 HOLD 유지** — flowTicketRoutes.js는 staging 브랜치에서 작업 후 별도 PR.

Founder 결정 필요.
