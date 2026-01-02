#!/usr/bin/env node
/**
 * lint-exp-guardrail.js
 *
 * Lint Guardrail: EXP 파일에 DEC:/Actions: 문자열이 있으면 테스트 실패
 * 회귀 방지용 - CI/CD 파이프라인에서 실행
 *
 * Usage:
 *   node scripts/lint-exp-guardrail.js
 *   node scripts/lint-exp-guardrail.js --fix  (위반 파일 목록만 출력)
 *
 * Exit codes:
 *   0 - 모든 EXP 파일이 가드레일 통과
 *   1 - 가드레일 위반 발견
 */

const fs = require('fs');
const path = require('path');

// 설정
const CONFIG = {
  exploreDir: path.join(__dirname, '..', 'docs', 'explores'),
  forbiddenPatterns: [
    { pattern: /DEC-\d{4}-\d{4}-\d{3}/g, name: 'DEC ID 참조' },
    { pattern: /## Action Items/gi, name: 'Action Items 섹션' },
    { pattern: /\| ACT-\d+/g, name: 'Action ID 참조' },
    { pattern: /final_decision/gi, name: 'final_decision 필드' },
    { pattern: /Actions: \d+개/g, name: 'Actions 카운트' },
    { pattern: /## 승인/g, name: '승인 섹션' },
    { pattern: /decision_id/gi, name: 'decision_id 필드' }
  ]
};

// 색상 코드
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const { pattern, name } of CONFIG.forbiddenPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      violations.push({
        pattern: name,
        matches: matches.slice(0, 3),  // 최대 3개만 표시
        count: matches.length
      });
    }
  }

  return violations;
}

function main() {
  console.log('\n' + '='.repeat(60));
  log('blue', '🔍 EXP Guardrail Lint Check');
  console.log('='.repeat(60) + '\n');

  // 디렉토리 확인
  if (!fs.existsSync(CONFIG.exploreDir)) {
    log('yellow', `⚠️ EXPLORE 디렉토리가 없습니다: ${CONFIG.exploreDir}`);
    log('green', '✅ 검사할 파일 없음 - 통과');
    process.exit(0);
  }

  // EXP 파일 목록
  const expFiles = fs.readdirSync(CONFIG.exploreDir)
    .filter(f => f.startsWith('EXP-') && f.endsWith('.md'));

  if (expFiles.length === 0) {
    log('yellow', '⚠️ EXP 파일이 없습니다.');
    log('green', '✅ 검사할 파일 없음 - 통과');
    process.exit(0);
  }

  console.log(`📁 검사 대상: ${expFiles.length}개 EXP 파일\n`);

  // 각 파일 검사
  let totalViolations = 0;
  const results = [];

  for (const file of expFiles) {
    const filePath = path.join(CONFIG.exploreDir, file);
    const violations = checkFile(filePath);

    if (violations.length > 0) {
      totalViolations += violations.length;
      results.push({ file, violations });
    }
  }

  // 결과 출력
  if (results.length > 0) {
    log('red', '🚫 가드레일 위반 발견!\n');

    for (const { file, violations } of results) {
      console.log(`  📄 ${file}`);
      for (const v of violations) {
        console.log(`     ❌ ${v.pattern} (${v.count}건)`);
        console.log(`        예시: ${v.matches.join(', ')}`);
      }
      console.log('');
    }

    console.log('='.repeat(60));
    log('red', `❌ LINT 실패: ${results.length}개 파일에서 ${totalViolations}건 위반`);
    console.log('='.repeat(60));
    console.log('\n💡 EXPLORE 파일에는 DEC/Actions 관련 내용이 포함되면 안됩니다.');
    console.log('   synth-lite 파이프라인이 올바르게 작동하는지 확인하세요.\n');

    process.exit(1);
  } else {
    console.log(`  ✅ ${expFiles.length}개 파일 모두 통과\n`);
    console.log('='.repeat(60));
    log('green', '✅ LINT 통과: 모든 EXP 파일이 가드레일 준수');
    console.log('='.repeat(60) + '\n');
    process.exit(0);
  }
}

main();
