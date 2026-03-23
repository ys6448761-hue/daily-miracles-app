-- Migration 043: dt_voyage_schedule — DreamTown 7일 응원 스케줄
-- 별 탄생 시 D+1~D+7 Aurora5 메시지를 스케줄로 저장
-- scheduled_at = (별 탄생일 KST + N일) 08:00 KST

CREATE TABLE IF NOT EXISTS dt_voyage_schedule (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  star_id         UUID        NOT NULL REFERENCES dt_stars(id) ON DELETE CASCADE,
  user_id         UUID,
  phone_number    TEXT,
  day_number      INTEGER     NOT NULL CHECK (day_number BETWEEN 1 AND 7),
  message_text    TEXT        NOT NULL,
  wisdom_tag      TEXT        CHECK (wisdom_tag IN ('자기다스림','버팀','관계','때','실천','의미','나눔','리더십')),
  scheduled_at    TIMESTAMPTZ NOT NULL,
  sent_at         TIMESTAMPTZ,
  is_shown_in_app BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (star_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_dt_voyage_schedule_star
  ON dt_voyage_schedule(star_id);

-- 미발송 레코드를 scheduled_at 기준으로 빠르게 조회
CREATE INDEX IF NOT EXISTS idx_dt_voyage_schedule_pending
  ON dt_voyage_schedule(scheduled_at)
  WHERE sent_at IS NULL;
