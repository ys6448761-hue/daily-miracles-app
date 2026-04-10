-- 099_hometown_columns.sql — 별들의 고향: dt_stars, dt_partners 컬럼 추가

-- dt_stars 컬럼 추가
ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS hometown_partner_id    UUID REFERENCES dt_partners(id),
  ADD COLUMN IF NOT EXISTS hometown_confirmed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hometown_visit_count   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hometown_last_visit_at TIMESTAMPTZ;

-- dt_partners 컬럼 추가
ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS hometown_qr_code          VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS hometown_qr_generated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hometown_star_count        INTEGER NOT NULL DEFAULT 0;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_dt_stars_hometown_partner
  ON dt_stars(hometown_partner_id)
  WHERE hometown_partner_id IS NOT NULL;
