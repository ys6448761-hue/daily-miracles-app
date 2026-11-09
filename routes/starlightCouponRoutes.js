/**
 * PHX-COUPON-004 — 별빛쿠폰 고객용 API
 *
 * POST /api/starlight-coupon/issue      쿠폰 발급 (hotel_source + venue_id)
 * GET  /api/starlight-coupon/:id        쿠폰 조회 (고객 화면 로드 시)
 * POST /api/starlight-coupon/:id/redeem PIN 입력 → 사용 확인
 *
 * 환경변수:
 *   COUPON_PIN             공통 확인번호 (기본값 '1234')
 *   COUPON_MAX_ATT         PIN 시도 최대 횟수 (기본값 5)
 *   COUPON_VENUE_ALLOWLIST Founder 승인 가맹점 ID 목록 (comma-separated, 미설정 = 전부 차단)
 *                          예: "kenny_001,ramada_001"
 *                          test_* prefix는 NODE_ENV !== 'production' 환경에서만 허용
 */

const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

const PIN = () => process.env.COUPON_PIN || '1234';
const MAX_ATT = () => parseInt(process.env.COUPON_MAX_ATT || '5', 10);

// 허용된 가맹점 목록 (Founder 승인 목록, 미설정 = 빈 배열 = 전부 차단)
const allowedVenues = () => {
  const raw = process.env.COUPON_VENUE_ALLOWLIST || '';
  return raw.split(',').map(v => v.trim()).filter(Boolean);
};

// venue_id 발급 허용 여부
// - test_* : 비프로덕션 환경에서만 허용
// - 그 외  : COUPON_VENUE_ALLOWLIST에 포함된 경우만 허용
const isVenueAllowed = (venueId) => {
  if (venueId.startsWith('test_')) {
    return process.env.NODE_ENV !== 'production';
  }
  return allowedVenues().includes(venueId);
};

// ── POST /api/starlight-coupon/issue ─────────────────────────────────────────
router.post('/issue', async (req, res) => {
  const { hotel_source, venue_id } = req.body || {};
  if (!hotel_source || !venue_id) {
    return res.status(400).json({ ok: false, error: 'hotel_source와 venue_id가 필요합니다.' });
  }

  if (!isVenueAllowed(venue_id)) {
    return res.status(403).json({ ok: false, error: '승인되지 않은 가맹점입니다.' });
  }

  try {
    const db = getDb();
    let coupon;

    if (db.isPostgres) {
      const result = await db.query(
        `INSERT INTO starlight_coupons (hotel_source, venue_id)
         VALUES ($1, $2) RETURNING id, issued_at`,
        [hotel_source, venue_id]
      );
      coupon = result.rows[0];
    } else {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      await db.run(
        `INSERT INTO starlight_coupons (id, hotel_source, venue_id, issued_at, is_active)
         VALUES (?, ?, ?, datetime('now'), 1)`,
        [id, hotel_source, venue_id]
      );
      coupon = { id, issued_at: new Date().toISOString() };
    }

    return res.json({ ok: true, coupon_id: coupon.id, issued_at: coupon.issued_at });
  } catch (err) {
    console.error('[starlight-coupon] issue error:', err.message);
    return res.status(500).json({ ok: false, error: '쿠폰 발급 중 오류가 발생했습니다.' });
  }
});

// ── GET /api/starlight-coupon/:id ────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const db = getDb();
    let coupon;

    if (db.isPostgres) {
      const result = await db.query(
        `SELECT c.id, c.hotel_source, c.venue_id, c.issued_at, c.viewed_at, c.is_active, c.failed_attempts,
                u.confirmed_at AS used_at
         FROM starlight_coupons c
         LEFT JOIN starlight_coupon_uses u ON u.coupon_id = c.id
         WHERE c.id = $1
         LIMIT 1`,
        [id]
      );
      coupon = result.rows[0];
    } else {
      coupon = await db.get(
        `SELECT c.id, c.hotel_source, c.venue_id, c.issued_at, c.viewed_at, c.is_active, c.failed_attempts,
                u.confirmed_at AS used_at
         FROM starlight_coupons c
         LEFT JOIN starlight_coupon_uses u ON u.coupon_id = c.id
         WHERE c.id = ?
         LIMIT 1`,
        [id]
      );
    }

    if (!coupon) {
      return res.status(404).json({ ok: false, error: '쿠폰을 찾을 수 없습니다.' });
    }

    // 최초 조회 시 viewed_at 기록 (idempotent)
    if (!coupon.viewed_at) {
      if (db.isPostgres) {
        await db.query(`UPDATE starlight_coupons SET viewed_at = NOW() WHERE id = $1`, [id]);
      } else {
        await db.run(`UPDATE starlight_coupons SET viewed_at = datetime('now') WHERE id = ?`, [id]);
      }
      coupon.viewed_at = new Date().toISOString();
    }

    return res.json({
      ok: true,
      coupon: {
        id: coupon.id,
        hotel_source: coupon.hotel_source,
        venue_id: coupon.venue_id,
        issued_at: coupon.issued_at,
        is_active: Boolean(coupon.is_active),
        is_used: !!coupon.used_at,
        used_at: coupon.used_at || null,
        failed_attempts: Number(coupon.failed_attempts || 0),
        locked: Number(coupon.failed_attempts || 0) >= MAX_ATT() && !coupon.used_at,
      },
    });
  } catch (err) {
    console.error('[starlight-coupon] get error:', err.message);
    return res.status(500).json({ ok: false, error: '쿠폰 조회 중 오류가 발생했습니다.' });
  }
});

