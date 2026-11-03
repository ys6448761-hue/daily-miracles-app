-- ══════════════════════════════════════════════════════════════
-- Migration: 020_sowon_identity_v0.sql
-- Purpose: SOWON_ID Core — Additive relationship continuity identity
-- Date: 2026-09-12
-- ══════════════════════════════════════════════════════════════

-- ── sowon_identity_map: SOWON_ID lifecycle root ────────────────
CREATE TABLE IF NOT EXISTS sowon_identity_map (
  sowon_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lifecycle metadata
  creation_source VARCHAR(50) NOT NULL,  -- 'qr_entry', 'phone_auth', 'migration', etc
  is_anonymous BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  first_verified_at TIMESTAMP,  -- When first VERIFIED identifier added
  last_activity_at TIMESTAMP
);

CREATE INDEX idx_sowon_created_at ON sowon_identity_map(created_at);
CREATE INDEX idx_sowon_first_verified ON sowon_identity_map(first_verified_at);

-- ── sowon_identity_bindings: Identifier tracking + conflict detection ─
CREATE TABLE IF NOT EXISTS sowon_identity_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- FK to SOWON_ID lifecycle root
  sowon_id UUID NOT NULL REFERENCES sowon_identity_map(sowon_id) ON DELETE CASCADE,

  -- Identifier classification
  identifier_type VARCHAR(50) NOT NULL,  -- 'session_key', 'phone', 'email', 'oauth', 'user_id', etc
  identifier_value VARCHAR(256) NOT NULL,  -- PII: phone, email, etc

  -- Binding status: trust level of this identifier as proof of ownership
  binding_status VARCHAR(50) NOT NULL,  -- 'VERIFIED', 'USER_EXPLICIT', 'UNVERIFIED'

  -- Verification proof audit
  verification_method VARCHAR(50),  -- 'SMS', 'EMAIL_CONFIRM', 'OAUTH', null for unverified
  verification_proof VARCHAR(512),  -- Token, nonce, JWT for audit

  -- Binding lifecycle
  linked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  first_verified_at TIMESTAMP,  -- When this identifier was first VERIFIED

  -- Merge conflict resolution (Commit 1B decision point)
  merge_candidate_resolution VARCHAR(50),  -- 'ACCEPTED', 'REJECTED', 'PENDING_USER_CONFIRMATION', null
  merge_decision_at TIMESTAMP,

  -- Constraints
  CONSTRAINT sowon_bindings_sowon_fk FOREIGN KEY (sowon_id) REFERENCES sowon_identity_map(sowon_id) ON DELETE CASCADE,
  CONSTRAINT sowon_bindings_unique_per_type UNIQUE (identifier_type, identifier_value),
  CONSTRAINT sowon_bindings_binding_status_check CHECK (binding_status IN ('VERIFIED', 'USER_EXPLICIT', 'UNVERIFIED')),
  CONSTRAINT sowon_bindings_not_null CHECK (identifier_type IS NOT NULL AND identifier_value IS NOT NULL AND binding_status IS NOT NULL)
);

-- Indexes for common lookups
CREATE INDEX idx_sowon_bindings_sowon_id ON sowon_identity_bindings(sowon_id);
CREATE INDEX idx_sowon_bindings_type_value ON sowon_identity_bindings(identifier_type, identifier_value);
CREATE INDEX idx_sowon_bindings_status ON sowon_identity_bindings(binding_status);
CREATE INDEX idx_sowon_bindings_linked_at ON sowon_identity_bindings(linked_at);

-- ══════════════════════════════════════════════════════════════
-- Rollback: DROP TABLE sowon_identity_bindings CASCADE;
--           DROP TABLE sowon_identity_map CASCADE;
-- ══════════════════════════════════════════════════════════════
