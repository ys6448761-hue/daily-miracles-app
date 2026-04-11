-- Migration 110: 파트너 약관 v1.1 — agreed_clause_4_variable, agreed_clause_10_6 추가
-- terms_version 은 103에서 이미 생성됨 (ADD COLUMN IF NOT EXISTS 로 안전)

ALTER TABLE partner_agreements
  ADD COLUMN IF NOT EXISTS terms_version         VARCHAR(10) DEFAULT 'v1.0',
  ADD COLUMN IF NOT EXISTS agreed_clause_4_variable BOOLEAN   DEFAULT false,
  ADD COLUMN IF NOT EXISTS agreed_clause_10_6    BOOLEAN      DEFAULT false;

-- 기존 rows null 방어
UPDATE partner_agreements
   SET terms_version = 'v1.0'
 WHERE terms_version IS NULL;
