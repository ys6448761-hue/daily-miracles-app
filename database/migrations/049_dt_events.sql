-- 049_dt_events.sql
-- DreamTown 사용자 행동 이벤트 수집 테이블
-- SSOT: docs/ssot/core/DreamTown_Event_SSOT.md

CREATE TABLE IF NOT EXISTS dt_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name  TEXT        NOT NULL,
  user_id     TEXT,
  params      JSONB       NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_events_event_name  ON dt_events (event_name);
CREATE INDEX IF NOT EXISTS idx_dt_events_user_id     ON dt_events (user_id);
CREATE INDEX IF NOT EXISTS idx_dt_events_created_at  ON dt_events (created_at DESC);
