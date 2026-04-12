-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 115_founding_partner_flag.sql
-- partner_accounts에 창립 파트너 플래그 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE partner_accounts
  ADD COLUMN IF NOT EXISTS is_founding_partner BOOLEAN NOT NULL DEFAULT false;

-- 검증 쿼리
-- SELECT login_id, is_founding_partner FROM partner_accounts ORDER BY login_id;
