/**
 * approvalService.js
 * 승인 흐름 관리 서비스
 *
 * v0 MVP: L1 단일 레벨만 지원
 */

const db = require('../../database/db');
const ssotService = require('./ssotService');

/**
 * 승인 요청 생성
 */
async function createApprovalRequest({
  eventId,
  targetType,
  targetId,
  requestedLevel = 'L1',
  requestedBy,
  requestedByName,
  requestReason,
  deadlineAt,
  metadata = {}
}) {
  const result = await db.query(
    `INSERT INTO ops_approvals
      (event_id, target_type, target_id, requested_level, status,
       requested_by, requested_by_name, request_reason, deadline_at, metadata)
     VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      eventId, targetType, targetId, requestedLevel,
      requestedBy, requestedByName, requestReason, deadlineAt,
      JSON.stringify(metadata)
    ]
  );
  return result.rows[0];
}

/**
 * 승인 요청 조회
 */
async function getApprovalRequest(approvalId) {
  const result = await db.query(
    `SELECT * FROM ops_approvals WHERE id = $1`,
    [approvalId]
  );
  return result.rows[0] || null;
}

/**
 * 대기 중인 승인 요청 목록
 */
async function getPendingApprovals(eventId, { targetType, level } = {}) {
  let query = `
    SELECT a.*,
      CASE
        WHEN a.target_type = 'ssot_item' THEN (
          SELECT i.label FROM ops_ssot_items i WHERE i.id = a.target_id
        )
        ELSE NULL
      END as target_label,
      CASE
        WHEN a.target_type = 'ssot_item' THEN (
          SELECT i.category FROM ops_ssot_items i WHERE i.id = a.target_id
        )
        ELSE NULL
      END as target_category
    FROM ops_approvals a
    WHERE a.event_id = $1 AND a.status = 'PENDING'
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (targetType) {
    query += ` AND a.target_type = $${paramIndex++}`;
    params.push(targetType);
  }

  if (level) {
    query += ` AND a.requested_level = $${paramIndex++}`;
    params.push(level);
  }

  query += ` ORDER BY a.created_at ASC`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 승인 처리
 */
async function approve(approvalId, { decidedBy, decidedByName, decisionReason }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 승인 요청 조회
    const approval = await client.query(
      `SELECT * FROM ops_approvals WHERE id = $1 FOR UPDATE`,
      [approvalId]
    );

    if (approval.rows.length === 0) {
      throw new Error('Approval request not found');
    }

    const request = approval.rows[0];

    if (request.status !== 'PENDING') {
      throw new Error('Approval request is not pending');
    }

    // 승인 요청 상태 업데이트
    const updateResult = await client.query(
      `UPDATE ops_approvals
       SET status = 'APPROVED',
           decided_by = $2,
           decided_by_name = $3,
           decision_reason = $4,
           decided_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [approvalId, decidedBy, decidedByName, decisionReason]
    );

    // 대상 항목 승인 처리 (ssot_item인 경우)
    if (request.target_type === 'ssot_item') {
      await ssotService.approveItem(request.target_id, {
        approvedBy: decidedBy,
        approvedByName: decidedByName
      });
    }

    await client.query('COMMIT');
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 반려 처리
 */
async function reject(approvalId, { decidedBy, decidedByName, decisionReason }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const approval = await client.query(
      `SELECT * FROM ops_approvals WHERE id = $1 FOR UPDATE`,
      [approvalId]
    );

    if (approval.rows.length === 0) {
      throw new Error('Approval request not found');
    }

    const request = approval.rows[0];

    if (request.status !== 'PENDING') {
      throw new Error('Approval request is not pending');
    }

    const updateResult = await client.query(
      `UPDATE ops_approvals
       SET status = 'REJECTED',
           decided_by = $2,
           decided_by_name = $3,
           decision_reason = $4,
           decided_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [approvalId, decidedBy, decidedByName, decisionReason]
    );

    // 대상 항목 반려 처리
    if (request.target_type === 'ssot_item') {
      await ssotService.rejectItem(request.target_id, {
        rejectedBy: decidedBy,
        rejectedByName: decidedByName,
        reason: decisionReason
      });
    }

    await client.query('COMMIT');
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * 승인 요청 취소
 */
async function cancelApproval(approvalId, { cancelledBy, cancelReason }) {
  const result = await db.query(
    `UPDATE ops_approvals
     SET status = 'CANCELLED',
         decision_reason = $3,
         decided_by = $2,
         decided_at = CURRENT_TIMESTAMP
     WHERE id = $1 AND status = 'PENDING'
     RETURNING *`,
    [approvalId, cancelledBy, cancelReason]
  );

  if (result.rows.length === 0) {
    throw new Error('Approval request not found or already processed');
  }

  return result.rows[0];
}

/**
 * 승인 이력 조회
 */
async function getApprovalHistory(eventId, { status, limit = 50, offset = 0 } = {}) {
  let query = `
    SELECT a.*,
      CASE
        WHEN a.target_type = 'ssot_item' THEN (
          SELECT i.label FROM ops_ssot_items i WHERE i.id = a.target_id
        )
        ELSE NULL
      END as target_label
    FROM ops_approvals a
    WHERE a.event_id = $1
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (status) {
    query += ` AND a.status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 승인 통계 (리드타임 포함)
 */
async function getApprovalStats(eventId) {
  const result = await db.query(`
    SELECT
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE status = 'PENDING') as pending_count,
      COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
      COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
      COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_count,
      AVG(EXTRACT(EPOCH FROM (decided_at - created_at)) / 3600)
        FILTER (WHERE status IN ('APPROVED', 'REJECTED'))
        as avg_leadtime_hours,
      PERCENTILE_CONT(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (decided_at - created_at)) / 3600
      ) FILTER (WHERE status IN ('APPROVED', 'REJECTED'))
        as median_leadtime_hours
    FROM ops_approvals
    WHERE event_id = $1
  `, [eventId]);

  const stats = result.rows[0];
  return {
    totalRequests: parseInt(stats.total_requests, 10),
    pendingCount: parseInt(stats.pending_count, 10),
    approvedCount: parseInt(stats.approved_count, 10),
    rejectedCount: parseInt(stats.rejected_count, 10),
    cancelledCount: parseInt(stats.cancelled_count, 10),
    avgLeadtimeHours: stats.avg_leadtime_hours ? parseFloat(stats.avg_leadtime_hours).toFixed(2) : null,
    medianLeadtimeHours: stats.median_leadtime_hours ? parseFloat(stats.median_leadtime_hours).toFixed(2) : null
  };
}

/**
 * 마감 임박 승인 요청 조회
 */
async function getUrgentApprovals(eventId, { hoursThreshold = 24 } = {}) {
  const result = await db.query(`
    SELECT * FROM ops_approvals
    WHERE event_id = $1
      AND status = 'PENDING'
      AND deadline_at IS NOT NULL
      AND deadline_at <= NOW() + INTERVAL '${hoursThreshold} hours'
    ORDER BY deadline_at ASC
  `, [eventId]);

  return result.rows;
}

module.exports = {
  createApprovalRequest,
  getApprovalRequest,
  getPendingApprovals,
  approve,
  reject,
  cancelApproval,
  getApprovalHistory,
  getApprovalStats,
  getUrgentApprovals
};
