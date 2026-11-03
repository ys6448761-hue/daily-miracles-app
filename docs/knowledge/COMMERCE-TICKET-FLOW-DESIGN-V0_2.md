# Commerce Phase 1 — ticket.6117.co.kr ↔ FLOW 최소 연동 설계 V0.2

**Date**: 2026-11-03  
**Status**: DESIGN_COMPLETE (V0.2 보완 — Founder 7개 항목 반영)  
**기준**: DECISION_COMMERCE_CHANNEL_V0_1  
**이전 버전**: COMMERCE-TICKET-FLOW-DESIGN-V0_1.md (원자 Hold+Book 방식 → 폐기)  
**제약**: Production DB·결제·상품·예약 변경 없음 (설계 전용)

---

## §0 핵심 변경 (V0.1 → V0.2)

| 항목 | V0.1 (폐기) | V0.2 (확정) |
|------|------------|------------|
| Hold+Book 타이밍 | 결제 후 원자 처리 | **결제 전 Hold → 결제 후 Book (2단계)** |
| 인증 | X-Ticket-Secret (단순 비교) | X-Ticket-Secret + hold_id 소유 검증 |
| Booking 실패 처리 | 미정 | 운영자 SMS 알림 + 수동 NicePay 취소 |
| ticket_order_id UNIQUE | 단순 UNIQUE | 패키지 구조 검증 후 확정 (§5 참조) |
| Hold TTL 충돌 | 미정 | TTL 연장 전략 + cutoff_date 분리 (§7) |

---

## §1 확정 2단계 연동 흐름

```
[ticket.6117.co.kr — PHP]                     [daily-miracles-mvp — Express]

Step 1 (결제 전):
  GET 가용성 확인 ─────────────────────────────→ GET /api/dt/flow/ticket-availability
                  ← { available, cutoff_date } ─┘

  POST Hold 생성 ──────────────────────────────→ POST /api/dt/flow/ticket-hold
                  ← { hold_id, expires_at } ────┘

  ticket PHP: hold_id 저장 → NicePay 결제창 표시

Step 2 (결제 승인 후):
  POST Book 전환 ──────────────────────────────→ POST /api/dt/flow/ticket-book
  { hold_id, ticket_order_id, ... }              ↓
                                          consumeHold() → dt_flow_bookings
                  ← { booking_id, status } ─────┘

Step 3 (체크인 당일):
  [파트너 PIN 확인] ────────────────────────────→ POST /api/dt/flow/confirm
  { booking_id, partner_code, partner_pin }       ↓
                  ← { confirmation_id } ─────────┘ dt_flow_confirmations
```

---

## §2 Q1 — ticket PHP 실제 호출 위치

### ticket.6117.co.kr PHP 결제 흐름 (추정 구조)

```php
// ticket.6117.co.kr — PHP NicePay 콜백 처리 (추정)
// File: /nicepay/callback.php 또는 /order/complete.php

// NicePay 승인 콜백 수신
$resultCode = $_POST['ResultCode'];
$tid        = $_POST['Tid'];
$moid       = $_POST['Moid'];  // ticket 주문번호

if ($resultCode === '0000') {
    // 우리 FLOW 서버 호출 → Step 2 (Book 전환)
    $response = curl_post('https://app.dailymiracles.kr/api/dt/flow/ticket-book', [
        'hold_id'         => $_SESSION['flow_hold_id'],   // Step 1에서 저장
        'ticket_order_id' => $moid,
        'customer_name'   => $customerName,
        'phone'           => $customerPhone,
        'nicepay_tid'     => $tid,
        'nicepay_amount'  => $_POST['Amt'],
    ], ['X-Ticket-Secret: ' . TICKET_SECRET]);
}
```

**Step 1 호출 위치** (결제창 진입 직전):
```php
// 상품 선택 → Hold 생성 → 결제창 표시
$response = curl_post('.../api/dt/flow/ticket-hold', [...]);
$_SESSION['flow_hold_id'] = $response['hold_id'];
// → NicePay 결제창 표시
```

**코드베이스에 ticket PHP 코드 없음** — 위 구조는 PHP 표준 NicePay 패턴 기준 추정.  
ticket.6117.co.kr PHP 수정 주체: Founder (또는 PHP 담당자).

---

## §3 Q2 — 서버 간 인증

### 인증 방식: TICKET_WEBHOOK_SECRET (Shared Secret)

```
Header: X-Ticket-Secret: <TICKET_WEBHOOK_SECRET>
```

HMAC 미적용 이유: ticket.6117.co.kr PHP가 HMAC 서명을 지원하는지 미확인. 단순 고정 시크릿이 더 안전하게 구현 가능.

