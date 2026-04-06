-- 056_dt_stars_meaning_text.sql
-- dt_stars에 meaning_text 추가
-- 감정(emotion_tag) + 위치(zone) 기반 의미 문장 (결정론적)

ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS meaning_text TEXT;
