/**
 * reminderService.js — Star 약속 리마인더
 *
 * runReminderBatch() — CRON 진입점
 *   1. reminder_opt_in=true + status='pending' + target_date<=NOW() 조회
 *   2. 알림톡 발송 (sendSensAlimtalk)
 *   3. reminder_logs INSERT
 *   4. star_promises.reminder_status = 'sent' 업데이트
 */

'use strict';

const db                   = require('../database/db');
const { sendSensAlimtalk } = require('./messageProvider');

const APP_BASE_URL       = process.env.APP_BASE_URL       || 'https://app.dailymiracles.kr';
const REMINDER_TEMPLATE  = process.env.SENS_REMINDER_TEMPLATE_CODE || 'star_reminder';

const TYPE_LABELS = { '3m': '3개월', '6m': '6개월', '12m': '12개월' };

// ── 발송 대상 조회 ─────────────────────────────────────────────────
async function getPendingReminders() {
  const { rows } = await db.query(
    `SELECT
       sp.id          AS promise_id,
       sp.star_id,
       sp.type,
       sp.content,
       sp.target_date,
       s.access_key,
       s.phone_number
     FROM star_promises sp
     JOIN stars s ON s.id = sp.star_id
     WHERE sp.reminder_opt_in  = TRUE
       AND sp.reminder_status  = 'pending'
       AND sp.target_date     <= NOW()
       AND s.phone_number     IS NOT NULL
       AND s.phone_number     != ''`
  );
  return rows;
}

// ── 알림톡 발송 ────────────────────────────────────────────────────
async function sendReminderAlimtalk(phone, accessKey, type) {
  const label   = TYPE_LABELS[type] || type;
  const starUrl = `${APP_BASE_URL}/star/${accessKey}`;

  const content =
    `${label} 전 케이블카에서 남긴 마음이 기다리고 있어요.\n\n` +
    `그날의 당신이 지금의 당신에게 보내는 한 마디 —`;

  return sendSensAlimtalk(phone, {
    templateCode: REMINDER_TEMPLATE,
    content,
    buttons: [{
      type:       'WL',
      name:       '내 별 보기',
      linkMobile: starUrl,
      linkPc:     starUrl,
    }],
  });
}

// ── 발송 로그 기록 ─────────────────────────────────────────────────
async function logReminder(promiseId, starId, status, detail = {}) {
  await db.query(
    `INSERT INTO reminder_logs (promise_id, star_id, remind_type, status, detail)
     VALUES ($1, $2, 'due', $3, $4)`,
    [promiseId, starId, status, JSON.stringify(detail)]
  ).catch(e => console.error('[reminder] logReminder error:', e.message));
}

// ── 상태 업데이트 ──────────────────────────────────────────────────
async function markSent(promiseId) {
  await db.query(
    `UPDATE star_promises
     SET reminder_status = 'sent', last_reminded_at = NOW()
     WHERE id = $1`,
    [promiseId]
  );
}

async function markFailed(promiseId) {
  await db.query(
    `UPDATE star_promises
     SET reminder_status = 'failed', last_reminded_at = NOW()
     WHERE id = $1`,
    [promiseId]
  );
}

// ── 메인 배치 ──────────────────────────────────────────────────────
async function runReminderBatch() {
  let sent = 0, failed = 0, skipped = 0;

  let rows;
  try {
    rows = await getPendingReminders();
  } catch (e) {
    console.error('[reminder] getPendingReminders error:', e.message);
    return { sent, failed, skipped };
  }

  console.log(`[reminder] 대상: ${rows.length}명`);

  for (const row of rows) {
    const { promise_id, star_id, type, phone_number, access_key } = row;

    try {
      const result = await sendReminderAlimtalk(phone_number, access_key, type);

      if (result.skipped) {
        // OUTBOUND_ENABLED=false 등
        await logReminder(promise_id, star_id, 'skipped', { reason: result.reason });
        skipped++;
        console.log(`  ⏭  ${promise_id} — 스킵 (${result.reason})`);
        continue;
      }

      if (result.success) {
        await markSent(promise_id);
        await logReminder(promise_id, star_id, 'sent', { type, phone_masked: phone_number.slice(-4) });
        sent++;
        console.log(`  ✅ ${promise_id} — 발송`);
      } else {
        // 실패 → 1회 retry
        const retry = await sendReminderAlimtalk(phone_number, access_key, type);
        if (retry.success) {
          await markSent(promise_id);
          await logReminder(promise_id, star_id, 'sent', { type, retry: true });
          sent++;
          console.log(`  ✅ ${promise_id} — 재시도 성공`);
        } else {
          await markFailed(promise_id);
          await logReminder(promise_id, star_id, 'failed', { error: result.reason });
          failed++;
          console.log(`  ❌ ${promise_id} — 실패 (${result.reason})`);
        }
      }
    } catch (e) {
      await markFailed(promise_id).catch(() => {});
      await logReminder(promise_id, star_id, 'failed', { error: e.message });
      failed++;
      console.error(`  ❌ ${promise_id} — 예외: ${e.message}`);
    }
  }

  return { sent, failed, skipped };
}

module.exports = { runReminderBatch };
