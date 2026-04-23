'use strict';
/**
 * adminCablecarRoutes.js — 케이블카 오프라인 운영 관리 API
 *
 * GET /api/admin/cablecar/today  — 오늘 현황 (신규별, 각성, 최근 피드)
 * GET /api/admin/cablecar/stars  — 별 전체 목록 (origin_type = 'cablecar')
 * GET /api/admin/cablecar/ops    — QR / 운영 설정 상태
 *
 * ✅ 집계 기준 SSOT: origin_type = 'cablecar'  (cablecarRoutes.js ORIGIN_TYPE 상수와 동일)
 * ✅ 신규 테이블 없음 — dt_stars + dt_wishes 재사용
 *
 * 인증: X-Admin-Token 헤더 (ADMIN_TOKEN 환경변수 — 미설정 시 로컬 통과)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const ORIGIN_TYPE = 'cablecar'; // SSOT — cablecarRoutes.js 와 동일

// ── 관리자 인증 ─────────────────────────────────────────────────────
function adminGuard(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token && token === process.env.ADMIN_TOKEN) return next();
  if (!process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ error: '관리자 인증 필요' });
}
router.use(adminGuard);

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/cablecar/today — Tab 1: 오늘 현황
// ─────────────────────────────────────────────────────────────────────
router.get('/today', async (req, res) => {
  try {
    const [kpiR, feedR] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*)                                                      AS total_all,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)           AS new_today,
          COUNT(*) FILTER (WHERE awakened_at >= CURRENT_DATE)          AS awakened_today,
          COUNT(*) FILTER (WHERE status = 'awakened')                  AS total_awakened,
          COUNT(*) FILTER (WHERE status = 'growing')                   AS total_growing,
          COUNT(*) FILTER (WHERE status = 'created')                   AS total_pending
        FROM dt_stars
        WHERE origin_type = $1
      `, [ORIGIN_TYPE]),

      db.query(`
        SELECT
          s.id,
          s.star_name,
          s.status,
          s.origin_place,
          s.awakened_at,
          s.created_at,
          LEFT(w.wish_text, 40)  AS wish_preview
        FROM dt_stars s
        LEFT JOIN dt_wishes w ON w.id = s.wish_id
        WHERE s.origin_type = $1
        ORDER BY s.created_at DESC
        LIMIT 15
      `, [ORIGIN_TYPE]),
    ]);

    const k = kpiR.rows[0];
    res.json({
      success: true,
      origin_type: ORIGIN_TYPE,
      kpi: {
        new_today:      Number(k.new_today),
        awakened_today: Number(k.awakened_today),
        total_all:      Number(k.total_all),
        total_awakened: Number(k.total_awakened),
        total_growing:  Number(k.total_growing),
        total_pending:  Number(k.total_pending),
      },
      feed: feedR.rows,
    });
  } catch (err) {
    console.error('[adminCablecar/today] 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/cablecar/stars — Tab 2: 별 현황
// ─────────────────────────────────────────────────────────────────────
router.get('/stars', async (req, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 100, 200);
  const offset = Math.max(Number(req.query.offset) || 0,   0);
  const status = req.query.status; // 필터 (선택)

  try {
    const params = [ORIGIN_TYPE, limit, offset];
    const where  = status ? `AND s.status = $4` : '';
    if (status) params.push(status);

    const r = await db.query(`
      SELECT
        s.id,
        s.star_name,
        s.status,
        s.awaken_count,
        s.origin_place,
        s.star_stage,
        s.awakened_at,
        s.created_at,
        LEFT(w.wish_text, 60) AS wish_preview
      FROM dt_stars s
      LEFT JOIN dt_wishes w ON w.id = s.wish_id
      WHERE s.origin_type = $1
        ${where}
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `, params);

    const total = await db.query(
      `SELECT COUNT(*) FROM dt_stars WHERE origin_type = $1`,
      [ORIGIN_TYPE]
    );

    res.json({
      success:     true,
      origin_type: ORIGIN_TYPE,
      total:       Number(total.rows[0].count),
      limit,
      offset,
      stars:       r.rows,
    });
  } catch (err) {
    console.error('[adminCablecar/stars] 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/cablecar/ops — Tab 3: QR / 운영 설정
// ─────────────────────────────────────────────────────────────────────
router.get('/ops', async (req, res) => {
  try {
    const r = await db.query(`
      SELECT
        COUNT(*)                                         AS total_stars,
        COUNT(*) FILTER (WHERE status = 'awakened')     AS awakened,
        COUNT(*) FILTER (WHERE status = 'growing')      AS growing,
        COUNT(*) FILTER (WHERE status = 'created')      AS pending,
        MIN(created_at)                                  AS first_star_at,
        MAX(created_at)                                  AS last_star_at
      FROM dt_stars
      WHERE origin_type = $1
    `, [ORIGIN_TYPE]);

    const row = r.rows[0];
    res.json({
      success: true,
      origin_type:      ORIGIN_TYPE,
      ssot_field:       'dt_stars.origin_type',
      payment_enabled:  process.env.CABLECAR_PAYMENT_ENABLED === 'true',
      qr_url:           'https://app.dailymiracles.kr/entry?loc=cablecar',
      qr_image_path:    '/qr/QR_케이블카_체험입장.png',
      qr_download_name: 'QR_케이블카_체험입장.png',
      stats: {
        total_stars:  Number(row.total_stars),
        awakened:     Number(row.awakened),
        growing:      Number(row.growing),
        pending:      Number(row.pending),
        first_star_at: row.first_star_at,
        last_star_at:  row.last_star_at,
      },
    });
  } catch (err) {
    console.error('[adminCablecar/ops] 오류:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
