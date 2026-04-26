/**
 * starMvpRoutes.js — Star MVP (케이블카 QR 진입)
 * prefix: /api/star
 *
 * POST /create          — 별 생성 (익명, access_key 발급)
 * POST /promise         — 약속 저장 (3m / 6m / 12m)
 * POST /reflect         — 재방문 시 현재 상태 기록 (closer|same|changed)
 * GET  /:access_key     — 별 + 약속 + 최근 reflection 조회 (재방문)
 */

'use strict';

const router = require('express').Router();
const crypto = require('crypto');
const db     = require('../database/db');

let emitKpiEvent = null;
try { ({ emitKpiEvent } = require('../services/kpiEventEmitter')); } catch (_) {}

// URL-safe 10자리 접근키 (모호한 문자 제외)
function generateAccessKey() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(10);
  let key = '';
  for (let i = 0; i < 10; i++) key += chars[bytes[i] % chars.length];
  return key;
}

// ── POST /create ─────────────────────────────────────────────────
router.post('/create', async (req, res) => {
  try {
    const { emotion, origin_location = 'cablecar', phone_number } = req.body;

    // access_key 충돌 시 재시도 (최대 3회)
    let access_key, inserted;
    for (let i = 0; i < 3; i++) {
      access_key = generateAccessKey();
      try {
        const { rows } = await db.query(
          `INSERT INTO stars
             (id, user_id, wish_text, gem_type, status, access_key, origin_location, emotion, is_public, phone_number)
           VALUES
             (gen_random_uuid(), $1, $2, 'cablecar', 'PRE-ON', $3, $4, $5, false, $6)
           RETURNING id, access_key, created_at`,
          [
            crypto.randomUUID(),
            emotion || '케이블카 별',
            access_key,
            origin_location,
            emotion || null,
            phone_number || null,
          ]
        );
        inserted = rows[0];
        break;
      } catch (e) {
        if (e.code === '23505' && i < 2) continue; // unique 충돌 → 재시도
        // migration 135 미실행 시 phone_number 컬럼 없음 → 없이 재시도
        if (e.code === '42703' && e.message.includes('phone_number')) {
          const { rows: rows2 } = await db.query(
            `INSERT INTO stars
               (id, user_id, wish_text, gem_type, status, access_key, origin_location, emotion, is_public)
             VALUES
               (gen_random_uuid(), $1, $2, 'cablecar', 'PRE-ON', $3, $4, $5, false)
             RETURNING id, access_key, created_at`,
            [crypto.randomUUID(), emotion || '케이블카 별', access_key, origin_location, emotion || null]
          );
          inserted = rows2[0];
          break;
        }
        throw e;
      }
    }

    // KPI emit — dt_kpi_events에 star_created 기록 (DreamTown 관제판 연동)
    if (emitKpiEvent) {
      emitKpiEvent({
        eventName: 'star_created',
        starId:    inserted.id,
        source:    'qr_star_entry',
        extra:     { origin_location, table: 'stars' },
      }).catch(() => {});
    }

    return res.status(201).json({
      success:    true,
      star_id:    inserted.id,
      access_key: inserted.access_key,
      created_at: inserted.created_at,
    });
  } catch (err) {
    console.error('[star-mvp] POST /create error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /promise ─────────────────────────────────────────────────
router.post('/promise', async (req, res) => {
  try {
    const { star_id, type, content, reminder_opt_in = false } = req.body;

    if (!star_id || !type || !content) {
      return res.status(400).json({ success: false, error: 'star_id, type, content 필수' });
    }
    if (!['3m', '6m', '12m'].includes(type)) {
      return res.status(400).json({ success: false, error: 'type은 3m / 6m / 12m 중 하나' });
    }

    // 별 존재 확인
    const { rows: starRows } = await db.query(
      'SELECT id FROM stars WHERE id = $1',
      [star_id]
    );
    if (!starRows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다.' });
    }

    const { rows } = await db.query(
      `INSERT INTO star_promises (star_id, type, content, reminder_opt_in, target_date)
       VALUES ($1, $2, $3, $4,
         CASE $2::text
           WHEN '3m'  THEN NOW() + INTERVAL '3 months'
           WHEN '6m'  THEN NOW() + INTERVAL '6 months'
           WHEN '12m' THEN NOW() + INTERVAL '12 months'
         END
       )
       RETURNING id, star_id, type, content, reminder_opt_in, target_date, created_at`,
      [star_id, type, content, !!reminder_opt_in]
    );

    return res.status(201).json({ success: true, promise: rows[0] });
  } catch (err) {
    console.error('[star-mvp] POST /promise error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── POST /reflect ─────────────────────────────────────────────────
router.post('/reflect', async (req, res) => {
  try {
    const { star_id, status } = req.body;

    if (!star_id || !status) {
      return res.status(400).json({ success: false, error: 'star_id, status 필수' });
    }
    if (!['closer', 'same', 'changed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status는 closer / same / changed 중 하나' });
    }

    const { rows: starRows } = await db.query('SELECT id FROM stars WHERE id = $1', [star_id]);
    if (!starRows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다.' });
    }

    const { rows } = await db.query(
      `INSERT INTO star_reflections (star_id, status) VALUES ($1, $2)
       RETURNING id, star_id, status, created_at`,
      [star_id, status]
    );

    return res.status(201).json({ success: true, reflection: rows[0] });
  } catch (err) {
    console.error('[star-mvp] POST /reflect error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /:access_key ──────────────────────────────────────────────
router.get('/:access_key', async (req, res) => {
  try {
    const { access_key } = req.params;

    const { rows: starRows } = await db.query(
      `SELECT id, access_key, origin_location, emotion, is_public, status, created_at
       FROM stars WHERE access_key = $1`,
      [access_key]
    );
    if (!starRows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다.' });
    }
    const star = starRows[0];

    const { rows: promises } = await db.query(
      `SELECT id, type, content, reminder_opt_in, target_date, created_at
       FROM star_promises WHERE star_id = $1
       ORDER BY created_at`,
      [star.id]
    );

    // 가장 최근 reflection (있으면)
    const { rows: reflRows } = await db.query(
      `SELECT status, created_at FROM star_reflections
       WHERE star_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [star.id]
    ).catch(() => ({ rows: [] }));
    const lastReflection = reflRows[0] ?? null;

    return res.json({ success: true, star, promises, last_reflection: lastReflection });
  } catch (err) {
    console.error('[star-mvp] GET /:access_key error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
