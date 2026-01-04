#!/usr/bin/env node
/**
 * DEC 결정문 초안 생성기
 * P4-3C: context_summary.md → DEC 초안 자동 생성
 *
 * 사용법:
 *   node scripts/dec-generate.js --in artifacts/context_summary.md --query "신호등 시스템"
 *   node scripts/dec-generate.js --in artifacts/context_summary.md --query "신호등" --out docs/decisions/DEC-DRAFT.md --log
 *
 * 옵션:
 *   --in       입력 파일 (context_summary.md) [필수]
 *   --query    토론/결정 주제 [필수]
 *   --out      출력 경로 (기본: docs/decisions/DEC-DRAFT_<query>.md)
 *   --decider  승인자 (기본: 미정)
 *   --status   상태 (기본: DRAFT)
 *   --log      텔레메트리 로그 기록
 */

const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    in: null,
    query: '',
    out: null,
    decider: '미정',
    status: 'DRAFT',
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--in' && args[i + 1]) {
      result.in = args[++i];
    } else if (arg.startsWith('--in=')) {
      result.in = arg.split('=').slice(1).join('=');
    } else if (arg === '--query' && args[i + 1]) {
      result.query = args[++i];
    } else if (arg.startsWith('--query=')) {
      result.query = arg.split('=').slice(1).join('=');
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=').slice(1).join('=');
    } else if (arg === '--decider' && args[i + 1]) {
      result.decider = args[++i];
    } else if (arg.startsWith('--decider=')) {
      result.decider = arg.split('=').slice(1).join('=');
    } else if (arg === '--status' && args[i + 1]) {
      result.status = args[++i];
    } else if (arg.startsWith('--status=')) {
      result.status = arg.split('=').slice(1).join('=');
    } else if (arg === '--log') {
      result.log = true;
    }
  }

  return result;
}

/**
 * context_summary.md 파싱
 */
