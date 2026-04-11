-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 114_partner_visits.sql
-- 소원이 파트너 방문 동선 기록
-- Star Journey / 별자리 챌린지 기반 테이블
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS partner_visits (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  partner_id    VARCHAR(20) NOT NULL,
  galaxy_type   VARCHAR(20) NOT NULL,
  partner_tier  VARCHAR(20) NOT NULL DEFAULT 'branch',
  region_code   VARCHAR(30) NOT NULL DEFAULT 'KR_YEOSU',
  source_event  VARCHAR(50) NOT NULL DEFAULT 'standard',
  star_id       UUID,
  visited_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  visit_count   INT NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pv_user    ON partner_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_pv_partner ON partner_visits(partner_id);
CREATE INDEX IF NOT EXISTS idx_pv_galaxy  ON partner_visits(galaxy_type);
CREATE INDEX IF NOT EXISTS idx_pv_event   ON partner_visits(source_event);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 별자리 달성 기록 테이블
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS constellation_achievements (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  achievement_type  VARCHAR(50) NOT NULL,
  achievement_name  VARCHAR(100) NOT NULL,
  badge_emoji       VARCHAR(10),
  achieved_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  source_event      VARCHAR(50) DEFAULT 'standard',
  UNIQUE(user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_ca_user ON constellation_achievements(user_id);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 크로스 혜택 쿠폰 테이블
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS journey_coupons (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_code       VARCHAR(12) NOT NULL UNIQUE,
  user_id           UUID NOT NULL,
  achievement_type  VARCHAR(50) NOT NULL,
  galaxy_type       VARCHAR(20),          -- NULL = 전 은하 사용 가능
  partner_tier      VARCHAR(20) DEFAULT NULL,
  discount_pct      INT NOT NULL DEFAULT 10,
  issued_at         TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMP NOT NULL,
  redeemed_at       TIMESTAMP DEFAULT NULL,
  redeemed_by       VARCHAR(20) DEFAULT NULL  -- partner_id
);

CREATE INDEX IF NOT EXISTS idx_jc_user ON journey_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_jc_code ON journey_coupons(coupon_code);
