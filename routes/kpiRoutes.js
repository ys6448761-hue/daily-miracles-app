/**
 * kpiRoutes.js — DreamTown KPI 대시보드 API
 *
 * GET /api/kpi/dashboard?range=today|7d|30d
 *
 * 정본: dt_kpi_events
 * GA4는 보조 관찰용
 */

'use strict';

const express = require('express');
const router  = express.Router();
const kpiService = require('../services/kpiService');

const VALID_RANGES = ['today', '7d', '30d'];

// GET /api/kpi/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const range = VALID_RANGES.includes(req.query.range)
      ? req.query.range
      : '7d';

    const data = await kpiService.getDashboard(range);
    res.json(data);

  } catch (err) {
    console.error('[KPI] GET /dashboard error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
