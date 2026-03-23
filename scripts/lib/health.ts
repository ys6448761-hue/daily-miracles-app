/**
 * Standalone Health Module — SRM + Bias40 + Contamination + Missing
 *
 * Takes pre-aggregated HealthInput (no raw rows needed).
 *
 * POLICY_MODE=shadow (default): 내장 threshold로 판정 (레거시).
 * POLICY_MODE=enforce: 측정값만 추출 → evaluateMetric(health-policy)에 판정 위임.
 * POLICY_ENFORCE_METRICS: 부분 enforce (metric별 개별 전환 가능).
 */

type Arm = string;

export type HealthInput = {
  arms: Record<Arm, { exposures: number; approvals: number }>;

  /**
   * SRM: 기대 분배 (없으면 균등 분배로 가정)
   * 예) { control: 0.5, variant_b: 0.5 }
   */
  expectedSplit?: Record<Arm, number>;

  /**
   * Bias: 특정 key(예: templateType, adminFlag, segment)별 arm 분포
   * counts[key][arm] = 해당 key 값에서 arm의 exposures (권장: exposures 기준)
   * 예) sliceCounts["templateType=K"]["variant_b"] = 340
   */
  sliceCounts?: Record<string, Record<Arm, number>>;

  /**
   * Contamination: user가 여러 arm에 노출된 비율 계산용
   * 유저별 노출된 arm 집합 크기
   * 예) [{userId:"u1", arms:["control"]}, {userId:"u2", arms:["control","variant_b"]}]
   */
  userArms?: Array<{ userId: string; arms: Arm[] }>;

  /**
   * Missing: raw events에서 experimentId/arm 누락률
   */
  missing?: {
    totalEvents: number;
    missingExperimentId: number;
    missingArm: number;
  };

  thresholds?: {
    srmFailP?: number;    // default 0.01
    srmWarnP?: number;    // default 0.05
    biasWarn?: number;     // default 0.40
    biasFail?: number;     // default 0.60
    contamWarn?: number;   // default 0.05
    contamFail?: number;   // default 0.10
    missingFail?: number;  // default 0.01
  };
};

export type HealthStatus = "PASS" | "WARN" | "FAIL";

export type HealthReport = {
  status: HealthStatus;
  checks: {
    srm?: { status: HealthStatus; pValue?: number; chi2?: number; detail?: string };
    bias?: { status: HealthStatus; worstKey?: string; worstDiff?: number; detail?: string };
    contamination?: { status: HealthStatus; rate?: number; detail?: string };
    missing?: { status: HealthStatus; missingExperimentRate?: number; missingArmRate?: number; detail?: string };
  };
};

/* ─── Policy Delegation ─── */

import { evaluateMetric, isMetricEnforced } from './health-policy';

/* ─── Internal Helpers ─── */

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function worstStatus(a?: HealthStatus, b?: HealthStatus): HealthStatus {
  const rank: Record<HealthStatus, number> = { PASS: 0, WARN: 1, FAIL: 2 };
  if (!a) return b ?? "PASS";
  if (!b) return a;
  return rank[a] >= rank[b] ? a : b;
}

/**
 * Chi-square survival function for df = k-1 using Wilson-Hilferty approximation.
 */
