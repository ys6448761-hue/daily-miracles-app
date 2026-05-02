'use strict';

/**
 * starPublicRoutes.js
 * prefix: /api/stars
 *
 * POST /:id/memory          시스템 기억 추가 (Private — 외부 노출 금지)
 * POST /:id/share           별 공개 공유 (star_shares + is_shared=true)
 * GET  /public/feed         공개 별 피드 (소원 원문 제외)
 * POST /public/:id/resonate 공명 이벤트
 * GET  /constellations      별자리 목록
 * GET  /galaxies            은하 목록
 *
 * SSOT v1 원칙:
 *   stars      = 시작
 *   memories   = 시간 (시스템 기록)
 *   shares     = 외부 노출 유일 채널
 *   resonances = 공명 (좋아요 아님)
 */

const router = require('express').Router();
const db     = require('../database/db');

// ── POST /:id/memory ─────────────────────────────────────────────
// 시스템이 별의 기억을 쌓는 구조 — 사용자 직접 입력 아님
router.post('/:id/memory', async (req, res) => {
  const { id } = req.params;
  const { type, emotion, reaction } = req.body || {};

  if (!reaction || reaction.trim().length === 0) {
    return res.status(400).json({ success: false, error: 'reaction 필수' });
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO star_memories (star_id, type, emotion, reaction)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [id, type || null, emotion || null, reaction.trim()]
    );
    return res.json({ success: true, memory: rows[0] });
  } catch (e) {
    console.error('[star/memory]', e.message);
    return res.status(500).json({ success: false, error: '저장 실패' });
  }
});

// ── POST /:id/share ──────────────────────────────────────────────
// 공개 공유 — star_shares에 기록 + stars.is_shared=true
router.post('/:id/share', async (req, res) => {
  const { id } = req.params;
  const { public_message } = req.body || {};

  try {
    await db.query(
      `INSERT INTO star_shares (star_id, public_message) VALUES ($1, $2)`,
      [id, public_message || null]
    );
    await db.query(
      `UPDATE stars SET is_shared = TRUE WHERE id = $1`,
      [id]
    );
    return res.json({ success: true });
  } catch (e) {
    console.error('[star/share]', e.message);
    return res.status(500).json({ success: false, error: '저장 실패' });
  }
});

