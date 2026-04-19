'use strict';

/**
 * dtLifeSpotRoutes.js
 * 등록 위치: /api/dt/life-spots
 *
 * POST /              장소 등록
 * GET  /              장소 목록 (user_id query)
 */

const express    = require('express');
const router     = express.Router();
const lifeSpot   = require('../services/dt/lifeSpotService');
const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtLifeSpotRoutes');

// POST /api/dt/life-spots
router.post('/', async (req, res) => {
  const { user_id, spot_name, spot_type, is_favorite } = req.body;
  if (!user_id || !spot_name || !spot_type) {
    return res.status(400).json({ error: 'user_id, spot_name, spot_type 필수' });
  }
  try {
    const spot = await lifeSpot.createSpot({ userId: user_id, spotName: spot_name, spotType: spot_type, isFavorite: is_favorite });
    return res.status(201).json({ success: true, spot });
  } catch (err) {
    log.error('장소 등록 실패', { err: err.message });
    return res.status(500).json({ error: '장소 등록에 실패했습니다' });
  }
});

// GET /api/dt/life-spots?user_id=uuid
router.get('/', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id 필수' });
  try {
    const spots = await lifeSpot.listSpots(user_id);
    return res.json({ success: true, spots, count: spots.length });
  } catch (err) {
    log.error('장소 목록 조회 실패', { err: err.message });
    return res.status(500).json({ error: '장소 목록 조회에 실패했습니다' });
  }
});

module.exports = router;
