-- 091_dreamtown_flow.sql
-- DreamTown 전체 흐름 이벤트 로그 (Full Loop SSOT)
--
-- stages: wish / star / growth / resonance / impact / connection
-- 기존 테이블(wish_entries, dt_stars, journey_logs 등)과 연동 집계용

CREATE TABLE IF NOT EXISTS dreamtown_flow (
  id          SERIAL PRIMARY KEY,
  user_id     TEXT        NOT NULL,
  stage       VARCHAR(20) NOT NULL CHECK (stage IN ('wish','star','growth','resonance','impact','connection')),
  action      VARCHAR(40) NOT NULL,
  value       JSONB       NOT NULL DEFAULT '{}',
  ref_id      TEXT,                          -- 연관 엔티티 ID (star_id, wish_id 등)
  session_id  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_flow_user     ON dreamtown_flow (user_id);
CREATE INDEX IF NOT EXISTS idx_dt_flow_stage    ON dreamtown_flow (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dt_flow_created  ON dreamtown_flow (created_at DESC);

-- ── KPI 집계 뷰 ──────────────────────────────────────────────────
-- 별 생성률 = star/create ÷ wish/create
-- 성장 지속률 = growth/day7_complete ÷ growth/day1_start
-- 공명 발생률 = resonance/* 고유 user_id ÷ 전체 활성 user_id
CREATE OR REPLACE VIEW dreamtown_kpi_7d AS
WITH period AS (
  SELECT NOW() - INTERVAL '7 days' AS since
),
wishes  AS (SELECT COUNT(DISTINCT user_id) AS n FROM dreamtown_flow, period WHERE stage='wish'      AND action='create'       AND created_at >= since),
stars   AS (SELECT COUNT(DISTINCT user_id) AS n FROM dreamtown_flow, period WHERE stage='star'      AND action='create'       AND created_at >= since),
day1    AS (SELECT COUNT(DISTINCT user_id) AS n FROM dreamtown_flow, period WHERE stage='growth'    AND action='day1_start'   AND created_at >= since),
day7    AS (SELECT COUNT(DISTINCT user_id) AS n FROM dreamtown_flow, period WHERE stage='growth'    AND action='day7_complete' AND created_at >= since),
res_u   AS (SELECT COUNT(DISTINCT user_id) AS n FROM dreamtown_flow, period WHERE stage='resonance'                          AND created_at >= since),
total_u AS (SELECT COUNT(DISTINCT user_id) AS n FROM dreamtown_flow, period WHERE                                               created_at >= since)
SELECT
  wishes.n                                                       AS wish_count,
  stars.n                                                        AS star_count,
  ROUND(stars.n::numeric  / NULLIF(wishes.n, 0) * 100, 1)       AS star_creation_rate,
  day1.n                                                         AS growth_day1_count,
  day7.n                                                         AS growth_day7_count,
  ROUND(day7.n::numeric   / NULLIF(day1.n, 0)  * 100, 1)        AS growth_persist_rate,
  res_u.n                                                        AS resonance_user_count,
  total_u.n                                                      AS total_active_users,
  ROUND(res_u.n::numeric  / NULLIF(total_u.n, 0) * 100, 1)      AS resonance_rate
FROM wishes, stars, day1, day7, res_u, total_u;
