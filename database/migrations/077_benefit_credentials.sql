-- 077_benefit_credentials.sql
-- DreamTown 모바일 이용권 (증명 시스템)
-- SSOT: docs/ssot/core/DreamTown_Mobile_Credential_SSOT_v1.md

-- ① 이용권 원장
CREATE TABLE IF NOT EXISTS benefit_credentials (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_code  VARCHAR(20)  UNIQUE NOT NULL,  -- BNF-YYYYMMDD-XXXX
  journey_id       UUID,                           -- 발급 대상 journey_id (nullable)

  -- 상품 정보
  benefit_type     VARCHAR(50)  NOT NULL,          -- cablecar / cruise / yacht / yeosu3pass 등
  benefit_name     VARCHAR(100) NOT NULL,           -- "해상케이블카 이용권"
  face_value       INTEGER      NOT NULL DEFAULT 0, -- 액면가
  galaxy_code      VARCHAR(20),                     -- 연결 은하 코드 (토스트 분기용)

  -- QR 증명
  qr_token         VARCHAR(64)  UNIQUE NOT NULL,   -- QR 인코딩 토큰 (랜덤 hex)

  -- 상태
  status           VARCHAR(20)  NOT NULL DEFAULT 'ISSUED'
                   CHECK (status IN ('ISSUED','ACTIVE','VERIFIED','REDEEMED','EXPIRED','CANCELLED')),

  -- 유효기간
  valid_from       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  valid_until      TIMESTAMPTZ  NOT NULL,

  -- 파트너 검증 정보
  partner_code     VARCHAR(50),
  verified_at      TIMESTAMPTZ,
  verified_by      VARCHAR(100),
  redeemed_at      TIMESTAMPTZ,

  -- 정산
  settlement_status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                    CHECK (settlement_status IN ('PENDING','SETTLED')),
  settled_at       TIMESTAMPTZ,

  -- 발급 원천
  issued_from      VARCHAR(50),                    -- 'voyage_booking' | 'yeosu3pass' | 'manual'
  source_id        VARCHAR(100),                   -- 원천 ID

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ② 이용권 로그 (모든 상태 변경 기록)
CREATE TABLE IF NOT EXISTS credential_logs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  credential_id    UUID        NOT NULL REFERENCES benefit_credentials(id),
  action           VARCHAR(30) NOT NULL
                   CHECK (action IN ('issued','activated','verified','redeemed','expired','cancelled')),
  actor            VARCHAR(100),
  note             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_cred_journey    ON benefit_credentials(journey_id);
CREATE INDEX IF NOT EXISTS idx_cred_status     ON benefit_credentials(status);
CREATE INDEX IF NOT EXISTS idx_cred_qr_token   ON benefit_credentials(qr_token);
CREATE INDEX IF NOT EXISTS idx_cred_valid      ON benefit_credentials(valid_until);
CREATE INDEX IF NOT EXISTS idx_cred_log_id     ON credential_logs(credential_id);
