/**
 * dtBenefitPublicRoutes.js — 소원패스 혜택 공개 API
 *
 * GET /api/dt/benefits/starlight
 *   city_code     (default: yeosu)
 *   location_group (hotel_vicinity | yeosu_city — 없으면 전체)
 *
 * confirmed 파트너만 반환. candidate/negotiating은 고객에게 노출하지 않는다.
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtBenefitPublic');

// GET /api/dt/benefits/starlight
router.get('/starlight', async (req, res) => {
  const { city_code = 'yeosu', location_group } = req.query;

  try {
    const params = [city_code];
    let groupFilter = '';
    if (location_group) {
      params.push(location_group);
      groupFilter = `AND p.location_group = $${params.length}`;
    }

    const { rows } = await db.query(
      `SELECT
         p.id,
         p.name,
         p.category,
         p.address,
         p.lat,
         p.lng,
         p.phone,
         p.location_group,
         p.is_night,
         p.affiliation_status,
         p.naver_map_url,
         COALESCE(
           json_agg(
             json_build_object(
               'id',            b.id,
               'benefit_type',  b.benefit_type,
               'title',         b.title,
               'display_copy',  b.display_copy,
               'description',   b.description,
               'location_hint', b.location_hint
             ) ORDER BY b.created_at
           ) FILTER (WHERE b.id IS NOT NULL),
           '[]'
         ) AS benefits
       FROM dt_partners p
       LEFT JOIN dt_benefits b
              ON b.partner_id = p.id AND b.is_active = true
       WHERE p.city_code          = $1
         AND p.is_active          = true
         AND p.affiliation_status = 'confirmed'
         ${groupFilter}
       GROUP BY p.id
       ORDER BY p.name`,
      params
    );

    // 그룹별 분류
    const hotel_vicinity = rows.filter(r => r.location_group === 'hotel_vicinity');
    const yeosu_city     = rows.filter(r => r.location_group === 'yeosu_city');

    res.json({ hotel_vicinity, yeosu_city });
  } catch (err) {
    log.error('starlight benefits error:', err.message);
    res.status(500).json({ error: 'DB 오류가 발생했습니다' });
  }
});

module.exports = router;
