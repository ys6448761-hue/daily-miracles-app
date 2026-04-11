'use strict';

/**
 * starJourneyRoutes.js — Star Journey API
 *
 * POST /api/star-journey/visit          — QR 스캔 방문 기록
 * GET  /api/star-journey/summary        — 여정 현황 조회
 * POST /api/star-journey/coupon/issue   — 쿠폰 발급 (달성 항목 재발급)
 * POST /api/star-journey/coupon/redeem  — 쿠폰 사용 (파트너 어드민)
 */

const router = require('express').Router();
const {
  recordVisitAndCheck,
  getJourneySummary,
  issueCouponManual,
  redeemCoupon,
} = require('../services/starJourneyService');

// ─── QR 스캔 → 방문 기록 + 달성 체크 ───────────────────────────
router.post('/visit', async (req, res) => {
  try {
    const { user_id, partner_id, star_id } = req.body;
    if (!user_id || !partner_id) {
      return res.status(400).json({ error: 'user_id, partner_id 필수' });
    }
    const result = await recordVisitAndCheck(user_id, partner_id, star_id || null);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─── 여정 현황 조회 ─────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id 필수' });
    const summary = await getJourneySummary(user_id);
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── 쿠폰 발급 (수동 재발급) ─────────────────────────────────────
router.post('/coupon/issue', async (req, res) => {
  try {
    const { user_id, achievement_type } = req.body;
    if (!user_id || !achievement_type) {
      return res.status(400).json({ error: 'user_id, achievement_type 필수' });
    }
    const result = await issueCouponManual(user_id, achievement_type);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─── 쿠폰 사용 처리 (파트너 어드민) ─────────────────────────────
router.post('/coupon/redeem', async (req, res) => {
  try {
    const { coupon_code, partner_id } = req.body;
    if (!coupon_code || !partner_id) {
      return res.status(400).json({ error: 'coupon_code, partner_id 필수' });
    }
    const result = await redeemCoupon(coupon_code, partner_id);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

module.exports = router;
