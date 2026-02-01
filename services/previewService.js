/**
 * previewService.js
 * Preview(예고편) 교환 비즈니스 로직
 *
 * SSOT 하드가드:
 * - 비용: 900P
 * - 워터마크 필수, 1페이지, 저해상도
 * - 링크 24h 만료, 1회성 토큰, 재다운로드 불가
 * - 보관함 저장 없음
 * - 자격: 최근 7일 출석≥3, 실행체크≥1
 * - 상한: 유저 주 1회, 전체 주 100건
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const crypto = require('crypto');
const db = require('../database/db');
const pointService = require('./pointService');

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의 (SSOT)
// ═══════════════════════════════════════════════════════════════════════════

const PREVIEW_COST = 900;              // 교환 비용
const WEEKLY_USER_LIMIT = 1;           // 유저 주 1회
const WEEKLY_GLOBAL_LIMIT = 100;       // 전체 주 100건
const LINK_EXPIRY_HOURS = 24;          // 링크 24h 만료

// 자격 요건
const QUALIFICATION = {
  attendanceDays: 7,      // 최근 N일
  minAttendance: 3,       // 최소 출석 횟수
  minActionCheck: 1       // 최소 실행체크 횟수
};

// 워터마크 텍스트
const WATERMARK_TEXT = '미리보기 - 정식버전은 프로그램 구매 후 제공';

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ISO 주차 계산 (2026-W05 형식)
 * @param {Date} date
 * @returns {string}
 */
