#!/usr/bin/env node
/**
 * preflight-open-check.js
 *
 * 오픈 게이트 Preflight 체크 스크립트
 * - 유료 진입 라우트 존재 확인
 * - 이용약관/개인정보/환불 링크 확인
 * - 카카오채널/문의 링크 확인
 *
 * Usage:
 *   node scripts/ops/preflight-open-check.js [--config path] [--verbose]
 *
 * Exit codes:
 *   0 = 모든 체크 통과
 *   1 = 1개 이상 실패
 */

const fs = require('fs');
const path = require('path');

// ============ 설정 ============
const DEFAULT_CONFIG = 'configs/open-links.json';
const ROOT_DIR = path.resolve(__dirname, '../../');

// ============ CLI 인자 파싱 ============
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    config: DEFAULT_CONFIG,
    verbose: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      options.config = args[++i];
    } else if (args[i] === '--verbose' || args[i] === '-v') {
      options.verbose = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
오픈 게이트 Preflight 체크 스크립트

Usage:
  node scripts/ops/preflight-open-check.js [options]

Options:
  --config <path>   설정 파일 경로 (기본: ${DEFAULT_CONFIG})
  --verbose, -v     상세 출력
  --help, -h        도움말

Exit codes:
  0 = 모든 체크 통과
  1 = 1개 이상 실패
`);
      process.exit(0);
    }
  }

  return options;
}

// ============ 체크 함수들 ============

/**
 * 파일 존재 확인
 */
function checkFileExists(targetPath) {
  const fullPath = path.join(ROOT_DIR, targetPath);
  return fs.existsSync(fullPath);
}

/**
 * 파일 내 패턴 존재 확인
 */
function checkFileContains(targetPath, pattern) {
  const fullPath = path.join(ROOT_DIR, targetPath);

  if (!fs.existsSync(fullPath)) {
    return { found: false, reason: 'file_not_found' };
  }

  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const regex = new RegExp(pattern, 'i');
    return { found: regex.test(content), reason: regex.test(content) ? 'matched' : 'pattern_not_found' };
  } catch (err) {
    return { found: false, reason: `read_error: ${err.message}` };
  }
}

// ============ 메인 실행 ============

function runChecks(config, verbose) {
  const checks = config.checks || [];
  const results = [];

  console.log('\n🔍 오픈 게이트 Preflight 체크 시작\n');
  console.log('─'.repeat(60));

  for (const check of checks) {
    let passed = false;
    let detail = '';

    switch (check.type) {
      case 'file_exists':
        passed = checkFileExists(check.target);
        detail = passed ? '파일 존재' : '파일 없음';
        break;

      case 'file_contains':
        const result = checkFileContains(check.target, check.pattern);
        passed = result.found;
        detail = result.reason === 'matched'
          ? `패턴 발견: "${check.pattern}"`
          : result.reason === 'file_not_found'
            ? '대상 파일 없음'
            : `패턴 미발견: "${check.pattern}"`;
        break;

      default:
        detail = `알 수 없는 체크 타입: ${check.type}`;
        break;
    }

    const status = passed ? '✅ PASS' : (check.critical ? '❌ FAIL' : '⚠️  WARN');
    const criticality = check.critical ? '[필수]' : '[선택]';

    results.push({
      id: check.id,
      message: check.message,
      passed,
      critical: check.critical,
      detail
    });

    // 출력
    console.log(`${status} ${criticality} ${check.message}`);
    if (verbose || !passed) {
      console.log(`       └─ ${check.target}`);
      console.log(`          ${detail}`);
    }
    console.log('');
  }

  console.log('─'.repeat(60));

  return results;
}

function printSummary(results) {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed && r.critical).length;
  const warnings = results.filter(r => !r.passed && !r.critical).length;

  console.log('\n📊 체크 결과 요약\n');
  console.log(`  총 체크: ${total}`);
  console.log(`  ✅ 통과: ${passed}`);
  console.log(`  ❌ 실패: ${failed} (필수)`);
  console.log(`  ⚠️  경고: ${warnings} (선택)`);
  console.log('');

  if (failed > 0) {
    console.log('🚨 실패 항목:\n');
    results.filter(r => !r.passed && r.critical).forEach(r => {
      console.log(`  • ${r.message} (${r.id})`);
      console.log(`    └─ ${r.detail}`);
    });
    console.log('');
  }

  if (warnings > 0) {
    console.log('⚠️  경고 항목:\n');
    results.filter(r => !r.passed && !r.critical).forEach(r => {
      console.log(`  • ${r.message} (${r.id})`);
    });
    console.log('');
  }

  return failed === 0;
}

// ============ 실행 ============

async function main() {
  const options = parseArgs();

  // 설정 파일 로드
  const configPath = path.join(ROOT_DIR, options.config);

  if (!fs.existsSync(configPath)) {
    console.error(`❌ 설정 파일을 찾을 수 없습니다: ${configPath}`);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (err) {
    console.error(`❌ 설정 파일 파싱 오류: ${err.message}`);
    process.exit(1);
  }

  console.log(`📋 설정 파일: ${options.config}`);
  console.log(`📅 체크 시각: ${new Date().toLocaleString('ko-KR')}`);

  // 체크 실행
  const results = runChecks(config, options.verbose);

  // 요약 출력 및 종료 코드 결정
  const allPassed = printSummary(results);

  if (allPassed) {
    console.log('🎉 모든 필수 체크를 통과했습니다. 오픈 준비 완료!\n');
    process.exit(0);
  } else {
    console.log('❌ 일부 필수 체크가 실패했습니다. 위 항목을 확인해주세요.\n');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ 예기치 않은 오류:', err.message);
  process.exit(1);
});
