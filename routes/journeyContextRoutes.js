/**
 * journeyContextRoutes.js — 여정 컨텍스트 저장
 *
 * POST /api/journey-contexts
 *   body: { wish_id, city_code?, date_type, people_type }
 *   res:  { context_id }
 *
 * 이벤트: save_journey_context
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const VALID_DATE_TYPES   = new Set(['today','this_week','weekend','custom']);
const VALID_PEOPLE_TYPES = new Set(['solo','couple','family','friends','group']);

router.post('/', async (req, res) => {
  const {
    wish_id,
    city_code   = 'yeosu',
    date_type,
    people_type,
    user_key,
  } = req.body ?? {};

  if (!wish_id)     return res.status(400).json({ error: 'wish_id 필요' });
  if (!date_type || !VALID_DATE_TYPES.has(date_type)) {
    return res.status(400).json({ error: `date_type 필요 (${[...VALID_DATE_TYPES].join('|')})` });
  }
  if (!people_type || !VALID_PEOPLE_TYPES.has(people_type)) {
    return res.status(400).json({ error: `people_type 필요 (${[...VALID_PEOPLE_TYPES].join('|')})` });
  }

  try {
    // wish 존재 확인
    const { rows: [wish] } = await db.query(
      `SELECT id FROM wishes WHERE id = $1`, [wish_id]
    );
    if (!wish) return res.status(400).json({ error: 'wish_id 없음' });

    // city_code 유효성 (dt_regions FK)
    const { rows: [region] } = await db.query(
      `SELECT city_code FROM dt_regions WHERE city_code = $1 AND is_active = true`,
      [city_code]
    );
    if (!region) return res.status(400).json({ error: `city_code '${city_code}' 없음` });

    const { rows: [ctx] } = await db.query(
      `INSERT INTO journey_contexts (wish_id, city_code, date_type, people_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [wish_id, city_code, date_type, people_type]
    );

    db.query(
      `INSERT INTO dt_events (user_id, event_name, params) VALUES ($1, $2, $3)`,
      [user_key ?? null, 'save_journey_context', { wish_id, context_id: ctx.id, city_code, date_type, people_type }]
    ).catch(() => {});

    return res.status(201).json({ context_id: ctx.id });
  } catch (e) {
    console.error('[journeyContext] POST error:', e.message);
    return res.status(500).json({ error: '컨텍스트 저장 실패' });
  }
});

module.exports = router;
