-- 132_journey_story.sql
-- 공개용 항해 장면 3단 구조 (처음/변화/지금) + 공개 여부
ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS journey_origin_public TEXT,
  ADD COLUMN IF NOT EXISTS journey_shift_public  TEXT,
  ADD COLUMN IF NOT EXISTS journey_now_public    TEXT,
  ADD COLUMN IF NOT EXISTS journey_visibility    TEXT DEFAULT 'private';
