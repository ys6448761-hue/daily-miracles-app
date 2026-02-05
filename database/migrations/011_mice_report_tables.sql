-- ═══════════════════════════════════════════════════════════════════════════
-- Yeosu Ops Center v1 - MICE 인센티브 결과보고 패키지 테이블
-- Migration: 011_mice_report_tables.sql
-- Created: 2026-02-05
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM Types
-- ─────────────────────────────────────────────────────────────────────────────

-- 참가자 등록 유형
CREATE TYPE mice_reg_type AS ENUM ('PRE', 'ONSITE');

-- 지출 카테고리 (공고 기준)
CREATE TYPE mice_expense_category AS ENUM (
  'RENTAL',        -- 회의장/전시장 임차료
  'LODGING',       -- 숙박비
  'FNB_HOTEL',     -- 식음료비(호텔)
  'FNB_OUTSIDE',   -- 식음료비(호텔외)
  'TOUR',          -- 관광/투어비
  'PRINT_ADS',     -- 인쇄/광고비
  'SOUVENIR',      -- 기념품비
  'LOCAL_VENDOR',  -- 지역업체 이용비
  'ETC'            -- 기타
);

-- 결제 수단
CREATE TYPE mice_pay_method AS ENUM (
  'TRANSFER',   -- 계좌이체
  'CORP_CARD',  -- 법인카드
  'CASH',       -- 현금
  'ETC'         -- 기타
);

-- 사진 태그 (공고 요구사항)
CREATE TYPE mice_photo_tag AS ENUM (
  'LOGO_EXPOSURE',  -- 여수시 로고 노출
  'MEETING',        -- 회의/행사 장면
  'SUPPORT_ITEM',   -- 지원물품 활용
  'VENUE',          -- 장소 전경
  'PARTICIPANT',    -- 참가자
  'ETC'             -- 기타
);

-- 에셋 종류
CREATE TYPE mice_asset_kind AS ENUM (
  'RECEIPT',      -- 영수증
  'TAX_INVOICE',  -- 세금계산서
  'CARD_SLIP',    -- 카드전표
  'DEPOSIT_SLIP', -- 입금증
  'BIZ_REG',      -- 사업자등록증
  'BANKBOOK',     -- 통장사본
  'PHOTO',        -- 사진
  'DOC',          -- 문서
  'SIGNATURE',    -- 서명
  'CONSENT',      -- 동의서
  'ETC'           -- 기타
);

-- 설문 응답자 유형
CREATE TYPE mice_respondent_type AS ENUM ('ORGANIZER', 'PARTICIPANT');

-- 리포트 패키지 상태
CREATE TYPE mice_report_status AS ENUM ('GENERATING', 'READY', 'EXPIRED', 'ERROR');

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. 에셋 테이블 (파일 저장 공통)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,
  kind mice_asset_kind NOT NULL DEFAULT 'ETC',
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  storage_path TEXT NOT NULL,  -- 로컬 경로 또는 S3 URL
  metadata JSONB DEFAULT '{}',
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_size CHECK (size_bytes >= 0)
);

CREATE INDEX idx_assets_event ON ops_assets(event_id);
CREATE INDEX idx_assets_kind ON ops_assets(kind);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. 참가자 등록부 (별지2-1호)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_mice_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,
  reg_type mice_reg_type NOT NULL DEFAULT 'PRE',

  -- 참가자 정보
  org_name TEXT,                    -- 소속/단체명
  person_name TEXT NOT NULL,        -- 성명
  email TEXT,
  phone TEXT,
  nationality TEXT DEFAULT 'KR',    -- 국적 (ISO 코드)
  is_foreign BOOLEAN DEFAULT FALSE, -- 외국인 여부

  -- 사전등록 필수
  fee_paid_amount NUMERIC(12,2),    -- 등록비 납부액
  deposit_date DATE,                -- 입금일 (사전등록 필수)

  -- 현장등록 (P1: 전자서명)
  onsite_signature_asset_id UUID REFERENCES ops_assets(id),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_participants_event ON ops_mice_participants(event_id);
