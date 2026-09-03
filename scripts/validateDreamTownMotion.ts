/**
 * validateDreamTownMotion.ts
 * DreamTown Motion Safe Zone Validator
 *
 * 참조 SSOT: docs/ssot/DREAMTOWN_MOTION_SAFE.yml
 *
 * Usage (ts-node):
 *   npx ts-node scripts/validateDreamTownMotion.ts --config '{"zoom_per_sec":1.2}'
 *   npx ts-node scripts/validateDreamTownMotion.ts --file motion-config.json
 *
 * Usage (programmatic):
 *   import { validateMotion } from './validateDreamTownMotion'
 *   const result = validateMotion({ zoom_per_sec: 1.2, pan_per_sec: 0.3 })
 */

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

export interface MotionConfig {
  // zoom/pan — %/s
  zoom_per_sec?: number;
  pan_per_sec?: number;

  // opacity delta %
  opacity_range?: number;

  // grain
  grain_opacity?: number;    // %
  grain_size?: number;       // px

  // nano burst
  burst_count?: number;          // simultaneous particles
  burst_opacity_peak?: number;   // %
  burst_duration?: number;       // seconds (fade time)
  burst_delay?: number;          // seconds from frame start
  burst_size?: number;           // px
  burst_shape?: string;

  // loop
  loop_duration?: number;        // seconds

  // forbidden flags (explicit declarations)
  has_rotation?: boolean;
  has_bounce?: boolean;
  has_lens_flare?: boolean;
  has_cinematic_camera?: boolean;
  has_full_ai_video?: boolean;
  has_character_reinterpretation?: boolean;
  has_continuous_overacting?: boolean;
  has_heavy_particle?: boolean;
}

export type ValidationResult = 'SAFE' | 'WARNING' | 'DRIFT' | 'FORBIDDEN';

export type MotionLevel = 'L1' | 'L2' | 'MID_SAFE' | 'L3' | 'L4' | 'DRIFT' | 'FORBIDDEN';

export interface ValidationReport {
  result: ValidationResult;
  level: MotionLevel;
  violations: string[];
  warnings: string[];
  metrics: Record<string, string>;
  ssot_ref: string;
}

// ─────────────────────────────────────────
// Thresholds (mirrors DREAMTOWN_MOTION_SAFE.yml)
// ─────────────────────────────────────────

const L = {
  L1: { zoom_max: 0.30, pan_max: 0.10, opacity_max: 2.00,  grain_max: 1.50, burst_opacity_max: 8.00 },
  L2: { zoom_max: 0.80, pan_max: 0.20, opacity_max: 5.00,  grain_max: 3.00, burst_opacity_max: 12.00 },
  L3: { zoom_max: 1.50, pan_max: 0.40, opacity_max: 10.00, grain_max: 5.00, burst_opacity_max: 18.00, burst_count_max: 3 },
  L4: { zoom_max: 2.00, pan_max: 0.60, opacity_max: 15.00, grain_max: 7.00, burst_opacity_max: 22.00, burst_count_max: 5 },
};

const DRIFT_THRESHOLDS = {
  zoom_per_sec:       2.00,
  pan_per_sec:        0.60,
  opacity_range:      15.00,
  grain_opacity:      7.00,
  burst_count:        5,
  burst_opacity_peak: 22.00,
};

const WARNING_PCT = 0.80;  // 80% of L4 max triggers WARNING

// ─────────────────────────────────────────
// Level detector
// ─────────────────────────────────────────

