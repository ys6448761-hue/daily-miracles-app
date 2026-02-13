-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 017: Aurora5 통합 엔진 (Unified Engine)
-- 소원놀이터(A) + 문제해결(B) + 소원실현(C) 단일 SSOT 구조
--
-- Q1~Q15 결정 기반:
--   Q1:  단일 이벤트 테이블 (event_type + jsonb)
--   Q2:  WU 완료 시 즉시 EF + 하루 1회 전체 재계산
--   Q3:  원문 미저장, 키워드+EF+카테고리만 저장
--   Q4:  이탈 시 새 세션 (Resume 없음)
--   Q5:  env 상수 기반 Feature Flag
--   Q8:  개인정보 최소수집 (실명X, 생일=연월만, phone=해시만)
--   Q9:  EF가 기적지수 하위변수
--   Q10: MVP 독립, FK로 연결만 (v0.2 연동 대비)
--   Q11: badges = 프로필 jsonb
--   Q14: UUID v4 PK
--   Q15: DB 세션 (wu_events 기반, 별도 세션 테이블 없음)
--
-- @version 1.0
-- @since 2026-02-13
-- ═══════════════════════════════════════════════════════════════════════════

-- pgcrypto 확장 (UUID v4 생성용)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. sowon_profiles: 소원이 프로필 SSOT
-- ─────────────────────────────────────────────────────────────────────────
-- Q14 확정: UUID v4 PK
-- Q8 확정: 실명 미저장, birth_year_month만, phone_hash만
-- Q9 확정: ef_scores가 기적지수 하위변수
-- Q11 확정: badges를 jsonb로 관리
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sowon_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 식별 (Q8: 최소수집)
    phone_hash VARCHAR(64) NOT NULL,          -- SHA256, 원번호 미저장
    nickname VARCHAR(50),                      -- 실명 대신 별명
    birth_year_month VARCHAR(7),               -- 'YYYY-MM' (일 미저장)

    -- 동의
    privacy_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    marketing_agreed BOOLEAN NOT NULL DEFAULT FALSE,
    agreed_at TIMESTAMPTZ,

    -- 에너지/기적지수 (Q9: EF가 하위변수)
    miracle_score INTEGER DEFAULT 50
        CHECK (miracle_score >= 50 AND miracle_score <= 100),
    energy_type VARCHAR(20) DEFAULT 'citrine',
    ef_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    ef_scores 구조:
    {
      "vitality":     0-100,   // 활력 (ruby)
      "relationship": 0-100,   // 관계 (citrine)
      "growth":       0-100,   // 성장 (emerald)
      "resolve":      0-100,   // 결단 (diamond)
      "stability":    0-100    // 안정 (sapphire)
    }
    */

    -- 배지/여권 (Q11: jsonb)
    badges JSONB NOT NULL DEFAULT '{"earned":[],"display":[]}'::jsonb,
    /*
    badges 구조:
    {
      "earned": [
        { "id": "first_wu",     "at": "2026-02-13T10:00:00Z" },
        { "id": "rel_complete", "at": "2026-02-14T09:00:00Z" }
      ],
      "display": ["first_wu", "rel_complete"]
    }
    */

    -- WU 진행 현황
    completed_wu_types TEXT[] DEFAULT '{}',     -- 완료한 WU 유형 목록
    total_wu_count INTEGER DEFAULT 0,           -- 총 WU 완료 횟수

    -- 메타
    last_active_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE UNIQUE INDEX IF NOT EXISTS idx_sowon_profiles_phone_hash
    ON sowon_profiles(phone_hash);
CREATE INDEX IF NOT EXISTS idx_sowon_profiles_energy
    ON sowon_profiles(energy_type);
CREATE INDEX IF NOT EXISTS idx_sowon_profiles_score
    ON sowon_profiles(miracle_score);
CREATE INDEX IF NOT EXISTS idx_sowon_profiles_active
    ON sowon_profiles(last_active_at DESC);

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_sowon_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sowon_profile_updated ON sowon_profiles;
CREATE TRIGGER trg_sowon_profile_updated
    BEFORE UPDATE ON sowon_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_sowon_profile_timestamp();


