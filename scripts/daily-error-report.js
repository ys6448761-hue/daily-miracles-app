#!/usr/bin/env node
/**
 * daily-error-report.js
 * AIL-2026-0301-OPS-ERR-REPORT-002 — 정기 에러 리포트 (매일 09:00 KST)
 *
 * Render Cron 설정 (UTC):  0 0 * * *
 * 수동 실행:
 *   node scripts/daily-error-report.js
 *   node scripts/daily-error-report.js --hours 24
 *   node scripts/daily-error-report.js --dry-run
 *
 * 데이터 소스: request_log_hourly (PostgreSQL)
 * 출력 채널:  OPS_DAILY_REPORT_WEBHOOK → #ops-alerts
 *
 * Fail-open 원칙:
 * - DB 다운 시 "데이터 없음" 리포트 발송 후 exit 0
 * - Slack 발송 실패 시 경고 출력 후 exit 0
 *
 * @version 1.0 — 2026-03-01
 */

'use strict';

require('dotenv').config();

const https = require('https');

// ═══════════════════════════════════════════════════════════
// CLI 인자
// ═══════════════════════════════════════════════════════════

const args = process.argv.slice(2);

function getArgVal(flag, defaultVal) {
  const idx  = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  const pair = args.find((a) => a.startsWith(flag + '='));
  if (pair) return pair.split('=').slice(1).join('=');
  return defaultVal;
}

const HOURS   = parseInt(getArgVal('--hours', '24'), 10);
const DRY_RUN = args.includes('--dry-run');

// ═══════════════════════════════════════════════════════════
// 환경변수
// ═══════════════════════════════════════════════════════════

const WEBHOOK_URL = process.env.OPS_DAILY_REPORT_WEBHOOK;
const DATABASE_URL = process.env.DATABASE_URL;

// ═══════════════════════════════════════════════════════════
// 로그 헬퍼
// ═══════════════════════════════════════════════════════════

function log(symbol, msg) {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 19);
  console.log(`${symbol} [${kst} KST] ${msg}`);
}

// ═══════════════════════════════════════════════════════════
// DB 조회 — request_log_hourly
// ═══════════════════════════════════════════════════════════

async function fetchHourlyStats(hours) {
  if (!DATABASE_URL) {
    log('⚠️', 'DATABASE_URL 미설정 — DB 조회 건너뜀');
    return null;
  }

  let pg;
  try {
    // eslint-disable-next-line global-require
    pg = require('pg');
  } catch {
    log('⚠️', 'pg 모듈 없음 — DB 조회 건너뜀');
    return null;
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 8_000,
    statement_timeout: 10_000,
  });

  try {
    await client.connect();

    // request_log_hourly 테이블 존재 확인
    const tableCheck = await client.query(`
      SELECT 1 FROM information_schema.tables
      WHERE table_name = 'request_log_hourly'
      LIMIT 1
    `);
    if (tableCheck.rows.length === 0) {
      log('⚠️', 'request_log_hourly 테이블 없음 — 마이그레이션 024 미실행');
      await client.end();
      return null;
    }

    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    const { rows } = await client.query(
      `SELECT
         hour_bucket,
         total_requests,
         error_count,
         error_rate,
         top_error_class,
         top_endpoint
       FROM request_log_hourly
       WHERE hour_bucket >= $1
       ORDER BY hour_bucket ASC`,
      [cutoff]
    );

    await client.end();
    return rows;
  } catch (e) {
    log('❌', `DB 조회 실패 (fail-open): ${e.message}`);
    try { await client.end(); } catch {}
    return null;
  }
}

// ═══════════════════════════════════════════════════════════
// 통계 집계
// ═══════════════════════════════════════════════════════════

function aggregateRows(rows) {
  if (!rows || rows.length === 0) {
    return {
      totalRequests: 0,
      totalErrors:   0,
      overallRate:   0,
      peakErrorRate: 0,
      peakHour:      null,
      topErrorClass: null,
      topEndpoint:   null,
      hourCount:     0,
    };
  }

  let totalRequests = 0;
  let totalErrors   = 0;
  let peakErrorRate = 0;
  let peakHour      = null;

  const classCounts    = {};
  const endpointCounts = {};

  for (const row of rows) {
    totalRequests += Number(row.total_requests);
    totalErrors   += Number(row.error_count);

    const rate = parseFloat(row.error_rate);
    if (rate > peakErrorRate) {
      peakErrorRate = rate;
      peakHour      = row.hour_bucket;
    }

    if (row.top_error_class) {
      classCounts[row.top_error_class] =
        (classCounts[row.top_error_class] || 0) + Number(row.error_count);
    }
    if (row.top_endpoint) {
      endpointCounts[row.top_endpoint] =
        (endpointCounts[row.top_endpoint] || 0) + Number(row.error_count);
    }
  }

  const overallRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

  const topErrorClass = Object.entries(classCounts)
    .sort((a, b) => b[1] - a[1])[0] || null;
  const topEndpoint = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])[0] || null;

  return {
    totalRequests,
    totalErrors,
    overallRate,
    peakErrorRate,
    peakHour,
    topErrorClass: topErrorClass ? { class: topErrorClass[0], count: topErrorClass[1] } : null,
    topEndpoint:   topEndpoint   ? { endpoint: topEndpoint[0], count: topEndpoint[1]   } : null,
    hourCount: rows.length,
  };
}

