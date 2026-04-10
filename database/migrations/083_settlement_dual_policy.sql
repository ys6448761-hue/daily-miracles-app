-- 083_settlement_dual_policy.sql
-- 정산 정책 듀얼 지원: commission_rate / net_amount

-- ① partner_configs — 정산 정책 타입 + net_amount 추가
ALTER TABLE partner_configs
  ADD COLUMN IF NOT EXISTS settlement_policy_type VARCHAR(20) NOT NULL DEFAULT 'commission_rate'
    CHECK (settlement_policy_type IN ('commission_rate', 'net_amount')),
  ADD COLUMN IF NOT EXISTS settlement_net_amount NUMERIC(12,2);
-- commission_rate 컬럼은 082에서 이미 추가됨

-- ② benefit_settlement_configs — 상품 단위 정책 (partner_config보다 우선)
CREATE TABLE IF NOT EXISTS benefit_settlement_configs (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code          VARCHAR(50) NOT NULL REFERENCES partner_configs(partner_code),
  benefit_type          VARCHAR(50) NOT NULL,         -- cablecar / cruise 등

  settlement_policy_type VARCHAR(20) NOT NULL DEFAULT 'commission_rate'
    CHECK (settlement_policy_type IN ('commission_rate', 'net_amount')),
  commission_rate       NUMERIC(5,4),                 -- policy=commission_rate 시 사용
  net_amount            NUMERIC(12,2),                -- policy=net_amount 시 사용

  is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
  note                  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (partner_code, benefit_type)
);
CREATE INDEX IF NOT EXISTS idx_benefit_settle_partner ON benefit_settlement_configs(partner_code);

-- ③ dt_settlement_items — policy_type 컬럼 추가 (어떤 정책으로 계산됐는지 기록)
ALTER TABLE dt_settlement_items
  ADD COLUMN IF NOT EXISTS policy_type VARCHAR(20) DEFAULT 'commission_rate'
    CHECK (policy_type IN ('commission_rate', 'net_amount'));