CREATE INDEX idx_participants_reg_type ON ops_mice_participants(reg_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 숙박확인서 (별지2-2호)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_mice_stays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,

  hotel_name TEXT NOT NULL,         -- 숙박업소명
  checkin_date DATE NOT NULL,       -- 체크인 일자
  checkout_date DATE,               -- 체크아웃 일자
  nights INTEGER NOT NULL DEFAULT 1,-- 숙박일수

  guest_count_total INTEGER NOT NULL DEFAULT 1,  -- 총 투숙객 수
  guest_count_foreign INTEGER DEFAULT 0,         -- 외국인 투숙객 수
  rooms_count INTEGER,                           -- 객실 수

  -- 증빙 첨부
  receipt_asset_id UUID REFERENCES ops_assets(id),

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stays_event ON ops_mice_stays(event_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. 지출증빙 (정산)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_mice_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,

  category mice_expense_category NOT NULL,
  description TEXT,                 -- 지출 내역
  vendor_name TEXT NOT NULL,        -- 거래처명
  vendor_is_local BOOLEAN DEFAULT FALSE,  -- 여수지역 업체 여부
  vendor_biz_reg_no TEXT,           -- 사업자번호

  amount NUMERIC(12,2) NOT NULL,    -- 금액
  pay_method mice_pay_method NOT NULL DEFAULT 'TRANSFER',
  paid_at DATE,                     -- 지출일

  -- 증빙 첨부 (여러 파일)
  evidence_assets JSONB DEFAULT '{}',  -- {quote_id, tax_invoice_id, card_slip_id, etc}

  -- 검증
  is_valid BOOLEAN DEFAULT TRUE,    -- 증빙 유효 여부
  validation_notes TEXT,            -- 검증 메모 (불인정 사유 등)

  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_event ON ops_mice_expenses(event_id);
CREATE INDEX idx_expenses_category ON ops_mice_expenses(category);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. 사진대장 (별지2-3호)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_mice_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,

  photo_asset_id UUID NOT NULL REFERENCES ops_assets(id),
  tag mice_photo_tag NOT NULL DEFAULT 'ETC',
  description TEXT,                 -- 사진 설명
  taken_at TIMESTAMPTZ,             -- 촬영 시간
  location TEXT,                    -- 촬영 장소

  sort_order INTEGER DEFAULT 0,     -- 정렬 순서
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_event ON ops_mice_photos(event_id);
CREATE INDEX idx_photos_tag ON ops_mice_photos(tag);

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. 설문 응답 (별지3호)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_mice_survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,

  respondent_type mice_respondent_type DEFAULT 'ORGANIZER',
  respondent_name TEXT,
  respondent_org TEXT,

  -- Q1~Q21 저장 (별지3호 기준)
  answers JSONB NOT NULL DEFAULT '{}',

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_survey_event ON ops_mice_survey_responses(event_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. 결과보고 패키지 (생성 기록)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ops_mice_report_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES ops_events(id) ON DELETE CASCADE,

  status mice_report_status DEFAULT 'GENERATING',

  -- 패키지 내용
  zip_filename TEXT,
  zip_path TEXT,
  zip_size_bytes INTEGER,

  -- 체크리스트 스냅샷
  checklist_snapshot JSONB DEFAULT '{}',

  -- 포함된 파일 목록
  included_files JSONB DEFAULT '[]',

  generated_by TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- 다운로드 만료

  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_packs_event ON ops_mice_report_packs(event_id);
CREATE INDEX idx_report_packs_status ON ops_mice_report_packs(status);

-- ─────────────────────────────────────────────────────────────────────────────
-- Triggers for updated_at
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_mice_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_participants_updated
  BEFORE UPDATE ON ops_mice_participants
  FOR EACH ROW EXECUTE FUNCTION update_mice_updated_at();

CREATE TRIGGER trg_stays_updated
  BEFORE UPDATE ON ops_mice_stays
  FOR EACH ROW EXECUTE FUNCTION update_mice_updated_at();

CREATE TRIGGER trg_expenses_updated
  BEFORE UPDATE ON ops_mice_expenses
  FOR EACH ROW EXECUTE FUNCTION update_mice_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE ops_assets IS '파일 에셋 저장 (증빙, 사진, 서명 등)';
COMMENT ON TABLE ops_mice_participants IS '참가자 등록부 (별지2-1호)';
COMMENT ON TABLE ops_mice_stays IS '숙박확인서 (별지2-2호)';
COMMENT ON TABLE ops_mice_expenses IS '지출증빙/정산 내역';
COMMENT ON TABLE ops_mice_photos IS '사진대장 (별지2-3호)';
COMMENT ON TABLE ops_mice_survey_responses IS '설문조사 응답 (별지3호)';
COMMENT ON TABLE ops_mice_report_packs IS '결과보고 패키지 생성 기록';

-- ═══════════════════════════════════════════════════════════════════════════
-- End of Migration 011
-- ═══════════════════════════════════════════════════════════════════════════
