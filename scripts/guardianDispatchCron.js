#!/usr/bin/env node

/**
 * Guardian Dispatch Cron Job
 *
 * 매일 21:00 KST (12:00 UTC)에 실행되는 배치 작업
 * - 1회성 실행 스크립트 (cron job으로 호출됨)
 * - 대상자 조회 → 필터링 → 발송 또는 Dry Run 로깅
 *
 * 실행 방식:
 * - 외부 cron 또는 CI/CD 스케줄러에서 호출
 * - 매일 12:00 UTC: node scripts/guardianDispatchCron.js
 *
 * @version 1.0 - 2026.08.16
 */

require('dotenv').config();
const db = require('../database/db');
const GuardianDispatchService = require('../aurora5/services/guardianDispatchService');
const config = require('../config/dispatchConfig');

// ═══════════════════════════════════════════════════════════
// 메인 실행 함수
// ═══════════════════════════════════════════════════════════
async function main() {
  const startTime = Date.now();

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('Guardian Dispatch Cron Job Started');
  console.log('═'.repeat(60));
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${config.GUARDIAN_DISPATCH_DRY_RUN ? 'DRY_RUN' : 'LIVE'}`);
  console.log(`Cutoff: ${config.GUARDIAN_DISPATCH_CUTOFF_AT}`);
  console.log('═'.repeat(60));
  console.log('\n');

  try {
    // 1. 설정 검증
    if (!config.validateConfig()) {
      throw new Error('Configuration validation failed');
    }

    // 2. DB 연결 테스트
    console.log('[DispatchCron] Checking database connection...');
    const dbTest = await db.query('SELECT NOW()');
    console.log('✅ Database connected');

    // 3. 배치 실행
    const service = new GuardianDispatchService(db);
    const report = await service.runGuardianDispatchBatch();

    // 4. 결과 리포트
    console.log('\n');
    console.log('═'.repeat(60));
    console.log('Guardian Dispatch Batch Report');
    console.log('═'.repeat(60));
    console.log(JSON.stringify(report, null, 2));
    console.log('═'.repeat(60));

    // 5. 성공 종료
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Batch completed in ${duration}s`);

    if (config.GUARDIAN_DISPATCH_DRY_RUN) {
      console.log('\n⚠️  DRY RUN MODE:');
      console.log('   - SMS 발송 실제 수행 안 함');
      console.log('   - 로그만 기록됨');
      console.log('   - Phase 2 활성화 시 변경 필요: GUARDIAN_DISPATCH_DRY_RUN=false');
    } else {
      console.log('\n✅ LIVE MODE - SMS 발송 완료');
    }

    process.exit(0);
  } catch (error) {
    console.error('\n');
    console.error('❌ Batch failed:');
    console.error(error.message);
    console.error(error.stack);

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n❌ Batch failed after ${duration}s`);

    process.exit(1);
  }
}

// 프로세스 시그널 핸들링
process.on('SIGINT', () => {
  console.log('\n\nBatch interrupted by SIGINT');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n\nBatch interrupted by SIGTERM');
  process.exit(1);
});

// 시작
main();
