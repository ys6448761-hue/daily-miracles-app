'use strict';

/**
 * shopRoutes.js — 여수 특산품 쇼핑 (소원이용)
 *
 * GET  /api/shop/products          전체 상품 목록
 * GET  /api/shop/products/:id      상품 상세
 * POST /api/shop/orders            주문 생성 (다중 배송지)
 * GET  /api/shop/orders            내 주문 내역
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const PLATFORM_RATE = 0.15; // 플랫폼 수수료 15%

let msg = null;
try { msg = require('../services/messageProvider'); } catch {}

// ── 알림 헬퍼 (fire-and-forget) ─────────────────────────────────────────
async function notify(phone, text) {
  if (!phone || !msg || !msg.isEnabled()) return;
  try { await msg.sendSensSMS(phone, text); } catch {}
}

// ─────────────────────────────────────────────────────────────────────────
// GET /api/shop/products
// ─────────────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const { category } = req.query;
  try {
    const where = category && category !== '전체'
      ? `AND p.category = $1`
      : '';
    const params = category && category !== '전체' ? [category] : [];

    const r = await db.query(`
      SELECT
        p.id, p.name, p.description, p.price, p.stock,
        p.image_url, p.category, p.is_gift_available,
        pt.name AS partner_name, pt.city_code
      FROM dt_shop_products p
      LEFT JOIN dt_partners pt ON pt.id = p.partner_id
      WHERE p.is_active = TRUE ${where}
      ORDER BY p.created_at DESC
    `, params);

    return res.json({ products: r.rows });
  } catch (err) {
    console.error('[shop/products] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/shop/products/:id
// ─────────────────────────────────────────────────────────────────────────
router.get('/products/:id', async (req, res) => {
  try {
    const r = await db.query(`
      SELECT
        p.id, p.name, p.description, p.price, p.stock,
        p.image_url, p.category, p.is_gift_available,
        pt.name AS partner_name, pt.address AS partner_address, pt.city_code
      FROM dt_shop_products p
      LEFT JOIN dt_partners pt ON pt.id = p.partner_id
      WHERE p.id = $1 AND p.is_active = TRUE
    `, [req.params.id]);

    if (!r.rows[0]) return res.status(404).json({ error: '상품을 찾을 수 없습니다.' });
    return res.json({ product: r.rows[0] });
  } catch (err) {
    console.error('[shop/products/:id] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/shop/orders
// Body: { product_id, quantity, deliveries, payment_key?, buyer_phone? }
// ─────────────────────────────────────────────────────────────────────────
router.post('/orders', async (req, res) => {
  const { product_id, quantity = 1, deliveries = [], payment_key, buyer_phone, user_id } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id가 필요합니다.' });
  if (!deliveries.length) return res.status(400).json({ error: '배송지를 1개 이상 입력해주세요.' });

  // 배송지 유효성
  for (const d of deliveries) {
    if (!d.recipient_name || !d.recipient_phone || !d.address) {
      return res.status(400).json({ error: '배송지 정보가 불완전합니다.' });
    }
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 상품 조회 + 재고 확인
    const pR = await client.query(
      `SELECT id, name, price, stock, partner_id FROM dt_shop_products WHERE id = $1 AND is_active = TRUE FOR UPDATE`,
      [product_id]
    );
    const product = pR.rows[0];
    if (!product) { await client.query('ROLLBACK'); return res.status(404).json({ error: '상품을 찾을 수 없습니다.' }); }
    if (product.stock < quantity) { await client.query('ROLLBACK'); return res.status(409).json({ error: '재고가 부족합니다.' }); }

    // 금액 계산
    const totalAmount   = product.price * quantity;
    const platformAmt   = Math.round(totalAmount * PLATFORM_RATE);
    const partnerAmt    = totalAmount - platformAmt;

    // 재고 차감
    await client.query(`UPDATE dt_shop_products SET stock = stock - $1 WHERE id = $2`, [quantity, product_id]);

    // 주문 생성
    const oR = await client.query(`
      INSERT INTO dt_shop_orders
        (user_id, partner_id, product_id, quantity, total_amount, partner_amount, platform_amount, buyer_phone, payment_key, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'paid')
      RETURNING id
    `, [user_id || null, product.partner_id, product_id, quantity, totalAmount, partnerAmt, platformAmt, buyer_phone || null, payment_key || null]);
    const orderId = oR.rows[0].id;

    // 배송지 생성
    for (const d of deliveries) {
      await client.query(`
        INSERT INTO dt_order_deliveries (order_id, recipient_name, recipient_phone, address, gift_message)
        VALUES ($1,$2,$3,$4,$5)
      `, [orderId, d.recipient_name, d.recipient_phone, d.address, d.gift_message || null]);
    }

    await client.query('COMMIT');

    // 파트너 전화번호 조회 (알림용, fire-and-forget)
    const ptR = await db.query(`SELECT name, phone FROM dt_partners WHERE id = $1`, [product.partner_id]).catch(() => ({ rows: [] }));
    const ptPhone = ptR.rows[0]?.phone;
    const ptName  = ptR.rows[0]?.name || '';

    // ① 소원이 주문확인 알림
    if (buyer_phone) {
      notify(buyer_phone,
        `[DreamTown] 주문이 완료됐어요 ✨\n상품: ${product.name} × ${quantity}\n배송지 ${deliveries.length}곳으로 발송됩니다\n여수의 마음이 곧 도착해요`
      );
    }
    // ② 업체 새주문접수 알림
    if (ptPhone) {
      notify(ptPhone,
        `[새 주문] ${product.name} × ${quantity}\n총 금액: ${totalAmount.toLocaleString()}원\n(사장님 수익: ${partnerAmt.toLocaleString()}원)\n배송지 ${deliveries.length}곳\n→ 주문 확인: app.dailymiracles.kr/partner/orders`
      );
    }

    return res.status(201).json({
      order_id:       orderId,
      product_name:   product.name,
      quantity,
      total_amount:   totalAmount,
      partner_amount: partnerAmt,
      delivery_count: deliveries.length,
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[shop/orders POST] 오류:', err);
    return res.status(500).json({ error: '주문 처리 중 오류가 발생했습니다.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/shop/orders?user_id=xxx
// ─────────────────────────────────────────────────────────────────────────
router.get('/orders', async (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: 'user_id가 필요합니다.' });

  try {
    const r = await db.query(`
      SELECT
        o.id, o.quantity, o.total_amount, o.status, o.created_at,
        p.name AS product_name, p.price, p.image_url,
        pt.name AS partner_name,
        json_agg(json_build_object(
          'id', d.id,
          'recipient_name', d.recipient_name,
          'address', d.address,
          'delivery_status', d.delivery_status,
          'tracking_number', d.tracking_number
        ) ORDER BY d.created_at) AS deliveries
      FROM dt_shop_orders o
      JOIN dt_shop_products p  ON p.id = o.product_id
      LEFT JOIN dt_partners pt ON pt.id = o.partner_id
      LEFT JOIN dt_order_deliveries d ON d.order_id = o.id
      WHERE o.user_id = $1
      GROUP BY o.id, p.name, p.price, p.image_url, pt.name
      ORDER BY o.created_at DESC
    `, [user_id]);

    return res.json({ orders: r.rows });
  } catch (err) {
    console.error('[shop/orders GET] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

module.exports = router;
