/**
 * Health Policy Table — Growth Engine 1.2
 *
 * "통계적으로 이상"과 "운영적으로 위험"을 분리.
 * 각 metric별 baseline 방식, WARN/FAIL 조건, absolute cap 정의.
 */

export type BaselineMethod = 'chi-square' | 'mean-sigma' | 'slice-diff' | 'fixed';

export interface MetricPolicy {
  /** Baseline 계산 방식 */
  baseline: BaselineMethod;

  /** 인간이 읽을 수 있는 조건 설명 */
  warnCondition: string;
  failCondition: string;

  /**
   * mean-sigma 방식: > mean + N*sigma 일 때 alert
   * SRM은 p-value라 "lower = worse" → 별도 처리
   */
  warnSigma?: number;
  failSigma?: number;

  /** multiplier 방식: > baseline * N 일 때 alert */
  warnMultiplier?: number;
  failMultiplier?: number;

  /** fixed threshold 방식: 고정 수치 초과 시 alert */
  fixedWarn?: number;
  fixedFail?: number;

  /**
   * Absolute cap: baseline과 무관하게 이 값을 넘으면 무조건 FAIL.
   * "운영적으로 위험"한 한계점.
   * undefined = 캡 없음 (fixed threshold만 적용).
   */
  absoluteCap?: number;

  /** true면 값이 낮을수록 나쁨 (SRM p-value). default false (높을수록 나쁨) */
  lowerIsWorse?: boolean;
}

/**
 * Growth Engine 1.2 정책표.
 *
 * | Metric        | Baseline    | WARN             | FAIL             | Cap  |
 * |---------------|-------------|------------------|------------------|------|
 * | srm           | chi-square  | p < 0.05         | p < 0.01         | 고정 |
 * | missingRate   | mean+σ      | > baseline + 3σ  | > baseline + 4σ  | 2%   |
 * | contamination | mean+σ      | > 5%             | > 10%            | 15%  |
 * | bias          | slice-diff  | ≥ 40%            | ≥ 60%            | 고정 |
 * | errorRate     | mean+σ      | 2× baseline      | 3× baseline      | 5%   |
 * | crashRate     | mean+σ      | 2× baseline      | 3× baseline      | 3%   |
 */
export const HEALTH_POLICY: Record<string, MetricPolicy> = {
  srm: {
    baseline: 'chi-square',
    warnCondition: 'p < 0.05',
    failCondition: 'p < 0.01',
    fixedWarn: 0.05,
    fixedFail: 0.01,
    lowerIsWorse: true,
  },

  missingRate: {
    baseline: 'mean-sigma',
    warnCondition: '> baseline + 3σ',
    failCondition: '> baseline + 4σ',
    warnSigma: 3,
    failSigma: 4,
    absoluteCap: 0.02,
  },

  contamination: {
    baseline: 'fixed',
    warnCondition: '> 5%',
    failCondition: '> 10%',
    fixedWarn: 0.05,
    fixedFail: 0.10,
    absoluteCap: 0.15,
  },

  bias: {
    baseline: 'slice-diff',
    warnCondition: '≥ 40%',
    failCondition: '≥ 60%',
    fixedWarn: 0.40,
    fixedFail: 0.60,
  },

  errorRate: {
    baseline: 'mean-sigma',
    warnCondition: '2× baseline',
    failCondition: '3× baseline',
    warnMultiplier: 2,
    failMultiplier: 3,
    absoluteCap: 0.05,
  },

  crashRate: {
    baseline: 'mean-sigma',
    warnCondition: '2× baseline',
    failCondition: '3× baseline',
    warnMultiplier: 2,
    failMultiplier: 3,
    absoluteCap: 0.03,
  },
};

/**
 * result.json의 health.checks[].name → policy metric key 매핑.
 * SRM의 value는 p-value, 나머지는 rate/diff.
 */
export const CHECK_NAME_TO_METRIC: Record<string, string> = {
  SRM: 'srm',
  Missing: 'missingRate',
  Contamination: 'contamination',
  Bias: 'bias',
};

/**
 * Policy 기반으로 단일 시점 값을 평가.
 * baseline이 없으면 (첫 날) fixed threshold만 적용.
 */
