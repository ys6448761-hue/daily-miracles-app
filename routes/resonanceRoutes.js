/**
 * 공명 & 나눔 Routes
 *
 * POST /api/resonance            — 공명 저장 + impact 트리거
 * GET  /api/resonance/:star_id   — 별 공명/나눔 현황 조회
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');

const VALID_RESONANCE = ['relief', 'belief', 'clarity', 'courage'];

const RESONANCE_LABEL = {
  relief:  '숨이 놓였어요',
  belief:  '믿고 싶어졌어요',
  clarity: '정리됐어요',
  courage: '용기났어요',
};

const IMPACT_LABEL = {
  gratitude: '감사나눔',
  wisdom:    '지혜나눔',
  miracle:   '기적나눔',
};

// ── impact 트리거 로직 ────────────────────────────────────────
async function checkImpact(star_id) {
  const result = await db.query(
    `SELECT resonance_type, COUNT(*)::int AS cnt
       FROM resonance
      WHERE star_id = $1
      GROUP BY resonance_type`,
    [star_id]
  );

  const counts = {};
  for (const row of result.rows) {
    counts[row.resonance_type] = row.cnt;
  }

  const relief  = counts.relief  ?? 0;
  const belief  = counts.belief  ?? 0;
  const clarity = counts.clarity ?? 0;
  const courage = counts.courage ?? 0;

  const triggers = [];

  if (relief >= 3) triggers.push('gratitude');
  if (clarity + belief >= 3) triggers.push('wisdom');
  if (courage >= 3) triggers.push('miracle');

  for (const impact_type of triggers) {
    await db.query(
      `INSERT INTO impact (star_id, impact_type, count, updated_at)
       VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
       ON CONFLICT (star_id, impact_type)
       DO UPDATE SET count = impact.count + 1, updated_at = CURRENT_TIMESTAMP`,
      [star_id, impact_type]
    );
  }

  return triggers;
}

// ─────────────────────────────────────────────
// POST /api/resonance — 공명 저장
// Body: { star_id: "uuid", resonance_type: "relief" }
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { star_id, resonance_type } = req.body;

    if (!star_id) {
      return res.status(400).json({ error: 'star_id 필수' });
    }
    if (!VALID_RESONANCE.includes(resonance_type)) {
      return res.status(400).json({ error: '유효하지 않은 resonance_type' });
    }

    // 별 존재 확인
    const starCheck = await db.query(
      'SELECT id FROM dt_stars WHERE id = $1',
      [star_id]
    );
    if (starCheck.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }

    // user_id: 세션/토큰 없으면 anonymous_token 사용
    const user_id = req.body.anonymous_token ?? null;

    // 중복 공명 방지 (같은 user_id + star_id + resonance_type)
    if (user_id) {
      const dup = await db.query(
        `SELECT 1 FROM resonance
          WHERE star_id = $1 AND user_id = $2 AND resonance_type = $3`,
        [star_id, user_id, resonance_type]
      );
      if (dup.rowCount > 0) {
        return res.status(409).json({ error: '이미 공명을 남겼습니다' });
      }
    }

    // 공명 저장
    await db.query(
      `INSERT INTO resonance (star_id, user_id, resonance_type)
       VALUES ($1, $2, $3)`,
      [star_id, user_id, resonance_type]
    );

    // impact 트리거
    const newImpacts = await checkImpact(star_id);

    res.json({
      ok: true,
      message: '당신의 공명이 이 별에 남았어요.',
      resonance_label: RESONANCE_LABEL[resonance_type],
      new_impacts: newImpacts.map(t => ({ type: t, label: IMPACT_LABEL[t] })),
    });

  } catch (err) {
    console.error('[Resonance] POST / error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────
// GET /api/resonance/:star_id — 별 공명/나눔 현황
// ─────────────────────────────────────────────
router.get('/:star_id', async (req, res) => {
  try {
    const { star_id } = req.params;

    // 공명 집계
    const resonanceResult = await db.query(
      `SELECT resonance_type, COUNT(*)::int AS count
         FROM resonance
        WHERE star_id = $1
        GROUP BY resonance_type`,
      [star_id]
    );

    const resonanceCounts = {};
    for (const row of resonanceResult.rows) {
      resonanceCounts[row.resonance_type] = {
        count: row.count,
        label: RESONANCE_LABEL[row.resonance_type] ?? row.resonance_type,
      };
    }

    // 나눔 목록
    const impactResult = await db.query(
      `SELECT impact_type, count
         FROM impact
        WHERE star_id = $1
        ORDER BY created_at`,
      [star_id]
    );

    const impacts = impactResult.rows.map(r => ({
      type:  r.impact_type,
      label: IMPACT_LABEL[r.impact_type] ?? r.impact_type,
      count: r.count,
    }));

    res.json({ star_id, resonance: resonanceCounts, impacts });

  } catch (err) {
    console.error('[Resonance] GET /:star_id error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
