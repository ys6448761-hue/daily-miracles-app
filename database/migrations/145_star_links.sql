-- Migration 145: star_links — 감정 기반 별 연결 (Emotion Link MVP)
-- 같은 emotion을 가진 별들을 방향성 있게 연결

CREATE TABLE IF NOT EXISTS star_links (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  source_star_id UUID         NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
  target_star_id UUID         NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
  emotion        TEXT         NOT NULL,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_links_source  ON star_links (source_star_id);
CREATE INDEX IF NOT EXISTS idx_star_links_target  ON star_links (target_star_id);
CREATE INDEX IF NOT EXISTS idx_star_links_emotion ON star_links (emotion, created_at DESC);
