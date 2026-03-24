-- 044: 기적 은하 추가 + diamond 별 매핑 업데이트

-- 기적 은하 INSERT (이미 있으면 skip)
INSERT INTO dt_galaxies (code, name_ko, name_en, direction, description, sort_order)
VALUES (
  'miracle',
  '기적 은하',
  'Miracle Galaxy',
  '중심',
  '하나의 은하에 담기지 않는 가장 순수하고 간절한 소원',
  5
)
ON CONFLICT (code) DO NOTHING;

-- gem_type = 'diamond' 별들 → 기적 은하로 매핑 업데이트
UPDATE dt_stars
SET galaxy_id = (SELECT id FROM dt_galaxies WHERE code = 'miracle')
WHERE galaxy_id = (SELECT id FROM dt_galaxies WHERE code = 'growth')
  AND id IN (
    SELECT s.id FROM dt_stars s
    JOIN dt_wishes w ON s.wish_id = w.id
    WHERE w.gem_type = 'diamond'
  );
