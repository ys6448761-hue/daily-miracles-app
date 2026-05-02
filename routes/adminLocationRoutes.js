'use strict';

/**
 * adminLocationRoutes.js — 장소별 별공방 관리자 API
 *
 * GET /api/admin/dt/location/:code          대시보드 통계
 * GET /api/admin/dt/location/:code/today    오늘 생성된 별 목록
 * GET /api/admin/dt/location/:code/stars    전체 별 목록 (상태 필터·페이징)
 * GET /api/admin/dt/location/:code/ops      QR / 운영 설정
 *
 * 인증: ?token=ADMIN_TOKEN 또는 x-admin-token 헤더 (PIN 1234 지원)
 * 집계 SSOT: dt_stars.origin_place (WishGate → /api/dt/stars/create 저장 경로)
 *   - COALESCE(origin_place, 'global_default_workshop') = kpiCode 로 NULL 포함 집계
 */

const router   = require('express').Router();
const db       = require('../database/db');
const registry = require('../config/locationRegistry');

const LOCATION_ADMIN_PIN = '1234';

function adminGuard(req, res, next) {
  const realToken = process.env.ADMIN_TOKEN;
  if (!realToken) return next();

  const input = req.headers['x-admin-token'] || req.query.token || '';
  const token = input === LOCATION_ADMIN_PIN ? realToken : input;

  if (token === realToken) return next();
  return res.status(401).json({ error: '관리자 인증이 필요합니다.' });
}

