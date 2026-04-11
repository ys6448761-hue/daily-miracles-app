/**
 * dtEventRoutes.js
 * DreamTown 사용자 행동 이벤트 수집
 * 등록: /api/dt/events
 *
 * POST /          — 이벤트 1건 기록
 * GET  /kpi       — KPI 3종 (진입경로 / 장면노출 / 전환깔때기)
 * GET  /ping      — 헬스체크
 *
 * SSOT: docs/ssot/core/DreamTown_Event_SSOT.md
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtEventRoutes');

// 허용 이벤트 목록 (SSOT v1 기준)
const ALLOWED_EVENTS = new Set([
  'wish_start',
  'scene_view',
  'emotion_select',
  'scene_action_click',       // 장면 선택 버튼 클릭 (Travel UX SSOT v1)
  'travel_offer_view',        // 감정 peak 이후 상품 노출 (Travel UX SSOT v1)
  'coupon_open',
  'conversion_action',
  // 팬덤 엔진 (별들의 속삭임 + 공명 + 연결)
  'whisper_shown',              // StarWhisperInput 노출 (작성률 분모)
  'whisper_created',            // 속삭임 저장 완료 (작성률 분자)
  'resonance_eligible',         // 공명 eligible 판정
  'resonance_shown',            // 공명 카드 실제 노출
  'resonance_item_rendered',    // 공명 카드 내 개별 문장 노출
  'connection_stage_eligible',  // 연결 단계 eligible 판정
  'connection_stage_shown',     // 연결 단계 카드 노출
  'connection_stage_rendered',  // 연결 단계 카드 렌더링
  // 과거 속삭임 재등장 (blend)
  'recall_eligible',            // recall 조건 충족
  'recall_shown',               // recall 카드 노출
  'recall_rendered',            // recall 카드 렌더링
  'blend_eligible',             // blend 조건 충족 (향후 분기 확장용)
  'blend_shown',                // blend 카드 노출
  'blend_rendered',             // blend 카드 렌더링
  // Galaxy Signal (서버사이드 직접 기록 — 클라이언트에서도 허용)
  'signal_generated',           // whisper 저장 시 signal 자동 생성
  // Signal-Aware 추천 랭킹
  'recommendation_ranked',      // 후보 점수 계산 완료
  'recommendation_shown',       // 추천 카드 실제 노출
  'recommendation_selected',    // 사용자가 추천 항로 선택
  // Signal-Aware 공명 랭킹 (서버사이드 직접 기록 + 클라이언트 허용)
  'resonance_ranked',           // 공명 후보 점수 계산 완료
  'resonance_selected',         // 공명 문장 선택 (source_text_id, similarity_score)
  // Connection(연결) 단계 — 생애 1회
  'connection_eligible',        // 연결 조건 평가
  'connection_selected',        // signal 기반 매칭 문장 선택
  'connection_shown',           // 연결 카드 노출
  'connection_completed',       // 연결 완료 (서버사이드 직접 기록도 병행)
  // 수익화 흐름 — 연결 이후 항로까지
  'voyage_offer_shown',         // 각 단계 진입 (phase: emotion/action/experience/routes/detail)
  'voyage_route_selected',      // 항로 선택 (route: quiet/starlit/wish)
  'voyage_booking_intent',      // "이 시간을 선택하기" 탭 → /voyage 이동
  // 모바일 이용권 (benefit credentials)
  'benefit_issued',             // 이용권 발급 완료
  'benefit_verified',           // 파트너 QR 확인
  'benefit_redeemed',           // 사용 완료 (메시지 트리거)
  'benefit_expired',            // 만료 처리
]);

// ── 헬스체크 ─────────────────────────────────────────────────
router.get('/ping', (_req, res) => res.json({ ok: true }));

// ── GET /kpi — KPI 3종 ───────────────────────────────────────
router.get('/kpi', async (_req, res) => {
  try {
    // KPI 1: 진입 경로별 wish_start (오늘)
    const kpi1 = await db.query(`
      SELECT
        COALESCE(params->>'entry_point', 'unknown') AS entry_point,
        COUNT(*)::int                               AS count
      FROM dt_events
      WHERE event_name = 'wish_start'
        AND created_at >= CURRENT_DATE
      GROUP BY entry_point
      ORDER BY count DESC
    `);

    // KPI 2: 장면별 노출 수 (최근 7일)
    const kpi2 = await db.query(`
      SELECT
        COALESCE(params->>'scene_id',   'unknown') AS scene_id,
        COALESCE(params->>'scene_type', 'unknown') AS scene_type,
        COUNT(*)::int                               AS views
      FROM dt_events
      WHERE event_name = 'scene_view'
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY scene_id, scene_type
      ORDER BY views DESC
    `);

    // KPI 3: 전환 깔때기 — 이벤트별 발생 수 + 전체 대비 비율 (오늘)
    const kpi3 = await db.query(`
      WITH totals AS (
        SELECT event_name, COUNT(*)::int AS cnt
        FROM dt_events
        WHERE created_at >= CURRENT_DATE
        GROUP BY event_name
      ),
      grand AS (SELECT SUM(cnt) AS total FROM totals)
      SELECT
        t.event_name,
        t.cnt                                                         AS count,
        ROUND(t.cnt * 100.0 / NULLIF(g.total, 0), 1)::float          AS pct
      FROM totals t, grand g
      ORDER BY t.cnt DESC
    `);

    // KPI 4: A/B 실험 결과 — coupon_test_1 (전체 기간)
    const kpi4 = await db.query(`
      SELECT
        params->>'variant'    AS variant,
        event_name,
        COUNT(*)::int         AS count
      FROM dt_events
      WHERE params->>'experiment_id' = 'coupon_test_1'
        AND event_name IN ('scene_view', 'emotion_select', 'conversion_action')
      GROUP BY variant, event_name
      ORDER BY variant, event_name
    `);

    // KPI 5: 팬덤 엔진 — 작성률 + recall/blend 비교 (최근 7일)
    const kpi5 = await db.query(`
      SELECT
        SUM(CASE WHEN event_name = 'whisper_shown'        THEN 1 ELSE 0 END)::int  AS whisper_shown,
        SUM(CASE WHEN event_name = 'whisper_created'      THEN 1 ELSE 0 END)::int  AS whisper_created,
        SUM(CASE WHEN event_name = 'resonance_shown'      THEN 1 ELSE 0 END)::int  AS resonance_shown,
        SUM(CASE WHEN event_name = 'resonance_eligible'   THEN 1 ELSE 0 END)::int  AS resonance_eligible,
        SUM(CASE WHEN event_name IN ('recall_shown','blend_shown') THEN 1 ELSE 0 END)::int AS recall_blend_shown,
        SUM(CASE WHEN event_name = 'connection_stage_shown' THEN 1 ELSE 0 END)::int AS connection_shown,
        CASE
          WHEN SUM(CASE WHEN event_name = 'whisper_shown' THEN 1 ELSE 0 END) = 0 THEN NULL
          ELSE ROUND(
            SUM(CASE WHEN event_name = 'whisper_created' THEN 1 ELSE 0 END) * 100.0
            / SUM(CASE WHEN event_name = 'whisper_shown'  THEN 1 ELSE 0 END),
          1)::float
        END AS write_rate_pct
      FROM dt_events
      WHERE event_name IN (
        'whisper_shown','whisper_created',
        'resonance_shown','resonance_eligible',
        'recall_shown','blend_shown',
        'connection_stage_shown'
      )
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `);

    // KPI 5b: recall vs blend source_type 비교 (requestId 단위)
    const kpi5b = await db.query(`
      SELECT
        params->>'source_type'                       AS source_type,
        COUNT(*)::int                                AS shown,
        ROUND(AVG((params->>'text_length')::numeric), 1)::float AS avg_text_length,
        SUM(CASE WHEN (params->>'fallback')::boolean THEN 1 ELSE 0 END)::int AS fallback_count
      FROM dt_events
      WHERE event_name IN ('recall_shown', 'blend_shown')
        AND created_at >= CURRENT_DATE - INTERVAL '7 days'
        AND params->>'source_type' IS NOT NULL
      GROUP BY params->>'source_type'
      ORDER BY shown DESC
    `);

    return res.json({
      generated_at:  new Date().toISOString(),
      kpi1_entry:    kpi1.rows,
      kpi2_scene:    kpi2.rows,
      kpi3_funnel:   kpi3.rows,
      kpi4_ab:       kpi4.rows,
      kpi5_fandom:   kpi5.rows[0],
      kpi5b_blend:   kpi5b.rows,
    });
  } catch (err) {
    log.error('kpi 조회 실패', { err: err.message });
    return res.status(500).json({ error: 'KPI 조회에 실패했습니다' });
  }
});

// ── POST / — 이벤트 기록 ─────────────────────────────────────
router.post('/', async (req, res) => {
  const { event, user_id, ...params } = req.body ?? {};

  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: 'event 필드가 필요합니다' });
  }

  if (!ALLOWED_EVENTS.has(event)) {
    return res.status(400).json({ error: `허용되지 않은 이벤트입니다: ${event}` });
  }

  try {
    const result = await db.query(
      `INSERT INTO dt_events (event_name, user_id, params)
       VALUES ($1, $2, $3::jsonb)
       RETURNING id, created_at`,
      [event, user_id ?? null, JSON.stringify(params)],
    );

    log.info('event recorded', { event, user_id, id: result.rows[0].id });

    return res.status(201).json({ ok: true, id: result.rows[0].id });
  } catch (err) {
    log.error('event insert 실패', { event, err: err.message });
    return res.status(500).json({ error: '이벤트 기록에 실패했습니다' });
  }
});

module.exports = router;
