#!/usr/bin/env node
/**
 * Search Telemetry 리포트 생성
 * P4-3: 검색/요약 사용량 분석 및 Top Docs 승격
 *
 * 사용법:
 *   node scripts/log-report.js --in artifacts/search_logs.ndjson --out artifacts/log_report.md
 *   node scripts/log-report.js --in artifacts/search_logs.ndjson  # stdout 출력
 *   node scripts/log-report.js --days 7  # 최근 7일만
 *
 * 옵션:
 *   --in    로그 파일 경로 (기본: artifacts/search_logs.ndjson)
 *   --out   리포트 출력 경로 (선택)
 *   --days  분석 기간 (기본: 7일)
 *   --top   상위 개수 (기본: 10)
 */

const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    in: path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson'),
    out: null,
    days: 7,
    top: 10
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--in' && args[i + 1]) {
      result.in = args[++i];
    } else if (arg.startsWith('--in=')) {
      result.in = arg.split('=').slice(1).join('=');
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=').slice(1).join('=');
    } else if (arg === '--days' && args[i + 1]) {
      result.days = parseInt(args[++i]) || 7;
    } else if (arg.startsWith('--days=')) {
      result.days = parseInt(arg.split('=')[1]) || 7;
    } else if (arg === '--top' && args[i + 1]) {
      result.top = parseInt(args[++i]) || 10;
    } else if (arg.startsWith('--top=')) {
      result.top = parseInt(arg.split('=')[1]) || 10;
    }
  }

  return result;
}

/**
 * NDJSON 로그 파일 로드
 */
function loadLogs(logPath, days) {
  if (!fs.existsSync(logPath)) {
    return [];
  }

  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.trim().split('\n').filter(l => l.trim());

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const logs = [];
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      const entryDate = new Date(entry.timestamp);

      if (entryDate >= cutoffDate) {
        logs.push(entry);
      }
    } catch (e) {
      // 파싱 실패한 줄은 무시
    }
  }

  return logs;
}

/**
 * 통계 분석
 */
