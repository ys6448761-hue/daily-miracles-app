-- Migration 036: feedback_events 테이블
--
-- 목적: 공명 후 경량 피드백 수집 (설문 아닌 행동 직후 감정 기록)
-- 원칙: feeling_type 선택형 중심, comment 선택, 최소 3초 완료

CREATE TABLE IF NOT EXISTS feedback_events (
  id           SERIAL       PRIMARY KEY,
  user_id      TEXT,
  star_id      TEXT,
  feeling_type TEXT,
  reason       TEXT,
  comment      TEXT,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_events_star
  ON feedback_events (star_id)
  WHERE star_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_events_ts
  ON feedback_events (created_at DESC);

-- dt_kpi_events 인덱스 보강 (star_id + event_name 복합, 대시보드 쿼리 가속)
CREATE INDEX IF NOT EXISTS idx_dt_kpi_events_star_event
  ON dt_kpi_events (star_id, event_name)
  WHERE star_id IS NOT NULL;
