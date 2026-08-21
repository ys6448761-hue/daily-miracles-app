-- Migration 204: travel_guide_events
-- Analytics: Anonymous (session_id only, no personal ID)
-- Created: 2026-08-21

CREATE TABLE IF NOT EXISTS travel_guide_events (
  id SERIAL PRIMARY KEY,

  -- === Session (Anonymous) ===
  session_id UUID NOT NULL,
  FOREIGN KEY (session_id) REFERENCES travel_guide_sessions(session_id),

  -- === Context ===
  country_code VARCHAR(10) NOT NULL DEFAULT 'KR',
  city_code VARCHAR(30) NOT NULL DEFAULT 'YEOSU',
  entry_point VARCHAR(50),
  user_mode VARCHAR(30),

  -- === Event ===
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,

  -- === Timing ===
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_events_session ON travel_guide_events(session_id);
CREATE INDEX idx_events_type ON travel_guide_events(event_type);
CREATE INDEX idx_events_time ON travel_guide_events(created_at DESC);

COMMENT ON TABLE travel_guide_events IS 'Privacy-first: session_id(익명) 기반, 개인정보 없음';
COMMENT ON COLUMN travel_guide_events.event_data IS 'JSON: wish_text(제거), wish_id(가능), 정확 위치(제거) 등';
COMMENT ON COLUMN travel_guide_events.event_type IS 'RECOMMEND_REQUESTED | PLACE_CLICKED | FALLBACK_OFFERED | RESERVATION_STARTED';
