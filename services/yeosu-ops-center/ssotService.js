/**
 * ssotService.js
 * SSOT (Single Source of Truth) 핵심 서비스
 *
 * 목적: 행사 운영의 유일한 진실의 원천 관리
 * 핵심 기능: 항목 생성/수정/조회, 변경이력 100% 추적, 승인 연동
 */

const db = require('../../database/db');

// ═══════════════════════════════════════════════════════════
// SSOT 항목 CRUD
// ═══════════════════════════════════════════════════════════

/**
 * SSOT 항목 생성
 */
async function createItem({
  eventId,
  category,
  itemKey,
  label,
  valueCurrent,
  valueType = 'text',
  requiresApproval = false,
  requiredApprovalLevel = 'L1',
  metadata = {},
  createdBy,
  createdByName
}) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 항목 생성
    const result = await client.query(
      `INSERT INTO ops_ssot_items
        (event_id, category, item_key, label, value_current, value_type,
         requires_approval, required_approval_level, status, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        eventId, category, itemKey, label, valueCurrent, valueType,
        requiresApproval, requiredApprovalLevel,
        requiresApproval ? 'DRAFT' : 'APPROVED',
        JSON.stringify(metadata), createdBy
      ]
    );

    const item = result.rows[0];

    // 변경 이력 기록
    await client.query(
      `INSERT INTO ops_ssot_history
        (item_id, version, value_before, value_after, change_reason,
         changed_by, changed_by_name, status_before, status_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        item.id, 1, null, valueCurrent, '항목 생성',
        createdBy, createdByName, null, item.status
      ]
    );

    await client.query('COMMIT');
    return item;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * SSOT 항목 목록 조회
 */
async function listItems(eventId, { category, status, requiresApproval } = {}) {
  let query = `
    SELECT i.*,
      (SELECT COUNT(*) FROM ops_ssot_history WHERE item_id = i.id) as history_count
    FROM ops_ssot_items i
    WHERE i.event_id = $1
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (category) {
    query += ` AND i.category = $${paramIndex++}`;
    params.push(category);
  }

  if (status) {
    query += ` AND i.status = $${paramIndex++}`;
    params.push(status);
  }

  if (requiresApproval !== undefined) {
    query += ` AND i.requires_approval = $${paramIndex++}`;
    params.push(requiresApproval);
  }

  query += ` ORDER BY i.category, i.created_at ASC`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * SSOT 항목 조회
 */
async function getItem(itemId) {
  const result = await db.query(
    `SELECT i.*,
      (SELECT COUNT(*) FROM ops_ssot_history WHERE item_id = i.id) as history_count
     FROM ops_ssot_items i
     WHERE i.id = $1`,
    [itemId]
  );
  return result.rows[0] || null;
}

/**
 * SSOT 항목 조회 (키 기반)
 */
async function getItemByKey(eventId, category, itemKey) {
  const result = await db.query(
    `SELECT * FROM ops_ssot_items
     WHERE event_id = $1 AND category = $2 AND item_key = $3`,
    [eventId, category, itemKey]
  );
  return result.rows[0] || null;
}

/**
 * SSOT 항목 수정 (핵심 - 변경이력 + 승인 연동)
 */
async function updateItem(itemId, {
  valueCurrent,
  changeReason,
  changedBy,
  changedByName,
  skipApproval = false
}) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 기존 항목 조회
    const existing = await client.query(
      `SELECT * FROM ops_ssot_items WHERE id = $1 FOR UPDATE`,
      [itemId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Item not found');
    }

    const item = existing.rows[0];
    const newVersion = item.version + 1;

    // 승인 필요 여부 판단
    let newStatus = item.status;
    if (item.requires_approval && !skipApproval) {
      newStatus = 'PENDING_APPROVAL';
    } else {
      newStatus = 'APPROVED';
    }

    // 항목 업데이트
    const updateResult = await client.query(
      `UPDATE ops_ssot_items
       SET value_current = $2,
           version = $3,
           status = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [itemId, valueCurrent, newVersion, newStatus]
    );

    // 변경 이력 기록
    await client.query(
      `INSERT INTO ops_ssot_history
        (item_id, version, value_before, value_after, change_reason,
         changed_by, changed_by_name, status_before, status_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        itemId, newVersion, item.value_current, valueCurrent, changeReason,
        changedBy, changedByName, item.status, newStatus
      ]
    );

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
 * SSOT 항목 삭제
 */
async function deleteItem(itemId) {
  const result = await db.query(
    `DELETE FROM ops_ssot_items WHERE id = $1 RETURNING id`,
    [itemId]
  );
  return result.rowCount > 0;
}

// ═══════════════════════════════════════════════════════════
// 변경 이력 관리
// ═══════════════════════════════════════════════════════════

/**
 * 항목 변경 이력 조회
 */
async function getItemHistory(itemId, { limit = 50, offset = 0 } = {}) {
  const result = await db.query(
    `SELECT * FROM ops_ssot_history
     WHERE item_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [itemId, limit, offset]
  );
  return result.rows;
}

