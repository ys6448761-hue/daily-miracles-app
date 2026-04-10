-- 086_benefit_engine.sql
-- DreamTown Benefit Engine v1
-- regions → partners → benefits → products → product_benefits

-- ── regions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_regions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code VARCHAR(5)  NOT NULL,                          -- KR, JP, US
  city_code    VARCHAR(30) NOT NULL UNIQUE,                   -- yeosu, busan, tokyo
  city_name    VARCHAR(60) NOT NULL,
  currency     VARCHAR(5)  NOT NULL DEFAULT 'KRW',
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_regions_country ON dt_regions(country_code);

-- 여수 시드
INSERT INTO dt_regions (country_code, city_code, city_name)
VALUES ('KR', 'yeosu', '여수')
ON CONFLICT (city_code) DO NOTHING;

-- ── partners (제휴업체) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_partners (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  city_code   VARCHAR(30) NOT NULL REFERENCES dt_regions(city_code),
  name        VARCHAR(100) NOT NULL,
  category    VARCHAR(30) NOT NULL
              CHECK (category IN ('cafe','restaurant','night','activity','transport','accommodation','etc')),
  address     TEXT,
  lat         NUMERIC(10,7),
  lng         NUMERIC(10,7),
  phone       VARCHAR(20),
  description TEXT,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_partners_city ON dt_partners(city_code, is_active);

-- ── benefits (혜택 정의) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_benefits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID        NOT NULL REFERENCES dt_partners(id),
  benefit_type  VARCHAR(20) NOT NULL
                CHECK (benefit_type IN ('free','discount','gift','experience','upgrade')),
  title         VARCHAR(100) NOT NULL,       -- 짧은 혜택 설명 (관리용)
  description   TEXT,                        -- 조건 포함 상세 설명
  display_copy  VARCHAR(200) NOT NULL,       -- UX 문장 ("잠깐 쉬어갈 수 있어요")
  location_hint VARCHAR(100),               -- "해상케이블카 근처"
  valid_from    DATE,
  valid_to      DATE,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_benefits_partner ON dt_benefits(partner_id, is_active);

-- ── dt_products (여정 상품) ───────────────────────────────────────────
-- 기존 dtFunnelRoutes의 PRODUCTS 하드코딩을 DB로 이관
CREATE TABLE IF NOT EXISTS dt_products (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code  VARCHAR(50) NOT NULL UNIQUE,  -- 'wp_cable_cruise' 등 기존 코드 호환
  city_code     VARCHAR(30) NOT NULL REFERENCES dt_regions(city_code),
  route_type    VARCHAR(20) NOT NULL
                CHECK (route_type IN ('weekday','starlit','family','challenge')),
  title         VARCHAR(100) NOT NULL,
  price         INTEGER     NOT NULL,
  tag           VARCHAR(20),                  -- 'best', 'popular', null
  benefit_types JSONB,                        -- ['cablecar','cruise'] 메타
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  display_order INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dtproducts_route ON dt_products(city_code, route_type, is_active, display_order);

-- 여수 상품 시드 (dtFunnelRoutes.js PRODUCTS 이관)
INSERT INTO dt_products (product_code, city_code, route_type, title, price, tag, benefit_types, display_order) VALUES
  ('wp_cable_cruise', 'yeosu', 'weekday',   '케이블카 + 유람선',       25000, 'best',    '["cablecar","cruise"]',                0),
  ('wp_aqua',         'yeosu', 'weekday',   '아쿠아플라넷',            32000, null,      '["aqua"]',                             1),
  ('sp_fireworks_bundle', 'yeosu', 'starlit', '불꽃유람선 + 요트',     60000, 'best',    '["fireworks_cruise","yacht"]',          0),
  ('sp_fireworks_cruise', 'yeosu', 'starlit', '불꽃유람선',            35000, null,      '["fireworks_cruise"]',                 1),
  ('fp_aqua_cable',   'yeosu', 'family',   '아쿠아플라넷 + 케이블카', 44000, 'best',    '["aqua","cablecar"]',                  0),
  ('fp_yeosu3pass',   'yeosu', 'family',   '여수3합 패스',            15000, 'popular', '["yeosu3pass"]',                       1),
  ('cp_yacht',        'yeosu', 'challenge', '요트 체험',              35000, 'best',    '["yacht"]',                            0),
  ('cp_fireworks_yacht','yeosu','challenge', '불꽃요트',               55000, null,      '["fireworks_yacht"]',                  1)
ON CONFLICT (product_code) DO NOTHING;

-- ── product_benefits (연결 테이블) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS dt_product_benefits (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID    NOT NULL REFERENCES dt_products(id) ON DELETE RESTRICT,
  benefit_id     UUID    NOT NULL REFERENCES dt_benefits(id) ON DELETE RESTRICT,
  display_order  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, benefit_id)
);
CREATE INDEX IF NOT EXISTS idx_pb_product ON dt_product_benefits(product_id, display_order);
