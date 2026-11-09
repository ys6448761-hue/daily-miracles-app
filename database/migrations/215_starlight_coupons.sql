-- Migration 215: 별빛쿠폰 (Starlight Coupon) MVP
-- PHX-COUPON-004 — DreamTown × 케니호텔 제휴 모바일 쿠폰
-- Production 적용: Founder 명시 승인 후 실행
-- Created: 2026-11-09

BEGIN;

-- 쿠폰 발급 원장 (append-only)
CREATE TABLE IF NOT EXISTS starlight_coupons (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_source     VARCHAR(50)  NOT NULL,  -- 'kenny', 'ramada' 등
  venue_id         VARCHAR(100) NOT NULL,  -- 가맹점 식별자 (테스트: 'test_*')
  issued_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  viewed_at        TIMESTAMPTZ,            -- 고객이 쿠폰 화면 최초 조회 시
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  failed_attempts  INT          NOT NULL DEFAULT 0  -- 잘못된 PIN 시도 횟수
);

-- 쿠폰 사용 처리 로그 (append-only, coupon_id UNIQUE → 중복 사용 DB 레벨 차단)
CREATE TABLE IF NOT EXISTS starlight_coupon_uses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id     UUID         NOT NULL UNIQUE REFERENCES starlight_coupons(id),
  venue_id      VARCHAR(100) NOT NULL,
  confirmed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  staff_note    TEXT                              -- 선택적 직원 메모
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_starlight_coupons_hotel_venue
  ON starlight_coupons (hotel_source, venue_id, issued_at DESC);

CREATE INDEX IF NOT EXISTS idx_starlight_coupon_uses_coupon_id
  ON starlight_coupon_uses (coupon_id);

CREATE INDEX IF NOT EXISTS idx_starlight_coupon_uses_venue_date
  ON starlight_coupon_uses (venue_id, confirmed_at DESC);

COMMIT;
