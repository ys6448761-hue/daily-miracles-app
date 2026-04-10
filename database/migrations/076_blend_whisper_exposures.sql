-- 076_blend_whisper_exposures.sql
-- 집단지성 블렌드 속삭임 노출 이력
-- journey_id별 오늘 노출 1회 제한 + 문장 반복 방지

CREATE TABLE IF NOT EXISTS blend_whisper_exposures (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id     UUID        NOT NULL,
  source_text_id UUID,                    -- 원본 journey_logs.id (nullable: 집단지성 소스 추적용)
  delivered_text TEXT        NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blend_whisper_journey
  ON blend_whisper_exposures(journey_id);

CREATE INDEX IF NOT EXISTS idx_blend_whisper_created_at
  ON blend_whisper_exposures(created_at DESC);
