-- 216_travel_places_core12_reality_v01.sql
-- Travel Intelligence Core 12 — Reality Data V0.1
-- Approved: 2026-09-22 Founder session
-- Scope: Identity corrections, fee classification, hours, live_status_required
-- Mode: idempotent UPDATE only — no DELETE, no INSERT, no schema change

-- ── Identity corrections ────────────────────────────────────────────────────

-- dolsan_nightscape → 돌산공원 (long-standing identity correction)
UPDATE travel_places SET
  name_ko = '돌산공원',
  name_en = 'Dolsan Park',
  address  = NULL,
  updated_at = NOW()
WHERE code = 'dolsan_nightscape'
  AND (name_ko IS DISTINCT FROM '돌산공원'
    OR name_en IS DISTINCT FROM 'Dolsan Park'
    OR address IS NOT NULL);

-- marine_park → 종포해양공원
UPDATE travel_places SET
  name_ko = '종포해양공원',
  updated_at = NOW()
WHERE code = 'marine_park'
  AND name_ko IS DISTINCT FROM '종포해양공원';

-- ── Admission fee classification ─────────────────────────────────────────────

-- FREE places: entry is free (adult = 0)
-- Includes: outdoor public spaces, cultural/natural access points, food streets
UPDATE travel_places SET
  admission_fee_json = '{"adult": 0}'::jsonb,
  updated_at = NOW()
WHERE code IN (
  'dolsan_daegyo',
  'dolsan_nightscape',
  'hyangiram',
  'jaisan_park',
  'lee_soon_shin_plaza',
  'marine_park',
  'odongdo',
  'jungang_market',
  'romantic_pojangmacha'
)
AND (admission_fee_json IS NULL
  OR admission_fee_json IS DISTINCT FROM '{"adult": 0}'::jsonb);

-- sky_tower: PAID — confirmed fee schedule
UPDATE travel_places SET
  admission_fee_json = '{"adult": 3000, "youth": 2500, "senior": 2500, "child": 1500}'::jsonb,
  updated_at = NOW()
WHERE code = 'sky_tower'
  AND admission_fee_json IS DISTINCT FROM
    '{"adult": 3000, "youth": 2500, "senior": 2500, "child": 1500}'::jsonb;

-- cablecar: PAID — leave null (exact Commerce amount handled separately)
-- No UPDATE here — cablecar admission_fee_json stays NULL for TI purposes.
-- Commerce price: list=17,000 / sell=16,000 (quotePriceData.js v1.3)

-- ── Opening hours ─────────────────────────────────────────────────────────────

-- sky_tower: 10:00-22:00 every day
UPDATE travel_places SET
  opening_hours_json = '{
    "mon": "10:00-22:00",
    "tue": "10:00-22:00",
    "wed": "10:00-22:00",
    "thu": "10:00-22:00",
    "fri": "10:00-22:00",
    "sat": "10:00-22:00",
    "sun": "10:00-22:00"
  }'::jsonb,
  updated_at = NOW()
WHERE code = 'sky_tower'
  AND opening_hours_json IS NULL;

-- romantic_pojangmacha: evening-only (18:00-01:00 nightly)
UPDATE travel_places SET
  opening_hours_json = '{
    "mon": "18:00-01:00",
    "tue": "18:00-01:00",
    "wed": "18:00-01:00",
    "thu": "18:00-01:00",
    "fri": "18:00-01:00",
    "sat": "18:00-01:00",
    "sun": "18:00-01:00"
  }'::jsonb,
  updated_at = NOW()
WHERE code = 'romantic_pojangmacha'
  AND opening_hours_json IS NULL;

-- ── romantic_pojangmacha address + weather ─────────────────────────────────

UPDATE travel_places SET
  address = '여수시 하멜로 102 (종화동 / 거북선대교 하부공간)',
  updated_at = NOW()
WHERE code = 'romantic_pojangmacha'
  AND (address IS NULL
    OR address IS DISTINCT FROM '여수시 하멜로 102 (종화동 / 거북선대교 하부공간)');

-- Add 'night' to weather_suitable (idempotent — only if not already present)
UPDATE travel_places SET
  weather_suitable = array_append(weather_suitable, 'night'),
  updated_at = NOW()
WHERE code = 'romantic_pojangmacha'
  AND NOT ('night' = ANY(weather_suitable));

-- ── live_status_required: outdoor public spaces → FALSE ──────────────────────
-- These are always accessible — no need to warn "verify operation before visiting"

UPDATE travel_places SET
  live_status_required = false,
  updated_at = NOW()
WHERE code IN (
  'dolsan_daegyo',
  'dolsan_nightscape',
  'jaisan_park',
  'lee_soon_shin_plaza',
  'marine_park'
)
AND live_status_required = true;
