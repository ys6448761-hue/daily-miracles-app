/**
 * kpi-report.js — Aurora 5 KPI 집계 스크립트
 *
 * 실행: node scripts/kpi-report.js [--days 7] [--json]
 * 출력: 콘솔 or --json 플래그 시 JSON
 *
 * 루미 판정:
 *   3개 모두 개선 → 성공
 *   1~2개 개선    → 부분 성공
 *   변화 없음     → 규칙 미적용
 *   재시도 40%↑   → 즉시 롤백
 */

'use strict';

require('dotenv').config();

const { Client } = require('pg');

// ── CLI 인자 파싱 ─────────────────────────────────────────────────
const args  = process.argv.slice(2);
const asJson = args.includes('--json');
const daysArg = args.indexOf('--days');
const DAYS  = daysArg !== -1 ? parseInt(args[daysArg + 1], 10) : 7;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL 환경변수 미설정');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
});

// ── 루미 판정 ─────────────────────────────────────────────────────
function computeVerdict(current, baseline) {
  if (!baseline || Object.keys(baseline).every(k => baseline[k] == null)) {
    return { status: 'insufficient_data', label: '데이터 수집 중', color: '⬜', message: '기준선 없음 — 1일 수집 후 판정' };
  }

  const retryImp  = parseFloat(current.retry_rate  ?? 0) < parseFloat(baseline.retry_rate  ?? 0);
  const turnsImp  = parseFloat(current.avg_turns   ?? 0) < parseFloat(baseline.avg_turns   ?? 0);
  const lengthImp = parseFloat(current.avg_length  ?? 0) < parseFloat(baseline.avg_length  ?? 0);
  const improved  = [retryImp, turnsImp, lengthImp].filter(Boolean).length;

  const retryWorse = parseFloat(current.retry_rate ?? 0) > parseFloat(baseline.retry_rate ?? 0) * 1.4;

  if (retryWorse && improved === 0) return { status: 'rollback',  label: '즉시 롤백',    color: '🔴', message: '재시도율 40%+ 상승 + 개선 없음 → 즉시 롤백' };
  if (improved === 3)               return { status: 'success',   label: '성공',         color: '🟢', message: '3개 지표 모두 개선 → 유지 + 확장' };
  if (improved >= 1)                return { status: 'partial',   label: '부분 성공',    color: '🟡', message: `${improved}/3 개선 → 원인 분석 필요` };
  return { status: 'no_change', label: '변화 없음', color: '🟣', message: '규칙 미적용 or 잘못 적용 확인' };
}

async function run() {
  await client.connect();

  try {
    // ── 현재 KPI ────────────────────────────────────────────────
    const [retryRes, turnsRes, lengthRes, countRes] = await Promise.all([
      client.query(`
        SELECT
          ROUND(
            COUNT(*) FILTER (WHERE event_type='task_retry')::numeric
            / NULLIF(COUNT(*) FILTER (WHERE event_type='task_start'), 0) * 100, 1
          ) AS retry_rate
        FROM agent_metrics
        WHERE created_at >= NOW() - INTERVAL '${DAYS} days'
      `),
      client.query(`
        SELECT ROUND(AVG((value->>'turns')::int), 1) AS avg_turns
        FROM agent_metrics
        WHERE event_type='task_complete'
          AND created_at >= NOW() - INTERVAL '${DAYS} days'
      `),
      client.query(`
        SELECT ROUND(AVG((value->>'response_length')::int), 0) AS avg_length
        FROM agent_metrics
        WHERE event_type='response_metrics'
          AND created_at >= NOW() - INTERVAL '${DAYS} days'
      `),
      client.query(`
        SELECT
          COUNT(*) FILTER (WHERE event_type='task_start')    AS total_tasks,
          COUNT(*) FILTER (WHERE event_type='task_retry')    AS total_retries,
          COUNT(*) FILTER (WHERE event_type='task_complete') AS total_completed
        FROM agent_metrics
        WHERE created_at >= NOW() - INTERVAL '${DAYS} days'
      `),
    ]);

    // ── 기준선 (가장 최근 baseline 스냅샷) ──────────────────────
    const baseRes = await client.query(`
      SELECT value FROM agent_metrics
      WHERE operator = 'admin_baseline' AND event_type = 'task_start'
      ORDER BY created_at DESC LIMIT 1
    `).catch(() => ({ rows: [] }));

    const current = {
      retry_rate: retryRes.rows[0]?.retry_rate,
      avg_turns:  turnsRes.rows[0]?.avg_turns,
      avg_length: lengthRes.rows[0]?.avg_length,
      ...countRes.rows[0],
    };
    const baseline = baseRes.rows[0]?.value ?? null;
    const verdict  = computeVerdict(current, baseline);

    const report = {
      period:   `${DAYS}d`,
      generated: new Date().toISOString(),
      current,
      baseline,
      verdict,
      goals: {
        retry_rate:  '≥30% 감소',
        avg_turns:   '20~40% 감소',
        avg_response_length: '30~50% 감소',
      },
    };

    if (asJson) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      const r = current;
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Aurora 5 KPI 리포트 (최근 ${DAYS}일)`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  재시도율:    ${r.retry_rate ?? '—'}%   (목표: -30%)`);
      console.log(`  평균 턴 수:  ${r.avg_turns ?? '—'}턴  (목표: -20~40%)`);
      console.log(`  평균 응답:   ${r.avg_length ?? '—'}자 (목표: -30~50%)`);
      console.log(`  총 작업:     ${r.total_tasks ?? 0}개 시작 / ${r.total_completed ?? 0}개 완료 / ${r.total_retries ?? 0}번 재시도`);
      console.log('');
      console.log(`  ${verdict.color} 판정: ${verdict.label}`);
      console.log(`  → ${verdict.message}`);
      if (baseline) {
        console.log(`\n  기준선: retry=${baseline.retry_rate ?? '—'}% | turns=${baseline.avg_turns ?? '—'} | length=${baseline.avg_length ?? '—'}`);
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    return report;

  } finally {
    await client.end();
  }
}

// 직접 실행 시
if (require.main === module) {
  run().catch(e => {
    console.error('❌ KPI 집계 실패:', e.message);
    process.exit(1);
  });
}

module.exports = { run };
