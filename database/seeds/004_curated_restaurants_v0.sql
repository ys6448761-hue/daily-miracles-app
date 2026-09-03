-- Seed 004: Curated Yeosu Restaurants V0
-- Approved local candidates from Yeosu Travel Center
-- Purpose: Minimal food pairing for Travel Guide Day-1 MVP
-- All unverified fields stored as NULL per Phase 1 safety rules
-- Created: 2026-08-23

INSERT INTO travel_restaurants (
  code, country_code, city_code, name, cuisine_type,
  address, lat, lng, phone,
  meal_context, suitable_for,
  opening_hours_json, closed_day, reservation_required,
  source, source_url
) VALUES

-- 1. 꽃돌게장 (Game Jang - Crab Marinated)
('kkotdol_gamjang', 'KR', 'YEOSU',
  '꽃돌게장', '게장',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups','family']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 2. 돌산게장명가 (Dolsan Game Jang House)
('dolsan_gamjang_myeongga', 'KR', 'YEOSU',
  '돌산게장명가', '게장',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups','family']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 3. 백천선어마을 (Baekcheon Sun-Eo Village)
('baekcheon_suneo', 'KR', 'YEOSU',
  '백천선어마을', '생선구이정식 / 게장',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['family','groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 4. 한일관 (Han-Il Gwan)
('han_il_gwan', 'KR', 'YEOSU',
  '한일관', '회한정식',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 5. 진모식당 (Jin-Mo Restaurant)
('jin_mo_sikdang', 'KR', 'YEOSU',
  '진모식당', '백반',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['family','solo']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 6. 희망선어 (Huimang Sun-Eo)
('huimang_suneo', 'KR', 'YEOSU',
  '희망선어', '삼치선어',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 7. 섬마을선어 (Som-Ma-Ul Sun-Eo)
('sommaul_suneo', 'KR', 'YEOSU',
  '섬마을선어', '삼치선어',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 8. 구백식당 (Gubaek Restaurant)
('gubaek_sikdang', 'KR', 'YEOSU',
  '구백식당', '장어탕 / 서대회',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 9. 풍산식당 (Pungsan Restaurant)
('pungsan_sikdang', 'KR', 'YEOSU',
  '풍산식당', '장어탕 / 서대회',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 10. 궁전횟집 (Gung-Jeon Hoe-Jip)
('gungjeon_hoejip', 'KR', 'YEOSU',
  '궁전횟집', '생선회',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 11. 장군도횟집 (Janggun-Do Hoe-Jip)
('janggundc_hoejip', 'KR', 'YEOSU',
  '장군도횟집', '생선회',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL),

-- 12. 상아식당 (Sang-Ah Restaurant)
('sangah_sikdang', 'KR', 'YEOSU',
  '상아식당', '통장어탕',
  NULL, NULL, NULL, NULL,
  ARRAY['lunch','dinner']::text[], ARRAY['groups']::text[],
  NULL, NULL, NULL,
  'local_curated', NULL);

-- Verification counts:
-- TOTAL SEEDED: 12 restaurants
-- VERIFIED SOURCE: Yeosu Travel Center
-- UNVERIFIED FIELDS: address, phone, opening_hours, lat/lng, price, rating (all NULL)
-- PRESERVED SEMANTICS: source='local_curated' marks curated provenance
-- SAFETY: No guessed data, no web-filled info, all unverified = NULL
