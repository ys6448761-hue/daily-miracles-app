#!/usr/bin/env node
/**
 * Aurora Build Pipeline — v1.2
 *
 * 실행: node scripts/aurora-build.js [--spec <path.json>] [--skip-test-assets]
 *
 * 산출물:
 *   dist/aurora/units/u1.mp4 ~ u6.mp4      (각 5초, 1080×1920, 30fps)
 *   dist/aurora/final/final_rough_concat.mp4 (concat, 전환 없음)
 *   dist/aurora/final/final_30s.mp4          (Continuity 적용)
 *
 * Gate: validateUnitCollision 실패 시 빌드 hard fail (exit 1)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execFileSync } = require('child_process');

const { validateSpec }        = require('../services/aurora/collisionValidator');
const { renderUnit }          = require('../services/aurora/unitRenderer');
const {
  roughConcat,
  continuityAssemble,
  DEFAULT_TRANSITIONS,
}                             = require('../services/aurora/assembler');

// ── 경로 상수 ────────────────────────────────────────────────────────────────
const UNITS_DIR  = path.resolve('dist/aurora/units');
const FINAL_DIR  = path.resolve('dist/aurora/final');
const ASSETS_DIR = path.resolve('dist/aurora/test-assets');

// ── 샘플 스펙 (--spec 미지정 시 사용) ───────────────────────────────────────
function buildSampleSpec() {
  // Aurora 브랜드 컬러 팔레트 (서비스 브랜드)
  const anchorColors = ['9B87F5', 'F5A7C6', '6E59A5', 'FFF0F5', 'E8B4D8', 'B89FEC'];
  const altColors    = ['F5A7C6', '9B87F5', 'E8B4D8', 'B89FEC', 'FFF0F5', '6E59A5'];

  return {
    specVersion: '1.2',
    buildId:     'aurora-sample-v1',
    units: [
      {
        unitId:   'u1',
        anchor:   path.join(ASSETS_DIR, 'u1_anchor.png'),
        motion:   { dsl: 'ZIN2+HOLD_FADE' },
        continuityToNext: { mode: 'HOLD_THEN_DISSOLVE' },
      },
      {
        unitId:   'u2',
        anchor:   path.join(ASSETS_DIR, 'u2_anchor.png'),
        keyframe: {
          alt:      path.join(ASSETS_DIR, 'u2_alt.png'),
          mode:     'SOFT_REVEAL',
          start:    1.0,
          duration: 1.2,
        },
        motion:   { dsl: 'ZOUT2' },
        continuityToNext: { mode: 'DISSOLVE_300' },
      },
      {
        unitId:   'u3',
        anchor:   path.join(ASSETS_DIR, 'u3_anchor.png'),
        motion:   { dsl: 'PANL2' },
        continuityToNext: { mode: 'DISSOLVE_300' },
      },
      {
        unitId:   'u4',
        anchor:   path.join(ASSETS_DIR, 'u4_anchor.png'),
        motion:   { dsl: 'PANT2' },
        continuityToNext: { mode: 'DISSOLVE_300' },
      },
      {
        unitId:   'u5',
        anchor:   path.join(ASSETS_DIR, 'u5_anchor.png'),
        keyframe: {
          alt:      path.join(ASSETS_DIR, 'u5_alt.png'),
          mode:     'BLINK_FAST',
          start:    0.5,
          duration: 0.15,
        },
        motion:   { dsl: 'BRTH' },
        continuityToNext: { mode: 'HOLD_THEN_DISSOLVE' },
      },
      {
        unitId:   'u6',
        anchor:   path.join(ASSETS_DIR, 'u6_anchor.png'),
        motion:   { dsl: 'ZIN2' },
        // continuityToNext 없음 (마지막 유닛)
      },
    ],
    _anchorColors: anchorColors,
    _altColors:    altColors,
  };
}

// ── 테스트 에셋 생성 (플레이스홀더 PNG) ─────────────────────────────────────
function generateTestAssets(spec) {
  const { _anchorColors, _altColors } = spec;
  if (!_anchorColors) return; // 외부 spec → 이미 이미지가 있다고 가정

  fs.mkdirSync(ASSETS_DIR, { recursive: true });

  for (let i = 0; i < spec.units.length; i++) {
    const unit      = spec.units[i];
    const ac        = _anchorColors[i] || '888888';
    const altC      = _altColors    ? _altColors[i] || 'AAAAAA' : null;
    const anchorPath = unit.anchor;
    const altPath    = unit.keyframe ? unit.keyframe.alt : null;

    // anchor PNG 생성 (없는 경우만)
    if (!fs.existsSync(anchorPath)) {
      try {
        execFileSync('ffmpeg', [
          '-y', '-f', 'lavfi',
          '-i', `color=c=0x${ac}:s=1080x1920:d=1:r=1`,
          '-vframes', '1',
          anchorPath,
        ], { stdio: 'pipe' });
        log(`  [asset] ${path.basename(anchorPath)} 생성 (#${ac})`);
      } catch (err) {
        throw new Error(`테스트 에셋 생성 실패 (anchor u${i+1}): ${err.message}`);
      }
    }

    // alt PNG 생성 (keyframe 있는 유닛)
    if (altPath && !fs.existsSync(altPath)) {
      try {
        execFileSync('ffmpeg', [
          '-y', '-f', 'lavfi',
          '-i', `color=c=0x${altC}:s=1080x1920:d=1:r=1`,
          '-vframes', '1',
          altPath,
        ], { stdio: 'pipe' });
        log(`  [asset] ${path.basename(altPath)} 생성 (#${altC})`);
      } catch (err) {
        throw new Error(`테스트 에셋 생성 실패 (alt u${i+1}): ${err.message}`);
      }
    }
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────────────────
function log(msg)  { process.stdout.write(msg + '\n'); }
function warn(msg) { process.stderr.write('[WARN] ' + msg + '\n'); }

function elapsedMs(start) {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

function parseArgs() {
  const args   = process.argv.slice(2);
  const result = { specPath: null, skipTestAssets: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--spec' && args[i + 1]) {
      result.specPath = path.resolve(args[++i]);
    }
    if (args[i] === '--skip-test-assets') {
      result.skipTestAssets = true;
    }
  }
  return result;
}

// ── 메인 파이프라인 ───────────────────────────────────────────────────────────
async function main() {
  const buildStart = Date.now();
  const { specPath, skipTestAssets } = parseArgs();

  log('\n╔══════════════════════════════════════════════════════════╗');
  log('║        Aurora Build Pipeline v1.2                       ║');
  log('╚══════════════════════════════════════════════════════════╝\n');

  // ── Step 1: Spec 로드 ──────────────────────────────────────────────────────
  log('[1/5] Spec 로드...');
  let spec;
  if (specPath) {
    if (!fs.existsSync(specPath)) {
      throw new Error(`Spec 파일을 찾을 수 없음: ${specPath}`);
    }
    spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
    log(`  외부 spec 로드: ${specPath}`);
    log(`  buildId: ${spec.buildId || '(없음)'}, units: ${spec.units.length}개`);
  } else {
    spec = buildSampleSpec();
    log('  내장 샘플 spec 사용 (6유닛, 브랜드 컬러 플레이스홀더)');
  }

  // ── Step 2: Collision Gate ─────────────────────────────────────────────────
  log('\n[2/5] Collision Validator (Gate)...');
  validateSpec(spec); // 에러 있으면 여기서 throw → exit 1
  log(`  ✓ ${spec.units.length}개 유닛 모두 통과`);

  // ── Step 3a: 테스트 에셋 생성 (샘플 스펙인 경우) ────────────────────────────
  if (!specPath && !skipTestAssets) {
    log('\n[2.5] 테스트 에셋 생성 (플레이스홀더 PNG)...');
    generateTestAssets(spec);
    log('  ✓ 완료');
  }

  // ── Step 3: 유닛 렌더 ─────────────────────────────────────────────────────
  log('\n[3/5] 유닛 렌더 (keyframe → motion)...');
  const tmpDir   = path.join(os.tmpdir(), `aurora-build-${Date.now()}`);
  const unitPaths = [];

  for (const unit of spec.units) {
    const t0 = Date.now();
    process.stdout.write(`  ${unit.unitId}: 렌더 중...`);

    const outPath = renderUnit(unit, tmpDir, UNITS_DIR);
    unitPaths.push(outPath);

    const size = (fs.statSync(outPath).size / 1024).toFixed(0);
    log(` ✓ ${elapsedMs(t0)} (${size} KB)`);
  }

  // tmpDir 정리
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

  // ── Step 4: Rough Concat ───────────────────────────────────────────────────
  log('\n[4/5] Rough concat (전환 없음)...');
  const roughPath = path.join(FINAL_DIR, 'final_rough_concat.mp4');
  roughConcat(unitPaths, roughPath);
  const roughSize = (fs.statSync(roughPath).size / 1024).toFixed(0);
  log(`  ✓ final_rough_concat.mp4 (${roughSize} KB)`);

  // ── Step 5: Continuity Assemble ───────────────────────────────────────────
  log('\n[5/5] Continuity assemble (B안 전환 적용)...');
  log('  전환: ' + DEFAULT_TRANSITIONS.join(' → '));
  const finalPath = path.join(FINAL_DIR, 'final_30s.mp4');

  if (unitPaths.length !== 6) {
    warn(`유닛 수가 6이 아님 (${unitPaths.length}). DEFAULT_TRANSITIONS 수 조정.`);
  }

  const transitions = DEFAULT_TRANSITIONS.slice(0, unitPaths.length - 1);
  continuityAssemble(unitPaths, transitions, finalPath);
  const finalSize = (fs.statSync(finalPath).size / 1024).toFixed(0);
  log(`  ✓ final_30s.mp4 (${finalSize} KB)`);

  // ── 완료 요약 ─────────────────────────────────────────────────────────────
  log('\n╔══════════════════════════════════════════════════════════╗');
  log(`║  BUILD SUCCESS  (총 ${elapsedMs(buildStart).padEnd(6)})                       ║`);
  log('╚══════════════════════════════════════════════════════════╝');
  log('');
  log('  산출물:');
  log(`  • ${UNITS_DIR}/`);
  unitPaths.forEach(p => log(`      ${path.basename(p)}`));
  log(`  • ${roughPath}`);
  log(`  • ${finalPath}`);
  log('');
}

// ── 모듈 API (AuroraOrchestrator에서 호출) ───────────────────────────────────
/**
 * 외부에서 호출 가능한 파이프라인 함수
 * @param {object} spec  AuroraSpec v1.2
 * @param {object} [opts]
 * @param {string} [opts.unitsDir]  유닛 출력 디렉토리 (기본: dist/aurora/units)
 * @param {string} [opts.finalDir]  최종 출력 디렉토리 (기본: dist/aurora/final)
 * @returns {Promise<{ unitPaths: string[], roughPath: string, finalPath: string }>}
 */
