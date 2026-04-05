-- 053_dt_star_visits.sql
-- 사용자가 실제 위치에서 별을 방문한 기록 (미리 생성, 서비스 연결 대기)

CREATE TABLE IF NOT EXISTS star_visits (
  id            SERIAL        PRIMARY KEY,
  star_id       UUID,
  user_id       UUID,
  zone_code     VARCHAR(10),
  visited_at    TIMESTAMP     DEFAULT NOW(),
  lat_at_visit  DECIMAL(10,7),
  lng_at_visit  DECIMAL(10,7),
  created_at    TIMESTAMP     DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_visits_star    ON star_visits(star_id);
CREATE INDEX IF NOT EXISTS idx_star_visits_user    ON star_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_star_visits_zone    ON star_visits(zone_code);
