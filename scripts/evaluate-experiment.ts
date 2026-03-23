#!/usr/bin/env npx tsx
/**
 * Experiment Auto-Evaluation System
 * AIL-2026-0227-EXP-001
 *
 * Usage:
 *   # env-var mode
 *   EXPERIMENT_ID=redirect-abc START=2026-02-13 END=2026-02-27 \
 *     npx tsx scripts/evaluate-experiment.ts
 *
 *   # legacy CLI mode
 *   npx tsx scripts/evaluate-experiment.ts --range 14d --minN 30 --json
 *
 *   # CI mode
 *   npx tsx scripts/evaluate-experiment.ts --ci
 */

import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

import type {
  ArmData,
  Decision,
  ExperimentConfig,
  ExperimentHealth,
  ExperimentResult,
  HealthCheck,
  PairwiseResult,
  RedirectRow,
} from './lib/experiment-types';

import {
  twoProportionZTest,
  wilsonInterval,
} from './lib/stats';

import { computeHealth } from './lib/health';
import type { HealthInput, HealthReport } from './lib/health';

import {
  formatConsole,
  formatMarkdown,
  formatSlack,
} from './lib/format';

import { updateRegistryStatus } from './lib/registry';

/* ═══════════════════════════════════════════════════════
   1. Config Parsing
   ═══════════════════════════════════════════════════════ */

function parseConfig(): ExperimentConfig {
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const idx = args.indexOf(name);
    return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : undefined;
  };
  const hasFlag = (name: string): boolean => args.includes(name);

  // Env-var mode takes precedence
  const envStart = process.env.START;
  const envEnd = process.env.END;

  let start: string;
  let end: string;

  if (envStart && envEnd) {
    start = envStart;
    end = envEnd;
  } else {
    // Legacy --range fallback
    const range = flag('--range') || '14d';
    const days = parseInt(range.replace(/d$/i, ''), 10) || 14;
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    start = startDate.toISOString().slice(0, 10);
    end = now.toISOString().slice(0, 10);
  }

  const minNFlag = flag('--minN');

  return {
    experimentId:
      process.env.EXPERIMENT_ID || `exp-${start.replace(/-/g, '')}`,
    start,
    end,
    alpha: parseFloat(process.env.ALPHA || '0.05'),
    mde: parseFloat(process.env.MDE || '0.02'),
    minSamples: parseInt(
      process.env.MIN_SAMPLES || minNFlag || '200',
      10,
    ),
    biasThreshold: parseFloat(process.env.BIAS_THRESHOLD || '0.40'),
    ciMode: hasFlag('--ci'),
    jsonMode: hasFlag('--json'),
    slackWebhook: process.env.OPS_SLACK_WEBHOOK,
  };
}

/* ═══════════════════════════════════════════════════════
   2. Data Fetching
   ═══════════════════════════════════════════════════════ */

export async function fetchRedirectRows(
  pool: Pool,
  config: ExperimentConfig,
): Promise<RedirectRow[]> {
  const sql = `
    SELECT
      al."templateType",
      al."postId",
      al."adminId",
      p."status"   AS "postStatus",
      p."authorId"
    FROM "AdminLog" al
    JOIN "Post" p ON p."id" = al."postId"
    WHERE al."action" = 'REDIRECT'
      AND al."createdAt" >= $1::timestamptz
      AND al."createdAt" <  ($2::date + interval '1 day')
  `;

  const { rows } = await pool.query<RedirectRow>(sql, [
    config.start,
    config.end,
  ]);
  return rows;
}

/* ═══════════════════════════════════════════════════════
   3. Arm Builder
   ═══════════════════════════════════════════════════════ */

export function buildArms(rows: RedirectRow[]): ArmData[] {
  const map = new Map<string, { exposures: number; approvals: number }>();

  for (const r of rows) {
    if (!r.templateType) continue; // skip missing
    const entry = map.get(r.templateType) || { exposures: 0, approvals: 0 };
    entry.exposures++;
    if (r.postStatus === 'APPROVED') entry.approvals++;
    map.set(r.templateType, entry);
  }

  const arms: ArmData[] = [];
  for (const [name, { exposures, approvals }] of map) {
    const rate = exposures > 0 ? approvals / exposures : 0;
    arms.push({
      name,
      exposures,
      approvals,
      rate,
      ci: wilsonInterval(approvals, exposures),
    });
  }

  // Sort descending by rate (best arm first)
  arms.sort((a, b) => b.rate - a.rate);
  return arms;
}

