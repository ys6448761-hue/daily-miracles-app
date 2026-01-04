#!/usr/bin/env node
/**
 * DEC 결정문 승인 스크립트
 * P4-3C-2: DRAFT → APPROVED 정식 문서로 승격
 *
 * 사용법:
 *   node scripts/dec-approve.js --in docs/decisions/DEC-DRAFT-xxx.md --decider "푸르미르"
 *   node scripts/dec-approve.js --in docs/decisions/DEC-DRAFT-xxx.md --decider "푸르미르" --out docs/decisions/DEC-2026-0105-001_xxx.md --log
 *
 * 옵션:
 *   --in       DRAFT 파일 경로 [필수]
 *   --decider  승인자 [필수]
 *   --out      출력 경로 (기본: 자동 생성)
 *   --log      텔레메트리 로그 기록
 *   --delete   승인 후 원본 DRAFT 파일 삭제
 */

const fs = require('fs');
const path = require('path');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    in: null,
    decider: null,
    out: null,
    log: false,
    delete: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--in' && args[i + 1]) {
      result.in = args[++i];
    } else if (arg.startsWith('--in=')) {
      result.in = arg.split('=').slice(1).join('=');
    } else if (arg === '--decider' && args[i + 1]) {
      result.decider = args[++i];
    } else if (arg.startsWith('--decider=')) {
      result.decider = arg.split('=').slice(1).join('=');
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=').slice(1).join('=');
    } else if (arg === '--log') {
      result.log = true;
    } else if (arg === '--delete') {
      result.delete = true;
    }
  }

  return result;
}

/**
 * 오늘 날짜 (KST) YYYY-MMDD 형식
 */
function getTodayKST() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return { full: `${year}-${month}-${day}`, compact: `${year}-${month}${day}` };
}

/**
 * 같은 날짜의 DEC 개수 세어서 다음 번호 반환
 */
function getNextDocNumber(dateCompact) {
  const decisionsDir = path.join(__dirname, '..', 'docs', 'decisions');

  if (!fs.existsSync(decisionsDir)) {
    return 1;
  }

  const files = fs.readdirSync(decisionsDir);
  // DEC-2026-0105-001 형태 매칭
  const pattern = new RegExp(`^DEC-${dateCompact}-(\\d{3})`);

  let maxNum = 0;
  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  return maxNum + 1;
}

/**
 * 정식 문서번호 생성
 */
function generateOfficialDocNumber() {
  const { compact } = getTodayKST();
  const seq = getNextDocNumber(compact);
  const seqStr = String(seq).padStart(3, '0');
  return `DEC-${compact}-${seqStr}`;
}

/**
 * DRAFT 문서에서 주제(slug) 추출
 */
function extractSlugFromPath(filePath) {
  const basename = path.basename(filePath, '.md');
  // DEC-DRAFT-20260105-0502_신호등_시스템 → 신호등_시스템
  const parts = basename.split('_');
  if (parts.length > 1) {
    return parts.slice(1).join('_');
  }
  return 'untitled';
}

/**
 * DRAFT 문서에서 원본 주제 추출
 */
