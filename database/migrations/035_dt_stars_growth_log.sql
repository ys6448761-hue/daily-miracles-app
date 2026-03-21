-- Migration 035: dt_stars 성장 기록 컬럼 추가
--
-- 목적: MyStar 성장 질문 응답을 서버에 영속 저장
--       (CASE 2: resonance_received 후 owner 성장 기록 → connection_completed 트리거)
--
-- 기존 동작 변경 없음: localStorage 저장은 그대로 유지, 서버 저장 추가

ALTER TABLE dt_stars
  ADD COLUMN IF NOT EXISTS growth_log_text    TEXT,
  ADD COLUMN IF NOT EXISTS growth_logged_at   TIMESTAMP;
