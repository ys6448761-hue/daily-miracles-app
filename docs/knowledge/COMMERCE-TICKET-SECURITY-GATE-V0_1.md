# PHX-COMMERCE-TICKET-002 — Security Gate Report

**Task ID:** PHX-COMMERCE-TICKET-002  
**Date:** 2026-11-03  
**Target:** PR #143 (`feat/commerce-ticket-flow-v02` → `main`)  
**Reviewer:** Claude Code (Code Master)  
**Final Status:** **MERGE READY** (수정 사항 반영 완료)

---

## §1 보안 검토 범위

| 항목 | 검토 대상 |
|------|----------|
| 결제 승인 검증 | NicePay 승인 진위 확인 방법 |
| 서버 간 인증 | HMAC-SHA256, nonce, timestamp |
| 트랜잭션 원자성 | consumeHold INSERT + UNIQUE 처리 |
| 실패 복구 | ops SMS, 로그, 중복 예약 방지 |
| 테스트 커버리지 | 위변조/중복/실패/알림 시나리오 |

---

## §2 결제 승인 검증 분석

### 2-1. 현황

ticket.6117.co.kr PHP 서버는 별도 NicePay 가맹점(MID)을 사용한다.  
이 Node.js 서버의 `nicepay_payments` 테이블은 해당 가맹점의 거래를 포함하지 않는다.  
따라서 **PHP 측 NicePay 승인 진위를 이 서버에서 독립적으로 검증하는 것은 현재 불가능**하다.

PHP 소스코드 접근 권한이 없어 승인 처리 위치를 직접 확인하지 못했다.

### 2-2. MVP 신뢰 계약 (Trust Contract)

```
ticket.6117.co.kr PHP가 ticket-book을 호출 =
  (a) FLOW_TICKET_SECRET을 소지한 서버만 호출 가능
  (b) 해당 서버에서 NicePay 승인이 성공했다는 주장
  (c) 위조 시도는 Secret 없이는 불가능
```

**신뢰 근거:**
- HMAC-SHA256 서명 — Secret 없이는 서명 위조 불가
- Secret은 PHP 서버와 이 서버만 공유 (외부 노출 금지)
- PHP 서버 코드가 결제 성공 시에만 ticket-book을 호출한다는 운영 계약

**한계:**
- PHP 서버 자체가 버그로 미승인 결제 후 ticket-book을 호출할 경우 차단 불가
- NicePay 승인 번호/거래 ID를 이 서버에서 검증하지 않음

### 2-3. PHP 담당자 확인 필요 항목 (운영 전 필수)

```
[ ] NicePay 결제 승인 처리 위치 확인
    → ticket.6117.co.kr의 NicePay 콜백 수신 위치
    → 승인 성공 판정 로직 (결제 상태 코드 확인)

[ ] ticket-book 호출 조건 명확화
    → NicePay 최종 승인(resultCode == '3001') 후에만 ticket-book POST 호출
    → 승인 실패 / 사용자 취소 시 ticket-book을 호출하지 않음을 보장

[ ] ticket_order_id 유일성 보장
    → PHP 측 주문번호가 재사용되지 않음을 확인
    → 취소 후 재결제 시 신규 주문번호 발급 확인

[ ] ticket_paid_at 형식
    → ISO 8601 UTC (예: "2026-11-03T10:00:00.000Z") 사용 확인

[ ] FLOW_TICKET_SECRET 관리 규칙
    → 최소 32자 무작위 문자열
    → PHP 서버 설정 파일에만 저장, 로그 출력 금지
    → Secret 교체 절차 합의 (60일 주기 권장)

[ ] HMAC 서명 구현 — PHP 측 canonical string 형식 일치 확인
    → "${timestamp}\n${nonce}\nPOST\n/ticket-book\nfield1=val1&field2=val2"
    → body 필드 ASCII 사전순 정렬
    → 값은 URL 인코딩 없이 그대로 사용 (MVP 제약 — 특수문자 미포함 필드 전용)
```

### 2-4. 향후 강화 방안 (운영 후 검토)

- PHP → FLOW: `nicepay_tid` (거래번호), `nicepay_amt` (금액), `nicepay_mid` (MID) 추가 전달
- FLOW에서 NicePay 검증 API 직접 호출 (MID 계약 필요)
- 주문 금액 ↔ 재고 수량 × 단가 대응 검증

---

## §3 서버 간 보안 검증 결과

