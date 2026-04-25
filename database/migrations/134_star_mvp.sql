-- Migration 134: Star MVP — access_key + origin_location + star_promises
-- QR 진입 → 별 생성 → 약속 저장 → access_key 재방문 구조

-- stars 테이블 컬럼 추가 (migration 124 기반)
ALTER TABLE stars
  ADD COLUMN IF NOT EXISTS access_key       VARCHAR(12)  UNIQUE,
  ADD COLUMN IF NOT EXISTS origin_location  VARCHAR(50),
  ADD COLUMN IF NOT EXISTS emotion          VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_public        BOOLEAN      NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_stars_access_key ON stars (access_key);

-- 약속 테이블 (3개월/6개월/12개월 타임캡슐)
CREATE TABLE IF NOT EXISTS star_promises (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  star_id    UUID        NOT NULL REFERENCES stars(id) ON DELETE CASCADE,
  type       VARCHAR(3)  NOT NULL CHECK (type IN ('3m', '6m', '12m')),
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_star_promises_star_id ON star_promises (star_id);
