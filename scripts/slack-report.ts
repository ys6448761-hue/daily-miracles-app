#!/usr/bin/env npx tsx
/**
 * Daily Digest — Slack report for all running experiments.
 * Phase 2: 2-message payloads, GITHUB_STEP_SUMMARY, artifact URLs.
 *
 * Usage:
 *   npx tsx scripts/slack-report.ts [--dry-run]
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

import type {
  BatchExperimentEntry,
  DailyDigest,
  Decision,
  DigestEntry,
  EnhancedBatchResult,
  ExperimentResult,
  FreezeStatus,
  HealthStatus,
  SlackDigestPayloads,
  TrendAlert,
} from './lib/experiment-types';
import { countHoldDays, getDaysSinceStart, getRunningExperiments } from './lib/registry';
import { analyzeTrend } from './health-trend';
import { formatDigestMarkdown, sparkline } from './lib/format';

/* ─── Helpers ─── */

const DECISION_EMOJI: Record<Decision, string> = {
  PROMOTE: '\u{1F3C6}',
  HOLD: '\u23F8\uFE0F',
  KILL: '\u{1F480}',
  EXTEND: '\u23F3',
};

const HEALTH_EMOJI: Record<HealthStatus, string> = {
  PASS: '\u{1F7E2}',
  WARN: '\u{1F7E1}',
  FAIL: '\u{1F534}',
};

function worstHealth(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { PASS: 0, WARN: 1, FAIL: 2 };
  return rank[a] >= rank[b] ? a : b;
}

/* ─── Artifact URL builder ─── */

function buildArtifactUrl(): string | undefined {
  const server = process.env.GITHUB_SERVER_URL;
  const repo = process.env.GITHUB_REPOSITORY;
  const runId = process.env.GITHUB_RUN_ID;
  if (server && repo && runId) {
    return `${server}/${repo}/actions/runs/${runId}`;
  }
  return undefined;
}

/* ─── Load latest result for an experiment ─── */

function loadLatestResult(experimentId: string): ExperimentResult | null {
  const baseDir = path.resolve('artifacts', 'experiments', experimentId);
  if (!fs.existsSync(baseDir)) return null;

  const dateDirs = fs.readdirSync(baseDir).sort();
  if (dateDirs.length === 0) return null;

  const latestDir = dateDirs[dateDirs.length - 1];
  const resultPath = path.join(baseDir, latestDir, 'result.json');
  if (!fs.existsSync(resultPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
  } catch {
    return null;
  }
}

/* ─── Load batch result (for digest markdown) ─── */

function loadLatestBatch(): EnhancedBatchResult | null {
  const today = new Date().toISOString().slice(0, 10);
  const batchPath = path.resolve('artifacts', 'health', today, 'batch.json');
  if (!fs.existsSync(batchPath)) return null;

  try {
    return JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
  } catch {
    return null;
  }
}

/* ─── Build Digest ─── */

function buildDigest(): DailyDigest {
  const today = new Date().toISOString().slice(0, 10);
  const running = getRunningExperiments();
  const entries: DigestEntry[] = [];
  let overallHealth: HealthStatus = 'PASS';

  for (const entry of running) {
    const result = loadLatestResult(entry.id);
    const trend = analyzeTrend(entry.id, 7);

    const daysSinceStart = getDaysSinceStart(entry);
    const latestDecision: Decision = result?.decision ?? 'EXTEND';
    const latestHealth: HealthStatus = result?.health.overall ?? 'PASS';
    const topArm = result?.arms[0]?.name ?? 'N/A';

    // HOLD 장기화 경고: 7일+ 연속 HOLD
    const holdDays = latestDecision === 'HOLD' ? countHoldDays(entry.id) : 0;
    const holdMax = entry.holdDaysMax ?? 30;
    if (holdDays >= 7) {
      const holdAlert: TrendAlert = {
        type: 'THRESHOLD_BREACH',
        metric: 'holdDays',
        detail: `HOLD ${holdDays}일 연속 (max ${holdMax}일) → 가설 수정 또는 실험 종료 검토 필요`,
        severity: holdDays >= holdMax ? 'FAIL' : 'WARN',
      };
      trend.alerts.push(holdAlert);
    }

    overallHealth = worstHealth(overallHealth, latestHealth);

    entries.push({
      experimentId: entry.id,
      owner: entry.owner,
      daysSinceStart,
      latestDecision,
      latestHealth,
      topArm,
      trendAlerts: trend.alerts,
    });
  }

  return {
    date: today,
    runningCount: running.length,
    entries,
    overallHealth,
  };
}

/* ─── Slack Block Kit — Main summary ─── */

function buildSlackMainPayload(digest: DailyDigest, artifactUrl?: string): object {
  const blocks: object[] = [];

  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `${HEALTH_EMOJI[digest.overallHealth]} Daily Experiment Digest — ${digest.date}`,
      emoji: true,
    },
  });

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${digest.runningCount}* running experiment(s) | Overall: *${digest.overallHealth}*`,
    },
  });

  blocks.push({ type: 'divider' });

  for (const e of digest.entries) {
    const emoji = DECISION_EMOJI[e.latestDecision];
    const health = HEALTH_EMOJI[e.latestHealth];
    const alertCount = e.trendAlerts.length;
    const alertText = alertCount > 0 ? ` | \u26A0\uFE0F ${alertCount} alert(s)` : '';
    const holdAlert = e.trendAlerts.find((a) => a.metric === 'holdDays');
    const holdText = holdAlert ? `\n\u26A0\uFE0F *${holdAlert.detail}*` : '';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `${emoji} *${e.experimentId}*  (day ${e.daysSinceStart})`,
          `${health} Health: *${e.latestHealth}* | Top: \`${e.topArm}\` | Owner: ${e.owner}${alertText}`,
        ].join('\n') + holdText,
      },
    });
  }

  // Footer with artifact link
  blocks.push({ type: 'divider' });
  const footerText = artifactUrl
    ? `Growth Engine 2.0 | <${artifactUrl}|View Run>`
    : 'Growth Engine 2.0';
  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: footerText }],
  });

  return { blocks };
}