### 추가 검증: hold_id 소유권

`POST /api/dt/flow/ticket-book` 수신 시:
- `consumeHold(hold_id, TICKET_SYSTEM_SOWON_ID, ...)` 내부에서 sowon_id 검증
- hold가 TICKET_SYSTEM_SOWON_ID 소유가 아니면 `HOLD_OWNERSHIP_MISMATCH` 반환

`TICKET_SYSTEM_SOWON_ID` = 고정 UUID (환경변수 `FLOW_TICKET_SOWON_ID`).  
Hold 생성 시 이 UUID로 생성 → Book 전환 시 동일 UUID 검증.

### 환경변수 목록 (신규)

| 변수 | 내용 |
|------|------|
| `TICKET_WEBHOOK_SECRET` | ticket PHP ↔ 우리 서버 공유 시크릿 |
| `FLOW_TICKET_SOWON_ID` | ticket Hold 전용 시스템 UUID |

---

## §4 Q3 — Hold → Booking 최소 변경 범위

### 신규 파일 1개: `routes/flowTicketRoutes.js`

**엔드포인트 3개**:

```
GET  /api/dt/flow/ticket-availability   — 가용성 조회 (인증 없음)
POST /api/dt/flow/ticket-hold           — Hold 생성 (X-Ticket-Secret 필수)
POST /api/dt/flow/ticket-book           — Hold → Booking 전환 (X-Ticket-Secret 필수)
```

**내부 구현 (기존 코드 재사용)**:

```javascript
// ticket-hold
const result = await flowService.createHold(
  inventory_id,
  process.env.FLOW_TICKET_SOWON_ID,  // 고정 시스템 UUID
  quantity || 1,
  db
);
// 반환: { hold_id, expires_at, available_after_hold }

// ticket-book
const result = await flowService.consumeHold(
  hold_id,
  process.env.FLOW_TICKET_SOWON_ID,  // 소유권 검증
  { customer_name, phone },
  db
);
// DB: dt_flow_bookings.ticket_order_id = ticket_order_id 함께 저장
```

**변경 파일 전체 목록**:

| 파일 | 분류 | 내용 |
|------|------|------|
| `routes/flowTicketRoutes.js` | **NEW** | 가용성·Hold·Book 3개 엔드포인트 |
| `database/migrations/NNN_flow_ticket_order_id.sql` | **NEW** | ticket_order_id 컬럼 + UNIQUE INDEX |
| `server.js` | **EXTEND** | flowTicketRoutes 마운트 1행 |
| `routes/flowRoutes.js` (staging→main) | **CONNECT** | 기존 Hold/Book 엔드포인트 병합 |
| `services/flowInventoryService.js` (staging→main) | **CONNECT** | 핵심 서비스 병합 |
| `routes/flowConfirmRoutes.js` (staging→main) | **CONNECT** | 파트너 PIN 확인 병합 |

**변경하지 않는 파일**:
- `services/flowInventoryService.js` — createHold/consumeHold 코드 변경 없음
- `routes/nicepayRoutes.js` — Wix 경로 보존
- `services/nicepayService.js` — 변경 없음

---

## §5 Q4 — ticket_order_id UNIQUE 검증 (복수 객실·패키지 적합성)

### MVP 패키지 구조 분석

```
낭만야경 1박 2일 패키지:
  ├─ 라마다 호텔 1룸 1박   → dt_flow_bookings (FLOW 관리)
  └─ 케이블카 이용권        → cablecar_checkouts (기존 테이블, FLOW 무관)
```

**FLOW가 관리하는 것**: 호텔 객실만 (케이블카, 크루즈 등 레저 제외)

**1 ticket_order : 1 FLOW booking 관계 성립 조건**:
- 패키지 당 호텔 1개 숙박만 포함 (MVP 기준)
- 동일 날짜 동일 호텔 복수 룸 → `quantity >= 2`로 dt_flow_bookings 1행에서 처리

**UNIQUE INDEX 확정**:
```sql
ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ticket_paid_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_flow_bookings_ticket_order
  ON dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;
```

**향후 확장 (MVP 이후)**:
- 동일 order_id에 다른 날짜 다른 룸 → `ticket_order_id + line_no` 복합 키로 변경
- 현재는 1박 패키지이므로 단일 UNIQUE 안전

---

## §6 Q5 — Booking 실패 시 NicePay 취소·운영자 알림

### NicePay 취소 API 존재 여부

`services/nicepayService.js` 검색 결과: **취소 함수 없음** (cancel/refund 0건).

### MVP 처리 전략: 운영자 알림 + 수동 취소

Booking 실패(consumeHold 오류) 발생 시:

