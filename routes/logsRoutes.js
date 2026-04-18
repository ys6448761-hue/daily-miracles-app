'use strict';

/**
 * logsRoutes.js — 여행 로그 시스템
 * Base path: /api/logs
 *
 * POST /  Issue 3: 로그 저장 + auto_text 생성
 */

const express  = require('express');
const router   = express.Router();
const { v4: uuidv4 } = require('uuid');

let db;
try { db = require('../database/db'); } catch (e) {}

function generateAutoText(emotion, tag) {
  if (emotion && tag) return `${emotion}한 마음으로 ${tag}을 경험했습니다`;
  if (emotion)        return `${emotion}한 순간이었습니다`;
  if (tag)            return `${tag}의 순간을 별에 새겼습니다`;
  return '이 여행의 한 조각이 별에 새겨졌습니다';
}

// ── POST / — 로그 저장 (Issue 3) ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { star_id, emotion, tag } = req.body;

    if (!star_id) return res.status(400).json({ success: false, error: 'star_id 필수' });

    // star 존재 검증
    const starRow = await db.query(`SELECT id FROM stars WHERE id = $1`, [star_id]);
    if (!starRow.rows[0])
      return res.status(404).json({ success: false, error: '별을 찾을 수 없어요' });

    const id        = uuidv4();
    const auto_text = generateAutoText(emotion, tag);

    await db.query(
      `INSERT INTO star_logs (id, star_id, emotion, tag, auto_text)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, star_id, emotion || null, tag || null, auto_text]
    );

    const row = await db.query(`SELECT * FROM star_logs WHERE id = $1`, [id]);

    res.status(201).json({
      success:   true,
      log_id:    row.rows[0].id,
      auto_text,
      created_at: row.rows[0].created_at,
    });
  } catch (e) {
    console.error('POST /api/logs error:', e.message);
    res.status(500).json({ success: false, error: '로그 저장 실패' });
  }
});

module.exports = router;