async function buildSpec(spec, opts = {}) {
  const { validateSpec: _validate } = require('../services/aurora/collisionValidator');
  _validate(spec); // Gate: throws on failure

  const unitsDir = opts.unitsDir || UNITS_DIR;
  const finalDir = opts.finalDir || FINAL_DIR;
  const tmpDir   = path.join(os.tmpdir(), `aurora-build-${Date.now()}`);

  const unitPaths = [];
  for (const unit of spec.units) {
    const outPath = renderUnit(unit, tmpDir, unitsDir);
    unitPaths.push(outPath);
  }
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

  const ts        = Date.now();
  const roughPath = path.join(finalDir, `rough_${ts}.mp4`);
  const finalPath = path.join(finalDir, `final_${ts}.mp4`);

  roughConcat(unitPaths, roughPath);
  const transitions = DEFAULT_TRANSITIONS.slice(0, unitPaths.length - 1);
  continuityAssemble(unitPaths, transitions, finalPath);

  return { unitPaths, roughPath, finalPath };
}

module.exports = { buildSpec };

// ── 진입점 (CLI 직접 실행 시만) ─────────────────────────────────────────────
if (require.main === module) {
  main().catch(err => {
    process.stderr.write('\n╔══════════════════════════════════════════════════════════╗\n');
    process.stderr.write('║  BUILD FAILED                                            ║\n');
    process.stderr.write('╚══════════════════════════════════════════════════════════╝\n');
    process.stderr.write('\n' + err.message + '\n\n');
    process.exit(1);
  });
}
