/**
 * dtEventRoutes.js
 * DreamTown 사용자 행동 이벤트 수집
 * 등록: /api/dt/events
 *
 * POST /          — 이벤트 1건 기록
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
  'coupon_open',
  'conversion_action',
]);

// ── 헬스체크 ─────────────────────────────────────────────────
router.get('/ping', (_req, res) => res.json({ ok: true }));

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
