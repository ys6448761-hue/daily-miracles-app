/**
 * referralRoutes.js
 * 친구추천 API 엔드포인트
 *
 * Endpoints:
 * - POST /api/referral/apply     - 추천 코드 적용
 * - GET  /api/referral/status    - 추천 현황 조회
 * - GET  /api/referral/my-code   - 내 추천 코드 조회
 * - GET  /api/referral/info      - 추천 정책 정보
 *
 * SSOT 하드가드:
 * - B 300P 즉시, A 300P 베스팅
 * - QUALIFIED: 7일 내 출석≥2, 실행≥1
 * - A 월 5명 상한
 * - 어뷰징 → HOLD
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const express = require('express');
const router = express.Router();

// Services
let referralService;
let pointService;

try {
  referralService = require('../services/referralService');
  pointService = require('../services/pointService');
} catch (e) {
  console.error('[ReferralRoutes] Service load failed:', e.message);
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
  if (!referralService || !pointService) {
    return res.status(503).json({
      success: false,
      error: '추천 서비스를 사용할 수 없습니다',
      errorCode: 'SERVICE_UNAVAILABLE'
    });
  }
  next();
}

router.use(checkService);

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/referral/apply
// 추천 코드 적용
// ═══════════════════════════════════════════════════════════════════════════
router.post('/apply', asyncHandler(async (req, res) => {
  const { trial_id, ref_code } = req.body;

  // 입력 검증
  if (!trial_id) {
    return res.status(400).json({
      success: false,
      error: 'trial_id는 필수입니다',
      errorCode: 'MISSING_TRIAL_ID'
    });
  }

  if (!ref_code) {
    return res.status(400).json({
      success: false,
      error: 'ref_code는 필수입니다',
      errorCode: 'MISSING_REF_CODE'
    });
  }

  // 추천 코드 형식 검증 (REF-XXXXX)
  if (!/^REF-[A-Z0-9]{5}$/i.test(ref_code)) {
    return res.status(400).json({
      success: false,
      error: '추천 코드 형식이 올바르지 않습니다 (예: REF-XXXXX)',
      errorCode: 'INVALID_REF_CODE_FORMAT'
    });
  }

  // 메타데이터 수집 (어뷰징 감지용)
  const metadata = {
    deviceId: req.headers['x-device-id'] || req.headers['user-agent'] || null,
    ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || null
  };

  // 적용 실행
  const result = await referralService.applyReferralCode(
    trial_id,
    ref_code.toUpperCase(),
    metadata
  );

  if (!result.success) {
    let statusCode = 400;
    if (result.error === 'FEATURE_DISABLED') statusCode = 503;
    if (result.error === 'INVALID_REF_CODE') statusCode = 404;

    return res.status(statusCode).json(result);
  }

  res.status(201).json({
    success: true,
    message: result.message,
    referralId: result.referralId,
    status: result.status,
    bonusReceived: result.inviteeBonus,
    newBalance: result.inviteeBalance,
    isHold: result.isHold,
    note: result.isHold
      ? '추천 코드 적용은 완료되었으나, 검토가 필요하여 보너스 지급이 보류되었습니다.'
      : `${referralService.INVITEE_BONUS}P가 즉시 지급되었습니다.`
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/referral/status
// 추천 현황 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/status', asyncHandler(async (req, res) => {
  const { subject_type = 'trial', subject_id } = req.query;

  if (!subject_id) {
    return res.status(400).json({
      success: false,
      error: 'subject_id는 필수입니다',
      errorCode: 'MISSING_SUBJECT_ID'
    });
  }

  // Feature flag 확인
  const enabled = await pointService.isFeatureEnabled('referral_enabled');
  if (!enabled) {
    return res.json({
      success: true,
      featureEnabled: false,
      message: '추천 기능이 비활성화되어 있습니다.'
    });
  }

  const status = await referralService.getReferralStatus(subject_type, subject_id);

  res.json({
    success: true,
    featureEnabled: true,
    ...status
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/referral/my-code
// 내 추천 코드 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/my-code', asyncHandler(async (req, res) => {
  const { trial_id } = req.query;

  if (!trial_id) {
    return res.status(400).json({
      success: false,
      error: 'trial_id는 필수입니다',
      errorCode: 'MISSING_TRIAL_ID'
    });
  }

  const result = await referralService.getMyRefCode(trial_id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  // 공유용 URL 생성
  const baseUrl = process.env.BASE_URL || 'https://dailymiracles.co.kr';
  const shareUrl = `${baseUrl}/start?ref=${result.refCode}`;

  res.json({
    success: true,
    refCode: result.refCode,
    shareUrl,
    shareMessage: `하루하루의 기적과 함께 소원을 이뤄보세요! 🌟\n추천 코드: ${result.refCode}\n${shareUrl}`,
    rewards: {
      inviteeBonus: referralService.INVITEE_BONUS,
      inviterBonus: referralService.INVITER_BONUS,
      condition: '피추천인이 7일 내 출석 2회 + 실행체크 1회 달성 시'
    }
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/referral/info
// 추천 정책 정보 (개발용)
// ═══════════════════════════════════════════════════════════════════════════
router.get('/info', (req, res) => {
  res.json({
    success: true,
    policy: {
      inviteeBonus: referralService.INVITEE_BONUS,
      inviterBonus: referralService.INVITER_BONUS,
      monthlyLimit: referralService.MONTHLY_LIMIT,
      qualification: referralService.QUALIFICATION,
      abuseDetection: ['device_hash', 'ip_hash']
    },
    statuses: {
      PENDING: '코드 적용됨, 피추천인 자격 미달',
      QUALIFIED: '피추천인 자격 달성, 추천인 보상 대기',
      REWARDED: '추천인 보상 지급 완료',
      HOLD: '어뷰징 의심, 수동 검토 필요',
      REJECTED: '어뷰징 확정, 보상 거부',
      EXPIRED: '7일 내 자격 미달성으로 만료'
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/referral/check-qualification (내부용)
// 특정 invitee의 자격 확인 및 보상 처리
// ═══════════════════════════════════════════════════════════════════════════
router.post('/check-qualification', asyncHandler(async (req, res) => {
  const { trial_id } = req.body;

  if (!trial_id) {
    return res.status(400).json({
      success: false,
      error: 'trial_id는 필수입니다'
    });
  }

  // 자격 확인
  const qualification = await referralService.checkInviteeQualification(trial_id);

  if (!qualification.qualified) {
    return res.json({
      success: true,
      qualified: false,
      qualification
    });
  }

  // 자격 달성 시 보상 처리
  const result = await referralService.grantInviterReward(trial_id);

  res.json({
    success: true,
    qualified: true,
    qualification,
    rewardResult: result
  });
}));

module.exports = router;
