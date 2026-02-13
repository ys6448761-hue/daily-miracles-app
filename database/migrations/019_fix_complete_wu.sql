-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 019: fix complete_wu() — total_wu_count 이중 증가 + array_append(NULL) 수정
--
-- 수정 사항:
--   [1] total_wu_count UPDATE 2회 → 1회 통합
--   [2] array_append(CASE..., NULL) → 깨끗한 CASE 표현식
--   [3] completed_wu_types 이중 UPDATE → 단일 UPDATE로 통합
--
-- @since 2026-02-13
-- ═══════════════════════════════════════════════════════════════════════════

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

    -- 2. 프로필 EF 업데이트 + 스냅샷
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

    -- 4. 프로필 WU 이력 업데이트 (단일 UPDATE — 017의 이중 증가 수정)
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
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 019 완료: complete_wu() hotfix';
    RAISE NOTICE '   [1] total_wu_count 이중 증가 → 1회로 수정';
    RAISE NOTICE '   [2] array_append(NULL) → CASE 직접 할당';
    RAISE NOTICE '   [3] completed_wu_types 이중 UPDATE → 단일 통합';
END $$;
