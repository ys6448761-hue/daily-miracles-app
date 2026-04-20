-- 133_star_logs_patch.sql
-- star_logs 테이블이 migration 124로 먼저 생성된 경우
-- action_type / payload 컬럼 누락 패치 + 인덱스 보정
-- migration 057/058이 CREATE TABLE IF NOT EXISTS로 스킵된 환경 대상

ALTER TABLE star_logs
  ADD COLUMN IF NOT EXISTS action_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS payload     JSONB;

-- action_type 인덱스 (057에서 실패하던 것)
CREATE INDEX IF NOT EXISTS idx_star_logs_action_created
  ON star_logs(action_type, created_at);
