'use strict';
/**
 * aurumRoutes.js — 아우룸 위치 잠금 기억 캡슐
 *
 * POST /api/aurum/record        → 기록 생성 (위치 + 내용 저장)
 * POST /api/aurum/record/:id/open → 열기 시도 (위치 검증 → 잠금/열림)
 * GET  /api/aurum/record/:id/meta → 잠금 상태만 (내용 미포함)
 *
 * 핵심 원칙:
 *  "이곳에서 만든 기록은 이곳에서만 열린다"
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// 기본 반경 — 환경변수로 조정 가능 (현장 구조에 따라 100~300m)
const DEFAULT_RADIUS_M = parseInt(process.env.AURUM_RADIUS_M || '200', 10);

// ── Haversine 거리 계산 (미터) ─────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R    = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlam = ((lng2 - lng1) * Math.PI) / 180;
  const a    = Math.sin(dphi / 2) ** 2
             + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ─────────────────────────────────────────────────────────────────────
// POST /api/aurum/record — 기록 생성
// ─────────────────────────────────────────────────────────────────────
router.post('/record', async (req, res) => {
  const {
    user_id,
    content,
    lat,
    lng,
    place_name = null,
    star_id    = null,
    radius_m   = DEFAULT_RADIUS_M,
  } = req.body;

  if (!user_id)            return res.status(400).json({ success: false, error: 'user_id가 필요합니다.' });
  if (!content?.trim())    return res.status(400).json({ success: false, error: '내용이 필요합니다.' });
  if (lat == null || lng == null) {
    return res.status(400).json({ success: false, error: '위치(lat, lng)가 필요합니다.' });
  }

  try {
    const r = await db.query(
      `INSERT INTO aurum_records
         (user_id, star_id, content, lat, lng, radius_m, place_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, place_name, created_at`,
      [user_id, star_id || null, content.trim(), lat, lng, radius_m, place_name]
    );
    const rec = r.rows[0];
    console.log(`[aurum] 생성 | id=${rec.id} | user=${user_id} | place=${place_name ?? '(unnamed)'}`);

    return res.json({
      success:    true,
      id:         rec.id,
      place_name: rec.place_name,
      created_at: rec.created_at,
      message:    '이 기록은 이곳에서 다시 열립니다',
    });
  } catch (err) {
    console.error('[aurum] 생성 오류:', err.message);
    return res.status(500).json({ success: false, error: '기록 저장 중 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/aurum/record/:id/meta — 잠금 상태 (내용 미포함)
// ─────────────────────────────────────────────────────────────────────
router.get('/record/:id/meta', async (req, res) => {
  try {
    const r = await db.query(
      `SELECT id, place_name, radius_m, created_at, first_opened_at
         FROM aurum_records WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, error: '기록을 찾을 수 없습니다.' });

    const rec = r.rows[0];
    return res.json({
      success:         true,
      id:              rec.id,
      place_name:      rec.place_name,
      radius_m:        rec.radius_m,
      created_at:      rec.created_at,
      ever_opened:     !!rec.first_opened_at,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// POST /api/aurum/record/:id/open — 열기 시도
// Body: { lat, lng }
// ─────────────────────────────────────────────────────────────────────
router.post('/record/:id/open', async (req, res) => {
  const { lat, lng } = req.body;

  if (lat == null || lng == null) {
    return res.status(400).json({ success: false, error: '현재 위치가 필요합니다.' });
  }

  try {
    const r = await db.query(
      `SELECT id, user_id, content, lat, lng, radius_m, place_name, created_at, first_opened_at
         FROM aurum_records WHERE id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ success: false, error: '기록을 찾을 수 없습니다.' });

    const rec      = r.rows[0];
    const distance = haversine(rec.lat, rec.lng, lat, lng);
    const canOpen  = distance <= rec.radius_m;

    console.log(`[aurum] 열기 시도 | id=${rec.id} | dist=${Math.round(distance)}m | radius=${rec.radius_m}m | result=${canOpen ? '열림' : '잠김'}`);

    if (!canOpen) {
      return res.json({
        success:    true,
        can_open:   false,
        distance_m: Math.round(distance),
        radius_m:   rec.radius_m,
        place_name: rec.place_name,
        message:    '이곳에서만 열립니다',
      });
    }

    // 최초 열림 기록
    if (!rec.first_opened_at) {
      await db.query(
        `UPDATE aurum_records SET first_opened_at = NOW() WHERE id = $1`,
        [rec.id]
      ).catch(() => {});
    }

    return res.json({
      success:         true,
      can_open:        true,
      distance_m:      Math.round(distance),
      content:         rec.content,
      place_name:      rec.place_name,
      created_at:      rec.created_at,
      first_opened_at: rec.first_opened_at,
    });
  } catch (err) {
    console.error('[aurum] 열기 오류:', err.message);
    return res.status(500).json({ success: false, error: '처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
