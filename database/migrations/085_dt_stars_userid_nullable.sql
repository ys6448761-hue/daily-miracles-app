-- 085_dt_stars_userid_nullable.sql
-- DreamTown 핵심 퍼널: 비로그인 소원 흐름에서 wish/star 생성 가능하도록
-- user_id, seed/galaxy FK 등 NOT NULL 제약 완화

-- dt_wishes: 퍼널 비로그인 흐름 (user_id, gem_type nullable)
ALTER TABLE dt_wishes
  ALTER COLUMN user_id  DROP NOT NULL,
  ALTER COLUMN gem_type DROP NOT NULL;

-- dt_stars: 퍼널 진입 시 user_id, star_seed_id, galaxy_id 없음 → nullable
ALTER TABLE dt_stars
  ALTER COLUMN user_id      DROP NOT NULL,
  ALTER COLUMN star_seed_id DROP NOT NULL,
  ALTER COLUMN galaxy_id    DROP NOT NULL;
