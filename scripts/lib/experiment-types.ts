/**
 * Experiment Auto-Evaluation System — Type Definitions
 * AIL-2026-0227-EXP-001
 */

/* ─── Arm Data ─── */

export interface ArmData {
  name: string;           // templateType value (arm identifier)
  exposures: number;      // total REDIRECT actions
  approvals: number;      // Post.status = 'APPROVED'
  rate: number;           // approvals / exposures
  ci: [number, number];   // Wilson score 95% CI
}

/* ─── Pairwise z-test ─── */

export interface PairwiseResult {
  armA: string;
  armB: string;
  z: number;
  pValue: number;
  lift: number;           // (rateA - rateB) / rateB
  significant: boolean;   // p < alpha
}

/* ─── Health Checks ─── */

export type HealthStatus = 'PASS' | 'WARN' | 'FAIL';

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  value: number;
  threshold: { warn?: number; fail?: number };
  detail: string;
}

export interface ExperimentHealth {
  overall: HealthStatus;
  checks: HealthCheck[];
}

/* ─── Decision ─── */

export type Decision = 'PROMOTE' | 'HOLD' | 'KILL' | 'EXTEND';

/* ─── Full Result ─── */

export interface ExperimentResult {
  experimentId: string;
  dateRange: { start: string; end: string };
  config: ExperimentConfig;
  arms: ArmData[];
  pairwise: PairwiseResult[];
  health: ExperimentHealth;
  decision: Decision;
  decisionReason: string;
  totalExposures: number;
  timestamp: string;
}

/* ─── Configuration ─── */

export interface ExperimentConfig {
  experimentId: string;
  start: string;          // ISO date
  end: string;            // ISO date
  alpha: number;          // significance level (default 0.05)
  mde: number;            // minimum detectable effect (default 0.02)
  minSamples: number;     // minimum total exposures (default 200)
  biasThreshold: number;  // admin bias warn threshold (default 0.40)
  ciMode: boolean;
  jsonMode: boolean;
  slackWebhook?: string;
}

/* ─── Raw DB Row ─── */

export interface RedirectRow {
  templateType: string | null;
  postId: string;
  adminId: string;
  postStatus: string;
  authorId: string;
}

/* ─── Registry ─── */

export type ExperimentStatus =
  | 'DRAFT'
  | 'RUNNING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'KILLED'
  | 'ENDED';

/** Registry에서 허용되는 status (CI 검증용) */
export const VALID_REGISTRY_STATUSES: ExperimentStatus[] = ['RUNNING', 'PAUSED', 'ENDED'];

/**
 * evaluate-experiment에서 지원하는 primaryMetric 목록.
 * SSOT: scripts/lib/metrics.ts → METRIC_REGISTRY에서 관리.
 * 여기는 re-export만 수행.
 */
export { SUPPORTED_PRIMARY_METRICS } from './metrics';

export interface RegistryEntry {
  id: string;
  status: ExperimentStatus;
  owner: string;
  primaryMetric: string;
  expectedSplit: Record<string, number>;  // e.g. { control: 0.5, variant_b: 0.5 }
  freezeDays: number;
  holdDaysMax?: number;                   // default 30
  startDate: string;                      // ISO date
  constraints: {
    minSamples: number;
    alpha: number;
    mde: number;
    biasThreshold: number;
    templateTypeFixed?: boolean;
  };
}

/* ─── Trend Analysis ─── */

export interface TrendPoint {
  date: string;
  totalExposures: number;
  healthOverall: HealthStatus;
  decision: Decision;
  armRates: Record<string, number>;
  healthMetrics?: Record<string, number>;  // e.g. { srm: 0.65, missingRate: 0.001, contamination: 0.02, bias: 0.32 }
}

export type TrendAlertType =
  | 'SPIKE'
  | 'CONSECUTIVE_INCREASE'
  | 'THRESHOLD_BREACH'
  | 'EXPOSURE_DROP'
  | 'STEP_CHANGE'
  | 'ABSOLUTE_CAP';

export interface TrendAlert {
  type: TrendAlertType;
  metric: string;
  detail: string;
  severity: HealthStatus;
}

export interface TrendAnalysis {
  experimentId: string;
  baselineDays: number;
  points: TrendPoint[];
  mean: number;
  stddev: number;
  upperBound: number;
  lowerBound: number;
  alerts: TrendAlert[];
}

/* ─── Daily Digest ─── */

export interface DigestEntry {
  experimentId: string;
  owner: string;
  daysSinceStart: number;
  latestDecision: Decision;
  latestHealth: HealthStatus;
  topArm: string;
  trendAlerts: TrendAlert[];
}

export interface DailyDigest {
  date: string;
  runningCount: number;
  entries: DigestEntry[];
  overallHealth: HealthStatus;
}

/* ─── Freeze Status ─── */

export type FreezeStatus = 'ACTIVE' | 'FROZEN';

/* ─── Enhanced Batch (Phase 2) ─── */

export interface BatchExperimentEntry {
  experimentId: string;
  freezeStatus: FreezeStatus;
  daysSinceStart: number;
  freezeDays: number;
  holdDays?: number;                // consecutive days in HOLD decision
  holdDaysMax?: number;             // from registry
  result: ExperimentResult | null;  // null when FROZEN
}

export interface EnhancedBatchResult {
  date: string;
  experiments: BatchExperimentEntry[];
  summary: {
    total: number;
    active: number;
    frozen: number;
    pass: number;
    warn: number;
    fail: number;
  };
}

/* ─── Digest Formatting ─── */

export interface FormatDigestOptions {
  artifactUrl?: string;
  includeSparklines?: boolean;
  expectedSplits?: Record<string, Record<string, number>>;
}

export interface SlackDigestPayloads {
  main: object;     // summary message
  details: object;  // detail (thread reply or follow-up message)
}

/* ─── CI Policy ─── */

export interface CIPolicyResult {
  mode: 'pr' | 'release';
  pass: boolean;
  blockers: string[];
  warnings: string[];
  strict?: boolean;
}