function detectLevel(cfg: MotionConfig): MotionLevel {
  const z = cfg.zoom_per_sec ?? 0;
  const p = cfg.pan_per_sec ?? 0;
  const o = cfg.opacity_range ?? 0;
  const g = cfg.grain_opacity ?? 0;
  const bo = cfg.burst_opacity_peak ?? 0;
  const bc = cfg.burst_count ?? 0;

  const maxVal = (v: number, levels: number[]) => {
    for (let i = levels.length - 1; i >= 0; i--) {
      if (v > levels[i]) return i + 2;  // returns 1-indexed level number above threshold
    }
    return 1;
  };

  // Each axis independently determines level, take the highest
  const zLevel = z <= L.L1.zoom_max ? 1 : z <= L.L2.zoom_max ? 2 : z <= L.L3.zoom_max ? 3 : z <= L.L4.zoom_max ? 4 : 5;
  const pLevel = p <= L.L1.pan_max ? 1 : p <= L.L2.pan_max ? 2 : p <= L.L3.pan_max ? 3 : p <= L.L4.pan_max ? 4 : 5;
  const oLevel = o <= L.L1.opacity_max ? 1 : o <= L.L2.opacity_max ? 2 : o <= L.L3.opacity_max ? 3 : o <= L.L4.opacity_max ? 4 : 5;
  const gLevel = g <= L.L1.grain_max ? 1 : g <= L.L2.grain_max ? 2 : g <= L.L3.grain_max ? 3 : g <= L.L4.grain_max ? 4 : 5;
  const boLevel = bo <= L.L1.burst_opacity_max ? 1 : bo <= L.L2.burst_opacity_max ? 2 : bo <= L.L3.burst_opacity_max ? 3 : bo <= L.L4.burst_opacity_max ? 4 : 5;
  const bcLevel = bc === 0 ? 0 : bc <= 3 ? 3 : bc <= 5 ? 4 : 5;

  const maxLevel = Math.max(zLevel, pLevel, oLevel, gLevel, boLevel, bcLevel);

  if (maxLevel >= 5) return 'DRIFT';
  if (maxLevel === 4) return 'L4';
  // MID_SAFE: zoom 0.70–1.00 (bridges upper-L2 / lower-L3 calibration zone)
  if (z >= 0.70 && z <= 1.00) return 'MID_SAFE';
  if (maxLevel === 3) return 'L3';
  if (maxLevel === 2) return 'L2';
  return 'L1';
}

// ─────────────────────────────────────────
// Forbidden checks
// ─────────────────────────────────────────

function checkForbidden(cfg: MotionConfig): string[] {
  const violations: string[] = [];

  if (cfg.has_rotation)                  violations.push('[F-01] rotation 감지 — 절대 금지');
  if (cfg.has_cinematic_camera)          violations.push('[F-02] cinematic camera move — 절대 금지');
  if (cfg.has_bounce)                    violations.push('[F-03] bounce/elastic 이징 — 절대 금지');
  if (cfg.has_lens_flare)                violations.push('[F-04] lens flare — 절대 금지');
  if ((cfg.burst_count ?? 0) > 10)      violations.push('[F-05] heavy particle (>10) — 절대 금지');
  if (cfg.has_heavy_particle)            violations.push('[F-05] heavy particle 플래그 — 절대 금지');
  if (cfg.has_full_ai_video)             violations.push('[F-06] full AI video generation — 절대 금지');
  if (cfg.has_character_reinterpretation) violations.push('[F-07] character reinterpretation — 절대 금지');
  if (cfg.has_continuous_overacting)     violations.push('[F-08] continuous emotional overacting — 절대 금지');

  if (cfg.burst_shape &&
      !['circle','soft-circle'].includes(cfg.burst_shape)) {
    violations.push(`[F-09] burst shape "${cfg.burst_shape}" 금지 — circle/soft-circle만 허용`);
  }

  // cinematic speed check (zoom > 3%/s)
  if ((cfg.zoom_per_sec ?? 0) > 3.0) {
    violations.push('[F-02] zoom_per_sec > 3.0 — cinematic 속도 금지');
  }

  return violations;
}

// ─────────────────────────────────────────
// Drift & Warning checks
// ─────────────────────────────────────────

