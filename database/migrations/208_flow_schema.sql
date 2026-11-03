-- Migration 208: FLOW Inventory Schema
-- Purpose: Kenny Hotel accommodation availability tracking for DreamTown FLOW MVP
-- Tables: dt_flow_inventory, dt_flow_holds, dt_flow_bookings
-- Concurrency: SELECT FOR UPDATE on dt_flow_inventory prevents double-booking
-- Security: sowon_id stored server-side only — never trusted from client body/query
-- Created: 2026-09-16

-- ── Inventory: DreamTown-allocated room availability by date ─────────────────

CREATE TABLE IF NOT EXISTS dt_flow_inventory (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which room + which night
  accommodation_id UUID        NOT NULL REFERENCES dt_accommodations(id) ON DELETE RESTRICT,
  stay_date        DATE        NOT NULL,

  -- DreamTown's allocation (NOT the hotel's total — admin-controlled)
  allocated_count  INTEGER     NOT NULL DEFAULT 0
                   CHECK (allocated_count >= 0),

  -- Booking cutoff: admin may close allocation at end of cutoff_date
  cutoff_date      DATE,

  -- Lifecycle state
  status           VARCHAR(20) NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open', 'closed', 'sold_out')),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT uq_flow_inventory_accommodation_date UNIQUE (accommodation_id, stay_date)
);

CREATE INDEX IF NOT EXISTS idx_dt_flow_inventory_accommodation
  ON dt_flow_inventory(accommodation_id, stay_date, status);

-- ── Holds: temporary reservations (TTL-gated) ────────────────────────────────

CREATE TABLE IF NOT EXISTS dt_flow_holds (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  inventory_id   UUID        NOT NULL REFERENCES dt_flow_inventory(id) ON DELETE RESTRICT,

  -- Server-verified SOWON_ID — populated ONLY from verified JWT claim
  -- NEVER from req.body, req.query, session_key, or phone
  sowon_id       UUID        NOT NULL,

  quantity       INTEGER     NOT NULL DEFAULT 1
                 CHECK (quantity > 0),

  -- Lifecycle: active → consumed (on booking) | active → released (explicit/expired)
  status         VARCHAR(20) NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'released', 'consumed')),

  -- Server-set expiry — client cannot influence TTL
  expires_at     TIMESTAMPTZ NOT NULL,

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_flow_holds_inventory_active
  ON dt_flow_holds(inventory_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_dt_flow_holds_sowon
  ON dt_flow_holds(sowon_id, status);

-- ── Bookings: confirmed accommodation reservations ────────────────────────────

CREATE TABLE IF NOT EXISTS dt_flow_bookings (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  inventory_id   UUID        NOT NULL REFERENCES dt_flow_inventory(id) ON DELETE RESTRICT,

  -- hold_id required for MVP (hold-then-book flow)
  hold_id        UUID        REFERENCES dt_flow_holds(id) ON DELETE RESTRICT,

  -- Server-verified SOWON_ID — same source-of-truth rule as dt_flow_holds
  sowon_id       UUID        NOT NULL,

  quantity       INTEGER     NOT NULL DEFAULT 1
                 CHECK (quantity > 0),

  status         VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                 CHECK (status IN ('confirmed', 'cancelled')),

  -- Customer details (PII — masked on non-admin responses in application layer)
  customer_name  VARCHAR(100),
  phone          VARCHAR(20),

  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_flow_bookings_inventory
  ON dt_flow_bookings(inventory_id, status);
CREATE INDEX IF NOT EXISTS idx_dt_flow_bookings_sowon
  ON dt_flow_bookings(sowon_id, status);
CREATE INDEX IF NOT EXISTS idx_dt_flow_bookings_hold
  ON dt_flow_bookings(hold_id);
