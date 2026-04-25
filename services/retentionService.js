/**
 * retentionService.js — Day1/Day3/Day7 이탈 방지 SSOT
 *
 * getRetentionState(userId)    → 'day3' | 'day7' | null  (미들웨어용 단순 인터페이스)
 * findDay1ReturnUsers()        → star_created 후 12~24h + 재방문 없음 유저 목록 (CRON용)
 * sendDay1Alimtalk(userId, phone) → Day1 재방문 알림톡 발송 + 중복 차단
 * findDay3InactiveUsers()      → 48~72h 비활동 유저 목록 (CRON용)
 * sendDay3Sms(userId, phone)   → Day3 SMS 발송 + 쿨다운 체크
 * findDay7InactiveUsers()      → 5일+ + 48h 비활동 유저 목록 (CRON용)
 * sendDay7Sms(userId, phone)   → Day7 완주 유도 SMS + 쿨다운 체크
 */

'use strict';

const db                                   = require('../database/db');
const { sendSensSMS, sendSensAlimtalk }    = require('./messageProvider');
const { detectStall }                      = require('./aiRecommendationService');

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

/**
 * Day7 완주 위험 유저 목록
 * 조건: day1_start 후 5일+ + day7_complete 없음 + 48h 비활동 + 폰번호 있음
 */
async function findDay7InactiveUsers() {
  try {
    const { rows } = await db.query(
      `SELECT
         f.user_id,
         u.phone_number,
         MAX(CASE WHEN f.action = 'day1_start' THEN f.created_at END)    AS day1_at,
         MAX(f.created_at) FILTER (WHERE f.stage = 'growth')             AS last_active_at
       FROM dreamtown_flow f
       JOIN dt_users u ON u.id::text = f.user_id
       WHERE f.stage = 'growth'
         AND u.phone_number IS NOT NULL
         AND u.phone_number != ''
       GROUP BY f.user_id, u.phone_number
       HAVING
         MAX(CASE WHEN f.action = 'day1_start' THEN f.created_at END) IS NOT NULL
         AND MAX(CASE WHEN f.action = 'day7_complete' THEN f.created_at END) IS NULL
         AND EXTRACT(EPOCH FROM (NOW() - MAX(CASE WHEN f.action = 'day1_start' THEN f.created_at END))) / 86400 >= 5
         AND (MAX(f.created_at) FILTER (WHERE f.stage = 'growth') IS NULL
              OR NOW() - MAX(f.created_at) FILTER (WHERE f.stage = 'growth') > INTERVAL '48 hours')`
    );
    return rows;
  } catch (e) {
    console.error('[retention] findDay7InactiveUsers error:', e.message);
    return [];
  }
}

/**
 * Day7 완주 유도 SMS 발송
 * 48h 쿨다운: recommendation/day7_sms_sent 로그 확인
 */
async function sendDay7Sms(userId, phone) {
  try {
    const { rows } = await db.query(
      `SELECT created_at FROM dreamtown_flow
        WHERE user_id = $1 AND stage = 'recommendation' AND action = 'day7_sms_sent'
          AND created_at >= NOW() - INTERVAL '48 hours'
        LIMIT 1`,
      [String(userId)]
    );
    if (rows.length > 0) return { skipped: true, reason: 'cooldown' };
  } catch { /* 쿨다운 조회 실패 시 발송 허용 */ }

  const text =
    `✨ 거의 다 왔어요\n\n` +
    `여기서 이어간 사람들이\n` +
    `가장 많이 변화를 느꼈어요.\n\n` +
    `마지막 한 걸음 →\n` +
    `https://app.dailymiracles.kr/dreamtown\n\n` +
    `하루하루의 기적 드림`;

  try {
    await sendSensSMS(phone, text);

    await db.query(
      `INSERT INTO dreamtown_flow (user_id, stage, action, value)
       VALUES ($1, 'recommendation', 'day7_sms_sent', $2)`,
      [String(userId), JSON.stringify({ trigger: 'day7_push', phone_masked: phone.slice(-4) })]
    );

    return { sent: true };
  } catch (e) {
    console.error('[retention] sendDay7Sms error:', e.message);
    return { sent: false, error: e.message };
  }
}

