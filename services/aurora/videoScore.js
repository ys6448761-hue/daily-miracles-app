/**
 * Aurora CIx-Video 점수 산출 모듈
 * VID-003~004
 *
 * 최소 통과 기준: CIx-Video ≥ 70
 *
 * 점수 구성 (합계 100):
 *   Gate 통과          20점  gatePassed
 *   자막 무결성         20점  subtitleIntegrity   (KOR-01~05 all pass)
 *   폰트 번들 존재       10점  fontBundleExists
 *   산출물 길이 정확     10점  artifactDurationOk  (≈ 30s ±1s)
 *   상태머신 완료        20점  stateMachineComplete (status = DONE)
 *   현 단계 완료        10점  currentStageDone
 *   회귀 테스트 통과     10점  regressionPassed
 *
 * 상태: excellent≥90, good≥80, acceptable≥70, critical<70
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// ── 점수 배점 ──────────────────────────────────────────────────────────────
const WEIGHTS = {
  gatePassed:           20,
  subtitleIntegrity:    20,
  fontBundleExists:     10,
  artifactDurationOk:   10,
  stateMachineComplete: 20,
  currentStageDone:     10,
  regressionPassed:     10,
};

const THRESHOLD = 70;

const STATUS_MAP = [
  { min: 90, label: 'excellent', emoji: '🟢' },
  { min: 80, label: 'good',      emoji: '🟢' },
  { min: 70, label: 'acceptable',emoji: '🟡' },
  { min:  0, label: 'critical',  emoji: '🔴' },
];

// ── 번들 폰트 경로 ─────────────────────────────────────────────────────────
const FONT_PATH = path.resolve('assets/fonts/NotoSansKR-Regular.ttf');

// ── 헬퍼 ──────────────────────────────────────────────────────────────────
function getStatus(score) {
  for (const { min, label, emoji } of STATUS_MAP) {
    if (score >= min) return { label, emoji };
  }
  return { label: 'critical', emoji: '🔴' };
}

/**
 * ffprobe로 영상 재생 시간 조회 (초)
 * @param {string} videoPath
 * @returns {number|null}
 */
function probeDuration(videoPath) {
  if (!videoPath || !fs.existsSync(videoPath)) return null;
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      videoPath,
    ], { stdio: ['pipe', 'pipe', 'pipe'] });
    const json = JSON.parse(out.toString());
    return parseFloat(json.format?.duration || '0');
  } catch {
    return null;
  }
}

// ── 메인 API ───────────────────────────────────────────────────────────────
/**
 * CIx-Video 점수 계산
 *
 * @param {object} signals
 * @param {boolean}  signals.gatePassed           - collisionValidator 통과
 * @param {boolean}  signals.subtitleIntegrity    - KOR Gate 5항목 all pass
 * @param {boolean}  signals.fontBundleExists     - assets/fonts/NotoSansKR-Regular.ttf 존재
 * @param {boolean}  signals.artifactDurationOk   - final.mp4 재생 시간 ≈ 30s ±1s
 * @param {boolean}  signals.stateMachineComplete - Job status = DONE
 * @param {boolean}  signals.currentStageDone     - 현재 단계 모두 완료
 * @param {boolean}  signals.regressionPassed     - ssot 회귀 통과
 *
 * @returns {{
 *   score:      number,
 *   passed:     boolean,
 *   status:     { label: string, emoji: string },
 *   breakdown:  { [key]: { score: number, max: number, pass: boolean } },
 *   summary:    string,
 * }}
 */
function calculate(signals = {}) {
  let total     = 0;
  const breakdown = {};

  for (const [key, maxScore] of Object.entries(WEIGHTS)) {
    const flagVal = signals[key];
    const pass    = flagVal === true;
    const score   = pass ? maxScore : 0;
    total        += score;
    breakdown[key] = { score, max: maxScore, pass };
  }

  const score  = Math.max(0, Math.min(100, total));
  const passed = score >= THRESHOLD;
  const status = getStatus(score);

  const failedItems = Object.entries(breakdown)
    .filter(([, v]) => !v.pass)
    .map(([k]) => k);

  const summary = passed
    ? `${status.emoji} CIx-Video ${score}점 (통과 기준 ${THRESHOLD})`
    : `${status.emoji} CIx-Video ${score}점 — 릴리즈 불가 (미달 항목: ${failedItems.join(', ')})`;

  return { score, passed, status, breakdown, summary };
}

/**
 * 환경에서 신호를 자동 수집하여 점수 계산 (편의 API)
 *
 * @param {object} ctx
 * @param {boolean}  ctx.gatePassed
 * @param {object}   [ctx.korGate]        - runKorGate() 결과
 * @param {string}   [ctx.finalVideoPath] - final.mp4 경로 (duration 자동 체크)
 * @param {string}   [ctx.jobStatus]      - aurora_video_jobs.status 값
 * @param {boolean}  [ctx.regressionPassed]
 * @returns {ReturnType<typeof calculate>}
 */
function calculateFromContext(ctx = {}) {
  const fontExists     = fs.existsSync(FONT_PATH);
  const duration       = probeDuration(ctx.finalVideoPath);
  const durationOk     = duration !== null && Math.abs(duration - 30) <= 1.5;
  const korAllPassed   = ctx.korGate ? ctx.korGate.allPassed : false;
  const smComplete     = ctx.jobStatus === 'DONE';
  const currentDone    = smComplete && korAllPassed && fontExists;

  return calculate({
    gatePassed:           !!ctx.gatePassed,
    subtitleIntegrity:    korAllPassed,
    fontBundleExists:     fontExists,
    artifactDurationOk:   durationOk,
    stateMachineComplete: smComplete,
    currentStageDone:     currentDone,
    regressionPassed:     !!ctx.regressionPassed,
  });
}

/**
 * 점수 결과 출력 (CLI 리포트용)
 * @param {ReturnType<typeof calculate>} result
 */
function printReport(result) {
  const { score, passed, status, breakdown, summary } = result;

  console.log('\n  ── CIx-Video 점수 ─────────────────────────────');
  console.log(`  ${summary}`);
  console.log('  항목별 배점:');

  const labels = {
    gatePassed:           'Gate 통과',
    subtitleIntegrity:    '자막 무결성',
    fontBundleExists:     '폰트 번들 존재',
    artifactDurationOk:   '산출물 길이 정확',
    stateMachineComplete: '상태머신 완료',
    currentStageDone:     '현 단계 완료',
    regressionPassed:     '회귀 테스트 통과',
  };

  for (const [key, { score: s, max, pass }] of Object.entries(breakdown)) {
    const mark = pass ? '✓' : '✗';
    const label = labels[key] || key;
    console.log(`    ${mark} ${label.padEnd(16)} ${String(s).padStart(3)}/${max}`);
  }

  console.log(`  ──────────────────────────────────────────────`);
  console.log(`  합계: ${score}/100  ${passed ? '(릴리즈 가능)' : '(릴리즈 불가)'}`);
  console.log('');
}

// ── 가중치 검증 (합계 = 100) ───────────────────────────────────────────────
function assertWeightsSum() {
  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    throw new Error(`CIx-Video 가중치 합 오류: ${total} (100이어야 함)`);
  }
}
assertWeightsSum();

module.exports = {
  calculate,
  calculateFromContext,
  printReport,
  getStatus,
  probeDuration,
  WEIGHTS,
  THRESHOLD,
};
