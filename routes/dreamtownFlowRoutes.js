/**
 * dreamtownFlowRoutes.js
 *
 * POST /api/dt/flow             — 이벤트 기록
 * GET  /api/dt/flow/kpi         — KPI 3개 + 루미 판정
 * GET  /api/dt/flow/trend       — 일별 트렌드
 * GET  /api/dt/flow/bottleneck  — 병목 분석 (1개 선택 SSOT)
 */

'use strict';

const express  = require('express');
const router   = express.Router();
const flow     = require('../services/dreamtownFlowService');
const db       = require('../database/db');
const { getDay1ConversionRate } = require('../services/day1OnboardingService');

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

// ── GET /api/dt/flow/day1-kpi ────────────────────────────────
// Day1 진입률: day1_prompt_shown → day1_start 전환율 (온보딩 병목 핵심 지표)
router.get('/day1-kpi', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  try {
    const kpi = await getDay1ConversionRate(db, { days });
    res.json(kpi);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/dt/flow/bottleneck ───────────────────────────────
// 병목 분석: 퍼널 4단계 중 gap 최대 1개 → 원인 + 액션 반환
router.get('/bottleneck', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  try {
    const kpi        = await flow.getKpiSummary({ days });
    const bottleneck = flow.analyzeBottleneck(kpi);
    return res.json({
      period:     `${days}d`,
      generated:  new Date().toISOString(),
      bottleneck,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

module.exports = router;
