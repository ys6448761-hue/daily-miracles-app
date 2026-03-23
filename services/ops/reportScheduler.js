/**
 * reportScheduler.js
 * AIL-2026-0301-OPS-ERR-REPORT-002 — 리포트 스케줄러 (in-process)
 *
 * 기능:
 * 1. errorRateMonitor 시작 (30초 폴링 → 5분 에러율 임계치 알림)
 * 2. 매시간 request_log_hourly 테이블에 집계 플러시 (daily script가 읽을 수 있도록)
 * 3. 매일 09:00 KST 일일 에러 리포트 Slack 발송 (in-process, cron 독립적으로 작동)
 *
 * 서버 시작 시 server.js 또는 app.js에서 init()을 호출한다.
 *
 * @version 1.0 — 2026-03-01
 */

'use strict';

const https = require('https');
const errorRateMonitor = require('./errorRateMonitor');
const { getDailyStats } = require('../../config/logger');

// ═══════════════════════════════════════════════════════════
// 환경변수
// ═══════════════════════════════════════════════════════════

const WEBHOOK_URL = process.env.OPS_DAILY_REPORT_WEBHOOK;
const DATABASE_URL = process.env.DATABASE_URL;

// ═══════════════════════════════════════════════════════════
// 내부 타이머 핸들
// ═══════════════════════════════════════════════════════════

let _hourlyFlushTimer = null;
let _dailyReportTimer = null;
let _initialized = false;

// ═══════════════════════════════════════════════════════════
// DB 플러시 — request_log_hourly upsert
// ═══════════════════════════════════════════════════════════

async function _flushHourlyStats() {
  if (!DATABASE_URL) return;

  let pg;
  try {
    // eslint-disable-next-line global-require
    pg = require('pg');
  } catch {
    return; // pg 미설치 환경 (로컬 SQLite)
  }

  const stats = getDailyStats(1); // 최근 1시간 집계
  if (stats.total === 0) return;  // 요청 없으면 플러시 생략

  // 현재 시간 기준 hour_bucket (분/초=0으로 truncate)
  const now = new Date();
  const hourBucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 6_000,
    statement_timeout: 8_000,
  });

  try {
    await client.connect();
    await client.query(
      `INSERT INTO request_log_hourly
         (hour_bucket, total_requests, error_count, error_rate, top_error_class, top_endpoint, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (hour_bucket) DO UPDATE SET
         total_requests  = EXCLUDED.total_requests,
         error_count     = EXCLUDED.error_count,
         error_rate      = EXCLUDED.error_rate,
         top_error_class = EXCLUDED.top_error_class,
         top_endpoint    = EXCLUDED.top_endpoint,
         updated_at      = NOW()`,
      [
        hourBucket.toISOString(),
        stats.total,
        stats.errors,
        stats.errorRate,
        stats.topErrorClass ? stats.topErrorClass.class : null,
        stats.topEndpoint ? stats.topEndpoint.endpoint : null,
      ]
    );
    await client.end();
    console.log(`[ReportScheduler] ✅ 시간별 통계 플러시 (${hourBucket.toISOString()}): ${stats.total}req / ${stats.errors}err`);
  } catch (e) {
    console.error('[ReportScheduler] ⚠️ DB 플러시 실패 (fail-open):', e.message);
    try { await client.end(); } catch { }
  }
}

// ═══════════════════════════════════════════════════════════
// Slack Webhook 발송
// ═══════════════════════════════════════════════════════════

async function _sendWebhook(payload) {
  if (!WEBHOOK_URL) return { success: false, reason: 'no_webhook' };

  return new Promise((resolve) => {
    try {
      const url = new URL(WEBHOOK_URL);
      const body = JSON.stringify(payload);

      const req = https.request(
        {
          hostname: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
          },
          timeout: 12_000,
        },
        (res) => {
          let data = '';
          res.on('data', (c) => { data += c; });
          res.on('end', () => resolve({ success: res.statusCode === 200 }));
        }
      );

      req.on('error', (e) => resolve({ success: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'timeout' }); });

      req.write(body);
      req.end();
    } catch (e) {
      resolve({ success: false, error: e.message });
    }
  });
}

// ═══════════════════════════════════════════════════════════
// 일일 리포트 생성 및 발송 (in-process, getDailyStats 사용)
// ═══════════════════════════════════════════════════════════

