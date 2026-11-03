-- Migration 210: dt_sodam_decisions (SODAM Eligibility Decision Audit Log)
-- Purpose: Persist every SODAM decision for audit trail and hold authorization
-- Requires: 208_flow_schema.sql (dt_flow_inventory)
-- Created: 2026-09-17

CREATE TABLE IF NOT EXISTS dt_sodam_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Verified identity: server-resolved from JWT, never from client body
  sowon_id UUID NOT NULL,

  -- USER_EXPLICIT inputs at decision time
  stay_date DATE NOT NULL,
  party_size INTEGER NOT NULL CHECK (party_size > 0),

  -- Decision outcome
  decision_type VARCHAR(20) NOT NULL
    CHECK (decision_type IN ('OFFER', 'ALTERNATIVE', 'NO_OFFER')),
  reason_codes TEXT[] NOT NULL DEFAULT '{}',

  -- Offered candidate (null for NO_OFFER)
  -- Stored as JSONB to capture full room snapshot at decision time
  candidate JSONB,

  -- Denormalized for efficient hold authorization lookup
  inventory_id UUID,

  -- Price at decision time
  price_sell INTEGER,
  price_source VARCHAR(50),
  price_source_version VARCHAR(50),

  -- Immutable audit timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dt_sodam_decisions_sowon_id
  ON dt_sodam_decisions(sowon_id);

CREATE INDEX IF NOT EXISTS idx_dt_sodam_decisions_created_at
  ON dt_sodam_decisions(created_at DESC);