-- ─────────────────────────────────────────────────────────────────────────
-- 2. wu_events: 단일 이벤트 테이블 (Q1 확정: A)
-- ─────────────────────────────────────────────────────────────────────────
-- Q15 확정: session_id로 세션 추적 (별도 세션 테이블 없음)
-- Q4 확정: ABANDON 후 새 세션 → session_id 신규 발급
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wu_events (
    id BIGSERIAL PRIMARY KEY,
    session_id UUID NOT NULL,                  -- WU 1회 세션 그룹핑
    sowon_profile_id UUID NOT NULL
        REFERENCES sowon_profiles(id) ON DELETE CASCADE,

    -- 이벤트 분류
    event_type VARCHAR(30) NOT NULL,
    /*
    event_type 목록:
      WU_START       - WU 시작
      ANSWER_SUBMIT  - 개별 답변 제출
      RED_DETECTED   - RED 안전게이트 감지 (Q12: 안전장치)
      WU_COMPLETE    - WU 정상 완료
      WU_ABANDON     - WU 이탈 (Q4: 이탈 분석용)
      EF_CALCULATED  - EF 즉시 계산 완료 (Q2)
      BADGE_EARNED   - 배지 획득
      AI_CALLED      - AI 호출 기록 (Q13: 1회 상한 추적)
    */

    wu_type VARCHAR(30),                       -- REL, SELF_ST_TXT, CAREER, ... (12종)
    /*
    MVP 1차 WU 유형:
      REL          - 관계 유형
      SELF_ST_TXT  - 자기이해 스토리텔링 (텍스트)
    향후 확장 (Feature Flag로 제어):
      SELF_ST_IMG  - 자기이해 스토리텔링 (이미지)
      CAREER       - 진로
      HEALTH       - 건강
      MONEY        - 재정
      GROWTH       - 성장
      HEALING      - 치유
      SOCIAL       - 사회관계
      CREATIVE     - 창의
      FAMILY       - 가족
      DREAM        - 꿈/비전
    */

    -- 페이로드 (Q1: jsonb로 유연하게)
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    event_type별 payload 예시:

    WU_START:
    { "wu_type": "REL", "question_count": 7 }

    ANSWER_SUBMIT:
    { "question_idx": 2, "answer_length": 45 }
    ※ Q3 확정: 원문 미저장. 길이/카테고리만 기록

    RED_DETECTED:
    { "question_idx": 3, "keyword": "자살", "action": "session_ended" }

    WU_COMPLETE:
    { "duration_sec": 180, "answer_count": 7 }

    WU_ABANDON:
    { "last_question_idx": 3, "duration_sec": 45 }

    EF_CALCULATED:
    { "ef_scores": {...}, "miracle_score": 72, "delta": "+3" }

    BADGE_EARNED:
    { "badge_id": "first_wu", "trigger": "WU_COMPLETE" }

    AI_CALLED:
    { "model": "gpt-4o-mini", "tokens_used": 150, "purpose": "encouragement" }
    */

    -- 타임스탬프
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스 (Q6: DAU 1K~10K 대비)
CREATE INDEX IF NOT EXISTS idx_wu_events_session
    ON wu_events(session_id);
CREATE INDEX IF NOT EXISTS idx_wu_events_profile
    ON wu_events(sowon_profile_id);
CREATE INDEX IF NOT EXISTS idx_wu_events_type_time
    ON wu_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wu_events_wu_type
    ON wu_events(wu_type) WHERE wu_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wu_events_payload
    ON wu_events USING GIN (payload);


-- ─────────────────────────────────────────────────────────────────────────
-- 3. wu_results: WU 완료 결과 (마테리얼라이즈드)
-- ─────────────────────────────────────────────────────────────────────────
-- Q3 확정: 키워드 3~5개 + EF + 카테고리만 저장 (원문 없음)
-- Q13 확정: AI 응답 1회분 저장
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wu_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,                  -- wu_events.session_id와 연결
    sowon_profile_id UUID NOT NULL
        REFERENCES sowon_profiles(id) ON DELETE CASCADE,

    wu_type VARCHAR(30) NOT NULL,

    -- Q3: 키워드만 저장 (원문 없음)
    keywords TEXT[] DEFAULT '{}',              -- 추출 키워드 3~5개
    category VARCHAR(30),                      -- health/career/relationship/money/self/etc

    -- Q9: EF 스냅샷 (WU 완료 시점)
    ef_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    /*
    {
      "vitality": 72, "relationship": 55,
      "growth": 80, "resolve": 60, "stability": 75
    }
    */
    miracle_score_at INTEGER,                  -- 완료 시점 기적지수

    -- Q13: AI 응답 (1회 호출 결과)
    ai_response JSONB DEFAULT '{}'::jsonb,
    /*
    {
      "encouragement": "~50자 응원 문장",
      "insight": "~30자 한줄 인사이트",
      "next_wu_hint": "CAREER"
    }
    */

    -- 배지
    badges_earned TEXT[] DEFAULT '{}',         -- 이 WU에서 획득한 배지 ID들

    -- 메타
    duration_sec INTEGER,                      -- WU 소요시간 (초)
    answer_count INTEGER,                      -- 답변 수
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_wu_results_profile
    ON wu_results(sowon_profile_id);
CREATE INDEX IF NOT EXISTS idx_wu_results_session
    ON wu_results(session_id);
CREATE INDEX IF NOT EXISTS idx_wu_results_wu_type
    ON wu_results(wu_type);
CREATE INDEX IF NOT EXISTS idx_wu_results_category
    ON wu_results(category);
CREATE INDEX IF NOT EXISTS idx_wu_results_created
    ON wu_results(created_at DESC);


-- ─────────────────────────────────────────────────────────────────────────
-- 4. ef_daily_snapshots: 일일 배치 스냅샷 (Q2 확정: 하루 1회 재계산)
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ef_daily_snapshots (
    id BIGSERIAL PRIMARY KEY,
    sowon_profile_id UUID NOT NULL
        REFERENCES sowon_profiles(id) ON DELETE CASCADE,

    snapshot_date DATE NOT NULL,

    -- 점수
    ef_scores JSONB NOT NULL,
    miracle_score INTEGER NOT NULL
        CHECK (miracle_score >= 50 AND miracle_score <= 100),
    energy_type VARCHAR(20) NOT NULL,

    -- 델타 (전일 대비)
    miracle_score_delta INTEGER DEFAULT 0,     -- 전일 대비 변화
    energy_changed BOOLEAN DEFAULT FALSE,      -- 에너지 타입 변경 여부

    -- 근거
    source_wu_count INTEGER DEFAULT 0,         -- 해당일 완료 WU 수
    recalc_reason VARCHAR(50) DEFAULT 'daily_batch',
    -- 'daily_batch': 정기 배치
    -- 'wu_complete': WU 완료 시 즉시 계산
    -- 'manual':      수동 보정

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- 한 프로필당 하루 1개 (배치) + wu_complete 복수 허용
    -- 배치 스냅샷만 유니크 제약
    CONSTRAINT unique_daily_batch
        UNIQUE (sowon_profile_id, snapshot_date, recalc_reason)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ef_snapshots_profile_date
    ON ef_daily_snapshots(sowon_profile_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ef_snapshots_date
    ON ef_daily_snapshots(snapshot_date DESC);


-- ─────────────────────────────────────────────────────────────────────────
-- 5. 기존 테이블 연결 (Q10 확정: FK만 추가)
-- ─────────────────────────────────────────────────────────────────────────

-- trials 테이블에 sowon_profile_id 연결 (7일 여정 ↔ 프로필)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trials') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'trials' AND column_name = 'sowon_profile_id'
        ) THEN
            ALTER TABLE trials ADD COLUMN sowon_profile_id UUID
                REFERENCES sowon_profiles(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_trials_sowon_profile
                ON trials(sowon_profile_id);
            RAISE NOTICE '✅ trials.sowon_profile_id 추가 완료';
        END IF;
    END IF;
END $$;

-- wish_entries 테이블에 sowon_profile_id 연결 (기존 소원 → 프로필)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wish_entries') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'wish_entries' AND column_name = 'sowon_profile_id'
        ) THEN
            ALTER TABLE wish_entries ADD COLUMN sowon_profile_id UUID
                REFERENCES sowon_profiles(id) ON DELETE SET NULL;
            CREATE INDEX IF NOT EXISTS idx_wish_entries_sowon_profile
                ON wish_entries(sowon_profile_id);
            RAISE NOTICE '✅ wish_entries.sowon_profile_id 추가 완료';
        END IF;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────
-- 6. 뷰: 소원이 대시보드 (프로필 + 최근 WU + EF 추이)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_sowon_dashboard AS
SELECT
    sp.id AS profile_id,
    sp.nickname,
    sp.miracle_score,
    sp.energy_type,
    sp.ef_scores,
    sp.badges,
    sp.completed_wu_types,
    sp.total_wu_count,
    sp.last_active_at,

    -- 최근 WU 결과
    latest_wu.wu_type AS last_wu_type,
    latest_wu.category AS last_wu_category,
    latest_wu.created_at AS last_wu_at,

    -- 7일간 EF 추이
    (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', eds.snapshot_date,
                'score', eds.miracle_score,
                'energy', eds.energy_type
            ) ORDER BY eds.snapshot_date
        )
        FROM ef_daily_snapshots eds
        WHERE eds.sowon_profile_id = sp.id
          AND eds.snapshot_date >= CURRENT_DATE - INTERVAL '7 days'
          AND eds.recalc_reason = 'daily_batch'
    ) AS ef_trend_7d

