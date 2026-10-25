-- Migration 207: travel_places_stay_time_v01
-- Stay time correction — 2 records only
--
-- Approved values (Founder Decision 2026-10-25):
--   hamel_lighthouse : null  → 30  (FOUNDER_APPROVED)
--   hyangiram        : 90   → 120  (FOUNDER_APPROVED)
--
-- Safety:
--   - Verifies current DB value before updating (idempotent on repeat)
--   - Wrapped in explicit transaction — rolls back entirely on any error
--   - hamel_lighthouse guard: only updates when avg_stay_minutes IS NULL
--   - hyangiram guard:        only updates when avg_stay_minutes = 90
--   - No other rows touched
--
-- Rollback:
--   UPDATE travel_places SET avg_stay_minutes = NULL WHERE code = 'hamel_lighthouse';
--   UPDATE travel_places SET avg_stay_minutes = 90   WHERE code = 'hyangiram';
--
-- Created: 2026-10-25

BEGIN;

-- Pre-flight: assert both records exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM travel_places WHERE code = 'hamel_lighthouse') THEN
    RAISE EXCEPTION 'ABORT: hamel_lighthouse not found in travel_places';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM travel_places WHERE code = 'hyangiram') THEN
    RAISE EXCEPTION 'ABORT: hyangiram not found in travel_places';
  END IF;
END
$$;

-- 1. hamel_lighthouse: null → 30
--    Guard: only when current value IS NULL (idempotent if already 30)
UPDATE travel_places
SET
  avg_stay_minutes = 30,
  updated_at       = NOW()
WHERE
  code             = 'hamel_lighthouse'
  AND avg_stay_minutes IS NULL;

-- 2. hyangiram: 90 → 120
--    Guard: only when current value = 90 (idempotent if already 120)
UPDATE travel_places
SET
  avg_stay_minutes = 120,
  updated_at       = NOW()
WHERE
  code             = 'hyangiram'
  AND avg_stay_minutes = 90;

-- Post-flight: verify final state
DO $$
DECLARE
  hamel_stay INT;
  hyang_stay INT;
BEGIN
  SELECT avg_stay_minutes INTO hamel_stay FROM travel_places WHERE code = 'hamel_lighthouse';
  SELECT avg_stay_minutes INTO hyang_stay FROM travel_places WHERE code = 'hyangiram';

  IF hamel_stay IS NULL OR hamel_stay != 30 THEN
    RAISE EXCEPTION 'ABORT: hamel_lighthouse avg_stay_minutes = % (expected 30)', hamel_stay;
  END IF;

  IF hyang_stay IS NULL OR hyang_stay != 120 THEN
    RAISE EXCEPTION 'ABORT: hyangiram avg_stay_minutes = % (expected 120)', hyang_stay;
  END IF;

  RAISE NOTICE 'Migration 207 OK — hamel_lighthouse=%, hyangiram=%', hamel_stay, hyang_stay;
END
$$;

COMMIT;

-- === Rollback script (manual — do not apply without Founder approval) ===
-- BEGIN;
-- UPDATE travel_places SET avg_stay_minutes = NULL WHERE code = 'hamel_lighthouse';
-- UPDATE travel_places SET avg_stay_minutes = 90   WHERE code = 'hyangiram';
-- COMMIT;
