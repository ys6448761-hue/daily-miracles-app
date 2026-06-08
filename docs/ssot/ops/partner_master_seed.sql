-- =============================================================
-- partner_master_seed.sql  v1 — DreamTown 제휴처 마스터 데이터
-- 기준: partner_master.csv v1 (2026-06-08)
-- 업체: 카페투어 8개(starlit) + 달빛혜택 4개(moonlight)
--
-- ⚠️ 적재 전 필수 확인:
--   1. display_copy(TBD) 전부 채운 뒤 적재할 것
--      → dt_benefits.display_copy NOT NULL 위반 방지
--   2. moonlight route_code → dt_products.route_type 미지원
--      → STEP 4 moonlight 구간은 주석 처리됨 (별도 마이그레이션 필요)
--   3. settlement_policy_type 미정 → STEP 3 전체 주석 처리됨
--   4. lat/lng 미정 → NULL로 적재 (지도 연동 전 수정 필요)
--
-- 적재 순서: STEP 1 → STEP 2 → STEP 3 → STEP 4
-- =============================================================

-- =============================================================
-- STEP 1. dt_partners — 업체 기본 정보 (12개)
-- =============================================================

INSERT INTO dt_partners
  (city_code, name, category, address, lat, lng, phone, description, is_active)
VALUES

-- ── 카페투어 — starlit (8개) ───────────────────────────────
  ('yeosu', '프롬나드',       'cafe', '전남 여수시 돌산읍 우두3길 98',         NULL, NULL, '061-641-1248',    NULL, true),
  ('yeosu', '더 포레스트랜드', 'cafe', '전남 여수시 돌산읍 월암길 144',         NULL, NULL, '0507-1367-6458',  NULL, true),
  ('yeosu', '엘리스테이 카페', 'cafe', '전남 여수시 돌산읍 백초길 28-52',       NULL, NULL, '0507-1371-2956',  NULL, true),
  ('yeosu', '라또아 카페',    'cafe', '전남 여수시 공화남3길 32 5층 전층',      NULL, NULL, '061-666-5811',    NULL, true),
  ('yeosu', '카프아일랜드',   'cafe', '전남 여수시 망양로 192',                NULL, NULL, '0507-1312-4005',  NULL, true),
  ('yeosu', '메리엘 카페',    'cafe', '전남 여수시 만성리길 62',               NULL, NULL, '0507-1306-5679',  NULL, true),
  ('yeosu', '카페하루',       'cafe', '전남 여수시 돌산읍 강남해안로 61',       NULL, NULL, '010-8878-2905',   NULL, true),
  ('yeosu', '모이핀',         'cafe', '전남 여수시 돌산읍 무술목길 50',         NULL, NULL, '061-641-8300',    NULL, true),

-- ── 달빛혜택 — moonlight (4개) ────────────────────────────
  ('yeosu', '해공 노래방',    'night',      '여수시 이순신광장로 165', NULL, NULL, NULL,              NULL, true),
  ('yeosu', '범앗간',         'restaurant', '여수시 이순신광장로 159', NULL, NULL, '0507-1436-1486',  NULL, true),
  ('yeosu', '인생네컷 오락실', 'night',      '여수시 이순신광장로 159', NULL, NULL, '010-8608-3005',   NULL, true),
  ('yeosu', '풍선터트리기',   'etc',        '여수시 이순신광장로 159', NULL, NULL, '010-8608-3005',   NULL, true)

ON CONFLICT DO NOTHING;


-- =============================================================
-- STEP 2. dt_benefits — 혜택 정의 (12개)
--
-- ⚠️ display_copy: '[UX 카피 미정]' 는 임시 플레이스홀더.
--    AdminBenefitPage 운영 전 실제 UX 문장으로 교체 필수.
--    예) '잠깐 쉬어갈 수 있어요 ☕'
-- =============================================================

