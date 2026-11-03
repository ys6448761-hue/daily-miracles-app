# Commerce Phase 1 — ticket.6117.co.kr ↔ FLOW 최소 연동 설계

**Date**: 2026-11-03  
**Status**: DESIGN_COMPLETE — 구현 전 Founder 승인 필요  
**기준**: DECISION_COMMERCE_CHANNEL_V0_1 (ticket.6117.co.kr = 판매 채널 기준)  
**제약**: 코드·DB 변경 없음 (설계 출력 전용)

---

## §0 설계 전제

| 항목 | 내용 |
|------|------|
| ticket.6117.co.kr | PHP 독립 시스템. 우리 codebase에 직접 참조 없음 |
| NicePay MID | ticket.6117.co.kr 전용 MID 존재 여부 미확인 (Founder 확인 필요) |
| 연동 방향 | ticket.6117.co.kr 결제 승인 → 우리 서버 webhook 호출 |
| 기존 FLOW 변경 | createHold() / consumeHold() / releaseHold() 코드 변경 없음 — 호출만 추가 |
| 인증 | Webhook Secret (HMAC or 고정 시크릿) — JWT sowon_id 불필요 |

---

## §1 Q1 — 실제 연결 지점

### 현재 코드베이스 상태

```
ticket.6117.co.kr (PHP)
         ↕ 연결 없음
FLOW (daily-miracles-mvp, staging)
```

코드베이스에 ticket.6117.co.kr 전용 webhook 수신 엔드포인트: **없음**.

### 필요한 연결 지점 (신규 1개)

```
POST /api/dt/flow/ticket-book
```

**역할**: ticket.6117.co.kr가 NicePay 승인 후 이 엔드포인트를 호출.  
**트리거**: ticket.6117.co.kr PHP 코드의 NicePay 승인 콜백(결제 완료 처리) 내부에서 HTTP POST.

### 기존 재사용 패턴

`quoteRequestRoutes.js:91` — `verifyWebhookSecret` 미들웨어 패턴 재사용:

```javascript
// 재사용 패턴 (quoteRequestRoutes.js:91)
const WEBHOOK_SECRET = process.env.WIX_WEBHOOK_SECRET || process.env.QUOTE_WEBHOOK_SECRET;
function verifyWebhookSecret(req, res, next) {
  const providedSecret = req.headers['x-webhook-secret'] || req.headers['authorization'];
  if (providedSecret !== WEBHOOK_SECRET) return res.status(401).json({...});
  next();
}
```

신규 엔드포인트는 `TICKET_WEBHOOK_SECRET` 환경변수로 분리.

---

## §2 Q2 — 주문번호 ↔ FLOW hold_id/booking_id 대응

### 안전한 대응 방법

**`dt_flow_bookings` 테이블에 `ticket_order_id` 컬럼 추가** (Migration 1개):

```sql
-- database/migrations/NNN_flow_ticket_order_id.sql
ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ticket_paid_at  TIMESTAMPTZ;

-- 중복 콜백 방어 (멱등성)
CREATE UNIQUE INDEX IF NOT EXISTS uq_flow_bookings_ticket_order
  ON dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;
```

**대응 흐름**:
```
ticket.6117.co.kr 주문번호 ("TK-20261103-0042")
  → POST /api/dt/flow/ticket-book { ticket_order_id, accommodation_id, stay_date, customer_name, phone }
  → createHold() → consumeHold()
  → dt_flow_bookings.ticket_order_id = "TK-20261103-0042"
  → booking_id (UUID) 반환 → ticket.6117.co.kr에 저장
```

**기존 nicepay_payments는 변경하지 않는다** — ticket.6117.co.kr의 결제 레코드는 그쪽 DB에 있음.

---

## §3 Q3 — Hold → Booking 최소 변경 범위

### 현재 FLOW Hold의 제약

`POST /api/dt/flow/hold`는 JWT sowon_id 필수:
```javascript
router.post('/hold', requireAuthenticatedPrincipal, async (req, res) => {
```

ticket.6117.co.kr는 JWT 없음 → **기존 Hold 엔드포인트 직접 사용 불가**.

### 해결: 서버 사이드 원자 Hold+Book 엔드포인트

```
POST /api/dt/flow/ticket-book
```

