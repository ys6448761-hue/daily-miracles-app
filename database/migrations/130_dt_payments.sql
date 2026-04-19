-- 130_dt_payments.sql
-- DreamTown Day 8 결제 내역 (user_id + plan_type 포함)

CREATE TABLE IF NOT EXISTS dt_payments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  plan_type    VARCHAR(20),               -- flow
  provider     VARCHAR(20) DEFAULT 'nicepay',
  order_id     VARCHAR(100) UNIQUE,       -- nicepay_payments.order_id와 공유
  tid          VARCHAR(100),
  amount       INT,
  status       VARCHAR(20) DEFAULT 'ready', -- ready / paid / failed / cancelled
  requested_at TIMESTAMP   DEFAULT NOW(),
  paid_at      TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dt_payments_user_id  ON dt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_dt_payments_order_id ON dt_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_dt_payments_status   ON dt_payments(status);
