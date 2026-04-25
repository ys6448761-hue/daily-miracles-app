/**
 * retention-cron.js — Day1/Day3/Day7 이탈 방지 CRON
 *
 * 실행: node scripts/retention-cron.js
 * 권장 스케줄: 매일 오전 10시 KST (cron: "0 1 * * *" UTC)
 *
 * Day1: star_created 후 12~24h + 재방문 없음 → 알림톡 재방문 유도
 * Day3: day1_start 후 48~72h + 48h 비활동   → "지금이 가장 중요한 순간"
 * Day7: day1_start 후 5일+ + 완주 없음 + 48h 비활동 → "거의 다 왔어요"
 */

'use strict';

require('dotenv').config();

const {
  findDay1ReturnUsers, sendDay1Alimtalk,
  findDay3InactiveUsers, sendDay3Sms,
  findDay7InactiveUsers, sendDay7Sms,
} = require('../services/retentionService');

async function runBatch(label, users, sendFn) {
  console.log(`[retention-cron] ${label} 대상: ${users.length}명`);
  let sent = 0, skipped = 0, failed = 0;

  for (const { user_id, phone_number } of users) {
    const result = await sendFn(user_id, phone_number);
    if (result.sent)         { sent++;    console.log(`  ✅ ${user_id} — 발송`); }
    else if (result.skipped) { skipped++; console.log(`  ⏭  ${user_id} — 쿨다운`); }
    else                     { failed++;  console.log(`  ❌ ${user_id} — ${result.error}`); }
  }

  console.log(`  → 발송 ${sent} / 스킵 ${skipped} / 실패 ${failed}`);
  return { sent, skipped, failed };
}

async function main() {
  console.log('[retention-cron] 시작:', new Date().toISOString());

  const [day1Users, day3Users, day7Users] = await Promise.all([
    findDay1ReturnUsers(),
    findDay3InactiveUsers(),
    findDay7InactiveUsers(),
  ]);

  const r1 = await runBatch('Day1', day1Users, sendDay1Alimtalk);
  const r3 = await runBatch('Day3', day3Users, sendDay3Sms);
  const r7 = await runBatch('Day7', day7Users, sendDay7Sms);

  console.log(
    `[retention-cron] 완료 — Day1: ${r1.sent}건 / Day3: ${r3.sent}건 / Day7: ${r7.sent}건`
  );
  process.exit(0);
}

main().catch(e => {
  console.error('[retention-cron] Fatal:', e.message);
  process.exit(1);
});
