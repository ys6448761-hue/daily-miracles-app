-- Migration 101: 파트너 어드민 계정 테이블
-- 별들의 고향 업체별 개별 로그인을 위한 계정 관리

CREATE TABLE IF NOT EXISTS partner_accounts (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID         NOT NULL REFERENCES dt_partners(id) ON DELETE CASCADE,
  email           VARCHAR(100) UNIQUE NOT NULL,
  password_hash   VARCHAR(200) NOT NULL,
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_accounts_partner_id ON partner_accounts(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_accounts_email      ON partner_accounts(email);
