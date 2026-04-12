'use strict';

/**
 * starJourneyRoutes.js — Star Journey API
 *
 * POST /api/star-journey/visit          — QR 스캔 방문 기록
 * GET  /api/star-journey/summary        — 여정 현황 조회
 * POST /api/star-journey/coupon/issue   — 쿠폰 발급 (달성 항목 재발급)
 * POST /api/star-journey/coupon/redeem  — 쿠폰 사용 (파트너 어드민)
 */

const router = require('express').Router();
const db     = require('../database/db');
const {
  recordVisitAndCheck,
  getJourneySummary,
  issueCouponManual,
  redeemCoupon,
  ACHIEVEMENTS,
} = require('../services/starJourneyService');

// 업종 코드 → 이모지
const PARTNER_EMOJI = {
  'DT-YS-C': '☕',   // 카페/치유
  'DT-YS-R': '🍽️',  // 맛집/관계
  'DT-YS-A': '⚡',   // 액티비티/도전
  'DT-YS-G': '🌱',   // 성장/문화
  'DT-YS-M': '✨',   // 기적
  'DT-YS-H': '🏨',   // 호텔/숙박
  'DT-YS-L': '🎡',   // 레저
};

function getEmoji(partnerId) {
  const prefix = (partnerId || '').substring(0, 7);
  return PARTNER_EMOJI[prefix] || '✦';
}

const GALAXY_LABEL = {
  healing:      '치유 은하의 집',
  relationship: '관계 은하의 집',
  challenge:    '도전 은하의 집',
  growth:       '성장 은하의 집',
  miracle:      '기적 은하의 집',
};

// 달성 임박 힌트 계산
function buildAchievementHints(visitedSet, galaxyType) {
  const hints = [];

  // 은하 별자리 임박 — 1개 방문 후 두 번째 방문지
  const GALAXY_CONSTELLATION = {
    healing:      'healing_constellation',
    relationship: 'relationship_constellation',
    challenge:    'challenge_constellation',
    growth:       'growth_constellation',
  };
  const achKey = GALAXY_CONSTELLATION[galaxyType];
  if (achKey) {
    const achDef  = ACHIEVEMENTS[achKey];
    const visited = [...visitedSet].filter(id => id.startsWith('DT-YS-')).length;
    if (visited === 1) hints.push(`방문하면 ${GALAXY_LABEL[galaxyType] || galaxyType} 별자리 달성!`);
  }
  return hints;
}

// ─── 파트너 목록 조회 (방문 여부 + 달성 힌트 포함) ──────────────
router.get('/partners/all', async (req, res) => {
  try {
    const { user_id, galaxy_type } = req.query;

    // 방문 기록 로드 (user_id 있을 때만)
    let visitedMap = {};   // partner_id → visit_count
    let visitedByGalaxy = {};  // galaxy_type → Set<partner_id>
    if (user_id) {
      const vr = await db.query(
        `SELECT partner_id, galaxy_type, COUNT(*) AS cnt
         FROM partner_visits WHERE user_id = $1
         GROUP BY partner_id, galaxy_type`,
        [user_id]
      );
      for (const row of vr.rows) {
        visitedMap[row.partner_id] = parseInt(row.cnt, 10);
        if (!visitedByGalaxy[row.galaxy_type]) visitedByGalaxy[row.galaxy_type] = new Set();
        visitedByGalaxy[row.galaxy_type].add(row.partner_id);
      }
    }

    // 파트너 목록 쿼리
    const galaxyFilter = galaxy_type && galaxy_type !== 'all' ? galaxy_type : null;
    const pr = await db.query(
      `SELECT pa.login_id        AS partner_id,
              p.name             AS partner_name,
              pa.galaxy_type,
              pa.partner_tier,
              pa.region_code
       FROM   partner_accounts pa
       JOIN   dt_partners p ON p.id = pa.partner_id
       WHERE  pa.is_active = true
         AND  ($1::text IS NULL OR pa.galaxy_type = $1)
       ORDER  BY pa.partner_tier DESC, p.name ASC`,
      [galaxyFilter]
    );

    const partners = pr.rows.map(p => {
      const isVisited        = !!visitedMap[p.partner_id];
      const visitCount       = visitedMap[p.partner_id] || 0;
      const galaxyVisited    = visitedByGalaxy[p.galaxy_type] || new Set();
      const hasHint          = !isVisited && galaxyVisited.size === 1;
      const hints            = hasHint ? buildAchievementHints(galaxyVisited, p.galaxy_type) : [];

      return {
        partner_id:       p.partner_id,
        partner_name:     p.partner_name,
        galaxy_type:      p.galaxy_type,
        galaxy_label:     GALAXY_LABEL[p.galaxy_type] || p.galaxy_type,
        partner_tier:     p.partner_tier,
        emoji:            getEmoji(p.partner_id),
        is_visited:       isVisited,
        visit_count:      visitCount,
        achievement_hint: hints[0] || null,
        _sort_key:        isVisited ? 3 : hasHint ? 1 : 2,
      };
    });

    // 정렬: 달성 임박(1) → 미방문(2) → 방문(3), 같은 그룹 내 shuffle
    partners.sort((a, b) => a._sort_key - b._sort_key || Math.random() - 0.5);
    for (const p of partners) delete p._sort_key;

    return res.json({ partners, total: partners.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── QR 스캔 → 방문 기록 + 달성 체크 ───────────────────────────
router.post('/visit', async (req, res) => {
  try {
    const { user_id, partner_id, star_id } = req.body;
    if (!user_id || !partner_id) {
      return res.status(400).json({ error: 'user_id, partner_id 필수' });
    }
    const result = await recordVisitAndCheck(user_id, partner_id, star_id || null);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─── 여정 현황 조회 ─────────────────────────────────────────────
router.get('/summary', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id 필수' });
    const summary = await getJourneySummary(user_id);
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── 쿠폰 발급 (수동 재발급) ─────────────────────────────────────
router.post('/coupon/issue', async (req, res) => {
  try {
    const { user_id, achievement_type } = req.body;
    if (!user_id || !achievement_type) {
      return res.status(400).json({ error: 'user_id, achievement_type 필수' });
    }
    const result = await issueCouponManual(user_id, achievement_type);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

// ─── 쿠폰 사용 처리 (파트너 어드민) ─────────────────────────────
router.post('/coupon/redeem', async (req, res) => {
  try {
    const { coupon_code, partner_id } = req.body;
    if (!coupon_code || !partner_id) {
      return res.status(400).json({ error: 'coupon_code, partner_id 필수' });
    }
    const result = await redeemCoupon(coupon_code, partner_id);
    return res.json({ ok: true, ...result });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ error: err.message });
  }
});

module.exports = router;
