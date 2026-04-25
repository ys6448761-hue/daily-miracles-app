/**
 * reminderCron.js — Star 약속 리마인더 CRON
 *
 * 실행: node scripts/reminderCron.js
 * 권장 스케줄: 매일 오전 9시 KST (cron: "0 0 * * *" UTC)
 *
 * 대상: reminder_opt_in=true + status='pending' + target_date<=NOW()
 */

'use strict';

require('dotenv').config();

const { runReminderBatch } = require('../services/reminderService');

async function main() {
  console.log('[reminder-cron] 시작:', new Date().toISOString());

  const { sent, failed, skipped } = await runReminderBatch();

  console.log(
    `[reminder-cron] 완료 — 발송: ${sent}건 / 실패: ${failed}건 / 스킵: ${skipped}건`
  );
  process.exit(0);
}

main().catch(e => {
  console.error('[reminder-cron] Fatal:', e.message);
  process.exit(1);
});
