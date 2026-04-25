/**
 * travelClickRoutes.js — 여행 전환 의도 로그
 * prefix: /api/travel
 *
 * POST /click  — 예약/전화 버튼 클릭 기록
 * GET  /stats  — 테마별 클릭 집계 (어드민용)
 */

'use strict';

const router = require('express').Router();
const db     = require('../database/db');

const VALID_THEMES  = new Set(['rest', 'thrill', 'settle']);
const VALID_ACTIONS = new Set(['reserve', 'call']);
const VALID_REFS    = new Set(['reminder', 'qr', 'direct']);

// ── POST /click ───────────────────────────────────────────────────
router.post('/click', async (req, res) => {
  try {
    const {
      star_id    = null,
      access_key = null,
      theme,
      hotel_name,
      action_type,
      ref_source = 'direct',
    } = req.body;

    if (!theme || !hotel_name || !action_type) {
      return res.status(400).json({
        success: false,
        error: 'theme, hotel_name, action_type 필수',
      });
    }
    if (!VALID_ACTIONS.has(action_type)) {
      return res.status(400).json({
        success: false,
        error: 'action_type은 reserve 또는 call',
      });
    }
    if (!VALID_THEMES.has(theme)) {
      return res.status(400).json({
        success: false,
        error: 'theme은 rest / thrill / settle 중 하나',
      });
    }

    const safeRef = VALID_REFS.has(ref_source) ? ref_source : 'direct';

    const { rows } = await db.query(
      `INSERT INTO travel_clicks
         (star_id, access_key, theme, hotel_name, action_type, ref_source)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [star_id || null, access_key || null, theme, hotel_name, action_type, safeRef]
    );

    return res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('[travel-click] POST /click error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /stats ────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         theme,
         action_type,
         ref_source,
         COUNT(*)::int          AS clicks,
         COUNT(DISTINCT star_id)::int AS unique_stars,
         MAX(created_at)        AS last_clicked_at
       FROM travel_clicks
       GROUP BY theme, action_type, ref_source
       ORDER BY clicks DESC`
    );
    return res.json({ success: true, stats: rows });
  } catch (err) {
    console.error('[travel-click] GET /stats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
