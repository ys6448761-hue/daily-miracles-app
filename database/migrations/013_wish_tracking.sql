-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 013: Wish Tracking System
-- 소원 추적 시스템 - 바이럴 루프 & 데이터 복리를 위한 핵심 테이블
--
-- @version 1.0
-- @purpose 하키스틱 성장 메커니즘 #2: 데이터 복리
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- wish_entries: 소원 등록 (기존 파일 기반 → DB 이관용)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wish_entries (
    id SERIAL PRIMARY KEY,

    -- 기본 정보
    name VARCHAR(100),
    phone VARCHAR(20),                   -- 정규화된 전화번호
    phone_hash VARCHAR(64),              -- SHA256 해시 (익명 분석용)

    -- 소원 내용
    wish_text TEXT NOT NULL,
    wish_category VARCHAR(50),           -- AI 분류: health, career, relationship, money, self, etc.

    -- 분석 결과
    miracle_index INTEGER,               -- 기적지수 (50-100)
    traffic_light VARCHAR(10),           -- RED/YELLOW/GREEN
    energy_type VARCHAR(20),             -- 에너지 유형
    gem_type VARCHAR(20),                -- 보석 유형

    -- 옵션
    want_message BOOLEAN DEFAULT FALSE,  -- 7일 메시지 수신 동의
    privacy_agreed BOOLEAN DEFAULT FALSE,
    marketing_agreed BOOLEAN DEFAULT FALSE,

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 추적용 토큰 (익명 추적 링크용)
    tracking_token VARCHAR(32) UNIQUE,

    -- 인덱스용
    CONSTRAINT valid_traffic_light CHECK (traffic_light IN ('RED', 'YELLOW', 'GREEN'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wish_entries_phone_hash ON wish_entries(phone_hash);
CREATE INDEX IF NOT EXISTS idx_wish_entries_created ON wish_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_wish_entries_category ON wish_entries(wish_category);
CREATE INDEX IF NOT EXISTS idx_wish_entries_tracking ON wish_entries(tracking_token);

-- ───────────────────────────────────────────────────────────────────────────
-- wish_tracking_requests: 추적 질문 발송 기록
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wish_tracking_requests (
    id SERIAL PRIMARY KEY,

    -- 연결
    wish_entry_id INTEGER REFERENCES wish_entries(id) ON DELETE SET NULL,
    phone_hash VARCHAR(64),              -- wish_entry 삭제 시에도 통계 유지

    -- 추적 단계
    tracking_stage VARCHAR(20) NOT NULL, -- day7, day30, day90

    -- 발송 정보
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    message_type VARCHAR(20) DEFAULT 'alimtalk', -- alimtalk, sms
    message_id VARCHAR(100),              -- 발송 ID (재발송 방지)

    -- 상태
    status VARCHAR(20) DEFAULT 'sent',    -- sent, opened, responded, expired
    opened_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,

    -- 응답 URL 토큰
    response_token VARCHAR(32) UNIQUE,
    token_expires_at TIMESTAMP WITH TIME ZONE,

    -- 제약
    CONSTRAINT valid_tracking_stage CHECK (tracking_stage IN ('day7', 'day30', 'day90')),
    CONSTRAINT valid_status CHECK (status IN ('sent', 'opened', 'responded', 'expired'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tracking_requests_wish ON wish_tracking_requests(wish_entry_id);
CREATE INDEX IF NOT EXISTS idx_tracking_requests_stage ON wish_tracking_requests(tracking_stage);
CREATE INDEX IF NOT EXISTS idx_tracking_requests_token ON wish_tracking_requests(response_token);
CREATE INDEX IF NOT EXISTS idx_tracking_requests_status ON wish_tracking_requests(status);

-- ───────────────────────────────────────────────────────────────────────────
-- wish_tracking_responses: 추적 질문 응답
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wish_tracking_responses (
    id SERIAL PRIMARY KEY,

    -- 연결
    tracking_request_id INTEGER REFERENCES wish_tracking_requests(id) ON DELETE CASCADE,
    wish_entry_id INTEGER REFERENCES wish_entries(id) ON DELETE SET NULL,

    -- 응답 내용
    realized_status VARCHAR(20) NOT NULL, -- realized, partial, not_yet, gave_up
    realized_percent INTEGER,             -- 0-100 (partial인 경우)

    -- 추가 질문 응답
    what_helped TEXT,                     -- "무엇이 도움이 됐나요?"
    what_blocked TEXT,                    -- "어떤 장애물이 있었나요?"
    would_recommend BOOLEAN,              -- "친구에게 추천하시겠어요?"

    -- 감정 평가
    satisfaction INTEGER,                 -- 1-5 만족도

    -- 선택적 피드백
    feedback TEXT,                        -- 자유 피드백

    -- 메타
    responded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- 제약
    CONSTRAINT valid_realized_status CHECK (realized_status IN ('realized', 'partial', 'not_yet', 'gave_up')),
    CONSTRAINT valid_satisfaction CHECK (satisfaction IS NULL OR (satisfaction >= 1 AND satisfaction <= 5))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_tracking_responses_request ON wish_tracking_responses(tracking_request_id);
CREATE INDEX IF NOT EXISTS idx_tracking_responses_status ON wish_tracking_responses(realized_status);
CREATE INDEX IF NOT EXISTS idx_tracking_responses_date ON wish_tracking_responses(responded_at);

-- ───────────────────────────────────────────────────────────────────────────
-- wish_success_patterns: 성공 패턴 분석 (집계 테이블)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wish_success_patterns (
    id SERIAL PRIMARY KEY,

    -- 분류 기준
    wish_category VARCHAR(50) NOT NULL,
    miracle_index_range VARCHAR(20),     -- '50-59', '60-69', '70-79', '80-89', '90-100'
    tracking_stage VARCHAR(20) NOT NULL,

    -- 집계 데이터
    total_count INTEGER DEFAULT 0,
    realized_count INTEGER DEFAULT 0,
    partial_count INTEGER DEFAULT 0,
    not_yet_count INTEGER DEFAULT 0,
    gave_up_count INTEGER DEFAULT 0,

    -- 계산된 성공률
    success_rate DECIMAL(5,2),            -- (realized + partial*0.5) / total * 100

    -- 갱신 시점
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 유니크
    CONSTRAINT unique_pattern UNIQUE (wish_category, miracle_index_range, tracking_stage)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_success_patterns_category ON wish_success_patterns(wish_category);

-- ───────────────────────────────────────────────────────────────────────────
-- 뷰: 실시간 성공률 통계
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_wish_success_stats AS
SELECT
    we.wish_category,
    wtr.tracking_stage,
    COUNT(*) as total_responses,
    COUNT(*) FILTER (WHERE wtr2.realized_status = 'realized') as realized_count,
    COUNT(*) FILTER (WHERE wtr2.realized_status = 'partial') as partial_count,
    COUNT(*) FILTER (WHERE wtr2.realized_status = 'not_yet') as not_yet_count,
    COUNT(*) FILTER (WHERE wtr2.realized_status = 'gave_up') as gave_up_count,
    ROUND(
        (COUNT(*) FILTER (WHERE wtr2.realized_status = 'realized') +
         COUNT(*) FILTER (WHERE wtr2.realized_status = 'partial') * 0.5
        ) * 100.0 / NULLIF(COUNT(*), 0),
        1
    ) as success_rate
FROM wish_entries we
JOIN wish_tracking_requests wtr ON we.id = wtr.wish_entry_id
JOIN wish_tracking_responses wtr2 ON wtr.id = wtr2.tracking_request_id
GROUP BY we.wish_category, wtr.tracking_stage;

-- ───────────────────────────────────────────────────────────────────────────
-- 뷰: 기적지수별 성공률
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_miracle_index_success AS
SELECT
    CASE
        WHEN we.miracle_index BETWEEN 50 AND 59 THEN '50-59'
        WHEN we.miracle_index BETWEEN 60 AND 69 THEN '60-69'
        WHEN we.miracle_index BETWEEN 70 AND 79 THEN '70-79'
        WHEN we.miracle_index BETWEEN 80 AND 89 THEN '80-89'
        WHEN we.miracle_index BETWEEN 90 AND 100 THEN '90-100'
    END as index_range,
    COUNT(*) as total,
    ROUND(AVG(CASE
        WHEN wtr2.realized_status = 'realized' THEN 100
        WHEN wtr2.realized_status = 'partial' THEN wtr2.realized_percent
        ELSE 0
    END), 1) as avg_realization
FROM wish_entries we
JOIN wish_tracking_requests wtr ON we.id = wtr.wish_entry_id
JOIN wish_tracking_responses wtr2 ON wtr.id = wtr2.tracking_request_id
WHERE we.miracle_index IS NOT NULL
GROUP BY index_range
ORDER BY index_range;

-- ───────────────────────────────────────────────────────────────────────────
-- 함수: 추적 토큰 생성
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generate_tracking_token()
RETURNS VARCHAR(32) AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────────────────────
-- 트리거: wish_entry 생성 시 자동 토큰 생성
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_tracking_token()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tracking_token IS NULL THEN
        NEW.tracking_token := generate_tracking_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wish_tracking_token ON wish_entries;
CREATE TRIGGER trg_wish_tracking_token
    BEFORE INSERT ON wish_entries
    FOR EACH ROW
    EXECUTE FUNCTION set_tracking_token();

-- ───────────────────────────────────────────────────────────────────────────
-- 완료 메시지
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 013 완료: 소원 추적 시스템 테이블 생성';
    RAISE NOTICE '   - wish_entries: 소원 등록';
    RAISE NOTICE '   - wish_tracking_requests: 추적 질문 발송';
    RAISE NOTICE '   - wish_tracking_responses: 응답 기록';
    RAISE NOTICE '   - wish_success_patterns: 성공 패턴 집계';
    RAISE NOTICE '   - v_wish_success_stats: 실시간 성공률 뷰';
    RAISE NOTICE '   - v_miracle_index_success: 기적지수별 성공률 뷰';
END $$;