| 항목 | 상태 | 비고 |
|------|------|------|
| HMAC-SHA256 서명 | ✅ PASS | `crypto.timingSafeEqual` 사용 |
| Secret 미설정 시 차단 | ✅ PASS | 503 SERVER_CONFIG_ERROR |
| Timestamp ±5분 검증 | ✅ PASS | 10분 전 요청 TIMESTAMP_EXPIRED |
| Nonce 재전송 방지 | ✅ PASS | TTL 10분 in-memory Map |
| 서명 형식 검증 | ✅ PASS | `/^[0-9a-f]{64}$/i` 정규식 (수정됨) |
| 서명 형식 검증 순서 | ✅ FIXED | computeSignature 전으로 이동 |
| Hold 소유권 확인 | ✅ PASS | `FLOW_TICKET_SOWON_ID` ↔ hold.sowon_id |
| Secret 로그 노출 | ✅ PASS | Secret은 어떤 로그에도 포함 안 됨 |

**Known Limitation (MVP 허용):**
- Nonce store는 in-memory — 서버 재시작 시 최대 10분 window에서 nonce 재사용 가능 (timestamp ±5분으로 부분 완화)
- 다중 인스턴스 시 Redis로 교체 필요 (Render 단일 인스턴스에서는 허용)

---

## §4 트랜잭션 및 실패 복구 검증 결과

### 4-1. Booking 원자성

`consumeHold`의 트랜잭션 구조:

```
BEGIN
  SELECT dt_flow_holds FOR UPDATE  ← 동시 consumeHold 직렬화
  INSERT dt_flow_bookings (ticket_order_id, ticket_paid_at)
  UPDATE dt_flow_holds SET status='consumed'
COMMIT
```

- INSERT와 Hold status 갱신이 단일 트랜잭션 — 부분 커밋 없음 ✅
- `ticket_order_id`는 INSERT에서 즉시 저장 — UPDATE 없음 ✅

### 4-2. 동시 중복 콜백 처리

**발견 및 수정된 버그 (CRITICAL):**

| 흐름 | 수정 전 | 수정 후 |
|------|--------|--------|
| 동시 요청 A: idempotency SELECT → miss → INSERT 성공 | 201 | 201 ✅ |
| 동시 요청 B: idempotency SELECT → miss → INSERT → PG 23505 | **500 + ops SMS 오발보** | **200 idempotent** ✅ |
| 23505 이후 re-query도 실패 | N/A | 500 + ops SMS ✅ |

PostgreSQL error code `23505`, constraint `uq_dt_flow_bookings_ticket_order` 명시 감지.

### 4-3. Hold 만료 및 실패 알림

| 상황 | ops SMS | HTTP | 수정 |
|------|--------|------|------|
| HOLD_EXPIRED | ✅ | 409 | — |
| HOLD_NOT_FOUND | ✅ | 404 | — |
| HOLD_NOT_ACTIVE (수정됨) | ✅ | 409 | **FIXED** |
| HOLD_OWNERSHIP_MISMATCH | ❌ (의도적) | 403 | — |
| DB 예외 | ✅ | 500 | — |
| SMS 실패 | console.error | N/A | 허용 (MVP) |

**HOLD_NOT_ACTIVE 누락 수정 이유:**  
Hold가 다른 경로로 소진(status='consumed')된 상태에서 ticket-book 호출 시  
idempotency SELECT가 NULL ticket_order_id 기존 booking을 잡지 못하면  
consumeHold → HOLD_NOT_ACTIVE 반환. 결제됐으나 예약 불가 케이스이므로 ops SMS 필수.

---

## §5 테스트 결과

| 테스트 파일 | 테스트 수 | 결과 | 비고 |
|------------|---------|------|------|
| flowTicket.test.js | **26** | **PASS** | +3 신규 (보안 게이트) |
| flowInventory.test.js | 23 | PASS | — |
| flowConfirm.test.js | 13 | PASS | — |
| flowHoldSodamDecision.test.js | 11 | PASS | — |
| flowKstCutoff.test.js | 4 | PASS | — |
| **합계** | **77** | **전체 PASS** | 기존 51 + 신규 26 |

### 추가된 테스트 케이스 (보안 게이트)

| 시나리오 | 검증 내용 |
|--------|---------|
| HOLD_NOT_ACTIVE → ops SMS | 수정된 알림 로직 검증 |
| 동시 중복 PG 23505 → 200 idempotent | re-query 성공 시 idempotent 반환 |
| 동시 중복 re-query 실패 → 500 + SMS | 이중 실패 시 ops 알림 |

