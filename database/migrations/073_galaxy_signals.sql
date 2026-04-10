-- 073_galaxy_signals.sql
-- Galaxy Signal 테이블 — 사용자 반복 신호 축적
-- whisper 저장 시 context / emotion / length 신호 자동 누적

CREATE TABLE IF NOT EXISTS galaxy_signals (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id   UUID        NOT NULL,
  signal_type  TEXT        NOT NULL CHECK (signal_type IN ('context','emotion','length')),
  signal_key   TEXT        NOT NULL,
  signal_value FLOAT       NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_galaxy_signals_journey
  ON galaxy_signals(journey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_galaxy_signals_key
  ON galaxy_signals(journey_id, signal_type, signal_key);
