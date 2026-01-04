#!/usr/bin/env node
/**
 * 문서 검색 에이전트
 * 루미 규칙 v1.0 기반
 *
 * 사용법:
 *   node scripts/search-docs.js "검색어"
 *   node scripts/search-docs.js "검색어" --type=decision
 *   node scripts/search-docs.js "검색어" --priority=P0
 *   node scripts/search-docs.js "검색어" --tag=kpi
 *   node scripts/search-docs.js "검색어" --raw (raw 포함 검색)
 *
 * 검색 우선순위:
 *   1. manifest.json에서 메타데이터 필터링
 *   2. 후보 문서 본문 검색
 *   3. raw/에서 근거 탐색 (--raw 옵션)
 */

const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const MANIFEST_PATH = path.join(DOCS_DIR, 'index', 'manifest.json');
const TAGS_PATH = path.join(DOCS_DIR, 'index', 'tags.json');
const RAW_DIR = path.join(DOCS_DIR, 'raw', 'conversations');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * 인자 파싱
 */
function parseArgs(args) {
  const result = {
    query: '',
    type: null,
    priority: null,
    tag: null,
    owner: null,
    includeRaw: false,
    limit: 10
  };

  args.forEach(arg => {
    if (arg.startsWith('--type=')) {
      result.type = arg.split('=')[1];
    } else if (arg.startsWith('--priority=')) {
      result.priority = arg.split('=')[1].toUpperCase();
    } else if (arg.startsWith('--tag=')) {
      result.tag = arg.split('=')[1];
    } else if (arg.startsWith('--owner=')) {
      result.owner = arg.split('=')[1];
    } else if (arg === '--raw') {
      result.includeRaw = true;
    } else if (arg.startsWith('--limit=')) {
      result.limit = parseInt(arg.split('=')[1]) || 10;
    } else if (!arg.startsWith('--')) {
      result.query = arg;
    }
  });

  return result;
}

/**
 * manifest.json 로드
 */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.json을 찾을 수 없습니다. 먼저 generate-manifest.js를 실행하세요.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

/**
 * tags.json 로드
 */
function loadTags() {
  if (!fs.existsSync(TAGS_PATH)) return {};
  return JSON.parse(fs.readFileSync(TAGS_PATH, 'utf-8'));
}

/**
 * 메타데이터 기반 필터링 (1단계)
 */
function filterByMetadata(documents, options) {
  return documents.filter(doc => {
    // 타입 필터
    if (options.type && doc.type !== options.type) return false;

    // 우선순위 필터
    if (options.priority && doc.priority !== options.priority) return false;

    // 태그 필터
    if (options.tag && !doc.tags.includes(options.tag)) return false;

    // 소유자 필터
    if (options.owner && doc.owner !== options.owner) return false;

    return true;
  });
}

/**
 * 키워드 기반 필터링 (manifest 메타데이터)
 */
function filterByKeyword(documents, query) {
  if (!query) return documents;

  const keywords = query.toLowerCase().split(/\s+/);

  return documents.map(doc => {
    let score = 0;

    // 제목 매칭 (가중치 높음)
    const titleLower = (doc.title || '').toLowerCase();
    keywords.forEach(kw => {
      if (titleLower.includes(kw)) score += 10;
    });

    // 태그 매칭
    const tagsLower = (doc.tags || []).join(' ').toLowerCase();
    keywords.forEach(kw => {
      if (tagsLower.includes(kw)) score += 5;
    });

    // 토픽 매칭
    const topicLower = (doc.topic || '').toLowerCase();
    keywords.forEach(kw => {
      if (topicLower.includes(kw)) score += 3;
    });

    // ID 매칭
    const idLower = (doc.id || '').toLowerCase();
    keywords.forEach(kw => {
      if (idLower.includes(kw)) score += 2;
    });

    return { ...doc, score };
  }).filter(doc => doc.score > 0)
    .sort((a, b) => b.score - a.score);
}

/**
 * 본문 검색 (2단계)
 */
