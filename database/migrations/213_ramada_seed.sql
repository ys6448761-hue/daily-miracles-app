-- Migration 213: Ramada Hotel seed data for FLOW MVP
-- Purpose: Establish 라마다 호텔 as dt_partners + dt_accommodations records
-- Evidence: Partner relationship FOUNDER_CONFIRMED (2026-09-17)
-- Room names: "오션디럭스 더블" / "오션패밀리 트윈" FOUNDER_CONFIRMED (2026-09-17)
-- Note: DreamTown allocation (dt_flow_inventory) is NOT seeded here —
--       allocation is admin-controlled per date.
-- Note: partner_configs (PIN) seeded separately via tmp/run-ramada-partner-seed.js
-- UUIDs are fixed for idempotent re-runs (bb... prefix, parallel to Kenny aa...)
-- Created: 2026-09-17

-- ── Ramada Hotel partner ──────────────────────────────────────────────────────

INSERT INTO dt_partners (
  id,
  city_code,
  name,
  category,
  partner_code,
  description,
  is_active
)
VALUES (
  'bb000001-0000-4000-8000-000000000001'::uuid,
  'yeosu',
  '라마다 호텔',
  'accommodation',
  'RAMADA',
  '여수 라마다 호텔 — DreamTown FLOW 두 번째 파트너 (기존 협력업체)',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ── Ramada room types ─────────────────────────────────────────────────────────

-- 오션디럭스 더블 (2인) — FOUNDER_CONFIRMED room name
INSERT INTO dt_accommodations (
  id,
  partner_id,
  room_type,
  room_code,
  base_occupancy,
  max_occupancy,
  is_available,
  meta
)
VALUES (
  'bb000002-0000-4000-8000-000000000002'::uuid,
  'bb000001-0000-4000-8000-000000000001'::uuid,
  'double',
  'RAMADA_OCEAN_DBL',
  2,
  2,
  true,
  '{"display_name": "오션디럭스 더블"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 오션패밀리 트윈 (2~4인) — FOUNDER_CONFIRMED room name
INSERT INTO dt_accommodations (
  id,
  partner_id,
  room_type,
  room_code,
  base_occupancy,
  max_occupancy,
  is_available,
  meta
)
VALUES (
  'bb000003-0000-4000-8000-000000000003'::uuid,
  'bb000001-0000-4000-8000-000000000001'::uuid,
  'twin',
  'RAMADA_OCEAN_TWN',
  2,
  4,
  true,
  '{"display_name": "오션패밀리 트윈"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
