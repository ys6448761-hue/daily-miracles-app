/**
 * wishCheckinRoutes.js — 소원 전 상태 체크인
 *
 * GET  /api/dt/wish-checkin/states  — 상태 목록
 * POST /api/dt/wish-checkin         — 상태 선택 로그 + 응답
 * POST /api/dt/wish-checkin/skip    — 스킵 로그
 * GET  /api/dt/wish-checkin/kpi     — 3개 지표 (선택률/행동클릭률/상태별 분석)
 */

'use strict';

const express  = require('express');
const router   = express.Router();
const checkin  = require('../services/wishCheckinService');
const flow     = require('../services/dreamtownFlowService');
const db       = require('../database/db');

// ── GET /states ───────────────────────────────────────────────
router.get('/states', (_req, res) => {
  res.json({ states: checkin.getStates() });
});

// ── POST / — 상태 선택 ────────────────────────────────────────
router.post('/', async (req, res) => {
  const { user_id, state_key, action_clicked = false, session_id = null } = req.body;

  if (!state_key) return res.status(400).json({ error: 'state_key 필수' });

  const response = checkin.getResponse(state_key);
  if (!response) return res.status(400).json({ error: `알 수 없는 state_key: ${state_key}` });

  if (user_id) {
    flow.log({
      userId:    String(user_id),
      stage:     'wish',
      action:    'state_checkin',
      value:     { state_selected: state_key, action_clicked: Boolean(action_clicked), timestamp: new Date().toISOString() },
      sessionId: session_id ?? null,
    }).catch(e => console.warn('flow log failed (wish/state_checkin)', e.message));
  }

  return res.json(response);
});

// ── POST /skip — 스킵 로그 ────────────────────────────────────
router.post('/skip', (req, res) => {
  const { user_id, session_id = null } = req.body;

  if (user_id) {
    flow.log({
      userId:    String(user_id),
      stage:     'wish',
      action:    'state_skip',
      value:     { timestamp: new Date().toISOString() },
      sessionId: session_id ?? null,
    }).catch(e => console.warn('flow log failed (wish/state_skip)', e.message));
  }

  return res.status(201).json({ ok: true });
});

// ── GET /kpi — 체크인 3개 지표 ───────────────────────────────
router.get('/kpi', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;

  try {
    const { rows } = await db.query(`
      WITH period AS (SELECT NOW() - INTERVAL '${days} days' AS since),
      selections AS (
        SELECT
          value->>'state_selected'            AS state,
          (value->>'action_clicked')::boolean AS clicked
        FROM dreamtown_flow, period
        WHERE stage = 'wish' AND action = 'state_checkin'
          AND created_at >= since
      ),
      skips AS (
        SELECT COUNT(*) AS n
        FROM dreamtown_flow, period
        WHERE stage = 'wish' AND action = 'state_skip'
          AND created_at >= since
      )
      SELECT
        COUNT(*)::int                                              AS total_selections,
        (SELECT n FROM skips)::int                                 AS total_skips,
        ROUND(
          COUNT(*)::numeric
          / NULLIF(COUNT(*) + (SELECT n FROM skips), 0) * 100, 1
        )                                                          AS selection_rate,
        ROUND(
          COUNT(*) FILTER (WHERE clicked = true)::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        )                                                          AS action_click_rate
      FROM selections
    `);

    // 상태별 분석 (진짜 인사이트)
    const { rows: byState } = await db.query(`
      SELECT
        value->>'state_selected'                                AS state,
        COUNT(*)::int                                           AS selections,
        ROUND(
          COUNT(*) FILTER (WHERE (value->>'action_clicked')::boolean = true)::numeric
          / NULLIF(COUNT(*), 0) * 100, 1
        )                                                       AS click_rate
      FROM dreamtown_flow
      WHERE stage = 'wish' AND action = 'state_checkin'
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY value->>'state_selected'
      ORDER BY selections DESC
    `);

    const summary = rows[0] ?? {};
    const goals   = { selection_rate: 60, action_click_rate: 30 };
    const verdict = {
      selection_ok:  parseFloat(summary.selection_rate  ?? 0) >= goals.selection_rate,
      action_ok:     parseFloat(summary.action_click_rate ?? 0) >= goals.action_click_rate,
    };

    return res.json({
      period: `${days}d`,
      generated: new Date().toISOString(),
      summary,
      by_state: byState,
      goals,
      verdict,
    });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
