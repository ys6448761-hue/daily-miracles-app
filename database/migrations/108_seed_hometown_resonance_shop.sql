-- Migration 108: 시드 데이터 — STEP 3 (hometown_visits) + STEP 4 (resonance) + STEP 5 (shop products)
-- Render Shell: node -e "require('./database/db').query(require('fs').readFileSync('./database/migrations/108_seed_hometown_resonance_shop.sql','utf8')).then(()=>console.log('done')).catch(e=>console.error(e))"

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 3: hometown_visits 시드 + 카운터 업데이트
-- hometown_partner_id가 지정된 별들에 대해 1~5회 방문 기록 삽입
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  r        RECORD;
  i        INTEGER;
  visit_n  INTEGER;
  visit_ts TIMESTAMPTZ;
BEGIN
  FOR r IN
    SELECT s.id AS star_id, s.hometown_partner_id AS partner_id
      FROM dt_stars s
     WHERE s.hometown_partner_id IS NOT NULL
  LOOP
    -- 이미 방문 기록이 있으면 스킵 (중복 방지)
    IF EXISTS (SELECT 1 FROM hometown_visits WHERE star_id = r.star_id LIMIT 1) THEN
      CONTINUE;
    END IF;

    -- 1~5회 무작위 방문 수 결정 (star_id 해시 기반으로 결정적 랜덤)
    visit_n := 1 + (('x' || md5(r.star_id::TEXT))::BIT(8)::INTEGER % 5);

    FOR i IN 1..visit_n LOOP
      visit_ts := NOW() - (((visit_n - i + 1) * 3 + i) || ' days')::INTERVAL;
      INSERT INTO hometown_visits (star_id, partner_id, visit_number, is_first_visit, visited_at)
      VALUES (r.star_id, r.partner_id, i, (i = 1), visit_ts)
      ON CONFLICT DO NOTHING;
    END LOOP;

    -- dt_stars.hometown_visit_count 업데이트
    UPDATE dt_stars
       SET hometown_visit_count   = visit_n,
           hometown_last_visit_at = NOW() - '1 day'::INTERVAL
     WHERE id = r.star_id;
  END LOOP;
END $$;

-- dt_partners.hometown_star_count 재집계
UPDATE dt_partners p
   SET hometown_star_count = (
     SELECT COUNT(*) FROM dt_stars s
      WHERE s.hometown_partner_id = p.id
   )
 WHERE EXISTS (
   SELECT 1 FROM dt_stars s WHERE s.hometown_partner_id = p.id
 );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 4: resonance 시드 (10~20건)
-- 실제 dt_stars에서 UUID 목록을 가져와서 교차 공명 생성
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  star_ids  TEXT[];
  types     TEXT[] := ARRAY['relief','belief','clarity','courage'];
  n         INTEGER;
  s_idx     INTEGER;
  t_idx     INTEGER;
  i         INTEGER;
  sid       TEXT;
  rtype     TEXT;
BEGIN
  -- 최근 20개 별 UUID 수집
  SELECT ARRAY(SELECT id::TEXT FROM dt_stars ORDER BY created_at DESC LIMIT 20)
    INTO star_ids;

  n := array_length(star_ids, 1);
  IF n IS NULL OR n = 0 THEN
    RAISE NOTICE '별 없음 — resonance 시드 스킵';
    RETURN;
  END IF;

  -- 이미 resonance 있으면 스킵
  IF (SELECT COUNT(*) FROM resonance) > 0 THEN
    RAISE NOTICE 'resonance 이미 존재 — 스킵';
    RETURN;
  END IF;

  FOR i IN 1..15 LOOP
    s_idx := (i % n) + 1;
    t_idx := (i % 4) + 1;
    sid   := star_ids[s_idx];
    rtype := types[t_idx];

    INSERT INTO resonance (star_id, user_id, resonance_type, created_at)
    VALUES (
      sid,
      'seed-user-' || i,
      rtype,
      NOW() - ((i * 2) || ' hours')::INTERVAL
    )
    ON CONFLICT DO NOTHING;

    -- star_resonance_summary upsert
    INSERT INTO star_resonance_summary (star_id, relief_count, belief_count, clarity_count, courage_count, total_count)
    VALUES (
      sid,
      CASE WHEN rtype = 'relief'  THEN 1 ELSE 0 END,
      CASE WHEN rtype = 'belief'  THEN 1 ELSE 0 END,
      CASE WHEN rtype = 'clarity' THEN 1 ELSE 0 END,
      CASE WHEN rtype = 'courage' THEN 1 ELSE 0 END,
      1
    )
    ON CONFLICT (star_id) DO UPDATE SET
      relief_count  = star_resonance_summary.relief_count  + CASE WHEN rtype = 'relief'  THEN 1 ELSE 0 END,
      belief_count  = star_resonance_summary.belief_count  + CASE WHEN rtype = 'belief'  THEN 1 ELSE 0 END,
      clarity_count = star_resonance_summary.clarity_count + CASE WHEN rtype = 'clarity' THEN 1 ELSE 0 END,
      courage_count = star_resonance_summary.courage_count + CASE WHEN rtype = 'courage' THEN 1 ELSE 0 END,
      total_count   = star_resonance_summary.total_count   + 1,
      updated_at    = NOW();
  END LOOP;

  RAISE NOTICE 'resonance 시드 완료: 15건';
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- STEP 5: 샘플 상품 등록
-- wish_types 컬럼은 104_shop_enhance.sql에서 추가됨
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  partner_nangman UUID;
  partner_hwa     UUID;
