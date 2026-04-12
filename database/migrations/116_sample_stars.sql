-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 116_sample_stars.sql
-- dt_stars: 샘플 별 + 파트너 연결 컬럼 추가
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS is_sample   BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS partner_id  VARCHAR(20) DEFAULT NULL;

-- 샘플 별 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_dt_stars_is_sample  ON dt_stars(is_sample);
CREATE INDEX IF NOT EXISTS idx_dt_stars_partner_id ON dt_stars(partner_id);

-- dt_users: 샘플 데모 유저 플래그
ALTER TABLE dt_users
  ADD COLUMN IF NOT EXISTS is_sample BOOLEAN NOT NULL DEFAULT FALSE;
