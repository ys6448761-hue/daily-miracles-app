-- 097_guardian_dispatch_setup.sql
-- Guardian Dispatch V0 — SMS 발송 로그 확장 및 Idempotency 설정
-- 매일 21:00 KST 신규 사용자에게 소원별 상태확인 메시지 자동 발송

-- ① message_dispatch_logs 테이블에 phone_hash 컬럼 추가 (중복 발송 방지용)
ALTER TABLE message_dispatch_logs
  ADD COLUMN IF NOT EXISTS phone_hash VARCHAR(64);

-- ② Guardian Dispatch 용도 인덱스
-- - event_name = 'guardian_dispatch'인 레코드 빠른 조회
-- - delivery_status = 'sent'인 레코드만 필터 (스킵된 것 제외)
-- - created_at 기준 날짜별 집계
CREATE INDEX IF NOT EXISTS idx_dispatch_guardian_event
  ON message_dispatch_logs(event_name, delivery_status)
  WHERE event_name = 'guardian_dispatch';

-- ③ Idempotency 제약: wish_entry 단위로 하루 1회만 발송
-- - 같은 사용자도 다른 wish_entry면 별도 발송
-- - 같은 wish_entry는 하루 1회만 (중복 방지)
-- - delivery_status = 'sent' 또는 'dry_run' 포함 (양쪽 모두 중복 체크)
--
-- 쿼리 방식:
--   message_dispatch_logs.details->>'wish_entry_id' = $wish_id
--   AND DATE(created_at) = CURRENT_DATE
--   AND delivery_status IN ('sent', 'dry_run')
--
-- 참고: 부분 인덱스로는 JSON 경로 인덱싱 어려우므로
--      dispatchFilter.js의 쿼리 로직에서 중복 체크 (DB 쿼리로 처리)
CREATE INDEX IF NOT EXISTS idx_dispatch_guardian_details_wish
  ON message_dispatch_logs USING GIN(details)
  WHERE event_name = 'guardian_dispatch';

-- ④ Guardian Dispatch 발송 통계용 인덱스
CREATE INDEX IF NOT EXISTS idx_dispatch_guardian_status_date
  ON message_dispatch_logs(delivery_status, DATE(created_at))
  WHERE event_name = 'guardian_dispatch';

-- ─────────────────────────────────────────────────────────────────────────
-- 롤백 문서 (필요시 실행)
-- ─────────────────────────────────────────────────────────────────────────
-- 롤백은 production에서 실행하지 말 것 (운영 데이터 손실 위험)
--
-- DROP INDEX IF EXISTS idx_dispatch_guardian_event;
-- DROP INDEX IF EXISTS idx_dispatch_guardian_phone_daily;
-- DROP INDEX IF EXISTS idx_dispatch_guardian_status_date;
-- ALTER TABLE message_dispatch_logs DROP COLUMN IF EXISTS phone_hash;
-- ─────────────────────────────────────────────────────────────────────────