function parseSummary(content) {
  const result = {
    query: '',
    scopes: '',
    mode: '',
    generated: '',
    summary: [],
    decisions: [],
    actions: [],
    references: []
  };

  // 검색 정보 파싱
  const queryMatch = content.match(/\*\*Query\*\*:\s*(.+)/);
  if (queryMatch) result.query = queryMatch[1].trim();

  const scopesMatch = content.match(/\*\*Scopes\*\*:\s*(.+)/);
  if (scopesMatch) result.scopes = scopesMatch[1].trim();

  const modeMatch = content.match(/\*\*Mode\*\*:\s*(.+)/);
  if (modeMatch) result.mode = modeMatch[1].trim();

  const genMatch = content.match(/\*\*Generated\*\*:\s*(.+)/);
  if (genMatch) result.generated = genMatch[1].trim();

  // 핵심 요약 파싱 (## 핵심 요약 섹션)
  const summarySection = content.match(/## 핵심 요약[\s\S]*?(?=---|\n## |$)/);
  if (summarySection) {
    const lines = summarySection[0].split('\n').filter(l => l.trim().startsWith('-'));
    result.summary = lines.map(l => l.replace(/^-\s*/, '').trim()).filter(l => l);
  }

  // 결정 사항 후보 파싱
  const decisionSection = content.match(/## 결정 사항 후보[\s\S]*?(?=---|\n## |$)/);
  if (decisionSection) {
    const lines = decisionSection[0].split('\n').filter(l => l.trim().startsWith('-'));
    result.decisions = lines.map(l => {
      // - [ ] 형태 제거
      return l.replace(/^-\s*\[.\]\s*/, '').trim();
    }).filter(l => l);
  }

  // 액션 아이템 후보 파싱
  const actionSection = content.match(/## 액션 아이템 후보[\s\S]*?(?=---|\n## |$)/);
  if (actionSection) {
    const lines = actionSection[0].split('\n').filter(l => l.trim().startsWith('-'));
    result.actions = lines.map(l => {
      return l.replace(/^-\s*\[.\]\s*/, '').trim();
    }).filter(l => l);
  }

  // 참고 문서 파싱
  const refSection = content.match(/## 참고 문서[\s\S]*?$/);
  if (refSection) {
    // 각 문서 블록 파싱
    const docBlocks = refSection[0].split(/\n\d+\.\s+\*\*/).slice(1);
    for (const block of docBlocks) {
      const titleMatch = block.match(/^([^*]+)\*\*/);
      const pathMatch = block.match(/Path:\s*`([^`]+)`/);
      const scoreMatch = block.match(/Score:\s*([\d.]+)/);
      const updatedMatch = block.match(/Updated:\s*(\S+)/);

      if (titleMatch) {
        result.references.push({
          title: titleMatch[1].trim(),
          path: pathMatch ? pathMatch[1] : '',
          score: scoreMatch ? scoreMatch[1] : '',
          updated: updatedMatch ? updatedMatch[1] : ''
        });
      }
    }
  }

  return result;
}

/**
 * 문서번호 생성
 */
function generateDocNumber(status) {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  const hour = String(kst.getHours()).padStart(2, '0');
  const min = String(kst.getMinutes()).padStart(2, '0');

  return `DEC-${status}-${year}${month}${day}-${hour}${min}`;
}

/**
 * 오늘 날짜 (KST)
 */
function getTodayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

/**
 * DEC 문서 생성
 */
function generateDEC(summary, options) {
  const docNumber = generateDocNumber(options.status);
  const today = getTodayKST();

  // 파일명용 쿼리 정제
  const safeQuery = options.query.replace(/\s+/g, '_').replace(/[^가-힣a-zA-Z0-9_-]/g, '');

  let md = `# ${docNumber}: ${options.query}

## 결정 정보

| 항목 | 내용 |
|------|------|
| 문서번호 | ${docNumber} |
| 주제 | ${options.query} |
| 상태 | ${options.status} |
| 승인자 | ${options.decider} |
| 날짜 | ${today} |
| 원본 쿼리 | ${summary.query || options.query} |
| 검색 범위 | ${summary.scopes || 'all'} |

---

## 배경

> 이 결정문은 "${options.query}" 주제에 대한 토론 결과를 바탕으로 자동 생성되었습니다.
> 아래 내용을 검토 후 승인/수정해주세요.

---

## 최종 결정사항

`;

  // 결정 사항 후보 추가
  if (summary.decisions.length > 0) {
    summary.decisions.forEach(d => {
      md += `- [ ] ${d}\n`;
    });
  } else {
    md += `- [ ] (결정 사항을 입력해주세요)\n`;
  }

  md += `
---

## 액션 아이템

| 순번 | 액션 | 담당 | 기한 | 상태 |
|------|------|------|------|------|
`;

  // 액션 아이템 추가
  if (summary.actions.length > 0) {
    summary.actions.forEach((a, idx) => {
      md += `| ${idx + 1} | ${a} | 미정 | 미정 | 대기 |\n`;
    });
  } else {
    md += `| 1 | (액션을 입력해주세요) | 미정 | 미정 | 대기 |\n`;
  }

  md += `
---

## 참고 문서

`;

  // 참고 문서 추가
  if (summary.references.length > 0) {
    summary.references.forEach((ref, idx) => {
      md += `${idx + 1}. **${ref.title}**\n`;
      md += `   - Path: \`${ref.path}\`\n`;
      if (ref.score) md += `   - Score: ${ref.score}\n`;
      if (ref.updated) md += `   - Updated: ${ref.updated}\n`;
      md += '\n';
    });
  } else {
    md += `(참고 문서 없음)\n`;
  }

  md += `---

## 승인 이력

| 날짜 | 담당자 | 결정 | 비고 |
|------|--------|------|------|
| ${today} | 자동생성 | DRAFT | P4-3C 토론 파이프라인 |

---

*이 문서는 \`scripts/dec-generate.js\`로 자동 생성되었습니다.*
`;

  return { content: md, docNumber, safeQuery };
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
 * 텔레메트리 로그 기록
 */
function writeLog(options, summary, docNumber, runtimeMs) {
  const logPath = path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson');
  const logDir = path.dirname(logPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'dec_generate',
    query: options.query,
    doc_number: docNumber,
    status: options.status,
    decider: options.decider,
    input_file: options.in,
    output_file: options.out,
    decision_count: summary.decisions.length,
    action_count: summary.actions.length,
    reference_count: summary.references.length,
    runtime_ms: runtimeMs
  };

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
DEC 결정문 초안 생성기 (P4-3C)
context_summary.md → DEC 초안 자동 생성

사용법:
  node scripts/dec-generate.js --in <입력파일> --query <주제> [옵션]

필수 옵션:
  --in       context_summary.md 경로
  --query    토론/결정 주제

선택 옵션:
  --out      출력 경로 (기본: docs/decisions/DEC-DRAFT_<query>.md)
  --decider  승인자 (기본: 미정)
  --status   상태 (기본: DRAFT)
  --log      텔레메트리 로그 기록

예시:
  node scripts/dec-generate.js --in artifacts/context_summary.md --query "신호등 시스템" --log
  node scripts/dec-generate.js --in artifacts/context_summary.md --query "Airtable" --decider "푸르미르" --status "REVIEW"
`);
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
  if (!options.in) {
    console.error('❌ --in 옵션이 필요합니다.');
    printUsage();
    process.exit(1);
  }

  if (!options.query) {
    console.error('❌ --query 옵션이 필요합니다.');
    printUsage();
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // 1. 입력 파일 로드
    console.log(`📥 입력 로드: ${options.in}`);
    const inputPath = path.resolve(options.in);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`입력 파일을 찾을 수 없습니다: ${inputPath}`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');

    // 2. 요약 파싱
    console.log('🔍 요약 파싱 중...');
    const summary = parseSummary(content);
    console.log(`   결정 후보: ${summary.decisions.length}개`);
    console.log(`   액션 후보: ${summary.actions.length}개`);
    console.log(`   참고 문서: ${summary.references.length}개`);

    // 3. DEC 문서 생성
    console.log('📝 DEC 초안 생성 중...');
    const { content: decContent, docNumber, safeQuery } = generateDEC(summary, options);

    // 4. 출력 경로 결정
    if (!options.out) {
      options.out = `docs/decisions/${docNumber}_${safeQuery}.md`;
    }

    // 5. 저장
    const savedPath = saveOutput(decContent, options.out);
    const runtimeMs = Date.now() - startTime;

    console.log(`\n✅ DEC 초안 생성 완료`);
    console.log(`   문서번호: ${docNumber}`);
    console.log(`   저장 경로: ${savedPath}`);
    console.log(`   상태: ${options.status}`);
    console.log(`   승인자: ${options.decider}`);

    // 6. 로그 기록
    if (options.log) {
      writeLog(options, summary, docNumber, runtimeMs);
      console.log(`📊 로그 기록됨 (${runtimeMs}ms)`);
    }

  } catch (err) {
    console.error(`❌ 오류: ${err.message}`);
    process.exit(1);
  }
}

main();
