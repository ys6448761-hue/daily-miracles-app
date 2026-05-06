-- 156_stars_ssot_columns.sql
-- 기존 stars 테이블에 SSOT v1 컬럼 추가 정렬

ALTER TABLE stars ADD COLUMN IF NOT EXISTS wish_summary TEXT;
ALTER TABLE stars ADD COLUMN IF NOT EXISTS image_url    TEXT;
ALTER TABLE stars ADD COLUMN IF NOT EXISTS gem          VARCHAR(20);
ALTER TABLE stars ADD COLUMN IF NOT EXISTS is_shared    BOOLEAN DEFAULT FALSE;

-- 기존 데이터 마이그레이션
UPDATE stars SET gem       = gem_type  WHERE gem IS NULL AND gem_type IS NOT NULL;
UPDATE stars SET is_shared = is_public WHERE is_shared = FALSE AND is_public = TRUE;
