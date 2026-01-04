#!/usr/bin/env node
/**
 * 토론 트리거 오케스트레이터 v2.1
 * P6-2: search → bundle → summarize → DEC DRAFT → (optional) 정식 DEC 승격
 *
 * 사용법:
 *   node scripts/debate-trigger.js --query "신호등 시스템"
 *   node scripts/debate-trigger.js --query "Airtable" --scopes system,execution --mode action --log
 *   node scripts/debate-trigger.js --query "신호등" --generate-dec-draft --log
 *   node scripts/debate-trigger.js --query "신호등" --generate-dec-draft --promote --decider "푸르미르" --log
 *
 * 옵션:
 *   --query             검색/토론 쿼리 (필수)
 *   --scopes            검색 범위 (decisions,system,execution,team,all) 기본: all
 *   --k                 상위 결과 개수 (기본: 5)
 *   --mode              요약 모드 (general|decision|action) 기본: decision
 *   --bundle-out        번들 저장 경로 (기본: artifacts/context_bundle.json)
 *   --summary-out       요약 저장 경로 (기본: artifacts/context_summary.md)
 *   --format            번들 포맷 (기본: json)
 *   --generate-dec-draft  DEC DRAFT 자동 생성 (기본: false)
 *   --dec-out           DRAFT 출력 경로 오버라이드
 *   --decider           DRAFT 메타에 기록할 승인자 (기본: 미정)
 *   --promote           DRAFT → 정식 DEC 승격 (--generate-dec-draft 필요)
 *   --delete-draft      승격 후 DRAFT 파일 삭제 (기본: false)
 *   --log               텔레메트리 로그 기록
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    query: '',
    scopes: 'all',
    k: 5,
    mode: 'decision',
    bundleOut: 'artifacts/context_bundle.json',
    summaryOut: 'artifacts/context_summary.md',
    format: 'json',
    log: false,
    generateDecDraft: false,
    decOut: null,
    decider: '미정',
    promote: false,
    deleteDraft: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--query' && args[i + 1]) {
      result.query = args[++i];
    } else if (arg.startsWith('--query=')) {
      result.query = arg.split('=').slice(1).join('=');
    } else if (arg === '--scopes' && args[i + 1]) {
      result.scopes = args[++i];
    } else if (arg.startsWith('--scopes=')) {
      result.scopes = arg.split('=')[1];
    } else if (arg === '--k' && args[i + 1]) {
      result.k = parseInt(args[++i]) || 5;
    } else if (arg.startsWith('--k=')) {
      result.k = parseInt(arg.split('=')[1]) || 5;
    } else if (arg === '--mode' && args[i + 1]) {
      result.mode = args[++i];
    } else if (arg.startsWith('--mode=')) {
      result.mode = arg.split('=')[1];
    } else if (arg === '--bundle-out' && args[i + 1]) {
      result.bundleOut = args[++i];
    } else if (arg.startsWith('--bundle-out=')) {
      result.bundleOut = arg.split('=')[1];
    } else if (arg === '--summary-out' && args[i + 1]) {
      result.summaryOut = args[++i];
    } else if (arg.startsWith('--summary-out=')) {
      result.summaryOut = arg.split('=')[1];
    } else if (arg === '--format' && args[i + 1]) {
      result.format = args[++i];
    } else if (arg.startsWith('--format=')) {
      result.format = arg.split('=')[1];
    } else if (arg === '--log') {
      result.log = true;
    } else if (arg === '--generate-dec-draft') {
      result.generateDecDraft = true;
    } else if (arg === '--dec-out' && args[i + 1]) {
      result.decOut = args[++i];
    } else if (arg.startsWith('--dec-out=')) {
      result.decOut = arg.split('=').slice(1).join('=');
    } else if (arg === '--decider' && args[i + 1]) {
      result.decider = args[++i];
    } else if (arg.startsWith('--decider=')) {
      result.decider = arg.split('=').slice(1).join('=');
    } else if (arg === '--promote') {
      result.promote = true;
    } else if (arg === '--delete-draft') {
      result.deleteDraft = true;
    }
  }

  return result;
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
토론 트리거 오케스트레이터 v2.1 (P6-2)
search → bundle → summarize → DEC DRAFT → (optional) 정식 DEC 승격

사용법:
  node scripts/debate-trigger.js --query "검색어" [옵션]

필수 옵션:
  --query              검색/토론 쿼리

선택 옵션:
  --scopes             검색 범위 (기본: all)
  --k                  상위 결과 개수 (기본: 5)
  --mode               요약 모드 general|decision|action (기본: decision)
  --bundle-out         번들 저장 경로 (기본: artifacts/context_bundle.json)
  --summary-out        요약 저장 경로 (기본: artifacts/context_summary.md)
  --format             번들 포맷 (기본: json)
  --generate-dec-draft DEC DRAFT 자동 생성 (기본: false)
  --dec-out            DRAFT 출력 경로 오버라이드
  --decider            DRAFT 메타에 기록할 승인자 (기본: 미정)
  --promote            DRAFT → 정식 DEC 승격 (--generate-dec-draft 필요)
  --delete-draft       승격 후 DRAFT 파일 삭제 (기본: false)
  --log                텔레메트리 로그 기록

예시:
  node scripts/debate-trigger.js --query "신호등 시스템" --scopes decisions,system --mode decision --log
  node scripts/debate-trigger.js --query "Airtable" --scopes system,execution --mode action
  node scripts/debate-trigger.js --query "소원그림" --scopes all --k 8 --mode general --log
  node scripts/debate-trigger.js --query "신호등" --generate-dec-draft --log
  node scripts/debate-trigger.js --query "API 설계" --generate-dec-draft --promote --decider "푸르미르" --log
`);
}

/**
 * artifacts 디렉토리 확인/생성
 */
