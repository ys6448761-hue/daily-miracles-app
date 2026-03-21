/**
 * feedbackRoutes.js — 공명 후 경량 피드백 수집
 *
 * POST /api/feedback
 *   Body: { user_id, star_id, feeling_type, reason?, comment? }
 *
 * UX 원칙:
 * - 행동 이후만 노출 (resonance 제출 직후)
 * - 3초 안에 끝나야 함
 * - 선택형 중심, comment는 선택
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const VALID_FEELINGS = ['가볍게', '깊이', '공감', '위로'];

// POST /api/feedback
router.post('/', async (req, res) => {
  try {
    const { user_id, star_id, feeling_type, reason, comment } = req.body;

    if (!feeling_type || !VALID_FEELINGS.includes(feeling_type)) {
      return res.status(400).json({ error: `feeling_type은 ${VALID_FEELINGS.join('/')} 중 하나여야 합니다` });
    }

    await db.query(
      `INSERT INTO feedback_events (user_id, star_id, feeling_type, reason, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        user_id  ?? null,
        star_id  ?? null,
        feeling_type,
        reason  ? reason.trim().slice(0, 100) : null,
        comment ? comment.trim().slice(0, 200) : null,
      ]
    );

    res.json({ ok: true });

  } catch (err) {
    console.error('[Feedback] POST / error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