// GET /api/admin/dt/location/:code
router.get('/:code', adminGuard, async (req, res) => {
  const { code } = req.params;
  const meta = registry.resolve(code);
  if (!meta) {
    return res.status(404).json({ error: `알 수 없는 장소: ${code}` });
  }

  const kpiCode = registry.getKpiCode(code);

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
    const [todayStars, totalStars, topStarRows, emotionRows, recentRows, emotionMissing, shareCount] =
      await Promise.all([
        // 오늘 별: dt_stars SSOT
        safeCount(
          `SELECT COUNT(*) AS n
           FROM   dt_stars
           WHERE  COALESCE(origin_place, 'global_default_workshop') = $1
             AND  created_at::date = CURRENT_DATE`,
          [kpiCode], '오늘별'
        ),
        // 누적 별: dt_stars SSOT
        safeCount(
          `SELECT COUNT(*) AS n
           FROM   dt_stars
           WHERE  COALESCE(origin_place, 'global_default_workshop') = $1`,
          [kpiCode], '누적별'
        ),
        // 대표 문장: 가장 최근 별의 소원
        safeRows(
          `SELECT s.id, w.wish_text, s.star_slug AS access_key, 0 AS resonance_count
           FROM   dt_stars s
           LEFT JOIN dt_wishes w ON w.id = s.wish_id
           WHERE  COALESCE(s.origin_place, 'global_default_workshop') = $1
             AND  w.wish_text IS NOT NULL
           ORDER  BY s.created_at DESC
           LIMIT  1`,
          [kpiCode], '대표문장'
        ),
        // 감정 TOP10
        safeRows(
          `SELECT emotion_tag AS emotion, COUNT(*) AS cnt
           FROM   dt_stars
           WHERE  COALESCE(origin_place, 'global_default_workshop') = $1
             AND  emotion_tag IS NOT NULL AND emotion_tag != ''
           GROUP  BY emotion_tag ORDER BY cnt DESC LIMIT 10`,
          [kpiCode], '감정TOP10'
        ),
        // 최근 별 5개
        safeRows(
          `SELECT s.id, s.star_slug AS access_key, s.emotion_tag AS emotion,
                  w.gem_type, s.star_stage AS status, s.created_at,
                  LEFT(w.wish_text, 30) AS wish_preview, 0 AS resonance_count
           FROM   dt_stars s
           LEFT JOIN dt_wishes w ON w.id = s.wish_id
           WHERE  COALESCE(s.origin_place, 'global_default_workshop') = $1
           ORDER  BY s.created_at DESC LIMIT 5`,
          [kpiCode], '최근별5'
        ),
        // 감정 미기록 수
        safeCount(
          `SELECT COUNT(*) AS n FROM dt_stars
           WHERE  COALESCE(origin_place, 'global_default_workshop') = $1
             AND  (emotion_tag IS NULL OR emotion_tag = '')`,
          [kpiCode], '감정미기록'
        ),
        // 공유 클릭 수
        safeCount(
          `SELECT COUNT(*) AS n FROM dt_kpi_events
           WHERE  event_name ILIKE '%share%'
             AND  extra->>'origin_location' = $1`,
          [kpiCode], '공유수'
        ),
      ]);

    const topStar = topStarRows[0] ?? null;

    const recentFormatted = recentRows.map(r => ({
      ...r,
      star_name:       r.access_key ?? r.id?.slice(0, 8),
      wish_emotion:    r.emotion,
      resonance_count: parseInt(r.resonance_count, 10),
    }));

    const lastStarAt = recentRows[0]?.created_at ?? null;

    return res.json({
      location: { code: meta.code, name: meta.name_ko, emoji: meta.emoji, venue_type: meta.venue_type, status: meta.status },
      stats: {
        today_stars:     todayStars,
        total_stars:     totalStars,
        total_resonance: 0,
        emotion_missing: emotionMissing,
        share_count:     shareCount,
        last_star_at:    lastStarAt,
      },
      representative: topStar
        ? { wish_text: topStar.wish_text, star_name: topStar.access_key ?? topStar.id?.slice(0, 8), resonance_count: 0 }
        : null,
      emotion_top3: emotionRows.map(r => ({ emotion: r.emotion, count: parseInt(r.cnt, 10) })),
      recent_stars: recentFormatted,
      // flat 별칭 (LocationAdmin.jsx 호환)
      place_label:      meta.name_ko,
      today_count:      todayStars,
      total_count:      totalStars,
      resonance_total:  0,
      emotion_missing:  emotionMissing,
      share_count:      shareCount,
      last_star_at:     lastStarAt,
      summary_sentence: topStar?.wish_text ?? '오늘의 첫 별을 기다리고 있어요',
    });
  } catch (err) {
    console.error(`[admin/dt/location/${code}] 예상치 못한 에러:`, err.stack);
    return res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/dt/location/:code/today
// ─────────────────────────────────────────────────────────────────────
router.get('/:code/today', adminGuard, async (req, res) => {
  const { code } = req.params;
  if (!registry.resolve(code)) return res.status(404).json({ error: `알 수 없는 장소: ${code}` });

  const kpiCode = registry.getKpiCode(code);
  try {
    const r = await db.query(`
      SELECT s.id,
             s.star_name,
             s.emotion_tag AS emotion,
             w.gem_type,
             s.star_stage AS status,
             s.created_at,
             LEFT(w.wish_text, 40) AS wish_preview
      FROM   dt_stars s
      LEFT JOIN dt_wishes w ON w.id = s.wish_id
      WHERE  COALESCE(s.origin_place, 'global_default_workshop') = $1
        AND  s.created_at >= CURRENT_DATE
      ORDER  BY s.created_at DESC
    `, [kpiCode]);
    res.json({ success: true, stars: r.rows });
  } catch (err) {
    console.error(`[location/${code}/today]`, err.message);
    if (err.code === '42P01') return res.status(503).json({ error: 'dt_stars 테이블 초기화 중' });
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/dt/location/:code/stars
// ─────────────────────────────────────────────────────────────────────
router.get('/:code/stars', adminGuard, async (req, res) => {
  const { code } = req.params;
  if (!registry.resolve(code)) return res.status(404).json({ error: `알 수 없는 장소: ${code}` });

  const kpiCode = registry.getKpiCode(code);
  const limit  = Math.min(Number(req.query.limit)  || 100, 200);
  const offset = Math.max(Number(req.query.offset) || 0,   0);
  const status = req.query.status;

  try {
    const params = [kpiCode, limit, offset];
    const where  = status ? 'AND s.star_stage = $4' : '';
    if (status) params.push(status);

    const [r, total] = await Promise.all([
      db.query(`
        SELECT s.id,
               s.star_name,
               s.emotion_tag AS emotion,
               w.gem_type,
               s.star_stage AS status,
               s.created_at,
               LEFT(w.wish_text, 60) AS wish_preview
        FROM   dt_stars s
        LEFT JOIN dt_wishes w ON w.id = s.wish_id
        WHERE  COALESCE(s.origin_place, 'global_default_workshop') = $1 ${where}
        ORDER  BY s.created_at DESC
        LIMIT  $2 OFFSET $3
      `, params),
      db.query(
        `SELECT COUNT(*) AS n FROM dt_stars
         WHERE COALESCE(origin_place, 'global_default_workshop') = $1`,
        [kpiCode]
      ),
    ]);

    res.json({
      success: true,
      total:   parseInt(total.rows[0].n, 10),
      limit, offset,
      stars: r.rows,
    });
  } catch (err) {
    console.error(`[location/${code}/stars]`, err.message);
    if (err.code === '42P01') return res.status(503).json({ error: 'dt_stars 테이블 초기화 중' });
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────
// GET /api/admin/dt/location/:code/ops
// ─────────────────────────────────────────────────────────────────────
router.get('/:code/ops', adminGuard, async (req, res) => {
  const { code } = req.params;
  const meta = registry.resolve(code);
  if (!meta) return res.status(404).json({ error: `알 수 없는 장소: ${code}` });

  const kpiCode = registry.getKpiCode(code);

  try {
    const r = await db.query(`
      SELECT COUNT(*)                                              AS total_stars,
             COUNT(*) FILTER (WHERE star_stage != 'day1')         AS activated,
             COUNT(*) FILTER (WHERE star_stage  = 'day1')         AS pending,
             MIN(created_at) AS first_star_at,
             MAX(created_at) AS last_star_at
      FROM   dt_stars
      WHERE  COALESCE(origin_place, 'global_default_workshop') = $1
    `, [kpiCode]);

    const row = r.rows[0];
    res.json({
      success:         true,
      location:        { code: meta.code, name: meta.name_ko, emoji: meta.emoji, venue_type: meta.venue_type, status: meta.status },
      ssot_field:      'dt_stars.origin_place',
      origin_location: kpiCode,
      qr_url:          `https://app.dailymiracles.kr/entry?loc=${encodeURIComponent(kpiCode)}`,
      stats: {
        total_stars:   parseInt(row.total_stars, 10),
        activated:     parseInt(row.activated,   10),
        pending:       parseInt(row.pending,     10),
        first_star_at: row.first_star_at,
        last_star_at:  row.last_star_at,
      },
    });
  } catch (err) {
    console.error(`[location/${code}/ops]`, err.message);
    if (err.code === '42P01') return res.status(503).json({ error: 'dt_stars 테이블 초기화 중' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
