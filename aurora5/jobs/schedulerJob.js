/**
 * Aurora5 - Scheduler Job
 * 매일 09:00 (KST) 자동 발송 처리
 *
 * @version 1.0
 *
 * 실행 방법:
 * 1. node aurora5/jobs/schedulerJob.js (수동)
 * 2. GitHub Actions cron (자동)
 * 3. Render Cron Job (자동)
 */

const db = require('../../database/db');
const { getTrialsToSend, updateTrialAfterSend, buildMagicUrl } = require('../services/magicLinkService');
const { sendKakaoAlimtalk, buildDayMessage, buildCompleteMessage, TEMPLATES } = require('../services/kakaoService');

// 설정
const BATCH_SIZE = 50; // 한 번에 처리할 최대 건수
const DELAY_BETWEEN_SENDS = 100; // ms

/**
 * 메인 스케줄러 실행
 */
async function runDailyJob() {
  console.log('═══════════════════════════════════════');
  console.log('🌅 Aurora5 Daily Job Started');
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log('═══════════════════════════════════════');

  const stats = {
    total: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    completed: 0
  };

  try {
    // 1. 발송 대상 조회
    const trials = await getTrialsToSend();
    stats.total = trials.length;

    console.log(`📋 발송 대상: ${trials.length}건`);

    if (trials.length === 0) {
      console.log('✅ 발송 대상 없음');
      return stats;
    }

    // 2. 배치 처리
    for (let i = 0; i < Math.min(trials.length, BATCH_SIZE); i++) {
      const trial = trials[i];
      const nextDay = trial.last_day_sent + 1;

      console.log(`\n[${i + 1}/${trials.length}] Trial #${trial.id} - Day ${nextDay}`);

      try {
        // 전화번호 확인
        if (!trial.phone) {
          console.log(`⏭️ Skip: No phone number`);
          stats.skipped++;
          continue;
        }

        // 분석 데이터 파싱
        const analysis = typeof trial.analysis_json === 'string'
          ? JSON.parse(trial.analysis_json)
          : trial.analysis_json;

        const nickname = trial.payload_norm?.nickname || '익명';
        const magicUrl = buildMagicUrl(trial.token);

        // Day 메시지 생성
        let message;
        if (nextDay <= 7) {
          const mission = analysis.missions?.[nextDay - 1];
          if (!mission) {
            console.log(`⏭️ Skip: No mission for Day ${nextDay}`);
            stats.skipped++;
            continue;
          }
          message = buildDayMessage(nickname, nextDay, mission, magicUrl);
        }

        // 발송
        const result = await sendKakaoAlimtalk({
          to: trial.phone,
          templateCode: message.templateCode,
          variables: message.variables,
          trialId: trial.id,
          day: nextDay
        });

        // 성공 시 상태 업데이트
        await updateTrialAfterSend(trial.id, nextDay);

        // 7일 완주 시 추가 메시지
        if (nextDay === 7) {
          stats.completed++;
          console.log(`🏁 Completed: Trial #${trial.id}`);

          // 완주 축하 메시지 발송
          const completeMessage = buildCompleteMessage(nickname, trial.ref_code, magicUrl);
          await sendKakaoAlimtalk({
            to: trial.phone,
            templateCode: completeMessage.templateCode,
            variables: completeMessage.variables,
            trialId: trial.id,
            day: 7
          });
        }

        stats.sent++;
        console.log(`✅ Sent: Day ${nextDay} to ${trial.phone}`);

      } catch (error) {
        console.error(`❌ Failed: Trial #${trial.id}`, error.message);
        stats.failed++;
      }

      // 딜레이
      if (i < trials.length - 1) {
        await sleep(DELAY_BETWEEN_SENDS);
      }
    }

  } catch (error) {
    console.error('💥 Job failed:', error);
    throw error;

  } finally {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Daily Job Summary');
    console.log('═══════════════════════════════════════');
    console.log(`Total:     ${stats.total}`);
    console.log(`Sent:      ${stats.sent} ✅`);
    console.log(`Failed:    ${stats.failed} ❌`);
    console.log(`Skipped:   ${stats.skipped} ⏭️`);
    console.log(`Completed: ${stats.completed} 🏁`);
    console.log('═══════════════════════════════════════\n');
  }

  return stats;
}

/**
 * 새 인입 처리 (Inbox → Result → Trial)
 */
