-- 215_benefits_display_order.sql
-- Adds display_order to dt_benefits for representative partner priority.
-- display_order=0: representative (shown first)
-- display_order=1: standard (DEFAULT)
-- Used by hospitalityService.fetchActiveBenefits ORDER BY b.display_order ASC

ALTER TABLE dt_benefits
  ADD COLUMN IF NOT EXISTS display_order INT NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_benefits_display_order ON dt_benefits(display_order, created_at);

-- After running this migration, apply partner_master_seed.sql (v3+) to seed
-- representative partners with display_order=0:
--   라또아 카페 (YS-CF-004) → display_order=0
--   돌산게장명가 (YS-RS-003) → display_order=0
