-- 059_voyage_core.sql
-- 북은하 항해 MVP 핵심 테이블
-- voyage_wishes: 항해 소원 (별도 도메인, dt_wishes와 분리)
-- voyage_bookings: 예약 + 결제 정보
-- Created: 2026-04-06

-- ① 항해 소원 원장
CREATE TABLE IF NOT EXISTS voyage_wishes (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  session_key  VARCHAR(64),                                        -- 비로그인 세션 식별자
  wish_text    TEXT         NOT NULL,
  status       VARCHAR(30)  NOT NULL DEFAULT 'draft_created'
                            CHECK (status IN (
                              'draft_created',
                              'booking_pending',
                              'booking_confirmed',
                              'boarding_checked_in',
                              'voyage_in_progress',
                              'voyage_completed',
                              'star_created'
                            )),
  star_id      UUID,                                               -- 생성된 dt_stars.id
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ② 예약 + 결제 원장
CREATE TABLE IF NOT EXISTS voyage_bookings (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  wish_id           UUID         NOT NULL REFERENCES voyage_wishes(id),
  customer_name     VARCHAR(100) NOT NULL,
  phone             VARCHAR(20)  NOT NULL,
  booking_date      DATE         NOT NULL,
  session           VARCHAR(10)  NOT NULL CHECK (session IN ('morning', 'evening')),
  -- morning: 09:00~13:00  /  evening: 17:00~21:00
  amount            INTEGER      NOT NULL,                        -- 60000(주중) / 89000(주말)
  status            VARCHAR(20)  NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  pg_order_id       VARCHAR(100),
  pg_payment_key    VARCHAR(200),
  pg_transaction_id VARCHAR(200),
  paid_at           TIMESTAMPTZ,
  reflection_answer VARCHAR(20)  CHECK (reflection_answer IN ('lighter', 'clearer', 'braver')),
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voyage_wishes_status     ON voyage_wishes(status);
CREATE INDEX IF NOT EXISTS idx_voyage_bookings_wish_id  ON voyage_bookings(wish_id);
CREATE INDEX IF NOT EXISTS idx_voyage_bookings_date     ON voyage_bookings(booking_date, session);
