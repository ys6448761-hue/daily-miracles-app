/**
 * send-slack-report.js — Aurora 5 KPI Slack 자동 리포트
 *
 * 실행: node scripts/send-slack-report.js [--days 7]
 * 환경변수: DATABASE_URL, OPS_SLACK_WEBHOOK
 *
 * GitHub Actions daily cron에서 호출됨.
 * kpi-report.js의 run()을 실행한 뒤 Block Kit 메시지로 Slack 전송.
 */

'use strict';

require('dotenv').config();

const https   = require('https');
const { run: runKpi } = require('./kpi-report');

const WEBHOOK = process.env.OPS_SLACK_WEBHOOK;

if (!WEBHOOK) {
  console.error('❌ OPS_SLACK_WEBHOOK 환경변수 미설정');
  process.exit(1);
}

// ── Slack https 전송 ─────────────────────────────────────────────
function postSlack(payload) {
  return new Promise((resolve) => {
    const url      = new URL(WEBHOOK);
    const postData = JSON.stringify(payload);

    const req = https.request({
      hostname: url.hostname,
      port:     443,
      path:     url.pathname + (url.search || ''),
      method:   'POST',
      headers:  {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 10000,
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: `HTTP ${res.statusCode}: ${body}` });
        }
      });
    });

    req.on('error',   err => resolve({ ok: false, error: err.message }));
    req.on('timeout', ()  => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });

    req.write(postData);
    req.end();
  });
}

// ── 판정 색상 → Slack emoji ──────────────────────────────────────
function verdictEmoji(status) {
  return { success: '🟢', partial: '🟡', rollback: '🔴', no_change: '🟣', insufficient_data: '⬜' }[status] ?? '⬜';
}

// ── 지표 델타 문자열 ─────────────────────────────────────────────
function delta(current, baseline, key, unit = '') {
  if (current[key] == null || !baseline || baseline[key] == null) return '—';
  const diff = parseFloat(current[key]) - parseFloat(baseline[key]);
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}${unit}`;
}

// ── Block Kit 페이로드 생성 ──────────────────────────────────────
function buildPayload(report) {
  const { period, generated, current: r, baseline, verdict } = report;
  const kstDate = new Date(generated).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' });
  const emoji   = verdictEmoji(verdict.status);

  const lines = [
    `*재시도율*   \`${r.retry_rate ?? '—'}%\`  (기준: ${baseline?.retry_rate ?? '—'}%  /  목표: -30%)  ${delta(r, baseline, 'retry_rate', '%')}`,
    `*평균 턴*     \`${r.avg_turns ?? '—'}턴\`  (기준: ${baseline?.avg_turns ?? '—'}  /  목표: -20~40%)  ${delta(r, baseline, 'avg_turns', '턴')}`,
    `*응답 길이*  \`${r.avg_length ?? '—'}자\`  (기준: ${baseline?.avg_length ?? '—'}  /  목표: -30~50%)  ${delta(r, baseline, 'avg_length', '자')}`,
    `*작업 수*     시작 ${r.total_tasks ?? 0} / 완료 ${r.total_completed ?? 0} / 재시도 ${r.total_retries ?? 0}`,
  ].join('\n');

  return {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} Aurora 5 KPI — ${period} 리포트`, emoji: true },
      },
      { type: 'divider' },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: lines },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${emoji} *판정: ${verdict.label}*\n>${verdict.message}` },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `생성: ${kstDate} KST  |  /admin/kpi 에서 전체 대시보드 확인` }],
      },
    ],
  };
}

// ── 메인 ─────────────────────────────────────────────────────────
async function main() {
  console.log('📊 KPI 집계 중...');
  const report = await runKpi();

  console.log('📨 Slack 전송 중...');
  const payload = buildPayload(report);
  const result  = await postSlack(payload);

  if (result.ok) {
    console.log('✅ Slack 리포트 전송 완료');
  } else {
    console.error('❌ Slack 전송 실패:', result.error);
    process.exit(1);
  }
}

main().catch(e => {
  console.error('❌ 리포트 실패:', e.message);
  process.exit(1);
});
