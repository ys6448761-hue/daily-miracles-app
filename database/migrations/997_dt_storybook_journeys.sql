-- Migration 997: RAMADA Storybook Journey Foundation — Journey Table
-- Purpose: Store storybook journey metadata, restore tokens, and status tracking
-- Scope: C2 RAMADA (Restore + API + Storage Foundation)
-- Status: Prepared, NOT EXECUTED per C2 scope
-- Created: 2026-08-29

-- Create dt_storybook_journeys table
CREATE TABLE IF NOT EXISTS dt_storybook_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE,
  restore_token_hash VARCHAR(64) NOT NULL UNIQUE,
  wish_text TEXT,
  source_hotel VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'started',
  operator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  star_planted_at TIMESTAMP WITH TIME ZONE,
  star_id UUID,
  is_private BOOLEAN DEFAULT false,
  deletion_requested_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Constraints
ALTER TABLE dt_storybook_journeys
ADD CONSTRAINT check_status CHECK (
  status IN (
    'started',
    'photos_in_progress',
    'photos_complete',
    'art_in_progress',
    'storybook_complete',
    'star_planted'
  )
);

-- Indexes for common queries
CREATE INDEX idx_dt_storybook_journeys_session_id ON dt_storybook_journeys(session_id);
CREATE INDEX idx_dt_storybook_journeys_restore_token ON dt_storybook_journeys(restore_token_hash);
CREATE INDEX idx_dt_storybook_journeys_status ON dt_storybook_journeys(status);
CREATE INDEX idx_dt_storybook_journeys_star_id ON dt_storybook_journeys(star_id);
CREATE INDEX idx_dt_storybook_journeys_expires_at ON dt_storybook_journeys(expires_at);

-- Comments
COMMENT ON TABLE dt_storybook_journeys IS
  'RAMADA Storybook Journey metadata. Each journey represents one user''s photo + art + narrative flow. Restore token allows session recovery via email.';
COMMENT ON COLUMN dt_storybook_journeys.id IS
  'Unique journey identifier (UUID).';
COMMENT ON COLUMN dt_storybook_journeys.session_id IS
  'FK to application session. 1:1 relationship. Allows session restore.';
COMMENT ON COLUMN dt_storybook_journeys.restore_token_hash IS
  'SHA256 hash of restore token (never store plaintext). Used for GET /api/storybook/restore?token=...';
COMMENT ON COLUMN dt_storybook_journeys.wish_text IS
  'Optional user wish or narrative. Captured during journey start or later steps.';
COMMENT ON COLUMN dt_storybook_journeys.source_hotel IS
  'Origin location (e.g., "Jeju", "Seoul"). Metadata for journey context.';
COMMENT ON COLUMN dt_storybook_journeys.status IS
  'Journey lifecycle: started → photos_in_progress → photos_complete → art_in_progress → storybook_complete → star_planted';
COMMENT ON COLUMN dt_storybook_journeys.operator_notes IS
  'Internal notes (admin/operator use). May contain moderation reason or context.';
COMMENT ON COLUMN dt_storybook_journeys.completed_at IS
  'Timestamp when storybook reached "storybook_complete" status. Null until completion.';
COMMENT ON COLUMN dt_storybook_journeys.star_planted_at IS
  'Timestamp when star was planted (status → star_planted). Links to star_id.';
COMMENT ON COLUMN dt_storybook_journeys.star_id IS
  'FK to dt_stars (if journey resulted in star planting). Null until star is created.';
COMMENT ON COLUMN dt_storybook_journeys.is_private IS
  'Privacy flag. If true, storybook not visible in public resonance feed.';
COMMENT ON COLUMN dt_storybook_journeys.deletion_requested_at IS
  'Soft-delete marker. User requested deletion at this timestamp. Data remains in DB for GDPR audit trail.';
COMMENT ON COLUMN dt_storybook_journeys.expires_at IS
  'Restore token expiration (30 days from created_at). Journey may remain visible/accessible after expiry, but restore_token becomes invalid.';
