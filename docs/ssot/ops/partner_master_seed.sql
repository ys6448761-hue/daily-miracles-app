-- =============================================================
-- partner_master_seed.sql
-- DreamTown Benefit Engine — 제휴처 마스터 데이터 적재
-- 버전: v1.0 (데이터 미입력 템플릿)
-- 작성일: 2026-06-08
-- 적재 순서: dt_partners → dt_benefits → benefit_settlement_configs
--            → dt_product_benefits (AdminBenefitPage 상품 연결 또는 직접 INSERT)
-- 실행 DB: PostgreSQL (Render 운영) / SQLite (로컬 개발)
-- =============================================================

-- ── 사전 확인 ────────────────────────────────────────────────
-- 실행 전 dt_regions에 yeosu 레코드가 있는지 확인
-- SELECT city_code, city_name FROM dt_regions WHERE city_code = 'yeosu';
-- partner_configs에 partner_code가 존재해야 benefit_settlement_configs INSERT 가능

-- =============================================================
-- STEP 1. dt_partners — 업체 기본 정보
-- =============================================================
-- [작성 규칙]
-- partner_code : YS-CF-001 형식 (별도 컬럼 없음 — description에 기록 또는 partner_configs 연계)
-- city_code    : 'yeosu' 고정
-- category     : cafe / restaurant / night / activity / transport / accommodation / etc
-- lat/lng      : 네이버지도 좌표 (소수점 7자리)

INSERT INTO dt_partners
  (city_code, name, category, address, lat, lng, phone, description, is_active)
VALUES

-- ── 카페 (YS-CF-*) ─────────────────────────────────────────
  ('yeosu', '[카페명 1]', 'cafe',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[업체 설명]', true),

  ('yeosu', '[카페명 2]', 'cafe',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[업체 설명]', true),

-- ── 맛집·식당 (YS-RS-*) ────────────────────────────────────
  ('yeosu', '[맛집명 1]', 'restaurant',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[대표메뉴 · 영업시간]', true),

  ('yeosu', '[맛집명 2]', 'restaurant',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[대표메뉴 · 영업시간]', true),

-- ── 야간 (YS-NT-*) ─────────────────────────────────────────
  ('yeosu', '[야간업체명 1]', 'night',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[영업시간 · 특이사항]', true),

-- ── 액티비티·체험 (YS-AC-*) ────────────────────────────────
  ('yeosu', '[액티비티명 1]', 'activity',
   '[탑승·집결 주소]', [위도], [경도],
   '[전화번호]', '[운행시간 · 소요시간]', true),

-- ── 교통 (YS-TR-*) ─────────────────────────────────────────
  ('yeosu', '[교통수단명 1]', 'transport',
   '[탑승 주소]', [위도], [경도],
   '[전화번호]', '[운항시간 · 소요시간]', true),

-- ── 숙소 (YS-HT-*) ─────────────────────────────────────────
  ('yeosu', '[숙소명 1]', 'accommodation',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[객실유형 · 체크인 시간]', true),

  ('yeosu', '[숙소명 2]', 'accommodation',
   '[도로명 주소]', [위도], [경도],
   '[전화번호]', '[객실유형 · 체크인 시간]', true)

ON CONFLICT DO NOTHING;


-- =============================================================
-- STEP 2. dt_benefits — 업체별 혜택 정의
-- (partner_id는 STEP 1 INSERT 후 조회)
-- =============================================================
-- [작성 규칙]
-- benefit_type : free / discount / gift / experience / upgrade
-- display_copy : 손님에게 실제 노출되는 UX 문장 (감성 유지)
-- location_hint: 현장 찾아가는 힌트 ("케이블카 하차장 도보 3분")

INSERT INTO dt_benefits
  (partner_id, benefit_type, title, description, display_copy, location_hint, is_active)
SELECT
  p.id,
  '[free|discount|gift|experience|upgrade]',        -- benefit_type
  '[혜택명 관리용 예: 아메리카노 1잔 무료]',          -- title
  '[조건 상세 예: 이용권 소지자 1인 한정, 1회]',      -- description
  '[UX 노출 문장 예: 잠깐 쉬어갈 수 있어요 ☕]',      -- display_copy
  '[위치 힌트 예: 케이블카 하차장 도보 3분]',          -- location_hint
  true
FROM dt_partners p
WHERE p.city_code = 'yeosu'
  AND p.name = '[위 STEP 1에서 등록한 업체명]'
LIMIT 1;

-- 위 패턴을 업체 수만큼 반복


-- =============================================================
-- STEP 3. benefit_settlement_configs — 정산 정책
-- (partner_configs.partner_code 선행 필요)
-- =============================================================
-- [작성 규칙]
-- settlement_policy_type : commission_rate (수수료율) | net_amount (고정입금가)
-- commission_rate        : 0.0000 ~ 1.0000  (예: 0.2000 = 20%)
-- net_amount             : KRW 고정액         (예: 12000.00)
-- 둘 중 하나만 입력, 나머지는 NULL

INSERT INTO benefit_settlement_configs
  (partner_code, benefit_type, settlement_policy_type, commission_rate, net_amount, note)
VALUES

-- commission_rate 방식 예시 (20% 수수료)
  ('[YS-CF-001]', 'free',     'commission_rate', 0.2000, NULL, '[비고]'),
  ('[YS-RS-001]', 'gift',     'commission_rate', 0.2000, NULL, '[비고]'),

-- net_amount 방식 예시 (고정 입금가)
  ('[YS-AC-001]', 'discount', 'net_amount',      NULL, 12000.00, '[비고]'),
  ('[YS-HT-001]', 'upgrade',  'net_amount',      NULL,  8000.00, '[비고]')

ON CONFLICT (partner_code, benefit_type) DO NOTHING;


-- =============================================================
-- STEP 4. dt_product_benefits — 상품-혜택 연결
-- (AdminBenefitPage에서 체크박스로 연결 가능 — SQL 직접 대안)
-- =============================================================
-- 연결 가능한 product_code 목록:
--   weekday  : wp_cable_cruise (25,000) / wp_aqua (32,000)
--   starlit  : sp_fireworks_bundle (60,000) / sp_fireworks_cruise (35,000)
--   family   : fp_aqua_cable (44,000) / fp_yeosu3pass (15,000)
--   challenge: cp_yacht (35,000) / cp_fireworks_yacht (55,000)

INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
SELECT
  pr.id,
  b.id,
  0
FROM dt_products pr
JOIN dt_benefits b ON b.partner_id = (
  SELECT id FROM dt_partners
  WHERE city_code = 'yeosu' AND name = '[업체명]'
  LIMIT 1
)
WHERE pr.product_code = '[product_code 예: wp_cable_cruise]'
ON CONFLICT (product_id, benefit_id) DO NOTHING;

-- 위 패턴을 상품-혜택 연결 수만큼 반복


-- =============================================================
-- 적재 완료 확인 쿼리
-- =============================================================
-- SELECT p.name, p.category, b.benefit_type, b.title
-- FROM dt_partners p
-- LEFT JOIN dt_benefits b ON b.partner_id = p.id
-- WHERE p.city_code = 'yeosu'
-- ORDER BY p.category, p.name;
