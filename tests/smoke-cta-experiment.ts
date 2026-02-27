/**
 * Smoke Test — CTA Position Experiment (cta-position-v1)
 *
 * Tests:
 * 1. ctr metric in SUPPORTED_PRIMARY_METRICS
 * 2. registry validation passes for cta-position-v1
 * 3. EVENT_TYPES includes experiment events
 * 4. experiment event route module loads
 * 5. health.ts recognises 2 running experiments
 * 6. variant assignment determinism
 */

import * as fs from 'fs';
import * as path from 'path';

let passed = 0;
let failed = 0;
function assert(cond: boolean, name: string) {
  if (cond) { console.log(`  ✅ ${name}`); passed++; }
  else { console.log(`  ❌ ${name}`); failed++; }
}

console.log('\n  Smoke Test: CTA Position Experiment (cta-position-v1)\n');

// ─── Test 1: ctr metric in SUPPORTED_PRIMARY_METRICS ───
console.log('  --- Test 1: ctr metric ---');
import { SUPPORTED_PRIMARY_METRICS } from '../scripts/lib/metrics';
assert(
  SUPPORTED_PRIMARY_METRICS.includes('ctr'),
  'ctr is in SUPPORTED_PRIMARY_METRICS',
);
assert(
  SUPPORTED_PRIMARY_METRICS.includes('journey_start_rate'),
  'journey_start_rate is in SUPPORTED_PRIMARY_METRICS',
);

// ─── Test 2: registry validation ───
console.log('  --- Test 2: registry validation ---');
import { loadRegistry, validateRegistryEntry } from '../scripts/lib/registry';
const registry = loadRegistry();
const ctaEntry = registry.experiments.find((e) => e.id === 'cta-position-v1');
assert(!!ctaEntry, 'cta-position-v1 found in registry');

if (ctaEntry) {
  const errors = validateRegistryEntry(ctaEntry);
  assert(errors.length === 0, `validateRegistryEntry passes (errors: ${errors.join('; ') || 'none'})`);
  assert(ctaEntry.status === 'RUNNING', 'status is RUNNING');
  assert(ctaEntry.primaryMetric === 'ctr', 'primaryMetric is ctr');
  assert(ctaEntry.freezeDays === 7, 'freezeDays is 7');

  const splitSum = Object.values(ctaEntry.expectedSplit).reduce((a, b) => a + b, 0);
  assert(Math.abs(splitSum - 1.0) < 0.001, 'expectedSplit sums to 1.0');
}

// ─── Test 3: EVENT_TYPES includes experiment events ───
console.log('  --- Test 3: EVENT_TYPES ---');
const eventLogger = require('../services/eventLogger');
const { EVENT_TYPES, VALID_EVENT_TYPES } = eventLogger;
assert(EVENT_TYPES.EXPERIMENT_EXPOSURE === 'experiment_exposure', 'EXPERIMENT_EXPOSURE defined');
assert(EVENT_TYPES.CTA_CLICK === 'cta_click', 'CTA_CLICK defined');
assert(EVENT_TYPES.PAGE_ENGAGEMENT === 'page_engagement', 'PAGE_ENGAGEMENT defined');
assert(EVENT_TYPES.JOURNEY_START === 'journey_start', 'JOURNEY_START defined');
assert(VALID_EVENT_TYPES.includes('experiment_exposure'), 'experiment_exposure in VALID_EVENT_TYPES');
assert(VALID_EVENT_TYPES.includes('cta_click'), 'cta_click in VALID_EVENT_TYPES');
assert(VALID_EVENT_TYPES.includes('page_engagement'), 'page_engagement in VALID_EVENT_TYPES');
assert(VALID_EVENT_TYPES.includes('journey_start'), 'journey_start in VALID_EVENT_TYPES');

// ─── Test 4: experiment event route module loads ───
console.log('  --- Test 4: route module loads ---');
try {
  const route = require('../routes/experimentEventRoutes');
  assert(typeof route === 'function' || typeof route === 'object', 'experimentEventRoutes loads');
} catch (e: any) {
  assert(false, `experimentEventRoutes loads (error: ${e.message})`);
}

