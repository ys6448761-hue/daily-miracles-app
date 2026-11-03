# PHX-COMMERCE-FLOW-003 — FLOW Minimal Integration Evidence

**Task ID:** PHX-COMMERCE-FLOW-003  
**Date:** 2026-11-03  
**Strategy:** Option B (최소 파일 cherry-pick)  
**Founder Authorization:** APPROVED 2026-11-03  
**Final Status:** READY FOR REVIEW

---

## §1 기준 정보

| 항목 | 값 |
|------|-----|
| Base main commit | `1f02c5c` (fix(soul-theme): 비활성화 버튼 햇살 모드 글자 대비 보완 #137) |
| Work branch | `feat/flow-minimal-integration` |
| Branch commit | `e0c1158` |
| PR | #141 (feat(flow): minimal FLOW integration for Commerce Phase 1) |
| PR URL | https://github.com/ys6448761-hue/daily-miracles-app/pull/141 |

---

## §2 추가된 파일

| 파일 | 이식 출처 | 역할 |
|------|----------|------|
| `services/flowInventoryService.js` | staging/storybook-c7a | Hold/Book/Release 핵심 엔진 (304L) |
| `routes/flowRoutes.js` | staging/storybook-c7a | /availability, /hold, /book (187L) |
| `routes/flowConfirmRoutes.js` | staging/storybook-c7a | /confirm 파트너 확인 (171L) |
| `routes/flowAdminRoutes.js` | staging/storybook-c7a | 관리자 재고 관리 (182L) |
| `middleware/adminGuard.js` | staging/storybook-c7a | ADMIN_TOKEN 헤더 검증 (~60L) |
| `services/partnerPinService.js` | staging/storybook-c7a | PIN SHA256 검증 (~88L) |
| `routes/sodamRoutes.js` | staging/storybook-c7a | SODAM 자격 결정 (198L) — flowHoldSodamDecision.test 의존 |
| `services/sodamDecisionService.js` | staging/storybook-c7a | SODAM 결정 서비스 (369L) — sodamRoutes 의존 |

### 이식 파일 확대 사유 (sodamRoutes/sodamDecisionService)

- `tests/unit/flowHoldSodamDecision.test.js`가 `routes/sodamRoutes`를 require
- sodamRoutes → sodamDecisionService → (quoteEngine, kstDate, flowInventoryService) 의존
- quoteEngine, kstDate는 main에 이미 존재
- sodamRoutes/sodamDecisionService 모두 인증 계약 준수 (req.sowon_id JWT 전용)
- 최소 추가로 판단하여 이식 (Founder 추가 승인 필요 시 HOLD 대상)

---

## §3 수정된 파일

### server.js (+39줄)

삽입 위치: `dreamtownFlowRoutes` 등록 블록 직후 (line 2435 기준)

```
// BLOCK-1: flowKennyRoutes (/api/dt/flow/availability, /hold, /book)
// BLOCK-2: flowConfirmKennyRoutes (/api/dt/flow/confirm)
// BLOCK-3: flowAdminKennyRoutes (/api/admin/flow/inventory)
```

기존 라우트 충돌 확인:
- `dreamtownFlowRoutes` (기존, `/api/dt/flow`): POST `/`, GET `/kpi`, `/trend`, `/day1-kpi`, `/growth-kpi`, `/bottleneck`
- `flowRoutes` (신규, `/api/dt/flow`): GET `/availability`, POST `/hold`, POST `/book`, DELETE `/hold/:id`
- 경로 중복 없음 — 동일 prefix에 서로 다른 sub-path 사용

---

## §4 Migration 처리

| 파일 | Production 상태 | 처리 |
|------|----------------|------|
| `208_flow_schema.sql` | APPLIED | 기록용 이식 |
| `209_kenny_seed.sql` | APPLIED | 기록용 이식 |
| `210_sodam_decisions.sql` | APPLIED | 기록용 이식 |
| `211_flow_confirmations.sql` | APPLIED | 기록용 이식 |
| `212_flow_hold_sodam_decision.sql` | APPLIED | 기록용 이식 |
| `213_ramada_seed.sql` | APPLIED | 기록용 이식 |
| `214_sowon_identity.sql` | APPLIED | 기록용 이식 |
| `207_voyage_wish_owner.sql` | **이식 제외** | main 207과 번호 충돌 |
| `217_flow_ticket_order_id.sql` | APPLIED (2026-11-03) | 재실행 없음 |

**Migration 재실행 위험:** 모든 DDL이 `IF NOT EXISTS` 포함 → 멱등성 확보됨

---

## §5 인증 호환성

| 항목 | 결과 |
|------|------|
| PHX-COMMERCE-FLOW-002 판정 | **PASS** |
| authenticatedPrincipal.js 변경 | **없음** |
| req.sowon_id 출처 | JWT claim 전용 (body/query 차단) |
| 미인증 접근 | 401 AUTHENTICATION_REQUIRED |
| sowon_id 없는 Hold | 403 SOWON_ID_UNRESOLVED |
| 타 사용자 Hold 접근 | 403 HOLD_OWNERSHIP_MISMATCH |

---

## §6 테스트 결과

### FLOW 단위 테스트

| 테스트 파일 | 테스트 수 | 결과 |
|------------|---------|------|
| flowInventory.test.js | 23 | **PASS** |
| flowConfirm.test.js | 13 | **PASS** |
| flowHoldSodamDecision.test.js | 11 | **PASS** |
| flowKstCutoff.test.js | 4 | **PASS** |
| **합계** | **51** | **전체 PASS** |

### 전체 테스트

| 항목 | 이 브랜치 | origin/main |
|------|---------|------------|
| Test Suites | 17 failed, 32 passed | 17 failed, 28 passed |
| Tests | 690/691 PASS | 639/640 PASS |
| 신규 실패 | **없음** | — |
| PRE-EXISTING FAIL | 1 (main과 동일) | 1 |

추가된 4개 FLOW 테스트 suite (51 tests) 모두 PASS.  
기존 17개 suite 실패는 main에 이미 존재하는 PRE-EXISTING FAIL.

### 모듈 로드 확인

```
flowInventoryService OK
flowRoutes OK
flowConfirmRoutes OK
flowAdminRoutes OK
adminGuard OK
partnerPinService OK
sodamRoutes OK
sodamDecisionService OK
```

---

## §7 Production 영향

| 항목 | 값 |
|------|-----|
| Production DB 변경 | **NONE** |
| 운영 배포 | **없음** |
| 기존 인증 로직 변경 | **없음** |
| NicePay 변경 | **없음** |
| flowTicketRoutes.js 구현 | **없음** |

---

## §8 CI 상태

PR #141 생성 직후. Vercel Preview 배포 진행 중.  
기존 PR #140의 Vercel FAILURE는 staging 특화 환경변수 문제로 이 PR과 무관.

---

## §9 잔여 위험 및 Blocker

| 항목 | 상태 |
|------|------|
| sodamRoutes/sodamDecisionService 이식 확대 | Founder 사후 확인 권장 |
| Vercel CI 결과 | PR 생성 후 확인 필요 |
| PR #141 병합 | Founder 별도 승인 필요 |
| flowTicketRoutes.js 구현 | 다음 단계 별도 승인 필요 |
| 실제 DB 동시성 테스트 | NOT RUN (Mock DB 사용) |

---

## §10 최종 결과

| 항목 | 값 |
|------|-----|
| BASE MAIN COMMIT | `1f02c5c` |
| WORK BRANCH | `feat/flow-minimal-integration` |
| FILES ADDED | 19 |
| FILES MODIFIED | server.js (+39줄) |
| MIGRATION STATUS | 208-214 기록 이식 / 207 제외 / 217 보존 |
| AUTH COMPATIBILITY | PASS (authenticatedPrincipal.js 무변경) |
| FLOW TESTS | 51/51 PASS |
| EXISTING TESTS | 690/691 PASS (PRE-EXISTING FAIL 1개, main 동일) |
| COMMIT HASH | `e0c1158` |
| PR NUMBER / URL | #141 / https://github.com/ys6448761-hue/daily-miracles-app/pull/141 |
| PRODUCTION MODIFICATION | NONE |
| FINAL STATUS | **READY FOR REVIEW** |
