-- migration 157 — 별공방 loc 코드 표준화
-- SSOT: config/locationRegistry.js
--
-- 기존 코드 → 신규 canonical 코드:
--   yeosu_cablecar / yeosu-cablecar / cablecar → yeosu_cablecar_workshop
--   lattoa_cafe / lattoa / lattoa-cafe          → yeosu_lattoa_cafe
--   global / default                            → global_default_workshop

-- ── 1. stars.origin_location 값 표준화 ──────────────────────────
UPDATE stars
SET origin_location = 'yeosu_cablecar_workshop'
WHERE origin_location IN ('yeosu_cablecar', 'yeosu-cablecar', 'cablecar');

UPDATE stars
SET origin_location = 'yeosu_lattoa_cafe'
WHERE origin_location IN ('lattoa_cafe', 'lattoa', 'lattoa-cafe');

UPDATE stars
SET origin_location = 'global_default_workshop'
WHERE origin_location IN ('global', 'default');

-- ── 2. locations 테이블 코드 표준화 (migration 148 기반) ─────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'locations') THEN
    UPDATE locations SET code = 'yeosu_cablecar_workshop' WHERE code = 'yeosu_cablecar';
    UPDATE locations SET code = 'yeosu_lattoa_cafe'       WHERE code = 'lattoa_cafe';

    INSERT INTO locations (code, name_ko, city, region, country_code, venue_type, status, emoji)
    VALUES ('global_default_workshop', '기본 별공방', NULL, NULL, 'KR', 'default', 'running', '✦')
    ON CONFLICT (code) DO NOTHING;

    -- 3. 신규 메타데이터 컬럼 추가
    ALTER TABLE locations ADD COLUMN IF NOT EXISTS display_name TEXT;
    ALTER TABLE locations ADD COLUMN IF NOT EXISTS partner      TEXT;
    ALTER TABLE locations ADD COLUMN IF NOT EXISTS type         TEXT;
    ALTER TABLE locations ADD COLUMN IF NOT EXISTS stage        TEXT DEFAULT 'workshop';

    -- 4. 값 채우기
    UPDATE locations SET display_name = name_ko WHERE display_name IS NULL;
    UPDATE locations SET type         = venue_type WHERE type IS NULL;
    UPDATE locations SET partner = CASE code
      WHEN 'yeosu_cablecar_workshop' THEN '여수 해상 케이블카'
      WHEN 'yeosu_lattoa_cafe'       THEN '라또아'
      WHEN 'forestland'              THEN '더 포레스트랜드'
      WHEN 'paransi'                 THEN '파란시'
      ELSE NULL
    END WHERE partner IS NULL;
  END IF;
END $$;
