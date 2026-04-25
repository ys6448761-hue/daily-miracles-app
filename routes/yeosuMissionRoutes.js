/**
 * yeosuMissionRoutes.js — 여수 미션 + 일일 로그 + 포인트
 * prefix: /api/yeosu-missions
 *
 * GET  /              ?star_id=xxx  — 5개 미션 목록 + 완료 현황
 * POST /complete                    — 미션 완료 (100P) + 전체 완료 시 +500P 보너스
 * POST /daily-log                   — 일일 감정 로그 (50P, 1일 1회)
 * GET  /points        ?star_id=xxx  — 미션P + 로그P + 보너스P 합계
 */

const router = require('express').Router();
const db     = require('../database/db');
const { ValidationError, NotFoundError } = require('../utils/errors');

const TOTAL_MISSIONS   = 5;
const BONUS_POINTS     = 500;
const BONUS_TYPE       = 'all_missions_complete';

// migration 118/119 미실행 환경(DB 테이블 없음) → 500 대신 { success: false } 반환
function handleErr(err, res, next) {
  if (err.code === '42P01') return res.json({ success: false, reason: 'feature_unavailable' });
  next(err);
}

// ── GET / — 미션 목록 + 완료 현황 ───────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { star_id } = req.query;
    if (!star_id) throw new ValidationError('star_id 파라미터가 필요합니다.');

    // 미션 마스터 (question + answers 포함)
    const mR = await db.query(
      'SELECT id, title, description, icon, points, question, answers, sort_order FROM dt_yeosu_missions ORDER BY sort_order'
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

    // 보너스 지급 여부
    const bonusR = await db.query(
      'SELECT id FROM dt_star_bonuses WHERE star_id = $1 AND bonus_type = $2',
      [star_id, BONUS_TYPE]
    ).catch(() => ({ rows: [] }));
    const bonusGiven = bonusR.rows.length > 0;

    const missions = mR.rows.map(m => ({
      id:          m.id,
      title:       m.title,
      description: m.description,
      icon:        m.icon,
      points:      m.points,
      question:    m.question   ?? '이 순간 어떤 감정인가요?',
      answers:     m.answers    ?? [],
      completed:   !!completedMap[m.id],
      completion:  completedMap[m.id] ?? null,
    }));

    const completedCount = Object.keys(completedMap).length;

    res.json({
      success:         true,
      missions,
      completed_count: completedCount,
      total_count:     missions.length,
      today_log:       todayLog,
      today_log_done:  !!todayLog,
      bonus_given:     bonusGiven,
      all_complete:    completedCount >= TOTAL_MISSIONS,
    });
  } catch (err) {
    handleErr(err, res, next);
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
        success: false,
        error:   'ALREADY_COMPLETED',
        message: '이미 완료한 미션이에요.',
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

    // 5개 전체 완료 보너스 (1회)
    let bonusAwarded = 0;
    let allComplete  = false;
    if (completedCount >= TOTAL_MISSIONS) {
      allComplete = true;
      const bonusR = await db.query(
        `INSERT INTO dt_star_bonuses (star_id, bonus_type, points_awarded)
         VALUES ($1, $2, $3)
         ON CONFLICT (star_id, bonus_type) DO NOTHING
         RETURNING id`,
        [star_id, BONUS_TYPE, BONUS_POINTS]
      ).catch(() => ({ rows: [] }));
      if (bonusR.rows.length > 0) {
        bonusAwarded = BONUS_POINTS;
      }
    }

    res.json({
      success:         true,
      mission_id,
      mission_title:   mission.title,
      points_awarded:  mission.points,
      bonus_awarded:   bonusAwarded,
      emotion:         emotion ?? null,
      completed_count: completedCount,
      all_complete:    allComplete,
    });
  } catch (err) {
    handleErr(err, res, next);
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
        success:      false,
        error:        'ALREADY_LOGGED',
        message:      '오늘은 이미 기록했어요.',
        existing_log: existing.rows[0],
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
    handleErr(err, res, next);
  }
});

// ── GET /points — star 총 포인트 ─────────────────────────────────
router.get('/points', async (req, res, next) => {
  try {
    const { star_id } = req.query;
    if (!star_id) throw new ValidationError('star_id 파라미터가 필요합니다.');

    const [mcR, dlR, bonusR] = await Promise.all([
      db.query(
        'SELECT COALESCE(SUM(points_awarded),0)::int AS total FROM dt_mission_completions WHERE star_id = $1',
        [star_id]
      ),
      db.query(
        'SELECT COALESCE(SUM(points_awarded),0)::int AS total FROM dt_daily_logs WHERE star_id = $1',
        [star_id]
      ),
      db.query(
        'SELECT COALESCE(SUM(points_awarded),0)::int AS total FROM dt_star_bonuses WHERE star_id = $1',
        [star_id]
      ).catch(() => ({ rows: [{ total: 0 }] })),
    ]);

    const missionPoints = mcR.rows[0]?.total ?? 0;
    const logPoints     = dlR.rows[0]?.total ?? 0;
    const bonusPoints   = bonusR.rows[0]?.total ?? 0;

    res.json({
      success:        true,
      mission_points: missionPoints,
      log_points:     logPoints,
      bonus_points:   bonusPoints,
      total_points:   missionPoints + logPoints + bonusPoints,
    });
  } catch (err) {
    handleErr(err, res, next);
  }
});

module.exports = router;
