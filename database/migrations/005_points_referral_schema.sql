-- ═══════════════════════════════════════════════════════════════════════════
-- Points / Referral / Preview System Schema
-- Migration: 005_points_referral_schema.sql
-- Spec: Aurora5 Code 작업지시서 v2.6 (P0 Only)
-- Created: 2026-02-01
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. point_ledger (포인트 원장 - Append-only, SSOT)
-- ═══════════════════════════════════════════════════════════════════════════
-- 핵심 정책:
-- - 일일 상한: 100P (출석 50P + 실행 30P + 기록 20P)
-- - 만료: 생성일로부터 90일
-- - 잔액 = 원장 합산 (캐시는 보조)

CREATE TABLE IF NOT EXISTS point_ledger (
    id              SERIAL PRIMARY KEY,

    -- 대상 식별 (trial 또는 user)
    subject_type    VARCHAR(20) NOT NULL,      -- 'trial' | 'user'
    subject_id      VARCHAR(255) NOT NULL,     -- trial.id 또는 users.id

    -- 포인트 정보
    event_type      VARCHAR(50) NOT NULL,
    -- POINT_EARN_CHECKIN, POINT_EARN_ACTION, POINT_EARN_LOG
    -- POINT_EARN_REF_INVITEE, POINT_EARN_REF_INVITER
    -- POINT_SPEND_PREVIEW
    -- POINT_EXPIRE, POINT_REVOKE

    amount          INTEGER NOT NULL,          -- +적립 / -사용 / -만료
    balance_after   INTEGER NOT NULL,          -- 변동 후 잔액 (검증용)

    -- 참조 정보
    reference_type  VARCHAR(50),               -- 'checkin' | 'action' | 'log' | 'referral' | 'preview'
    reference_id    VARCHAR(100),              -- 관련 레코드 ID
    description     TEXT,                      -- UI 표시용 설명

    -- 만료 정보 (SSOT: 90일)
    expires_at      TIMESTAMP WITH TIME ZONE,  -- 생성일 + 90일 (적립만)
    is_expired      BOOLEAN DEFAULT FALSE,     -- 만료 처리 여부

    -- 감사 정보
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_date    DATE DEFAULT CURRENT_DATE  -- 일일 집계/조회용
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_point_ledger_subject
    ON point_ledger(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_point_ledger_expires
    ON point_ledger(expires_at) WHERE NOT is_expired AND amount > 0;
CREATE INDEX IF NOT EXISTS idx_point_ledger_date
    ON point_ledger(created_date);
CREATE INDEX IF NOT EXISTS idx_point_ledger_event
    ON point_ledger(event_type);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. point_daily_cap (일일 적립 한도 추적)
-- ═══════════════════════════════════════════════════════════════════════════
-- 핵심 정책:
-- - 출석(checkin): 50P/일
-- - 실행체크(action): 30P/일
-- - 기록(log): 20P/일
-- - 합계: 100P/일

CREATE TABLE IF NOT EXISTS point_daily_cap (
    id              SERIAL PRIMARY KEY,
    subject_type    VARCHAR(20) NOT NULL,
    subject_id      VARCHAR(255) NOT NULL,
    cap_date        DATE NOT NULL DEFAULT CURRENT_DATE,

    -- 카테고리별 적립량 (단위: P)
    checkin_earned  INTEGER DEFAULT 0,         -- 한도: 50P
    action_earned   INTEGER DEFAULT 0,         -- 한도: 30P
    log_earned      INTEGER DEFAULT 0,         -- 한도: 20P

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ux_point_daily_cap UNIQUE (subject_type, subject_id, cap_date)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. preview_redemption (예고편 교환 내역)
-- ═══════════════════════════════════════════════════════════════════════════
-- 핵심 정책 (SSOT 하드가드):
-- - 비용: 900P
-- - 워터마크 필수, 1페이지, 저해상도
-- - 링크 24h 만료, 1회성 토큰, 재다운로드 불가
-- - 보관함 저장 없음
-- - 자격: 최근 7일 출석≥3, 실행체크≥1
-- - 상한: 유저 주 1회, 전체 주 100건

CREATE TABLE IF NOT EXISTS preview_redemption (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 대상 식별
    subject_type    VARCHAR(20) NOT NULL,
    subject_id      VARCHAR(255) NOT NULL,

    -- 교환 비용
    points_spent    INTEGER NOT NULL DEFAULT 900,
    ledger_id       INTEGER REFERENCES point_ledger(id),

    -- Preview 파일 정보
    preview_url     VARCHAR(500),              -- 내부 스토리지 경로
    preview_token   VARCHAR(64) UNIQUE,        -- 다운로드용 1회성 토큰
    watermark_text  VARCHAR(100) DEFAULT '미리보기 - 정식버전은 프로그램 구매 후 제공',

    -- 1회 다운로드 제한 (SSOT 하드가드)
    is_downloaded   BOOLEAN DEFAULT FALSE,
    downloaded_at   TIMESTAMP WITH TIME ZONE,

    -- 24h 만료 (SSOT 하드가드)
    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,

    -- 자격 검증 스냅샷 (감사용)
    qualification_snapshot JSONB,              -- { attendance_7d, action_check }

    -- 주간 쿼터용
    created_week    INTEGER,                   -- ISO 주차 숫자 (202605)

    -- 상태
    status          VARCHAR(20) DEFAULT 'CREATED',  -- CREATED, SENT, DOWNLOADED, EXPIRED

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_preview_redemption_subject
    ON preview_redemption(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_preview_redemption_token
    ON preview_redemption(preview_token);
CREATE INDEX IF NOT EXISTS idx_preview_redemption_week
    ON preview_redemption(created_week);
CREATE INDEX IF NOT EXISTS idx_preview_redemption_status
    ON preview_redemption(status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. preview_weekly_quota (주간 글로벌 한도)
-- ═══════════════════════════════════════════════════════════════════════════
-- 핵심 정책: 전체 주 100건 상한

CREATE TABLE IF NOT EXISTS preview_weekly_quota (
    year_week       VARCHAR(10) PRIMARY KEY,   -- '2026-W05' (ISO 주차)
    quota_used      INTEGER DEFAULT 0,
    quota_limit     INTEGER DEFAULT 100,       -- SSOT: 100건/주
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. referral (추천 관계)
-- ═══════════════════════════════════════════════════════════════════════════
-- 핵심 정책:
-- - B(피추천인): 코드 적용 시 300P 즉시 지급
-- - A(추천인): B가 QUALIFIED 달성 시 300P 베스팅 지급
-- - QUALIFIED: 가입 후 7일 내 출석≥2, 실행체크≥1
-- - A 월 5명까지 보상 인정
-- - 어뷰징(동일 기기/IP) → 자동 HOLD

CREATE TABLE IF NOT EXISTS referral (
    id              SERIAL PRIMARY KEY,

    -- 추천인 (A) 정보
    inviter_type    VARCHAR(20) NOT NULL,      -- 'trial'
    inviter_id      VARCHAR(255) NOT NULL,     -- trial.id
    inviter_ref_code VARCHAR(20) NOT NULL,     -- REF-XXXXX

    -- 피추천인 (B) 정보
    invitee_type    VARCHAR(20) NOT NULL,      -- 'trial'
    invitee_id      VARCHAR(255) NOT NULL,     -- trial.id

    -- 상태 관리
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    -- PENDING: 코드 적용됨, B 자격 미달
    -- QUALIFIED: B 자격 달성, A 보상 대기
    -- REWARDED: A 보상 지급 완료
    -- HOLD: 어뷰징 의심 (수동 검토 필요)
    -- REJECTED: 어뷰징 확정, 보상 거부

    -- 포인트 지급 내역
    invitee_points_granted INTEGER DEFAULT 0,  -- B에게 지급된 300P
    invitee_ledger_id INTEGER REFERENCES point_ledger(id),
    inviter_points_granted INTEGER DEFAULT 0,  -- A에게 베스팅 후 지급된 300P
    inviter_ledger_id INTEGER REFERENCES point_ledger(id),

    -- 자격 달성 정보
    qualified_at    TIMESTAMP WITH TIME ZONE,
    qualification_snapshot JSONB,              -- { days, attendance, action_check }

    -- 어뷰징 감지 (해시로 저장, 개인정보 최소화)
    device_hash     VARCHAR(64),               -- 기기 식별자 SHA256 해시
    ip_hash         VARCHAR(64),               -- IP SHA256 해시
    abuse_flags     JSONB,                     -- { same_device, same_ip, ... }
    hold_reason     TEXT,

    -- 타임스탬프
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- 제약: B는 1회만 적용 가능
    CONSTRAINT ux_referral_invitee UNIQUE (invitee_type, invitee_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_referral_inviter
    ON referral(inviter_type, inviter_id);
CREATE INDEX IF NOT EXISTS idx_referral_status
    ON referral(status);
CREATE INDEX IF NOT EXISTS idx_referral_code
    ON referral(inviter_ref_code);

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. referral_monthly_quota (추천인 월간 한도)
-- ═══════════════════════════════════════════════════════════════════════════
-- 핵심 정책: A 월 5명까지 보상 인정

CREATE TABLE IF NOT EXISTS referral_monthly_quota (
    id              SERIAL PRIMARY KEY,
    inviter_type    VARCHAR(20) NOT NULL,
    inviter_id      VARCHAR(255) NOT NULL,
    year_month      VARCHAR(10) NOT NULL,      -- '2026-02'

    rewards_granted INTEGER DEFAULT 0,          -- 이번 달 지급된 횟수
    rewards_limit   INTEGER DEFAULT 5,          -- SSOT: 5회/월

    CONSTRAINT ux_referral_monthly_quota UNIQUE (inviter_type, inviter_id, year_month)
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. admin_hold_queue (어드민 수동 검토 큐)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS admin_hold_queue (
    id              SERIAL PRIMARY KEY,

    hold_type       VARCHAR(30) NOT NULL,      -- 'REFERRAL_ABUSE' | 'PREVIEW_ABUSE' | 'POINT_ANOMALY'
    reference_table VARCHAR(50) NOT NULL,      -- 'referral' | 'preview_redemption' | 'point_ledger'
    reference_id    VARCHAR(100) NOT NULL,

    reason          TEXT NOT NULL,
    severity        VARCHAR(10) DEFAULT 'MEDIUM',  -- 'LOW' | 'MEDIUM' | 'HIGH'

    -- 처리 상태
    status          VARCHAR(20) DEFAULT 'PENDING',  -- PENDING | APPROVED | REJECTED | RESOLVED
    resolved_by     VARCHAR(100),
    resolved_at     TIMESTAMP WITH TIME ZONE,
    resolution_note TEXT,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hold_queue_status ON admin_hold_queue(status);
CREATE INDEX IF NOT EXISTS idx_hold_queue_type ON admin_hold_queue(hold_type);
CREATE INDEX IF NOT EXISTS idx_hold_queue_severity ON admin_hold_queue(severity, status);

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. feature_flags (기능 플래그)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS feature_flags (
    flag_key        VARCHAR(50) PRIMARY KEY,
    is_enabled      BOOLEAN DEFAULT FALSE,
    config          JSONB,                     -- 추가 설정 (한도값 등)
    description     TEXT,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by      VARCHAR(100)
);

-- 필수 플래그 초기화 (모두 OFF 상태로 시작)
INSERT INTO feature_flags (flag_key, is_enabled, config, description) VALUES
    ('points_enabled', FALSE,
     '{"daily_cap": {"checkin": 50, "action": 30, "log": 20}, "expiry_days": 90}',
     '포인트 시스템 전체 활성화'),
    ('preview_redemption_enabled', FALSE,
     '{"cost": 900, "weekly_global_limit": 100, "weekly_user_limit": 1, "link_expiry_hours": 24}',
     '예고편(Preview) 교환 기능'),
    ('referral_enabled', FALSE,
     '{"invitee_bonus": 300, "inviter_bonus": 300, "monthly_limit": 5, "qualification": {"days": 7, "attendance": 2, "action": 1}}',
     '친구추천 시스템')
ON CONFLICT (flag_key) DO UPDATE SET
    config = EXCLUDED.config,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- ═══════════════════════════════════════════════════════════════════════════
-- Triggers
-- ═══════════════════════════════════════════════════════════════════════════

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- referral 테이블 트리거
DROP TRIGGER IF EXISTS trigger_referral_updated ON referral;
CREATE TRIGGER trigger_referral_updated
    BEFORE UPDATE ON referral
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- point_daily_cap 테이블 트리거
DROP TRIGGER IF EXISTS trigger_point_daily_cap_updated ON point_daily_cap;
CREATE TRIGGER trigger_point_daily_cap_updated
    BEFORE UPDATE ON point_daily_cap
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- feature_flags 테이블 트리거
DROP TRIGGER IF EXISTS trigger_feature_flags_updated ON feature_flags;
CREATE TRIGGER trigger_feature_flags_updated
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- Migration Complete
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 005_points_referral_schema.sql COMPLETE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📦 Created Tables:';
    RAISE NOTICE '   1. point_ledger         - 포인트 원장 (일100P상한, 90일만료)';
    RAISE NOTICE '   2. point_daily_cap      - 일일 적립 한도 추적';
    RAISE NOTICE '   3. preview_redemption   - 예고편 교환 (900P, 워터마크, 24h만료)';
    RAISE NOTICE '   4. preview_weekly_quota - 주간 한도 (유저1회, 전체100건)';
    RAISE NOTICE '   5. referral             - 추천 관계 (B즉시300P, A베스팅300P)';
    RAISE NOTICE '   6. referral_monthly_quota - 추천인 월간 한도 (5명)';
    RAISE NOTICE '   7. admin_hold_queue     - 어뷰징 검토 큐';
    RAISE NOTICE '   8. feature_flags        - 기능 플래그 (모두 OFF)';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Feature Flags (all disabled by default):';
    RAISE NOTICE '   - points_enabled';
    RAISE NOTICE '   - preview_redemption_enabled';
    RAISE NOTICE '   - referral_enabled';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Next Steps:';
    RAISE NOTICE '   1. Run services (pointService, previewService, referralService)';
    RAISE NOTICE '   2. Register routes in server.js';
    RAISE NOTICE '   3. Enable flags via admin API when ready';
    RAISE NOTICE '═══════════════════════════════════════════════════════════════';
END $$;
