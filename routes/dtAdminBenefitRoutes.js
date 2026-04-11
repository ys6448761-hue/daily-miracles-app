/**
 * dtAdminBenefitRoutes.js — DreamTown Benefit Engine 관리자 API
 *
 * POST   /api/admin/dt/partner              업체 생성
 * PATCH  /api/admin/dt/partner/:id          업체 수정 / 비활성화
 * GET    /api/admin/dt/partners             업체 목록
 * POST   /api/admin/dt/benefit              혜택 추가
 * PATCH  /api/admin/dt/benefit/:id          혜택 수정 / 비활성화
 * GET    /api/admin/dt/benefits             혜택 목록
 * POST   /api/admin/dt/product-benefit      상품-혜택 연결
 * DELETE /api/admin/dt/product-benefit/:id  연결 해제
 * GET    /api/admin/dt/products             상품 목록 (시드 확인)
 * GET    /api/admin/dt/regions              지역 목록
 * POST   /api/admin/dt/region              지역 추가
 *
 * 규칙: 삭제 ❌ / 비활성화 ✅ (is_active = false)
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtAdminBenefit');

// ── 간단 관리자 인증 (X-Admin-Key 헤더) ──────────────────────────────
function adminAuth(req, res, next) {
  const key = req.headers['x-admin-key'] ?? req.query.admin_key;
  if (!key || key !== (process.env.ADMIN_API_KEY ?? 'dt-admin-2025')) {
    return res.status(401).json({ error: '관리자 인증 필요' });
  }
  next();
}
router.use(adminAuth);

// ──────────────────────────────────────────────────────────────────────
// REGIONS
// ──────────────────────────────────────────────────────────────────────

// GET /regions
router.get('/regions', async (req, res) => {
  const { rows } = await db.query(
    `SELECT * FROM dt_regions ORDER BY country_code, city_name`
  ).catch(e => { throw e; });
  res.json({ ok: true, regions: rows });
});

// POST /region
router.post('/region', async (req, res) => {
  const { country_code, city_code, city_name, currency = 'KRW' } = req.body ?? {};
  if (!country_code || !city_code || !city_name) {
    return res.status(400).json({ error: 'country_code, city_code, city_name 필요' });
  }
  try {
    const { rows: [row] } = await db.query(
      `INSERT INTO dt_regions (country_code, city_code, city_name, currency)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [country_code, city_code, city_name, currency]
    );
    res.status(201).json({ ok: true, region: row });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: `city_code '${city_code}' 이미 존재` });
    log.error('region 생성 실패', { err: err.message });
    res.status(500).json({ error: '지역 생성 실패' });
  }
});

// ──────────────────────────────────────────────────────────────────────
// PARTNERS
// ──────────────────────────────────────────────────────────────────────

// GET /partners
router.get('/partners', async (req, res) => {
  const { city_code, category, is_active } = req.query;
  const params = [];
  const conds  = [];

  if (city_code) { params.push(city_code);   conds.push(`city_code = $${params.length}`); }
  if (category)  { params.push(category);    conds.push(`category = $${params.length}`); }
  if (is_active !== undefined) {
    params.push(is_active === 'true' || is_active === '1');
    conds.push(`is_active = $${params.length}`);
  }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const { rows } = await db.query(
    `SELECT * FROM dt_partners ${where} ORDER BY city_code, category, name`,
    params
  );
  res.json({ ok: true, partners: rows });
});

// POST /partner
router.post('/partner', async (req, res) => {
  const { city_code, name, category, address, lat, lng, phone, description } = req.body ?? {};
  if (!city_code || !name || !category) {
    return res.status(400).json({ error: 'city_code, name, category 필요' });
  }
  try {
    const { rows: [row] } = await db.query(
      `INSERT INTO dt_partners (city_code, name, category, address, lat, lng, phone, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [city_code, name, category, address ?? null, lat ?? null, lng ?? null, phone ?? null, description ?? null]
    );
    log.info('파트너 생성', { id: row.id, name });
    res.status(201).json({ ok: true, partner: row });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: `city_code '${city_code}' 없음` });
    if (err.code === '23514') return res.status(400).json({ error: `허용되지 않는 category: ${category}` });
    log.error('파트너 생성 실패', { err: err.message });
    res.status(500).json({ error: '파트너 생성 실패' });
  }
});

// PATCH /partner/:id
router.patch('/partner/:id', async (req, res) => {
  const { id } = req.params;
  const ALLOWED = ['name','category','address','lat','lng','phone','description','is_active'];
  const updates = Object.entries(req.body ?? {}).filter(([k]) => ALLOWED.includes(k));

  if (!updates.length) return res.status(400).json({ error: '수정할 필드 없음' });

  const sets   = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
  const values = updates.map(([, v]) => v);

  try {
    const { rows: [row] } = await db.query(
      `UPDATE dt_partners SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    if (!row) return res.status(404).json({ error: '파트너 없음' });
    log.info('파트너 수정', { id, fields: updates.map(([k]) => k) });
    res.json({ ok: true, partner: row });
  } catch (err) {
    log.error('파트너 수정 실패', { err: err.message });
    res.status(500).json({ error: '파트너 수정 실패' });
  }
});

// ──────────────────────────────────────────────────────────────────────
// BENEFITS
// ──────────────────────────────────────────────────────────────────────

// GET /benefits
router.get('/benefits', async (req, res) => {
  const { partner_id, is_active, city_code } = req.query;
  const params = [];
  const conds  = ['1=1'];

  if (partner_id) { params.push(partner_id); conds.push(`b.partner_id = $${params.length}`); }
  if (city_code)  { params.push(city_code);  conds.push(`pt.city_code = $${params.length}`); }
  if (is_active !== undefined) {
    params.push(is_active === 'true' || is_active === '1');
    conds.push(`b.is_active = $${params.length}`);
  }

  const { rows } = await db.query(
    `SELECT b.*, pt.name AS partner_name, pt.city_code, pt.category AS partner_category
     FROM dt_benefits b
     JOIN dt_partners pt ON b.partner_id = pt.id
     WHERE ${conds.join(' AND ')}
     ORDER BY pt.city_code, b.created_at DESC`,
    params
  );
  res.json({ ok: true, benefits: rows });
});

// POST /benefit
router.post('/benefit', async (req, res) => {
  const { partner_id, benefit_type, title, description, display_copy, location_hint, valid_from, valid_to } = req.body ?? {};
  if (!partner_id || !benefit_type || !title || !display_copy) {
    return res.status(400).json({ error: 'partner_id, benefit_type, title, display_copy 필요' });
  }
  try {
    const { rows: [row] } = await db.query(
      `INSERT INTO dt_benefits
         (partner_id, benefit_type, title, description, display_copy, location_hint, valid_from, valid_to)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [partner_id, benefit_type, title, description ?? null, display_copy,
       location_hint ?? null, valid_from ?? null, valid_to ?? null]
    );
    log.info('혜택 생성', { id: row.id, title });
    res.status(201).json({ ok: true, benefit: row });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: `partner_id '${partner_id}' 없음` });
    if (err.code === '23514') return res.status(400).json({ error: `허용되지 않는 benefit_type: ${benefit_type}` });
    log.error('혜택 생성 실패', { err: err.message });
    res.status(500).json({ error: '혜택 생성 실패' });
  }
});

// PATCH /benefit/:id
router.patch('/benefit/:id', async (req, res) => {
  const { id } = req.params;
  const ALLOWED = ['benefit_type','title','description','display_copy','location_hint','valid_from','valid_to','is_active'];
  const updates = Object.entries(req.body ?? {}).filter(([k]) => ALLOWED.includes(k));

  if (!updates.length) return res.status(400).json({ error: '수정할 필드 없음' });

  const sets   = updates.map(([k], i) => `${k} = $${i + 2}`).join(', ');
  const values = updates.map(([, v]) => v);

  try {
    const { rows: [row] } = await db.query(
      `UPDATE dt_benefits SET ${sets}, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    if (!row) return res.status(404).json({ error: '혜택 없음' });
    res.json({ ok: true, benefit: row });
  } catch (err) {
    log.error('혜택 수정 실패', { err: err.message });
    res.status(500).json({ error: '혜택 수정 실패' });
  }
});

// ──────────────────────────────────────────────────────────────────────
// PRODUCTS (읽기 + 혜택 연결)
// ──────────────────────────────────────────────────────────────────────

// GET /products
router.get('/products', async (req, res) => {
  const { city_code } = req.query;
  const params = [];
  const where  = city_code ? `WHERE p.city_code = $${params.push(city_code)}` : '';

  const { rows } = await db.query(
    `SELECT p.*, COUNT(pb.id) AS linked_benefits
     FROM dt_products p
     LEFT JOIN dt_product_benefits pb ON p.id = pb.product_id
     ${where}
     GROUP BY p.id
     ORDER BY p.route_type, p.display_order`,
    params
  );
  res.json({ ok: true, products: rows });
});

// POST /product-benefit — 상품에 혜택 연결
router.post('/product-benefit', async (req, res) => {
  const { product_id, benefit_id, display_order = 0 } = req.body ?? {};
  if (!product_id || !benefit_id) {
    return res.status(400).json({ error: 'product_id, benefit_id 필요' });
  }
  try {
    const { rows: [row] } = await db.query(
      `INSERT INTO dt_product_benefits (product_id, benefit_id, display_order)
       VALUES ($1, $2, $3)
       ON CONFLICT (product_id, benefit_id) DO UPDATE SET display_order = EXCLUDED.display_order
       RETURNING *`,
      [product_id, benefit_id, display_order]
    );
    log.info('상품-혜택 연결', { product_id, benefit_id });
    res.status(201).json({ ok: true, link: row });
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'product_id 또는 benefit_id 없음' });
    log.error('상품-혜택 연결 실패', { err: err.message });
    res.status(500).json({ error: '연결 실패' });
  }
});

// DELETE /product-benefit/:id — 연결 해제 (soft delete 대신 실제 삭제 허용: 연결 메타 데이터만)
router.delete('/product-benefit/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await db.query(
      `DELETE FROM dt_product_benefits WHERE id = $1`, [id]
    );
    if (!rowCount) return res.status(404).json({ error: '연결 없음' });
    res.json({ ok: true });
  } catch (err) {
    log.error('연결 해제 실패', { err: err.message });
    res.status(500).json({ error: '연결 해제 실패' });
  }
});

module.exports = router;
