#!/usr/bin/env node
/**
 * Nightly DEC 후보 생성 스크립트
 * P6-3: 쿼리 목록을 순회하며 DRAFT 생성
 *
 * 사용법:
 *   node scripts/ops/nightly-dec-candidates.js
 *   node scripts/ops/nightly-dec-candidates.js --config configs/dec-queries.json
 *   node scripts/ops/nightly-dec-candidates.js --dry-run
 *
 * 옵션:
 *   --config    쿼리 설정 파일 경로 (기본: configs/dec-queries.json)
 *   --dry-run   실제 실행 없이 계획만 출력
 *   --log       텔레메트리 로그 기록
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    config: 'configs/dec-queries.json',
    dryRun: false,
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--config' && args[i + 1]) {
      result.config = args[++i];
    } else if (arg.startsWith('--config=')) {
      result.config = arg.split('=').slice(1).join('=');
    } else if (arg === '--dry-run') {
      result.dryRun = true;
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
 * 쿼리 설정 로드
 */
function loadConfig(configPath) {
  const fullPath = path.resolve(configPath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`설정 파일을 찾을 수 없습니다: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(content);
}

/**
 * debate-trigger.js 실행
 */
function runDebateTrigger(query, defaults, shouldLog) {
  const scriptPath = path.join(__dirname, '..', 'debate-trigger.js');

  const args = [
    scriptPath,
    '--query', query.query,
    '--scopes', query.scopes || defaults.scopes || 'all',
    '--mode', query.mode || defaults.mode || 'decision',
    '--k', String(query.k || defaults.k || 5),
    '--generate-dec-draft'
  ];

  if (shouldLog || defaults.log) {
    args.push('--log');
  }

  const startTime = Date.now();
  const result = spawnSync('node', args, {
    cwd: path.join(__dirname, '..', '..'),
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe'],
    timeout: 60000 // 1분 타임아웃
  });

  const runtimeMs = Date.now() - startTime;

  // 생성된 DRAFT 경로 파싱
  const stdout = result.stdout || '';
  const pathMatch = stdout.match(/DRAFT 생성:\s*(.+\.md)/);
  const draftPath = pathMatch ? pathMatch[1].trim() : null;

  return {
    success: result.status === 0,
    draftPath,
    runtimeMs,
    error: result.status !== 0 ? (result.stderr || 'Unknown error') : null
  };
}

/**
 * 결과 저장
 */
function saveReport(results, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
  return outputPath;
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
Nightly DEC 후보 생성 스크립트 (P6-3)
쿼리 목록을 순회하며 DRAFT 생성

사용법:
  node scripts/ops/nightly-dec-candidates.js [옵션]

옵션:
  --config    쿼리 설정 파일 경로 (기본: configs/dec-queries.json)
  --dry-run   실제 실행 없이 계획만 출력
  --log       텔레메트리 로그 기록

예시:
  node scripts/ops/nightly-dec-candidates.js
  node scripts/ops/nightly-dec-candidates.js --config configs/test-queries.json --dry-run
  node scripts/ops/nightly-dec-candidates.js --log
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
  const today = getTodayStr();

  console.log('');
  console.log('🌙 Nightly DEC 후보 생성 시작');
  console.log(`   날짜: ${today}`);
  console.log(`   설정: ${options.config}`);
  if (options.dryRun) {
    console.log('   모드: DRY-RUN (실제 실행 없음)');
  }
  console.log('');

  // 설정 로드
  let config;
  try {
    config = loadConfig(options.config);
  } catch (err) {
    console.error(`❌ 설정 로드 실패: ${err.message}`);
    process.exit(1);
  }

  // 활성화된 쿼리 필터링
  const enabledQueries = (config.queries || []).filter(q => q.enabled !== false);
  console.log(`📋 처리할 쿼리: ${enabledQueries.length}개`);
  console.log('');

  if (enabledQueries.length === 0) {
    console.log('⚠️  활성화된 쿼리가 없습니다.');
    return;
  }

  // 결과 수집
  const results = {
    runDate: today,
    runTimestamp: new Date().toISOString(),
    configPath: options.config,
    dryRun: options.dryRun,
    totalQueries: enabledQueries.length,
    successCount: 0,
    failureCount: 0,
    items: []
  };

  // 각 쿼리 실행
  for (let i = 0; i < enabledQueries.length; i++) {
    const query = enabledQueries[i];
    const idx = i + 1;

    console.log(`[${idx}/${enabledQueries.length}] ${query.id}: "${query.query}"`);

    if (options.dryRun) {
      console.log(`   ⏭️  DRY-RUN: 건너뜀`);
      results.items.push({
        id: query.id,
        query: query.query,
        scopes: query.scopes,
        mode: query.mode,
        priority: query.priority,
        status: 'skipped',
        reason: 'dry-run'
      });
      continue;
    }

    // 실행
    const runResult = runDebateTrigger(query, config.defaults || {}, options.log);

    if (runResult.success) {
      console.log(`   ✅ 성공 (${runResult.runtimeMs}ms)`);
      if (runResult.draftPath) {
        console.log(`   📄 ${runResult.draftPath}`);
      }
      results.successCount++;
      results.items.push({
        id: query.id,
        query: query.query,
        scopes: query.scopes,
        mode: query.mode,
        priority: query.priority,
        status: 'success',
        draftPath: runResult.draftPath,
        runtimeMs: runResult.runtimeMs
      });
    } else {
      console.log(`   ❌ 실패`);
      const errorSummary = (runResult.error || '').slice(0, 200);
      console.log(`   에러: ${errorSummary}`);
      results.failureCount++;
      results.items.push({
        id: query.id,
        query: query.query,
        scopes: query.scopes,
        mode: query.mode,
        priority: query.priority,
        status: 'failed',
        error: runResult.error,
        runtimeMs: runResult.runtimeMs
      });
    }

    console.log('');
  }

  // 전체 런타임
  results.totalRuntimeMs = Date.now() - startTime;

  // 결과 저장
  const reportPath = `artifacts/reports/nightly-run-${today}.json`;

  if (!options.dryRun) {
    try {
      saveReport(results, reportPath);
      console.log(`📊 결과 저장: ${reportPath}`);
    } catch (err) {
      console.error(`⚠️  결과 저장 실패: ${err.message}`);
    }
  }

  // 요약
  console.log('');
  console.log('='.repeat(50));
  console.log('📊 Nightly 실행 요약');
  console.log('='.repeat(50));
  console.log(`   총 쿼리: ${results.totalQueries}개`);
  console.log(`   성공: ${results.successCount}개`);
  console.log(`   실패: ${results.failureCount}개`);
  console.log(`   소요시간: ${results.totalRuntimeMs}ms`);
  console.log('');

  // 실패가 있으면 exit code 1 (CI에서 감지용)
  if (results.failureCount > 0 && !options.dryRun) {
    console.log('⚠️  일부 쿼리가 실패했습니다. 로그를 확인하세요.');
  }
}

main();
