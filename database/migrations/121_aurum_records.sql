-- Migration 121: 아우룸 위치 잠금 기억 캡슐
-- Created: 2026-04-17

CREATE TABLE IF NOT EXISTS aurum_records (
  id               UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          VARCHAR(100) NOT NULL,
  star_id          UUID,
  content          TEXT        NOT NULL,
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  radius_m         INT         NOT NULL DEFAULT 200,
  place_name       VARCHAR(100),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_opened_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_aurum_user ON aurum_records(user_id);
