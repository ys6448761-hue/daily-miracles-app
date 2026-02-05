-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 012_add_rules_snapshot.sql
-- Description: ops_mice_report_packs에 rules_snapshot 컬럼 추가
-- Created: 2026-02-05
-- ═══════════════════════════════════════════════════════════════════════════

-- 룰 스냅샷 컬럼 추가 (패키지 생성 시 적용된 룰 버전 기록)
ALTER TABLE ops_mice_report_packs
ADD COLUMN IF NOT EXISTS rules_snapshot JSONB DEFAULT '{}';

-- 코멘트
COMMENT ON COLUMN ops_mice_report_packs.rules_snapshot IS '패키지 생성 시 적용된 룰 버전 스냅샷 (version, hash, loaded_at)';

-- ═══════════════════════════════════════════════════════════════════════════
-- End of Migration 012
-- ═══════════════════════════════════════════════════════════════════════════
