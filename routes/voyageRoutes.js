/**
 * voyageRoutes.js — 북은하 항해 MVP
 *
 * POST   /api/voyage/wish                  소원 생성
 * GET    /api/voyage/wish/:id              소원 + 상태 조회
 * POST   /api/voyage/booking               예약 생성 (결제 전)
 * POST   /api/voyage/payment/checkout      NicePay 결제 요청
 * POST   /api/voyage/payment/confirm       NicePay 결제 확인
 * GET    /api/voyage/:wish_id/status       항해 상태 화면 데이터
 * POST   /api/voyage/:wish_id/reflection   회고 저장
 * POST   /api/voyage/:wish_id/star         별 생성 (challenge 은하 = 북은하)
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const crypto  = require('crypto');

// NicePay 서비스 (기존 여수 소원빌기와 동일)
let nicepayService = null;
try {
  nicepayService = require('../services/nicepayService');
} catch (_) {
  console.warn('[Voyage] nicepayService 로드 실패 — 결제 기능 비활성');
}

// 이용권 자동 발급 트리거
let credentialTrigger = null;
try { credentialTrigger = require('../services/credentialTriggerService'); } catch (_) {}

// ── 세션 키 헬퍼 ──────────────────────────────────────────────────
function getSessionKey(req) {
  return req.headers['x-session-key']
    || req.cookies?.dt_session
    || req.body?.session_key
    || null;
}

// ── 주중/주말 금액 계산 ────────────────────────────────────────────
function calcAmount(date) {
  const day = new Date(date).getDay(); // 0=일 6=토
  return (day === 0 || day === 6) ? 89000 : 60000;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/voyage/wish — 소원 생성
// Body: { wish_text, session_key? }
// ─────────────────────────────────────────────────────────────────
router.post('/wish', async (req, res) => {
  const { wish_text } = req.body;
  if (!wish_text?.trim()) {
    return res.status(400).json({ error: '소원을 입력해주세요.' });
  }
  try {
    const sessionKey = getSessionKey(req) || crypto.randomUUID();
    const { rows } = await db.query(
      `INSERT INTO voyage_wishes (session_key, wish_text, status)
       VALUES ($1, $2, 'draft_created')
       RETURNING id, wish_text, status, created_at`,
      [sessionKey, wish_text.trim()]
    );
    res.status(201).json({ ok: true, wish: rows[0], session_key: sessionKey });
  } catch (err) {
    console.error('[Voyage] POST /wish error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/voyage/wish/:id — 소원 + 예약 + 상태 조회
// ─────────────────────────────────────────────────────────────────
router.get('/wish/:id', async (req, res) => {
  try {
    const { rows: wishes } = await db.query(
      `SELECT id, wish_text, status, star_id, created_at FROM voyage_wishes WHERE id = $1`,
      [req.params.id]
    );
    if (wishes.length === 0) return res.status(404).json({ error: '소원을 찾을 수 없습니다.' });

    const { rows: bookings } = await db.query(
      `SELECT id, customer_name, booking_date, session, amount, status AS booking_status
       FROM voyage_bookings WHERE wish_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.id]
    );

    res.json({ wish: wishes[0], booking: bookings[0] ?? null });
  } catch (err) {
    console.error('[Voyage] GET /wish/:id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/voyage/booking — 예약 생성
// Body: { wish_id, customer_name, phone, booking_date, session }
// ─────────────────────────────────────────────────────────────────
router.post('/booking', async (req, res) => {
  const { wish_id, customer_name, phone, booking_date, session } = req.body;
  if (!wish_id || !customer_name || !phone || !booking_date || !session) {
    return res.status(400).json({ error: 'wish_id, customer_name, phone, booking_date, session 필수' });
  }
  if (!['morning', 'evening'].includes(session)) {
    return res.status(400).json({ error: 'session은 morning 또는 evening' });
  }
  try {
    const wishRow = await db.query('SELECT id, status FROM voyage_wishes WHERE id = $1', [wish_id]);
    if (wishRow.rowCount === 0) return res.status(404).json({ error: '소원을 찾을 수 없습니다.' });

    const amount = calcAmount(booking_date);

    const { rows } = await db.query(
      `INSERT INTO voyage_bookings (wish_id, customer_name, phone, booking_date, session, amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, wish_id, customer_name, booking_date, session, amount, status`,
      [wish_id, customer_name.trim(), phone.trim(), booking_date, session, amount]
    );

    // 소원 상태 → booking_pending
    await db.query(
      `UPDATE voyage_wishes SET status = 'booking_pending', updated_at = NOW() WHERE id = $1`,
      [wish_id]
    );

    res.status(201).json({ ok: true, booking: rows[0] });
  } catch (err) {
    console.error('[Voyage] POST /booking error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/voyage/payment/checkout — NicePay 결제 요청
// Body: { booking_id }
// ─────────────────────────────────────────────────────────────────
router.post('/payment/checkout', async (req, res) => {
  const { booking_id } = req.body;
  if (!booking_id) return res.status(400).json({ error: 'booking_id 필수' });

  try {
    const { rows } = await db.query(
      `SELECT b.*, w.wish_text FROM voyage_bookings b
       JOIN voyage_wishes w ON w.id = b.wish_id
       WHERE b.id = $1`,
      [booking_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });

    const booking = rows[0];
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: '결제 대기 상태가 아닙니다.', current: booking.status });
    }

    if (!nicepayService) {
      return res.status(503).json({ error: '결제 서비스를 사용할 수 없습니다.' });
    }

    const pgConfig = nicepayService.validateConfig();
    if (!pgConfig.isValid) {
      return res.status(503).json({ error: '결제 설정 미완료', missing: pgConfig.missing });
    }

    const goodsName = `북은하 항해 (${booking.session === 'morning' ? '오전' : '저녁'} ${booking.booking_date})`;
    const payment = await nicepayService.createPayment(booking.amount, goodsName);

    await db.query(
      `UPDATE voyage_bookings SET pg_order_id = $1, updated_at = NOW() WHERE id = $2`,
      [payment.orderId, booking_id]
    );

    res.json({
      ok: true,
      booking_id,
      order_id:      payment.orderId,
      amount:        booking.amount,
      order_name:    goodsName,
      customer_name: booking.customer_name,
      customer_phone: booking.phone,
      payment_url:   `/pay?moid=${encodeURIComponent(payment.orderId)}`,
    });
  } catch (err) {
    console.error('[Voyage] POST /payment/checkout error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/voyage/payment/confirm — NicePay 결제 확인
// Body: { booking_id, payment_key?, transaction_id? }
// ─────────────────────────────────────────────────────────────────
router.post('/payment/confirm', async (req, res) => {
  const { booking_id, payment_key, transaction_id } = req.body;
  if (!booking_id) return res.status(400).json({ error: 'booking_id 필수' });

  try {
    const { rows } = await db.query(
      `SELECT b.*, w.id AS wish_id FROM voyage_bookings b
       JOIN voyage_wishes w ON w.id = b.wish_id
       WHERE b.id = $1`,
      [booking_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: '예약을 찾을 수 없습니다.' });

    const booking = rows[0];
    if (booking.status !== 'pending') {
      return res.status(400).json({ error: '이미 처리된 예약입니다.', current: booking.status });
    }

    // 예약 확정
    await db.query(
      `UPDATE voyage_bookings
       SET status = 'confirmed',
           pg_payment_key = $2, pg_transaction_id = $3,
           paid_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [booking_id, payment_key ?? null, transaction_id ?? null]
    );

    // 소원 상태 → booking_confirmed
    await db.query(
      `UPDATE voyage_wishes SET status = 'booking_confirmed', updated_at = NOW() WHERE id = $1`,
      [booking.wish_id]
    );

    // ── 이용권 자동 발급 (결제와 독립) ─────────────────────────
    if (credentialTrigger) {
      setImmediate(() => credentialTrigger.issueOnVoyageConfirmed(booking));
    }

    res.json({
      ok: true,
      booking_id,
      wish_id: booking.wish_id,
      status: 'confirmed',
      next: `/voyage/${booking.wish_id}`,
    });
  } catch (err) {
    console.error('[Voyage] POST /payment/confirm error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/voyage/:wish_id/status — 항해 상태 화면 데이터
// ─────────────────────────────────────────────────────────────────
router.get('/:wish_id/status', async (req, res) => {
  try {
    const { rows: wishes } = await db.query(
      `SELECT id, wish_text, status, star_id, created_at FROM voyage_wishes WHERE id = $1`,
      [req.params.wish_id]
    );
    if (wishes.length === 0) return res.status(404).json({ error: '항해를 찾을 수 없습니다.' });

    const { rows: bookings } = await db.query(
      `SELECT booking_date, session, customer_name, status AS booking_status
       FROM voyage_bookings WHERE wish_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.wish_id]
    );

    const wish    = wishes[0];
    const booking = bookings[0] ?? null;

    // 상태별 화면 문구 (1줄)
    const STATUS_LINE = {
      draft_created:       '소원이 담겼어요.',
      booking_pending:     '예약을 기다리고 있어요.',
      booking_confirmed:   '항해가 예약되었어요. 그날을 기다려요.',
      boarding_checked_in: '곧 출항합니다.',
      voyage_in_progress:  '지금 항해 중이에요.',
      voyage_completed:    '항해가 끝났어요. 잠시 돌아보세요.',
      star_created:        '소원이 별이 되었어요 ✦',
    };

    res.json({
      wish_id:    wish.id,
      wish_text:  wish.wish_text,
      status:     wish.status,
      status_line: STATUS_LINE[wish.status] ?? '항해 중이에요.',
      star_id:    wish.star_id,
      booking,
    });
  } catch (err) {
    console.error('[Voyage] GET /:wish_id/status error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/voyage/:wish_id/reflection — 회고 저장
// Body: { answer: "lighter"|"clearer"|"braver" }
// ─────────────────────────────────────────────────────────────────
router.post('/:wish_id/reflection', async (req, res) => {
  const { answer } = req.body;
  if (!['lighter', 'clearer', 'braver'].includes(answer)) {
    return res.status(400).json({ error: 'answer는 lighter / clearer / braver 중 하나' });
  }
  try {
    const wishRow = await db.query('SELECT id, status FROM voyage_wishes WHERE id = $1', [req.params.wish_id]);
    if (wishRow.rowCount === 0) return res.status(404).json({ error: '항해를 찾을 수 없습니다.' });

    await db.query(
      `UPDATE voyage_bookings SET reflection_answer = $1, updated_at = NOW()
       WHERE wish_id = $2 AND status = 'confirmed'`,
      [answer, req.params.wish_id]
    );

    // 소원 상태 → voyage_completed
    await db.query(
      `UPDATE voyage_wishes SET status = 'voyage_completed', updated_at = NOW() WHERE id = $1`,
      [req.params.wish_id]
    );

    res.json({ ok: true, answer, next: `/voyage/${req.params.wish_id}/star` });
  } catch (err) {
    console.error('[Voyage] POST /:wish_id/reflection error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// POST /api/voyage/:wish_id/star — 별 생성
// 내부: challenge 은하 (= 북은하) 에 dt_star 생성
// ─────────────────────────────────────────────────────────────────
router.post('/:wish_id/star', async (req, res) => {
  try {
    const { wish_id } = req.params;
    const wishRow = await db.query(
      'SELECT id, wish_text, status FROM voyage_wishes WHERE id = $1',
      [wish_id]
    );
    if (wishRow.rowCount === 0) return res.status(404).json({ error: '항해를 찾을 수 없습니다.' });

    const wish = wishRow.rows[0];
    if (wish.status !== 'voyage_completed') {
      return res.status(400).json({ error: '항해 완료 후 별을 만들 수 있어요.', current: wish.status });
    }
    if (wish.star_id) {
      return res.json({ ok: true, star_id: wish.star_id, already: true });
    }

    // ── challenge 은하 조회 (= 북은하) ────────────────────────
    const galaxyRow = await db.query(
      `SELECT id FROM dt_galaxies WHERE code = 'challenge' LIMIT 1`
    );
    if (galaxyRow.rowCount === 0) {
      return res.status(500).json({ error: '북은하(challenge)를 찾을 수 없습니다.' });
    }
    const galaxyId = galaxyRow.rows[0].id;

    // ── dt_user 임시 생성 (항해 전용, nickname=북은하 항해자) ──
    const userId = crypto.randomUUID();
    await db.query(
      `INSERT INTO dt_users (id, nickname, created_at, updated_at)
       VALUES ($1, '북은하 항해자', NOW(), NOW())`,
      [userId]
    );

    // ── dt_wishes 생성 (gem_type NOT NULL → ruby 고정) ─────────
    const dtWishId = crypto.randomUUID();
    await db.query(
      `INSERT INTO dt_wishes (id, user_id, wish_text, gem_type, status, created_at, updated_at)
       VALUES ($1, $2, $3, 'ruby', 'submitted', NOW(), NOW())`,
      [dtWishId, userId, wish.wish_text]
    );

    // ── dt_star_seeds 생성 (star_seed_id NOT NULL) ─────────────
    const seedId = crypto.randomUUID();
    await db.query(
      `INSERT INTO dt_star_seeds (id, wish_id, seed_state, created_at)
       VALUES ($1, $2, 'born', NOW())`,
      [seedId, dtWishId]
    );

    // ── 별 이름 생성 (소원 앞 8자 기반) ───────────────────────
    const starName = wish.wish_text.trim().slice(0, 8) + '의 별';

    // ── dt_stars 생성 ──────────────────────────────────────────
    const starId = crypto.randomUUID();
    await db.query(
      `INSERT INTO dt_stars (id, user_id, wish_id, star_seed_id, galaxy_id, star_name, star_stage, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'day1', NOW(), NOW())`,
      [starId, userId, dtWishId, seedId, galaxyId, starName]
    );

    // ── voyage_wishes 업데이트 ─────────────────────────────────
    await db.query(
      `UPDATE voyage_wishes SET status = 'star_created', star_id = $1, updated_at = NOW() WHERE id = $2`,
      [starId, wish_id]
    );

    res.status(201).json({
      ok: true,
      star_id:   starId,
      star_name: starName,
      galaxy:    'challenge',
      galaxy_display: '북은하',
    });
  } catch (err) {
    console.error('[Voyage] POST /:wish_id/star error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
