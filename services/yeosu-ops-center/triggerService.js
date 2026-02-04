/**
 * triggerService.js
 * 트리거 알림 서비스
 *
 * 트리거 5종:
 * 1. schedule_change - 일정 변경 시 알림
 * 2. operation_update - 운영안 수정 시 알림
 * 3. notice_urgent - 긴급 공지 등록 시 알림
 * 4. approval_request - 승인 요청 생성 시 알림
 * 5. issue_registered - 이슈 발생 등록 시 알림
 *
 * v0: Slack Webhook 우선 지원
 */

const db = require('../../database/db');

/**
 * 트리거 생성
 */
async function createTrigger({
  eventId,
  triggerType,
  triggerCondition = {},
  actionType = 'slack',
  actionChannel,
  actionTemplate,
  isActive = true,
  createdBy
}) {
  const result = await db.query(
    `INSERT INTO ops_triggers
      (event_id, trigger_type, trigger_condition, action_type, action_channel,
       action_template, is_active, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      eventId, triggerType, JSON.stringify(triggerCondition), actionType,
      actionChannel, actionTemplate, isActive, createdBy
    ]
  );
  return result.rows[0];
}

/**
 * 트리거 목록 조회
 */
async function listTriggers(eventId, { triggerType, isActive } = {}) {
  let query = `SELECT * FROM ops_triggers WHERE event_id = $1`;
  const params = [eventId];
  let paramIndex = 2;

  if (triggerType) {
    query += ` AND trigger_type = $${paramIndex++}`;
    params.push(triggerType);
  }

  if (isActive !== undefined) {
    query += ` AND is_active = $${paramIndex++}`;
    params.push(isActive);
  }

  query += ` ORDER BY created_at ASC`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 트리거 조회
 */
async function getTrigger(triggerId) {
  const result = await db.query(
    `SELECT * FROM ops_triggers WHERE id = $1`,
    [triggerId]
  );
  return result.rows[0] || null;
}

/**
 * 트리거 수정
 */
async function updateTrigger(triggerId, updates) {
  const allowedFields = ['trigger_condition', 'action_type', 'action_channel', 'action_template', 'is_active'];
  const setClauses = [];
  const params = [triggerId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbKey)) {
      setClauses.push(`${dbKey} = $${paramIndex++}`);
      params.push(dbKey === 'trigger_condition' ? JSON.stringify(value) : value);
    }
  }

  if (setClauses.length === 0) {
    return getTrigger(triggerId);
  }

  const result = await db.query(
    `UPDATE ops_triggers SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0];
}

/**
 * 트리거 삭제
 */
async function deleteTrigger(triggerId) {
  const result = await db.query(
    `DELETE FROM ops_triggers WHERE id = $1 RETURNING id`,
    [triggerId]
  );
  return result.rowCount > 0;
}

/**
 * 트리거 실행 (핵심)
 */
async function executeTrigger(triggerId, payload) {
  const trigger = await getTrigger(triggerId);

  if (!trigger || !trigger.is_active) {
    return { success: false, error: 'Trigger not found or inactive' };
  }

  let result = 'SUCCESS';
  let errorMessage = null;

  try {
    // 메시지 렌더링
    const message = renderTemplate(trigger.action_template, payload);

    // 액션 실행
    if (trigger.action_type === 'slack') {
      await sendSlackNotification(trigger.action_channel, message);
    } else if (trigger.action_type === 'webhook') {
      await sendWebhook(trigger.action_channel, { ...payload, message });
    }
    // email, sms는 v0에서 미지원

  } catch (error) {
    result = 'FAILED';
    errorMessage = error.message;
    console.error(`[Trigger ${triggerId}] Execution failed:`, error.message);
  }

  // 로그 기록
  await db.query(
    `INSERT INTO ops_trigger_logs
      (trigger_id, event_id, trigger_type, payload, result, error_message)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [triggerId, trigger.event_id, trigger.trigger_type, JSON.stringify(payload), result, errorMessage]
  );

  return { success: result === 'SUCCESS', result, error: errorMessage };
}

/**
 * 이벤트 기반 트리거 실행
 */
async function fireTriggers(eventId, triggerType, payload) {
  const triggers = await db.query(
    `SELECT * FROM ops_triggers
     WHERE event_id = $1 AND trigger_type = $2 AND is_active = true`,
    [eventId, triggerType]
  );

  const results = [];
  for (const trigger of triggers.rows) {
    const result = await executeTrigger(trigger.id, payload);
    results.push({ triggerId: trigger.id, ...result });
  }

  return results;
}

/**
 * 템플릿 렌더링
 */
function renderTemplate(template, data) {
  if (!template) return JSON.stringify(data);

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? data[key] : match;
  });
}

/**
 * Slack 알림 발송
 */
async function sendSlackNotification(webhookUrl, message) {
  if (!webhookUrl) {
    throw new Error('Slack webhook URL not configured');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: message,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: message }
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Slack API error: ${response.status}`);
  }

  return true;
}

/**
 * Webhook 발송
 */
async function sendWebhook(webhookUrl, payload) {
  if (!webhookUrl) {
    throw new Error('Webhook URL not configured');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status}`);
  }

  return true;
}

/**
 * 트리거 실행 로그 조회
 */
async function getTriggerLogs(eventId, { triggerId, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT l.*, t.action_type, t.action_channel
    FROM ops_trigger_logs l
    LEFT JOIN ops_triggers t ON l.trigger_id = t.id
    WHERE l.event_id = $1
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (triggerId) {
    query += ` AND l.trigger_id = $${paramIndex++}`;
    params.push(triggerId);
  }

  query += ` ORDER BY l.executed_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 트리거 통계
 */
async function getTriggerStats(eventId) {
  const result = await db.query(`
    SELECT
      trigger_type,
      COUNT(*) as total_executions,
      COUNT(*) FILTER (WHERE result = 'SUCCESS') as success_count,
      COUNT(*) FILTER (WHERE result = 'FAILED') as failed_count
    FROM ops_trigger_logs
    WHERE event_id = $1
    GROUP BY trigger_type
  `, [eventId]);

  return result.rows;
}

// 트리거 유형별 기본 템플릿
const DEFAULT_TEMPLATES = {
  schedule_change: '📅 *일정 변경* - {{label}}\n변경자: {{changedBy}}\n내용: {{newValue}}',
  operation_update: '📋 *운영안 수정* - {{label}}\n변경자: {{changedBy}}\n변경 사유: {{reason}}',
  notice_urgent: '🚨 *긴급 공지*\n{{title}}\n{{content}}',
  approval_request: '✋ *승인 요청*\n항목: {{label}}\n요청자: {{requestedBy}}\n사유: {{reason}}',
  issue_registered: '⚠️ *이슈 발생*\n{{title}}\n{{description}}'
};

module.exports = {
  createTrigger,
  listTriggers,
  getTrigger,
  updateTrigger,
  deleteTrigger,
  executeTrigger,
  fireTriggers,
  getTriggerLogs,
  getTriggerStats,
  renderTemplate,
  sendSlackNotification,
  DEFAULT_TEMPLATES
};
