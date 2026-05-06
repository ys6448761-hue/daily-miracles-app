'use strict';

/**
 * adminResonanceRoutes.js — 별 공명/연결 관리자 API
 * Base path: /api/admin
 *
 * GET /star/:access_key              → 별 통계 (share/view/conversion/return)
 * GET /connections/tree/:access_key  → 부모-자식 중첩 트리 JSON
 * GET /storybook/:access_key         → 별의 여정 연결 컨텍스트
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

// ── 인증 가드 ─────────────────────────────────────────────────────
function adminGuard(req, res, next) {
  const key = req.headers['x-admin-key'] || req.query.key;
  if (!process.env.ADMIN_API_KEY) {
    return res.status(503).json({ success: false, error: 'admin disabled — ADMIN_API_KEY not configured' });
  }
  if (key === process.env.ADMIN_API_KEY) return next();
  return res.status(401).json({ success: false, error: '관리자 인증 필요 (?key=...)' });
}

// ── 헬퍼: safe int ────────────────────────────────────────────────
const toInt = v => parseInt(v ?? 0, 10);

// ── 헬퍼: 평탄 트리 → 중첩 트리 ──────────────────────────────────
function nestTree(rows, rootKey) {
  if (!rows.length) return null;
  const map = {};
  rows.forEach(r => { map[r.access_key] = { ...r, children: [] }; });

  let root = null;
  rows.forEach(r => {
    if (r.access_key === rootKey) {
      root = map[r.access_key];
    } else if (r.parent_ref && map[r.parent_ref]) {
      map[r.parent_ref].children.push(map[r.access_key]);
    }
  });
  return root;
}

// ─────────────────────────────────────────────────────────────────
// 1. GET /star/:access_key — 별 통계
// ─────────────────────────────────────────────────────────────────
router.get('/star/:access_key', adminGuard, async (req, res) => {
  const { access_key } = req.params;

  try {
    // 별 기본 정보
    const { rows: starRows } = await db.query(
      `SELECT access_key, emotion, origin_location, parent_ref, status,
              journey_id, resonance_score, created_at
       FROM stars WHERE access_key = $1`,
      [access_key]
    ).catch(() => db.query(
      `SELECT access_key, emotion, origin_location, parent_ref, status, created_at
       FROM stars WHERE access_key = $1`,
      [access_key]
    ));
    if (!starRows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다' });
    }
    const star = starRows[0];

    // 병렬 통계 조회 (포스트카드 + 스토리북)
    const [shareRes, viewRes, convRes, returnRes, connAggRes,
           sbViewRes, sbShareRes, sbConvRes] = await Promise.all([
      db.query('SELECT COUNT(*) AS n FROM star_share_events WHERE access_key = $1', [access_key])
        .catch(() => ({ rows: [{ n: 0 }] })),
      db.query('SELECT COUNT(*) AS n FROM star_visit_events WHERE ref_access_key = $1', [access_key])
        .catch(() => ({ rows: [{ n: 0 }] })),
      db.query('SELECT COUNT(*) AS n FROM stars WHERE parent_ref = $1', [access_key])
        .catch(() => ({ rows: [{ n: 0 }] })),
      db.query(
        `SELECT COUNT(DISTINCT c.access_key) AS n FROM stars c
         WHERE c.parent_ref = $1
           AND EXISTS (SELECT 1 FROM stars gc WHERE gc.parent_ref = c.access_key)`,
        [access_key]
      ).catch(() => ({ rows: [{ n: 0 }] })),
      db.query(
        'SELECT first_seen_at, last_seen_at, revisit_count FROM star_connections_agg WHERE ref_access_key = $1',
        [access_key]
      ).catch(() => ({ rows: [] })),
      db.query(
        `SELECT COUNT(*) AS n FROM storybook_view_events
         WHERE storybook_id IN (SELECT id FROM storybooks WHERE access_key = $1)`,
        [access_key]
      ).catch(() => ({ rows: [{ n: 0 }] })),
      db.query(
        `SELECT COUNT(*) AS n FROM storybook_share_events
         WHERE storybook_id IN (SELECT id FROM storybooks WHERE access_key = $1)`,
        [access_key]
      ).catch(() => ({ rows: [{ n: 0 }] })),
      db.query(
        `SELECT COUNT(*) AS n FROM stars
         WHERE source_storybook_id IN (SELECT id FROM storybooks WHERE access_key = $1)`,
        [access_key]
      ).catch(() => ({ rows: [{ n: 0 }] })),
    ]);

    // impact 통계 (migration 171) — journey_id 기준
    const [impactCntRes, actionCntRes, impactAvgRes] = await Promise.all([
      db.query(
        `SELECT COUNT(*) AS n FROM impacts
         WHERE journey_id = (SELECT journey_id FROM stars WHERE access_key = $1 LIMIT 1)`,
        [access_key]
      ).catch(() => ({ rows: [{ n: 0 }] })),
      db.query(
        `SELECT COUNT(*) AS n FROM impacts
         WHERE action_type IS NOT NULL
           AND journey_id = (SELECT journey_id FROM stars WHERE access_key = $1 LIMIT 1)`,
        [access_key]
      ).catch(() => ({ rows: [{ n: 0 }] })),
      db.query(
        `SELECT ROUND(AVG(impact_level)::numeric, 1) AS avg FROM impacts
         WHERE impact_level IS NOT NULL
           AND journey_id = (SELECT journey_id FROM stars WHERE access_key = $1 LIMIT 1)`,
        [access_key]
      ).catch(() => ({ rows: [{ avg: null }] })),
    ]);

    const connAgg = connAggRes.rows[0] || null;
    const sbView  = toInt(sbViewRes.rows[0].n);
    const sbShare = toInt(sbShareRes.rows[0].n);
    const sbConv  = toInt(sbConvRes.rows[0].n);

    return res.json({
      success: true,
      star: {
        access_key:      star.access_key,
        emotion:         star.emotion,
        location:        star.origin_location,
        parent_ref:      star.parent_ref || null,
        journey_id:      star.journey_id || null,
        resonance_score: toInt(star.resonance_score),
        status:          star.status,
        created_at:      star.created_at,
      },
      stats: {
        share_count:      toInt(shareRes.rows[0].n),
        view_count:       toInt(viewRes.rows[0].n),
        conversion_count: toInt(convRes.rows[0].n),
        return_count:     toInt(returnRes.rows[0].n),
        conversion_rate:  toInt(viewRes.rows[0].n) > 0
          ? Math.round((toInt(convRes.rows[0].n) / toInt(viewRes.rows[0].n)) * 100)
          : null,
        resonance_score:  toInt(star.resonance_score),
      },
      storybook_stats: {
        view_count:       sbView,
        share_count:      sbShare,
        conversion_count: sbConv,
        conversion_rate:  sbView > 0 ? Math.round((sbConv / sbView) * 100) : null,
      },
      impact_stats: {
        impact_count: toInt(impactCntRes.rows[0].n),
        action_count: toInt(actionCntRes.rows[0].n),
        avg_level:    impactAvgRes.rows[0]?.avg ? parseFloat(impactAvgRes.rows[0].avg) : null,
      },
      connections: connAgg ? {
        first_seen_at: connAgg.first_seen_at,
        last_seen_at:  connAgg.last_seen_at,
        revisit_count: toInt(connAgg.revisit_count),
      } : null,
    });
  } catch (err) {
    console.error('[adminResonance] GET /star error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 2. GET /connections/tree/:access_key — 부모-자식 중첩 트리
// ─────────────────────────────────────────────────────────────────
router.get('/connections/tree/:access_key', adminGuard, async (req, res) => {
  const { access_key } = req.params;
  const maxDepth = Math.min(parseInt(req.query.depth ?? 10, 10), 15);

  try {
    const { rows } = await db.query(
      `WITH RECURSIVE tree AS (
         SELECT access_key, parent_ref, emotion, origin_location, created_at, 0 AS depth
         FROM stars WHERE access_key = $1
         UNION ALL
         SELECT s.access_key, s.parent_ref, s.emotion, s.origin_location, s.created_at, t.depth + 1
         FROM stars s
         JOIN tree t ON s.parent_ref = t.access_key
         WHERE t.depth < $2
       )
       SELECT
         t.*,
         COALESCE(se.shares, 0) AS share_count,
         COALESCE(sv.visits, 0) AS view_count,
         COALESCE(cc.children, 0) AS child_count
       FROM tree t
       LEFT JOIN (
         SELECT access_key, COUNT(*) AS shares FROM star_share_events GROUP BY access_key
       ) se ON se.access_key = t.access_key
       LEFT JOIN (
         SELECT ref_access_key, COUNT(*) AS visits FROM star_visit_events GROUP BY ref_access_key
       ) sv ON sv.ref_access_key = t.access_key
       LEFT JOIN (
         SELECT parent_ref, COUNT(*) AS children FROM stars WHERE parent_ref IS NOT NULL GROUP BY parent_ref
       ) cc ON cc.parent_ref = t.access_key
       ORDER BY t.depth, t.created_at`,
      [access_key, maxDepth]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다' });
    }

    const tree = nestTree(rows, access_key);

    return res.json({
      success:     true,
      root:        access_key,
      total_nodes: rows.length,
      max_depth:   rows.reduce((m, r) => Math.max(m, toInt(r.depth)), 0),
      tree,
    });
  } catch (err) {
    if (err.code === '42P01' || err.code === '42703') {
      return res.json({ success: true, tree: null, note: 'migration 미실행' });
    }
    console.error('[adminResonance] GET /connections/tree error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// 3. GET /storybook/:access_key — 별의 여정 연결 컨텍스트
// ─────────────────────────────────────────────────────────────────
const LOCATION_ORDER = ['cablecar', 'cafe', 'hamel', 'stay'];

router.get('/storybook/:access_key', adminGuard, async (req, res) => {
  const { access_key } = req.params;

  try {
    // 별 본체 조회
    const { rows: starRows } = await db.query(
      `SELECT access_key, emotion, origin_location, parent_ref, status, created_at
       FROM stars WHERE access_key = $1`,
      [access_key]
    );
    if (!starRows.length) {
      return res.status(404).json({ success: false, error: '별을 찾을 수 없습니다' });
    }
    const star = starRows[0];

    // 부모 별 조회 (있으면)
    let parent = null;
    if (star.parent_ref) {
      const { rows: parentRows } = await db.query(
        `SELECT access_key, emotion, origin_location, created_at
         FROM stars WHERE access_key = $1`,
        [star.parent_ref]
      ).catch(() => ({ rows: [] }));
      parent = parentRows[0] || null;
    }

    // 직접 자식 별 조회
    const { rows: childRows } = await db.query(
      `SELECT access_key, emotion, origin_location, created_at
       FROM stars WHERE parent_ref = $1 ORDER BY created_at ASC`,
      [access_key]
    ).catch(() => ({ rows: [] }));

    // 여정 경로 구성 (부모 → 이 별 → 대표 자식들)
    const journeyNodes = [];

    if (parent) {
      journeyNodes.push({ role: 'parent', ...parent });
    }
    journeyNodes.push({ role: 'self', ...star });
    childRows.slice(0, 4).forEach(c => {
      journeyNodes.push({ role: 'child', ...c });
    });

    // 위치 분포 (자식 별들의 location 분포)
    const locationDist = {};
    childRows.forEach(c => {
      locationDist[c.origin_location] = (locationDist[c.origin_location] || 0) + 1;
    });

    // 스토리북 생성 가능 여부 (2장 이상 있을 때)
    const allStars = [
      ...(parent ? [{ location: parent.origin_location, emotion: parent.emotion }] : []),
      { location: star.origin_location, emotion: star.emotion },
      ...childRows.map(c => ({ location: c.origin_location, emotion: c.emotion })),
    ];
    const sortedForBook = allStars
      .sort((a, b) => (LOCATION_ORDER.indexOf(a.location) + 99 || 99) - (LOCATION_ORDER.indexOf(b.location) + 99 || 99));

    return res.json({
      success: true,
      star: {
        access_key: star.access_key,
        emotion:    star.emotion,
        location:   star.origin_location,
        created_at: star.created_at,
      },
      parent,
      children:          childRows,
      child_count:       childRows.length,
      journey_nodes:     journeyNodes,
      location_dist:     locationDist,
      storybook_ready:   allStars.length >= 2,
      storybook_payload: allStars.length >= 2 ? {
        ref_access_key: access_key,
        stars: sortedForBook.map(s => ({
          location:  s.location,
          emotion:   s.emotion,
          image_url: null,
        })),
      } : null,
    });
  } catch (err) {
    console.error('[adminResonance] GET /storybook error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
