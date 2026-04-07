-- 061_journey_logs.sql
-- DreamTown 항로 Lite 로그 테이블
-- journey_id: 클라이언트가 생성하는 세션 식별자 (UUID)

CREATE TABLE IF NOT EXISTS journey_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id  UUID        NOT NULL,
  emotion     VARCHAR(50),
  help_type   VARCHAR(50),
  growth_line TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journey_logs_journey_id ON journey_logs(journey_id);
