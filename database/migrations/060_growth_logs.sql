-- 060_growth_logs.sql
-- 별 성장 로그 테이블 (Day 7/30/100/365 구조화된 기록)
-- 기존 dt_stars.growth_log_text 컬럼과 별도 운영

CREATE TABLE IF NOT EXISTS growth_logs (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id        UUID        NOT NULL REFERENCES dt_stars(id),
  day_type       INTEGER     NOT NULL,   -- 7 | 30 | 100 | 365
  emotion_tag    VARCHAR(50),
  help_tag       VARCHAR(50),
  growth_message TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_growth_logs_star_id  ON growth_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_growth_logs_day_type ON growth_logs(day_type);
