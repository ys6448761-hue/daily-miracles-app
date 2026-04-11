'use strict';

/**
 * shopRoutes.js — 여수 특산품 쇼핑 (소원이용)
 *
 * GET  /api/shop/products              전체 상품 목록 (wish_type/category 필터)
 * GET  /api/shop/products/:id          상품 상세
 * POST /api/shop/orders                주문 생성 (다중 배송지 + 별 성장 연동)
 * GET  /api/shop/orders                내 주문 내역
 * GET  /api/shop/bundles               선물 세트 목록
 * GET  /api/shop/recommend/:starId     별 맞춤 상품 추천
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
// Query: ?category=food&wish_type=healing
// ─────────────────────────────────────────────────────────────────────────
router.get('/products', async (req, res) => {
  const { category, wish_type } = req.query;
  try {
    const conditions = ['p.is_active = TRUE'];
    const params = [];

    if (category && category !== '전체') {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }
    if (wish_type) {
      params.push(wish_type);
      conditions.push(`p.wish_types @> ARRAY[$${params.length}]`);
    }

    const r = await db.query(`
      SELECT
        p.id, p.name, p.description, p.price, p.stock,
        p.image_url, p.category, p.is_gift_available,
        p.wish_types, p.is_bundle,
        pt.name AS partner_name, pt.city_code,
        CASE WHEN p.wish_types @> ARRAY[${ wish_type ? `'${wish_type}'` : "''"}] THEN 0 ELSE 1 END AS _sort
      FROM dt_shop_products p
      LEFT JOIN dt_partners pt ON pt.id = p.partner_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY _sort, p.created_at DESC
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
        p.wish_types, p.is_bundle,
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
// GET /api/shop/bundles
// Query: ?wish_type=healing
// ─────────────────────────────────────────────────────────────────────────
router.get('/bundles', async (req, res) => {
  const { wish_type } = req.query;
  try {
    const conditions = ['b.is_active = TRUE'];
    const params = [];
    if (wish_type) {
      params.push(wish_type);
      conditions.push(`b.wish_types @> ARRAY[$${params.length}]`);
    }

    const r = await db.query(`
      SELECT id, name, description, original_price, bundle_price,
             image_url, wish_types, created_at
        FROM dt_shop_bundles
       WHERE ${conditions.join(' AND ')}
       ORDER BY bundle_price ASC
    `, params);

    return res.json({ bundles: r.rows });
  } catch (err) {
    console.error('[shop/bundles] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/shop/recommend/:starId
// 별 소원 분석 → 맞춤 상품 3개 + 번들 1개
// ─────────────────────────────────────────────────────────────────────────
router.get('/recommend/:starId', async (req, res) => {
  const { starId } = req.params;
  try {
    const starR = await db.query(
      `SELECT id, star_name, wish_text FROM dt_stars WHERE id = $1`,
      [starId]
    );
    const star = starR.rows[0];

    // 소원 키워드 → wish_type 추론
    const wishText = star?.wish_text || '';
    let inferredType = 'healing';
    if (/건강|아프|병|치료|몸/.test(wishText))          inferredType = 'health';
    else if (/성장|발전|공부|실력|능력/.test(wishText))   inferredType = 'growth';
    else if (/도전|새로운|시작|용기|꿈/.test(wishText))   inferredType = 'challenge';
    else if (/사랑|관계|가족|친구|연인/.test(wishText))   inferredType = 'relationship';
    else if (/치유|힐링|쉬고|회복|위로/.test(wishText))   inferredType = 'healing';

    // 맞춤 상품 3개 (wish_type 일치 우선)
    const prodR = await db.query(`
      SELECT p.id, p.name, p.price, p.image_url, p.category, p.wish_types,
             pt.name AS partner_name
        FROM dt_shop_products p
        LEFT JOIN dt_partners pt ON pt.id = p.partner_id
       WHERE p.is_active = TRUE
       ORDER BY
         CASE WHEN p.wish_types @> ARRAY[$1] THEN 0 ELSE 1 END,
         p.created_at DESC
       LIMIT 3
    `, [inferredType]);

    // 번들 1개
    const bundleR = await db.query(`
      SELECT id, name, bundle_price, original_price, image_url, wish_types
        FROM dt_shop_bundles
       WHERE is_active = TRUE
         AND wish_types @> ARRAY[$1]
       LIMIT 1
    `, [inferredType]);

    return res.json({
      star_id:       starId,
      star_name:     star?.star_name || null,
      inferred_type: inferredType,
      products:      prodR.rows,
      bundle:        bundleR.rows[0] || null,
    });
  } catch (err) {
    console.error('[shop/recommend] 오류:', err);
    return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/shop/orders
// Body: { product_id, quantity, deliveries, payment_key?, buyer_phone?, user_id? }
// ─────────────────────────────────────────────────────────────────────────
router.post('/orders', async (req, res) => {
  const { product_id, quantity = 1, deliveries = [], payment_key, buyer_phone, user_id } = req.body;

  if (!product_id) return res.status(400).json({ error: 'product_id가 필요합니다.' });
  if (!deliveries.length) return res.status(400).json({ error: '배송지를 1개 이상 입력해주세요.' });

  for (const d of deliveries) {
    if (!d.recipient_name || !d.recipient_phone || !d.address) {
      return res.status(400).json({ error: '배송지 정보가 불완전합니다.' });
    }
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 상품 조회 + 재고 잠금
    const pR = await client.query(
      `SELECT id, name, price, stock, partner_id FROM dt_shop_products WHERE id = $1 AND is_active = TRUE FOR UPDATE`,
      [product_id]
    );
    const product = pR.rows[0];
    if (!product) { await client.query('ROLLBACK'); return res.status(404).json({ error: '상품을 찾을 수 없습니다.' }); }
    if (product.stock < quantity) { await client.query('ROLLBACK'); return res.status(409).json({ error: '재고가 부족합니다.' }); }

    // 소원이 최근 별 조회 (별 성장 연동)
    let starId = null;
    let starName = null;
    if (user_id) {
      const starR = await client.query(
        `SELECT id, star_name FROM dt_stars WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
        [user_id]
      );
      if (starR.rows[0]) {
        starId   = starR.rows[0].id;
        starName = starR.rows[0].star_name;
      }
    }

    // 금액 계산
    const totalAmount = product.price * quantity;
    const platformAmt = Math.round(totalAmount * PLATFORM_RATE);
    const partnerAmt  = totalAmount - platformAmt;

    // 재고 차감
    await client.query(`UPDATE dt_shop_products SET stock = stock - $1 WHERE id = $2`, [quantity, product_id]);

    // 주문 생성
    const oR = await client.query(`
      INSERT INTO dt_shop_orders
        (user_id, partner_id, product_id, quantity, total_amount, partner_amount,
         platform_amount, buyer_phone, payment_key, status, star_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'paid',$10)
      RETURNING id
    `, [user_id || null, product.partner_id, product_id, quantity,
        totalAmount, partnerAmt, platformAmt, buyer_phone || null,
        payment_key || null, starId || null]);
    const orderId = oR.rows[0].id;

    // 배송지 생성
    for (const d of deliveries) {
      await client.query(`
        INSERT INTO dt_order_deliveries
          (order_id, recipient_name, recipient_phone, address, gift_message)
        VALUES ($1,$2,$3,$4,$5)
      `, [orderId, d.recipient_name, d.recipient_phone, d.address, d.gift_message || null]);
    }

    // 별 성장 연동
    if (starId) {
      await client.query(
        `UPDATE dt_stars SET hometown_visit_count = COALESCE(hometown_visit_count,0) + 1 WHERE id = $1`,
        [starId]
      );
      // growth_timeline 기록 (테이블 없으면 무시)
      await client.query(
        `INSERT INTO growth_timeline (star_id, event_type, event_summary, created_at)
         VALUES ($1, 'shop_purchase', $2, NOW())`,
        [starId, `${product.name} 선물 발송`]
      ).catch(() => {});
    }

    await client.query('COMMIT');

    // 파트너 정보 조회 (알림용)
    const ptR = await db.query(`SELECT name, phone FROM dt_partners WHERE id = $1`, [product.partner_id]).catch(() => ({ rows: [] }));
    const ptPhone = ptR.rows[0]?.phone;
    const ptName  = ptR.rows[0]?.name || '';

    // ① 주문자 확인 알림
    if (buyer_phone) {
      notify(buyer_phone,
        `[DreamTown] 주문이 완료됐어요 ✨\n상품: ${product.name} × ${quantity}\n배송지 ${deliveries.length}곳으로 발송됩니다\n여수의 마음이 곧 도착해요`
      );
    }
    // ② 업체 새주문 알림
    if (ptPhone) {
      notify(ptPhone,
        `[새 주문] ${product.name} × ${quantity}\n총 금액: ${totalAmount.toLocaleString()}원\n(사장님 수익: ${partnerAmt.toLocaleString()}원)\n배송지 ${deliveries.length}곳\n→ app.dailymiracles.kr/partner/orders`
      );
    }

    // 재구매 알림 등록 (8일 후)
    if (user_id) {
      const remindAt = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
      db.query(
        `INSERT INTO dt_reorder_reminders (order_id, product_id, user_id, remind_at) VALUES ($1,$2,$3,$4)`,
        [orderId, product_id, user_id, remindAt]
      ).catch(() => {});
    }

    return res.status(201).json({
      order_id:       orderId,
      product_name:   product.name,
      quantity,
      total_amount:   totalAmount,
      partner_amount: partnerAmt,
      delivery_count: deliveries.length,
      star_growth:    !!starId,
      star_name:      starName,
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
        o.star_id,
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
