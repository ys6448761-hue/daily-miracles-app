'use strict';
/**
 * adminCablecarRoutes.js — 케이블카 오프라인 운영 관리 API
 *
 * GET /api/admin/cablecar/today  — 오늘 현황 (신규별, 각성, 최근 피드)
 * GET /api/admin/cablecar/stars  — 별 전체 목록
 * GET /api/admin/cablecar/ops    — QR / 운영 설정 상태
 *
 * ✅ 집계 기준 SSOT: stars.origin_location = 'yeosu-cablecar'
 * ✅ dt_stars 는 legacy — 신규 읽기/쓰기 금지
 *
 * 인증: X-Admin-Token 헤더 또는 ?token= (ADMIN_TOKEN 환경변수 — 미설정 시 로컬 통과)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const ORIGIN_LOCATION = 'yeosu_cablecar'; // SSOT — star-entry.html ?loc=yeosu_cablecar 저장값과 동일

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
          COUNT(*)                                               AS total_all,
          COUNT(*) FILTER (WHERE created_at  >= CURRENT_DATE)   AS new_today,
          COUNT(*) FILTER (WHERE activated_at >= CURRENT_DATE)  AS awakened_today,
          COUNT(*) FILTER (WHERE activated_at IS NOT NULL)      AS total_awakened,
          0                                                     AS total_growing,
          COUNT(*) FILTER (WHERE activated_at IS NULL)          AS total_pending
        FROM stars
        WHERE origin_location = $1
      `, [ORIGIN_LOCATION]),

      db.query(`
        SELECT
          s.id,
          COALESCE(s.access_key, LEFT(s.id::text, 8)) AS star_name,
          s.status,
          s.origin_location  AS origin_place,
          s.activated_at     AS awakened_at,
          s.created_at,
          LEFT(s.wish_text, 40) AS wish_preview
        FROM stars s
        WHERE s.origin_location = $1
        ORDER BY s.created_at DESC
        LIMIT 15
      `, [ORIGIN_LOCATION]),
    ]);

    const k = kpiR.rows[0];
    res.json({
      success: true,
      origin_location: ORIGIN_LOCATION,
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
    if (err.code === '42P01') return res.status(503).json({ success: false, error: 'stars 테이블 초기화 중', migration: '124' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/cablecar/stars — Tab 2: 별 현황
// ─────────────────────────────────────────────────────────────────────
router.get('/stars', async (req, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 100, 200);
  const offset = Math.max(Number(req.query.offset) || 0,   0);
  const status = req.query.status;

  try {
    const params = [ORIGIN_LOCATION, limit, offset];
    const where  = status ? `AND s.status = $4` : '';
    if (status) params.push(status);

    const r = await db.query(`
      SELECT
        s.id,
        COALESCE(s.access_key, LEFT(s.id::text, 8)) AS star_name,
        s.status,
        0                  AS awaken_count,
        s.origin_location  AS origin_place,
        NULL               AS star_stage,
        s.activated_at     AS awakened_at,
        s.created_at,
        LEFT(s.wish_text, 60) AS wish_preview
      FROM stars s
      WHERE s.origin_location = $1
        ${where}
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `, params);

    const total = await db.query(
      `SELECT COUNT(*) FROM stars WHERE origin_location = $1`,
      [ORIGIN_LOCATION]
    );

    res.json({
      success:         true,
      origin_location: ORIGIN_LOCATION,
      total:           Number(total.rows[0].count),
      limit,
      offset,
      stars:           r.rows,
    });
  } catch (err) {
    console.error('[adminCablecar/stars] 오류:', err.message);
    if (err.code === '42P01') return res.status(503).json({ success: false, error: 'stars 테이블 초기화 중', migration: '124' });
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
        COUNT(*) FILTER (WHERE activated_at IS NOT NULL) AS awakened,
        COUNT(*) FILTER (WHERE activated_at IS NULL)     AS pending,
        MIN(created_at)                                  AS first_star_at,
        MAX(created_at)                                  AS last_star_at
      FROM stars
      WHERE origin_location = $1
    `, [ORIGIN_LOCATION]);

    const row = r.rows[0];
    res.json({
      success: true,
      origin_location:  ORIGIN_LOCATION,
      ssot_field:       'stars.origin_location',
      payment_enabled:  process.env.CABLECAR_PAYMENT_ENABLED === 'true',
      qr_url:           'https://app.dailymiracles.kr/star-entry.html?loc=yeosu_cablecar', // DB 저장값 yeosu_cablecar
      qr_image_path:    '/qr/QR_케이블카_체험입장.png',
      qr_download_name: 'QR_케이블카_체험입장.png',
      stats: {
        total_stars:   Number(row.total_stars),
        awakened:      Number(row.awakened),
        growing:       0,
        pending:       Number(row.pending),
        first_star_at: row.first_star_at,
        last_star_at:  row.last_star_at,
      },
    });
  } catch (err) {
    console.error('[adminCablecar/ops] 오류:', err.message);
    if (err.code === '42P01') return res.status(503).json({ success: false, error: 'stars 테이블 초기화 중', migration: '124' });
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
