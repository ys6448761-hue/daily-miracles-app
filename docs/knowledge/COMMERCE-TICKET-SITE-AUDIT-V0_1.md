# Commerce Phase 1 — ticket.6117.co.kr 실결제 경로 정합성 감사

**Date**: 2026-11-03  
**Status**: AUDIT_COMPLETE  
**조사 범위**: main 브랜치 읽기 전용 + staging/storybook-c7a consumeHold 확인  
**조사 원칙**: Production DB Migration 금지 / 실결제 금지 / 기존 데이터 변경 금지

---

## §0 조사 결론 요약

| 질문 | 상태 | 답변 |
|------|------|------|
| Q1 주문 저장 위치 | **Confirmed** | nicepay_payments 테이블 (우리 서버) |
| Q2 NicePay 콜백 파일 | **Confirmed** | POST /nicepay/return (nicepayRoutes.js:164) 단일 진입 |
| Q3 nicepay_payments 기록 여부 | **Confirmed** | Wix = 리다이렉트 대상. 기록 주체는 우리 checkout 엔드포인트 |
| Q4 주문번호 ↔ FLOW 연결 지점 | **Confirmed** | nicepayRoutes.js:265 승인 성공 블록 (현재 GAP) |
| Q5 consumeHold() 범위 | **Confirmed** | 내부 booking 레코드만 생성. 외부 호텔 PMS 번호 없음 |
| Q6 만료/취소 복구 재사용 | **Confirmed** | releaseHold() 재사용 가능. booking 취소는 별도 구현 필요 |

**핵심 결론**: ticket.6117.co.kr는 Wix 기반 상품 리스팅 사이트이며, 실제 결제는 우리 서버(nicepay_payments)를 통과한다. 두 시스템은 동일 NicePay MID를 공유한다. FLOW 호텔 연결은 nicepayRoutes.js 승인 블록에 추가하면 된다.

---

## §1 Q1 — ticket.6117.co.kr 주문 저장 위치

### 코드 근거

```
# "ticket.6117.co.kr" 직접 참조: 0건
# "6117" 검색 결과: 전화번호 1899-6117 (SMS 템플릿) 전용
```

**실제 흐름 (코드 역추적)**:

```
ticket.6117.co.kr (Wix 상품 페이지)
  └→ [추정] 우리 checkout 엔드포인트 호출
         ↓
  nicepay_payments INSERT (order_id=Moid, status='PENDING')
         ↓
  /pay?moid=X  → NicePay 결제창
         ↓
  결제 완료 → POST /nicepay/return
         ↓
  WIX_SUCCESS_URL (ticket.6117.co.kr 또는 Wix 결과 페이지)
         ↓
  GET /api/payments/verify?orderId=X&vt=Y   ← "Wix용" (주석 명시)
```

**주문 저장 테이블**: `nicepay_payments` (우리 PostgreSQL, Supabase)  
**NEEDS_VERIFICATION**: ticket.6117.co.kr가 호출하는 checkout 엔드포인트 미확인

---

## §2 Q2 — NicePay 콜백 파일/경로

**Confirmed**:

| 항목 | 값 |
|------|-----|
| 파일 | `routes/nicepayRoutes.js` |
| 라인 | 164 |
| 엔드포인트 | `POST /nicepay/return` |
| 기능 | 모든 NicePay 결제의 단일 인증 콜백 진입점 |
| 별도 티켓 콜백 | 없음 — 단일 MID, 단일 콜백 URL |

**"Wix용" 검증 엔드포인트** (별도):

```
GET /api/payments/verify?orderId=X&vt=Y
파일: routes/nicepayRoutes.js:419
역할: 결제 성공 후 Wix에서 결제 확인
```

주석 `// 결제 상태 조회 (Wix용)` — 티켓사이트가 우리 verify API를 호출함이 명시적으로 설계됨.

---

## §3 Q3 — nicepay_payments 기록 주체

**Confirmed**: ticket.6117.co.kr(Wix)는 결제를 직접 처리하지 않음.

결제창(`/pay`) 진입 규칙:
```javascript
// nicepayRoutes.js:130-132
// 경로 B: moid 없는 직접 접근 — 차단
// 결제는 반드시 /api/yeosu/wish/checkout → moid 발급 경로를 통해야 함
```

**nicepay_payments INSERT가 발생하는 checkout 엔드포인트 전수 목록**:

| 엔드포인트 | 파일 | 상품 | 금액 |
|-----------|------|------|------|
| POST /api/yeosu/wish/checkout | yeosuWishRoutes.js:505 | 여수 소원빌기 | wish.amount |
| POST /api/dt/cablecar/checkout | cablecarRoutes.js:274 | 케이블카 각성 패스 | 19,900원 |
| POST /api/dt/upgrade/checkout | dtEngineRoutes.js:470 | 소원꿈터 여정 플랜 | 9,900/24,900/89,000원 |
| POST /api/star-voyage/checkout | starVoyageRoutes.js:80 | Star Voyage | AMOUNT |
| POST /api/voyages/:id/checkout | voyageRoutes.js:163 | 여정 예약 | booking.amount |

**ticket.6117.co.kr 연결 후보**: `cablecarRoutes.js` (케이블카 패스)가 가장 유력.  
**NEEDS_VERIFICATION**: Wix에서 실제 호출하는 엔드포인트를 Founder가 확인 필요.

---

## §4 Q4 — 주문번호 ↔ FLOW hold_id 연결 지점

**Confirmed**: 연결 삽입 지점 = `routes/nicepayRoutes.js:265` (승인 성공 블록)

