-- Migration 205: Travel Guide User ID Linkage
-- Add user_id to travel_guide_sessions for unified identity tracking
-- Created: 2026-08-22

ALTER TABLE travel_guide_sessions
  ADD COLUMN IF NOT EXISTS user_id VARCHAR(36);

CREATE INDEX IF NOT EXISTS idx_travel_guide_sessions_user_id
  ON travel_guide_sessions(user_id);

COMMENT ON COLUMN travel_guide_sessions.user_id IS 'Unified user identity (dt_user_id from localStorage, UUID v4 string)';
