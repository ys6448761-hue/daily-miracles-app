/**
 * dtSettlementRoutes.js — DreamTown 파트너 정산 API
 *
 * POST /api/dt/settlements/batch          정산 배치 실행
 * GET  /api/dt/settlements                정산 목록 (?partner_id=&status=)
 * GET  /api/dt/settlements/stats          통계
 * GET  /api/dt/settlements/:id            정산 상세 + 항목
 * POST /api/dt/settlements/:id/approve    승인 (pending → approved)
 * POST /api/dt/settlements/:id/pay        지급 완료 (approved → paid)
 */

'use strict';

const express    = require('express');
const router     = express.Router();
const settlement = require('../services/dtSettlementService');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtSettlementRoutes');

// ── POST /batch — 정산 배치 실행 ─────────────────────────────────────
// Body: { period_start?, period_end? }  (없으면 최근 30일)
router.post('/batch', async (req, res) => {
  const { period_start, period_end } = req.body ?? {};

  try {
    const result = await settlement.runBatch({
      periodStart: period_start ? new Date(period_start) : undefined,
      periodEnd:   period_end   ? new Date(period_end)   : undefined,
    });
    log.info('batch 완료', result);
    res.json({ ok: true, ...result });
  } catch (err) {
    log.error('batch 실패', { err: err.message });
    res.status(500).json({ error: '정산 배치 실행에 실패했습니다' });
  }
});

// ── GET /stats ────────────────────────────────────────────────────────
router.get('/stats', async (_req, res) => {
  try {
    const stats = await settlement.getStats();
    res.json({ ok: true, ...stats });
  } catch (err) {
    log.error('stats 실패', { err: err.message });
    res.status(500).json({ error: '통계 조회에 실패했습니다' });
  }
});

// ── GET / — 정산 목록 ────────────────────────────────────────────────
// Query: partner_id, status, limit, offset
router.get('/', async (req, res) => {
  const { partner_id, status, limit, offset } = req.query;
  try {
    const rows = await settlement.listSettlements({
      partnerId: partner_id,
      status,
      limit:  parseInt(limit,  10) || 50,
      offset: parseInt(offset, 10) || 0,
    });
    res.json({ ok: true, settlements: rows, count: rows.length });
  } catch (err) {
    log.error('목록 조회 실패', { err: err.message });
    res.status(500).json({ error: '정산 목록 조회에 실패했습니다' });
  }
});

// ── GET /:id — 정산 상세 ─────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const data = await settlement.getSettlementDetail(req.params.id);
    if (!data) return res.status(404).json({ error: '정산을 찾을 수 없습니다' });
    res.json({ ok: true, ...data });
  } catch (err) {
    log.error('상세 조회 실패', { err: err.message });
    res.status(500).json({ error: '정산 조회에 실패했습니다' });
  }
});

// ── POST /:id/approve — 승인 ─────────────────────────────────────────
router.post('/:id/approve', async (req, res) => {
  try {
    const row = await settlement.approveSettlement(req.params.id);
    log.info('정산 승인', { id: req.params.id });
    res.json({ ok: true, ...row });
  } catch (err) {
    log.error('승인 실패', { err: err.message });
    res.status(400).json({ error: err.message });
  }
});

// ── POST /:id/pay — 지급 완료 ────────────────────────────────────────
router.post('/:id/pay', async (req, res) => {
  try {
    const row = await settlement.paySettlement(req.params.id);
    log.info('정산 지급', { id: req.params.id });
    res.json({ ok: true, ...row });
  } catch (err) {
    log.error('지급 실패', { err: err.message });
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
