-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 018: WU 세션 테이블 (DB SSOT)
-- Q15 확정: DB가 세션 상태의 진실. 인메모리는 원문 임시 보관만.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS wu_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL
        REFERENCES sowon_profiles(id) ON DELETE CASCADE,

    wu_type VARCHAR(30) NOT NULL,

    -- 상태 (DB SSOT)
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    -- active:    진행 중
    -- paused:    RED 감지로 일시 중단
    -- completed: 정상 완료
    -- abandoned: 이탈
    -- expired:   TTL 만료

    -- 진행 추적
    current_question_idx INTEGER DEFAULT 0,
    answer_count INTEGER DEFAULT 0,

    -- 시간
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    completed_at TIMESTAMPTZ,

    -- 공유 (Q7: share_id만 생성, OG는 별도)
    share_id VARCHAR(32) UNIQUE,

    -- 안전 (Q12)
    risk_level VARCHAR(10) DEFAULT 'GREEN',

    CONSTRAINT chk_wu_session_status
        CHECK (status IN ('active', 'paused', 'completed', 'abandoned', 'expired'))
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wu_sessions_profile
    ON wu_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_wu_sessions_status
    ON wu_sessions(status);
CREATE INDEX IF NOT EXISTS idx_wu_sessions_expires
    ON wu_sessions(expires_at)
    WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_wu_sessions_share
    ON wu_sessions(share_id)
    WHERE share_id IS NOT NULL;

-- 만료 세션 자동 정리 함수
CREATE OR REPLACE FUNCTION expire_wu_sessions()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE wu_sessions
    SET status = 'expired'
    WHERE status = 'active'
      AND expires_at < NOW();

    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 018 완료: wu_sessions 테이블 (DB SSOT)';
END $$;
