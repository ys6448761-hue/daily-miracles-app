-- Migration 138: voyages — 케이블카 Star 항해 결제 기록
CREATE TABLE IF NOT EXISTS voyages (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id      UUID,
  type         VARCHAR(20) NOT NULL CHECK (type IN ('rest', 'reflect', 'move')),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  phone_number VARCHAR(20),
  name         VARCHAR(50),
  pg_order_id  VARCHAR(64),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_voyages_star_id     ON voyages (star_id);
CREATE INDEX IF NOT EXISTS idx_voyages_pg_order_id ON voyages (pg_order_id);
CREATE INDEX IF NOT EXISTS idx_voyages_status      ON voyages (status);
