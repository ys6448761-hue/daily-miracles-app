-- Migration 031: resonance.star_id, impact.star_id INTEGER → TEXT (UUID 호환)
-- 030에서 INTEGER로 정의했으나 dt_stars PK가 UUID(TEXT)이므로 타입 수정

ALTER TABLE resonance ALTER COLUMN star_id TYPE TEXT USING star_id::TEXT;
ALTER TABLE impact    ALTER COLUMN star_id TYPE TEXT USING star_id::TEXT;
