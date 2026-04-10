-- 078_benefit_credentials_phone.sql
-- benefit_credentials에 알림톡 발송용 phone 컬럼 추가

ALTER TABLE benefit_credentials
  ADD COLUMN IF NOT EXISTS user_phone VARCHAR(20);
