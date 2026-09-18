-- Migration 207: Add owner_sowon_id to voyage_wishes
-- Purpose: P0-1/P0-2 ownership enforcement — explicit server-controlled owner column
-- Policy: NULL = legacy record (NO_SAFE_BACKFILL). New records must supply verified server-side SOWON_ID.
-- Legacy NULL records fail-closed on all owner-protected operations.

ALTER TABLE voyage_wishes
  ADD COLUMN IF NOT EXISTS owner_sowon_id UUID;

COMMENT ON COLUMN voyage_wishes.owner_sowon_id IS
  'Server-assigned SOWON_ID of the wish creator. '
  'NULL = legacy record with unknown owner (fail-closed on owner-protected ops). '
  'Never populated from client body/query/session_key. '
  'Set from verified GUEST JWT claim or authenticated USER SOWON context only.';
