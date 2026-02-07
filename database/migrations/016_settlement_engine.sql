-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 016: 정산 엔진 (Settlement Engine)
-- AIL-정산-v2-final 기준
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- 1. 정산 이벤트 원장 (SSOT - 불변)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_events (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) UNIQUE NOT NULL,           -- idempotent key
    event_type VARCHAR(20) NOT NULL,                -- PAYMENT, REFUND, CHARGEBACK, FEE_ADJUSTED

    -- 금액 정보
    gross_amount INTEGER NOT NULL,                  -- 정가
    coupon_amount INTEGER DEFAULT 0,                -- 할인액
    paid_amount INTEGER NOT NULL,                   -- 실결제액
    pg_fee INTEGER NOT NULL,                        -- PG 수수료
    net_cash INTEGER NOT NULL,                      -- 순현금 유입
    anchor_amount INTEGER NOT NULL,                 -- 배분 기준액

    -- 관계 정보
    template_id INTEGER,                            -- 템플릿 ID
    artifact_id INTEGER,                            -- 아티팩트 ID
    creator_root_id INTEGER,                        -- 원저작자
    remix_chain JSONB DEFAULT '[]',                 -- 리믹스 체인 [id1, id2, id3]
    referrer_id INTEGER,                            -- 추천자
    buyer_user_id INTEGER,                          -- 구매자

    -- 역분개용
    original_event_id VARCHAR(64),                  -- 환불/차지백 시 원 이벤트

    -- 메타
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',           -- pending, processed, failed

    CONSTRAINT chk_event_type CHECK (event_type IN ('PAYMENT', 'REFUND', 'CHARGEBACK', 'FEE_ADJUSTED'))
);