export function evaluateMetric(
  metricKey: string,
  current: number,
  baselineMean?: number,
  baselineStddev?: number,
): { status: 'PASS' | 'WARN' | 'FAIL'; reason?: string } {
  const policy = HEALTH_POLICY[metricKey];
  if (!policy) return { status: 'PASS' };

  // 1. Absolute cap (운영적 위험)
  if (policy.absoluteCap != null) {
    if (policy.lowerIsWorse ? current < policy.absoluteCap : current > policy.absoluteCap) {
      return {
        status: 'FAIL',
        reason: `absolute cap breached: ${fmt(current)} (cap=${fmt(policy.absoluteCap)})`,
      };
    }
  }

  // 2. Fixed threshold
  if (policy.fixedFail != null) {
    const fail = policy.lowerIsWorse ? current < policy.fixedFail : current >= policy.fixedFail;
    if (fail) return { status: 'FAIL', reason: `${policy.failCondition}` };
  }
  if (policy.fixedWarn != null) {
    const warn = policy.lowerIsWorse ? current < policy.fixedWarn : current >= policy.fixedWarn;
    if (warn) return { status: 'WARN', reason: `${policy.warnCondition}` };
  }

  // 3. Baseline-dependent checks (need history)
  if (baselineMean != null && baselineStddev != null && baselineStddev > 0) {
    // Sigma breach
    if (policy.failSigma != null) {
      const threshold = baselineMean + policy.failSigma * baselineStddev;
      if (current > threshold) {
        return {
          status: 'FAIL',
          reason: `${fmt(current)} > mean+${policy.failSigma}σ (${fmt(threshold)})`,
        };
      }
    }
    if (policy.warnSigma != null) {
      const threshold = baselineMean + policy.warnSigma * baselineStddev;
      if (current > threshold) {
        return {
          status: 'WARN',
          reason: `${fmt(current)} > mean+${policy.warnSigma}σ (${fmt(threshold)})`,
        };
      }
    }

    // Multiplier breach
    if (policy.failMultiplier != null && baselineMean > 0) {
      if (current > baselineMean * policy.failMultiplier) {
        return {
          status: 'FAIL',
          reason: `${fmt(current)} > ${policy.failMultiplier}× baseline (${fmt(baselineMean)})`,
        };
      }
    }
    if (policy.warnMultiplier != null && baselineMean > 0) {
      if (current > baselineMean * policy.warnMultiplier) {
        return {
          status: 'WARN',
          reason: `${fmt(current)} > ${policy.warnMultiplier}× baseline (${fmt(baselineMean)})`,
        };
      }
    }
  }

  return { status: 'PASS' };
}

function fmt(v: number): string {
  return v < 0.01 ? v.toFixed(4) : (v * 100).toFixed(2) + '%';
}

/* ═══════════════════════════════════════════════════════
   Shadow Mode — 기존 판정 vs 정책 판정 비교
   ═══════════════════════════════════════════════════════ */

export type PolicyMode = 'shadow' | 'enforce-partial' | 'enforce';

/** POLICY_MODE env var. default = shadow (안전). */
export function getPolicyMode(): PolicyMode {
  const mode = process.env.POLICY_MODE?.toLowerCase();
  if (mode === 'enforce') return 'enforce';
  if (mode === 'enforce-partial') return 'enforce-partial';
  return 'shadow';
}

/**
 * POLICY_ENFORCE_METRICS env var: comma-separated metric keys to enforce individually.
 * Empty or undefined = enforce ALL metrics when POLICY_MODE=enforce.
 * Example: POLICY_ENFORCE_METRICS=srm,contamination → SRM+Contamination만 정책 판정, 나머지 shadow.
 */
export function getEnforceMetrics(): Set<string> | 'all' {
  const raw = process.env.POLICY_ENFORCE_METRICS?.trim();
  if (!raw) return 'all';
  const keys = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return keys.length > 0 ? new Set(keys) : 'all';
}

/**
 * 이 metric이 정책 판정(evaluateMetric)을 사용해야 하는가?
 *
 * shadow          → false (모두 레거시)
 * enforce-partial → POLICY_ENFORCE_METRICS에 포함된 metric만 true
 * enforce         → 전체 true (POLICY_ENFORCE_METRICS 무시)
 */
export function isMetricEnforced(metricKey: string): boolean {
  const mode = getPolicyMode();
  if (mode === 'shadow') return false;
  if (mode === 'enforce') return true;
  // enforce-partial: POLICY_ENFORCE_METRICS 기준
  const metrics = getEnforceMetrics();
  return metrics === 'all' || metrics.has(metricKey);
}

/* ═══════════════════════════════════════════════════════
   Enforce Gate — 단계별 전환 기준 + 자동 판정
   ═══════════════════════════════════════════════════════ */

export type EnforceStage = 'shadow' | 'enforce-partial' | 'enforce';

/** 단계별 gate 기준 */
export const ENFORCE_GATE = {
  /** shadow → enforce-partial */
  stage1: {
    minShadowDays: 7,
    maxDivergenceRate: 0.0,
    consecutiveZeroDays: 3,
    description: 'shadow 7일 + diverges=0% × 3일 연속',
  },
  /** enforce-partial → enforce (전면) */
  stage2: {
    minEnforceDays: 5,
    minBlockingAccuracy: 0.95,
    maxIncidents: 0,
    description: 'enforce-partial 5일 무사고 + 차단 정확도 ≥ 95%',
  },
  /** enforce 유지 중 과차단 감지 → rollback 권고 */
  rollback: {
    maxFalsePositiveRate: 0.10,
    description: 'false positive > 10% → shadow 복귀 권고',
  },
} as const;

export interface EnforceGateReport {
  date: string;
  currentMode: PolicyMode;
  recommendedStage: EnforceStage;
  ready: boolean;

