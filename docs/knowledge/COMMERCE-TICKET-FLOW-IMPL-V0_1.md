# PHX-COMMERCE-TICKET-001 — Ticket Hold & Book API Evidence

**Task ID:** PHX-COMMERCE-TICKET-001  
**Date:** 2026-11-03  
**Branch:** `feat/commerce-ticket-flow-v02`  
**Commit:** `c2c3b37`  
**PR:** #143  
**Final Status:** READY FOR REVIEW

---

## §1 구현 개요

| 항목 | 내용 |
|------|------|
| 인증 방식 | HMAC-SHA256 server-to-server (ticket.6117.co.kr → FLOW) |
| Hold 소유자 | `FLOW_TICKET_SOWON_ID` env (고정 시스템 UUID, 인증 수단 아님) |
| 결제 검증 | PARTIAL — PHP HMAC 서명 신뢰 계약 (교차 가맹점 검증 미지원) |
| Migration | 217 (`ticket_order_id`, `ticket_paid_at`) APPLIED (2026-11-03) |

---

## §2 생성/수정 파일

| 파일 | 유형 | 내용 |
|------|------|------|
| `services/ticketAuthService.js` | NEW | HMAC-SHA256 verify, buildCanonical, computeSignature |
| `routes/flowTicketRoutes.js` | NEW | POST /ticket-hold, POST /ticket-book |
| `services/flowInventoryService.js` | EXTEND | consumeHold INSERT에 ticket_order_id/$7, ticket_paid_at/$8 추가 |
| `server.js` | EXTEND | FLOW Ticket 라우터 등록 블록 (+15줄, line 2474) |
| `tests/unit/flowTicket.test.js` | NEW | 23 tests |

---

## §3 아키텍처 흐름 (V0.2 확정)

```
ticket.6117.co.kr (PHP)
  │
  ▼ POST /api/dt/flow/ticket-hold
  │   Headers: X-Ticket-Timestamp, X-Ticket-Nonce, X-Ticket-Signature
  │   Body: { inventory_id, quantity }
  │   → ticketAuthService.verify() → HMAC-SHA256 검증
  │   → flowInventoryService.createHold(inventory_id, TICKET_SOWON_ID, qty)
  │   ← { hold_id, expires_at }
  │
  │ [결제 처리: NicePay 별도 가맹점, 서버 간 검증 불가]
  │
  ▼ POST /api/dt/flow/ticket-book
      Headers: X-Ticket-Timestamp, X-Ticket-Nonce, X-Ticket-Signature
      Body: { hold_id, ticket_order_id, ticket_paid_at, customer_name?, phone? }
      → ticketAuthService.verify() → HMAC-SHA256 검증
      → idempotency check: SELECT WHERE ticket_order_id=X AND status='confirmed'
      → flowInventoryService.consumeHold(hold_id, TICKET_SOWON_ID, booking_details)
         └─ INSERT dt_flow_bookings (ticket_order_id, ticket_paid_at 포함)
         └─ UNIQUE INDEX uq_dt_flow_bookings_ticket_order 중복 방지
      ← { booking_id, ticket_order_id }
```

---

## §4 ticketAuthService 보안 설계

| 속성 | 값/방식 |
|------|--------|
| 알고리즘 | HMAC-SHA256 |
| Canonical | `timestamp\nnonce\nMETHOD\n/path\nfield1=val1&field2=val2` (키 정렬) |
| Timestamp 허용 오차 | ±5분 |
| Nonce TTL | 10분 (in-memory Map, 60s 주기 청소) |
| 비교 | `crypto.timingSafeEqual` (timing attack 방지) |
| Hex 검증 | `/^[0-9a-f]{64}$/i` 정규식 (INVALID_SIGNATURE_FORMAT) |
| Secret 읽기 | 요청 시점 `process.env.FLOW_TICKET_SECRET` (동적 — 모듈 로드 시 캡처 안 함) |

**단일 서버 MVP 제약:** Nonce store는 in-memory. Render 다중 인스턴스 시 Redis로 교체 필요.

---

## §5 flowInventoryService.consumeHold 확장

