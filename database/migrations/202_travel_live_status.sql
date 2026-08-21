-- Migration 202: travel_live_status
-- Live operational status (manual updates, V0: unknown by default)
-- Created: 2026-08-21

CREATE TABLE IF NOT EXISTS travel_live_status (
  place_code VARCHAR(50),
  country_code VARCHAR(10) NOT NULL DEFAULT 'KR',
  city_code VARCHAR(30) NOT NULL DEFAULT 'YEOSU',

  -- === Status ===
  status VARCHAR(30) NOT NULL DEFAULT 'unknown',
    CHECK (status IN ('open', 'closed', 'partial', 'unknown')),
  reason TEXT,

  -- === Metadata ===
  manually_updated_at TIMESTAMP,
  automated_data_source VARCHAR(50),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (place_code, country_code, city_code),
  FOREIGN KEY (place_code) REFERENCES travel_places(code)
);

COMMENT ON TABLE travel_live_status IS 'V0: 운영자 수동 입력 기반, 초기값 unknown';
COMMENT ON COLUMN travel_live_status.status IS 'open=운영중, closed=폐쇄, partial=부분, unknown=미확인';
COMMENT ON COLUMN travel_live_status.reason IS '폐쇄 이유 (예: 우천운휴, 정기점검)';
