#!/usr/bin/env npx tsx
/**
 * Batch Health Runner — evaluates ALL running experiments from the registry.
 * Phase 2: freeze-day guard, MinRunDays check, EnhancedBatchResult.
 *
 * Usage:
 *   npx tsx scripts/health.ts [--json]
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

import type {
  BatchExperimentEntry,
  EnhancedBatchResult,
  ExperimentResult,
  FreezeStatus,
  HealthStatus,
} from './lib/experiment-types';
import { countHoldDays, getDaysSinceStart, getRunningExperiments, registryEntryToConfig, updateRegistryStatus } from './lib/registry';
import { evaluateExperiment, writeArtifacts } from './evaluate-experiment';
import {
  getPolicyMode,
  getEnforceMetrics,
  shadowCompare,
  analyzeEnforceReadiness,
  collectIncidents,
  sendSlackAlert,
  buildIncidentAlertPayload,
  buildReadinessDigestPayload,
  collectExperimentDigest,
  buildExperimentDigestPayload,
  rotateIncidentArtifacts,
  rotateHealthArtifacts,
  ENFORCE_GATE,
} from './lib/health-policy';
import type { ShadowReport, EnforceGateReport } from './lib/health-policy';

async function main(): Promise<void> {
  const jsonMode = process.argv.includes('--json');
  const autoEnd = process.argv.includes('--auto-end');
  const running = getRunningExperiments();

  if (running.length === 0) {
    console.log('No RUNNING experiments in registry.');
    return;
  }

  console.log(`\n  Batch health: ${running.length} running experiment(s)\n`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const today = new Date().toISOString().slice(0, 10);
  const policyMode = getPolicyMode();
  const entries: BatchExperimentEntry[] = [];
  const shadowReports: ShadowReport[] = [];
  const summary = { total: running.length, active: 0, frozen: 0, pass: 0, warn: 0, fail: 0 };

  let ctaDigestPayload: object | null = null;

  console.log(`  Policy mode: ${policyMode}\n`);

  try {
    for (const entry of running) {
      const daysSince = getDaysSinceStart(entry);
      const freezeDays = entry.freezeDays ?? 0;

      // Freeze-day guard: skip evaluation if within freeze window
      if (daysSince < freezeDays) {
        const freezeStatus: FreezeStatus = 'FROZEN';
        summary.frozen++;
        entries.push({
          experimentId: entry.id,
          freezeStatus,
          daysSinceStart: daysSince,
          freezeDays,
          result: null,
        });
        console.log(`  → "${entry.id}" FROZEN (day ${daysSince}/${freezeDays})`);
        continue;
      }

      // Active: evaluate
      const config = registryEntryToConfig(entry, {
        slackWebhook: process.env.OPS_SLACK_WEBHOOK,
      });

      console.log(`  → Evaluating "${entry.id}" (day ${daysSince})...`);
      const result = await evaluateExperiment(pool, config, entry.expectedSplit);

      // MinRunDays check: warn if daily rate suggests we need more days
      if (result.totalExposures > 0 && daysSince > 0) {
        const dailyRate = result.totalExposures / daysSince;
        const daysNeeded = dailyRate > 0 ? Math.ceil(config.minSamples / dailyRate) : Infinity;
        if (daysNeeded > daysSince) {
          console.log(`    ⚠ MinRunDays: need ~${daysNeeded}d at current rate (${Math.round(dailyRate)}/day)`);
        }
      }

      // Write per-experiment artifacts
      const dir = writeArtifacts(result);
      console.log(`    ${result.health.overall} | ${result.decision} | artifacts: ${dir}`);

      // Shadow compare: 기존 판정 vs 정책 판정
      const shadow = shadowCompare(
        entry.id,
        result.health.checks.map((c) => ({ name: c.name, status: c.status, value: c.value })),
        result.health.overall,
      );
      shadowReports.push(shadow);
      if (shadow.diverges) {
        console.log(`    🔍 Shadow divergence: legacy=${shadow.overallLegacy} policy=${shadow.overallPolicy}`);
        for (const d of shadow.diffs.filter((d) => d.diverges)) {
          console.log(`       ${d.metric}: ${d.legacyStatus} → ${d.policyStatus} (${d.policyReason})`);
        }
      }

      // HOLD 장기화 경고 (7일+ 연속 HOLD)
      const holdDays = countHoldDays(entry.id);
      const holdMax = entry.holdDaysMax ?? 30;
      if (result.decision === 'HOLD' && holdDays >= 7) {
        console.log(`    ⚠ HOLD ${holdDays}일 연속 (max ${holdMax}일) — 가설 수정 또는 실험 종료 검토 필요`);
      }

      // --auto-end: KILL 판정 시 registry를 ENDED로 자동 전환
      if (autoEnd && result.decision === 'KILL') {
        try {
          updateRegistryStatus(entry.id, 'ENDED', `auto-end: decision=KILL`);
        } catch (err) {
          console.log(`    ⚠ Auto-end failed: ${(err as Error).message}`);
        }
      }

      // Tally summary
      summary.active++;
      const h = result.health.overall;
      if (h === 'PASS') summary.pass++;
      else if (h === 'WARN') summary.warn++;
      else summary.fail++;

      entries.push({
        experimentId: entry.id,
        freezeStatus: 'ACTIVE',
        daysSinceStart: daysSince,
        freezeDays,
        holdDays: result.decision === 'HOLD' ? holdDays : undefined,
        holdDaysMax: holdMax,
        result,
      });
    }

    // ───── GH2-A Experiment Digest (CTA Position) ─────
    // Collect while pool is still open
    const ctaExperimentId = 'cta-position-v1';
    const hasCta = running.some((e) => e.id === ctaExperimentId);
    if (hasCta) {
      try {
        // Temporary incident record for digest — full record built later
        const tempIncident = { date: today, false_positive: 0, manual_override: 0, rollback_trigger: 0, incident_count: 0, details: [] as any[] };
        const ctaDigest = await collectExperimentDigest(pool, ctaExperimentId, tempIncident);
        ctaDigestPayload = buildExperimentDigestPayload(ctaDigest);
        console.log(`  📊 GH2-A digest: ${ctaDigest.status} (lift: ${(ctaDigest.relativeLift * 100).toFixed(1)}%)`);
      } catch (err) {
        console.warn(`  ⚠️ GH2-A digest collection failed: ${(err as Error).message}`);
      }
    }
  } finally {
    await pool.end();
  }

  // Write batch artifact
  const batchDir = path.resolve('artifacts', 'health', today);
  fs.mkdirSync(batchDir, { recursive: true });

  const batch: EnhancedBatchResult = { date: today, experiments: entries, summary };
  const batchPath = path.join(batchDir, 'batch.json');
  fs.writeFileSync(batchPath, JSON.stringify(batch, null, 2), 'utf-8');

  // Write shadow comparison artifact
  if (shadowReports.length > 0) {
    const shadowPath = path.join(batchDir, 'shadow.json');
    fs.writeFileSync(shadowPath, JSON.stringify(shadowReports, null, 2), 'utf-8');

    const divergenceCount = shadowReports.filter((r) => r.diverges).length;
    if (divergenceCount > 0) {
      console.log(`\n  ⚠ Shadow: ${divergenceCount}/${shadowReports.length} experiment(s) diverge between legacy and policy`);
    } else {
      console.log(`\n  ✅ Shadow: all ${shadowReports.length} experiment(s) agree — safe to POLICY_MODE=enforce`);
    }
  }

  // ───── Incident Collection ─────
  const incidentDir = path.resolve('artifacts', 'incidents');
  fs.mkdirSync(incidentDir, { recursive: true });

  // FP rate 산출: shadow에서 policy≠PASS & legacy=PASS 비율
  const totalDiffs = shadowReports.flatMap((r) => r.diffs);
  const fpEvents = totalDiffs.filter((d) => d.policyStatus !== 'PASS' && d.legacyStatus === 'PASS');
  const fpRate = totalDiffs.length > 0 ? fpEvents.length / totalDiffs.length : 0;
  const hasHealthFail = entries.some((e) => e.result?.health?.overall === 'FAIL');

  const incidentRecord = collectIncidents(shadowReports, fpRate, hasHealthFail, incidentDir, today);

  // Write incident artifact
  const incidentPath = path.join(incidentDir, `${today}.json`);
  fs.writeFileSync(incidentPath, JSON.stringify(incidentRecord, null, 2), 'utf-8');

  if (incidentRecord.incident_count > 0) {
    console.log(`\n  🚨 Incidents today: ${incidentRecord.incident_count} (FP:${incidentRecord.false_positive} / Override:${incidentRecord.manual_override} / Rollback:${incidentRecord.rollback_trigger})`);

    // Slack 즉시 알림: incident > 0
    const alertPayload = buildIncidentAlertPayload(incidentRecord, policyMode);
    await sendSlackAlert(process.env.OPS_SLACK_WEBHOOK, alertPayload);
  } else {
    console.log(`\n  ✅ Incidents: 0 — 무사고`);
  }

  // ───── Enforce Gate Readiness Analysis ─────
  const healthDir = path.resolve('artifacts', 'health');
  const gateReport = analyzeEnforceReadiness(healthDir);

  // Write enforce-readiness.json artifact
  const readinessPath = path.join(batchDir, 'enforce-readiness.json');
  fs.writeFileSync(readinessPath, JSON.stringify(gateReport, null, 2), 'utf-8');

  console.log('\n  ───── Enforce Gate ─────');
  console.log(`  Current mode: ${policyMode}`);
  console.log(`  Shadow days: ${gateReport.shadow.totalDays} (zero-div streak: ${gateReport.shadow.consecutiveZeroDays})`);

  if (policyMode === 'shadow') {
    // Shadow → enforce-partial gate
    if (gateReport.shadow.stage1Met) {
      console.log(`  ✅ Stage 1 gate MET — POLICY_MODE=enforce-partial 전환 가능`);
      console.log(`     POLICY_ENFORCE_METRICS=srm,contamination 부터 시작 권장`);
    } else {
      const needed = ENFORCE_GATE.stage1.minShadowDays - gateReport.shadow.totalDays;
      const zeroNeeded = ENFORCE_GATE.stage1.consecutiveZeroDays - gateReport.shadow.consecutiveZeroDays;
      if (needed > 0) console.log(`  ⏳ Shadow days 부족: ${needed}일 추가 필요`);
      if (zeroNeeded > 0) console.log(`  ⏳ Zero-divergence streak 부족: ${zeroNeeded}일 추가 필요`);
    }
  } else if (policyMode === 'enforce-partial') {
    // enforce-partial → enforce gate
    const metrics = getEnforceMetrics();
    const label = metrics === 'all' ? 'ALL' : `[${[...metrics].join(', ')}]`;
    console.log(`  Enforced metrics: ${label}`);
    console.log(`  Enforce days: ${gateReport.enforce.enforceDays} / ${ENFORCE_GATE.stage2.minEnforceDays}`);
    console.log(`  Blocking accuracy: ${(gateReport.enforce.blockingAccuracy * 100).toFixed(1)}% (target: ≥${(ENFORCE_GATE.stage2.minBlockingAccuracy * 100).toFixed(0)}%)`);
    console.log(`  Incidents: ${gateReport.enforce.incidents} (max: ${ENFORCE_GATE.stage2.maxIncidents})`);
    if (gateReport.enforce.incidents > 0) {
      const ib = gateReport.enforce.incidentBreakdown;
      console.log(`    FP:${ib.false_positive} / Override:${ib.manual_override} / Rollback:${ib.rollback_trigger}`);
    }

    if (gateReport.enforce.stage2Met) {
      console.log(`  ✅ Stage 2 gate MET — POLICY_MODE=enforce 전면 전환 가능`);
    } else {
      const daysLeft = ENFORCE_GATE.stage2.minEnforceDays - gateReport.enforce.enforceDays;
      if (daysLeft > 0) console.log(`  ⏳ Enforce days 부족: ${daysLeft}일 추가 필요`);
    }
  } else {
    // enforce (full)
    console.log(`  🔒 전면 Enforce 가동 중 — policy SSOT active`);
    console.log(`  Blocking accuracy: ${(gateReport.enforce.blockingAccuracy * 100).toFixed(1)}%`);
    console.log(`  False positives: ${gateReport.enforce.falsePositives}`);
    console.log(`  Total incidents: ${gateReport.enforce.incidents}`);
  }

  // Rollback alert
  if (gateReport.rollback.needed) {
    console.log(`\n  🚨 ROLLBACK 권고: ${gateReport.rollback.reason}`);
    console.log(`     → POLICY_MODE=shadow 즉시 복귀 필요`);
  }

  console.log('  ─────────────────────────────');

  // ───── Slack Daily Digest ─────
  const digestPayload = buildReadinessDigestPayload(gateReport, incidentRecord);
  const digestSent = await sendSlackAlert(process.env.OPS_SLACK_WEBHOOK, digestPayload);
  if (digestSent) {
    console.log('  📊 Slack digest sent.');
  }

  // GH2-A Experiment Digest (CTA Position)
  if (ctaDigestPayload) {
    const ctaSent = await sendSlackAlert(process.env.OPS_SLACK_WEBHOOK, ctaDigestPayload);
    if (ctaSent) {
      console.log('  📊 GH2-A Slack digest sent.');
    }
  }

  // ───── Artifact Rotation (90일) ─────
  const incidentRotation = rotateIncidentArtifacts(incidentDir);
  const healthRotation = rotateHealthArtifacts(healthDir);
  const totalRotated = incidentRotation.deleted.length + healthRotation.deleted.length;
  if (totalRotated > 0) {
    console.log(`\n  🗑️ Rotation: ${incidentRotation.deleted.length} incident file(s) + ${healthRotation.deleted.length} health dir(s) deleted`);
  }

  console.log(`\n  Batch summary: ${summary.active} active / ${summary.frozen} frozen`);
  console.log(`  Health: ${summary.pass} PASS / ${summary.warn} WARN / ${summary.fail} FAIL`);
  console.log(`  Written to: ${batchPath}\n`);

  if (jsonMode) {
    console.log(JSON.stringify(batch, null, 2));
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