내부에서 Hold + Book을 트랜잭션으로 처리 (JWT 없이 ticket_order_id로 식별):

```
1. 가용성 확인: flowService.getAvailability(accommodation_id, date, db)
2. Hold 생성:   flowService.createHold(inventory_id, SYSTEM_SOWON_ID, 1, db)
   - SYSTEM_SOWON_ID = 고정 UUID (ticket site 전용 서비스 계정)
3. Booking 전환: flowService.consumeHold(hold_id, SYSTEM_SOWON_ID, {customer_name, phone, ticket_order_id}, db)
4. 응답: { booking_id, hold_id, ticket_order_id }
```

**파일 1개만 신규 생성**: `routes/flowTicketRoutes.js`

### 변경 파일 목록 (최소)

| 파일 | 분류 | 내용 |
|------|------|------|
| `routes/flowTicketRoutes.js` | **NEW** | ticket webhook 수신 + Hold+Book 원자 처리 |
| `database/migrations/NNN_flow_ticket_order_id.sql` | **NEW** | ticket_order_id + ticket_paid_at 컬럼 |
| `server.js` | **EXTEND** | flowTicketRoutes 마운트 1행 추가 |
| `routes/flowRoutes.js` (staging→main) | **CONNECT** | 기존 Hold/Book 엔드포인트 병합 |
| `services/flowInventoryService.js` (staging→main) | **CONNECT** | createHold/consumeHold/releaseHold 병합 |

**변경하지 않는 파일**:
- `routes/nicepayRoutes.js` — Wix 경로 보존
- `services/nicepayService.js` — 변경 없음
- `routes/flowConfirmRoutes.js` — 파트너 PIN 확인 재사용 (변경 없음)

---

## §4 Q4 — 결제 실패·예약 실패·중복 콜백 정합성

### 시나리오별 처리

| 시나리오 | 발생 위치 | 처리 방법 |
|---------|---------|---------|
| 결제 실패 | ticket.6117.co.kr (PHP NicePay) | 우리 서버 호출 안 함 → FLOW 영향 없음 |
| Hold 생성 실패 (재고 없음) | 우리 서버 | `{ error: 'INSUFFICIENT_AVAILABILITY' }` 반환 → ticket site 처리 |
| consumeHold 실패 (hold 만료) | 우리 서버 | `{ error: 'HOLD_EXPIRED' }` 반환 → ticket site 처리 |
| Hold 성공 → consumeHold 실패 | 우리 서버 | Hold 자동 만료 (TTL 30분) — 재고 자동 복구 |
| 중복 콜백 (동일 ticket_order_id) | 우리 서버 | UNIQUE INDEX 위반 → `{ error: 'ALREADY_BOOKED', booking_id }` 반환 (멱등) |
| 네트워크 단절 (우리 서버 응답 없음) | 우리 서버 | ticket site 재시도 → 중복 방어로 처리 |

### 원자성 보장

Hold + Book을 단일 DB 트랜잭션 내에서 처리:
- Hold 생성 성공 + consumeHold 실패 → ROLLBACK → 재고 복구
- 중간 실패 없이 either 전체 성공 or 전체 실패

### 재고 정합성

```
flowInventoryService.createHold() → SELECT FOR UPDATE (동시 경쟁 방지)
consumeHold() → HOLD_EXPIRED 체크 → HOLD_OWNERSHIP_MISMATCH 체크
dt_flow_bookings.ticket_order_id UNIQUE INDEX → 중복 방지
```

---

## §5 Q5 — 기존 호텔 예약 확정 방식 연결

### 기존 흐름 (변경 없음)

```
dt_flow_bookings.id (booking_id)
  ↓
POST /api/dt/flow/confirm { booking_id, partner_code, partner_pin }
  ↓
dt_flow_confirmations INSERT (booking_id, confirmed_by, confirmed_at)
```

### ticket 연동 후 연결 지점

ticket.6117.co.kr 체크인 시:
```
ticket.6117.co.kr 주문번호 → dt_flow_bookings.ticket_order_id로 booking_id 조회
  → POST /api/dt/flow/confirm { booking_id, partner_code, partner_pin }
```

또는 라마다 파트너가 Phoenix 운영 대시보드에서 booking_id 조회 후 PIN 확인.