function getISOWeek(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${d.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
}

/**
 * 주차를 숫자로 변환 (202605 형식)
 * @param {string} isoWeek - '2026-W05'
 * @returns {number}
 */
function weekToNumber(isoWeek) {
  const [year, week] = isoWeek.split('-W');
  return parseInt(year + week, 10);
}

/**
 * 랜덤 토큰 생성
 * @param {number} bytes
 * @returns {string}
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

// ═══════════════════════════════════════════════════════════════════════════
// 자격 및 한도 확인
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 자격 요건 확인
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function checkQualification(subjectType, subjectId) {
  // trials 테이블에서 최근 7일 출석/액션 체크
  // send_log 테이블의 SENT 상태 기록을 기준으로 판단
  try {
    const result = await db.query(`
      SELECT
        t.id,
        t.last_day_sent,
        (SELECT COUNT(*) FROM send_log sl
         WHERE sl.trial_id = t.id
         AND sl.status = 'SENT'
         AND sl.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days') as attendance_7d,
        (SELECT COUNT(*) FROM send_log sl
         WHERE sl.trial_id = t.id
         AND sl.day > 0
         AND sl.status = 'SENT') as action_check
      FROM trials t
      WHERE t.id = $1::integer
    `, [subjectId]);

    if (result.rows.length === 0) {
      return {
        qualified: false,
        reason: 'TRIAL_NOT_FOUND',
        attendance_7d: 0,
        action_check: 0
      };
    }

    const { attendance_7d, action_check } = result.rows[0];
    const att = parseInt(attendance_7d, 10);
    const act = parseInt(action_check, 10);

    const qualified = att >= QUALIFICATION.minAttendance
      && act >= QUALIFICATION.minActionCheck;

    return {
      qualified,
      attendance_7d: att,
      action_check: act,
      required: QUALIFICATION,
      reason: qualified ? null : 'QUALIFICATION_NOT_MET'
    };
  } catch (error) {
    console.error('[Preview] Qualification check error:', error);
    return {
      qualified: false,
      reason: 'CHECK_ERROR',
      error: error.message
    };
  }
}

/**
 * 주간 한도 확인
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function checkWeeklyLimits(subjectType, subjectId) {
  const yearWeek = getISOWeek();
  const weekNumber = weekToNumber(yearWeek);

  // 1. 유저 주간 한도
  const userResult = await db.query(`
    SELECT COUNT(*) as count
    FROM preview_redemption
    WHERE subject_type = $1
      AND subject_id = $2
      AND created_week = $3
  `, [subjectType, subjectId, weekNumber]);

  const userCount = parseInt(userResult.rows[0].count, 10);
  if (userCount >= WEEKLY_USER_LIMIT) {
    return {
      allowed: false,
      reason: 'USER_WEEKLY_LIMIT',
      userCount,
      userLimit: WEEKLY_USER_LIMIT,
      globalUsed: null,
      globalLimit: WEEKLY_GLOBAL_LIMIT
    };
  }

  // 2. 글로벌 주간 한도
  const globalResult = await db.query(`
    SELECT quota_used FROM preview_weekly_quota WHERE year_week = $1
  `, [yearWeek]);

  const globalUsed = globalResult.rows[0]?.quota_used || 0;
  if (globalUsed >= WEEKLY_GLOBAL_LIMIT) {
    return {
      allowed: false,
      reason: 'GLOBAL_WEEKLY_LIMIT',
      userCount,
      userLimit: WEEKLY_USER_LIMIT,
      globalUsed,
      globalLimit: WEEKLY_GLOBAL_LIMIT
    };
  }

  return {
    allowed: true,
    userCount,
    userLimit: WEEKLY_USER_LIMIT,
    globalUsed,
    globalLimit: WEEKLY_GLOBAL_LIMIT,
    remaining: {
      user: WEEKLY_USER_LIMIT - userCount,
      global: WEEKLY_GLOBAL_LIMIT - globalUsed
    }
  };
}

/**
 * 교환 가능 여부 종합 확인
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function checkRedemptionEligibility(subjectType, subjectId) {
  // Feature flag 확인
  const enabled = await pointService.isFeatureEnabled('preview_redemption_enabled');
  if (!enabled) {
    return {
      eligible: false,
      reason: 'FEATURE_DISABLED',
      featureEnabled: false
    };
  }

  // 잔액 확인
  const balance = await pointService.getBalance(subjectType, subjectId);
  if (balance < PREVIEW_COST) {
    return {
      eligible: false,
      reason: 'INSUFFICIENT_BALANCE',
      balance,
      cost: PREVIEW_COST,
      featureEnabled: true
    };
  }

  // 자격 확인
  const qualification = await checkQualification(subjectType, subjectId);
  if (!qualification.qualified) {
    return {
      eligible: false,
      reason: qualification.reason,
      qualification,
      balance,
      cost: PREVIEW_COST,
      featureEnabled: true
    };
  }

  // 한도 확인
  const limits = await checkWeeklyLimits(subjectType, subjectId);
  if (!limits.allowed) {
    return {
      eligible: false,
      reason: limits.reason,
      limits,
      qualification,
      balance,
      cost: PREVIEW_COST,
      featureEnabled: true
    };
  }

  return {
    eligible: true,
    balance,
    cost: PREVIEW_COST,
    qualification,
    limits,
    featureEnabled: true
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Preview 교환
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Preview 교환 (메인 함수)
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function redeemPreview(subjectType, subjectId) {
  console.log(`[Preview] Redeem request: ${subjectType}:${subjectId}`);

  // 1. 종합 자격 확인
  const eligibility = await checkRedemptionEligibility(subjectType, subjectId);
  if (!eligibility.eligible) {
    console.log(`[Preview] Not eligible: ${eligibility.reason}`);
    return {
      success: false,
      error: eligibility.reason,
      ...eligibility
    };
  }

  // 2. 포인트 차감
  const spendResult = await pointService.spendPoints({
    subjectType,
    subjectId,
    eventType: pointService.EVENT_TYPES.SPEND_PREVIEW,
    amount: PREVIEW_COST,
    referenceType: 'preview',
    description: `Preview 교환 (${PREVIEW_COST}P)`
  });

  if (!spendResult.success) {
    console.error(`[Preview] Point spend failed:`, spendResult);
    return spendResult;
  }

  // 3. 토큰 및 만료시간 생성
  const previewToken = generateToken(32);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + LINK_EXPIRY_HOURS);

  const yearWeek = getISOWeek();
  const weekNumber = weekToNumber(yearWeek);

  // 4. preview_redemption 저장
  const insertResult = await db.query(`
    INSERT INTO preview_redemption
    (subject_type, subject_id, points_spent, ledger_id,
     preview_token, watermark_text, expires_at, created_week,
     qualification_snapshot, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'CREATED')
    RETURNING id, preview_token, expires_at
  `, [
    subjectType, subjectId, PREVIEW_COST, spendResult.ledgerId,
    previewToken, WATERMARK_TEXT, expiresAt, weekNumber,
    JSON.stringify(eligibility.qualification)
  ]);

  const redemption = insertResult.rows[0];

  // 5. 글로벌 주간 quota 업데이트
  await db.query(`
    INSERT INTO preview_weekly_quota (year_week, quota_used)
    VALUES ($1, 1)
    ON CONFLICT (year_week)
    DO UPDATE SET quota_used = preview_weekly_quota.quota_used + 1,
                  updated_at = CURRENT_TIMESTAMP
  `, [yearWeek]);

  console.log(`✅ [Preview] Redeemed: ${subjectType}:${subjectId}, token: ${previewToken.substring(0, 8)}...`);

  return {
    success: true,
    redemptionId: redemption.id,
    previewToken: redemption.preview_token,
    expiresAt: redemption.expires_at,
    newBalance: spendResult.balance,
    message: `Preview 교환 완료. 24시간 내 1회 다운로드 가능합니다.`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Preview 다운로드
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Preview 다운로드 (1회 제한)
 * @param {string} previewToken
 * @returns {Promise<object>}
 */
async function downloadPreview(previewToken) {
  console.log(`[Preview] Download request: ${previewToken.substring(0, 8)}...`);

  // 1. 토큰으로 조회
  const result = await db.query(`
    SELECT id, subject_type, subject_id,
           is_downloaded, downloaded_at, expires_at,
           preview_url, watermark_text, status
    FROM preview_redemption
    WHERE preview_token = $1
  `, [previewToken]);

  if (result.rows.length === 0) {
    console.log(`[Preview] Invalid token`);
    return {
      success: false,
      error: 'INVALID_TOKEN',
      message: '유효하지 않은 다운로드 링크입니다.'
    };
  }

  const redemption = result.rows[0];

  // 2. 만료 확인 (SSOT: 24h)
  if (new Date(redemption.expires_at) < new Date()) {
    console.log(`[Preview] Token expired`);

    // 상태 업데이트
    await db.query(`
      UPDATE preview_redemption SET status = 'EXPIRED' WHERE id = $1
    `, [redemption.id]);

    return {
      success: false,
      error: 'EXPIRED',
      message: '다운로드 링크가 만료되었습니다. (24시간 초과)',
      expiredAt: redemption.expires_at
    };
  }

  // 3. 이미 다운로드됨 (SSOT: 1회 제한, 재다운로드 불가)
  if (redemption.is_downloaded) {
    console.log(`[Preview] Already downloaded`);
    return {
      success: false,
      error: 'ALREADY_DOWNLOADED',
      message: '이미 다운로드된 파일입니다. 재다운로드는 불가능합니다.',
      downloadedAt: redemption.downloaded_at
    };
  }

  // 4. 다운로드 기록 (1회성 토큰 무효화)
  await db.query(`
    UPDATE preview_redemption
    SET is_downloaded = TRUE,
        downloaded_at = CURRENT_TIMESTAMP,
        status = 'DOWNLOADED'
    WHERE id = $1
  `, [redemption.id]);

  console.log(`📥 [Preview] Downloaded: ${previewToken.substring(0, 8)}...`);

  // 5. 파일 정보 반환 (실제 파일 생성은 별도 처리)
  return {
    success: true,
    previewUrl: redemption.preview_url || '/api/rewards/preview/generate/' + redemption.id,
    watermarkText: redemption.watermark_text,
    message: '다운로드가 완료되었습니다. 이 링크는 더 이상 사용할 수 없습니다.',
    specs: {
      pages: 1,
      resolution: 'low',
      watermark: true
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 상태 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 사용자의 Preview 교환 내역 조회
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function getRedemptionHistory(subjectType, subjectId) {
  const result = await db.query(`
    SELECT id, points_spent, preview_token,
           is_downloaded, downloaded_at, expires_at,
           status, created_at
    FROM preview_redemption
    WHERE subject_type = $1 AND subject_id = $2
    ORDER BY created_at DESC
    LIMIT 10
  `, [subjectType, subjectId]);

  return {
    history: result.rows.map(r => ({
      ...r,
      // 토큰은 마스킹
      preview_token: r.preview_token ? r.preview_token.substring(0, 8) + '...' : null
    }))
  };
}

/**
 * 주간 쿼터 현황 조회
 * @returns {Promise<object>}
 */
async function getWeeklyQuotaStatus() {
  const yearWeek = getISOWeek();

  const result = await db.query(`
    SELECT year_week, quota_used, quota_limit, updated_at
    FROM preview_weekly_quota
    WHERE year_week = $1
  `, [yearWeek]);

  const quota = result.rows[0] || {
    year_week: yearWeek,
    quota_used: 0,
    quota_limit: WEEKLY_GLOBAL_LIMIT
  };

  return {
    currentWeek: yearWeek,
    used: quota.quota_used,
    limit: quota.quota_limit,
    remaining: quota.quota_limit - quota.quota_used,
    updatedAt: quota.updated_at
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Constants
  PREVIEW_COST,
  WEEKLY_USER_LIMIT,
  WEEKLY_GLOBAL_LIMIT,
  LINK_EXPIRY_HOURS,
  QUALIFICATION,
  WATERMARK_TEXT,

  // Helpers
  getISOWeek,
  generateToken,

  // Checks
  checkQualification,
  checkWeeklyLimits,
  checkRedemptionEligibility,

  // Operations
  redeemPreview,
  downloadPreview,

  // Status
  getRedemptionHistory,
  getWeeklyQuotaStatus
};
