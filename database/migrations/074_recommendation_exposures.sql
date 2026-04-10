-- 074_recommendation_exposures.sql
-- 추천 카드 노출 이력 — 반복 방지용

CREATE TABLE IF NOT EXISTS recommendation_exposures (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id        UUID        NOT NULL,
  recommendation_id TEXT        NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rec_exposures_journey
  ON recommendation_exposures(journey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rec_exposures_rec_id
  ON recommendation_exposures(journey_id, recommendation_id);
