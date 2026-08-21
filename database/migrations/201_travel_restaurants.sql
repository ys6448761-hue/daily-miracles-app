-- Migration 201: travel_restaurants
-- Food/Restaurant data for Travel Guide V0 (Curated)
-- Created: 2026-08-21

CREATE TABLE IF NOT EXISTS travel_restaurants (
  id SERIAL PRIMARY KEY,

  -- === Identity ===
  code VARCHAR(50) UNIQUE NOT NULL,
  country_code VARCHAR(10) NOT NULL DEFAULT 'KR',
  city_code VARCHAR(30) NOT NULL DEFAULT 'YEOSU',
  UNIQUE(country_code, city_code, code),

  -- === Basic ===
  name VARCHAR(100) NOT NULL,
  description_short VARCHAR(300),
  cuisine_type VARCHAR(50),

  -- === Location ===
  address VARCHAR(300),
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  phone VARCHAR(20),

  -- === Context ===
  meal_context TEXT[],
  suitable_for TEXT[],
  avg_price_range VARCHAR(20),

  -- === Operation (Static/Verified) ===
  opening_hours_json JSONB,
  closed_day VARCHAR(50),
  last_order_time VARCHAR(10),
  reservation_required BOOLEAN DEFAULT false,

  -- === Features ===
  features TEXT[],
  nearby_places TEXT[],

  -- === Source ===
  source VARCHAR(30),
  naver_rating DECIMAL(2,1),
  source_url TEXT,

  -- === Meta ===
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_restaurants_city ON travel_restaurants(country_code, city_code);
CREATE INDEX idx_restaurants_meal ON travel_restaurants USING GIN(meal_context);
CREATE INDEX idx_restaurants_suitable ON travel_restaurants USING GIN(suitable_for);

COMMENT ON TABLE travel_restaurants IS 'Curated 식당 데이터 (V0: 10개)';
COMMENT ON COLUMN travel_restaurants.last_order_time IS '마지막 주문 시간 (예: 22:00)';
COMMENT ON COLUMN travel_restaurants.source IS 'VERIFIED | NAVER | TRUSTED_SOURCE';
