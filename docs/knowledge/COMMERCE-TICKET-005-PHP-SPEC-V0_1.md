# PHX-COMMERCE-TICKET-005 — PHP Integration Spec V0.1

**대상:** `ticket.6117.co.kr` PHP 개발 담당자  
**기준:** `services/ticketAuthService.js` + `routes/flowTicketRoutes.js` (main @ `2e76281`)  
**날짜:** 2026-11-03  
**접근 가능 여부:** PHP Repo 접근 불가 — Node.js 기준 역방향 도출  
**상태:** PARTIAL (PHP 코드 접근 불가, 명세 + 테스트 벡터만 준비)

---

## §1 PHP Repository 조사 결과

| 항목 | 결과 |
|------|------|
| PHP Repo 위치 | C:\DEV 워크스페이스에 없음 |
| PHP 코드 접근 | 불가 |
| PHP 파일 수정 권한 | 확인 불가 (담당자 문의 필요) |
| NicePay 콜백 파일 위치 | 확인 불가 |
| 결제 승인 검증 로직 위치 | 확인 불가 |
| 주문번호 생성 위치 | 확인 불가 |
| Hold ID 세션 저장 방식 | 확인 불가 |
| PHP/NicePay 테스트 환경 | 확인 불가 |

**→ 아래 명세는 Node.js 구현을 기준으로 PHP 담당자에게 전달할 계약이다.**

---

## §2 HMAC-SHA256 서명 계약

### 2-1. 개요

두 서버는 동일한 Secret(`FLOW_TICKET_SECRET`)을 공유한다.  
PHP는 모든 요청에 HMAC 서명을 포함해야 한다.  
Node는 서명을 수신 후 독립적으로 재계산해 검증한다.

### 2-2. Canonical String 구성 규칙

```
canonical = timestamp + "\n"
          + nonce     + "\n"
          + METHOD    + "\n"   ← 대문자 (POST)
          + path      + "\n"   ← /ticket-hold 또는 /ticket-book
          + sorted_body        ← body 필드 ASCII 오름차순 정렬
```

**sorted_body 규칙:**
- JSON body의 모든 key를 ASCII 사전순으로 정렬
- `key=value` 형식으로 `&`로 연결
- URL 인코딩 없음 (값을 그대로 사용)
- body가 비어 있으면 빈 문자열

**예시 (ticket-book body = {hold_id, customer_name, ticket_order_id, ticket_paid_at, phone}):**
```
# ASCII 정렬 순서: customer_name < hold_id < phone < ticket_order_id < ticket_paid_at
customer_name=홍길동&hold_id=hold-uuid-0001&phone=01012345678&ticket_order_id=ORD-2026-001&ticket_paid_at=2026-11-03T09:00:00.000Z
```

### 2-3. HMAC 계산

```
signature = HMAC-SHA256(secret, canonical).hexdigest().lowercase()
```

- 알고리즘: HMAC-SHA256
- 출력: 64자 소문자 hex 문자열
- Canonical 인코딩: UTF-8

### 2-4. HTTP 헤더

| 헤더명 | 내용 | 예시 |
|--------|------|------|
| `X-Ticket-Timestamp` | Unix epoch milliseconds (정수 문자열) | `1730624400000` |
| `X-Ticket-Nonce` | 무작위 고유 문자열, 요청마다 새로 생성 (최소 16자) | `a1b2c3d4e5f6789012345678deadbeef` |
| `X-Ticket-Signature` | 64자 소문자 hex | `db43bdbb...` |

### 2-5. 서버 측 검증 규칙 (Node.js 기준)

| 검증 항목 | 기준 | 실패 응답 |
|----------|------|---------|
| 헤더 누락 | 3개 헤더 모두 필수 | 401 MISSING_AUTH_HEADERS |
| Timestamp 유효 | ±5분 (300,000ms) | 401 TIMESTAMP_EXPIRED |
| Nonce 재사용 | 10분 TTL, 동일 nonce 2회 → 거부 | 401 NONCE_REUSED |
| 서명 형식 | `/^[0-9a-f]{64}$/i` | 401 INVALID_SIGNATURE_FORMAT |
| 서명 일치 | Constant-time 비교 | 401 INVALID_SIGNATURE |
| Feature Flag | `FLOW_TICKET_ENABLED=true` 필요 | 503 TICKET_API_DISABLED |