function searchContent(documents, query, limit = 10) {
  if (!query) return documents.slice(0, limit);

  const keywords = query.toLowerCase().split(/\s+/);
  const results = [];

  for (const doc of documents) {
    const filePath = path.join(__dirname, '..', doc.path);

    if (!fs.existsSync(filePath)) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();
      let contentScore = 0;
      const matches = [];

      keywords.forEach(kw => {
        const regex = new RegExp(kw, 'gi');
        const found = content.match(regex);
        if (found) {
          contentScore += found.length;

          // 매칭 컨텍스트 추출
          const idx = content.indexOf(kw);
          if (idx >= 0) {
            const start = Math.max(0, idx - 50);
            const end = Math.min(content.length, idx + kw.length + 50);
            matches.push('...' + content.slice(start, end).replace(/\n/g, ' ') + '...');
          }
        }
      });

      if (contentScore > 0) {
        results.push({
          ...doc,
          score: (doc.score || 0) + contentScore,
          matches: matches.slice(0, 2) // 최대 2개 매칭 컨텍스트
        });
      }
    } catch (err) {
      // 파일 읽기 실패 시 무시
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Raw 문서 검색 (3단계)
 */
function searchRaw(query, limit = 5) {
  if (!query || !fs.existsSync(RAW_DIR)) return [];

  const keywords = query.toLowerCase().split(/\s+/);
  const results = [];

  function searchDir(dir) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        searchDir(fullPath);
      } else if (item.endsWith('.md')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
          let score = 0;

          keywords.forEach(kw => {
            const regex = new RegExp(kw, 'gi');
            const found = content.match(regex);
            if (found) score += found.length;
          });

          if (score > 0) {
            const relativePath = path.relative(DOCS_DIR, fullPath).replace(/\\/g, '/');
            results.push({
              path: 'docs/' + relativePath,
              title: item.replace('.md', ''),
              score,
              type: 'raw'
            });
          }
        } catch (err) {
          // 무시
        }
      }
    }
  }

  searchDir(RAW_DIR);

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 결과 포맷팅 (루미 v1.0 형식)
 */
