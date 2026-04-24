-- 143_star_logs_timeline.sql
-- star_logs: message 컬럼 추가 + action_type CHECK 제약 확장
-- "이 별의 흐름" 타임라인 UI 지원

-- 기존 CHECK 제약 제거 (action_type 확장: connected, star_resonance_level_up 허용)
ALTER TABLE star_logs DROP CONSTRAINT IF EXISTS star_logs_action_type_check;

-- message 컬럼 추가 (UI 표시용 한국어 문장)
ALTER TABLE star_logs ADD COLUMN IF NOT EXISTS message VARCHAR(200);
