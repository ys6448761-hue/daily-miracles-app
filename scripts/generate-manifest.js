#!/usr/bin/env node
/**
 * Manifest 자동 생성 스크립트
 * 루미 규칙 v1.0 기반
 *
 * 사용법: node scripts/generate-manifest.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DOCS_DIR = path.join(__dirname, '..', 'docs');
const INDEX_DIR = path.join(DOCS_DIR, 'index');
const MANIFEST_PATH = path.join(INDEX_DIR, 'manifest.json');
const TAGS_PATH = path.join(INDEX_DIR, 'tags.json');

// 제외할 폴더
const EXCLUDE_DIRS = ['index', 'raw', 'node_modules', '.git'];

// 문서 타입 매핑
const TYPE_MAP = {
  'decisions': 'decision',
  'actions': 'action',
  'specs': 'spec',
  'policies': 'policy',
  'reports': 'report',
  'guides': 'guide',
  'conversations': 'conversation',
  'learnings': 'learning',
  'cheatsheets': 'cheatsheet',
  'system': 'system',
  'execution': 'execution',
  'explores': 'explore',
  'api': 'api',
  'deployment': 'deployment',
  'overview': 'overview',
  'roadmap': 'roadmap',
  'team': 'team'
};

/**
 * YAML frontmatter 파싱
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;

  const yaml = match[1];
  const result = {};

  // 간단한 YAML 파싱
  yaml.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      let value = line.substring(colonIndex + 1).trim();

      // 배열 처리
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map(s => s.trim().replace(/['"]/g, ''));
      }

      result[key] = value;
    }
  });

  return result;
}

/**
 * 마크다운 blockquote 메타데이터 파싱
 */
function parseBlockquoteMeta(content) {
  const result = {};

  // 상태 추출
  const statusMatch = content.match(/\*\*상태:\*\*\s*(\S+)/);
  if (statusMatch) result.status = statusMatch[1];

  // 생성일 추출
  const dateMatch = content.match(/\*\*생성일:\*\*\s*(\S+)/);
  if (dateMatch) result.created_at = dateMatch[1];

  // 토론 ID 추출
  const debateMatch = content.match(/\*\*토론 ID:\*\*\s*(\S+)/);
  if (debateMatch) result.debate_id = debateMatch[1];

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * 테이블 형식 메타데이터 파싱
 */
function parseTableMeta(content) {
  const result = {};

  // 결정번호 추출
  const decMatch = content.match(/결정번호\s*\|\s*(\S+)/);
  if (decMatch) result.id = decMatch[1];

  // 날짜 추출
  const dateMatch = content.match(/날짜\s*\|\s*(\S+)/);
  if (dateMatch) result.created_at = dateMatch[1];

  // 상태 추출
  const statusMatch = content.match(/상태\s*\|\s*(.+?)[\r\n|]/);
  if (statusMatch) result.status = statusMatch[1].trim();

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * 파일에서 제목 추출
 */
function extractTitle(content, filename) {
  // # 제목 찾기
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].replace(/^DEC-\d{4}-\d{4}-\d+:\s*/, '').trim();
  }

  // 파일명에서 추출
  const name = path.basename(filename, '.md');
  return name.replace(/^(DEC|SPEC|ACTIONS|EXEC|SYS|EXP)-\d{4}-\d{4}-\d+[_-]?/, '').replace(/_/g, ' ').trim() || name;
}

/**
 * 파일에서 ID 추출
 */
