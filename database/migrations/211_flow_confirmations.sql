-- Migration 211: Flow Actual Use Confirmation
-- Purpose: Immutable partner-confirmed actual-use evidence for Kenny accommodation
--
-- Creates: dt_flow_confirmations
-- Data:    Kenny dt_partners.partner_code = 'KENNY'
--          (partner_configs seed is handled separately by run-kenny-partner-seed.js)
--
-- Does NOT modify: dt_flow_bookings, dt_flow_inventory, dt_flow_holds
-- dt_partners.partner_code column already exists (migration 105)
-- Created: 2026-09-17

-- ── dt_flow_confirmations ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dt_flow_confirmations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which booking this confirms
  booking_id           UUID        NOT NULL
                       REFERENCES dt_flow_bookings(id) ON DELETE RESTRICT,

  -- Which partner confirmed (from partner_configs, verified at application layer)
  confirmed_by         VARCHAR(50) NOT NULL,

  -- Server-generated timestamp — never accepted from client body/query
  confirmed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Confirmation method — extendable, only partner_pin for MVP
  confirmation_method  VARCHAR(20) NOT NULL DEFAULT 'partner_pin'
                       CHECK (confirmation_method IN ('partner_pin')),

  -- One confirmation per booking enforced at DB level
  CONSTRAINT uq_flow_confirmation_booking UNIQUE (booking_id)
);

CREATE INDEX IF NOT EXISTS idx_dt_flow_confirmations_booking
  ON dt_flow_confirmations(booking_id);

CREATE INDEX IF NOT EXISTS idx_dt_flow_confirmations_partner
  ON dt_flow_confirmations(confirmed_by, confirmed_at);

-- ── Kenny partner identity link ───────────────────────────────────────────────
-- dt_partners.partner_code column added in migration 105 (already exists).
-- Kenny seeded in migration 209 without partner_code — set it now.

UPDATE dt_partners
SET partner_code = 'KENNY'
WHERE id = 'aa000001-0000-4000-8000-000000000001'::uuid
  AND partner_code IS NULL;
