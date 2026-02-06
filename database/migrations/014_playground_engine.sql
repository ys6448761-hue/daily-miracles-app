-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 014: 소원놀이터 (Playground Engine)
-- Philosophy Score + Exposure/Reward Engine
-- ═══════════════════════════════════════════════════════════════════════════
-- AIL-JOB-401: DB 스키마

-- ───────────────────────────────────────────────────────────────────────────
-- 1. playground_users (소원놀이터 사용자 확장)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS playground_users (
    user_id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE,          -- 외부 시스템 연동 ID
    locale VARCHAR(10) DEFAULT 'ko',
    is_blocked BOOLEAN DEFAULT FALSE,
    creator_level INTEGER DEFAULT 0,          -- 엔드게임 단계용
    total_credits INTEGER DEFAULT 0,          -- 누적 크레딧
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_playground_users_external ON playground_users(external_id);
CREATE INDEX IF NOT EXISTS idx_playground_users_created ON playground_users(created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. artifacts (유저 창작물)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE artifact_type AS ENUM ('wish_card', 'daily_quest', 'remix_storybook');
CREATE TYPE artifact_visibility AS ENUM ('private', 'unlisted', 'public');
CREATE TYPE artifact_status AS ENUM ('draft', 'active', 'hidden', 'blocked');

CREATE TABLE IF NOT EXISTS artifacts (
    artifact_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES playground_users(user_id) ON DELETE CASCADE,
    type artifact_type NOT NULL DEFAULT 'wish_card',
    visibility artifact_visibility NOT NULL DEFAULT 'private',
    parent_id INTEGER REFERENCES artifacts(artifact_id) ON DELETE SET NULL,  -- 리믹스 부모
    root_id INTEGER REFERENCES artifacts(artifact_id) ON DELETE SET NULL,    -- 계보 루트
    remix_depth INTEGER DEFAULT 0,

    -- 3층 구조 + Blessing Slot (AIL-JOB-404)
    content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    content_json 필수 필드:
    - heart_line: string          // 마음(인정)
    - reality_hint: string        // 현실 단서 1문장
    - reality_tag: string         // time/money/relationship/health/anxiety/etc
    - one_step: string            // 한 걸음 1개
    - blessing_line: string       // 타인을 위한 한 줄
    선택:
    - tone: calm/warm/poetic
    - template_id: string
    */

    tags_json JSONB DEFAULT '[]'::jsonb,
    status artifact_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artifacts_user ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(type);
CREATE INDEX IF NOT EXISTS idx_artifacts_visibility ON artifacts(visibility);
CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);
CREATE INDEX IF NOT EXISTS idx_artifacts_parent ON artifacts(parent_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_root ON artifacts(root_id);
CREATE INDEX IF NOT EXISTS idx_artifacts_created ON artifacts(created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 3. artifact_scores (철학점수) - AIL-JOB-403
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE score_grade AS ENUM ('S', 'A', 'B', 'C', 'D');
CREATE TYPE gate_result AS ENUM ('pass', 'transform', 'block');

CREATE TABLE IF NOT EXISTS artifact_scores (
    artifact_id INTEGER PRIMARY KEY REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    score_total INTEGER NOT NULL DEFAULT 0 CHECK (score_total >= 0 AND score_total <= 100),
    grade score_grade NOT NULL DEFAULT 'D',

    -- 점수 상세 (A~F 항목별)
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    score_breakdown 구조:
    - pressure_zero: 0~20      // A 압박0
    - respect: 0~15            // B 존중/비낙인
    - pain_purify: 0~10        // C 고통정화
    - reality_hint: 0~15       // D 현실단서 (필수)
    - one_step: 0~20           // E 한걸음 (필수)
    - blessing: 0~20           // F 타인을 위한 한 줄 (필수)
    */

    gate_result gate_result NOT NULL DEFAULT 'pass',
    reasons JSONB DEFAULT '[]'::jsonb,       -- 감점/강등/차단 사유
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_artifact_scores_grade ON artifact_scores(grade);
CREATE INDEX IF NOT EXISTS idx_artifact_scores_total ON artifact_scores(score_total DESC);

-- ───────────────────────────────────────────────────────────────────────────
-- 4. artifact_reactions (도움 반응)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE reaction_type AS ENUM ('warm', 'thanks', 'saved', 'cheer');

CREATE TABLE IF NOT EXISTS artifact_reactions (
    reaction_id SERIAL PRIMARY KEY,
    artifact_id INTEGER NOT NULL REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES playground_users(user_id) ON DELETE CASCADE,
    type reaction_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 같은 사용자가 같은 아티팩트에 같은 반응 중복 방지
    UNIQUE(artifact_id, user_id, type)
);

CREATE INDEX IF NOT EXISTS idx_reactions_artifact ON artifact_reactions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user ON artifact_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON artifact_reactions(type);

-- ───────────────────────────────────────────────────────────────────────────
-- 5. shares (공유 링크)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shares (
    share_id SERIAL PRIMARY KEY,
    artifact_id INTEGER NOT NULL REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    share_slug VARCHAR(32) UNIQUE NOT NULL,
    visibility_at_share artifact_visibility NOT NULL,
    sharer_user_id INTEGER REFERENCES playground_users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_shares_artifact ON shares(artifact_id);
CREATE INDEX IF NOT EXISTS idx_shares_slug ON shares(share_slug);
CREATE INDEX IF NOT EXISTS idx_shares_sharer ON shares(sharer_user_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 6. share_views (공유 유입)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS share_views (
    view_id SERIAL PRIMARY KEY,
    share_id INTEGER NOT NULL REFERENCES shares(share_id) ON DELETE CASCADE,
    viewer_user_id INTEGER REFERENCES playground_users(user_id),  -- 비회원이면 null
    user_agent_hash VARCHAR(64),
    ip_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_share_views_share ON share_views(share_id);
CREATE INDEX IF NOT EXISTS idx_share_views_created ON share_views(created_at);

-- ───────────────────────────────────────────────────────────────────────────
-- 7. rewards (배지/크레딧 지급 로그)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE reward_type AS ENUM ('badge', 'credit');

CREATE TABLE IF NOT EXISTS rewards (
    reward_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES playground_users(user_id) ON DELETE CASCADE,
    type reward_type NOT NULL,
    key VARCHAR(100) NOT NULL,               -- badge_key or reason_key
    amount INTEGER DEFAULT 0,                -- credit amount (badge는 0)
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- 중복 지급 방지 (같은 사유로 중복 지급 불가)
    UNIQUE(user_id, type, key)
);

CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type);
CREATE INDEX IF NOT EXISTS idx_rewards_key ON rewards(key);

-- ───────────────────────────────────────────────────────────────────────────
-- 8. reports (신고) - AIL-JOB-407
-- ───────────────────────────────────────────────────────────────────────────
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'actioned', 'dismissed');

CREATE TABLE IF NOT EXISTS artifact_reports (
    report_id SERIAL PRIMARY KEY,
    artifact_id INTEGER NOT NULL REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    reporter_user_id INTEGER REFERENCES playground_users(user_id),
    reason VARCHAR(50) NOT NULL,             -- harmful/spam/hate/etc
    detail TEXT,
    status report_status DEFAULT 'pending',
    reviewed_at TIMESTAMP,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_artifact ON artifact_reports(artifact_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON artifact_reports(status);

-- ───────────────────────────────────────────────────────────────────────────
-- 9. user_badges (사용자 배지 보유)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES playground_users(user_id) ON DELETE CASCADE,
    badge_key VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    meta JSONB DEFAULT '{}'::jsonb,

    UNIQUE(user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_key ON user_badges(badge_key);

-- ───────────────────────────────────────────────────────────────────────────
-- 10. help_scores (도움 점수 캐시 - 피드 랭킹용)
-- ───────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artifact_help_scores (
    artifact_id INTEGER PRIMARY KEY REFERENCES artifacts(artifact_id) ON DELETE CASCADE,
    warm_count INTEGER DEFAULT 0,
    thanks_count INTEGER DEFAULT 0,
    saved_count INTEGER DEFAULT 0,
    cheer_count INTEGER DEFAULT 0,
    report_count INTEGER DEFAULT 0,
    help_score INTEGER DEFAULT 0,            -- (thanks*3 + saved*3 + cheer*2 + warm*1) - (reports*5)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_help_scores_score ON artifact_help_scores(help_score DESC);

-- ═══════════════════════════════════════════════════════════════════════════
-- 뷰: 피드용 (grade >= B, visibility = public, status = active)
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE VIEW v_feed_artifacts AS
SELECT
    a.artifact_id,
    a.user_id,
    a.type,
    a.content_json,
    a.created_at,
    s.score_total,
    s.grade,
    COALESCE(h.help_score, 0) as help_score,
    -- 랭킹 점수: 0.55*score_total + 0.35*help_score + 0.10*freshness
    (0.55 * s.score_total +
     0.35 * COALESCE(h.help_score, 0) +
     0.10 * GREATEST(0, 100 - EXTRACT(EPOCH FROM (NOW() - a.created_at)) / 1728)) as rank_score
FROM artifacts a
JOIN artifact_scores s ON a.artifact_id = s.artifact_id
LEFT JOIN artifact_help_scores h ON a.artifact_id = h.artifact_id
WHERE a.visibility = 'public'
  AND a.status = 'active'
  AND s.grade IN ('S', 'A', 'B')
  AND s.gate_result = 'pass'
ORDER BY rank_score DESC;

-- ═══════════════════════════════════════════════════════════════════════════
-- 함수: help_score 재계산
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_help_score(p_artifact_id INTEGER)
RETURNS void AS $$
DECLARE
    v_warm INTEGER;
    v_thanks INTEGER;
    v_saved INTEGER;
    v_cheer INTEGER;
    v_reports INTEGER;
    v_score INTEGER;
BEGIN
    -- 반응 카운트
    SELECT
        COUNT(*) FILTER (WHERE type = 'warm'),
        COUNT(*) FILTER (WHERE type = 'thanks'),
        COUNT(*) FILTER (WHERE type = 'saved'),
        COUNT(*) FILTER (WHERE type = 'cheer')
    INTO v_warm, v_thanks, v_saved, v_cheer
    FROM artifact_reactions
    WHERE artifact_id = p_artifact_id;

    -- 신고 카운트
    SELECT COUNT(*) INTO v_reports
    FROM artifact_reports
    WHERE artifact_id = p_artifact_id AND status != 'dismissed';

    -- help_score 계산: (thanks*3 + saved*3 + cheer*2 + warm*1) - (reports*5)
    v_score := (v_thanks * 3 + v_saved * 3 + v_cheer * 2 + v_warm * 1) - (v_reports * 5);

    -- Upsert
    INSERT INTO artifact_help_scores (artifact_id, warm_count, thanks_count, saved_count, cheer_count, report_count, help_score, updated_at)
    VALUES (p_artifact_id, v_warm, v_thanks, v_saved, v_cheer, v_reports, v_score, NOW())
    ON CONFLICT (artifact_id) DO UPDATE SET
        warm_count = EXCLUDED.warm_count,
        thanks_count = EXCLUDED.thanks_count,
        saved_count = EXCLUDED.saved_count,
        cheer_count = EXCLUDED.cheer_count,
        report_count = EXCLUDED.report_count,
        help_score = EXCLUDED.help_score,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- 트리거: 반응 추가/삭제 시 help_score 자동 갱신
-- ═══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION trigger_update_help_score()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM update_help_score(OLD.artifact_id);
        RETURN OLD;
    ELSE
        PERFORM update_help_score(NEW.artifact_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reaction_help_score ON artifact_reactions;
CREATE TRIGGER trg_reaction_help_score
AFTER INSERT OR DELETE ON artifact_reactions
FOR EACH ROW EXECUTE FUNCTION trigger_update_help_score();

-- ═══════════════════════════════════════════════════════════════════════════
-- 완료 로그
-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 014 완료: 소원놀이터 스키마
-- 테이블: playground_users, artifacts, artifact_scores, artifact_reactions,
--         shares, share_views, rewards, artifact_reports, user_badges, artifact_help_scores
-- 뷰: v_feed_artifacts
-- 함수: update_help_score
-- 트리거: trg_reaction_help_score
