-- 128_star_care_schedule.sql
-- 7일 케어 스케줄러: 별 생성 → D+1~D+7 감정 케어 메시지

CREATE TABLE IF NOT EXISTS star_care_schedule (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL,
  star_id       UUID        NOT NULL,
  phone_number  VARCHAR(20) NULL,        -- SMS 발송용 (없으면 in-app only)
  day           INT         NOT NULL,    -- 1~7
  scheduled_at  TIMESTAMP   NOT NULL,
  executed      BOOLEAN     DEFAULT FALSE,
  sent_at       TIMESTAMP   NULL,
  send_type     VARCHAR(20) NULL,        -- 'inapp' | 'sms' | 'skipped'
  created_at    TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_care_user    ON star_care_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_care_star    ON star_care_schedule(star_id);
CREATE INDEX IF NOT EXISTS idx_care_pending ON star_care_schedule(scheduled_at, executed)
  WHERE executed = FALSE;

-- unique: 별 1개 × day 1개 (중복 방지)
CREATE UNIQUE INDEX IF NOT EXISTS idx_care_star_day ON star_care_schedule(star_id, day);