**`routes/flowConfirmRoutes.js` 변경 없음** — 기존 파트너 PIN 흐름 그대로 재사용.

---

## §6 Q6 — 기존 코드 재사용 범위 + Staging 검증 계획

### 재사용 가능한 기존 코드

| 코드 | 위치 | 재사용 방식 |
|------|------|-----------|
| `createHold()` | staging flowInventoryService.js | 직접 호출 (수정 없음) |
| `consumeHold()` | staging flowInventoryService.js | 직접 호출 (수정 없음) |
| `releaseHold()` | staging flowInventoryService.js | 취소 시 직접 호출 |
| `getAvailability()` | staging flowInventoryService.js | 직접 호출 |
| `verifyWebhookSecret` 패턴 | quoteRequestRoutes.js:91 | 패턴 복사 (TICKET_WEBHOOK_SECRET 변수) |
| 파트너 PIN 확인 | flowConfirmRoutes.js | 변경 없이 재사용 |

**재사용률**: 핵심 로직 100% 재사용. 신규 코드 = webhook 수신 + 원자 라우터 레이어만.

### Staging 검증 계획 (실결제·실예약 금지)

```
# Step 1 — FLOW 라우트 staging → main 병합 확인
GET /api/dt/flow/availability?accommodation_id={ramada_id}&date=2026-11-20
→ { available: N, status: "open" } 확인

# Step 2 — Webhook 수신 단위 테스트
POST /api/dt/flow/ticket-book
  Headers: x-webhook-secret: test-secret
  Body: { ticket_order_id: "TK-TEST-001", accommodation_id, stay_date, customer_name, phone }
→ { booking_id, hold_id, ticket_order_id } 확인

# Step 3 — 멱등성 확인
동일 ticket_order_id로 재호출
→ { error: "ALREADY_BOOKED", booking_id } 확인

# Step 4 — 파트너 PIN 확인 연결
POST /api/dt/flow/confirm { booking_id, partner_code, partner_pin }
→ { confirmation_id } 확인

# Step 5 — 재고 복구 확인
Hold 생성 → consumeHold 실패 시뮬레이션 → getAvailability() 동일 재고 반환 확인
```

---

## §7 전체 연동 흐름 (목표)

```
[ticket.6117.co.kr 고객]
  1. 호텔+케이블카 패키지 상품 선택
  2. ticket.6117.co.kr에서 NicePay 결제
  3. PHP NicePay 승인 콜백 수신
  4. POST /api/dt/flow/ticket-book (우리 서버)
       { ticket_order_id, accommodation_id, stay_date, customer_name, phone }
  5. [우리 서버] createHold() → consumeHold()
       → dt_flow_bookings { ticket_order_id, booking_id }
  6. 응답: { booking_id } → ticket.6117.co.kr에 저장

[체크인 당일]
  7. 라마다 파트너 / Phoenix 대시보드에서 booking_id 확인
  8. POST /api/dt/flow/confirm { booking_id, partner_pin }
       → 투숙 확정 기록 (dt_flow_confirmations)
```

---

## §8 Founder 승인 필요 항목 (구현 전)

| 항목 | 내용 | 우선순위 |
|------|------|---------|
| 1. staging → main 병합 승인 | flowRoutes.js + flowInventoryService.js + flowConfirmRoutes.js | 선행 필수 |
| 2. Migration 승인 | `dt_flow_bookings.ticket_order_id` + UNIQUE INDEX | 선행 필수 |
| 3. ticket.6117.co.kr NicePay MID 확인 | 독립 MID vs 공유 MID — webhook 인증 설계에 영향 | 필요 |
| 4. TICKET_WEBHOOK_SECRET 설정 | Render 환경변수 추가 | 구현 시 |
| 5. ticket.6117.co.kr PHP 수정 권한 | 결제 승인 후 webhook 호출 코드 추가 주체 | 필요 |

---

## §9 Current Next Action (1개)

**staging 브랜치 → main 병합 + Migration SQL 초안 → Founder 승인 후 `flowTicketRoutes.js` 구현**

**선행 조건 2개가 모두 해소된 후 구현 착수**:
1. FLOW 라우트 staging → main 병합 승인
2. `dt_flow_bookings.ticket_order_id` Migration 승인
