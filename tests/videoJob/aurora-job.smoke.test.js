/**
 * Aurora Job Smoke Test — CI 필수 실행
 * AIL-2026-0301-VIDJOB-001
 *
 * 검증 항목:
 *   1. collisionValidator Gate (정상/실패)
 *   2. AuroraJobStore in-memory 상태 전이
 *   3. AuroraWorker 폴링 사이클 (mock orchestrator)
 *   4. API 응답 구조 (supertest, 선택)
 */

'use strict';

const store = require('../../services/aurora/AuroraJobStore');
const { validateSpec, validateUnitCollision } = require('../../services/aurora/collisionValidator');
const { buildAssembleFilter, DEFAULT_TRANSITIONS } = require('../../services/aurora/assembler');
const { motionCompiler } = require('../../services/aurora/motionDSL');

// ── Helper: 유효한 샘플 스펙 ───────────────────────────────────────────────
function validSpec(overrides = {}) {
  return {
    specVersion: '1.2',
    buildId: 'smoke-test',
    units: [
      { unitId: 'u1', anchor: '/tmp/a1.png', motion: { dsl: 'ZIN2' }, continuityToNext: { mode: 'HOLD_THEN_DISSOLVE' } },
      { unitId: 'u2', anchor: '/tmp/a2.png', motion: { dsl: 'ZOUT2' }, continuityToNext: { mode: 'DISSOLVE_300' } },
      { unitId: 'u3', anchor: '/tmp/a3.png', motion: { dsl: 'PANL2' }, continuityToNext: { mode: 'DISSOLVE_300' } },
      { unitId: 'u4', anchor: '/tmp/a4.png', motion: { dsl: 'PANT2' }, continuityToNext: { mode: 'DISSOLVE_300' } },
      { unitId: 'u5', anchor: '/tmp/a5.png', motion: { dsl: 'BRTH' }, continuityToNext: { mode: 'HOLD_THEN_DISSOLVE' } },
      { unitId: 'u6', anchor: '/tmp/a6.png', motion: { dsl: 'ZIN2' } },
    ],
    ...overrides,
  };
}

