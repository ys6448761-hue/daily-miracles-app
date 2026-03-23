-- Migration 026: challenge_social_temp
-- Purpose: temperature_state에 소셜 온도(social_temperature) 컬럼 추가 (AIL-111)
--
-- social_temperature: 기적나눔(cheer) 수신 시 상승 (+0.3/건)
--   범위: 20.0 ~ 40.0 (routine temperature와 동일 하한·상한)
--   기본값: 25.0 (cold start)
--
-- NOTE: routine temperature (temperature 컬럼) 와 분리 유지 —
--   routine: attendanceService.ping('open') 에 의해서만 상승
--   social:  기적나눔 cheer was_new 시에만 상승

ALTER TABLE temperature_state
  ADD COLUMN IF NOT EXISTS social_temperature NUMERIC DEFAULT 25.0;

COMMENT ON COLUMN temperature_state.social_temperature
  IS '소셜 온도 — 기적나눔(cheer) 수신 시 +0.3, 범위 20.0~40.0 (AIL-111)';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 026 완료: temperature_state.social_temperature 추가';
END $$;
