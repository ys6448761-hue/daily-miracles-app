-- migration 165: connections — 부모→자식 별 연결 정식 기록
CREATE TABLE IF NOT EXISTS connections (
  id                 BIGSERIAL PRIMARY KEY,
  parent_access_key  TEXT      NOT NULL,
  child_access_key   TEXT      NOT NULL UNIQUE,
  journey_id         UUID,
  first_visit_at     TIMESTAMP,
  connected_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connections_parent     ON connections (parent_access_key);
CREATE INDEX IF NOT EXISTS idx_connections_journey_id ON connections (journey_id) WHERE journey_id IS NOT NULL;
