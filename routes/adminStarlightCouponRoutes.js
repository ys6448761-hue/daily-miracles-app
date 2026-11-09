/**
 * PHX-COUPON-004 — 별빛쿠폰 관리자 API
 *
 * GET  /api/admin/starlight-coupons/stats   발급/사용 집계
 * GET  /api/admin/starlight-coupons/list    목록 (최신순, 최대 200건)
 *
 * 인증: x-admin-key 헤더 또는 ?key= 쿼리 (ADMIN_API_KEY 환경변수)
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

function adminGuard(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!process.env.ADMIN_API_KEY) {
    return res.status(503).json({ ok: false, error: 'admin disabled — ADMIN_API_KEY not configured' });
  }
  if (key === process.env.ADMIN_API_KEY) return next();
  return res.status(401).json({ ok: false, error: '관리자 인증 필요 (x-admin-key 헤더 또는 ?key=)' });
}

// ── GET /api/admin/starlight-coupons/stats ───────────────────────────────────
router.get('/stats', adminGuard, async (req, res) => {
  try {
    const db = getDb();
    let stats;

    if (db.isPostgres) {
      const r = await db.query(`
        SELECT
          COUNT(DISTINCT c.id)                            AS total_issued,
          COUNT(DISTINCT u.coupon_id)                     AS total_used,
          COUNT(DISTINCT CASE WHEN c.viewed_at IS NOT NULL THEN c.id END) AS total_viewed,
          COUNT(DISTINCT CASE WHEN c.hotel_source = 'kenny' THEN c.id END) AS kenny_issued
        FROM starlight_coupons c
        LEFT JOIN starlight_coupon_uses u ON u.coupon_id = c.id
      `);
      stats = r.rows[0];
    } else {
      stats = await db.get(`
        SELECT
          COUNT(DISTINCT c.id)                                      AS total_issued,
          COUNT(DISTINCT u.coupon_id)                               AS total_used,
          COUNT(DISTINCT CASE WHEN c.viewed_at IS NOT NULL THEN c.id ELSE NULL END) AS total_viewed,
          COUNT(DISTINCT CASE WHEN c.hotel_source = 'kenny' THEN c.id ELSE NULL END) AS kenny_issued
        FROM starlight_coupons c
        LEFT JOIN starlight_coupon_uses u ON u.coupon_id = c.id
      `);
    }

    return res.json({
      ok: true,
      stats: {
        total_issued:  Number(stats.total_issued),
        total_viewed:  Number(stats.total_viewed),
        total_used:    Number(stats.total_used),
        kenny_issued:  Number(stats.kenny_issued),
        use_rate: stats.total_issued > 0
          ? Math.round((stats.total_used / stats.total_issued) * 1000) / 10
          : 0,
      },
    });
  } catch (err) {
    console.error('[admin-starlight-coupon] stats error:', err.message);
    return res.status(500).json({ ok: false, error: '집계 조회 실패' });
  }
});

// ── GET /api/admin/starlight-coupons/list ────────────────────────────────────
router.get('/list', adminGuard, async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '100', 10), 200);
  const venue = req.query.venue || null;

  try {
    const db = getDb();
    let rows;

    if (db.isPostgres) {
      const params = venue ? [venue, limit] : [limit];
      const whereClause = venue ? 'WHERE c.venue_id = $1' : '';
      const limitParam  = venue ? '$2' : '$1';
      const r = await db.query(`
        SELECT c.id, c.hotel_source, c.venue_id, c.issued_at, c.viewed_at, c.is_active,
               c.failed_attempts,
               u.confirmed_at AS used_at
        FROM starlight_coupons c
        LEFT JOIN starlight_coupon_uses u ON u.coupon_id = c.id
        ${whereClause}
        ORDER BY c.issued_at DESC
        LIMIT ${limitParam}
      `, params);
      rows = r.rows;
    } else {
      const params = venue ? [venue, limit] : [limit];
      const whereClause = venue ? 'WHERE c.venue_id = ?' : '';
      rows = await db.all(`
        SELECT c.id, c.hotel_source, c.venue_id, c.issued_at, c.viewed_at, c.is_active,
               c.failed_attempts,
               u.confirmed_at AS used_at
        FROM starlight_coupons c
        LEFT JOIN starlight_coupon_uses u ON u.coupon_id = c.id
        ${whereClause}
        ORDER BY c.issued_at DESC
        LIMIT ?
      `, params);
    }

    return res.json({
      ok: true,
      count: rows.length,
      coupons: rows.map(r => ({
        id:              r.id,
        hotel_source:    r.hotel_source,
        venue_id:        r.venue_id,
        issued_at:       r.issued_at,
        viewed_at:       r.viewed_at || null,
        is_active:       Boolean(r.is_active),
        is_used:         !!r.used_at,
        used_at:         r.used_at || null,
        failed_attempts: Number(r.failed_attempts || 0),
      })),
    });
  } catch (err) {
    console.error('[admin-starlight-coupon] list error:', err.message);
    return res.status(500).json({ ok: false, error: '목록 조회 실패' });
  }
});

module.exports = router;
