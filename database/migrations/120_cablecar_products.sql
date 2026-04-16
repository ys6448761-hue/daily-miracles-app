-- Migration 120: 케이블카 각성 패스 결제 추적
-- Created: 2026-04-16

CREATE TABLE IF NOT EXISTS cablecar_checkouts (
  order_id        VARCHAR(100) NOT NULL PRIMARY KEY,
  user_id         VARCHAR(100) NOT NULL,
  phone           VARCHAR(20),
  product_type    VARCHAR(50)  NOT NULL DEFAULT 'cablecar_awakening',
  credential_code VARCHAR(50),
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cablecar_checkouts_user ON cablecar_checkouts(user_id);
