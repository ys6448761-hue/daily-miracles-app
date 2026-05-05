-- migration 164: visits — 공유 링크 방문 정식 기록 (journey_id 포함)
CREATE TABLE IF NOT EXISTS visits (
  id             BIGSERIAL PRIMARY KEY,
  ref_access_key TEXT      NOT NULL,
  journey_id     UUID,
  visited_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visits_ref_access_key ON visits (ref_access_key);
CREATE INDEX IF NOT EXISTS idx_visits_journey_id     ON visits (journey_id) WHERE journey_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visits_visited_at     ON visits (visited_at DESC);