function extractQueryFromContent(content) {
  // | 주제 | xxx | 형태에서 추출
  const match = content.match(/\|\s*주제\s*\|\s*(.+?)\s*\|/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * DRAFT 문서 → APPROVED 문서로 변환
 */
function convertToApproved(content, oldDocNumber, newDocNumber, decider) {
  const { full: today } = getTodayKST();
  let result = content;

  // 1. DRAFT 워터마크 제거
  result = result.replace(/^>\s*⚠️\s*\*\*DRAFT\s*\/\s*미승인\*\*.*\n\n?/m, '');

  // 2. 제목의 문서번호 변경
  result = result.replace(
    new RegExp(`#\\s*${escapeRegex(oldDocNumber)}:`),
    `# ${newDocNumber}:`
  );

  // 3. 결정 정보 테이블 업데이트
  // 문서번호 변경
  result = result.replace(
    /\|\s*문서번호\s*\|\s*.+?\s*\|/,
    `| 문서번호 | ${newDocNumber} |`
  );

  // 상태 변경
  result = result.replace(
    /\|\s*상태\s*\|\s*.+?\s*\|/,
    `| 상태 | APPROVED |`
  );

  // 승인자 변경
  result = result.replace(
    /\|\s*승인자\s*\|\s*.+?\s*\|/,
    `| 승인자 | ${decider} |`
  );

  // 날짜 변경
  result = result.replace(
    /\|\s*날짜\s*\|\s*.+?\s*\|/,
    `| 날짜 | ${today} |`
  );

  // 4. 배경 섹션 안내문 업데이트
  result = result.replace(
    /> 아래 내용을 검토 후 승인\/수정해주세요\./,
    `> ${decider}에 의해 ${today}에 승인되었습니다.`
  );

  // 5. 승인 이력 테이블에 승인 기록 추가
  const approvalRow = `| ${today} | ${decider} | APPROVED | 정식 승인 |`;

  // 기존 승인 이력 테이블 끝에 추가
  if (result.includes('## 승인 이력')) {
    // 테이블 마지막 행 찾아서 그 다음에 추가
    const lines = result.split('\n');
    const newLines = [];
    let inApprovalTable = false;
    let tableEnded = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      newLines.push(line);

      if (line.includes('## 승인 이력')) {
        inApprovalTable = true;
      }

      if (inApprovalTable && !tableEnded) {
        // 테이블 행인지 확인 (|로 시작)
        if (line.trim().startsWith('|') && !line.includes('날짜') && !line.includes('---')) {
          // 다음 줄이 테이블이 아니면 여기서 추가
          const nextLine = lines[i + 1];
          if (!nextLine || !nextLine.trim().startsWith('|')) {
            newLines.push(approvalRow);
            tableEnded = true;
          }
        }
      }
    }

    result = newLines.join('\n');
  }

  // 6. 자동 생성 안내문 업데이트
  result = result.replace(
    /\*이 문서는 `scripts\/dec-generate\.js`로 자동 생성되었습니다\.\*/,
    `*이 문서는 \`scripts/dec-generate.js\`로 생성되고 \`scripts/dec-approve.js\`로 승인되었습니다.*`
  );

  return result;
}

/**
 * 정규식 특수문자 이스케이프
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 원본 문서번호 추출
 */
function extractOldDocNumber(content) {
  const match = content.match(/^#\s*(DEC-[A-Z]+-\d+-\d+):/m);
  if (match) {
    return match[1];
  }
  // 워터마크가 있으면 그 다음 줄에서 찾기
  const match2 = content.match(/^#\s*(DEC-\S+):/m);
  return match2 ? match2[1] : null;
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
function writeLog(options, oldDocNumber, newDocNumber, runtimeMs) {
  const logPath = path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson');
  const logDir = path.dirname(logPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'dec_approve',
    old_doc_number: oldDocNumber,
    new_doc_number: newDocNumber,
    decider: options.decider,
    input_file: options.in,
    output_file: options.out,
    deleted_draft: options.delete,
    runtime_ms: runtimeMs
  };

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
}

/**
 * Index 업데이트 로그 기록
 */
function writeIndexLog(decMeta, indexSuccess, manifestSuccess, error) {
  const logPath = path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson');

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'dec_index_update',
    doc_id: decMeta.id,
    index_updated: indexSuccess,
    manifest_updated: manifestSuccess,
    error: error || null
  };

  try {
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
  } catch (e) {
    // 로그 실패는 무시
  }
}

/**
 * 기존 DEC 파일들에서 메타데이터 수집
 */
function collectExistingDECs() {
  const decisionsDir = path.join(__dirname, '..', 'docs', 'decisions');
  const decs = [];

  if (!fs.existsSync(decisionsDir)) {
    return decs;
  }

  const files = fs.readdirSync(decisionsDir);
  // DEC-YYYY-MMDD-### 형태만 (DRAFT 제외)
  const pattern = /^DEC-(\d{4})-(\d{4})-(\d{3})(?:_(.+))?\.md$/;

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const [, year, monthDay, seq, slug] = match;
      const date = `${year}-${monthDay.slice(0, 2)}-${monthDay.slice(2, 4)}`;
      const id = `DEC-${year}-${monthDay}-${seq}`;

      // 파일에서 승인자 추출 시도
      let approvedBy = '미정';
      let title = slug ? slug.replace(/_/g, ' ') : id;

      try {
        const content = fs.readFileSync(path.join(decisionsDir, file), 'utf-8');
        const approverMatch = content.match(/\|\s*승인자\s*\|\s*(.+?)\s*\|/);
        if (approverMatch) {
          approvedBy = approverMatch[1].trim();
        }
        const titleMatch = content.match(/\|\s*(?:제목|주제)\s*\|\s*(.+?)\s*\|/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      } catch (e) {
        // 파일 읽기 실패 시 기본값 사용
      }

      decs.push({
        id,
        title,
        date,
        approved_by: approvedBy,
        path: `docs/decisions/${file}`,
        year,
        monthDay,
        seq: parseInt(seq, 10)
      });
    }
  }

  // 최신순 정렬 (날짜 내림차순, 번호 오름차순)
  decs.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.seq - b.seq;
  });

  return decs;
}

