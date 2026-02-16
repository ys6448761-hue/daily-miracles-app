#!/usr/bin/env node
/**
 * dbHealthCheck.js
 * DB 헬스 체크 + Slack 일일 서머리
 *
 * 실행 주기: 매일 06:00 KST
 * 역할: DB 연결 확인 + 주요 테이블 row count + Slack 알림
 *
 * 실행 방법:
 * - CLI: node jobs/dbHealthCheck.js
 * - GitHub Actions: cron 스케줄
 *
 * @version 1.1 — retry + backoff for transient DNS errors
 */

require('dotenv').config();
const https = require('https');

let db;
try {
  db = require('../database/db');
} catch (e) {
  console.error('[DBHealth] DB 모듈 로드 실패:', e.message);
  process.exit(1);
}

const OPS_SLACK_WEBHOOK = process.env.OPS_SLACK_WEBHOOK || process.env.SLACK_WEBHOOK_URL;

// ── Retry config ──────────────────────────────────────
const MAX_RETRIES = 3;
const BACKOFF_MS = [0, 5000, 10000]; // 1st=immediate, 2nd=5s, 3rd=10s
const RETRYABLE_CODES = ['EAI_AGAIN', 'ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'];

function isRetryable(err) {
  return RETRYABLE_CODES.some((code) => err.message?.includes(code) || err.code === code);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * DB 호스트명 마스킹 (비밀번호/유저 제거, 호스트만 표시)
 */
function maskedHost() {
  const url = process.env.DATABASE_URL;
  if (!url) return 'N/A';
  try {
    const parsed = new URL(url);
    return `host=***.${parsed.hostname.split('.').slice(-2).join('.')}`;
  } catch {
    return 'host=***';
  }
}

const HEALTH_TABLES = [
  'trials',
  'wish_entries',
  'point_ledger',
  'attendance_events',
  'wu_sessions',
];

/**
 * Slack webhook으로 메시지 전송
 */
function sendSlack(message) {
  if (!OPS_SLACK_WEBHOOK) {
    console.log('[DBHealth] OPS_SLACK_WEBHOOK 미설정 — dry-run 모드');
    console.log(JSON.stringify(message, null, 2));
    return Promise.resolve({ success: true, dryRun: true });
  }

  return new Promise((resolve) => {
    const url = new URL(OPS_SLACK_WEBHOOK);
    const postData = JSON.stringify(message);

    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 10000,
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        resolve(res.statusCode === 200
          ? { success: true }
          : { success: false, error: `HTTP ${res.statusCode}: ${data}` });
      });
    });

    req.on('error', (error) => resolve({ success: false, error: error.message }));
    req.on('timeout', () => { req.destroy(); resolve({ success: false, error: 'timeout' }); });
    req.write(postData);
    req.end();
  });
}

/**
 * 메인 헬스 체크 (with retry for transient network errors)
 */
async function runDBHealthCheck() {
  const startTime = Date.now();
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const timeStr = kstTime.toISOString().replace('T', ' ').substring(0, 19) + ' KST';

  console.log('');
  console.log('========================================');
  console.log(' DB Health Check');
  console.log(`  ${timeStr}`);
  console.log(`  ${maskedHost()}`);
  console.log('========================================');

  // 1) DB connectivity — with retry
  let dbOk = false;
  let dbMs = 0;
  let attempt = 0;
  while (attempt < MAX_RETRIES) {
    try {
      const t0 = Date.now();
      await db.query('SELECT 1');
      dbMs = Date.now() - t0;
      dbOk = true;
      console.log(`  DB SELECT 1: OK (${dbMs}ms)${attempt > 0 ? ` [retry #${attempt}]` : ''}`);
      break;
    } catch (err) {
      attempt++;
      if (isRetryable(err) && attempt < MAX_RETRIES) {
        const wait = BACKOFF_MS[attempt] || 10000;
        console.log(`  DB SELECT 1: ${err.code || err.message} — retry ${attempt}/${MAX_RETRIES} in ${wait / 1000}s`);
        await sleep(wait);
      } else {
        console.error(`  DB SELECT 1: FAIL — ${err.message}${attempt > 1 ? ` (after ${attempt} attempts)` : ''}`);
      }
    }
  }

  // 2) Table row counts
  const tableCounts = [];
  for (const table of HEALTH_TABLES) {
    try {
      const res = await db.query(
        `SELECT reltuples::bigint AS estimate FROM pg_class WHERE relname = $1`,
        [table]
      );
      const count = res.rows[0]?.estimate ?? -1;
      tableCounts.push({ table, count: Number(count), ok: true });
      console.log(`  ${table}: ~${count} rows`);
    } catch (err) {
      tableCounts.push({ table, count: -1, ok: false, error: err.message });
      console.log(`  ${table}: ERROR — ${err.message}`);
    }
  }

  // 3) DB activity check (last autovacuum)
  let dbActive = 'unknown';
  try {
    const res = await db.query(`
      SELECT schemaname, relname, last_autovacuum
      FROM pg_stat_user_tables
      WHERE last_autovacuum IS NOT NULL
      ORDER BY last_autovacuum DESC
      LIMIT 1
    `);
    if (res.rows[0]) {
      dbActive = `${res.rows[0].relname} — ${res.rows[0].last_autovacuum}`;
    } else {
      dbActive = 'no autovacuum records';
    }
    console.log(`  Last autovacuum: ${dbActive}`);
  } catch (err) {
    console.log(`  Autovacuum check: ${err.message}`);
  }

  const duration = Date.now() - startTime;
  const allOk = dbOk && tableCounts.every((t) => t.ok);

  console.log('');
  console.log(`  Result: ${allOk ? 'ALL OK' : 'ISSUES DETECTED'} (${duration}ms)`);
  console.log('========================================');

  // 4) Slack 알림
  const emoji = allOk ? ':white_check_mark:' : ':rotating_light:';
  const status = allOk ? 'ALL OK' : 'ISSUES DETECTED';

  const tableLines = tableCounts
    .map((t) => `${t.ok ? ':white_check_mark:' : ':x:'} \`${t.table}\` — ~${t.count} rows`)
    .join('\n');

  const slackMsg = {
    text: `${emoji} DB Health Check — ${status}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${allOk ? '✅' : '🚨'} DB Health Check`, emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Time:*\n${timeStr}` },
          { type: 'mrkdwn', text: `*DB Ping:*\n${dbOk ? `✅ ${dbMs}ms` : '❌ FAIL'}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*Table Counts:*\n${tableLines}` },
      },
      {
        type: 'context',
        elements: [
          { type: 'mrkdwn', text: `Autovacuum: ${dbActive} | Duration: ${duration}ms` },
        ],
      },
    ],
  };

  const slackResult = await sendSlack(slackMsg);
  if (slackResult.success) {
    console.log(slackResult.dryRun ? '  Slack: dry-run (no webhook)' : '  Slack: sent');
  } else {
    console.error(`  Slack send failed: ${slackResult.error}`);
  }

  return { allOk, dbOk, dbMs, tableCounts, duration };
}

// CLI
if (require.main === module) {
  runDBHealthCheck()
    .then((result) => {
      if (!result.allOk) {
        console.error('DB health check detected issues');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error('DB health check failed:', err.message);
      process.exit(1);
    });
}

module.exports = { runDBHealthCheck };