function checkDrift(cfg: MotionConfig): string[] {
  const violations: string[] = [];
  const z = cfg.zoom_per_sec ?? 0;
  const p = cfg.pan_per_sec ?? 0;
  const o = cfg.opacity_range ?? 0;
  const g = cfg.grain_opacity ?? 0;
  const bc = cfg.burst_count ?? 0;
  const bo = cfg.burst_opacity_peak ?? 0;

  if (z > DRIFT_THRESHOLDS.zoom_per_sec)
    violations.push(`zoom_per_sec ${z.toFixed(2)} > ${DRIFT_THRESHOLDS.zoom_per_sec} — DRIFT`);
  if (p > DRIFT_THRESHOLDS.pan_per_sec)
    violations.push(`pan_per_sec ${p.toFixed(2)} > ${DRIFT_THRESHOLDS.pan_per_sec} — DRIFT`);
  if (o > DRIFT_THRESHOLDS.opacity_range)
    violations.push(`opacity_range ${o.toFixed(1)}% > ${DRIFT_THRESHOLDS.opacity_range}% — DRIFT`);
  if (g > DRIFT_THRESHOLDS.grain_opacity)
    violations.push(`grain_opacity ${g.toFixed(1)}% > ${DRIFT_THRESHOLDS.grain_opacity}% — DRIFT`);
  if (bc > DRIFT_THRESHOLDS.burst_count)
    violations.push(`burst_count ${bc} > ${DRIFT_THRESHOLDS.burst_count} — DRIFT`);
  if (bo > DRIFT_THRESHOLDS.burst_opacity_peak)
    violations.push(`burst_opacity_peak ${bo.toFixed(1)}% > ${DRIFT_THRESHOLDS.burst_opacity_peak}% — DRIFT`);

  return violations;
}

function checkWarnings(cfg: MotionConfig): string[] {
  const warnings: string[] = [];
  const warnAt = (val: number, max: number, name: string) => {
    if (val > max * WARNING_PCT && val <= max)
      warnings.push(`${name} ${val.toFixed(2)} > L4 80% threshold (${(max * WARNING_PCT).toFixed(2)}) — 조정 권장`);
  };

  warnAt(cfg.zoom_per_sec ?? 0, L.L4.zoom_max, 'zoom_per_sec');
  warnAt(cfg.pan_per_sec ?? 0, L.L4.pan_max, 'pan_per_sec');
  warnAt(cfg.opacity_range ?? 0, L.L4.opacity_max, 'opacity_range');
  warnAt(cfg.grain_opacity ?? 0, L.L4.grain_max, 'grain_opacity');
  warnAt(cfg.burst_opacity_peak ?? 0, L.L4.burst_opacity_max, 'burst_opacity_peak');

  if ((cfg.burst_delay ?? 99) < 2.0)
    warnings.push(`burst_delay ${cfg.burst_delay}s < 2.0s — 갑작스러운 등장 주의 (NANO_BURST 규칙)`);

  if ((cfg.grain_size ?? 0) > 3)
    warnings.push(`grain_size ${cfg.grain_size}px > 3px — 패턴이 보일 수 있음`);

  if ((cfg.burst_size ?? 0) > 4)
    warnings.push(`burst_size ${cfg.burst_size}px > 4px — 과한 입자 크기 (표준 max: 3px)`);

  return warnings;
}

// ─────────────────────────────────────────
// Main validator
// ─────────────────────────────────────────

export function validateMotion(cfg: MotionConfig): ValidationReport {
  const forbidden = checkForbidden(cfg);
  if (forbidden.length > 0) {
    return {
      result: 'FORBIDDEN',
      level: 'FORBIDDEN',
      violations: forbidden,
      warnings: [],
      metrics: buildMetrics(cfg),
      ssot_ref: 'docs/ssot/DREAMTOWN_MOTION_SAFE.yml §forbidden',
    };
  }

  const driftViolations = checkDrift(cfg);
  if (driftViolations.length > 0) {
    return {
      result: 'DRIFT',
      level: 'DRIFT',
      violations: driftViolations,
      warnings: checkWarnings(cfg),
      metrics: buildMetrics(cfg),
      ssot_ref: 'docs/ssot/DREAMTOWN_MOTION_SAFE.yml §drift',
    };
  }

  const warnings = checkWarnings(cfg);
  const level = detectLevel(cfg);

  return {
    result: warnings.length > 0 ? 'WARNING' : 'SAFE',
    level,
    violations: [],
    warnings,
    metrics: buildMetrics(cfg),
    ssot_ref: 'docs/ssot/DREAMTOWN_MOTION_SAFE.yml §levels',
  };
}

