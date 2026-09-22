-- =============================================================
-- partner_master_seed.sql  v4 — DreamTown 제휴처 마스터 데이터
-- 기준: partner_master.csv v4 / Hospitality V0.1 Final Alignment
--
-- Hospitality 기본 자격 (확정):
--   ㈜여수여행센터를 통한 결제 완료 + 개인여행 1~4인
--   상품 제한은 기본값이 아님.
--   별도 계약/정책이 명시된 Benefit에만 product_eligibility 적용.
--
-- INITIAL LAUNCH PARTNERS:
--   CAFE:       라또아 카페 (대표 — display_order=0)
--   RESTAURANT: 돌산게장명가 (대표 — display_order=0)
--              대교로 62 현영업점. 봉산1로 49 = 폐점 (절대 사용 금지)
--
-- 기타 파트너: Founder 승인 후 하나씩 추가 예정.
--   → dt_partners: 등록됨 (데이터 보존)
--   → dt_benefits:  미생성 (PENDING 표시)
--
-- MOIPIN: is_active=false HOLD — 계약 미확정 Founder 결정 대기
--
-- 적재 순서: migration 215 → STEP 1 → STEP 2 → STEP 3
-- STEP 4 (dt_product_benefits): 초기 시드에서 사용 안 함.
--   Legacy mapping 보존 필요 시 하단 주석 참고.
-- =============================================================

-- =============================================================
-- STEP 1. dt_partners — 18개 업체 등록 (모두 보존)
-- =============================================================

INSERT INTO dt_partners
  (city_code, name, category, address, lat, lng, phone, description, is_active)
VALUES
  -- 카페 (추후 개별 추가) ──────────────────────────────────────
  ('yeosu', '프롬나드',               'cafe', '전남 여수시 돌산읍 우두3길 98',         NULL, NULL, '061-641-1248',   NULL, true),
  ('yeosu', '더 포레스트랜드',         'cafe', '전남 여수시 돌산읍 월암길 144',         NULL, NULL, '0507-1367-6458', NULL, true),
  ('yeosu', '엘리스테이 카페',         'cafe', '전남 여수시 돌산읍 백초길 28-52',       NULL, NULL, '0507-1371-2956', NULL, true),
  ('yeosu', '라또아 카페',             'cafe', '전남 여수시 공화남3길 32 5층 전층',      NULL, NULL, '061-666-5811',   NULL, true),
  ('yeosu', '카프아일랜드',            'cafe', '전남 여수시 망양로 192',                NULL, NULL, '0507-1312-4005', NULL, true),
  ('yeosu', '메리엘 카페',             'cafe', '전남 여수시 만성리길 62',               NULL, NULL, '0507-1306-5679', NULL, true),
  ('yeosu', '카페하루',                'cafe', '전남 여수시 돌산읍 강남해안로 61',       NULL, NULL, '010-8878-2905',  NULL, true),
  -- HOLD: 모이핀 — 계약 여부 미확인. is_active=false. Founder 결정 전 노출 불가.
  ('yeosu', '모이핀',                  'cafe', '전남 여수시 돌산읍 무술목길 50',         NULL, NULL, '061-641-8300',   NULL, false),
  -- 별빛혜택 (달빛혜택) — 추후 개별 추가 ───────────────────────
  ('yeosu', '강순희 K바삭치킨 범앗간', 'restaurant', '여수시 이순신광장로 159',          NULL, NULL, '0507-1436-1486', NULL, true),
  ('yeosu', '해공 노래방',             'night',      '여수시 이순신광장로 165',          NULL, NULL, NULL,             NULL, true),
  ('yeosu', '인생네컷 오락실',         'night',      '여수시 이순신광장로 159',          NULL, NULL, '010-8608-3005',  NULL, true),
  ('yeosu', '풍선터트리기',            'etc',        '여수시 이순신광장로 159',          NULL, NULL, '010-8608-3005',  NULL, true),
  -- 맛집 — 추후 Founder 승인 후 개별 추가 ──────────────────────
  -- 대표 맛집: 돌산게장명가
  -- address = 전남 여수시 대교로 62 (현 영업점)
  -- 주의: 봉산1로 49는 폐점 — 절대 customer 안내 금지
  ('yeosu', '돌산게장명가',            'restaurant', '전남 여수시 대교로 62',            NULL, NULL, NULL,             NULL, true),
  ('yeosu', '백천선어마을',            'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '희망선어',                'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '섬마을 선어',             'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '궁전횟집',                'restaurant', NULL, NULL, NULL, NULL, NULL, true),
  ('yeosu', '거북선횟집',              'restaurant', NULL, NULL, NULL, NULL, NULL, true)
ON CONFLICT DO NOTHING;


-- =============================================================
-- STEP 2. dt_benefits — INITIAL LAUNCH: 라또아 카페 + 돌산게장명가
-- =============================================================
--
-- ELIGIBILITY: GENERIC (dt_product_benefits 미연결)
-- → 결제 완료 개인여행 1~4인 전체에 노출
-- → 특정 product_code 불필요
--
-- DISPLAY PRIORITY: display_order=0 (대표)
-- 사전 조건: migration 215 (dt_benefits.display_order 컬럼) 완료 필수
-- =============================================================

-- ── 대표 카페: 라또아 (display_order=0) ─────────────────────
INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active, display_order)
SELECT p.id, 'free', '아메리카노 1인 무료',
  '2인 이용 시 1인 무료 / 3인 이용 시 1인 무료 / 4인 이용 시 1인 무료',
  '여수 시내를 내려다보며 잠시 쉬어가세요. 아메리카노 1인 무료.',
  NULL, true, 0
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '라또아 카페';

