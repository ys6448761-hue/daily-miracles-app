/**
 * partnerService.js
 * 협력업체 관리 서비스
 */

const db = require('../../database/db');

/**
 * 협력업체 등록
 */
async function createPartner({
  eventId,
  partnerName,
  partnerRole,
  contactName,
  contactPhone,
  contactEmail,
  slaTerms,
  contractStart,
  contractEnd,
  metadata = {}
}) {
  const result = await db.query(
    `INSERT INTO ops_partners
      (event_id, partner_name, partner_role, contact_name, contact_phone,
       contact_email, sla_terms, contract_start, contract_end, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      eventId, partnerName, partnerRole, contactName, contactPhone,
      contactEmail, slaTerms, contractStart, contractEnd, JSON.stringify(metadata)
    ]
  );
  return result.rows[0];
}

/**
 * 협력업체 목록 조회
 */
async function listPartners(eventId, { role, isActive = true } = {}) {
  let query = `SELECT * FROM ops_partners WHERE event_id = $1`;
  const params = [eventId];
  let paramIndex = 2;

  if (role) {
    query += ` AND partner_role = $${paramIndex++}`;
    params.push(role);
  }

  if (isActive !== undefined) {
    query += ` AND is_active = $${paramIndex++}`;
    params.push(isActive);
  }

  query += ` ORDER BY partner_name ASC`;

  const result = await db.query(query, params);
  return result.rows;
}

/**
 * 협력업체 조회
 */
async function getPartner(partnerId) {
  const result = await db.query(
    `SELECT * FROM ops_partners WHERE id = $1`,
    [partnerId]
  );
  return result.rows[0] || null;
}

/**
 * 협력업체 수정
 */
async function updatePartner(partnerId, updates) {
  const allowedFields = [
    'partner_name', 'partner_role', 'contact_name', 'contact_phone',
    'contact_email', 'sla_terms', 'contract_start', 'contract_end',
    'is_active', 'metadata'
  ];
  const setClauses = [];
  const params = [partnerId];
  let paramIndex = 2;

  for (const [key, value] of Object.entries(updates)) {
    const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    if (allowedFields.includes(dbKey)) {
      setClauses.push(`${dbKey} = $${paramIndex++}`);
      params.push(dbKey === 'metadata' ? JSON.stringify(value) : value);
    }
  }

  if (setClauses.length === 0) {
    return getPartner(partnerId);
  }

  const result = await db.query(
    `UPDATE ops_partners SET ${setClauses.join(', ')} WHERE id = $1 RETURNING *`,
    params
  );
  return result.rows[0];
}

/**
 * 협력업체 삭제
 */
async function deletePartner(partnerId) {
  const result = await db.query(
    `DELETE FROM ops_partners WHERE id = $1 RETURNING id`,
    [partnerId]
  );
  return result.rowCount > 0;
}

/**
 * 협력업체 비활성화
 */
async function deactivatePartner(partnerId) {
  const result = await db.query(
    `UPDATE ops_partners SET is_active = false WHERE id = $1 RETURNING *`,
    [partnerId]
  );
  return result.rows[0];
}

/**
 * 계약 만료 임박 업체 조회
 */
async function getExpiringContracts(eventId, { daysThreshold = 30 } = {}) {
  const result = await db.query(`
    SELECT * FROM ops_partners
    WHERE event_id = $1
      AND is_active = true
      AND contract_end IS NOT NULL
      AND contract_end <= CURRENT_DATE + INTERVAL '${daysThreshold} days'
    ORDER BY contract_end ASC
  `, [eventId]);

  return result.rows;
}

/**
 * 역할별 업체 수 조회
 */
async function getPartnerStats(eventId) {
  const result = await db.query(`
    SELECT
      partner_role,
      COUNT(*) as count
    FROM ops_partners
    WHERE event_id = $1 AND is_active = true
    GROUP BY partner_role
    ORDER BY count DESC
  `, [eventId]);

  const total = await db.query(`
    SELECT COUNT(*) as total FROM ops_partners
    WHERE event_id = $1 AND is_active = true
  `, [eventId]);

  return {
    total: parseInt(total.rows[0].total, 10),
    byRole: result.rows.reduce((acc, row) => {
      acc[row.partner_role] = parseInt(row.count, 10);
      return acc;
    }, {})
  };
}

/**
 * 연락처 목록 Export (비상연락망)
 */
async function exportContactList(eventId) {
  const partners = await listPartners(eventId, { isActive: true });

  const headers = ['업체명', '역할', '담당자', '연락처', '이메일'];
  const rows = partners.map(p => [
    p.partner_name,
    p.partner_role || '',
    p.contact_name || '',
    p.contact_phone || '',
    p.contact_email || ''
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csv;
}

module.exports = {
  createPartner,
  listPartners,
  getPartner,
  updatePartner,
  deletePartner,
  deactivatePartner,
  getExpiringContracts,
  getPartnerStats,
  exportContactList
};
