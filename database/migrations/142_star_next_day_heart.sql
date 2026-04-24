-- Migration 142: star_next_day_heart — 다음날의 마음 (별 생성 +1일)
CREATE TABLE IF NOT EXISTS star_next_day_heart (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID        NOT NULL,
  choice      VARCHAR(30) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT  star_next_day_heart_star_uniq UNIQUE (star_id)
);

CREATE INDEX IF NOT EXISTS idx_star_next_day_heart_star_id ON star_next_day_heart (star_id);
