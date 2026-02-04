/**
 * auditService.js
 * 감사 로그 서비스
 *
 * 목적: 모든 변경 사항 100% 추적
 */

const db = require('../../database/db');

/**
 * 감사 로그 기록
 */
async function log({
  eventId,
  actorId,
  actorName,
  actorRole,
  action,
  objectType,
  objectId,
  objectLabel,
  beforeValue,
  afterValue,
  ipAddress,
  userAgent
}) {
  const result = await db.query(
    `INSERT INTO ops_audit_log
      (event_id, actor_id, actor_name, actor_role, action, object_type,
       object_id, object_label, before_value, after_value, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      eventId, actorId, actorName, actorRole, action, objectType,
      objectId, objectLabel,
      beforeValue ? JSON.stringify(beforeValue) : null,
      afterValue ? JSON.stringify(afterValue) : null,
      ipAddress, userAgent
    ]
  );
  return result.rows[0];
}

/**
 * 감사 로그 조회
 */
async function getLogs(eventId, {
  action,
  objectType,
  actorId,
  startDate,
  endDate,
  limit = 100,
  offset = 0
} = {}) {
  let query = `
    SELECT * FROM ops_audit_log
    WHERE event_id = $1
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (action) {
    query += ` AND action = $${paramIndex++}`;
    params.push(action);
  }

  if (objectType) {
    query += ` AND object_type = $${paramIndex++}`;
    params.push(objectType);
  }

  if (actorId) {
    query += ` AND actor_id = $${paramIndex++}`;
    params.push(actorId);
  }

  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 특정 객체의 감사 이력 조회
 */
async function getObjectHistory(objectType, objectId, { limit = 50 } = {}) {
  const result = await db.query(
    `SELECT * FROM ops_audit_log
     WHERE object_type = $1 AND object_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [objectType, objectId, limit]
  );
  return result.rows;
}

/**
 * 감사 로그 통계
 */
async function getStats(eventId, { startDate, endDate } = {}) {
  let dateFilter = '';
  const params = [eventId];
  let paramIndex = 2;

  if (startDate) {
    dateFilter += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }

  if (endDate) {
    dateFilter += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }

  const result = await db.query(`
    SELECT
      action,
      COUNT(*) as count
    FROM ops_audit_log
    WHERE event_id = $1 ${dateFilter}
    GROUP BY action
    ORDER BY count DESC
  `, params);

  const byAction = {};
  let total = 0;
  result.rows.forEach(row => {
    byAction[row.action] = parseInt(row.count, 10);
    total += parseInt(row.count, 10);
  });

  // 객체 유형별 통계
  const objectResult = await db.query(`
    SELECT
      object_type,
      COUNT(*) as count
    FROM ops_audit_log
    WHERE event_id = $1 ${dateFilter}
    GROUP BY object_type
    ORDER BY count DESC
  `, params);

  const byObjectType = {};
  objectResult.rows.forEach(row => {
    byObjectType[row.object_type] = parseInt(row.count, 10);
  });

  // 활동 사용자 수
  const actorResult = await db.query(`
    SELECT COUNT(DISTINCT actor_id) as unique_actors
    FROM ops_audit_log
    WHERE event_id = $1 ${dateFilter}
  `, params);

  return {
    total,
    byAction,
    byObjectType,
    uniqueActors: parseInt(actorResult.rows[0].unique_actors, 10)
  };
}

/**
 * CSV Export 형식으로 변환
 */
async function exportToCsv(eventId, { startDate, endDate } = {}) {
  const logs = await getLogs(eventId, { startDate, endDate, limit: 10000 });

  const headers = [
    'timestamp', 'actor_name', 'actor_role', 'action',
    'object_type', 'object_label', 'before_value', 'after_value'
  ];

  const rows = logs.map(log => [
    log.created_at,
    log.actor_name || '',
    log.actor_role || '',
    log.action,
    log.object_type,
    log.object_label || '',
    log.before_value ? JSON.stringify(log.before_value) : '',
    log.after_value ? JSON.stringify(log.after_value) : ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

/**
 * JSON Export 형식으로 변환
 */
async function exportToJson(eventId, { startDate, endDate } = {}) {
  const logs = await getLogs(eventId, { startDate, endDate, limit: 10000 });
  return {
    exportedAt: new Date().toISOString(),
    eventId,
    dateRange: { startDate, endDate },
    totalRecords: logs.length,
    logs: logs.map(log => ({
      timestamp: log.created_at,
      actor: {
        id: log.actor_id,
        name: log.actor_name,
        role: log.actor_role
      },
      action: log.action,
      object: {
        type: log.object_type,
        id: log.object_id,
        label: log.object_label
      },
      changes: {
        before: log.before_value,
        after: log.after_value
      }
    }))
  };
}

/**
 * 최근 활동 조회 (대시보드용)
 */
async function getRecentActivity(eventId, { limit = 10 } = {}) {
  const result = await db.query(
    `SELECT * FROM ops_audit_log
     WHERE event_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [eventId, limit]
  );
  return result.rows;
}

/**
 * 일별 활동 집계
 */
async function getDailyActivity(eventId, { days = 7 } = {}) {
  const result = await db.query(`
    SELECT
      DATE(created_at) as date,
      COUNT(*) as total_actions,
      COUNT(DISTINCT actor_id) as unique_actors
    FROM ops_audit_log
    WHERE event_id = $1
      AND created_at >= CURRENT_DATE - INTERVAL '${days} days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, [eventId]);

  return result.rows;
}

module.exports = {
  log,
  getLogs,
  getObjectHistory,
  getStats,
  exportToCsv,
  exportToJson,
  getRecentActivity,
  getDailyActivity
};
