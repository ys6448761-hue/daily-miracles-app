/**
 * retentionService.js — Day3/Day7 이탈 방지 SSOT
 *
 * getRetentionState(userId)  → 'day3' | 'day7' | null  (미들웨어용 단순 인터페이스)
 * findDay3InactiveUsers()    → 48~72h 비활동 유저 목록 (CRON용)
 * sendDay3Sms(userId, phone) → SMS 발송 + 쿨다운 체크
 */

'use strict';

const db              = require('../database/db');
const { sendSensSMS } = require('./messageProvider');
const { detectStall } = require('./aiRecommendationService');

const COOLDOWN_48H = 48 * 60 * 60 * 1000;

/**
 * 단순 리텐션 상태 반환 (미들웨어/응답 주입용)
 * detectStall 결과 → 2단계로 단순화
 */
async function getRetentionState(userId) {
  const stall = await detectStall(String(userId));
  if (stall === 'day3_resume')                      return 'day3';
  if (stall === 'day7_push' || stall === 'day7_stall') return 'day7';
  return null;
}

/**
 * Day3 이탈 위험 유저 목록
 * 조건: day1_start 후 48~72h + 48h 이상 비활동 + 폰번호 있음
 */
async function findDay3InactiveUsers() {
  try {
    const { rows } = await db.query(
      `SELECT
         f.user_id,
         u.phone_number,
         MAX(CASE WHEN f.action = 'day1_start' THEN f.created_at END) AS day1_at,
         MAX(f.created_at) FILTER (WHERE f.stage = 'growth')          AS last_active_at
       FROM dreamtown_flow f
       JOIN dt_users u ON u.id::text = f.user_id
       WHERE f.stage = 'growth'
         AND u.phone_number IS NOT NULL
         AND u.phone_number != ''
       GROUP BY f.user_id, u.phone_number
       HAVING
         MAX(CASE WHEN f.action = 'day1_start' THEN f.created_at END) IS NOT NULL
         AND MAX(CASE WHEN f.action = 'day7_complete' THEN f.created_at END) IS NULL
         AND EXTRACT(EPOCH FROM (NOW() - MAX(CASE WHEN f.action = 'day1_start' THEN f.created_at END))) / 3600
             BETWEEN 48 AND 72
         AND (MAX(f.created_at) FILTER (WHERE f.stage = 'growth') IS NULL
              OR NOW() - MAX(f.created_at) FILTER (WHERE f.stage = 'growth') > INTERVAL '48 hours')`
    );
    return rows;
  } catch (e) {
    console.error('[retention] findDay3InactiveUsers error:', e.message);
    return [];
  }
}

/**
 * Day3 복귀 SMS 발송
 * 48h 쿨다운: recommendation/day3_sms_sent 로그 확인
 */
async function sendDay3Sms(userId, phone) {
  // 쿨다운 체크
  try {
    const { rows } = await db.query(
      `SELECT created_at FROM dreamtown_flow
        WHERE user_id = $1 AND stage = 'recommendation' AND action = 'day3_sms_sent'
          AND created_at >= NOW() - INTERVAL '48 hours'
        LIMIT 1`,
      [String(userId)]
    );
    if (rows.length > 0) return { skipped: true, reason: 'cooldown' };
  } catch { /* 쿨다운 조회 실패 시 발송 허용 */ }

  const text =
    `✨ 지금이 가장 중요한 순간이에요\n\n` +
    `여기서 멈추는 사람들이 가장 많아요.\n` +
    `그래서 지금 이 순간이 중요해요.\n\n` +
    `→ https://app.dailymiracles.kr/dreamtown\n\n` +
    `하루하루의 기적 드림`;

  try {
    await sendSensSMS(phone, text);

    // 발송 로그
    await db.query(
      `INSERT INTO dreamtown_flow (user_id, stage, action, value)
       VALUES ($1, 'recommendation', 'day3_sms_sent', $2)`,
      [String(userId), JSON.stringify({ trigger: 'day3_resume', phone_masked: phone.slice(-4) })]
    );

    return { sent: true };
  } catch (e) {
    console.error('[retention] sendDay3Sms error:', e.message);
    return { sent: false, error: e.message };
  }
}

module.exports = { getRetentionState, findDay3InactiveUsers, sendDay3Sms };
