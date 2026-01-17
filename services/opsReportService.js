/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Ops Report Service - 운영+홍보 통합 리포트 오케스트레이터 v1.0
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P0: Ops+Promo 통합 리포트
 * - Sessions 집계 (started/completed/completion_rate)
 * - 이탈 분석 (dropoff_top_question)
 * - 리스크 현황 (yellow/red/pending_review)
 * - UTM 성과 (utm_top_sources/top_campaigns)
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

// Slack 채널 ID (환경변수 또는 기본값)
const SLACK_CHANNEL_REPORT = process.env.SLACK_CHANNEL_REPORT || 'C0A8CRLJW6B'; // #소원이-리포트

const TABLES = {
  SESSIONS: process.env.AIRTABLE_TABLE_SESSIONS || 'Wish Intake Sessions',
  OPS_REPORTS: process.env.AIRTABLE_TABLE_OPS_REPORTS || 'Ops Reports'
};

// Idempotency 캐시 (메모리 기반, 1시간 TTL)
const idempotencyCache = new Map();
const IDEMPOTENCY_TTL_MS = 60 * 60 * 1000; // 1시간

// 캐시 정리 (10분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of idempotencyCache.entries()) {
    if (now - timestamp > IDEMPOTENCY_TTL_MS) {
      idempotencyCache.delete(key);
    }
  }
}, 10 * 60 * 1000);

// ═══════════════════════════════════════════════════════════════════════════
// Airtable API 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

async function airtableRequest(tableName, method = 'GET', body = null, recordId = null, queryParams = null) {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('[OpsReport] Airtable 미설정 - 시뮬레이션 모드');
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
      console.error(`[OpsReport] Airtable ${method} 오류:`, data.error?.message || data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`[OpsReport] Airtable ${method} 실패:`, error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 전송
// ═══════════════════════════════════════════════════════════════════════════

async function postToSlack(channel, blocks, text) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[OpsReport] Slack 토큰 미설정 - 시뮬레이션');
    return { success: false, simulated: true };
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        channel,
        blocks,
        text // fallback text
      })
    });

    const data = await response.json();

    if (!data.ok) {
      console.error('[OpsReport] Slack 전송 실패:', data.error);
      return { success: false, error: data.error };
    }

    console.log(`[OpsReport] Slack 전송 완료: ${channel}`);
    return { success: true, ts: data.ts };
  } catch (error) {
    console.error('[OpsReport] Slack 전송 오류:', error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 세션 데이터 조회 및 집계
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 기간 내 세션 조회
 * @param {Date} startTime - 시작 시간
 * @param {Date} endTime - 종료 시간
 */
async function fetchSessionsInRange(startTime, endTime) {
  const startISO = startTime.toISOString();
  const endISO = endTime.toISOString();

  // Airtable filterByFormula: created_at >= startISO AND created_at <= endISO
  const filterFormula = `AND(IS_AFTER({created_at}, '${startISO}'), IS_BEFORE({created_at}, '${endISO}'))`;

  const result = await airtableRequest(
    TABLES.SESSIONS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&pageSize=100`
  );

  if (result.simulated) {
    // 시뮬레이션 데이터
    return {
      success: true,
      simulated: true,
      sessions: [
        { run_status: 'COMPLETED', utm_source: 'kakao', utm_campaign: 'launch_0117', current_question: 7, risk_level: 'GREEN' },
        { run_status: 'IN_PROGRESS', utm_source: 'kakao', utm_campaign: 'launch_0117', current_question: 3, risk_level: 'GREEN' },
        { run_status: 'SUMMARIZED', utm_source: 'instagram', utm_campaign: 'story_ad', current_question: 7, risk_level: 'GREEN' }
      ]
    };
  }

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const sessions = result.data.records.map(r => r.fields);
  return { success: true, sessions };
}

/**
 * 오늘 전체 세션 조회 (daily 리포트용)
 */
async function fetchTodaySessions() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return fetchSessionsInRange(today, tomorrow);
}

/**
 * 최근 N분 세션 조회 (launch 리포트용)
 * @param {number} windowMinutes - 윈도우 (분)
 */
async function fetchRecentSessions(windowMinutes = 30) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - windowMinutes * 60 * 1000);

  return fetchSessionsInRange(startTime, endTime);
}

// ═══════════════════════════════════════════════════════════════════════════
// 집계 로직
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 세션 데이터 집계
 * @param {Array} sessions - 세션 배열
 */
function aggregateSessions(sessions) {
  const started = sessions.length;
  const completed = sessions.filter(s =>
    s.run_status === 'COMPLETED' || s.run_status === 'SUMMARIZED'
  ).length;
  const completionRate = started > 0 ? Math.round((completed / started) * 100) : 0;

  // 이탈 분석: 진행 중인 세션의 current_question 분포
  const inProgressSessions = sessions.filter(s => s.run_status === 'IN_PROGRESS');
  const dropoffByQuestion = {};
  for (const s of inProgressSessions) {
    const q = s.current_question || 1;
    dropoffByQuestion[`Q${q}`] = (dropoffByQuestion[`Q${q}`] || 0) + 1;
  }

  // 가장 많이 이탈한 질문
  let dropoffTopQuestion = null;
  let maxDropoff = 0;
  for (const [q, count] of Object.entries(dropoffByQuestion)) {
    if (count > maxDropoff) {
      maxDropoff = count;
      dropoffTopQuestion = q;
    }
  }

  // 리스크 현황
  const yellow = sessions.filter(s => s.risk_level === 'YELLOW').length;
  const red = sessions.filter(s => s.risk_level === 'RED').length;
  const pendingReview = sessions.filter(s =>
    s.run_status === 'REVIEW_NEEDED' || s.run_status === 'PAUSED'
  ).length;

  // UTM 성과 분석
  const utmSourceCounts = {};
  const utmCampaignCounts = {};

  for (const s of sessions) {
    const source = s.utm_source || 'unknown';
    const campaign = s.utm_campaign || 'unknown';

    utmSourceCounts[source] = (utmSourceCounts[source] || 0) + 1;
    utmCampaignCounts[campaign] = (utmCampaignCounts[campaign] || 0) + 1;
  }

  // Top 3 소스
  const utmTopSources = Object.entries(utmSourceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  // Top 3 캠페인
  const utmTopCampaigns = Object.entries(utmCampaignCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => ({ name, count }));

  return {
    started,
    completed,
    completionRate,
    dropoffTopQuestion,
    dropoffByQuestion,
    yellow,
    red,
    pendingReview,
    utmTopSources,
    utmTopCampaigns
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 포맷
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Daily 리포트 Slack 블록 생성
 */
function formatDailyReportBlocks(metrics, reportDate) {
  const dateStr = reportDate.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  const utmSourcesText = metrics.utmTopSources.length > 0
    ? metrics.utmTopSources.map(s => `${s.name}: ${s.count}건`).join(' | ')
    : '없음';

  const utmCampaignsText = metrics.utmTopCampaigns.length > 0
    ? metrics.utmTopCampaigns.map(c => `${c.name}: ${c.count}건`).join(' | ')
    : '없음';

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `📊 Daily 운영 리포트 (${dateStr})`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*시작된 세션*\n${metrics.started}건` },
        { type: 'mrkdwn', text: `*완료된 세션*\n${metrics.completed}건` },
        { type: 'mrkdwn', text: `*완료율*\n${metrics.completionRate}%` },
        { type: 'mrkdwn', text: `*이탈 집중 질문*\n${metrics.dropoffTopQuestion || '없음'}` }
      ]
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*🟡 YELLOW*\n${metrics.yellow}건` },
        { type: 'mrkdwn', text: `*🔴 RED*\n${metrics.red}건` },
        { type: 'mrkdwn', text: `*검토 대기*\n${metrics.pendingReview}건` }
      ]
    },
    {
      type: 'divider'
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📣 UTM 성과*\n• *Top Sources:* ${utmSourcesText}\n• *Top Campaigns:* ${utmCampaignsText}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `생성 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
        }
      ]
    }
  ];
}

