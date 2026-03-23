#!/usr/bin/env npx tsx
/**
 * CI Policy Gate — blocks PRs/releases when experiment health fails.
 * Phase 2: --strict flag (KILL decisions become blockers).
 *
 * Usage:
 *   npx tsx scripts/ci-policy.ts --pr [--strict]
 *   npx tsx scripts/ci-policy.ts --release [--strict]
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

import type {
  CIPolicyResult,
  ExperimentResult,
  HealthStatus,
} from './lib/experiment-types';
import { getDaysSinceStart, getRunningExperiments, loadRegistry, validateRegistryEntry } from './lib/registry';
import { validateMetricCoverage } from './lib/metrics';

/* ─── Watched paths (for PR mode) ─── */

const WATCHED_PATTERNS = [
  'experiments/',
  'scripts/evaluate-experiment',
  'scripts/health',
  'scripts/lib/experiment-types',
  'scripts/lib/stats',
  'scripts/lib/health',
  'scripts/lib/registry',
  'scripts/lib/metrics',
];

function getChangedFiles(): string[] {
  try {
    const base = process.env.GITHUB_BASE_REF || 'main';
    const diff = execSync(`git diff --name-only origin/${base}...HEAD`, {
      encoding: 'utf-8',
    });
    return diff.trim().split('\n').filter(Boolean);
  } catch {
    try {
      const diff = execSync('git diff --name-only HEAD~1', { encoding: 'utf-8' });
      return diff.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

function hasExperimentChanges(files: string[]): boolean {
  return files.some((f) =>
    WATCHED_PATTERNS.some((pattern) => f.startsWith(pattern)),
  );
}

/* ─── Load latest health for all running experiments ─── */

function loadLatestHealth(experimentId: string): { health: HealthStatus; decision: string } | null {
  const baseDir = path.resolve('artifacts', 'experiments', experimentId);
  if (!fs.existsSync(baseDir)) return null;

  const dateDirs = fs.readdirSync(baseDir).sort();
  if (dateDirs.length === 0) return null;

  const latestDir = dateDirs[dateDirs.length - 1];
  const resultPath = path.join(baseDir, latestDir, 'result.json');
  if (!fs.existsSync(resultPath)) return null;

  try {
    const result: ExperimentResult = JSON.parse(
      fs.readFileSync(resultPath, 'utf-8'),
    );
    return {
      health: result.health.overall,
      decision: result.decision,
    };
  } catch {
    return null;
  }
}

/* ─── Registry Schema Validation ─── */

function validateRegistry(): { blockers: string[]; warnings: string[] } {
  const blockers: string[] = [];
  const warnings: string[] = [];

  try {
    const registry = loadRegistry();

    for (const entry of registry.experiments) {
      const errors = validateRegistryEntry(entry);
      for (const err of errors) {
        blockers.push(`Registry: ${err}`);
      }
    }
  } catch (err) {
    blockers.push(`Registry load failed: ${(err as Error).message}`);
  }

  // Metric SSOT: 모든 등록 metric에 계산 로직 존재하는지 검증
  const metricErrors = validateMetricCoverage();
  for (const err of metricErrors) {
    blockers.push(`Metric SSOT: ${err}`);
  }

  return { blockers, warnings };
}

/* ─── Policy Check ─── */

function checkPolicy(mode: 'pr' | 'release', strict: boolean): CIPolicyResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  const changedFiles = mode === 'pr' ? getChangedFiles() : [];
  const expFilesChanged = hasExperimentChanges(changedFiles);

  // PR mode: only check if experiment-related files are changed
  if (mode === 'pr' && !expFilesChanged) {
    return { mode, pass: true, blockers: [], warnings: ['No experiment files changed — auto-pass'], strict };
  }

  // Phase 2: Registry schema validation (always runs when experiment files are involved)
  const registryCheck = validateRegistry();
  blockers.push(...registryCheck.blockers);
  warnings.push(...registryCheck.warnings);

  // Check all running experiments
  const running = getRunningExperiments();

  if (running.length === 0 && blockers.length === 0) {
    return { mode, pass: true, blockers: [], warnings: ['No running experiments'], strict };
  }

  for (const entry of running) {
    // ── Freeze 기간 보호: RUNNING + freeze 기간 내 + 실험 파일 변경 → 차단 ──
    if (mode === 'pr' && expFilesChanged) {
      const daysSince = getDaysSinceStart(entry);
      const freezeDays = entry.freezeDays ?? 0;
      if (daysSince < freezeDays) {
        blockers.push(
          `"${entry.id}": freeze period active (day ${daysSince}/${freezeDays}) — experiment file changes blocked`,
        );
      }
    }

    const latest = loadLatestHealth(entry.id);

    if (!latest) {
      warnings.push(`"${entry.id}": no health data found`);
      continue;
    }

    // ── KILL 가드: decision=KILL + registry.status=RUNNING → 무조건 차단 ──
    if (latest.decision === 'KILL' && entry.status === 'RUNNING') {
      blockers.push(
        `"${entry.id}": decision=KILL but status still RUNNING — 실험 종료(ENDED) 처리 필요`,
      );
      continue;
    }

    // Release gate: health FAIL → block
    if (latest.health === 'FAIL') {
      blockers.push(`"${entry.id}": health=${latest.health}, decision=${latest.decision}`);
    } else if (strict && latest.decision === 'KILL') {
      blockers.push(`"${entry.id}": decision=KILL (strict mode)`);
    } else if (latest.health === 'WARN') {
      warnings.push(`"${entry.id}": health=${latest.health}, decision=${latest.decision}`);
    }
  }

  return {
    mode,
    pass: blockers.length === 0,
    blockers,
    warnings,
    strict,
  };
}

/* ─── Main ─── */

function main(): void {
  const isPR = process.argv.includes('--pr');
  const isRelease = process.argv.includes('--release');
  const strict = process.argv.includes('--strict');

  if (!isPR && !isRelease) {
    console.error('Usage: ci-policy.ts --pr | --release [--strict]');
    process.exit(1);
  }

  const mode = isPR ? 'pr' : 'release';
  const result = checkPolicy(mode, strict);

  const modeLabel = strict ? `${mode.toUpperCase()} (STRICT)` : mode.toUpperCase();
  console.log(`\n  CI Policy Gate [${modeLabel}]`);
  console.log(`  Result: ${result.pass ? 'PASS \u2705' : 'BLOCK \u274C'}\n`);

  if (result.warnings.length > 0) {
    console.log('  Warnings:');
    for (const w of result.warnings) {
      console.log(`    \u26A0 ${w}`);
    }
  }

  if (result.blockers.length > 0) {
    console.log('  Blockers:');
    for (const b of result.blockers) {
      console.log(`    \u274C ${b}`);
    }
  }

  // GITHUB_STEP_SUMMARY output
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summary = [
      `## CI Policy Gate — ${modeLabel}`,
      '',
      `**Result**: ${result.pass ? '\u2705 PASS' : '\u274C BLOCK'}`,
      strict ? '**Mode**: Strict (KILL = blocker)' : '',
      '',
      result.blockers.length > 0
        ? `### Blockers\n${result.blockers.map((b) => `- ${b}`).join('\n')}`
        : '',
      result.warnings.length > 0
        ? `### Warnings\n${result.warnings.map((w) => `- ${w}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + '\n');
  }

  if (!result.pass) {
    process.exit(1);
  }
}

main();
