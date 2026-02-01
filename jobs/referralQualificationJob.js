/**
 * referralQualificationJob.js
 * 추천 자격 확인 및 보상 지급 배치 작업
 *
 * 실행 주기: 매일 10:00 KST (권장)
 * 역할:
 * - PENDING 상태의 referral 중 B가 자격 달성한 건 찾기
 * - A에게 베스팅 보상 지급
 * - 7일 초과 시 EXPIRED 처리
 *
 * 실행 방법:
 * - CLI: node jobs/referralQualificationJob.js
 * - GitHub Actions: cron 스케줄 (TZ=Asia/Seoul)
 * - API: POST /api/admin/referral/check-batch
 *
 * 중복 실행 방지: PostgreSQL Advisory Lock 사용
 *
 * @version 1.1
 * @spec Aurora5 Code 작업지시서 v2.6
 */

// 모듈 로드
let referralService, pointService, db;
try {
  referralService = require('../services/referralService');
  pointService = require('../services/pointService');
  db = require('../database/db');
} catch (e) {
  console.error('❌ [ReferralQualification] 모듈 로드 실패:', e.message);
  process.exit(1);
}

// Job Lock ID (고유한 정수값, 다른 Job과 겹치지 않게)
const JOB_LOCK_ID = 100002; // referral_qualification_job

/**
 * Advisory Lock 획득 시도
 * @returns {boolean} 락 획득 성공 여부
 */
async function tryAcquireLock() {
  try {
    const result = await db.query(
      'SELECT pg_try_advisory_lock($1) as acquired',
      [JOB_LOCK_ID]
    );
    return result.rows[0]?.acquired === true;
  } catch (error) {
    console.error('⚠️  Lock 획득 중 오류:', error.message);
    return false;
  }
}

/**
 * Advisory Lock 해제
 */
async function releaseLock() {
  try {
    await db.query('SELECT pg_advisory_unlock($1)', [JOB_LOCK_ID]);
  } catch (error) {
    console.error('⚠️  Lock 해제 중 오류:', error.message);
  }
}

/**
 * 메인 실행 함수
 */
async function runReferralQualificationJob() {
  const startTime = Date.now();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('👥 Referral Qualification Job Started');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📅 Time: ${new Date().toISOString()}`);
  console.log(`🌏 TZ: ${process.env.TZ || 'system default'}`);
  console.log('');

  // 중복 실행 방지 락 획득
  const lockAcquired = await tryAcquireLock();
  if (!lockAcquired) {
    console.log('⚠️  다른 인스턴스가 이미 실행 중입니다. 스킵합니다.');
    return { skipped: true, reason: 'ALREADY_RUNNING' };
  }
  console.log('🔒 Job lock acquired');

  try {
    // Feature flag 확인
    const enabled = await pointService.isFeatureEnabled('referral_enabled');
    if (!enabled) {
      console.log('⚠️  referral_enabled=false, 자격 확인 건너뜀');
      return { skipped: true, reason: 'FEATURE_DISABLED' };
    }

    // 배치 실행
    const stats = await referralService.checkAllPendingReferrals();

    const duration = Date.now() - startTime;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 Qualification Check Result');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Checked:   ${stats.checked}`);
    console.log(`   Rewarded:  ${stats.rewarded} ✅`);
    console.log(`   Expired:   ${stats.expired} ⏰`);
    console.log(`   Pending:   ${stats.pending} ⏳`);
    console.log(`   Failed:    ${stats.failed} ❌`);
    console.log(`   Duration:  ${duration}ms`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    return {
      success: true,
      ...stats,
      duration
    };
  } catch (error) {
    console.error('');
    console.error('💥 Referral Qualification Job Failed!');
    console.error('Error:', error.message);
    console.error(error.stack);
    console.error('');

    throw error;
  } finally {
    // 락 해제
    await releaseLock();
    console.log('🔓 Job lock released');
  }
}

// CLI 실행
if (require.main === module) {
  runReferralQualificationJob()
    .then((result) => {
      console.log('✅ Job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Job failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runReferralQualificationJob };
