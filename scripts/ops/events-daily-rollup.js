#!/usr/bin/env node
/**
 * events-daily-rollup.js
 *
 * 일별 마케팅 이벤트 집계 스크립트
 * - DB 우선 조회 (PostgreSQL marketing_events)
 * - DB 실패 시 artifacts/events.ndjson 폴백
 *
 * Usage:
 *   node scripts/ops/events-daily-rollup.js [options]
 *
 * Options:
 *   --date <YYYY-MM-DD>   특정 날짜만 집계 (기본: 오늘)
 *   --range <N>           최근 N일 집계 (기본: 1)
 *   --from <YYYY-MM-DD>   시작일 (--to와 함께 사용)
 *   --to <YYYY-MM-DD>     종료일 (--from과 함께 사용)
 *   --out <path>          출력 파일 경로 (확장자로 형식 결정: .json/.md)
 *   --json                JSON 형식 출력
 *   --help                도움말
 */

const fs = require('fs');
const path = require('path');

// eventLogger 모듈 로드 (DB 우선 조회 지원)
const eventLogger = require('../../services/eventLogger');

// ============ 유틸리티 ============

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    date: null,
    range: 1,
    from: null,
    to: null,
    out: null,
    json: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--date':
        options.date = args[++i];
        break;
      case '--range':
        options.range = parseInt(args[++i], 10) || 1;
        break;
      case '--from':
        options.from = args[++i];
        break;
      case '--to':
        options.to = args[++i];
        break;
      case '--out':
        options.out = args[++i];
        break;
      case '--json':
        options.json = true;
        break;
      case '--help':
      case '-h':
        console.log(`
일별 마케팅 이벤트 집계 스크립트 (DB 우선)

Usage:
  node scripts/ops/events-daily-rollup.js [options]

Options:
  --date <YYYY-MM-DD>   특정 날짜만 집계 (기본: 오늘)
  --range <N>           최근 N일 집계 (기본: 1)
  --from <YYYY-MM-DD>   시작일 (--to와 함께 사용)
  --to <YYYY-MM-DD>     종료일 (--from과 함께 사용)
  --out <path>          출력 파일 경로 (확장자로 형식 결정: .json/.md)
  --json                JSON 형식 콘솔 출력
  --help                도움말

Examples:
  node scripts/ops/events-daily-rollup.js                  # 오늘 집계
  node scripts/ops/events-daily-rollup.js --range 7        # 최근 7일
  node scripts/ops/events-daily-rollup.js --from 2026-01-01 --to 2026-01-05
  node scripts/ops/events-daily-rollup.js --out artifacts/reports/daily-events.md

Data Source:
  1. PostgreSQL marketing_events 테이블 (우선)
  2. artifacts/events.ndjson 파일 (폴백)
`);
        process.exit(0);
    }
  }

  return options;
}

function getDateRange(options) {
  if (options.date) {
    return { from: options.date, to: options.date };
  }

  if (options.from && options.to) {
    return { from: options.from, to: options.to };
  }

  // 최근 N일
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - options.range + 1);

  return {
    from: startDate.toISOString().slice(0, 10),
    to: endDate.toISOString().slice(0, 10)
  };
}

// ============ 출력 포맷 ============

function getEventLabel(event) {
  const labels = {
    trial_start: '🆓 무료 체험 시작',
    day3_inactive: '⏰ 3일째 비활성',
    checkout_initiate: '🛒 체크아웃 시작',
    checkout_abandon: '🚪 체크아웃 이탈',
    checkout_complete: '✅ 결제 완료'
  };
  return labels[event] || event;
}