// ── Day1 재방문 알림톡 ──────────────────────────────────────────────

/**
 * Day1 재방문 대상 유저 목록
 * 조건:
 *  - dreamtown_flow에 stage='star', action='create' 존재 (별 생성함)
 *  - 별 생성 후 12~24시간 경과
 *  - 별 생성 이후 다른 활동 없음 (stage != 'recommendation')
 *  - day1_reminder_sent 로그 없음 (중복 차단)
 *  - phone_number 있음
 */
async function findDay1ReturnUsers() {
  try {
    const { rows } = await db.query(
      `SELECT sub.user_id, sub.phone_number, sub.star_created_at
       FROM (
         SELECT
           f.user_id,
           u.phone_number,
           MAX(CASE WHEN f.stage = 'star' AND f.action = 'create' THEN f.created_at END) AS star_created_at
         FROM dreamtown_flow f
         JOIN dt_users u ON u.id::text = f.user_id
         WHERE u.phone_number IS NOT NULL AND u.phone_number != ''
         GROUP BY f.user_id, u.phone_number
       ) sub
       WHERE sub.star_created_at IS NOT NULL
         AND EXTRACT(EPOCH FROM (NOW() - sub.star_created_at)) / 3600 BETWEEN 12 AND 24
         AND NOT EXISTS (
           SELECT 1 FROM dreamtown_flow f2
           WHERE f2.user_id = sub.user_id
             AND f2.created_at > sub.star_created_at
             AND f2.stage != 'recommendation'
         )
         AND NOT EXISTS (
           SELECT 1 FROM dreamtown_flow f3
           WHERE f3.user_id = sub.user_id
             AND f3.stage = 'recommendation'
             AND f3.action = 'day1_reminder_sent'
         )`
    );
    return rows;
  } catch (e) {
    console.error('[retention] findDay1ReturnUsers error:', e.message);
    return [];
  }
}

/**
 * Day1 재방문 알림톡 발송
 * - 중복 차단: day1_reminder_sent 로그 확인 (DB 기반, 쿨다운 무관)
 * - 템플릿 코드: SENS_DAY1_TEMPLATE_CODE 환경변수 (없으면 day1_reminder)
 */
async function sendDay1Alimtalk(userId, phone) {
  // 중복 발송 차단 (DB 재확인)
  try {
    const { rows } = await db.query(
      `SELECT id FROM dreamtown_flow
        WHERE user_id = $1 AND stage = 'recommendation' AND action = 'day1_reminder_sent'
        LIMIT 1`,
      [String(userId)]
    );
    if (rows.length > 0) return { skipped: true, reason: 'already_sent' };
  } catch { /* 조회 실패 시 발송 허용 */ }

  try {
    const result = await sendSensAlimtalk(phone, {
      templateCode: process.env.SENS_DAY1_TEMPLATE_CODE || 'day1_reminder',
    });

    if (result.skipped) return { skipped: true, reason: result.reason };

    // 발송 로그 (중복 방지용)
    await db.query(
      `INSERT INTO dreamtown_flow (user_id, stage, action, value)
       VALUES ($1, 'recommendation', 'day1_reminder_sent', $2)`,
      [String(userId), JSON.stringify({ trigger: 'day1_return', phone_masked: phone.slice(-4) })]
    );

    return { sent: true };
  } catch (e) {
    console.error('[retention] sendDay1Alimtalk error:', e.message);
    return { sent: false, error: e.message };
  }
}

module.exports = {
  getRetentionState,
  findDay1ReturnUsers, sendDay1Alimtalk,
  findDay3InactiveUsers, sendDay3Sms,
  findDay7InactiveUsers, sendDay7Sms,
};
