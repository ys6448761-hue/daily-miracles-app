/**
 * starVoyageRoutes.js — 케이블카 Star 항해 결제 MVP
 * prefix: /api/star-voyage
 *
 * POST /create  — 항해 생성 + NicePay 결제 준비
 * GET  /:id     — 항해 상태 조회
 */

'use strict';

const router = require('express').Router();
const db     = require('../database/db');

let nicepayService = null;
try {
  nicepayService = require('../services/nicepayService');
} catch (_) {
  console.warn('[StarVoyage] nicepayService 로드 실패 — 결제 기능 비활성');
}

const VALID_TYPES = new Set(['rest', 'reflect', 'move']);
const AMOUNT      = 35000;
const GOODS_NAME  = '항해 프로그램 — 나만의 시간';

// ── POST /create ──────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { type, phone_number, star_id = null, name = null } = req.body;

    if (!type || !phone_number) {
      return res.status(400).json({ success: false, error: 'type, phone_number 필수' });
    }
    if (!VALID_TYPES.has(type)) {
      return res.status(400).json({ success: false, error: 'type은 rest / reflect / move 중 하나' });
    }
    if (!nicepayService) {
      return res.status(503).json({ success: false, error: '결제 서비스 비활성' });
    }

    const pgConfig = nicepayService.validateConfig();
    if (!pgConfig.isValid) {
      return res.status(503).json({ success: false, error: '결제 설정 미완료', missing: pgConfig.missing });
    }

    // 1. voyage 생성 (pending)
    const { rows } = await db.query(
      `INSERT INTO voyages (star_id, type, status, phone_number, name)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING id`,
      [star_id || null, type, phone_number.trim(), name?.trim() || null]
    );
    const voyageId = rows[0].id;

    // 2. NicePay 결제 생성 (nicepay_payments 에 PENDING 레코드)
    const payment = await nicepayService.createPayment(AMOUNT, GOODS_NAME);

    // 3. voyage에 pg_order_id 저장
    await db.query(
      `UPDATE voyages SET pg_order_id = $1 WHERE id = $2`,
      [payment.orderId, voyageId]
    );

    return res.status(201).json({
      success:     true,
      voyage_id:   voyageId,
      moid:        payment.orderId,
      amount:      AMOUNT,
      payment_url: `/pay?moid=${encodeURIComponent(payment.orderId)}`,
    });
  } catch (err) {
    console.error('[StarVoyage] POST /create error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, star_id, type, status, created_at, paid_at FROM voyages WHERE id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: '항해를 찾을 수 없습니다' });
    }
    return res.json({ success: true, voyage: rows[0] });
  } catch (err) {
    console.error('[StarVoyage] GET /:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
