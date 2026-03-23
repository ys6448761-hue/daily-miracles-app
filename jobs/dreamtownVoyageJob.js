/**
 * DreamTown Voyage Schedule Job
 * dt_voyage_schedule의 미발송 레코드 처리 → SENS SMS 발송
 *
 * 실행 방법:
 *   node jobs/dreamtownVoyageJob.js          (수동)
 *   GitHub Actions / Render Cron으로 08:05 KST 실행
 *
 * 처리 조건:
 *   - scheduled_at <= NOW()
 *   - sent_at IS NULL
 *   - phone_number IS NOT NULL
 */

require('dotenv').config();
const db = require('../database/db');
const { sendSensSMS } = require('../services/messageProvider');

const BATCH_SIZE = 50;
const DELAY_MS   = 150; // SENS rate limit 대응

async function runVoyageJob() {
  console.log('═══════════════════════════════════════');
  console.log('🌟 DreamTown Voyage Job Started');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════');

  const stats = { total: 0, sent: 0, failed: 0, skipped: 0 };

  try {
    // 발송 대상 조회
    const { rows: pending } = await db.query(
      `SELECT vs.id, vs.star_id, vs.phone_number, vs.day_number,
              vs.message_text, vs.wisdom_tag,
              s.star_name
         FROM dt_voyage_schedule vs
         JOIN dt_stars s ON s.id = vs.star_id
        WHERE vs.scheduled_at <= NOW()
          AND vs.sent_at IS NULL
          AND vs.phone_number IS NOT NULL
        ORDER BY vs.scheduled_at ASC
        LIMIT $1`,
      [BATCH_SIZE]
    );

    stats.total = pending.length;
    console.log(`📋 발송 대상: ${pending.length}건`);

    if (pending.length === 0) {
      console.log('✅ 발송 대상 없음');
      return stats;
    }

    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      console.log(`\n[${i + 1}/${pending.length}] star_id=${item.star_id} D+${item.day_number}`);

      try {
        const smsText =
          `🌟 ${item.star_name} D+${item.day_number}\n\n` +
          `${item.message_text}\n\n` +
          `─ Aurora5 | 하루하루의 기적 드림\n` +
          `→ app.dailymiracles.kr/dreamtown`;

        await sendSensSMS(item.phone_number, smsText);

        // sent_at 업데이트
        await db.query(
          `UPDATE dt_voyage_schedule
              SET sent_at = NOW(), is_shown_in_app = TRUE
            WHERE id = $1`,
          [item.id]
        );

        stats.sent++;
        console.log(`✅ Sent D+${item.day_number} → ${item.phone_number.slice(0, 6)}****`);

      } catch (err) {
        console.error(`❌ 발송 실패 id=${item.id}:`, err.message);
        stats.failed++;
      }

      if (i < pending.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

  } catch (err) {
    console.error('💥 Job failed:', err.message);
    throw err;
  } finally {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Voyage Job Summary');
    console.log(`Total:   ${stats.total}`);
    console.log(`Sent:    ${stats.sent} ✅`);
    console.log(`Failed:  ${stats.failed} ❌`);
    console.log(`Skipped: ${stats.skipped} ⏭️`);
    console.log('═══════════════════════════════════════\n');
  }

  return stats;
}

// CLI 실행
if (require.main === module) {
  runVoyageJob()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Voyage job error:', err);
      process.exit(1);
    });
}

module.exports = { runVoyageJob };
