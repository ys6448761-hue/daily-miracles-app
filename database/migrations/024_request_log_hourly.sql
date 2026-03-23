-- Migration 024: request_log_hourly
-- AIL-2026-0301-OPS-ERR-REPORT-002
-- 시간별 HTTP 요청/에러 집계를 영속화하여
-- daily-error-report.js (Render Cron)가 앱 재시작 후에도 24h 데이터를 읽을 수 있게 한다.

CREATE TABLE IF NOT EXISTS request_log_hourly (
  id              SERIAL        PRIMARY KEY,
  hour_bucket     TIMESTAMPTZ   NOT NULL UNIQUE,  -- 해당 시간의 시작 (분/초=0으로 truncate)
  total_requests  INTEGER       NOT NULL DEFAULT 0,
  error_count     INTEGER       NOT NULL DEFAULT 0,
  error_rate      NUMERIC(6,4)  NOT NULL DEFAULT 0,  -- 0.0000 ~ 1.0000
  top_error_class TEXT,
  top_endpoint    TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rph_hour_bucket
  ON request_log_hourly(hour_bucket DESC);

COMMENT ON TABLE request_log_hourly IS
  'Hourly aggregated HTTP request/error stats. Flushed by reportScheduler every 60 min. Read by daily-error-report.js cron.';
