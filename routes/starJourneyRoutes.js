'use strict';

/**
 * starJourneyRoutes.js — Star Journey API
 * prefix: /api/star/journeys
 *
 * POST /start   — 새 여정 시작
 * GET  /:id     — 여정 + moments 조회 (스토리북)
 */

const router = require('express').Router();
const db     = require('../database/db');

let emitKpiEvent = null;
try { ({ emitKpiEvent } = require('../services/kpiEventEmitter')); } catch (_) {}

const VALID_TYPES = new Set(['travel', 'daily', 'reflection']);

// ── POST /api/star/journeys/start ─────────────────────────────────
router.post('/start', async (req, res) => {
  const { star_id, journey_type = 'travel', title } = req.body;

  if (!star_id) {
    return res.status(400).json({ success: false, error: 'star_id 필수' });
  }
  if (!VALID_TYPES.has(journey_type)) {
    return res.status(400).json({ success: false, error: 'journey_type: travel | daily | reflection' });
  }

  try {
    const { rows: starRows } = await db.query(
      'SELECT id FROM stars WHERE id = $1',
      [star_id]
    );
    if (!starRows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다.' });
    }

    const { rows } = await db.query(
      `INSERT INTO journeys (star_id, journey_type, title)
       VALUES ($1, $2, $3)
       RETURNING id, star_id, journey_type, title, created_at`,
      [star_id, journey_type, title?.trim() || null]
    );
    const journey = rows[0];

    if (emitKpiEvent) {
      emitKpiEvent({
        eventName: 'journey_started',
        source:    'star_journey_api',
        extra:     { star_id, journey_type },
      }).catch(() => {});
    }

    console.log(`[star-journey] 시작 | id:${journey.id} | type:${journey_type}`);
    return res.status(201).json({ success: true, journey_id: journey.id, journey });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ success: false, error: 'migration 146 필요 (journeys 테이블 없음)' });
    }
    console.error('[star-journey] POST /start error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/star/journeys/:id ────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: jRows } = await db.query(
      'SELECT id, star_id, journey_type, title, created_at FROM journeys WHERE id = $1',
      [id]
    );
    if (!jRows.length) {
      return res.status(404).json({ success: false, error: '여정을 찾을 수 없습니다.' });
    }

    const { rows: mRows } = await db.query(
      `SELECT id, emotion, context_type, image_url, is_fallback, created_at
       FROM moments WHERE journey_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return res.json({ success: true, journey: jRows[0], moments: mRows });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ success: false, error: 'migration 146 필요' });
    }
    console.error('[star-journey] GET /:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
