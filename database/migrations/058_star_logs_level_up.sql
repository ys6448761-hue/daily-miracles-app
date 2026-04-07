-- 058_star_logs_level_up.sql
-- star_logs에 payload 컬럼 추가 + level_up 이벤트 타입 허용
-- Created: 2026-04-06

-- ① payload 컬럼 추가
ALTER TABLE star_logs
  ADD COLUMN IF NOT EXISTS payload JSONB;

-- ② CHECK 제약 교체 (star_resonance_level_up 추가)
ALTER TABLE star_logs
  DROP CONSTRAINT IF EXISTS star_logs_action_type_check;

ALTER TABLE star_logs
  ADD CONSTRAINT star_logs_action_type_check
    CHECK (action_type IN ('resonance', 'record', 'star_resonance_level_up'));