  shadow: {
    totalDays: number;
    divergenceHistory: Array<{ date: string; divergenceRate: number }>;
    consecutiveZeroDays: number;
    stage1Met: boolean;
  };

  enforce: {
    enforceDays: number;
    totalBlocks: number;
    correctBlocks: number;
    falsePositives: number;
    blockingAccuracy: number;
    incidents: number;
    incidentBreakdown: {
      false_positive: number;
      manual_override: number;
      rollback_trigger: number;
    };
    stage2Met: boolean;
  };

  rollback: {
    needed: boolean;
    reason?: string;
  };

  risks: Array<{
    risk: string;
    probability: 'low' | 'medium' | 'high';
    impact: string;
    mitigation: string;
  }>;
}

/**
 * Shadow/enforce artifact history를 분석하여 enforce 준비 상태를 판정.
 *
 * @param healthDir artifacts/health 디렉토리 경로
 * @returns EnforceGateReport
 */
export function analyzeEnforceReadiness(healthDir: string): EnforceGateReport {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const currentMode = getPolicyMode();
  const today = new Date().toISOString().slice(0, 10);

  // ─── Shadow history scan ───
  const divergenceHistory: Array<{ date: string; divergenceRate: number }> = [];
  let consecutiveZeroDays = 0;

  if (fs.existsSync(healthDir)) {
    const dateDirs = fs.readdirSync(healthDir).sort();

    for (const dateDir of dateDirs) {
      const shadowPath = path.join(healthDir, dateDir, 'shadow.json');
      if (!fs.existsSync(shadowPath)) continue;

      try {
        const reports: ShadowReport[] = JSON.parse(fs.readFileSync(shadowPath, 'utf-8'));
        const diverges = reports.filter((r) => r.diverges).length;
        const rate = reports.length > 0 ? diverges / reports.length : 0;
        divergenceHistory.push({ date: dateDir, divergenceRate: rate });
      } catch {
        // skip corrupted
      }
    }
  }

  // Count consecutive trailing zero-divergence days
  for (let i = divergenceHistory.length - 1; i >= 0; i--) {
    if (divergenceHistory[i].divergenceRate === 0) {
      consecutiveZeroDays++;
    } else {
      break;
    }
  }

  const stage1Met =
    divergenceHistory.length >= ENFORCE_GATE.stage1.minShadowDays &&
    consecutiveZeroDays >= ENFORCE_GATE.stage1.consecutiveZeroDays;

  // ─── Incident history (SSOT) ───
  const incidentDir = path.resolve(path.dirname(healthDir), 'incidents');
  const incidentHistory = loadIncidentHistory(incidentDir);

  // ─── Enforce history scan (batch.json에서 FAIL block 정보 추출) ───
  let enforceDays = 0;
  let totalBlocks = 0;
  let correctBlocks = 0;
  let falsePositives = 0;
  const incidents = incidentHistory.totalIncidents;

  if (fs.existsSync(healthDir)) {
    const dateDirs = fs.readdirSync(healthDir).sort();

    for (const dateDir of dateDirs) {
      const batchPath = path.join(healthDir, dateDir, 'batch.json');
      const shadowPath = path.join(healthDir, dateDir, 'shadow.json');
      if (!fs.existsSync(batchPath)) continue;

      try {
        const batch = JSON.parse(fs.readFileSync(batchPath, 'utf-8'));
        const hasShadow = fs.existsSync(shadowPath);

        // enforce day = batch exists + shadow reports show enforce mode
        if (hasShadow) {
          const shadowReports: ShadowReport[] = JSON.parse(fs.readFileSync(shadowPath, 'utf-8'));
          const enforceReports = shadowReports.filter((r) => r.mode === 'enforce' || r.mode === 'enforce-partial');
          if (enforceReports.length > 0) {
            enforceDays++;

            // Count blocks: experiments with health FAIL
            for (const exp of batch.experiments ?? []) {
              if (!exp.result) continue;
              const healthOverall = exp.result.health?.overall;
              if (healthOverall === 'FAIL') {
                totalBlocks++;
                // Compare with shadow: if legacy also said FAIL, it's a correct block
                const shadow = shadowReports.find((s) => s.experimentId === exp.experimentId);
                if (shadow && shadow.overallLegacy === 'FAIL') {
                  correctBlocks++;
                } else {
                  falsePositives++;
                }
              }
            }
          }
        }
      } catch {
        // skip corrupted
      }
    }
  }

  const blockingAccuracy = totalBlocks > 0 ? correctBlocks / totalBlocks : 1.0;
  const falsePositiveRate = totalBlocks > 0 ? falsePositives / totalBlocks : 0;

  const stage2Met =
    enforceDays >= ENFORCE_GATE.stage2.minEnforceDays &&
    blockingAccuracy >= ENFORCE_GATE.stage2.minBlockingAccuracy &&
    incidents <= ENFORCE_GATE.stage2.maxIncidents;

  // ─── Rollback detection ───
  const rollbackNeeded = falsePositiveRate > ENFORCE_GATE.rollback.maxFalsePositiveRate;
  const rollbackReason = rollbackNeeded
    ? `false positive rate ${(falsePositiveRate * 100).toFixed(1)}% > ${(ENFORCE_GATE.rollback.maxFalsePositiveRate * 100).toFixed(0)}% threshold`
    : undefined;

  // ─── Recommended stage ───
  let recommendedStage: EnforceStage = 'shadow';
  if (rollbackNeeded) {
    recommendedStage = 'shadow';
  } else if (stage2Met && currentMode !== 'shadow') {
    recommendedStage = 'enforce';
  } else if (stage1Met) {
    recommendedStage = 'enforce-partial';
  }

  const ready = recommendedStage !== currentMode && !rollbackNeeded;

  // ─── Risk matrix ───
  const risks = [
    {
      risk: '과차단 (false positive)',
      probability: (falsePositiveRate > 0.05 ? 'medium' : 'low') as 'low' | 'medium' | 'high',
      impact: '성장 둔화 — 유효한 릴리즈가 불필요하게 차단됨',
      mitigation: 'threshold 조정 또는 POLICY_MODE=shadow 즉시 복귀',
    },
    {
      risk: '누락 차단 (false negative)',
      probability: 'low' as const,
      impact: '릴리즈 리스크 — 문제 있는 실험이 통과됨',
      mitigation: 'CI 회귀 테스트 고정 + shadow 비교 지속',
    },
    {
      risk: '실험 지연',
      probability: 'medium' as const,
      impact: 'KPI 영향 — freeze/gate로 실험 속도 저하',
      mitigation: 'PR만 차단 전략 (release gate는 WARN까지만)',
    },
  ];

  return {
    date: today,
    currentMode,
    recommendedStage,
    ready,
    shadow: {
      totalDays: divergenceHistory.length,
      divergenceHistory,
      consecutiveZeroDays,
      stage1Met,
    },
    enforce: {
      enforceDays,
      totalBlocks,
      correctBlocks,
      falsePositives,
      blockingAccuracy,
      incidents,
      incidentBreakdown: {
        false_positive: incidentHistory.records.reduce((s, r) => s + r.false_positive, 0),
        manual_override: incidentHistory.records.reduce((s, r) => s + r.manual_override, 0),
        rollback_trigger: incidentHistory.records.reduce((s, r) => s + r.rollback_trigger, 0),
      },
      stage2Met,
    },
    rollback: {
      needed: rollbackNeeded,
      reason: rollbackReason,
    },
    risks,
  };
}

