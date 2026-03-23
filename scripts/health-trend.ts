/**
 * Health Trend Analyzer — 7-day sliding window anomaly detection.
 * Growth Engine 1.2: per-metric policy, step change, absolute cap.
 *
 * Data source: artifacts/experiments/{id}/{date}/result.json
 *
 * Alerts:
 *   SPIKE              — current value > 2x mean
 *   THRESHOLD_BREACH   — current value outside [mean-Nσ, mean+Nσ]
 *   CONSECUTIVE_INCREASE — last 3 values monotonically increasing
 *   EXPOSURE_DROP      — current exposures < mean × 0.5
 *   STEP_CHANGE        — |today - yesterday| > 2σ
 *   ABSOLUTE_CAP       — value exceeds hard operational limit
 *
 * Usage:
 *   npx tsx scripts/health-trend.ts [--days=7]
 */

import * as fs from 'fs';
import * as path from 'path';

import type {
  Decision,
  ExperimentResult,
  HealthStatus,
  TrendAlert,
  TrendAnalysis,
  TrendPoint,
} from './lib/experiment-types';
import { getRunningExperiments } from './lib/registry';
import { CHECK_NAME_TO_METRIC, HEALTH_POLICY, evaluateMetric } from './lib/health-policy';

/* ─── Helpers ─── */

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function stddev(arr: number[], avg: number): number {
  if (arr.length < 2) return 0;
  const variance = arr.reduce((s, v) => s + (v - avg) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function worstHealth(a: HealthStatus, b: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { PASS: 0, WARN: 1, FAIL: 2 };
  return rank[a] >= rank[b] ? a : b;
}

function pctFmt(v: number): string {
  return v < 0.01 ? v.toFixed(4) : (v * 100).toFixed(2) + '%';
}

/* ─── Load historical results ─── */

function loadResultHistory(experimentId: string, days: number): TrendPoint[] {
  const baseDir = path.resolve('artifacts', 'experiments', experimentId);
  if (!fs.existsSync(baseDir)) return [];

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const dateDirs = fs.readdirSync(baseDir)
    .filter((d) => d >= cutoffStr)
    .sort();

  const points: TrendPoint[] = [];

  for (const dateDir of dateDirs) {
    const resultPath = path.join(baseDir, dateDir, 'result.json');
    if (!fs.existsSync(resultPath)) continue;

    try {
      const raw = fs.readFileSync(resultPath, 'utf-8');
      const result: ExperimentResult = JSON.parse(raw);

      const armRates: Record<string, number> = {};
      for (const arm of result.arms) {
        armRates[arm.name] = arm.rate;
      }

      // Extract health metrics from check values
      const healthMetrics: Record<string, number> = {};
      for (const check of result.health.checks) {
        const metricKey = CHECK_NAME_TO_METRIC[check.name];
        if (metricKey != null) {
          healthMetrics[metricKey] = check.value;
        }
      }

      points.push({
        date: dateDir,
        totalExposures: result.totalExposures,
        healthOverall: result.health.overall,
        decision: result.decision,
        armRates,
        healthMetrics,
      });
    } catch {
      // Skip corrupted files
    }
  }

  return points;
}

/* ─── Trend Analysis ─── */

export function analyzeTrend(experimentId: string, days: number = 7): TrendAnalysis {
  const points = loadResultHistory(experimentId, days);
  const alerts: TrendAlert[] = [];

  const exposures = points.map((p) => p.totalExposures);
  const avgExposures = mean(exposures);
  const sdExposures = stddev(exposures, avgExposures);
  const upper = avgExposures + 3 * sdExposures;
  const lower = Math.max(0, avgExposures - 3 * sdExposures);

  if (points.length >= 2) {
    const latest = points[points.length - 1];

    // Spike: current > 2 × mean
    if (latest.totalExposures > 2 * avgExposures && avgExposures > 0) {
      alerts.push({
        type: 'SPIKE',
        metric: 'totalExposures',
        detail: `${latest.totalExposures} > 2×mean (${Math.round(avgExposures)})`,
        severity: 'WARN',
      });
    }

    // Threshold breach: outside [mean − 3σ, mean + 3σ]
    if (sdExposures > 0 && (latest.totalExposures > upper || latest.totalExposures < lower)) {
      alerts.push({
        type: 'THRESHOLD_BREACH',
        metric: 'totalExposures',
        detail: `${latest.totalExposures} outside [${Math.round(lower)}, ${Math.round(upper)}]`,
        severity: 'FAIL',
      });
    }

    // Exposure drop: current < mean × 0.5
    if (avgExposures > 0 && latest.totalExposures < avgExposures * 0.5) {
      alerts.push({
        type: 'EXPOSURE_DROP',
        metric: 'totalExposures',
        detail: `${latest.totalExposures} < 50% of mean (${Math.round(avgExposures)})`,
        severity: 'WARN',
      });
    }

    // Arm rate analysis
    const allArmNames = new Set<string>();
    for (const pt of points) {
      for (const name of Object.keys(pt.armRates)) {
        allArmNames.add(name);
      }
    }

    for (const armName of allArmNames) {
      const rates = points.map((p) => p.armRates[armName] ?? 0);
      const avgRate = mean(rates);
      const sdRate = stddev(rates, avgRate);

      // Spike on arm rate
      const latestRate = latest.armRates[armName] ?? 0;
      if (avgRate > 0 && latestRate > 2 * avgRate) {
        alerts.push({
          type: 'SPIKE',
          metric: `arm:${armName}:rate`,
          detail: `${(latestRate * 100).toFixed(1)}% > 2×mean (${(avgRate * 100).toFixed(1)}%)`,
          severity: 'WARN',
        });
      }

      // 3σ breach on arm rate
      if (sdRate > 0) {
        const armUpper = avgRate + 3 * sdRate;
        const armLower = Math.max(0, avgRate - 3 * sdRate);
        if (latestRate > armUpper || latestRate < armLower) {
          alerts.push({
            type: 'THRESHOLD_BREACH',
            metric: `arm:${armName}:rate`,
            detail: `${(latestRate * 100).toFixed(1)}% outside [${(armLower * 100).toFixed(1)}%, ${(armUpper * 100).toFixed(1)}%]`,
            severity: 'FAIL',
          });
        }
      }

      // 3-day consecutive increase
      if (rates.length >= 3) {
        const last3 = rates.slice(-3);
        if (last3[0] < last3[1] && last3[1] < last3[2]) {
          alerts.push({
            type: 'CONSECUTIVE_INCREASE',
            metric: `arm:${armName}:rate`,
            detail: `3-day upward trend: ${last3.map((r) => (r * 100).toFixed(1) + '%').join(' → ')}`,
            severity: 'WARN',
          });
        }
      }
    }

    // ─── Per-metric health analysis (Growth Engine 1.2) ───

    const allMetricNames = new Set<string>();
    for (const pt of points) {
      if (pt.healthMetrics) {
        for (const name of Object.keys(pt.healthMetrics)) {
          allMetricNames.add(name);
        }
      }
    }

    for (const metricName of allMetricNames) {
      const values = points
        .map((p) => p.healthMetrics?.[metricName])
        .filter((v): v is number => v != null);

      if (values.length < 2) continue;

      const latestVal = values[values.length - 1];
      const avgVal = mean(values);
      const sdVal = stddev(values, avgVal);
      const policy = HEALTH_POLICY[metricName];

      // Policy-based evaluation (sigma/multiplier/fixed + absolute cap)
      const evalResult = evaluateMetric(metricName, latestVal, avgVal, sdVal);
      if (evalResult.status !== 'PASS') {
        const alertType = evalResult.reason?.includes('absolute cap') ? 'ABSOLUTE_CAP' as const : 'THRESHOLD_BREACH' as const;
        alerts.push({
          type: alertType,
          metric: `health:${metricName}`,
          detail: evalResult.reason ?? `${metricName} ${evalResult.status}`,
          severity: evalResult.status,
        });
      }

      // Spike: current > 2× mean (higher-is-worse metrics only)
      if (!policy?.lowerIsWorse && avgVal > 0 && latestVal > 2 * avgVal) {
        alerts.push({
          type: 'SPIKE',
          metric: `health:${metricName}`,
          detail: `${pctFmt(latestVal)} > 2×mean (${pctFmt(avgVal)})`,
          severity: 'WARN',
        });
      }

      // Step change: |today - yesterday| > 2σ
      if (values.length >= 2 && sdVal > 0) {
        const prev = values[values.length - 2];
        const delta = Math.abs(latestVal - prev);
        if (delta > 2 * sdVal) {
          alerts.push({
            type: 'STEP_CHANGE',
            metric: `health:${metricName}`,
            detail: `Δ=${pctFmt(delta)} > 2σ (${pctFmt(2 * sdVal)}), ${pctFmt(prev)} → ${pctFmt(latestVal)}`,
            severity: delta > 3 * sdVal ? 'FAIL' : 'WARN',
          });
        }
      }

      // 3-day consecutive increase (higher-is-worse)
      if (!policy?.lowerIsWorse && values.length >= 3) {
        const last3 = values.slice(-3);
        if (last3[0] < last3[1] && last3[1] < last3[2]) {
          alerts.push({
            type: 'CONSECUTIVE_INCREASE',
            metric: `health:${metricName}`,
            detail: `3-day upward: ${last3.map(pctFmt).join(' → ')}`,
            severity: 'WARN',
          });
        }
      }
    }
  }

  return {
    experimentId,
    baselineDays: days,
    points,
    mean: avgExposures,
    stddev: sdExposures,
    upperBound: upper,
    lowerBound: lower,
    alerts,
  };
}

/* ─── Main ─── */

function main(): void {
  const daysArg = process.argv.find((a) => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1], 10) : 7;

  const running = getRunningExperiments();
  if (running.length === 0) {
    console.log('No RUNNING experiments.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const trendDir = path.resolve('artifacts', 'health', today);
  fs.mkdirSync(trendDir, { recursive: true });

  const allTrends: TrendAnalysis[] = [];

  for (const entry of running) {
    console.log(`  Trend analysis: "${entry.id}" (${days}d window)`);
    const trend = analyzeTrend(entry.id, days);
    allTrends.push(trend);

    if (trend.alerts.length > 0) {
      for (const a of trend.alerts) {
        console.log(`    ⚠ ${a.type} [${a.severity}] ${a.metric}: ${a.detail}`);
      }
    } else {
      console.log('    ✅ No anomalies');
    }
  }

  const trendPath = path.join(trendDir, 'trend.json');
  fs.writeFileSync(trendPath, JSON.stringify(allTrends, null, 2), 'utf-8');
  console.log(`\n  Trend written to: ${trendPath}`);
}

// Auto-run guard
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]).includes('health-trend');

if (isDirectRun) {
  main();
}
