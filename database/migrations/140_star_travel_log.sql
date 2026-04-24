-- Migration 140: star_travel_log — 여행 선택 기록 (별 성장 연결)
CREATE TABLE IF NOT EXISTS star_travel_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id     UUID        NOT NULL,
  place       VARCHAR(100) NOT NULL,
  emotion     VARCHAR(20)  NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_travel_log_star_id ON star_travel_log (star_id);