FROM sowon_profiles sp
LEFT JOIN LATERAL (
    SELECT wr.wu_type, wr.category, wr.created_at
    FROM wu_results wr
    WHERE wr.sowon_profile_id = sp.id
    ORDER BY wr.created_at DESC
    LIMIT 1
) latest_wu ON TRUE;


-- ─────────────────────────────────────────────────────────────────────────
-- 7. 뷰: WU 이탈 분석 (Q4/Q15: 이탈 패턴 추적)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_wu_abandon_analysis AS
SELECT
    we.wu_type,
    (we.payload->>'last_question_idx')::INTEGER AS abandon_at_question,
    COUNT(*) AS abandon_count,
    AVG((we.payload->>'duration_sec')::NUMERIC) AS avg_duration_sec,
    DATE_TRUNC('day', we.created_at) AS day
FROM wu_events we
WHERE we.event_type = 'WU_ABANDON'
GROUP BY we.wu_type,
         (we.payload->>'last_question_idx')::INTEGER,
         DATE_TRUNC('day', we.created_at);


-- ─────────────────────────────────────────────────────────────────────────
-- 8. 뷰: WU 유형별 완료 통계
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_wu_completion_stats AS
SELECT
    wr.wu_type,
    COUNT(*) AS total_completed,
    AVG(wr.duration_sec) AS avg_duration_sec,
    AVG(wr.miracle_score_at) AS avg_miracle_score,
    COUNT(DISTINCT wr.sowon_profile_id) AS unique_profiles,

    -- 카테고리 분포
    jsonb_object_agg(
        COALESCE(wr.category, 'unknown'),
        cat_counts.cnt
    ) AS category_distribution

