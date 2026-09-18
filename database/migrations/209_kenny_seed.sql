-- Migration 209: Kenny Hotel seed data for FLOW MVP
-- Purpose: Establish Kenny Hotel as dt_partners + dt_accommodations records
-- Note: DreamTown allocation (dt_flow_inventory) is NOT seeded here —
--       allocation is admin-controlled per date.
-- UUIDs are fixed for idempotent re-runs.
-- Created: 2026-09-16

-- ── Kenny Hotel partner ──────────────────────────────────────────────────────

INSERT INTO dt_partners (
  id,
  city_code,
  name,
  category,
  description,
  is_active
)
VALUES (
  'aa000001-0000-4000-8000-000000000001'::uuid,
  'yeosu',
  '케니 호텔',
  'accommodation',
  '여수 케니 호텔 — DreamTown FLOW 파일럿 파트너 (주중 객실 운영)',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── Kenny room types ─────────────────────────────────────────────────────────

-- 오션디럭스 더블 (2인 기준)
INSERT INTO dt_accommodations (
  id,
  partner_id,
  room_type,
  room_code,
  base_occupancy,
  max_occupancy,
  is_available
)
VALUES (
  'aa000002-0000-4000-8000-000000000002'::uuid,
  'aa000001-0000-4000-8000-000000000001'::uuid,
  'double',
  'KENNY_OCEAN_DBL',
  2,
  2,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 오션패밀리 트윈 (3인 기준)
INSERT INTO dt_accommodations (
  id,
  partner_id,
  room_type,
  room_code,
  base_occupancy,
  max_occupancy,
  is_available
)
VALUES (
  'aa000003-0000-4000-8000-000000000003'::uuid,
  'aa000001-0000-4000-8000-000000000001'::uuid,
  'twin',
  'KENNY_OCEAN_TWN',
  2,
  3,
  true
)
ON CONFLICT (id) DO NOTHING;
