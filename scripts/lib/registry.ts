/**
 * Experiment Registry — SSOT Loader & Validator
 * Loads experiments/registry.json, validates, and converts to ExperimentConfig.
 */

import * as fs from 'fs';
import * as path from 'path';

import type {
  ExperimentConfig,
  ExperimentResult,
  ExperimentStatus,
  RegistryEntry,
} from './experiment-types';
import {
  SUPPORTED_PRIMARY_METRICS,
  VALID_REGISTRY_STATUSES,
} from './experiment-types';

const REGISTRY_PATH = path.resolve('experiments', 'registry.json');

interface RegistryFile {
  experiments: RegistryEntry[];
}

/** Load and validate the registry file */
export function loadRegistry(): RegistryFile {
  if (!fs.existsSync(REGISTRY_PATH)) {
    throw new Error(`Registry not found: ${REGISTRY_PATH}`);
  }

  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  const data: RegistryFile = JSON.parse(raw);

  if (!Array.isArray(data.experiments)) {
    throw new Error('Registry must contain an "experiments" array');
  }

  // Validate: no duplicate IDs + structural integrity
  const ids = new Set<string>();
  for (const entry of data.experiments) {
    if (!entry.id) throw new Error('Each experiment must have an "id"');
    if (ids.has(entry.id)) throw new Error(`Duplicate experiment ID: "${entry.id}"`);
    ids.add(entry.id);

    if (!entry.status) throw new Error(`Experiment "${entry.id}" missing status`);
    if (!entry.startDate) throw new Error(`Experiment "${entry.id}" missing startDate`);
    if (!entry.constraints) throw new Error(`Experiment "${entry.id}" missing constraints`);
  }

  return data;
}

/** Strict policy validation — returns list of violations (empty = pass). */
export function validateRegistryEntry(entry: RegistryEntry): string[] {
  const errors: string[] = [];
  const id = entry.id || '(unknown)';

  // status: RUNNING / PAUSED / ENDED 중 하나
  if (!VALID_REGISTRY_STATUSES.includes(entry.status)) {
    errors.push(`"${id}": status must be one of ${VALID_REGISTRY_STATUSES.join('/')} (got "${entry.status}")`);
  }

  // owner: 비어있으면 FAIL
  if (!entry.owner || !entry.owner.trim()) {
    errors.push(`"${id}": owner is required`);
  }

  // primaryMetric: evaluate에서 지원하는 metric만 허용
  if (!entry.primaryMetric) {
    errors.push(`"${id}": primaryMetric is required`);
  } else if (!(SUPPORTED_PRIMARY_METRICS as readonly string[]).includes(entry.primaryMetric)) {
    errors.push(`"${id}": primaryMetric "${entry.primaryMetric}" not supported (allowed: ${SUPPORTED_PRIMARY_METRICS.join(', ')})`);
  }

  // expectedSplit: 합이 정확히 1.0
  const splitValues = Object.values(entry.expectedSplit ?? {});
  if (splitValues.length < 2) {
    errors.push(`"${id}": expectedSplit must have at least 2 arms`);
  } else {
    const sum = splitValues.reduce((s, v) => s + v, 0);
    if (Math.abs(sum - 1.0) > 0.001) {
      errors.push(`"${id}": expectedSplit sums to ${sum.toFixed(4)}, must be 1.0`);
    }
  }

  // freezeDays: 7 이상
  if (typeof entry.freezeDays !== 'number' || entry.freezeDays < 7) {
    errors.push(`"${id}": freezeDays must be >= 7 (got ${entry.freezeDays})`);
  }

  return errors;
}

/** Return only experiments with status === 'RUNNING' */
export function getRunningExperiments(): RegistryEntry[] {
  const registry = loadRegistry();
  return registry.experiments.filter((e) => e.status === 'RUNNING');
}

/** Calculate days since experiment start */
export function getDaysSinceStart(entry: RegistryEntry, now?: Date): number {
  const today = now || new Date();
  const start = new Date(entry.startDate);
  return Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
}

/**
 * Count consecutive trailing HOLD days from artifact history.
 * Scans artifacts/experiments/{id}/ date folders in reverse chronological order.
 */
export function countHoldDays(experimentId: string): number {
  const baseDir = path.resolve('artifacts', 'experiments', experimentId);
  if (!fs.existsSync(baseDir)) return 0;

  const dateDirs = fs.readdirSync(baseDir).sort().reverse(); // newest first
  let holdDays = 0;

  for (const dateDir of dateDirs) {
    const resultPath = path.join(baseDir, dateDir, 'result.json');
    if (!fs.existsSync(resultPath)) continue;

    try {
      const result: ExperimentResult = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
      if (result.decision === 'HOLD') {
        holdDays++;
      } else {
        break; // streak broken
      }
    } catch {
      break;
    }
  }

  return holdDays;
}

/**
 * Registry 상태 전환 — 실험 status를 업데이트하고 registry.json에 기록.
 *
 * @param id 실험 ID
 * @param newStatus 새 status (ENDED 등)
 * @param reason 전환 사유 (로그용)
 * @throws production 환경에서는 auto 전환 차단
 */
export function updateRegistryStatus(
  id: string,
  newStatus: ExperimentStatus,
  reason?: string,
): void {
  // Production 안전 가드
  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_REGISTRY_UPDATE) {
    throw new Error(
      `Registry update blocked in production. Set FORCE_REGISTRY_UPDATE=1 to override. (${id} → ${newStatus})`,
    );
  }

  const raw = fs.readFileSync(REGISTRY_PATH, 'utf-8');
  const data: RegistryFile = JSON.parse(raw);

  const entry = data.experiments.find((e) => e.id === id);
  if (!entry) {
    throw new Error(`Experiment "${id}" not found in registry`);
  }

  const oldStatus = entry.status;
  entry.status = newStatus;

  // Atomic write: write to temp then rename
  const tmpPath = REGISTRY_PATH + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmpPath, REGISTRY_PATH);

  console.log(
    `  Registry: "${id}" ${oldStatus} → ${newStatus}${reason ? ` (${reason})` : ''}`,
  );
}

/** Convert a RegistryEntry to ExperimentConfig (for evaluateExperiment) */
export function registryEntryToConfig(
  entry: RegistryEntry,
  overrides?: { end?: string; ciMode?: boolean; jsonMode?: boolean; slackWebhook?: string },
): ExperimentConfig {
  const now = new Date();
  const end = overrides?.end || now.toISOString().slice(0, 10);

  return {
    experimentId: entry.id,
    start: entry.startDate,
    end,
    alpha: entry.constraints.alpha,
    mde: entry.constraints.mde,
    minSamples: entry.constraints.minSamples,
    biasThreshold: entry.constraints.biasThreshold,
    ciMode: overrides?.ciMode ?? false,
    jsonMode: overrides?.jsonMode ?? false,
    slackWebhook: overrides?.slackWebhook,
  };
}
