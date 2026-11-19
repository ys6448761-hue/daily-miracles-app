/**
 * PHX-SOUL-QA-001 Manifest REPAIR — generate-manifest.js 회귀 테스트
 *
 * 모든 실행은 임시 디렉터리에서 수행한다. 실제 docs/index는 건드리지 않는다.
 * 시각은 preload로 고정해 Asia/Seoul 경계와 재생성 멱등성을 검증한다.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const SCRIPT = path.join(__dirname, '../../scripts/generate-manifest.js');
const HOOK = path.join(__dirname, '../../scripts/hooks/pre-commit');
const roots = [];

function makeRoot(docs = {}, previous = null) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'phx-manifest-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(root, 'scripts', 'generate-manifest.js'));
  for (const [rel, body] of Object.entries(docs)) writeDoc(root, rel, body);
  if (previous) {
    fs.mkdirSync(path.join(root, 'docs', 'index'), { recursive: true });
    fs.writeFileSync(path.join(root, 'docs', 'index', 'manifest.json'), JSON.stringify(previous, null, 2));
  }
  // 고정 시각 preload
  fs.writeFileSync(path.join(root, 'fake-now.js'), [
    'const fixed = new Date(process.env.FAKE_NOW).getTime();',
    'if (process.env.FAKE_NOW) {',
    '  const Real = Date;',
    '  class FakeDate extends Real {',
    '    constructor(...a) { if (a.length === 0) super(fixed); else super(...a); }',
    '    static now() { return fixed; }',
    '  }',
    '  global.Date = FakeDate;',
    '}',
  ].join('\n'));
  return root;
}

function writeDoc(root, rel, body) {
  const full = path.join(root, 'docs', rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body, 'utf-8');
}

function run(root, nowIso) {
  cp.execFileSync(process.execPath, ['-r', path.join(root, 'fake-now.js'), path.join(root, 'scripts', 'generate-manifest.js')], {
    cwd: root,
    env: { ...process.env, FAKE_NOW: nowIso },
    stdio: 'pipe',
  });
  return readManifest(root);
}

function readManifest(root) {
  return JSON.parse(fs.readFileSync(path.join(root, 'docs', 'index', 'manifest.json'), 'utf-8'));
}

function byPath(manifest, rel) {
  return manifest.documents.find(d => d.path === `docs/${rel}`);
}

const UNDATED = '# 날짜 근거 없는 문서\n\n본문만 있습니다.\n';

afterAll(() => {
  for (const r of roots) fs.rmSync(r, { recursive: true, force: true });
});

describe('Manifest created_at REPAIR', () => {
  test('M01 기존 문서의 created_at은 이전 manifest 값을 보존한다 (실행 날짜로 바뀌지 않음)', () => {
    const previous = { documents: [{ path: 'docs/ops/undated_note.md', created_at: '2025-05-05' }] };
    const root = makeRoot({ 'ops/undated_note.md': UNDATED }, previous);
    const m = run(root, '2026-11-19T03:00:00Z');
    expect(byPath(m, 'ops/undated_note.md').created_at).toBe('2025-05-05');
  });

  test('M02 같은 문서를 다른 날짜에 재생성해도 created_at이 유지된다', () => {
    const root = makeRoot({ 'ops/undated_note.md': UNDATED, 'guides/explicit.md': '---\ncreated_at: 2026-03-01\n---\n# 명시\n' });
    const first = run(root, '2026-11-19T03:00:00Z');
    const second = run(root, '2026-11-25T03:00:00Z');
    expect(byPath(second, 'ops/undated_note.md').created_at).toBe(byPath(first, 'ops/undated_note.md').created_at);
    expect(byPath(second, 'guides/explicit.md').created_at).toBe('2026-03-01');
    expect(byPath(second, 'ops/undated_note.md').created_at).toBe('2026-11-19');
  });

  test('M03 신규 문서에만 등록일(실행 시점)을 부여하고 기존 문서는 바꾸지 않는다', () => {
    const root = makeRoot({ 'ops/undated_note.md': UNDATED });
    const first = run(root, '2026-11-19T03:00:00Z');
    writeDoc(root, 'ops/new_note.md', UNDATED);
    const second = run(root, '2026-11-25T03:00:00Z');
    expect(byPath(second, 'ops/new_note.md').created_at).toBe('2026-11-25');
    expect(byPath(second, 'ops/undated_note.md').created_at).toBe(byPath(first, 'ops/undated_note.md').created_at);
  });

  test('M04 문서 자체의 명시적 날짜 메타데이터(frontmatter)를 우선 인식한다', () => {
    const root = makeRoot({ 'guides/explicit.md': '---\ncreated_at: 2026-03-01\n---\n# 명시\n' }, {
      documents: [{ path: 'docs/guides/explicit.md', created_at: '2025-01-01' }],
    });
    const m = run(root, '2026-11-19T03:00:00Z');
    expect(byPath(m, 'guides/explicit.md').created_at).toBe('2026-03-01');
  });

  test('M05 일반 표 내용(예: Status, 별)은 날짜로 인식하지 않는다', () => {
    const root = makeRoot({ 'specs/table.md': '# 표 문서\n\n| 날짜 | Status |\n|---|---|\n| x | y |\n' });
    const m = run(root, '2026-11-19T03:00:00Z');
    const doc = byPath(m, 'specs/table.md');
    expect(doc.created_at).not.toBe('Status');
    expect(doc.created_at).toBe('2026-11-19');
  });

  test('M06 존재하지 않는 날짜(2026-02-30)는 거부하고 fallback을 쓴다', () => {
    const root = makeRoot({ 'guides/invalid_meta.md': '---\ncreated_at: 2026-02-30\n---\n# 잘못된 날짜\n' });
    const m = run(root, '2026-11-19T03:00:00Z');
    const doc = byPath(m, 'guides/invalid_meta.md');
    expect(doc.created_at).not.toBe('2026-02-30');
    expect(doc.created_at).toBe('2026-11-19');
  });

  test('M07 UTC와 KST 날짜 경계: KST 자정 직후는 같은 KST 날짜로 기록한다', () => {
    // 2026-11-18T16:30Z = 2026-11-19 01:30 KST → 11-19 (UTC 날짜 11-18이면 오류)
    const rootA = makeRoot({});
    writeDoc(rootA, 'ops/boundary_a.md', UNDATED);
    expect(byPath(run(rootA, '2026-11-18T16:30:00Z'), 'ops/boundary_a.md').created_at).toBe('2026-11-19');
    // 2026-11-18T14:59Z = 2026-11-18 23:59 KST → 11-18
    const rootB = makeRoot({});
    writeDoc(rootB, 'ops/boundary_b.md', UNDATED);
    expect(byPath(run(rootB, '2026-11-18T14:59:00Z'), 'ops/boundary_b.md').created_at).toBe('2026-11-18');
  });

  test('M08 generated_at은 재생성마다 갱신되고 형식(ISO)을 유지한다', () => {
    const root = makeRoot({ 'ops/undated_note.md': UNDATED });
    const first = run(root, '2026-11-19T03:00:00Z');
    const second = run(root, '2026-11-25T03:00:00Z');
    expect(first.generated_at).toBe('2026-11-19T03:00:00.000Z');
    expect(second.generated_at).toBe('2026-11-25T03:00:00.000Z');
  });

  test('M09 문서 추가와 태그 색인이 정상 유지된다', () => {
    const root = makeRoot({ 'ops/undated_note.md': UNDATED });
    const before = run(root, '2026-11-19T03:00:00Z');
    writeDoc(root, 'ops/wish_note.md', '# 소원 관련 메모\n\n소원 기능 설명입니다.\n');
    const after = run(root, '2026-11-25T03:00:00Z');
    expect(after.total_count).toBe(before.total_count + 1);
    const added = byPath(after, 'ops/wish_note.md');
    expect(added).toBeDefined();
    const tags = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'index', 'tags.json'), 'utf-8'));
    for (const tag of added.tags) expect(tags[tag]).toContain(added.id);
  });

  test('M11 기존 비정상 날짜 값은 바꾸지 않고, 신규 문서에는 비정상 값을 만들지 않는다', () => {
    const previous = { documents: [{ path: 'docs/specs/table.md', created_at: 'Status' }] };
    const root = makeRoot({ 'specs/table.md': '# 표 문서\n\n| 날짜 | Status |\n|---|---|\n' }, previous);
    writeDoc(root, 'ops/fresh.md', UNDATED);
    const m = run(root, '2026-11-19T03:00:00Z');
    expect(byPath(m, 'specs/table.md').created_at).toBe('Status'); // 기존 값 그대로 (추측 복원 없음)
    const fresh = byPath(m, 'ops/fresh.md').created_at;
    expect(fresh).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('pre-commit 훅 정상 동작 (M10)', () => {
  test('docs 변경 커밋 시 훅이 manifest를 갱신해 같은 커밋에 포함하고, 기존 created_at은 유지한다', () => {
    const root = makeRoot({ 'ops/undated_note.md': UNDATED }, { documents: [{ path: 'docs/ops/undated_note.md', created_at: '2025-05-05' }] });
    fs.mkdirSync(path.join(root, '.git', 'hooks'), { recursive: true });
    fs.copyFileSync(HOOK, path.join(root, '.git', 'hooks', 'pre-commit'));
    const git = args => cp.execFileSync('git', args, { cwd: root, stdio: 'pipe', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).toString();
    git(['init', '-q']);
    git(['config', 'user.email', 'test@example.invalid']);
    git(['config', 'user.name', 'manifest-test']);
    git(['add', 'docs/ops/undated_note.md']);
    git(['commit', '-q', '-m', 'seed']);
    writeDoc(root, 'ops/hook_added.md', '# 훅 추가 문서\n\n내용.\n');
    git(['add', 'docs/ops/hook_added.md']);
    git(['commit', '-q', '-m', 'docs: hook test']);
    const committed = JSON.parse(git(['show', 'HEAD:docs/index/manifest.json']));
    expect(byPath(committed, 'ops/hook_added.md')).toBeDefined();
    expect(byPath(committed, 'ops/undated_note.md').created_at).toBe('2025-05-05');
  });
});
