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
const { execFileSync } = require('child_process');

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
 * 날짜 검증 — 형식(YYYY-MM-DD)과 실제 존재 여부를 모두 확인한다.
 * PHX-SOUL-QA-001 Manifest REPAIR: 일반 표 내용(예: "Status", "별")이 날짜로 쓰이지 않도록 한다.
 */
function isValidIsoDate(value) {
  if (typeof value !== 'string') return false;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/**
 * 오늘 날짜를 Asia/Seoul 기준 YYYY-MM-DD로 반환.
 * 기존 toISOString() 방식은 UTC 날짜라 KST 오전에 하루 전 날짜가 들어갔다.
 */
function todayInSeoul(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now);
  const pick = type => parts.find(p => p.type === type).value;
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

/**
 * 이전 manifest.json에서 path → created_at 맵을 읽는다.
 * 이전 값은 유효 여부와 무관하게 그대로 보존 대상으로 쓰며, 여기서 수정하지 않는다.
 */
function loadPreviousCreatedAt() {
  const map = new Map();
  if (!fs.existsSync(MANIFEST_PATH)) return map;
  try {
    const prev = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    for (const doc of prev.documents || []) {
      if (doc && typeof doc.path === 'string' && typeof doc.created_at === 'string') {
        map.set(doc.path, doc.created_at);
      }
    }
  } catch (err) {
    console.warn(`⚠️ 이전 manifest 읽기 실패 — created_at 보존 없이 진행: ${err.message}`);
  }
  return map;
}

/**
 * created_at 결정 (PHX-SOUL-QA-001 Manifest REPAIR)
 *  1. 문서 자체의 명시적 날짜 메타데이터 (유효한 ISO 날짜만)
 *  2. 경로에 포함된 완전한 날짜 YYYY-MM-DD (유효한 날짜만)
 *  3. 이전 manifest의 같은 path 값 — 재생성 때문에 바뀌지 않도록 그대로 보존
 *  4. 경로의 연-월 YYYY-MM → YYYY-MM-01 (기존 정책, 신규 문서에만 적용)
 *  5. 최초 색인 등록일: Asia/Seoul 기준 오늘 (근거 없는 값이며 실제 작성일로 확정하지 않음)
 */
function resolveCreatedAt(metaDate, relativePath, previousCreatedAt) {
  const cleaned = typeof metaDate === 'string' ? metaDate.trim().replace(/^['"]|['"]$/g, '') : metaDate;
  if (isValidIsoDate(cleaned)) return cleaned;

  for (const candidate of relativePath.match(/\d{4}-\d{2}-\d{2}/g) || []) {
    if (isValidIsoDate(candidate)) return candidate;
  }

  const docPath = `docs/${relativePath}`;
  if (previousCreatedAt && previousCreatedAt.has(docPath)) {
    return previousCreatedAt.get(docPath);
  }

  const ym = relativePath.match(/(\d{4})-(\d{2})/);
  if (ym && Number(ym[2]) >= 1 && Number(ym[2]) <= 12) return `${ym[1]}-${ym[2]}-01`;

  return todayInSeoul();
}

/**
 * 문서 아이템 생성
 */
function createDocItem(filePath, previousCreatedAt) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(DOCS_DIR, filePath).replace(/\\/g, '/');
  return buildDocItemFromContent(relativePath, content, previousCreatedAt);
}

/**
 * 문서 아이템 생성 — 콘텐츠 기준 (작업 트리 파일 또는 Git Index blob 공용)
 */
function buildDocItemFromContent(relativePath, content, previousCreatedAt) {
  const filePath = path.join(DOCS_DIR, relativePath);
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
    created_at: resolveCreatedAt(meta.created_at, relativePath, previousCreatedAt),
    checksum: generateChecksum(content)
  };
}


// ─── Git Index 기준 scan (PHX-SOUL-QA-001 Manifest stabilization, §54) ─────────
// 미추적 파일, 백업 복사본(신규), 다른 추적 문서의 unstaged 수정은 색인에 반영하지 않는다.
// 부분 staging 된 문서는 Index 에 저장된 콘텐츠를 사용한다.
const REPO_ROOT = path.join(__dirname, '..');

function gitOut(args, input) {
  return execFileSync('git', args, {
    cwd: REPO_ROOT,
    input,
    maxBuffer: 512 * 1024 * 1024,
    stdio: [input ? 'pipe' : 'ignore', 'pipe', 'ignore'],
  });
}

function tryGitOut(args, input) {
  try {
    return gitOut(args, input);
  } catch (err) {
    return null;
  }
}

function md5Buf(buf) {
  return crypto.createHash('md5').update(buf).digest('hex').substring(0, 8);
}

// 체크아웃 줄바꿈(LF→CRLF) 형태. 기존 checksum 과의 호환 판정에만 사용한다.
function crlfBuf(buf) {
  return Buffer.from(buf.toString('utf8').replace(/\r?\n/g, '\r\n'), 'utf8');
}

// 기록된 checksum 이 콘텐츠(LF 또는 CRLF 형태)와 일치하는지. 일치 판정만 하며 값은 바꾸지 않는다.
function matchesRecordedChecksum(checksum, buf) {
  return Boolean(buf) && (md5Buf(buf) === checksum || md5Buf(crlfBuf(buf)) === checksum);
}

function isIndexedDocRelPath(rel) {
  const parts = rel.split('/');
  if (parts.some(p => EXCLUDE_DIRS.includes(p))) return false;
  const base = parts[parts.length - 1];
  return base.endsWith('.md') && !base.startsWith('_');
}

// git cat-file --batch 로 blob 내용을 한 번에 읽는다.
function readBlobs(shas) {
  const map = new Map();
  if (shas.length === 0) return map;
  const out = tryGitOut(['cat-file', '--batch'], Buffer.from(shas.join('\n') + '\n', 'utf8'));
  if (!out) return map;
  let pos = 0;
  for (const sha of shas) {
    const nl = out.indexOf(0x0a, pos);
    if (nl < 0) break;
    const header = out.slice(pos, nl).toString('utf8').split(' ');
    if (header[1] !== 'blob') {
      pos = nl + 1;
      continue;
    }
    const size = Number(header[2]);
    map.set(sha, out.slice(nl + 1, nl + 1 + size));
    pos = nl + 1 + size + 1;
  }
  return map;
}

/**
 * Git Index 기준 문서 목록. 저장소가 아니면 null (기존 작업 트리 경로 사용).
 * 반환: Map(rel(docs 기준) → { index: Buffer|null, head: Buffer|null, staged: boolean })
 */
function readIndexDocuments() {
  if (!tryGitOut(['rev-parse', '--is-inside-work-tree'])) return null;

  const indexOut = tryGitOut(['ls-files', '-s', '-z', '--', 'docs']);
  if (!indexOut) return null;
  const headOut = tryGitOut(['ls-tree', '-r', '-z', 'HEAD', '--', 'docs']); // 커밋이 없으면 null

  const entries = [];
  for (const item of indexOut.toString('utf8').split('\0')) {
    const m = item.match(/^(\d+) ([0-9a-f]+) (\d)\t([\s\S]*)$/);
    if (!m || m[3] !== '0' || m[1] === '120000' || m[1] === '160000') continue; // 충돌·심볼릭·서브모듈 제외
    const rel = m[4];
    if (!rel.startsWith('docs/')) continue;
    const docRel = rel.slice('docs/'.length);
    if (!isIndexedDocRelPath(docRel)) continue;
    entries.push({ rel: docRel, sha: m[2] });
  }

  const headMap = new Map();
  if (headOut) {
    for (const item of headOut.toString('utf8').split('\0')) {
      const m = item.match(/^\d+ blob ([0-9a-f]+)\t([\s\S]*)$/);
      if (m && m[2].startsWith('docs/')) headMap.set(m[2].slice('docs/'.length), m[1]);
    }
  }

  const shas = new Set();
  for (const e of entries) {
    shas.add(e.sha);
    if (headMap.has(e.rel)) shas.add(headMap.get(e.rel));
  }
  const blobs = readBlobs([...shas]);

  const docs = new Map();
  for (const e of entries) {
    const headSha = headMap.get(e.rel) || null;
    docs.set(e.rel, {
      index: blobs.get(e.sha) || null,
      head: headSha ? (blobs.get(headSha) || null) : null,
      staged: headSha !== e.sha, // 신규 stage 또는 stage 된 수정
    });
  }
  return docs;
}

function readPreviousDocuments() {
  if (!fs.existsSync(MANIFEST_PATH)) return [];
  try {
    const prev = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    return Array.isArray(prev.documents) ? prev.documents : [];
  } catch (err) {
    console.warn(`⚠️ 이전 manifest 읽기 실패 — 기존 엔트리 없이 진행: ${err.message}`);
    return [];
  }
}

/**
 * Index 기준 documents 구성 (점진적 Git Blob 기준 checksum)
 *  - 기존 엔트리: 객체 그대로 보존. 단, stage 된 콘텐츠 변경이며 기록 checksum 이 HEAD 콘텐츠와 일치할 때만 checksum 을 Index 기준으로 갱신.
 *    (체크아웃 줄바꿈 차이, 기록과 불일치하는 stale 값은 바꾸지 않는다)
 *  - 기존 엔트리의 경로가 Index 에서 사라졌으면(stage 삭제 포함) 목록에서 제거.
 *  - 신규: stage 된 문서만 등록. 백업 복사본(/backups/) 제외. checksum = Index blob 콘텐츠 md5.
 */
function buildDocumentsFromIndex(indexed) {
  const previous = readPreviousDocuments();
  const previousCreatedAt = loadPreviousCreatedAt();
  const documents = [];
  const seen = new Set();

  for (const prev of previous) {
    const rel = String(prev.path || '').replace(/^docs\//, '');
    const doc = indexed.get(rel);
    if (!doc || !doc.index) continue;
    seen.add(rel);
    let item = prev;
    if (doc.staged && doc.head && matchesRecordedChecksum(prev.checksum, doc.head)
        && !matchesRecordedChecksum(prev.checksum, doc.index)) {
      item = { ...prev, checksum: md5Buf(doc.index) }; // 실제 staged 콘텐츠 변경만 갱신
    }
    documents.push(item);
  }

  const added = [];
  for (const [rel, doc] of indexed) {
    if (seen.has(rel) || !doc.index || !doc.staged) continue;
    if (rel.split('/').includes('backups')) continue; // 작업용 백업 복사본은 신규 등록하지 않음
    try {
      added.push(buildDocItemFromContent(rel, doc.index.toString('utf8'), previousCreatedAt));
    } catch (err) {
      console.warn(`⚠️ 신규 문서 파싱 실패 (제외): docs/${rel} — ${err.message}`);
    }
  }
  // 기존 엔트리는 기록 순서를 유지하고, 신규 등록은 앞에 둔다 (재실행 시 순서 churn 방지)
  added.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  return [...added, ...documents];
}

/**
 * tags.json 생성
 */
function generateTagsJson(documents) {
  const tagMap = {};

  documents.forEach(doc => {
    (doc.tags || []).forEach(tag => { // 기존 엔트리는 필드가 부분적일 수 있다 (§54)
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(doc.id);
    });
  });

  return tagMap;
}

/**
 * 메인 실행
 */
// git 저장소가 아닐 때의 기존 작업 트리 경로 (인터페이스·동작 유지)
function mainWorkingTree() {
  console.log('📄 Manifest 생성 시작...\n');

  // index 폴더 확인
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
    console.log('✅ docs/index/ 폴더 생성');
  }

  // .md 파일 수집
  const files = collectMarkdownFiles(DOCS_DIR);
  console.log(`📁 발견된 문서: ${files.length}개\n`);

  // 이전 manifest의 created_at 보존 맵 (PHX-SOUL-QA-001 Manifest REPAIR)
  const previousCreatedAt = loadPreviousCreatedAt();

  // 문서 아이템 생성
  const documents = [];
  const errors = [];

  files.forEach(file => {
    try {
      const item = createDocItem(file, previousCreatedAt);
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
        created_at: resolveCreatedAt(null, relativePath, previousCreatedAt),
        checksum: 'error'
      });
    }
  });

  // created_at 통계 (기존 값 보존 여부 구분용, 출력 전용)
  const nonIsoCount = documents.filter(d => !isValidIsoDate(d.created_at)).length;
  const preservedCount = documents.filter(d => previousCreatedAt.has(d.path) && previousCreatedAt.get(d.path) === d.created_at).length;
  console.log(`🗓️ created_at: 이전 값 보존 ${preservedCount}건 / 비 ISO 값 ${nonIsoCount}건 (기존 값 그대로 유지)`);

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

