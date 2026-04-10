-- 082_dt_settlements.sql
-- DreamTown 파트너 정산 시스템
-- 크리에이터 정산(/api/settlement)과 별개로 /api/dt/settlements 경로 사용

-- ① 정산 묶음 (파트너 + 기간 기준)
CREATE TABLE IF NOT EXISTS dt_settlements (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        VARCHAR(50) NOT NULL,

  period_start      TIMESTAMPTZ NOT NULL,
  period_end        TIMESTAMPTZ NOT NULL,

  total_count       INTEGER     NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_rate   NUMERIC(5,4)  NOT NULL DEFAULT 0.2000, -- 기본 20%
  commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_amount        NUMERIC(12,2) NOT NULL DEFAULT 0,

  status            VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','paid','cancelled')),

  approved_at       TIMESTAMPTZ,
  paid_at           TIMESTAMPTZ,
  note              TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dt_settle_partner ON dt_settlements(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_dt_settle_period  ON dt_settlements(period_start, period_end);
-- 동일 파트너 + 동일 기간 중복 정산 방지
CREATE UNIQUE INDEX IF NOT EXISTS idx_dt_settle_uniq
  ON dt_settlements(partner_id, period_start, period_end);

-- ② 정산 항목 (이용권 1개 = 1행)
CREATE TABLE IF NOT EXISTS dt_settlement_items (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id     UUID        NOT NULL REFERENCES dt_settlements(id),
  credential_id     UUID        NOT NULL REFERENCES benefit_credentials(id) UNIQUE, -- 중복 방지 핵심
  redemption_id     UUID        REFERENCES benefit_redemptions(id),

  benefit_type      VARCHAR(50),
  benefit_name      VARCHAR(100),
  face_value        NUMERIC(12,2) NOT NULL DEFAULT 0,

  commission_rate   NUMERIC(5,4)  NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  net_amount        NUMERIC(12,2) NOT NULL,

  redeemed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dt_settle_items_settle ON dt_settlement_items(settlement_id);

-- ③ benefit_redemptions 정산 상태 컬럼 추가
ALTER TABLE benefit_redemptions
  ADD COLUMN IF NOT EXISTS settlement_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (settlement_status IN ('pending','included','excluded')),
  ADD COLUMN IF NOT EXISTS settlement_id UUID REFERENCES dt_settlements(id);
CREATE INDEX IF NOT EXISTS idx_redemption_settle_status ON benefit_redemptions(settlement_status);

-- ④ partner_configs에 수수료율 컬럼 추가 (파트너별 개별 요율)
ALTER TABLE partner_configs
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.2000;
