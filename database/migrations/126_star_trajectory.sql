-- 126_star_trajectory.sql
-- 별의 궤적 시스템: daily_logs + travel_logs + timeline_summary

-- A. 일상 기반 성장 기록 (life_spot_logs → star 연결)
CREATE TABLE IF NOT EXISTS star_daily_logs (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID      NOT NULL,
  star_id         UUID      NOT NULL,
  log_date        DATE      NOT NULL DEFAULT CURRENT_DATE,
  state           VARCHAR(30),
  emotion_signal  VARCHAR(50),
  help_tag        VARCHAR(30),
  growth_sentence VARCHAR(100),
  life_spot_id    UUID      NULL,
  source_log_id   UUID      NULL,  -- life_spot_logs.id
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_daily_user   ON star_daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_star_daily_star   ON star_daily_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_star_daily_date   ON star_daily_logs(log_date DESC);

-- B. 여행 기반 경험 기록
CREATE TABLE IF NOT EXISTS star_travel_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL,
  star_id         UUID        NOT NULL,
  place_type      VARCHAR(30),           -- cablecar / hotel / cafe / food / leisure
  place_name      VARCHAR(100),
  visited_at      TIMESTAMP   DEFAULT NOW(),
  state           VARCHAR(30),
  emotion_signal  VARCHAR(50),
  help_tag        VARCHAR(30),
  growth_sentence VARCHAR(100),
  created_at      TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_travel_user  ON star_travel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_star_travel_star  ON star_travel_logs(star_id);

-- C. 별 현재 상태 요약 (UI 직결)
CREATE TABLE IF NOT EXISTS star_timeline_summary (
  star_id            UUID        PRIMARY KEY,
  current_phase      VARCHAR(30) DEFAULT '시작',
  last_7d_pattern    JSONB       DEFAULT '{}'::jsonb,
  last_30d_pattern   JSONB       DEFAULT '{}'::jsonb,
  dominant_state     VARCHAR(30),
  dominant_help_tag  VARCHAR(30),
  growth_score       INT         DEFAULT 0,
  updated_at         TIMESTAMP   DEFAULT NOW()
);
