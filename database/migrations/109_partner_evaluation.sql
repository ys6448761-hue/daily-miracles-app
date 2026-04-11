-- Migration 109: 파트너 평가 + 등급 시스템

-- 업체 평가 기록
CREATE TABLE IF NOT EXISTS partner_evaluations (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          UUID         REFERENCES dt_partners(id) ON DELETE CASCADE,
  eval_month          DATE         NOT NULL,
  return_rate         DECIMAL(5,2) DEFAULT 0,    -- 재방문율 (%)
  qr_scan_count       INTEGER      DEFAULT 0,     -- QR 스캔 횟수
  order_process_rate  DECIMAL(5,2) DEFAULT 0,    -- 주문 처리율 (%)
  admin_login_count   INTEGER      DEFAULT 0,     -- 어드민 로그인 횟수
  sentiment_score     DECIMAL(5,2) DEFAULT 0,    -- 감정 점수 (0~100)
  total_score         DECIMAL(5,2) DEFAULT 0,    -- 종합 점수 (0~100)
  grade               VARCHAR(20)  DEFAULT 'normal',
  created_at          TIMESTAMP    DEFAULT NOW(),
  UNIQUE(partner_id, eval_month)
);

CREATE INDEX IF NOT EXISTS idx_partner_eval_partner ON partner_evaluations(partner_id, eval_month DESC);

-- 업체 상태 변경 이력
CREATE TABLE IF NOT EXISTS partner_status_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID        REFERENCES dt_partners(id) ON DELETE CASCADE,
  previous_status  VARCHAR(20),
  new_status       VARCHAR(20),
  reason           TEXT,
  changed_by       VARCHAR(50) DEFAULT 'system',
  changed_at       TIMESTAMP   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_status_logs ON partner_status_logs(partner_id, changed_at DESC);

-- dt_partners 등급 컬럼 추가
ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS grade            VARCHAR(20)  DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS grade_updated_at TIMESTAMP;
