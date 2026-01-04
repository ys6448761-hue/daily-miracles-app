#!/usr/bin/env node
/**
 * Manifest 강제 재생성 스크립트
 * P5-3: Manifest Drift 방지 - 최후의 수단
 *
 * 사용법:
 *   node scripts/manifest-rebuild.js
 *   node scripts/manifest-rebuild.js --dry-run --log
 *   node scripts/manifest-rebuild.js --decisions-dir docs/decisions --out docs/manifest.json
 *
 * 옵션:
 *   --decisions-dir  스캔 대상 디렉토리 (기본: docs/decisions)
 *   --out            결과 저장 경로 (기본: docs/manifest.json)
 *   --dry-run        미리보기 (실제 저장 안 함)
 *   --rebuild-index  index.md도 재생성
 *   --log            NDJSON 로그 기록
 */

const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    decisionsDir: 'docs/decisions',
    out: 'docs/manifest.json',
    dryRun: false,
    rebuildIndex: false,
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--decisions-dir' && args[i + 1]) {
      result.decisionsDir = args[++i];
    } else if (arg.startsWith('--decisions-dir=')) {
      result.decisionsDir = arg.split('=').slice(1).join('=');
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=').slice(1).join('=');
    } else if (arg === '--dry-run') {
      result.dryRun = true;
    } else if (arg === '--rebuild-index') {
      result.rebuildIndex = true;
    } else if (arg === '--log') {
      result.log = true;
    }
  }

  return result;
}

/**
 * DEC 파일에서 메타데이터 추출
 */
function extractMetadata(filePath, fileName) {
  // 파일명 패턴: DEC-YYYY-MMDD-###_slug.md
  const pattern = /^DEC-(\d{4})-(\d{4})-(\d{3})(?:_(.+))?\.md$/;
  const match = fileName.match(pattern);

  if (!match) {
    return null;
  }

  const [, year, monthDay, seq, slug] = match;
  const date = `${year}-${monthDay.slice(0, 2)}-${monthDay.slice(2, 4)}`;
  const id = `DEC-${year}-${monthDay}-${seq}`;

  // 기본값
  let title = slug ? slug.replace(/_/g, ' ') : id;
  let approvedBy = '미정';

  // 파일 내용에서 추가 정보 추출
  try {
    const content = fs.readFileSync(filePath, 'utf-8');

    // 제목 추출
    const titleMatch = content.match(/\|\s*(?:제목|주제)\s*\|\s*(.+?)\s*\|/);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // 첫 번째 헤더에서 추출
      const headerMatch = content.match(/^#\s+(?:DEC-[\w-]+:\s*)?(.+)$/m);
      if (headerMatch) {
        title = headerMatch[1].trim();
      }
    }

    // 승인자 추출
    const approverMatch = content.match(/\|\s*승인자\s*\|\s*(.+?)\s*\|/);
    if (approverMatch) {
      approvedBy = approverMatch[1].trim();
    }

    // 날짜 추출 (파일 내용에서)
    const dateMatch = content.match(/\|\s*날짜\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|/);
    if (dateMatch) {
      // 파일 내용의 날짜가 더 정확할 수 있음
    }
  } catch (e) {
    // 파일 읽기 실패 시 기본값 사용
  }

  return {
    id,
    title,
    date,
    approved_by: approvedBy,
    path: `docs/decisions/${fileName}`
  };
}

/**
 * decisions 디렉토리 스캔
 */
function scanDecisions(decisionsDir) {
  const fullPath = path.join(__dirname, '..', decisionsDir);
  const decisions = [];

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ 디렉토리 없음: ${decisionsDir}`);
    return decisions;
  }

  const files = fs.readdirSync(fullPath);

  for (const file of files) {
    // DRAFT, index 제외
    if (file.includes('DRAFT') || file === 'index.md') {
      continue;
    }

    const filePath = path.join(fullPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && file.endsWith('.md')) {
      const metadata = extractMetadata(filePath, file);
      if (metadata) {
        decisions.push(metadata);
      }
    }
  }

  // 최신순 정렬
  decisions.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });

  return decisions;
}

/**
 * Index 재생성
 */
function rebuildIndex(decisions, indexPath) {
  const today = new Date().toISOString().slice(0, 10);

  // 날짜별 그룹화
  const byDate = {};
  for (const dec of decisions) {
    if (!byDate[dec.date]) {
      byDate[dec.date] = [];
    }
    byDate[dec.date].push(dec);
  }

  let md = `# Decisions Index

> 최신 승인된 결정문 목록 (자동 생성)
> 마지막 업데이트: ${today}

`;

  const dates = Object.keys(byDate).sort().reverse();
  for (const date of dates) {
    md += `## ${date}\n\n`;
    for (const dec of byDate[date]) {
      md += `- **${dec.id}** ${dec.title}\n`;
      md += `  - 승인자: ${dec.approved_by}\n`;
      md += `  - 경로: ${dec.path}\n\n`;
    }
  }

  return md;
}

