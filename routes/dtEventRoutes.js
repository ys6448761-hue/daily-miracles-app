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
  'scene_action_click',   // 장면 선택 버튼 클릭 (Travel UX SSOT v1)
  'travel_offer_view',    // 감정 peak 이후 상품 노출 (Travel UX SSOT v1)
  'coupon_open',
  'conversion_action',
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

    return res.json({
      generated_at: new Date().toISOString(),
      kpi1_entry:   kpi1.rows,
      kpi2_scene:   kpi2.rows,
      kpi3_funnel:  kpi3.rows,
      kpi4_ab:      kpi4.rows,
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
