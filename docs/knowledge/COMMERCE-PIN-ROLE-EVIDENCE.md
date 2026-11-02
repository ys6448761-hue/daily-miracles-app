# PIN 역할 및 적용 경로 확인 Evidence

**Date**: 2026-11-02  
**Status**: PIN_ROLE_CONFIRMED  
**Mode**: 읽기 전용. Production 변경 없음.

---

## §1 코드 근거

| 파일 | 확인 내용 |
|------|---------|
| `staging/storybook-c7a:services/partnerPinService.js` | PIN 검증 로직: partner_configs.pin_hash (SHA-256) 비교. rate limit 5회/분. |
| `staging/storybook-c7a:routes/flowConfirmRoutes.js` | PIN 사용 엔드포인트: POST /api/dt/flow/confirm 단 하나. |

---

## §2 PIN 사용 범위

| FLOW 단계 | 인증 | PIN 필요 |
|----------|------|---------|
| GET /availability | 없음 (공개) | ❌ |
| POST /hold | SOWON_ID JWT | ❌ |
| POST /book | SOWON_ID JWT | ❌ |
| **POST /confirm** | partner_code + partner_pin | ✅ |

**PIN은 오직 체크인 확인(dt_flow_confirmations 기록)에만 사용됨.**  
**availability → hold → booking 흐름에 PIN 관여 없음.**

---

## §3 실 PIN 교체 효과

- **활성화**: POST /api/dt/flow/confirm (파트너 체크인 확인) — 단 하나
- **영향 없음**: availability 조회 / hold / booking

→ 실 PIN은 "예약 흐름의 차단 조건"이 아닌 "투숙 확인 기능의 차단 조건"

---

## §4 티켓사이트 방식에서의 PIN

- 티켓사이트는 FLOW를 사용하지 않음
- PIN 개념 없음. 관여 없음.
- 패키지 결제 후 발급: 티켓사이트 주문번호 + QR 티켓
- 호텔 예약 확정: 수기(운영자가 직접 라마다에 연락) 별도 절차 필요

---

## §5 Kenny vs Ramada 차이

| 항목 | Kenny | Ramada |
|------|-------|--------|
| 파트너 코드 | KENNY | RAMADA |
| 기술 구조 | 동일 | 동일 |
| E2E PIN 검증 | 테스트 PIN으로 C6 PASS | 테스트 PIN으로 C6 PASS |
| 실 PIN | NOT_READY | NOT_READY |

기술적 차이 없음. 동일 코드, partner_code만 다름.

---

## §6 판매 차단 조건 정정 (2026-11-02)

| 조건 | 차단 대상 | 심각도 |
|------|---------|------|
| NicePay ↔ FLOW 결제 연결 없음 | FLOW 예약 판매 | 최대 (신규 개발 필요) |
| 고객 예약 UI 없음 | FLOW 예약 판매 | 최대 (신규 개발 필요) |
| staging → main 미병합 | FLOW 예약 판매 | 높음 |
| dt_flow_inventory 비어있음 | FLOW availability 404 | 높음 |
| 라마다 실 PIN | FLOW confirm만 차단 | **낮음** (예약 흐름 차단 아님) |

→ **실 PIN 교체는 가장 마지막 조건. 앞의 4가지가 먼저 해소되어야 의미 있음.**

---

## §7 티켓사이트 독립 패키지 방식 차단 조건 (PIN 관련 없음)

1. 라마다 실 객실 재고 확보 — 호텔 직접 협의 (수기 예약 방식)
2. 패키지 상품 등록 — 관리자 작업
3. 호텔 예약 확정 프로세스 — 수기 운영 절차 정의 필요
