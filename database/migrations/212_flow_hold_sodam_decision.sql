-- Migration 212: Link dt_flow_holds to dt_sodam_decisions
-- Purpose: Make the SODAM offer/promise snapshot directly traceable from a hold,
--          and therefore from any booking created from that hold.
-- Design: STEP 5F Option C — reuse existing dt_sodam_decisions.candidate JSONB
--          as the FIT Promise snapshot. FLOW does not own promise content.
-- Requires: 210_sodam_decisions.sql, 208_flow_schema.sql
-- Created: 2026-09-17

ALTER TABLE dt_flow_holds
  ADD COLUMN IF NOT EXISTS sodam_decision_id UUID
    REFERENCES dt_sodam_decisions(id) ON DELETE RESTRICT;

-- Forward lookup: given a decision, find its holds
CREATE INDEX IF NOT EXISTS idx_dt_flow_holds_sodam_decision
  ON dt_flow_holds(sodam_decision_id)
  WHERE sodam_decision_id IS NOT NULL;

-- Existing rows: sodam_decision_id remains NULL (no backfill).
-- For legacy holds, reconstruct via fuzzy join:
--   SELECT * FROM dt_sodam_decisions
--   WHERE sowon_id = $1 AND inventory_id = $2
--   AND decision_type IN ('OFFER','ALTERNATIVE')
--   ORDER BY created_at DESC LIMIT 1
