-- 072_recall_exposures.sql
-- 과거 속삭임 재등장 이력 테이블
-- 같은 문장 반복 노출 방지 + 하루 1회 제한

CREATE TABLE IF NOT EXISTS recall_exposures (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id    UUID        NOT NULL,
  source_log_id UUID        NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recall_journey_date
  ON recall_exposures(journey_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recall_source
  ON recall_exposures(journey_id, source_log_id);
