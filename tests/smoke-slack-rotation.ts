/**
 * Smoke Test — Slack Alert + Artifact Rotation
 *
 * Tests:
 * 1. buildIncidentAlertPayload: Block-Kit 구조 검증
 * 2. buildReadinessDigestPayload: digest 구조 검증
 * 3. sendSlackAlert: webhook 없을 때 graceful skip
 * 4. rotateIncidentArtifacts: 90일 정리 + 보호 장치
 * 5. health.ts 통합: import + 호출 검증
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  buildIncidentAlertPayload,
  buildReadinessDigestPayload,
  sendSlackAlert,
  rotateIncidentArtifacts,
} from '../scripts/lib/health-policy';
import type {
  IncidentRecord,
  EnforceGateReport,
  RotationResult,
} from '../scripts/lib/health-policy';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string) {
  if (cond) { console.log(`  \u2705 ${name}`); passed++; }
  else { console.log(`  \u274C ${name}`); failed++; }
}

(async () => {
console.log('\n  Smoke Test: Slack Alert + Artifact Rotation\n');

// ─── Setup ───
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'slack-rot-test-'));
const incidentDir = path.join(tmpDir, 'incidents');
fs.mkdirSync(incidentDir, { recursive: true });

// ─── Test 1: buildIncidentAlertPayload ───
console.log('  --- Test 1: buildIncidentAlertPayload ---');

const incident: IncidentRecord = {
  date: '2026-02-27',
  false_positive: 2,
  manual_override: 1,
  rollback_trigger: 0,
  incident_count: 3,
  details: [
    { type: 'false_positive', experimentId: 'exp-a', metric: 'srm', description: 'policy=WARN but legacy=PASS on srm' },
    { type: 'false_positive', experimentId: 'exp-b', metric: 'bias', description: 'policy=FAIL but legacy=PASS on bias' },
    { type: 'manual_override', experimentId: 'exp-x', description: 'operator reviewed' },
  ],
};

const alertPayload = buildIncidentAlertPayload(incident, 'enforce-partial') as any;
assert(Array.isArray(alertPayload.blocks), 'alert has blocks array');
assert(alertPayload.blocks[0].type === 'header', 'alert has header block');
assert(alertPayload.blocks[0].text.text.includes('Incident'), 'header mentions Incident');

const fields = alertPayload.blocks[1].fields;
assert(fields.some((f: any) => f.text.includes('2')), 'alert shows FP count');
assert(fields.some((f: any) => f.text.includes('enforce-partial')), 'alert shows stage');

// With rollback trigger
const incidentRollback: IncidentRecord = {
  date: '2026-02-27',
  false_positive: 0,
  manual_override: 0,
  rollback_trigger: 1,
  incident_count: 1,
  details: [{ type: 'rollback_trigger', description: 'FP rate > 10%' }],
};
const rollbackPayload = buildIncidentAlertPayload(incidentRollback, 'enforce') as any;
const actionBlock = rollbackPayload.blocks.find((b: any) =>
  b.text?.text?.includes('ROLLBACK'),
);
assert(actionBlock != null, 'rollback trigger shows ROLLBACK action');

// ─── Test 2: buildReadinessDigestPayload ───
console.log('\n  --- Test 2: buildReadinessDigestPayload ---');

const gateReport: EnforceGateReport = {
  date: '2026-02-27',
  currentMode: 'enforce-partial',
  recommendedStage: 'enforce',
  ready: true,
  shadow: {
    totalDays: 10,
    divergenceHistory: [],
    consecutiveZeroDays: 5,
    stage1Met: true,
  },
  enforce: {
    enforceDays: 6,
    totalBlocks: 10,
    correctBlocks: 10,
    falsePositives: 0,
    blockingAccuracy: 1.0,
    incidents: 0,
    incidentBreakdown: { false_positive: 0, manual_override: 0, rollback_trigger: 0 },
    stage2Met: true,
  },
  rollback: { needed: false },
  risks: [],
};

const digestPayload = buildReadinessDigestPayload(gateReport, incident) as any;
assert(Array.isArray(digestPayload.blocks), 'digest has blocks array');
assert(digestPayload.blocks[0].text.text.includes('Readiness'), 'digest header mentions Readiness');

const digestFields = digestPayload.blocks[1].fields;
assert(digestFields.some((f: any) => f.text.includes('10')), 'digest shows shadow days');
assert(digestFields.some((f: any) => f.text.includes('100.0%')), 'digest shows accuracy');
assert(digestFields.some((f: any) => f.text.includes('UPGRADE')), 'digest recommends UPGRADE');

// Ready=true → gate pass block
const gatePassBlock = digestPayload.blocks.find((b: any) =>
  b.text?.text?.includes('Gate'),
);
assert(gatePassBlock != null, 'digest shows gate pass when ready');

// Rollback case
const gateRollback: EnforceGateReport = {
  ...gateReport,
  rollback: { needed: true, reason: 'FP rate 15% > 10%' },
  ready: false,
};
const digestRollback = buildReadinessDigestPayload(gateRollback, incident) as any;
const rollbackBlock = digestRollback.blocks.find((b: any) =>
  b.text?.text?.includes('Rollback'),
);
assert(rollbackBlock != null, 'digest shows rollback warning when needed');
const recField = digestRollback.blocks[1].fields.find((f: any) =>
  f.text.includes('Recommendation'),
);
assert(recField?.text?.includes('ROLLBACK'), 'digest recommendation = ROLLBACK');

// ─── Test 3: sendSlackAlert — graceful skip ───
console.log('\n  --- Test 3: sendSlackAlert graceful skip ---');

const result3 = await sendSlackAlert(undefined, { text: 'test' });
assert(result3 === false, 'sendSlackAlert returns false when no webhook');

const result3b = await sendSlackAlert('', { text: 'test' });
assert(result3b === false, 'sendSlackAlert returns false for empty webhook');

// ─── Test 4: rotateIncidentArtifacts ───
console.log('\n  --- Test 4: rotateIncidentArtifacts ---');

const today = new Date().toISOString().slice(0, 10);

// Create test files: old (>90d), recent, today
const oldDate = new Date();
oldDate.setDate(oldDate.getDate() - 120);
const oldDateStr = oldDate.toISOString().slice(0, 10);

const recentDate = new Date();
recentDate.setDate(recentDate.getDate() - 30);
const recentDateStr = recentDate.toISOString().slice(0, 10);

fs.writeFileSync(path.join(incidentDir, `${oldDateStr}.json`), '{}', 'utf-8');
fs.writeFileSync(path.join(incidentDir, `${oldDateStr}-override.json`), '{}', 'utf-8');
fs.writeFileSync(path.join(incidentDir, `${recentDateStr}.json`), '{}', 'utf-8');
fs.writeFileSync(path.join(incidentDir, `${today}.json`), '{}', 'utf-8');
fs.writeFileSync(path.join(incidentDir, 'not-a-date.json'), '{}', 'utf-8');

// Dry-run first
const dryResult = rotateIncidentArtifacts(incidentDir, 90, true);
assert(dryResult.dryRun === true, 'dry-run mode enabled');
assert(dryResult.deleted.length === 2, `dry-run: 2 old files targeted (got ${dryResult.deleted.length})`);
assert(dryResult.deleted.includes(`${oldDateStr}.json`), 'dry-run targets old .json');
assert(dryResult.deleted.includes(`${oldDateStr}-override.json`), 'dry-run targets old override');

// All files still exist after dry-run
assert(fs.existsSync(path.join(incidentDir, `${oldDateStr}.json`)), 'dry-run did not delete old file');

// Actual rotation
const rotResult = rotateIncidentArtifacts(incidentDir, 90, false);
assert(rotResult.deleted.length === 2, `rotation: 2 old files deleted (got ${rotResult.deleted.length})`);
assert(!fs.existsSync(path.join(incidentDir, `${oldDateStr}.json`)), 'old .json deleted');
assert(!fs.existsSync(path.join(incidentDir, `${oldDateStr}-override.json`)), 'old override deleted');

// Protected files still exist
assert(fs.existsSync(path.join(incidentDir, `${recentDateStr}.json`)), 'recent file preserved');
assert(fs.existsSync(path.join(incidentDir, `${today}.json`)), 'today file preserved');
assert(fs.existsSync(path.join(incidentDir, 'not-a-date.json')), 'non-date file skipped');

// Today file protection
assert(rotResult.skipped.includes(`${today}.json`), 'today file in skipped list');

// Empty dir
const emptyResult = rotateIncidentArtifacts(path.join(tmpDir, 'nonexistent'));
assert(emptyResult.deleted.length === 0, 'non-existent dir: 0 deleted');

// ─── Test 5: health.ts integration check ───
console.log('\n  --- Test 5: health.ts integration check ---');

const healthTs = fs.readFileSync(path.resolve('scripts', 'health.ts'), 'utf-8');
assert(healthTs.includes('sendSlackAlert'), 'health.ts imports sendSlackAlert');
assert(healthTs.includes('buildIncidentAlertPayload'), 'health.ts imports buildIncidentAlertPayload');
assert(healthTs.includes('buildReadinessDigestPayload'), 'health.ts imports buildReadinessDigestPayload');
assert(healthTs.includes('rotateIncidentArtifacts'), 'health.ts imports rotateIncidentArtifacts');

// Incident alert trigger
assert(healthTs.includes('incidentRecord.incident_count > 0'), 'health.ts triggers alert on incident > 0');
assert(healthTs.includes('await sendSlackAlert(process.env.OPS_SLACK_WEBHOOK, alertPayload)'), 'health.ts sends incident alert');

// Daily digest
assert(healthTs.includes('digestPayload'), 'health.ts builds digest payload');
assert(healthTs.includes('Slack digest sent'), 'health.ts logs digest sent');

// Rotation
assert(healthTs.includes('rotateIncidentArtifacts(incidentDir)'), 'health.ts calls rotation');
assert(healthTs.includes('incidentRotation.deleted.length'), 'health.ts logs rotation count');

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
})().catch((err) => { console.error(err); process.exit(1); });
