-- Migration 105: 파트너 구독 시스템

CREATE TABLE IF NOT EXISTS partner_subscriptions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID NOT NULL REFERENCES dt_partners(id) ON DELETE CASCADE,
  plan             VARCHAR(20) NOT NULL DEFAULT 'premium',
  status           VARCHAR(20) NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','cancelled','expired')),
  amount           INTEGER NOT NULL DEFAULT 30000,
  payment_method   VARCHAR(50),
  payment_key      VARCHAR(200),
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  cancelled_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_subscriptions_partner
  ON partner_subscriptions(partner_id);

-- dt_partners에 구독 상태 컬럼 추가
ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS is_subscribed        BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- partner_accounts에 구독 관련 열람 권한 (통계)
ALTER TABLE partner_accounts
  ADD COLUMN IF NOT EXISTS last_story_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS story_send_count    INTEGER DEFAULT 0;
