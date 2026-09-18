-- Migration 189: dt_accommodations (DreamTown Flow호텔 객실)
-- Purpose: DreamTown Flow hotel room inventory management (Ramada, etc.)
-- Note: Separate from legacy yeosu_miracle_travel.accommodations (yeosu booking system)
-- Foreign Key: dt_partners(id) — accommodation belongs to a partner
-- Pricing: managed separately in rates table (migration 190)
-- Status: Active (Flow v0.1+)
-- Created: 2026-09-08
-- Architecture: Option C — preserve existing accommodations table, new Flow table is dt_accommodations

CREATE TABLE IF NOT EXISTS dt_accommodations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Partner reference (hotel/accommodation operator)
  partner_id UUID NOT NULL REFERENCES dt_partners(id) ON DELETE CASCADE,

  -- Room identity & capacity
  room_type VARCHAR(50) NOT NULL,           -- single, double, family, suite, etc.
  room_code VARCHAR(20),                    -- optional: RM_001, RM_202, etc.

  -- Occupancy (required for rate matching: party_min <= party_size <= party_max)
  base_occupancy INTEGER NOT NULL           -- rate calculation basis (typically 1 or 2)
    CHECK (base_occupancy >= 1),
  max_occupancy INTEGER NOT NULL            -- hard ceiling
    CHECK (max_occupancy >= base_occupancy),

  -- Status & availability
  is_available BOOLEAN NOT NULL DEFAULT true,

  -- Metadata (JSONB for extensibility: view, floor, amenities, etc.)
  -- NOT used for pricing (queryable columns only in rates table)
  meta JSONB,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_dt_accommodations_room_type_not_empty CHECK (room_type != ''),
  CONSTRAINT chk_dt_accommodations_room_code_format CHECK (room_code ~ '^[A-Z0-9_]*$' OR room_code IS NULL)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_dt_accommodations_partner_id
  ON dt_accommodations(partner_id);
CREATE INDEX IF NOT EXISTS idx_dt_accommodations_partner_type
  ON dt_accommodations(partner_id, room_type);
CREATE INDEX IF NOT EXISTS idx_dt_accommodations_occupancy
  ON dt_accommodations(base_occupancy, max_occupancy);
