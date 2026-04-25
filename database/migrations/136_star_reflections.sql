-- Migration 136: star_reflections — 재방문 시 현재 상태 기록
CREATE TABLE IF NOT EXISTS star_reflections (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id    UUID        NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
  status     VARCHAR(20) NOT NULL CHECK (status IN ('closer', 'same', 'changed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_reflections_star_id ON star_reflections (star_id);
