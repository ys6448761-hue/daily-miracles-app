# Architecture Decision — 판매 채널 기준 확정

**Decision ID**: DECISION_COMMERCE_CHANNEL_V0_1  
**Date**: 2026-11-03  
**Status**: CONFIRMED (Founder Decision)  
**Authority**: Founder (푸르미르)

---

## 결정 내용

| 레이어 | 기준 시스템 | 역할 |
|--------|-----------|------|
| 상품·주문·결제 | **ticket.6117.co.kr** (PHP) | NicePay 결제 처리 + 주문 관리 |
| 객실 재고·Hold·Booking | **FLOW** (Express / staging) | dt_flow_* 테이블, flowInventoryService.js |
| 여행 발견·패키지 추천 | **DreamTown / SOUL** (Express + React) | 고객 탐색 레이어 |
| 운영 현황 조회 | **Phoenix 운영** | 주문·결제·예약·재고 통합 뷰 |

---

## 변경 전 가정 (폐기)

초기 개발은 **Wix**를 결제 채널로 가정했다:
- `nicepayService.js`의 `WIX_SUCCESS_URL`
- `GET /api/payments/verify (Wix용)` 주석
- `quoteRequestRoutes.js`의 `WIX_WEBHOOK_SECRET`

이 코드는 **기존 자산으로 보존**한다. ticket.6117.co.kr 연동의 기본 경로로 사용하지 않는다.

---

## 확정 후 아키텍처

```
[ticket.6117.co.kr] — PHP 독립 시스템
  ├─ 상품 카탈로그 (자체 DB)
  ├─ 주문 생성 + 주문번호 발행
  ├─ NicePay 결제 처리 (자체 MID 또는 공유 MID — 미확인)
  └─ 결제 승인 후 → POST /api/dt/flow/ticket-book (우리 서버 webhook 호출)
                            ↓
[daily-miracles-mvp] — Express
  ├─ FLOW: createHold() → consumeHold() → dt_flow_bookings
  ├─ 파트너 PIN 확인: POST /api/dt/flow/confirm
  └─ 운영 현황: Phoenix 대시보드
```

---

## 제약 (Founder 명시)

- Wix 코드 삭제·수정 금지
- 새 예약 엔진 개발 금지 — 기존 FLOW 재사용
- Production DB·결제 코드 변경 금지 (별도 승인 필요)
- 실결제·실예약 금지
- ticket.6117.co.kr 내부 코드 직접 수정 금지

---

## 보존 자산 목록

| 파일 | 상태 | 용도 |
|------|------|------|
| `services/nicepayService.js` (WIX_SUCCESS_URL) | 보존 | 기존 Wix 결제 경로 (수정 금지) |
| `GET /api/payments/verify` (Wix용) | 보존 | 기존 Wix 검증 (수정 금지) |
| `routes/quoteRequestRoutes.js` (WIX_WEBHOOK_SECRET) | 보존 | 기존 견적 webhook |
| `services/flowInventoryService.js` (staging) | **재사용** | ticket 연동 핵심 |
| `routes/flowRoutes.js` (staging) | **참조** | Hold/Book API 구조 |
| `routes/flowConfirmRoutes.js` (staging) | **재사용** | 파트너 PIN 확인 |

---

## 관련 Evidence

- `docs/knowledge/COMMERCE-FLOW-CONNECTION-AUDIT-V0_1.md` — FLOW 연결 갭 분석
- `docs/knowledge/COMMERCE-TICKET-SITE-AUDIT-V0_1.md` — ticket.6117.co.kr 조사 (Wix 가정 하)
- `docs/knowledge/COMMERCE-TICKET-FLOW-DESIGN-V0_1.md` — 최소 연동 설계 (이 결정 이후 작성)