/* ═══════════════════════════════════════════════════════
   4. Health — single contract via computeHealth(HealthInput)
   ═══════════════════════════════════════════════════════ */

/**
 * Aggregate raw RedirectRow[] → HealthInput.
 * Health 내부는 raw rows를 절대 직접 보지 않음 (단일 계약 유지).
 */
function buildHealthInput(
  arms: ArmData[],
  rows: RedirectRow[],
  config: ExperimentConfig,
  expectedSplit?: Record<string, number>,
): HealthInput {
  // arms → Record<Arm, { exposures, approvals }>
  const armsRecord: Record<string, { exposures: number; approvals: number }> = {};
  for (const a of arms) {
    armsRecord[a.name] = { exposures: a.exposures, approvals: a.approvals };
  }

  // sliceCounts: per-admin arm distribution (skip admins with < 5 actions)
  const adminMap = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!r.templateType) continue;
    if (!adminMap.has(r.adminId)) adminMap.set(r.adminId, new Map());
    const tMap = adminMap.get(r.adminId)!;
    tMap.set(r.templateType, (tMap.get(r.templateType) || 0) + 1);
  }
  const sliceCounts: Record<string, Record<string, number>> = {};
  for (const [adminId, tMap] of adminMap) {
    const total = [...tMap.values()].reduce((s, v) => s + v, 0);
    if (total < 5) continue;
    sliceCounts[`admin=${adminId}`] = Object.fromEntries(tMap);
  }

  // userArms: per-author arm exposure
  const authorArmsMap = new Map<string, Set<string>>();
  for (const r of rows) {
    if (!r.templateType) continue;
    if (!authorArmsMap.has(r.authorId)) authorArmsMap.set(r.authorId, new Set());
    authorArmsMap.get(r.authorId)!.add(r.templateType);
  }
  const userArms = [...authorArmsMap.entries()].map(([userId, armsSet]) => ({
    userId,
    arms: [...armsSet],
  }));

  // missing: rows with no templateType
  const totalEvents = rows.length;
  const missingArm = rows.filter((r) => !r.templateType).length;

  return {
    arms: armsRecord,
    expectedSplit,
    sliceCounts: Object.keys(sliceCounts).length > 0 ? sliceCounts : undefined,
    userArms: userArms.length > 0 ? userArms : undefined,
    missing: { totalEvents, missingExperimentId: 0, missingArm },
    thresholds: {
      srmFailP: 0.01,
      srmWarnP: 0.05,
      biasWarn: config.biasThreshold,
      biasFail: 0.60,
      contamWarn: 0.05,
      contamFail: 0.10,
      missingFail: 0.01,
    },
  };
}

/**
 * Bridge: HealthReport → ExperimentHealth (downstream 호환용).
 * 포맷터/아티팩트가 ExperimentHealth 타입을 기대하므로 변환.
 */
function toExperimentHealth(report: HealthReport): ExperimentHealth {
  const checks: HealthCheck[] = [];

  if (report.checks.srm) {
    const c = report.checks.srm;
    checks.push({
      name: 'SRM',
      status: c.status,
      value: c.pValue ?? 1,
      threshold: { fail: 0.01 },
      detail: c.detail ?? '',
    });
  }

  if (report.checks.bias) {
    const c = report.checks.bias;
    checks.push({
      name: 'Bias',
      status: c.status,
      value: c.worstDiff ?? 0,
      threshold: { warn: 0.40, fail: 0.60 },
      detail: c.detail ?? '',
    });
  }

  if (report.checks.contamination) {
    const c = report.checks.contamination;
    checks.push({
      name: 'Contamination',
      status: c.status,
      value: c.rate ?? 0,
      threshold: { warn: 0.05, fail: 0.10 },
      detail: c.detail ?? '',
    });
  }

  if (report.checks.missing) {
    const c = report.checks.missing;
    checks.push({
      name: 'Missing',
      status: c.status,
      value: Math.max(c.missingExperimentRate ?? 0, c.missingArmRate ?? 0),
      threshold: { fail: 0.01 },
      detail: c.detail ?? '',
    });
  }

  return { overall: report.status, checks };
}

