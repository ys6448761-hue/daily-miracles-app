-- ═══════════════════════════════════════════════════════════════════════════
-- 견적 시스템 P0 업그레이드: Deal Structuring 필드 추가
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 목적: "확정" 버튼 시 책임주체/돈흐름/세금발행이 자동으로 결정되도록
-- 작성일: 2026-01-13
-- 설계: 루미 분석 기반
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. 운영모드 및 책임주체 필드 추가
-- ─────────────────────────────────────────────────────────────────────────────

-- 운영모드 (4종)
-- direct: 직영 (우리가 전부 처리)
-- agency: 여행사 이관 (여행사가 계약/결제/책임)
-- commission: 수수료만 (우리는 수수료만 받음)
-- hybrid: 혼합 (일부 직영 + 일부 이관)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS operation_mode VARCHAR(20) DEFAULT 'direct';

-- 정산방식
-- full: 전액 정산 (우리가 전액 수령 후 정산)
-- commission_only: 수수료만 (수수료만 수령)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS settlement_method VARCHAR(20) DEFAULT 'full';

-- 세금계산서 발행주체
-- us: 우리가 발행
-- agency: 여행사가 발행
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS tax_invoice_issuer VARCHAR(20) DEFAULT 'us';

-- 결제 수령주체
-- us: 우리 계좌로 수령
-- agency: 여행사 계좌로 수령
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS payment_receiver VARCHAR(20) DEFAULT 'us';

-- 계약 주체 (고객과의 계약)
-- us: 우리가 계약 당사자
-- agency: 여행사가 계약 당사자
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS contract_party VARCHAR(20) DEFAULT 'us';

-- 취소/환불 책임
-- us: 우리가 책임
-- agency: 여행사가 책임
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS refund_liability VARCHAR(20) DEFAULT 'us';

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Deal Structuring 워크플로우 필드 추가
-- ─────────────────────────────────────────────────────────────────────────────

-- 워크플로우 상태 (기존 status와 별도)
-- pending: 검토 대기
-- deal_review: 담당자 검토 중
-- ceo_approval: CEO 승인 대기
-- auto_approved: 자동 승인됨
-- approved: 승인됨
-- rejected: 반려됨
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending';

-- 승인 필요 여부 (자동 판단)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

-- 승인 필요 사유 (JSON 배열)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_reasons JSONB DEFAULT '[]';

-- 승인자 정보
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_by VARCHAR(50);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approval_note TEXT;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 인센티브/MICE 관련 필드 (P1 대비)
-- ─────────────────────────────────────────────────────────────────────────────

-- 인센티브 신청 여부
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS incentive_required BOOLEAN DEFAULT FALSE;

-- 인센티브 신청 주체
-- us: 우리가 신청
-- agency: 여행사가 신청
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS incentive_applicant VARCHAR(20);

-- MICE 여부
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS is_mice BOOLEAN DEFAULT FALSE;

-- 필수 서류 체크리스트 (JSON)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '[]';

-- 기한 플래그 (JSON)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deadline_flags JSONB DEFAULT '[]';

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. 확정 견적 관련 필드
-- ─────────────────────────────────────────────────────────────────────────────

-- 견적 유형
-- estimated: 예상 견적
-- confirmed: 확정 견적
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS quote_type VARCHAR(20) DEFAULT 'estimated';

-- 확정 일시
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- 확정자
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS confirmed_by VARCHAR(50);

-- PDF 생성 여부
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pdf_generated BOOLEAN DEFAULT FALSE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS pdf_generated_at TIMESTAMP WITH TIME ZONE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. 인덱스 추가
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_quotes_operation_mode ON quotes(operation_mode);
CREATE INDEX IF NOT EXISTS idx_quotes_approval_status ON quotes(approval_status);
CREATE INDEX IF NOT EXISTS idx_quotes_requires_approval ON quotes(requires_approval) WHERE requires_approval = TRUE;
CREATE INDEX IF NOT EXISTS idx_quotes_quote_type ON quotes(quote_type);
CREATE INDEX IF NOT EXISTS idx_quotes_incentive ON quotes(incentive_required) WHERE incentive_required = TRUE;
CREATE INDEX IF NOT EXISTS idx_quotes_mice ON quotes(is_mice) WHERE is_mice = TRUE;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. 뷰: 승인 대기 목록
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_quotes_pending_approval AS
SELECT
  quote_id,
  customer_name,
  customer_phone,
  guest_count,
  travel_date,
  total_sell,
  operation_mode,
  settlement_method,
  tax_invoice_issuer,
  payment_receiver,
  contract_party,
  refund_liability,
  approval_status,
  approval_reasons,
  requires_approval,
  incentive_required,
  is_mice,
  created_at
FROM quotes
WHERE requires_approval = TRUE
  AND approval_status IN ('pending', 'deal_review', 'ceo_approval')
ORDER BY created_at DESC;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. 뷰: 운영모드별 현황
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_quotes_by_operation_mode AS
SELECT
  operation_mode,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_count,
  SUM(total_sell) as total_revenue,
  SUM(total_margin) as total_margin
FROM quotes
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY operation_mode
ORDER BY total_count DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ Deal Structuring 필드 마이그레이션 완료!';
    RAISE NOTICE '   - 운영모드 필드 6개 추가';
    RAISE NOTICE '   - 워크플로우 필드 6개 추가';
    RAISE NOTICE '   - 인센티브/MICE 필드 5개 추가';
    RAISE NOTICE '   - 확정 견적 필드 5개 추가';
    RAISE NOTICE '   - 인덱스 6개 생성';
    RAISE NOTICE '   - 뷰 2개 생성';
END $$;