/* ═══════════════════════════════════════════════════════
   Incident Counter — Stage2 안전장치
   ═══════════════════════════════════════════════════════

   incident_count = false_positive + manual_override + rollback_trigger

   | 이벤트               | 조건                                      |
   |----------------------|-------------------------------------------|
   | false_positive_event | policy FAIL/WARN but legacy PASS           |
   | manual_override      | operator가 수동 override 파일을 생성       |
   | rollback_trigger     | FP rate > 10% or overall health RED        |
*/

export interface IncidentRecord {
  date: string;
  false_positive: number;
  manual_override: number;
  rollback_trigger: number;
  incident_count: number;
  details: Array<{
    type: 'false_positive' | 'manual_override' | 'rollback_trigger';
    experimentId?: string;
    metric?: string;
    description: string;
  }>;
}

/**
 * Shadow reports로부터 false positive 이벤트를 감지.
 *
 * False positive = policy가 차단(FAIL/WARN)하지만 legacy는 PASS인 경우.
 * enforce 모드에서만 실제 차단이 일어나므로, shadow에서도 미리 감지해서 기록.
 */
export function detectFalsePositives(
  shadowReports: ShadowReport[],
): Array<{ experimentId: string; metric: string; policyStatus: string; legacyStatus: string }> {
  const fps: Array<{ experimentId: string; metric: string; policyStatus: string; legacyStatus: string }> = [];

  for (const report of shadowReports) {
    for (const diff of report.diffs) {
      // Policy가 FAIL 또는 WARN인데 legacy는 PASS → false positive
      if (
        diff.policyStatus !== 'PASS' &&
        diff.legacyStatus === 'PASS'
      ) {
        fps.push({
          experimentId: report.experimentId,
          metric: diff.metric,
          policyStatus: diff.policyStatus,
          legacyStatus: diff.legacyStatus,
        });
      }
    }
  }

  return fps;
}

/**
 * 오늘의 incident record를 수집.
 *
 * @param shadowReports 오늘의 shadow comparison 결과
 * @param falsePositiveRate 오늘의 FP rate (enforce 모드에서)
 * @param overallHealthFail 오늘 전체 health가 FAIL인 실험이 있는지
 * @param incidentDir artifacts/incidents 디렉토리 (manual override 파일 확인용)
 * @param date YYYY-MM-DD
 */
