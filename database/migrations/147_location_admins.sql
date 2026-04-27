-- Migration 147: location_admins — 장소별 관리자 계정
CREATE TABLE IF NOT EXISTS location_admins (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username   VARCHAR(50) NOT NULL UNIQUE,
  location   VARCHAR(50) NOT NULL,
  password   TEXT        NOT NULL,
  is_active  BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_location_admins_location ON location_admins (location);
CREATE INDEX IF NOT EXISTS idx_location_admins_username ON location_admins (username);