FROM wu_results wr
LEFT JOIN LATERAL (
    SELECT wr2.category, COUNT(*) AS cnt
    FROM wu_results wr2
    WHERE wr2.wu_type = wr.wu_type
    GROUP BY wr2.category
) cat_counts ON TRUE
GROUP BY wr.wu_type;


-- ─────────────────────────────────────────────────────────────────────────
-- 9. 뷰: AI 호출 사용량 모니터링 (Q13: 1회 상한 추적)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_ai_usage_daily AS
SELECT
    DATE_TRUNC('day', we.created_at) AS day,
    COUNT(*) AS total_ai_calls,
    SUM((we.payload->>'tokens_used')::INTEGER) AS total_tokens,
    AVG((we.payload->>'tokens_used')::NUMERIC) AS avg_tokens_per_call,
    COUNT(DISTINCT we.session_id) AS unique_sessions,

    -- 세션당 AI 호출 수 (1회 초과 = 이상)
    COUNT(*) FILTER (
        WHERE we.session_id IN (
            SELECT sub.session_id
            FROM wu_events sub
            WHERE sub.event_type = 'AI_CALLED'
            GROUP BY sub.session_id
            HAVING COUNT(*) > 1
        )
    ) AS over_limit_calls

FROM wu_events we
WHERE we.event_type = 'AI_CALLED'
GROUP BY DATE_TRUNC('day', we.created_at);