### 2-6. Path 주의사항

Node.js Express Router에서 `req.path`는 라우터 기준 상대 경로:
- `POST /api/dt/flow/ticket-hold` → `req.path = /ticket-hold`
- `POST /api/dt/flow/ticket-book` → `req.path = /ticket-book`

**Canonical의 path 필드는 `/ticket-hold` 또는 `/ticket-book`이어야 한다** (full URL이 아님).

---

## §3 HMAC 테스트 벡터

**⚠️ 이 Secret은 테스트 전용. Production에 사용하지 않는다.**

```
SECRET    = "test-secret-for-php-contract-verification-v01"
TIMESTAMP = "1730624400000"   ← 2026-11-03T09:00:00.000Z UTC
```

### Vector 1: ticket-hold (quantity 포함)

```
Input:
  method    = POST
  path      = /ticket-hold
  nonce     = a1b2c3d4e5f6789012345678deadbeef
  body      = {"inventory_id": "inv-test-001", "quantity": 2}

Canonical String:
  1730624400000
  a1b2c3d4e5f6789012345678deadbeef
  POST
  /ticket-hold
  inventory_id=inv-test-001&quantity=2

Expected Signature:
  db43bdbbbf6c2c446dae702303c0c3c51a966fcfc89cfa9bcec91c7b7f4f191b
```

### Vector 2: ticket-hold (quantity 생략)

```
Input:
  method    = POST
  path      = /ticket-hold
  nonce     = a1b2c3d4e5f6789012345678deadbeef2
  body      = {"inventory_id": "inv-test-001"}

Canonical String:
  1730624400000
  a1b2c3d4e5f6789012345678deadbeef2
  POST
  /ticket-hold
  inventory_id=inv-test-001

Expected Signature:
  d38ec1ecb61e2a0ace79d9274b11e8c9613c7b83866c03a60329cc60b4de2ff2
```

### Vector 3: ticket-book (전체 필드)

```
Input:
  method    = POST
  path      = /ticket-book
  nonce     = a1b2c3d4e5f6789012345678deadbeef3
  body      = {
    "hold_id":         "hold-uuid-0001",
    "ticket_order_id": "ORD-2026-TEST-001",
    "ticket_paid_at":  "2026-11-03T09:00:05.000Z",
    "customer_name":   "홍길동",
    "phone":           "01012345678"
  }

Canonical String:
  1730624400000
  a1b2c3d4e5f6789012345678deadbeef3
  POST
  /ticket-book
  customer_name=홍길동&hold_id=hold-uuid-0001&phone=01012345678&ticket_order_id=ORD-2026-TEST-001&ticket_paid_at=2026-11-03T09:00:05.000Z

Expected Signature:
  6f52351d6b4b7d7548a8c454744f0e8b25d61fcfb9e298102ab3071f9a5142c0
```

### Vector 4: ticket-book (필수 필드만, customer_name/phone 생략)

```
Input:
  method    = POST
  path      = /ticket-book
  nonce     = a1b2c3d4e5f6789012345678deadbeef4
  body      = {
    "hold_id":         "hold-uuid-0002",
    "ticket_order_id": "ORD-2026-TEST-002",
    "ticket_paid_at":  "2026-11-03T09:05:00.000Z"
  }

Canonical String:
  1730624400000
  a1b2c3d4e5f6789012345678deadbeef4
  POST
  /ticket-book
  hold_id=hold-uuid-0002&ticket_order_id=ORD-2026-TEST-002&ticket_paid_at=2026-11-03T09:05:00.000Z

Expected Signature:
  a6f82dd3b57c4b659d475d5c2afc398ce96d22e9810db48b4673d2f92e1010df
```

---

## §4 ticket-hold 계약

### 4-1. 요청

