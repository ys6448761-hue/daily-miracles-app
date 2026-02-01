/**
 * pointExpirationJob.js
 * 포인트 만료 처리 배치 작업
 *
 * 실행 주기: 매일 00:00 KST (권장)
 * 역할: expires_at < now인 포인트를 is_expired = TRUE로 처리
 *
 * 실행 방법:
 * - CLI: node jobs/pointExpirationJob.js
 * - GitHub Actions: cron 스케줄 (TZ=Asia/Seoul)
 * - API: POST /api/admin/points/expire-batch
 *
 * 중복 실행 방지: PostgreSQL Advisory Lock 사용
 *
 * @version 1.1
 * @spec Aurora5 Code 작업지시서 v2.6
 */

// 모듈 로드
let pointService, db;
try {
  pointService = require('../services/pointService');
  db = require('../database/db');
} catch (e) {
  console.error('❌ [PointExpiration] 모듈 로드 실패:', e.message);
  process.exit(1);
}

// Job Lock ID (고유한 정수값, 다른 Job과 겹치지 않게)
const JOB_LOCK_ID = 100001; // point_expiration_job

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
async function runPointExpirationJob() {
  const startTime = Date.now();

  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('⏰ Point Expiration Job Started');
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
    const enabled = await pointService.isFeatureEnabled('points_enabled');
    if (!enabled) {
      console.log('⚠️  points_enabled=false, 만료 처리 건너뜀');
      return { skipped: true, reason: 'FEATURE_DISABLED' };
    }

    // 만료 처리 실행
    const result = await pointService.expirePoints();

    const duration = Date.now() - startTime;

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 Expiration Result');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   Expired Entries: ${result.expiredCount}`);
    console.log(`   Total Points:    ${result.totalExpired}P`);
    console.log(`   Duration:        ${duration}ms`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');

    return {
      success: true,
      ...result,
      duration
    };
  } catch (error) {
    console.error('');
    console.error('💥 Point Expiration Job Failed!');
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
  runPointExpirationJob()
    .then((result) => {
      console.log('✅ Job completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Job failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runPointExpirationJob };
