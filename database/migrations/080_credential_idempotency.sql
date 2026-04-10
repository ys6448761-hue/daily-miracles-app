-- 080_credential_idempotency.sql
-- benefit_credentials 중복 사용 DB 레벨 보호
-- 동일 credential에 대해 completed 리뎀션은 1건만 허용

CREATE UNIQUE INDEX IF NOT EXISTS idx_redemptions_one_per_credential
  ON benefit_redemptions(credential_id)
  WHERE status = 'completed';

-- 알림톡 중복 발송 방지: 동일 credential + event에 대해 sent는 1건만
CREATE UNIQUE INDEX IF NOT EXISTS idx_dispatch_one_sent_per_credential
  ON message_dispatch_logs(credential_id, event_name)
  WHERE delivery_status = 'sent';
