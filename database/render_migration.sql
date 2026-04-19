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
-- DreamTown Journey Engine Tables (125~130)
-- ═══════════════════════════════════════════════════════════

-- 125: Life Spot
CREATE TABLE IF NOT EXISTS life_spots (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL,
  spot_name       VARCHAR(100) NOT NULL,
  spot_type       VARCHAR(30)  NOT NULL,
  is_favorite     BOOLEAN      DEFAULT false,
  emotion_pattern JSONB        DEFAULT '[]'::jsonb,
  visit_count     INT          DEFAULT 0,
  last_visited_at TIMESTAMP    NULL,
  created_at      TIMESTAMP    DEFAULT NOW(),
  updated_at      TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_life_spots_user_id ON life_spots(user_id);
CREATE INDEX IF NOT EXISTS idx_life_spots_type    ON life_spots(spot_type);

CREATE TABLE IF NOT EXISTS life_spot_logs (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL,
  spot_id         UUID         NOT NULL REFERENCES life_spots(id) ON DELETE CASCADE,
  state           VARCHAR(30)  NOT NULL,
  scene           TEXT         NOT NULL,
  action          TEXT         NOT NULL,
  direction       TEXT         NOT NULL,
  emotion_signal  VARCHAR(50)  NOT NULL,
  help_tag        VARCHAR(30)  NOT NULL,
  growth_sentence VARCHAR(100) NOT NULL,
  question_type   VARCHAR(30)  NULL,
  question_answer VARCHAR(100) NULL,
  source_type     VARCHAR(20)  NOT NULL DEFAULT 'daily',
  created_at      TIMESTAMP    DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_life_spot_logs_user    ON life_spot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_life_spot_logs_spot    ON life_spot_logs(spot_id);
CREATE INDEX IF NOT EXISTS idx_life_spot_logs_created ON life_spot_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS user_preference_profiles (
  user_id                UUID        PRIMARY KEY,
  question_preference    VARCHAR(20) DEFAULT 'auto',
  question_response_rate NUMERIC(5,2) DEFAULT 0,
  action_response_rate   NUMERIC(5,2) DEFAULT 0,
  dominant_spot_type     VARCHAR(30)  NULL,
  updated_at             TIMESTAMP    DEFAULT NOW()
);

-- 126: Star Trajectory
CREATE TABLE IF NOT EXISTS star_daily_logs (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID      NOT NULL,
  star_id         UUID      NOT NULL,
  log_date        DATE      NOT NULL DEFAULT CURRENT_DATE,
  state           VARCHAR(30),
  emotion_signal  VARCHAR(50),
  help_tag        VARCHAR(30),
  growth_sentence VARCHAR(100),
  life_spot_id    UUID      NULL,
  source_log_id   UUID      NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_star_daily_user ON star_daily_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_star_daily_star ON star_daily_logs(star_id);
CREATE INDEX IF NOT EXISTS idx_star_daily_date ON star_daily_logs(log_date DESC);

CREATE TABLE IF NOT EXISTS star_travel_logs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL,
  star_id         UUID        NOT NULL,
  place_type      VARCHAR(30),
  place_name      VARCHAR(100),
  visited_at      TIMESTAMP   DEFAULT NOW(),
  state           VARCHAR(30),
  emotion_signal  VARCHAR(50),
  help_tag        VARCHAR(30),
  growth_sentence VARCHAR(100),
  created_at      TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_star_travel_user ON star_travel_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_star_travel_star ON star_travel_logs(star_id);

CREATE TABLE IF NOT EXISTS star_timeline_summary (
  star_id            UUID        PRIMARY KEY,
  current_phase      VARCHAR(30) DEFAULT '시작',
  last_7d_pattern    JSONB       DEFAULT '{}'::jsonb,
  last_30d_pattern   JSONB       DEFAULT '{}'::jsonb,
  dominant_state     VARCHAR(30),
  dominant_help_tag  VARCHAR(30),
  growth_score       INT         DEFAULT 0,
  updated_at         TIMESTAMP   DEFAULT NOW()
);

-- 127: User Events
CREATE TABLE IF NOT EXISTS user_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID,
  event_type VARCHAR(50) NOT NULL,
  metadata   JSONB       DEFAULT '{}'::jsonb,
  created_at TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_events_user    ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type    ON user_events(event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created ON user_events(created_at DESC);

-- 128: Star Care Schedule
CREATE TABLE IF NOT EXISTS star_care_schedule (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  star_id      UUID        NOT NULL,
  phone_number VARCHAR(20) NULL,
  day          INT         NOT NULL,
  scheduled_at TIMESTAMP   NOT NULL,
  executed     BOOLEAN     DEFAULT FALSE,
  sent_at      TIMESTAMP   NULL,
  send_type    VARCHAR(20) NULL,
  created_at   TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_care_user    ON star_care_schedule(user_id);
CREATE INDEX IF NOT EXISTS idx_care_star    ON star_care_schedule(star_id);
CREATE INDEX IF NOT EXISTS idx_care_pending ON star_care_schedule(scheduled_at, executed) WHERE executed = FALSE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_care_star_day ON star_care_schedule(star_id, day);

-- 129: User Plan Status
CREATE TABLE IF NOT EXISTS user_plan_status (
  user_id         UUID        PRIMARY KEY,
  plan_type       VARCHAR(20) DEFAULT 'free',
  plan_started_at TIMESTAMP   NULL,
  trial_ended_at  TIMESTAMP   NULL,
  created_at      TIMESTAMP   DEFAULT NOW(),
  updated_at      TIMESTAMP   DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_plan_type ON user_plan_status(plan_type);

-- 130: DreamTown Payments
CREATE TABLE IF NOT EXISTS dt_payments (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL,
  plan_type    VARCHAR(20),
  provider     VARCHAR(20) DEFAULT 'nicepay',
  order_id     VARCHAR(100) UNIQUE,
  tid          VARCHAR(100),
  amount       INT,
  status       VARCHAR(20) DEFAULT 'ready',
  requested_at TIMESTAMP   DEFAULT NOW(),
  paid_at      TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_dt_payments_user_id  ON dt_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_dt_payments_order_id ON dt_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_dt_payments_status   ON dt_payments(status);

-- ═══════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '   - Base tables: story_results, feedbacks, api_logs, sessions';
    RAISE NOTICE '   - DreamTown Journey: life_spots, star_daily_logs, user_events';
    RAISE NOTICE '   - DreamTown Care: star_care_schedule, user_plan_status, payments';
END $$;