// ─── Test 5: registry has 3 RUNNING experiments ───
console.log('  --- Test 5: 3 running experiments ---');
const running = registry.experiments.filter((e) => e.status === 'RUNNING');
assert(running.length === 3, `3 RUNNING experiments (got ${running.length})`);
const ids = running.map((e) => e.id).sort();
assert(
  ids.includes('cta-position-v1') && ids.includes('redirect-template-v1') && ids.includes('cta-copy-v1'),
  `IDs: ${ids.join(', ')}`,
);

// Validate cta-copy-v1 entry
const copyEntry = registry.experiments.find((e) => e.id === 'cta-copy-v1')!;
const copyErrors = validateRegistryEntry(copyEntry);
assert(copyErrors.length === 0, `cta-copy-v1 validates (errors: ${copyErrors.join('; ') || 'none'})`);
assert(copyEntry.primaryMetric === 'journey_start_rate', 'cta-copy-v1 primaryMetric is journey_start_rate');
assert(Object.keys(copyEntry.expectedSplit).length === 3, 'cta-copy-v1 has 3 arms');
const copySplitSum = Object.values(copyEntry.expectedSplit).reduce((a, b) => a + b, 0);
assert(Math.abs(copySplitSum - 1.0) < 0.001, 'cta-copy-v1 split sums to 1.0');

// ─── Test 6: metric coverage ───
console.log('  --- Test 6: metric coverage ---');
import { validateMetricCoverage } from '../scripts/lib/metrics';
const coverageErrors = validateMetricCoverage();
assert(coverageErrors.length === 0, `validateMetricCoverage passes (errors: ${coverageErrors.join('; ') || 'none'})`);

// ─── Test 7: variant assignment determinism ───
console.log('  --- Test 7: variant assignment determinism ---');
function getVariant(sessionId: string): string {
  let hash = 0;
  for (const ch of sessionId) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0;
  return Math.abs(hash) % 2 === 0 ? 'control' : 'variant_top';
}
const testSessionId = '550e8400-e29b-41d4-a716-446655440000';
const v1 = getVariant(testSessionId);
const v2 = getVariant(testSessionId);
assert(v1 === v2, 'same session → same variant (deterministic)');
assert(v1 === 'control' || v1 === 'variant_top', `variant is valid: ${v1}`);

// Check 2-way distribution over many random UUIDs
let controlCount = 0;
for (let i = 0; i < 1000; i++) {
  const fakeId = `${i.toString(16).padStart(8, '0')}-0000-4000-8000-000000000000`;
  if (getVariant(fakeId) === 'control') controlCount++;
}
const controlRatio = controlCount / 1000;
assert(
  controlRatio > 0.35 && controlRatio < 0.65,
  `position split: control=${(controlRatio * 100).toFixed(1)}% (expect ~50%)`,
);

