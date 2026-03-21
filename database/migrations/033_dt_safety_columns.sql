-- Migration 033: DreamTown 안전 컬럼 추가
-- dt_wishes.safety_level  — GREEN(기본) / YELLOW / RED
-- dt_stars.is_hidden       — 공개 여부 (TRUE = 광장에서 숨김)

ALTER TABLE dt_wishes
  ADD COLUMN IF NOT EXISTS safety_level VARCHAR(10) NOT NULL DEFAULT 'GREEN';

ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN NOT NULL DEFAULT FALSE;

-- 조회 성능 (광장 목록에서 is_hidden=FALSE 필터링)
CREATE INDEX IF NOT EXISTS idx_dt_stars_hidden ON dt_stars (is_hidden, created_at ASC);