/**
 * 진입점. git 저장소이면 Git Index 기준(§54), 아니면 작업 트리 기준.
 * 훅과 수동 실행 모두 동일한 CLI 를 사용한다.
 */
function main() {
  const indexed = readIndexDocuments();
  if (!indexed) return mainWorkingTree();

  console.log('📄 Manifest 생성 시작 (Git Index 기준)...\n');
  if (!fs.existsSync(INDEX_DIR)) {
    fs.mkdirSync(INDEX_DIR, { recursive: true });
    console.log('✅ docs/index/ 폴더 생성');
  }
  const documents = buildDocumentsFromIndex(indexed);
  console.log(`📁 Index 문서 후보: ${indexed.size}개 (추적·stage 기준)`);

  const manifest = {
    schema_version: '1.0',
    generated_at: new Date().toISOString(),
    generator: 'generate-manifest.js',
    total_count: documents.length,
    documents,
  };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`✅ manifest.json 생성 완료 (${documents.length}개 문서)`);

  const tags = stabilizeTags(readPreviousTags(), generateTagsJson(documents));
  fs.writeFileSync(TAGS_PATH, JSON.stringify(tags, null, 2), 'utf-8');
  console.log(`✅ tags.json 생성 완료 (${Object.keys(tags).length}개 태그)`);
}

// 이전 tags.json (없거나 손상되면 null)
function readPreviousTags() {
  try {
    return JSON.parse(fs.readFileSync(TAGS_PATH, 'utf-8'));
  } catch (err) {
    return null;
  }
}

// 태그별 id 집합이 같으면 이전 순서와 키 순서를 유지한다 (재실행 시 순서 churn 방지). 집합이 다르면 새 값을 쓴다.
function stabilizeTags(prevTags, nextTags) {
  const prev = prevTags && typeof prevTags === 'object' ? prevTags : {};
  const keys = [
    ...Object.keys(prev).filter(k => Object.prototype.hasOwnProperty.call(nextTags, k)),
    ...Object.keys(nextTags).filter(k => !Object.prototype.hasOwnProperty.call(prev, k)),
  ];
  const sameSet = (a, b) => a.length === b.length
    && [...a].sort().join('\0') === [...b].sort().join('\0');
  const out = {};
  for (const key of keys) {
    const p = Array.isArray(prev[key]) ? prev[key] : null;
    out[key] = p && sameSet(p, nextTags[key]) ? p : nextTags[key];
  }
  return out;
}

main();
