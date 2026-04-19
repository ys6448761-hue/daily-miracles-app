-- 127_user_events.sql
-- Star Page / Journey 사용자 반응 이벤트 수집
-- (dt_events 와 별도 — Journey 엔진 전용)

CREATE TABLE IF NOT EXISTS user_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  event_type  VARCHAR(50) NOT NULL,
  metadata    JSONB       DEFAULT '{}'::jsonb,
  created_at  TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user    ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type    ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);
