'use strict';

/**
 * partnerSubscriptionRoutes.js — 파트너 구독 시스템 (3만원/월)
 *
 * GET  /api/partner/subscription          구독 상태 조회
 * POST /api/partner/subscription/start   구독 시작
 * POST /api/partner/subscription/cancel  구독 취소
 * GET  /api/partner/subscription/stats   구독 효과 통계 (매출·방문·랭킹)
 */

const express    = require('express');
const router     = express.Router();
const jwt        = require('jsonwebtoken');
const db         = require('../database/db');

const JWT_SECRET = process.env.PARTNER_JWT_SECRET || 'hometown-partner-dev-secret';

let msg = null;
try { msg = require('../services/messageProvider'); } catch {}

// ── JWT 미들웨어 ────────────────────────────────────────────────────────
function partnerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  try {
    const payload    = jwt.verify(auth.slice(7), JWT_SECRET);
    req.partnerId    = payload.partner_id;
    req.accountId    = payload.account_id;
    req.partnerEmail = payload.email;
    return next();
  } catch {
    return res.status(401).json({ error: '로그인이 만료됐어요. 다시 로그인해주세요.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/subscription
// 구독 상태 + 잔여일 반환
// ─────────────────────────────────────────────────────────────────────────
router.get('/subscription', partnerAuth, async (req, res) => {
  const { partnerId } = req;
  try {
    // 최근 구독 레코드
    const r = await db.query(`
      SELECT id, plan, status, amount, started_at, expires_at, cancelled_at
        FROM partner_subscriptions
       WHERE partner_id = $1
       ORDER BY created_at DESC
       LIMIT 1
    `, [partnerId]);

    const sub = r.rows[0];
    if (!sub || sub.status !== 'active') {
      return res.json({ subscribed: false, plan: null, expires_at: null, days_left: 0 });
    }

    const daysLeft = Math.max(0, Math.ceil((new Date(sub.expires_at) - Date.now()) / 86400000));
    return res.json({
      subscribed: true,
      plan:       sub.plan,
      amount:     sub.amount,
      started_at: sub.started_at,
      expires_at: sub.expires_at,
      days_left:  daysLeft,
    });
  } catch (err) {
    console.error('[partner/subscription GET] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/partner/subscription/start
// Body: { payment_key? }   (현재: DEMO 결제)
// ─────────────────────────────────────────────────────────────────────────
router.post('/subscription/start', partnerAuth, async (req, res) => {
  const { partnerId, partnerEmail } = req;
  const { payment_key = 'DEMO' } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 이미 활성 구독이 있으면 차단
    const existR = await client.query(
      `SELECT id FROM partner_subscriptions WHERE partner_id = $1 AND status = 'active' LIMIT 1`,
      [partnerId]
    );
    if (existR.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: '이미 구독 중입니다.' });
    }

    // 구독 1개월 생성
    const expiresAt = new Date(Date.now() + 31 * 24 * 60 * 60 * 1000); // 31일
    const subR = await client.query(`
      INSERT INTO partner_subscriptions
        (partner_id, plan, status, amount, payment_key, started_at, expires_at)
      VALUES ($1, 'premium', 'active', 30000, $2, NOW(), $3)
      RETURNING id
    `, [partnerId, payment_key, expiresAt]);

    // dt_partners.is_subscribed 업데이트
    await client.query(`
      UPDATE dt_partners
         SET is_subscribed = TRUE, subscription_expires_at = $1
       WHERE id = $2
    `, [expiresAt, partnerId]);

    await client.query('COMMIT');

    // 환영 알림 (fire-and-forget)
    if (msg && msg.isEnabled()) {
      const ptR = await db.query(`SELECT name, phone FROM dt_partners WHERE id = $1`, [partnerId]).catch(() => ({ rows: [] }));
      const phone = ptR.rows[0]?.phone;
      const name  = ptR.rows[0]?.name || '파트너';
      if (phone) {
        msg.sendSensSMS(phone,
          `[DreamTown] ${name} 구독이 시작됐어요 🌟\n✅ 별자리 스토리 자동 생성\n✅ 손님 감사 편지 자동 발송\n✅ 지역 랭킹 노출\n내달 ${expiresAt.getMonth() + 1}/${expiresAt.getDate()}까지`
        ).catch(() => {});
      }
    }

    return res.status(201).json({
      ok:         true,
      sub_id:     subR.rows[0].id,
      expires_at: expiresAt,
      message:    '구독이 시작됐어요 🌟',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[partner/subscription/start] 오류:', err);
    return res.status(500).json({ error: '구독 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/partner/subscription/cancel
// ─────────────────────────────────────────────────────────────────────────
router.post('/subscription/cancel', partnerAuth, async (req, res) => {
  const { partnerId } = req;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const r = await client.query(
      `UPDATE partner_subscriptions
          SET status = 'cancelled', cancelled_at = NOW()
        WHERE partner_id = $1 AND status = 'active'
        RETURNING id, expires_at`,
      [partnerId]
    );
    if (!r.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: '활성 구독이 없습니다.' });
    }

    // 만료일까지는 혜택 유지 (is_subscribed는 만료일 지난 후 cron으로 처리)
    await client.query('COMMIT');
    return res.json({
      ok:         true,
      expires_at: r.rows[0].expires_at,
      message:    `구독이 취소됐어요. 만료일까지는 모든 혜택이 유지됩니다.`,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[partner/subscription/cancel] 오류:', err);
    return res.status(500).json({ error: '취소 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/subscription/stats
// 구독 효과 통계: 방문수·매출·지역 랭킹
// ─────────────────────────────────────────────────────────────────────────
router.get('/subscription/stats', partnerAuth, async (req, res) => {
  const { partnerId } = req;
  try {
    // 이번 달 방문 수
    const visitR = await db.query(`
      SELECT COUNT(*) AS this_month,
             COUNT(*) FILTER (WHERE visited_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
                                AND visited_at <  date_trunc('month', CURRENT_DATE)) AS last_month
        FROM hometown_visits
       WHERE partner_id = $1
    `, [partnerId]);

    // 이번 달 주문 매출
    const salesR = await db.query(`
      SELECT COALESCE(SUM(total_amount),0) AS this_month_sales,
             COUNT(*) AS order_count
        FROM dt_shop_orders
       WHERE partner_id = $1
         AND status != 'cancelled'
         AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
    `, [partnerId]).catch(() => ({ rows: [{ this_month_sales: 0, order_count: 0 }] }));

    // 지역 랭킹 (같은 city_code 내 hometown_star_count 기준)
    const rankR = await db.query(`
      SELECT rank, total
        FROM (
          SELECT id,
                 RANK() OVER (PARTITION BY city_code ORDER BY COALESCE(hometown_star_count,0) DESC) AS rank,
                 COUNT(*) OVER (PARTITION BY city_code) AS total
            FROM dt_partners
           WHERE is_active = TRUE
        ) t
       WHERE id = $1
    `, [partnerId]).catch(() => ({ rows: [] }));

    const visits = visitR.rows[0];
    const sales  = salesR.rows[0];
    const rank   = rankR.rows[0];

    const thisMonth = Number(visits?.this_month ?? 0);
    const lastMonth = Number(visits?.last_month ?? 0);
    const growth = lastMonth > 0 ? Math.round((thisMonth - lastMonth) / lastMonth * 100) : null;

    return res.json({
      visits: {
        this_month: thisMonth,
        last_month: lastMonth,
        growth_pct: growth,
      },
      sales: {
        this_month: Number(sales?.this_month_sales ?? 0),
        order_count: Number(sales?.order_count ?? 0),
      },
      ranking: {
        rank:  rank ? Number(rank.rank)  : null,
        total: rank ? Number(rank.total) : null,
      },
    });
  } catch (err) {
    console.error('[partner/subscription/stats] 오류:', err);
    return res.status(500).json({ error: '통계 조회 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
