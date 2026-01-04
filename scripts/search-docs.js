#!/usr/bin/env node
/**
 * 문서 검색 에이전트 v1.3
 * Context Bundle 생성 + Telemetry + Manifest 기반 검색 지원
 *
 * 사용법:
 *   node scripts/search-docs.js --query "신호등 시스템"
 *   node scripts/search-docs.js --query "Airtable" --scopes decisions,system --format json
 *   node scripts/search-docs.js --query "소원그림" --k 10 --out artifacts/context_bundle.md
 *   node scripts/search-docs.js --query "신호등" --log  # 텔레메트리 로깅
 *   node scripts/search-docs.js --query "DEC-2026" --scopes decisions --use-manifest  # Manifest 우선 검색
 *
 * 옵션:
 *   --query           검색어 (필수)
 *   --scopes          검색 범위 (decisions,system,execution,team,all) 기본: all
 *   --k               상위 결과 개수 (기본: 5)
 *   --format          출력 형식 (md|json) 기본: md
 *   --out             저장 경로 (예: artifacts/context_bundle.md)
 *   --include-snippet 스니펫 포함 여부 (true|false) 기본: true
 *   --max-snippet-chars 스니펫 최대 문자수 (기본: 400)
 *   --recency-bias    최신 문서 가중치 (on|off) 기본: on
 *   --use-manifest    decisions 스코프에서 manifest 우선 사용 (기본: true)
 *   --deep            manifest 매칭 있어도 파일 스캔 병행 (기본: false)
 *   --log             텔레메트리 로그 기록 (artifacts/search_logs.ndjson)
 *   -i, --interactive 인터랙티브 모드
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const ARTIFACTS_DIR = path.join(__dirname, '..', 'artifacts');

// 검색 범위 폴더 매핑
const SCOPE_MAPPING = {
  decisions: 'docs/decisions',
  system: 'docs/system',
  execution: 'docs/execution',
  team: 'docs/team',
  all: 'docs'
};

// 색상 코드 (터미널 출력용)
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * CLI 인자 파싱
 */
function parseArgs(args) {
  const result = {
    query: '',
    scopes: ['all'],
    k: 5,
    format: 'md',
    out: null,
    includeSnippet: true,
    maxSnippetChars: 400,
    recencyBias: true,
    useManifest: true,
    deep: false,
    interactive: false,
    log: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-i' || arg === '--interactive') {
      result.interactive = true;
    } else if (arg === '--query' && args[i + 1]) {
      result.query = args[++i];
    } else if (arg.startsWith('--query=')) {
      result.query = arg.split('=').slice(1).join('=');
    } else if (arg === '--scopes' && args[i + 1]) {
      result.scopes = args[++i].split(',').map(s => s.trim());
    } else if (arg.startsWith('--scopes=')) {
      result.scopes = arg.split('=')[1].split(',').map(s => s.trim());
    } else if (arg === '--k' && args[i + 1]) {
      result.k = parseInt(args[++i]) || 5;
    } else if (arg.startsWith('--k=')) {
      result.k = parseInt(arg.split('=')[1]) || 5;
    } else if (arg === '--format' && args[i + 1]) {
      result.format = args[++i];
    } else if (arg.startsWith('--format=')) {
      result.format = arg.split('=')[1];
    } else if (arg === '--out' && args[i + 1]) {
      result.out = args[++i];
    } else if (arg.startsWith('--out=')) {
      result.out = arg.split('=')[1];
    } else if (arg === '--include-snippet' && args[i + 1]) {
      result.includeSnippet = args[++i] !== 'false';
    } else if (arg.startsWith('--include-snippet=')) {
      result.includeSnippet = arg.split('=')[1] !== 'false';
    } else if (arg === '--max-snippet-chars' && args[i + 1]) {
      result.maxSnippetChars = parseInt(args[++i]) || 400;
    } else if (arg.startsWith('--max-snippet-chars=')) {
      result.maxSnippetChars = parseInt(arg.split('=')[1]) || 400;
    } else if (arg === '--recency-bias' && args[i + 1]) {
      result.recencyBias = args[++i] !== 'off';
    } else if (arg.startsWith('--recency-bias=')) {
      result.recencyBias = arg.split('=')[1] !== 'off';
    } else if (arg === '--use-manifest') {
      result.useManifest = true;
    } else if (arg === '--use-manifest=false' || arg === '--no-manifest') {
      result.useManifest = false;
    } else if (arg.startsWith('--use-manifest=')) {
      result.useManifest = arg.split('=')[1] !== 'false';
    } else if (arg === '--deep') {
      result.deep = true;
    } else if (arg.startsWith('--deep=')) {
      result.deep = arg.split('=')[1] === 'true';
    } else if (arg === '--log') {
      result.log = true;
    }
  }

  return result;
}

