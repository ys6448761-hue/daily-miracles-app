#!/usr/bin/env node
/**
 * Manifest 검증 및 자동 수정 스크립트
 * P5-3: Manifest Drift 방지
 *
 * 사용법:
 *   node scripts/manifest-verify.js
 *   node scripts/manifest-verify.js --fix --log
 *   node scripts/manifest-verify.js --manifest docs/manifest.json --index docs/decisions/index.md
 *
 * 옵션:
 *   --manifest  대상 manifest 파일 (기본: docs/manifest.json)
 *   --index     대상 index 파일 (기본: docs/decisions/index.md)
 *   --fix       가능한 수정 자동 적용
 *   --out       리포트 저장 경로 (기본: artifacts/manifest_report.md)
 *   --log       NDJSON 로그 기록
 */

const fs = require('fs');
const path = require('path');

const DECISIONS_DIR = path.join(__dirname, '..', 'docs', 'decisions');

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    manifest: 'docs/manifest.json',
    index: 'docs/decisions/index.md',
    fix: false,
    out: 'artifacts/manifest_report.md',
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--manifest' && args[i + 1]) {
      result.manifest = args[++i];
    } else if (arg.startsWith('--manifest=')) {
      result.manifest = arg.split('=').slice(1).join('=');
    } else if (arg === '--index' && args[i + 1]) {
      result.index = args[++i];
    } else if (arg.startsWith('--index=')) {
      result.index = arg.split('=').slice(1).join('=');
    } else if (arg === '--fix') {
      result.fix = true;
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
 * 날짜 포맷 검증 (YYYY-MM-DD)
 */
function isValidDateFormat(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
}

/**
 * 실제 DEC 파일 목록 수집
 */
function collectActualDECs() {
  const decs = [];

  if (!fs.existsSync(DECISIONS_DIR)) {
    return decs;
  }

  const files = fs.readdirSync(DECISIONS_DIR);
  // DEC-YYYY-MMDD-### 형태만 (DRAFT, index 제외)
  const pattern = /^DEC-(\d{4})-(\d{4})-(\d{3})(?:_(.+))?\.md$/;

  for (const file of files) {
    const match = file.match(pattern);
    if (match) {
      const [, year, monthDay, seq, slug] = match;
      const date = `${year}-${monthDay.slice(0, 2)}-${monthDay.slice(2, 4)}`;
      const id = `DEC-${year}-${monthDay}-${seq}`;

      decs.push({
        id,
        file,
        path: `docs/decisions/${file}`,
        date,
        slug: slug || ''
      });
    }
  }

  return decs;
}

/**
 * Manifest 검증
 */
function verifyManifest(manifestPath, options) {
  const errors = [];
  const warnings = [];
  const fixes = [];

  const fullPath = path.join(__dirname, '..', manifestPath);

  // 1. 파일 존재 여부
  if (!fs.existsSync(fullPath)) {
    errors.push({ type: 'file_missing', message: `Manifest 파일 없음: ${manifestPath}` });
    return { errors, warnings, fixes, manifest: null };
  }

  // 2. JSON 파싱
  let manifest;
  try {
    const content = fs.readFileSync(fullPath, 'utf-8');
    manifest = JSON.parse(content);
  } catch (e) {
    errors.push({ type: 'parse_error', message: `JSON 파싱 실패: ${e.message}` });
    return { errors, warnings, fixes, manifest: null };
  }

  // 3. decisions 배열 존재
  if (!manifest.decisions || !Array.isArray(manifest.decisions)) {
    errors.push({ type: 'structure', message: 'decisions 배열이 없거나 유효하지 않음' });
    if (options.fix) {
      manifest.decisions = [];
      fixes.push('decisions 배열 생성됨');
    }
  }

  // 실제 파일 목록
  const actualDECs = collectActualDECs();
  const actualPaths = new Set(actualDECs.map(d => d.path));
  const actualIds = new Set(actualDECs.map(d => d.id));

  // 4. 각 항목 검증
  const seenIds = new Set();
  const requiredFields = ['id', 'title', 'date', 'approved_by', 'path'];

  for (let i = 0; i < (manifest.decisions || []).length; i++) {
    const dec = manifest.decisions[i];
    const idx = i;

    // 필수 필드 체크
    for (const field of requiredFields) {
      if (!dec[field]) {
        if (field === 'approved_by') {
          warnings.push({ type: 'missing_field', message: `[${idx}] ${field} 누락`, id: dec.id });
          if (options.fix) {
            dec[field] = '미정';
            fixes.push(`[${dec.id}] ${field}를 "미정"으로 설정`);
          }
        } else if (field === 'title') {
          warnings.push({ type: 'missing_field', message: `[${idx}] title 누락`, id: dec.id });
          if (options.fix) {
            dec.title = dec.id || 'Untitled';
            fixes.push(`[${dec.id}] title을 id로 설정`);
          }
        } else {
          errors.push({ type: 'missing_field', message: `[${idx}] 필수 필드 ${field} 누락` });
        }
      }
    }

    // ID 중복 체크
    if (dec.id) {
      if (seenIds.has(dec.id)) {
        errors.push({ type: 'duplicate_id', message: `중복 ID: ${dec.id}` });
      }
      seenIds.add(dec.id);
    }

    // 날짜 포맷 체크
    if (dec.date && !isValidDateFormat(dec.date)) {
      warnings.push({ type: 'date_format', message: `잘못된 날짜 포맷: ${dec.date}`, id: dec.id });
      if (options.fix) {
        // YYYY/MM/DD → YYYY-MM-DD 변환 시도
        const fixed = dec.date.replace(/\//g, '-');
        if (isValidDateFormat(fixed)) {
          dec.date = fixed;
          fixes.push(`[${dec.id}] 날짜 포맷 수정: ${dec.date}`);
        }
      }
    }

    // 경로 존재 여부
    if (dec.path) {
      const pathFull = path.join(__dirname, '..', dec.path);

      // 와일드카드 처리
      if (dec.path.includes('*')) {
        const baseName = path.basename(dec.path).replace('*', '');
        const matchingFile = actualDECs.find(d =>
          d.path.includes(baseName) || d.id === dec.id
        );

        if (matchingFile) {
          if (options.fix) {
            dec.path = matchingFile.path;
            fixes.push(`와일드카드 경로 수정: ${dec.path}`);
          } else {
            warnings.push({ type: 'wildcard_path', message: `와일드카드 경로: ${dec.path}`, id: dec.id });
          }
        } else {
          errors.push({ type: 'missing_file', message: `파일 없음 (와일드카드): ${dec.path}` });
        }
      } else if (!fs.existsSync(pathFull)) {
        errors.push({ type: 'missing_file', message: `파일 없음: ${dec.path}` });
      }
    }
  }

  // 5. manifest에 없지만 실제 존재하는 DEC 파일 체크
  const manifestIds = new Set((manifest.decisions || []).map(d => d.id));
  for (const actual of actualDECs) {
    if (!manifestIds.has(actual.id)) {
      warnings.push({
        type: 'not_in_manifest',
        message: `Manifest에 없는 파일: ${actual.path}`,
        id: actual.id
      });
    }
  }

  // 6. 정렬 체크 (최신순)
  const decisions = manifest.decisions || [];
  let isSorted = true;
  for (let i = 1; i < decisions.length; i++) {
    if (decisions[i].date > decisions[i - 1].date) {
      isSorted = false;
      break;
    }
  }
  if (!isSorted) {
    warnings.push({ type: 'sort_order', message: 'decisions가 최신순으로 정렬되지 않음' });
    if (options.fix) {
      manifest.decisions.sort((a, b) => {
        const dateCompare = (b.date || '').localeCompare(a.date || '');
        if (dateCompare !== 0) return dateCompare;
        return (a.id || '').localeCompare(b.id || '');
      });
      fixes.push('decisions 최신순 정렬됨');
    }
  }

  return { errors, warnings, fixes, manifest };
}

/**
 * Index 검증
 */
function verifyIndex(indexPath, manifest, options) {
  const errors = [];
  const warnings = [];
  const fixes = [];

  const fullPath = path.join(__dirname, '..', indexPath);

  // 1. 파일 존재 여부
  if (!fs.existsSync(fullPath)) {
    warnings.push({ type: 'file_missing', message: `Index 파일 없음: ${indexPath}` });
    return { errors, warnings, fixes, needsRebuild: true };
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // 2. 깨진 링크 체크
  const pathMatches = content.match(/docs\/decisions\/[^\s\n]+\.md/g) || [];

  for (const docPath of pathMatches) {
    const cleanPath = docPath.replace(/[`\[\]()]/g, '');
    const pathFull = path.join(__dirname, '..', cleanPath);

    if (!fs.existsSync(pathFull)) {
      errors.push({ type: 'broken_link', message: `Index에 깨진 링크: ${cleanPath}` });
    }
  }

  // 3. manifest와 일관성 체크 (상위 5개)
  if (manifest && manifest.decisions && manifest.decisions.length > 0) {
    const top5Manifest = manifest.decisions.slice(0, 5).map(d => d.id);
    let matchCount = 0;

    for (const id of top5Manifest) {
      if (content.includes(id)) {
        matchCount++;
      }
    }

    if (matchCount < 3) {
      warnings.push({
        type: 'consistency',
        message: `Index와 Manifest 상위 5개 중 ${matchCount}개만 일치`
      });
    }
  }

  // 4. 마지막 업데이트 날짜 체크
  const dateMatch = content.match(/마지막 업데이트:\s*(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    const indexDate = dateMatch[1];
    const today = new Date().toISOString().slice(0, 10);

    // 7일 이상 지났으면 경고
    const daysDiff = Math.floor(
      (new Date(today) - new Date(indexDate)) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff > 7) {
      warnings.push({
        type: 'stale',
        message: `Index가 ${daysDiff}일 전에 마지막 업데이트됨`
      });
    }
  }

  return { errors, warnings, fixes, needsRebuild: false };
}

/**
 * 리포트 생성 (Markdown)
 */
function generateReport(options, manifestResult, indexResult, runtimeMs) {
  const today = new Date().toISOString().slice(0, 10);
  const totalErrors = manifestResult.errors.length + indexResult.errors.length;
  const totalWarnings = manifestResult.warnings.length + indexResult.warnings.length;
  const totalFixes = manifestResult.fixes.length + indexResult.fixes.length;

  let md = `# Manifest Verify Report

- **Date**: ${today}
- **Manifest**: ${options.manifest}
- **Index**: ${options.index}
- **Fix Applied**: ${options.fix}
- **Runtime**: ${runtimeMs}ms

## Summary

- **Total decisions**: ${manifestResult.manifest?.decisions?.length || 0}
- **Errors**: ${totalErrors}
- **Warnings**: ${totalWarnings}
- **Fixed**: ${totalFixes}

`;

  // Errors
  const allErrors = [...manifestResult.errors, ...indexResult.errors];
  if (allErrors.length > 0) {
    md += `## Errors\n\n`;
    allErrors.forEach((e, i) => {
      md += `${i + 1}) [${e.type}] ${e.message}\n`;
    });
    md += '\n';
  }

  // Warnings
  const allWarnings = [...manifestResult.warnings, ...indexResult.warnings];
  if (allWarnings.length > 0) {
    md += `## Warnings\n\n`;
    allWarnings.forEach((w, i) => {
      md += `${i + 1}) [${w.type}] ${w.message}\n`;
    });
    md += '\n';
  }

  // Fixes
  const allFixes = [...manifestResult.fixes, ...indexResult.fixes];
  if (allFixes.length > 0) {
    md += `## Fixes Applied\n\n`;
    allFixes.forEach((f, i) => {
      md += `${i + 1}) ${f}\n`;
    });
    md += '\n';
  }

  // 결과 상태
  if (totalErrors === 0 && totalWarnings === 0) {
    md += `---\n\n✅ **모든 검증 통과** - Manifest와 Index가 정상입니다.\n`;
  } else if (totalErrors === 0) {
    md += `---\n\n⚠️ **경고 ${totalWarnings}개** - 권장 수정 사항이 있습니다.\n`;
  } else {
    md += `---\n\n❌ **오류 ${totalErrors}개** - 수동 확인이 필요합니다.\n`;
  }

  return md;
}

/**
 * 리포트 저장
 */
function saveReport(content, outPath) {
  const fullPath = path.join(__dirname, '..', outPath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

/**
 * Manifest 저장
 */
function saveManifest(manifest, manifestPath) {
  const fullPath = path.join(__dirname, '..', manifestPath);
  fs.writeFileSync(fullPath, JSON.stringify(manifest, null, 2), 'utf-8');
}

/**
 * NDJSON 로그 기록
 */
function writeLog(errors, warnings, fixed, runtimeMs) {
  const logPath = path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson');
  const logDir = path.dirname(logPath);

  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'manifest_verify',
    errors: errors,
    warnings: warnings,
    fixed: fixed,
    runtime_ms: runtimeMs
  };

  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
Manifest 검증 및 자동 수정 (P5-3)

사용법:
  node scripts/manifest-verify.js [옵션]

옵션:
  --manifest  대상 manifest (기본: docs/manifest.json)
  --index     대상 index (기본: docs/decisions/index.md)
  --fix       가능한 수정 자동 적용
  --out       리포트 저장 경로 (기본: artifacts/manifest_report.md)
  --log       NDJSON 로그 기록

예시:
  node scripts/manifest-verify.js
  node scripts/manifest-verify.js --fix --log
  node scripts/manifest-verify.js --manifest docs/manifest.json --fix
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

  console.log('🔍 Manifest 검증 시작...');
  console.log(`   Manifest: ${options.manifest}`);
  console.log(`   Index: ${options.index}`);
  console.log(`   Fix: ${options.fix}`);
  console.log('');

  // 1. Manifest 검증
  console.log('📋 Manifest 검증 중...');
  const manifestResult = verifyManifest(options.manifest, options);

  if (manifestResult.errors.length > 0) {
    console.log(`   ❌ 오류 ${manifestResult.errors.length}개`);
  }
  if (manifestResult.warnings.length > 0) {
    console.log(`   ⚠️  경고 ${manifestResult.warnings.length}개`);
  }
  if (manifestResult.fixes.length > 0) {
    console.log(`   🔧 수정 ${manifestResult.fixes.length}개`);
  }

  // 2. Index 검증
  console.log('📋 Index 검증 중...');
  const indexResult = verifyIndex(options.index, manifestResult.manifest, options);

  if (indexResult.errors.length > 0) {
    console.log(`   ❌ 오류 ${indexResult.errors.length}개`);
  }
  if (indexResult.warnings.length > 0) {
    console.log(`   ⚠️  경고 ${indexResult.warnings.length}개`);
  }

  // 3. 수정 적용
  if (options.fix && manifestResult.fixes.length > 0 && manifestResult.manifest) {
    saveManifest(manifestResult.manifest, options.manifest);
    console.log(`\n✅ Manifest 수정 저장됨`);
  }

  const runtimeMs = Date.now() - startTime;

  // 4. 리포트 생성
  const report = generateReport(options, manifestResult, indexResult, runtimeMs);
  const reportPath = saveReport(report, options.out);
  console.log(`\n📄 리포트 저장됨: ${reportPath}`);

  // 5. 요약 출력
  const totalErrors = manifestResult.errors.length + indexResult.errors.length;
  const totalWarnings = manifestResult.warnings.length + indexResult.warnings.length;
  const totalFixes = manifestResult.fixes.length + indexResult.fixes.length;

  console.log('\n' + '='.repeat(50));
  if (totalErrors === 0 && totalWarnings === 0) {
    console.log('✅ 모든 검증 통과');
  } else {
    console.log(`결과: 오류 ${totalErrors}개, 경고 ${totalWarnings}개, 수정 ${totalFixes}개`);
  }
  console.log('='.repeat(50));

  // 6. 로그 기록
  if (options.log) {
    writeLog(totalErrors, totalWarnings, totalFixes, runtimeMs);
    console.log(`📊 로그 기록됨 (${runtimeMs}ms)`);
  }

  // 오류가 있으면 exit code 1
  if (totalErrors > 0) {
    process.exit(1);
  }
}

main();
