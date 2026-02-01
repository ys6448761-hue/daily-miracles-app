-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 006: Daily Checks Table
-- 일일 체크 (출석/실행/기록) 기록 테이블
--
-- @version 1.0
-- @spec Aurora5 Code 작업지시서 v2.6 - Gap 해소
-- ═══════════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────────────
-- daily_checks: 일일 체크 기록
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_checks (
    id SERIAL PRIMARY KEY,

    -- 주체 (trial/user)
    subject_type VARCHAR(20) NOT NULL DEFAULT 'trial',
    subject_id VARCHAR(100) NOT NULL,

    -- 체크 정보
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_type VARCHAR(20) NOT NULL,  -- checkin, action, log
    checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 포인트 적립
    points_earned INTEGER DEFAULT 0,

    -- 메타데이터 (action_description, log_content 등)
    metadata JSONB DEFAULT '{}',

    -- 제약 조건
    CONSTRAINT valid_check_type CHECK (check_type IN ('checkin', 'action', 'log')),

    -- 유니크: 같은 날 같은 유형은 1회만
    CONSTRAINT unique_daily_check UNIQUE (subject_type, subject_id, check_date, check_type)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_daily_checks_subject
    ON daily_checks(subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_daily_checks_date
    ON daily_checks(check_date);

CREATE INDEX IF NOT EXISTS idx_daily_checks_type
    ON daily_checks(check_type);

-- ───────────────────────────────────────────────────────────────────────────
-- 연속 출석 (streak) 계산용 뷰 (Optional)
-- ───────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_attendance_streak AS
WITH daily_attendance AS (
    SELECT
        subject_type,
        subject_id,
        check_date,
        ROW_NUMBER() OVER (
            PARTITION BY subject_type, subject_id
            ORDER BY check_date DESC
        ) as rn,
        check_date - (ROW_NUMBER() OVER (
            PARTITION BY subject_type, subject_id
            ORDER BY check_date DESC
        ))::INTEGER as streak_group
    FROM daily_checks
    WHERE check_type = 'checkin'
)
SELECT
    subject_type,
    subject_id,
    COUNT(*) as current_streak,
    MIN(check_date) as streak_start,
    MAX(check_date) as streak_end
FROM daily_attendance
WHERE streak_group = (
    SELECT streak_group
    FROM daily_attendance da2
    WHERE da2.subject_type = daily_attendance.subject_type
      AND da2.subject_id = daily_attendance.subject_id
      AND da2.check_date = CURRENT_DATE
    LIMIT 1
)
GROUP BY subject_type, subject_id, streak_group;

-- ───────────────────────────────────────────────────────────────────────────
-- 완료 메시지
-- ───────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 006 완료: daily_checks 테이블 생성';
END $$;
