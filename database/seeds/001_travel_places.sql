-- Seed 001: travel_places
-- 14 unique places: star_zones (12) + ORIGIN (2, deduplicated with star_zones)
-- Created: 2026-08-21

INSERT INTO travel_places (
  code, zone_code, country_code, city_code,
  name_ko, name_en, address, lat, lng,
  indoor_outdoor, avg_stay_minutes,
  suitable_for, weather_suitable,
  emotion_primary, emotion_tags,
  origin_seed_id, trust_level
) VALUES

-- SOUTH (1/2)
('hyangiram', 'S-1', 'KR', 'YEOSU',
 '향일암', 'Hyangiram', '돌산읍 향일암로 1', 34.5914162, 127.8037534,
 'outdoor', 90,
 ARRAY['family', 'elderly', 'kids_ok', 'pilgrimage']::text[],
 ARRAY['clear', 'sunrise', 'all_season']::text[],
 'serenity', ARRAY['dawn', 'faith', 'historical']::text[],
 'ORIGIN-002', 'ORIGIN'),

('dolsan_daegyo', 'S-2', 'KR', 'YEOSU',
 '돌산대교', 'Dolsan Bridge', '돌산도 연육교', 34.7395, 127.7456,
 'outdoor', 30,
 ARRAY['family', 'kids_ok', 'young_adults']::text[],
 ARRAY['clear', 'sunset', 'night']::text[],
 'wonder', ARRAY['architecture', 'night_view']::text[],
 NULL, 'VERIFIED'),

('dolsan_nightscape', 'S-3', 'KR', 'YEOSU',
 '돌산 야경', 'Dolsan Night View Point', '돌산읍 해변', 34.7289, 127.7472,
 'outdoor', 45,
 ARRAY['young_adults', 'couples', 'groups']::text[],
 ARRAY['clear', 'night']::text[],
 'nostalgia', ARRAY['night_view', 'date']::text[],
 NULL, 'VERIFIED'),

-- WEST (3/3)
('lee_soon_shin_plaza', 'W-1', 'KR', 'YEOSU',
 '이순신광장', 'Lee Soon Shin Plaza', '중앙동 385-6', 34.7463, 127.7356,
 'outdoor', 45,
 ARRAY['family', 'kids_ok', 'elderly', 'groups']::text[],
 ARRAY['clear', 'all_season']::text[],
 'inspiration', ARRAY['history', 'education']::text[],
 NULL, 'VERIFIED'),

('romantic_pojangmacha', 'W-2', 'KR', 'YEOSU',
 '낭만포차거리', 'Romantic Pojangmacha Alley', '동산동 포차거리', 34.7421, 127.7398,
 'outdoor', 60,
 ARRAY['young_adults', 'groups', 'friends']::text[],
 ARRAY['clear', 'cool', 'evening']::text[],
 'warmth', ARRAY['food', 'social', 'street_culture']::text[],
 NULL, 'VERIFIED'),

('jungang_market', 'W-3', 'KR', 'YEOSU',
 '중앙시장', 'Jungang Market', '서동 중앙시장', 34.7450, 127.7370,
 'mixed', 75,
 ARRAY['family', 'kids_ok', 'elderly', 'foodies']::text[],
 ARRAY['all_season']::text[],
 'community', ARRAY['local_food', 'culture', 'everyday']::text[],
 NULL, 'VERIFIED'),

-- NORTH (3/3)
('yeosu_expo_park', 'N-1', 'KR', 'YEOSU',
 '여수엑스포장', 'Yeosu Expo Park', '박람회장길', 34.7520, 127.7450,
 'outdoor', 120,
 ARRAY['family', 'kids_ok', 'groups']::text[],
 ARRAY['clear', 'all_season']::text[],
 'aspiration', ARRAY['culture', 'event']::text[],
 NULL, 'VERIFIED'),

('sky_tower', 'N-2', 'KR', 'YEOSU',
 '스카이타워', 'Sky Tower', '박람회장길 57', 34.7512, 127.7468,
 'indoor_outdoor', 60,
 ARRAY['family', 'kids_ok', 'young_adults']::text[],
 ARRAY['clear', 'all_season']::text[],
 'achievement', ARRAY['view', 'landmark', 'modern']::text[],
 NULL, 'VERIFIED'),

('marine_park', 'N-3', 'KR', 'YEOSU',
 '해양공원', 'Marine Park', '해양공원로', 34.7488, 127.7475,
 'outdoor', 75,
 ARRAY['family', 'kids_ok', 'elderly']::text[],
 ARRAY['clear', 'all_season']::text[],
 'joy', ARRAY['nature', 'recreation']::text[],
 NULL, 'VERIFIED'),

-- EAST (3/3, including ORIGIN-001 dedup with E-1)
('odongdo', 'E-1', 'KR', 'YEOSU',
 '오동도', 'Odongdo Island', '오동도로 222', 34.7602, 127.7655,
 'outdoor', 120,
 ARRAY['family', 'kids_ok', 'elderly', 'groups']::text[],
 ARRAY['clear', 'clear_dry', 'spring']::text[],
 'vitality', ARRAY['nature', 'seasonal', 'growth']::text[],
 'ORIGIN-001', 'ORIGIN'),

('cablecar', 'E-2', 'KR', 'YEOSU',
 '케이블카', 'Sea Cable Car', '오동도로 61-11', 34.7428, 127.7562,
 'outdoor', 45,
 ARRAY['family', 'kids_ok', 'young_adults']::text[],
 ARRAY['clear', 'all_season']::text[],
 'expansion', ARRAY['view', 'adventure', 'modern']::text[],
 NULL, 'VERIFIED'),

('jaisan_park', 'E-3', 'KR', 'YEOSU',
 '자산공원', 'Jaisan Park', '오동도로 인근', 34.7480, 127.7540,
 'outdoor', 30,
 ARRAY['family', 'kids_ok', 'elderly']::text[],
 ARRAY['clear', 'all_season']::text[],
 'insight', ARRAY['view', 'quiet', 'observation']::text[],
 NULL, 'VERIFIED');

-- Verification counts:
-- DEDUPLICATED: 2 places (E-1+ORIGIN-001=odongdo, S-1+ORIGIN-002=hyangiram)
-- TOTAL UNIQUE: 14 places (12 from star_zones + 2 from ORIGIN, net 14)
-- ALL trust_level values: 2 ORIGIN, 12 VERIFIED
-- Status all: unknown (set by travel_live_status seed)