// ── GET /public/feed ─────────────────────────────────────────────
// 공개 피드 — wish_summary·image_url·emotion·gem만 노출
// 소원 원문(wish_text) 절대 포함 안 함
// ?limit=20&offset=0
router.get('/public/feed', async (req, res) => {
  const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
  const offset = parseInt(req.query.offset) || 0;

  try {
    const { rows } = await db.query(
      `SELECT
         s.id,
         s.emotion,
         s.gem,
         s.image_url,
         sh.public_message,
         COUNT(r.id)::INT AS resonance_count
       FROM stars s
       LEFT JOIN LATERAL (
         SELECT public_message FROM star_shares
         WHERE star_id = s.id
         ORDER BY shared_at DESC
         LIMIT 1
       ) sh ON TRUE
       LEFT JOIN star_resonances r ON r.star_id = s.id
       WHERE s.is_shared = TRUE
       GROUP BY s.id, sh.public_message
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.json({ success: true, stars: rows, limit, offset });
  } catch (e) {
    console.error('[star/feed]', e.message);
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

// ── POST /public/:id/resonate ────────────────────────────────────
// 공명 — 좋아요가 아니라 울림의 기록
router.post('/public/:id/resonate', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: starRows } = await db.query(
      `SELECT id FROM stars WHERE id = $1 AND is_shared = TRUE`,
      [id]
    );
    if (starRows.length === 0) {
      return res.status(404).json({ success: false, error: '공개 별 아님' });
    }

    await db.query(
      `INSERT INTO star_resonances (star_id) VALUES ($1)`,
      [id]
    );

    const { rows } = await db.query(
      `SELECT COUNT(*)::INT AS resonance_count FROM star_resonances WHERE star_id = $1`,
      [id]
    );

    return res.json({ success: true, resonance_count: rows[0].resonance_count });
  } catch (e) {
    console.error('[star/resonate]', e.message);
    return res.status(500).json({ success: false, error: '공명 실패' });
  }
});

// ── GET /public/:id — 공유 유입용 별 프리뷰 ─────────────────────
// wish_text 앞 30자만 노출 (소원 원문 최소 노출)
router.get('/public/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      `SELECT emotion, gem_type,
              LEFT(wish_text, 30) AS wish_preview
       FROM   stars
       WHERE  id = $1`,
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false });
    return res.json({ success: true, ...rows[0] });
  } catch (e) {
    console.error('[star/public/:id]', e.message);
    if (e.code === '42P01') return res.status(503).json({ success: false, error: '준비 중' });
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

// ── GET /constellations/:id ──────────────────────────────────────
// 별자리 상세 — 소속 별의 이미지 + 공개 메시지만 노출
router.get('/constellations/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: constRows } = await db.query(
      `SELECT id, start_emotion, end_emotion, summary FROM constellations WHERE id = $1`,
      [id]
    );
    if (constRows.length === 0) {
      return res.status(404).json({ success: false, error: '별자리 없음' });
    }
    const constellation = constRows[0];

    const { rows: starRows } = await db.query(
      `SELECT
         cs.star_id AS id,
         ds.emotion_tag AS emotion,
         ds.star_name,
         si.image_url,
         sh.public_message
       FROM constellation_stars cs
       JOIN dt_stars ds ON ds.id = cs.star_id
       LEFT JOIN LATERAL (
         SELECT image_url FROM star_images
         WHERE star_id = cs.star_id
         ORDER BY created_at DESC LIMIT 1
       ) si ON TRUE
       LEFT JOIN LATERAL (
         SELECT public_message FROM star_shares
         WHERE star_id = cs.star_id
         ORDER BY shared_at DESC LIMIT 1
       ) sh ON TRUE
       WHERE cs.constellation_id = $1
       ORDER BY cs.created_at DESC
       LIMIT 30`,
      [id]
    );

    return res.json({ success: true, constellation, stars: starRows });
  } catch (e) {
    console.error('[constellations/:id]', e.message);
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

// ── GET /constellations ──────────────────────────────────────────
// 별자리 목록 — 은하 소속 포함
router.get('/constellations', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         c.id, c.start_emotion, c.end_emotion, c.summary,
         array_agg(gc.galaxy_id) AS galaxy_ids
       FROM constellations c
       LEFT JOIN galaxy_constellations gc ON gc.constellation_id = c.id
       GROUP BY c.id
       ORDER BY c.id`
    );
    return res.json({ success: true, constellations: rows });
  } catch (e) {
    console.error('[constellations]', e.message);
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

// ── GET /galaxies ─────────────────────────────────────────────────
// 은하 목록 (direction 포함)
router.get('/galaxies', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, description, direction FROM galaxies ORDER BY id`
    );
    return res.json({ success: true, galaxies: rows });
  } catch (e) {
    console.error('[galaxies]', e.message);
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

// ── GET /galaxies/:id ─────────────────────────────────────────────
// 은하 상세 + 소속 별자리 목록
router.get('/galaxies/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows: gRows } = await db.query(
      `SELECT id, name, description, direction FROM galaxies WHERE id = $1`,
      [id]
    );
    if (gRows.length === 0) {
      return res.status(404).json({ success: false, error: '은하 없음' });
    }
    const galaxy = gRows[0];

    const { rows: constRows } = await db.query(
      `SELECT
         c.id, c.start_emotion, c.end_emotion, c.summary,
         COUNT(cs.star_id)::INT AS star_count
       FROM galaxy_constellations gc
       JOIN constellations c ON c.id = gc.constellation_id
       LEFT JOIN constellation_stars cs ON cs.constellation_id = c.id
       WHERE gc.galaxy_id = $1
       GROUP BY c.id
       ORDER BY c.id`,
      [id]
    );

    return res.json({ success: true, galaxy, constellations: constRows });
  } catch (e) {
    console.error('[galaxies/:id]', e.message);
    return res.status(500).json({ success: false, error: '조회 실패' });
  }
});

module.exports = router;
