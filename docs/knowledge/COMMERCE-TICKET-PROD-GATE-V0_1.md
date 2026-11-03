# PHX-COMMERCE-TICKET-003 — Production Safety Gate Report

**Task ID:** PHX-COMMERCE-TICKET-003  
**Date:** 2026-11-03  
**Target:** PR #143 (`feat/commerce-ticket-flow-v02` → `main`)  
**Final Status:** **MERGE READY** (모든 필수 조건 충족)

---

## §1 보안 수정 3건 포함 확인

**Commit:** `4197669` (`fix(commerce): PHX-COMMERCE-TICKET-002 — security gate fixes`)

| 수정 번호 | 내용 | 커밋 메시지 포함 |
|----------|------|----------------|
| 1 (CRITICAL) | 동시 중복 23505 → 200 idempotent | ✅ "Concurrent duplicate ticket-book caused false ops SMS + 500" |
| 2 (IMPORTANT) | HOLD_NOT_ACTIVE ops SMS 추가 | ✅ "HOLD_NOT_ACTIVE was missing from the ops SMS alert list" |
| 3 (MINOR) | 서명 형식 검증 순서 이동 | ✅ "INVALID_SIGNATURE_FORMAT check moved before computeSignature" |

**판정:** 3건 모두 `feat/commerce-ticket-flow-v02` 최신 브랜치에 포함 ✅

---

## §2 NicePay 증빙 없는 ticket-book 호출 가능 여부 분석

### 2-1. 외부 공격자 관점

```
외부 공격자가 ticket-book 호출 시 → requireTicketAuth 실행
  → FLOW_TICKET_ENABLED ≠ 'true' → 503 TICKET_API_DISABLED  (Feature Flag)
  → FLOW_TICKET_SECRET 없음 → verify → SERVER_CONFIG_ERROR → 401
  → 올바른 서명 없음 → INVALID_SIGNATURE → 401
```

`FLOW_TICKET_SECRET` 없이는 유효한 HMAC 서명 생성 불가.  
**외부 공격자는 ticket-book으로 Booking 생성 불가.** ✅

### 2-2. PHP 서버 관점 (Secret 보유)

```
PHP 서버가 NicePay 미승인 후에도 ticket-book 호출하는 경우:
  → HMAC 서명 통과 (Secret 보유)
  → ticket-book Booking 생성됨 (결제 없이)
```

**이 경우는 PHP 서버 자체의 로직 버그 또는 악의적 행동에 해당.**  
이 Node.js 서버에서 독립적으로 NicePay 승인을 교차 검증하는 것은 현재 불가능 (별도 가맹점).

**PHP 신뢰 계약:**
- PHP 서버만 Secret 보유 (운영 계약)
- PHP 서버에서 NicePay 승인 성공 후에만 ticket-book POST 호출 (PHP 담당자 보장)
- PHP 담당자 확인 항목은 Security Gate §7에 정의

**MVP 허용 수준:** PARTIAL (PHP 계약 이행 책임은 PHP 팀)

---

## §3 Production 차단 장치 — FLOW_TICKET_ENABLED Feature Flag

### 3-1. 기존 방식의 한계

| 환경변수 미설정 시 동작 | 문제점 |
|----------------------|--------|
| `FLOW_TICKET_SECRET` 없음 → 401 | 암묵적 차단, 조기 실패 없음 |
| `FLOW_TICKET_SOWON_ID` 없음 → 503 | 암묵적 차단 |
| 두 변수가 실수로 Render에 추가됨 → **즉시 활성화** | 명시적 활성화 의도 불명확 |

### 3-2. 구현된 Feature Flag

**Commit:** `3dd0695`  
**파일:** `routes/flowTicketRoutes.js`  
**위치:** `requireTicketAuth` 미들웨어 첫 번째 검사

```javascript
if (process.env.FLOW_TICKET_ENABLED !== 'true') {
  return res.status(503).json({ error: 'TICKET_API_DISABLED' });
}
```

**동작:**

| `FLOW_TICKET_ENABLED` 값 | 동작 |
|--------------------------|------|
| 미설정 (Production 기본값) | 503 TICKET_API_DISABLED |
| `"false"` | 503 TICKET_API_DISABLED |
| `"true"` | HMAC 인증 계속 진행 |

**활성화 체크리스트 (모두 완료 후에만 `true` 설정):**
```
[ ] PHP HMAC canonical string 구현 Node.js와 동일 확인
[ ] PHP E2E: hold → NicePay 결제 → book 스테이징 테스트 완료
[ ] ticket_order_id 재사용 방지 PHP 측 보장 확인
[ ] FLOW_TICKET_SECRET + FLOW_TICKET_SOWON_ID Render 등록
[ ] FLOW_TICKET_ENABLED=true Render 등록 (마지막 단계)
```

### 3-3. 기존 FLOW 라우트 영향 없음

Feature Flag는 `/api/dt/flow/ticket-hold`, `/api/dt/flow/ticket-book` 전용 미들웨어에만 적용.

기존 라우트:
- `GET /api/dt/flow/availability` — 영향 없음 (flowKennyRoutes)
- `POST /api/dt/flow/hold` — 영향 없음 (flowKennyRoutes)
- `POST /api/dt/flow/book` — 영향 없음 (flowKennyRoutes)
- `POST /api/dt/flow` (FLOW 메트릭) — 영향 없음 (dreamtownFlowRoutes)

