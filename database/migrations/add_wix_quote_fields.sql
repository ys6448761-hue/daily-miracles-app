-- ═══════════════════════════════════════════════════════════════════════════
-- Wix 자유여행 견적 필드 추가 마이그레이션
-- ═══════════════════════════════════════════════════════════════════════════
-- 작성일: 2026-01-06
-- 목적: Wix 폼 → 자유여행 견적 자동화 연동
-- ═══════════════════════════════════════════════════════════════════════════

-- 기존 quotes 테이블에 Wix 자유여행 필드 추가

-- 1. 여행 기간 (기존 travel_date → trip_start/trip_end)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS trip_start DATE;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS trip_end DATE;

-- 2. 출발 도시
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS departure_city VARCHAR(50);

-- 3. 여행 스타일 태그 (healing, food, activity, mixed)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS style_tags TEXT[];

-- 4. 예산 범위 (문자열)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS budget_range VARCHAR(50);

-- 5. 고객 요청 메모 (기존 memo → notes도 추가)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS notes TEXT;

-- 6. 소스 (유입 경로)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'direct';

-- 7. 환경 태그 (prod/test)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS env VARCHAR(10) DEFAULT 'prod';

-- 8. 숙소 희망 등급
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS accommodation_grade VARCHAR(50);

-- 9. 꼭 가고 싶은 곳
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS must_visit TEXT;

-- 10. 유입 경로 상세
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS referral_source VARCHAR(50);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_quotes_source ON quotes(source);
CREATE INDEX IF NOT EXISTS idx_quotes_env ON quotes(env);
CREATE INDEX IF NOT EXISTS idx_quotes_trip_start ON quotes(trip_start);

-- 상태값 확장 (lead → quoted → deposit_paid → confirmed → completed)
-- status 필드는 이미 VARCHAR(20)으로 유연함

COMMENT ON COLUMN quotes.trip_start IS '여행 시작일';
COMMENT ON COLUMN quotes.trip_end IS '여행 종료일';
COMMENT ON COLUMN quotes.departure_city IS '출발 도시';
COMMENT ON COLUMN quotes.style_tags IS '여행 스타일 태그 배열';
COMMENT ON COLUMN quotes.budget_range IS '예산 범위';
COMMENT ON COLUMN quotes.notes IS '고객 요청/특이사항';
COMMENT ON COLUMN quotes.source IS '유입 소스 (wix_form, direct, kakao 등)';
COMMENT ON COLUMN quotes.env IS '환경 (prod/test)';
