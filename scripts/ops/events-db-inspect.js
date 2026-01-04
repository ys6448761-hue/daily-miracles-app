#!/usr/bin/env node
/**
 * events-db-inspect.js
 *
 * 마케팅 이벤트 DB 조회/점검 스크립트
 * - 최근 N개 이벤트 조회
 * - 기간별 집계
 * - 이벤트 타입별 카운트
 *
 * Usage:
 *   node scripts/ops/events-db-inspect.js [command] [options]
 *
 * Commands:
 *   recent [N]          최근 N개 이벤트 (기본: 10)
 *   today               오늘 이벤트 목록
 *   count               전체 이벤트 타입별 카운트
 *   daily [N]           최근 N일 일별 집계 (기본: 7)
 *   search <keyword>    페이로드 검색
 *   help                도움말
 */

const path = require('path');

// DB 모듈 로드
let db;
try {
  db = require('../../database/db');
} catch (error) {
  console.error('❌ DB 연결 실패:', error.message);
  console.error('💡 DATABASE_URL 환경변수가 설정되어 있는지 확인하세요.');
  process.exit(1);
}

// ============ 유틸리티 ============

function formatDate(date) {
  if (!date) return '-';
  if (typeof date === 'string') return date;
  return date.toISOString().slice(0, 10);
}

function formatTimestamp(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
}

function truncate(str, len = 30) {
  if (!str) return '-';
  const s = String(str);
  return s.length > len ? s.slice(0, len) + '...' : s;
}

// ============ 명령어 핸들러 ============

/**
 * 최근 N개 이벤트 조회
 */
async function cmdRecent(n = 10) {
  const query = `
    SELECT id, event_type, event_date, timestamp, user_id, wish_id, source
    FROM marketing_events
    ORDER BY created_at DESC
    LIMIT $1
  `;

  const result = await db.query(query, [n]);

  console.log(`\n📋 최근 ${n}개 이벤트\n`);
  console.log('─'.repeat(100));
  console.log(
    'ID'.padEnd(6) +
    'Type'.padEnd(20) +
    'Date'.padEnd(12) +
    'Time'.padEnd(22) +
    'Source'.padEnd(15) +
    'User/Wish'
  );
  console.log('─'.repeat(100));

  for (const row of result.rows) {
    console.log(
      String(row.id).padEnd(6) +
      row.event_type.padEnd(20) +
      formatDate(row.event_date).padEnd(12) +
      formatTimestamp(row.timestamp).padEnd(22) +
      (row.source || '-').padEnd(15) +
      truncate(row.user_id || row.wish_id || '-', 25)
    );
  }

  console.log('─'.repeat(100));
  console.log(`총 ${result.rows.length}개 표시\n`);
}

/**
 * 오늘 이벤트 목록
 */
async function cmdToday() {
  const query = `
    SELECT id, event_type, timestamp, user_id, wish_id, payload, source
    FROM marketing_events
    WHERE event_date = CURRENT_DATE
    ORDER BY created_at DESC
  `;

  const result = await db.query(query);

  console.log(`\n📅 오늘 이벤트 (${new Date().toISOString().slice(0, 10)})\n`);

  if (result.rows.length === 0) {
    console.log('⚠️ 오늘 기록된 이벤트가 없습니다.\n');
    return;
  }

  console.log('─'.repeat(90));
  console.log(
    'ID'.padEnd(6) +
    'Type'.padEnd(20) +
    'Time'.padEnd(10) +
    'Source'.padEnd(18) +
    'Details'
  );
  console.log('─'.repeat(90));

  for (const row of result.rows) {
    const time = new Date(row.timestamp).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' });
    const details = row.user_id || row.wish_id || (row.payload?.checkout_id) || '-';

    console.log(
      String(row.id).padEnd(6) +
      row.event_type.padEnd(20) +
      time.padEnd(10) +
      (row.source || '-').padEnd(18) +
      truncate(details, 30)
    );
  }

  console.log('─'.repeat(90));
  console.log(`총 ${result.rows.length}건\n`);
}

/**
 * 이벤트 타입별 전체 카운트
 */
async function cmdCount() {
  const query = `
    SELECT
      event_type,
      COUNT(*) as total,
      COUNT(CASE WHEN event_date = CURRENT_DATE THEN 1 END) as today,
      COUNT(CASE WHEN event_date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as week
    FROM marketing_events
    GROUP BY event_type
    ORDER BY total DESC
  `;

  const result = await db.query(query);

  // 전체 합계
  const totalQuery = `SELECT COUNT(*) as total FROM marketing_events`;
  const totalResult = await db.query(totalQuery);

  console.log('\n📊 이벤트 타입별 카운트\n');
  console.log('─'.repeat(60));
  console.log(
    'Event Type'.padEnd(25) +
    'Today'.padStart(8) +
    '7 Days'.padStart(10) +
    'Total'.padStart(10)
  );
  console.log('─'.repeat(60));

  let todaySum = 0;
  let weekSum = 0;

  for (const row of result.rows) {
    todaySum += parseInt(row.today);
    weekSum += parseInt(row.week);

    console.log(
      row.event_type.padEnd(25) +
      String(row.today).padStart(8) +
      String(row.week).padStart(10) +
      String(row.total).padStart(10)
    );
  }

  console.log('─'.repeat(60));
  console.log(
    '합계'.padEnd(25) +
    String(todaySum).padStart(8) +
    String(weekSum).padStart(10) +
    String(totalResult.rows[0].total).padStart(10)
  );
  console.log('─'.repeat(60) + '\n');
}

