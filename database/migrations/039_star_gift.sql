-- Migration 039: dt_stars 선물하기 컬럼 추가
-- AIL-DT-008: Star Gift — 바이럴 루프 구현
-- gift_copy_type 허용값: 'lover' | 'parent' | 'friend'

ALTER TABLE dt_stars ADD COLUMN IF NOT EXISTS is_gifted       BOOLEAN      DEFAULT false;
ALTER TABLE dt_stars ADD COLUMN IF NOT EXISTS gifted_at       TIMESTAMP;
ALTER TABLE dt_stars ADD COLUMN IF NOT EXISTS gift_copy_type  VARCHAR(20);
ALTER TABLE dt_stars ADD COLUMN IF NOT EXISTS gift_view_count INTEGER      DEFAULT 0;
