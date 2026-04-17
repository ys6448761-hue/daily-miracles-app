-- Migration 123: promise_records 필드 확장
-- ① 생성 시 GPS 저장 (created_lat, created_lng)
-- ② 내용 분리 (emotion_text 유지 + message_to_future 추가)
-- ③ 개봉 이력 (opened_count, first_opened_at)

ALTER TABLE promise_records
  ADD COLUMN IF NOT EXISTS message_to_future TEXT,
  ADD COLUMN IF NOT EXISTS created_lat       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS created_lng       DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS first_opened_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS opened_count      INT NOT NULL DEFAULT 0;
