-- Migration 102: 특산품 쇼핑 + 주문·정산 시스템

-- ── 상품 ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_shop_products (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID         REFERENCES dt_partners(id) ON DELETE SET NULL,
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  price             INTEGER      NOT NULL CHECK (price > 0),
  stock             INTEGER      NOT NULL DEFAULT 0,
  image_url         TEXT,
  category          VARCHAR(30)  NOT NULL DEFAULT 'goods'
                    CHECK (category IN ('food','goods','souvenir')),
  is_gift_available BOOLEAN      NOT NULL DEFAULT TRUE,
  is_active         BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_products_partner ON dt_shop_products(partner_id, is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON dt_shop_products(category) WHERE is_active = TRUE;

-- ── 주문 ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_shop_orders (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         REFERENCES dt_users(id) ON DELETE SET NULL,
  partner_id       UUID         REFERENCES dt_partners(id) ON DELETE SET NULL,
  product_id       UUID         REFERENCES dt_shop_products(id) ON DELETE SET NULL,
  quantity         INTEGER      NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_amount     INTEGER      NOT NULL,
  partner_amount   INTEGER      NOT NULL,
  platform_amount  INTEGER      NOT NULL,
  buyer_phone      VARCHAR(20),
  payment_key      VARCHAR(200),
  status           VARCHAR(20)  NOT NULL DEFAULT 'paid'
                   CHECK (status IN ('paid','preparing','shipped','delivered','cancelled')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_orders_user    ON dt_shop_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_partner ON dt_shop_orders(partner_id, status);

-- ── 다중 배송지 ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_order_deliveries (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID         NOT NULL REFERENCES dt_shop_orders(id) ON DELETE CASCADE,
  recipient_name   VARCHAR(50)  NOT NULL,
  recipient_phone  VARCHAR(20)  NOT NULL,
  address          TEXT         NOT NULL,
  gift_message     TEXT,
  delivery_status  VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (delivery_status IN ('pending','preparing','shipped','delivered')),
  tracking_number  VARCHAR(50),
  delivered_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON dt_order_deliveries(order_id);

-- ── 월간 정산 ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_settlements (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID         NOT NULL REFERENCES dt_partners(id) ON DELETE CASCADE,
  settlement_month DATE         NOT NULL,
  total_sales      INTEGER      NOT NULL DEFAULT 0,
  partner_amount   INTEGER      NOT NULL DEFAULT 0,
  platform_amount  INTEGER      NOT NULL DEFAULT 0,
  order_count      INTEGER      NOT NULL DEFAULT 0,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','completed')),
  bank_name        VARCHAR(50),
  account_number   VARCHAR(50),
  paid_at          TIMESTAMPTZ,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (partner_id, settlement_month)
);
CREATE INDEX IF NOT EXISTS idx_settlements_partner ON dt_settlements(partner_id, settlement_month DESC);
