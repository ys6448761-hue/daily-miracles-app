-- Migration 104: 쇼핑 시스템 보완

-- ① 파트너 타입 구분
ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS partner_type VARCHAR(20) DEFAULT 'hometown';
-- hometown: 고향+쇼핑 / shop_only: 쇼핑전용

-- ② 상품 소원 유형 연결
ALTER TABLE dt_shop_products
  ADD COLUMN IF NOT EXISTS wish_types TEXT[],
  ADD COLUMN IF NOT EXISTS is_bundle  BOOLEAN DEFAULT FALSE;

-- ③ 선물 세트 (번들)
CREATE TABLE IF NOT EXISTS dt_shop_bundles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           VARCHAR(100) NOT NULL,
  description    TEXT,
  original_price INTEGER,
  bundle_price   INTEGER NOT NULL,
  image_url      TEXT,
  wish_types     TEXT[],
  is_active      BOOLEAN DEFAULT TRUE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dt_bundle_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id  UUID REFERENCES dt_shop_bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES dt_shop_products(id),
  quantity   INTEGER DEFAULT 1
);

-- ④ 주문 → 별 성장 연동
ALTER TABLE dt_shop_orders
  ADD COLUMN IF NOT EXISTS star_id             UUID REFERENCES dt_stars(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gift_receiver_phone VARCHAR(20);

-- ⑤ 재구매 알림 스케줄
CREATE TABLE IF NOT EXISTS dt_reorder_reminders (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES dt_shop_orders(id),
  product_id UUID REFERENCES dt_shop_products(id),
  user_id    TEXT,
  remind_at  TIMESTAMP NOT NULL,
  is_sent    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 초기 번들 데이터
INSERT INTO dt_shop_bundles (name, description, original_price, bundle_price, wish_types)
VALUES
  ('여수 소원 선물 세트 A', '여수의 첫인사 — 가볍게 마음 전하기',   25000, 20000,  ARRAY['healing','relationship']),
  ('여수 소원 선물 세트 B', '여수의 대표 맛과 별빛을 담았어요',       42000, 35000,  ARRAY['health','healing','relationship']),
  ('여수 소원 선물 세트 C', '특별한 분께 드리는 여수의 정성',         62000, 50000,  ARRAY['relationship','health','growth']),
  ('직장 선물 세트',         '한 번에 5분께 감사 인사',               120000, 100000, ARRAY['relationship'])
ON CONFLICT DO NOTHING;
