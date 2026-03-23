/**
 * Smoke Test — Health Artifact Rotation (디렉토리 기반)
 *
 * Tests:
 * 1. rotateHealthArtifacts: 90일 이상 디렉토리 삭제
 * 2. 보호 장치: 오늘 / 최근 / 비날짜 디렉토리 유지
 * 3. dry-run 모드
 * 4. health.ts 통합 검증
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import { rotateHealthArtifacts } from '../scripts/lib/health-policy';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string) {
  if (cond) { console.log(`  \u2705 ${name}`); passed++; }
  else { console.log(`  \u274C ${name}`); failed++; }
}

console.log('\n  Smoke Test: Health Artifact Rotation\n');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'health-rot-test-'));
const healthDir = path.join(tmpDir, 'health');
fs.mkdirSync(healthDir, { recursive: true });

const today = new Date().toISOString().slice(0, 10);

// 120일 전 (삭제 대상)
const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 120);
const oldDateStr = oldDate.toISOString().slice(0, 10);

// 30일 전 (유지 대상)
const recentDate = new Date();
recentDate.setDate(recentDate.getDate() - 30);
const recentDateStr = recentDate.toISOString().slice(0, 10);

// 91일 전 (경계 — 삭제 대상)
const borderDate = new Date();
borderDate.setDate(borderDate.getDate() - 91);
const borderDateStr = borderDate.toISOString().slice(0, 10);

// 89일 전 (경계 — 유지 대상)
const safeBorderDate = new Date();
safeBorderDate.setDate(safeBorderDate.getDate() - 89);
const safeBorderDateStr = safeBorderDate.toISOString().slice(0, 10);

// Create directories with files inside
function createHealthDir(dateStr: string) {
  const dir = path.join(healthDir, dateStr);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'batch.json'), '{"date":"' + dateStr + '"}', 'utf-8');
  fs.writeFileSync(path.join(dir, 'shadow.json'), '[]', 'utf-8');
  fs.writeFileSync(path.join(dir, 'enforce-readiness.json'), '{}', 'utf-8');
}

createHealthDir(oldDateStr);
createHealthDir(borderDateStr);
createHealthDir(safeBorderDateStr);
createHealthDir(recentDateStr);
createHealthDir(today);

// Non-date directory (should be skipped)
fs.mkdirSync(path.join(healthDir, 'latest'), { recursive: true });

// Non-directory file (should be skipped)
fs.writeFileSync(path.join(healthDir, 'README.md'), '# Health', 'utf-8');

// ─── Test 1: Dry-run ───
console.log('  --- Test 1: Dry-run mode ---');

const dryResult = rotateHealthArtifacts(healthDir, 90, true);
assert(dryResult.dryRun === true, 'dry-run mode enabled');
assert(dryResult.deleted.length === 2, `dry-run: 2 old dirs targeted (got ${dryResult.deleted.length})`);
assert(dryResult.deleted.includes(oldDateStr), 'dry-run targets 120d-old dir');
assert(dryResult.deleted.includes(borderDateStr), 'dry-run targets 91d-old dir');

// All dirs still exist
assert(fs.existsSync(path.join(healthDir, oldDateStr)), 'dry-run: old dir still exists');
assert(fs.existsSync(path.join(healthDir, borderDateStr)), 'dry-run: border dir still exists');

// ─── Test 2: Actual rotation ───
console.log('\n  --- Test 2: Actual rotation ---');

const rotResult = rotateHealthArtifacts(healthDir, 90, false);
assert(rotResult.deleted.length === 2, `rotation: 2 dirs deleted (got ${rotResult.deleted.length})`);

// Deleted dirs gone (including their contents)
assert(!fs.existsSync(path.join(healthDir, oldDateStr)), '120d-old dir deleted');
assert(!fs.existsSync(path.join(healthDir, oldDateStr, 'batch.json')), '120d-old batch.json gone');
assert(!fs.existsSync(path.join(healthDir, borderDateStr)), '91d-old dir deleted');

// ─── Test 3: Protected dirs preserved ───
console.log('\n  --- Test 3: Protection checks ---');

assert(fs.existsSync(path.join(healthDir, safeBorderDateStr)), '89d-old dir preserved');
assert(fs.existsSync(path.join(healthDir, safeBorderDateStr, 'batch.json')), '89d-old batch.json intact');
assert(fs.existsSync(path.join(healthDir, recentDateStr)), '30d-old dir preserved');
assert(fs.existsSync(path.join(healthDir, today)), 'today dir preserved');
assert(fs.existsSync(path.join(healthDir, today, 'batch.json')), 'today batch.json intact');

assert(rotResult.skipped.includes(today), 'today in skipped list');
assert(rotResult.skipped.includes(safeBorderDateStr), '89d in skipped list');
assert(rotResult.skipped.includes('latest'), 'non-date dir in skipped list');
assert(rotResult.skipped.includes('README.md'), 'non-dir file in skipped list');

// ─── Test 4: Edge cases ───
console.log('\n  --- Test 4: Edge cases ---');

// Non-existent directory
const emptyResult = rotateHealthArtifacts(path.join(tmpDir, 'nonexistent'));
assert(emptyResult.deleted.length === 0, 'non-existent dir: 0 deleted');

// Already-cleaned directory (run again)
const rerunResult = rotateHealthArtifacts(healthDir, 90, false);
assert(rerunResult.deleted.length === 0, 'rerun: 0 new deletions');

// ─── Test 5: health.ts integration check ───
console.log('\n  --- Test 5: health.ts integration ---');

const healthTs = fs.readFileSync(path.resolve('scripts', 'health.ts'), 'utf-8');
assert(healthTs.includes('rotateHealthArtifacts'), 'health.ts imports rotateHealthArtifacts');
assert(healthTs.includes('healthRotation'), 'health.ts captures rotation result');
assert(healthTs.includes('health dir(s) deleted'), 'health.ts logs health rotation count');

// ─── Cleanup ───
fs.rmSync(tmpDir, { recursive: true, force: true });

// ─── Summary ───
console.log(`\n  \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550`);
console.log(`  Smoke test: ${passed}/${passed + failed} passed`);
if (failed > 0) {
  console.log(`  ${failed} FAILED`);
  process.exit(1);
} else {
  console.log(`  All passed`);
}
