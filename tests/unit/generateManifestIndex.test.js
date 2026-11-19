/**
 * PHX-SOUL-QA-001 §54 — Git Index 기준 Manifest 생성 회귀 테스트
 *
 * 모든 실행은 임시 Git 저장소에서 수행한다. 실제 docs/index 는 건드리지 않는다.
 * 검증 대상: 미추적 제외, stage 신규 포함, stage 삭제 반영, unstaged 무시, 부분 stage 는 Index 콘텐츠,
 *           백업 복사본 미등록, LF/CRLF 안정성, created_at 보존, checksum 불필요 변경 방지, 재실행 안정성, tags 일관성.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const SCRIPT = path.join(__dirname, '../../scripts/generate-manifest.js');
const roots = [];

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex').substring(0, 8);
const crlf = (s) => s.replace(/\r?\n/g, '\r\n');

function makeRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'phx-manifest-index-'));
  roots.push(root);
  fs.mkdirSync(path.join(root, 'scripts'), { recursive: true });
  fs.copyFileSync(SCRIPT, path.join(root, 'scripts', 'generate-manifest.js'));
  git(root, ['init', '-q']);
  git(root, ['config', 'user.email', 'test@example.invalid']);
  git(root, ['config', 'user.name', 'manifest-test']);
  git(root, ['config', 'core.autocrlf', 'false']);
  return root;
}

function git(root, args) {
  return cp.execFileSync('git', args, { cwd: root, stdio: 'pipe' }).toString();
}

function write(root, rel, body) {
  const full = path.join(root, 'docs', rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, body, 'utf-8');
}

// 시드 커밋: 스테이징된 문서를 먼저 생성기로 등록한 뒤 manifest 까지 함께 커밋한다.
function commitAll(root, msg = 'c') {
  git(root, ['add', '-A', 'docs']);
  generate(root);
  git(root, ['add', '-A', 'docs']);
  git(root, ['commit', '-q', '--allow-empty', '-m', msg]);
}

// 생성기를 거치지 않고 커밋 (추적은 되었으나 manifest 미등록 상태를 만들 때 사용)
function commitRaw(root, msg = 'raw') {
  git(root, ['add', '-A', 'docs']);
  git(root, ['commit', '-q', '--allow-empty', '-m', msg]);
}

function generate(root) {
  cp.execFileSync(process.execPath, [path.join(root, 'scripts', 'generate-manifest.js')], { cwd: root, stdio: 'pipe' });
  return JSON.parse(fs.readFileSync(path.join(root, 'docs', 'index', 'manifest.json'), 'utf-8'));
}

function setPrevious(root, documents) {
  fs.mkdirSync(path.join(root, 'docs', 'index'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs', 'index', 'manifest.json'), JSON.stringify({ documents }, null, 2));
}

const byPath = (m, rel) => m.documents.find(d => d.path === `docs/${rel}`);
const stripTime = (m) => JSON.stringify(m.documents);

const BODY_A = '# 문서 A\n\n본문 A입니다.\n';
const BODY_B = '# 문서 B\n\n본문 B입니다.\n';

afterAll(() => {
  for (const r of roots) fs.rmSync(r, { recursive: true, force: true });
});

describe('Git Index 기준 scan 정책', () => {
  test('미추적 신규 문서는 제외된다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    write(root, 'ops/untracked.md', BODY_B); // 미추적
    const m = generate(root);
    expect(byPath(m, 'ops/untracked.md')).toBeUndefined();
    expect(byPath(m, 'ops/a.md')).toBeDefined();
  });

  test('stage 된 신규 문서는 포함되고 checksum 은 Index Blob 콘텐츠 md5 이다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    write(root, 'ops/new.md', BODY_B);
    git(root, ['add', 'docs/ops/new.md']);
    const m = generate(root);
    const entry = byPath(m, 'ops/new.md');
    expect(entry).toBeDefined();
    expect(entry.checksum).toBe(md5(BODY_B));
    expect(entry.created_at).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('stage 된 삭제는 manifest 에서 제거된다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    write(root, 'ops/b.md', BODY_B);
    commitAll(root, 'seed');
    generate(root);
    git(root, ['rm', '-q', 'docs/ops/b.md']); // stage 삭제
    const m = generate(root);
    expect(byPath(m, 'ops/b.md')).toBeUndefined();
    expect(byPath(m, 'ops/a.md')).toBeDefined();
  });

  test('다른 추적 문서의 unstaged 수정은 무시된다 (기존 checksum 그대로)', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    const before = byPath(generate(root), 'ops/a.md');
    write(root, 'ops/a.md', '# 문서 A 수정 (unstaged)\n'); // 작업 트리만 변경
    const after = byPath(generate(root), 'ops/a.md');
    expect(after).toEqual(before);
  });

  test('부분 staging 된 문서는 Index 에 저장된 콘텐츠 기준으로 checksum 을 갱신한다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    generate(root);
    const staged = '# 문서 A 스테이지 버전\n\n변경 내용.\n';
    write(root, 'ops/a.md', staged);
    git(root, ['add', 'docs/ops/a.md']); // Index = staged
    write(root, 'ops/a.md', '# 문서 A 작업 트리 추가 수정\n'); // 작업 트리는 다시 변경
    const m = generate(root);
    expect(byPath(m, 'ops/a.md').checksum).toBe(md5(staged));
  });

  test('추적은 되었으나 이번 커밋에 stage 되지 않은 신규 문서는 등록되지 않는다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    write(root, 'ops/other.md', BODY_B); // 커밋 후 manifest 미등록 상태로 추적
    commitRaw(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-01-01', checksum: md5(BODY_A) }]);
    const m = generate(root);
    expect(byPath(m, 'ops/other.md')).toBeUndefined();
  });

  test('백업 복사본은 stage 되어도 신규 등록되지 않는다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    write(root, 'knowledge/backups/copy.md', BODY_B);
    git(root, ['add', 'docs/knowledge/backups/copy.md']);
    const m = generate(root);
    expect(m.documents.some(d => d.path.includes('/backups/'))).toBe(false);
  });
});

describe('created_at 및 checksum 계약', () => {
  test('기존 엔트리의 created_at 은 stage 된 콘텐츠 변경 후에도 보존된다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-05-05', checksum: md5(BODY_A) }]);
    write(root, 'ops/a.md', '# 바뀐 제목\n\n내용 변경.\n');
    git(root, ['add', 'docs/ops/a.md']);
    const e = byPath(generate(root), 'ops/a.md');
    expect(e.created_at).toBe('2025-05-05');
  });

  test('CRLF 체크아웃 차이만 있는 기존 문서는 checksum 을 바꾸지 않는다 (LF 기록)', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-05-05', checksum: md5(BODY_A) }]);
    write(root, 'ops/a.md', crlf(BODY_A)); // 작업 트리만 CRLF, Index 는 LF 그대로
    const e = byPath(generate(root), 'ops/a.md');
    expect(e.checksum).toBe(md5(BODY_A));
  });

  test('CRLF 로 기록된 기존 checksum 은 줄바꿈만 다른 stage 에서 유지된다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-05-05', checksum: md5(crlf(BODY_A)) }]);
    write(root, 'ops/a.md', crlf(BODY_A));
    git(root, ['add', 'docs/ops/a.md']);
    const e = byPath(generate(root), 'ops/a.md');
    expect(e.checksum).toBe(md5(crlf(BODY_A)));
  });

  test('기록 checksum 이 HEAD 와 불일치하는 stale 값은 stage 변경이 있어도 보류된다 (감사 대상)', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-05-05', checksum: 'deadbeef' }]);
    write(root, 'ops/a.md', BODY_B);
    git(root, ['add', 'docs/ops/a.md']);
    const e = byPath(generate(root), 'ops/a.md');
    expect(e.checksum).toBe('deadbeef');
  });

  test('stage 된 실제 콘텐츠 변경은 HEAD 와 일치하던 기록 checksum 을 Index 기준으로 갱신한다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-05-05', checksum: md5(BODY_A) }]);
    write(root, 'ops/a.md', BODY_B);
    git(root, ['add', 'docs/ops/a.md']);
    const e = byPath(generate(root), 'ops/a.md');
    expect(e.checksum).toBe(md5(BODY_B));
  });

  test('LF/CRLF 작업 트리 차이와 무관하게 신규 checksum 은 동일하다', () => {
    const lf = makeRepo();
    write(lf, 'ops/a.md', BODY_A);
    commitAll(lf, 'seed');
    write(lf, 'ops/new.md', BODY_B);
    git(lf, ['add', 'docs/ops/new.md']);
    const lfSum = byPath(generate(lf), 'ops/new.md').checksum;

    const cr = makeRepo();
    write(cr, 'ops/a.md', BODY_A);
    commitAll(cr, 'seed');
    write(cr, 'ops/new.md', crlf(BODY_B)); // 작업 트리 CRLF 이지만 Index 콘텐츠는 LF 로 정규화해 stage
    write(cr, 'ops/new.md', BODY_B);
    git(cr, ['add', 'docs/ops/new.md']);
    write(cr, 'ops/new.md', crlf(BODY_B)); // stage 후 작업 트리만 CRLF
    const crSum = byPath(generate(cr), 'ops/new.md').checksum;
    expect(crSum).toBe(lfSum);
  });
});

describe('재실행 안정성 및 일관성', () => {
  test('동일 조건 반복 실행 결과가 같다 (generated_at 제외)', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    write(root, 'ops/new.md', BODY_B);
    git(root, ['add', 'docs/ops/new.md']);
    const first = generate(root);
    const tags1 = fs.readFileSync(path.join(root, 'docs', 'index', 'tags.json'), 'utf-8');
    const second = generate(root);
    const tags2 = fs.readFileSync(path.join(root, 'docs', 'index', 'tags.json'), 'utf-8');
    expect(stripTime(second)).toBe(stripTime(first));
    expect(tags2).toBe(tags1);
  });

  test('manifest 와 tags 가 일관된다: 태그 참조는 모두 문서 id 를 가리킨다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', '# A\n\n태그 테스트.\n');
    commitAll(root, 'seed');
    write(root, 'ops/new.md', BODY_B);
    git(root, ['add', 'docs/ops/new.md']);
    const m = generate(root);
    const tags = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'index', 'tags.json'), 'utf-8'));
    const ids = new Set(m.documents.map(d => d.id));
    for (const list of Object.values(tags)) for (const id of list) expect(ids.has(id)).toBe(true);
  });

  test('기존 엔트리의 필드가 부분적이어도 tags 생성이 실패하지 않는다', () => {
    const root = makeRepo();
    write(root, 'ops/a.md', BODY_A);
    commitAll(root, 'seed');
    setPrevious(root, [{ path: 'docs/ops/a.md', created_at: '2025-05-05' }]);
    expect(() => generate(root)).not.toThrow();
  });
});