/**
 * 파일명/내용에서 날짜 추출
 */
function extractDate(filePath, content) {
  const fileName = path.basename(filePath);

  // 1. 파일명에서 DEC-YYYY-MMDD 패턴
  const decMatch = fileName.match(/DEC-(\d{4})-(\d{2})(\d{2})/i);
  if (decMatch) {
    return `${decMatch[1]}-${decMatch[2]}-${decMatch[3]}`;
  }

  // 2. 파일명에서 YYYY-MM-DD 패턴
  const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }

  // 3. 파일명에서 YYYYMMDD 패턴
  const compactMatch = fileName.match(/(\d{8})/);
  if (compactMatch) {
    const d = compactMatch[1];
    return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
  }

  // 4. Frontmatter에서 date 필드
  if (content) {
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const dateFieldMatch = fmMatch[1].match(/date:\s*["']?(\d{4}-\d{2}-\d{2})["']?/i);
      if (dateFieldMatch) {
        return dateFieldMatch[1];
      }
    }
  }

  // 5. 파일 수정일 (fallback)
  try {
    const stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

/**
 * 문서 제목 추출
 */
function extractTitle(filePath, content) {
  const fileName = path.basename(filePath, '.md');

  // 1. Frontmatter에서 title 필드
  if (content) {
    const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const titleMatch = fmMatch[1].match(/title:\s*["']?(.+?)["']?\s*$/m);
      if (titleMatch) {
        return titleMatch[1].trim();
      }
    }

    // 2. 첫 번째 # 헤더
    const headerMatch = content.match(/^#\s+(.+)$/m);
    if (headerMatch) {
      return headerMatch[1].trim();
    }
  }

  // 3. 파일명 (언더스코어 → 공백)
  return fileName.replace(/_/g, ' ');
}

/**
 * 스니펫 추출 (매칭 주변 텍스트)
 */
function extractSnippet(content, keywords, maxChars = 400) {
  if (!content || keywords.length === 0) return '';

  const contentLower = content.toLowerCase();
  let bestIdx = -1;
  let bestScore = 0;

  // 가장 많은 키워드가 포함된 위치 찾기
  for (let i = 0; i < contentLower.length - 100; i += 50) {
    const window = contentLower.slice(i, i + maxChars);
    let score = 0;
    keywords.forEach(kw => {
      if (window.includes(kw.toLowerCase())) score++;
    });
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  if (bestIdx < 0) {
    // 첫 부분 반환
    return content.slice(0, maxChars).replace(/\n/g, ' ').trim() + '...';
  }

  const start = Math.max(0, bestIdx - 20);
  const end = Math.min(content.length, start + maxChars);
  let snippet = content.slice(start, end).replace(/\n/g, ' ').trim();

  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}

/**
 * 하이라이트 키워드 추출
 */
function extractHighlights(content, keywords) {
  const found = [];
  const contentLower = content.toLowerCase();

  keywords.forEach(kw => {
    if (contentLower.includes(kw.toLowerCase())) {
      found.push(kw);
    }
  });

  return found;
}

/**
 * Recency 점수 계산
 */
function calculateRecencyScore(dateStr) {
  if (!dateStr) return 0;

  try {
    const docDate = new Date(dateStr);
    const now = new Date();
    const daysDiff = Math.floor((now - docDate) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) return 0.15;    // 1주일 이내
    if (daysDiff <= 30) return 0.1;    // 30일 이내
    if (daysDiff <= 90) return 0.05;   // 90일 이내
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Manifest 로드
 */
function loadManifest() {
  const manifestPath = path.join(__dirname, '..', 'docs', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Manifest 기반 검색 (Stage 1: Fast Path)
 */
function searchManifest(query, options) {
  const manifest = loadManifest();

  if (!manifest || !manifest.decisions || manifest.decisions.length === 0) {
    return { results: [], source: 'manifest' };
  }

  const queryLower = query.toLowerCase();
  const keywords = queryLower.split(/\s+/).filter(k => k.length > 1);
  const results = [];

  for (const dec of manifest.decisions) {
    const idLower = (dec.id || '').toLowerCase();
    const titleLower = (dec.title || '').toLowerCase();
    const approverLower = (dec.approved_by || '').toLowerCase();

    let score = 0;
    let matchType = null;

    // ID 직접 매칭 (최고 점수)
    if (idLower === queryLower || idLower.includes(queryLower)) {
      score = 0.95;
      matchType = 'id_direct';
    }
    // Title 직접 매칭
    else if (titleLower === queryLower) {
      score = 0.95;
      matchType = 'title_direct';
    }
    // 키워드 부분 매칭
    else {
      let matchCount = 0;
      for (const kw of keywords) {
        if (idLower.includes(kw) || titleLower.includes(kw) || approverLower.includes(kw)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        // 부분 매칭: 키워드 비율에 따라 0.70-0.85
        score = 0.70 + (matchCount / keywords.length) * 0.15;
        matchType = 'partial';
      }
    }

    if (score > 0) {
      // Recency bias 적용
      if (options.recencyBias && dec.date) {
        score *= (1 + calculateRecencyScore(dec.date));
        score = Math.min(1, score); // 1.0 초과 방지
      }

      results.push({
        path: dec.path,
        score: parseFloat(score.toFixed(2)),
        updated_at: dec.date,
        title: dec.title,
        snippet: `[Manifest] ${dec.title} - 승인자: ${dec.approved_by}`,
        highlights: keywords.filter(kw =>
          idLower.includes(kw) || titleLower.includes(kw)
        ),
        _matchType: matchType,
        _source: 'manifest'
      });
    }
  }

  // 점수순 정렬
  results.sort((a, b) => b.score - a.score);

  return { results, source: 'manifest' };
}

/**
 * 2-Stage 검색: decisions 스코프용
 */
function searchDecisionsWithManifest(options) {
  const { query, k, deep } = options;

  // Stage 1: Manifest 검색
  const manifestSearch = searchManifest(query, options);
  let results = manifestSearch.results;
  let source = 'manifest';

  // Stage 2: Fallback 또는 Deep 모드
  const needsFallback = results.length === 0;
  const needsDeep = deep && results.length > 0;

  if (needsFallback || needsDeep) {
    // 파일 시스템 검색
    const fsResults = searchDocumentsFilesystem({
      ...options,
      scopes: ['decisions']
    });

    if (needsFallback) {
      // Fallback: 파일 스캔 결과만 사용
      results = fsResults;
      source = 'filesystem';
    } else if (needsDeep) {
      // Deep: 병합 (manifest 결과 우선, 중복 제거)
      const existingPaths = new Set(results.map(r => r.path));

      for (const fsResult of fsResults) {
        if (!existingPaths.has(fsResult.path)) {
          // 파일 스캔 결과는 source 표시
          fsResult._source = 'filesystem';
          results.push(fsResult);
        } else {
          // 이미 있는 항목: snippet 보강
          const existing = results.find(r => r.path === fsResult.path);
          if (existing && fsResult.snippet && !existing.snippet.startsWith('[Manifest]')) {
            existing.snippet = fsResult.snippet;
            existing._source = 'manifest+filesystem';
          }
        }
      }

      source = 'manifest+filesystem';
    }
  }

  // 점수순 정렬 후 Top K
  results.sort((a, b) => b.score - a.score);
  results = results.slice(0, k);

  return { results, source };
}

/**
 * 디렉토리 재귀 탐색
 */
function walkDir(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // raw, processed, index 폴더 제외
      if (!['raw', 'processed', 'index', 'images'].includes(item)) {
        walkDir(fullPath, fileList);
      }
    } else if (item.endsWith('.md')) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

/**
 * 검색 범위에 따른 파일 목록 가져오기
 */
function getFilesInScopes(scopes) {
  const files = [];
  const baseDir = path.join(__dirname, '..');

  for (const scope of scopes) {
    const scopePath = SCOPE_MAPPING[scope];
    if (!scopePath) continue;

    const fullPath = path.join(baseDir, scopePath);

    if (scope === 'all') {
      // all인 경우 decisions, system, execution, team만
      ['decisions', 'system', 'execution', 'team'].forEach(s => {
        const subPath = path.join(baseDir, 'docs', s);
        walkDir(subPath, files);
      });
      break;
    } else {
      walkDir(fullPath, files);
    }
  }

  return [...new Set(files)]; // 중복 제거
}

/**
 * 파일 시스템 기반 문서 검색 (기존 로직)
 */
function searchDocumentsFilesystem(options) {
  const { query, scopes, k, includeSnippet, maxSnippetChars, recencyBias } = options;

  if (!query) return [];

  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1);
  const files = getFilesInScopes(scopes);
  const results = [];

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const contentLower = content.toLowerCase();

      // 기본 점수: 키워드 매칭
      let score = 0;
      const matchCounts = {};

      keywords.forEach(kw => {
        const regex = new RegExp(kw, 'gi');
        const matches = content.match(regex);
        if (matches) {
          matchCounts[kw] = matches.length;
          score += matches.length;
        }
      });

      if (score === 0) continue;

      // 제목/파일명 매칭 보너스
      const fileName = path.basename(filePath).toLowerCase();
      keywords.forEach(kw => {
        if (fileName.includes(kw.toLowerCase())) {
          score += 10;
        }
      });

      // 날짜 및 제목 추출
      const docDate = extractDate(filePath, content);
      const title = extractTitle(filePath, content);

      // Recency bias 적용
      if (recencyBias && docDate) {
        score *= (1 + calculateRecencyScore(docDate));
      }

      // 정규화된 점수 (0-1 범위 근사)
      const normalizedScore = Math.min(1, score / 50);

      const relativePath = path.relative(path.join(__dirname, '..'), filePath).replace(/\\/g, '/');

      const result = {
        path: relativePath,
        score: parseFloat(normalizedScore.toFixed(2)),
        updated_at: docDate,
        title: title
      };

      if (includeSnippet) {
        result.snippet = extractSnippet(content, keywords, maxSnippetChars);
        result.highlights = extractHighlights(content, keywords);
      }

      results.push(result);
    } catch (err) {
      // 파일 읽기 실패 시 무시
    }
  }

  // 점수순 정렬 후 Top K 반환
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * 문서 검색 메인 함수 (2-Stage 검색 지원)
 */
function searchDocuments(options) {
  const { scopes, useManifest } = options;

  // decisions 스코프이고 useManifest가 true인 경우 2-Stage 검색
  const isDecisionsOnly = scopes.length === 1 && scopes[0] === 'decisions';
  const includesDecisions = scopes.includes('decisions') || scopes.includes('all');

  if (useManifest && isDecisionsOnly) {
    // decisions 단독 스코프: 2-Stage 검색
    const { results, source } = searchDecisionsWithManifest(options);
    // source 정보를 results에 첨부 (로깅용)
    results._searchSource = source;
    return results;
  } else if (useManifest && includesDecisions && scopes.length > 1) {
    // 복합 스코프: decisions는 manifest로, 나머지는 filesystem으로
    const otherScopes = scopes.filter(s => s !== 'decisions' && s !== 'all');

    // decisions manifest 검색
    const { results: manifestResults, source: manifestSource } = searchDecisionsWithManifest({
      ...options,
      scopes: ['decisions']
    });

    // 나머지 스코프 filesystem 검색
    let fsResults = [];
    if (otherScopes.length > 0 || scopes.includes('all')) {
      fsResults = searchDocumentsFilesystem({
        ...options,
        scopes: scopes.includes('all') ? ['system', 'execution', 'team'] : otherScopes
      });
    }

    // 병합 및 정렬
    const combined = [...manifestResults, ...fsResults];
    combined.sort((a, b) => b.score - a.score);
    const results = combined.slice(0, options.k);
    results._searchSource = manifestResults.length > 0 ? 'manifest+filesystem' : 'filesystem';
    return results;
  } else {
    // manifest 미사용 또는 decisions 미포함: 기존 filesystem 검색
    const results = searchDocumentsFilesystem(options);
    results._searchSource = 'filesystem';
    return results;
  }
}

/**
 * JSON 형식 출력 생성
 */
function formatJSON(results, options) {
  const output = {
    query: options.query,
    scopes: options.scopes,
    k: options.k,
    generated_at: new Date().toISOString(),
    results: results
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Markdown 형식 출력 생성
 */
function formatMarkdown(results, options) {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const generated = kstTime.toISOString().slice(0, 16).replace('T', ' ') + ' KST';

  let md = `# Context Bundle

- **Query**: ${options.query}
- **Scopes**: ${options.scopes.join(', ')}
- **Generated**: ${generated}
- **TopK**: ${options.k}

---

`;

  if (results.length === 0) {
    md += `> 검색 결과가 없습니다.\n`;
    return md;
  }

  results.forEach((doc, idx) => {
    md += `## ${idx + 1}) ${doc.title}\n\n`;
    md += `- **Path**: \`${doc.path}\`\n`;
    md += `- **Score**: ${doc.score}\n`;
    if (doc.updated_at) {
      md += `- **Updated**: ${doc.updated_at}\n`;
    }
    if (doc.snippet) {
      md += `- **Snippet**: ${doc.snippet}\n`;
    }
    if (doc.highlights && doc.highlights.length > 0) {
      md += `- **Highlights**: ${doc.highlights.join(', ')}\n`;
    }
    md += '\n';
  });

  return md;
}

/**
 * 결과 저장
 */
function saveOutput(content, outPath) {
  const fullPath = path.join(__dirname, '..', outPath);
  const dir = path.dirname(fullPath);

  // 디렉토리 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

/**
 * 텔레메트리 로그 기록 (NDJSON)
 */
function writeSearchLog(options, results, runtimeMs) {
  const logPath = path.join(__dirname, '..', 'artifacts', 'search_logs.ndjson');
  const logDir = path.dirname(logPath);

  // 디렉토리 생성
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // source 정보 추출 (결과 배열에 첨부된 _searchSource 사용)
  const source = results._searchSource || 'filesystem';

  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'search',
    source: source,
    query: options.query,
    scopes: options.scopes,
    k: options.k,
    format: options.format,
    use_manifest: options.useManifest,
    deep: options.deep,
    top_results: results.slice(0, 5).map(r => r.path),
    result_count: results.length,
    runtime_ms: runtimeMs
  };

  // Append to NDJSON file
  fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n', 'utf-8');
}

/**
 * 사용법 출력
 */
function printUsage() {
  console.log(`
${colors.bold}문서 검색 에이전트 v1.3${colors.reset}
Context Bundle 생성 + Manifest 기반 검색 지원

${colors.cyan}사용법:${colors.reset}
  node scripts/search-docs.js --query "검색어" [옵션]

${colors.cyan}옵션:${colors.reset}
  --query             검색어 (필수)
  --scopes            검색 범위 (decisions,system,execution,team,all) 기본: all
  --k                 상위 결과 개수 (기본: 5)
  --format            출력 형식 (md|json) 기본: md
  --out               저장 경로 (예: artifacts/context_bundle.md)
  --include-snippet   스니펫 포함 여부 (true|false) 기본: true
  --max-snippet-chars 스니펫 최대 문자수 (기본: 400)
  --recency-bias      최신 문서 가중치 (on|off) 기본: on
  --use-manifest      decisions 스코프에서 manifest 우선 사용 (기본: true)
  --deep              manifest 매칭 있어도 파일 스캔 병행 (기본: false)
  --log               텔레메트리 로그 기록
  -i, --interactive   인터랙티브 모드

${colors.cyan}예시:${colors.reset}
  node scripts/search-docs.js --query "신호등 시스템" --scopes decisions --format md
  node scripts/search-docs.js --query "DEC-2026" --scopes decisions --log  # Manifest 우선
  node scripts/search-docs.js --query "신호등" --scopes decisions --deep   # 병행 검색
  node scripts/search-docs.js --query "Airtable" --format json --k 10 --out artifacts/bundle.json
`);
}

/**
 * 인터랙티브 모드
 */
function interactiveMode() {
  const readline = require('readline');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log(`\n${colors.bold}${colors.cyan}🔎 문서 검색 에이전트 v1.1${colors.reset}`);
  console.log('='.repeat(50));
  console.log('\n명령어:');
  console.log('  [검색어]     - 키워드 검색');
  console.log('  :scope [s]   - 범위 설정 (decisions,system,execution,team,all)');
  console.log('  :k [N]       - 결과 개수 설정');
  console.log('  :format [f]  - 출력 형식 (md|json)');
  console.log('  :save [path] - 결과 저장');
  console.log('  :quit        - 종료\n');

  let state = { scopes: ['all'], k: 5, format: 'md' };

  function prompt() {
    const scopeStr = state.scopes.join(',');
    rl.question(`${colors.green}검색>${colors.reset} [${scopeStr}|k=${state.k}|${state.format}] `, (input) => {
      input = input.trim();

      if (!input) { prompt(); return; }

      if (input === ':quit' || input === ':q') {
        console.log('\n👋 종료합니다.\n');
        rl.close();
        return;
      }

      if (input.startsWith(':scope ')) {
        state.scopes = input.split(' ')[1].split(',').map(s => s.trim());
        console.log(`✅ 범위: ${state.scopes.join(', ')}`);
        prompt(); return;
      }

      if (input.startsWith(':k ')) {
        state.k = parseInt(input.split(' ')[1]) || 5;
        console.log(`✅ 결과 개수: ${state.k}`);
        prompt(); return;
      }

      if (input.startsWith(':format ')) {
        state.format = input.split(' ')[1];
        console.log(`✅ 출력 형식: ${state.format}`);
        prompt(); return;
      }

      if (input.startsWith(':save ')) {
        console.log('💡 검색 후 --out 옵션으로 저장하세요');
        prompt(); return;
      }

      // 검색 실행
      const options = {
        query: input,
        scopes: state.scopes,
        k: state.k,
        format: state.format,
        includeSnippet: true,
        maxSnippetChars: 400,
        recencyBias: true
      };

      const results = searchDocuments(options);

      if (state.format === 'json') {
        console.log(formatJSON(results, options));
      } else {
        console.log(formatMarkdown(results, options));
      }

      prompt();
    });
  }

  prompt();
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

  // 인터랙티브 모드
  if (options.interactive) {
    interactiveMode();
    return;
  }

  // 쿼리 필수 체크
  if (!options.query) {
    console.error('❌ --query 옵션이 필요합니다.\n');
    printUsage();
    process.exit(1);
  }

  // 검색 실행 (시간 측정)
  const startTime = Date.now();
  const results = searchDocuments(options);
  const runtimeMs = Date.now() - startTime;

  // 출력 생성
  let output;
  if (options.format === 'json') {
    output = formatJSON(results, options);
  } else {
    output = formatMarkdown(results, options);
  }

  // 파일 저장 또는 stdout
  if (options.out) {
    const savedPath = saveOutput(output, options.out);
    console.log(`✅ 저장됨: ${savedPath}`);
    console.log(`   결과: ${results.length}개 문서`);
  } else {
    console.log(output);
  }

  // 텔레메트리 로깅
  if (options.log) {
    writeSearchLog(options, results, runtimeMs);
    console.log(`📊 로그 기록됨 (${runtimeMs}ms)`);
  }
}

main();
