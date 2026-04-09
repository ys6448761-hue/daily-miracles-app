-- 092_star_profile.sql
-- star_profile — 별에 쌓이는 모든 성장 데이터 (누적 원장)
--
-- origin  : 소원 기원 정보 (gem, 감정)
-- growth  : 7일 여정 기록 (day1_start, day7_complete, log_count, last_emotion)
-- route   : 항로 정보 (galaxy, stage)
-- impact  : 나눔/공명 결과 (resonance_count, share_count)
--
-- upsert 패턴: INSERT ... ON CONFLICT (user_id, star_id) DO UPDATE
--   → 별마다 단 하나의 행, JSONB merge로 누적

CREATE TABLE IF NOT EXISTS star_profile (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT         NOT NULL,
  star_id     TEXT         NOT NULL,
  origin      JSONB        NOT NULL DEFAULT '{}',
  growth      JSONB        NOT NULL DEFAULT '{}',
  route       JSONB        NOT NULL DEFAULT '{}',
  impact      JSONB        NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, star_id)
);

CREATE INDEX IF NOT EXISTS idx_star_profile_user ON star_profile (user_id);