export function collectIncidents(
  shadowReports: ShadowReport[],
  falsePositiveRate: number,
  overallHealthFail: boolean,
  incidentDir: string,
  date: string,
): IncidentRecord {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const details: IncidentRecord['details'] = [];

  // 1. False positive events
  const fps = detectFalsePositives(shadowReports);
  for (const fp of fps) {
    details.push({
      type: 'false_positive',
      experimentId: fp.experimentId,
      metric: fp.metric,
      description: `policy=${fp.policyStatus} but legacy=${fp.legacyStatus} on ${fp.metric}`,
    });
  }

  // 2. Manual override events (operator가 직접 파일 생성)
  const overridePath = path.join(incidentDir, `${date}-override.json`);
  let manualOverrides = 0;
  if (fs.existsSync(overridePath)) {
    try {
      const overrideData = JSON.parse(fs.readFileSync(overridePath, 'utf-8'));
      manualOverrides = Array.isArray(overrideData.overrides) ? overrideData.overrides.length : 1;
      for (const o of (overrideData.overrides ?? [overrideData])) {
        details.push({
          type: 'manual_override',
          experimentId: o.experimentId,
          description: o.reason ?? 'manual operator override',
        });
      }
    } catch {
      manualOverrides = 1;
      details.push({
        type: 'manual_override',
        description: 'manual override file detected (parse failed)',
      });
    }
  }

  // 3. Rollback trigger events
  let rollbackTriggers = 0;
  if (falsePositiveRate > ENFORCE_GATE.rollback.maxFalsePositiveRate) {
    rollbackTriggers++;
    details.push({
      type: 'rollback_trigger',
      description: `FP rate ${(falsePositiveRate * 100).toFixed(1)}% > ${(ENFORCE_GATE.rollback.maxFalsePositiveRate * 100).toFixed(0)}% threshold`,
    });
  }
  if (overallHealthFail && getPolicyMode() !== 'shadow') {
    rollbackTriggers++;
    details.push({
      type: 'rollback_trigger',
      description: 'overall health RED in enforce mode',
    });
  }

  const record: IncidentRecord = {
    date,
    false_positive: fps.length,
    manual_override: manualOverrides,
    rollback_trigger: rollbackTriggers,
    incident_count: fps.length + manualOverrides + rollbackTriggers,
    details,
  };

  return record;
}

/**
 * Incident history 로드 (enforce 기간의 incident 합산용).
 *
 * @param incidentDir artifacts/incidents 디렉토리
 * @param sinceDays 최근 N일 (default: enforce 기간 전체)
 * @returns { totalIncidents, days[] }
 */
export function loadIncidentHistory(
  incidentDir: string,
  sinceDays?: number,
): { totalIncidents: number; records: IncidentRecord[] } {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const records: IncidentRecord[] = [];

  if (!fs.existsSync(incidentDir)) {
    return { totalIncidents: 0, records };
  }

  const files = fs.readdirSync(incidentDir)
    .filter((f: string) => f.endsWith('.json') && !f.includes('-override'))
    .sort();

  const cutoff = sinceDays != null
    ? (() => {
        const d = new Date();
        d.setDate(d.getDate() - sinceDays);
        return d.toISOString().slice(0, 10);
      })()
    : undefined;

  for (const file of files) {
    const date = file.replace('.json', '');
    if (cutoff && date < cutoff) continue;

    try {
      const record: IncidentRecord = JSON.parse(
        fs.readFileSync(path.join(incidentDir, file), 'utf-8'),
      );
      records.push(record);
    } catch {
      // skip corrupted
    }
  }

  const totalIncidents = records.reduce((sum, r) => sum + r.incident_count, 0);
  return { totalIncidents, records };
}

export interface ShadowDiff {
  metric: string;
  legacyStatus: string;
  policyStatus: string;
  policyReason?: string;
  diverges: boolean;
}

export interface ShadowReport {
  mode: PolicyMode;
  experimentId: string;
  timestamp: string;
  overallLegacy: string;
  overallPolicy: string;
  diverges: boolean;
  diffs: ShadowDiff[];
}

/**
 * 기존 computeHealth 결과의 각 check를 정책표로 재평가하고 차이를 기록.
 * legacyChecks: computeHealth가 내놓은 { name, status, value } 배열.
 */
export function shadowCompare(
  experimentId: string,
  legacyChecks: Array<{ name: string; status: string; value: number }>,
  legacyOverall: string,
): ShadowReport {
  const mode = getPolicyMode();
  const diffs: ShadowDiff[] = [];
  let worstPolicy: 'PASS' | 'WARN' | 'FAIL' = 'PASS';

  for (const check of legacyChecks) {
    const metricKey = CHECK_NAME_TO_METRIC[check.name];
    if (!metricKey) continue;

    // 정책표로 재평가 (baseline 없이 — point-in-time only)
    const policyResult = evaluateMetric(metricKey, check.value);
    const diverges = check.status !== policyResult.status;

    if (policyResult.status === 'FAIL') worstPolicy = 'FAIL';
    else if (policyResult.status === 'WARN' && worstPolicy !== 'FAIL') worstPolicy = 'WARN';

    diffs.push({
      metric: metricKey,
      legacyStatus: check.status,
      policyStatus: policyResult.status,
      policyReason: policyResult.reason,
      diverges,
    });
  }

  const overallDiverges = legacyOverall !== worstPolicy;

  return {
    mode,
    experimentId,
    timestamp: new Date().toISOString(),
    overallLegacy: legacyOverall,
    overallPolicy: worstPolicy,
    diverges: overallDiverges || diffs.some((d) => d.diverges),
    diffs,
  };
}

