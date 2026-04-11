/**
 * recommendationRoutes.js — 여정 추천 1개 반환
 *
 * POST /api/recommendation
 *   body: { wish_id, context_id, user_key? }
 *   res:  { recommended_product, customizable }
 *
 * 이벤트: view_recommendation
 */

'use strict';

const express = require('express');
const router  = express.Router();
const { recommend } = require('../services/journeyRecommendService');
const db = require('../database/db');

router.post('/', async (req, res) => {
  const { wish_id, context_id, user_key } = req.body ?? {};

  if (!wish_id)    return res.status(400).json({ error: 'wish_id 필요' });
  if (!context_id) return res.status(400).json({ error: 'context_id 필요' });

  try {
    const { product, routeType, reason } = await recommend({ wishId: wish_id, contextId: context_id });

    db.query(
      `INSERT INTO dt_events (user_id, event_name, params) VALUES ($1, $2, $3)`,
      [user_key ?? null, 'view_recommendation', { wish_id, context_id, product_id: product.id, route_type: routeType }]
    ).catch(() => {});

    return res.json({
      recommended_product: {
        product_id: product.id,
        route_type: product.route_type,
        title:      product.title,
        base_price: product.base_price ?? product.price,
        reason,
      },
      customizable: true,
    });
  } catch (e) {
    const status = e.status ?? 500;
    console.error('[recommendation] POST error:', e.message);
    return res.status(status).json({ error: e.message });
  }
});

module.exports = router;
