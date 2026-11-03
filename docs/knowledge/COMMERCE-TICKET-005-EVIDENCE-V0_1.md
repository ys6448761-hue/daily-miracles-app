# PHX-COMMERCE-TICKET-005 — Evidence

**Task ID:** PHX-COMMERCE-TICKET-005  
**Date:** 2026-11-03  
**FINAL STATUS:** PARTIAL  
**PR:** #145 (`feat/commerce-ticket-005-e2e-harness` → `main`)  
**Commit:** `b832752`

---

## §1 PHP 환경 조사 결과

| 항목 | 결과 |
|------|------|
| PHP REPOSITORY | C:\DEV 워크스페이스에 없음 |
| PHP OWNER | 확인 불가 (담당자 문의 필요) |
| NICEPAY CALLBACK LOCATION | 확인 불가 |
| PAYMENT VERIFICATION CONTRACT | Node 기준 역방향 도출 — 명세 작성 완료 |
| 운영 PHP 파일 수정 | NONE |

---

## §2 HMAC 계약 도출

Node.js `services/ticketAuthService.js` 기준으로 역방향 도출.

**Canonical String:**
```
timestamp\n
nonce\n
METHOD\n
/path\n          ← /ticket-hold 또는 /ticket-book
field1=val1&...  ← body 필드 ASCII 오름차순, URL 인코딩 없음
```

**Path 중요 사항:** Express `req.path` 기준 — `/ticket-hold` (full URL 아님)

명세 파일: `docs/knowledge/COMMERCE-TICKET-005-PHP-SPEC-V0_1.md`

---

## §3 HMAC 테스트 벡터 4개 (Node 검증 완료)

테스트 Secret: `test-secret-for-php-contract-verification-v01`  
테스트 Timestamp: `1730624400000`

| 벡터 | 대상 | Node 서명 |
|------|------|-----------|
| V1 | ticket-hold (quantity 포함) | `db43bdbbbf6c2c446dae702303c0c3c51a966fcfc89cfa9bcec91c7b7f4f191b` |
| V2 | ticket-hold (quantity 생략) | `d38ec1ecb61e2a0ace79d9274b11e8c9613c7b83866c03a60329cc60b4de2ff2` |
| V3 | ticket-book (전체 필드) | `6f52351d6b4b7d7548a8c454744f0e8b25d61fcfb9e298102ab3071f9a5142c0` |
| V4 | ticket-book (필수 필드만) | `a6f82dd3b57c4b659d475d5c2afc398ce96d22e9810db48b4673d2f92e1010df` |

**S-07 테스트 PASS** — PhpHmacAdapter가 동일 벡터 4개 재현 ✅

---

## §4 비운영 E2E 환경

| 구성 요소 | 구현 상태 |
|----------|---------|
| MockNicePay | ✅ `tests/integration/ticketE2E/mockNicePay.js` |
| PhpHmacAdapter | ✅ `tests/integration/ticketE2E/phpHmacAdapter.js` |
| Mock PostgreSQL (in-test stub) | ✅ `ticketE2E.test.js` makeMockDb() |
| 실제 PostgreSQL 통합 | ❌ 미구성 (Production DB 보호) |
| Mock NicePay | ✅ approve/verify 구현 |
| 실제 NicePay | ❌ 미연결 (Production 결제 보호) |

---

## §5 E2E 테스트 결과

| 시나리오 | 내용 | 결과 |
|---------|------|------|
| S-01 | Hold → Mock 결제 → Book 성공 | ✅ PASS |
| S-02 | Hold 실패 → 결제 차단 | ✅ PASS |
| S-03 | 인증 우회 시도 → Book 차단 | ✅ PASS |
| S-04 | 중복 콜백 → Booking 1개 (idempotent) | ✅ PASS |
| S-05 | 만료 Hold → 실패 + ops SMS | ✅ PASS |
| S-06 | PG 23505 동시 충돌 → idempotent | ✅ PASS |
| S-07 | HMAC 벡터 4개 PHP ↔ Node 일치 | ✅ PASS |
| S-08 | Nonce 재전송 차단 | ✅ PASS |
| S-09 | DB 장애 → 500 + ops SMS | ✅ PASS |
| S-10 | ops SMS 실패 → console.error 기록 | ✅ PASS |

```
Unit Tests:       81/81 PASS
E2E Tests:        17/17 PASS
Total:            98/98 PASS
Production 변경:  NONE
```

---

## §6 Hold TTL 불일치

| 항목 | 태스크 명세 | 실제 구현 |
|------|----------|---------|
| Hold TTL | 45분 | **30분** (`FLOW_HOLD_TTL_MINUTES` default=30) |

**Founder 결정 필요:** PHP E2E 전 TTL 조정 여부  
→ 변경 방법: `FLOW_HOLD_TTL_MINUTES=45` 환경변수 설정 (코드 수정 불필요)

---

## §7 최종 판정: PARTIAL

**이유:** PHP Repo 접근 불가

- ✅ PHP 담당자 전달 HMAC 명세 완료
- ✅ 테스트 벡터 4개 Node 검증 완료
- ✅ Mock 비운영 E2E Harness 17/17 PASS
- ❌ PHP 실제 코드 HMAC 검증 미완료
- ❌ 실제 PostgreSQL 통합 E2E 미실행
- ❌ 실제 NicePay Staging 테스트 미실행

**E2E READY 전환 조건:**
1. PHP 담당자가 벡터 4개를 PHP에서 재현 → 서명 일치 확인
2. PHP 담당자 §7 체크리스트 이행 완료
3. 스테이징 DB + 스테이징 NicePay 환경 구성
4. Hold TTL 불일치 Founder 결정

---

## §8 Production 보호 확인

| 항목 | 상태 |
|------|------|
| Production DB 변경 | NONE |
| Production PHP 변경 | NONE |
| 실제 NicePay 결제 | NONE |
| FLOW_TICKET_ENABLED=true 설정 | NONE |
| Render 환경변수 변경 | NONE |
| PR 자동 병합 | NONE |
