-- Migration 200: travel_places
-- Foundation table for Travel Guide Places
-- Created: 2026-08-21

CREATE TABLE IF NOT EXISTS travel_places (
  id SERIAL PRIMARY KEY,

  -- === Identity ===
  code VARCHAR(50) UNIQUE NOT NULL,
  country_code VARCHAR(10) NOT NULL DEFAULT 'KR',
  city_code VARCHAR(30) NOT NULL DEFAULT 'YEOSU',
  UNIQUE(country_code, city_code, code),

  -- === Star Zones Connection ===
  -- Note: zone_code references star_zones but FK removed for Travel Guide V1 independence
  -- V1.5+ will enforce FK when integrated with Aurora5
  zone_code VARCHAR(10),

  -- === Basic Info ===
  name_ko VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  description_short VARCHAR(300),

  -- === Location ===
  address VARCHAR(300),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),

  -- === Contact ===
  phone_inquiry VARCHAR(20),
  official_website VARCHAR(500),

  -- === Operation ===
  opening_hours_json JSONB,
  admission_fee_json JSONB,
  access_by_bus TEXT[],
  access_by_car BOOLEAN DEFAULT true,
  parking_info VARCHAR(200),

  -- === Travel Context ===
  suitable_for TEXT[],
  weather_suitable TEXT[],
  indoor_outdoor VARCHAR(20),
  avg_stay_minutes INT,
  physical_difficulty VARCHAR(20),
  accessibility_wheelchair BOOLEAN DEFAULT false,
  accessibility_stroller BOOLEAN DEFAULT false,

  -- === Emotion ===
  emotion_primary VARCHAR(50),
  emotion_tags TEXT[],

  -- === Live Status ===
  live_status_required BOOLEAN DEFAULT true,

  -- === Fallback ===
  fallback_alternatives JSONB,
  critical_conditions JSONB,

  -- === Source ===
  origin_seed_id VARCHAR(30),
  trust_level VARCHAR(20),
  source_url TEXT,

  -- === Meta ===
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_travel_places_city ON travel_places(country_code, city_code);
CREATE INDEX idx_travel_places_zone ON travel_places(zone_code);
CREATE INDEX idx_travel_places_emotion ON travel_places USING GIN(emotion_tags);
CREATE INDEX idx_travel_places_suitable ON travel_places USING GIN(suitable_for);

COMMENT ON TABLE travel_places IS 'Travel Guide 관광지 데이터 (star_zones + ORIGIN 통합)';
COMMENT ON COLUMN travel_places.zone_code IS 'star_zones 참조 (별 배치 지역)';
COMMENT ON COLUMN travel_places.trust_level IS 'ORIGIN(문서) | VERIFIED(검증) | USER';
