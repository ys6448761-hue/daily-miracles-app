-- Migration 112: partner_applications — Aurora5 면접 컬럼 추가
-- 기존 106 테이블에 면접 답변 + 심사 결과 컬럼 추가

ALTER TABLE partner_applications
  ADD COLUMN IF NOT EXISTS owner_name          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS region_code         VARCHAR(30)  DEFAULT 'KR_YEOSU',
  ADD COLUMN IF NOT EXISTS q1_space_intro      TEXT,
  ADD COLUMN IF NOT EXISTS q2_wish_connection  TEXT,
  ADD COLUMN IF NOT EXISTS q3_galaxy_choice    VARCHAR(20),
  ADD COLUMN IF NOT EXISTS q4_promise          TEXT,
  ADD COLUMN IF NOT EXISTS q5_operations       JSONB,
  ADD COLUMN IF NOT EXISTS aurora_score        INT          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS aurora_verdict      VARCHAR(20)  DEFAULT 'pending'
    CHECK (aurora_verdict IN ('pending','approved','rejected','manual')),
  ADD COLUMN IF NOT EXISTS aurora_reason       TEXT,
  ADD COLUMN IF NOT EXISTS galaxy_assigned     VARCHAR(20),
  ADD COLUMN IF NOT EXISTS account_created_at  TIMESTAMP    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS decided_at          TIMESTAMP    DEFAULT NULL;

-- 기존 rows 기본값 보정
UPDATE partner_applications
   SET aurora_verdict = 'pending'
 WHERE aurora_verdict IS NULL;

-- 심사 결과 인덱스
CREATE INDEX IF NOT EXISTS idx_partner_applications_verdict
  ON partner_applications(aurora_verdict, applied_at DESC);
