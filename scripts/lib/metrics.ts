/**
 * Metric SSOT — Single Source of Truth for primary metrics.
 *
 * 모든 primaryMetric 정의는 여기서만 관리.
 * metric 추가 시 반드시 calculationModule + column을 지정해야 함.
 * validateMetricCoverage()가 빌드/CI에서 누락을 자동 감지.
 */

export interface MetricDefinition {
  /** metric 식별자 (registry.json의 primaryMetric 값) */
  key: string;
  /** 인간이 읽을 수 있는 이름 */
  label: string;
  /** 계산 로직이 구현된 모듈 경로 (상대경로) */
  calculationModule: string;
  /** 계산에 사용되는 DB 컬럼/필드 */
  sourceColumns: string[];
  /** 계산 공식 설명 */
  formula: string;
}

/**
 * 지원되는 primaryMetric 정의 목록.
 *
 * ⚠ 새 metric 추가 시:
 *   1. 여기에 MetricDefinition 추가
 *   2. calculationModule에 실제 계산 로직 구현
 *   3. CI에서 validateMetricCoverage() 통과 확인
 */
export const METRIC_REGISTRY: MetricDefinition[] = [
  {
    key: 'approval_rate',
    label: 'Approval Rate',
    calculationModule: '../evaluate-experiment',
    sourceColumns: ['Post.status', 'AdminLog.action'],
    formula: 'approvals (status=APPROVED) / exposures (action=REDIRECT)',
  },
  {
    key: 'approvalConversionRate',
    label: 'Approval Conversion Rate',
    calculationModule: '../evaluate-experiment',
    sourceColumns: ['Post.status', 'AdminLog.action'],
    formula: 'approvals (status=APPROVED) / exposures (action=REDIRECT)',
  },
  {
    key: 'ctr',
    label: 'Click-Through Rate',
    calculationModule: '../evaluate-experiment',
    sourceColumns: ['marketing_events.event_type', 'marketing_events.payload'],
    formula: 'cta_click events / experiment_exposure events (same experiment_id, variant)',
  },
  {
    key: 'journey_start_rate',
    label: 'Journey Start Rate',
    calculationModule: '../evaluate-experiment',
    sourceColumns: ['marketing_events.event_type', 'marketing_events.payload'],
    formula: 'journey_start events / experiment_exposure events (same experiment_id, variant)',
  },
];

/** primaryMetric key 목록 (registry validation용) */
export const SUPPORTED_PRIMARY_METRICS = METRIC_REGISTRY.map((m) => m.key);

/**
 * Metric coverage 검증.
 * 모든 등록된 metric의 calculationModule이 실제 존재하는지 확인.
 *
 * @returns 오류 목록 (빈 배열 = 통과)
 */
export function validateMetricCoverage(): string[] {
  const errors: string[] = [];
  const fs = require('fs') as typeof import('fs');
  const path = require('path') as typeof import('path');

  for (const metric of METRIC_REGISTRY) {
    // Resolve module path relative to this file
    const resolved = path.resolve(__dirname, metric.calculationModule);
    const candidates = [
      resolved + '.ts',
      resolved + '.js',
      resolved + '/index.ts',
      resolved + '/index.js',
    ];

    const exists = candidates.some((c) => fs.existsSync(c));
    if (!exists) {
      errors.push(
        `Metric "${metric.key}": calculationModule "${metric.calculationModule}" not found`,
      );
    }
  }

  // Check for duplicate keys
  const keys = METRIC_REGISTRY.map((m) => m.key);
  const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
  for (const d of new Set(dupes)) {
    errors.push(`Metric "${d}": duplicate key in METRIC_REGISTRY`);
  }

  return errors;
}
