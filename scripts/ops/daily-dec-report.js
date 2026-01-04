#!/usr/bin/env node
/**
 * Daily DEC 리포트 생성 스크립트
 * P6-3: DRAFT 및 실행 결과를 모아 리포트 생성
 *
 * 사용법:
 *   node scripts/ops/daily-dec-report.js
 *   node scripts/ops/daily-dec-report.js --date 20260105
 *   node scripts/ops/daily-dec-report.js --out artifacts/reports/custom-report.md
 *
 * 옵션:
 *   --date    리포트 대상 날짜 (기본: 오늘, YYYYMMDD 형식)
 *   --out     출력 파일 경로 (기본: artifacts/reports/daily-dec-report-YYYYMMDD.md)
 *   --log     텔레메트리 로그 기록
 */

const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    date: null,
    out: null,
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--date' && args[i + 1]) {
      result.date = args[++i];
    } else if (arg.startsWith('--date=')) {
      result.date = arg.split('=')[1];
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=').slice(1).join('=');
    } else if (arg === '--log') {
      result.log = true;
    }
  }

  return result;
}

/**
 * 오늘 날짜 YYYYMMDD 형식
 */
function getTodayStr() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * YYYYMMDD → YYYY-MM-DD 변환
 */
function formatDateStr(dateStr) {
  if (dateStr.length !== 8) return dateStr;
  return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
}

/**
 * Nightly 실행 결과 로드
 */
function loadNightlyRun(dateStr) {
  const reportPath = path.join(__dirname, '..', '..', 'artifacts', 'reports', `nightly-run-${dateStr}.json`);

  if (!fs.existsSync(reportPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(reportPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * 오늘 생성된 DRAFT 파일 수집
 */
function collectTodayDrafts(dateStr) {
  const decisionsDir = path.join(__dirname, '..', '..', 'docs', 'decisions');
  const drafts = [];

  if (!fs.existsSync(decisionsDir)) {
    return drafts;
  }

  const files = fs.readdirSync(decisionsDir);
  // DEC-DRAFT-YYYYMMDD-HHMM_xxx.md 형태
  const pattern = new RegExp(`^DEC-DRAFT-${dateStr}-(\\d{4})_(.+)\\.md$`);

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const [, time, slug] = match;
      const filePath = path.join(decisionsDir, file);
      const stats = fs.statSync(filePath);

      // 파일에서 쿼리 추출 시도
      let query = slug.replace(/_/g, ' ');
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const queryMatch = content.match(/\|\s*주제\s*\|\s*(.+?)\s*\|/);
        if (queryMatch) {
          query = queryMatch[1].trim();
        }
      } catch (e) {
        // 무시
      }

      drafts.push({
        file,
        path: `docs/decisions/${file}`,
        time: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
        slug,
        query,
        createdAt: stats.mtime.toISOString()
      });
    }
  }

  // 시간순 정렬
  drafts.sort((a, b) => a.time.localeCompare(b.time));

  return drafts;
}

/**
 * 승인 대기 TOP3 추천
 */
function getTopRecommendations(drafts, nightlyRun) {
  // 우선순위: high > medium > low, 최신순
  const priorities = { high: 3, medium: 2, low: 1 };

  // nightly 결과에서 priority 정보 가져오기
  const priorityMap = {};
  if (nightlyRun && nightlyRun.items) {
    for (const item of nightlyRun.items) {
      if (item.draftPath) {
        const basename = path.basename(item.draftPath);
        priorityMap[basename] = item.priority || 'medium';
      }
    }
  }

  // 점수 계산
  const scored = drafts.map(d => ({
    ...d,
    priority: priorityMap[d.file] || 'medium',
    score: priorities[priorityMap[d.file] || 'medium'] || 2
  }));

  // 점수 내림차순, 시간 내림차순
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.time.localeCompare(a.time);
  });

  return scored.slice(0, 3);
}

/**
 * 마크다운 리포트 생성
 */