function formatResults(results, rawResults, query) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}${colors.cyan}🔎 검색 결과${colors.reset} - "${query}"`);
  console.log('='.repeat(60) + '\n');

  if (results.length === 0 && rawResults.length === 0) {
    console.log(`${colors.yellow}검색 결과가 없습니다.${colors.reset}\n`);
    console.log('💡 팁:');
    console.log('  - 다른 키워드로 검색해보세요');
    console.log('  - --raw 옵션으로 원본 문서도 검색해보세요');
    console.log('  - --type, --priority, --tag 필터를 조정해보세요\n');
    return;
  }

  // 정본 결과
  if (results.length > 0) {
    console.log(`${colors.bold}📄 정본 문서 (Top ${results.length})${colors.reset}\n`);

    results.forEach((doc, idx) => {
      const priorityColor = doc.priority === 'P0' ? colors.magenta :
                           doc.priority === 'P1' ? colors.yellow : colors.dim;

      console.log(`${colors.bold}${idx + 1}) [${doc.id}] ${doc.title}${colors.reset}`);
      console.log(`   ${priorityColor}Priority: ${doc.priority}${colors.reset} | Type: ${doc.type} | Owner: ${doc.owner}`);
      console.log(`   ${colors.dim}Tags: ${doc.tags.join(', ')}${colors.reset}`);
      console.log(`   ${colors.blue}📁 ${doc.path}${colors.reset}`);

      if (doc.matches && doc.matches.length > 0) {
        console.log(`   ${colors.green}📌 매칭:${colors.reset}`);
        doc.matches.forEach(m => {
          console.log(`      "${m.trim()}"`);
        });
      }

      console.log('');
    });
  }

  // Raw 결과
  if (rawResults.length > 0) {
    console.log(`${colors.bold}📂 원본 근거 (Top ${rawResults.length})${colors.reset}\n`);

    rawResults.forEach((doc, idx) => {
      console.log(`${idx + 1}) ${doc.title}`);
      console.log(`   ${colors.dim}${doc.path}${colors.reset}`);
    });

    console.log('');
  }

  // 추천 액션
  console.log(`${colors.cyan}👉 추천 액션:${colors.reset}`);
  if (results.length > 0) {
    console.log(`   - 상세 내용: cat "${results[0].path}"`);
  }
  console.log(`   - 필터 검색: node scripts/search-docs.js "${query}" --type=decision`);
  console.log(`   - P0만 검색: node scripts/search-docs.js "${query}" --priority=P0\n`);
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

  console.log('\n' + '='.repeat(60));
  console.log(`${colors.bold}${colors.cyan}🔎 문서 검색 에이전트${colors.reset} (루미 v1.0)`);
  console.log('='.repeat(60));
  console.log('\n명령어:');
  console.log('  [검색어]              - 키워드 검색');
  console.log('  :type [타입]          - 타입 필터 설정');
  console.log('  :priority [P0-P3]     - 우선순위 필터 설정');
  console.log('  :tag [태그]           - 태그 필터 설정');
  console.log('  :raw                  - raw 포함 토글');
  console.log('  :clear                - 필터 초기화');
  console.log('  :stats                - 통계 보기');
  console.log('  :quit                 - 종료\n');

  let filters = { type: null, priority: null, tag: null, includeRaw: false };

  function prompt() {
    const filterStr = [];
    if (filters.type) filterStr.push(`type:${filters.type}`);
    if (filters.priority) filterStr.push(`priority:${filters.priority}`);
    if (filters.tag) filterStr.push(`tag:${filters.tag}`);
    if (filters.includeRaw) filterStr.push('raw:on');

    const filterDisplay = filterStr.length > 0 ? ` [${filterStr.join(', ')}]` : '';

    rl.question(`${colors.green}검색>${colors.reset}${filterDisplay} `, (input) => {
      input = input.trim();

      if (!input) {
        prompt();
        return;
      }

      if (input === ':quit' || input === ':q') {
        console.log('\n👋 종료합니다.\n');
        rl.close();
        return;
      }

      if (input.startsWith(':type ')) {
        filters.type = input.split(' ')[1];
        console.log(`✅ 타입 필터: ${filters.type}`);
        prompt();
        return;
      }

      if (input.startsWith(':priority ')) {
        filters.priority = input.split(' ')[1].toUpperCase();
        console.log(`✅ 우선순위 필터: ${filters.priority}`);
        prompt();
        return;
      }

      if (input.startsWith(':tag ')) {
        filters.tag = input.split(' ')[1];
        console.log(`✅ 태그 필터: ${filters.tag}`);
        prompt();
        return;
      }

      if (input === ':raw') {
        filters.includeRaw = !filters.includeRaw;
        console.log(`✅ Raw 포함: ${filters.includeRaw ? 'ON' : 'OFF'}`);
        prompt();
        return;
      }

      if (input === ':clear') {
        filters = { type: null, priority: null, tag: null, includeRaw: false };
        console.log('✅ 필터 초기화됨');
        prompt();
        return;
      }

      if (input === ':stats') {
        const manifest = loadManifest();
        console.log(`\n📊 문서 통계:`);
        console.log(`   총 문서: ${manifest.total_count}개`);
        console.log(`   생성일: ${manifest.generated_at}`);

        const types = {};
        manifest.documents.forEach(d => {
          types[d.type] = (types[d.type] || 0) + 1;
        });
        console.log(`   타입별:`);
        Object.entries(types).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
          console.log(`      ${t}: ${c}개`);
        });
        console.log('');
        prompt();
        return;
      }

      // 검색 실행
      const manifest = loadManifest();
      let candidates = manifest.documents;

      // 메타데이터 필터링
      candidates = filterByMetadata(candidates, filters);

      // 키워드 필터링
      candidates = filterByKeyword(candidates, input);

      // 본문 검색
      const results = searchContent(candidates, input, 10);

      // Raw 검색
      const rawResults = filters.includeRaw ? searchRaw(input, 5) : [];

      formatResults(results, rawResults, input);
      prompt();
    });
  }

  prompt();
}

/**
 * 메인
 */
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '-i' || args[0] === '--interactive') {
  interactiveMode();
} else {
  const options = parseArgs(args);

  if (!options.query) {
    console.log('사용법: node scripts/search-docs.js "검색어" [옵션]');
    console.log('\n옵션:');
    console.log('  --type=TYPE       문서 타입 (decision, action, spec 등)');
    console.log('  --priority=P0-P3  우선순위');
    console.log('  --tag=TAG         태그');
    console.log('  --owner=OWNER     소유자 (rumi, comi, code 등)');
    console.log('  --raw             raw 문서 포함 검색');
    console.log('  --limit=N         결과 개수 제한 (기본 10)');
    console.log('  -i, --interactive 인터랙티브 모드');
    process.exit(0);
  }

  const manifest = loadManifest();
  let candidates = manifest.documents;

  // 1단계: 메타데이터 필터링
  candidates = filterByMetadata(candidates, options);

  // 2단계: 키워드 필터링
  candidates = filterByKeyword(candidates, options.query);

  // 3단계: 본문 검색
  const results = searchContent(candidates, options.query, options.limit);

  // 4단계: Raw 검색 (옵션)
  const rawResults = options.includeRaw ? searchRaw(options.query, 5) : [];

  formatResults(results, rawResults, options.query);
}
