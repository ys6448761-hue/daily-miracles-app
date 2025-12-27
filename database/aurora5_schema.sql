-- ═══════════════════════════════════════════════════════════
-- Aurora5 자동화 엔진 - DB 스키마
-- Version: 1.0
-- Created: 2025-12-21
-- ═══════════════════════════════════════════════════════════

-- 1. MVP_Inbox: 인입 데이터 (Wix 폼 등)
CREATE TABLE IF NOT EXISTS mvp_inbox (
    id              SERIAL PRIMARY KEY,
    source          VARCHAR(50) NOT NULL DEFAULT 'wix',      -- wix, api, manual
    source_id       VARCHAR(100),                            -- 원본 시스템 ID
    type            VARCHAR(50) NOT NULL DEFAULT 'wish',     -- wish, problem, inquiry

    -- 원본 데이터
    payload         JSONB NOT NULL,                          -- 원본 JSON
    payload_norm    JSONB,                                   -- 정규화된 JSON

    -- 상태 관리
    status          VARCHAR(20) NOT NULL DEFAULT 'NEW',      -- NEW, PROCESSING, DONE, FAILED
    error_reason    TEXT,                                    -- 실패 사유
    retry_count     INTEGER DEFAULT 0,                       -- 재시도 횟수 (최대 2)

    -- 타임스탬프
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_inbox_status ON mvp_inbox(status);
CREATE INDEX IF NOT EXISTS idx_inbox_created ON mvp_inbox(created_at);
CREATE INDEX IF NOT EXISTS idx_inbox_source ON mvp_inbox(source, source_id);


-- 2. MVP_Results: 분석 결과 + 매직 링크
CREATE TABLE IF NOT EXISTS mvp_results (
    id              SERIAL PRIMARY KEY,
    inbox_id        INTEGER NOT NULL REFERENCES mvp_inbox(id),

    -- 매직 링크
    token           VARCHAR(64) UNIQUE NOT NULL,             -- URL 토큰
    expires_at      TIMESTAMP WITH TIME ZONE,                -- 만료 시간 (NULL = 무제한)

    -- 분석 결과
    analysis_json   JSONB NOT NULL,                          -- Claude 분석 JSON
    analysis_text   TEXT,                                    -- 요약 텍스트

    -- 발송 상태
    delivered_to    VARCHAR(100),                            -- 발송 대상 (phone/email)
    delivered_at    TIMESTAMP WITH TIME ZONE,                -- 발송 시간
    delivery_status VARCHAR(20) DEFAULT 'PENDING',           -- PENDING, SENT, FAILED
    delivery_error  TEXT,                                    -- 발송 실패 사유

    -- 타임스탬프
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_results_token ON mvp_results(token);
CREATE INDEX IF NOT EXISTS idx_results_inbox ON mvp_results(inbox_id);
CREATE INDEX IF NOT EXISTS idx_results_delivery ON mvp_results(delivery_status);


-- 3. Trials: 7일 여정 관리
CREATE TABLE IF NOT EXISTS trials (
    id              SERIAL PRIMARY KEY,
    inbox_id        INTEGER REFERENCES mvp_inbox(id),
    token           VARCHAR(64) NOT NULL,                    -- 결과 페이지 토큰
    phone           VARCHAR(20),                             -- 발송 대상 전화번호

    -- 시간대 설정
    timezone        VARCHAR(50) DEFAULT 'Asia/Seoul',

    -- 여정 상태
    active          BOOLEAN DEFAULT TRUE,                    -- 활성 여부
    start_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 시작일
    last_day_sent   INTEGER DEFAULT 0,                       -- 마지막 발송 Day (0~7)
    next_send_at    TIMESTAMP WITH TIME ZONE,                -- 다음 발송 예정 시간

    -- 추천 코드
    ref_code        VARCHAR(20) UNIQUE,                      -- 추천인 코드 (REF-XXXXX)
    referred_by     VARCHAR(20),                             -- 누구에게 추천받았는지

    -- 타임스탬프
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_trials_active ON trials(active, next_send_at);
CREATE INDEX IF NOT EXISTS idx_trials_token ON trials(token);
CREATE INDEX IF NOT EXISTS idx_trials_phone ON trials(phone);
CREATE INDEX IF NOT EXISTS idx_trials_ref ON trials(ref_code);


-- 4. SendLog: 발송 이력
CREATE TABLE IF NOT EXISTS send_log (
    id              SERIAL PRIMARY KEY,
    trial_id        INTEGER REFERENCES trials(id),
    day             INTEGER NOT NULL,                        -- 0=결과, 1~7=Day메시지

    -- 메시지 정보
    template_code   VARCHAR(50) NOT NULL,                    -- T_RESULT, T_DAY_REMIND, T_REF
    to_address      VARCHAR(100) NOT NULL,                   -- 발송 대상

    -- 발송 상태
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING, SENT, FAILED, SKIPPED
    provider        VARCHAR(50) DEFAULT 'solapi',            -- solapi, sendgrid, manual
    provider_msg_id VARCHAR(100),                            -- 외부 시스템 메시지 ID
    error           TEXT,                                    -- 실패 사유

    -- 타임스탬프
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_sendlog_trial ON send_log(trial_id);
CREATE INDEX IF NOT EXISTS idx_sendlog_status ON send_log(status);
CREATE INDEX IF NOT EXISTS idx_sendlog_day ON send_log(day);
CREATE INDEX IF NOT EXISTS idx_sendlog_created ON send_log(created_at);


-- ═══════════════════════════════════════════════════════════
-- 뷰: 운영 대시보드용
-- ═══════════════════════════════════════════════════════════

-- 오늘 발송 예정 목록
CREATE OR REPLACE VIEW v_today_queue AS
SELECT
    t.id as trial_id,
    t.phone,
    t.last_day_sent + 1 as next_day,
    t.next_send_at,
    r.token,
    i.payload_norm->>'nickname' as nickname,
    i.payload_norm->>'wish' as wish_summary
FROM trials t
JOIN mvp_results r ON r.token = t.token
JOIN mvp_inbox i ON i.id = t.inbox_id
WHERE t.active = TRUE
  AND t.last_day_sent < 7
  AND t.next_send_at <= NOW() + INTERVAL '1 day'
ORDER BY t.next_send_at;


-- 발송 현황 통계
CREATE OR REPLACE VIEW v_send_stats AS
SELECT
    DATE(created_at) as send_date,
    day,
    status,
    COUNT(*) as count
FROM send_log
GROUP BY DATE(created_at), day, status
ORDER BY send_date DESC, day;


-- ═══════════════════════════════════════════════════════════
-- 함수: updated_at 자동 갱신
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_mvp_inbox_updated_at ON mvp_inbox;
CREATE TRIGGER update_mvp_inbox_updated_at
    BEFORE UPDATE ON mvp_inbox
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mvp_results_updated_at ON mvp_results;
CREATE TRIGGER update_mvp_results_updated_at
    BEFORE UPDATE ON mvp_results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trials_updated_at ON trials;
CREATE TRIGGER update_trials_updated_at
    BEFORE UPDATE ON trials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════
-- 완료!
-- ═══════════════════════════════════════════════════════════