```
1. flowTicketRoutes.js에서 오류 감지
2. messageProvider.sendRedAlertMessage() 패턴으로 운영자 SMS 발송
   - 기존 ADMIN_PHONE (process.env.ADMIN_PHONE) 재사용
   - 메시지: "[긴급] FLOW Booking 실패 — ticket_order_id: TK-XXX, NicePay TID: XXX, 수동 취소 필요"
3. HTTP 500 반환 → ticket PHP에서 오류 표시
4. 운영자가 NicePay 관리자 콘솔에서 수동 취소
```

**이유**: ticket.6117.co.kr가 독립 NicePay MID를 사용할 경우 우리가 취소 API를 호출할 수 없음. MID 확인 후 Phase 2에서 자동 취소 추가.

### 운영자 알림 템플릿 (신규)

```javascript
// flowTicketRoutes.js 내부
async function alertBookingFailure(ticket_order_id, nicepay_tid, reason) {
  const adminPhone = process.env.ADMIN_PHONE || '18996117';
  const msg = `[FLOW오류] 예약실패\n주문:${ticket_order_id}\nTID:${nicepay_tid}\n원인:${reason}\n→NicePay콘솔수동취소필요`;
  // messageProvider 경유 (SENS SMS)
  await messageProvider.sendSMSViaMessageProvider(adminPhone, msg);
}
```

---

## §7 Q7 — Hold TTL vs 결제 지연 vs 체크인 D-2 재고 반환 충돌 방지

### 현재 TTL 구조

```javascript
// flowInventoryService.js:17
const HOLD_TTL_MINUTES = parseInt(process.env.FLOW_HOLD_TTL_MINUTES, 10) || 30;
```

TTL은 환경변수로 조정 가능. 코드 변경 없이 Render 대시보드에서 수정 가능.

### 결제 지연 충돌 방지 전략

| 문제 | 해결 |
|------|------|
| 결제창에서 30분 초과 | ticket PHP가 expires_at을 카운트다운으로 표시 → 만료 전 재Hold 안내 |
| Hold 만료 → consumeHold 실패 | `HOLD_EXPIRED` 오류 반환 → ticket PHP에서 "재시도" 안내 |
| Hold 만료 + 재고 없음 | `HOLD_EXPIRED` + 재시도 시 `INSUFFICIENT_AVAILABILITY` → 매진 안내 |
| FLOW_HOLD_TTL_MINUTES 값 | 결제창 평균 완료 시간 + 여유 = 15~20분 권장 (현재 30분 충분) |

**Render 환경변수 권장값**: `FLOW_HOLD_TTL_MINUTES=45` (결제 지연 여유 포함)

### 체크인 D-2 재고 반환 (cutoff_date)

`dt_flow_inventory.cutoff_date` 필드 존재 (Migration 208):
- 관리자가 `cutoff_date = check_in_date - 2`로 설정
- `createHold()` 내부에서 CUTOFF_PASSED 자동 반환 → Hold 생성 차단
- Hold TTL과 별개 — 코드 변경 없음

**충돌 없음**: cutoff_date 지난 날짜는 Hold 자체가 불가. TTL 만료와 독립적.

---

## §8 Q6 — FLOW Booking vs 호텔 실 예약 확정 상태 구분

| 상태 | 테이블 | 의미 |
|------|--------|------|
| `dt_flow_bookings.status = 'confirmed'` | dt_flow_bookings | **우리 내부 예약 확정** — 결제 후 Hold 전환 완료 |
| `dt_flow_confirmations` 레코드 존재 | dt_flow_confirmations | **호텔 실 인정 예약** — 파트너 PIN 확인 완료 (체크인 당일) |

두 상태는 **코드에 이미 분리**되어 있음 (변경 불필요).

Phoenix 운영 대시보드에서:
```
booking 확인: dt_flow_bookings WHERE ticket_order_id = ?
투숙 확정 확인: dt_flow_confirmations WHERE booking_id = ?
```

---

## §9 전체 연동 흐름 (확정)

```
[ticket.6117.co.kr — PHP]

1. 고객 패키지 선택
2. GET /api/dt/flow/ticket-availability?accommodation_id=X&date=Y
   ← { available: 2, cutoff_date: "2026-11-18" }
   [재고 없으면 → 매진 표시]

3. POST /api/dt/flow/ticket-hold { accommodation_id, stay_date, quantity: 1 }
   Header: X-Ticket-Secret: <secret>
   ← { hold_id: "uuid", expires_at: "2026-11-03T12:45:00Z" }
   PHP: $_SESSION['flow_hold_id'] = hold_id;

4. NicePay 결제창 표시 + expires_at 카운트다운

5. NicePay 승인 콜백 수신 (PHP)
   ResultCode = '0000' → Step 6
   ResultCode != '0000' → Hold TTL 만료 대기 (재고 자동 복구)

6. POST /api/dt/flow/ticket-book
   Header: X-Ticket-Secret: <secret>
   Body: { hold_id, ticket_order_id, customer_name, phone, nicepay_tid, nicepay_amount }
   ← { booking_id, status: "confirmed" }
   [실패 시 → 운영자 SMS 알림 + 수동 NicePay 취소]

7. 체크인 당일:
   POST /api/dt/flow/confirm { booking_id, partner_code, partner_pin }
   ← { confirmation_id }
```