// ═══════════════════════════════════════════════════════════
// Slack 메시지 포맷
// ═══════════════════════════════════════════════════════════

function buildPayload(stats, hours, dataAvailable) {
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 16) + ' KST';

  const overallPct = (stats.overallRate  * 100).toFixed(2);
  const peakPct    = (stats.peakErrorRate * 100).toFixed(2);

  const peakHourStr = stats.peakHour
    ? new Date(stats.peakHour).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit' })
    : '-';

  const topClass    = stats.topErrorClass ? `${stats.topErrorClass.class} (${stats.topErrorClass.count}건)` : '-';
  const topEndpoint = stats.topEndpoint   ? stats.topEndpoint.endpoint                                      : '-';

  const statusIcon = !dataAvailable         ? '⚠️'
    : stats.overallRate >= 0.05              ? '🔴'
    : stats.overallRate >= 0.02              ? '🟡'
    : '🟢';

  const blocks = [
    {
      type: 'header',
      text: {
        type:  'plain_text',
        text:  `${statusIcon} Daily Error Report (최근 ${hours}h)`,
        emoji: true,
      },
    },
  ];

  if (!dataAvailable) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⚠️ *DB 데이터 없음*\nrequest_log_hourly 테이블이 비어있거나 DB에 접근할 수 없습니다.\n마이그레이션 024 실행 여부 및 DATABASE_URL을 확인하세요.',
      },
    });
  } else {
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*총 요청 수:*\n${stats.totalRequests.toLocaleString()}` },
        { type: 'mrkdwn', text: `*총 에러 수:*\n${stats.totalErrors.toLocaleString()}` },
        { type: 'mrkdwn', text: `*전체 에러율:*\n${overallPct}%` },
        { type: 'mrkdwn', text: `*피크 에러율:*\n${peakPct}% (${peakHourStr})` },
      ],
    });
    blocks.push({
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Top error_class:*\n${topClass}` },
        { type: 'mrkdwn', text: `*Top endpoint:*\n\`${topEndpoint}\`` },
      ],
    });
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:  `집계 기간: 최근 ${hours}시간 (${stats.hourCount}개 시간대 집계)`,
      },
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      { type: 'mrkdwn', text: `생성: ${nowKST} | daily-error-report.js` },
    ],
  });

  return {
    text: `${statusIcon} Daily Error Report — 에러율 ${overallPct}% (${stats.totalErrors}/${stats.totalRequests})`,
    blocks,
  };
}

// ═══════════════════════════════════════════════════════════
// Slack Webhook 발송
// ═══════════════════════════════════════════════════════════

async function sendWebhook(payload) {
  if (!WEBHOOK_URL) {
    log('⚠️', 'OPS_DAILY_REPORT_WEBHOOK 미설정 — Slack 발송 생략 (dry-run으로 간주)');
    console.log('[DRY-RUN] payload:', JSON.stringify(payload, null, 2));
    return { success: false, reason: 'no_webhook' };
  }

  if (DRY_RUN) {
    log('ℹ️', '--dry-run 모드 — Slack 발송 생략');
    console.log('[DRY-RUN] payload:', JSON.stringify(payload, null, 2));
    return { success: true, dryRun: true };
  }

  return new Promise((resolve) => {
    try {
      const url  = new URL(WEBHOOK_URL);
      const body = JSON.stringify(payload);

      const req = https.request(
        {
          hostname: url.hostname,
          port:     443,
          path:     url.pathname + url.search,
          method:   'POST',
          headers:  {
            'Content-Type':   'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
          timeout: 15_000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => { data += c; });
          res.on('end', () => {
            if (res.statusCode === 200) {
              resolve({ success: true });
            } else {
              resolve({ success: false, status: res.statusCode, body: data });
            }
          });
        }
      );

      req.on('error',   (e) => resolve({ success: false, error: e.message }));
      req.on('timeout', ()  => { req.destroy(); resolve({ success: false, error: 'timeout' }); });

      req.write(body);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

// ═══════════════════════════════════════════════════════════
// 메인
// ═══════════════════════════════════════════════════════════

async function main() {
  log('📊', `Daily Error Report 생성 시작 (최근 ${HOURS}h)${DRY_RUN ? ' [DRY-RUN]' : ''}`);

  // 1. DB 조회
  const rows = await fetchHourlyStats(HOURS);
  const dataAvailable = rows !== null && rows.length > 0;

  // 2. 집계
  const stats = aggregateRows(rows);
  log(
    dataAvailable ? '✅' : '⚠️',
    dataAvailable
      ? `집계 완료: 요청 ${stats.totalRequests}, 에러 ${stats.totalErrors}, 에러율 ${(stats.overallRate * 100).toFixed(2)}%`
      : 'DB 데이터 없음 — 빈 리포트 발송'
  );

  // 3. 메시지 포맷
  const payload = buildPayload(stats, HOURS, dataAvailable);

  // 4. Slack 발송
  const result = await sendWebhook(payload);
  if (result.success) {
    log('✅', `Slack 발송 성공${result.dryRun ? ' (dry-run)' : ''}`);
  } else {
    log('⚠️', `Slack 발송 실패 (fail-open): ${result.error || result.status || result.reason}`);
  }

  // fail-open: 항상 exit 0
  process.exit(0);
}

main().catch((e) => {
  console.error('[daily-error-report] 예상치 못한 오류 (fail-open):', e);
  process.exit(0); // fail-open
});