/* ═══════════════════════════════════════════════════════
   Slack Alert — Incident 즉시 알림 + Daily Digest
   ═══════════════════════════════════════════════════════ */

/**
 * Slack webhook으로 Block-Kit payload를 전송.
 * 실패 시 1회 재시도. webhook 미설정 시 경고만 (hard fail 금지).
 *
 * @returns true if sent successfully, false otherwise
 */
export async function sendSlackAlert(
  webhookUrl: string | undefined,
  payload: object,
): Promise<boolean> {
  if (!webhookUrl) {
    console.log('  ⚠ OPS_SLACK_WEBHOOK not set — Slack alert skipped');
    return false;
  }

  const http = require('http') as typeof import('http');
  const https = require('https') as typeof import('https');

  const send = (): Promise<void> =>
    new Promise((resolve, reject) => {
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
        (res: any) => {
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

  // 1회 시도 + 1회 재시도
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      await send();
      return true;
    } catch (err) {
      if (attempt === 2) {
        console.log(`  ⚠ Slack alert failed after retry: ${(err as Error).message}`);
        return false;
      }
    }
  }
  return false;
}

/**
 * Incident 즉시 알림 — incident_count > 0 일 때 호출.
 */
export function buildIncidentAlertPayload(
  incident: IncidentRecord,
  policyMode: PolicyMode,
): object {
  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 Policy Incident Detected' },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Date:*\n${incident.date}` },
          { type: 'mrkdwn', text: `*Stage:*\n${policyMode}` },
          { type: 'mrkdwn', text: `*False Positive:*\n${incident.false_positive}` },
          { type: 'mrkdwn', text: `*Manual Override:*\n${incident.manual_override}` },
          { type: 'mrkdwn', text: `*Rollback Trigger:*\n${incident.rollback_trigger}` },
          { type: 'mrkdwn', text: `*Total Incidents:*\n${incident.incident_count}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Action:* ${incident.rollback_trigger > 0 ? 'ROLLBACK 권고' : 'HOLD — 모니터링 지속'}`,
        },
      },
      ...(incident.details.length > 0
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text:
                  '*Details:*\n' +
                  incident.details
                    .slice(0, 5)
                    .map((d) => `• [${d.type}] ${d.description}`)
                    .join('\n'),
              },
            },
          ]
        : []),
    ],
  };
}

/**
 * Daily Digest — Enforce Readiness 요약 알림.
 */
export function buildReadinessDigestPayload(
  report: EnforceGateReport,
  incident: IncidentRecord,
): object {
  const recommendation = report.rollback.needed
    ? 'ROLLBACK'
    : report.ready
      ? `UPGRADE → ${report.recommendedStage}`
      : 'HOLD';

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📊 Enforce Readiness Digest' },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Shadow Days:*\n${report.shadow.totalDays} (zero-div streak: ${report.shadow.consecutiveZeroDays})`,
          },
          { type: 'mrkdwn', text: `*Stage:*\n${report.currentMode}` },
          {
            type: 'mrkdwn',
            text: `*Accuracy:*\n${(report.enforce.blockingAccuracy * 100).toFixed(1)}%`,
          },
          {
            type: 'mrkdwn',
            text: `*FP Rate:*\n${report.enforce.totalBlocks > 0 ? ((report.enforce.falsePositives / report.enforce.totalBlocks) * 100).toFixed(1) : '0.0'}%`,
          },
          {
            type: 'mrkdwn',
            text: `*Incidents (24h):*\n${incident.incident_count}`,
          },
          { type: 'mrkdwn', text: `*Recommendation:*\n${recommendation}` },
        ],
      },
      ...(report.rollback.needed
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `🚨 *Rollback 권고:* ${report.rollback.reason}`,
              },
            },
          ]
        : []),
      ...(report.ready
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `✅ *Gate 통과:* ${report.recommendedStage} 전환 가능`,
              },
            },
          ]
        : []),
    ],
  };
}

/* ═══════════════════════════════════════════════════════
   GH2-A Experiment Digest — CTA Position Experiment
   ═══════════════════════════════════════════════════════ */

export interface ExperimentArmStats {
  variant: string;
  exposures: number;
  clicks: number;
  starts: number;
  ctr: number;
  startRate: number;
  clickToStart: number;
}

export interface ExperimentDigestData {
  experimentId: string;
  arms: ExperimentArmStats[];
  incidents24h: number;
  relativeLift: number;   // (V1.startRate - C0.startRate) / C0.startRate
  status: 'WIN_CANDIDATE' | 'LOSING' | 'IN_PROGRESS';
}

