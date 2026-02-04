/**
 * memberService.js
 * 행사 멤버/권한 관리 서비스
 */

const db = require('../../database/db');

/**
 * 멤버 추가
 */
async function addMember({
  eventId,
  userName,
  userEmail,
  userPhone,
  role = 'viewer',
  approvalLevel,
  slackUserId
}) {
  const result = await db.query(
    `INSERT INTO ops_members
      (event_id, user_name, user_email, user_phone, role, approval_level, slack_user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [eventId, userName, userEmail, userPhone, role, approvalLevel, slackUserId]
  );
  return result.rows[0];
}

/**
 * 멤버 목록 조회
 */
async function listMembers(eventId, { role, isActive = true } = {}) {
  let query = `
    SELECT * FROM ops_members
    WHERE event_id = $1
  `;
  const params = [eventId];
  let paramIndex = 2;

  if (role) {
    query += ` AND role = $${paramIndex++}`;
    params.push(role);
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
 * 멤버 조회 (ID)
 */
async function getMember(memberId) {
  const result = await db.query(
    `SELECT * FROM ops_members WHERE id = $1`,
    [memberId]
  );
  return result.rows[0] || null;
}

/**
 * 멤버 조회 (이메일)
 */
async function getMemberByEmail(eventId, email) {
  const result = await db.query(
    `SELECT * FROM ops_members WHERE event_id = $1 AND user_email = $2`,
    [eventId, email]
  );
  return result.rows[0] || null;
}

/**
 * 멤버 수정
 */
async function updateMember(memberId, updates) {
  const allowedFields = ['user_name', 'user_email', 'user_phone', 'role', 'approval_level', 'slack_user_id', 'is_active'];
  const setClauses = [];
  const params = [memberId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbKey)) {
      setClauses.push(`${dbKey} = $${paramIndex++}`);
      params.push(value);
    }
  }

  if (setClauses.length === 0) {
    return getMember(memberId);
  }

  const result = await db.query(
    `UPDATE ops_members SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0];
}

/**
 * 멤버 삭제
 */
async function deleteMember(memberId) {
  const result = await db.query(
    `DELETE FROM ops_members WHERE id = $1 RETURNING id`,
    [memberId]
  );
  return result.rowCount > 0;
}

/**
 * 승인자 목록 조회 (특정 레벨)
 */
async function getApprovers(eventId, level = 'L1') {
  const result = await db.query(
    `SELECT * FROM ops_members
     WHERE event_id = $1
       AND role = 'approver'
       AND approval_level = $2
       AND is_active = true
     ORDER BY user_name`,
    [eventId, level]
  );
  return result.rows;
}

/**
 * 역할별 멤버 수 조회
 */
async function getMemberStats(eventId) {
  const result = await db.query(`
    SELECT
      role,
      COUNT(*) as count
    FROM ops_members
    WHERE event_id = $1 AND is_active = true
    GROUP BY role
  `, [eventId]);

  const stats = {
    admin: 0,
    operator: 0,
    approver: 0,
    viewer: 0,
    total: 0
  };

  result.rows.forEach(row => {
    stats[row.role] = parseInt(row.count, 10);
    stats.total += parseInt(row.count, 10);
  });

  return stats;
}

/**
 * 권한 체크
 */
function hasPermission(member, requiredRole) {
  const roleHierarchy = {
    admin: 4,
    approver: 3,
    operator: 2,
    viewer: 1
  };

  if (!member || !member.is_active) {
    return false;
  }

  return roleHierarchy[member.role] >= roleHierarchy[requiredRole];
}

/**
 * 승인 권한 체크
 */
function canApprove(member, requiredLevel = 'L1') {
  if (!member || member.role !== 'approver' || !member.is_active) {
    return false;
  }

  const levelHierarchy = { L1: 1, L2: 2, L3: 3, L4: 4 };
  return levelHierarchy[member.approval_level] >= levelHierarchy[requiredLevel];
}

module.exports = {
  addMember,
  listMembers,
  getMember,
  getMemberByEmail,
  updateMember,
  deleteMember,
  getApprovers,
  getMemberStats,
  hasPermission,
  canApprove
};
