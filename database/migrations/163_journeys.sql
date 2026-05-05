-- migration 163: journeys — 별 여정 정식 엔티티
-- journey_id on stars references journeys.id (soft FK)
CREATE TABLE IF NOT EXISTS journeys (
  id               UUID    PRIMARY KEY,
  root_access_key  TEXT    NOT NULL,
  origin_location  TEXT,
  star_count       INT     NOT NULL DEFAULT 1,
  started_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  last_active_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_journeys_root_access_key ON journeys (root_access_key);
CREATE INDEX        IF NOT EXISTS idx_journeys_last_active     ON journeys (last_active_at DESC);
