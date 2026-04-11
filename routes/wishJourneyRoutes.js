/**
 * wishJourneyRoutes.js — 여정 시작 + 별 생성
 *
 * POST /api/journeys/start
 *   body: { wish_id, context_id, product_id, user_key? }
 *   res:  { journey_id, star_id, status: 'started' }
 *
 * SSOT: 별은 여정 시작 CTA 클릭 시에만 생성 (소원 입력 직후 금지)
 * 이벤트: click_start_journey, create_star
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// ── galaxy_type 파생 로직 ──────────────────────────────────────────────
const ROUTE_GALAXY_MAP = {
  flow:      'healing_nebula',
  expand:    'romantic_cluster',
  resonance: 'challenge_arc',
  miracle:   'miracle_crown',
  // 기존 타입 호환
  weekday:   'weekday_drift',
  starlit:   'starlit_core',
  family:    'family_cluster',
  challenge: 'challenge_arc',
};

function deriveGalaxyType(routeType) {
  return ROUTE_GALAXY_MAP[routeType] ?? 'unknown_galaxy';
}

// ── POST /api/journeys/start ───────────────────────────────────────────
router.post('/start', async (req, res) => {
  const { wish_id, context_id, product_id, user_key } = req.body ?? {};

  if (!wish_id)    return res.status(400).json({ error: 'wish_id 필요' });
  if (!context_id) return res.status(400).json({ error: 'context_id 필요' });
  if (!product_id) return res.status(400).json({ error: 'product_id 필요' });

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // ── Idempotency 체크: 동일 wish + product 조합의 started 여정이 이미 있으면 재사용 ──
    // (중복 클릭 / 네트워크 재시도 방지)
    const { rows: [existing] } = await client.query(
      `SELECT wj.id AS journey_id, ws.id AS star_id
       FROM wish_journeys wj
       JOIN wish_stars ws ON ws.journey_id = wj.id
       WHERE wj.wish_id = $1 AND wj.product_id = $2 AND wj.status = 'started'
       LIMIT 1`,
      [wish_id, product_id]
    );
    if (existing) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        journey_id: existing.journey_id,
        star_id:    existing.star_id,
        status:     'started',
        idempotent: true,   // 디버그용 플래그 — 프론트에서는 무시해도 됨
      });
    }

    // 1. wish 확인
    const { rows: [wish] } = await client.query(
      `SELECT id FROM wishes WHERE id = $1`, [wish_id]
    );
    if (!wish) throw Object.assign(new Error('wish_id 없음'), { status: 400 });

    // 2. context 확인 (wish_id 일치)
    const { rows: [ctx] } = await client.query(
      `SELECT id FROM journey_contexts WHERE id = $1 AND wish_id = $2`,
      [context_id, wish_id]
    );
    if (!ctx) throw Object.assign(new Error('context_id 없음 또는 wish 불일치'), { status: 400 });

    // 3. product 확인
    const { rows: [product] } = await client.query(
      `SELECT id, route_type FROM dt_products WHERE id = $1 AND is_active = true`,
      [product_id]
    );
    if (!product) throw Object.assign(new Error('product_id 없음'), { status: 400 });

    // 4. wish_journey 생성 (status: started)
    const { rows: [journey] } = await client.query(
      `INSERT INTO wish_journeys (wish_id, context_id, product_id, status, started_at)
       VALUES ($1, $2, $3, 'started', NOW())
       RETURNING id`,
      [wish_id, context_id, product_id]
    );

    // 5. wish_star 생성 ← 이 지점에서만 생성 (SSOT)
    const galaxyType = deriveGalaxyType(product.route_type);
    const { rows: [star] } = await client.query(
      `INSERT INTO wish_stars (wish_id, journey_id, galaxy_type, growth_stage)
       VALUES ($1, $2, $3, 'seed')
       RETURNING id`,
      [wish_id, journey.id, galaxyType]
    );

    await client.query('COMMIT');

    // 이벤트 로그 (트랜잭션 밖, 실패해도 무관)
    db.query(
      `INSERT INTO dt_events (user_id, event_name, params) VALUES ($1, $2, $3)`,
      [user_key ?? null, 'click_start_journey', { wish_id, context_id, product_id, journey_id: journey.id }]
    ).catch(() => {});
    db.query(
      `INSERT INTO dt_events (user_id, event_name, params) VALUES ($1, $2, $3)`,
      [user_key ?? null, 'create_star', { star_id: star.id, journey_id: journey.id, galaxy_type: galaxyType }]
    ).catch(() => {});

    return res.status(201).json({
      journey_id: journey.id,
      star_id:    star.id,
      status:     'started',
    });
  } catch (e) {
    await client.query('ROLLBACK');
    const status = e.status ?? 500;
    console.error('[wishJourney] start error:', e.message);
    return res.status(status).json({ error: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
