-- 071_connection_exposures.sql
-- DreamTown 연결(Connection) 단계 — 생애 1회 노출 기록

CREATE TABLE IF NOT EXISTS connection_exposures (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID        NOT NULL UNIQUE, -- 생애 1회 보장
  source     TEXT        NOT NULL DEFAULT 'connection_stage',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_connection_exposures_journey ON connection_exposures(journey_id);
