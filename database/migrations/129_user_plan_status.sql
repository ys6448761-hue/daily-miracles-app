-- 129_user_plan_status.sql
-- Day 8 전환: 사용자 플랜 상태 관리

CREATE TABLE IF NOT EXISTS user_plan_status (
  user_id         UUID        PRIMARY KEY,
  plan_type       VARCHAR(20) DEFAULT 'free', -- free / lite / flow / paused
  plan_started_at TIMESTAMP   NULL,
  trial_ended_at  TIMESTAMP   NULL,
  created_at      TIMESTAMP   DEFAULT NOW(),
  updated_at      TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_type ON user_plan_status(plan_type);
