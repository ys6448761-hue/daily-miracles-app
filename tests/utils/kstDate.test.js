/**
 * kstDate.test.js — KST 날짜 유틸리티 테스트
 *
 * 핵심 시나리오: UTC 23:00~23:59 (KST 08:00~08:59) 경계 테스트
 */

const { getKSTDateString, getKSTYesterday } = require('../../utils/kstDate');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ ${name}`);
    failed++;
  }
}

console.log('\n═══ kstDate 유틸리티 테스트 ═══\n');

// 1. UTC 자정 → KST 09:00 (같은 날)
console.log('1. UTC 00:00 = KST 09:00');
{
  const d = new Date('2026-02-16T00:00:00Z');
  assert(getKSTDateString(d) === '2026-02-16', `KST today = 2026-02-16 (got ${getKSTDateString(d)})`);
  assert(getKSTYesterday(d) === '2026-02-15', `KST yesterday = 2026-02-15 (got ${getKSTYesterday(d)})`);
}

// 2. UTC 14:59 → KST 23:59 (같은 날)
console.log('\n2. UTC 14:59 = KST 23:59');
{
  const d = new Date('2026-02-16T14:59:00Z');
  assert(getKSTDateString(d) === '2026-02-16', `KST today = 2026-02-16 (got ${getKSTDateString(d)})`);
}

// 3. UTC 15:00 → KST 00:00 (다음 날!)
console.log('\n3. UTC 15:00 = KST 00:00 다음 날');
{
  const d = new Date('2026-02-16T15:00:00Z');
  assert(getKSTDateString(d) === '2026-02-17', `KST today = 2026-02-17 (got ${getKSTDateString(d)})`);
  assert(getKSTYesterday(d) === '2026-02-16', `KST yesterday = 2026-02-16 (got ${getKSTYesterday(d)})`);
}

// 4. UTC 15:01 → KST 00:01 (다음 날)
console.log('\n4. UTC 15:01 = KST 00:01 다음 날');
{
  const d = new Date('2026-02-16T15:01:00Z');
  assert(getKSTDateString(d) === '2026-02-17', `KST today = 2026-02-17 (got ${getKSTDateString(d)})`);
}

// 5. 월 경계: UTC 2026-02-28T15:00 → KST 2026-03-01 (윤년 아님 2026)
console.log('\n5. 월 경계: 2/28 UTC 15:00 → KST 3/1');
{
  const d = new Date('2026-02-28T15:00:00Z');
  assert(getKSTDateString(d) === '2026-03-01', `KST today = 2026-03-01 (got ${getKSTDateString(d)})`);
}

// 6. 연 경계: UTC 2026-12-31T15:00 → KST 2027-01-01
console.log('\n6. 연 경계: 12/31 UTC 15:00 → KST 1/1');
{
  const d = new Date('2026-12-31T15:00:00Z');
  assert(getKSTDateString(d) === '2027-01-01', `KST today = 2027-01-01 (got ${getKSTDateString(d)})`);
  assert(getKSTYesterday(d) === '2026-12-31', `KST yesterday = 2026-12-31 (got ${getKSTYesterday(d)})`);
}

// 7. DB DATE → KST 변환 (PostgreSQL DATE는 midnight UTC)
console.log('\n7. DB DATE 변환: 2026-02-16 (midnight UTC) → KST');
{
  const dbDate = new Date('2026-02-16'); // midnight UTC
  assert(getKSTDateString(dbDate) === '2026-02-16', `DB DATE→KST = 2026-02-16 (got ${getKSTDateString(dbDate)})`);
}

// 8. 기본 파라미터 테스트 (now 생략)
console.log('\n8. 기본 파라미터 (현재 시각)');
{
  const today = getKSTDateString();
  assert(typeof today === 'string', 'returns string');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(today), `YYYY-MM-DD format: ${today}`);
}

// 결과
console.log('\n═══════════════════════════════════════');
console.log(`  총 ${passed + failed}개 | ✅ ${passed} PASS | ❌ ${failed} FAIL`);
console.log('═══════════════════════════════════════\n');

if (failed > 0) process.exit(1);