/**
 * docs/decisions/index.md 업데이트
 */
function updateDecisionsIndex(decMeta) {
  const indexPath = path.join(__dirname, '..', 'docs', 'decisions', 'index.md');

  // 기존 DEC 수집 (새 항목 포함)
  let decs = collectExistingDECs();

  // 새 항목이 이미 있는지 확인 (upsert)
  const existingIdx = decs.findIndex(d => d.id === decMeta.id);
  if (existingIdx >= 0) {
    decs[existingIdx] = { ...decs[existingIdx], ...decMeta };
  }
  // 이미 collectExistingDECs에서 파일을 읽었으므로 추가 불필요

  // 최대 50개 유지
  decs = decs.slice(0, 50);

  // 날짜별 그룹화
  const byDate = {};
  for (const dec of decs) {
    if (!byDate[dec.date]) {
      byDate[dec.date] = [];
    }
    byDate[dec.date].push(dec);
  }

  // 마크다운 생성
  let md = `# Decisions Index

> 최신 승인된 결정문 목록 (자동 생성)
> 마지막 업데이트: ${new Date().toISOString().slice(0, 10)}

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

  // 저장
  fs.writeFileSync(indexPath, md, 'utf-8');
  return true;
}

/**
 * docs/manifest.json 업데이트
 */
function updateManifest(decMeta) {
  const manifestPath = path.join(__dirname, '..', 'docs', 'manifest.json');

  let manifest = { decisions: [] };

  // 기존 manifest 로드
  if (fs.existsSync(manifestPath)) {
    try {
      const content = fs.readFileSync(manifestPath, 'utf-8');
      manifest = JSON.parse(content);
      if (!manifest.decisions) {
        manifest.decisions = [];
      }
    } catch (e) {
      // 파싱 실패 시 새로 생성
      manifest = { decisions: [] };
    }
  }

  // 새 항목 정제
  const newEntry = {
    id: decMeta.id,
    title: decMeta.title,
    date: decMeta.date,
    approved_by: decMeta.approved_by,
    path: decMeta.path
  };

  // 중복 제거 (id 기준 upsert)
  const existingIdx = manifest.decisions.findIndex(d => d.id === decMeta.id);
  if (existingIdx >= 0) {
    manifest.decisions[existingIdx] = newEntry;
  } else {
    // 최신 항목을 앞쪽에 배치
    manifest.decisions.unshift(newEntry);
  }

  // 최신순 정렬
  manifest.decisions.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return a.id.localeCompare(b.id);
  });

  // 저장
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  return true;
}

/**
 * Post-approve hook: Index와 Manifest 갱신 (best-effort)
 */
function runPostApproveHooks(decMeta, shouldLog) {
  let indexSuccess = false;
  let manifestSuccess = false;
  let error = null;

  console.log('📋 Index/Manifest 갱신 중...');

  try {
    indexSuccess = updateDecisionsIndex(decMeta);
    console.log('   ✅ docs/decisions/index.md 갱신됨');
  } catch (e) {
    error = `index: ${e.message}`;
    console.warn(`   ⚠️  index.md 갱신 실패: ${e.message}`);
  }

  try {
    manifestSuccess = updateManifest(decMeta);
    console.log('   ✅ docs/manifest.json 갱신됨');
  } catch (e) {
    error = error ? `${error}, manifest: ${e.message}` : `manifest: ${e.message}`;
    console.warn(`   ⚠️  manifest.json 갱신 실패: ${e.message}`);
  }

  // 로그 기록
  if (shouldLog) {
    writeIndexLog(decMeta, indexSuccess, manifestSuccess, error);
  }

  return { indexSuccess, manifestSuccess };
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
DEC 결정문 승인 스크립트 (P4-3C-2)
DRAFT → APPROVED 정식 문서로 승격

사용법:
  node scripts/dec-approve.js --in <DRAFT파일> --decider <승인자> [옵션]

필수 옵션:
  --in       DRAFT 파일 경로
  --decider  승인자 이름

선택 옵션:
  --out      출력 경로 (기본: docs/decisions/DEC-YYYY-MMDD-###_slug.md)
  --log      텔레메트리 로그 기록
  --delete   승인 후 원본 DRAFT 파일 삭제

예시:
  node scripts/dec-approve.js --in docs/decisions/DEC-DRAFT-20260105-0502_신호등_시스템.md --decider "푸르미르" --log
  node scripts/dec-approve.js --in docs/decisions/DEC-DRAFT-xxx.md --decider "코미" --delete --log
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

  if (!options.decider) {
    console.error('❌ --decider 옵션이 필요합니다.');
    printUsage();
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    // 1. DRAFT 파일 로드
    console.log(`📥 DRAFT 로드: ${options.in}`);
    const inputPath = path.resolve(options.in);

    if (!fs.existsSync(inputPath)) {
      throw new Error(`DRAFT 파일을 찾을 수 없습니다: ${inputPath}`);
    }

    const content = fs.readFileSync(inputPath, 'utf-8');

    // 2. DRAFT 상태 확인
    if (!content.includes('DRAFT') && !content.includes('미승인')) {
      console.warn('⚠️  이 문서는 DRAFT 상태가 아닐 수 있습니다. 계속 진행합니다.');
    }

    // 3. 원본 문서번호 추출
    const oldDocNumber = extractOldDocNumber(content);
    if (!oldDocNumber) {
      throw new Error('원본 문서번호를 추출할 수 없습니다.');
    }
    console.log(`   원본 문서번호: ${oldDocNumber}`);

    // 4. 새 문서번호 생성
    const newDocNumber = generateOfficialDocNumber();
    console.log(`   새 문서번호: ${newDocNumber}`);

    // 5. 문서 변환
    console.log('🔄 문서 변환 중...');
    const approvedContent = convertToApproved(content, oldDocNumber, newDocNumber, options.decider);

    // 6. 출력 경로 결정
    if (!options.out) {
      const slug = extractSlugFromPath(options.in);
      options.out = `docs/decisions/${newDocNumber}_${slug}.md`;
    }

    // 7. 저장
    const savedPath = saveOutput(approvedContent, options.out);
    const runtimeMs = Date.now() - startTime;

    console.log(`\n✅ DEC 승인 완료`);
    console.log(`   문서번호: ${oldDocNumber} → ${newDocNumber}`);
    console.log(`   승인자: ${options.decider}`);
    console.log(`   저장 경로: ${savedPath}`);

    // 8. 원본 삭제 (옵션)
    if (options.delete) {
      fs.unlinkSync(inputPath);
      console.log(`   🗑️  원본 DRAFT 삭제됨`);
    }

    // 9. Post-approve hooks: Index/Manifest 갱신 (best-effort)
    const slug = extractSlugFromPath(options.in);
    const { full: approvalDate } = getTodayKST();
    const decMeta = {
      id: newDocNumber,
      title: extractQueryFromContent(approvedContent) || slug.replace(/_/g, ' '),
      date: approvalDate,
      approved_by: options.decider,
      path: options.out
    };
    runPostApproveHooks(decMeta, options.log);

    // 10. 로그 기록
    if (options.log) {
      writeLog(options, oldDocNumber, newDocNumber, runtimeMs);
      console.log(`📊 로그 기록됨 (${runtimeMs}ms)`);
    }

  } catch (err) {
    console.error(`❌ 오류: ${err.message}`);
    process.exit(1);
  }
}

main();