function ensureArtifactsDir() {
  const artifactsDir = path.join(__dirname, '..', 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
}

/**
 * Step A: search-docs.js 실행
 */
function runSearch(options) {
  console.log('📥 Step A: 문서 검색 중...');

  const args = [
    path.join(__dirname, 'search-docs.js'),
    '--query', options.query,
    '--scopes', options.scopes,
    '--k', String(options.k),
    '--format', options.format,
    '--out', options.bundleOut
  ];

  if (options.log) {
    args.push('--log');
  }

  const result = spawnSync('node', args, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    console.error('❌ Step A 실패: search-docs.js');
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }

  // stdout에서 결과 수 파싱
  const stdout = result.stdout || '';
  const match = stdout.match(/결과:\s*(\d+)개/);
  const resultCount = match ? parseInt(match[1]) : 0;

  console.log(`   ✅ 번들 생성: ${options.bundleOut} (${resultCount}개 문서)`);

  return resultCount;
}

/**
 * Step B: context-summarize.js 실행
 */
function runSummarize(options) {
  console.log('🧠 Step B: 요약 생성 중...');

  const args = [
    path.join(__dirname, 'context-summarize.js'),
    '--in', options.bundleOut,
    '--out', options.summaryOut,
    '--mode', options.mode
  ];

  if (options.log) {
    args.push('--log');
  }

  const result = spawnSync('node', args, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    console.error('❌ Step B 실패: context-summarize.js');
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }

  console.log(`   ✅ 요약 생성: ${options.summaryOut} (mode: ${options.mode})`);
}

/**
 * Step C: dec-generate.js 실행 (DEC DRAFT 생성)
 * @returns {string|null} 생성된 DRAFT 파일 경로 또는 null
 */
function runDecGenerate(options) {
  console.log('📋 Step C: DEC DRAFT 생성 중...');

  const args = [
    path.join(__dirname, 'dec-generate.js'),
    '--in', options.summaryOut,
    '--query', options.query,
    '--status', 'DRAFT',
    '--decider', options.decider
  ];

  // 출력 경로 오버라이드
  if (options.decOut) {
    args.push('--out', options.decOut);
  }

  if (options.log) {
    args.push('--log');
  }

  const result = spawnSync('node', args, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    console.error('❌ Step C 실패: dec-generate.js');
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }

  // stdout에서 생성된 파일 경로 파싱 (저장 경로: 또는 문서번호 매칭)
  const stdout = result.stdout || '';
  const pathMatch = stdout.match(/저장 경로:\s*(.+\.md)/);
  const draftPath = pathMatch ? pathMatch[1].trim() : null;

  if (draftPath) {
    console.log(`   ✅ DRAFT 생성: ${draftPath}`);
  } else {
    console.log(`   ✅ DRAFT 생성 완료`);
  }

  return draftPath;
}

/**
 * Step D: dec-approve.js 실행 (DRAFT → 정식 DEC 승격)
 * @returns {object} { decPath, decNumber } 또는 null
 */
function runDecApprove(draftPath, options) {
  console.log('🎖️  Step D: DEC 승격 중...');

  const args = [
    path.join(__dirname, 'dec-approve.js'),
    '--in', draftPath,
    '--decider', options.decider
  ];

  if (options.deleteDraft) {
    args.push('--delete');
  }

  if (options.log) {
    args.push('--log');
  }

  const result = spawnSync('node', args, {
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  if (result.status !== 0) {
    console.error('❌ Step D 실패: dec-approve.js');
    if (result.stderr) console.error(result.stderr);
    process.exit(1);
  }

  // stdout에서 정식 DEC 경로 파싱
  const stdout = result.stdout || '';
  const pathMatch = stdout.match(/저장 경로:\s*(.+\.md)/);
  const decPath = pathMatch ? pathMatch[1].trim() : null;

  const numMatch = stdout.match(/새 문서번호:\s*(DEC-[\d-]+)/);
  const decNumber = numMatch ? numMatch[1].trim() : null;

  if (decPath && decNumber) {
    console.log(`   ✅ 정식 DEC 발행: ${decNumber}`);
    console.log(`   저장 경로: ${decPath}`);
  } else {
    console.log(`   ✅ 정식 DEC 발행 완료`);
  }

  return { decPath, decNumber };
}

/**
 * Step E: 결과 요약 출력
 * @param {object} options - CLI 옵션
 * @param {string|null} draftPath - 생성된 DRAFT 경로 (없으면 null)
 * @param {object|null} approvedResult - 승격된 DEC 정보 { decPath, decNumber }
 */
function printSummary(options, draftPath, approvedResult) {
  console.log('\n' + '='.repeat(50));
  console.log('✅ Debate trigger completed');
  console.log('='.repeat(50));

  console.log(`\n📁 생성된 파일:`);
  console.log(`   - bundle:  ${options.bundleOut}`);
  console.log(`   - summary: ${options.summaryOut}`);
  if (draftPath && !options.deleteDraft) {
    console.log(`   - draft:   ${draftPath}`);
  }
  if (approvedResult && approvedResult.decPath) {
    console.log(`   - DEC:     ${approvedResult.decPath}`);
  }

  // 번들에서 top 결과 읽기
  try {
    const bundlePath = path.join(__dirname, '..', options.bundleOut);
    const bundleContent = fs.readFileSync(bundlePath, 'utf-8');
    const bundle = JSON.parse(bundleContent);

    if (bundle.results && bundle.results.length > 0) {
      console.log(`\n📊 Top 결과:`);
      bundle.results.slice(0, 3).forEach((doc, idx) => {
        const shortPath = doc.path.length > 50 ? '...' + doc.path.slice(-47) : doc.path;
        console.log(`   ${idx + 1}) ${shortPath} (score: ${doc.score})`);
      });
    }
  } catch (e) {
    // 번들 읽기 실패 시 무시
  }

  if (options.log) {
    console.log(`\n📊 로그 기록됨: artifacts/search_logs.ndjson`);
  }

  console.log('');
}

/**
 * 메인 실행
 */
function main() {
  const args = process.argv.slice(2);

  // 도움말
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }

  const options = parseArgs(args);

  // 필수 옵션 체크
  if (!options.query) {
    console.error('❌ --query 옵션이 필요합니다.\n');
    printUsage();
    process.exit(1);
  }

  // 모드 검증
  const validModes = ['general', 'decision', 'action'];
  if (!validModes.includes(options.mode)) {
    console.error(`❌ 유효하지 않은 모드: ${options.mode}`);
    console.error(`   사용 가능: ${validModes.join(', ')}`);
    process.exit(1);
  }

  // --promote는 --generate-dec-draft 필요
  if (options.promote && !options.generateDecDraft) {
    console.error('❌ --promote 옵션은 --generate-dec-draft와 함께 사용해야 합니다.');
    process.exit(1);
  }

  // --promote 시 decider 필수
  if (options.promote && options.decider === '미정') {
    console.error('❌ --promote 옵션 사용 시 --decider 지정이 필요합니다.');
    process.exit(1);
  }

  // 승인 게이트: DEC_PROMOTE_TOKEN 환경변수 필요 (P6-3 안전장치)
  if (options.promote) {
    const promoteToken = process.env.DEC_PROMOTE_TOKEN;
    if (!promoteToken) {
      console.error('❌ --promote 사용 시 DEC_PROMOTE_TOKEN 환경변수가 필요합니다.');
      console.error('   설정 방법: export DEC_PROMOTE_TOKEN=your-secret-token');
      console.error('   또는: DEC_PROMOTE_TOKEN=token node scripts/debate-trigger.js ...');
      process.exit(1);
    }
  }

  console.log('');
  console.log('🎯 토론 트리거 시작');
  console.log(`   Query: "${options.query}"`);
  console.log(`   Scopes: ${options.scopes}`);
  console.log(`   Mode: ${options.mode}`);
  console.log(`   K: ${options.k}`);
  if (options.generateDecDraft) {
    console.log(`   DEC DRAFT: 활성화 (승인자: ${options.decider})`);
  }
  if (options.promote) {
    console.log(`   승격: 활성화 → 정식 DEC 발행`);
  }
  console.log('');

  // artifacts 디렉토리 확인
  ensureArtifactsDir();

  // Step A: 검색
  runSearch(options);

  // Step B: 요약
  runSummarize(options);

  // Step C: DEC DRAFT 생성 (옵션)
  let draftPath = null;
  if (options.generateDecDraft) {
    draftPath = runDecGenerate(options);
  }

  // Step D: DEC 승격 (옵션)
  let approvedResult = null;
  if (options.promote && draftPath) {
    approvedResult = runDecApprove(draftPath, options);
  }

  // Step E: 결과 출력
  printSummary(options, draftPath, approvedResult);
}

main();
