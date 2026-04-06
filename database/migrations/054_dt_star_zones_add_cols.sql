-- 054_dt_star_zones_add_cols.sql
-- star_zones: max_stars / current_count / is_active 추가

ALTER TABLE star_zones
  ADD COLUMN IF NOT EXISTS max_stars      INT     DEFAULT 1000,
  ADD COLUMN IF NOT EXISTS current_count  INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active      BOOLEAN DEFAULT true;
