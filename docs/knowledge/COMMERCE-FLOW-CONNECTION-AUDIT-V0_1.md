# Commerce Phase 1 — 주문·예약 연결 지점 감사 Evidence

**Date**: 2026-11-03  
**Status**: AUDIT_COMPLETE — 최소 작업 단위 확정  
**조사 범위**: main + origin/staging/storybook-c7a

---

## §1 현재 흐름 전체 맵

### 티켓사이트 (Wix) → NicePay → 우리 서버

```
고객 Wix 상품 선택
  └→ (미확인) 주문 생성 API 호출 → nicepay_payments INSERT (order_id=Moid, status='PENDING')
  └→ GET /pay?moid=X              → 결제창 HTML 반환
  └→ 고객 결제 완료
  └→ POST /nicepay/return (NicePay 콜백)
       ├→ 서명 검증 + 금액 검증
       ├→ nicepayService.requestApproval() → NicePay 승인 API
       ├→ nicepayService.updatePaymentStatus(Moid, 'PAID')
       ├→ [조건부] _activateYeosuWish()     — yeosu_wishes 연동
       ├→ [조건부] cablecar_checkouts 체크  — 케이블카 패스
       ├→ [조건부] credentialTrigger.issueOnNicepayPaid()
       ├→ [조건부] dtPaymentService.activatePlan() — Day8 Flow 플랜
       ├→ [조건부] dreamtown_flow 체크       — DreamTown 업그레이드
       └→ [조건부] voyages 체크              — Star Voyage
```

**FLOW 호텔 예약 연결: 없음 (GAP)**

---

## §2 주문번호(Moid) 생성 위치

| 항목 | 위치 | 내용 |
|------|------|------|
| 함수 | `services/nicepayService.js:49` | `generateOrderId()` |
| 형식 | `PAY{YYYYMMDD}{HHmmss}{4자리난수}` | 최대 64자 |
| 테이블 | `nicepay_payments` | `order_id` PK |
| 생성 트리거 | `nicepayService.createPayment(amount, goodsName)` | PENDING 상태로 INSERT |

**현재 호텔 패키지용 `createPayment()` 호출 지점 없음** — 신규 엔드포인트 필요

---

## §3 NicePay 승인·실패·취소 처리 위치

| 단계 | 파일 | 라인 | 내용 |
|------|------|------|------|
| 콜백 진입 | `routes/nicepayRoutes.js:164` | `POST /nicepay/return` | NicePay 인증 결과 수신 |
| 인증 실패 | `routes/nicepayRoutes.js:219` | `AuthResultCode !== '0000'` | status='FAILED', Wix 리다이렉트 |
| 금액 불일치 | `routes/nicepayRoutes.js:241` | `payment.amount !== requestedAmount` | status='FAILED' |
| 승인 API 호출 | `routes/nicepayRoutes.js:255` | `nicepayService.requestApproval()` | dc1-api.nicepay.co.kr |
| 승인 성공 | `routes/nicepayRoutes.js:265` | `ResultCode === '0000' \|\| '3001'` | status='PAID', 상태 전이 체인 |
| 승인 실패 | `routes/nicepayRoutes.js:396` | `else` | status='FAILED', Wix 오류 리다이렉트 |
| 취소 처리 | 없음 | — | **미구현** (향후 필요) |

---

## §4 FLOW availability/hold/booking API (staging 브랜치)

### Production DB 상태 (기확인 — memory §주요 SHA 이력)
- `dt_flow_inventory`, `dt_flow_holds`, `dt_flow_bookings`, `dt_flow_confirmations` **APPLIED**
- `dt_accommodations` APPLIED (라마다/케니 seeded)
- 마이그레이션 208~214 APPLIED

### 라우트 (staging/storybook-c7a 브랜치 — main 미병합)

| 엔드포인트 | 파일 | 인증 | 반환 |
|-----------|------|------|------|
| `GET /api/dt/flow/availability` | `routes/flowRoutes.js:18` | 없음 | `{status, available, cutoff_date}` |
| `POST /api/dt/flow/hold` | `routes/flowRoutes.js:55` | JWT (sowon_id) | `{hold_id, expires_at, quantity}` |
| `POST /api/dt/flow/book` | `routes/flowRoutes.js:97` | JWT (sowon_id) | `{booking_id, status}` |
| `DELETE /api/dt/flow/hold/:id` | `routes/flowRoutes.js:140` | JWT (sowon_id) | `{success}` |
| `POST /api/dt/flow/confirm` | `routes/flowConfirmRoutes.js:17` | partner_pin | `{confirmation_id}` |

### 서비스 함수 (staging)

| 함수 | 파일 | 역할 |
|------|------|------|
| `getAvailability(accommodation_id, date, db)` | `services/flowInventoryService.js:27` | 가용성 조회 |
| `createHold(inventory_id, sowon_id, qty, db)` | `services/flowInventoryService.js:~80` | 임시 예약 (SELECT FOR UPDATE) |
| `consumeHold(hold_id, sowon_id, info, db)` | `services/flowInventoryService.js:~150` | hold → booking 전환 |
| `releaseHold(hold_id, sowon_id, db)` | `services/flowInventoryService.js:~200` | hold 해제 |

### 예약 식별자

