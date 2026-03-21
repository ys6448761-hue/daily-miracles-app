/**
 * 공명 & 나눔 Routes
 *
 * POST /api/resonance              — 공명 저장 + impact 트리거 + summary 갱신
 * GET  /api/resonance/similar      — 공명 패턴 유사 별 조회 (공명 기반 연결)
 * GET  /api/resonance/:star_id     — 별 공명/나눔 현황 조회
 */

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const { emitKpiEvent, KPI_EVENTS } = require('../services/kpiEventEmitter');

const VALID_RESONANCE = ['relief', 'belief', 'clarity', 'courage'];
const RESONANCE_TYPES = VALID_RESONANCE;

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

// ── 유사도 계산 (분포 교집합 / intersection similarity) ──────────
// 두 프로파일의 공명 타입 비율 분포가 얼마나 겹치는지 측정 (0~1)
function calcSimilarity(profileA, profileB) {
  const totalA = RESONANCE_TYPES.reduce((s, t) => s + (profileA[t] || 0), 0);
  const totalB = RESONANCE_TYPES.reduce((s, t) => s + (profileB[t] || 0), 0);
  if (!totalA || !totalB) return 0;
  return RESONANCE_TYPES.reduce((sum, t) => {
    return sum + Math.min(
      (profileA[t] || 0) / totalA,
      (profileB[t] || 0) / totalB,
    );
  }, 0);
}

