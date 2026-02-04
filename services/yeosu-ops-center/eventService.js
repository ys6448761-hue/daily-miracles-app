/**
 * eventService.js
 * 행사/축제 관리 서비스
 */

const db = require('../../database/db');

/**
 * 행사 생성
 */
async function createEvent({
  name,
  description,
  periodStart,
  periodEnd,
  location,
  status = 'DRAFT',
  metadata = {},
  createdBy
}) {
  const result = await db.query(
    `INSERT INTO ops_events
      (name, description, period_start, period_end, location, status, metadata, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [name, description, periodStart, periodEnd, location, status, JSON.stringify(metadata), createdBy]
  );
  return result.rows[0];
}

/**
 * 행사 목록 조회
 */
async function listEvents({ status, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT e.*,
      (SELECT COUNT(*) FROM ops_members WHERE event_id = e.id) as member_count,
      (SELECT COUNT(*) FROM ops_ssot_items WHERE event_id = e.id) as ssot_count
    FROM ops_events e
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND e.status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY e.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 행사 상세 조회
 */
async function getEvent(eventId) {
  const result = await db.query(
    `SELECT e.*,
      (SELECT COUNT(*) FROM ops_members WHERE event_id = e.id) as member_count,
      (SELECT COUNT(*) FROM ops_ssot_items WHERE event_id = e.id) as ssot_count,
      (SELECT COUNT(*) FROM ops_approvals WHERE event_id = e.id AND status = 'PENDING') as pending_approvals
     FROM ops_events e
     WHERE e.id = $1`,
    [eventId]
  );
  return result.rows[0] || null;
}

/**
 * 행사 수정
 */
async function updateEvent(eventId, updates) {
  const allowedFields = ['name', 'description', 'period_start', 'period_end', 'location', 'status', 'metadata'];
  const setClauses = [];
  const params = [eventId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbKey)) {
      setClauses.push(`${dbKey} = $${paramIndex++}`);
      params.push(dbKey === 'metadata' ? JSON.stringify(value) : value);
    }
  }

  if (setClauses.length === 0) {
    return getEvent(eventId);
  }

  const result = await db.query(
    `UPDATE ops_events SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0];
}

/**
 * 행사 삭제
 */
async function deleteEvent(eventId) {
  const result = await db.query(
    `DELETE FROM ops_events WHERE id = $1 RETURNING id`,
    [eventId]
  );
  return result.rowCount > 0;
}

/**
 * 행사 통계
 */
async function getEventStats(eventId) {
  const stats = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM ops_members WHERE event_id = $1) as total_members,
      (SELECT COUNT(*) FROM ops_ssot_items WHERE event_id = $1) as total_ssot_items,
      (SELECT COUNT(*) FROM ops_ssot_items WHERE event_id = $1 AND status = 'APPROVED') as approved_items,
      (SELECT COUNT(*) FROM ops_ssot_items WHERE event_id = $1 AND status = 'PENDING_APPROVAL') as pending_items,
      (SELECT COUNT(*) FROM ops_approvals WHERE event_id = $1 AND status = 'PENDING') as pending_approvals,
      (SELECT COUNT(*) FROM ops_audit_log WHERE event_id = $1) as total_audit_logs,
      (SELECT COUNT(*) FROM ops_partners WHERE event_id = $1 AND is_active = true) as active_partners
  `, [eventId]);

  return stats.rows[0];
}

module.exports = {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventStats
};