---

## §6 보안 게이트 검증 항목 최종 판정

| 검증 항목 | 판정 | 비고 |
|----------|------|------|
| 결제 승인 진위 검증 | ⚠️ PARTIAL | PHP 신뢰 계약 (§2 참조) |
| HMAC 서명 정상 동작 | ✅ PASS | timingSafeEqual |
| Secret 미설정 차단 | ✅ PASS | 503 반환 |
| Timestamp/Nonce 재전송 방지 | ✅ PASS | — |
| 주문번호별 중복 예약 방지 | ✅ PASS | UNIQUE INDEX + idempotency |
| 동시 콜백 중복 방지 | ✅ FIXED | PG 23505 감지 → idempotent |
| Hold 소유권 유지 | ✅ PASS | TICKET_SOWON_ID 검증 |
| 결제 실패 이벤트 ops 알림 | ✅ FIXED | HOLD_NOT_ACTIVE 추가 |
| 운영 로그 내 Secret 노출 | ✅ PASS | 노출 없음 |
| 다중 인스턴스 Nonce | ⚠️ MVP_HOLD | Render 단일 인스턴스 허용 |
| 수동 취소용 추적 정보 | ✅ PASS | ticket_order_id + hold_id 로그 |

---

## §7 PHP 담당자 수정·확인 요청 목록

PHP 연동 전 담당자가 확인해야 할 항목:

```
필수 (운영 전):
[ ] NicePay 최종 승인 후에만 ticket-book 호출하는지 코드 확인
[ ] ticket_order_id 재사용 방지 (취소 후 재결제 = 새 주문번호)
[ ] HMAC canonical string 형식을 이 문서와 동일하게 구현
    timestamp\nnonce\nPOST\n/ticket-book\nfield1=val1&field2=val2
    (body 필드 ASCII 사전순, = 구분, & 연결, URL 인코딩 없음)
[ ] X-Ticket-Timestamp: Unix epoch milliseconds (정수 문자열)
[ ] X-Ticket-Nonce: 무작위 16바이트 이상 hex 또는 UUID, 요청마다 새로 생성
[ ] FLOW_TICKET_SECRET 서버 설정에만 저장 (로그/응답 출력 금지)

권장:
[ ] NicePay 취소 시 ticket.6117.co.kr 내부에서 dt_flow_bookings 연동 취소 절차 합의
[ ] ticket_paid_at: ISO 8601 UTC 형식 사용
[ ] nicepay_tid (거래번호) 향후 검증 API 연동을 위해 ticket-book body에 추가 준비
```

---

## §8 최종 판정

### **MERGE READY** ✅

**조건:** 아래 필수 보안 조건이 모두 구현·검증됨

| 필수 조건 | 상태 |
|----------|------|
| 미인증 요청 차단 | ✅ HMAC-SHA256 |
| 중복 예약 방지 | ✅ UNIQUE INDEX + idempotency |
| 동시 콜백 안전 처리 | ✅ PG 23505 → idempotent |
| 결제 실패 ops 알림 | ✅ 3가지 Hold 실패 모두 SMS |
| Secret 로그 노출 없음 | ✅ |
| 결제 미검증 경로 차단 | ✅ 인증 없이 book 불가 |

**미완료 항목 (운영 안전 처리됨):**
- PHP NicePay 검증 계약: PARTIAL — 인증 없이 외부에서 book 불가, PHP 신뢰 계약으로 허용
- Nonce store in-memory: 단일 인스턴스 MVP 허용

**운영 전 Founder + PHP 담당자 액션:**
1. PHP HMAC 구현 검증 (§7)
2. Render 환경변수 등록: `FLOW_TICKET_SECRET`, `FLOW_TICKET_SOWON_ID`
3. PHP E2E 연동 테스트 (Mock 환경)
4. 수동 배포

---

## §9 변경 사항 요약

| 커밋 | 내용 |
|------|------|
| `c2c3b37` | PHX-COMMERCE-TICKET-001 구현 (23 tests) |
| `f2a0c0d` | Evidence + DREAMTOWN_STATUS.md 갱신 |
| `4197669` | PHX-COMMERCE-TICKET-002 보안 게이트 수정 (+3 tests) |

**최종 브랜치:** `feat/commerce-ticket-flow-v02` @ `4197669`  
**PR:** #143  
**FLOW 테스트:** 77/77 PASS  
**Production 변경:** NONE