**변경 전 (6개 파라미터):**
```sql
INSERT INTO dt_flow_bookings
  (inventory_id, hold_id, sowon_id, quantity, status, customer_name, phone)
VALUES ($1, $2, $3, $4, 'confirmed', $5, $6)
RETURNING id, inventory_id, hold_id, sowon_id, quantity, status, created_at
```

**변경 후 (8개 파라미터 — backward-compatible):**
```sql
INSERT INTO dt_flow_bookings
  (inventory_id, hold_id, sowon_id, quantity, status, customer_name, phone,
   ticket_order_id, ticket_paid_at)
VALUES ($1, $2, $3, $4, 'confirmed', $5, $6, $7, $8)
RETURNING id, inventory_id, hold_id, sowon_id, quantity, status,
          ticket_order_id, ticket_paid_at, created_at
```

기존 호출 코드는 `booking_details.ticket_order_id` 미전달 → `null` (기존 데이터 안전).

---

## §6 Ops Alert 정책

| 상황 | 알림 |
|------|------|
| HOLD_EXPIRED on book | 운영자 SMS + 409 반환 |
| HOLD_NOT_FOUND on book | 운영자 SMS + 404 반환 |
| DB 예외 on book | 운영자 SMS + 500 반환 |
| HOLD_OWNERSHIP_MISMATCH | SMS 없음 (공격 가능성, 로그만) |

---

## §7 결제 검증 상태 (PARTIAL)

ticket.6117.co.kr PHP는 별도 NicePay 가맹점 사용.
이 서버의 `nicepay_payments` 테이블로 검증 불가.

**MVP 계약:** PHP → FLOW HMAC 서명 = 결제 승인 증명.
  PHP가 서명을 위조하면 FLOW 인증이 실패하므로, 거짓 결제 주입은 PHP 서버 침해 없이는 불가능.

**향후 구현:** PHP와 결제 검증 콜백 계약 체결 시 `/api/dt/flow/ticket-book`에 추가 검증 레이어 삽입.

---

## §8 테스트 결과

| 테스트 파일 | 테스트 수 | 결과 |
|------------|---------|------|
| flowTicket.test.js (신규) | 23 | **PASS** |
| flowInventory.test.js | 23 | **PASS** |
| flowConfirm.test.js | 13 | **PASS** |
| flowHoldSodamDecision.test.js | 11 | **PASS** |
| flowKstCutoff.test.js | 4 | **PASS** |
| **합계** | **74** | **전체 PASS** |

---

## §9 환경 변수 요구사항

| 변수 | 용도 | 비고 |
|------|------|------|
| `FLOW_TICKET_SECRET` | HMAC-SHA256 shared secret | 최소 32자 권장, PHP와 동일값 |
| `FLOW_TICKET_SOWON_ID` | Hold 소유자 식별 UUID | PHP에도 공유 (인증 수단 아님) |
| `ADMIN_PHONE` | Ops SMS 수신 | 기존 env 재사용 |

---

## §10 잔여 위험 및 Blocker

| 항목 | 상태 |
|------|------|
| Payment cross-merchant verification | PARTIAL (PHP 계약 후 강화) |
| Nonce store in-memory | MVP 허용, 다중 인스턴스 시 Redis 필요 |
| PHP 연동 E2E 테스트 | NOT RUN (PHP 서버 미연결) |
| Production 배포 | Founder 수동 배포 결정 필요 |
| PR #143 병합 | Founder 승인 필요 |
| env vars 등록 | Render 환경변수에 FLOW_TICKET_SECRET, FLOW_TICKET_SOWON_ID 추가 필요 |

---

## §11 최종 결과

| 항목 | 값 |
|------|-----|
| BRANCH | `feat/commerce-ticket-flow-v02` |
| COMMIT | `c2c3b37` |
| PR | #143 |
| FILES ADDED | 3 (ticketAuthService, flowTicketRoutes, flowTicket.test) |
| FILES MODIFIED | 2 (flowInventoryService, server.js) |
| FLOW TESTS | 74/74 PASS |
| PRODUCTION MODIFICATION | NONE |
| FINAL STATUS | **READY FOR REVIEW** |