function analyzeStats(logs, topN) {
  const stats = {
    totalSearches: 0,
    totalSummarizes: 0,
    avgRuntimeSearch: 0,
    avgRuntimeSummarize: 0,
    queryFrequency: {},
    docFrequency: {},
    scopeFrequency: {},
    modeFrequency: {},
    llmUsage: { used: 0, notUsed: 0 }
  };

  let searchRuntimes = [];
  let summarizeRuntimes = [];

  for (const log of logs) {
    // 타입별 카운트
    if (log.type === 'search') {
      stats.totalSearches++;
      if (log.runtime_ms) searchRuntimes.push(log.runtime_ms);
    } else if (log.type === 'summarize') {
      stats.totalSummarizes++;
      if (log.runtime_ms) summarizeRuntimes.push(log.runtime_ms);
      if (log.used_llm) stats.llmUsage.used++;
      else stats.llmUsage.notUsed++;
    }

    // 쿼리 빈도
    if (log.query) {
      const q = log.query.toLowerCase().trim();
      stats.queryFrequency[q] = (stats.queryFrequency[q] || 0) + 1;
    }

    // 문서 빈도 (top_results)
    if (log.top_results) {
      for (const docPath of log.top_results) {
        stats.docFrequency[docPath] = (stats.docFrequency[docPath] || 0) + 1;
      }
    }

    // 스코프 빈도
    if (log.scopes) {
      for (const scope of log.scopes) {
        stats.scopeFrequency[scope] = (stats.scopeFrequency[scope] || 0) + 1;
      }
    }

    // 모드 빈도 (summarize)
    if (log.mode) {
      stats.modeFrequency[log.mode] = (stats.modeFrequency[log.mode] || 0) + 1;
    }
  }

  // 평균 런타임
  if (searchRuntimes.length > 0) {
    stats.avgRuntimeSearch = Math.round(
      searchRuntimes.reduce((a, b) => a + b, 0) / searchRuntimes.length
    );
  }
  if (summarizeRuntimes.length > 0) {
    stats.avgRuntimeSummarize = Math.round(
      summarizeRuntimes.reduce((a, b) => a + b, 0) / summarizeRuntimes.length
    );
  }

  // Top N 정렬
  stats.topQueries = Object.entries(stats.queryFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  stats.topDocs = Object.entries(stats.docFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  stats.topScopes = Object.entries(stats.scopeFrequency)
    .sort((a, b) => b[1] - a[1]);

  stats.topModes = Object.entries(stats.modeFrequency)
    .sort((a, b) => b[1] - a[1]);

  return stats;
}

/**
 * Markdown 리포트 생성
 */
function generateReport(stats, options, logCount) {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const generated = kstTime.toISOString().slice(0, 16).replace('T', ' ') + ' KST';

  let md = `# Search Telemetry Report

## 리포트 정보
- **생성일**: ${generated}
- **분석 기간**: 최근 ${options.days}일
- **총 로그 수**: ${logCount}개

---

## 요약 통계

| 항목 | 값 |
|------|-----|
| 검색 횟수 | ${stats.totalSearches} |
| 요약 횟수 | ${stats.totalSummarizes} |
| 평균 검색 시간 | ${stats.avgRuntimeSearch}ms |
| 평균 요약 시간 | ${stats.avgRuntimeSummarize}ms |
| LLM 사용률 | ${stats.llmUsage.used}/${stats.llmUsage.used + stats.llmUsage.notUsed} (${Math.round(stats.llmUsage.used / Math.max(1, stats.llmUsage.used + stats.llmUsage.notUsed) * 100)}%) |

---

## Top ${options.top} 검색 쿼리

| 순위 | 쿼리 | 횟수 |
|------|------|------|
`;

  stats.topQueries.forEach(([query, count], idx) => {
    md += `| ${idx + 1} | ${query} | ${count} |\n`;
  });

  if (stats.topQueries.length === 0) {
    md += `| - | (데이터 없음) | - |\n`;
  }

  md += `
---

## Top ${options.top} 참조 문서 (승격 후보)

| 순위 | 문서 경로 | 참조 횟수 |
|------|----------|----------|
`;

  stats.topDocs.forEach(([docPath, count], idx) => {
    const shortPath = docPath.length > 50 ? '...' + docPath.slice(-47) : docPath;
    md += `| ${idx + 1} | \`${shortPath}\` | ${count} |\n`;
  });

  if (stats.topDocs.length === 0) {
    md += `| - | (데이터 없음) | - |\n`;
  }

  md += `
---

## 스코프별 사용량

| 스코프 | 사용 횟수 |
|--------|----------|
`;

  stats.topScopes.forEach(([scope, count]) => {
    md += `| ${scope} | ${count} |\n`;
  });

  if (stats.topScopes.length === 0) {
    md += `| - | (데이터 없음) |\n`;
  }

  md += `
---

## 모드별 사용량 (요약)

| 모드 | 사용 횟수 |
|------|----------|
`;

  stats.topModes.forEach(([mode, count]) => {
    md += `| ${mode} | ${count} |\n`;
  });

  if (stats.topModes.length === 0) {
    md += `| - | (데이터 없음) |\n`;
  }

  md += `
---

## 권장 액션

`;

  // 권장 액션 생성
  if (stats.topDocs.length > 0) {
    md += `### 문서 승격 후보\n`;
    md += `다음 문서들이 자주 참조되므로 "우선 참고 문서"로 승격을 고려하세요:\n\n`;
    stats.topDocs.slice(0, 3).forEach(([docPath, count]) => {
      md += `- \`${docPath}\` (${count}회 참조)\n`;
    });
    md += '\n';
  }

  if (stats.topQueries.length > 0) {
    md += `### 자주 검색되는 주제\n`;
    md += `다음 주제에 대한 문서 품질 개선을 고려하세요:\n\n`;
    stats.topQueries.slice(0, 3).forEach(([query, count]) => {
      md += `- "${query}" (${count}회 검색)\n`;
    });
    md += '\n';
  }

  md += `---

*이 리포트는 \`node scripts/log-report.js\`로 생성되었습니다.*
`;

  return md;
}

/**
 * 결과 저장
 */
function saveOutput(content, outPath) {
  const fullPath = path.resolve(outPath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
Search Telemetry 리포트 (P4-3)

사용법:
  node scripts/log-report.js [옵션]

옵션:
  --in    로그 파일 경로 (기본: artifacts/search_logs.ndjson)
  --out   리포트 출력 경로 (선택, 없으면 stdout)
  --days  분석 기간 (기본: 7일)
  --top   상위 개수 (기본: 10)

예시:
  node scripts/log-report.js
  node scripts/log-report.js --out artifacts/log_report.md
  node scripts/log-report.js --days 30 --top 20
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

  // 로그 로드
  console.log(`📊 로그 로드: ${options.in}`);
  const logs = loadLogs(options.in, options.days);
  console.log(`   ${logs.length}개 로그 (최근 ${options.days}일)`);

  if (logs.length === 0) {
    console.log('\n⚠️  분석할 로그가 없습니다.');
    console.log('   먼저 --log 옵션으로 검색/요약을 실행하세요:');
    console.log('   node scripts/search-docs.js --query "검색어" --log');
    return;
  }

  // 분석
  console.log('🔍 분석 중...');
  const stats = analyzeStats(logs, options.top);

  // 리포트 생성
  const report = generateReport(stats, options, logs.length);

  // 출력
  if (options.out) {
    const savedPath = saveOutput(report, options.out);
    console.log(`\n✅ 리포트 저장됨: ${savedPath}`);
  } else {
    console.log('\n' + report);
  }
}

main();
