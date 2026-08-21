-- Seed 002: travel_live_status
-- Initial status: all UNKNOWN (no preset assumptions)
-- Created: 2026-08-21
-- V0 Policy: Manual operator input only, no automated data source

INSERT INTO travel_live_status (
  place_code, country_code, city_code,
  status, reason,
  manually_updated_at, automated_data_source,
  created_at
) VALUES

-- SOUTH
('hyangiram', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('dolsan_daegyo', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('dolsan_nightscape', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),

-- WEST
('lee_soon_shin_plaza', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('romantic_pojangmacha', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('jungang_market', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),

-- NORTH
('yeosu_expo_park', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('sky_tower', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('marine_park', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),

-- EAST
('odongdo', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('cablecar', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW()),
('jaisan_park', 'KR', 'YEOSU', 'unknown', NULL, NULL, NULL, NOW());

-- Total records: 14 (one per unique place)
-- Policy: V0 has no automated data source. Manual updates only.
-- Operator adds status when verified (e.g., "open", "closed", "partial", or reason like "우천운휴")
