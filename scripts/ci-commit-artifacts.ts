#!/usr/bin/env npx tsx
/**
 * CI Auto-Commit — pushes experiment artifacts to `experiment-artifacts` orphan branch.
 *
 * Only runs in GitHub Actions (GITHUB_ACTIONS=true).
 * Local runs require --dry-run flag.
 *
 * Usage:
 *   npx tsx scripts/ci-commit-artifacts.ts [--dry-run]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ARTIFACTS_BRANCH = 'experiment-artifacts';

function run(cmd: string, opts?: { ignoreError?: boolean }): string {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' }).trim();
  } catch (err) {
    if (opts?.ignoreError) return '';
    throw err;
  }
}

function hasArtifacts(): boolean {
  const artifactsDir = path.resolve('artifacts');
  return fs.existsSync(artifactsDir);
}

function main(): void {
  const dryRun = process.argv.includes('--dry-run');
  const isCI = process.env.GITHUB_ACTIONS === 'true';

  if (!isCI && !dryRun) {
    console.log('  Not in GitHub Actions. Use --dry-run for local testing.');
    process.exit(0);
  }

  if (!hasArtifacts()) {
    console.log('  No artifacts/ directory found — nothing to commit.');
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const commitMsg = `chore(experiments): daily health ${today}`;

  console.log(`\n  CI Auto-Commit: ${commitMsg}`);
  console.log(`  Target branch: ${ARTIFACTS_BRANCH}`);

  if (dryRun) {
    console.log('  [DRY RUN] Would commit artifacts/ to experiment-artifacts branch.');

    // List what would be committed
    const artifactsDir = path.resolve('artifacts');
    const files = listFilesRecursive(artifactsDir);
    console.log(`  Files to commit: ${files.length}`);
    for (const f of files.slice(0, 10)) {
      console.log(`    ${path.relative(process.cwd(), f)}`);
    }
    if (files.length > 10) {
      console.log(`    ... and ${files.length - 10} more`);
    }
    return;
  }

  // Configure git for CI
  run('git config user.name "github-actions[bot]"');
  run('git config user.email "github-actions[bot]@users.noreply.github.com"');

  // Save current branch
  const currentBranch = run('git rev-parse --abbrev-ref HEAD');

  // Check if orphan branch exists on remote
  const remoteBranchExists = run(
    `git ls-remote --heads origin ${ARTIFACTS_BRANCH}`,
    { ignoreError: true },
  );

  if (remoteBranchExists) {
    // Fetch and checkout existing branch
    run(`git fetch origin ${ARTIFACTS_BRANCH}`);
    run(`git checkout ${ARTIFACTS_BRANCH}`);
  } else {
    // Create new orphan branch
    run(`git checkout --orphan ${ARTIFACTS_BRANCH}`);
    run('git rm -rf .', { ignoreError: true });
  }

  // Copy artifacts into the branch
  // First, restore the artifacts directory from the stash
  run(`git checkout ${currentBranch} -- artifacts/`);

  // Stage artifacts
  run('git add artifacts/');

  // Check if there are changes to commit
  const status = run('git diff --cached --name-only', { ignoreError: true });
  if (!status) {
    console.log('  No changes to commit.');
    run(`git checkout ${currentBranch}`);
    return;
  }

  // Commit and push
  run(`git commit -m "${commitMsg}"`);
  run(`git push origin ${ARTIFACTS_BRANCH}`);

  console.log(`  \u2705 Artifacts committed to ${ARTIFACTS_BRANCH}`);

  // Return to original branch
  run(`git checkout ${currentBranch}`);
}

function listFilesRecursive(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

main();
