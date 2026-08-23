-- Migration 206: Accessibility status for unverified data safety
-- Purpose: Distinguish unknown (unverified) from verified_no (confirmed inaccessible)
-- Created: 2026-08-23

-- Add status columns (default to 'unknown' — no time-based conversion allowed)
ALTER TABLE travel_places
ADD COLUMN accessibility_wheelchair_status VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN accessibility_stroller_status VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN bus_accessible_status VARCHAR(20) DEFAULT 'unknown';

-- Add constraints
ALTER TABLE travel_places
ADD CONSTRAINT check_accessibility_wheelchair_status
  CHECK (accessibility_wheelchair_status IN ('unknown', 'verified_yes', 'verified_no')),
ADD CONSTRAINT check_accessibility_stroller_status
  CHECK (accessibility_stroller_status IN ('unknown', 'verified_yes', 'verified_no')),
ADD CONSTRAINT check_bus_accessible_status
  CHECK (bus_accessible_status IN ('unknown', 'verified_yes', 'verified_no'));

-- Add indexes for filtering
CREATE INDEX idx_travel_places_wheelchair_status ON travel_places(accessibility_wheelchair_status);
CREATE INDEX idx_travel_places_stroller_status ON travel_places(accessibility_stroller_status);
CREATE INDEX idx_travel_places_bus_status ON travel_places(bus_accessible_status);

-- Data: All 12 Yeosu places default to 'unknown' (no verification yet)
UPDATE travel_places
SET
  accessibility_wheelchair_status = 'unknown',
  accessibility_stroller_status = 'unknown',
  bus_accessible_status = 'unknown'
WHERE country_code = 'KR' AND city_code = 'YEOSU';

-- Comments
COMMENT ON COLUMN travel_places.accessibility_wheelchair_status IS
  'Wheelchair accessibility: unknown=unverified (default), verified_yes=confirmed accessible, verified_no=confirmed inaccessible. Unknown status must NOT be converted to verified_no over time.';
COMMENT ON COLUMN travel_places.accessibility_stroller_status IS
  'Stroller accessibility: unknown=unverified (default), verified_yes=confirmed accessible, verified_no=confirmed inaccessible. Unknown status must NOT be converted to verified_no over time.';
COMMENT ON COLUMN travel_places.bus_accessible_status IS
  'Public transport (bus) accessibility: unknown=unverified (default), verified_yes=confirmed accessible, verified_no=confirmed inaccessible. Unknown status must NOT be converted to verified_no over time.';
