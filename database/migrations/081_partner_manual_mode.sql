-- 081_partner_manual_mode.sql
-- 수동 검증 모드 지원
-- 1) partner_configs — 파트너 코드 + PIN 해시 저장
-- 2) benefit_redemptions에 verification_method / manual_reason 컬럼 추가

-- 파트너 설정 테이블
CREATE TABLE IF NOT EXISTS partner_configs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code VARCHAR(50) UNIQUE NOT NULL,
  pin_hash     VARCHAR(64) NOT NULL,   -- SHA256(pin)
  partner_name VARCHAR(100),
  is_active    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PIN 실패 횟수 추적 (연속 실패 제한용)
CREATE TABLE IF NOT EXISTS partner_pin_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_code VARCHAR(50) NOT NULL,
  failed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_addr      VARCHAR(45)
);
CREATE INDEX IF NOT EXISTS idx_pin_attempts_code ON partner_pin_attempts(partner_code, failed_at);

-- benefit_redemptions에 검증 방식 추가
ALTER TABLE benefit_redemptions
  ADD COLUMN IF NOT EXISTS verification_method VARCHAR(20) DEFAULT 'qr_scan'
    CHECK (verification_method IN ('qr_scan', 'manual_pin', 'url_token')),
  ADD COLUMN IF NOT EXISTS manual_reason VARCHAR(50);

-- 기존 로우 기본값 처리
UPDATE benefit_redemptions
SET verification_method = 'qr_scan'
WHERE verification_method IS NULL;