BEGIN
  -- 파트너 UUID 조회 (없으면 NULL 허용 — 직접 판매 상품)
  SELECT id INTO partner_nangman FROM dt_partners WHERE name LIKE '%낭만%' LIMIT 1;
  SELECT id INTO partner_hwa     FROM dt_partners WHERE name LIKE '%화%' OR name LIKE '%꽃%' LIMIT 1;

  -- 이미 상품 있으면 스킵
  IF (SELECT COUNT(*) FROM dt_shop_products) > 0 THEN
    RAISE NOTICE '상품 이미 존재 — 스킵';
    RETURN;
  END IF;

  -- ① 돌산 갓김치 500g
  INSERT INTO dt_shop_products (partner_id, name, description, price, stock, category, wish_types, is_gift_available)
  VALUES (
    partner_nangman,
    '돌산 갓김치 500g',
    '여수 돌산도에서 재배한 갓으로 담근 전통 김치. 별을 품은 소원처럼 깊고 진한 맛.',
    18000, 50, 'food',
    ARRAY['health','healing'],
    TRUE
  );

  -- ② 여수 소원 팬던트 (라벤더)
  INSERT INTO dt_shop_products (partner_id, name, description, price, stock, category, wish_types, is_gift_available)
  VALUES (
    NULL,
    '여수 소원 팬던트 (라벤더)',
    '라벤더 빛 유리 구슬에 소원을 담은 핸드메이드 팬던트. 내 별의 색을 닮았어요.',
    15000, 30, 'goods',
    ARRAY['healing','challenge'],
    TRUE
  );

  -- ③ 여수 소원 선물 세트 (편지+차)
  INSERT INTO dt_shop_products (partner_id, name, description, price, stock, category, wish_types, is_gift_available)
  VALUES (
    NULL,
    '여수 소원 선물 세트 (편지+차)',
    '손으로 쓴 소원 엽서 + 여수 동백꽃 허브차 2종. 소중한 사람에게 전하는 기적의 선물.',
    22000, 20, 'souvenir',
    ARRAY['love','gratitude'],
    TRUE
  );

  -- ④ 여수 밤바다 도자기 컵
  INSERT INTO dt_shop_products (partner_id, name, description, price, stock, category, wish_types, is_gift_available)
  VALUES (
    partner_hwa,
    '여수 밤바다 도자기 컵',
    '여수의 밤하늘을 닮은 감청색 도자기 컵. 아침마다 내 별을 생각하며 마셔요.',
    28000, 15, 'souvenir',
    ARRAY['growth','healing'],
    TRUE
  );

  -- ⑤ 게장 정식 식사권 (낭만도시)
  INSERT INTO dt_shop_products (partner_id, name, description, price, stock, category, wish_types, is_gift_available)
  VALUES (
    partner_nangman,
    '게장 정식 식사권 (낭만도시)',
    '별들의 고향 낭만도시에서 즐기는 여수 간장게장 정식 1인권. 방문 시 사용.',
    35000, 100, 'food',
    ARRAY['memory','healing'],
    TRUE
  );

  RAISE NOTICE '샘플 상품 5개 등록 완료';
END $$;

-- 샘플 번들 상품 (104 마이그레이션 기준)
INSERT INTO dt_shop_bundles (name, description, price, wish_types, is_active)
VALUES
  ('여수 소원 선물 세트 A', '갓김치 + 소원 팬던트 + 엽서', 48000, ARRAY['healing','love'], TRUE),
  ('여수 소원 선물 세트 B', '소원 팬던트 + 도자기컵 + 동백차', 55000, ARRAY['growth','healing'], TRUE),
  ('직장 선물 세트', '게장식사권 + 갓김치 + 소원 엽서', 60000, ARRAY['gratitude','memory'], TRUE)
ON CONFLICT DO NOTHING;

-- 번들 아이템 연결 (products 삽입 후 UUID 참조)
DO $$
DECLARE
  b_a UUID; b_b UUID; b_c UUID;
  p_kimchi UUID; p_pendant UUID; p_giftset UUID; p_cup UUID; p_meal UUID;
BEGIN
  SELECT id INTO b_a     FROM dt_shop_bundles WHERE name = '여수 소원 선물 세트 A' LIMIT 1;
  SELECT id INTO b_b     FROM dt_shop_bundles WHERE name = '여수 소원 선물 세트 B' LIMIT 1;
  SELECT id INTO b_c     FROM dt_shop_bundles WHERE name = '직장 선물 세트' LIMIT 1;
  SELECT id INTO p_kimchi  FROM dt_shop_products WHERE name LIKE '%갓김치%' LIMIT 1;
  SELECT id INTO p_pendant FROM dt_shop_products WHERE name LIKE '%팬던트%' LIMIT 1;
  SELECT id INTO p_giftset FROM dt_shop_products WHERE name LIKE '%소원 선물 세트%' LIMIT 1;
  SELECT id INTO p_cup     FROM dt_shop_products WHERE name LIKE '%도자기%' LIMIT 1;
  SELECT id INTO p_meal    FROM dt_shop_products WHERE name LIKE '%게장%' LIMIT 1;

  IF b_a IS NOT NULL AND p_kimchi IS NOT NULL THEN
    INSERT INTO dt_bundle_items (bundle_id, product_id, quantity) VALUES
      (b_a, p_kimchi, 1), (b_a, p_pendant, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF b_b IS NOT NULL AND p_pendant IS NOT NULL THEN
    INSERT INTO dt_bundle_items (bundle_id, product_id, quantity) VALUES
      (b_b, p_pendant, 1), (b_b, p_cup, 1)
    ON CONFLICT DO NOTHING;
  END IF;

  IF b_c IS NOT NULL AND p_meal IS NOT NULL THEN
    INSERT INTO dt_bundle_items (bundle_id, product_id, quantity) VALUES
      (b_c, p_meal, 1), (b_c, p_kimchi, 1)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
