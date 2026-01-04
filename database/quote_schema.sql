-- ═══════════════════════════════════════════════════════════════════════════
-- 여수 소원항해 견적 시스템 v2.0 - DB 스키마
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 설계 원칙:
--   1. 지역 확장 대비 (region_code 필드)
--   2. 유실 0: 모든 견적은 추적 가능
--   3. 중복 0: quote_id 유니크
--   4. 관측 가능: quote_events 테이블로 전체 추적
--
-- 작성일: 2026-01-04
-- 설계: 루미 / 코미
-- 승인: 푸르미르 CEO
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. quotes 테이블 (견적의 진실 원본)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_id VARCHAR(20) UNIQUE NOT NULL,  -- SW-20260104-001

  -- 지역 (확장 대비)
  region_code VARCHAR(20) DEFAULT 'yeosu',

  -- 선택 옵션
  guest_count INTEGER NOT NULL,
  day_type VARCHAR(20) NOT NULL,         -- sun/mon-thu/fri/sat/holiday
  travel_date DATE,

  -- 호텔
  hotel_code VARCHAR(50) NOT NULL,       -- utop/ramada/odongjae/kenny
  hotel_name VARCHAR(100),
  room_type VARCHAR(100),

  -- 레저 (선택)
  leisure_code VARCHAR(50),              -- cable/aqua/cruise/yacht
  leisure_name VARCHAR(100),

  -- 소원항해단
  has_wish_voyage BOOLEAN DEFAULT FALSE,
  wish_voyage_type VARCHAR(20),          -- basic/online
  wish_voyage_version VARCHAR(20),       -- v1_active

  -- 단체 여부
  is_group BOOLEAN DEFAULT FALSE,

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 가격 정보 (cost/sell/list 분리)
  -- ═══════════════════════════════════════════════════════════════════════════

  -- 호텔
  hotel_cost INTEGER DEFAULT 0,
  hotel_sell INTEGER DEFAULT 0,
  hotel_list INTEGER DEFAULT 0,

  -- 레저
  leisure_cost INTEGER DEFAULT 0,
  leisure_sell INTEGER DEFAULT 0,
  leisure_list INTEGER DEFAULT 0,

  -- 소원항해단
  wish_voyage_cost INTEGER DEFAULT 0,
  wish_voyage_sell INTEGER DEFAULT 0,
  wish_voyage_list INTEGER DEFAULT 0,

  -- 운영비
  operation_fee_per_person INTEGER DEFAULT 0,
  operation_fee_total INTEGER DEFAULT 0,
  operation_fee_negotiable BOOLEAN DEFAULT FALSE,
  operation_fee_note VARCHAR(100),

  -- 바우처
  voucher_mode VARCHAR(20),              -- split/flex/hybrid
  voucher_food INTEGER DEFAULT 0,
  voucher_experience INTEGER DEFAULT 0,
  voucher_local_goods INTEGER DEFAULT 0,
  voucher_flex INTEGER DEFAULT 0,
  voucher_total INTEGER DEFAULT 0,

  -- 합계
  total_cost INTEGER DEFAULT 0,
  total_sell INTEGER DEFAULT 0,
  total_list INTEGER DEFAULT 0,
  total_margin INTEGER DEFAULT 0,        -- sell - cost
  per_person_sell INTEGER DEFAULT 0,

  -- 혜택 (display용, 가격 차감 X)
  benefits_display JSONB DEFAULT '[]',   -- [{key, label, value, displayText}]
  benefits_total_value INTEGER DEFAULT 0,

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 고객 정보
  -- ═══════════════════════════════════════════════════════════════════════════
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(100),
  memo TEXT,

  -- ═══════════════════════════════════════════════════════════════════════════
  -- CRM 정보
  -- ═══════════════════════════════════════════════════════════════════════════
  lead_score INTEGER DEFAULT 0,
  lead_grade VARCHAR(10),                -- hot/warm/cold
  tags TEXT[],

  -- 유효기간
  valid_until DATE,

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 상태 관리
  -- ═══════════════════════════════════════════════════════════════════════════
  -- calculated → requested → confirmed → cancelled/expired
  status VARCHAR(20) DEFAULT 'calculated',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_region ON quotes(region_code);
