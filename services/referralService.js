/**
 * referralService.js
 * 친구추천 시스템 비즈니스 로직
 *
 * SSOT 하드가드:
 * - B(피추천인): 코드 적용 시 300P 즉시 지급
 * - A(추천인): B가 QUALIFIED 달성 시 300P 베스팅 지급
 * - QUALIFIED: 가입 후 7일 내 출석≥2, 실행체크≥1
 * - A 월 5명까지 보상 인정
 * - 어뷰징(동일 기기/IP) → 자동 HOLD
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

const INVITEE_BONUS = 300;      // B(피추천인) 즉시 지급
const INVITER_BONUS = 300;      // A(추천인) 베스팅 후 지급
const MONTHLY_LIMIT = 5;        // A 월간 최대 보상

// B 자격 요건 (QUALIFIED)
const QUALIFICATION = {
  maxDays: 7,           // 가입 후 N일 이내
  minAttendance: 2,     // 최소 출석 횟수
  minActionCheck: 1     // 최소 실행체크 횟수
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA256 해시 생성 (개인정보 보호)
 * @param {string} value
 * @returns {string|null}
 */
function createHash(value) {
  if (!value) return null;
  return crypto.createHash('sha256').update(value.toString()).digest('hex').substring(0, 64);
}

/**
 * 현재 월 문자열 (2026-02)
 * @returns {string}
 */
function getCurrentYearMonth() {
  return new Date().toISOString().substring(0, 7);
}

// ═══════════════════════════════════════════════════════════════════════════
// 추천 코드 적용
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 추천 코드 적용 (B가 코드 입력 시)
 * @param {string} inviteeTrialId - B의 trial ID
 * @param {string} refCode - 추천 코드 (REF-XXXXX)
 * @param {object} metadata - { deviceId, ipAddress }
 * @returns {Promise<object>}
 */
