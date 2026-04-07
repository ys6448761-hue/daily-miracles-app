-- 067_route_catalog_seeds.sql
-- 은하별 추천 항로 seed 추가 (치유/성장/관계 + daily 기본)

INSERT INTO route_catalog
  (route_code, route_name, route_family, galaxy_axis, theme, supports_daytrip, supports_stay, stay_options)
VALUES
  -- 치유 은하 추천 항로
  ('yeosu_healing',    '여수 힐링 항로',   'galaxy', 'south',  'healing',      TRUE, TRUE,  ARRAY[0,1,2]),
  -- 도전 은하 추천 항로
  ('yeosu_activity',   '여수 액티비티 항로','galaxy', 'north',  'challenge',    TRUE, TRUE,  ARRAY[0,1,2]),
  -- 성장 은하 추천 항로
  ('yeosu_reflection', '여수 성찰 항로',   'galaxy', 'east',   'growth',       TRUE, FALSE, ARRAY[0]),
  -- 관계 은하 추천 항로
  ('yeosu_social',     '여수 동행 항로',   'galaxy', 'west',   'relationship', TRUE, TRUE,  ARRAY[0,1,2]),
  -- daily 공통 항로 (모든 은하 포함 가능)
  ('daily_basic',      '하루 기적 항로',   'miracle', NULL,    'general_entry', TRUE, FALSE, ARRAY[0])
ON CONFLICT (route_code) DO NOTHING;
