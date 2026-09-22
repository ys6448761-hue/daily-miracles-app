-- =============================================================
-- partner_master_seed.sql  v3 — DreamTown 제휴처 마스터 데이터
-- 기준: partner_master.csv v3 / Benefit Display Copy V1 (2026-06-08)
-- 업체: 카페투어 8개(starlit) + 달빛혜택 3개(moonlight) +
--        별빛혜택 1개(starlit = 강순희 K바삭치킨 범앗간) +
--        맛집 6개(restaurant, FOUNDER_CONFIRMATION_REQUIRED)
--
-- 사전 조건:
--   migration 173_moonlight_route.sql 적재 완료 필수
--   (moonlight CHECK 제약 + moonlight_pass 상품 등록)
--
-- 적재 순서: STEP 1 → STEP 2 → STEP 3 → STEP 4
-- 잔여 TBD: lat/lng / settlement_policy_type / benefit_location_hint
--
-- HOLD 항목:
--   모이핀(YS-CF-008): is_active=false — 계약 여부 미확인, Founder 결정 대기
--
-- BLOCKED 항목 (dt_benefits INSERT 불가):
--   YS-RS-002 ~ YS-RS-007: display_copy, address, phone, route_code 미확인
--   → FOUNDER_CONFIRMATION_REQUIRED
-- =============================================================

-- =============================================================
-- STEP 1. dt_partners — 18개 업체 등록
-- =============================================================

INSERT INTO dt_partners
  (city_code, name, category, address, lat, lng, phone, description, is_active)
