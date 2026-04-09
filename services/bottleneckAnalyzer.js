/**
 * bottleneckAnalyzer.js — 병목 자동 분석 SSOT
 *
 * analyzeBottleneck(kpi)와 동일한 로직을 사람이 읽기 쉬운 텍스트 리포트로 변환.
 * dreamtownFlowService.analyzeBottleneck을 SSOT로 사용 — 직접 로직 복제 금지.
 *
 * 사용:
 *   const { analyze, buildReport } = require('./bottleneckAnalyzer');
 *   const result = analyze(kpi);       // { bottleneck, cause, action, ... }
 *   const text   = buildReport(result); // Slack/로그용 텍스트
 */

'use strict';

const { analyzeBottleneck } = require('./dreamtownFlowService');

/**
 * KPI → 병목 분석
 * @param {object} kpi — getKpiSummary() 결과
 * @returns {{ status, stage, cause, cause_detail, action, rate, threshold, gap, target } | null}
 */
function analyze(kpi) {
  return analyzeBottleneck(kpi);
}

/**
 * 분석 결과 → 액션 추천 1줄
 */
function generateAction(result) {
  if (!result || result.status === 'healthy') return '모니터링 유지';
  return result.action;
}

/**
 * 분석 결과 → Slack/로그 텍스트 리포트
 */
function buildReport(kpiRaw, result, period = '7d') {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  if (!result || result.status === 'healthy') {
    return [
      `📊 *DreamTown 병목 리포트* (${period}) — ${now}`,
      ``,
      `✅ 모든 단계 목표 달성 — 병목 없음`,
      `→ 유지 전략 유지`,
    ].join('\n');
  }

  const starRate    = kpiRaw?.star_creation_rate  ?? '?';
  const growthEntry = kpiRaw?.star_count > 0
    ? Math.round((kpiRaw.growth_day1_count ?? 0) / kpiRaw.star_count * 100)
    : '?';
  const growthPersist = kpiRaw?.growth_persist_rate ?? '?';
  const resonRate   = kpiRaw?.resonance_rate ?? '?';

  return [
    `📊 *DreamTown 병목 리포트* (${period}) — ${now}`,
    ``,
    `*퍼널 현황*`,
    `  Star 생성:    ${starRate}%  (목표 70%+)`,
    `  Growth 진입:  ${growthEntry}%  (목표 60%+)`,
    `  Growth 유지:  ${growthPersist}%  (목표 50%+)`,
    `  Resonance:    ${resonRate}%  (목표 20%+)`,
    ``,
    `*병목 → ${result.stage}* 단계  (현재 ${result.rate}%  목표 ${result.threshold}%+)`,
    `*원인 →* ${result.cause_detail}`,
    `*액션 →* ${result.action}`,
    `*목표 →* ${result.rate}% → ${result.target}%  (${period})`,
  ].join('\n');
}

module.exports = { analyze, generateAction, buildReport };
