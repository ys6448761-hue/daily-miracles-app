-- Migration 103: 파트너 약관 동의 시스템

CREATE TABLE IF NOT EXISTS partner_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL
    REFERENCES dt_partners(id) ON DELETE CASCADE,
  partner_account_id UUID NOT NULL
    REFERENCES partner_accounts(id),
  agreed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT,
  terms_version VARCHAR(10) DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_partner_agreements_partner
  ON partner_agreements(partner_id);

-- partner_accounts에 약관 동의 여부 추가
ALTER TABLE partner_accounts
  ADD COLUMN IF NOT EXISTS terms_agreed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS terms_agreed_at TIMESTAMP;
