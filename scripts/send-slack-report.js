/**
 * send-slack-report.js — Aurora 5 + DreamTown KPI Slack 자동 리포트
 *
 * 실행: node scripts/send-slack-report.js [--days 7]
 * 환경변수: DATABASE_URL, OPS_SLACK_WEBHOOK
 *
 * 두 섹션:
 *   1. Aurora 5 KPI (재시도율/턴수/응답길이) — Claude Code 개발 효율
 *   2. DreamTown KPI (별생성률/성장지속률/공명률) — 사용자 흐름 건강도
 */

'use strict';

require('dotenv').config();

const https             = require('https');
const { run: runKpi }   = require('./kpi-report');
const flowSvc           = require('../services/dreamtownFlowService');

const WEBHOOK = process.env.OPS_SLACK_WEBHOOK;

if (!WEBHOOK) {
  console.error('❌ OPS_SLACK_WEBHOOK 환경변수 미설정');
  process.exit(1);
}

// ── CLI 인자 ──────────────────────────────────────────────────
const args    = process.argv.slice(2);
const daysArg = args.indexOf('--days');
const DAYS    = daysArg !== -1 ? parseInt(args[daysArg + 1], 10) : 7;

// ── Slack https 전송 ──────────────────────────────────────────
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
        resolve(res.statusCode === 200 ? { ok: true } : { ok: false, error: `HTTP ${res.statusCode}: ${body}` });
      });
    });

    req.on('error',   err => resolve({ ok: false, error: err.message }));
    req.on('timeout', ()  => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });

    req.write(postData);
    req.end();
  });
}

// ── 헬퍼 ──────────────────────────────────────────────────────
function auroraEmoji(status) {
  return { success: '🟢', partial: '🟡', rollback: '🔴', no_change: '🟣', insufficient_data: '⬜' }[status] ?? '⬜';
}

function dtEmoji(status) {
  return { success: '🟢', partial: '🟡', weak: '🟠', critical: '🔴', insufficient_data: '⬜' }[status] ?? '⬜';
}

function delta(current, baseline, key, unit = '') {
  if (current[key] == null || !baseline || baseline[key] == null) return '—';
  const diff = parseFloat(current[key]) - parseFloat(baseline[key]);
  const sign = diff > 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}${unit}`;
}

function pct(val) {
  return val != null ? `${val}%` : '—';
}

// ── 개선 제안 포맷 ─────────────────────────────────────────────
function formatActionPlan(actions) {
  if (!actions || !actions.length) return '✅ 개선 필요 없음';

  return actions.map(a => {
    const sevEmoji = a.severity === 'high' ? '🚨' : '⚠️';
    return `${sevEmoji} *${a.problem}*  현재 ${a.current}% → 목표 ${a.target}%\n담당: ${a.owner.join(', ')}\n${a.actions.map(x => `• ${x}`).join('\n')}`;
  }).join('\n\n');
}

// ── Block Kit 빌드 ────────────────────────────────────────────
function buildPayload({ aurora, dtKpi, dtVerdict, actionPlan, period, kstDate }) {
  const { current: r, baseline, verdict: av } = aurora;
  const ae = auroraEmoji(av.status);
  const de = dtEmoji(dtVerdict.status);
  const hasCritical = actionPlan?.some(a => a.severity === 'high') ?? false;

  // Aurora 5 섹션
  const auroraLines = [
    `*재시도율*   \`${r.retry_rate ?? '—'}%\`   기준 ${baseline?.retry_rate ?? '—'}%   목표 -30%   ${delta(r, baseline, 'retry_rate', '%')}`,
    `*평균 턴*     \`${r.avg_turns ?? '—'}턴\`   기준 ${baseline?.avg_turns ?? '—'}턴   목표 -20~40%   ${delta(r, baseline, 'avg_turns', '턴')}`,
    `*응답 길이*  \`${r.avg_length ?? '—'}자\`   기준 ${baseline?.avg_length ?? '—'}자   목표 -30~50%   ${delta(r, baseline, 'avg_length', '자')}`,
    `*작업 수*     시작 ${r.total_tasks ?? 0} / 완료 ${r.total_completed ?? 0} / 재시도 ${r.total_retries ?? 0}`,
  ].join('\n');

  // DreamTown 섹션
  const dtLines = dtKpi ? [
    `*별 생성률*       \`${pct(dtKpi.star_creation_rate)}\`   목표 70%+   (소원 ${dtKpi.wish_count ?? 0}개 → 별 ${dtKpi.star_count ?? 0}개)`,
    `*성장 지속률*    \`${pct(dtKpi.growth_persist_rate)}\`   목표 50%+   (Day1 ${dtKpi.growth_day1_count ?? 0}명 → Day7 ${dtKpi.growth_day7_count ?? 0}명)`,
    `*공명 발생률*    \`${pct(dtKpi.resonance_rate)}\`   목표 20%+   (전체 ${dtKpi.total_active_users ?? 0}명 중 ${dtKpi.resonance_user_count ?? 0}명 공명)`,
  ].join('\n') : '데이터 수집 중...';

  // 루미 인사이트
  const insightText = dtVerdict.insights?.length
    ? dtVerdict.insights.map(i => `• ${i}`).join('\n')
    : '모든 지표 목표 범위 내';

  const actionPlanText = formatActionPlan(actionPlan);

  return {
    blocks: [
      // Task 4 — high severity 긴급 배너
      ...(hasCritical ? [{
        type: 'section',
        text: { type: 'mrkdwn', text: '🚨 *즉시 개선 필요 — high severity 지표 감지*' },
      }] : []),
      {
        type: 'header',
        text: { type: 'plain_text', text: `🌌 DreamTown Daily KPI — ${period} 리포트`, emoji: true },
      },
      { type: 'divider' },

      // Aurora 5 (개발 효율)
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${ae} *Aurora 5 — 개발 효율*\n${auroraLines}` },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `${ae} 판정: *${av.label}*  — ${av.message}` }],
      },
      { type: 'divider' },

      // DreamTown KPI (사용자 흐름)
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${de} *DreamTown — 사용자 흐름*\n${dtLines}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `${de} *루미 판정: ${dtVerdict.label}*\n${insightText}` },
      },
      { type: 'divider' },

      // 개선 제안 섹션
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*📋 개선 제안*\n${actionPlanText}` },
      },
      { type: 'divider' },

      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `생성: ${kstDate} KST  |  /admin/kpi  |  GET /api/dt/flow/kpi` }],
      },
    ],
  };
}

// ── 메인 ──────────────────────────────────────────────────────
async function main() {
  console.log(`📊 KPI 집계 중... (${DAYS}일)`);

  const [aurora, dtFull] = await Promise.all([
    runKpi(),
    flowSvc.getKpiSummary({ days: DAYS }).catch(() => null),
  ]);

  // getKpiSummary now returns { ...kpi, verdict, actionPlan }
  const dtKpi      = dtFull;
  const dtVerdict  = dtFull?.verdict  ?? flowSvc.computeVerdict(dtFull);
  const actionPlan = dtFull?.actionPlan ?? flowSvc.generateActionPlan(dtFull);
  const kstDate    = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short' });

  const payload = buildPayload({ aurora, dtKpi, dtVerdict, actionPlan, period: `${DAYS}d`, kstDate });

  console.log('📨 Slack 전송 중...');
  const result = await postSlack(payload);

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
