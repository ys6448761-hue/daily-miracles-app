/**
 * slackHeartbeatService.js
 * Slack Heartbeat 알림 서비스
 *
 * 기능:
 * - 매일 09:00 Heartbeat 알림 전송
 * - Slack 실패 시 Email 폴백
 * - 24시간 내 Heartbeat 수신 확인
 */

const https = require('https');

// nodemailer 선택적 로딩 (이메일 폴백용)
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('[Heartbeat] nodemailer 미설치 - 이메일 폴백 비활성화');
}

// ═══════════════════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG = {
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || process.env.OPS_SLACK_WEBHOOK,
  FALLBACK_EMAIL: process.env.FALLBACK_EMAIL,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  HEARTBEAT_HOUR: 9, // 09:00 KST
  HEARTBEAT_MINUTE: 0
};

// 마지막 Heartbeat 시간 저장 (메모리)
let lastHeartbeat = null;
let heartbeatHistory = [];

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 전송
// ═══════════════════════════════════════════════════════════════════════════

async function sendSlackMessage(message) {
  if (!CONFIG.SLACK_WEBHOOK_URL) {
    return { success: false, error: 'SLACK_WEBHOOK_URL not configured' };
  }

  return new Promise((resolve) => {
    const url = new URL(CONFIG.SLACK_WEBHOOK_URL);
    const postData = JSON.stringify(message);

    const req = https.request({
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `HTTP ${res.statusCode}: ${data}` });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });

    req.write(postData);
    req.end();
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// Email 폴백 전송
// ═══════════════════════════════════════════════════════════════════════════

async function sendEmailFallback(subject, body) {
  if (!nodemailer) {
    console.warn('[Heartbeat] nodemailer 미설치 - 이메일 폴백 불가');
    return { success: false, error: 'nodemailer not installed' };
  }

  if (!CONFIG.FALLBACK_EMAIL || !CONFIG.SMTP_HOST) {
    console.warn('[Heartbeat] Email 폴백 미설정');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: CONFIG.SMTP_HOST,
      port: CONFIG.SMTP_PORT,
      secure: CONFIG.SMTP_PORT === 465,
      auth: {
        user: CONFIG.SMTP_USER,
        pass: CONFIG.SMTP_PASS
      }
    });

    await transporter.sendMail({
      from: CONFIG.SMTP_USER,
      to: CONFIG.FALLBACK_EMAIL,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Heartbeat 전송
// ═══════════════════════════════════════════════════════════════════════════

async function sendHeartbeat() {
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const timeStr = kstTime.toISOString().replace('T', ' ').substring(0, 19) + ' KST';

  const message = {
    text: '💓 Daily Heartbeat',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💓 Daily Heartbeat',
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*시간:*\n${timeStr}`
          },
          {
            type: 'mrkdwn',
            text: `*상태:*\n✅ 시스템 정상`
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `🖥️ ${require('os').hostname()} | PID: ${process.pid}`
          }
        ]
      }
    ]
  };

  console.log(`[Heartbeat] 전송 시작: ${timeStr}`);

  // Slack 전송 시도
  const slackResult = await sendSlackMessage(message);

  if (slackResult.success) {
    console.log('[Heartbeat] ✅ Slack 전송 성공');
    lastHeartbeat = now;
    heartbeatHistory.push({ time: now, channel: 'slack', success: true });
    return { success: true, channel: 'slack' };
  }

  console.warn(`[Heartbeat] ⚠️ Slack 전송 실패: ${slackResult.error}`);

  // Email 폴백 시도
  const emailResult = await sendEmailFallback(
    '[Heartbeat] Daily Miracles 시스템 정상',
    `Daily Heartbeat\n\n시간: ${timeStr}\n상태: ✅ 시스템 정상\n\nSlack 전송 실패로 Email 폴백 사용\n오류: ${slackResult.error}`
  );

  if (emailResult.success) {
    console.log('[Heartbeat] ✅ Email 폴백 전송 성공');
    lastHeartbeat = now;
    heartbeatHistory.push({ time: now, channel: 'email', success: true });
    return { success: true, channel: 'email' };
  }

  console.error(`[Heartbeat] ❌ Email 폴백 실패: ${emailResult.error}`);
  heartbeatHistory.push({
    time: now,
    channel: 'none',
    success: false,
    error: `Slack: ${slackResult.error}, Email: ${emailResult.error}`
  });

  return { success: false, error: 'All channels failed' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 스케줄러
// ═══════════════════════════════════════════════════════════════════════════

function scheduleHeartbeat() {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  // 다음 09:00 KST 계산
  const nextHeartbeat = new Date(kstNow);
  nextHeartbeat.setHours(CONFIG.HEARTBEAT_HOUR, CONFIG.HEARTBEAT_MINUTE, 0, 0);

  if (kstNow >= nextHeartbeat) {
    nextHeartbeat.setDate(nextHeartbeat.getDate() + 1);
  }

  // UTC로 변환
  const nextHeartbeatUTC = new Date(nextHeartbeat.getTime() - 9 * 60 * 60 * 1000);
  const delay = nextHeartbeatUTC.getTime() - now.getTime();

  console.log(`[Heartbeat] 다음 전송 예정: ${nextHeartbeat.toISOString()} KST (${Math.round(delay / 1000 / 60)}분 후)`);

  setTimeout(async () => {
    await sendHeartbeat();
    // 24시간 후 다음 Heartbeat 스케줄
    scheduleHeartbeat();
  }, delay);
}

// ═══════════════════════════════════════════════════════════════════════════
// 상태 조회
// ═══════════════════════════════════════════════════════════════════════════

function getStatus() {
  const now = new Date();
  const hoursSinceLastHeartbeat = lastHeartbeat
    ? (now.getTime() - lastHeartbeat.getTime()) / 1000 / 60 / 60
    : null;

  return {
    lastHeartbeat: lastHeartbeat ? lastHeartbeat.toISOString() : null,
    hoursSinceLastHeartbeat: hoursSinceLastHeartbeat ? hoursSinceLastHeartbeat.toFixed(2) : null,
    isHealthy: hoursSinceLastHeartbeat !== null && hoursSinceLastHeartbeat < 24,
    recentHistory: heartbeatHistory.slice(-10),
    config: {
      slackConfigured: !!CONFIG.SLACK_WEBHOOK_URL,
      emailConfigured: !!(nodemailer && CONFIG.FALLBACK_EMAIL && CONFIG.SMTP_HOST),
      nodemailerInstalled: !!nodemailer,
      heartbeatTime: `${CONFIG.HEARTBEAT_HOUR}:${String(CONFIG.HEARTBEAT_MINUTE).padStart(2, '0')} KST`
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 초기화
// ═══════════════════════════════════════════════════════════════════════════

function init() {
  console.log('[Heartbeat] 서비스 초기화');
  console.log(`  Slack Webhook: ${CONFIG.SLACK_WEBHOOK_URL ? '✅' : '❌'}`);
  console.log(`  Email Fallback: ${CONFIG.FALLBACK_EMAIL ? '✅' : '❌'}`);
  console.log(`  Heartbeat 시간: ${CONFIG.HEARTBEAT_HOUR}:${String(CONFIG.HEARTBEAT_MINUTE).padStart(2, '0')} KST`);

  scheduleHeartbeat();
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  init,
  sendHeartbeat,
  getStatus,
  sendSlackMessage
};
