-- Migration 122: 약속 기록 (Promise Records)
-- location_id 문자열 기반, 90일 시간 잠금, 사진 업로드 지원

CREATE TABLE IF NOT EXISTS promise_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      VARCHAR(100) NOT NULL,
  location_id  VARCHAR(100) NOT NULL,   -- 예: yeosu-cablecar, yeosu-aqua
  emotion_text TEXT NOT NULL,
  photo_url    VARCHAR(500),
  status       VARCHAR(20)  NOT NULL DEFAULT 'SEALED',  -- SEALED | OPEN
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  open_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '90 days',
  opened_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_promise_records_user_id     ON promise_records(user_id);
CREATE INDEX IF NOT EXISTS idx_promise_records_location_id ON promise_records(location_id);
