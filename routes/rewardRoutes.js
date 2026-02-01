/**
 * rewardRoutes.js
 * Preview(예고편) 교환 API 엔드포인트
 *
 * Endpoints:
 * - GET  /api/rewards/preview/status       - 교환 자격/한도 확인
 * - POST /api/rewards/preview              - Preview 교환 (900P)
 * - GET  /api/rewards/preview/download/:token - 다운로드 (1회)
 * - GET  /api/rewards/preview/history      - 교환 내역
 * - GET  /api/rewards/preview/quota        - 주간 쿼터 현황
 *
 * SSOT 하드가드:
 * - 900P 비용
 * - 워터마크/1페이지/저해상도
 * - 24h 만료, 1회 다운로드
 * - 유저 주 1회, 전체 주 100건
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const express = require('express');
const router = express.Router();

// Services
let previewService;
let pointService;

try {
  previewService = require('../services/previewService');
  pointService = require('../services/pointService');
} catch (e) {
  console.error('[RewardRoutes] Service load failed:', e.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function checkService(req, res, next) {
  if (!previewService || !pointService) {
    return res.status(503).json({
      success: false,
      error: '리워드 서비스를 사용할 수 없습니다',
      errorCode: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
}

router.use(checkService);

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/rewards/preview/status
// 교환 자격 및 한도 확인
// ═══════════════════════════════════════════════════════════════════════════
router.get('/preview/status', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id } = req.query;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  // 종합 자격 확인
  const eligibility = await previewService.checkRedemptionEligibility(
    subject_type,
    subject_id
  );

  // 안내 메시지 생성
  let message = '';
  if (!eligibility.featureEnabled) {
    message = 'Preview 교환 기능이 비활성화되어 있습니다.';
  } else if (!eligibility.eligible) {
    switch (eligibility.reason) {
      case 'INSUFFICIENT_BALANCE':
        message = `잔액이 부족합니다. (필요: ${eligibility.cost}P, 보유: ${eligibility.balance}P)`;
        break;
      case 'QUALIFICATION_NOT_MET':
        message = `자격 요건을 충족하지 않습니다. (최근 7일: 출석 ${eligibility.qualification?.attendance_7d || 0}회/3회, 실행 ${eligibility.qualification?.action_check || 0}회/1회)`;
        break;
      case 'USER_WEEKLY_LIMIT':
        message = '이번 주 교환 한도(1회)를 이미 사용했습니다.';
        break;
      case 'GLOBAL_WEEKLY_LIMIT':
        message = '이번 주 전체 교환 한도(100건)에 도달했습니다.';
        break;
      default:
        message = '교환이 불가능합니다.';
    }
  } else {
    message = 'Preview 교환이 가능합니다.';
  }

  res.json({
    success: true,
    eligible: eligibility.eligible,
    message,
    cost: previewService.PREVIEW_COST,
    balance: eligibility.balance,
    qualification: eligibility.qualification,
    limits: eligibility.limits,
    featureEnabled: eligibility.featureEnabled,
    specs: {
      pages: 1,
      resolution: 'low',
      watermark: true,
      linkExpiry: `${previewService.LINK_EXPIRY_HOURS}h`,
      downloadLimit: 1
    }
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/rewards/preview
// Preview 교환 (900P)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/preview', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id } = req.body;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  // 교환 실행
  const result = await previewService.redeemPreview(subject_type, subject_id);

  if (!result.success) {
    // 에러 유형에 따른 상태 코드
    let statusCode = 400;
    if (result.error === 'FEATURE_DISABLED') statusCode = 503;
    if (result.error === 'INSUFFICIENT_BALANCE') statusCode = 400;

    return res.status(statusCode).json(result);
  }

  // 다운로드 URL 생성
  const downloadUrl = `/api/rewards/preview/download/${result.previewToken}`;

  res.status(201).json({
    success: true,
    message: result.message,
    redemptionId: result.redemptionId,
    downloadUrl,
    expiresAt: result.expiresAt,
    newBalance: result.newBalance,
    warning: '이 링크는 24시간 후 만료되며, 1회만 다운로드 가능합니다. 재다운로드 불가.'
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/rewards/preview/download/:token
// Preview 다운로드 (1회 제한)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/preview/download/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token || token.length < 32) {
    return res.status(400).json({
      success: false,
      error: '유효하지 않은 토큰입니다',
      errorCode: 'INVALID_TOKEN'
    });
  }

  // 다운로드 처리
  const result = await previewService.downloadPreview(token);

  if (!result.success) {
    let statusCode = 400;
    if (result.error === 'INVALID_TOKEN') statusCode = 404;
    if (result.error === 'EXPIRED') statusCode = 410;  // Gone
    if (result.error === 'ALREADY_DOWNLOADED') statusCode = 409;  // Conflict

    return res.status(statusCode).json(result);
  }

  // 성공 시 파일 정보 또는 리다이렉트
  res.json({
    success: true,
    message: result.message,
    previewUrl: result.previewUrl,
    specs: result.specs,
    note: '이 토큰은 더 이상 사용할 수 없습니다.'
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/rewards/preview/history
// 교환 내역 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/preview/history', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id } = req.query;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  const result = await previewService.getRedemptionHistory(subject_type, subject_id);

  res.json({
    success: true,
    ...result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/rewards/preview/quota
// 주간 쿼터 현황 (공개 정보)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/preview/quota', asyncHandler(async (req, res) => {
  const quota = await previewService.getWeeklyQuotaStatus();

  res.json({
    success: true,
    ...quota,
    message: quota.remaining > 0
      ? `이번 주 ${quota.remaining}건 교환 가능`
      : '이번 주 전체 한도에 도달했습니다'
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/rewards/preview/info
// Preview 교환 정보 (개발용)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/preview/info', (req, res) => {
  res.json({
    success: true,
    cost: previewService.PREVIEW_COST,
    limits: {
      userWeekly: previewService.WEEKLY_USER_LIMIT,
      globalWeekly: previewService.WEEKLY_GLOBAL_LIMIT
    },
    qualification: previewService.QUALIFICATION,
    specs: {
      pages: 1,
      resolution: 'low',
      watermark: previewService.WATERMARK_TEXT,
      linkExpiry: `${previewService.LINK_EXPIRY_HOURS} hours`,
      downloadLimit: 1,
      storagePolicy: 'no_archive'  // 보관함 저장 없음
    }
  });
});

module.exports = router;
