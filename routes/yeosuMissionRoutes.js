/**
 * yeosuMissionRoutes.js — 여수 미션 + 일일 로그 + 포인트
 * prefix: /api/yeosu-missions
 *
 * GET  /              ?star_id=xxx  — 5개 미션 목록 + 완료 현황
 * POST /complete                    — 미션 완료 (100P)
 * POST /daily-log                   — 일일 감정 로그 (50P)
 * GET  /points        ?star_id=xxx  — star 총 포인트
 */

const router = require('express').Router();
const db     = require('../database/connection');
const { ValidationError, NotFoundError } = require('../utils/errors');

// ── 헬퍼: star_id 존재 확인 ──────────────────────────────────────
async function assertStarExists(starId) {
  const r = await db.query('SELECT id FROM dt_stars WHERE id = $1', [starId]);
  if (!r.rows.length) throw new NotFoundError('Star', starId);
}

// ── GET / — 미션 목록 + 완료 현황 ───────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { star_id } = req.query;
    if (!star_id) throw new ValidationError('star_id 파라미터가 필요합니다.');

    // 미션 마스터
    const mR = await db.query(
      'SELECT * FROM dt_yeosu_missions ORDER BY sort_order'
    );

    // 완료 기록
    const cR = await db.query(
      'SELECT mission_id, emotion, completed_at FROM dt_mission_completions WHERE star_id = $1',
      [star_id]
    );
    const completedMap = {};
    for (const row of cR.rows) {
      completedMap[row.mission_id] = { emotion: row.emotion, completed_at: row.completed_at };
    }

    // 오늘 일일 로그 여부
    const today = new Date().toISOString().slice(0, 10);
    const dlR = await db.query(
      'SELECT emotion, created_at FROM dt_daily_logs WHERE star_id = $1 AND log_date = $2',
      [star_id, today]
    );
    const todayLog = dlR.rows[0] ?? null;

    const missions = mR.rows.map(m => ({
      id:          m.id,
      title:       m.title,
      description: m.description,
      icon:        m.icon,
      points:      m.points,
      emotions:    m.emotions,
      completed:   !!completedMap[m.id],
      completion:  completedMap[m.id] ?? null,
    }));

    const completedCount = Object.keys(completedMap).length;

    res.json({
      success:        true,
      missions,
      completed_count: completedCount,
      total_count:     missions.length,
      today_log:       todayLog,
      today_log_done:  !!todayLog,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /complete — 미션 완료 ───────────────────────────────────
router.post('/complete', async (req, res, next) => {
  try {
    const { star_id, user_id, mission_id, emotion } = req.body;

    if (!star_id || !user_id || !mission_id) {
      throw new ValidationError('star_id, user_id, mission_id가 필요합니다.');
    }

    // 미션 존재 확인
    const mR = await db.query(
      'SELECT id, title, points FROM dt_yeosu_missions WHERE id = $1',
      [mission_id]
    );
    if (!mR.rows.length) throw new NotFoundError('Mission', mission_id);
    const mission = mR.rows[0];

    // 중복 완료 차단
    const existing = await db.query(
      'SELECT id FROM dt_mission_completions WHERE star_id = $1 AND mission_id = $2',
      [star_id, mission_id]
    );
    if (existing.rows.length) {
      return res.status(409).json({
        success:  false,
        error:    'ALREADY_COMPLETED',
        message:  '이미 완료한 미션입니다.',
      });
    }

    // 저장
    await db.query(
      `INSERT INTO dt_mission_completions
         (star_id, user_id, mission_id, emotion, points_awarded)
       VALUES ($1, $2, $3, $4, $5)`,
      [star_id, user_id, mission_id, emotion ?? null, mission.points]
    );

    // 완료 수 집계
    const countR = await db.query(
      'SELECT COUNT(*)::int AS cnt FROM dt_mission_completions WHERE star_id = $1',
      [star_id]
    );
    const completedCount = countR.rows[0]?.cnt ?? 0;

    res.json({
      success:         true,
      mission_id,
      mission_title:   mission.title,
      points_awarded:  mission.points,
      emotion:         emotion ?? null,
      completed_count: completedCount,
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /daily-log — 일일 감정 로그 ────────────────────────────
router.post('/daily-log', async (req, res, next) => {
  try {
    const { star_id, user_id, emotion, memo } = req.body;

    if (!star_id || !user_id) {
      throw new ValidationError('star_id, user_id가 필요합니다.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const DAILY_LOG_POINTS = 50;

    // 오늘 이미 기록했으면 기존 데이터 반환
    const existing = await db.query(
      'SELECT id, emotion, points_awarded FROM dt_daily_logs WHERE star_id = $1 AND log_date = $2',
      [star_id, today]
    );
    if (existing.rows.length) {
      return res.status(409).json({
        success:        false,
        error:          'ALREADY_LOGGED',
        message:        '오늘은 이미 로그를 남겼어요.',
        existing_log:   existing.rows[0],
      });
    }

    await db.query(
      `INSERT INTO dt_daily_logs
         (star_id, user_id, log_date, emotion, memo, points_awarded)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [star_id, user_id, today, emotion ?? null, memo ?? null, DAILY_LOG_POINTS]
    );

    res.json({
      success:        true,
      log_date:       today,
      emotion:        emotion ?? null,
      points_awarded: DAILY_LOG_POINTS,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /points — star 총 포인트 ─────────────────────────────────
router.get('/points', async (req, res, next) => {
  try {
    const { star_id } = req.query;
    if (!star_id) throw new ValidationError('star_id 파라미터가 필요합니다.');

    const mcR = await db.query(
      'SELECT COALESCE(SUM(points_awarded),0)::int AS total FROM dt_mission_completions WHERE star_id = $1',
      [star_id]
    );
    const dlR = await db.query(
      'SELECT COALESCE(SUM(points_awarded),0)::int AS total FROM dt_daily_logs WHERE star_id = $1',
      [star_id]
    );

    const missionPoints = mcR.rows[0]?.total ?? 0;
    const logPoints     = dlR.rows[0]?.total ?? 0;

    res.json({
      success:        true,
      mission_points: missionPoints,
      log_points:     logPoints,
      total_points:   missionPoints + logPoints,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