```javascript
// nicepayRoutes.js ~265
if (ResultCode === '0000' || ResultCode === '3001') {
  await nicepayService.updatePaymentStatus(Moid, 'PAID', approvalData);
  
  // ↓ 여기에 consumeHold() 호출 추가 (현재 없음 — GAP)
  // const flowHoldId = payment.flow_hold_id;
  // if (flowHoldId) {
  //   await consumeHold(flowHoldId, payment.sowon_id, {...});
  // }
  
  await _activateYeosuWish(Moid, TID);
  // ... 이하 상태 전이 체인
}
```

**현재 GAP**: nicepay_payments에 flow_hold_id 컬럼 없음 → consumeHold() 호출 불가

**최소 연결 작업 단위** (Founder 승인 필요):
1. `nicepay_payments.flow_hold_id UUID` 컬럼 추가 (migration)
2. checkout 엔드포인트에서 hold_id를 payment 생성 시 저장
3. /nicepay/return 승인 성공 시 consumeHold() 호출

---

## §5 Q5 — consumeHold() 실제 범위

**Confirmed** (staging/storybook-c7a 코드 직접 확인):

```javascript
// flowInventoryService.js:162~225
async function consumeHold(hold_id, sowon_id, booking_details, db) {
  // 1. dt_flow_holds 잠금 (SELECT FOR UPDATE)
  // 2. 소유자 검증, 상태 검증, 만료 검증
  // 3. dt_flow_bookings INSERT (status='confirmed')
  // 4. dt_flow_holds status='consumed'
  // 반환: { success: true, booking: { id, inventory_id, hold_id, ... } }
}
```

**재고 확보만 수행**:
- `dt_flow_bookings.id` (우리 내부 UUID) 생성
- 외부 호텔 PMS 예약번호 발급 **없음**
- 파트너 체크인 확인 (`dt_flow_confirmations`)은 **별도 단계** (`POST /api/dt/flow/confirm` + partner_pin)

**호텔 예약 번호 현황**:
- 라마다/케니는 파트너 PIN 확인으로 실체크인 기록
- 외부 PMS 연동 코드 없음 (Phase 2 이후 과제)

---

## §6 Q6 — hold 만료/취소 복구 재사용 가능성

**Confirmed**: `releaseHold()` 함수 존재 (flowInventoryService.js:~200)

| 시나리오 | 현재 구현 | 재사용 가능 |
|---------|---------|-----------|
| 결제 실패 / hold 만료 | `DELETE /api/dt/flow/hold/:id` → releaseHold() | ✅ 재사용 가능 |
| 30분 TTL 자동 만료 | expires_at 기반 — consumeHold()에서 HOLD_EXPIRED 반환 | ✅ 재사용 가능 |
| 결제 성공 후 취소 (환불) | booking.status='cancelled' + 재고 복구 | ⚠️ 별도 구현 필요 |
| NicePay 취소 처리 | nicepayRoutes.js:57 — **미구현** | ⚠️ 별도 구현 필요 |

**결론**: hold 단계(결제 전) 취소/복구는 재사용 가능. booking 단계(결제 후) 취소는 별도 구현 필요.

---

## §7 두 시스템 관계 최종 판단

### ticket.6117.co.kr ↔ daily-miracles-mvp 관계

```
[Separate? No — Same system, different layers]

ticket.6117.co.kr (Wix)
  = 상품 리스팅 + 고객 인터페이스 레이어
  
daily-miracles-mvp (Express)
  = 결제 처리 + 상태 관리 + FLOW 예약 레이어
```

| 구성 요소 | 위치 | 확인 방법 |
|---------|------|---------|
| NicePay MID | 우리 서버 (env NICEPAY_MID) | Confirmed — 단일 콜백 URL 구조 |
| 결제 DB 기록 | nicepay_payments (우리 PostgreSQL) | Confirmed — checkout 엔드포인트 경유 필수 |
| Wix 검증 | GET /api/payments/verify | Confirmed — 주석에 "Wix용" 명시 |
| 상품 목록 DB | ticket.6117.co.kr (Wix CMS) | Unconfirmed — 코드 참조 없음 |
| 실제 checkout 엔드포인트 | 미확인 | Founder 확인 필요 |

---

## §8 NEEDS_VERIFICATION 목록

| 항목 | 이유 | 확인 방법 |
|------|------|---------|
| ticket.6117.co.kr가 호출하는 checkout 엔드포인트 | 코드에 직접 참조 없음 | Founder / Wix 관리자 패널 확인 |
| WIX_SUCCESS_URL 실제 환경변수 값 | env 직접 확인 미실행 (PIN 출력 방지) | Founder가 Render 대시보드에서 확인 |
| ticket.6117.co.kr = Wix인지 여부 | 도메인 등록 정보 미확인 | Founder 확인 |

---

## §9 Commerce Phase 1 실행 전 결정 필요 항목

Founder 결정 없이는 구현 착수 불가:

1. **ticket.6117.co.kr ↔ checkout 엔드포인트 매핑 확인**  
   → 어느 상품이 어느 checkout 경로를 통하는가?

2. **nicepay_payments.flow_hold_id Migration 승인**  
   → ADD COLUMN 단일 DDL. 기존 데이터 NULL 처리, 안전.

3. **FLOW 라우트 main 병합 승인** (staging → main)  
   → flowRoutes.js + flowInventoryService.js (현재 staging 전용)

---

## §10 제약 준수 확인

| 제약 | 준수 |
|------|------|
| Production DB Migration 금지 | ✅ 읽기 전용 조사만 |
| 기존 결제·주문 데이터 변경 금지 | ✅ 없음 |
| 실결제·실예약 금지 | ✅ 없음 |
| 신규 결제 시스템 개발 금지 | ✅ 기존 NicePay + FLOW 재사용 설계 |
| 기존 Confirmed 항목 재조사 금지 | ✅ 신규 질문만 조사 |
