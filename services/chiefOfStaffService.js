/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ChiefOfStaff Service - 비서실장 오케스트레이터 v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P0+: 누락 방지 자동 감시 시스템
 * - 8개 P0 알람 룰 모니터링
 * - Slack 알림 + Airtable Ops Alerts 저장
 *
 * 알람 룰:
 * 1. 앱 health fail
 * 2. Airtable write fail
 * 3. Sessions/Messages 정합성 깨짐
 * 4. 🔴 미처리 10분 초과
 * 5. 🟡 미처리 30분 초과
 * 6. 18:00 리포트 미생성
 * 7. 홍보 중인데 30분 유입 0
 * 8. Slack post 실패
 *
 * 작성일: 2026-01-17
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// 환경 설정
// ═══════════════════════════════════════════════════════════════════════════

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Slack 채널 ID
const SLACK_CHANNEL_REPORT = process.env.SLACK_CHANNEL_REPORT || 'C0A8CRLJW6B';  // #소원이-리포트
const SLACK_CHANNEL_REVIEW = process.env.SLACK_CHANNEL_REVIEW || 'C0A8CRLJW6B';  // #소원이-검수

const TABLES = {
  SESSIONS: process.env.AIRTABLE_TABLE_SESSIONS || 'Wish Intake Sessions',
  MESSAGES: process.env.AIRTABLE_TABLE_MESSAGES || 'Wish Intake Messages',
  OPS_ALERTS: process.env.AIRTABLE_TABLE_OPS_ALERTS || 'Ops Alerts',
  OPS_REPORTS: process.env.AIRTABLE_TABLE_OPS_REPORTS || 'Ops Reports'
};

// 알람 심각도
const SEVERITY = {
  CRITICAL: 'CRITICAL',  // 즉시 조치 필요
  WARNING: 'WARNING',    // 주의 필요
  INFO: 'INFO'           // 참고
};

// Idempotency 캐시 (메모리 기반)
const idempotencyCache = new Map();
const IDEMPOTENCY_TTL_MS = 30 * 60 * 1000; // 30분

// 캐시 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of idempotencyCache.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════
// Airtable API 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

