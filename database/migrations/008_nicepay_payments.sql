-- ═══════════════════════════════════════════════════════════
-- 008_nicepay_payments.sql
-- 나이스페이 결제 테이블 (Server 승인 모델)
-- Created: 2026-02-02
-- ═══════════════════════════════════════════════════════════

-- nicepay_payments 테이블 생성
CREATE TABLE IF NOT EXISTS nicepay_payments (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(50) UNIQUE NOT NULL,           -- PAY-YYYYMMDD-XXXX
  verification_token VARCHAR(64) NOT NULL,        -- vt (Wix 검증용 랜덤 토큰)
  amount INTEGER NOT NULL,                        -- 결제 금액 (원)
  goods_name VARCHAR(200) DEFAULT '하루하루의 기적 서비스',

  -- 결제 상태
  status VARCHAR(20) DEFAULT 'PENDING',           -- PENDING, PAID, FAILED, CANCELLED

  -- 나이스페이 인증 응답
  tid VARCHAR(100),                               -- 거래 ID
  auth_token VARCHAR(500),                        -- 인증 토큰 (길이 확장)

  -- 결제 수단 정보
  payment_method VARCHAR(50),                     -- CARD, BANK, VBANK 등
  card_name VARCHAR(50),                          -- 카드사명
  card_no VARCHAR(20),                            -- 마스킹된 카드번호 (1234-****-****-5678)

  -- 승인 결과
  result_code VARCHAR(10),                        -- 결과 코드
  result_msg VARCHAR(200),                        -- 결과 메시지
  paid_at TIMESTAMP WITH TIME ZONE,               -- 결제 완료 시각

  -- 메타
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_nicepay_status ON nicepay_payments(status);
CREATE INDEX IF NOT EXISTS idx_nicepay_created ON nicepay_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_nicepay_order_id ON nicepay_payments(order_id);

-- 코멘트
COMMENT ON TABLE nicepay_payments IS '나이스페이 결제 내역 (Server 승인 모델)';
COMMENT ON COLUMN nicepay_payments.order_id IS '주문번호 (PAY-YYYYMMDD-XXXX 형식)';
COMMENT ON COLUMN nicepay_payments.verification_token IS 'Wix 결제 검증용 토큰';
COMMENT ON COLUMN nicepay_payments.status IS '결제 상태: PENDING(대기), PAID(완료), FAILED(실패), CANCELLED(취소)';
COMMENT ON COLUMN nicepay_payments.tid IS '나이스페이 거래 ID';