/**
 * 이벤트 전체 변경 이력 조회
 */
async function getEventHistory(eventId, { limit = 100, offset = 0, category } = {}) {
  let query = `
    SELECT h.*, i.category, i.item_key, i.label
    FROM ops_ssot_history h
    JOIN ops_ssot_items i ON h.item_id = i.id
    WHERE i.event_id = $1
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (category) {
    query += ` AND i.category = $${paramIndex++}`;
    params.push(category);
  }

  query += ` ORDER BY h.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════
// 승인 상태 관리
// ═══════════════════════════════════════════════════════════

/**
 * 항목 승인
 */
async function approveItem(itemId, { approvedBy, approvedByName }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // 기존 항목 조회
    const existing = await client.query(
      `SELECT * FROM ops_ssot_items WHERE id = $1 FOR UPDATE`,
      [itemId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Item not found');
    }

    const item = existing.rows[0];

    if (item.status !== 'PENDING_APPROVAL') {
      throw new Error('Item is not pending approval');
    }

    // 승인 처리
    const updateResult = await client.query(
      `UPDATE ops_ssot_items
       SET status = 'APPROVED',
           last_approved_value = value_current,
           last_approved_at = CURRENT_TIMESTAMP,
           last_approved_by = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [itemId, approvedBy]
    );

    // 변경 이력 기록
    await client.query(
      `INSERT INTO ops_ssot_history
        (item_id, version, value_before, value_after, change_reason,
         changed_by, changed_by_name, status_before, status_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        itemId, item.version, item.value_current, item.value_current, '승인 완료',
        approvedBy, approvedByName, 'PENDING_APPROVAL', 'APPROVED'
      ]
    );

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
 * 항목 반려
 */
async function rejectItem(itemId, { rejectedBy, rejectedByName, reason }) {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      `SELECT * FROM ops_ssot_items WHERE id = $1 FOR UPDATE`,
      [itemId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Item not found');
    }

    const item = existing.rows[0];

    if (item.status !== 'PENDING_APPROVAL') {
      throw new Error('Item is not pending approval');
    }

    // 반려 처리 (이전 승인값으로 롤백)
    const rollbackValue = item.last_approved_value || null;

    const updateResult = await client.query(
      `UPDATE ops_ssot_items
       SET status = 'REJECTED',
           value_current = COALESCE($2, value_current),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [itemId, rollbackValue]
    );

    // 변경 이력 기록
    await client.query(
      `INSERT INTO ops_ssot_history
        (item_id, version, value_before, value_after, change_reason,
         changed_by, changed_by_name, status_before, status_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        itemId, item.version, item.value_current, rollbackValue,
        `반려: ${reason}`,
        rejectedBy, rejectedByName, 'PENDING_APPROVAL', 'REJECTED'
      ]
    );

    await client.query('COMMIT');
    return updateResult.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// ═══════════════════════════════════════════════════════════
// 통계 및 분석
// ═══════════════════════════════════════════════════════════

/**
 * SSOT 통계
 */
async function getStats(eventId) {
  const result = await db.query(`
    SELECT
      COUNT(*) as total_items,
      COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
      COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') as pending_count,
      COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected_count,
      COUNT(*) FILTER (WHERE status = 'DRAFT') as draft_count,
      COUNT(*) FILTER (WHERE requires_approval = true) as approval_required_count,
      COUNT(DISTINCT category) as category_count
    FROM ops_ssot_items
    WHERE event_id = $1
  `, [eventId]);

  return result.rows[0];
}

/**
 * 카테고리별 항목 수
 */
async function getCategoryStats(eventId) {
  const result = await db.query(`
    SELECT
      category,
      COUNT(*) as item_count,
      COUNT(*) FILTER (WHERE status = 'APPROVED') as approved_count,
      COUNT(*) FILTER (WHERE status = 'PENDING_APPROVAL') as pending_count
    FROM ops_ssot_items
    WHERE event_id = $1
    GROUP BY category
    ORDER BY category
  `, [eventId]);

  return result.rows;
}

/**
 * 승인된 항목만 조회 (SSOT 보드용)
 */
async function getApprovedItems(eventId, { category } = {}) {
  let query = `
    SELECT * FROM ops_ssot_items
    WHERE event_id = $1 AND status = 'APPROVED'
  `;
  const params = [eventId];

  if (category) {
    query += ` AND category = $2`;
    params.push(category);
  }

  query += ` ORDER BY category, created_at ASC`;

  const result = await db.query(query, params);
  return result.rows;
}

module.exports = {
  // CRUD
  createItem,
  listItems,
  getItem,
  getItemByKey,
  updateItem,
  deleteItem,

  // 이력
  getItemHistory,
  getEventHistory,

  // 승인
  approveItem,
  rejectItem,

  // 통계
  getStats,
  getCategoryStats,
  getApprovedItems
};
