-- migration 148 — 별공방 장소 레지스트리 테이블
--
-- SSOT: config/locationRegistry.js (현재 소스)
-- 이 테이블은 향후 API 기반 동적 확장(어드민 UI, 다국어 등) 시 사용
--
-- code = stars.origin_location 저장값 (절대 변경 금지)
--
-- 코드 명명 규칙:
--   국내 MVP    : {descriptor}_{venue_type}
--   전국 확장   : {city}_{district}_{venue_type}{seq}
--   글로벌 확장 : {country}_{city}_{district}_{venue_type}{seq}

CREATE TABLE IF NOT EXISTS locations (
  code           TEXT        PRIMARY KEY,
  name_ko        TEXT        NOT NULL,
  city           TEXT,
  region         TEXT,
  country_code   TEXT        NOT NULL DEFAULT 'KR',
  venue_type     TEXT,
  status         TEXT        NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','testing','running','closed')),
  emoji          TEXT        DEFAULT '✦',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 현재 운영 장소 시드 (config/locationRegistry.js 와 동일)
INSERT INTO locations (code, name_ko, city, region, country_code, venue_type, status, emoji)
VALUES
  ('yeosu_cablecar', '여수 해상 케이블카', '여수', '전남', 'KR', 'landmark', 'testing', '🚡'),
  ('lattoa_cafe',    '라또아 카페',         '여수', '전남', 'KR', 'cafe',     'testing', '☕'),
  ('forestland',     '더 포레스트랜드',     NULL,   NULL,   'KR', 'resort',   'pending', '🌿'),
  ('paransi',        '파란시',              NULL,   NULL,   'KR', 'cafe',     'pending', '🌊')
ON CONFLICT (code) DO NOTHING;
