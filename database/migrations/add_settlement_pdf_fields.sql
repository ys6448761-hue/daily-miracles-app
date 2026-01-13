-- ═══════════════════════════════════════════════════════════════════════════
-- P2-2: 정산서/수수료-only PDF 필드 추가
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 목적: commission 모드 견적에서 자동으로 정산서 PDF 생성 지원
-- 작성일: 2026-01-13
-- 설계: 루미 분석 기반 (P2-2 정산서 템플릿 확정본 v1)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. 정산서 PDF 관련 필드
-- ─────────────────────────────────────────────────────────────────────────────

-- 정산서 PDF 생성 여부
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS settlement_pdf_generated BOOLEAN DEFAULT FALSE;

-- 정산서 PDF URL
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS settlement_pdf_url TEXT;

-- 수수료율 (%)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00;

-- 정산 금액 (수수료 금액)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS settlement_amount INTEGER DEFAULT 0;

-- 정산 예정일
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS settlement_due_at DATE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. 파트너/여행사 정보 필드 (정산서 수신자)
-- ─────────────────────────────────────────────────────────────────────────────

-- 여행사/파트너 상호
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS agency_name VARCHAR(100);

-- 여행사/파트너 담당자
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS agency_contact VARCHAR(50);

-- 정산 메모
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS settlement_notes TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 인덱스 추가
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quotes_settlement_pdf ON quotes(settlement_pdf_generated)
  WHERE settlement_pdf_generated = TRUE;

CREATE INDEX IF NOT EXISTS idx_quotes_commission_mode ON quotes(operation_mode)
  WHERE operation_mode = 'commission';

-- ─────────────────────────────────────────────════════════════════════════════
-- 4. 뷰: 정산 필요 목록 (commission 모드 + 확정 + 정산 미완료)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_quotes_pending_settlement AS
SELECT
  quote_id,
  customer_name,
  travel_date,
  guest_count,
  total_sell,
  commission_rate,
  settlement_amount,
  settlement_due_at,
  agency_name,
  agency_contact,
  settlement_pdf_generated,
  settlement_pdf_url,
  confirmed_at,
  created_at
FROM quotes
WHERE operation_mode = 'commission'
  AND status = 'confirmed'
ORDER BY settlement_due_at ASC NULLS LAST, confirmed_at DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ P2-2 정산서 필드 마이그레이션 완료!';
    RAISE NOTICE '   - 정산서 PDF 필드 5개 추가';
    RAISE NOTICE '   - 파트너 정보 필드 3개 추가';
    RAISE NOTICE '   - 인덱스 2개 생성';
    RAISE NOTICE '   - 뷰 1개 생성';
END $$;