---

## §10 Migration SQL 초안

```sql
-- database/migrations/NNN_flow_ticket_order_id.sql
-- 목적: ticket.6117.co.kr 주문번호를 FLOW booking에 연결
-- 영향: 기존 dt_flow_bookings 레코드 — ticket_order_id NULL 허용, 무변경
-- 검증: MVP = 1 ticket_order : 1 FLOW booking (패키지 당 호텔 1박 1상품)

ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ticket_paid_at  TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS uq_flow_bookings_ticket_order
  ON dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;

COMMENT ON COLUMN dt_flow_bookings.ticket_order_id
  IS 'ticket.6117.co.kr 주문번호. NULL = DreamTown 내부 예약. UNIQUE 보장 (중복 콜백 방어).';

COMMENT ON COLUMN dt_flow_bookings.ticket_paid_at
  IS 'ticket.6117.co.kr NicePay 승인 완료 시각. 우리 NicePay 결제와 독립.';
```

---

## §11 Staging 검증 계획 (실결제·실예약 금지)

```bash
# 1. 가용성 조회
GET /api/dt/flow/ticket-availability?accommodation_id={id}&date=2026-11-20
→ { available: N } 확인

# 2. Hold 생성
POST /api/dt/flow/ticket-hold
  X-Ticket-Secret: test-secret
  { accommodation_id, stay_date: "2026-11-20", quantity: 1 }
→ { hold_id: "uuid", expires_at: "..." } 확인

# 3. Book 전환
POST /api/dt/flow/ticket-book
  X-Ticket-Secret: test-secret
  { hold_id, ticket_order_id: "TK-TEST-001", customer_name: "테스트", phone: "010-0000-0000", nicepay_tid: "TEST-TID", nicepay_amount: 70000 }
→ { booking_id, status: "confirmed" } 확인

# 4. 중복 콜백 방어 (멱등성)
동일 ticket_order_id 재호출
→ { error: "ALREADY_BOOKED", booking_id } 확인

# 5. Booking 실패 시 운영자 알림
consumeHold 실패 시뮬레이션 (HOLD_EXPIRED)
→ 운영자 SMS 수신 확인

# 6. 파트너 PIN 확인 연결
POST /api/dt/flow/confirm { booking_id, partner_code: "RAMADA", partner_pin: "****" }
→ { confirmation_id } 확인

# 7. 재고 복구 확인 (Hold TTL 만료)
Hold 생성 후 Book 없이 TTL 만료 대기
GET ticket-availability → available 동일 수 반환 확인
```

---

## §12 Founder 승인 필요 항목

| 항목 | 내용 | 선행 여부 |
|------|------|---------|
| 1. staging → main 병합 | flowRoutes.js + flowInventoryService.js + flowConfirmRoutes.js | **선행 필수** |
| 2. Migration 승인 | `dt_flow_bookings.ticket_order_id` + ticket_paid_at + UNIQUE INDEX | **선행 필수** |
| 3. TICKET_WEBHOOK_SECRET 설정 | Render 환경변수 추가 | 구현 직전 |
| 4. FLOW_TICKET_SOWON_ID 설정 | 시스템 UUID 생성 + Render 환경변수 | 구현 직전 |
| 5. FLOW_HOLD_TTL_MINUTES 조정 | 30 → 45 (결제 지연 여유) 권장 | 구현 직전 |
| 6. ticket PHP 수정 권한 | Hold → 결제 → Book 호출 코드 추가 주체 확인 | 구현 전 |
| 7. NicePay MID 공유 여부 | ticket.6117.co.kr 전용 MID vs 공유 MID (취소 권한에 영향) | 확인 필요 |

---

## §13 Current Next Action (1개)

**staging → main PR 생성** (flowRoutes.js + flowInventoryService.js + flowConfirmRoutes.js)  
→ Founder 실제 병합 승인 후 Migration SQL + flowTicketRoutes.js 구현 착수

Evidence: 이 파일  
Decision: `docs/decisions/DECISION_COMMERCE_CHANNEL_V0_1.md`
