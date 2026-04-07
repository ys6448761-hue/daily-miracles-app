-- 064_journeys_route_code.sql
-- DreamTown journeys 테이블 생성 + route_catalog FK 연결

CREATE TABLE IF NOT EXISTS journeys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT        NOT NULL,
  route_code   VARCHAR(80) REFERENCES route_catalog(route_code),
  started_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_journeys_user_id    ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_route_code ON journeys(route_code);
