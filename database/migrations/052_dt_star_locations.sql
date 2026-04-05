-- 052_dt_star_locations.sql
-- 별에 지리적 위치를 1:1 할당 (wish_id 해시 기반 결정론적 배치)

CREATE TABLE IF NOT EXISTS star_locations (
  id           SERIAL        PRIMARY KEY,
  star_id      UUID          NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  zone_code    VARCHAR(10)   NOT NULL REFERENCES star_zones(zone_code),
  slot_number  INT           NOT NULL,
  lat          DECIMAL(10,7) NOT NULL,
  lng          DECIMAL(10,7) NOT NULL,

  is_activated BOOLEAN       DEFAULT false,
  activated_at TIMESTAMP,

  is_visible   BOOLEAN       DEFAULT false,

  created_at   TIMESTAMP     DEFAULT NOW(),

  UNIQUE(zone_code, slot_number),
  UNIQUE(star_id)               -- 별 1개 = 위치 1개
);

CREATE INDEX IF NOT EXISTS idx_star_locations_zone ON star_locations(zone_code);
CREATE INDEX IF NOT EXISTS idx_star_locations_star ON star_locations(star_id);
