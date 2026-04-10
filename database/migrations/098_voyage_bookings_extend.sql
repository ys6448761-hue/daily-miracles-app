-- 098_voyage_bookings_extend.sql
-- voyage_bookings: party_size / booking_type / checked_in 상태 추가

-- 인원 수 (기본 1)
ALTER TABLE voyage_bookings
  ADD COLUMN IF NOT EXISTS party_size INTEGER NOT NULL DEFAULT 1;

-- 개인 / 단체 구분
ALTER TABLE voyage_bookings
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(10) NOT NULL DEFAULT '개인'
  CHECK (booking_type IN ('개인', '단체'));

-- status CHECK에 checked_in 추가
ALTER TABLE voyage_bookings
  DROP CONSTRAINT IF EXISTS voyage_bookings_status_check;

ALTER TABLE voyage_bookings
  ADD CONSTRAINT voyage_bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'checked_in', 'cancelled'));
