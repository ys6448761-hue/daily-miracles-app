/**
 * adminPointRoutes.js
 * 어드민 포인트/추천/Preview 관리 API
 *
 * Endpoints:
 * - GET  /api/admin/points/:userId     - 특정 유저 포인트 조회
 * - GET  /api/admin/hold-queue         - HOLD 대기열 조회
 * - POST /api/admin/hold-queue/:id/resolve - HOLD 항목 처리
 * - GET  /api/admin/preview-quota      - Preview 주간 쿼터 현황
 * - GET  /api/admin/feature-flags      - Feature flag 목록
 * - PUT  /api/admin/feature-flags/:key - Feature flag 변경
 * - POST /api/admin/points/expire-batch - 만료 배치 수동 실행
 * - POST /api/admin/referral/check-batch - 추천 자격 배치 수동 실행
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Services
let pointService, previewService, referralService;
try {
  pointService = require('../services/pointService');
  previewService = require('../services/previewService');
  referralService = require('../services/referralService');
} catch (e) {
  console.error('[AdminPointRoutes] Service load failed:', e.message);
}

// Auth middleware
let verifyAdmin;
try {
  const auth = require('../aurora5/middleware/auth');
  verifyAdmin = auth.verifyAdmin;
} catch (e) {
  console.warn('[AdminPointRoutes] Auth middleware not found, using fallback');
  verifyAdmin = (req, res, next) => {
    // 개발 모드에서는 통과, 프로덕션에서는 차단
    if (process.env.NODE_ENV === 'production') {
      const apiKey = req.headers['x-admin-key'];
      if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }
    }
    next();
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Middleware
// ═══════════════════════════════════════════════════════════════════════════

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 모든 엔드포인트에 어드민 인증 적용
router.use(verifyAdmin);

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/points/:userId
// 특정 사용자 포인트 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/points/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { type = 'trial', limit = '100' } = req.query;

  // 원장 조회
  const ledger = await db.query(`
    SELECT id, event_type, amount, balance_after,
           reference_type, reference_id, description,
           expires_at, is_expired, created_at
    FROM point_ledger
    WHERE subject_type = $1 AND subject_id = $2
    ORDER BY created_at DESC
    LIMIT $3
  `, [type, userId, parseInt(limit, 10)]);

  // 잔액 조회
  const balance = await pointService.getBalance(type, userId);

  // 일일 현황
  const daily = await pointService.getDailyEarnings(type, userId);

  // 통계
  const stats = await db.query(`
    SELECT
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
      SUM(CASE WHEN is_expired = TRUE AND amount > 0 THEN amount ELSE 0 END) as total_expired,
      COUNT(*) as transaction_count
    FROM point_ledger
    WHERE subject_type = $1 AND subject_id = $2
  `, [type, userId]);

  res.json({
    success: true,
    userId,
    subjectType: type,
    balance,
    daily: {
      checkin_earned: daily.checkin_earned,
      action_earned: daily.action_earned,
      log_earned: daily.log_earned,
      total_earned: daily.checkin_earned + daily.action_earned + daily.log_earned
    },
    stats: stats.rows[0],
    ledger: ledger.rows
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/hold-queue
// 수동 검토 대기열 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/hold-queue', asyncHandler(async (req, res) => {
  const { status = 'PENDING', hold_type, limit = '50' } = req.query;

  let query = `
    SELECT h.*,
           CASE
             WHEN h.reference_table = 'referral' THEN (
               SELECT json_build_object(
                 'inviter_id', r.inviter_id,
                 'invitee_id', r.invitee_id,
                 'ref_code', r.inviter_ref_code,
                 'abuse_flags', r.abuse_flags
               ) FROM referral r WHERE r.id = h.reference_id::integer
             )
             ELSE NULL
           END as reference_detail
    FROM admin_hold_queue h
    WHERE h.status = $1
  `;
  const params = [status];
  let paramIndex = 2;

  if (hold_type) {
    query += ` AND h.hold_type = $${paramIndex++}`;
    params.push(hold_type);
  }

  query += ` ORDER BY h.severity DESC, h.created_at ASC LIMIT $${paramIndex++}`;
  params.push(parseInt(limit, 10));

  const result = await db.query(query, params);

  // 상태별 카운트
  const counts = await db.query(`
    SELECT status, COUNT(*) as count
    FROM admin_hold_queue
    GROUP BY status
  `);

  res.json({
    success: true,
    queue: result.rows,
    counts: counts.rows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count, 10) }), {})
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/hold-queue/:id/resolve
// 검토 항목 처리 (승인/거부)
// ═══════════════════════════════════════════════════════════════════════════
router.post('/hold-queue/:id/resolve', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, note, admin_name = 'admin' } = req.body;

  if (!action || !['APPROVED', 'REJECTED'].includes(action)) {
    return res.status(400).json({
      success: false,
      error: 'action은 APPROVED 또는 REJECTED여야 합니다'
    });
  }

  // hold item 조회
  const holdItem = await db.query(`
    SELECT * FROM admin_hold_queue WHERE id = $1 AND status = 'PENDING'
  `, [id]);

  if (holdItem.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: '대기열 항목을 찾을 수 없거나 이미 처리되었습니다'
    });
  }

  const item = holdItem.rows[0];

  // referral HOLD 처리
  if (item.reference_table === 'referral') {
    if (action === 'APPROVED') {
      await referralService.approveHoldReferral(
        parseInt(item.reference_id, 10),
        admin_name
      );
    } else {
      await referralService.rejectHoldReferral(
        parseInt(item.reference_id, 10),
        admin_name,
        note || 'Admin rejected'
      );
    }
  } else {
    // 일반 hold_queue 업데이트
    await db.query(`
      UPDATE admin_hold_queue
      SET status = $1, resolved_by = $2, resolved_at = CURRENT_TIMESTAMP, resolution_note = $3
      WHERE id = $4
    `, [action, admin_name, note, id]);
  }

  res.json({
    success: true,
    message: `항목 ${id}이(가) ${action}으로 처리되었습니다`,
    action,
    resolvedBy: admin_name
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/preview-quota
// Preview 주간 쿼터 현황
// ═══════════════════════════════════════════════════════════════════════════
router.get('/preview-quota', asyncHandler(async (req, res) => {
  // 최근 10주 조회
  const result = await db.query(`
    SELECT year_week, quota_used, quota_limit, updated_at
    FROM preview_weekly_quota
    ORDER BY year_week DESC
    LIMIT 10
  `);

  // 이번 주 현황
  const currentWeek = previewService.getISOWeek();
  const currentQuota = result.rows.find(r => r.year_week === currentWeek) || {
    year_week: currentWeek,
    quota_used: 0,
    quota_limit: previewService.WEEKLY_GLOBAL_LIMIT
  };

  res.json({
    success: true,
    currentWeek,
    current: {
      used: currentQuota.quota_used,
      limit: currentQuota.quota_limit,
      remaining: currentQuota.quota_limit - currentQuota.quota_used
    },
    history: result.rows
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/feature-flags
// Feature flag 목록 조회
// ═══════════════════════════════════════════════════════════════════════════
router.get('/feature-flags', asyncHandler(async (req, res) => {
  const result = await db.query(`
    SELECT flag_key, is_enabled, config, description, updated_at, updated_by
    FROM feature_flags
    ORDER BY flag_key
  `);

  res.json({
    success: true,
    flags: result.rows
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// PUT /api/admin/feature-flags/:key
// Feature flag 설정 변경
// ═══════════════════════════════════════════════════════════════════════════
router.put('/feature-flags/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;
  const { is_enabled, config, admin_name = 'admin' } = req.body;

  // 존재 여부 확인
  const existing = await db.query(`
    SELECT * FROM feature_flags WHERE flag_key = $1
  `, [key]);

  if (existing.rows.length === 0) {
    return res.status(404).json({
      success: false,
      error: `Feature flag '${key}'를 찾을 수 없습니다`
    });
  }

  // 업데이트
  await db.query(`
    UPDATE feature_flags
    SET is_enabled = COALESCE($1, is_enabled),
        config = COALESCE($2, config),
        updated_by = $3,
        updated_at = CURRENT_TIMESTAMP
    WHERE flag_key = $4
  `, [
    is_enabled,
    config ? JSON.stringify(config) : null,
    admin_name,
    key
  ]);

  // 업데이트된 값 조회
  const updated = await db.query(`
    SELECT * FROM feature_flags WHERE flag_key = $1
  `, [key]);

  console.log(`🔧 [Admin] Feature flag '${key}' updated by ${admin_name}: enabled=${is_enabled}`);

  res.json({
    success: true,
    message: `Feature flag '${key}'가 업데이트되었습니다`,
    flag: updated.rows[0]
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/points/expire-batch
// 만료 배치 수동 실행
// ═══════════════════════════════════════════════════════════════════════════
router.post('/points/expire-batch', asyncHandler(async (req, res) => {
  console.log('[Admin] Manual point expiration batch triggered');

  const result = await pointService.expirePoints();

  res.json({
    success: true,
    message: '만료 배치가 완료되었습니다',
    result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// POST /api/admin/referral/check-batch
// 추천 자격 배치 수동 실행
// ═══════════════════════════════════════════════════════════════════════════
router.post('/referral/check-batch', asyncHandler(async (req, res) => {
  console.log('[Admin] Manual referral qualification batch triggered');

  const result = await referralService.checkAllPendingReferrals();

  res.json({
    success: true,
    message: '추천 자격 확인 배치가 완료되었습니다',
    result
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/stats/points
// 포인트 시스템 통계
// ═══════════════════════════════════════════════════════════════════════════
router.get('/stats/points', asyncHandler(async (req, res) => {
  // 전체 통계
  const overallStats = await db.query(`
    SELECT
      COUNT(DISTINCT (subject_type, subject_id)) as total_users,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_issued,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
      SUM(CASE WHEN is_expired = TRUE AND amount > 0 THEN amount ELSE 0 END) as total_expired
    FROM point_ledger
  `);

  // 오늘 통계
  const todayStats = await db.query(`
    SELECT
      COUNT(DISTINCT (subject_type, subject_id)) as active_users,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as issued_today,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as spent_today
    FROM point_ledger
    WHERE created_date = CURRENT_DATE
  `);

  // 이벤트별 통계
  const byEvent = await db.query(`
    SELECT event_type, COUNT(*) as count, SUM(amount) as total_amount
    FROM point_ledger
    GROUP BY event_type
    ORDER BY count DESC
  `);

  res.json({
    success: true,
    overall: overallStats.rows[0],
    today: todayStats.rows[0],
    byEventType: byEvent.rows
  });
}));

// ═══════════════════════════════════════════════════════════════════════════
// GET /api/admin/stats/referral
// 추천 시스템 통계
// ═══════════════════════════════════════════════════════════════════════════
router.get('/stats/referral', asyncHandler(async (req, res) => {
  // 상태별 통계
  const byStatus = await db.query(`
    SELECT status, COUNT(*) as count
    FROM referral
    GROUP BY status
    ORDER BY count DESC
  `);

  // 이번 달 통계
  const yearMonth = referralService.getCurrentYearMonth();
  const monthlyStats = await db.query(`
    SELECT
      COUNT(*) as total_this_month,
      COUNT(CASE WHEN status = 'REWARDED' THEN 1 END) as rewarded_this_month,
      SUM(invitee_points_granted) as invitee_points_total,
      SUM(inviter_points_granted) as inviter_points_total
    FROM referral
    WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
  `);

  // Top 추천인
  const topInviters = await db.query(`
    SELECT inviter_id, COUNT(*) as referral_count,
           SUM(inviter_points_granted) as total_rewards
    FROM referral
    WHERE status = 'REWARDED'
    GROUP BY inviter_id
    ORDER BY referral_count DESC
    LIMIT 10
  `);

  res.json({
    success: true,
    byStatus: byStatus.rows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count, 10) }), {}),
    monthly: monthlyStats.rows[0],
    topInviters: topInviters.rows
  });
}));

module.exports = router;
