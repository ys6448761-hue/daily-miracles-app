-- 070_resonance_engine.sql
-- DreamTown 팬덤 엔진: 공명(Resonance) 시스템

-- journey_logs 공명 관련 컬럼 추가
ALTER TABLE journey_logs
  ADD COLUMN IF NOT EXISTS is_shareable          BOOLEAN   DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS resonance_used_count  INT       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_resonated_at     TIMESTAMPTZ;

-- 공명 노출 기록 테이블
CREATE TABLE IF NOT EXISTS resonance_exposures (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_journey_id UUID       NOT NULL,
  source_log_id    UUID        NOT NULL,
  exposure_type    TEXT        DEFAULT 'feed',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resonance_viewer ON resonance_exposures(viewer_journey_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resonance_source ON resonance_exposures(source_log_id);
