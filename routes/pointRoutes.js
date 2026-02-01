/**
 * pointRoutes.js
 * 포인트 API 엔드포인트
 *
 * Endpoints:
 * - GET  /api/points/balance   - 잔액 조회
 * - GET  /api/points/history   - 내역 조회
 * - GET  /api/points/summary   - 요약 조회
 * - POST /api/points/earn      - 포인트 적립 (내부용)
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const express = require('express');
const router = express.Router();

// Service
let pointService;
try {
  pointService = require('../services/pointService');
} catch (e) {
  console.error('[PointRoutes] Service load failed:', e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Async handler wrapper
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Service availability check
 */
function checkService(req, res, next) {
  if (!pointService) {
    return res.status(503).json({
      success: false,
      error: '포인트 서비스를 사용할 수 없습니다',
      errorCode: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
}

router.use(checkService);

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/points/balance
// 잔액 및 오늘 적립 현황 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/balance', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id } = req.query;

  // 입력 검증
  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  // Feature flag 확인
  const enabled = await pointService.isFeatureEnabled('points_enabled');
  if (!enabled) {
    return res.status(200).json({
      success: true,
      balance: 0,
      daily: null,
      message: '포인트 기능이 비활성화되어 있습니다',
      featureEnabled: false
    });
  }

  // 잔액 및 일일 현황 조회
  const balance = await pointService.getBalance(subject_type, subject_id);
  const daily = await pointService.getDailyEarnings(subject_type, subject_id);

  res.json({
    success: true,
    featureEnabled: true,
    balance,
    daily: {
      checkin: {
        earned: daily.checkin_earned,
        cap: pointService.DAILY_CAPS.checkin,
        remaining: Math.max(0, pointService.DAILY_CAPS.checkin - daily.checkin_earned)
      },
      action: {
        earned: daily.action_earned,
        cap: pointService.DAILY_CAPS.action,
        remaining: Math.max(0, pointService.DAILY_CAPS.action - daily.action_earned)
      },
      log: {
        earned: daily.log_earned,
        cap: pointService.DAILY_CAPS.log,
        remaining: Math.max(0, pointService.DAILY_CAPS.log - daily.log_earned)
      },
      total: {
        earned: daily.checkin_earned + daily.action_earned + daily.log_earned,
        cap: pointService.TOTAL_DAILY_CAP,
        remaining: Math.max(0, pointService.TOTAL_DAILY_CAP - (daily.checkin_earned + daily.action_earned + daily.log_earned))
      }
    }
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/points/summary
// 포인트 요약 (잔액 + 일일 + 총계)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/summary', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id } = req.query;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  const enabled = await pointService.isFeatureEnabled('points_enabled');
  if (!enabled) {
    return res.json({
      success: true,
      featureEnabled: false,
      summary: null
    });
  }

  const summary = await pointService.getSummary(subject_type, subject_id);

  res.json({
    success: true,
    featureEnabled: true,
    summary
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/points/history
// 포인트 내역 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/history', asyncHandler(async (req, res) => {
  const {
    subject_type = 'trial',
    subject_id,
    limit = '50',
    offset = '0',
    event_type
  } = req.query;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  const enabled = await pointService.isFeatureEnabled('points_enabled');
  if (!enabled) {
    return res.json({
      success: true,
      featureEnabled: false,
      history: [],
      total: 0
    });
  }

  const result = await pointService.getHistory(subject_type, subject_id, {
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    eventType: event_type || null
  });

  res.json({
    success: true,
    featureEnabled: true,
    ...result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/points/earn
// 포인트 적립 (내부 API - 인증 필요)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/earn', asyncHandler(async (req, res) => {
  const {
    subject_type,
    subject_id,
    event_type,
    amount,
    category,
    reference_type,
    reference_id,
    description
  } = req.body;

  // 필수 필드 검증
  if (!subject_type || !subject_id || !event_type || !amount) {
    return res.status(400).json({
      success: false,
      error: '필수 필드가 누락되었습니다 (subject_type, subject_id, event_type, amount)',
      errorCode: 'MISSING_REQUIRED_FIELDS'
    });
  }

  // 금액 검증
  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'amount는 양수여야 합니다',
      errorCode: 'INVALID_AMOUNT'
    });
  }

  // 이벤트 타입 검증
  const validEventTypes = Object.values(pointService.EVENT_TYPES);
  if (!validEventTypes.includes(event_type)) {
    return res.status(400).json({
      success: false,
      error: `유효하지 않은 event_type: ${event_type}`,
      errorCode: 'INVALID_EVENT_TYPE',
      validTypes: validEventTypes.filter(t => t.startsWith('POINT_EARN'))
    });
  }

  // 카테고리 검증 (있을 경우)
  if (category && !pointService.DAILY_CAPS[category]) {
    return res.status(400).json({
      success: false,
      error: `유효하지 않은 category: ${category}`,
      errorCode: 'INVALID_CATEGORY',
      validCategories: Object.keys(pointService.DAILY_CAPS)
    });
  }

  // 적립 실행
  const result = await pointService.earnPoints({
    subjectType: subject_type,
    subjectId: subject_id,
    eventType: event_type,
    amount: parsedAmount,
    category: category || null,
    referenceType: reference_type || null,
    referenceId: reference_id || null,
    description: description || null
  });

  if (!result.success) {
    // 한도 초과 등의 경우
    const statusCode = result.error === 'FEATURE_DISABLED' ? 503 : 400;
    return res.status(statusCode).json(result);
  }

  res.status(201).json({
    success: true,
    message: '포인트가 적립되었습니다',
    data: result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/points/spend (내부 API)
// 포인트 사용 - 주로 previewService 등에서 내부 호출
// ═══════════════════════════════════════════════════════════════════════════
router.post('/spend', asyncHandler(async (req, res) => {
  const {
    subject_type,
    subject_id,
    event_type,
    amount,
    reference_type,
    reference_id,
    description
  } = req.body;

  if (!subject_type || !subject_id || !event_type || !amount) {
    return res.status(400).json({
      success: false,
      error: '필수 필드가 누락되었습니다',
      errorCode: 'MISSING_REQUIRED_FIELDS'
    });
  }

  const parsedAmount = parseInt(amount, 10);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      success: false,
      error: 'amount는 양수여야 합니다',
      errorCode: 'INVALID_AMOUNT'
    });
  }

  const result = await pointService.spendPoints({
    subjectType: subject_type,
    subjectId: subject_id,
    eventType: event_type,
    amount: parsedAmount,
    referenceType: reference_type || null,
    referenceId: reference_id || null,
    description: description || null
  });

  if (!result.success) {
    const statusCode = result.error === 'INSUFFICIENT_BALANCE' ? 400 : 503;
    return res.status(statusCode).json(result);
  }

  res.json({
    success: true,
    message: '포인트가 사용되었습니다',
    data: result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/points/event-types
// 유효한 이벤트 타입 목록 조회 (개발용)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/event-types', (req, res) => {
  res.json({
    success: true,
    eventTypes: pointService.EVENT_TYPES,
    dailyCaps: pointService.DAILY_CAPS,
    totalDailyCap: pointService.TOTAL_DAILY_CAP,
    expiryDays: pointService.POINT_EXPIRY_DAYS
  });
});

module.exports = router;
