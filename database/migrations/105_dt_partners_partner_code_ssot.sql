-- 105_dt_partners_partner_code_ssot.sql
-- Guardian Commerce V0.1 — Partner Identity SSOT 통일
--
-- 목표:
--   1. dt_partners.id (UUID) = Internal SSOT 확정
--   2. dt_partners.partner_code (VARCHAR 50, UNIQUE) = Public Stable ID
--   3. benefit_credentials.partner_code ↔ dt_partners.partner_code 매핑 가능화
--
-- 제약 (무중단 운영):
--   ✅ 기존 benefit_credentials / benefit_redemptions / dt_settlements 데이터 유지
--   ✅ 기존 partner_configs 데이터 유지
--   ✅ Backward-compatible — 기존 쿼리 정상 동작
--   ❌ 기존 컬럼 삭제 금지
--   ❌ FK 강제 전환 금지 (Phase 2 이후, 별도 승인)
--
-- Timeline:
--   2026-08-17: Migration 105 배포 (additive)
--   2026-08-24 이후: Phase 2 승인 후 hard FK 전환 (별도 migration)

-- ═══════════════════════════════════════════════════════════════════════════════
-- ① dt_partners에 partner_code 컬럼 추가 (UNIQUE, nullable 초기상태)
-- ═══════════════════════════════════════════════════════════════════════════════
ALTER TABLE dt_partners
  ADD COLUMN IF NOT EXISTS partner_code VARCHAR(50) UNIQUE;

-- 주석:
--   - UNIQUE: 각 partner는 고유한 partner_code를 가짐
--   - nullable: 기존 dt_partners 레코드에서 초기값 미설정
--   - 신규 레코드 생성 시: application layer에서 반드시 설정해야 함

-- ═══════════════════════════════════════════════════════════════════════════════
-- ② 인덱스 추가 (LEFT JOIN 성능 개선)
-- ═══════════════════════════════════════════════════════════════════════════════

-- idx_partners_code: partner_code 기반 빠른 조회
CREATE INDEX IF NOT EXISTS idx_partners_code ON dt_partners(partner_code);

-- idx_cred_partner_code: benefit_credentials에서 partner_code 기반 조회
CREATE INDEX IF NOT EXISTS idx_cred_partner_code ON benefit_credentials(partner_code);

-- 사용 예시 (application):
--   SELECT bc.*, dp.id as partner_uuid
--   FROM benefit_credentials bc
--   LEFT JOIN dt_partners dp ON dp.partner_code = bc.partner_code
--   WHERE bc.status = 'VERIFIED'
--   AND bc.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days';

-- ═══════════════════════════════════════════════════════════════════════════════
-- ③ 매핑 전략 (매뉴얼 — Phase 1)
-- ═══════════════════════════════════════════════════════════════════════════════

-- 기존 dt_partners 레코드의 partner_code 설정:
--
-- 절차:
--   1. 기존 benefit 시스템의 partner_code 목록 수집
--      SELECT DISTINCT partner_code FROM benefit_credentials ORDER BY partner_code;
--
--   2. 각 benefit partner와 dt_partners의 매핑 확인
--      (예: benefit "CABLE_CAR" ↔ dt_partners "해상케이블카")
--
--   3. 수동으로 UPDATE (한 번만)
--      UPDATE dt_partners SET partner_code = 'CABLE_CAR' WHERE name = '해상케이블카';
--
--   4. 다음 단계: benefit_credentials.partner_code → dt_partners.partner_code FK 등록
--      (별도 migration 105B 또는 migration 106 예정, Phase 2 승인 후)

-- ═══════════════════════════════════════════════════════════════════════════════
-- ④ Application-level 적용 (code 수정 필요)
-- ═══════════════════════════════════════════════════════════════════════════════

-- routes/benefitCredentialRoutes.js (예시):
--   // 기존 쿼리 유지
--   const credential = await db.query(
--     `SELECT * FROM benefit_credentials WHERE credential_code = $1`,
--     [code]
--   );
--
--   // 신규: partner_uuid 조회 (LEFT JOIN)
--   if (credential.partner_code) {
--     const partner = await db.query(
--       `SELECT * FROM dt_partners WHERE partner_code = $1`,
--       [credential.partner_code]
--     );
--     credential.partner_uuid = partner.rows[0]?.id || null;
--   }

-- ═══════════════════════════════════════════════════════════════════════════════
-- ⑤ 신규 dt_partners 레코드 생성 규칙 (이제부터 의무)
-- ═══════════════════════════════════════════════════════════════════════════════

-- INSERT INTO dt_partners (id, city_code, name, category, partner_code)
-- VALUES (
--   gen_random_uuid(),
--   'yeosu',
--   '신규 파트너명',
--   'cafe',
--   'NEW_PARTNER_CODE'  ← 반드시 설정, UNIQUE 보장
-- );

-- ═══════════════════════════════════════════════════════════════════════════════
-- ⑥ 향후 계획 (Phase 2, 별도 승인 필수)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Phase 2 (이후 migration):
--   1. benefit_credentials.partner_code → dt_partners.partner_code FK
--   2. benefit_redemptions.partner_id → dt_partners.partner_code FK
--   3. dt_settlements.partner_id → dt_partners.partner_code FK
--   4. partner_configs.partner_code → dt_partners.partner_code FK (이미 존재)
--
-- Phase 3 (결국):
--   1. benefit_credentials.partner_code를 partner_uuid (UUID FK) 로 변환 (선택사항)
--   2. benefit_redemptions.partner_id를 partner_uuid (UUID FK) 로 변환 (선택사항)
--   3. dt_settlements.partner_id를 partner_uuid (UUID FK) 로 변환 (선택사항)
--
-- 현재 단계 (Phase 1): 기존 데이터 구조 변경 없음, soft reference → LEFT JOIN만 활용

-- ═══════════════════════════════════════════════════════════════════════════════
-- ⑦ 롤백 스크립트 (긴급 상황)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Migration 105 완전 롤백:
--
-- DROP INDEX IF EXISTS idx_partners_code;
-- DROP INDEX IF EXISTS idx_cred_partner_code;
-- ALTER TABLE dt_partners DROP COLUMN IF EXISTS partner_code;
--
-- 결과: dt_partners 컬럼 12개 → 11개 (partner_code 제거)
-- 데이터 손실: 없음 (partner_code는 초기값이 없거나 수동 설정만 함)

-- ═══════════════════════════════════════════════════════════════════════════════