| 식별자 | 테이블 | 컬럼 |
|--------|--------|------|
| hold_id | `dt_flow_holds` | `id` (UUID) |
| booking_id | `dt_flow_bookings` | `id` (UUID) |
| 연결자 | `dt_flow_bookings` | `hold_id` FK → dt_flow_holds |

---

## §5 연결 갭 (THE MISSING LINK)

### 현재 상태

```
nicepay_payments.order_id (Moid)
         ↕ 연결 없음
dt_flow_holds.id (hold_id)
         ↕
dt_flow_bookings.id (booking_id)
```

`nicepayRoutes.js POST /nicepay/return` 승인 성공 후 FLOW hold를 booking으로 전환하는 코드 없음.

### 연결 방법 (최소 변경 Option A)

**`nicepay_payments` 테이블에 `flow_hold_id` 컬럼 추가**:

```sql
ALTER TABLE nicepay_payments
  ADD COLUMN IF NOT EXISTS flow_hold_id UUID;
```

**결제 전**: hold 생성 → `nicepayService.createPayment()` 호출 시 `flow_hold_id` 함께 저장  
**결제 후**: `POST /nicepay/return` 승인 성공 → `flow_hold_id`로 `consumeHold()` 호출 → `dt_flow_bookings` 생성

---

## §6 전체 연결 흐름 (수정 후 목표)

```
1. 고객 Wix 날짜 선택
2. 가용성 확인: GET /api/dt/flow/availability?accommodation_id=X&date=Y
3. Hold 생성:   POST /api/dt/flow/hold { inventory_id } → hold_id (30분 TTL)
4. 주문 생성:   POST /api/dt/checkout/hotel {hold_id, accommodation_id, date, amount}
                → nicepay_payments INSERT (flow_hold_id = hold_id)
                → moid 반환
5. 결제창:      GET /pay?moid=M
6. 결제 완료:   POST /nicepay/return
                → 승인 성공
                → nicepayService.updatePaymentStatus(Moid, 'PAID')
                → [신규] consumeHold(flow_hold_id, sowon_id) → dt_flow_bookings 생성
                → successUrl 리다이렉트
```

---

## §7 중복 예약·결제 실패 방지

| 위협 | 방지 방법 |
|------|----------|
| 이중 콜백 | `routes/nicepayRoutes.js:212` 멱등성 체크 (status='PAID' 이미 처리됨 확인) |
| 재고 동시 경쟁 | `flowInventoryService.createHold()` — `SELECT FOR UPDATE` 트랜잭션 |
| Hold 만료 | `dt_flow_holds.expires_at` = 30분 TTL, `consumeHold`에서 EXPIRED 체크 |
| 결제 금액 불일치 | `routes/nicepayRoutes.js:241` 금액 검증 |
| Hold 미소유 | `consumeHold()` sowon_id 검증 (HOLD_OWNERSHIP_MISMATCH) |

---

## §8 필요한 최소 변경 파일

| 파일 | 분류 | 내용 |
|------|------|------|
| `database/migrations/NNN_nicepay_flow_link.sql` | 신규 | `nicepay_payments.flow_hold_id UUID` 추가 |
| `routes/nicepayRoutes.js` | EXTEND | 승인 성공 후 consumeHold() 호출 블록 추가 |
| `routes/flowRoutes.js` | NEW (staging → main) | availability/hold/book 엔드포인트 |
| `services/flowInventoryService.js` | NEW (staging → main) | FLOW 서비스 |
| `routes/[신규]hotelCheckoutRoutes.js` | NEW | 호텔 패키지 주문 생성 (hold_id → moid) |

---

## §9 Staging 검증 방법

staging/storybook-c7a 브랜치에서:
```
1. GET /api/dt/flow/availability?accommodation_id={ramada_id}&date=2026-11-10
   → available > 0 확인
2. POST /api/dt/flow/hold { inventory_id } (JWT 필요)
   → hold_id 수령
3. POST /api/dt/checkout/hotel { hold_id, amount } [신규]
   → moid 수령
4. GET /pay?moid=M
   → 결제창 표시 확인 (실결제 금지)
5. 승인 성공 시뮬레이션: consumeHold() 단위 테스트
   → dt_flow_bookings 레코드 생성 확인
```

---

## §10 최소 작업 단위 1개 (Current Next Action)

**Migration: `nicepay_payments.flow_hold_id` 컬럼 추가**
- 파일: `database/migrations/NNN_nicepay_flow_link.sql`
- 내용: `ALTER TABLE nicepay_payments ADD COLUMN IF NOT EXISTS flow_hold_id UUID;`
- 영향: 기존 컬럼 NULL 허용 → 기존 결제 데이터 무변경
- 선행 조건: Founder 승인 (DB Schema 변경)

이후: `flowRoutes.js` + `flowInventoryService.js` staging → main 병합 + `nicepayRoutes.js` consumeHold() 호출 추가

---

## §11 제약 준수 확인

| 제약 | 상태 |
|------|------|
| 기존 276건 주문·결제 데이터 보존 | ✅ ADD COLUMN NULL 허용 |
| 실결제 진행 금지 | ✅ 조사 전용 |
| Production DB Schema 변경 별도 승인 | ✅ 확인 요청 예정 |
| 새 예약엔진 설계 금지 | ✅ 기존 FLOW 재사용 |
| NicePay 기존 흐름 변경 금지 | ✅ EXTEND 방식 (조건부 블록 추가) |