// ── POST /api/starlight-coupon/:id/redeem ────────────────────────────────────
router.post('/:id/redeem', async (req, res) => {
  const { id } = req.params;
  const { pin, venue_id } = req.body || {};

  if (!pin) {
    return res.status(400).json({ ok: false, error: 'PIN이 필요합니다.' });
  }

  try {
    const db = getDb();

    // 쿠폰 조회
    let coupon;
    if (db.isPostgres) {
      const r = await db.query(`SELECT * FROM starlight_coupons WHERE id = $1`, [id]);
      coupon = r.rows[0];
    } else {
      coupon = await db.get(`SELECT * FROM starlight_coupons WHERE id = ?`, [id]);
    }

    if (!coupon) {
      return res.status(404).json({ ok: false, error: '쿠폰을 찾을 수 없습니다.' });
    }

    if (!coupon.is_active) {
      return res.status(409).json({ ok: false, error: '비활성화된 쿠폰입니다.' });
    }

    // 이미 사용됐는지 확인
    let usedRow;
    if (db.isPostgres) {
      const r = await db.query(
        `SELECT confirmed_at FROM starlight_coupon_uses WHERE coupon_id = $1 LIMIT 1`,
        [id]
      );
      usedRow = r.rows[0];
    } else {
      usedRow = await db.get(
        `SELECT confirmed_at FROM starlight_coupon_uses WHERE coupon_id = ? LIMIT 1`,
        [id]
      );
    }

    if (usedRow) {
      return res.status(409).json({
        ok: false,
        error: '이미 사용된 쿠폰입니다.',
        used_at: usedRow.confirmed_at,
      });
    }

    // 시도 횟수 확인 — starlight_coupons.failed_attempts (서버 카운터)
    const failedAtt = Number(coupon.failed_attempts || 0);
    if (failedAtt >= MAX_ATT()) {
      return res.status(429).json({
        ok: false,
        error: `PIN 시도 횟수(${MAX_ATT()}회)를 초과했습니다. 호텔 프런트에 문의하세요.`,
      });
    }

    // PIN 검증
    if (pin !== PIN()) {
      // 실패 시도 카운터 증가 (atomic increment)
      if (db.isPostgres) {
        await db.query(
          `UPDATE starlight_coupons SET failed_attempts = failed_attempts + 1 WHERE id = $1`,
          [id]
        );
      } else {
        await db.run(
          `UPDATE starlight_coupons SET failed_attempts = failed_attempts + 1 WHERE id = ?`,
          [id]
        );
      }
      return res.status(401).json({
        ok: false,
        error: '확인번호가 올바르지 않습니다.',
        remaining: MAX_ATT() - failedAtt - 1,
      });
    }

    // 사용 완료 기록 — UNIQUE(coupon_id) 제약으로 동시 중복 삽입 DB 레벨 차단
    const { v4: uuidv4 } = require('uuid');
    const useId = uuidv4();
    try {
      if (db.isPostgres) {
        await db.query(
          `INSERT INTO starlight_coupon_uses (id, coupon_id, venue_id)
           VALUES ($1, $2, $3)`,
          [useId, id, venue_id || coupon.venue_id]
        );
      } else {
        await db.run(
          `INSERT INTO starlight_coupon_uses (id, coupon_id, venue_id, confirmed_at)
           VALUES (?, ?, ?, datetime('now'))`,
          [useId, id, venue_id || coupon.venue_id]
        );
      }
    } catch (insertErr) {
      // UNIQUE 제약 위반 = 동시 요청에서 이미 사용 처리됨
      if (insertErr.code === '23505' || (insertErr.message || '').includes('UNIQUE')) {
        return res.status(409).json({ ok: false, error: '이미 사용된 쿠폰입니다.' });
      }
      throw insertErr;
    }

    return res.json({ ok: true, confirmed_at: new Date().toISOString() });
  } catch (err) {
    console.error('[starlight-coupon] redeem error:', err.message);
    return res.status(500).json({ ok: false, error: '쿠폰 사용 처리 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
