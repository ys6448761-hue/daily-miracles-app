-- 069_journey_logs_whisper_cols.sql
-- 별들의 속삭임: journey_logs에 growth_text, context_tag 컬럼 추가

ALTER TABLE journey_logs
  ADD COLUMN IF NOT EXISTS growth_text  TEXT,
  ADD COLUMN IF NOT EXISTS context_tag  TEXT;

COMMENT ON COLUMN journey_logs.growth_text IS '별들의 속삭임: 사용자가 스쳐간 생각을 짧게 남긴 텍스트';
COMMENT ON COLUMN journey_logs.context_tag IS '입력 맥락 태그 (morning_commute, before_sleep, moving, alone)';