async function processNewInboxes() {
  const inboxService = require('../services/inboxService');
  const analysisService = require('../services/analysisService');
  const magicLinkService = require('../services/magicLinkService');
  const kakaoService = require('../services/kakaoService');

  console.log('═══════════════════════════════════════');
  console.log('📥 Processing New Inboxes');
  console.log('═══════════════════════════════════════');

  const stats = { processed: 0, success: 0, failed: 0 };

  try {
    // 처리 대기 인박스 조회
    const pendingInboxes = await inboxService.getPendingInboxes(10);
    stats.processed = pendingInboxes.length;

    console.log(`📋 대기 중: ${pendingInboxes.length}건`);

    for (const inbox of pendingInboxes) {
      console.log(`\n🔄 Processing Inbox #${inbox.id}`);

      try {
        // 상태 변경: NEW → PROCESSING
        await inboxService.updateStatus(inbox.id, 'PROCESSING');

        const payloadNorm = typeof inbox.payload_norm === 'string'
          ? JSON.parse(inbox.payload_norm)
          : inbox.payload_norm;

        // 1. AI 분석
        console.log('🤖 Generating analysis...');
        const analysis = await analysisService.generateMissionAnalysis(payloadNorm);
        const analysisText = analysisService.analysisToText(analysis, payloadNorm.nickname);

        // 2. 매직 링크 생성
        console.log('🔗 Creating magic link...');
        const result = await magicLinkService.createResult({
          inboxId: inbox.id,
          analysisJson: analysis,
          analysisText
        });

        // 3. Trial 생성
        console.log('🎫 Creating trial...');
        const phone = payloadNorm.phone;
        const trial = await magicLinkService.createTrial({
          inboxId: inbox.id,
          token: result.token,
          phone
        });

        // 4. 결과 발송 (Day 0)
        if (phone) {
          console.log('📱 Sending result...');
          const message = kakaoService.buildResultMessage(payloadNorm.nickname, analysis, result.url);
          await kakaoService.sendKakaoAlimtalk({
            to: phone,
            templateCode: message.templateCode,
            variables: message.variables,
            trialId: trial.id,
            day: 0
          });
        }

        // 상태 변경: PROCESSING → DONE
        await inboxService.updateStatus(inbox.id, 'DONE');
        stats.success++;

        console.log(`✅ Inbox #${inbox.id} completed!`);

      } catch (error) {
        console.error(`❌ Inbox #${inbox.id} failed:`, error.message);
        await inboxService.updateStatus(inbox.id, 'FAILED', error.message);
        stats.failed++;
      }
    }

    // 재시도 가능한 실패 건 처리
    const retryableInboxes = await inboxService.getRetryableInboxes(5);
    if (retryableInboxes.length > 0) {
      console.log(`\n♻️ Retrying ${retryableInboxes.length} failed inboxes...`);
      // 재귀 호출 방지를 위해 별도 처리
    }

  } catch (error) {
    console.error('💥 Process failed:', error);
    throw error;

  } finally {
    console.log('\n═══════════════════════════════════════');
    console.log('📊 Inbox Processing Summary');
    console.log('═══════════════════════════════════════');
    console.log(`Processed: ${stats.processed}`);
    console.log(`Success:   ${stats.success} ✅`);
    console.log(`Failed:    ${stats.failed} ❌`);
    console.log('═══════════════════════════════════════\n');
  }

  return stats;
}

/**
 * 전체 스케줄러 실행 (인입 처리 + 일일 발송)
 */
async function runFullScheduler() {
  console.log('\n🚀 Aurora5 Full Scheduler Starting...\n');

  const results = {
    inbox: null,
    daily: null,
    timestamp: new Date().toISOString()
  };

  try {
    // 1. 새 인입 처리
    results.inbox = await processNewInboxes();

    // 2. 일일 발송
    results.daily = await runDailyJob();

    console.log('\n✅ Aurora5 Full Scheduler Completed!\n');

  } catch (error) {
    console.error('\n💥 Aurora5 Scheduler Failed!\n', error);
    throw error;
  }

  return results;
}

// 유틸리티
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';

  (async () => {
    try {
      switch (command) {
        case 'daily':
          await runDailyJob();
          break;
        case 'inbox':
          await processNewInboxes();
          break;
        case 'full':
        default:
          await runFullScheduler();
          break;
      }
      process.exit(0);
    } catch (error) {
      console.error('Scheduler error:', error);
      process.exit(1);
    }
  })();
}

module.exports = {
  runDailyJob,
  processNewInboxes,
  runFullScheduler
};