function chiSquarePValue(chi2: number, df: number): number {
  if (df <= 0) return 1;
  const x = chi2 / df;
  const z = (Math.cbrt(x) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  const p = 1 - normalCdf(z);
  return clamp01(p);
}

function normalCdf(x: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  const cdf = x >= 0 ? 1 - p : p;
  return clamp01(cdf);
}

/* ─── SRM ─── */

function computeSRM(params: {
  observed: Record<string, number>;
  expectedSplit?: Record<string, number>;
  srmFailP: number;
  srmWarnP: number;
}): { status: HealthStatus; pValue: number; chi2: number; detail: string } {
  const arms = Object.keys(params.observed);
  const total = arms.reduce((s, a) => s + (params.observed[a] ?? 0), 0);

  if (arms.length < 2 || total <= 0) {
    return { status: "PASS", pValue: 1, chi2: 0, detail: "SRM skipped (insufficient arms/traffic)." };
  }

  let expected: Record<string, number>;
  if (params.expectedSplit && Object.keys(params.expectedSplit).length) {
    const sum = arms.reduce((s, a) => s + (params.expectedSplit![a] ?? 0), 0);
    expected = Object.fromEntries(arms.map((a) => [a, sum > 0 ? (params.expectedSplit![a] ?? 0) / sum : 1 / arms.length]));
  } else {
    expected = Object.fromEntries(arms.map((a) => [a, 1 / arms.length]));
  }

  let chi2 = 0;
  for (const a of arms) {
    const o = params.observed[a] ?? 0;
    const e = total * (expected[a] ?? 0);
    if (e > 0) chi2 += (o - e) * (o - e) / e;
  }

  const df = arms.length - 1;
  const pValue = chiSquarePValue(chi2, df);

  let status: HealthStatus = "PASS";
  if (pValue < params.srmFailP) status = "FAIL";
  else if (pValue < params.srmWarnP) status = "WARN";

  const detail = `arms=${arms.join(",")} total=${total} chi2=${chi2.toFixed(2)} df=${df} p=${pValue.toFixed(4)}`;
  return { status, pValue, chi2, detail };
}

/* ─── Bias40 ─── */

/**
 * slice별 arm 분포 차이가 threshold를 넘는지 확인
 * - max(armShare) - min(armShare) = diff
 */
function computeBias(params: {
  sliceCounts?: Record<string, Record<string, number>>;
  biasWarn: number;
  biasFail: number;
}): { status: HealthStatus; worstKey?: string; worstDiff?: number; detail?: string } {
  const slices = params.sliceCounts ? Object.entries(params.sliceCounts) : [];
  if (!slices.length) return { status: "PASS", detail: "Bias check skipped (no sliceCounts)." };

  let overall: HealthStatus = "PASS";
  let worstKey: string | undefined;
  let worstDiff = 0;

  for (const [key, counts] of slices) {
    const arms = Object.keys(counts);
    const total = arms.reduce((s, a) => s + (counts[a] ?? 0), 0);
    if (arms.length < 2 || total <= 0) continue;

    const shares = arms.map((a) => (counts[a] ?? 0) / total);
    const diff = Math.max(...shares) - Math.min(...shares);

    if (diff > worstDiff) {
      worstDiff = diff;
      worstKey = key;
    }

    let st: HealthStatus = "PASS";
    if (diff >= params.biasFail) st = "FAIL";
    else if (diff >= params.biasWarn) st = "WARN";
    overall = worstStatus(overall, st);
  }

  const detail =
    worstKey != null
      ? `worst=${worstKey} diff=${(worstDiff * 100).toFixed(1)}% (warn>=${(params.biasWarn * 100).toFixed(0)} fail>=${(params.biasFail * 100).toFixed(0)})`
      : "Bias computed but no valid slices.";
  return { status: overall, worstKey, worstDiff, detail };
}

/* ─── Contamination ─── */

function computeContamination(params: {
  userArms?: Array<{ userId: string; arms: string[] }>;
  contamWarn: number;
  contamFail: number;
}): { status: HealthStatus; rate?: number; detail?: string } {
  const ua = params.userArms ?? [];
  if (!ua.length) return { status: "PASS", detail: "Contamination check skipped (no userArms)." };

  const totalUsers = ua.length;
  const contaminated = ua.filter((u) => new Set(u.arms).size >= 2).length;
  const rate = totalUsers > 0 ? contaminated / totalUsers : 0;

  let status: HealthStatus = "PASS";
  if (rate >= params.contamFail) status = "FAIL";
  else if (rate >= params.contamWarn) status = "WARN";

  return {
    status,
    rate,
    detail: `contaminated=${contaminated}/${totalUsers} rate=${(rate * 100).toFixed(2)}% (warn>=${(
      params.contamWarn * 100
    ).toFixed(0)} fail>=${(params.contamFail * 100).toFixed(0)})`,
  };
}

/* ─── Missing ─── */

function computeMissing(params: {
  missing?: { totalEvents: number; missingExperimentId: number; missingArm: number };
  missingFail: number;
}): { status: HealthStatus; missingExperimentRate?: number; missingArmRate?: number; detail?: string } {
  const m = params.missing;
  if (!m || m.totalEvents <= 0) return { status: "PASS", detail: "Missing check skipped (no missing stats)." };

  const missExpRate = m.missingExperimentId / m.totalEvents;
  const missArmRate = m.missingArm / m.totalEvents;

  const status: HealthStatus = missExpRate > params.missingFail || missArmRate > params.missingFail ? "FAIL" : "PASS";
  return {
    status,
    missingExperimentRate: missExpRate,
    missingArmRate: missArmRate,
    detail: `missingExperimentId=${(missExpRate * 100).toFixed(2)}% missingArm=${(missArmRate * 100).toFixed(
      2
    )}% (fail>${(params.missingFail * 100).toFixed(2)}%)`,
  };
}

/* ─── Main Entry ─── */

export function computeHealth(input: HealthInput): HealthReport {
  const t = {
    srmFailP: input.thresholds?.srmFailP ?? 0.01,
    srmWarnP: input.thresholds?.srmWarnP ?? 0.05,
    biasWarn: input.thresholds?.biasWarn ?? 0.40,
    biasFail: input.thresholds?.biasFail ?? 0.60,
    contamWarn: input.thresholds?.contamWarn ?? 0.05,
    contamFail: input.thresholds?.contamFail ?? 0.10,
    missingFail: input.thresholds?.missingFail ?? 0.01,
  };

  const report: HealthReport = { status: "PASS", checks: {} };

  // SRM — 측정: chi2, p-value / 판정: enforce시 evaluateMetric('srm', pValue)
  const observed = Object.fromEntries(
    Object.entries(input.arms).map(([arm, m]) => [arm, m.exposures]),
  );
  const srm = computeSRM({ observed, expectedSplit: input.expectedSplit, srmFailP: t.srmFailP, srmWarnP: t.srmWarnP });
  if (isMetricEnforced('srm') && srm.pValue != null) {
    const policy = evaluateMetric('srm', srm.pValue);
    srm.status = policy.status;
    if (policy.reason) srm.detail = `[policy] ${policy.reason}`;
  }
  report.checks.srm = srm;
  report.status = worstStatus(report.status, srm.status);

  // Bias — 측정: worstDiff / 판정: enforce시 evaluateMetric('bias', worstDiff)
  const bias = computeBias({ sliceCounts: input.sliceCounts, biasWarn: t.biasWarn, biasFail: t.biasFail });
  if (isMetricEnforced('bias') && bias.worstDiff != null) {
    const policy = evaluateMetric('bias', bias.worstDiff);
    bias.status = policy.status;
    if (policy.reason) bias.detail = `[policy] ${policy.reason}`;
  }
  report.checks.bias = bias;
  report.status = worstStatus(report.status, bias.status);

  // Contamination — 측정: rate / 판정: enforce시 evaluateMetric('contamination', rate)
  const contamination = computeContamination({ userArms: input.userArms, contamWarn: t.contamWarn, contamFail: t.contamFail });
  if (isMetricEnforced('contamination') && contamination.rate != null) {
    const policy = evaluateMetric('contamination', contamination.rate);
    contamination.status = policy.status;
    if (policy.reason) contamination.detail = `[policy] ${policy.reason}`;
  }
  report.checks.contamination = contamination;
  report.status = worstStatus(report.status, contamination.status);

  // Missing — 측정: missingRate / 판정: enforce시 evaluateMetric('missingRate', maxRate)
  const missing = computeMissing({ missing: input.missing, missingFail: t.missingFail });
  if (isMetricEnforced('missingRate')) {
    const maxRate = Math.max(missing.missingExperimentRate ?? 0, missing.missingArmRate ?? 0);
    if (maxRate > 0) {
      const policy = evaluateMetric('missingRate', maxRate);
      missing.status = policy.status;
      if (policy.reason) missing.detail = `[policy] ${policy.reason}`;
    }
  }
  report.checks.missing = missing;
  report.status = worstStatus(report.status, missing.status);

  return report;
}
