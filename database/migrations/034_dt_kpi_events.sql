-- Migration 034: DreamTown KPI 이벤트 로그 테이블
--
-- 목적: 서버 사이드 KPI 이벤트 영속 로그
--   resonance_created, impact_created, resonance_received, connection_completed
--
-- 공통 필드:
--   event_name   — 이벤트 종류 (SSOT: services/kpiEventEmitter.js)
--   user_id      — 이벤트 발생 주체 (anonymous_token 포함)
--   star_id      — 관련 별 UUID
--   wish_id      — 관련 소원 UUID
--   visibility   — 'public' | 'hidden'
--   safety_band  — 'GREEN' | 'YELLOW' | 'RED'
--   source       — emit 지점 식별자 (route 이름 등)
--   extra        — 이벤트별 추가 데이터 (JSONB)

CREATE TABLE IF NOT EXISTS dt_kpi_events (
  id          BIGSERIAL PRIMARY KEY,
  event_name  VARCHAR(50)  NOT NULL,
  user_id     TEXT,
  star_id     TEXT,
  wish_id     TEXT,
  visibility  VARCHAR(10),
  safety_band VARCHAR(10),
  source      VARCHAR(50),
  extra       JSONB,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dt_kpi_events_name_ts
  ON dt_kpi_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dt_kpi_events_star
  ON dt_kpi_events (star_id)
  WHERE star_id IS NOT NULL;
