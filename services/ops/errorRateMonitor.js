/**
 * errorRateMonitor.js
 * AIL-2026-0301-OPS-ERR-REPORT-002 — 실시간 에러율 모니터
 *
 * 기능:
 * - 30초마다 최근 5분 HTTP 요청을 분석
 * - 에러율 >= OPS_ERROR_THRESHOLD(기본 5%) AND 요청 수 >= OPS_ERROR_MIN_REQUESTS(기본 50) 시 Slack 알림
 * - 동일 조건 15분 내 중복 발송 금지 (cooldown)
 * - DB 다운 / Slack 실패 시 fail-open (process 종료 금지)
 *
 * @version 1.0 — 2026-03-01
 */

'use strict';

const https = require('https');
const { getRecentStats } = require('../../config/logger');

// ═══════════════════════════════════════════════════════════
// 설정 (환경변수)
// ═══════════════════════════════════════════════════════════

const WEBHOOK_URL     = process.env.OPS_DAILY_REPORT_WEBHOOK;
const ERROR_THRESHOLD = parseFloat(process.env.OPS_ERROR_THRESHOLD   || '0.05');
const MIN_REQUESTS    = parseInt(process.env.OPS_ERROR_MIN_REQUESTS   || '50', 10);
const WINDOW_MS       = 5  * 60 * 1000;  // 5분 윈도우
const POLL_INTERVAL   = 30 * 1000;       // 30초 폴링
const COOLDOWN_MS     = 15 * 60 * 1000;  // 15분 쿨다운

// ═══════════════════════════════════════════════════════════
// 내부 상태
// ═══════════════════════════════════════════════════════════

let _timer       = null;
let _lastAlertAt = 0;    // cooldown 기준점

// ═══════════════════════════════════════════════════════════
// Slack Webhook 발송 (https.request 기반, 의존성 최소화)
// ═══════════════════════════════════════════════════════════

async function _sendWebhook(payload) {
  if (!WEBHOOK_URL) {
    console.warn('[ErrorRateMonitor] OPS_DAILY_REPORT_WEBHOOK 미설정 — Slack 발송 불가');
    return { success: false, reason: 'no_webhook' };
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
          timeout: 10_000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
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
// Slack 메시지 포맷
// ═══════════════════════════════════════════════════════════

function _buildPayload(stats) {
  const pct         = (stats.errorRate * 100).toFixed(1);
  const topClass    = stats.topErrorClass
    ? `${stats.topErrorClass.class} (${stats.topErrorClass.count}건)`
    : '-';
  const topEndpoint = stats.topEndpoint ? stats.topEndpoint.endpoint : '-';
  const recentIds   = stats.recentRequestIds.length > 0
    ? stats.recentRequestIds.map((id) => `\`${String(id).slice(0, 8)}…\``).join('\n')
    : '없음';

  return {
    text: `🚨 High Error Rate Detected — ${pct}%`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🚨 High Error Rate Detected', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*최근 5분 요청:*\n${stats.total}` },
          { type: 'mrkdwn', text: `*에러:*\n${stats.errors}` },
          { type: 'mrkdwn', text: `*에러율:*\n${pct}%` },
          { type: 'mrkdwn', text: `*Top error_class:*\n${topClass}` },
        ],
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*대표 endpoint:*\n\`${topEndpoint}\`` },
          { type: 'mrkdwn', text: `*최근 requestId:*\n${recentIds}` },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: [
              new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) + ' KST',
              `threshold: ${(ERROR_THRESHOLD * 100).toFixed(0)}% | min_req: ${MIN_REQUESTS}`,
            ].join('  |  '),
          },
        ],
      },
    ],
  };
}

// ═══════════════════════════════════════════════════════════
// 폴링 체크 (30초마다 실행)
// ═══════════════════════════════════════════════════════════

async function _check() {
  let stats;
  try {
    stats = getRecentStats(WINDOW_MS);
  } catch (e) {
    // fail-open: logger 버퍼 접근 실패 시 조용히 통과
    console.error('[ErrorRateMonitor] getRecentStats 오류 (fail-open):', e.message);
    return;
  }

  // 저트래픽 오탐 방지
  if (stats.total < MIN_REQUESTS) return;

  // 임계치 미만
  if (stats.errorRate < ERROR_THRESHOLD) return;

  // 15분 쿨다운 체크
  const now = Date.now();
  if (now - _lastAlertAt < COOLDOWN_MS) {
    console.log(
      `[ErrorRateMonitor] 쿨다운 중 (${Math.round((COOLDOWN_MS - (now - _lastAlertAt)) / 1000)}초 남음) — 발송 생략`
    );
    return;
  }

  // 알림 발송
  _lastAlertAt = now;
  const payload = _buildPayload(stats);

  console.log(
    `[ErrorRateMonitor] 🚨 에러율 ${(stats.errorRate * 100).toFixed(1)}% (${stats.errors}/${stats.total}) — Slack 알림 발송`
  );

  try {
    const result = await _sendWebhook(payload);
    if (result.success) {
      console.log('[ErrorRateMonitor] ✅ Slack 발송 성공');
    } else {
      console.warn('[ErrorRateMonitor] ⚠️ Slack 발송 실패 (fail-open):', result.error || result.status);
    }
  } catch (e) {
    console.error('[ErrorRateMonitor] Slack 발송 오류 (fail-open):', e.message);
  }
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

/**
 * 에러율 모니터를 시작한다.
 * 멱등 — 이미 실행 중이면 재시작하지 않는다.
 */
function start() {
  if (_timer) return;
  _timer = setInterval(_check, POLL_INTERVAL);
  if (_timer.unref) _timer.unref(); // 프로세스 종료를 블록하지 않음

  console.log(
    `[ErrorRateMonitor] 시작 — poll: ${POLL_INTERVAL / 1000}s | threshold: ${(ERROR_THRESHOLD * 100).toFixed(0)}% | min_req: ${MIN_REQUESTS} | cooldown: ${COOLDOWN_MS / 60000}min`
  );
}

/**
 * 에러율 모니터를 정지한다.
 */
function stop() {
  if (_timer) {
    clearInterval(_timer);
    _timer = null;
    console.log('[ErrorRateMonitor] 정지됨');
  }
}

/** 현재 쿨다운 잔여 시간(ms). 0이면 쿨다운 없음. */
function getCooldownRemaining() {
  return Math.max(0, COOLDOWN_MS - (Date.now() - _lastAlertAt));
}

module.exports = { start, stop, getCooldownRemaining };
