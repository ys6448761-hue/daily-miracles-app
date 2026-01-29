-- ============================================================
-- 기적 금고 (Miracle Treasury) - 통합 재무관리 시스템
-- Migration: 003_finance_tables.sql
-- Created: 2025-01-29
-- ============================================================

-- 1) 거래처 관리
CREATE TABLE IF NOT EXISTS partners (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  business_number VARCHAR(20),        -- 사업자번호
  contact_name VARCHAR(50),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  type VARCHAR(20) DEFAULT 'both',    -- customer/vendor/both
  address TEXT,
  memo TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2) 카테고리 관리
CREATE TABLE IF NOT EXISTS finance_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL,          -- income/expense
  tax_type VARCHAR(20) DEFAULT 'vat', -- vat/withholding/none
  parent_id INTEGER REFERENCES finance_categories(id),
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3) 거래 기록 (핵심)
CREATE TABLE IF NOT EXISTS finance_transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,          -- income/expense
  amount DECIMAL(15,2) NOT NULL,
  vat_amount DECIMAL(15,2) DEFAULT 0, -- 부가세액
  supply_amount DECIMAL(15,2),        -- 공급가액
  category_id INTEGER REFERENCES finance_categories(id),
  partner_id INTEGER REFERENCES partners(id),
  description TEXT NOT NULL,
  memo TEXT,
  transaction_date DATE NOT NULL,
  payment_method VARCHAR(20),         -- cash/card/transfer/etc
  tax_invoice_yn BOOLEAN DEFAULT false,
  tax_invoice_number VARCHAR(50),
  receipt_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_id INTEGER,
  created_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4) 반복 거래 설정
CREATE TABLE IF NOT EXISTS recurring_transactions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  category_id INTEGER REFERENCES finance_categories(id),
  partner_id INTEGER REFERENCES partners(id),
  description TEXT,
  frequency VARCHAR(20) NOT NULL,     -- daily/weekly/monthly/yearly
  day_of_month INTEGER,               -- 매월 며칠 (monthly인 경우)
  start_date DATE NOT NULL,
  end_date DATE,
  next_date DATE,
  last_generated DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 5) 예산 관리
CREATE TABLE IF NOT EXISTS finance_budgets (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  category_id INTEGER REFERENCES finance_categories(id),
  amount DECIMAL(15,2) NOT NULL,
  alert_threshold INTEGER DEFAULT 80, -- 알림 기준 %
  memo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(year, month, category_id)
);

-- 6) 세금 기록
CREATE TABLE IF NOT EXISTS tax_records (
  id SERIAL PRIMARY KEY,
  tax_type VARCHAR(20) NOT NULL,      -- vat/income/withholding
  period_year INTEGER NOT NULL,
  period_quarter INTEGER,             -- 부가세용 (1-4)
  period_month INTEGER,               -- 원천세용 (1-12)
  tax_base DECIMAL(15,2),             -- 과세표준
  tax_amount DECIMAL(15,2),           -- 세액
  deductible_amount DECIMAL(15,2),    -- 공제액
  payable_amount DECIMAL(15,2),       -- 납부세액
  status VARCHAR(20) DEFAULT 'pending', -- pending/filed/paid
  due_date DATE,
  filed_date DATE,
  paid_date DATE,
  reference_number VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 7) 감사 로그
CREATE TABLE IF NOT EXISTS finance_audit_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(50),
  action VARCHAR(50) NOT NULL,        -- create/update/delete/view/export
  table_name VARCHAR(50) NOT NULL,
  record_id INTEGER,
  old_value JSONB,
  new_value JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 8) 알림 설정
CREATE TABLE IF NOT EXISTS finance_alert_settings (
  id SERIAL PRIMARY KEY,
  alert_type VARCHAR(50) NOT NULL,    -- budget_warning/tax_due/recurring/anomaly
  threshold INTEGER,
  is_enabled BOOLEAN DEFAULT true,
  notify_kakao BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT false,
  notify_slack BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- 기본 카테고리 데이터 삽입
-- ============================================================

-- 수입 카테고리
INSERT INTO finance_categories (name, type, tax_type, icon, color, sort_order) VALUES
  ('서비스매출', 'income', 'vat', 'briefcase', '#4CAF50', 1),
  ('컨설팅수입', 'income', 'vat', 'users', '#8BC34A', 2),
  ('광고수입', 'income', 'vat', 'megaphone', '#CDDC39', 3),
  ('이자수입', 'income', 'none', 'percent', '#FFC107', 4),
  ('기타수입', 'income', 'vat', 'plus-circle', '#FF9800', 5)
ON CONFLICT DO NOTHING;

-- 지출 카테고리
INSERT INTO finance_categories (name, type, tax_type, icon, color, sort_order) VALUES
  ('서버/호스팅', 'expense', 'vat', 'server', '#F44336', 10),
  ('API 비용', 'expense', 'vat', 'code', '#E91E63', 11),
  ('마케팅/광고', 'expense', 'vat', 'trending-up', '#9C27B0', 12),
  ('소프트웨어', 'expense', 'vat', 'package', '#673AB7', 13),
  ('외주용역비', 'expense', 'withholding', 'user-check', '#3F51B5', 14),
  ('사무용품', 'expense', 'vat', 'clipboard', '#2196F3', 15),
  ('통신비', 'expense', 'vat', 'phone', '#03A9F4', 16),
  ('교통비', 'expense', 'none', 'truck', '#00BCD4', 17),
  ('식대/접대비', 'expense', 'vat', 'coffee', '#009688', 18),
  ('도서/교육', 'expense', 'none', 'book', '#4CAF50', 19),
  ('보험료', 'expense', 'none', 'shield', '#8BC34A', 20),
  ('수수료', 'expense', 'vat', 'credit-card', '#CDDC39', 21),
  ('기타지출', 'expense', 'vat', 'minus-circle', '#795548', 22)
ON CONFLICT DO NOTHING;

-- 기본 알림 설정
INSERT INTO finance_alert_settings (alert_type, threshold, is_enabled) VALUES
  ('budget_warning', 80, true),
  ('tax_due', 7, true),
  ('recurring', 1, true),
  ('anomaly', 150, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 인덱스 생성
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_transactions_date ON finance_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON finance_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_partner ON finance_transactions(partner_id);
CREATE INDEX IF NOT EXISTS idx_budgets_period ON finance_budgets(year, month);
CREATE INDEX IF NOT EXISTS idx_tax_records_period ON tax_records(period_year, period_quarter);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON finance_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_partners_business_number ON partners(business_number);

-- ============================================================
-- 완료 메시지
-- ============================================================
-- SELECT 'Finance tables created successfully' as status;
