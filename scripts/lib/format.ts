/**
 * Experiment Auto-Evaluation System — Output Formatters
 * MD report, Slack block-kit, console summary, digest markdown.
 */

import type {
  EnhancedBatchResult,
  ExperimentResult,
  FormatDigestOptions,
} from './experiment-types';

/* ─── Helpers ─── */

const DECISION_EMOJI: Record<string, string> = {
  PROMOTE: '\u{1F3C6}',  // 🏆
  HOLD: '\u23F8\uFE0F',  // ⏸️
  KILL: '\u{1F480}',      // 💀
  EXTEND: '\u23F3',       // ⏳
};

function pct(v: number, digits = 1): string {
  return (v * 100).toFixed(digits) + '%';
}

function pad(s: string, len: number): string {
  return s.padEnd(len);
}

function statusIcon(status: string): string {
  if (status === 'PASS') return '\u2705';  // ✅
  if (status === 'WARN') return '\u26A0\uFE0F'; // ⚠️
  return '\u274C'; // ❌
}

/* ═══════════════════════════════════════════════════════
   Markdown Report
   ═══════════════════════════════════════════════════════ */

export function formatMarkdown(r: ExperimentResult): string {
  const lines: string[] = [];

  lines.push(`# Experiment Report: ${r.experimentId}`);
  lines.push('');
  lines.push(`**Period**: ${r.dateRange.start} \u2192 ${r.dateRange.end}`);
  lines.push(`**Total Exposures**: ${r.totalExposures}`);
  lines.push(
    `**Decision**: ${DECISION_EMOJI[r.decision] || ''} **${r.decision}**`,
  );
  lines.push(`**Reason**: ${r.decisionReason}`);
  lines.push('');

  // Arms table
  lines.push('## Arms');
  lines.push('');
  lines.push('| Arm | Exposures | Approvals | Rate | 95% CI |');
  lines.push('|-----|-----------|-----------|------|--------|');
  for (const a of r.arms) {
    lines.push(
      `| ${a.name} | ${a.exposures} | ${a.approvals} | ${pct(a.rate)} | [${pct(a.ci[0])}, ${pct(a.ci[1])}] |`,
    );
  }
  lines.push('');

  // Pairwise
  if (r.pairwise.length > 0) {
    lines.push('## Pairwise Tests');
    lines.push('');
    lines.push('| Comparison | z | p-value | Lift | Sig? |');
    lines.push('|------------|---|---------|------|------|');
    for (const p of r.pairwise) {
      lines.push(
        `| ${p.armA} vs ${p.armB} | ${p.z.toFixed(3)} | ${p.pValue.toFixed(4)} | ${pct(p.lift)} | ${p.significant ? '\u2705' : '\u2014'} |`,
      );
    }
    lines.push('');
  }

  // Health
  lines.push('## Health Checks');
  lines.push('');
  lines.push(
    `**Overall**: ${statusIcon(r.health.overall)} ${r.health.overall}`,
  );
  lines.push('');
  for (const c of r.health.checks) {
    lines.push(`- ${statusIcon(c.status)} **${c.name}**: ${c.detail}`);
  }
  lines.push('');

  // Config
  lines.push('## Config');
  lines.push('');
  lines.push(`- \u03B1 = ${r.config.alpha}`);
  lines.push(`- MDE = ${pct(r.config.mde)}`);
  lines.push(`- Min Samples = ${r.config.minSamples}`);
  lines.push(`- Bias Threshold = ${pct(r.config.biasThreshold)}`);
  lines.push('');
  lines.push('---');
  lines.push(`_Generated: ${r.timestamp}_`);

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════
   Slack Block-Kit Payload
   ═══════════════════════════════════════════════════════ */

export function formatSlack(r: ExperimentResult): object {
  const emoji = DECISION_EMOJI[r.decision] || '';
  const armSummary = r.arms
    .map((a) => `\u2022 *${a.name}*: ${pct(a.rate)} (n=${a.exposures})`)
    .join('\n');

  return {
    text: `${emoji} Experiment *${r.experimentId}*: ${r.decision}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} ${r.experimentId}: ${r.decision}`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*Reason*: ${r.decisionReason}`,
            `*Period*: ${r.dateRange.start} \u2192 ${r.dateRange.end}`,
            `*Health*: ${statusIcon(r.health.overall)} ${r.health.overall}`,
            '',
            armSummary,
          ].join('\n'),
        },
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════════
   Console Summary
   ═══════════════════════════════════════════════════════ */

export function formatConsole(r: ExperimentResult): string {
  const lines: string[] = [];
  const w = 60;
  const rule = '\u2550'.repeat(w);
  const thin = '\u2500'.repeat(w);

  lines.push(rule);
  lines.push(
    `  ${DECISION_EMOJI[r.decision] || ''} Experiment: ${r.experimentId}`,
  );
  lines.push(`  Decision: ${r.decision}`);
  lines.push(rule);
  lines.push('');
  lines.push(
    `  Period : ${r.dateRange.start} \u2192 ${r.dateRange.end}`,
  );
  lines.push(`  Total  : ${r.totalExposures} exposures`);
  lines.push(`  Reason : ${r.decisionReason}`);
  lines.push('');

  lines.push(thin);
  lines.push('  Arms:');
  for (const a of r.arms) {
    lines.push(
      `    ${pad(a.name, 20)} ${pct(a.rate, 2).padStart(8)}  (n=${a.exposures}, approvals=${a.approvals})`,
    );
  }
  lines.push('');

  if (r.pairwise.length > 0) {
    lines.push('  Pairwise:');
    for (const p of r.pairwise) {
      const sig = p.significant ? ' ***' : '';
      lines.push(
        `    ${p.armA} vs ${p.armB}: z=${p.z.toFixed(3)}, p=${p.pValue.toFixed(4)}, lift=${pct(p.lift)}${sig}`,
      );
    }
    lines.push('');
  }

  lines.push(thin);
  lines.push(
    `  Health: ${statusIcon(r.health.overall)} ${r.health.overall}`,
  );
  for (const c of r.health.checks) {
    lines.push(`    ${statusIcon(c.status)} ${c.name}: ${c.detail}`);
  }
  lines.push(rule);

  return lines.join('\n');
}

/* ═══════════════════════════════════════════════════════
   ASCII Sparkline + Digest Markdown (Phase 2)
   ═══════════════════════════════════════════════════════ */

const SPARK_CHARS = '▁▂▃▄▅▆▇█';

/** Generate ASCII sparkline from a numeric series */
export function sparkline(values: number[]): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  return values
    .map((v) => {
      if (range === 0) return SPARK_CHARS[3]; // mid-level for constant
      const idx = Math.round(((v - min) / range) * (SPARK_CHARS.length - 1));
      return SPARK_CHARS[Math.min(idx, SPARK_CHARS.length - 1)];
    })
    .join('');
}

/** Format an EnhancedBatchResult as a rich Markdown digest */
export function formatDigestMarkdown(
  batch: EnhancedBatchResult,
  opts: FormatDigestOptions = {},
): string {
  const lines: string[] = [];

  lines.push(`# Experiment Digest — ${batch.date}`);
  lines.push('');
  lines.push(
    `**Summary**: ${batch.summary.total} experiments | ` +
    `${batch.summary.active} active | ${batch.summary.frozen} frozen | ` +
    `${batch.summary.pass} PASS / ${batch.summary.warn} WARN / ${batch.summary.fail} FAIL`,
  );
  if (opts.artifactUrl) {
    lines.push(`**Artifacts**: [View Run](${opts.artifactUrl})`);
  }
  lines.push('');

  // Summary table
  lines.push('| Experiment | Day | Status | Health | Decision | Top Arm |');
  lines.push('|------------|-----|--------|--------|----------|---------|');

  for (const entry of batch.experiments) {
    if (entry.freezeStatus === 'FROZEN') {
      lines.push(
        `| ${entry.experimentId} | ${entry.daysSinceStart}/${entry.freezeDays} | FROZEN | — | — | — |`,
      );
    } else if (entry.result) {
      const r = entry.result;
      const topArm = r.arms[0]?.name ?? 'N/A';
      lines.push(
        `| ${entry.experimentId} | ${entry.daysSinceStart} | ACTIVE | ${statusIcon(r.health.overall)} ${r.health.overall} | ${DECISION_EMOJI[r.decision] || ''} ${r.decision} | \`${topArm}\` |`,
      );
    }
  }
  lines.push('');

  // Per-experiment details (active only)
  const activeEntries = batch.experiments.filter(
    (e) => e.freezeStatus === 'ACTIVE' && e.result,
  );

  if (activeEntries.length > 0) {
    lines.push('## Details');
    lines.push('');

    for (const entry of activeEntries) {
      const r = entry.result!;
      lines.push(`### ${entry.experimentId} (day ${entry.daysSinceStart})`);
      lines.push('');

      // Expected split info
      const split = opts.expectedSplits?.[entry.experimentId];
      if (split) {
        const splitStr = Object.entries(split).map(([arm, s]) => `${arm}: ${(s * 100).toFixed(0)}%`).join(', ');
        lines.push(`**Expected Split**: [${splitStr}]`);
      }

      // Arms with sparkline placeholders
      lines.push('');
      lines.push('| Arm | Rate | Exposures | 95% CI |');
      lines.push('|-----|------|-----------|--------|');
      for (const a of r.arms) {
        lines.push(
          `| ${a.name} | ${pct(a.rate)} | ${a.exposures} | [${pct(a.ci[0])}, ${pct(a.ci[1])}] |`,
        );
      }
      lines.push('');

      // Health checks
      if (r.health.checks.length > 0) {
        for (const c of r.health.checks) {
          lines.push(`- ${statusIcon(c.status)} **${c.name}**: ${c.detail}`);
        }
        lines.push('');
      }

      // Decision
      lines.push(`**Decision**: ${DECISION_EMOJI[r.decision] || ''} ${r.decision} — ${r.decisionReason}`);
      lines.push('');
    }
  }

  // Frozen experiments note
  const frozenEntries = batch.experiments.filter((e) => e.freezeStatus === 'FROZEN');
  if (frozenEntries.length > 0) {
    lines.push('## Frozen Experiments');
    lines.push('');
    for (const entry of frozenEntries) {
      lines.push(`- **${entry.experimentId}**: day ${entry.daysSinceStart} of ${entry.freezeDays} freeze days remaining`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('_Growth Engine 2.0_');

  return lines.join('\n');
}
