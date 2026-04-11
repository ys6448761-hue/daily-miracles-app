/**
 * dtProductRoutes.js — DreamTown 상품 + 혜택 조회
 *
 * GET  /api/dt/products              도시별/항로별 상품 목록
 * GET  /api/dt/products/:id          상품 상세 + 연결된 혜택
 * GET  /api/dt/products/route/:route 항로별 상품 목록 (퍼널 추천 연동)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtProduct');

// ── GET /products ── 목록 (city_code + route_type 필터) ────────────────
router.get('/', async (req, res) => {
  const { city_code = 'yeosu', route_type } = req.query;

  try {
    const params = [city_code];
    let where = 'p.city_code = $1 AND p.is_active = true';
    if (route_type) {
      params.push(route_type);
      where += ` AND p.route_type = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT p.id, p.product_code, p.city_code, p.route_type,
              p.title, p.price, p.tag, p.benefit_types, p.display_order
       FROM dt_products p
       WHERE ${where}
       ORDER BY p.route_type, p.display_order`,
      params
    );

    res.json({ ok: true, products: rows });
  } catch (err) {
    log.error('상품 목록 조회 실패', { err: err.message });
    res.status(500).json({ error: '상품 목록 조회 실패' });
  }
});

// ── GET /products/route/:route ── 항로별 상품 (퍼널 연동) ─────────────
router.get('/route/:route', async (req, res) => {
  const { route } = req.params;
  const { city_code = 'yeosu' } = req.query;

  try {
    const { rows: products } = await db.query(
      `SELECT id, product_code, route_type, title, price, tag, benefit_types
       FROM dt_products
       WHERE city_code = $1 AND route_type = $2 AND is_active = true
       ORDER BY display_order
       LIMIT 2`,
      [city_code, route]
    );

    if (!products.length) {
      return res.json({ ok: true, route_type: route, products: [] });
    }

    // 각 상품에 혜택 연결
    const productIds = products.map(p => p.id);
    const { rows: benefits } = await db.query(
      `SELECT pb.product_id,
              b.id AS benefit_id, b.benefit_type, b.title,
              b.display_copy, b.location_hint, b.description,
              pt.name AS partner_name, pt.category AS partner_category,
              pb.display_order
       FROM dt_product_benefits pb
       JOIN dt_benefits b  ON pb.benefit_id  = b.id
       JOIN dt_partners pt ON b.partner_id   = pt.id
       WHERE pb.product_id = ANY($1)
         AND b.is_active = true AND pt.is_active = true
       ORDER BY pb.product_id, pb.display_order`,
      [productIds]
    );

    const benefitMap = {};
    for (const b of benefits) {
      if (!benefitMap[b.product_id]) benefitMap[b.product_id] = [];
      benefitMap[b.product_id].push({
        benefit_id:       b.benefit_id,
        benefit_type:     b.benefit_type,
        title:            b.title,
        display_copy:     b.display_copy,
        location_hint:    b.location_hint,
        description:      b.description,
        partner_name:     b.partner_name,
        partner_category: b.partner_category,
      });
    }

    const result = products.map(p => ({
      ...p,
      benefits: benefitMap[p.id] ?? [],
    }));

    res.json({ ok: true, route_type: route, products: result });
  } catch (err) {
    log.error('항로별 상품 조회 실패', { err: err.message });
    res.status(500).json({ error: '상품 조회 실패' });
  }
});

// ── GET /products/:id ── 상품 상세 + 혜택 ────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // UUID 또는 product_code 모두 수용
    const isUUID = /^[0-9a-f-]{36}$/i.test(id);
    const { rows: [product] } = await db.query(
      `SELECT p.*, r.city_name, r.country_code
       FROM dt_products p
       JOIN dt_regions r ON p.city_code = r.city_code
       WHERE ${isUUID ? 'p.id = $1' : 'p.product_code = $1'}
         AND p.is_active = true`,
      [id]
    );

    if (!product) return res.status(404).json({ error: '상품 없음' });

    const { rows: benefits } = await db.query(
      `SELECT b.id, b.benefit_type, b.title, b.description,
              b.display_copy, b.location_hint,
              b.valid_from, b.valid_to,
              pt.id AS partner_id, pt.name AS partner_name,
              pt.category AS partner_category,
              pt.address, pt.lat, pt.lng,
              pb.display_order
       FROM dt_product_benefits pb
       JOIN dt_benefits b  ON pb.benefit_id  = b.id
       JOIN dt_partners pt ON b.partner_id   = pt.id
       WHERE pb.product_id = $1
         AND b.is_active = true
         AND pt.is_active = true
         AND (b.valid_to IS NULL OR b.valid_to >= CURRENT_DATE)
       ORDER BY pb.display_order`,
      [product.id]
    );

    log.info('상품 조회', { product_code: product.product_code, benefit_count: benefits.length });

    res.json({
      ok:      true,
      product: {
        id:           product.id,
        product_code: product.product_code,
        city_code:    product.city_code,
        city_name:    product.city_name,
        country_code: product.country_code,
        route_type:   product.route_type,
        title:        product.title,
        price:        product.price,
        tag:          product.tag,
        benefit_types: product.benefit_types,
      },
      benefits: benefits.map(b => ({
        id:               b.id,
        benefit_type:     b.benefit_type,
        title:            b.title,
        display_copy:     b.display_copy,
        description:      b.description,
        location_hint:    b.location_hint,
        valid_from:       b.valid_from,
        valid_to:         b.valid_to,
        partner: {
          id:       b.partner_id,
          name:     b.partner_name,
          category: b.partner_category,
          address:  b.address,
          lat:      b.lat,
          lng:      b.lng,
        },
      })),
    });
  } catch (err) {
    log.error('상품 상세 조회 실패', { err: err.message });
    res.status(500).json({ error: '상품 조회 실패' });
  }
});

module.exports = router;
