/**
 * wishCoreRoutes.js — 소원 저장
 *
 * POST /api/wishes
 *   body: { wish_text, gem_type?, user_key? }
 *   res:  { wish_id }
 *
 * 이벤트: submit_wish 로그 (dt_flow_events)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

router.post('/', async (req, res) => {
  const { wish_text, gem_type, user_key } = req.body ?? {};

  if (!wish_text || !wish_text.trim()) {
    return res.status(400).json({ error: 'wish_text 필요' });
  }
  if (wish_text.length > 500) {
    return res.status(400).json({ error: 'wish_text 500자 이하' });
  }

  try {
    const { rows: [wish] } = await db.query(
      `INSERT INTO wishes (wish_text, gem_type, user_key)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [wish_text.trim(), gem_type ?? null, user_key ?? null]
    );

    db.query(
      `INSERT INTO dt_events (user_id, event_name, params) VALUES ($1, $2, $3)`,
      [user_key ?? null, 'submit_wish', { wish_id: wish.id, gem_type }]
    ).catch(() => {});

    return res.status(201).json({ wish_id: wish.id });
  } catch (e) {
    console.error('[wishCore] POST /wishes error:', e.message);
    return res.status(500).json({ error: '소원 저장 실패' });
  }
});

module.exports = router;
