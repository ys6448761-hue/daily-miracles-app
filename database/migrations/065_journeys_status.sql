-- 065_journeys_status.sql
-- journeys 테이블에 status 컬럼 추가
-- 상태: STARTED | COMPLETED | CANCELLED

ALTER TABLE journeys
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'STARTED'
    CHECK (status IN ('STARTED', 'COMPLETED', 'CANCELLED'));

CREATE INDEX IF NOT EXISTS idx_journeys_user_status ON journeys(user_id, status);