```
POST /api/dt/flow/ticket-hold
Content-Type: application/json
X-Ticket-Timestamp: {unix_epoch_ms}
X-Ticket-Nonce: {random_unique}
X-Ticket-Signature: {hmac_hex}

Body:
{
  "inventory_id": "string",   ← 필수
  "quantity":     1           ← 선택, 기본값 1, 범위 1-100
}
```

### 4-2. 성공 응답

```json
{
  "success":    true,
  "hold_id":    "uuid",
  "expires_at": "2026-11-03T09:30:00.000Z"
}
```

**PHP 처리:**
1. `hold_id`를 PHP 세션에 저장
2. `expires_at` 내에 결제 완료 및 ticket-book 호출 필요
3. **Hold 성공 확인 전까지 결제창을 열지 않는다**

### 4-3. 실패 응답

| HTTP | error | 의미 | PHP 처리 |
|------|-------|------|----------|
| 401 | TICKET_AUTH_FAILED | 인증 실패 | 재시도 금지, 담당자 확인 |
| 404 | INVENTORY_NOT_FOUND | 재고 없음 | 상품 안내 |
| 409 | INVENTORY_CLOSED | 재고 마감 | 마감 안내 |
| 409 | CUTOFF_PASSED | 예약 마감 | 마감 안내 |
| 409 | INSUFFICIENT_AVAILABILITY | 수량 부족 | `available` 필드로 잔여 안내 |
| 503 | TICKET_API_DISABLED | API 비활성 | 운영자 확인 (Feature Flag 미설정) |

### 4-4. Hold TTL

- 기본값: **30분** (`FLOW_HOLD_TTL_MINUTES` 환경변수, default=30)
- ⚠️ 태스크 명세의 "45분"은 실제 구현과 불일치 — 실제는 30분
- PHP 세션 타임아웃은 Hold TTL보다 길게 설정 권장

---

## §5 NicePay 결제 승인 계약

**가맹점 분리:** `ticket.6117.co.kr`은 독립된 NicePay MID 사용.  
Node.js 서버에서 PHP 측 NicePay 거래를 독립 교차 검증하는 것은 MVP 범위 밖.

### PHP 담당자 필수 구현 사항

```
[ ] NicePay 서버 측 승인 API 호출
    → 프론트엔드 파라미터 수신만으로 승인 처리 금지
    → NicePay 서버 측 검증 API로 거래 진위 확인 후 처리

[ ] 검증 필드:
    - resultCode == '3001' (NicePay 승인 성공 코드)
    - tid (거래번호) 정합성
    - price == 기대 결제 금액
    - moid == ticket_order_id (주문번호 일치)

[ ] 승인 실패 시 ticket-book 호출 금지

[ ] ticket_order_id (moid) 유일성 보장:
    - 취소 후 재결제 → 새 주문번호 발급
    - 동일 주문번호 재사용 금지

[ ] ticket_paid_at: ISO 8601 UTC 형식
    예: "2026-11-03T09:15:30.123Z"
```

### NicePay 신뢰 경계

```
외부 공격자       → HMAC Secret 없음 → ticket-book 호출 불가
PHP 서버(정상)    → NicePay 승인 확인 후 ticket-book 호출 (계약 이행)
PHP 서버(버그)    → Node에서 차단 불가 (PHP 측 책임 — MVP 허용 경계)
```

---

## §6 ticket-book 계약

### 6-1. 요청

```
POST /api/dt/flow/ticket-book
Content-Type: application/json
X-Ticket-Timestamp: {unix_epoch_ms}
X-Ticket-Nonce: {random_unique}
X-Ticket-Signature: {hmac_hex}

Body:
{
  "hold_id":         "uuid",          ← 필수
  "ticket_order_id": "string",        ← 필수 (NicePay moid)
  "ticket_paid_at":  "ISO 8601 UTC",  ← 필수
  "customer_name":   "string",        ← 선택
  "phone":           "string"         ← 선택
}
```

### 6-2. 성공 응답

```json
{
  "success":         true,
  "booking_id":      "uuid",
  "ticket_order_id": "ORD-2026-TEST-001"
}
```

