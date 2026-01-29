/**
 * 기적 금고 Phase 3 - 증빙 발행 시스템 마이그레이션
 *
 * 실행: psql -d your_database -f database/migrations/004_receipt_tables.sql
 *
 * @version 1.0.0 - 2025.01.29
 */

-- ============================================
-- 1. 거래 테이블 필드 추가
-- ============================================

-- 상대방 유형 (business_taxable/business_exempt/individual/nonprofit)
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS partner_type VARCHAR(20);

-- 증빙 유형 (tax_invoice/cash_receipt_deduction/cash_receipt_expense/none)
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS receipt_type VARCHAR(30);

-- 증빙 발행 상태 (pending/issued/not_required)
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS receipt_status VARCHAR(20) DEFAULT 'pending';

-- 증빙 발행 번호
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(50);

-- 증빙 발행 일시
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS receipt_issued_at TIMESTAMP;

-- 증빙 발행 방법 (manual/hometax/bolta)
ALTER TABLE finance_transactions
ADD COLUMN IF NOT EXISTS receipt_provider VARCHAR(20);

-- ============================================
-- 2. 증빙 발행 로그 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS receipt_logs (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES finance_transactions(id) ON DELETE CASCADE,
  receipt_type VARCHAR(30) NOT NULL,
  status VARCHAR(20) NOT NULL,        -- requested/success/failed/cancelled
  provider VARCHAR(20),               -- manual/hometax/bolta
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  issued_by VARCHAR(50) DEFAULT 'system',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_receipt_logs_transaction_id ON receipt_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipt_logs_status ON receipt_logs(status);
CREATE INDEX IF NOT EXISTS idx_receipt_logs_created_at ON receipt_logs(created_at);

-- ============================================
-- 3. 거래 테이블 인덱스 추가
-- ============================================

CREATE INDEX IF NOT EXISTS idx_finance_transactions_receipt_status ON finance_transactions(receipt_status);
CREATE INDEX IF NOT EXISTS idx_finance_transactions_partner_type ON finance_transactions(partner_type);

-- ============================================
-- 4. 기존 데이터 업데이트 (기본값 설정)
-- ============================================

-- 수입 거래: 세금계산서 발행 필요 (pending)
UPDATE finance_transactions
SET
  partner_type = 'business_taxable',
  receipt_type = 'tax_invoice',
  receipt_status = CASE
    WHEN tax_invoice_yn = true THEN 'issued'
    ELSE 'pending'
  END
WHERE type = 'income'
  AND receipt_status IS NULL;

-- 지출 거래: 증빙 불필요 (수취만 함)
UPDATE finance_transactions
SET
  receipt_type = 'none',
  receipt_status = 'not_required'
WHERE type = 'expense'
  AND receipt_status IS NULL;

-- ============================================
-- 5. 코멘트 추가
-- ============================================

COMMENT ON COLUMN finance_transactions.partner_type IS '상대방 유형: business_taxable(과세사업자), business_exempt(면세사업자), individual(개인), nonprofit(비영리)';
COMMENT ON COLUMN finance_transactions.receipt_type IS '증빙 유형: tax_invoice(세금계산서), cash_receipt_deduction(현금영수증-소득공제), cash_receipt_expense(현금영수증-지출증빙), none(불필요)';
COMMENT ON COLUMN finance_transactions.receipt_status IS '발행 상태: pending(미발행), issued(발행완료), not_required(불필요)';
COMMENT ON TABLE receipt_logs IS '증빙 발행 이력 로그';

-- ============================================
-- 완료
-- ============================================

SELECT '✅ 증빙 발행 시스템 마이그레이션 완료!' as result;