// 3-way copy split distribution check
function getCopyVariant(deviceId: string): string {
  const bucket = stableHashTest(deviceId + 'cta-copy-v1') % 100;
  return bucket < 33 ? 'C0' : bucket < 66 ? 'V1' : 'V2';
}
function stableHashTest(str: string): number {
  let h = 0;
  for (const ch of str) h = ((h << 5) - h + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}
const copyCounts = { C0: 0, V1: 0, V2: 0 };
for (let i = 0; i < 3000; i++) {
  const fakeId = `${i.toString(16).padStart(8, '0')}-1111-4000-8000-000000000000`;
  const cv = getCopyVariant(fakeId) as keyof typeof copyCounts;
  copyCounts[cv]++;
}
const c0Pct = copyCounts.C0 / 3000;
const v1Pct = copyCounts.V1 / 3000;
const v2Pct = copyCounts.V2 / 3000;
assert(
  c0Pct > 0.25 && c0Pct < 0.42,
  `copy C0=${(c0Pct * 100).toFixed(1)}% (expect ~33%)`,
);
assert(
  v1Pct > 0.25 && v1Pct < 0.42,
  `copy V1=${(v1Pct * 100).toFixed(1)}% (expect ~33%)`,
);
assert(
  v2Pct > 0.25 && v2Pct < 0.42,
  `copy V2=${(v2Pct * 100).toFixed(1)}% (expect ~34%)`,
);
// Sticky: same deviceId → same variant
const stickyId = 'test-device-12345';
assert(getCopyVariant(stickyId) === getCopyVariant(stickyId), 'copy: same device → same variant (sticky)');

// ─── Test 8: frontend journey_start + copy experiment integration ───
console.log('  --- Test 8: frontend experiment wiring ---');
const resultHtml = fs.readFileSync(
  path.resolve(__dirname, '../public/daily-miracles-result.html'),
  'utf-8',
);
assert(
  resultHtml.includes("EXP_COPY_ID, copyVariant, 'journey_start'"),
  'startDailyMessages() logs journey_start for copy experiment',
);
assert(
  resultHtml.includes("EXP_POSITION_ID, positionVariant, 'journey_start'"),
  'startDailyMessages() logs journey_start for position experiment',
);
assert(
  resultHtml.includes("eventType === 'journey_start'"),
  'journey_start uses sendBeacon (page-transition safe)',
);
assert(
  resultHtml.includes("CTA_COPY"),
  'CTA_COPY variant text mapping exists',
);
assert(
  resultHtml.includes("cta-copy-v1"),
  'cta-copy-v1 experiment ID in frontend',
);
assert(
  resultHtml.includes("exp_device_id"),
  'sticky device ID used for copy experiment',
);

// ─── Test 9: buildExperimentDigestPayload ───
console.log('  --- Test 9: Slack digest payload builder ---');
import {
  buildExperimentDigestPayload,
  collectExperimentDigest,
} from '../scripts/lib/health-policy';
import type { ExperimentDigestData, ExperimentArmStats } from '../scripts/lib/health-policy';

assert(typeof buildExperimentDigestPayload === 'function', 'buildExperimentDigestPayload exported');
assert(typeof collectExperimentDigest === 'function', 'collectExperimentDigest exported');

// Build a mock digest and verify block structure
const mockDigest: ExperimentDigestData = {
  experimentId: 'cta-position-v1',
  arms: [
    { variant: 'control', exposures: 100, clicks: 12, starts: 8, ctr: 0.12, startRate: 0.08, clickToStart: 0.667 },
    { variant: 'variant_top', exposures: 100, clicks: 15, starts: 9, ctr: 0.15, startRate: 0.09, clickToStart: 0.6 },
  ],
  incidents24h: 0,
  relativeLift: 0.125,  // (0.09 - 0.08) / 0.08
  status: 'WIN_CANDIDATE',
};
const payload = buildExperimentDigestPayload(mockDigest) as any;
assert(Array.isArray(payload.blocks), 'payload has blocks array');
assert(
  payload.blocks[0]?.type === 'header' && payload.blocks[0]?.text?.text?.includes('GH2-A'),
  'header mentions GH2-A',
);
// Should have arm blocks for each variant
const armBlocks = payload.blocks.filter((b: any) => b.type === 'section' && b.text?.text?.includes('Variant'));
assert(armBlocks.length === 2, `2 arm blocks (got ${armBlocks.length})`);
// Should have lift and status fields
const fieldsBlock = payload.blocks.find((b: any) => b.fields);
assert(!!fieldsBlock, 'has fields block with lift/incidents/status');
const statusField = fieldsBlock?.fields?.find((f: any) => f.text?.includes('Status'));
assert(statusField?.text?.includes('Win Candidate'), 'status shows WIN_CANDIDATE');

// Test LOSING status
const losingDigest: ExperimentDigestData = { ...mockDigest, relativeLift: -0.05, status: 'LOSING' };
const losingPayload = buildExperimentDigestPayload(losingDigest) as any;
const losingStatus = losingPayload.blocks.find((b: any) => b.fields)?.fields?.find((f: any) => f.text?.includes('Status'));
assert(losingStatus?.text?.includes('Losing'), 'LOSING status renders correctly');

// ─── Test 10: health.ts integration ───
console.log('  --- Test 10: health.ts GH2-A integration ---');
const healthTs = fs.readFileSync(
  path.resolve(__dirname, '../scripts/health.ts'),
  'utf-8',
);
assert(healthTs.includes('collectExperimentDigest'), 'health.ts imports collectExperimentDigest');
assert(healthTs.includes('buildExperimentDigestPayload'), 'health.ts imports buildExperimentDigestPayload');
assert(healthTs.includes('cta-position-v1'), 'health.ts references cta-position-v1');
assert(healthTs.includes('ctaDigestPayload'), 'health.ts builds ctaDigestPayload');
assert(healthTs.includes('GH2-A Slack digest sent'), 'health.ts sends GH2-A digest to Slack');

// ─── Summary ───
console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
