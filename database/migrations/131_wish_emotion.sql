-- 131_wish_emotion.sql
-- 소원 감정 한 줄 (OpenAI 생성, 별 상세 화면 공명 유도용)
ALTER TABLE dt_wishes ADD COLUMN IF NOT EXISTS wish_emotion TEXT;
