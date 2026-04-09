/**
 * dreamtownFlowRoutes.js
 *
 * POST /api/dt/flow          — 이벤트 기록
 * GET  /api/dt/flow/kpi      — KPI 3개 + 루미 판정
 * GET  /api/dt/flow/trend    — 일별 트렌드
 */

'use strict';

const express = require('express');
const router  = express.Router();
const flow    = require('../services/dreamtownFlowService');

// ── POST /api/dt/flow ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { userId, stage, action, value = {}, refId, sessionId } = req.body;
    if (!userId || !stage || !action) {
      return res.status(400).json({ error: 'userId, stage, action 필수' });
    }
    await flow.log({ userId, stage, action, value, refId, sessionId });
    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
});

// ── GET /api/dt/flow/kpi ──────────────────────────────────────
router.get('/kpi', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  const kpi     = await flow.getKpiSummary({ days });
  const verdict = flow.computeVerdict(kpi);

  return res.json({
    period: `${days}d`,
    generated: new Date().toISOString(),
    kpi,
    goals: flow.GOALS,
    verdict,
  });
});

// ── GET /api/dt/flow/trend ────────────────────────────────────
router.get('/trend', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  const trend = await flow.getDailyTrend({ days });
  return res.json({ days, trend });
});

module.exports = router;
