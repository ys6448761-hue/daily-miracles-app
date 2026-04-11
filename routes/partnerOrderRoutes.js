'use strict';

/**
 * partnerOrderRoutes.js — 업체용 주문·정산 API
 * (partnerAuthRoutes.js 와 동일한 JWT 미들웨어 사용)
 *
 * GET   /api/partner/orders                   내 업체 주문 목록
 * PATCH /api/partner/orders/:deliveryId/ship  배송 시작 처리
 * GET   /api/partner/settlement               정산 내역
 */

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const db      = require('../database/db');

const JWT_SECRET = process.env.PARTNER_JWT_SECRET || 'hometown-partner-dev-secret';

let msg = null;
try { msg = require('../services/messageProvider'); } catch {}

// ── JWT 미들웨어 (partnerAuthRoutes와 동일) ──────────────────────────────
function partnerAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  try {
    const payload  = jwt.verify(auth.slice(7), JWT_SECRET);
    req.partnerId  = payload.partner_id;
    req.accountId  = payload.account_id;
    return next();
  } catch {
    return res.status(401).json({ error: '로그인이 만료됐어요. 다시 로그인해주세요.' });
  }
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/orders
// ─────────────────────────────────────────────────────────────────────────
router.get('/orders', partnerAuth, async (req, res) => {
  const { partnerId } = req;
  const { status } = req.query;

  try {
    const whereStatus = status ? `AND o.status = $2` : '';
    const params = status ? [partnerId, status] : [partnerId];

    const r = await db.query(`
      SELECT
        o.id AS order_id,
        o.quantity, o.total_amount, o.partner_amount, o.status,
        o.buyer_phone, o.created_at,
        p.name AS product_name, p.price, p.image_url,
        COALESCE(
          json_agg(json_build_object(
            'id',              d.id,
            'recipient_name',  d.recipient_name,
            'recipient_phone', d.recipient_phone,
            'address',         d.address,
            'gift_message',    d.gift_message,
            'delivery_status', d.delivery_status,
            'tracking_number', d.tracking_number
          ) ORDER BY d.created_at) FILTER (WHERE d.id IS NOT NULL),
          '[]'::json
        ) AS deliveries
      FROM dt_shop_orders o
      JOIN dt_shop_products p ON p.id = o.product_id
      LEFT JOIN dt_order_deliveries d ON d.order_id = o.id
      WHERE o.partner_id = $1 ${whereStatus}
      GROUP BY o.id, p.name, p.price, p.image_url
      ORDER BY o.created_at DESC
    `, params);

    // 신규 주문 수 (preparing 이하)
    const newR = await db.query(
      `SELECT COUNT(*) AS cnt FROM dt_shop_orders WHERE partner_id = $1 AND status = 'paid'`,
      [partnerId]
    );

    return res.json({
      orders:      r.rows,
      new_count:   Number(newR.rows[0]?.cnt ?? 0),
    });
  } catch (err) {
    console.error('[partner/orders GET] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/partner/orders/:deliveryId/ship
// Body: { tracking_number }
// ─────────────────────────────────────────────────────────────────────────
router.patch('/orders/:deliveryId/ship', partnerAuth, async (req, res) => {
  const { partnerId } = req;
  const { deliveryId } = req.params;
  const { tracking_number } = req.body;

  if (!tracking_number) return res.status(400).json({ error: '운송장 번호가 필요합니다.' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 배송지 조회 + 파트너 소유 확인
    const dR = await client.query(`
      SELECT d.id, d.order_id, d.recipient_phone, d.delivery_status,
             o.partner_id, o.buyer_phone, o.status AS order_status
      FROM dt_order_deliveries d
      JOIN dt_shop_orders o ON o.id = d.order_id
      WHERE d.id = $1 AND o.partner_id = $2
    `, [deliveryId, partnerId]);

    const delivery = dR.rows[0];
    if (!delivery) { await client.query('ROLLBACK'); return res.status(404).json({ error: '배송 건을 찾을 수 없습니다.' }); }
    if (delivery.delivery_status === 'shipped' || delivery.delivery_status === 'delivered') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: '이미 배송 처리된 건입니다.' });
    }

    // 배송 상태 업데이트
    await client.query(`
      UPDATE dt_order_deliveries
         SET delivery_status = 'shipped', tracking_number = $1
       WHERE id = $2
    `, [tracking_number, deliveryId]);

    // 주문 상태를 shipped으로 (모든 배송지가 shipped 아니더라도 일단 업데이트)
    await client.query(`
      UPDATE dt_shop_orders SET status = 'shipped' WHERE id = $1 AND status = 'paid'
    `, [delivery.order_id]);

    await client.query('COMMIT');

    // ③ 주문자 배송시작 알림
    const phone = delivery.recipient_phone || delivery.buyer_phone;
    if (phone && msg && msg.isEnabled()) {
      msg.sendSensSMS(phone,
        `[DreamTown] 선물이 출발했어요 🚀\n운송장: ${tracking_number}\n여수의 마음이 가는 중이에요 ✨`
      ).catch(() => {});
    }

    // ④ 선물 받는 사람 DreamTown 유입 알림 (star_id → star_name 조회)
    const recipientPhone = delivery.recipient_phone;
    if (recipientPhone && msg && msg.isEnabled()) {
      db.query(
        `SELECT s.star_name FROM dt_stars s
         JOIN dt_shop_orders o ON o.star_id = s.id
         WHERE o.id = $1 LIMIT 1`,
        [delivery.order_id]
      ).then(sR => {
        const starName = sR.rows[0]?.star_name || '소원이';
        msg.sendSensSMS(recipientPhone,
          `[DreamTown] ${starName}의 별이 당신을 생각하며 여수에서 선물을 보냈어요 ✨\n\n나도 내 별 만들기:\napp.dailymiracles.kr/wish`
        ).catch(() => {});
      }).catch(() => {});
    }

    return res.json({ ok: true, delivery_id: deliveryId, tracking_number });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[partner/orders/ship] 오류:', err);
    return res.status(500).json({ error: '배송 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/partner/settlement
// ─────────────────────────────────────────────────────────────────────────
router.get('/settlement', partnerAuth, async (req, res) => {
  const { partnerId } = req;

  try {
    // 기존 정산 레코드
    const sR = await db.query(`
      SELECT id, settlement_month, total_sales, partner_amount,
             platform_amount, order_count, status, bank_name, account_number, paid_at, created_at
        FROM dt_settlements
       WHERE partner_id = $1
       ORDER BY settlement_month DESC
       LIMIT 24
    `, [partnerId]);

    // 이번 달 집계 (정산 레코드 없어도 실시간 계산)
    const thisMonth = new Date();
    const monthStr  = `${thisMonth.getFullYear()}-${String(thisMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const liveR = await db.query(`
      SELECT
        COALESCE(SUM(o.total_amount),   0) AS total_sales,
        COALESCE(SUM(o.partner_amount), 0) AS partner_amount,
        COUNT(*)                           AS order_count
      FROM dt_shop_orders o
      WHERE o.partner_id = $1
        AND o.status != 'cancelled'
        AND date_trunc('month', o.created_at) = $2::date
    `, [partnerId, monthStr]);
    const live = liveR.rows[0];

    return res.json({
      settlements:   sR.rows,
      current_month: {
        month:          monthStr,
        total_sales:    Number(live.total_sales),
        partner_amount: Number(live.partner_amount),
        order_count:    Number(live.order_count),
        status:         'pending',
      },
    });
  } catch (err) {
    console.error('[partner/settlement] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
