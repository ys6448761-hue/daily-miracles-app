/**
 * retention-cron.js — Day3 이탈 방지 CRON
 *
 * 실행: node scripts/retention-cron.js
 * 권장 스케줄: 매일 오전 9시 KST (cron: "0 0 * * *" UTC)
 *
 * 로직:
 * 1. Day1 후 48~72h + 48h 비활동 유저 조회
 * 2. 48h 쿨다운 확인
 * 3. SMS 발송 + dreamtown_flow 로그
 */

'use strict';

require('dotenv').config();

const { findDay3InactiveUsers, sendDay3Sms } = require('../services/retentionService');

async function runDay3Retention() {
  console.log('[retention-cron] Day3 이탈 방지 실행:', new Date().toISOString());

  const users = await findDay3InactiveUsers();
  console.log(`[retention-cron] 대상 유저: ${users.length}명`);

  if (users.length === 0) {
    console.log('[retention-cron] 발송 대상 없음 — 종료');
    process.exit(0);
  }

  let sent = 0, skipped = 0, failed = 0;

  for (const user of users) {
    const { user_id, phone_number } = user;
    const result = await sendDay3Sms(user_id, phone_number);

    if (result.sent)          { sent++;    console.log(`  ✅ ${user_id} — SMS 발송`); }
    else if (result.skipped)  { skipped++; console.log(`  ⏭  ${user_id} — 쿨다운 스킵`); }
    else                      { failed++;  console.log(`  ❌ ${user_id} — 실패: ${result.error}`); }
  }

  console.log(`[retention-cron] 완료: 발송 ${sent} / 스킵 ${skipped} / 실패 ${failed}`);
  process.exit(0);
}

runDay3Retention().catch(e => {
  console.error('[retention-cron] Fatal:', e.message);
  process.exit(1);
});
