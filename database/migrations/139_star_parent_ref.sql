-- 139_star_parent_ref.sql
-- 공유 연결 추적: 어떤 별의 공유 링크로 유입됐는지 기록
ALTER TABLE stars ADD COLUMN IF NOT EXISTS parent_ref TEXT;
CREATE INDEX IF NOT EXISTS idx_stars_parent_ref ON stars (parent_ref) WHERE parent_ref IS NOT NULL;
