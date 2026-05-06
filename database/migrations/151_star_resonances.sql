-- 151_star_resonances.sql
-- 공명 이벤트 원장 — 좋아요가 아닌 공명

CREATE TABLE IF NOT EXISTS star_resonances (
  id         UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id    UUID      REFERENCES stars(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_resonances_star_id ON star_resonances (star_id);
