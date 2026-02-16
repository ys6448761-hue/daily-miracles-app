/**
 * pointService.js
 * 포인트 시스템 비즈니스 로직
 *
 * SSOT 하드가드:
 * - 일일 상한: 100P (출석 50P + 실행 30P + 기록 20P)
 * - 만료: 90일 (생성 시점 기준)
 * - 잔액: 원장 합산 (is_expired=FALSE인 것만)
 *
 * @version 1.0
 * @spec Aurora5 Code 작업지시서 v2.6
 */

const db = require('../database/db');
const { getKSTDateString } = require('../utils/kstDate');

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의 (SSOT - 변경 시 feature_flags.config도 동기화)
// ═══════════════════════════════════════════════════════════════════════════

const DAILY_CAPS = {
  checkin: 50,   // 출석
  action: 30,    // 실행체크
  log: 20        // 기록
};

const TOTAL_DAILY_CAP = 100;  // 일일 총 상한
const POINT_EXPIRY_DAYS = 90;  // 만료일

const EVENT_TYPES = {
  EARN_CHECKIN: 'POINT_EARN_CHECKIN',
  EARN_ACTION: 'POINT_EARN_ACTION',
  EARN_LOG: 'POINT_EARN_LOG',
  EARN_REF_INVITEE: 'POINT_EARN_REF_INVITEE',  // 피추천인 보너스
  EARN_REF_INVITER: 'POINT_EARN_REF_INVITER',  // 추천인 베스팅 보상
  SPEND_PREVIEW: 'POINT_SPEND_PREVIEW',
  EXPIRE: 'POINT_EXPIRE',
  REVOKE: 'POINT_REVOKE'
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Feature flag 확인
 * @param {string} flagKey
 * @returns {Promise<boolean>}
 */
async function isFeatureEnabled(flagKey) {
  try {
    const result = await db.query(
      `SELECT is_enabled FROM feature_flags WHERE flag_key = $1`,
      [flagKey]
    );
    return result.rows[0]?.is_enabled ?? false;
  } catch (error) {
    console.error(`[Point] Feature flag check error:`, error.message);
    return false;
  }
}

/**
 * Feature flag 설정 조회
 * @param {string} flagKey
 * @returns {Promise<object|null>}
 */
async function getFeatureConfig(flagKey) {
  try {
    const result = await db.query(
      `SELECT config FROM feature_flags WHERE flag_key = $1`,
      [flagKey]
    );
    return result.rows[0]?.config ?? null;
  } catch (error) {
    console.error(`[Point] Feature config error:`, error.message);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 잔액 및 현황 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 현재 잔액 조회 (원장 기반, 만료 제외)
 * @param {string} subjectType - 'trial' | 'user'
 * @param {string} subjectId
 * @returns {Promise<number>}
 */
async function getBalance(subjectType, subjectId) {
  const result = await db.query(`
    SELECT COALESCE(SUM(amount), 0) as balance
    FROM point_ledger
    WHERE subject_type = $1
      AND subject_id = $2
      AND (is_expired = FALSE OR is_expired IS NULL)
  `, [subjectType, subjectId]);

  return parseInt(result.rows[0].balance, 10);
}

/**
 * 사용 가능한 잔액 조회 (만료 임박 제외 옵션)
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<number>}
 */
async function getAvailableBalance(subjectType, subjectId) {
  const result = await db.query(`
    SELECT COALESCE(SUM(amount), 0) as balance
    FROM point_ledger
    WHERE subject_type = $1
      AND subject_id = $2
      AND (is_expired = FALSE OR is_expired IS NULL)
      AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
  `, [subjectType, subjectId]);

  return parseInt(result.rows[0].balance, 10);
}

/**
 * 일일 적립 현황 조회
 * @param {string} subjectType
 * @param {string} subjectId
 * @param {string|null} date - YYYY-MM-DD 형식 (기본: 오늘)
 * @returns {Promise<object>}
 */
async function getDailyEarnings(subjectType, subjectId, date = null) {
  const targetDate = date || getKSTDateString();

  const result = await db.query(`
    SELECT
      COALESCE(checkin_earned, 0) as checkin_earned,
      COALESCE(action_earned, 0) as action_earned,
      COALESCE(log_earned, 0) as log_earned
    FROM point_daily_cap
    WHERE subject_type = $1 AND subject_id = $2 AND cap_date = $3
  `, [subjectType, subjectId, targetDate]);

  if (result.rows.length === 0) {
    return { checkin_earned: 0, action_earned: 0, log_earned: 0 };
  }

  return {
    checkin_earned: parseInt(result.rows[0].checkin_earned, 10),
    action_earned: parseInt(result.rows[0].action_earned, 10),
    log_earned: parseInt(result.rows[0].log_earned, 10)
  };
}

/**
 * 일일 총 적립량 조회
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<number>}
 */
async function getTodayTotalEarned(subjectType, subjectId) {
  const daily = await getDailyEarnings(subjectType, subjectId);
  return daily.checkin_earned + daily.action_earned + daily.log_earned;
}

// ═══════════════════════════════════════════════════════════════════════════
// 포인트 적립
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 포인트 적립
 * @param {object} params
 * @param {string} params.subjectType - 'trial' | 'user'
 * @param {string} params.subjectId
 * @param {string} params.eventType - EVENT_TYPES 중 하나
 * @param {number} params.amount - 적립 포인트 (양수)
 * @param {string} params.category - 'checkin' | 'action' | 'log' | null (referral은 null)
 * @param {string} params.referenceType - 참조 타입
 * @param {string} params.referenceId - 참조 ID
 * @param {string} params.description - 설명
 * @returns {Promise<object>}
 */
async function earnPoints({
  subjectType,
  subjectId,
  eventType,
  amount,
  category = null,
  referenceType = null,
  referenceId = null,
  description = null
}) {
  // 1. Feature flag 확인
  if (!(await isFeatureEnabled('points_enabled'))) {
    console.log('[Point] Feature disabled - points_enabled=false');
    return { success: false, error: 'FEATURE_DISABLED' };
  }

  // 2. 입력 검증
  if (!subjectType || !subjectId || !eventType || !amount || amount <= 0) {
    return { success: false, error: 'INVALID_INPUT' };
  }

  // 3. 일일 한도 확인 (referral은 한도 없음)
  let adjustedAmount = amount;

  if (category && DAILY_CAPS[category]) {
    const daily = await getDailyEarnings(subjectType, subjectId);
    const categoryEarned = daily[`${category}_earned`] || 0;
    const categoryCap = DAILY_CAPS[category];

    // 카테고리별 한도 초과 확인
    if (categoryEarned >= categoryCap) {
      console.log(`[Point] Daily cap reached: ${category} ${categoryEarned}/${categoryCap}`);
      return {
        success: false,
        error: 'DAILY_CAP_REACHED',
        category,
        current: categoryEarned,
        cap: categoryCap
      };
    }

    // 한도 내로 조정
    const allowedForCategory = categoryCap - categoryEarned;
    if (amount > allowedForCategory) {
      console.log(`[Point] Amount adjusted: ${amount} → ${allowedForCategory} (category cap)`);
      adjustedAmount = allowedForCategory;
    }

    // 일일 총 한도 확인
    const todayTotal = await getTodayTotalEarned(subjectType, subjectId);
    const allowedForTotal = TOTAL_DAILY_CAP - todayTotal;
    if (adjustedAmount > allowedForTotal) {
      if (allowedForTotal <= 0) {
        console.log(`[Point] Daily total cap reached: ${todayTotal}/${TOTAL_DAILY_CAP}`);
        return {
          success: false,
          error: 'DAILY_TOTAL_CAP_REACHED',
          current: todayTotal,
          cap: TOTAL_DAILY_CAP
        };
      }
      console.log(`[Point] Amount adjusted: ${adjustedAmount} → ${allowedForTotal} (total cap)`);
      adjustedAmount = allowedForTotal;
    }
  }

  // 4. 현재 잔액 조회
  const currentBalance = await getBalance(subjectType, subjectId);
  const newBalance = currentBalance + adjustedAmount;

  // 5. 만료일 계산 (90일 후)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + POINT_EXPIRY_DAYS);

  // 6. 원장에 기록
  const result = await db.query(`
    INSERT INTO point_ledger
    (subject_type, subject_id, event_type, amount, balance_after,
     reference_type, reference_id, description, expires_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `, [
    subjectType, subjectId, eventType, adjustedAmount, newBalance,
    referenceType, referenceId, description, expiresAt
  ]);

  const ledgerId = result.rows[0].id;

  // 7. 일일 적립 기록 업데이트 (category가 있을 때만)
  if (category && DAILY_CAPS[category]) {
    const kstToday = getKSTDateString();
    await db.query(`
      INSERT INTO point_daily_cap (subject_type, subject_id, cap_date, ${category}_earned)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (subject_type, subject_id, cap_date)
      DO UPDATE SET ${category}_earned = point_daily_cap.${category}_earned + $4
    `, [subjectType, subjectId, kstToday, adjustedAmount]);
  }

  console.log(`✅ [Point] Earned: ${subjectType}:${subjectId} +${adjustedAmount}P (${eventType}), balance: ${newBalance}P`);

  return {
    success: true,
    ledgerId,
    amount: adjustedAmount,
    originalAmount: amount,
    balance: newBalance,
    expiresAt: expiresAt.toISOString()
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 포인트 차감
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 포인트 차감 (사용)
 * @param {object} params
 * @param {string} params.subjectType
 * @param {string} params.subjectId
 * @param {string} params.eventType
 * @param {number} params.amount - 차감할 포인트 (양수로 입력)
 * @param {string} params.referenceType
 * @param {string} params.referenceId
 * @param {string} params.description
 * @returns {Promise<object>}
 */
async function spendPoints({
  subjectType,
  subjectId,
  eventType,
  amount,
  referenceType = null,
  referenceId = null,
  description = null
}) {
  // 1. Feature flag 확인
  if (!(await isFeatureEnabled('points_enabled'))) {
    return { success: false, error: 'FEATURE_DISABLED' };
  }

  // 2. 입력 검증
  if (!subjectType || !subjectId || !eventType || !amount || amount <= 0) {
    return { success: false, error: 'INVALID_INPUT' };
  }

  // 3. 잔액 확인
  const currentBalance = await getAvailableBalance(subjectType, subjectId);
  if (currentBalance < amount) {
    console.log(`[Point] Insufficient balance: ${currentBalance} < ${amount}`);
    return {
      success: false,
      error: 'INSUFFICIENT_BALANCE',
      balance: currentBalance,
      required: amount
    };
  }

  // 4. 새 잔액 계산
  const newBalance = currentBalance - amount;

  // 5. 원장에 기록 (음수 금액)
  const result = await db.query(`
    INSERT INTO point_ledger
    (subject_type, subject_id, event_type, amount, balance_after,
     reference_type, reference_id, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    subjectType, subjectId, eventType, -amount, newBalance,
    referenceType, referenceId, description
  ]);

  const ledgerId = result.rows[0].id;

  console.log(`💳 [Point] Spent: ${subjectType}:${subjectId} -${amount}P (${eventType}), balance: ${newBalance}P`);

  return {
    success: true,
    ledgerId,
    amount: -amount,
    balance: newBalance
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 포인트 만료 처리 (배치)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 만료된 포인트 처리 (매일 배치로 실행)
 * @returns {Promise<object>}
 */
async function expirePoints() {
  console.log('[Point] Running expiration batch...');

  // 만료 대상 조회 및 처리
  const result = await db.query(`
    UPDATE point_ledger
    SET is_expired = TRUE
    WHERE expires_at < CURRENT_TIMESTAMP
      AND is_expired = FALSE
      AND amount > 0
    RETURNING id, subject_type, subject_id, amount
  `);

  const expiredEntries = result.rows;
  const expiredCount = expiredEntries.length;
  const totalExpired = expiredEntries.reduce((sum, r) => sum + r.amount, 0);

  // 통계 로그
  if (expiredCount > 0) {
    console.log(`⏰ [Point] Expired: ${expiredCount} entries, total ${totalExpired}P`);

    // 영향받은 사용자별 집계
    const bySubject = {};
    for (const entry of expiredEntries) {
      const key = `${entry.subject_type}:${entry.subject_id}`;
      bySubject[key] = (bySubject[key] || 0) + entry.amount;
    }
    console.log(`   Affected subjects: ${Object.keys(bySubject).length}`);
  } else {
    console.log(`⏰ [Point] No points expired today`);
  }

  return {
    expiredCount,
    totalExpired,
    entries: expiredEntries
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 포인트 회수 (관리자용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 포인트 회수 (어뷰징 등)
 * @param {object} params
 * @param {number} params.ledgerId - 회수할 원장 ID
 * @param {string} params.reason - 회수 사유
 * @param {string} params.adminId - 관리자 ID
 * @returns {Promise<object>}
 */
async function revokePoints({ ledgerId, reason, adminId }) {
  // 원본 조회
  const original = await db.query(`
    SELECT * FROM point_ledger WHERE id = $1
  `, [ledgerId]);

  if (original.rows.length === 0) {
    return { success: false, error: 'LEDGER_NOT_FOUND' };
  }

  const entry = original.rows[0];

  if (entry.amount <= 0) {
    return { success: false, error: 'CANNOT_REVOKE_NEGATIVE' };
  }

  if (entry.is_expired) {
    return { success: false, error: 'ALREADY_EXPIRED' };
  }

  // 회수 처리 (원본 is_expired 처리)
  await db.query(`
    UPDATE point_ledger SET is_expired = TRUE WHERE id = $1
  `, [ledgerId]);

  // 회수 로그 기록
  const currentBalance = await getBalance(entry.subject_type, entry.subject_id);

  await db.query(`
    INSERT INTO point_ledger
    (subject_type, subject_id, event_type, amount, balance_after,
     reference_type, reference_id, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    entry.subject_type, entry.subject_id, EVENT_TYPES.REVOKE,
    -entry.amount, currentBalance,
    'revoke', ledgerId.toString(),
    `회수: ${reason} (by ${adminId})`
  ]);

  console.log(`🚫 [Point] Revoked: ledger#${ledgerId} -${entry.amount}P (${reason})`);

  return {
    success: true,
    revokedAmount: entry.amount,
    newBalance: currentBalance
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 포인트 내역 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 포인트 내역 조회
 * @param {string} subjectType
 * @param {string} subjectId
 * @param {object} options
 * @param {number} options.limit
 * @param {number} options.offset
 * @param {string} options.eventType - 특정 이벤트 타입 필터
 * @returns {Promise<object>}
 */
async function getHistory(subjectType, subjectId, options = {}) {
  const { limit = 50, offset = 0, eventType = null } = options;

  let query = `
    SELECT id, event_type, amount, balance_after,
           reference_type, reference_id, description,
           expires_at, is_expired, created_at
    FROM point_ledger
    WHERE subject_type = $1 AND subject_id = $2
  `;
  const params = [subjectType, subjectId];
  let paramIndex = 3;

  if (eventType) {
    query += ` AND event_type = $${paramIndex++}`;
    params.push(eventType);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  // 총 개수 조회
  let countQuery = `
    SELECT COUNT(*) as total
    FROM point_ledger
    WHERE subject_type = $1 AND subject_id = $2
  `;
  const countParams = [subjectType, subjectId];

  if (eventType) {
    countQuery += ` AND event_type = $3`;
    countParams.push(eventType);
  }

  const countResult = await db.query(countQuery, countParams);

  return {
    history: result.rows,
    total: parseInt(countResult.rows[0].total, 10),
    limit,
    offset
  };
}

/**
 * 포인트 요약 조회
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function getSummary(subjectType, subjectId) {
  const balance = await getBalance(subjectType, subjectId);
  const daily = await getDailyEarnings(subjectType, subjectId);

  // 총 적립/사용 통계
  const stats = await db.query(`
    SELECT
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_earned,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
      SUM(CASE WHEN is_expired = TRUE AND amount > 0 THEN amount ELSE 0 END) as total_expired
    FROM point_ledger
    WHERE subject_type = $1 AND subject_id = $2
  `, [subjectType, subjectId]);

  const stat = stats.rows[0];

  return {
    balance,
    dailyEarnings: {
      checkin: { earned: daily.checkin_earned, cap: DAILY_CAPS.checkin },
      action: { earned: daily.action_earned, cap: DAILY_CAPS.action },
      log: { earned: daily.log_earned, cap: DAILY_CAPS.log },
      total: {
        earned: daily.checkin_earned + daily.action_earned + daily.log_earned,
        cap: TOTAL_DAILY_CAP
      }
    },
    lifetime: {
      totalEarned: parseInt(stat.total_earned || 0, 10),
      totalSpent: parseInt(stat.total_spent || 0, 10),
      totalExpired: parseInt(stat.total_expired || 0, 10)
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Constants
  EVENT_TYPES,
  DAILY_CAPS,
  TOTAL_DAILY_CAP,
  POINT_EXPIRY_DAYS,

  // Feature flags
  isFeatureEnabled,
  getFeatureConfig,

  // Balance & Status
  getBalance,
  getAvailableBalance,
  getDailyEarnings,
  getTodayTotalEarned,
  getSummary,

  // Operations
  earnPoints,
  spendPoints,
  expirePoints,
  revokePoints,

  // History
  getHistory
};
