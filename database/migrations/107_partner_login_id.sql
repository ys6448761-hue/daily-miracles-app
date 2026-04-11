-- Migration 107: partner_accounts에 login_id 컬럼 추가
-- DT-YS-C001 형식의 고유 아이디

ALTER TABLE partner_accounts
  ADD COLUMN IF NOT EXISTS login_id VARCHAR(50) UNIQUE;

-- 기존 계정은 email 앞부분을 login_id로 임시 설정
-- (예: abc_12345678@partner.dailymiracles.kr → abc_12345678)
UPDATE partner_accounts
   SET login_id = SPLIT_PART(email, '@', 1)
 WHERE login_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_partner_accounts_login_id
  ON partner_accounts(login_id);