function formatMarkdown(stats) {
  const lines = [
    `# 📊 마케팅 이벤트 일별 집계`,
    ``,
    `> 기간: ${stats.dateFrom} ~ ${stats.dateTo}`,
    `> 생성: ${new Date().toLocaleString('ko-KR')}`,
    `> 소스: ${stats.source || 'unknown'}`,
    ``,
    `## 요약`,
    ``,
    `| 이벤트 | 건수 |`,
    `|--------|------|`
  ];

  for (const [event, count] of Object.entries(stats.totals)) {
    const label = getEventLabel(event);
    lines.push(`| ${label} | ${count} |`);
  }

  lines.push(`| **합계** | **${stats.totalEvents}** |`);
  lines.push(``);

  // 날짜별 상세
  const dates = Object.keys(stats.byDate).sort();
  if (dates.length > 0) {
    lines.push(`## 날짜별 상세`);
    lines.push(``);
    lines.push(`| 날짜 | trial | initiate | abandon | complete | day3 | 합계 |`);
    lines.push(`|------|-------|----------|---------|----------|------|------|`);

    for (const date of dates) {
      const d = stats.byDate[date];
      const sum = Object.values(d).reduce((a, b) => a + b, 0);
      lines.push(`| ${date} | ${d.trial_start || 0} | ${d.checkout_initiate || 0} | ${d.checkout_abandon || 0} | ${d.checkout_complete || 0} | ${d.day3_inactive || 0} | ${sum} |`);
    }
    lines.push(``);
  }

  return lines.join('\n');
}

function formatConsole(stats) {
  console.log('\n📊 마케팅 이벤트 일별 집계\n');
  console.log(`기간: ${stats.dateFrom} ~ ${stats.dateTo}`);
  console.log(`소스: ${stats.source || 'unknown'}`);
  console.log('─'.repeat(60));
  console.log('\n요약:');

  for (const [event, count] of Object.entries(stats.totals)) {
    const label = getEventLabel(event);
    console.log(`  ${label}: ${count}건`);
  }

  console.log(`\n  📌 총 이벤트: ${stats.totalEvents}건`);
  console.log('─'.repeat(60));

  const dates = Object.keys(stats.byDate).sort();
  if (dates.length > 0) {
    console.log('\n날짜별 상세:');
    console.log('  날짜         | trial | init  | abandon | complete | day3 | 합계');
    console.log('  ' + '-'.repeat(65));

    for (const date of dates) {
      const d = stats.byDate[date];
      const sum = Object.values(d).reduce((a, b) => a + b, 0);
      const row = [
        date,
        String(d.trial_start || 0).padStart(5),
        String(d.checkout_initiate || 0).padStart(5),
        String(d.checkout_abandon || 0).padStart(7),
        String(d.checkout_complete || 0).padStart(8),
        String(d.day3_inactive || 0).padStart(4),
        String(sum).padStart(4)
      ];
      console.log(`  ${row.join(' | ')}`);
    }
  }

  console.log('');
}

// ============ 메인 ============

async function main() {
  const options = parseArgs();
  const { from, to } = getDateRange(options);

  console.error(`📅 조회 기간: ${from} ~ ${to}`);

  // 집계 수행 (async - DB 우선 조회)
  const stats = await eventLogger.getRangeStats(from, to);

  // 소스 표시 추가
  if (stats.byDate && Object.keys(stats.byDate).length > 0) {
    const firstEvent = Object.values(stats.byDate)[0];
    stats.source = 'DB (PostgreSQL)';
  } else {
    stats.source = 'File (events.ndjson)';
  }

  // 출력
  if (options.out) {
    const ext = path.extname(options.out).toLowerCase();
    const outputPath = path.resolve(options.out);

    // 디렉토리 확인
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (ext === '.json') {
      fs.writeFileSync(outputPath, JSON.stringify(stats, null, 2), 'utf-8');
    } else {
      fs.writeFileSync(outputPath, formatMarkdown(stats), 'utf-8');
    }

    console.error(`✅ 리포트 저장: ${outputPath}`);
  } else if (options.json) {
    console.log(JSON.stringify(stats, null, 2));
  } else {
    formatConsole(stats);
  }
}

main().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
