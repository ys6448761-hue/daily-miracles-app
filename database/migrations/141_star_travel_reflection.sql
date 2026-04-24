-- Migration 141: star_travel_reflection — 여행 이후 별 변화 기록
CREATE TABLE IF NOT EXISTS star_travel_reflection (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id       UUID        NOT NULL,
  emotion_label VARCHAR(30) NOT NULL,
  meaning_label VARCHAR(50) NOT NULL,
  change_label  VARCHAR(50) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_travel_reflection_star_id ON star_travel_reflection (star_id);
