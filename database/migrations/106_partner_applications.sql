-- Migration 106: 파트너 입점 신청 시스템

CREATE TABLE IF NOT EXISTS partner_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES dt_users(id),
  business_name   VARCHAR(100) NOT NULL,
  business_type   VARCHAR(30),
  address         TEXT,
  phone           VARCHAR(20),
  business_number VARCHAR(20),
  motivation      TEXT,
  status          VARCHAR(20) DEFAULT 'pending',
  reviewed_at     TIMESTAMP,
  reviewer_note   TEXT,
  partner_id      UUID REFERENCES dt_partners(id),
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_applications_status
  ON partner_applications(status);
