'use strict';

/**
 * partnerApplyRoutes.js
 *
 * POST /api/partner/apply          신청서 제출 + 즉시 심사
 * GET  /api/partner/apply/:id      신청 상태 조회
 * GET  /api/partner/apply/questions 5문항 조회 (프론트 SSOT)
 */

const express = require('express');
const router  = express.Router();
const { submitApplication } = require('../services/partnerApplyService');
const { QUESTIONS }         = require('../services/auroraInterviewService');

// ──────────────────────────────────────────────────────────────
// GET /api/partner/apply/questions
// ──────────────────────────────────────────────────────────────
router.get('/apply/questions', (_req, res) => {
  return res.json({ questions: QUESTIONS });
});

// ──────────────────────────────────────────────────────────────
// POST /api/partner/apply
// Body: { business_name, owner_name, phone, region_code,
//         q1_space_intro, q2_wish_connection, q3_galaxy_choice,
//         q4_promise, q5_operations }
// ──────────────────────────────────────────────────────────────
router.post('/apply', async (req, res) => {
  const { business_name, owner_name, phone, q3_galaxy_choice } = req.body;

  if (!business_name || !owner_name || !phone) {
    return res.status(400).json({ error: '업체명, 사장님 성함, 연락처는 필수입니다.' });
  }
  if (!q3_galaxy_choice) {
    return res.status(400).json({ error: '별의 집(은하)을 선택해주세요.' });
  }

  try {
    const result = await submitApplication(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error('[partnerApply] POST /apply 오류:', err.message);
    return res.status(500).json({ error: '신청 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' });
  }
});

// ──────────────────────────────────────────────────────────────
// GET /api/partner/apply/:id
// ──────────────────────────────────────────────────────────────
router.get('/apply/:id', async (req, res) => {
  const db = require('../database/db');
  try {
    const { rows } = await db.query(
      `SELECT id, business_name, owner_name, aurora_verdict, aurora_score,
              partner_id, account_created_at, applied_at, decided_at
         FROM partner_applications WHERE id = $1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: '신청 내역을 찾을 수 없습니다.' });
    return res.json(rows[0]);
  } catch (err) {
    console.error('[partnerApply] GET /apply/:id 오류:', err.message);
    return res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
