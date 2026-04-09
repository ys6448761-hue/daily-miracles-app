/**
 * bottleneck-report.js — DreamTown 병목 자동 리포트 (독립 실행)
 *
 * 실행:  node scripts/bottleneck-report.js [--days 7]
 * CRON:  0 10 * * 1  (매주 월요일 오전 10시 KST = 01:00 UTC)
 * 환경:  DATABASE_URL, OPS_SLACK_WEBHOOK
 *
 * 역할: KPI 수집 → 병목 자동 분석 → 원인/액션 자동 생성 → Slack 전송
 * 사람 없이 자동 완결 — 실행 결과만 확인하면 됨
 */

'use strict';

require('dotenv').config();

const https   = require('https');
const flowSvc = require('../services/dreamtownFlowService');
const { analyze, buildReport } = require('../services/bottleneckAnalyzer');

const WEBHOOK = process.env.OPS_SLACK_WEBHOOK;
const DAYS    = (() => {
  const idx = process.argv.indexOf('--days');
  return idx !== -1 ? parseInt(process.argv[idx + 1], 10) || 7 : 7;
})();

if (!WEBHOOK) {
  console.error('❌ OPS_SLACK_WEBHOOK 환경변수 미설정');
  process.exit(1);
}

function sendSlack(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ text });
    const url  = new URL(WEBHOOK);

    const req = https.request({
      hostname: url.hostname,
      path:     url.pathname + url.search,
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      res.resume();
      resolve(res.statusCode);
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('[bottleneck-report] 시작:', new Date().toISOString());

  // 1. KPI 수집
  const kpi    = await flowSvc.getKpiSummary({ days: DAYS });

  // 2. 병목 분석
  const result = analyze(kpi);

  // 3. 리포트 텍스트 생성
  const text   = buildReport(kpi, result, `${DAYS}d`);

  console.log(text);

  // 4. Slack 전송
  const status = await sendSlack(text);
  console.log(`[bottleneck-report] Slack 전송 완료 (HTTP ${status})`);

  process.exit(0);
}

main().catch(e => {
  console.error('[bottleneck-report] Fatal:', e.message);
  process.exit(1);
});
