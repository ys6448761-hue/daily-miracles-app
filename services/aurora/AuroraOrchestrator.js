/**
 * AuroraOrchestrator — 상태머신 실행기
 * AIL-2026-0301-VIDJOB-001
 *
 * 상태 전이:
 *   NEW → RENDERING → ASSEMBLING → DONE
 *         ↘ (어느 단계든) → FAILED
 *
 * Gate:
 *   - collisionValidator는 RENDERING 진입 전 hard fail
 *   - Gate 실패 → retryable=false (재시도 금지)
 *
 * 파이프라인:
 *   - RENDERING  : u1~u6 유닛 렌더 (buildUnits)
 *   - ASSEMBLING : rough concat + continuity final (buildAssemble)
 */

'use strict';

const path = require('path');
const os   = require('os');
const fs   = require('fs');

const store = require('./AuroraJobStore');
const { validateSpec }   = require('./collisionValidator');
const { renderUnit }     = require('./unitRenderer');
const { roughConcat, continuityAssemble, DEFAULT_TRANSITIONS } = require('./assembler');

const UNITS_DIR = path.resolve('dist/aurora/units');
const FINAL_DIR = path.resolve('dist/aurora/final');

/**
 * 단일 Job 실행
 *
 * @param {object} job  - AuroraJobStore에서 claim된 job (normalized)
 * @returns {Promise<void>}
 */
async function runJob(job) {
  const { id, spec_json } = job;
  const spec = typeof spec_json === 'string' ? JSON.parse(spec_json) : spec_json;

  // ── Gate: Collision Validator (RENDERING 진입 전) ────────────────────────
  try {
    validateSpec(spec);
  } catch (gateErr) {
    // Gate 실패 → retryable=false, hard fail
    await store.failJob(id, {
      error:     gateErr.message,
      stage:     'GATE',
      retryable: false,
    });
    return;
  }

  // ── RENDERING ─────────────────────────────────────────────────────────────
  try {
    await store.transitionTo(id, 'RENDERING');
  } catch (err) {
    await store.failJob(id, { error: err.message, stage: 'RENDERING_INIT' });
    return;
  }

  let unitPaths;
  const tmpDir = path.join(os.tmpdir(), `aurora-job-${id}-${Date.now()}`);

  try {
    unitPaths = await renderUnits(spec, tmpDir);
  } catch (renderErr) {
    await store.failJob(id, { error: renderErr.message, stage: 'RENDERING' });
    _cleanTmp(tmpDir);
    return;
  }
  _cleanTmp(tmpDir);

  // ── ASSEMBLING ────────────────────────────────────────────────────────────
  try {
    await store.transitionTo(id, 'ASSEMBLING');
  } catch (err) {
    await store.failJob(id, { error: err.message, stage: 'ASSEMBLING_INIT' });
    return;
  }

  let artifacts;
  try {
    artifacts = await assemble(unitPaths);
  } catch (asmErr) {
    await store.failJob(id, { error: asmErr.message, stage: 'ASSEMBLING' });
    return;
  }

  // ── DONE ──────────────────────────────────────────────────────────────────
  try {
    await store.transitionTo(id, 'DONE', { artifacts });
  } catch (err) {
    await store.failJob(id, { error: err.message, stage: 'DONE_TRANSITION' });
  }
}

// ── 내부: 유닛 렌더 ───────────────────────────────────────────────────────────
async function renderUnits(spec, tmpDir) {
  const outDir = path.join(UNITS_DIR, spec.buildId || 'default');
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(tmpDir,  { recursive: true });

  const unitPaths = [];
  for (const unit of spec.units) {
    const outPath = renderUnit(unit, tmpDir, outDir);
    unitPaths.push(outPath);
  }
  return unitPaths;
}

// ── 내부: Assemble ───────────────────────────────────────────────────────────
async function assemble(unitPaths) {
  fs.mkdirSync(FINAL_DIR, { recursive: true });

  const ts        = Date.now();
  const roughPath = path.join(FINAL_DIR, `rough_${ts}.mp4`);
  const finalPath = path.join(FINAL_DIR, `final_${ts}.mp4`);

  roughConcat(unitPaths, roughPath);

  const transitions = DEFAULT_TRANSITIONS.slice(0, unitPaths.length - 1);
  continuityAssemble(unitPaths, transitions, finalPath);

  const artifacts = { final: finalPath, rough: roughPath };
  unitPaths.forEach((p, i) => {
    artifacts[`u${i + 1}`] = p;
  });

  return artifacts;
}

// ── 내부: tmp 정리 ───────────────────────────────────────────────────────────
function _cleanTmp(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ }
}

module.exports = { runJob };