CREATE INDEX IF NOT EXISTS idx_settlement_events_type ON settlement_events(event_type);
CREATE INDEX IF NOT EXISTS idx_settlement_events_status ON settlement_events(status);
CREATE INDEX IF NOT EXISTS idx_settlement_events_creator ON settlement_events(creator_root_id);
CREATE INDEX IF NOT EXISTS idx_settlement_events_occurred ON settlement_events(occurred_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. 풀별 배분 내역
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_pool_distributions (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES settlement_events(event_id),

    -- 풀별 금액
    platform_amount INTEGER NOT NULL,               -- 플랫폼 55%
    creator_pool_amount INTEGER NOT NULL,           -- 크리에이터 풀 30%
    growth_pool_amount INTEGER NOT NULL,            -- 성장 풀 10%
    risk_pool_amount INTEGER NOT NULL,              -- 리스크 풀 5%

    -- 실제 플랫폼 수령액 (쿠폰 부담 후)
    platform_actual INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pool_dist_event ON settlement_pool_distributions(event_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. 크리에이터 정산 내역 (개인별)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_creator_shares (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES settlement_events(event_id),
    creator_id INTEGER NOT NULL,                    -- playground_users.user_id

    share_type VARCHAR(20) NOT NULL,                -- original, remix, curation
    share_amount INTEGER NOT NULL,
    remix_depth INTEGER,                            -- 리믹스 단계 (1, 2, 3)

    -- 지급 상태
    hold_until DATE,                                -- 보류 종료일 (14일)
    payout_status VARCHAR(20) DEFAULT 'pending',    -- pending, held, released, paid, deducted
    payout_batch_id INTEGER,                        -- 지급 배치 ID

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_share_type CHECK (share_type IN ('original', 'remix', 'curation'))
);

CREATE INDEX IF NOT EXISTS idx_creator_shares_event ON settlement_creator_shares(event_id);
CREATE INDEX IF NOT EXISTS idx_creator_shares_creator ON settlement_creator_shares(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_shares_status ON settlement_creator_shares(payout_status);
CREATE INDEX IF NOT EXISTS idx_creator_shares_hold ON settlement_creator_shares(hold_until);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. 성장 풀 정산 내역
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_growth_shares (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES settlement_events(event_id),

    referrer_id INTEGER,                            -- 추천자 ID (없으면 NULL)
    referrer_amount INTEGER DEFAULT 0,              -- 추천자 7%
    campaign_amount INTEGER DEFAULT 0,              -- 캠페인 3%
    reserve_amount INTEGER DEFAULT 0,               -- 적립 (추천 없을 때)

    payout_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_growth_shares_event ON settlement_growth_shares(event_id);
CREATE INDEX IF NOT EXISTS idx_growth_shares_referrer ON settlement_growth_shares(referrer_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. 리스크 풀 (환불/차지백 대비)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_risk_pool (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL REFERENCES settlement_events(event_id),

    amount INTEGER NOT NULL,
    pool_action VARCHAR(20) NOT NULL,               -- deposit, withdraw, adjustment
    balance_after INTEGER NOT NULL,                 -- 잔액
    reason TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_pool_action CHECK (pool_action IN ('deposit', 'withdraw', 'adjustment'))
);

CREATE INDEX IF NOT EXISTS idx_risk_pool_event ON settlement_risk_pool(event_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. 지급 배치
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_payout_batches (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',             -- draft, confirmed, processing, completed, failed

    total_creators INTEGER DEFAULT 0,
    total_amount INTEGER DEFAULT 0,
    min_payout INTEGER DEFAULT 10000,               -- 최소 지급액

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. 개별 지급 내역
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_payouts (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER REFERENCES settlement_payout_batches(id),
    creator_id INTEGER NOT NULL,

    gross_amount INTEGER NOT NULL,                  -- 총 정산액
    deduction_amount INTEGER DEFAULT 0,             -- 차감액 (환불 회수 등)
    net_amount INTEGER NOT NULL,                    -- 실지급액

    status VARCHAR(20) DEFAULT 'pending',           -- pending, processing, completed, failed, deferred
    deferred_reason TEXT,                           -- 이월 사유

    bank_code VARCHAR(10),
    account_number VARCHAR(50),
    account_holder VARCHAR(50),

    transferred_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payouts_batch ON settlement_payouts(batch_id);
CREATE INDEX IF NOT EXISTS idx_payouts_creator ON settlement_payouts(creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON settlement_payouts(status);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. 정산 상수 (런타임 조회용)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settlement_constants (
    key VARCHAR(50) PRIMARY KEY,
    value DECIMAL(10,4) NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 상수 초기값 삽입
INSERT INTO settlement_constants (key, value, description) VALUES
    ('PLATFORM_RATE', 0.55, '플랫폼 배분율'),
    ('CREATOR_POOL_RATE', 0.30, '크리에이터 풀 배분율'),
    ('GROWTH_POOL_RATE', 0.10, '성장 풀 배분율'),
    ('RISK_POOL_RATE', 0.05, '리스크 풀 배분율'),
    ('CREATOR_ORIGINAL_RATE', 0.70, '원저작자 배분율 (크리에이터 풀 내)'),
    ('CREATOR_REMIX_RATE', 0.20, '리믹스 배분율 (크리에이터 풀 내)'),
    ('CREATOR_CURATION_RATE', 0.10, '큐레이션 배분율 (크리에이터 풀 내)'),
    ('GROWTH_REFERRER_RATE', 0.07, '추천자 배분율'),
    ('GROWTH_CAMPAIGN_RATE', 0.03, '캠페인 배분율'),
    ('PG_FEE_RATE', 0.033, 'PG 수수료율'),
    ('HOLD_DAYS', 14, '보류 기간 (일)'),
    ('MIN_PAYOUT', 10000, '최소 지급액'),
    ('REMIX_MAX_DEPTH', 3, '리믹스 최대 단계'),
    ('MAX_MONTHLY_DEDUCTION_RATE', 0.10, '월 최대 차감율')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ───────────────────────────────────────────────────────────────────────────
-- 9. 정산 요약 뷰
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_settlement_summary AS
SELECT
    DATE_TRUNC('month', se.occurred_at) AS month,
    COUNT(*) FILTER (WHERE se.event_type = 'PAYMENT') AS payment_count,
    COUNT(*) FILTER (WHERE se.event_type = 'REFUND') AS refund_count,
    COUNT(*) FILTER (WHERE se.event_type = 'CHARGEBACK') AS chargeback_count,
    SUM(se.gross_amount) AS total_gross,
    SUM(se.net_cash) AS total_net_cash,
    SUM(spd.platform_actual) AS total_platform,
    SUM(spd.creator_pool_amount) AS total_creator,
    SUM(spd.growth_pool_amount) AS total_growth,
    SUM(spd.risk_pool_amount) AS total_risk
FROM settlement_events se
LEFT JOIN settlement_pool_distributions spd ON se.event_id = spd.event_id
GROUP BY DATE_TRUNC('month', se.occurred_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 10. 크리에이터별 정산 요약 뷰
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_creator_settlement_summary AS
SELECT
    scs.creator_id,
    COUNT(*) AS total_events,
    SUM(scs.share_amount) AS total_earned,
    SUM(scs.share_amount) FILTER (WHERE scs.payout_status = 'paid') AS total_paid,
    SUM(scs.share_amount) FILTER (WHERE scs.payout_status IN ('pending', 'held', 'released')) AS pending_amount,
    SUM(scs.share_amount) FILTER (WHERE scs.share_type = 'original') AS original_earned,
    SUM(scs.share_amount) FILTER (WHERE scs.share_type = 'remix') AS remix_earned,
    SUM(scs.share_amount) FILTER (WHERE scs.share_type = 'curation') AS curation_earned
FROM settlement_creator_shares scs
GROUP BY scs.creator_id;

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료 로그
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 016 완료: 정산 엔진
-- 테이블: settlement_events, settlement_pool_distributions, settlement_creator_shares,
--         settlement_growth_shares, settlement_risk_pool, settlement_payout_batches,
--         settlement_payouts, settlement_constants
-- 뷰: v_settlement_summary, v_creator_settlement_summary