/**
 * 최근 N일 일별 집계
 */
async function cmdDaily(days = 7) {
  const query = `
    SELECT event_date, event_type, COUNT(*) as count
    FROM marketing_events
    WHERE event_date >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY event_date, event_type
    ORDER BY event_date DESC, event_type
  `;

  const result = await db.query(query);

  // 날짜별 그룹화
  const byDate = {};
  for (const row of result.rows) {
    const date = formatDate(row.event_date);
    if (!byDate[date]) byDate[date] = {};
    byDate[date][row.event_type] = parseInt(row.count);
  }

  console.log(`\n📈 최근 ${days}일 일별 집계\n`);
  console.log('─'.repeat(85));
  console.log(
    'Date'.padEnd(12) +
    'trial'.padStart(8) +
    'initiate'.padStart(10) +
    'abandon'.padStart(10) +
    'complete'.padStart(10) +
    'day3'.padStart(8) +
    'Total'.padStart(10)
  );
  console.log('─'.repeat(85));

  const dates = Object.keys(byDate).sort().reverse();

  for (const date of dates) {
    const d = byDate[date];
    const trial = d.trial_start || 0;
    const initiate = d.checkout_initiate || 0;
    const abandon = d.checkout_abandon || 0;
    const complete = d.checkout_complete || 0;
    const day3 = d.day3_inactive || 0;
    const total = trial + initiate + abandon + complete + day3;

    console.log(
      date.padEnd(12) +
      String(trial).padStart(8) +
      String(initiate).padStart(10) +
      String(abandon).padStart(10) +
      String(complete).padStart(10) +
      String(day3).padStart(8) +
      String(total).padStart(10)
    );
  }

  console.log('─'.repeat(85) + '\n');
}

/**
 * 페이로드 검색
 */
async function cmdSearch(keyword) {
  if (!keyword) {
    console.error('❌ 검색어를 입력하세요.');
    return;
  }

  const query = `
    SELECT id, event_type, event_date, timestamp, payload
    FROM marketing_events
    WHERE payload::text ILIKE $1
    ORDER BY created_at DESC
    LIMIT 20
  `;

  const result = await db.query(query, [`%${keyword}%`]);

  console.log(`\n🔍 검색: "${keyword}"\n`);

  if (result.rows.length === 0) {
    console.log('⚠️ 검색 결과가 없습니다.\n');
    return;
  }

  for (const row of result.rows) {
    console.log('─'.repeat(60));
    console.log(`ID: ${row.id} | ${row.event_type} | ${formatDate(row.event_date)}`);
    console.log(JSON.stringify(row.payload, null, 2));
  }

  console.log('─'.repeat(60));
  console.log(`\n${result.rows.length}건 검색됨\n`);
}

/**
 * 도움말
 */
function cmdHelp() {
  console.log(`
📊 마케팅 이벤트 DB 점검 도구

Usage:
  node scripts/ops/events-db-inspect.js [command] [options]

Commands:
  recent [N]          최근 N개 이벤트 조회 (기본: 10)
  today               오늘 이벤트 목록
  count               이벤트 타입별 전체 카운트
  daily [N]           최근 N일 일별 집계 (기본: 7)
  search <keyword>    페이로드 검색
  help                이 도움말

Examples:
  node scripts/ops/events-db-inspect.js recent 20
  node scripts/ops/events-db-inspect.js today
  node scripts/ops/events-db-inspect.js count
  node scripts/ops/events-db-inspect.js daily 14
  node scripts/ops/events-db-inspect.js search checkout
`);
}

// ============ 메인 ============

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const param = args[1];

  try {
    switch (command) {
      case 'recent':
        await cmdRecent(parseInt(param) || 10);
        break;
      case 'today':
        await cmdToday();
        break;
      case 'count':
        await cmdCount();
        break;
      case 'daily':
        await cmdDaily(parseInt(param) || 7);
        break;
      case 'search':
        await cmdSearch(param);
        break;
      case 'help':
      case '-h':
      case '--help':
        cmdHelp();
        break;
      default:
        console.error(`❌ 알 수 없는 명령: ${command}`);
        cmdHelp();
        break;
    }
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  } finally {
    // DB 연결 종료
    if (db.pool) {
      await db.pool.end();
    }
  }
}

main();