-- ── 카페투어 8개 (benefit_type=free, 공통 혜택) ──────────────
INSERT INTO dt_benefits
  (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id,
  'free',
  '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '[UX 카피 미정]',   -- ⚠️ 적재 전 교체 필요
  NULL,
  true
FROM dt_partners p
WHERE p.city_code = 'yeosu'
  AND p.category = 'cafe'
  AND p.name IN (
    '프롬나드', '더 포레스트랜드', '엘리스테이 카페', '라또아 카페',
    '카프아일랜드', '메리엘 카페', '카페하루', '모이핀'
  );

-- ── 달빛혜택 4개 (각각 개별 혜택) ──────────────────────────

-- 해공 노래방 — 20% 할인
INSERT INTO dt_benefits
  (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'discount', '20% 할인', NULL, '[UX 카피 미정]', NULL, true
FROM dt_partners p
WHERE p.city_code = 'yeosu' AND p.name = '해공 노래방';

-- 범앗간 — 음료 1병 무료
INSERT INTO dt_benefits
  (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'gift', '음료 1병 무료', NULL, '[UX 카피 미정]', NULL, true
FROM dt_partners p
WHERE p.city_code = 'yeosu' AND p.name = '범앗간';

-- 인생네컷 오락실 — 2,000원 지급
INSERT INTO dt_benefits
  (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'gift', '2000원 지급', NULL, '[UX 카피 미정]', NULL, true
FROM dt_partners p
WHERE p.city_code = 'yeosu' AND p.name = '인생네컷 오락실';

-- 풍선터트리기 — 2,000원 할인
INSERT INTO dt_benefits
  (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT p.id, 'discount', '2000원 할인', NULL, '[UX 카피 미정]', NULL, true
FROM dt_partners p
WHERE p.city_code = 'yeosu' AND p.name = '풍선터트리기';


-- =============================================================
-- STEP 3. benefit_settlement_configs — 정산 정책
-- ⚠️ 전체 미정 (settlement_policy_type TBD)
--    확정 후 아래 주석 해제하여 적재
-- =============================================================

-- INSERT INTO benefit_settlement_configs
--   (partner_code, benefit_type, settlement_policy_type, commission_rate, net_amount, note)
-- VALUES
--   ('YS-CF-001', 'free', 'commission_rate', 0.2000, NULL, '프롬나드 — 미정'),
--   ('YS-CF-002', 'free', 'commission_rate', 0.2000, NULL, '더 포레스트랜드 — 미정'),
--   ('YS-CF-003', 'free', 'commission_rate', 0.2000, NULL, '엘리스테이 카페 — 미정'),
--   ('YS-CF-004', 'free', 'commission_rate', 0.2000, NULL, '라또아 카페 — 미정'),
--   ('YS-CF-005', 'free', 'commission_rate', 0.2000, NULL, '카프아일랜드 — 미정'),
--   ('YS-CF-006', 'free', 'commission_rate', 0.2000, NULL, '메리엘 카페 — 미정'),
--   ('YS-CF-007', 'free', 'commission_rate', 0.2000, NULL, '카페하루 — 미정'),
--   ('YS-CF-008', 'free', 'commission_rate', 0.2000, NULL, '모이핀 — 미정'),
--   ('YS-NT-001', 'discount', 'commission_rate', 0.2000, NULL, '해공 노래방 — 미정'),
--   ('YS-RS-001', 'gift',     'commission_rate', 0.2000, NULL, '범앗간 — 미정'),
--   ('YS-NT-002', 'gift',     'commission_rate', 0.2000, NULL, '인생네컷 오락실 — 미정'),
--   ('YS-ET-001', 'discount', 'commission_rate', 0.2000, NULL, '풍선터트리기 — 미정')
-- ON CONFLICT (partner_code, benefit_type) DO NOTHING;


-- =============================================================
-- STEP 4. dt_product_benefits — 상품-혜택 연결
-- =============================================================

-- ── starlit 카페 8개 → sp_fireworks_bundle / sp_fireworks_cruise ──
-- 카페투어는 별빛 항로(starlit) 상품 2개에 모두 연결

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
    '카프아일랜드', '메리엘 카페', '카페하루', '모이핀'
  )
ON CONFLICT (product_id, benefit_id) DO NOTHING;

-- ── moonlight 4개 — dt_product_benefits 연결 보류 ──────────
-- ⚠️ dt_products.route_type CHECK IN ('weekday','starlit','family','challenge')
--    'moonlight'은 현재 허용값 아님.
--    아래 두 가지 중 하나 선택 후 진행:
--
--    [방법 A] 마이그레이션 추가 — dt_products에 moonlight 상품 생성
--      ALTER TABLE dt_products DROP CONSTRAINT ...;
--      또는 CHECK 조건 수정 + INSERT INTO dt_products (..., 'moonlight', ...);
--
--    [방법 B] 기존 상품에 연결 — 달빛혜택을 voyage/소원항해 상품 또는
--      fp_yeosu3pass에 붙이는 방안 (사업 결정 필요)
--
-- 결정 후 아래 주석 해제:
-- INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
-- SELECT pr.id, b.id, 0
-- FROM dt_products pr
-- CROSS JOIN dt_benefits b
-- JOIN dt_partners p ON p.id = b.partner_id
-- WHERE pr.product_code = '[moonlight 상품코드 미정]'
--   AND p.city_code = 'yeosu'
--   AND p.name IN ('해공 노래방', '범앗간', '인생네컷 오락실', '풍선터트리기')
-- ON CONFLICT (product_id, benefit_id) DO NOTHING;


-- =============================================================
-- 적재 완료 확인 쿼리
-- =============================================================
-- SELECT
--   p.name,
--   p.category,
--   p.phone,
--   b.benefit_type,
--   b.title,
--   b.description,
--   b.display_copy
-- FROM dt_partners p
-- LEFT JOIN dt_benefits b ON b.partner_id = p.id
-- WHERE p.city_code = 'yeosu'
-- ORDER BY p.category, p.name;
