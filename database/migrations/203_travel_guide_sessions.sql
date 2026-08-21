-- Migration 203: travel_guide_sessions
-- Session management: inactivity 120min + absolute 12h timeout
-- Created: 2026-08-21

CREATE TABLE IF NOT EXISTS travel_guide_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- === Context ===
  context JSONB NOT NULL,

  -- === Timing ===
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP NOT NULL DEFAULT NOW(),
  inactivity_timeout_minutes INT NOT NULL DEFAULT 120,
  absolute_timeout_hours INT NOT NULL DEFAULT 12,

  expires_at TIMESTAMP NOT NULL,
  -- Note: is_valid computed at application level (NOW() < expires_at)
  -- GENERATED ALWAYS AS not used due to immutability constraint with NOW()

  -- === Meta ===
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_sessions_user ON travel_guide_sessions(created_at DESC);
CREATE INDEX idx_sessions_expires ON travel_guide_sessions(expires_at);

COMMENT ON TABLE travel_guide_sessions IS 'User sessions: 120분 inactivity + 12시간 절대값';
COMMENT ON COLUMN travel_guide_sessions.context IS 'TravelGuideContext (JSON)';
COMMENT ON COLUMN travel_guide_sessions.expires_at IS 'min(inactivity_expires_at, absolute_expires_at)';
