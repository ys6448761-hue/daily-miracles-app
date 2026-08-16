-- 105_dt_partners_partner_code_ssot_rollback.sql
-- Guardian Commerce V0.1 — GAP-03 롤백 스크립트
--
-- 긴급 상황에서 Migration 105를 완전히 제거합니다.
-- 데이터 손실: 없음 (partner_code는 초기값이 없거나 수동 설정만 함)
--
-- 실행 전 주의:
--   - Production에서 실행하기 전 staging에서 테스트
--   - 롤백 후 application 재배포 필요
--   - 롤백 후 partner_uuid 조회는 null 반환 (기존 소프트 레퍼런스 상태)

-- ═══════════════════════════════════════════════════════════════════════════════
-- 롤백 단계
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. 인덱스 삭제
DROP INDEX IF EXISTS idx_partners_code;
DROP INDEX IF EXISTS idx_cred_partner_code;

-- 2. 컬럼 삭제
ALTER TABLE dt_partners DROP COLUMN IF EXISTS partner_code;

-- 3. 확인 (선택사항: 각 테이블의 컬럼 목록 확인)
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'dt_partners' ORDER BY ordinal_position;
--
-- 예상 결과 (partner_code 제외):
--   id                | uuid
--   city_code         | character varying
--   name              | character varying
--   category          | character varying
--   address           | text
--   lat               | numeric
--   lng               | numeric
--   phone             | character varying
--   description       | text
--   is_active         | boolean
--   created_at        | timestamp with time zone
--   updated_at        | timestamp with time zone

-- ═══════════════════════════════════════════════════════════════════════════════
-- 롤백 후 상태
-- ═══════════════════════════════════════════════════════════════════════════════

-- benefit_credentials: 변경 없음
--   partner_code VARCHAR(50) 그대로 유지
--
-- benefitCredentialRoutes.js: 리버전 필요
--   partner_uuid 조회 로직 제거
--   verify/redeem 응답에서 partner_uuid 제거
--
-- 기존 Mobile Coupon 흐름: 완전히 복원
--   Verify → status='VERIFIED', partner_code='XXX'
--   Redeem → status='REDEEMED', benefit_redemptions.partner_id='XXX'
--   Settlement → soft reference (partner_code 기반)

-- ═══════════════════════════════════════════════════════════════════════════════
-- 롤백 확인 쿼리
-- ═══════════════════════════════════════════════════════════════════════════════

-- 인덱스 확인
-- SELECT * FROM information_schema.statistics
-- WHERE table_name = 'dt_partners'
-- AND index_name LIKE 'idx_partners%';
--
-- 결과: 0 rows (인덱스 삭제됨)

-- Partner 레코드 확인 (partner_code 컬럼 없음)
-- SELECT id, city_code, name, category FROM dt_partners LIMIT 1;

-- ═══════════════════════════════════════════════════════════════════════════════
