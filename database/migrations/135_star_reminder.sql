-- Migration 135: Star Reminder System
-- star_promises에 알림 상태 컬럼 추가 + reminder_logs 테이블 생성

-- stars 테이블: 알림 발송용 전화번호
ALTER TABLE stars
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- star_promises 테이블: 리마인더 상태
ALTER TABLE star_promises
  ADD COLUMN IF NOT EXISTS reminder_opt_in   BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reminder_status   VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (reminder_status IN ('pending', 'sent', 'failed', 'skipped')),
  ADD COLUMN IF NOT EXISTS target_date       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_reminded_at  TIMESTAMPTZ;

-- 기존 rows에 target_date 소급 계산 (type 기준)
UPDATE star_promises SET target_date =
  CASE type
    WHEN '3m'  THEN created_at + INTERVAL '3 months'
    WHEN '6m'  THEN created_at + INTERVAL '6 months'
    WHEN '12m' THEN created_at + INTERVAL '12 months'
  END
WHERE target_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_star_promises_reminder
  ON star_promises (reminder_status, target_date)
  WHERE reminder_opt_in = TRUE;

-- 발송 이력 로그
CREATE TABLE IF NOT EXISTS reminder_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  promise_id   UUID        NOT NULL REFERENCES star_promises(id) ON DELETE CASCADE,
  star_id      UUID        NOT NULL REFERENCES stars(id)         ON DELETE CASCADE,
  remind_type  VARCHAR(20) NOT NULL DEFAULT 'due',
  status       VARCHAR(20) NOT NULL DEFAULT 'sent',
  detail       JSONB,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminder_logs_promise_id ON reminder_logs (promise_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at    ON reminder_logs (sent_at);
