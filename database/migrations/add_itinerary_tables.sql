-- ═══════════════════════════════════════════════════════════════════════════
-- 4인 이하 자동 일정 생성 테이블
-- ═══════════════════════════════════════════════════════════════════════════
--
-- 루미 분석 기반 P0: 결제 → 옵션 선택 → 즉시 일정 자동 생성 + PDF
-- 작성일: 2026-01-13
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. itineraries 테이블 (생성된 일정)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS itineraries (
  id SERIAL PRIMARY KEY,
  itinerary_id VARCHAR(50) UNIQUE NOT NULL,

  -- 연결 정보
  quote_id VARCHAR(50),
  region VARCHAR(20) DEFAULT 'yeosu',

  -- 기본 정보
  pax INTEGER DEFAULT 2,
  stay_type VARCHAR(10) DEFAULT 'day',  -- day, 1n2d, 2n3d, 3n4d
  transport VARCHAR(20) DEFAULT 'car',   -- car, public, rental

  -- 취향 설정 (JSON)
  style_preferences JSONB DEFAULT '{"healing":20,"foodie":30,"activity":20,"photo":20,"budget":10}',
  must_visit JSONB DEFAULT '[]',
  avoid JSONB DEFAULT '[]',
  tempo VARCHAR(20) DEFAULT 'normal',   -- relaxed, normal, packed

  -- 생성된 일정 (JSON)
  daily_plans JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '{}',

  -- PDF
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,

  -- 상태
  status VARCHAR(20) DEFAULT 'generated',  -- generated, edited, expired
  version INTEGER DEFAULT 1,
  edit_count INTEGER DEFAULT 0,

  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. itinerary_events 테이블 (이벤트 로깅)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS itinerary_events (
  id SERIAL PRIMARY KEY,
  itinerary_id VARCHAR(50),
  event_name VARCHAR(50) NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. 인덱스
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_itineraries_id ON itineraries(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_quote ON itineraries(quote_id) WHERE quote_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_itineraries_region ON itineraries(region);
CREATE INDEX IF NOT EXISTS idx_itineraries_created ON itineraries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_itinerary_events_id ON itinerary_events(itinerary_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_events_name ON itinerary_events(event_name);
CREATE INDEX IF NOT EXISTS idx_itinerary_events_created ON itinerary_events(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ 일정 생성 테이블 마이그레이션 완료!';
    RAISE NOTICE '   - itineraries 테이블 생성';
    RAISE NOTICE '   - itinerary_events 테이블 생성';
    RAISE NOTICE '   - 인덱스 7개 생성';
END $$;
