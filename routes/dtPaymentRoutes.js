'use strict';

/**
 * dtPaymentRoutes.js
 * 등록 위치: /api/payment/nicepay
 *
 * POST /request   — Day 8 Flow 플랜 결제 요청 생성
 */

const express    = require('express');
const router     = express.Router();
const dtPayment  = require('../services/dt/dtPaymentService');
const { makeLogger } = require('../utils/logger');
const log = makeLogger('dtPaymentRoutes');

// ══════════════════════════════════════════════════════════════
// POST /api/payment/nicepay/request
// Body: { user_id }
// Response: { order_id, redirect_url, amount }
// ══════════════════════════════════════════════════════════════
router.post('/request', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id 필수' });

  try {
    const result = await dtPayment.requestPayment(user_id);
    return res.status(201).json({ success: true, ...result });
  } catch (err) {
    log.error('Day8 결제 요청 실패', { err: err.message });
    return res.status(500).json({ error: '결제 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' });
  }
});

module.exports = router;
