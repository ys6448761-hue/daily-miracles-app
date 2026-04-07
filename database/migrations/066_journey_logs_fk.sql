-- 066_journey_logs_fk.sql
-- journey_logs.journey_id → journeys.id FK 연결
-- 기존 고아 레코드 보호: DEFERRABLE + 소프트 적용

ALTER TABLE journey_logs
  ADD COLUMN IF NOT EXISTS journeys_id UUID REFERENCES journeys(id) ON DELETE SET NULL;

-- 기존 journey_id 컬럼은 유지 (하위 호환)
-- 신규 insert는 journeys_id로 연결
COMMENT ON COLUMN journey_logs.journey_id  IS '레거시: 자유 UUID (migration 061)';
COMMENT ON COLUMN journey_logs.journeys_id IS '정식 FK → journeys.id (migration 066~)';
