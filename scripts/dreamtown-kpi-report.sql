-- dreamtown-kpi-report.sql
-- DreamTown Scene→Action KPI 일일 점검 쿼리 모음
-- SSOT: docs/ssot/core/DreamTown_Event_SSOT.md
-- 작성일: 2026-04-04
-- 실행 환경: Supabase SQL Editor / psql
-- 선행 조건: dt_events 테이블 (migration 049)

-- ════════════════════════════════════════════════════════
-- [1] 기간 파라미터 (오늘 기준 — 필요 시 날짜 변경)
-- ════════════════════════════════════════════════════════
-- 아래 쿼리는 모두 CURRENT_DATE 기준.
-- 특정 기간으로 바꾸려면 CURRENT_DATE → 'YYYY-MM-DD'::date 교체


-- ════════════════════════════════════════════════════════
-- [KPI-1] 퍼널 단계별 수 + 전환율 (오늘)
-- scene_view → scene_action_click → travel_offer_view → conversion_action
-- ════════════════════════════════════════════════════════
WITH funnel AS (
  SELECT
    COUNT(*) FILTER (WHERE event_name = 'scene_view')          AS sv,
    COUNT(*) FILTER (WHERE event_name = 'scene_action_click')  AS sac,
    COUNT(*) FILTER (WHERE event_name = 'travel_offer_view')   AS tov,
    COUNT(*) FILTER (WHERE event_name = 'conversion_action')   AS ca
  FROM dt_events
  WHERE created_at >= CURRENT_DATE
)
SELECT
  sv                                              AS "scene_view",
  sac                                             AS "scene_action_click",
  tov                                             AS "travel_offer_view",
  ca                                              AS "conversion_action",
  ROUND(sac  * 100.0 / NULLIF(sv,  0), 1)        AS "sv→sac (%)",
  ROUND(tov  * 100.0 / NULLIF(sac, 0), 1)        AS "sac→tov (%)",
  ROUND(ca   * 100.0 / NULLIF(tov, 0), 1)        AS "tov→ca (%)",
  ROUND(ca   * 100.0 / NULLIF(sv,  0), 1)        AS "최종전환율 sv→ca (%)"
FROM funnel;


-- ════════════════════════════════════════════════════════
-- [KPI-2] A/B 비교 — coupon_test_1 전체 기간
-- variant A/B별 각 단계 수 + 최종 전환율
-- ════════════════════════════════════════════════════════
SELECT
  COALESCE(params->>'variant', '(없음)')          AS variant,
  COUNT(*) FILTER (WHERE event_name = 'scene_view')         AS scene_view,
  COUNT(*) FILTER (WHERE event_name = 'scene_action_click') AS scene_action_click,
  COUNT(*) FILTER (WHERE event_name = 'travel_offer_view')  AS travel_offer_view,
  COUNT(*) FILTER (WHERE event_name = 'conversion_action')  AS conversion_action,
  ROUND(
    COUNT(*) FILTER (WHERE event_name = 'conversion_action') * 100.0
    / NULLIF(COUNT(*) FILTER (WHERE event_name = 'scene_view'), 0),
  1) AS "최종전환율 (%)"
FROM dt_events
WHERE params->>'experiment_id' = 'coupon_test_1'
GROUP BY variant
ORDER BY variant;


-- ════════════════════════════════════════════════════════
-- [KPI-3] 진입 경로별 wish_start (오늘)
-- ════════════════════════════════════════════════════════
SELECT
  COALESCE(params->>'entry_point', 'unknown')     AS entry_point,
  COUNT(*)::int                                   AS count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS "비율 (%)"
FROM dt_events
WHERE event_name = 'wish_start'
  AND created_at >= CURRENT_DATE
GROUP BY entry_point
ORDER BY count DESC;


-- ════════════════════════════════════════════════════════
-- [검증-1] 이벤트명 전수 확인 — 오타/허용외 이벤트 탐지
-- ════════════════════════════════════════════════════════
SELECT
  event_name,
  COUNT(*)::int                   AS total,
  MIN(created_at)                 AS first_seen,
  MAX(created_at)                 AS last_seen,
  CASE
    WHEN event_name IN (
      'wish_start','scene_view','emotion_select',
      'scene_action_click','travel_offer_view',
      'coupon_open','conversion_action'
    ) THEN 'OK'
    ELSE '⚠️ 허용외'
  END                             AS status
FROM dt_events
GROUP BY event_name
ORDER BY total DESC;


-- ════════════════════════════════════════════════════════
-- [검증-2] travel_offer_view 순서 이상 감지
-- travel_offer_view 가 scene_action_click 보다 먼저 발생한 user_id 탐지
-- (정상: scene_action_click 시간 < travel_offer_view 시간)
-- ════════════════════════════════════════════════════════
WITH sac AS (
  SELECT user_id, MIN(created_at) AS sac_time
  FROM dt_events
  WHERE event_name = 'scene_action_click'
  GROUP BY user_id
),
tov AS (
  SELECT user_id, MIN(created_at) AS tov_time
  FROM dt_events
  WHERE event_name = 'travel_offer_view'
  GROUP BY user_id
)
SELECT
  tov.user_id,
  sac.sac_time,
  tov.tov_time,
  '⚠️ 순서 역전'                   AS issue
FROM tov
LEFT JOIN sac USING (user_id)
WHERE sac.sac_time IS NULL
   OR tov.tov_time < sac.sac_time;
-- 결과 0행 = 정상


-- ════════════════════════════════════════════════════════
-- [검증-3] conversion_action 중복 과다 발생 확인
-- 동일 user_id가 1분 내 2건 이상 conversion_action 발생 시 탐지
-- ════════════════════════════════════════════════════════
SELECT
  user_id,
  COUNT(*)                         AS count,
  MIN(created_at)                  AS first,
  MAX(created_at)                  AS last,
  EXTRACT(EPOCH FROM MAX(created_at) - MIN(created_at))::int AS gap_sec
FROM dt_events
WHERE event_name = 'conversion_action'
GROUP BY user_id
HAVING COUNT(*) >= 2
   AND MAX(created_at) - MIN(created_at) < INTERVAL '1 minute'
ORDER BY count DESC;
-- 결과 0행 = 정상


-- ════════════════════════════════════════════════════════
-- [레거시] coupon_open 실제 발생 현황
-- 신규 퍼널에서는 미사용 — 허용 목록에만 존재
-- ════════════════════════════════════════════════════════
SELECT
  COUNT(*)::int                    AS coupon_open_count,
  MAX(created_at)                  AS last_seen,
  CASE WHEN COUNT(*) = 0 THEN '미사용 (허용목록 레거시 유지)'
       ELSE '⚠️ 구 코드 잔존 가능 — 소스 추적 필요'
  END                              AS verdict
FROM dt_events
WHERE event_name = 'coupon_open';
