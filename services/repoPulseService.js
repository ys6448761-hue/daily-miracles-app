/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RepoPulse Service - 코드 변화 자동 감지 및 업그레이드 브리프 시스템
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 목적: "최신이 뭐지?" 질문을 Airtable+Slack 한 곳에서 끝내기
 *
 * 기능:
 * - GitHub Webhook: push(main), PR merged, release
 * - Render Deploy Hook: 배포 시작/성공/실패
 * - 영향 분석: API/Contract/Rule/알림정책 변화 자동 추출
 * - Slack 브리프: 10줄 고정 포맷 + 팀 ACK
 * - Airtable Upgrades: 업그레이드 이력 저장
 *
 * 작성일: 2026-01-18
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// 환경 설정
// ═══════════════════════════════════════════════════════════════════════════

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const GITHUB_WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET;

// Slack 채널
const SLACK_CHANNEL_UPGRADES = process.env.SLACK_CHANNEL_UPGRADES || 'C0A8CRLJW6B'; // #ops-upgrades

const TABLES = {
  UPGRADES: process.env.AIRTABLE_TABLE_UPGRADES || 'Upgrades'
};

// 영향 분석 규칙: 파일 패턴 → 영향 영역
const IMPACT_RULES = {
  // API/라우트 변화
  'routes/': { area: 'API', severity: 'HIGH', notify: ['코미'] },
  'server.js': { area: 'API', severity: 'HIGH', notify: ['코미'] },

  // Contract/Rule 변화
  'skills/aurora5-core/': { area: 'CONTRACT', severity: 'CRITICAL', notify: ['코미', '여의보주'] },
  'config/messageTemplates': { area: 'CONTRACT', severity: 'HIGH', notify: ['코미'] },

  // 메시지 프로바이더 변화
  'services/solapiService': { area: 'MESSAGING', severity: 'HIGH', notify: ['코미'] },
  'services/sensService': { area: 'MESSAGING', severity: 'HIGH', notify: ['코미'] },

  // LLM Provider 변화
  'services/openaiService': { area: 'LLM', severity: 'MEDIUM', notify: [] },
  'services/anthropicService': { area: 'LLM', severity: 'MEDIUM', notify: [] },

  // 신호등/SLA/알림 정책 변화
  'RISK_PATTERNS': { area: 'SAFETY', severity: 'CRITICAL', notify: ['코미', '여의보주'] },
  'SESSION_STATUS': { area: 'FLOW', severity: 'HIGH', notify: ['코미'] },

  // Ops 시스템 변화
  'services/opsReportService': { area: 'OPS', severity: 'MEDIUM', notify: [] },
  'services/chiefOfStaffService': { area: 'OPS', severity: 'MEDIUM', notify: [] },

  // Wish Intake 변화
  'services/wishIntakeService': { area: 'CORE', severity: 'HIGH', notify: ['코미'] },
  'WISH_QUESTIONS': { area: 'CONTRACT', severity: 'CRITICAL', notify: ['코미', '여의보주'] }
};

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
      console.error(`[RepoPulse] Airtable ${method} 오류:`, data.error?.message || data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`[RepoPulse] Airtable ${method} 실패:`, error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 메시지 전송
// ═══════════════════════════════════════════════════════════════════════════

async function postToSlack(channel, blocks, text) {
  if (!SLACK_BOT_TOKEN) {
    console.warn('[RepoPulse] Slack 토큰 미설정 - 시뮬레이션');
    return { success: false, simulated: true, ok: false, error: 'no_token', channel };
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

    // Slack API 응답 상세 로그
    console.log(`[RepoPulse] Slack API 응답: ok=${data.ok}, channel=${data.channel || channel}, error=${data.error || 'none'}`);

    if (!data.ok) {
      console.error('[RepoPulse] Slack 전송 실패:', data.error);
      return {
        success: false,
        ok: false,
        error: data.error,
        channel: data.channel || channel
      };
    }

    return {
      success: true,
      ok: true,
      ts: data.ts,
      channel: data.channel,
      error: null
    };
  } catch (error) {
    console.error('[RepoPulse] Slack 전송 오류:', error.message);
    return {
      success: false,
      ok: false,
      error: error.message,
      channel
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GitHub Webhook 서명 검증
// ═══════════════════════════════════════════════════════════════════════════

function verifyGitHubSignature(payload, signature) {
  if (!GITHUB_WEBHOOK_SECRET) {
    console.warn('[RepoPulse] GitHub Webhook Secret 미설정');
    return false;
  }

  const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// ═══════════════════════════════════════════════════════════════════════════
// 영향 분석
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 변경 파일 목록에서 영향 영역 분석
 * @param {Array} files - 변경된 파일 목록 (GitHub diff)
 * @returns {Object} 영향 분석 결과
 */
function analyzeImpact(files) {
  const impacts = {
    areas: new Set(),
    severity: 'LOW',
    notify: new Set(),
    details: []
  };

  const severityOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  for (const file of files) {
    const filename = file.filename || file;

    for (const [pattern, rule] of Object.entries(IMPACT_RULES)) {
      if (filename.includes(pattern)) {
        impacts.areas.add(rule.area);
        impacts.details.push({
          file: filename,
          area: rule.area,
          severity: rule.severity
        });

        // 가장 높은 심각도 유지
        if (severityOrder.indexOf(rule.severity) > severityOrder.indexOf(impacts.severity)) {
          impacts.severity = rule.severity;
        }

        // 알림 대상 추가
        for (const person of rule.notify) {
          impacts.notify.add(person);
        }
      }
    }
  }

  return {
    areas: Array.from(impacts.areas),
    severity: impacts.severity,
    notify: Array.from(impacts.notify),
    details: impacts.details,
    isCritical: impacts.severity === 'CRITICAL',
    requiresReview: impacts.severity === 'CRITICAL' || impacts.severity === 'HIGH'
  };
}

/**
 * 커밋 메시지에서 버전 변화 추출
 * @param {string} message - 커밋 메시지
 */
function extractVersionChanges(message) {
  const changes = {
    contractVersion: null,
    ruleVersion: null,
    apiChanges: [],
    dataChanges: [],
    opsChanges: []
  };

  // 버전 패턴 추출
  const versionMatch = message.match(/v(\d+\.\d+\.\d+)/);
  if (versionMatch) {
    changes.contractVersion = versionMatch[1];
  }

  // DEC- 패턴 (결정문 버전)
  const decMatch = message.match(/DEC-(\d{4}-\d{4}-\d{3})/);
  if (decMatch) {
    changes.ruleVersion = decMatch[1];
  }

  // 변경 유형 키워드
  if (message.includes('api') || message.includes('route') || message.includes('endpoint')) {
    changes.apiChanges.push(message.split('\n')[0]);
  }
  if (message.includes('schema') || message.includes('table') || message.includes('field')) {
    changes.dataChanges.push(message.split('\n')[0]);
  }
  if (message.includes('ops') || message.includes('alert') || message.includes('monitor')) {
    changes.opsChanges.push(message.split('\n')[0]);
  }

  return changes;
}

// ═══════════════════════════════════════════════════════════════════════════
// Upgrade 레코드 저장
// ═══════════════════════════════════════════════════════════════════════════

async function saveUpgrade(upgradeData) {
  const upgradeId = `upgrade_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

  const fields = {
    upgrade_id: upgradeId,
    merged_at: upgradeData.mergedAt || new Date().toISOString(),
    deployed_at: upgradeData.deployedAt || '',
    contract_version: upgradeData.contractVersion || '',
    rule_version: upgradeData.ruleVersion || '',
    api_changes: JSON.stringify(upgradeData.apiChanges || []),
    data_changes: JSON.stringify(upgradeData.dataChanges || []),
    ops_changes: JSON.stringify(upgradeData.opsChanges || []),
    risks: upgradeData.risks || '',
    rollback: upgradeData.rollback || '',
    verification_checklist: upgradeData.verificationChecklist || '',
    action_items: upgradeData.actionItems || '',
    owner: upgradeData.owner || 'Code',
    commit_sha: upgradeData.commitSha || '',
    commit_message: upgradeData.commitMessage || '',
    impact_areas: JSON.stringify(upgradeData.impactAreas || []),
    impact_severity: upgradeData.impactSeverity || 'LOW'
  };

  const result = await airtableRequest(TABLES.UPGRADES, 'POST', { fields });

  if (result.simulated) {
    console.log(`[RepoPulse] [시뮬레이션] 업그레이드 저장: ${upgradeId}`);
    return { success: true, simulated: true, upgradeId };
  }

  if (result.success) {
    console.log(`[RepoPulse] 업그레이드 저장: ${upgradeId}`);
    return { success: true, upgradeId, recordId: result.data.id };
  }

  return { success: false, error: result.error };
}

// ═══════════════════════════════════════════════════════════════════════════
// Slack 브리프 포맷 (10줄 고정)
// ═══════════════════════════════════════════════════════════════════════════

function formatUpgradeBrief(data) {
  const emoji = data.impact.isCritical ? '🔴' : (data.impact.requiresReview ? '🟡' : '🟢');
  const mentionText = data.impact.notify.length > 0
    ? `cc: ${data.impact.notify.join(', ')}`
    : '';

  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} 업그레이드 브리프`,
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*커밋*\n\`${data.commitSha?.substring(0, 7) || 'N/A'}\`` },
        { type: 'mrkdwn', text: `*심각도*\n${data.impact.severity}` },
        { type: 'mrkdwn', text: `*영역*\n${data.impact.areas.join(', ') || 'N/A'}` },
        { type: 'mrkdwn', text: `*배포*\n${data.deployStatus || '대기'}` }
      ]
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*메시지*\n${data.commitMessage?.split('\n')[0] || 'N/A'}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*변경 파일*\n${data.changedFiles?.slice(0, 5).map(f => `• ${f}`).join('\n') || 'N/A'}${data.changedFiles?.length > 5 ? `\n... 외 ${data.changedFiles.length - 5}개` : ''}`
      }
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*ACK 요청* ${mentionText}\n✅ 확인완료 | 🧩 추가검토필요 | ⚠️ 이슈발견`
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `머지: ${new Date(data.mergedAt).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
        }
      ]
    }
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// GitHub Push 이벤트 처리
// ═══════════════════════════════════════════════════════════════════════════

async function handleGitHubPush(payload) {
  const ref = payload.ref || '';
  const branch = ref.replace('refs/heads/', '');

  // main 브랜치만 처리
  if (branch !== 'main' && branch !== 'master') {
    console.log(`[RepoPulse] 스킵: ${branch} 브랜치`);
    return { success: true, skipped: true, reason: 'not_main_branch' };
  }

  const commits = payload.commits || [];
  if (commits.length === 0) {
    return { success: true, skipped: true, reason: 'no_commits' };
  }

  // 최신 커밋 기준
  const latestCommit = commits[commits.length - 1];
  const allFiles = [];

  for (const commit of commits) {
    allFiles.push(...(commit.added || []), ...(commit.modified || []), ...(commit.removed || []));
  }

  const uniqueFiles = [...new Set(allFiles)];

  // 영향 분석
  const impact = analyzeImpact(uniqueFiles.map(f => ({ filename: f })));
  const versionChanges = extractVersionChanges(latestCommit.message || '');

  console.log(`[RepoPulse] GitHub Push 처리: ${latestCommit.id?.substring(0, 7)} (${uniqueFiles.length}개 파일)`);

  // Upgrade 저장
  const upgradeData = {
    mergedAt: latestCommit.timestamp || new Date().toISOString(),
    commitSha: latestCommit.id,
    commitMessage: latestCommit.message,
    changedFiles: uniqueFiles,
    impactAreas: impact.areas,
    impactSeverity: impact.severity,
    ...versionChanges,
    owner: latestCommit.author?.name || 'Unknown'
  };

  const saveResult = await saveUpgrade(upgradeData);

  // Slack 브리프 전송
  const briefData = {
    ...upgradeData,
    impact,
    deployStatus: '대기'
  };

  const blocks = formatUpgradeBrief(briefData);
  const slackResult = await postToSlack(
    SLACK_CHANNEL_UPGRADES,
    blocks,
    `${impact.isCritical ? '🔴' : '🟢'} 업그레이드: ${latestCommit.message?.split('\n')[0]}`
  );

  return {
    success: true,
    upgradeId: saveResult.upgradeId,
    impact,
    slackPosted: slackResult.ok === true,
    slack: {
      ok: slackResult.ok,
      error: slackResult.error,
      channel: slackResult.channel
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GitHub PR Merged 이벤트 처리
// ═══════════════════════════════════════════════════════════════════════════

async function handleGitHubPRMerged(payload) {
  const pr = payload.pull_request;

  if (!pr || !pr.merged) {
    return { success: true, skipped: true, reason: 'not_merged' };
  }

  console.log(`[RepoPulse] PR Merged 처리: #${pr.number} ${pr.title}`);

  // PR에서 변경 파일 가져오기 (GitHub API 호출 필요)
  // 여기서는 간단히 title + body로 분석
  const impact = analyzeImpact([{ filename: pr.title }]);
  const versionChanges = extractVersionChanges(pr.body || '');

  const upgradeData = {
    mergedAt: pr.merged_at,
    commitSha: pr.merge_commit_sha,
    commitMessage: `PR #${pr.number}: ${pr.title}`,
    impactAreas: impact.areas,
    impactSeverity: impact.severity,
    ...versionChanges,
    owner: pr.user?.login || 'Unknown'
  };

  const saveResult = await saveUpgrade(upgradeData);

  const briefData = {
    ...upgradeData,
    impact,
    deployStatus: '대기'
  };

  const blocks = formatUpgradeBrief(briefData);
  const slackResult = await postToSlack(
    SLACK_CHANNEL_UPGRADES,
    blocks,
    `${impact.isCritical ? '🔴' : '🟢'} PR Merged: ${pr.title}`
  );

  return {
    success: true,
    upgradeId: saveResult.upgradeId,
    impact,
    slackPosted: slackResult.ok === true,
    slack: {
      ok: slackResult.ok,
      error: slackResult.error,
      channel: slackResult.channel
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Render Deploy 이벤트 처리
// ═══════════════════════════════════════════════════════════════════════════

async function handleRenderDeploy(payload) {
  const { status, service, commit } = payload;

  console.log(`[RepoPulse] Render Deploy: ${status} (${commit?.id?.substring(0, 7) || 'N/A'})`);

  // 배포 상태에 따른 처리
  const statusEmoji = {
    'build_started': '🔨',
    'build_succeeded': '📦',
    'deploy_started': '🚀',
    'deploy_succeeded': '✅',
    'deploy_failed': '❌'
  };

  const emoji = statusEmoji[status] || '📋';
  const isFailed = status === 'deploy_failed';

  // Slack 알림
  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *Render 배포 ${status}*\n• 서비스: ${service?.name || 'daily-miracles-app'}\n• 커밋: \`${commit?.id?.substring(0, 7) || 'N/A'}\`\n• 메시지: ${commit?.message?.split('\n')[0] || 'N/A'}`
      }
    }
  ];

  if (isFailed) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '⚠️ *즉시 확인 필요* - 코미, 여의보주 cc'
      }
    });
  }

  const slackResult = await postToSlack(
    SLACK_CHANNEL_UPGRADES,
    blocks,
    `${emoji} Render 배포 ${status}`
  );

  // 성공 시 최근 Upgrade 레코드 업데이트
  if (status === 'deploy_succeeded' && commit?.id) {
    // TODO: 해당 커밋의 Upgrade 레코드 찾아서 deployed_at 업데이트
    console.log(`[RepoPulse] 배포 완료: ${commit.id.substring(0, 7)}`);
  }

  return {
    success: true,
    status,
    slackPosted: slackResult.ok === true,
    isFailed,
    slack: {
      ok: slackResult.ok,
      error: slackResult.error,
      channel: slackResult.channel
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  handleGitHubPush,
  handleGitHubPRMerged,
  handleRenderDeploy,
  verifyGitHubSignature,
  analyzeImpact,
  saveUpgrade,
  IMPACT_RULES
};
