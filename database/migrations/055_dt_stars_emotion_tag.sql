-- 055_dt_stars_emotion_tag.sql
-- dt_stars에 emotion_tag 컬럼 추가
-- star 생성 시 wish_text 기반 룰로 자동 할당

ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS emotion_tag VARCHAR(50) DEFAULT 'growth';
