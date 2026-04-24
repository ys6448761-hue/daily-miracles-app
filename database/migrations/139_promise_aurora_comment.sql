-- Migration 139: promise_records aurora_comment 컬럼 추가
-- CREATE 시 1회 생성 후 저장 → 재조회 시 동일 텍스트 보장

ALTER TABLE promise_records
  ADD COLUMN IF NOT EXISTS aurora_comment TEXT;