---

## §4 테스트 결과

### Feature Flag 테스트 (신규 4건)

| 시나리오 | 기대값 | 결과 |
|--------|-------|------|
| `FLOW_TICKET_ENABLED` 미설정 → ticket-hold | 503 TICKET_API_DISABLED | ✅ PASS |
| `FLOW_TICKET_ENABLED=false` → ticket-hold | 503 TICKET_API_DISABLED | ✅ PASS |
| `FLOW_TICKET_ENABLED=true` → auth 검사 진행 | 401 (인증 실패) | ✅ PASS |
| `FLOW_TICKET_ENABLED` 미설정 → ticket-book | 503 TICKET_API_DISABLED | ✅ PASS |

### 전체 FLOW 테스트

| 테스트 파일 | 테스트 수 | 결과 |
|------------|---------|------|
| flowTicket.test.js (누적) | **30** | **PASS** |
| flowInventory.test.js | 23 | PASS |
| flowConfirm.test.js | 13 | PASS |
| flowHoldSodamDecision.test.js | 11 | PASS |
| flowKstCutoff.test.js | 4 | PASS |
| **합계** | **81** | **전체 PASS** |

---

## §5 GitHub CI 및 Branch Protection 상태

### CI 최신 실행 결과 (Commit `3dd0695`)

| 검사 | 상태 | 필수 |
|------|------|------|
| AIL Gate | ✅ SUCCESS (41s) | **필수** |
| Verify Manifest & Index | ✅ SUCCESS (31s) | 필수 |
| docker-smoke | ✅ SUCCESS (37s) | 필수 |
| Vercel Preview Comments | ✅ SUCCESS | — |
| Vercel – daily-miracles-app | ❌ FAILURE | **비필수** (PRE-EXISTING) |
| Vercel – daily-miracles-app-21z3 | ❌ FAILURE | **비필수** (PRE-EXISTING) |

**mergeable:** `MERGEABLE`  
**mergeStateStatus:** `UNSTABLE` (비필수 Vercel 체크 실패 — PR #137 병합 시와 동일)

### Branch Protection 판단

Vercel 실패가 비필수임은 다음으로 확인됨:
- PR #137 (merged `1f02c5c`) — 동일한 Vercel FAILURE 상태에서 병합 완료
- PR #141 (merged `b75aacd5`) — 동일 패턴
- `mergeable: MERGEABLE` — 코드 충돌 없음
- 유일한 **필수** 체크: AIL Gate ✅ SUCCESS

---

## §6 최종 판정

### **MERGE READY** ✅

| 검증 항목 | 결과 | 비고 |
|----------|------|------|
| 보안 수정 3건 포함 | ✅ CONFIRMED | Commit 4197669 |
| 외부 공격자 차단 | ✅ PASS | Secret 없이 서명 위조 불가 |
| Production 기본값 비활성화 | ✅ IMPLEMENTED | FLOW_TICKET_ENABLED=true 명시 필요 |
| 기존 FLOW 라우트 영향 없음 | ✅ VERIFIED | 81/81 PASS |
| AIL Gate | ✅ SUCCESS | 필수 체크 통과 |
| Vercel 실패 | PRE-EXISTING | 비필수, PR #137/141도 동일 패턴 |
| NicePay 검증 | ⚠️ PARTIAL | PHP 계약 이행 필요 |

**미완료 항목:**
- PHP NicePay 검증: PARTIAL (MVP 범위 내 허용, §2 신뢰 계약)
- Nonce store in-memory: 단일 인스턴스 MVP 허용

---

## §7 PR #143 최종 커밋 이력

| Commit | 내용 |
|--------|------|
| `c2c3b37` | PHX-COMMERCE-TICKET-001 구현 (ticketAuthService, flowTicketRoutes, consumeHold 확장, 23 tests) |
| `f2a0c0d` | PHX-COMMERCE-TICKET-001 Evidence + Status |
| `4197669` | PHX-COMMERCE-TICKET-002 보안 게이트 수정 (+3 tests: 23505 idempotent, HOLD_NOT_ACTIVE SMS, 서명 순서) |
| `56a0fd4` | PHX-COMMERCE-TICKET-002 Security Gate Evidence |
| `3dd0695` | PHX-COMMERCE-TICKET-003 FLOW_TICKET_ENABLED Feature Flag (+4 tests) |

**최종 브랜치 HEAD:** `3dd0695`  
**PR:** #143  
**FLOW 테스트:** 81/81 PASS  
**Production 변경:** NONE

---

## §8 Founder 병합 후 활성화 순서

```
병합 (PR #143) → Production 배포 (수동)
  ↓
Render env 추가 (단계별, 순서 엄수):
  1. FLOW_TICKET_SECRET=<shared secret with PHP>
  2. FLOW_TICKET_SOWON_ID=<system UUID>
  → 이 시점까지 API = 503 TICKET_API_DISABLED
  ↓
PHP 담당자 Security Gate §7 항목 이행 확인
PHP E2E 스테이징 테스트 완료
  ↓
  3. FLOW_TICKET_ENABLED=true   ← 마지막 단계 (API 활성화)
```
