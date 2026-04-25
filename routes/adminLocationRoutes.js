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

function adminGuard(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!process.env.ADMIN_TOKEN) return next();
  if (token === process.env.ADMIN_TOKEN) return next();
  return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
}

// GET /api/admin/dt/location/:code
router.get('/:code', adminGuard, async (req, res) => {
  const { code } = req.params;
  const meta = LOCATION_META[code];
  if (!meta) {
    return res.status(404).json({ error: `알 수 없는 장소: ${code}` });
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [todayR, totalR, resonanceR, topStarR, emotionR, recentR] = await Promise.all([
      // 오늘 별 생성
      db.query(
        `SELECT COUNT(*) AS n FROM dt_stars WHERE origin_place = $1 AND created_at >= $2`,
        [code, todayStart]
      ),
      // 누적 별
      db.query(
        `SELECT COUNT(*) AS n FROM dt_stars WHERE origin_place = $1`,
        [code]
      ),
      // 총 공명
      db.query(
        `SELECT COALESCE(SUM(resonance_count), 0) AS n FROM dt_stars WHERE origin_place = $1`,
        [code]
      ),
      // 대표 문장: 공명 가장 많은 별의 소원
      db.query(
        `SELECT s.star_name, s.resonance_count, w.wish_text
         FROM   dt_stars  s
         LEFT JOIN dt_wishes w ON w.id = s.wish_id
         WHERE  s.origin_place = $1
           AND  w.wish_text IS NOT NULL
         ORDER BY s.resonance_count DESC, s.created_at DESC
         LIMIT 1`,
        [code]
      ),
      // 감정 TOP 3
      db.query(
        `SELECT emotion_tag AS emotion, COUNT(*) AS cnt
         FROM   dt_stars
         WHERE  origin_place = $1 AND emotion_tag IS NOT NULL
         GROUP  BY emotion_tag
         ORDER  BY cnt DESC
         LIMIT  3`,
        [code]
      ),
      // 최근 별 5개
      db.query(
        `SELECT s.id, s.star_name, s.emotion_tag, s.resonance_count,
                s.status, s.created_at,
                LEFT(w.wish_text, 30) AS wish_preview
         FROM   dt_stars  s
         LEFT JOIN dt_wishes w ON w.id = s.wish_id
         WHERE  s.origin_place = $1
         ORDER  BY s.created_at DESC
         LIMIT  5`,
        [code]
      ),
    ]);

    const topStar = topStarR.rows[0] ?? null;

    return res.json({
      location: { code, ...meta },
      stats: {
        today_stars:     parseInt(todayR.rows[0].n,      10),
        total_stars:     parseInt(totalR.rows[0].n,      10),
        total_resonance: parseInt(resonanceR.rows[0].n,  10),
      },
      representative: topStar
        ? { wish_text: topStar.wish_text, star_name: topStar.star_name, resonance_count: parseInt(topStar.resonance_count, 10) }
        : null,
      emotion_top3:  emotionR.rows.map(r => ({ emotion: r.emotion, count: parseInt(r.cnt, 10) })),
      recent_stars:  recentR.rows,
    });
  } catch (err) {
    console.error('[admin/dt/location]', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