async function applyReferralCode(inviteeTrialId, refCode, metadata = {}) {
  console.log(`[Referral] Apply: invitee=${inviteeTrialId}, code=${refCode}`);

  // 1. Feature flag 확인
  if (!(await pointService.isFeatureEnabled('referral_enabled'))) {
    return { success: false, error: 'FEATURE_DISABLED' };
  }

  // 2. 추천 코드로 추천인(A) 조회
  const inviterResult = await db.query(`
    SELECT id, phone, ref_code FROM trials WHERE ref_code = $1 AND active = TRUE
  `, [refCode]);

  if (inviterResult.rows.length === 0) {
    console.log(`[Referral] Invalid code: ${refCode}`);
    return {
      success: false,
      error: 'INVALID_REF_CODE',
      message: '유효하지 않은 추천 코드입니다.'
    };
  }

  const inviter = inviterResult.rows[0];

  // 3. 자기 자신 추천 방지
  if (inviter.id.toString() === inviteeTrialId.toString()) {
    return {
      success: false,
      error: 'SELF_REFERRAL',
      message: '자기 자신을 추천할 수 없습니다.'
    };
  }

  // 4. 이미 적용된 추천 확인 (B는 1회만)
  const existingResult = await db.query(`
    SELECT id FROM referral WHERE invitee_type = 'trial' AND invitee_id = $1
  `, [inviteeTrialId]);

  if (existingResult.rows.length > 0) {
    return {
      success: false,
      error: 'ALREADY_REFERRED',
      message: '이미 추천 코드가 적용되어 있습니다.'
    };
  }

  // 5. 어뷰징 감지 (동일 기기/IP)
  const deviceHash = createHash(metadata.deviceId);
  const ipHash = createHash(metadata.ipAddress);

  let abuseFlags = {};
  let status = 'PENDING';
  let holdReason = null;

  if (deviceHash || ipHash) {
    // 동일 추천인에게서 같은 기기/IP로 추천받은 기록 확인
    const abuseCheck = await db.query(`
      SELECT id, device_hash, ip_hash FROM referral
      WHERE inviter_type = 'trial' AND inviter_id = $1
        AND (device_hash = $2 OR ip_hash = $3)
        AND status NOT IN ('REJECTED')
    `, [inviter.id, deviceHash, ipHash]);

    if (abuseCheck.rows.length > 0) {
      abuseFlags = {
        same_device: deviceHash && abuseCheck.rows.some(r => r.device_hash === deviceHash),
        same_ip: ipHash && abuseCheck.rows.some(r => r.ip_hash === ipHash),
        existing_referral_id: abuseCheck.rows[0].id
      };
      status = 'HOLD';
      holdReason = '동일 기기/IP에서 중복 추천 감지';
      console.log(`⚠️ [Referral] Abuse detected: ${JSON.stringify(abuseFlags)}`);
    }
  }

  // 6. referral 레코드 생성
  const insertResult = await db.query(`
    INSERT INTO referral
    (inviter_type, inviter_id, inviter_ref_code, invitee_type, invitee_id,
     status, device_hash, ip_hash, abuse_flags, hold_reason)
    VALUES ('trial', $1, $2, 'trial', $3, $4, $5, $6, $7, $8)
    RETURNING id
  `, [
    inviter.id, refCode, inviteeTrialId, status,
    deviceHash, ipHash, JSON.stringify(abuseFlags), holdReason
  ]);

  const referralId = insertResult.rows[0].id;

  // 7. trials.referred_by 업데이트
  await db.query(`
    UPDATE trials SET referred_by = $1 WHERE id = $2
  `, [refCode, inviteeTrialId]);

  // 8. B에게 즉시 포인트 지급 (HOLD 아닐 때만)
  let inviteePointsResult = null;

  if (status !== 'HOLD') {
    inviteePointsResult = await pointService.earnPoints({
      subjectType: 'trial',
      subjectId: inviteeTrialId.toString(),
      eventType: pointService.EVENT_TYPES.EARN_REF_INVITEE,
      amount: INVITEE_BONUS,
      category: null,  // referral은 일일 한도 없음
      referenceType: 'referral',
      referenceId: referralId.toString(),
      description: `추천 코드 적용 보너스 (${refCode})`
    });

    // ledger_id 저장
    if (inviteePointsResult.success) {
      await db.query(`
        UPDATE referral
        SET invitee_points_granted = $1, invitee_ledger_id = $2
        WHERE id = $3
      `, [INVITEE_BONUS, inviteePointsResult.ledgerId, referralId]);
    }
  }

  // 9. HOLD인 경우 admin_hold_queue에 추가
  if (status === 'HOLD') {
    await db.query(`
      INSERT INTO admin_hold_queue
      (hold_type, reference_table, reference_id, reason, severity)
      VALUES ('REFERRAL_ABUSE', 'referral', $1, $2, 'HIGH')
    `, [referralId.toString(), holdReason]);

    console.log(`🚨 [Referral] Added to hold queue: referral#${referralId}`);
  }

  console.log(`${status === 'HOLD' ? '⚠️' : '✅'} [Referral] Applied: ${refCode} → trial:${inviteeTrialId}, status: ${status}`);

  return {
    success: true,
    referralId,
    status,
    inviteeBonus: status !== 'HOLD' ? INVITEE_BONUS : 0,
    inviteeBalance: inviteePointsResult?.balance || null,
    isHold: status === 'HOLD',
    message: status === 'HOLD'
      ? '추천 코드가 적용되었으나, 검토가 필요합니다.'
      : `추천 코드가 적용되어 ${INVITEE_BONUS}P가 지급되었습니다.`
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 자격 확인 및 추천인 보상
// ═══════════════════════════════════════════════════════════════════════════

/**
 * B의 자격 달성 여부 확인
 * @param {string} inviteeTrialId
 * @returns {Promise<object>}
 */
async function checkInviteeQualification(inviteeTrialId) {
  const result = await db.query(`
    SELECT
      t.id,
      t.last_day_sent,
      t.start_at,
      EXTRACT(DAY FROM (CURRENT_TIMESTAMP - t.start_at)) as days_since_start,
      (SELECT COUNT(*) FROM send_log sl
       WHERE sl.trial_id = t.id AND sl.status = 'SENT') as attendance,
      (SELECT COUNT(*) FROM send_log sl
       WHERE sl.trial_id = t.id AND sl.day > 0 AND sl.status = 'SENT') as action_check
    FROM trials t
    WHERE t.id = $1::integer
  `, [inviteeTrialId]);

  if (result.rows.length === 0) {
    return { qualified: false, reason: 'TRIAL_NOT_FOUND' };
  }

  const row = result.rows[0];
  const daysSinceStart = parseInt(row.days_since_start, 10);
  const attendance = parseInt(row.attendance, 10);
  const actionCheck = parseInt(row.action_check, 10);

  // 7일 초과 시 자격 영구 미달
  if (daysSinceStart > QUALIFICATION.maxDays) {
    return {
      qualified: false,
      reason: 'EXPIRED',
      current: { days: daysSinceStart, attendance, actionCheck },
      required: QUALIFICATION
    };
  }

  const qualified = attendance >= QUALIFICATION.minAttendance
    && actionCheck >= QUALIFICATION.minActionCheck;

  return {
    qualified,
    current: { days: daysSinceStart, attendance, actionCheck },
    required: QUALIFICATION,
    reason: qualified ? null : 'NOT_QUALIFIED_YET'
  };
}

/**
 * B 자격 달성 시 A 보상 지급 (단일 referral)
 * @param {string} inviteeTrialId
 * @returns {Promise<object>}
 */
async function grantInviterReward(inviteeTrialId) {
  console.log(`[Referral] Check qualification: invitee=${inviteeTrialId}`);

  // 1. PENDING 상태의 referral 조회
  const refResult = await db.query(`
    SELECT r.id, r.inviter_type, r.inviter_id, r.inviter_ref_code, r.status
    FROM referral r
    WHERE r.invitee_type = 'trial' AND r.invitee_id = $1 AND r.status = 'PENDING'
  `, [inviteeTrialId]);

  if (refResult.rows.length === 0) {
    return { success: false, error: 'NO_PENDING_REFERRAL' };
  }

  const referral = refResult.rows[0];

  // 2. B의 자격 요건 확인
  const qualification = await checkInviteeQualification(inviteeTrialId);

  if (!qualification.qualified) {
    return {
      success: false,
      error: qualification.reason,
      qualification
    };
  }

  // 3. A의 월간 한도 확인
  const yearMonth = getCurrentYearMonth();
  const quotaResult = await db.query(`
    SELECT rewards_granted FROM referral_monthly_quota
    WHERE inviter_type = $1 AND inviter_id = $2 AND year_month = $3
  `, [referral.inviter_type, referral.inviter_id, yearMonth]);

  const currentRewards = quotaResult.rows[0]?.rewards_granted || 0;
  if (currentRewards >= MONTHLY_LIMIT) {
    console.log(`[Referral] Monthly limit reached for inviter ${referral.inviter_id}: ${currentRewards}/${MONTHLY_LIMIT}`);

    // 상태만 업데이트 (보상 없이)
    await db.query(`
      UPDATE referral
      SET status = 'QUALIFIED', qualified_at = CURRENT_TIMESTAMP,
          qualification_snapshot = $1
      WHERE id = $2
    `, [JSON.stringify(qualification.current), referral.id]);

    return {
      success: false,
      error: 'INVITER_MONTHLY_LIMIT',
      current: currentRewards,
      limit: MONTHLY_LIMIT
    };
  }

  // 4. A에게 포인트 지급
  const inviterPointsResult = await pointService.earnPoints({
    subjectType: referral.inviter_type,
    subjectId: referral.inviter_id.toString(),
    eventType: pointService.EVENT_TYPES.EARN_REF_INVITER,
    amount: INVITER_BONUS,
    category: null,
    referenceType: 'referral',
    referenceId: referral.id.toString(),
    description: `추천 보상 - 피추천인 자격 달성`
  });

  if (!inviterPointsResult.success) {
    console.error(`[Referral] Inviter point grant failed:`, inviterPointsResult);
    return inviterPointsResult;
  }

  // 5. referral 상태 업데이트
  await db.query(`
    UPDATE referral
    SET status = 'REWARDED',
        qualified_at = CURRENT_TIMESTAMP,
        qualification_snapshot = $1,
        inviter_points_granted = $2,
        inviter_ledger_id = $3
    WHERE id = $4
  `, [
    JSON.stringify(qualification.current),
    INVITER_BONUS,
    inviterPointsResult.ledgerId,
    referral.id
  ]);

  // 6. 월간 quota 업데이트
  await db.query(`
    INSERT INTO referral_monthly_quota (inviter_type, inviter_id, year_month, rewards_granted)
    VALUES ($1, $2, $3, 1)
    ON CONFLICT (inviter_type, inviter_id, year_month)
    DO UPDATE SET rewards_granted = referral_monthly_quota.rewards_granted + 1
  `, [referral.inviter_type, referral.inviter_id, yearMonth]);

  console.log(`🎉 [Referral] Rewarded: inviter ${referral.inviter_id} +${INVITER_BONUS}P`);

  return {
    success: true,
    referralId: referral.id,
    inviterBonus: INVITER_BONUS,
    inviterBalance: inviterPointsResult.balance
  };
}

/**
 * 배치: 모든 PENDING referral 자격 확인
 * @returns {Promise<object>}
 */
async function checkAllPendingReferrals() {
  console.log('[Referral] Checking all pending referrals...');

  const stats = { checked: 0, rewarded: 0, expired: 0, pending: 0, failed: 0 };

  // PENDING 상태의 referral 조회 (7일 지난 것도 포함)
  const pendingResult = await db.query(`
    SELECT r.id, r.invitee_id, r.inviter_id, t.start_at,
           EXTRACT(DAY FROM (CURRENT_TIMESTAMP - t.start_at)) as days_since_start
    FROM referral r
    JOIN trials t ON t.id = r.invitee_id::integer
    WHERE r.status = 'PENDING'
    ORDER BY r.created_at ASC
  `);

  stats.checked = pendingResult.rows.length;

  for (const ref of pendingResult.rows) {
    try {
      // 7일 초과 시 EXPIRED 처리
      if (ref.days_since_start > QUALIFICATION.maxDays) {
        await db.query(`
          UPDATE referral SET status = 'EXPIRED' WHERE id = $1
        `, [ref.id]);
        stats.expired++;
        continue;
      }

      // 자격 확인 및 보상 지급 시도
      const result = await grantInviterReward(ref.invitee_id);

      if (result.success) {
        stats.rewarded++;
      } else if (result.error === 'NOT_QUALIFIED_YET') {
        stats.pending++;
      } else {
        stats.failed++;
      }
    } catch (error) {
      console.error(`[Referral] Error for referral ${ref.id}:`, error.message);
      stats.failed++;
    }
  }

  console.log(`[Referral] Batch result: checked=${stats.checked}, rewarded=${stats.rewarded}, expired=${stats.expired}, pending=${stats.pending}, failed=${stats.failed}`);

  return stats;
}

// ═══════════════════════════════════════════════════════════════════════════
// 상태 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 추천 현황 조회 (내가 추천한/받은)
 * @param {string} subjectType
 * @param {string} subjectId
 * @returns {Promise<object>}
 */
async function getReferralStatus(subjectType, subjectId) {
  // 내가 추천한 사람들 (as inviter)
  const asInviter = await db.query(`
    SELECT id, invitee_id, status, inviter_points_granted, created_at, qualified_at
    FROM referral
    WHERE inviter_type = $1 AND inviter_id = $2
    ORDER BY created_at DESC
  `, [subjectType, subjectId]);

  // 나를 추천한 사람 (as invitee)
  const asInvitee = await db.query(`
    SELECT id, inviter_ref_code, status, invitee_points_granted, created_at
    FROM referral
    WHERE invitee_type = $1 AND invitee_id = $2
  `, [subjectType, subjectId]);

  // 내 추천 코드
  const myCodeResult = await db.query(`
    SELECT ref_code FROM trials WHERE id = $1::integer
  `, [subjectId]);

  // 이번 달 보상 현황
  const yearMonth = getCurrentYearMonth();
  const monthlyQuota = await db.query(`
    SELECT rewards_granted FROM referral_monthly_quota
    WHERE inviter_type = $1 AND inviter_id = $2 AND year_month = $3
  `, [subjectType, subjectId, yearMonth]);

  const rewardsThisMonth = monthlyQuota.rows[0]?.rewards_granted || 0;

  return {
    myRefCode: myCodeResult.rows[0]?.ref_code || null,
    invited: asInviter.rows,
    invitedCount: asInviter.rows.length,
    invitedBy: asInvitee.rows[0] || null,
    totalRewardsEarned: asInviter.rows.reduce((sum, r) => sum + (r.inviter_points_granted || 0), 0),
    monthlyStats: {
      yearMonth,
      rewardsGranted: rewardsThisMonth,
      limit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - rewardsThisMonth)
    }
  };
}

/**
 * 내 추천 코드 조회/생성
 * @param {string} trialId
 * @returns {Promise<object>}
 */
async function getMyRefCode(trialId) {
  const result = await db.query(`
    SELECT ref_code FROM trials WHERE id = $1::integer
  `, [trialId]);

  if (result.rows.length === 0) {
    return { success: false, error: 'TRIAL_NOT_FOUND' };
  }

  return {
    success: true,
    refCode: result.rows[0].ref_code
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// HOLD 관리 (Admin)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * HOLD된 referral 승인
 * @param {number} referralId
 * @param {string} adminId
 * @returns {Promise<object>}
 */
async function approveHoldReferral(referralId, adminId) {
  // referral 조회
  const refResult = await db.query(`
    SELECT * FROM referral WHERE id = $1 AND status = 'HOLD'
  `, [referralId]);

  if (refResult.rows.length === 0) {
    return { success: false, error: 'NOT_FOUND_OR_NOT_HOLD' };
  }

  const referral = refResult.rows[0];

  // B에게 포인트 지급 (이전에 지급 안 됐으면)
  if (!referral.invitee_points_granted) {
    const inviteePointsResult = await pointService.earnPoints({
      subjectType: referral.invitee_type,
      subjectId: referral.invitee_id,
      eventType: pointService.EVENT_TYPES.EARN_REF_INVITEE,
      amount: INVITEE_BONUS,
      category: null,
      referenceType: 'referral',
      referenceId: referralId.toString(),
      description: `추천 코드 적용 보너스 (HOLD 승인)`
    });

    if (inviteePointsResult.success) {
      await db.query(`
        UPDATE referral
        SET invitee_points_granted = $1, invitee_ledger_id = $2
        WHERE id = $3
      `, [INVITEE_BONUS, inviteePointsResult.ledgerId, referralId]);
    }
  }

  // 상태를 PENDING으로 변경 (자격 달성 대기)
  await db.query(`
    UPDATE referral SET status = 'PENDING', hold_reason = NULL WHERE id = $1
  `, [referralId]);

  // hold_queue 해결 처리
  await db.query(`
    UPDATE admin_hold_queue
    SET status = 'APPROVED', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
    WHERE reference_table = 'referral' AND reference_id = $2 AND status = 'PENDING'
  `, [adminId, referralId.toString()]);

  console.log(`✅ [Referral] HOLD approved: referral#${referralId} by ${adminId}`);

  return { success: true, newStatus: 'PENDING' };
}

/**
 * HOLD된 referral 거부
 * @param {number} referralId
 * @param {string} adminId
 * @param {string} reason
 * @returns {Promise<object>}
 */
async function rejectHoldReferral(referralId, adminId, reason) {
  await db.query(`
    UPDATE referral SET status = 'REJECTED' WHERE id = $1
  `, [referralId]);

  await db.query(`
    UPDATE admin_hold_queue
    SET status = 'REJECTED', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP, resolution_note = $2
    WHERE reference_table = 'referral' AND reference_id = $3 AND status = 'PENDING'
  `, [adminId, reason, referralId.toString()]);

  console.log(`❌ [Referral] HOLD rejected: referral#${referralId} by ${adminId}`);

  return { success: true, newStatus: 'REJECTED' };
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Constants
  INVITEE_BONUS,
  INVITER_BONUS,
  MONTHLY_LIMIT,
  QUALIFICATION,

  // Helpers
  createHash,
  getCurrentYearMonth,

  // Core Operations
  applyReferralCode,
  checkInviteeQualification,
  grantInviterReward,
  checkAllPendingReferrals,

  // Status
  getReferralStatus,
  getMyRefCode,

  // Admin
  approveHoldReferral,
  rejectHoldReferral
};