-- ── 대표 맛집: 돌산게장명가 (display_order=0) ────────────────
-- 현 영업점: 전남 여수시 대교로 62
-- 봉산1로 49 = 폐점. 이 주소는 절대 사용하지 않음.
INSERT INTO dt_benefits (partner_id, benefit_type, title, description, display_copy, location_hint, is_active, display_order)
SELECT p.id, 'gift', '음료 1병 무료',
  NULL,
  '돌산 게장 명가에서 만나는 작은 선물. 음료 1병 무료 제공.',
  NULL, true, 0
FROM dt_partners p WHERE p.city_code = 'yeosu' AND p.name = '돌산게장명가';


-- =============================================================
-- STEP 3. PENDING — Founder 승인 후 하나씩 추가 예정
-- =============================================================
--
-- 아래 파트너들은 dt_partners에 등록됨.
-- dt_benefits INSERT는 Founder 운영 결정 후 개별 추가.
-- 추가 순서: 파트너 계약/운영 조건 완성 → 검수 → 적재.
--
-- ── 카페 (추가 예정) ──────────────────────────────────────────
-- 프롬나드:       display_copy 확인됨, display_order=1 예정
-- 더 포레스트랜드: display_copy 확인됨, display_order=1 예정
-- 엘리스테이 카페: display_copy 확인됨, display_order=1 예정
-- 카프아일랜드:   display_copy 확인됨, display_order=1 예정
-- 메리엘 카페:    display_copy 확인됨, display_order=1 예정
-- 카페하루:       display_copy 확인됨, display_order=1 예정
-- 모이핀:         HOLD — 계약 미확정 Founder 결정 후
--
-- ── 별빛혜택/달빛혜택 4개 (추가 예정) ────────────────────────
-- 강순희 K바삭치킨 범앗간: PENDING
-- 해공 노래방:           PENDING
-- 인생네컷 오락실:        PENDING
-- 풍선터트리기:           PENDING
-- 별빛혜택 product_eligibility: Founder 확정 전까지 GENERIC으로 시작
--
-- ── 맛집 추가 예정 (BLOCKED: display_copy/address/phone/route_code 미확인) ──
-- 백천선어마을, 희망선어, 섬마을 선어, 궁전횟집, 거북선횟집


-- =============================================================
-- STEP 4. dt_product_benefits — 초기 시드에서 사용 안 함
-- =============================================================
--
-- 현재 모든 활성 Benefit(라또아, 돌산게장명가)은 GENERIC.
-- dt_product_benefits 미연결 → 결제 완료 1~4인 전체 노출.
--
-- LEGACY MAPPING NOTES (보존 필요 시 주석 해제):
--
-- 카페투어 → sp_fireworks_bundle + sp_fireworks_cruise
-- 별빛혜택 4개 → moonlight_pass
--
-- 이 매핑은 특정 상품 전용 혜택 계약이 있을 경우에만 사용.
-- 일반 Hospitality에는 적용하지 않음.
--
-- INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
-- SELECT pr.id, b.id, 0
-- FROM dt_products pr
-- CROSS JOIN dt_benefits b
-- JOIN dt_partners p ON p.id = b.partner_id
-- WHERE pr.product_code IN ('sp_fireworks_bundle', 'sp_fireworks_cruise')
--   AND p.category = 'cafe'
--   AND p.name IN ('프롬나드', '더 포레스트랜드', ...)
-- ON CONFLICT (product_id, benefit_id) DO NOTHING;
--
-- SELECT pr.id, b.id, 0
-- FROM dt_products pr CROSS JOIN dt_benefits b JOIN dt_partners p ...
-- WHERE pr.product_code = 'moonlight_pass'
--   AND p.name IN ('해공 노래방', '강순희 K바삭치킨 범앗간', '인생네컷 오락실', '풍선터트리기')


-- =============================================================
-- 적재 완료 확인 쿼리
-- =============================================================
-- SELECT p.name, p.category, p.address, p.is_active,
--        b.benefit_type, b.title, b.display_copy, b.display_order
-- FROM dt_partners p
-- LEFT JOIN dt_benefits b ON b.partner_id = p.id AND b.is_active = true
-- WHERE p.city_code = 'yeosu'
-- ORDER BY b.display_order, p.category, p.name;