/**
 * NDJSON 로그 기록
 */
function writeLog(decisionCount, dryRun, runtimeMs) {
  const logPath = path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson');
  const logDir = path.dirname(logPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'manifest_rebuild',
    decision_count: decisionCount,
    dry_run: dryRun,
    runtime_ms: runtimeMs
  };

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
Manifest 강제 재생성 (P5-3)

사용법:
  node scripts/manifest-rebuild.js [옵션]

옵션:
  --decisions-dir  스캔 대상 디렉토리 (기본: docs/decisions)
  --out            결과 저장 경로 (기본: docs/manifest.json)
  --dry-run        미리보기 (실제 저장 안 함)
  --rebuild-index  index.md도 재생성
  --log            NDJSON 로그 기록

예시:
  node scripts/manifest-rebuild.js --dry-run
  node scripts/manifest-rebuild.js --log
  node scripts/manifest-rebuild.js --rebuild-index --log
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
  const startTime = Date.now();

  console.log('🔄 Manifest 재생성 시작...');
  console.log(`   소스: ${options.decisionsDir}`);
  console.log(`   출력: ${options.out}`);
  console.log(`   Dry Run: ${options.dryRun}`);
  console.log('');

  // 1. decisions 스캔
  console.log('📂 DEC 파일 스캔 중...');
  const decisions = scanDecisions(options.decisionsDir);
  console.log(`   발견: ${decisions.length}개`);

  if (decisions.length === 0) {
    console.log('\n⚠️  DEC 파일이 없습니다.');
    return;
  }

  // 2. Manifest 생성
  const manifest = { decisions };

  // 미리보기 출력
  if (options.dryRun) {
    console.log('\n📋 생성될 Manifest (미리보기):');
    console.log('-'.repeat(50));
    decisions.slice(0, 5).forEach((dec, i) => {
      console.log(`  ${i + 1}) ${dec.id}: ${dec.title}`);
      console.log(`     승인자: ${dec.approved_by}, 날짜: ${dec.date}`);
    });
    if (decisions.length > 5) {
      console.log(`  ... 외 ${decisions.length - 5}개`);
    }
    console.log('-'.repeat(50));
  }

  // 3. 저장
  if (!options.dryRun) {
    const outPath = path.join(__dirname, '..', options.out);
    const outDir = path.dirname(outPath);

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2), 'utf-8');
    console.log(`\n✅ Manifest 저장됨: ${options.out}`);
  }

  // 4. Index 재생성 (옵션)
  if (options.rebuildIndex) {
    const indexContent = rebuildIndex(decisions, 'docs/decisions/index.md');

    if (options.dryRun) {
      console.log('\n📋 생성될 Index (미리보기, 상위 20줄):');
      console.log('-'.repeat(50));
      console.log(indexContent.split('\n').slice(0, 20).join('\n'));
      console.log('...');
      console.log('-'.repeat(50));
    } else {
      const indexPath = path.join(__dirname, '..', 'docs', 'decisions', 'index.md');
      fs.writeFileSync(indexPath, indexContent, 'utf-8');
      console.log(`✅ Index 저장됨: docs/decisions/index.md`);
    }
  }

  const runtimeMs = Date.now() - startTime;

  // 5. 요약
  console.log('\n' + '='.repeat(50));
  console.log(`✅ 완료: ${decisions.length}개 DEC 처리됨 (${runtimeMs}ms)`);
  if (options.dryRun) {
    console.log('   (Dry Run - 실제 저장되지 않음)');
  }
  console.log('='.repeat(50));

  // 6. 로그 기록
  if (options.log) {
    writeLog(decisions.length, options.dryRun, runtimeMs);
    console.log(`📊 로그 기록됨`);
  }
}

main();
