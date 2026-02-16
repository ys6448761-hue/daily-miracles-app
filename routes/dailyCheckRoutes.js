/**
 * dailyCheckRoutes.js
 * 일일 체크 API (출석/실행/기록) + 포인트 적립 연동
 *
 * Endpoints:
 * - POST /api/daily/checkin    - 출석체크 (+50P)
 * - POST /api/daily/action     - 실행체크 (+30P)
 * - POST /api/daily/log        - 기록 작성 (+20P)
 * - GET  /api/daily/status     - 오늘 체크 현황
 *
 * 포인트 적립 규칙:
 * - points_enabled 플래그 ON일 때만 적립
 * - 일일 100P 상한 (50+30+20)
 * - 각 유형별 1일 1회만 적립
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6 - Gap 해소
 */

const express = require('express');
const router = express.Router();

const { getKSTDateString } = require('../utils/kstDate');

// Services & DB
let db, pointService;
try {
  db = require('../database/db');
  pointService = require('../services/pointService');
  console.log('✅ [DailyCheck] 서비스 로드 성공');
} catch (e) {
  console.error('❌ [DailyCheck] 서비스 로드 실패:', e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const CHECK_TYPES = {
  CHECKIN: 'checkin',   // 출석체크
  ACTION: 'action',     // 실행체크 (24h 행동)
  LOG: 'log'            // 기록 작성
};

const POINT_REWARDS = {
  checkin: { amount: 50, eventType: 'EARN_CHECKIN', description: '출석체크 보상' },
  action: { amount: 30, eventType: 'EARN_ACTION', description: '실행체크 보상' },
  log: { amount: 20, eventType: 'EARN_LOG', description: '기록 작성 보상' }
};

// ═══════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function checkService(req, res, next) {
  if (!db || !pointService) {
    return res.status(503).json({
      success: false,
      error: '서비스를 사용할 수 없습니다',
      errorCode: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
}

router.use(checkService);

// ═══════════════════════════════════════════════════════════════════════════
// Helper: Token → Subject 변환 (접근 제어)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 토큰으로 trial 정보 조회
 * @param {string} token - trials.token
 * @returns {Promise<object|null>} { subject_type, subject_id, ... }
 */
async function validateToken(token) {
  if (!token || token.length < 10) {
    return null;
  }

  try {
    const result = await db.query(`
      SELECT id, token, phone, ref_code, active
      FROM trials
      WHERE token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return null;
    }

    const trial = result.rows[0];
    return {
      subject_type: 'trial',
      subject_id: trial.id.toString(),
      phone: trial.phone,
      refCode: trial.ref_code,
      active: trial.active
    };
  } catch (error) {
    console.error('[DailyCheck] Token validation error:', error.message);
    return null;
  }
}

/**
 * 요청에서 subject 정보 추출 (token 또는 subject_id/type)
 * token이 있으면 token 검증, 없으면 subject_id 직접 사용
 */
async function resolveSubject(req) {
  // 1. token 우선 (보안)
  const token = req.body.token || req.query.token;
  if (token) {
    const subject = await validateToken(token);
    if (subject) {
      return subject;
    }
    return { error: 'INVALID_TOKEN', message: '유효하지 않은 토큰입니다' };
  }

  // 2. 직접 subject_id (레거시/관리자용)
  const subject_id = req.body.subject_id || req.query.subject_id;
  const subject_type = req.body.subject_type || req.query.subject_type || 'trial';

  if (subject_id) {
    // 관리자 키 확인 (선택적 보안 강화)
    const adminKey = req.headers['x-admin-key'] || req.query.admin_key;
    if (adminKey === process.env.ADMIN_API_KEY) {
      return { subject_type, subject_id };
    }

    // 관리자 키 없으면 trial 존재 여부만 확인
    try {
      const result = await db.query(
        'SELECT id, ref_code FROM trials WHERE id = $1::integer',
        [subject_id]
      );
      if (result.rows.length > 0) {
        return {
          subject_type,
          subject_id,
          refCode: result.rows[0].ref_code
        };
      }
    } catch (e) {
      // 숫자가 아닌 경우 등
    }

    return { error: 'SUBJECT_NOT_FOUND', message: '대상을 찾을 수 없습니다' };
  }

  return { error: 'NO_AUTH', message: '인증 정보가 필요합니다' };
}

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/daily/auth - 토큰 인증 엔드포인트
// ═══════════════════════════════════════════════════════════════════════════

router.get('/auth', asyncHandler(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: '토큰이 필요합니다',
      errorCode: 'MISSING_TOKEN'
    });
  }

  const subject = await validateToken(token);

  if (!subject) {
    return res.status(401).json({
      success: false,
      error: '유효하지 않은 토큰입니다',
      errorCode: 'INVALID_TOKEN'
    });
  }

  res.json({
    success: true,
    ...subject
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// Helper: 오늘 체크 여부 확인
// ═══════════════════════════════════════════════════════════════════════════

async function getTodayCheckStatus(subjectType, subjectId) {
  const today = getKSTDateString();

  const result = await db.query(`
    SELECT check_type, checked_at, points_earned
    FROM daily_checks
    WHERE subject_type = $1
      AND subject_id = $2
      AND check_date = $3
  `, [subjectType, subjectId, today]);

  const status = {
    date: today,
    checkin: null,
    action: null,
    log: null,
    totalEarned: 0
  };

  for (const row of result.rows) {
    status[row.check_type] = {
      checked: true,
      checkedAt: row.checked_at,
      pointsEarned: row.points_earned
    };
    status.totalEarned += row.points_earned || 0;
  }

  return status;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper: 체크 수행 + 포인트 적립
// ═══════════════════════════════════════════════════════════════════════════

async function performCheck(subjectType, subjectId, checkType, metadata = {}) {
  const today = getKSTDateString();
  const reward = POINT_REWARDS[checkType];

  if (!reward) {
    return { success: false, error: 'INVALID_CHECK_TYPE' };
  }

  // 이미 체크했는지 확인
  const existing = await db.query(`
    SELECT id FROM daily_checks
    WHERE subject_type = $1 AND subject_id = $2
      AND check_date = $3 AND check_type = $4
  `, [subjectType, subjectId, today, checkType]);

  if (existing.rows.length > 0) {
    return {
      success: false,
      error: 'ALREADY_CHECKED',
      message: `오늘 이미 ${checkType} 체크를 완료했습니다`
    };
  }

  // 포인트 적립 시도
  let pointsEarned = 0;
  let pointResult = null;

  // Feature flag 확인
  const pointsEnabled = await pointService.isFeatureEnabled('points_enabled');

  if (pointsEnabled) {
    pointResult = await pointService.earnPoints(
      subjectType,
      subjectId,
      reward.eventType,
      reward.amount,
      {
        referenceType: 'daily_check',
        referenceId: `${today}-${checkType}`,
        description: reward.description
      }
    );

    if (pointResult.success) {
      pointsEarned = pointResult.earned;
    }
  }

  // 체크 기록 저장
  const insertResult = await db.query(`
    INSERT INTO daily_checks (
      subject_type, subject_id, check_date, check_type,
      checked_at, points_earned, metadata
    ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6)
    RETURNING id, checked_at
  `, [
    subjectType,
    subjectId,
    today,
    checkType,
    pointsEarned,
    JSON.stringify(metadata)
  ]);

  return {
    success: true,
    checkId: insertResult.rows[0].id,
    checkedAt: insertResult.rows[0].checked_at,
    pointsEarned,
    pointsEnabled,
    cappedAmount: pointResult?.cappedAmount || null,
    message: pointsEarned > 0
      ? `${checkType} 체크 완료! +${pointsEarned}P`
      : `${checkType} 체크 완료! (포인트 ${pointsEnabled ? '상한 도달' : '비활성화'})`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/daily/checkin
// 출석체크 (+50P)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/checkin', asyncHandler(async (req, res) => {
  const subject = await resolveSubject(req);

  if (subject.error) {
    return res.status(401).json({
      success: false,
      error: subject.message,
      errorCode: subject.error
    });
  }

  const result = await performCheck(subject.subject_type, subject.subject_id, CHECK_TYPES.CHECKIN);

  if (!result.success) {
    return res.status(result.error === 'ALREADY_CHECKED' ? 409 : 400).json(result);
  }

  res.status(201).json({
    success: true,
    checkType: 'checkin',
    ...result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/daily/action
// 실행체크 (+30P) - 24시간 내 구체적 행동 수행
// ═══════════════════════════════════════════════════════════════════════════

router.post('/action', asyncHandler(async (req, res) => {
  const subject = await resolveSubject(req);
  const { action_description } = req.body;

  if (subject.error) {
    return res.status(401).json({
      success: false,
      error: subject.message,
      errorCode: subject.error
    });
  }

  const result = await performCheck(
    subject.subject_type,
    subject.subject_id,
    CHECK_TYPES.ACTION,
    { action_description }
  );

  if (!result.success) {
    return res.status(result.error === 'ALREADY_CHECKED' ? 409 : 400).json(result);
  }

  res.status(201).json({
    success: true,
    checkType: 'action',
    ...result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/daily/log
// 기록 작성 (+20P)
// ═══════════════════════════════════════════════════════════════════════════

router.post('/log', asyncHandler(async (req, res) => {
  const subject = await resolveSubject(req);
  const { log_content } = req.body;

  if (subject.error) {
    return res.status(401).json({
      success: false,
      error: subject.message,
      errorCode: subject.error
    });
  }

  if (!log_content || log_content.trim().length < 10) {
    return res.status(400).json({
      success: false,
      error: '기록 내용은 최소 10자 이상이어야 합니다',
      errorCode: 'LOG_TOO_SHORT'
    });
  }

  const result = await performCheck(
    subject.subject_type,
    subject.subject_id,
    CHECK_TYPES.LOG,
    { log_content: log_content.trim() }
  );

  if (!result.success) {
    return res.status(result.error === 'ALREADY_CHECKED' ? 409 : 400).json(result);
  }

  res.status(201).json({
    success: true,
    checkType: 'log',
    ...result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/daily/status
// 오늘 체크 현황 조회
// ═══════════════════════════════════════════════════════════════════════════

router.get('/status', asyncHandler(async (req, res) => {
  const subject = await resolveSubject(req);

  if (subject.error) {
    return res.status(401).json({
      success: false,
      error: subject.message,
      errorCode: subject.error
    });
  }

  const { subject_type, subject_id, refCode } = subject;

  const status = await getTodayCheckStatus(subject_type, subject_id);

  // 포인트 잔액도 함께 조회
  let balance = 0;
  try {
    balance = await pointService.getBalance(subject_type, subject_id);
  } catch (e) {
    console.warn('[DailyCheck] 잔액 조회 실패:', e.message);
  }

  // refCode는 resolveSubject에서 이미 가져옴

  res.json({
    success: true,
    ...status,
    balance,
    refCode,
    checklist: [
      {
        type: 'checkin',
        label: '출석체크',
        reward: 50,
        completed: !!status.checkin,
        earned: status.checkin?.pointsEarned || 0
      },
      {
        type: 'action',
        label: '실행체크',
        reward: 30,
        completed: !!status.action,
        earned: status.action?.pointsEarned || 0
      },
      {
        type: 'log',
        label: '기록 작성',
        reward: 20,
        completed: !!status.log,
        earned: status.log?.pointsEarned || 0
      }
    ],
    maxDaily: 100
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/daily/history
// 체크 이력 조회
// ═══════════════════════════════════════════════════════════════════════════

router.get('/history', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id, days = '7' } = req.query;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  const result = await db.query(`
    SELECT check_date, check_type, checked_at, points_earned
    FROM daily_checks
    WHERE subject_type = $1 AND subject_id = $2
      AND check_date >= CURRENT_DATE - INTERVAL '1 day' * $3
    ORDER BY check_date DESC, checked_at DESC
  `, [subject_type, subject_id, parseInt(days, 10)]);

  // 날짜별로 그룹화
  const byDate = {};
  for (const row of result.rows) {
    const date = getKSTDateString(row.check_date);
    if (!byDate[date]) {
      byDate[date] = { date, checks: [], totalEarned: 0 };
    }
    byDate[date].checks.push({
      type: row.check_type,
      checkedAt: row.checked_at,
      pointsEarned: row.points_earned
    });
    byDate[date].totalEarned += row.points_earned || 0;
  }

  res.json({
    success: true,
    days: parseInt(days, 10),
    history: Object.values(byDate),
    totalDays: Object.keys(byDate).length
  });
}));

module.exports = router;
