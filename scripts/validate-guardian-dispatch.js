#!/usr/bin/env node

/**
 * Guardian Dispatch Phase 1 배포 검증
 * 
 * 배포 완료 후 실행하여 scheduler 등록 상태 확인
 */

require('dotenv').config();
const config = require('../config/dispatchConfig');

console.log('\n');
console.log('═'.repeat(70));
console.log('Guardian Dispatch V0 — Phase 1 배포 검증');
console.log('═'.repeat(70));
console.log(`\n일시: ${new Date().toISOString()}`);
console.log(`환경: ${process.env.NODE_ENV || 'development'}\n`);

// 1. 플래그 확인
console.log('📋 설정 상태:');
console.log(`  GUARDIAN_DISPATCH_ENABLED: ${config.GUARDIAN_DISPATCH_ENABLED ? '✅ true' : '❌ false'}`);
console.log(`  GUARDIAN_DISPATCH_DRY_RUN: ${config.GUARDIAN_DISPATCH_DRY_RUN ? '✅ true (DRY RUN)' : '⚠️  false (LIVE)'}`);
console.log(`  GUARDIAN_DISPATCH_CUTOFF_AT: ${config.GUARDIAN_DISPATCH_CUTOFF_AT}`);

// 2. 조건 검증
console.log('\n✅ 배포 조건 검증:');
const checks = [
  {
    name: 'ENABLED=true',
    pass: config.GUARDIAN_DISPATCH_ENABLED === true,
    fix: 'GUARDIAN_DISPATCH_ENABLED를 true로 설정'
  },
  {
    name: 'DRY_RUN=true (Phase 1)',
    pass: config.GUARDIAN_DISPATCH_DRY_RUN === true,
    fix: 'GUARDIAN_DISPATCH_DRY_RUN를 true로 설정'
  },
  {
    name: 'CUTOFF_AT 설정됨',
    pass: !!config.GUARDIAN_DISPATCH_CUTOFF_AT && config.GUARDIAN_DISPATCH_CUTOFF_AT !== '',
    fix: 'GUARDIAN_DISPATCH_CUTOFF_AT에 배포 UTC 시각 설정'
  }
];

let allPass = true;
checks.forEach(check => {
  const status = check.pass ? '✅' : '❌';
  console.log(`  ${status} ${check.name}`);
  if (!check.pass) {
    console.log(`      → ${check.fix}`);
    allPass = false;
  }
});

// 3. 다음 단계
console.log('\n📅 다음 단계:');
console.log(`  1. 오늘 21:00 KST (= 12:00 UTC)에 자동 실행 대기`);
console.log(`  2. 실행 후 server.log 확인`);
console.log(`  3. message_dispatch_logs 조회`);
console.log(`     SELECT COUNT(*) FROM message_dispatch_logs`);
console.log(`     WHERE event_name='guardian_dispatch' AND DATE(created_at)=CURRENT_DATE;`);
console.log(`  4. 예상 결과: dry_run 상태로 N건 기록, SMS Sent = 0건`);

console.log('\n' + '═'.repeat(70));
if (allPass) {
  console.log('✅ 배포 검증 통과 — Phase 1 활성화 준비 완료');
} else {
  console.log('❌ 배포 검증 실패 — 위 조건을 확인하고 수정 후 재배포');
}
console.log('═'.repeat(70) + '\n');

process.exit(allPass ? 0 : 1);