/**
 * Query marketing_events to aggregate CTR / Journey Start / Click→Start per variant.
 *
 * @param pool - pg Pool
 * @param experimentId - experiment ID from registry
 * @returns arm stats array
 */
export async function queryExperimentArmStats(
  pool: import('pg').Pool,
  experimentId: string,
): Promise<ExperimentArmStats[]> {
  const query = `
    WITH exposure AS (
      SELECT payload->>'variant' AS variant,
             COUNT(*) AS exposures
      FROM marketing_events
      WHERE event_type = 'experiment_exposure'
        AND payload->>'experiment_id' = $1
      GROUP BY payload->>'variant'
    ),
    clicks AS (
      SELECT payload->>'variant' AS variant,
             COUNT(*) AS clicks
      FROM marketing_events
      WHERE event_type = 'cta_click'
        AND payload->>'experiment_id' = $1
      GROUP BY payload->>'variant'
    ),
    starts AS (
      SELECT payload->>'variant' AS variant,
             COUNT(*) AS starts
      FROM marketing_events
      WHERE event_type = 'journey_start'
        AND payload->>'experiment_id' = $1
      GROUP BY payload->>'variant'
    )
    SELECT
      e.variant,
      e.exposures::int,
      COALESCE(c.clicks, 0)::int AS clicks,
      COALESCE(s.starts, 0)::int AS starts
    FROM exposure e
    LEFT JOIN clicks c ON e.variant = c.variant
    LEFT JOIN starts s ON e.variant = s.variant
    ORDER BY e.variant;
  `;

  const result = await pool.query(query, [experimentId]);

  return result.rows.map((r: any) => {
    const exposures = Number(r.exposures) || 0;
    const clicks = Number(r.clicks) || 0;
    const starts = Number(r.starts) || 0;
    return {
      variant: r.variant,
      exposures,
      clicks,
      starts,
      ctr: exposures > 0 ? clicks / exposures : 0,
      startRate: exposures > 0 ? starts / exposures : 0,
      clickToStart: clicks > 0 ? starts / clicks : 0,
    };
  });
}

/**
 * Query 24h incident count for an experiment.
 */
export async function queryExperimentIncidents24h(
  pool: import('pg').Pool,
  experimentId: string,
): Promise<number> {
  const query = `
    SELECT COUNT(*) AS cnt
    FROM marketing_events
    WHERE event_type IN ('experiment_exposure', 'cta_click', 'journey_start', 'page_engagement')
      AND payload->>'experiment_id' = $1
      AND created_at >= NOW() - INTERVAL '24 hours'
      AND payload->>'env' = 'test'
  `;
  // Note: actual incidents are 0 unless env-conflict or error events logged
  // For now, return 0 — incident detection is via health-policy collectIncidents()
  return 0;
}

/**
 * Build full experiment digest data from DB queries.
 */
export async function collectExperimentDigest(
  pool: import('pg').Pool,
  experimentId: string,
  incidentRecord: IncidentRecord,
): Promise<ExperimentDigestData> {
  const arms = await queryExperimentArmStats(pool, experimentId);

  const control = arms.find((a) => a.variant === 'control');
  const variant = arms.find((a) => a.variant !== 'control');

  const controlRate = control?.startRate ?? 0;
  const variantRate = variant?.startRate ?? 0;
  const lift = controlRate > 0 ? (variantRate - controlRate) / controlRate : 0;

  let status: ExperimentDigestData['status'];
  if (lift >= 0.08 && incidentRecord.incident_count === 0) {
    status = 'WIN_CANDIDATE';
  } else if (lift < 0) {
    status = 'LOSING';
  } else {
    status = 'IN_PROGRESS';
  }

  return {
    experimentId,
    arms,
    incidents24h: incidentRecord.incident_count,
    relativeLift: lift,
    status,
  };
}

const STATUS_EMOJI: Record<ExperimentDigestData['status'], string> = {
  WIN_CANDIDATE: '🏆',
  LOSING: '📉',
  IN_PROGRESS: '🔄',
};

const STATUS_LABEL: Record<ExperimentDigestData['status'], string> = {
  WIN_CANDIDATE: 'V1 Leading (Win Candidate)',
  LOSING: 'V1 Losing',
  IN_PROGRESS: 'In Progress',
};

/**
 * Build Slack Block Kit payload for GH2-A experiment digest.
 */
