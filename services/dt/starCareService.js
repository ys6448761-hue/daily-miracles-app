'use strict';

/**
 * starCareService.js
 * 7일 케어 엔진 — 별 생성 → D+1~D+7 감정 케어 메시지
 *
 * 원칙:
 *  - 하루 1개 메시지만
 *  - 12시간 내 활동이 있으면 발송 안 함 (강요 금지)
 *  - SMS는 Day 1, 3, 7만 (비용 최적화)
 *  - 플랜 paused → 전체 스킵, lite → 주 2회 제한
 *  - cron: 매일 오전 10시 (UTC 01:00 = KST 10:00)
 */

const db  = require('../../database/db');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('starCare');

// SMS 발송 대상 일자 (비용 최적화 — Day 1, 3, 7만)
const SMS_DAYS = new Set([1, 3, 7]);

// ── 케어 메시지 SSOT (day 1~7) ────────────────────────────────────
const CARE_MESSAGES = {
  1: '어제의 마음, 오늘은 조금 달라졌나요',
  2: '같은 자리에서도 생각이 조금씩 달라지고 있어요',
  3: '조금 정리되고 있는 느낌이 들지 않나요',
  4: '지금은 잠깐 멈춰 있는 시간일 수도 있어요',
  5: '이제 한 걸음만 가볼까요',
  6: '여기까지 온 것도 충분히 의미 있어요',
  7: '이 별이 처음 만들어진 순간을 기억하시나요',
};

function generateCareMessage(day, activity) {
  // 활동 상태 반영: ANXIETY → 더 부드러운 variant
  if (activity?.dominant_state === 'ANXIETY' && day <= 3) {
    const gentle = { 1: '조금 쉬어가도 괜찮아요', 2: '지금 이 마음 그대로도 괜찮아요', 3: '흔들려도 여기 있어요' };
    return gentle[day] || CARE_MESSAGES[day];
  }
  return CARE_MESSAGES[day] || CARE_MESSAGES[7];
}

// ── 스케줄 생성 (별 생성 시 호출) ───────────────────────────────
async function scheduleStarCare(userId, starId, phoneNumber = null) {
  const now = new Date();
  const inserts = [];

  for (let day = 1; day <= 7; day++) {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(now.getDate() + day);
    // 10:00 KST 고정
    scheduledAt.setUTCHours(1, 0, 0, 0); // UTC 01:00 = KST 10:00

    inserts.push(
      db.query(
        `INSERT INTO star_care_schedule (user_id, star_id, phone_number, day, scheduled_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (star_id, day) DO NOTHING`,
        [userId, starId, phoneNumber, day, scheduledAt]
      ).catch(e => log.warn(`케어 스케줄 day${day} 실패`, { err: e.message }))
    );
  }

  await Promise.all(inserts);
  log.info('케어 스케줄 생성 완료', { userId, starId, days: 7 });
}

// ── 최근 활동 조회 (12h 기준) ─────────────────────────────────────
async function getUserRecentActivity(userId) {
  try {
    const [evRow, phaseRow] = await Promise.all([
      db.query(
        `SELECT MAX(created_at) AS last_active FROM user_events
         WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
        [userId]
      ),
      db.query(
        `SELECT dominant_state FROM star_timeline_summary sts
         JOIN dt_stars ds ON sts.star_id = ds.id
         WHERE ds.user_id = $1 ORDER BY sts.updated_at DESC LIMIT 1`,
        [userId]
      ),
    ]);
    return {
      last_active:    evRow.rows[0]?.last_active || null,
      dominant_state: phaseRow.rows[0]?.dominant_state || null,
    };
  } catch { return { last_active: null, dominant_state: null }; }
}

// ── 발송 조건 (12시간 내 활동 없을 때만) ─────────────────────────
function shouldSendCare(activity) {
  if (!activity?.last_active) return true; // 활동 기록 없으면 발송
  const hoursAgo = (Date.now() - new Date(activity.last_active).getTime()) / 3_600_000;
  return hoursAgo > 12;
}

// ── 발송 (in-app 기록 + 조건부 SMS) ─────────────────────────────
async function sendCareMessage(userId, phoneNumber, message, day) {
  // 1. In-app: user_events 에 기록 (앱에서 배지/알림으로 활용)
  try {
    await db.query(
      `INSERT INTO user_events (user_id, event_type, metadata)
       VALUES ($1, 'care_sent', $2::jsonb)`,
      [userId, JSON.stringify({ day, message })]
    );
  } catch (e) { log.warn('in-app care 기록 실패', { err: e.message }); }

  // 2. SMS (phone_number 있을 때만, messageProvider 경유 필수)
  if (phoneNumber) {
    try {
      const mp = require('../messageProvider');
      if (typeof mp.sendSensSMS === 'function') {
        await mp.sendSensSMS(phoneNumber, `[하루하루의 기적] ${message}`);
        return 'sms';
      }
    } catch (e) { log.warn('SMS 발송 실패 (in-app만 발송됨)', { err: e.message }); }
  }

  return 'inapp';
}

// ── 단건 처리 ────────────────────────────────────────────────────
async function processCare(task) {
  const { id, user_id, phone_number, day } = task;

  // 1. 플랜 기반 발송 가능 여부 확인
  const planSvc = require('./userPlanService');
  const allowed = await planSvc.canSendCare(user_id).catch(() => true);
  if (!allowed) {
    await db.query(
      `UPDATE star_care_schedule SET executed=true, sent_at=NOW(), send_type='plan_skipped' WHERE id=$1`,
      [id]
    );
    log.info('케어 스킵 (플랜 제한)', { user_id, day });
    return;
  }

  // 2. 12h 내 활동 확인
  const activity = await getUserRecentActivity(user_id);
  if (!shouldSendCare(activity)) {
    await db.query(
      `UPDATE star_care_schedule SET executed=true, sent_at=NOW(), send_type='skipped' WHERE id=$1`,
      [id]
    );
    log.info('케어 스킵 (12h 내 활동)', { user_id, day });
    return;
  }

  // 3. SMS는 SMS_DAYS에 해당하는 날만, 나머지는 in-app only
  const effectivePhone = SMS_DAYS.has(day) ? phone_number : null;
  const message  = generateCareMessage(day, activity);
  const sentType = await sendCareMessage(user_id, effectivePhone, message, day);

  await db.query(
    `UPDATE star_care_schedule SET executed=true, sent_at=NOW(), send_type=$1 WHERE id=$2`,
    [sentType, id]
  );

  log.info('케어 발송 완료', { user_id, day, sentType });
}

// ── cron 실행 함수 ────────────────────────────────────────────────
async function runStarCare() {
  log.info('케어 cron 실행 시작');
  try {
    const { rows } = await db.query(
      `SELECT * FROM star_care_schedule
       WHERE executed = false AND scheduled_at <= NOW()
       ORDER BY scheduled_at ASC
       LIMIT 500`
    );

    log.info(`처리할 케어 작업: ${rows.length}건`);
    for (const task of rows) {
      await processCare(task).catch(e =>
        log.warn('processCare 실패 (계속)', { id: task.id, err: e.message })
      );
    }
  } catch (e) {
    log.error('runStarCare 실패', { err: e.message });
  }
  log.info('케어 cron 실행 완료');
}

module.exports = { scheduleStarCare, runStarCare, generateCareMessage, shouldSendCare, processCare };
