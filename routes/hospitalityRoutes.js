'use strict';
/**
 * hospitalityRoutes — GET /api/dt/lumi/hospitality
 *
 * Returns hospitality preview for an INDIVIDUAL journey (guestCount 1–4).
 * GROUP journeys (5+) receive eligible=false — no benefits exposed.
 *
 * V0.1 state: PREVIEW only.
 * AVAILABLE state requires server-confirmed payment linkage (not yet built).
 *
 * Security:
 * - guestCount must come from Commerce quote, validated server-side
 * - payment status is NOT accepted from client — no "paid=true" bypass
 * - No redemption credential is returned in PREVIEW state
 */

const express = require('express');
const router = express.Router();
const { getHospitalityPreview, checkHospitalityEligibility } = require('../services/hospitalityService');

// GET /api/dt/lumi/hospitality?guest_count=2&city=yeosu
router.get('/hospitality', async (req, res) => {
  const rawGuestCount = req.query.guest_count;
  const city_code = (req.query.city || 'yeosu').replace(/[^a-z]/gi, '').toLowerCase() || 'yeosu';

  // Validate guest_count — must be a positive integer from the Commerce quote
  const guestCount = parseInt(rawGuestCount, 10);
  if (!Number.isFinite(guestCount) || guestCount < 1) {
    return res.status(400).json({
      error: 'HOSPITALITY_ERROR',
      message: 'guest_count is required (positive integer from Commerce quote)'
    });
  }

  try {
    const result = await getHospitalityPreview({ guestCount, city_code });
    return res.json(result);
  } catch (err) {
    console.error('[hospitalityRoutes] getHospitalityPreview failed:', err.message);
    return res.status(500).json({
      error: 'HOSPITALITY_ERROR',
      message: '환대 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    });
  }
});

module.exports = router;
