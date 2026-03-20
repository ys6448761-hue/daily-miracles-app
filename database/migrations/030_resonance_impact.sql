-- Migration 030: 공명 & 나눔 시스템 MVP
-- resonance_type: relief(숨이 놓였어요) | belief(믿고 싶어졌어요) | clarity(정리됐어요) | courage(용기났어요)
-- impact_type:    gratitude(감사나눔) | wisdom(지혜나눔) | miracle(기적나눔)

CREATE TABLE IF NOT EXISTS resonance (
  resonance_id  SERIAL       PRIMARY KEY,
  star_id       INTEGER      NOT NULL,
  user_id       TEXT,
  resonance_type VARCHAR(20) NOT NULL CHECK (resonance_type IN ('relief','belief','clarity','courage')),
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_resonance_star_id ON resonance(star_id);
CREATE INDEX IF NOT EXISTS idx_resonance_user_star ON resonance(user_id, star_id);

CREATE TABLE IF NOT EXISTS impact (
  impact_id    SERIAL       PRIMARY KEY,
  star_id      INTEGER      NOT NULL,
  impact_type  VARCHAR(20)  NOT NULL CHECK (impact_type IN ('gratitude','wisdom','miracle')),
  count        INTEGER      DEFAULT 1,
  created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (star_id, impact_type)
);

CREATE INDEX IF NOT EXISTS idx_impact_star_id ON impact(star_id);