function buildMetrics(cfg: MotionConfig): Record<string, string> {
  const m: Record<string, string> = {};
  if (cfg.zoom_per_sec !== undefined)      m.zoom_per_sec      = `${cfg.zoom_per_sec.toFixed(3)} %/s`;
  if (cfg.pan_per_sec !== undefined)       m.pan_per_sec       = `${cfg.pan_per_sec.toFixed(3)} %/s`;
  if (cfg.opacity_range !== undefined)     m.opacity_range     = `${cfg.opacity_range.toFixed(1)} %`;
  if (cfg.grain_opacity !== undefined)     m.grain_opacity     = `${cfg.grain_opacity.toFixed(1)} %`;
  if (cfg.grain_size !== undefined)        m.grain_size        = `${cfg.grain_size} px`;
  if (cfg.burst_count !== undefined)       m.burst_count       = `${cfg.burst_count}`;
  if (cfg.burst_opacity_peak !== undefined) m.burst_opacity_peak = `${cfg.burst_opacity_peak.toFixed(1)} %`;
  if (cfg.burst_delay !== undefined)       m.burst_delay       = `${cfg.burst_delay.toFixed(1)} s`;
  if (cfg.burst_duration !== undefined)    m.burst_duration    = `${cfg.burst_duration.toFixed(2)} s`;
  if (cfg.loop_duration !== undefined)     m.loop_duration     = `${cfg.loop_duration.toFixed(1)} s`;
  return m;
}

// ─────────────────────────────────────────
// Pretty printer
// ─────────────────────────────────────────

export function printReport(report: ValidationReport): void {
  const COLORS: Record<ValidationResult, string> = {
    SAFE:      '\x1b[32m',   // green
    WARNING:   '\x1b[33m',   // yellow
    DRIFT:     '\x1b[31m',   // red
    FORBIDDEN: '\x1b[35m',   // magenta
  };
  const RESET = '\x1b[0m';
  const color = COLORS[report.result];

  console.log('\n' + '─'.repeat(52));
  console.log(`${color}▶ RESULT: ${report.result}${RESET}  (${report.level})`);
  console.log('─'.repeat(52));

  if (Object.keys(report.metrics).length) {
    console.log('\nMetrics:');
    for (const [k, v] of Object.entries(report.metrics)) {
      console.log(`  ${k.padEnd(22)} ${v}`);
    }
  }

  if (report.violations.length) {
    console.log('\nViolations:');
    report.violations.forEach(v => console.log(`  ✗ ${v}`));
  }

  if (report.warnings.length) {
    console.log('\nWarnings:');
    report.warnings.forEach(w => console.log(`  ⚠ ${w}`));
  }

  console.log(`\nRef: ${report.ssot_ref}`);
  console.log('─'.repeat(52) + '\n');
}

// ─────────────────────────────────────────
// CLI entry point
// ─────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);

  let cfg: MotionConfig = {};

  const configFlag = args.indexOf('--config');
  const fileFlag   = args.indexOf('--file');

  if (configFlag !== -1 && args[configFlag + 1]) {
    try {
      cfg = JSON.parse(args[configFlag + 1]);
    } catch {
      console.error('--config JSON parse error');
      process.exit(1);
    }
  } else if (fileFlag !== -1 && args[fileFlag + 1]) {
    const fs = require('fs');
    cfg = JSON.parse(fs.readFileSync(args[fileFlag + 1], 'utf8'));
  } else {
    // run built-in test suite
    runTestSuite();
    process.exit(0);
  }

  const report = validateMotion(cfg);
  printReport(report);
  process.exit(report.result === 'SAFE' ? 0 : 1);
}

