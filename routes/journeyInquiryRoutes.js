'use strict';
/**
 * journeyInquiryRoutes.js
 * prefix: /api/journey-inquiry
 *
 * POST /   — 여수 소원여정 예약/문의 접수
 *            body: { name, phone, star_id? }
 */

const router = require('express').Router();
const db     = require('../database/db');

// 테이블 보장 (migration 없이 자동 생성)
;(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS journey_inquiries (
        id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name       VARCHAR(50) NOT NULL,
        phone      VARCHAR(30) NOT NULL,
        star_id    UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  } catch (e) {
    console.warn('[journey-inquiry] 테이블 초기화 실패:', e.message);
  }
})();

router.post('/', async (req, res) => {
  const { name, phone, star_id } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, error: '이름을 입력해주세요' });
  }
  if (!phone || !phone.trim()) {
    return res.status(400).json({ success: false, error: '연락처를 입력해주세요' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO journey_inquiries (name, phone, star_id)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [name.trim(), phone.trim(), star_id || null]
    );
    console.log(`[journey-inquiry] 예약 접수 | ${rows[0].id} | ${phone.trim()}`);
    return res.status(201).json({ success: true, inquiry_id: rows[0].id });
  } catch (e) {
    console.error('[journey-inquiry] 저장 실패:', e.message);
    return res.status(500).json({ success: false, error: '접수 중 오류가 발생했어요' });
  }
});

module.exports = router;
