'use strict';

/**
 * impactRoutes.js — 스토리북 완독 임팩트 기록
 * Base: /api/impact
 *
 * POST /        — 임팩트 저장
 * GET  /:journey_id — 여정 임팩트 목록
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const VALID_EMOTIONS = ['moved', 'resonated', 'encouraged', 'reflective', 'calm',
                        'light', 'clear', 'unknown', 'hope'];
const VALID_ACTIONS  = ['create_star', 'share', 'reflect', 'just_felt',
                        'continue', 'action', 'connect', 'rest'];

// ── POST / — 임팩트 저장 ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { journey_id, storybook_id, access_key,
          emotion_result, action_type, impact_level } = req.body;

  // 기본 유효성 (모두 선택사항이지만 최소 하나는 있어야)
  if (!journey_id && !storybook_id && !access_key) {
    return res.status(400).json({ success: false, error: '식별자 누락' });
  }

  const level = impact_level ? parseInt(impact_level, 10) : null;
  if (level !== null && (level < 1 || level > 5)) {
    return res.status(400).json({ success: false, error: 'impact_level 범위 초과 (1~5)' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO impacts
         (journey_id, storybook_id, access_key, emotion_result, action_type, impact_level)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, created_at`,
      [
        journey_id   || null,
        storybook_id || null,
        access_key   || null,
        VALID_EMOTIONS.includes(emotion_result) ? emotion_result : null,
        VALID_ACTIONS.includes(action_type)     ? action_type    : null,
        level,
      ]
    );
    return res.status(201).json({ success: true, id: rows[0].id, created_at: rows[0].created_at });
  } catch (err) {
    if (err.code === '42P01') {
      return res.status(503).json({ success: false, error: 'migration 171 미실행' });
    }
    console.error('[impact] POST / error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:journey_id — 여정 임팩트 조회 ──────────────────────────
router.get('/:journey_id', async (req, res) => {
  const { journey_id } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT id, emotion_result, action_type, impact_level, created_at
       FROM impacts WHERE journey_id = $1 ORDER BY created_at DESC`,
      [journey_id]
    );
    const avg = rows.length
      ? rows.reduce((s, r) => s + (r.impact_level || 0), 0) / rows.filter(r => r.impact_level).length
      : null;
    return res.json({
      success: true,
      journey_id,
      count:    rows.length,
      avg_level: avg ? Math.round(avg * 10) / 10 : null,
      items:    rows,
    });
  } catch (err) {
    if (err.code === '42P01') return res.json({ success: true, count: 0, items: [] });
    console.error('[impact] GET /:journey_id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
