-- Migration 998: RAMADA Storybook Journey Foundation — Assets Table
-- Purpose: Store uploaded photos (REAL), generated art (Story Art), for storybook journeys
-- Scope: C2 RAMADA (Journey + Asset Foundation)
-- Status: Prepared, NOT EXECUTED per C2 scope
-- Created: 2026-08-29
-- Fixed: 2026-08-30 (Schema alignment with Golden 9 contract)

-- Create dt_storybook_assets table
CREATE TABLE IF NOT EXISTS dt_storybook_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID NOT NULL,
  location VARCHAR(64) NOT NULL,
  slot VARCHAR(32) NOT NULL,
  object_key VARCHAR(512) NOT NULL,
  mime_type VARCHAR(64) NOT NULL,
  byte_size INTEGER NOT NULL,
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  FOREIGN KEY (journey_id) REFERENCES dt_storybook_journeys(id) ON DELETE CASCADE,
  CONSTRAINT unique_journey_location_slot UNIQUE (journey_id, location, slot)
);

-- Constraints: Location (Golden 9 canonical locations)
ALTER TABLE dt_storybook_assets
ADD CONSTRAINT check_location CHECK (
  location IN (
    'jinamgwan',
    'cablecar',
    'jongpo'
  )
),
-- Constraints: Slot (Golden 9 canonical slots: real_a, real_b, story_art)
ADD CONSTRAINT check_slot CHECK (
  slot IN (
    'real_a',
    'real_b',
    'story_art'
  )
),
-- Constraints: Status (asset lifecycle)
ADD CONSTRAINT check_status CHECK (
  status IN ('pending', 'approved', 'rejected')
);

-- Indexes for efficient queries
CREATE INDEX idx_dt_storybook_assets_journey_id ON dt_storybook_assets(journey_id);
CREATE INDEX idx_dt_storybook_assets_location ON dt_storybook_assets(location);
CREATE INDEX idx_dt_storybook_assets_status ON dt_storybook_assets(status);
CREATE INDEX idx_dt_storybook_assets_uploaded_at ON dt_storybook_assets(uploaded_at);
CREATE INDEX idx_dt_storybook_assets_object_key ON dt_storybook_assets(object_key);

-- Comments
COMMENT ON TABLE dt_storybook_assets IS
  'Golden 9-Cut asset storage (RAMADA Storybook). Canonical 9 slots: jinamgwan/real_a, jinamgwan/real_b, jinamgwan/story_art, cablecar/real_a, cablecar/real_b, cablecar/story_art, jongpo/real_a, jongpo/real_b, jongpo/story_art. Multi-location storage: local FS (dev), S3/R2 (prod).';
COMMENT ON COLUMN dt_storybook_assets.id IS
  'Unique asset identifier (UUID).';
COMMENT ON COLUMN dt_storybook_assets.journey_id IS
  'FK to dt_storybook_journeys. Cascade delete ensures orphan cleanup. Exactly 9 assets per journey (or fewer if incomplete).';
COMMENT ON COLUMN dt_storybook_assets.location IS
  'Canonical location (Golden 9): jinamgwan (❤️ 품다), cablecar (🌬️ 보내다), jongpo (⭐ 심다). Maps to 3×3 grid rows.';
COMMENT ON COLUMN dt_storybook_assets.slot IS
  'Canonical slot (Golden 9): real_a (customer photo A), real_b (customer photo B), story_art (operator artwork). Maps to 3×3 grid columns.';
COMMENT ON COLUMN dt_storybook_assets.object_key IS
  'Storage object key: storybook/journeys/{journey_id}/{location}/{slot}.{ext}. Immutable after upload. Enables dev/prod storage parity via adapter pattern.';
COMMENT ON COLUMN dt_storybook_assets.mime_type IS
  'MIME type (image/jpeg, image/png, image/webp). Used for Content-Type headers and validation. EXIF removed before storage.';
COMMENT ON COLUMN dt_storybook_assets.byte_size IS
  'File size in bytes. For quota enforcement (5MB customer, 10MB operator). Immutable.';
COMMENT ON COLUMN dt_storybook_assets.uploaded_by IS
  'Client identifier (customer_uuid for REAL, admin_uuid for story_art). Audit trail.';
COMMENT ON COLUMN dt_storybook_assets.uploaded_at IS
  'Timestamp of asset creation/upload. Immutable. Used for ordering in canonical sequence.';
COMMENT ON COLUMN dt_storybook_assets.status IS
  'Asset lifecycle: pending (uploaded, not validated yet) → approved (ready for Golden 9 display) | rejected (failed validation, customer re-upload needed). Default pending.';
COMMENT ON COLUMN dt_storybook_assets.rejection_reason IS
  'If status=rejected, reason code (e.g., "invalid_format", "too_large", "invalid_exif"). Null for other statuses.';
