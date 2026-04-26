'use strict';

/**
 * adminLocationRoutes.js — 장소별 별 생성 관리자 대시보드 API
 *
 * GET /api/admin/dt/location/:code?token=  장소 통계 조회
 *
 * 인증: ?token=ADMIN_TOKEN 또는 x-admin-token 헤더
 */

const router = require('express').Router();
const db     = require('../database/db');

const LOCATION_META = {
  lattoa:           { name: '라또아 카페',        emoji: '☕' },
  forestland:       { name: '더 포레스트랜드',     emoji: '🌲' },
  paransi:          { name: '파란시',              emoji: '🔵' },
  'yeosu-cablecar': { name: '여수 해상 케이블카',  emoji: '🚡' },
};

// URL 코드 → QR ?loc= 값 (dt_kpi_events.extra->>'origin_location')
const KPI_ORIGIN_CODE = {
  lattoa:           'lattoa_cafe',
  forestland:       'forestland',
  paransi:          'paransi',
  'yeosu-cablecar': 'yeosu-cablecar',
};

const LOCATION_ADMIN_PIN = '1234';

function adminGuard(req, res, next) {
  const realToken = process.env.ADMIN_TOKEN;
  if (!realToken) return next(); // 로컬 개발: 토큰 미설정 시 통과

  const input = req.headers['x-admin-token'] || req.query.token || '';
  // PIN(1234) 입력 시 서버에서 실제 ADMIN_TOKEN으로 변환 — 클라이언트에 토큰 미노출
  const token = input === LOCATION_ADMIN_PIN ? realToken : input;

  if (token === realToken) return next();
  return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
}

// GET /api/admin/dt/location/:code
router.get('/:code', adminGuard, async (req, res) => {
  const { code } = req.params;
  const meta = LOCATION_META[code];
  if (!meta) {
    return res.status(404).json({ error: `알 수 없는 장소: ${code}` });
  }

  // QR URL: ?loc=lattoa_cafe → stars.origin_location & dt_kpi_events.extra->>'origin_location'
  const kpiCode = KPI_ORIGIN_CODE[code] ?? code;

  const log = (label, err) =>
    console.error(`[admin/dt/location/${code}] ${label} 실패:`, err.code, err.message);

  async function safeCount(sql, params, label) {
    try {
      const r = await db.query(sql, params);
      return parseInt(r.rows[0]?.n ?? 0, 10);
    } catch (err) {
      log(label, err);
      return 0;
    }
  }

  async function safeRows(sql, params, label) {
    try {
      const r = await db.query(sql, params);
      return r.rows;
    } catch (err) {
      log(label, err);
      return [];
    }
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayStars, totalStars, totalResonance, topStarRows, emotionRows, recentRows] =
      await Promise.all([
        // 오늘 별: dt_kpi_events 기준 (QR origin_location 값으로 필터)
        safeCount(
          `SELECT COUNT(*) AS n
           FROM   dt_kpi_events
           WHERE  event_name = 'star_created'
             AND  extra->>'origin_location' = $1
             AND  created_at::date = CURRENT_DATE`,
          [kpiCode], '오늘별'
        ),
        // 누적 별: dt_kpi_events 기준
        safeCount(
          `SELECT COUNT(*) AS n
           FROM   dt_kpi_events
           WHERE  event_name = 'star_created'
             AND  extra->>'origin_location' = $1`,
          [kpiCode], '누적별'
        ),
        safeCount(
          `SELECT COUNT(*) AS n
           FROM   star_logs sl
           JOIN   stars     s ON s.id = sl.star_id
           WHERE  s.origin_location = $1 AND sl.action_type = 'resonance'`,
          [kpiCode], '총공명'
        ),
        safeRows(
          `SELECT s.id, s.wish_text, COUNT(sl.id) AS resonance_count
           FROM   stars     s
           LEFT JOIN star_logs sl ON sl.star_id = s.id AND sl.action_type = 'resonance'
           WHERE  s.origin_location = $1 AND s.wish_text IS NOT NULL
           GROUP  BY s.id, s.wish_text, s.created_at
           ORDER  BY resonance_count DESC, s.created_at DESC
           LIMIT  1`,
          [kpiCode], '대표문장'
        ),
        safeRows(
          `SELECT emotion, COUNT(*) AS cnt
           FROM   stars
           WHERE  origin_location = $1 AND emotion IS NOT NULL
           GROUP  BY emotion ORDER BY cnt DESC LIMIT 3`,
          [kpiCode], '감정TOP3'
        ),
        safeRows(
          `SELECT s.id, s.access_key, s.emotion, s.status, s.created_at,
                  LEFT(s.wish_text, 30) AS wish_preview,
                  COUNT(sl.id)          AS resonance_count
           FROM   stars     s
           LEFT JOIN star_logs sl ON sl.star_id = s.id AND sl.action_type = 'resonance'
           WHERE  s.origin_location = $1
           GROUP  BY s.id, s.access_key, s.emotion, s.status, s.created_at, s.wish_text
           ORDER  BY s.created_at DESC LIMIT 5`,
          [kpiCode], '최근별5'
        ),
      ]);

    const topStar = topStarRows[0] ?? null;

    return res.json({
      location: { code, ...meta },
      stats: {
        today_stars:     todayStars,
        total_stars:     totalStars,
        total_resonance: totalResonance,
      },
      representative: topStar
        ? { wish_text: topStar.wish_text, star_name: topStar.access_key ?? topStar.id?.slice(0, 8), resonance_count: parseInt(topStar.resonance_count, 10) }
        : null,
      emotion_top3: emotionRows.map(r => ({ emotion: r.emotion, count: parseInt(r.cnt, 10) })),
      recent_stars: recentRows,
    });
  } catch (err) {
    console.error(`[admin/dt/location/${code}] 예상치 못한 에러:`, err.stack);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
