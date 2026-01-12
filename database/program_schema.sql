-- ═══════════════════════════════════════════════════════════
-- P0 30일 프로그램 결제 스키마
-- Spec ID: P0-PAYMENT-30DAY-ENTITLEMENT
-- Updated: 2026-01-12
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- Table: program_orders (30일 프로그램 주문)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_orders (
    order_id VARCHAR(50) PRIMARY KEY,  -- PAY-YYYYMMDD-XXXX

    -- 상품 정보
    sku VARCHAR(50) NOT NULL,          -- PRG_WISH_30 / PRG_SOLVE_30 / PRG_DUAL_30
    amount INTEGER NOT NULL,           -- 결제 금액 (서버 상수 기준)
    order_name VARCHAR(255),           -- "소원실현 30 - PAY-20260112-ABCD"

    -- 고객 정보 (비회원 결제 지원)
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),

    -- 토큰 연결
    user_id UUID REFERENCES users(id), -- 회원인 경우
    trial_token VARCHAR(64),           -- trial 보유 시
    guest_access_token VARCHAR(64),    -- 비회원 결제 시 발급

    -- 주문 상태
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    -- CREATED: 생성됨
    -- PAID: 결제 완료
    -- FAILED: 결제 실패
    -- CANCELED: 취소됨
    -- REFUNDED: 환불됨

    -- PG 정보
    pg_provider VARCHAR(20) DEFAULT 'TOSS',
    pg_payment_key VARCHAR(255),
    pg_transaction_id VARCHAR(255),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_program_orders_customer_email ON program_orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_program_orders_status ON program_orders(status);
CREATE INDEX IF NOT EXISTS idx_program_orders_user_id ON program_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_program_orders_trial_token ON program_orders(trial_token);
CREATE INDEX IF NOT EXISTS idx_program_orders_guest_token ON program_orders(guest_access_token);
CREATE INDEX IF NOT EXISTS idx_program_orders_created_at ON program_orders(created_at DESC);

-- ───────────────────────────────────────────────────────────
-- Table: entitlements (권한 발급 내역)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS entitlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 대상 정보
    subject_type VARCHAR(20) NOT NULL,  -- 'user' | 'trial' | 'guest'
    subject_id VARCHAR(255) NOT NULL,   -- users.id 또는 trial_token 또는 guest_access_token

    -- 권한 정보
    entitlement_key VARCHAR(50) NOT NULL,  -- 'trial' | 'wish_30' | 'solve_30' | 'dual_30'

    -- 유효 기간
    start_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- 발급 소스
    source_order_id VARCHAR(50) REFERENCES program_orders(order_id),

    -- 상태
    is_active BOOLEAN DEFAULT TRUE,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 중복 발급 방지
    CONSTRAINT ux_entitlements_unique UNIQUE (source_order_id, entitlement_key)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_entitlements_subject ON entitlements(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_entitlements_key ON entitlements(entitlement_key);
CREATE INDEX IF NOT EXISTS idx_entitlements_end_at ON entitlements(end_at);
CREATE INDEX IF NOT EXISTS idx_entitlements_active ON entitlements(is_active) WHERE is_active = true;

-- ───────────────────────────────────────────────────────────
-- Trigger: program_orders updated_at
-- ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_program_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_program_orders_updated_at ON program_orders;
CREATE TRIGGER trigger_program_orders_updated_at
    BEFORE UPDATE ON program_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_program_orders_updated_at();

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '✅ P0 Program Schema Migration Completed!';
    RAISE NOTICE '   - Table: program_orders (30일 프로그램 주문)';
    RAISE NOTICE '   - Table: entitlements (권한 발급)';
    RAISE NOTICE '   - Indexes and triggers created';
END $$;