/* ═══════════════════════════════════════════════════════
   5. Pairwise Comparisons
   ═══════════════════════════════════════════════════════ */

export function runPairwise(
  arms: ArmData[],
  alpha: number,
): PairwiseResult[] {
  if (arms.length < 2) return [];

  const best = arms[0]; // already sorted desc by rate
  const results: PairwiseResult[] = [];

  for (let i = 1; i < arms.length; i++) {
    const other = arms[i];
    const { z, pValue } = twoProportionZTest(
      best.approvals,
      best.exposures,
      other.approvals,
      other.exposures,
    );
    const lift = other.rate > 0 ? (best.rate - other.rate) / other.rate : 0;

    results.push({
      armA: best.name,
      armB: other.name,
      z,
      pValue,
      lift,
      significant: pValue < alpha,
    });
  }

  return results;
}

/* ═══════════════════════════════════════════════════════
   6. Decision Engine
   ═══════════════════════════════════════════════════════ */

export function makeDecision(
  arms: ArmData[],
  pairwise: PairwiseResult[],
  health: ExperimentHealth,
  config: ExperimentConfig,
  totalExposures: number,
): { decision: Decision; reason: string } {
  // 1. Not enough data
  if (totalExposures < config.minSamples) {
    return {
      decision: 'EXTEND',
      reason: `Insufficient samples: ${totalExposures} < ${config.minSamples} minimum`,
    };
  }

  // 2. PROMOTE 금지 — Health FAIL 시 무조건 HOLD (1차 안전장치)
  if (health.overall === 'FAIL') {
    const failedChecks = health.checks
      .filter((c) => c.status === 'FAIL')
      .map((c) => c.name)
      .join(', ');
    return {
      decision: 'HOLD',
      reason: `Health FAIL → PROMOTE blocked: ${failedChecks}. Fix integrity issues first.`,
    };
  }

  // 3. PROMOTE — best arm beats ALL others significantly with lift >= MDE
  if (arms.length >= 2 && pairwise.length > 0) {
    const allSignificant = pairwise.every((p) => p.significant);
    const allAboveMDE = pairwise.every((p) => p.lift >= config.mde);

    if (allSignificant && allAboveMDE) {
      return {
        decision: 'PROMOTE',
        reason: `"${arms[0].name}" beats all arms (p<${config.alpha}, lift\u2265${(config.mde * 100).toFixed(0)}%)`,
      };
    }
  }

  // 4. KILL — worst arm is significantly worse with large negative lift
  if (arms.length >= 2) {
    const worstArm = arms[arms.length - 1];
    // Check if best vs worst shows significant negative performance for worst
    const worstPair = pairwise.find((p) => p.armB === worstArm.name);
    if (
      worstPair &&
      worstPair.significant &&
      worstPair.lift >= config.mde
    ) {
      return {
        decision: 'KILL',
        reason: `"${worstArm.name}" is significantly worse (lift=${(worstPair.lift * 100).toFixed(1)}%, p=${worstPair.pValue.toFixed(4)})`,
      };
    }
  }

  // 5. Default
  return {
    decision: 'HOLD',
    reason: 'No significant winner yet. Continue collecting data.',
  };
}

/* ═══════════════════════════════════════════════════════
   7. Artifact Output
   ═══════════════════════════════════════════════════════ */

export function writeArtifacts(result: ExperimentResult): string {
  const today = new Date().toISOString().slice(0, 10);
  const dir = path.resolve(
    'artifacts',
    'experiments',
    result.experimentId,
    today,
  );
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = path.join(dir, 'result.json');
  const mdPath = path.join(dir, 'result.md');

  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
  fs.writeFileSync(mdPath, formatMarkdown(result), 'utf-8');

  return dir;
}

/* ═══════════════════════════════════════════════════════
   8. Slack Notification
   ═══════════════════════════════════════════════════════ */

