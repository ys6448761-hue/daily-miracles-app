-- Migration 029: Seed Star 이름 중복 수정
-- 중복 원인:
--   Courage Spark (#0012)  ← "Courage" 중복 with Courage Star (#0002)
--   Quiet Light   (#0014)  ← "Quiet"   중복 with Quiet Growth (#0004)
--   New Horizon   (#0020)  ← "New"     중복 with New Beginning (#0006)

UPDATE dt_stars
SET star_name = 'Bold Spark',  star_slug = 'bold-spark'
WHERE id = '00000000-0000-0000-0000-000000001204';  -- #0012 Courage Spark → Bold Spark

UPDATE dt_stars
SET star_name = 'Gentle Light', star_slug = 'gentle-light'
WHERE id = '00000000-0000-0000-0000-000000001404';  -- #0014 Quiet Light → Gentle Light

UPDATE dt_stars
SET star_name = 'Far Horizon',  star_slug = 'far-horizon'
WHERE id = '00000000-0000-0000-0000-000000002004';  -- #0020 New Horizon → Far Horizon