VALUES
  -- 카페투어 (starlit) ─────────────────────────────────────────
  ('yeosu', '프롬나드',         'cafe', '전남 여수시 돌산읍 우두3길 98',         NULL, NULL, '061-641-1248',   NULL, true),
  ('yeosu', '더 포레스트랜드',   'cafe', '전남 여수시 돌산읍 월암길 144',         NULL, NULL, '0507-1367-6458', NULL, true),
  ('yeosu', '엘리스테이 카페',   'cafe', '전남 여수시 돌산읍 백초길 28-52',       NULL, NULL, '0507-1371-2956', NULL, true),
  ('yeosu', '라또아 카페',       'cafe', '전남 여수시 공화남3길 32 5층 전층',      NULL, NULL, '061-666-5811',   NULL, true),
  ('yeosu', '카프아일랜드',      'cafe', '전남 여수시 망양로 192',                NULL, NULL, '0507-1312-4005', NULL, true),
  ('yeosu', '메리엘 카페',       'cafe', '전남 여수시 만성리길 62',               NULL, NULL, '0507-1306-5679', NULL, true),
  ('yeosu', '카페하루',          'cafe', '전남 여수시 돌산읍 강남해안로 61',       NULL, NULL, '010-8878-2905',  NULL, true),
  -- HOLD: 모이핀 — 계약 여부 미확인. is_active=false. Founder 결정 전 노출 불가.
  ('yeosu', '모이핀',            'cafe', '전남 여수시 돌산읍 무술목길 50',         NULL, NULL, '061-641-8300',   NULL, false),
  -- 별빛혜택 (starlit) ─────────────────────────────────────────
  -- 강순희 K바삭치킨 범앗간: STARLIGHT BENEFIT (별빛혜택). moonlight 아님.
  ('yeosu', '강순희 K바삭치킨 범앗간', 'restaurant', '여수시 이순신광장로 159', NULL, NULL, '0507-1436-1486', NULL, true),
  -- 달빛혜택 (moonlight) ───────────────────────────────────────
  ('yeosu', '해공 노래방',       'night',      '여수시 이순신광장로 165', NULL, NULL, NULL,             NULL, true),
  ('yeosu', '인생네컷 오락실',   'night',      '여수시 이순신광장로 159', NULL, NULL, '010-8608-3005',  NULL, true),
  ('yeosu', '풍선터트리기',      'etc',        '여수시 이순신광장로 159', NULL, NULL, '010-8608-3005',  NULL, true),
  -- 맛집 (restaurant) — FOUNDER_CONFIRMATION_REQUIRED ──────────
  -- address, phone, display_copy, route_code 미확인.
  -- dt_benefits INSERT 불가. Founder 확인 후 STEP 2 추가 예정.
  ('yeosu', '백천선어마을',      'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '돌산게장명가',      'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '희망선어',          'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '섬마을 선어',       'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '궁전횟집',          'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '거북선횟집',        'restaurant', NULL, NULL, NULL, NULL, NULL, true)
ON CONFLICT DO NOTHING;


-- =============================================================
-- STEP 2. dt_benefits — 혜택 + display_copy 등록
-- =============================================================

-- ── 카페투어 8개 — 각각 개별 display_copy ────────────────────

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '돌산 바다를 바라보며 별빛항로의 여운을 만나보세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '프롬나드';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '숲과 바다가 만나는 곳. 잠시 머물며 마음을 쉬어가세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '더 포레스트랜드';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '여수의 풍경과 함께 소중한 사람과 조용한 시간을 보내보세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '엘리스테이 카페';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '여수 시내를 내려다보며 별빛항로의 이야기를 이어가세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '라또아 카페';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '바다와 가장 가까운 쉼. 여수의 바람을 느껴보세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '카프아일랜드';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '만성리의 풍경과 함께 천천히 하루를 즐겨보세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '메리엘 카페';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '오늘 하루를 위한 쉼. 따뜻한 커피 한 잔과 함께하세요.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '카페하루';

-- HOLD: 모이핀 — is_active=false이므로 쿼리에 노출 안 됨. Founder 결정 보류.
-- INSERT INTO dt_benefits ... WHERE name = '모이핀'  ← 실행하지 않음

-- ── 별빛혜택 — 강순희 K바삭치킨 범앗간 ─────────────────────────
-- STARLIGHT BENEFIT: sp_fireworks_bundle + sp_fireworks_cruise에 연결

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'gift', '음료 1병 무료', NULL,
  '이순신광장에서 만나는 작은 선물. 음료 1병 무료 제공.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '강순희 K바삭치킨 범앗간';

-- ── 달빛혜택 3개 ─────────────────────────────────────────────

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'discount', '20% 할인', NULL,
  '여행의 즐거움을 조금 더 가볍게. 노래방 20% 할인 혜택.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '해공 노래방';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'gift', '2000원 지급', NULL,
  '오늘의 순간을 기록하세요. 2000원 혜택 제공.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '인생네컷 오락실';

INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'discount', '2000원 할인', NULL,
  '작은 즐거움 하나 더. 2000원 할인 혜택 제공.',
  NULL, true
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '풍선터트리기';

-- ── 맛집 6개 — BLOCKED (FOUNDER_CONFIRMATION_REQUIRED) ──────────
-- 필요 필드 미제공: display_copy(NOT NULL), address, phone, route_code
-- 아래 INSERT는 실행하지 않음. Founder 확인 후 추가.
--
-- 백천선어마을   → display_copy: MISSING, address: MISSING, phone: MISSING, route_code: MISSING
-- 돌산게장명가   → display_copy: MISSING, address: MISSING, phone: MISSING, route_code: MISSING
-- 희망선어       → display_copy: MISSING, address: MISSING, phone: MISSING, route_code: MISSING
-- 섬마을 선어   → display_copy: MISSING, address: MISSING, phone: MISSING, route_code: MISSING
-- 궁전횟집       → display_copy: MISSING, address: MISSING, phone: MISSING, route_code: MISSING
-- 거북선횟집     → display_copy: MISSING, address: MISSING, phone: MISSING, route_code: MISSING


-- =============================================================
-- STEP 3. benefit_settlement_configs — 미정 (TBD)
-- settlement_policy_type 확정 후 주석 해제
-- =============================================================
-- INSERT INTO benefit_settlement_configs ...


-- =============================================================
-- STEP 4. dt_product_benefits — 상품-혜택 연결
-- 사전 조건: migration 173 실행 완료 (moonlight_pass 존재)
-- =============================================================

-- ── starlit 카페 7개 → sp_fireworks_bundle + sp_fireworks_cruise ──
-- (모이핀 제외: is_active=false HOLD)
INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
SELECT pr.id, b.id, 0
FROM dt_products pr
CROSS JOIN dt_benefits b
JOIN dt_partners p ON p.id = b.partner_id
WHERE pr.product_code IN ('sp_fireworks_bundle', 'sp_fireworks_cruise')
  AND p.city_code = 'yeosu'
  AND p.category = 'cafe'
  AND p.name IN (
    '프롬나드', '더 포레스트랜드', '엘리스테이 카페', '라또아 카페',
    '카프아일랜드', '메리엘 카페', '카페하루'
  )
ON CONFLICT (product_id, benefit_id) DO NOTHING;

-- ── 별빛혜택: 강순희 K바삭치킨 범앗간 → sp_fireworks_bundle + sp_fireworks_cruise ──
-- STARLIGHT BENEFIT — 범앗간(구)에서 이름 변경 및 moonlight→starlit 재분류
INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
SELECT pr.id, b.id, 0
FROM dt_products pr
CROSS JOIN dt_benefits b
JOIN dt_partners p ON p.id = b.partner_id
WHERE pr.product_code IN ('sp_fireworks_bundle', 'sp_fireworks_cruise')
  AND p.city_code = 'yeosu'
  AND p.name = '강순희 K바삭치킨 범앗간'
ON CONFLICT (product_id, benefit_id) DO NOTHING;

-- ── moonlight 3개 → moonlight_pass ───────────────────────────
-- 강순희 K바삭치킨 범앗간은 moonlight에서 제외됨 (starlit으로 이동)
INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
SELECT pr.id, b.id, 0
FROM dt_products pr
CROSS JOIN dt_benefits b
JOIN dt_partners p ON p.id = b.partner_id
WHERE pr.product_code = 'moonlight_pass'
  AND p.city_code = 'yeosu'
  AND p.name IN ('해공 노래방', '인생네컷 오락실', '풍선터트리기')
ON CONFLICT (product_id, benefit_id) DO NOTHING;

-- ── 맛집 6개 — BLOCKED (dt_product_benefits INSERT 불가) ────────
-- product_codes 결정 FOUNDER_CONFIRMATION_REQUIRED
-- 실행하지 않음.


-- =============================================================
-- 적재 완료 확인 쿼리
-- =============================================================
-- SELECT p.name, p.category, p.phone, p.is_active,
--        b.benefit_type, b.title, b.display_copy
-- FROM dt_partners p
-- LEFT JOIN dt_benefits b ON b.partner_id = p.id
-- WHERE p.city_code = 'yeosu'
-- ORDER BY p.category, p.name;
