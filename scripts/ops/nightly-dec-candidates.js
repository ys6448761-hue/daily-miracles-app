#!/usr/bin/env node
/**
 * Nightly DEC 후보 생성 스크립트
 * P6-3.1: 쿼리 목록을 순회하며 DRAFT 생성 (priority 필터 지원)
 *
 * 사용법:
 *   node scripts/ops/nightly-dec-candidates.js
 *   node scripts/ops/nightly-dec-candidates.js --priority high
 *   node scripts/ops/nightly-dec-candidates.js --priority all --dry-run
 *
 * 옵션:
 *   --config    쿼리 설정 파일 경로 (기본: configs/dec-queries.json)
 *   --priority  실행할 우선순위 (high|medium|low|all) 기본: high
 *   --dry-run   실제 실행 없이 대상만 출력
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
    priority: 'high',
    dryRun: false,
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--config' && args[i + 1]) {
      result.config = args[++i];
    } else if (arg.startsWith('--config=')) {
      result.config = arg.split('=').slice(1).join('=');
    } else if (arg === '--priority' && args[i + 1]) {
      result.priority = args[++i];
    } else if (arg.startsWith('--priority=')) {
      result.priority = arg.split('=')[1];
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
 * 우선순위 필터링
 */
function filterByPriority(queries, targetPriority) {
  if (targetPriority === 'all') {
    return queries;
  }

  // priority 계층: high > medium > low
  // high 선택 시: high만
  // medium 선택 시: high + medium
  // low 선택 시: high + medium + low (all과 동일)
  const priorityLevels = {
    high: ['high'],
    medium: ['high', 'medium'],
    low: ['high', 'medium', 'low']
  };

  const allowedLevels = priorityLevels[targetPriority] || ['high'];
  return queries.filter(q => allowedLevels.includes(q.priority || 'medium'));
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
Nightly DEC 후보 생성 스크립트 (P6-3.1)
쿼리 목록을 순회하며 DRAFT 생성 (priority 필터 지원)

사용법:
  node scripts/ops/nightly-dec-candidates.js [옵션]

옵션:
  --config    쿼리 설정 파일 경로 (기본: configs/dec-queries.json)
  --priority  실행할 우선순위 (high|medium|low|all) 기본: high
  --dry-run   실제 실행 없이 대상만 출력
  --log       텔레메트리 로그 기록

우선순위 정책:
  high    - Nightly 자동 실행 (매일)
  medium  - Weekly 수동/예약 실행 (high + medium)
  low     - 전체 (high + medium + low)
  all     - 모든 활성화된 쿼리

예시:
  node scripts/ops/nightly-dec-candidates.js --priority high --log
  node scripts/ops/nightly-dec-candidates.js --priority all --dry-run
  node scripts/ops/nightly-dec-candidates.js --config configs/test-queries.json
`);
}

/**
 * 결과 요약 출력
 */
function printSummary(results, options) {
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 Nightly 실행 요약');
  console.log('='.repeat(60));
  console.log(`   Priority 필터: ${options.priority}`);
  console.log(`   총 쿼리: ${results.totalQueries}개`);
  console.log(`   성공: ${results.successCount}개`);
  console.log(`   실패: ${results.failureCount}개`);
  console.log(`   소요시간: ${results.totalRuntimeMs}ms`);

  // 생성된 DRAFT 파일 목록
  const successItems = results.items.filter(i => i.status === 'success' && i.draftPath);
  if (successItems.length > 0) {
    console.log('');
    console.log('📄 생성된 DRAFT 파일:');
    successItems.forEach(item => {
      const shortPath = item.draftPath.length > 60
        ? '...' + item.draftPath.slice(-57)
        : item.draftPath;
      console.log(`   - ${shortPath}`);
    });
  }

  // 실패 목록
  const failedItems = results.items.filter(i => i.status === 'failed');
  if (failedItems.length > 0) {
    console.log('');
    console.log('❌ 실패한 쿼리:');
    failedItems.forEach(item => {
      const errorLine = (item.error || 'Unknown').split('\n')[0].slice(0, 80);
      console.log(`   - ${item.id}: ${errorLine}`);
    });
  }

  console.log('');
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

  // 우선순위 검증
  const validPriorities = ['high', 'medium', 'low', 'all'];
  if (!validPriorities.includes(options.priority)) {
    console.error(`❌ 유효하지 않은 priority: ${options.priority}`);
    console.error(`   사용 가능: ${validPriorities.join(', ')}`);
    process.exit(1);
  }

  console.log('');
  console.log('🌙 Nightly DEC 후보 생성 시작');
  console.log(`   날짜: ${today}`);
  console.log(`   설정: ${options.config}`);
  console.log(`   Priority: ${options.priority}`);
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

  // 우선순위 필터링
  const targetQueries = filterByPriority(enabledQueries, options.priority);

  console.log(`📋 전체 쿼리: ${enabledQueries.length}개`);
  console.log(`📋 필터 후 대상: ${targetQueries.length}개 (priority: ${options.priority})`);
  console.log('');

  if (targetQueries.length === 0) {
    console.log('⚠️  대상 쿼리가 없습니다.');
    return;
  }

  // 결과 수집
  const results = {
    runDate: today,
    runTimestamp: new Date().toISOString(),
    configPath: options.config,
    priorityFilter: options.priority,
    dryRun: options.dryRun,
    totalQueries: targetQueries.length,
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    items: []
  };

  // 각 쿼리 실행
  for (let i = 0; i < targetQueries.length; i++) {
    const query = targetQueries[i];
    const idx = i + 1;

    console.log(`[${idx}/${targetQueries.length}] ${query.id}: "${query.query}" (${query.priority})`);

    if (options.dryRun) {
      console.log(`   ⏭️  DRY-RUN: 건너뜀`);
      results.skippedCount++;
      results.items.push({
        id: query.id,
        query: query.query,
        scopes: query.scopes,
        mode: query.mode,
        priority: query.priority,
        notes: query.notes,
        status: 'skipped',
        reason: 'dry-run'
      });
      console.log('');
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
        notes: query.notes,
        status: 'success',
        draftPath: runResult.draftPath,
        runtimeMs: runResult.runtimeMs
      });
    } else {
      console.log(`   ❌ 실패`);
      const errorSummary = (runResult.error || '').split('\n')[0].slice(0, 100);
      console.log(`   에러: ${errorSummary}`);
      results.failureCount++;
      results.items.push({
        id: query.id,
        query: query.query,
        scopes: query.scopes,
        mode: query.mode,
        priority: query.priority,
        notes: query.notes,
        status: 'failed',
        error: runResult.error,
        errorSummary: errorSummary,
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

  // 요약 출력
  printSummary(results, options);

  // 실패가 있으면 경고
  if (results.failureCount > 0 && !options.dryRun) {
    console.log('⚠️  일부 쿼리가 실패했습니다. 로그를 확인하세요.');
  }
}

main();
