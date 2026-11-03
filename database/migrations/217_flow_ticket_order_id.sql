-- Migration 217: ticket.6117.co.kr 주문번호를 FLOW Booking에 연결
-- Purpose: Commerce Phase 1 — ticket PHP 결제 승인 후 FLOW Booking 생성 시
--          ticket_order_id로 중복 방지 및 역참조 가능하도록 컬럼 추가
--
-- DB Engine: PostgreSQL (Supabase)
-- Prereq: 208_flow_schema.sql APPLIED (dt_flow_bookings 테이블 존재 확인 필수)
-- Safety:
--   - ADD COLUMN IF NOT EXISTS → 재실행 안전 (멱등)
--   - NULL 허용 → 기존 Booking 데이터 무변경
--   - PARTIAL UNIQUE INDEX (WHERE NOT NULL) → NULL 기존 데이터 충돌 없음
-- Data Compatibility:
--   - 기존 dt_flow_bookings 레코드: ticket_order_id = NULL (보존)
--   - 기존 Booking INSERT SQL (inventory_id, hold_id, sowon_id, quantity, status,
--     customer_name, phone): 명시적 컬럼 지정이므로 영향 없음
-- Created: 2026-11-03
-- Author: Commerce Phase 1 Migration Gate

-- ── 컬럼 추가 ─────────────────────────────────────────────────────────────────

ALTER TABLE dt_flow_bookings
  ADD COLUMN IF NOT EXISTS ticket_order_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS ticket_paid_at  TIMESTAMPTZ;

-- ── UNIQUE INDEX (중복 주문번호 차단) ──────────────────────────────────────────
-- WHERE ticket_order_id IS NOT NULL: NULL 값은 UNIQUE 검사 제외
--   → 기존 내부 예약 (ticket_order_id = NULL) 다수 공존 가능
-- IF NOT EXISTS: 재실행 시 오류 없음

CREATE UNIQUE INDEX IF NOT EXISTS uq_dt_flow_bookings_ticket_order
  ON dt_flow_bookings (ticket_order_id)
  WHERE ticket_order_id IS NOT NULL;

-- ── 컬럼 설명 ─────────────────────────────────────────────────────────────────

COMMENT ON COLUMN dt_flow_bookings.ticket_order_id
  IS 'ticket.6117.co.kr 주문번호. NULL = DreamTown 내부 예약. '
     'UNIQUE (ticket_order_id) WHERE NOT NULL — 동일 주문 중복 Booking 차단.';

COMMENT ON COLUMN dt_flow_bookings.ticket_paid_at
  IS 'ticket.6117.co.kr NicePay 승인 완료 시각 (UTC). '
     '우리 nicepay_payments 테이블과 무관한 독립 레코드.';

-- ── Rollback (Founder 명시 승인 없이 실행 금지) ──────────────────────────────
-- DROP INDEX IF EXISTS uq_dt_flow_bookings_ticket_order;
-- ALTER TABLE dt_flow_bookings
--   DROP COLUMN IF EXISTS ticket_order_id,
--   DROP COLUMN IF EXISTS ticket_paid_at;
