-- ═══════════════════════════════════════════════════════════
-- Daily Miracles MVP - Render PostgreSQL Migration
-- ═══════════════════════════════════════════════════════════
-- 실행 방법:
-- 1. Render Dashboard → PostgreSQL 데이터베이스 생성
-- 2. psql 명령으로 연결: psql <DATABASE_URL>
-- 3. 이 파일 실행: \i render_migration.sql
-- ═══════════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ───────────────────────────────────────────────────────────
-- Table: story_results (분석 결과 저장)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS story_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 메타 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 사용자 입력
    user_input JSONB NOT NULL,

    -- 분석 결과 (전체 JSON)
    analysis_data JSONB NOT NULL,

    -- 빠른 조회를 위한 필드
    user_name VARCHAR(255),
    miracle_index INTEGER,
    has_relationship BOOLEAN DEFAULT FALSE,

    -- 실행 정보
    execution_time INTEGER, -- milliseconds
    workflow_id VARCHAR(255),

    -- 인덱스 필드
    is_deleted BOOLEAN DEFAULT FALSE
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_story_results_created_at ON story_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_results_user_name ON story_results(user_name);
CREATE INDEX IF NOT EXISTS idx_story_results_workflow_id ON story_results(workflow_id);

-- ───────────────────────────────────────────────────────────
-- Table: feedbacks (베타 테스터 피드백)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 만족도 점수 (1-5)
    satisfaction INTEGER CHECK (satisfaction >= 1 AND satisfaction <= 5),

    -- 도움이 된 부분 (배열)
    helpful TEXT[],

    -- 개선 제안
    improvements TEXT,

    -- 정확도 점수 (1-5)
    accuracy INTEGER CHECK (accuracy >= 1 AND accuracy <= 5),

    -- 추가 제안
    suggestions TEXT,

    -- 추천 의향 (1-10)
    recommendation INTEGER CHECK (recommendation >= 1 AND recommendation <= 10),

    -- 연락처 (선택)
    contact VARCHAR(255),

    -- User-Agent
    user_agent TEXT,

    -- 연관된 분석 결과 (선택)
    story_result_id UUID REFERENCES story_results(id) ON DELETE SET NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_feedbacks_created_at ON feedbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedbacks_satisfaction ON feedbacks(satisfaction);
CREATE INDEX IF NOT EXISTS idx_feedbacks_story_result_id ON feedbacks(story_result_id);

-- ───────────────────────────────────────────────────────────
-- Table: api_logs (API 호출 로그)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 요청 정보
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    status_code INTEGER,

    -- 요청/응답 데이터 (선택)
    request_body JSONB,
    response_body JSONB,

    -- 성능 메트릭
    response_time INTEGER, -- milliseconds

    -- 클라이언트 정보
    ip_address INET,
    user_agent TEXT,
    referer TEXT,

    -- 에러 정보
    error_message TEXT,
    error_stack TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_path ON api_logs(path);
CREATE INDEX IF NOT EXISTS idx_api_logs_status_code ON api_logs(status_code);

-- ───────────────────────────────────────────────────────────
-- Table: sessions (사용자 세션)
-- ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,

    -- 세션 데이터
    session_data JSONB,

    -- 클라이언트 정보
    ip_address INET,
    user_agent TEXT
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

-- ───────────────────────────────────────────────────────────
-- Views: 통계 및 분석용 뷰
-- ───────────────────────────────────────────────────────────

-- 피드백 통계 뷰
CREATE OR REPLACE VIEW feedback_stats AS
SELECT
    COUNT(*) AS total_feedbacks,
    AVG(satisfaction) AS avg_satisfaction,
    AVG(accuracy) AS avg_accuracy,
    AVG(recommendation) AS avg_recommendation,
    COUNT(CASE WHEN satisfaction >= 4 THEN 1 END) AS positive_feedback_count,
    COUNT(CASE WHEN satisfaction <= 2 THEN 1 END) AS negative_feedback_count
FROM feedbacks;

-- 일별 분석 결과 통계
CREATE OR REPLACE VIEW daily_analysis_stats AS
SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_analyses,
    COUNT(CASE WHEN has_relationship THEN 1 END) AS relationship_analyses,
    AVG(miracle_index) AS avg_miracle_index,
    AVG(execution_time) AS avg_execution_time
FROM story_results
WHERE NOT is_deleted
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- API 성능 통계
CREATE OR REPLACE VIEW api_performance_stats AS
SELECT
    path,
    COUNT(*) AS request_count,
    AVG(response_time) AS avg_response_time,
    MAX(response_time) AS max_response_time,
    MIN(response_time) AS min_response_time,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) AS success_count,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) AS error_count
FROM api_logs
GROUP BY path
ORDER BY request_count DESC;

-- ───────────────────────────────────────────────────────────
-- Functions: 유틸리티 함수
-- ───────────────────────────────────────────────────────────

-- 최신 분석 결과 조회 함수
CREATE OR REPLACE FUNCTION get_latest_story_result()
RETURNS TABLE (
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    user_input JSONB,
    analysis_data JSONB,
    execution_time INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sr.id,
        sr.created_at,
        sr.user_input,
        sr.analysis_data,
        sr.execution_time
    FROM story_results sr
    WHERE NOT sr.is_deleted
    ORDER BY sr.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 오래된 세션 정리 함수
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions
    WHERE expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 오래된 API 로그 정리 함수 (30일 이상)
CREATE OR REPLACE FUNCTION cleanup_old_api_logs(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_logs
    WHERE created_at < CURRENT_TIMESTAMP - (days_to_keep || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ───────────────────────────────────────────────────────────
-- Triggers: 자동 업데이트
-- ───────────────────────────────────────────────────────────

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- story_results updated_at 트리거
CREATE TRIGGER update_story_results_updated_at
    BEFORE UPDATE ON story_results
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- sessions updated_at 트리거
CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ───────────────────────────────────────────────────────────
-- Initial Data: 테스트 데이터 (선택)
-- ───────────────────────────────────────────────────────────

-- 주석 해제하여 테스트 데이터 삽입
/*
INSERT INTO story_results (user_input, analysis_data, user_name, miracle_index, execution_time)
VALUES (
    '{"wish": "관계를 개선하고 싶어요"}'::JSONB,
    '{"userProfile": {"name": "테스트", "miracleIndex": 75}}'::JSONB,
    '테스트',
    75,
    1500
);
*/

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════

-- 마이그레이션 완료 확인
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Tables created: story_results, feedbacks, api_logs, sessions';
    RAISE NOTICE '   - Views created: feedback_stats, daily_analysis_stats, api_performance_stats';
    RAISE NOTICE '   - Functions created: get_latest_story_result, cleanup_expired_sessions, cleanup_old_api_logs';
    RAISE NOTICE '   - Triggers created: auto-update updated_at columns';
END $$;