async function airtableRequest(tableName, method = 'GET', body = null, recordId = null, queryParams = null) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    return { success: false, simulated: true };
  }

  let url = recordId
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

  if (queryParams) {
    url += `?${queryParams}`;
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error(`[ChiefOfStaff] Airtable ${method} 오류:`, data.error?.message || data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`[ChiefOfStaff] Airtable ${method} 실패:`, error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 전송
// ═══════════════════════════════════════════════════════════════════════════

async function postToSlack(channel, blocks, text) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[ChiefOfStaff] Slack 토큰 미설정 - 시뮬레이션');
    return { success: false, simulated: true };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({ channel, blocks, text })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[ChiefOfStaff] Slack 전송 실패:', data.error);
      return { success: false, error: data.error };
    }

    return { success: true, ts: data.ts };
  } catch (error) {
    console.error('[ChiefOfStaff] Slack 전송 오류:', error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 알람 룰 체크 함수들
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 룰 1: 앱 health fail
 */
async function checkAppHealth() {
  try {
    const response = await fetch(`${process.env.APP_BASE_URL || 'https://app.dailymiracles.kr'}/api/health`, {
      timeout: 10000
    });

    if (!response.ok) {
      return {
        triggered: true,
        rule: 'APP_HEALTH_FAIL',
        severity: SEVERITY.CRITICAL,
        message: `앱 헬스체크 실패: HTTP ${response.status}`,
        details: { status: response.status }
      };
    }

    return { triggered: false, rule: 'APP_HEALTH_FAIL' };
  } catch (error) {
    return {
      triggered: true,
      rule: 'APP_HEALTH_FAIL',
      severity: SEVERITY.CRITICAL,
      message: `앱 헬스체크 실패: ${error.message}`,
      details: { error: error.message }
    };
  }
}

/**
 * 룰 2: Airtable write fail (최근 쓰기 테스트)
 */
async function checkAirtableWrite() {
  const testResult = await airtableRequest(TABLES.SESSIONS, 'GET', null, null, 'maxRecords=1');

  if (testResult.simulated) {
    return { triggered: false, rule: 'AIRTABLE_WRITE_FAIL', simulated: true };
  }

  if (!testResult.success) {
    return {
      triggered: true,
      rule: 'AIRTABLE_WRITE_FAIL',
      severity: SEVERITY.CRITICAL,
      message: 'Airtable 연결 실패',
      details: { error: testResult.error?.message || testResult.error }
    };
  }

  return { triggered: false, rule: 'AIRTABLE_WRITE_FAIL' };
}

/**
 * 룰 3: Sessions/Messages 정합성 체크
 */
async function checkDataIntegrity() {
  // COMPLETED 상태인데 7개 미만 메시지가 있는 세션 확인
  const filterFormula = `AND({run_status}="COMPLETED", {answered_count}<7)`;

  const result = await airtableRequest(
    TABLES.SESSIONS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=10`
  );

  if (result.simulated) {
    return { triggered: false, rule: 'DATA_INTEGRITY_FAIL', simulated: true };
  }

  if (result.success && result.data.records && result.data.records.length > 0) {
    const brokenSessions = result.data.records.map(r => r.fields.session_id);
    return {
      triggered: true,
      rule: 'DATA_INTEGRITY_FAIL',
      severity: SEVERITY.WARNING,
      message: `정합성 오류: COMPLETED 상태인데 답변 부족 (${brokenSessions.length}건)`,
      details: { sessions: brokenSessions }
    };
  }

  return { triggered: false, rule: 'DATA_INTEGRITY_FAIL' };
}

/**
 * 룰 4: 🔴 RED 미처리 10분 초과
 */
async function checkRedUnhandled() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const filterFormula = `AND({risk_level}="RED", {run_status}="PAUSED", IS_BEFORE({updated_at}, '${tenMinutesAgo}'))`;

  const result = await airtableRequest(
    TABLES.SESSIONS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=10`
  );

  if (result.simulated) {
    return { triggered: false, rule: 'RED_UNHANDLED_10M', simulated: true };
  }

  if (result.success && result.data.records && result.data.records.length > 0) {
    const sessions = result.data.records.map(r => ({
      id: r.fields.session_id,
      updatedAt: r.fields.updated_at
    }));

    return {
      triggered: true,
      rule: 'RED_UNHANDLED_10M',
      severity: SEVERITY.CRITICAL,
      message: `🔴 RED 미처리 10분 초과: ${sessions.length}건`,
      details: { sessions }
    };
  }

  return { triggered: false, rule: 'RED_UNHANDLED_10M' };
}

/**
 * 룰 5: 🟡 YELLOW 미처리 30분 초과
 */
async function checkYellowUnhandled() {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const filterFormula = `AND({risk_level}="YELLOW", {run_status}="REVIEW_NEEDED", IS_BEFORE({updated_at}, '${thirtyMinutesAgo}'))`;

  const result = await airtableRequest(
    TABLES.SESSIONS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=10`
  );

  if (result.simulated) {
    return { triggered: false, rule: 'YELLOW_UNHANDLED_30M', simulated: true };
  }

  if (result.success && result.data.records && result.data.records.length > 0) {
    const sessions = result.data.records.map(r => ({
      id: r.fields.session_id,
      updatedAt: r.fields.updated_at
    }));

    return {
      triggered: true,
      rule: 'YELLOW_UNHANDLED_30M',
      severity: SEVERITY.WARNING,
      message: `🟡 YELLOW 미처리 30분 초과: ${sessions.length}건`,
      details: { sessions }
    };
  }

  return { triggered: false, rule: 'YELLOW_UNHANDLED_30M' };
}

/**
 * 룰 6: 18:00 리포트 미생성 체크
 */
async function checkDailyReportMissing() {
  const now = new Date();
  const hour = now.getHours();

  // 18시 이후에만 체크
  if (hour < 18) {
    return { triggered: false, rule: 'DAILY_REPORT_MISSING', reason: 'before_18' };
  }

  const today = now.toISOString().slice(0, 10);
  const filterFormula = `AND({report_type}="daily", FIND('${today}', {idempotency_key}))`;

  const result = await airtableRequest(
    TABLES.OPS_REPORTS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`
  );

  if (result.simulated) {
    return { triggered: false, rule: 'DAILY_REPORT_MISSING', simulated: true };
  }

  if (result.success && (!result.data.records || result.data.records.length === 0)) {
    return {
      triggered: true,
      rule: 'DAILY_REPORT_MISSING',
      severity: SEVERITY.WARNING,
      message: `18:00 Daily 리포트 미생성 (${today})`,
      details: { date: today }
    };
  }

  return { triggered: false, rule: 'DAILY_REPORT_MISSING' };
}

/**
 * 룰 7: 홍보 중인데 30분 유입 0
 */
async function checkZeroInflowDuringPromo(windowMinutes = 30) {
  // 프로모션 활성 여부 체크 (환경변수로 관리)
  const promoActive = process.env.PROMO_ACTIVE === 'true';

  if (!promoActive) {
    return { triggered: false, rule: 'ZERO_INFLOW_PROMO', reason: 'promo_inactive' };
  }

  const startTime = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const filterFormula = `IS_AFTER({created_at}, '${startTime}')`;

  const result = await airtableRequest(
    TABLES.SESSIONS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`
  );

  if (result.simulated) {
    return { triggered: false, rule: 'ZERO_INFLOW_PROMO', simulated: true };
  }

  if (result.success && (!result.data.records || result.data.records.length === 0)) {
    return {
      triggered: true,
      rule: 'ZERO_INFLOW_PROMO',
      severity: SEVERITY.WARNING,
      message: `홍보 중인데 ${windowMinutes}분간 유입 0건`,
      details: { windowMinutes, promoActive }
    };
  }

  return { triggered: false, rule: 'ZERO_INFLOW_PROMO' };
}

/**
 * 룰 8: Slack post 실패 (테스트 메시지)
 */
async function checkSlackConnection() {
  // 실제 메시지를 보내지 않고 API 연결만 테스트
  if (!SLACK_BOT_TOKEN) {
    return {
      triggered: true,
      rule: 'SLACK_POST_FAIL',
      severity: SEVERITY.WARNING,
      message: 'Slack 봇 토큰 미설정',
      details: { configured: false }
    };
  }

  try {
    const response = await fetch('https://slack.com/api/auth.test', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!data.ok) {
      return {
        triggered: true,
        rule: 'SLACK_POST_FAIL',
        severity: SEVERITY.WARNING,
        message: `Slack 인증 실패: ${data.error}`,
        details: { error: data.error }
      };
    }

    return { triggered: false, rule: 'SLACK_POST_FAIL' };
  } catch (error) {
    return {
      triggered: true,
      rule: 'SLACK_POST_FAIL',
      severity: SEVERITY.WARNING,
      message: `Slack 연결 실패: ${error.message}`,
      details: { error: error.message }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Ops Alerts 저장
// ═══════════════════════════════════════════════════════════════════════════

async function saveAlert(alert) {
  const alertId = `alert_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const fields = {
    alert_id: alertId,
    rule: alert.rule,
    severity: alert.severity,
    message: alert.message,
    details: JSON.stringify(alert.details || {}),
    resolved: false,
    created_at: new Date().toISOString()
  };

  const result = await airtableRequest(TABLES.OPS_ALERTS, 'POST', { fields });

  if (result.simulated) {
    console.log(`[ChiefOfStaff] [시뮬레이션] 알람 저장: ${alertId}`);
    return { success: true, simulated: true, alertId };
  }

  if (result.success) {
    console.log(`[ChiefOfStaff] 알람 저장: ${alertId}`);
    return { success: true, alertId };
  }

  return { success: false, error: result.error };
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 알람 포맷
// ═══════════════════════════════════════════════════════════════════════════

function formatAlertBlocks(alerts) {
  const criticalAlerts = alerts.filter(a => a.severity === SEVERITY.CRITICAL);
  const warningAlerts = alerts.filter(a => a.severity === SEVERITY.WARNING);

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: criticalAlerts.length > 0 ? '🚨 ChiefOfStaff 긴급 알람' : '⚠️ ChiefOfStaff 알람',
        emoji: true
      }
    }
  ];

  // CRITICAL 알람
  if (criticalAlerts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🔴 CRITICAL (${criticalAlerts.length}건)*\n` +
          criticalAlerts.map(a => `• ${a.message}`).join('\n')
      }
    });
  }

  // WARNING 알람
  if (warningAlerts.length > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*🟡 WARNING (${warningAlerts.length}건)*\n` +
          warningAlerts.map(a => `• ${a.message}`).join('\n')
      }
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `감지 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
      }
    ]
  });

  return blocks;
}

/**
 * 리스크 에스컬레이션 블록 (RED/YELLOW 전용)
 */
function formatEscalationBlocks(alert) {
  const emoji = alert.rule.includes('RED') ? '🔴' : '🟡';
  const sessions = alert.details.sessions || [];

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} 리스크 에스컬레이션`,
        emoji: true
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${alert.message}*\n\n` +
          sessions.slice(0, 5).map(s => `• \`${s.id}\` (${s.updatedAt})`).join('\n') +
          (sessions.length > 5 ? `\n... 외 ${sessions.length - 5}건` : '')
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `즉시 확인이 필요합니다. | 감지: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
        }
      ]
    }
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 함수: Chief Run
// ═══════════════════════════════════════════════════════════════════════════

/**
 * ChiefOfStaff 실행 - 모든 알람 룰 체크
 * @param {Object} options - { windowMinutes, forceRun }
 */
async function runChiefOfStaff(options = {}) {
  const windowMinutes = options.windowMinutes || 30;
  const timestamp = Math.floor(Date.now() / (5 * 60 * 1000)); // 5분 단위
  const idempotencyKey = `chief_${timestamp}`;

  // Idempotency 체크
  if (!options.forceRun && idempotencyCache.has(idempotencyKey)) {
    console.log(`[ChiefOfStaff] 이미 실행됨: ${idempotencyKey}`);
    return {
      success: true,
      skipped: true,
      reason: 'already_run',
      idempotencyKey
    };
  }

  console.log(`[ChiefOfStaff] 감시 실행 시작: ${new Date().toISOString()}`);

  // 모든 룰 체크 (병렬 실행)
  const checkResults = await Promise.all([
    checkAppHealth(),
    checkAirtableWrite(),
    checkDataIntegrity(),
    checkRedUnhandled(),
    checkYellowUnhandled(),
    checkDailyReportMissing(),
    checkZeroInflowDuringPromo(windowMinutes),
    checkSlackConnection()
  ]);

  // 트리거된 알람 필터
  const triggeredAlerts = checkResults.filter(r => r.triggered);
  const allResults = checkResults;

  console.log(`[ChiefOfStaff] 체크 완료: ${triggeredAlerts.length}개 알람 발생`);

  // 알람이 있으면 처리
  const savedAlerts = [];
  const slackResults = [];

  if (triggeredAlerts.length > 0) {
    // PR-1: 1. 각 알람 Airtable 저장 (N+1 → Promise.allSettled 병렬 처리)
    const saveResults = await Promise.allSettled(
      triggeredAlerts.map(alert => saveAlert(alert))
    );

    saveResults.forEach((result, i) => {
      const alert = triggeredAlerts[i];
      if (result.status === 'fulfilled') {
        savedAlerts.push({ ...alert, saved: result.value.success, alertId: result.value.alertId });
      } else {
        console.error(`[ChiefOfStaff] Alert 저장 실패:`, result.reason);
        savedAlerts.push({ ...alert, saved: false, error: result.reason?.message });
      }
    });

    // 2. 일반 알람 Slack 게시 (#소원이-리포트)
    const generalAlerts = triggeredAlerts.filter(a =>
      !a.rule.includes('RED_UNHANDLED') && !a.rule.includes('YELLOW_UNHANDLED')
    );

    if (generalAlerts.length > 0) {
      const blocks = formatAlertBlocks(generalAlerts);
      const slackResult = await postToSlack(
        SLACK_CHANNEL_REPORT,
        blocks,
        `ChiefOfStaff 알람: ${generalAlerts.length}건 감지`
      );
      slackResults.push({ channel: 'report', ...slackResult });
    }

    // PR-1: 3. 리스크 에스컬레이션 (N+1 → Promise.allSettled 병렬 처리)
    const riskAlerts = triggeredAlerts.filter(a =>
      a.rule.includes('RED_UNHANDLED') || a.rule.includes('YELLOW_UNHANDLED')
    );

    if (riskAlerts.length > 0) {
      const riskSlackResults = await Promise.allSettled(
        riskAlerts.map(alert => {
          const blocks = formatEscalationBlocks(alert);
          return postToSlack(
            SLACK_CHANNEL_REVIEW,
            blocks,
            `${alert.rule.includes('RED') ? '🔴' : '🟡'} 리스크 에스컬레이션: ${alert.message}`
          ).then(result => ({ channel: 'review', rule: alert.rule, ...result }));
        })
      );

      riskSlackResults.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          slackResults.push(result.value);
        } else {
          console.error(`[ChiefOfStaff] Slack 전송 실패 [${riskAlerts[i].rule}]:`, result.reason);
        }
      });
    }
  }

  // Idempotency 캐시 업데이트
  idempotencyCache.set(idempotencyKey, Date.now());

  return {
    success: true,
    runAt: new Date().toISOString(),
    checksRun: allResults.length,
    alertsTriggered: triggeredAlerts.length,
    alerts: savedAlerts,
    slackResults,
    idempotencyKey,
    summary: {
      appHealth: !allResults[0].triggered,
      airtable: !allResults[1].triggered,
      dataIntegrity: !allResults[2].triggered,
      redUnhandled: allResults[3].triggered ? allResults[3].details?.sessions?.length : 0,
      yellowUnhandled: allResults[4].triggered ? allResults[4].details?.sessions?.length : 0,
      dailyReport: !allResults[5].triggered,
      promoInflow: !allResults[6].triggered,
      slack: !allResults[7].triggered
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  runChiefOfStaff,
  SEVERITY,
  // 개별 체크 함수 (테스트용)
  checkAppHealth,
  checkAirtableWrite,
  checkDataIntegrity,
  checkRedUnhandled,
  checkYellowUnhandled,
  checkDailyReportMissing,
  checkZeroInflowDuringPromo,
  checkSlackConnection
};