async function _sendDailyReport() {
  console.log('[ReportScheduler] 일일 에러 리포트 생성 시작 (in-process)');

  const stats = getDailyStats(24);
  const nowKST = new Date(Date.now() + 9 * 60 * 60 * 1000)
    .toISOString().replace('T', ' ').slice(0, 16) + ' KST';

  const overallPct = (stats.errorRate * 100).toFixed(2);
  const statusIcon = stats.errorRate >= 0.05 ? '🔴' : stats.errorRate >= 0.02 ? '🟡' : '🟢';
  const topClass = stats.topErrorClass ? `${stats.topErrorClass.class} (${stats.topErrorClass.count}건)` : '-';
  const topEP = stats.topEndpoint ? stats.topEndpoint.endpoint : '-';

  const payload = {
    text: `${statusIcon} Daily Error Report (in-process) — 에러율 ${overallPct}%`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${statusIcon} Daily Error Report (최근 24h)`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*총 요청 수:*\n${stats.total.toLocaleString()}` },
          { type: 'mrkdwn', text: `*총 에러 수:*\n${stats.errors.toLocaleString()}` },
          { type: 'mrkdwn', text: `*에러율:*\n${overallPct}%` },
          { type: 'mrkdwn', text: `*Top error_class:*\n${topClass}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Top endpoint:*\n\`${topEP}\`` },
        ],
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `생성: ${nowKST} | reportScheduler (in-process)` },
        ],
      },
    ],
  };

  try {
    const result = await _sendWebhook(payload);
    if (result.success) {
      console.log('[ReportScheduler] ✅ 일일 리포트 Slack 발송 성공');
    } else {
      console.warn('[ReportScheduler] ⚠️ 일일 리포트 Slack 발송 실패 (fail-open):', result.error || result.reason);
    }
  } catch (e) {
    console.error('[ReportScheduler] 일일 리포트 발송 오류 (fail-open):', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// 09:00 KST 스케줄러 (slackHeartbeatService 패턴 동일)
// ═══════════════════════════════════════════════════════════

function _scheduleDailyReport() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // 다음 09:00 KST 계산
  const next = new Date(
    kstNow.getFullYear(),
    kstNow.getMonth(),
    kstNow.getDate(),
    9, 0, 0, 0
  );
  if (kstNow >= next) next.setDate(next.getDate() + 1);

  // UTC로 변환
  const nextUTC = new Date(next.getTime() - 9 * 60 * 60 * 1000);
  const delay = nextUTC.getTime() - now.getTime();

  console.log(
    `[ReportScheduler] 다음 일일 리포트 예정: ${next.toISOString()} KST (약 ${Math.round(delay / 60000)}분 후)`
  );

  _dailyReportTimer = setTimeout(async () => {
    await _sendDailyReport();
    _scheduleDailyReport(); // 매일 재스케줄
  }, delay);

  if (_dailyReportTimer.unref) _dailyReportTimer.unref();
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

/**
 * 스케줄러를 초기화한다.
 * server.js 의 서버 start 직후 호출한다.
 * 멱등 — 중복 호출 시 두 번째부터 무시된다.
 */
function init() {
  if (_initialized) return;
  _initialized = true;

  // 1. 실시간 에러율 모니터
  errorRateMonitor.start();

  // 2. 시간별 DB 플러시 (60분마다, 시작 후 5분 지연)
  setTimeout(() => {
    _flushHourlyStats(); // 초기 즉시 실행
    _hourlyFlushTimer = setInterval(_flushHourlyStats, 60 * 60 * 1000);
    if (_hourlyFlushTimer.unref) _hourlyFlushTimer.unref();
  }, 5 * 60 * 1000);

  // 3. 일일 리포트 스케줄 (09:00 KST) — 기본은 Render Cron 정본 권장
  const enableDaily = process.env.OPS_DAILY_IN_PROCESS !== "0";
  if (enableDaily) {
    _scheduleDailyReport();
    console.log("[ReportScheduler] ✅ in-process daily report ENABLED");
  } else {
    console.log("[ReportScheduler] ⛔ in-process daily report DISABLED (use Render Cron)");
  }
  console.log('[ReportScheduler] ✅ 초기화 완료 (errorRateMonitor + hourlyFlush + dailyReport@09:00KST)');
}

/**
 * 모든 스케줄을 정지한다 (테스트 / graceful shutdown용).
 */
function destroy() {
  errorRateMonitor.stop();
  if (_hourlyFlushTimer) { clearInterval(_hourlyFlushTimer); _hourlyFlushTimer = null; }
  if (_dailyReportTimer) { clearTimeout(_dailyReportTimer); _dailyReportTimer = null; }
  _initialized = false;
  console.log('[ReportScheduler] 정지됨');
}

module.exports = { init, destroy };
