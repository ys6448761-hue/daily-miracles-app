-- 090_agent_metrics.sql
-- Claude Code Aurora 5 KPI 측정 — 재시도율 / 턴 수 / 토큰 사용량

CREATE TABLE IF NOT EXISTS agent_metrics (
  id          SERIAL      PRIMARY KEY,
  task_id     TEXT        NOT NULL,
  event_type  VARCHAR(30) NOT NULL
              CHECK (event_type IN ('task_start','task_retry','task_complete','response_metrics')),
  value       JSONB       NOT NULL DEFAULT '{}',
  session_id  TEXT,                        -- 대화 세션 식별 (선택)
  operator    VARCHAR(30) DEFAULT 'aurora5', -- 누가 기록했는지
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_task     ON agent_metrics(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_type     ON agent_metrics(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_created  ON agent_metrics(created_at DESC);

-- ── KPI 분석 뷰 ────────────────────────────────────────────────────
CREATE OR REPLACE VIEW agent_kpi_summary AS
SELECT
  -- 재시도율
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'task_retry')::numeric
    / NULLIF(COUNT(*) FILTER (WHERE event_type = 'task_start'), 0) * 100, 1
  ) AS retry_rate_pct,

  -- 평균 턴 수
  ROUND(
    AVG((value->>'turns')::int) FILTER (WHERE event_type = 'task_complete'), 1
  ) AS avg_turns,

  -- 평균 응답 길이 (토큰 proxy)
  ROUND(
    AVG((value->>'response_length')::int) FILTER (WHERE event_type = 'response_metrics'), 0
  ) AS avg_response_length,

  -- 완료 작업 수
  COUNT(*) FILTER (WHERE event_type = 'task_complete') AS total_tasks_completed,

  -- 총 재시도 수
  COUNT(*) FILTER (WHERE event_type = 'task_retry') AS total_retries,

  -- 평균 작업 시간(초)
  ROUND(
    AVG((value->>'duration_sec')::int) FILTER (WHERE event_type = 'task_complete'), 0
  ) AS avg_duration_sec

FROM agent_metrics
WHERE created_at >= NOW() - INTERVAL '7 days';