/**
 * Launch 리포트 Slack 블록 생성
 */
function formatLaunchReportBlocks(metrics, windowMinutes) {
  const utmSourcesText = metrics.utmTopSources.length > 0
    ? metrics.utmTopSources.map(s => `${s.name}: ${s.count}건`).join(' | ')
    : '없음';

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `🚀 Launch 리포트 (최근 ${windowMinutes}분)`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*유입*\n${metrics.started}건` },
        { type: 'mrkdwn', text: `*완료*\n${metrics.completed}건` },
        { type: 'mrkdwn', text: `*완료율*\n${metrics.completionRate}%` }
      ]
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*🟡 YELLOW*\n${metrics.yellow}건` },
        { type: 'mrkdwn', text: `*🔴 RED*\n${metrics.red}건` }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*📣 Top Sources:* ${utmSourcesText}`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `생성 시각: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
        }
      ]
    }
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Ops Reports 저장
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ops Reports 테이블에 리포트 저장
 * @param {string} reportType - 'daily' | 'launch'
 * @param {Object} metrics - 집계 결과
 * @param {string} idempotencyKey - 중복 방지 키
 */
async function saveReport(reportType, metrics, idempotencyKey) {
  const fields = {
    report_id: `report_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    report_type: reportType,
    idempotency_key: idempotencyKey,
    started: metrics.started,
    completed: metrics.completed,
    completion_rate: metrics.completionRate,
    dropoff_top_question: metrics.dropoffTopQuestion || '',
    yellow_count: metrics.yellow,
    red_count: metrics.red,
    pending_review: metrics.pendingReview,
    utm_top_sources: JSON.stringify(metrics.utmTopSources),
    utm_top_campaigns: JSON.stringify(metrics.utmTopCampaigns),
    created_at: new Date().toISOString()
  };

  const result = await airtableRequest(TABLES.OPS_REPORTS, 'POST', { fields });

  if (result.simulated) {
    console.log('[OpsReport] [시뮬레이션] 리포트 저장:', fields.report_id);
    return { success: true, simulated: true, reportId: fields.report_id };
  }

  if (result.success) {
    console.log(`[OpsReport] 리포트 저장 완료: ${fields.report_id}`);
    return { success: true, reportId: fields.report_id };
  }

  return { success: false, error: result.error };
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 함수: Daily Report
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Daily 리포트 생성 및 게시
 * @param {Object} options - { forceRun: boolean }
 */
async function generateDailyReport(options = {}) {
  const today = new Date().toISOString().slice(0, 10);
  const idempotencyKey = `daily_${today}`;

  // Idempotency 체크
  if (!options.forceRun && idempotencyCache.has(idempotencyKey)) {
    console.log(`[OpsReport] Daily 리포트 이미 생성됨: ${idempotencyKey}`);
    return {
      success: true,
      skipped: true,
      reason: 'already_generated',
      idempotencyKey
    };
  }

  console.log(`[OpsReport] Daily 리포트 생성 시작: ${today}`);

  // 1. 세션 조회
  const sessionsResult = await fetchTodaySessions();
  if (!sessionsResult.success && !sessionsResult.simulated) {
    return { success: false, error: sessionsResult.error };
  }

  const sessions = sessionsResult.sessions || [];
  console.log(`[OpsReport] 오늘 세션 수: ${sessions.length}`);

  // 2. 집계
  const metrics = aggregateSessions(sessions);
  console.log(`[OpsReport] 집계 완료: started=${metrics.started}, completed=${metrics.completed}`);

  // 3. Airtable 저장
  const saveResult = await saveReport('daily', metrics, idempotencyKey);

  // 4. Slack 게시
  const blocks = formatDailyReportBlocks(metrics, new Date());
  const slackResult = await postToSlack(
    SLACK_CHANNEL_REPORT,
    blocks,
    `📊 Daily 운영 리포트: ${metrics.started}건 유입, ${metrics.completed}건 완료 (${metrics.completionRate}%)`
  );

  // Idempotency 캐시 업데이트
  idempotencyCache.set(idempotencyKey, Date.now());

  return {
    success: true,
    reportType: 'daily',
    metrics,
    saved: saveResult.success,
    slackPosted: slackResult.success,
    idempotencyKey,
    simulated: sessionsResult.simulated || false
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 함수: Launch Report
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Launch 리포트 생성 및 게시 (홍보 기간용 실시간 모니터링)
 * @param {Object} options - { windowMinutes: number, forceRun: boolean }
 */
async function generateLaunchReport(options = {}) {
  const windowMinutes = options.windowMinutes || 30;
  const timestamp = Math.floor(Date.now() / (windowMinutes * 60 * 1000));
  const idempotencyKey = `launch_${windowMinutes}m_${timestamp}`;

  // Idempotency 체크
  if (!options.forceRun && idempotencyCache.has(idempotencyKey)) {
    console.log(`[OpsReport] Launch 리포트 이미 생성됨: ${idempotencyKey}`);
    return {
      success: true,
      skipped: true,
      reason: 'already_generated',
      idempotencyKey
    };
  }

  console.log(`[OpsReport] Launch 리포트 생성 시작: 최근 ${windowMinutes}분`);

  // 1. 세션 조회
  const sessionsResult = await fetchRecentSessions(windowMinutes);
  if (!sessionsResult.success && !sessionsResult.simulated) {
    return { success: false, error: sessionsResult.error };
  }

  const sessions = sessionsResult.sessions || [];
  console.log(`[OpsReport] 최근 ${windowMinutes}분 세션 수: ${sessions.length}`);

  // 2. 집계
  const metrics = aggregateSessions(sessions);

  // 3. Airtable 저장
  const saveResult = await saveReport('launch', metrics, idempotencyKey);

  // 4. Slack 게시
  const blocks = formatLaunchReportBlocks(metrics, windowMinutes);
  const slackResult = await postToSlack(
    SLACK_CHANNEL_REPORT,
    blocks,
    `🚀 Launch 리포트 (${windowMinutes}분): ${metrics.started}건 유입, ${metrics.completed}건 완료`
  );

  // Idempotency 캐시 업데이트
  idempotencyCache.set(idempotencyKey, Date.now());

  return {
    success: true,
    reportType: 'launch',
    windowMinutes,
    metrics,
    saved: saveResult.success,
    slackPosted: slackResult.success,
    idempotencyKey,
    simulated: sessionsResult.simulated || false
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  generateDailyReport,
  generateLaunchReport,
  aggregateSessions,
  // 테스트용
  fetchTodaySessions,
  fetchRecentSessions
};
