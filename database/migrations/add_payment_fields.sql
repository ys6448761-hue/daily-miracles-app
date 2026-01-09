-- ═══════════════════════════════════════════════════════════════════════════
-- 견적 결제 필드 추가 마이그레이션
-- ═══════════════════════════════════════════════════════════════════════════
-- 작성일: 2026-01-09
-- 용도: 토스페이먼츠 결제 링크 연동을 위한 필드 추가
-- ═══════════════════════════════════════════════════════════════════════════

-- 결제 링크 관련 필드
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_link_id VARCHAR(100);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_order_id VARCHAR(50);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_link_expires TIMESTAMP WITH TIME ZONE;

-- 결제 정보 필드
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_amount INTEGER DEFAULT 0;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20);  -- deposit | full
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';  -- pending | paid | failed | refunded
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_key VARCHAR(200);  -- 토스 paymentKey
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);  -- card | transfer | virtual_account
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_approved_at TIMESTAMP WITH TIME ZONE;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quotes_payment_order_id ON quotes(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_quotes_payment_status ON quotes(payment_status);
CREATE INDEX IF NOT EXISTS idx_quotes_payment_key ON quotes(payment_key);

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════════════════════
