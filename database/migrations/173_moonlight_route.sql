-- 173_moonlight_route.sql
-- moonlight route_type 지원 추가 (달빛혜택 패스)
--
-- 변경 내용:
--   1. dt_products route_type CHECK를 moonlight 포함으로 교체
--      - 인라인 CHECK 이름이 DB마다 다를 수 있어 DO 블록으로 동적 탐색·삭제
--      - NOT VALID: 기존 행 검증 생략 (신규 INSERT만 검증)
--   2. dt_products에 달빛혜택 패스 상품 등록

-- ── STEP 1. 기존 CHECK 제약 전체 삭제 (이름 자동 탐지) ────────────
DO $$
DECLARE
  v_name TEXT;
BEGIN
  FOR v_name IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'dt_products'::regclass
      AND contype = 'c'
      AND (conname LIKE '%route_type%' OR conname LIKE '%route%')
  LOOP
    EXECUTE format('ALTER TABLE dt_products DROP CONSTRAINT IF EXISTS %I', v_name);
  END LOOP;
END $$;

-- ── STEP 2. 새 CHECK 제약 추가 (moonlight 포함, NOT VALID) ─────────
ALTER TABLE dt_products
  ADD CONSTRAINT dt_products_route_type_check
  CHECK (route_type IN ('weekday', 'starlit', 'family', 'challenge', 'moonlight'))
  NOT VALID;

-- ── STEP 3. moonlight 상품 시드 ────────────────────────────────────
INSERT INTO dt_products
  (product_code, city_code, route_type, title, price, tag, benefit_types, display_order)
VALUES
  ('moonlight_pass', 'yeosu', 'moonlight', '달빛혜택 패스', 6000, NULL, '["moonlight"]', 0)
ON CONFLICT (product_code) DO NOTHING;
