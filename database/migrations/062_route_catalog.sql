-- 062_route_catalog.sql
-- DreamTown 항로 카탈로그 SSOT
-- 항로는 여행상품이 아니라 "의미 있는 경험 흐름"이다.
-- 숙박은 항로에 붙는 확장 레이어이며, 기본 조건이 아니다.

CREATE TABLE IF NOT EXISTS route_catalog (
  route_code       VARCHAR(80)  PRIMARY KEY,
  route_name       VARCHAR(100) NOT NULL,
  route_family     VARCHAR(20)  NOT NULL CHECK (route_family IN ('galaxy', 'miracle')),
  galaxy_axis      VARCHAR(10)  CHECK (galaxy_axis IN ('north', 'east', 'west', 'south')),
  theme            VARCHAR(50)  NOT NULL,
  supports_daytrip BOOLEAN      NOT NULL DEFAULT TRUE,
  supports_stay    BOOLEAN      NOT NULL DEFAULT FALSE,
  stay_options     INTEGER[]    NOT NULL DEFAULT '{}',  -- 0=당일, 1=1박2일, 2=2박3일
  active           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

-- seed: 북은하 도전 항로
INSERT INTO route_catalog
  (route_code, route_name, route_family, galaxy_axis, theme, supports_daytrip, supports_stay, stay_options)
VALUES
  ('north_challenge_core', '북은하 도전 항로', 'galaxy', 'north', 'challenge', TRUE, TRUE, ARRAY[0,1,2])
ON CONFLICT (route_code) DO NOTHING;

-- seed: 기적항로 (관성 친화형 입문, 은하 항로 브리지)
INSERT INTO route_catalog
  (route_code, route_name, route_family, galaxy_axis, theme, supports_daytrip, supports_stay, stay_options)
VALUES
  ('miracle_intro_route', '기적항로', 'miracle', NULL, 'general_entry', TRUE, TRUE, ARRAY[0,1,2])
ON CONFLICT (route_code) DO NOTHING;