// ─────────────────────────────────────────
// Built-in test suite (no args)
// ─────────────────────────────────────────

function runTestSuite(): void {
  const cases: Array<{ name: string; cfg: MotionConfig; expected: ValidationResult }> = [
    {
      name: 'A-1 v2 (MID_SAFE Breath)',
      cfg: { zoom_per_sec: 0.90, opacity_range: 5.0 },
      expected: 'SAFE',
    },
    {
      name: 'A-1.5 MID SAFE',
      cfg: { zoom_per_sec: 0.75, opacity_range: 4.0, grain_opacity: 3.0 },
      expected: 'SAFE',
    },
    {
      name: 'A-2 SAFE MAX (L4 Echo)',
      cfg: { zoom_per_sec: 1.80, pan_per_sec: 0.50, opacity_range: 12.0 },
      expected: 'WARNING',  // near L4 ceiling → WARNING
    },
    {
      name: 'B-1 Nano Burst delay=5s',
      cfg: { burst_count: 2, burst_opacity_peak: 11.0, burst_delay: 5.0, burst_duration: 0.40, burst_size: 2 },
      expected: 'SAFE',
    },
    {
      name: 'B-2 Nano Burst delay=3s',
      cfg: { burst_count: 2, burst_opacity_peak: 11.0, burst_delay: 3.0, burst_duration: 0.40, burst_size: 2 },
      expected: 'SAFE',  // 3.0s ≥ 2.0s minimum → SAFE (B-1 vs B-2 is experiential diff, not SSOT violation)
    },
    {
      name: 'C-1 Grain standard (2%)',
      cfg: { grain_opacity: 2.0, grain_size: 2 },
      expected: 'SAFE',
    },
    {
      name: 'C-2 Grain fine (1.5%)',
      cfg: { grain_opacity: 1.5, grain_size: 1 },
      expected: 'SAFE',
    },
    {
      name: 'D-1 Center Burst',
      cfg: { burst_count: 3, burst_opacity_peak: 15.0, burst_delay: 4.0, burst_duration: 0.45, burst_size: 2 },
      expected: 'SAFE',
    },
    {
      name: 'DRIFT — zoom too fast',
      cfg: { zoom_per_sec: 2.5 },
      expected: 'DRIFT',
    },
    {
      name: 'FORBIDDEN — rotation',
      cfg: { has_rotation: true, zoom_per_sec: 0.3 },
      expected: 'FORBIDDEN',
    },
    {
      name: 'FORBIDDEN — lens flare',
      cfg: { has_lens_flare: true },
      expected: 'FORBIDDEN',
    },
    {
      name: 'FORBIDDEN — heavy particle (>10)',
      cfg: { burst_count: 12, burst_opacity_peak: 20.0 },
      expected: 'FORBIDDEN',
    },
  ];

  console.log('\nDreamTown Motion Validator — Test Suite');
  console.log('='.repeat(52));

  let passed = 0;
  cases.forEach(({ name, cfg, expected }) => {
    const report = validateMotion(cfg);
    const ok = report.result === expected;
    const icon = ok ? '✅' : '❌';
    console.log(`${icon} ${name.padEnd(35)} ${report.result} (${report.level})`);
    if (!ok) {
      console.log(`   Expected: ${expected}, Got: ${report.result}`);
      if (report.violations.length) report.violations.forEach(v => console.log(`   ✗ ${v}`));
      if (report.warnings.length) report.warnings.forEach(w => console.log(`   ⚠ ${w}`));
    }
    if (ok) passed++;
  });

  console.log('─'.repeat(52));
  console.log(`Result: ${passed}/${cases.length} passed\n`);
}