export function sendSlack(
  webhookUrl: string,
  payload: object,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const url = new URL(webhookUrl);
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Slack returned ${res.statusCode}`));
        }
      },
    );

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/* ═══════════════════════════════════════════════════════
   9. Exported Entry Point (for batch runners)
   ═══════════════════════════════════════════════════════ */

export async function evaluateExperiment(
  pool: Pool,
  config: ExperimentConfig,
  expectedSplit?: Record<string, number>,
): Promise<ExperimentResult> {
  const rows = await fetchRedirectRows(pool, config);
  const totalExposures = rows.length;
  const arms = buildArms(rows);

  if (arms.length === 0 && totalExposures === 0) {
    return {
      experimentId: config.experimentId,
      dateRange: { start: config.start, end: config.end },
      config,
      arms: [],
      pairwise: [],
      health: { overall: 'PASS', checks: [] },
      decision: 'EXTEND',
      decisionReason: 'No data found in range. Extend experiment.',
      totalExposures: 0,
      timestamp: new Date().toISOString(),
    };
  }

  const health = toExperimentHealth(computeHealth(buildHealthInput(arms, rows, config, expectedSplit)));
  const pairwise = runPairwise(arms, config.alpha);
  const { decision, reason } = makeDecision(arms, pairwise, health, config, totalExposures);

  return {
    experimentId: config.experimentId,
    dateRange: { start: config.start, end: config.end },
    config,
    arms,
    pairwise,
    health,
    decision,
    decisionReason: reason,
    totalExposures,
    timestamp: new Date().toISOString(),
  };
}

/* ═══════════════════════════════════════════════════════
   10. Main (CLI entry point)
   ═══════════════════════════════════════════════════════ */

async function main(): Promise<void> {
  const config = parseConfig();

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log(
      `\n  Evaluating experiment "${config.experimentId}"`,
    );
    console.log(
      `  Range: ${config.start} \u2192 ${config.end}\n`,
    );

    // Fetch data
    const rows = await fetchRedirectRows(pool, config);
    const totalExposures = rows.length;

    // Build arms
    const arms = buildArms(rows);

    if (arms.length === 0 && totalExposures === 0) {
      console.log('  No REDIRECT data found in the given range.');
      const emptyResult: ExperimentResult = {
        experimentId: config.experimentId,
        dateRange: { start: config.start, end: config.end },
        config,
        arms: [],
        pairwise: [],
        health: { overall: 'PASS', checks: [] },
        decision: 'EXTEND',
        decisionReason: 'No data found in range. Extend experiment.',
        totalExposures: 0,
        timestamp: new Date().toISOString(),
      };

      if (config.jsonMode) {
        console.log(JSON.stringify(emptyResult, null, 2));
      }

      const dir = writeArtifacts(emptyResult);
      console.log(`  Artifacts: ${dir}`);
      return;
    }

    // Health — single path via computeHealth
    const health = toExperimentHealth(computeHealth(buildHealthInput(arms, rows, config)));

    // Pairwise tests
    const pairwise = runPairwise(arms, config.alpha);

    // Decision
    const { decision, reason } = makeDecision(
      arms,
      pairwise,
      health,
      config,
      totalExposures,
    );

    // Build result
    const result: ExperimentResult = {
      experimentId: config.experimentId,
      dateRange: { start: config.start, end: config.end },
      config,
      arms,
      pairwise,
      health,
      decision,
      decisionReason: reason,
      totalExposures,
      timestamp: new Date().toISOString(),
    };

    // Output
    if (config.jsonMode) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(formatConsole(result));
    }

    const dir = writeArtifacts(result);
    console.log(`\n  Artifacts written to: ${dir}`);

    // Slack — PROMOTE or KILL only
    if (
      config.slackWebhook &&
      (decision === 'PROMOTE' || decision === 'KILL')
    ) {
      try {
        await sendSlack(config.slackWebhook, formatSlack(result));
        console.log('  Slack notification sent.');
      } catch (err) {
        console.error(
          '  Slack notification failed:',
          (err as Error).message,
        );
      }
    }

    // CI exit code
    if (config.ciMode) {
      if (health.overall === 'FAIL' || decision === 'KILL') {
        process.exit(1);
      }
    }

    // --auto-end: KILL 판정 시 registry를 ENDED로 자동 전환
    if (process.argv.includes('--auto-end') && decision === 'KILL') {
      try {
        updateRegistryStatus(
          config.experimentId,
          'ENDED',
          `auto-end: decision=KILL (${reason})`,
        );
      } catch (err) {
        console.error('  Auto-end failed:', (err as Error).message);
      }
    }
  } finally {
    await pool.end();
  }
}

// Auto-run guard: only execute main() when this file is run directly
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]).includes('evaluate-experiment');

if (isDirectRun) {
  main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}
