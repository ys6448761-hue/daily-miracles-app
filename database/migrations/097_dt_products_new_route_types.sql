-- 097_dt_products_new_route_types.sql
-- dt_products에 신규 route_type 값 추가: resonance | flow | expand | miracle
-- 기존 CHECK 제약 변경 후 새 시드 데이터 삽입

-- ticket_label 컬럼 추가 (spec 요구사항: 레저 쿠폰명 연결용)
ALTER TABLE dt_products
  ADD COLUMN IF NOT EXISTS ticket_label VARCHAR(100);

-- 기존 CHECK 제약 제거 후 확장된 제약으로 교체
ALTER TABLE dt_products
  DROP CONSTRAINT IF EXISTS dt_products_route_type_check;

ALTER TABLE dt_products
  ADD CONSTRAINT dt_products_route_type_check
  CHECK (route_type IN ('weekday','starlit','family','challenge',
                        'resonance','flow','expand','miracle'));

-- 신규 route_type 여수 상품 시드
-- flow: 여유/힐링 계열 (today, this_week)
-- expand: 특별/감성 계열 (weekend, custom, couple)
-- resonance: 깊이/연결 계열
-- miracle: 기적/premium 계열
INSERT INTO dt_products (product_code, city_code, route_type, title, price, tag, benefit_types, display_order) VALUES
  ('yeosu_flow_001',      'yeosu', 'flow',      '여수 해상케이블카 힐링 여정',    79000, 'best',    '["cablecar","cafe"]',                  0),
  ('yeosu_flow_002',      'yeosu', 'flow',      '낭만항구 산책 여정',             49000, null,      '["walk","cafe"]',                      1),
  ('yeosu_expand_001',    'yeosu', 'expand',    '여수 불꽃 야간 여정',           128000, 'best',    '["fireworks_cruise","dinner"]',         0),
  ('yeosu_expand_002',    'yeosu', 'expand',    '요트&석양 감성 여정',            95000, null,      '["yacht","sunset"]',                   1),
  ('yeosu_resonance_001', 'yeosu', 'resonance', '여수 밤바다 소원 여정',          89000, 'best',    '["cruise","lounge"]',                  0),
  ('yeosu_resonance_002', 'yeosu', 'resonance', '아쿠아 + 케이블카 동행 여정',    64000, null,      '["aqua","cablecar"]',                  1),
  ('yeosu_miracle_001',   'yeosu', 'miracle',   '여수 기적의 하루 풀패키지',      198000, 'best',   '["cablecar","cruise","dinner","cafe"]', 0),
  ('yeosu_miracle_002',   'yeosu', 'miracle',   '특별한 날 여수 프리미엄 여정',   148000, null,     '["yacht","fireworks_cruise","dinner"]', 1)
ON CONFLICT (product_code) DO NOTHING;