// ── impact 트리거 로직 ────────────────────────────────────────────
async function checkImpact(star_id) {
  const result = await db.query(
    `SELECT resonance_type, COUNT(*)::int AS cnt
       FROM resonance
      WHERE star_id = $1
      GROUP BY resonance_type`,
    [star_id]
  );

  const counts = {};
  for (const row of result.rows) counts[row.resonance_type] = row.cnt;

  const relief  = counts.relief  ?? 0;
  const belief  = counts.belief  ?? 0;
  const clarity = counts.clarity ?? 0;
  const courage = counts.courage ?? 0;

  const triggers = [];
  if (relief >= 3)              triggers.push('gratitude');
  if (clarity + belief >= 3)    triggers.push('wisdom');
  if (courage >= 3)             triggers.push('miracle');

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

// ── star_resonance_summary upsert ────────────────────────────────
// Returns new total_count (for resonance_received first-time detection)
async function updateSummary(star_id, resonance_type) {
  const col = `${resonance_type}_count`;
  const result = await db.query(
    `INSERT INTO star_resonance_summary
       (star_id, ${col}, total_count, updated_at)
     VALUES ($1, 1, 1, CURRENT_TIMESTAMP)
     ON CONFLICT (star_id) DO UPDATE
       SET ${col}      = star_resonance_summary.${col} + 1,
           total_count = star_resonance_summary.total_count + 1,
           updated_at  = CURRENT_TIMESTAMP
     RETURNING total_count`,
    [star_id]
  );
  return result.rows[0]?.total_count ?? 1;
}

// ─────────────────────────────────────────────────────────────────
// POST /api/resonance — 공명 저장
// Body: { star_id, resonance_type, anonymous_token? }
// ─────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { star_id, resonance_type, anonymous_token } = req.body;

    if (!star_id) {
      return res.status(400).json({ error: 'star_id 필수' });
    }
    if (!VALID_RESONANCE.includes(resonance_type)) {
      return res.status(400).json({ error: '유효하지 않은 resonance_type' });
    }

    // 별 존재 확인 + KPI emit에 필요한 컨텍스트 조회
    const starCheck = await db.query(
      `SELECT s.id, s.user_id AS owner_id, s.is_hidden, s.wish_id,
              w.safety_level
         FROM dt_stars  s
         JOIN dt_wishes w ON w.id = s.wish_id
        WHERE s.id = $1`,
      [star_id]
    );
    if (starCheck.rowCount === 0) {
      return res.status(404).json({ error: '별을 찾을 수 없습니다' });
    }
    const starRow = starCheck.rows[0];
    const visibility  = starRow.is_hidden ? 'hidden' : 'public';
    const safetyBand  = starRow.safety_level ?? 'GREEN';

    const user_id = anonymous_token ?? null;

    // 중복 공명 방지
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

    // summary 갱신 후 impact 트리거
    const newTotal   = await updateSummary(star_id, resonance_type);
    const newImpacts = await checkImpact(star_id);

    // ── KPI: resonance_created ────────────────────────────────────
    emitKpiEvent({
      eventName:  KPI_EVENTS.RESONANCE_CREATED,
      userId:     user_id,
      starId:     star_id,
      wishId:     starRow.wish_id,
      visibility,
      safetyBand,
      source:     'resonance_route',
      extra:      { resonance_type },
    }).catch(() => {});

    // ── KPI: impact_created (각 신규 나눔마다) ──────────────────
    for (const impactType of newImpacts) {
      emitKpiEvent({
        eventName:  KPI_EVENTS.IMPACT_CREATED,
        userId:     starRow.owner_id,
        starId:     star_id,
        wishId:     starRow.wish_id,
        visibility,
        safetyBand,
        source:     'impact_trigger',
        extra:      { impact_type: impactType },
      }).catch(() => {});
    }

    // ── KPI: resonance_received (별 최초 공명 수신 시 1회) ───────
    if (newTotal === 1) {
      emitKpiEvent({
        eventName:  KPI_EVENTS.RESONANCE_RECEIVED,
        userId:     starRow.owner_id,
        starId:     star_id,
        wishId:     starRow.wish_id,
        visibility,
        safetyBand,
        source:     'first_resonance',
      }).catch(() => {});
    }

    // TODO: connection_completed — 유사 별 클릭 시점에 emit 예정
    //   emitKpiEvent({ eventName: KPI_EVENTS.CONNECTION_COMPLETED, ... })

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

// ─────────────────────────────────────────────────────────────────
// GET /api/resonance/similar?star_id=xxx&token=yyy
// 공명 패턴이 유사한 별 2~3개 반환 (공명 기반 연결)
// ─────────────────────────────────────────────────────────────────
router.get('/similar', async (req, res) => {
  try {
    const { star_id, token } = req.query;

    // 기준 프로파일: 유저 공명 이력 우선, 없으면 현재 별 공명 프로파일
    let baseProfile = null;

    if (token) {
      const userRes = await db.query(
        `SELECT resonance_type, COUNT(*)::int AS cnt
           FROM resonance
          WHERE user_id = $1
          GROUP BY resonance_type`,
        [token]
      );
      if (userRes.rowCount > 0) {
        baseProfile = {};
        for (const row of userRes.rows) baseProfile[row.resonance_type] = row.cnt;
      }
    }

    // 유저 이력 없으면 현재 별 프로파일을 기준으로 사용
    if (!baseProfile && star_id) {
      const starRes = await db.query(
        `SELECT relief_count, belief_count, clarity_count, courage_count
           FROM star_resonance_summary
          WHERE star_id = $1`,
        [star_id]
      );
      if (starRes.rowCount > 0) {
        const r = starRes.rows[0];
        baseProfile = {
          relief:  r.relief_count,
          belief:  r.belief_count,
          clarity: r.clarity_count,
          courage: r.courage_count,
        };
      }
    }

    if (!baseProfile) {
      return res.json({ similar_stars: [] });
    }

    // 모든 star_resonance_summary 조회 (공명이 1개 이상인 별만)
    const summaryRes = await db.query(
      `SELECT srs.star_id, srs.relief_count, srs.belief_count,
              srs.clarity_count, srs.courage_count, srs.total_count,
              s.star_name, s.star_stage, s.created_at,
              g.code AS galaxy_code, g.name_ko AS galaxy_name_ko
         FROM star_resonance_summary srs
         JOIN dt_stars s ON s.id = srs.star_id
         JOIN dt_galaxies g ON g.id = s.galaxy_id
        WHERE srs.total_count >= 1
          AND ($1::text IS NULL OR srs.star_id <> $1)`,
      [star_id ?? null]
    );

    if (summaryRes.rowCount === 0) {
      return res.json({ similar_stars: [] });
    }

    // 유사도 계산 → 상위 3개 선택
    const scored = summaryRes.rows.map(row => {
      const starProfile = {
        relief:  row.relief_count,
        belief:  row.belief_count,
        clarity: row.clarity_count,
        courage: row.courage_count,
      };
      return {
        star_id:       row.star_id,
        star_name:     row.star_name,
        star_stage:    row.star_stage,
        created_at:    row.created_at,
        galaxy_code:   row.galaxy_code,
        galaxy_name_ko: row.galaxy_name_ko,
        score: calcSimilarity(baseProfile, starProfile),
      };
    });

    const similar = scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ score: _, ...rest }) => rest); // score 필드 제거

    res.json({ similar_stars: similar });

  } catch (err) {
    console.error('[Resonance] GET /similar error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────────
// GET /api/resonance/:star_id — 별 공명/나눔 현황
// ─────────────────────────────────────────────────────────────────
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