CREATE INDEX IF NOT EXISTS idx_quotes_travel_date ON quotes(travel_date);
CREATE INDEX IF NOT EXISTS idx_quotes_lead_grade ON quotes(lead_grade);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_phone ON quotes(customer_phone);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. quote_events 테이블 (관측/대시보드)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,       -- QuoteCalculated, QuoteRequested, etc.
  quote_id VARCHAR(20),

  -- 이벤트 상세
  payload JSONB DEFAULT '{}',

  -- 에이전트 실행 결과
  agent_results JSONB DEFAULT '{}',      -- {pricing: {...}, policy: {...}, ...}

  -- 메타
  source VARCHAR(50),                    -- api/admin/cron/agent
  ip_address VARCHAR(50),
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quote_events_type ON quote_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_events_quote_id ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_events_created_at ON quote_events(created_at);


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. group_inquiries 테이블 (단체 추가 정보)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS group_inquiries (
  id SERIAL PRIMARY KEY,
  quote_id VARCHAR(20) REFERENCES quotes(quote_id) ON DELETE CASCADE,

  -- 단체 정보
  group_name VARCHAR(100),               -- 단체명
  group_type VARCHAR(50),                -- 회사/동창회/가족모임/동호회/기타
  contact_person VARCHAR(50),            -- 담당자

  -- 선호 사항
  room_preference VARCHAR(100),          -- 방 배정 희망사항
  meal_preference VARCHAR(100),          -- 식사 선호 (한식/양식/해산물)

  -- 이동 수단
  departure_location VARCHAR(100),       -- 출발지
  bus_required VARCHAR(50),              -- 버스 필요 여부 (필요/불필요/협의)
  arrival_time VARCHAR(50),              -- 도착 예정 시간

  -- 예산
  budget_range VARCHAR(50),              -- 예산 범위
  budget_per_person INTEGER,             -- 1인당 예산

  -- 특이사항
  special_requests TEXT,                 -- 특별 요청사항
  dietary_restrictions TEXT,             -- 식이 제한 (알레르기 등)

  -- 관리자 메모
  admin_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 유니크 제약 (1 견적 = 1 단체정보)
CREATE UNIQUE INDEX IF NOT EXISTS ux_group_inquiries_quote ON group_inquiries(quote_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. quote_notifications 테이블 (알림 발송 로그)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_notifications (
  id SERIAL PRIMARY KEY,
  quote_id VARCHAR(20) REFERENCES quotes(quote_id) ON DELETE CASCADE,

  -- 발송 정보
  channel VARCHAR(20) NOT NULL,          -- sms/kakao/email
  recipient VARCHAR(100) NOT NULL,       -- 수신자
  template_id VARCHAR(50),               -- 템플릿 ID

  -- 내용
  subject VARCHAR(200),
  message TEXT,

  -- 결과
  status VARCHAR(20) DEFAULT 'pending',  -- pending/sent/failed
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,

  -- 외부 참조
  external_message_id VARCHAR(100),      -- Solapi 등 외부 ID

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_quote_notifications_quote ON quote_notifications(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_notifications_status ON quote_notifications(status);


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. quote_price_versions 테이블 (가격 버전 관리)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quote_price_versions (
  id SERIAL PRIMARY KEY,

  region_code VARCHAR(20) NOT NULL,
  category VARCHAR(50) NOT NULL,         -- hotel/leisure/wishVoyage
  item_code VARCHAR(50) NOT NULL,        -- utop/cable/basic 등

  price_version VARCHAR(20) NOT NULL,    -- v1_active, v2_draft
  status VARCHAR(20) NOT NULL,           -- active/draft/archived
  effective_from DATE,
  effective_to DATE,

  -- 가격 데이터
  pricing_data JSONB NOT NULL,           -- {cost, sell, list} 또는 dayType별 가격

  -- 메타
  updated_by VARCHAR(50),
  update_reason TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 유니크: 동일 지역/카테고리/아이템/버전 중복 방지
CREATE UNIQUE INDEX IF NOT EXISTS ux_price_versions_item
  ON quote_price_versions(region_code, category, item_code, price_version);

-- 활성 가격 조회용 인덱스
CREATE INDEX IF NOT EXISTS idx_price_versions_active
  ON quote_price_versions(region_code, category, status)
  WHERE status = 'active';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. 뷰: 오늘의 견적 요약
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_quotes_today AS
SELECT
  quote_id,
  region_code,
  guest_count,
  hotel_name,
  leisure_name,
  has_wish_voyage,
  is_group,
  total_sell,
  total_margin,
  lead_grade,
  status,
  customer_name,
  customer_phone,
  travel_date,
  created_at
FROM quotes
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 7. 뷰: HOT 리드 목록
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_quotes_hot_leads AS
SELECT
  quote_id,
  customer_name,
  customer_phone,
  guest_count,
  is_group,
  total_sell,
  lead_score,
  lead_grade,
  travel_date,
  valid_until,
  tags,
  created_at
FROM quotes
WHERE lead_grade = 'hot'
  AND status IN ('calculated', 'requested')
  AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
ORDER BY lead_score DESC, created_at DESC;


-- ─────────────────────────────────────────────────────────────────────────────
-- 8. 뷰: 단체 견적 현황
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_quotes_groups AS
SELECT
  q.quote_id,
  q.guest_count,
  q.hotel_name,
  q.travel_date,
  q.total_sell,
  q.operation_fee_negotiable,
  q.status,
  g.group_name,
  g.group_type,
  g.contact_person,
  g.bus_required,
  g.budget_per_person,
  q.created_at
FROM quotes q
LEFT JOIN group_inquiries g ON q.quote_id = g.quote_id
WHERE q.is_group = TRUE
ORDER BY q.created_at DESC;


-- ═══════════════════════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════════════════════