function generateReport(dateStr, drafts, nightlyRun, failedItems) {
  const formattedDate = formatDateStr(dateStr);
  const now = new Date().toISOString();

  let md = `# Daily DEC Report - ${formattedDate}

> 생성 시간: ${now}

---

## 1. 오늘 생성된 DRAFT 목록

`;

  if (drafts.length === 0) {
    md += `> 오늘 생성된 DRAFT가 없습니다.\n\n`;
  } else {
    md += `| # | 파일명 | 쿼리 | 생성시간 |
|---|--------|------|----------|
`;
    drafts.forEach((d, idx) => {
      md += `| ${idx + 1} | ${d.file} | ${d.query} | ${d.time} |\n`;
    });
    md += '\n';
  }

  md += `---

## 2. 실패한 쿼리 목록

`;

  if (failedItems.length === 0) {
    md += `> 실패한 쿼리가 없습니다.\n\n`;
  } else {
    md += `| # | 쿼리 ID | 쿼리 | 에러 요약 |
|---|---------|------|-----------|
`;
    failedItems.forEach((item, idx) => {
      const errorSummary = (item.error || 'Unknown error').slice(0, 100).replace(/\n/g, ' ');
      md += `| ${idx + 1} | ${item.id} | ${item.query} | ${errorSummary} |\n`;
    });
    md += '\n';
  }

  md += `---

## 3. 승인 대기 추천 TOP3

`;

  const top3 = getTopRecommendations(drafts, nightlyRun);

  if (top3.length === 0) {
    md += `> 추천할 DRAFT가 없습니다.\n\n`;
  } else {
    top3.forEach((d, idx) => {
      md += `### ${idx + 1}. ${d.query}

- **파일**: \`${d.path}\`
- **우선순위**: ${d.priority}
- **생성시간**: ${d.time}

`;
    });
  }

  md += `---

## 4. 승인 커맨드 (복붙용)

`;

  if (drafts.length === 0) {
    md += `> 승인할 DRAFT가 없습니다.\n\n`;
  } else {
    md += `\`\`\`bash
# 개별 DRAFT 승인
`;
    drafts.forEach(d => {
      md += `node scripts/debate-trigger.js --query "${d.query}" --generate-dec-draft --promote --decider "푸르미르" --delete-draft --log\n`;
    });
    md += `
# 또는 dec-approve.js 직접 사용
`;
    drafts.forEach(d => {
      md += `node scripts/dec-approve.js --in "${d.path}" --decider "푸르미르" --delete --log\n`;
    });
    md += `\`\`\`

`;
  }

  md += `---

## 5. Nightly 실행 통계

`;

  if (nightlyRun) {
    md += `| 항목 | 값 |
|------|-----|
| 실행 날짜 | ${nightlyRun.runDate} |
| 총 쿼리 | ${nightlyRun.totalQueries}개 |
| 성공 | ${nightlyRun.successCount}개 |
| 실패 | ${nightlyRun.failureCount}개 |
| 소요시간 | ${nightlyRun.totalRuntimeMs}ms |

`;
  } else {
    md += `> Nightly 실행 결과를 찾을 수 없습니다.\n\n`;
  }

  md += `---

*이 리포트는 \`scripts/ops/daily-dec-report.js\`로 자동 생성되었습니다.*
`;

  return md;
}

/**
 * 텔레메트리 로그 기록
 */
function writeLog(dateStr, draftCount, failedCount, outputPath) {
  const logPath = path.join(__dirname, '..', '..', 'artifacts', 'search_logs.ndjson');
  const logDir = path.dirname(logPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'daily_dec_report',
    date: dateStr,
    draft_count: draftCount,
    failed_count: failedCount,
    output_path: outputPath
  };

  try {
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
  } catch (e) {
    // 로그 실패는 무시
  }
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
Daily DEC 리포트 생성 스크립트 (P6-3)
DRAFT 및 실행 결과를 모아 리포트 생성

사용법:
  node scripts/ops/daily-dec-report.js [옵션]

옵션:
  --date    리포트 대상 날짜 (기본: 오늘, YYYYMMDD 형식)
  --out     출력 파일 경로 (기본: artifacts/reports/daily-dec-report-YYYYMMDD.md)
  --log     텔레메트리 로그 기록

예시:
  node scripts/ops/daily-dec-report.js
  node scripts/ops/daily-dec-report.js --date 20260105
  node scripts/ops/daily-dec-report.js --out artifacts/reports/custom-report.md --log
`);
}

/**
 * 메인 실행
 */
function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseArgs(args);
  const dateStr = options.date || getTodayStr();
  const outputPath = options.out || `artifacts/reports/daily-dec-report-${dateStr}.md`;

  console.log('');
  console.log('📊 Daily DEC 리포트 생성');
  console.log(`   날짜: ${formatDateStr(dateStr)}`);
  console.log(`   출력: ${outputPath}`);
  console.log('');

  // 데이터 수집
  console.log('📥 데이터 수집 중...');

  const nightlyRun = loadNightlyRun(dateStr);
  if (nightlyRun) {
    console.log(`   ✅ Nightly 실행 결과 로드됨`);
  } else {
    console.log(`   ⚠️  Nightly 실행 결과 없음`);
  }

  const drafts = collectTodayDrafts(dateStr);
  console.log(`   ✅ DRAFT 파일: ${drafts.length}개`);

  // 실패 항목 추출
  const failedItems = nightlyRun
    ? nightlyRun.items.filter(item => item.status === 'failed')
    : [];
  console.log(`   ✅ 실패 쿼리: ${failedItems.length}개`);

  // 리포트 생성
  console.log('');
  console.log('📝 리포트 생성 중...');

  const report = generateReport(dateStr, drafts, nightlyRun, failedItems);

  // 저장
  const fullPath = path.resolve(outputPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, report, 'utf-8');
  console.log(`   ✅ 저장됨: ${fullPath}`);

  // 로그 기록
  if (options.log) {
    writeLog(dateStr, drafts.length, failedItems.length, outputPath);
    console.log('   📊 로그 기록됨');
  }

  console.log('');
  console.log('='.repeat(50));
  console.log('✅ Daily 리포트 생성 완료');
  console.log('='.repeat(50));
  console.log(`   DRAFT: ${drafts.length}개`);
  console.log(`   실패: ${failedItems.length}개`);
  console.log(`   출력: ${outputPath}`);
  console.log('');
}

main();