// ════════════════════════════════════════════════════════════════════════════
// 1. Collision Validator Gate
// ════════════════════════════════════════════════════════════════════════════
describe('collisionValidator', () => {
  test('정상 스펙 → 통과', () => {
    expect(() => validateSpec(validSpec())).not.toThrow();
  });

  test('anchor 없음 → GATE FAIL', () => {
    const errs = validateUnitCollision({ unitId: 'u1' });
    expect(errs).toContain('[u1] anchor is required (non-empty string)');
  });

  test('keyframe.start < 0.5 → GATE FAIL', () => {
    const errs = validateUnitCollision({
      unitId: 'u1',
      anchor: 'a.png',
      keyframe: { alt: 'b.png', mode: 'SOFT_REVEAL', start: 0.3, duration: 1.0 },
    });
    expect(errs.some(e => e.includes('keyframe.start'))).toBe(true);
  });

  test('BLINK_FAST duration > 0.25 → GATE FAIL', () => {
    const errs = validateUnitCollision({
      unitId: 'u1',
      anchor: 'a.png',
      keyframe: { alt: 'b.png', mode: 'BLINK_FAST', start: 0.5, duration: 0.5 },
    });
    expect(errs.some(e => e.includes('BLINK_FAST'))).toBe(true);
  });

  test('start + duration > 4.6 → GATE FAIL', () => {
    const errs = validateUnitCollision({
      unitId: 'u1',
      anchor: 'a.png',
      keyframe: { alt: 'b.png', mode: 'SOFT_REVEAL', start: 3.5, duration: 1.5 },
    });
    expect(errs.some(e => e.includes('4.6'))).toBe(true);
  });

  test('잘못된 DSL base → GATE FAIL', () => {
    const errs = validateUnitCollision({
      unitId: 'u1',
      anchor: 'a.png',
      motion: { dsl: 'UNKNOWN_DSL' },
    });
    expect(errs.some(e => e.includes('motion.dsl base'))).toBe(true);
  });

  test('잘못된 continuityToNext mode → GATE FAIL', () => {
    const errs = validateUnitCollision({
      unitId: 'u1',
      anchor: 'a.png',
      continuityToNext: { mode: 'WIPE' },
    });
    expect(errs.some(e => e.includes('continuityToNext.mode'))).toBe(true);
  });

  test('validateSpec 에러 1개라도 → throw', () => {
    expect(() =>
      validateSpec({ units: [{ unitId: 'u1' }] })  // anchor 없음
    ).toThrow(/AURORA GATE/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 2. Motion DSL Compiler
// ════════════════════════════════════════════════════════════════════════════
describe('motionDSL', () => {
  const DSL_BASES = ['ZIN2', 'ZOUT2', 'PANL2', 'PANT2', 'BRTH'];

  test.each(DSL_BASES)('%s → zoompan filter 생성', (dsl) => {
    const filter = motionCompiler(dsl);
    expect(filter).toContain('zoompan');
    expect(filter).toContain('1080x1920');
  });

  test('ZIN2+HOLD_FADE → fade 추가', () => {
    const filter = motionCompiler('ZIN2+HOLD_FADE');
    expect(filter).toContain('fade=t=out:st=4.6:d=0.4');
  });

  test('UNKNOWN → throw', () => {
    expect(() => motionCompiler('FOOBAR')).toThrow(/Unknown base DSL/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 3. buildAssembleFilter — offset 검증
// ════════════════════════════════════════════════════════════════════════════
describe('buildAssembleFilter', () => {
  test('6유닛 B안 → filter_complex 생성', () => {
    const filter = buildAssembleFilter(6, DEFAULT_TRANSITIONS);
    // u1→u2 HOLD_THEN_DISSOLVE: offset=5
    expect(filter).toContain('offset=5[x0]');
    // u2→u3 DISSOLVE_300: offset=9.75
    expect(filter).toContain('offset=9.75[x1]');
    // 마지막: format=yuv420p[v]
    expect(filter).toContain('format=yuv420p[v]');
  });

  test('unitCount-1 !== transitions.length → throw', () => {
    expect(() => buildAssembleFilter(6, ['DISSOLVE_300', 'DISSOLVE_300'])).toThrow();
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 4. AuroraJobStore (in-memory mode)
// ════════════════════════════════════════════════════════════════════════════
describe('AuroraJobStore (in-memory)', () => {
  let jobId;

  test('createJob → NEW 상태', async () => {
    const job = await store.createJob({ spec_json: validSpec() });
    expect(job.status).toBe('NEW');
    expect(job.attempt).toBe(0);
    expect(job.retryable).toBe(true);
    jobId = job.id;
  });

  test('getJob → 조회됨', async () => {
    const job = await store.getJob(jobId);
    expect(job).not.toBeNull();
    expect(job.id).toBe(jobId);
  });

  test('claimJob → Job 획득 + locked_at 세팅', async () => {
    const claimed = await store.claimJob();
    expect(claimed).not.toBeNull();
    expect(claimed.id).toBe(jobId);
    expect(claimed.locked_at).not.toBeNull();
  });

  test('claimJob (2번째) → null (already locked)', async () => {
    const second = await store.claimJob();
    expect(second).toBeNull();
  });

  test('transitionTo NEW→RENDERING', async () => {
    // 락 해제를 위해 다시 job 수동 생성
    const job2 = await store.createJob({ spec_json: validSpec() });
    const updated = await store.transitionTo(job2.id, 'RENDERING');
    expect(updated.status).toBe('RENDERING');
  });

  test('transitionTo RENDERING→ASSEMBLING', async () => {
    const job3 = await store.createJob({ spec_json: validSpec() });
    await store.transitionTo(job3.id, 'RENDERING');
    const updated = await store.transitionTo(job3.id, 'ASSEMBLING');
    expect(updated.status).toBe('ASSEMBLING');
  });

  test('transitionTo ASSEMBLING→DONE (artifacts)', async () => {
    const job4 = await store.createJob({ spec_json: validSpec() });
    await store.transitionTo(job4.id, 'RENDERING');
    await store.transitionTo(job4.id, 'ASSEMBLING');
    const artifacts = { final: '/tmp/final.mp4', u1: '/tmp/u1.mp4' };
    const done = await store.transitionTo(job4.id, 'DONE', { artifacts });
    expect(done.status).toBe('DONE');
    expect(done.artifacts.final).toBe('/tmp/final.mp4');
  });

  test('잘못된 전이 → throw', async () => {
    const job5 = await store.createJob({ spec_json: validSpec() });
    await expect(store.transitionTo(job5.id, 'DONE')).rejects.toThrow(/Invalid.*transition/);
  });

  test('failJob → FAILED + retryable', async () => {
    const job6 = await store.createJob({ spec_json: validSpec() });
    await store.transitionTo(job6.id, 'RENDERING');
    const failed = await store.failJob(job6.id, { error: 'FFmpeg crash', stage: 'RENDERING' });
    expect(failed.status).toBe('FAILED');
    expect(failed.retryable).toBe(true);
    expect(failed.last_error).toBe('FFmpeg crash');
  });

  test('failJob retryable=false → Gate 실패 표시', async () => {
    const job7 = await store.createJob({ spec_json: validSpec() });
    await store.transitionTo(job7.id, 'RENDERING');
    const failed = await store.failJob(job7.id, {
      error: 'Gate fail', stage: 'GATE', retryable: false
    });
    expect(failed.retryable).toBe(false);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// 5. AuroraWorker — 폴링 사이클 (mock orchestrator)
// ════════════════════════════════════════════════════════════════════════════
describe('AuroraWorker (mock)', () => {
  // Worker 내부의 runJob을 mock으로 교체하는 smoke test
  test('Worker 인스턴스 생성 + start/stop', () => {
    const AuroraWorker = require('../../services/aurora/AuroraWorker');
    const worker = new AuroraWorker();

    // _doPoll을 mock으로 치환
    worker._doPoll = async () => {};

    worker.start();
    expect(worker._running).toBe(true);

    worker.stop();
    expect(worker._running).toBe(false);
  });
});