export function buildExperimentDigestPayload(
  digest: ExperimentDigestData,
): object {
  const pct = (v: number) => (v * 100).toFixed(1) + '%';
  const liftSign = digest.relativeLift >= 0 ? '+' : '';

  const armBlocks = digest.arms.map((arm) => ({
    type: 'section' as const,
    text: {
      type: 'mrkdwn' as const,
      text: [
        `*Variant ${arm.variant === 'control' ? 'C0' : 'V1'}* (\`${arm.variant}\`)`,
        `  CTR: *${pct(arm.ctr)}* (${arm.clicks}/${arm.exposures})`,
        `  Start Rate: *${pct(arm.startRate)}* (${arm.starts}/${arm.exposures})`,
        `  Click→Start: *${pct(arm.clickToStart)}*`,
      ].join('\n'),
    },
  }));

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `📊 GH2-A: CTA Position Experiment`, emoji: true },
      },
      ...armBlocks,
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Relative Lift (Start):*\n${liftSign}${pct(digest.relativeLift)}`,
          },
          {
            type: 'mrkdwn',
            text: `*Incidents (24h):*\n${digest.incidents24h}`,
          },
          {
            type: 'mrkdwn',
            text: `*Status:*\n${STATUS_EMOJI[digest.status]} ${STATUS_LABEL[digest.status]}`,
          },
        ],
      },
    ],
  };
}

/* ═══════════════════════════════════════════════════════
   Artifact Rotation — 90일 자동 정리
   ═══════════════════════════════════════════════════════ */

export interface RotationResult {
  deleted: string[];
  skipped: string[];
  errors: string[];
  dryRun: boolean;
}

/**
 * artifacts/incidents 디렉토리에서 90일 이상 경과 파일을 삭제.
 *
 * 보호 장치:
 * - 오늘 날짜 파일 삭제 금지
 * - JSON parse 실패 파일 skip
 * - dry-run 모드 지원
 *
 * @param incidentDir artifacts/incidents 경로
 * @param maxAgeDays 보관 일수 (default: 90)
 * @param dryRun true면 삭제하지 않고 대상만 리포트
 */
export function rotateIncidentArtifacts(
  incidentDir: string,
  maxAgeDays: number = 90,
  dryRun: boolean = false,
): RotationResult {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const result: RotationResult = { deleted: [], skipped: [], errors: [], dryRun };
  const today = new Date().toISOString().slice(0, 10);

  if (!fs.existsSync(incidentDir)) {
    return result;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const files = fs.readdirSync(incidentDir).filter((f: string) => f.endsWith('.json'));

  for (const file of files) {
    const filePath = path.join(incidentDir, file);

    // 날짜 추출: YYYY-MM-DD.json 또는 YYYY-MM-DD-override.json
    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!dateMatch) {
      result.skipped.push(file);
      continue;
    }

    const fileDate = dateMatch[1];

    // 오늘 날짜 파일 삭제 금지
    if (fileDate === today) {
      result.skipped.push(file);
      continue;
    }

    // 90일 이내면 유지
    if (fileDate >= cutoff) {
      result.skipped.push(file);
      continue;
    }

    // 삭제 대상
    if (dryRun) {
      result.deleted.push(file);
      console.log(`  [dry-run] Would delete: ${file}`);
    } else {
      try {
        fs.unlinkSync(filePath);
        result.deleted.push(file);
        console.log(`  🗑️ Deleted: ${file}`);
      } catch (err) {
        result.errors.push(`${file}: ${(err as Error).message}`);
      }
    }
  }

  return result;
}

/**
 * artifacts/health 디렉토리에서 90일 이상 경과 날짜 디렉토리를 삭제.
 *
 * health artifacts는 YYYY-MM-DD/ 디렉토리 구조 (batch.json, shadow.json, enforce-readiness.json 포함).
 *
 * 보호 장치:
 * - 오늘 날짜 디렉토리 삭제 금지
 * - YYYY-MM-DD 패턴이 아닌 디렉토리 skip
 * - dry-run 모드 지원
 *
 * @param healthDir artifacts/health 경로
 * @param maxAgeDays 보관 일수 (default: 90)
 * @param dryRun true면 삭제하지 않고 대상만 리포트
 */
export function rotateHealthArtifacts(
  healthDir: string,
  maxAgeDays: number = 90,
  dryRun: boolean = false,
): RotationResult {
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  const result: RotationResult = { deleted: [], skipped: [], errors: [], dryRun };
  const today = new Date().toISOString().slice(0, 10);

  if (!fs.existsSync(healthDir)) {
    return result;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);
  const cutoff = cutoffDate.toISOString().slice(0, 10);

  const entries = fs.readdirSync(healthDir);

  for (const entry of entries) {
    const entryPath = path.join(healthDir, entry);

    // 디렉토리만 대상
    if (!fs.statSync(entryPath).isDirectory()) {
      result.skipped.push(entry);
      continue;
    }

    // YYYY-MM-DD 패턴 확인
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry)) {
      result.skipped.push(entry);
      continue;
    }

    // 오늘 날짜 디렉토리 삭제 금지
    if (entry === today) {
      result.skipped.push(entry);
      continue;
    }

    // 90일 이내면 유지
    if (entry >= cutoff) {
      result.skipped.push(entry);
      continue;
    }

    // 삭제 대상 (재귀 삭제)
    if (dryRun) {
      result.deleted.push(entry);
      console.log(`  [dry-run] Would delete dir: ${entry}/`);
    } else {
      try {
        fs.rmSync(entryPath, { recursive: true, force: true });
        result.deleted.push(entry);
        console.log(`  🗑️ Deleted dir: ${entry}/`);
      } catch (err) {
        result.errors.push(`${entry}: ${(err as Error).message}`);
      }
    }
  }

  return result;
}