-- ─────────────────────────────────────────────────────────────────────────
-- 10. 함수: 소원이 프로필 upsert (phone_hash 기반)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION upsert_sowon_profile(
    p_phone_hash VARCHAR(64),
    p_nickname VARCHAR(50) DEFAULT NULL,
    p_birth_year_month VARCHAR(7) DEFAULT NULL,
    p_privacy_agreed BOOLEAN DEFAULT FALSE,
    p_marketing_agreed BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO sowon_profiles (phone_hash, nickname, birth_year_month,
                                privacy_agreed, marketing_agreed, agreed_at)
    VALUES (p_phone_hash, p_nickname, p_birth_year_month,
            p_privacy_agreed, p_marketing_agreed,
            CASE WHEN p_privacy_agreed THEN NOW() ELSE NULL END)
    ON CONFLICT (phone_hash) DO UPDATE SET
        nickname = COALESCE(EXCLUDED.nickname, sowon_profiles.nickname),
        birth_year_month = COALESCE(EXCLUDED.birth_year_month, sowon_profiles.birth_year_month),
        marketing_agreed = EXCLUDED.marketing_agreed,
        last_active_at = NOW()
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────
-- 11. 함수: EF 즉시 계산 후 프로필 업데이트 (Q2: WU 완료 시)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_profile_ef(
    p_profile_id UUID,
    p_ef_scores JSONB,
    p_miracle_score INTEGER,
    p_energy_type VARCHAR(20)
)
RETURNS VOID AS $$
BEGIN
    -- 프로필 갱신
    UPDATE sowon_profiles SET
        ef_scores = p_ef_scores,
        miracle_score = p_miracle_score,
        energy_type = p_energy_type,
        last_active_at = NOW()
    WHERE id = p_profile_id;

    -- EF 스냅샷 기록 (즉시 계산)
    INSERT INTO ef_daily_snapshots (
        sowon_profile_id, snapshot_date,
        ef_scores, miracle_score, energy_type,
        source_wu_count, recalc_reason
    ) VALUES (
        p_profile_id, CURRENT_DATE,
        p_ef_scores, p_miracle_score, p_energy_type,
        1, 'wu_complete'
    );
END;
$$ LANGUAGE plpgsql;


-- ─────────────────────────────────────────────────────────────────────────
-- 12. 함수: WU 완료 처리 (결과 기록 + 프로필 업데이트 + 배지)
-- ─────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION complete_wu(
    p_session_id UUID,
    p_profile_id UUID,
    p_wu_type VARCHAR(30),
    p_keywords TEXT[],
    p_category VARCHAR(30),
    p_ef_scores JSONB,
    p_miracle_score INTEGER,
    p_energy_type VARCHAR(20),
    p_ai_response JSONB DEFAULT '{}'::jsonb,
    p_duration_sec INTEGER DEFAULT NULL,
    p_answer_count INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_result_id UUID;
    v_badges TEXT[] := '{}';
    v_existing_types TEXT[];
BEGIN
    -- 1. wu_results 저장
    INSERT INTO wu_results (
        session_id, sowon_profile_id, wu_type,
        keywords, category,
        ef_snapshot, miracle_score_at,
        ai_response, duration_sec, answer_count
    ) VALUES (
        p_session_id, p_profile_id, p_wu_type,
        p_keywords, p_category,
        p_ef_scores, p_miracle_score,
        p_ai_response, p_duration_sec, p_answer_count
    ) RETURNING id INTO v_result_id;

    -- 2. 프로필 EF 업데이트
    PERFORM update_profile_ef(p_profile_id, p_ef_scores, p_miracle_score, p_energy_type);

    -- 3. 배지 룰 (룰 기반, AI 불필요)
    SELECT completed_wu_types INTO v_existing_types
    FROM sowon_profiles WHERE id = p_profile_id;

    -- 첫 WU 완료 배지
    IF v_existing_types IS NULL OR array_length(v_existing_types, 1) IS NULL THEN
        v_badges := v_badges || ARRAY['first_wu'];
    END IF;

    -- 해당 유형 첫 완료 배지
    IF NOT (p_wu_type = ANY(COALESCE(v_existing_types, '{}'))) THEN
        v_badges := v_badges || ARRAY[p_wu_type || '_first'];
    END IF;

    -- 4. 프로필 WU 이력 업데이트 (단일 UPDATE — 019에서 이중 증가 수정)
    UPDATE sowon_profiles SET
        completed_wu_types = CASE
            WHEN p_wu_type = ANY(COALESCE(completed_wu_types, '{}'))
            THEN completed_wu_types
            ELSE COALESCE(completed_wu_types, '{}') || ARRAY[p_wu_type]
        END,
        total_wu_count = COALESCE(total_wu_count, 0) + 1,
        last_active_at = NOW()
    WHERE id = p_profile_id;

    -- 5. 배지 기록 (프로필 jsonb + wu_results)
    IF array_length(v_badges, 1) > 0 THEN
        -- 프로필 badges.earned에 추가
        UPDATE sowon_profiles SET
            badges = jsonb_set(
                badges,
                '{earned}',
                COALESCE(badges->'earned', '[]'::jsonb) || (
                    SELECT jsonb_agg(
                        jsonb_build_object('id', b, 'at', NOW()::TEXT)
                    )
                    FROM unnest(v_badges) AS b
                )
            )
        WHERE id = p_profile_id;

        -- wu_results에도 기록
        UPDATE wu_results SET badges_earned = v_badges
        WHERE id = v_result_id;

        -- 이벤트 로그
        INSERT INTO wu_events (session_id, sowon_profile_id, event_type, wu_type, payload)
        SELECT p_session_id, p_profile_id, 'BADGE_EARNED', p_wu_type,
               jsonb_build_object('badge_id', b, 'trigger', 'WU_COMPLETE')
        FROM unnest(v_badges) AS b;
    END IF;

    RETURN v_result_id;
END;
$$ LANGUAGE plpgsql;


-- ═══════════════════════════════════════════════════════════════════════════
-- 완료 로그
-- ═══════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '✅ Migration 017 완료: Aurora5 통합 엔진';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📦 테이블:';
    RAISE NOTICE '   sowon_profiles      - 소원이 프로필 SSOT (UUID v4 PK)';
    RAISE NOTICE '   wu_events           - WU 단일 이벤트 로그';
    RAISE NOTICE '   wu_results          - WU 완료 결과 (마테리얼라이즈드)';
    RAISE NOTICE '   ef_daily_snapshots  - EF 일일 배치 스냅샷';
    RAISE NOTICE '';
    RAISE NOTICE '🔗 FK 연결:';
    RAISE NOTICE '   trials.sowon_profile_id       → sowon_profiles.id';
    RAISE NOTICE '   wish_entries.sowon_profile_id  → sowon_profiles.id';
    RAISE NOTICE '';
    RAISE NOTICE '👁️ 뷰:';
    RAISE NOTICE '   v_sowon_dashboard       - 소원이 대시보드';
    RAISE NOTICE '   v_wu_abandon_analysis   - WU 이탈 분석';
    RAISE NOTICE '   v_wu_completion_stats   - WU 완료 통계';
    RAISE NOTICE '   v_ai_usage_daily        - AI 사용량 모니터링';
    RAISE NOTICE '';
    RAISE NOTICE '⚙️ 함수:';
    RAISE NOTICE '   upsert_sowon_profile()  - 프로필 생성/갱신';
    RAISE NOTICE '   update_profile_ef()     - EF 즉시 업데이트';
    RAISE NOTICE '   complete_wu()           - WU 완료 원자적 처리';
    RAISE NOTICE '';
    RAISE NOTICE '🏷️ Feature Flags (env):';
    RAISE NOTICE '   WU_REL_ENABLED=true         (MVP 1차)';
    RAISE NOTICE '   WU_SELF_ST_TXT_ENABLED=true (MVP 1차)';
    RAISE NOTICE '   기타 10종: 기본 OFF (config/featureFlags.js)';
END $$;
