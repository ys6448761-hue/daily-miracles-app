/**
 * recommendationRoutes.js — 다음 항로 추천 API
 *
 * 룰 기반 (gap→추천):
 *   GET  /api/dt/recommendation        ?userId=xxx    → 추천 + show 로그
 *   POST /api/dt/recommendation/click                 → 클릭 로그
 *   GET  /api/dt/recommendation/kpi    ?days=7        → KPI
 *
 * AI 패턴 기반 (유사 사용자→추천):
 *   GET  /api/dt/recommendation/ai     ?userId=xxx    → AI 추천 + ai_suggest 로그
 *   POST /api/dt/recommendation/ai/click              → ai_click 로그
 *   GET  /api/dt/recommendation/ai/kpi ?days=7        → AI KPI
 */

'use strict';

const express = require('express');
const router  = express.Router();
const rec     = require('../services/recommendationService');
const aiRec   = require('../services/aiRecommendationService');

// ── GET /api/dt/recommendation ────────────────────────────────
router.get('/', async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'userId 필요' });

  try {
    const result = await rec.getRecommendation(String(userId));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dt/recommendation/click ─────────────────────────
router.post('/click', async (req, res) => {
  const { userId, user_id, gap } = req.body ?? {};
  const uid = userId || user_id;
  if (!uid || !gap) return res.status(400).json({ error: 'userId, gap 필요' });

  try {
    await rec.logClick(String(uid), gap);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/dt/recommendation/kpi ───────────────────────────
router.get('/kpi', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  try {
    const kpi = await rec.getKpi({ days });
    res.json(kpi);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/dt/recommendation/ai ─────────────────────────────
router.get('/ai', async (req, res) => {
  const userId = req.query.userId || req.query.user_id;
  if (!userId) return res.status(400).json({ error: 'userId 필요' });

  try {
    const result = await aiRec.getAIRecommendation(String(userId));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── POST /api/dt/recommendation/ai/click ──────────────────────
router.post('/ai/click', async (req, res) => {
  const { userId, user_id, gap } = req.body ?? {};
  const uid = userId || user_id;
  if (!uid || !gap) return res.status(400).json({ error: 'userId, gap 필요' });

  try {
    await aiRec.logAIClick(String(uid), gap);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── GET /api/dt/recommendation/ai/kpi ─────────────────────────
router.get('/ai/kpi', async (req, res) => {
  const days = parseInt(req.query.days, 10) || 7;
  try {
    const kpi = await aiRec.getAIKpi({ days });
    res.json(kpi);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