**Idempotent 응답 (중복 콜백):**
```json
{
  "success":         true,
  "booking_id":      "uuid",
  "ticket_order_id": "ORD-2026-TEST-001",
  "idempotent":      true
}
```

**PHP 처리:**
- `idempotent: true` 포함 여부와 무관하게 `success: true`면 예약 완료로 처리
- 동일 `ticket_order_id`로 중복 콜백이 온 경우, Node는 기존 예약을 반환

### 6-3. 실패 응답

| HTTP | error | 의미 | PHP 처리 |
|------|-------|------|----------|
| 400 | MISSING_HOLD_ID | hold_id 누락 | 로직 버그 확인 |
| 400 | MISSING_TICKET_ORDER_ID | 주문번호 누락 | 로직 버그 확인 |
| 400 | MISSING_TICKET_PAID_AT | 결제 시각 누락 | 로직 버그 확인 |
| 401 | TICKET_AUTH_FAILED | 인증 실패 | HMAC 구현 확인 |
| 404 | HOLD_NOT_FOUND | Hold 없음 | 운영자 대응 (결제 완료 후 발생 시 위험) |
| 409 | HOLD_EXPIRED | Hold 만료 | 운영자 대응 + 수동 환불 필요 |
| 409 | HOLD_NOT_ACTIVE | Hold 소진 (다른 경로) | 운영자 대응 |
| 500 | INTERNAL_ERROR | DB 오류 등 | 운영자 대응 + SMS 자동 발송됨 |

**결제 후 Booking 실패 시 (HOLD_EXPIRED, HOLD_NOT_FOUND, HOLD_NOT_ACTIVE):**
- Node가 운영자 SMS 자동 발송
- PHP도 고객에게 "예약 처리 중 오류" 안내
- 수동 환불 절차 진행

---

## §7 PHP 담당자 확인 체크리스트

```
HMAC 구현:
[ ] PHP의 HMAC canonical string이 §2-2와 완전히 동일한지 확인
[ ] §3 테스트 벡터 4개를 PHP에서 실행해 동일한 signature가 나오는지 검증
[ ] body JSON은 Content-Type: application/json으로 전송 (PHP json_encode)
[ ] Timestamp: microtime(true) * 1000 을 정수로 변환 후 문자열화
[ ] Nonce: bin2hex(random_bytes(16)) 또는 동등한 방법 (32자)
[ ] 요청마다 새로운 Nonce 사용

Hold:
[ ] ticket-hold 성공(201) 확인 후에만 결제창 열기
[ ] hold_id를 PHP 세션에 저장 (결제 완료 후 ticket-book에 사용)
[ ] expires_at 내에 결제 완료 + ticket-book 호출 (30분)

NicePay:
[ ] 프론트엔드 수신 파라미터만으로 결제 완료 처리 금지
[ ] NicePay 서버 측 승인 API로 검증 후 ticket-book 호출
[ ] resultCode, tid, price, moid 검증 필수

Book:
[ ] ticket_order_id = NicePay moid와 동일값 사용
[ ] ticket_paid_at = ISO 8601 UTC 형식 (예: "2026-11-03T09:15:30.123Z")
[ ] 동일 ticket_order_id로 중복 콜백 시 idempotent 처리
[ ] ticket-book 실패 시 고객 안내 + 운영자 대응 절차 준비

Secret:
[ ] FLOW_TICKET_SECRET: PHP 서버 환경변수 또는 설정 파일에만 저장
[ ] 최소 32자 무작위 문자열
[ ] 로그 출력 금지
[ ] GitHub/코드 내 평문 저장 금지
```

---

## §8 Hold TTL 불일치 알림

| 항목 | 태스크 명세 | 실제 구현 |
|------|----------|---------|
| Hold TTL | 45분 | **30분** (env `FLOW_HOLD_TTL_MINUTES`, default=30) |

**→ Founder 결정 필요:** PHP E2E 전 TTL을 45분으로 변경할지 30분으로 유지할지 확인 요망.  
변경 시 `FLOW_HOLD_TTL_MINUTES=45` 환경변수 설정으로 조정 가능 (코드 수정 불필요).