/* ─── Slack Block Kit — Details (thread) ─── */

function buildSlackDetailsPayload(digest: DailyDigest, artifactUrl?: string): object {
  const blocks: object[] = [];

  blocks.push({
    type: 'header',
    text: {
      type: 'plain_text',
      text: `Experiment Details — ${digest.date}`,
      emoji: true,
    },
  });

  for (const e of digest.entries) {
    const emoji = DECISION_EMOJI[e.latestDecision];
    const health = HEALTH_EMOJI[e.latestHealth];

    // Per-experiment detail block
    const detailLines = [
      `${emoji} *${e.experimentId}* — day ${e.daysSinceStart}`,
      `Health: ${health} *${e.latestHealth}* | Decision: *${e.latestDecision}*`,
      `Top arm: \`${e.topArm}\` | Owner: ${e.owner}`,
    ];

    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: detailLines.join('\n') },
    });

    // Trend alerts
    if (e.trendAlerts.length > 0) {
      const alertLines = e.trendAlerts
        .map((a) => `\u2022 \`${a.type}\` [${a.severity}] ${a.metric}: ${a.detail}`)
        .join('\n');
      blocks.push({
        type: 'context',
        elements: [{ type: 'mrkdwn', text: alertLines }],
      });
    }

    blocks.push({ type: 'divider' });
  }

  return { blocks };
}

/* ─── Build 2-message payloads ─── */

export function buildSlackThreadPayloads(
  digest: DailyDigest,
  artifactUrl?: string,
): SlackDigestPayloads {
  return {
    main: buildSlackMainPayload(digest, artifactUrl),
    details: buildSlackDetailsPayload(digest, artifactUrl),
  };
}

/* ─── Send to Slack ─── */

function postSlack(webhookUrl: string, payload: object): Promise<void> {
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

/* ─── Write GITHUB_STEP_SUMMARY ─── */

function writeStepSummary(batch: EnhancedBatchResult | null, artifactUrl?: string): void {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;

  if (batch) {
    const running = getRunningExperiments();
    const expectedSplits: Record<string, Record<string, number>> = {};
    for (const entry of running) {
      if (entry.expectedSplit) {
        expectedSplits[entry.id] = entry.expectedSplit;
      }
    }

    const md = formatDigestMarkdown(batch, {
      artifactUrl,
      includeSparklines: true,
      expectedSplits,
    });
    fs.appendFileSync(summaryPath, md + '\n');
  } else {
    fs.appendFileSync(summaryPath, '## Experiment Daily Digest\n\nNo batch data available.\n');
  }
}

/* ─── Main ─── */

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');
  const digest = buildDigest();
  const artifactUrl = buildArtifactUrl();
  const payloads = buildSlackThreadPayloads(digest, artifactUrl);

  console.log(`\n  Daily Digest: ${digest.date}`);
  console.log(`  Running: ${digest.runningCount} | Overall: ${digest.overallHealth}\n`);

  for (const e of digest.entries) {
    console.log(`  ${DECISION_EMOJI[e.latestDecision]} ${e.experimentId} (day ${e.daysSinceStart}) — ${e.latestHealth} — top: ${e.topArm}`);
    if (e.trendAlerts.length > 0) {
      for (const a of e.trendAlerts) {
        console.log(`    \u26A0 ${a.type}: ${a.detail}`);
      }
    }
  }

  // Write GITHUB_STEP_SUMMARY (digest markdown)
  const batch = loadLatestBatch();
  writeStepSummary(batch, artifactUrl);

  if (dryRun) {
    console.log('\n  [DRY RUN] Slack main payload:');
    console.log(JSON.stringify(payloads.main, null, 2));
    console.log('\n  [DRY RUN] Slack details payload:');
    console.log(JSON.stringify(payloads.details, null, 2));
    return;
  }

  const webhook = process.env.OPS_SLACK_WEBHOOK;
  if (!webhook) {
    console.log('\n  OPS_SLACK_WEBHOOK not set — skipping Slack send.');
    return;
  }

  try {
    // Send 2 messages sequentially (webhook doesn't support threads)
    await postSlack(webhook, payloads.main);
    console.log('\n  \u2705 Slack summary sent.');
    await postSlack(webhook, payloads.details);
    console.log('  \u2705 Slack details sent.');
  } catch (err) {
    console.error('\n  \u274C Slack send failed:', (err as Error).message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
