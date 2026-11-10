-- 216_dt_partners_sowonpass_fields.sql
-- PHX-SOWONPASS-001: dt_partners 소원패스 그룹/야간/제휴상태/지도URL 필드 추가

ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS location_group      VARCHAR(20)  DEFAULT NULL
                           CHECK (location_group IN ('hotel_vicinity','yeosu_city')),
  ADD COLUMN IF NOT EXISTS is_night            BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS affiliation_status  VARCHAR(20)  NOT NULL DEFAULT 'candidate'
                           CHECK (affiliation_status IN ('candidate','negotiating','confirmed')),
  ADD COLUMN IF NOT EXISTS naver_map_url       TEXT         DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_partners_sowonpass
  ON dt_partners(city_code, location_group, affiliation_status)
  WHERE is_active = true;
