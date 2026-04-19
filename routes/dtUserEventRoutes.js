'use strict';

/**
 * dtUserEventRoutes.js
 * 등록 위치: /api/dt/user-events
 *
 * POST /     이벤트 1건 기록
 * GET  /kpi  6종 이벤트 집계
 */

const express  = require('express');
const router   = express.Router();
const { EVENTS, logEvent, detectRevisit } = require('../services/dt/userEventService');
const db = require('../database/db');
const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtUserEventRoutes');

// POST /api/dt/user-events
router.post('/', async (req, res) => {
  const { user_id, event_type, metadata } = req.body;
  if (!event_type) return res.status(400).json({ error: 'event_type 필수' });

  try {
    await logEvent({ userId: user_id, eventType: event_type, metadata });
    return res.json({ success: true });
  } catch (err) {
    log.error('user_event POST 실패', { event_type, err: err.message });
    return res.status(500).json({ error: 'event 저장 실패' });
  }
});

// POST /api/dt/user-events/revisit  — 재방문 감지 + 기록
router.post('/revisit', async (req, res) => {
  const { user_id } = req.body;
  const isRevisit = await detectRevisit(user_id);
  if (isRevisit) {
    await logEvent({ userId: user_id, eventType: EVENTS.REVISIT_DETECTED });
  }
  return res.json({ success: true, revisit: isRevisit });
});

// GET /api/dt/user-events/kpi  — 6종 이벤트 집계 (최근 7일)
router.get('/kpi', async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         event_type,
         COUNT(*)::int                                      AS total,
         COUNT(DISTINCT user_id)::int                       AS unique_users,
         COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) AS today
       FROM user_events
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
       GROUP BY event_type
       ORDER BY total DESC`
    );
    return res.json({ success: true, kpi: rows });
  } catch (err) {
    log.error('KPI 조회 실패', { err: err.message });
    return res.status(500).json({ error: 'KPI 조회 실패' });
  }
});

module.exports = router;
