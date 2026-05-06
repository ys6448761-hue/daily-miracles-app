-- 149_star_memories.sql
-- 별이 기억하는 로그 — 사용자가 기록하는 게 아니라 시스템이 기억하는 구조

CREATE TABLE IF NOT EXISTS star_memories (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id    UUID         REFERENCES stars(id),
  type       VARCHAR(50),  -- growth_reaction 등 시스템 이벤트 유형
  emotion    VARCHAR(50),
  reaction   TEXT,
  created_at TIMESTAMP    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_memories_star_id ON star_memories (star_id);