function extractId(content, filename) {
  // frontmatter에서 id 찾기
  const frontmatter = parseFrontmatter(content);
  if (frontmatter && frontmatter.id) return frontmatter.id;

  // 파일명에서 DEC-xxxx-xxxx-xxx 패턴 찾기
  const idMatch = filename.match(/(DEC|SPEC|ACTIONS|EXEC|SYS|EXP)-\d{4}-\d{4}-\d+/);
  if (idMatch) return idMatch[0];

  // content 첫 줄에서 찾기
  const contentMatch = content.match(/^#\s+(DEC|SPEC|ACTIONS|EXEC|SYS|EXP)-(\d{4}-\d{4}-\d+)/m);
  if (contentMatch) return `${contentMatch[1]}-${contentMatch[2]}`;

  // 파일명 기반 ID 생성
  const name = path.basename(filename, '.md');
  return `DOC-${name.substring(0, 30).replace(/[^a-zA-Z0-9가-힣-_]/g, '')}`;
}

/**
 * 태그 추출
 */
function extractTags(content, filePath) {
  const tags = new Set();

  // frontmatter tags
  const frontmatter = parseFrontmatter(content);
  if (frontmatter && frontmatter.tags) {
    (Array.isArray(frontmatter.tags) ? frontmatter.tags : [frontmatter.tags]).forEach(t => tags.add(t));
  }

  // 폴더명을 태그로
  const folder = path.basename(path.dirname(filePath));
  if (folder && folder !== 'docs') tags.add(folder);

  // 특정 키워드 감지
  const keywords = ['소원', 'storybook', 'aurora', 'kpi', 'red-alert', 'automation', '가격', '결제'];
  keywords.forEach(kw => {
    if (content.toLowerCase().includes(kw.toLowerCase())) {
      tags.add(kw);
    }
  });

  return Array.from(tags).slice(0, 10); // 최대 10개
}

/**
 * 우선순위 추출
 */
function extractPriority(content) {
  const match = content.match(/우선순위[:\s]*\*?\*?(P[0-3])\*?\*?/i) ||
                content.match(/priority[:\s]*\*?\*?(P[0-3])\*?\*?/i);
  return match ? match[1].toUpperCase() : 'P2';
}

/**
 * 소유자 추출
 */
function extractOwner(content) {
  const ownerMap = {
    '루미': 'rumi',
    '코미': 'comi',
    '코드': 'code',
    '푸르미르': 'ceo',
    '재미': 'jemi',
    '여의보주': 'yeoiboju'
  };

  for (const [kr, en] of Object.entries(ownerMap)) {
    if (content.includes(kr)) return en;
  }

  return 'team';
}

/**
 * 상태 추출
 */
function extractStatus(content) {
  if (content.includes('archived') || content.includes('보관')) return 'archived';
  if (content.includes('superseded') || content.includes('대체')) return 'superseded';
  if (content.includes('완료') || content.includes('승인')) return 'active';
  return 'active';
}

/**
 * 체크섬 생성
 */
function generateChecksum(content) {
  return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
}

/**
 * 재귀적으로 .md 파일 수집
 */
function collectMarkdownFiles(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(item)) {
        collectMarkdownFiles(fullPath, files);
      }
    } else if (item.endsWith('.md') && !item.startsWith('_')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * 문서 아이템 생성
 */
function createDocItem(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  const folder = relativePath.split('/')[0];

  // 메타데이터 파싱 시도
  const frontmatter = parseFrontmatter(content);
  const blockquoteMeta = parseBlockquoteMeta(content);
  const tableMeta = parseTableMeta(content);

  const meta = frontmatter || blockquoteMeta || tableMeta || {};

  return {
    id: meta.id || extractId(content, filePath),
    path: `docs/${relativePath}`,
    type: meta.type || TYPE_MAP[folder] || 'document',
    project: meta.project || 'aurora5',
    priority: meta.priority || extractPriority(content),
    topic: meta.topic || folder,
    tags: extractTags(content, filePath),
    owner: meta.owner || extractOwner(content),
    status: meta.status || extractStatus(content),
    title: extractTitle(content, path.basename(filePath)),
    created_at: meta.created_at || extractDateFromPath(filePath),
    checksum: generateChecksum(content)
  };
}

/**
 * 경로에서 날짜 추출
 */
function extractDateFromPath(filePath) {
  const dateMatch = filePath.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) return dateMatch[1];

  const yearMonthMatch = filePath.match(/(\d{4})-(\d{2})/);
  if (yearMonthMatch) return `${yearMonthMatch[1]}-${yearMonthMatch[2]}-01`;

  return new Date().toISOString().split('T')[0];
}

/**
 * tags.json 생성
 */
function generateTagsJson(documents) {
  const tagMap = {};

  documents.forEach(doc => {
    doc.tags.forEach(tag => {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(doc.id);
    });
  });

  return tagMap;
}

/**
 * 메인 실행
 */
function main() {
  console.log('📄 Manifest 생성 시작...\n');

  // index 폴더 확인
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
    console.log('✅ docs/index/ 폴더 생성');
  }

  // .md 파일 수집
  const files = collectMarkdownFiles(DOCS_DIR);
  console.log(`📁 발견된 문서: ${files.length}개\n`);

  // 문서 아이템 생성
  const documents = [];
  const errors = [];

  files.forEach(file => {
    try {
      const item = createDocItem(file);
      documents.push(item);
    } catch (err) {
      errors.push({ file, error: err.message });
      // fallback item
      const relativePath = path.relative(DOCS_DIR, file).replace(/\\/g, '/');
      documents.push({
        id: `DOC-${path.basename(file, '.md')}`,
        path: `docs/${relativePath}`,
        type: 'document',
        project: 'aurora5',
        priority: 'P2',
        topic: 'unknown',
        tags: [],
        owner: 'team',
        status: 'active',
        title: path.basename(file, '.md'),
        created_at: new Date().toISOString().split('T')[0],
        checksum: 'error'
      });
    }
  });

  // manifest.json 생성
  const manifest = {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    generator: 'generate-manifest.js',
    total_count: documents.length,
    documents: documents.sort((a, b) => b.created_at.localeCompare(a.created_at))
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ manifest.json 생성 완료 (${documents.length}개 문서)`);

  // tags.json 생성
  const tags = generateTagsJson(documents);
  fs.writeFileSync(TAGS_PATH, JSON.stringify(tags, null, 2), 'utf-8');
  console.log(`✅ tags.json 생성 완료 (${Object.keys(tags).length}개 태그)`);

  // 통계 출력
  console.log('\n📊 문서 통계:');
  const typeCount = {};
  documents.forEach(d => {
    typeCount[d.type] = (typeCount[d.type] || 0) + 1;
  });
  Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}개`);
  });

  if (errors.length > 0) {
    console.log(`\n⚠️ 파싱 오류 (fallback 처리됨): ${errors.length}개`);
  }

  console.log('\n✨ 완료!');
}

main();
