-- 216_dt_partners_sowonpass_fields.sql
-- PHX-SOWONPASS-001: dt_partners 소원패스 필드 추가 (Founder 보완 반영)
--
-- info_status   : 업체 정보 검증 여부 (공개 여부 기준)
-- affiliation_status : 제휴/쿠폰 활성화 상태 (쿠폰 여부 기준)
--
-- 공개 정책:
--   info_status=verified                → 업체 소개 카드 공개 가능
--   info_status=verified + affiliation_status=confirmed → 쿠폰 활성화
--   info_status=unverified              → 완전 비공개

ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS location_group      VARCHAR(20)  DEFAULT NULL
                           CHECK (location_group IN ('hotel_vicinity','yeosu_city')),
  ADD COLUMN IF NOT EXISTS is_night            BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS info_status         VARCHAR(20)  NOT NULL DEFAULT 'unverified'
                           CHECK (info_status IN ('unverified','verified')),
  ADD COLUMN IF NOT EXISTS affiliation_status  VARCHAR(20)  NOT NULL DEFAULT 'none'
                           CHECK (affiliation_status IN ('none','negotiating','confirmed')),
  ADD COLUMN IF NOT EXISTS naver_map_url       TEXT         DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_partners_sowonpass
  ON dt_partners(city_code, location_group, info_status, affiliation_status)
  WHERE is_active = true;
