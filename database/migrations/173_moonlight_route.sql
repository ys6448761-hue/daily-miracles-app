-- 173_moonlight_route.sql
-- moonlight route_type 지원 추가 (달빛혜택 패스)
-- 변경 내용:
--   1. dt_products.route_type CHECK에 'moonlight' 추가
--   2. dt_products에 달빛혜택 패스 상품 등록

-- ── STEP 1. CHECK 제약 확장 ─────────────────────────────────────
ALTER TABLE dt_products
  DROP CONSTRAINT IF EXISTS dt_products_route_type_check;

ALTER TABLE dt_products
  ADD CONSTRAINT dt_products_route_type_check
  CHECK (route_type IN ('weekday', 'starlit', 'family', 'challenge', 'moonlight'));

-- ── STEP 2. moonlight 상품 시드 ────────────────────────────────
INSERT INTO dt_products
  (product_code, city_code, route_type, title, price, tag, benefit_types, display_order)
VALUES
  ('moonlight_pass', 'yeosu', 'moonlight', '달빛혜택 패스', 6000, NULL, '["moonlight"]', 0)
ON CONFLICT (product_code) DO NOTHING;
