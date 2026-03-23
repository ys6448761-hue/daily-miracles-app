/**
 * Smoke Test — Incident Counter + Stage2 Gate
 *
 * Tests:
 * 1. detectFalsePositives: shadow에서 FP 감지
 * 2. collectIncidents: FP + manual override + rollback trigger 수집
 * 3. loadIncidentHistory: artifact 읽기
 * 4. analyzeEnforceReadiness: incident history → stage2 gate 반영
 * 5. health.ts 통합: collectIncidents import + artifact 쓰기
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  detectFalsePositives,
  collectIncidents,
  loadIncidentHistory,
  analyzeEnforceReadiness,
  ENFORCE_GATE,
} from '../scripts/lib/health-policy';
import type { ShadowReport, IncidentRecord } from '../scripts/lib/health-policy';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string) {
  if (cond) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}`); failed++; }
}

// ─── Setup temp dirs ───
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'incident-test-'));
const incidentDir = path.join(tmpDir, 'incidents');
const healthDir = path.join(tmpDir, 'health');
fs.mkdirSync(incidentDir, { recursive: true });

console.log('\n  Smoke Test: Incident Counter + Stage2 Gate\n');

// ─── Test 1: detectFalsePositives ───
console.log('  --- Test 1: detectFalsePositives ---');

const shadowReportsWithFP: ShadowReport[] = [
  {
    mode: 'enforce-partial',
    experimentId: 'exp-a',
    timestamp: new Date().toISOString(),
    overallLegacy: 'PASS',
    overallPolicy: 'WARN',
    diverges: true,
    diffs: [
      { metric: 'srm', legacyStatus: 'PASS', policyStatus: 'WARN', policyReason: 'p < 0.05', diverges: true },
      { metric: 'contamination', legacyStatus: 'PASS', policyStatus: 'PASS', diverges: false },
    ],
  },
  {
    mode: 'enforce-partial',
    experimentId: 'exp-b',
    timestamp: new Date().toISOString(),
    overallLegacy: 'PASS',
    overallPolicy: 'FAIL',
    diverges: true,
    diffs: [
      { metric: 'bias', legacyStatus: 'PASS', policyStatus: 'FAIL', policyReason: '>= 60%', diverges: true },
    ],
  },
];

const fps = detectFalsePositives(shadowReportsWithFP);
assert(fps.length === 2, 'detectFalsePositives: 2 FP events found');
assert(fps[0].experimentId === 'exp-a', 'FP[0] is exp-a');
assert(fps[0].metric === 'srm', 'FP[0] metric is srm');
assert(fps[1].experimentId === 'exp-b', 'FP[1] is exp-b');

// No FP case
const shadowClean: ShadowReport[] = [
  {
    mode: 'shadow',
    experimentId: 'exp-c',
    timestamp: new Date().toISOString(),
    overallLegacy: 'PASS',
    overallPolicy: 'PASS',
    diverges: false,
    diffs: [
      { metric: 'srm', legacyStatus: 'PASS', policyStatus: 'PASS', diverges: false },
    ],
  },
];
const fpsClean = detectFalsePositives(shadowClean);
assert(fpsClean.length === 0, 'detectFalsePositives: 0 FP when all agree');

// ─── Test 2: collectIncidents ───
console.log('\n  --- Test 2: collectIncidents ---');

// Case A: with FP events, no override, no rollback
const incidentA = collectIncidents(shadowReportsWithFP, 0.0, false, incidentDir, '2026-02-27');
assert(incidentA.false_positive === 2, 'collectIncidents: 2 false positives');
assert(incidentA.manual_override === 0, 'collectIncidents: 0 manual overrides');
assert(incidentA.rollback_trigger === 0, 'collectIncidents: 0 rollback triggers');
assert(incidentA.incident_count === 2, 'collectIncidents: total incident_count = 2');
assert(incidentA.details.length === 2, 'collectIncidents: 2 detail entries');

// Case B: with manual override file
fs.writeFileSync(
  path.join(incidentDir, '2026-02-28-override.json'),
  JSON.stringify({
    overrides: [
      { experimentId: 'exp-x', reason: 'operator reviewed, safe to proceed' },
    ],
  }),
  'utf-8',
);
const incidentB = collectIncidents([], 0.0, false, incidentDir, '2026-02-28');
assert(incidentB.manual_override === 1, 'collectIncidents: 1 manual override from file');
assert(incidentB.incident_count === 1, 'collectIncidents: total = 1 (override only)');

// Case C: rollback triggers (FP rate > 10%)
const incidentC = collectIncidents([], 0.15, false, incidentDir, '2026-02-29');
assert(incidentC.rollback_trigger >= 1, 'collectIncidents: rollback trigger from high FP rate');

// ─── Test 3: loadIncidentHistory ───
console.log('\n  --- Test 3: loadIncidentHistory ---');

// Write incident artifacts
fs.writeFileSync(
  path.join(incidentDir, '2026-02-27.json'),
  JSON.stringify(incidentA),
  'utf-8',
);
fs.writeFileSync(
  path.join(incidentDir, '2026-02-28.json'),
  JSON.stringify(incidentB),
  'utf-8',
);

const history = loadIncidentHistory(incidentDir);
assert(history.records.length === 2, 'loadIncidentHistory: 2 records loaded');
assert(history.totalIncidents === 3, 'loadIncidentHistory: total = 2 + 1 = 3');

// With sinceDays filter
const historyAll = loadIncidentHistory(incidentDir, 365);
assert(historyAll.records.length === 2, 'loadIncidentHistory(365): all records included');

// Non-existent dir
const historyEmpty = loadIncidentHistory(path.join(tmpDir, 'nonexistent'));
assert(historyEmpty.totalIncidents === 0, 'loadIncidentHistory: 0 for missing dir');
assert(historyEmpty.records.length === 0, 'loadIncidentHistory: empty records for missing dir');

// ─── Test 4: analyzeEnforceReadiness with incidents ───
console.log('\n  --- Test 4: analyzeEnforceReadiness + incidents ---');

// Setup: create health dir with shadow data
for (let i = 1; i <= 8; i++) {
  const date = `2026-02-${String(i).padStart(2, '0')}`;
  const dir = path.join(healthDir, date);
  fs.mkdirSync(dir, { recursive: true });

  const shadow: ShadowReport[] = [{
    mode: 'shadow',
    experimentId: 'exp-test',
    timestamp: `${date}T12:00:00Z`,
    overallLegacy: 'PASS',
    overallPolicy: 'PASS',
    diverges: false,
    diffs: [{ metric: 'srm', legacyStatus: 'PASS', policyStatus: 'PASS', diverges: false }],
  }];
  fs.writeFileSync(path.join(dir, 'shadow.json'), JSON.stringify(shadow), 'utf-8');

  const batch = {
    date,
    experiments: [{ experimentId: 'exp-test', result: { health: { overall: 'PASS' } } }],
    summary: { total: 1, active: 1, frozen: 0, pass: 1, warn: 0, fail: 0 },
  };
  fs.writeFileSync(path.join(dir, 'batch.json'), JSON.stringify(batch), 'utf-8');
}

const report = analyzeEnforceReadiness(healthDir);
assert(report.shadow.totalDays === 8, 'gate: 8 shadow days');
assert(report.shadow.consecutiveZeroDays === 8, 'gate: 8 consecutive zero-divergence');
assert(report.shadow.stage1Met === true, 'gate: stage1 MET');

// With incidents present, stage2 should be blocked
assert(report.enforce.incidents === 3, 'gate: incidents = 3 (from history)');
assert(report.enforce.incidentBreakdown.false_positive === 2, 'gate: FP breakdown = 2');
assert(report.enforce.incidentBreakdown.manual_override === 1, 'gate: override breakdown = 1');
assert(report.enforce.stage2Met === false, 'gate: stage2 NOT met (incidents > 0)');

// ─── Test 5: Zero incident → stage2 passes ───
console.log('\n  --- Test 5: Zero incidents + enforce days >= 5 ---');

// Clean incident dir
for (const f of fs.readdirSync(incidentDir)) {
  fs.unlinkSync(path.join(incidentDir, f));
}

// Create enforce shadow reports
for (let i = 1; i <= 6; i++) {
  const date = `2026-02-${String(10 + i).padStart(2, '0')}`;
  const dir = path.join(healthDir, date);
  fs.mkdirSync(dir, { recursive: true });

  const shadow: ShadowReport[] = [{
    mode: 'enforce-partial',
    experimentId: 'exp-test',
    timestamp: `${date}T12:00:00Z`,
    overallLegacy: 'PASS',
    overallPolicy: 'PASS',
    diverges: false,
    diffs: [{ metric: 'srm', legacyStatus: 'PASS', policyStatus: 'PASS', diverges: false }],
  }];
  fs.writeFileSync(path.join(dir, 'shadow.json'), JSON.stringify(shadow), 'utf-8');

  const batch = {
    date,
    experiments: [{ experimentId: 'exp-test', result: { health: { overall: 'PASS' } } }],
    summary: { total: 1, active: 1, frozen: 0, pass: 1, warn: 0, fail: 0 },
  };
  fs.writeFileSync(path.join(dir, 'batch.json'), JSON.stringify(batch), 'utf-8');
}

const report2 = analyzeEnforceReadiness(healthDir);
assert(report2.enforce.incidents === 0, 'gate: 0 incidents after cleanup');
assert(report2.enforce.enforceDays >= 5, `gate: enforce days = ${report2.enforce.enforceDays} >= 5`);
assert(report2.enforce.stage2Met === true, 'gate: stage2 MET with 0 incidents');

// ─── Test 6: health.ts import check ───
console.log('\n  --- Test 6: health.ts import check ---');

const healthTs = fs.readFileSync(path.resolve('scripts', 'health.ts'), 'utf-8');
assert(healthTs.includes('collectIncidents'), 'health.ts imports collectIncidents');
assert(healthTs.includes("'artifacts', 'incidents'"), 'health.ts writes to artifacts/incidents');
assert(healthTs.includes('incidentRecord.incident_count'), 'health.ts checks incident_count');
assert(healthTs.includes('incidentBreakdown'), 'health.ts shows incidentBreakdown');

// ─── Cleanup ───
fs.rmSync(tmpDir, { recursive: true, force: true });

// ─── Summary ───
console.log(`\n  ═══════════════════════════════════════`);
console.log(`  Smoke test: ${passed}/${passed + failed} passed`);
if (failed > 0) {
  console.log(`  ${failed} FAILED`);
  process.exit(1);
} else {
  console.log(`  All passed`);
}
