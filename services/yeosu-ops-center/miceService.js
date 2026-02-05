/**
 * miceService.js
 * MICE 인센티브 결과보고 패키지 서비스
 *
 * - 참가자 등록부 (별지2-1호)
 * - 숙박확인서 (별지2-2호)
 * - 지출증빙
 * - 사진대장 (별지2-3호)
 * - 설문조사 (별지3호)
 */

const db = require('../../database/db');

// ═══════════════════════════════════════════════════════════════════════════
// 참가자 등록부 (Participants)
// ═══════════════════════════════════════════════════════════════════════════

async function createParticipant(data) {
  const result = await db.query(`
    INSERT INTO ops_mice_participants (
      event_id, reg_type, org_name, person_name, email, phone,
      nationality, is_foreign, fee_paid_amount, deposit_date, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `, [
    data.eventId,
    data.regType || 'PRE',
    data.orgName,
    data.personName,
    data.email,
    data.phone,
    data.nationality || 'KR',
    data.isForeign || false,
    data.feePaidAmount,
    data.depositDate,
    data.notes
  ]);
  return result.rows[0];
}

async function listParticipants(eventId, { regType } = {}) {
  let query = `
    SELECT * FROM ops_mice_participants
    WHERE event_id = $1
  `;
  const params = [eventId];

  if (regType) {
    query += ` AND reg_type = $2`;
    params.push(regType);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await db.query(query, params);
  return result.rows;
}

async function getParticipantStats(eventId) {
  const result = await db.query(`
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE reg_type = 'PRE') as pre_count,
      COUNT(*) FILTER (WHERE reg_type = 'ONSITE') as onsite_count,
      COUNT(*) FILTER (WHERE is_foreign = true) as foreign_count,
      COALESCE(SUM(fee_paid_amount), 0) as total_fee
    FROM ops_mice_participants
    WHERE event_id = $1
  `, [eventId]);
  return result.rows[0];
}

async function bulkCreateParticipants(eventId, participants) {
  const results = [];
  for (const p of participants) {
    const result = await createParticipant({ ...p, eventId });
    results.push(result);
  }
  return results;
}

async function deleteParticipant(id) {
  const result = await db.query(
    'DELETE FROM ops_mice_participants WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// 숙박확인서 (Stays)
// ═══════════════════════════════════════════════════════════════════════════

async function createStay(data) {
  const result = await db.query(`
    INSERT INTO ops_mice_stays (
      event_id, hotel_name, checkin_date, checkout_date, nights,
      guest_count_total, guest_count_foreign, rooms_count,
      receipt_asset_id, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `, [
    data.eventId,
    data.hotelName,
    data.checkinDate,
    data.checkoutDate,
    data.nights || 1,
    data.guestCountTotal || 1,
    data.guestCountForeign || 0,
    data.roomsCount,
    data.receiptAssetId,
    data.notes
  ]);
  return result.rows[0];
}

async function listStays(eventId) {
  const result = await db.query(`
    SELECT s.*, a.original_filename as receipt_filename
    FROM ops_mice_stays s
    LEFT JOIN ops_assets a ON s.receipt_asset_id = a.id
    WHERE s.event_id = $1
    ORDER BY s.checkin_date
  `, [eventId]);
  return result.rows;
}

async function getStayStats(eventId) {
  const result = await db.query(`
    SELECT
      COUNT(*) as hotel_count,
      COALESCE(SUM(nights), 0) as total_nights,
      COALESCE(SUM(guest_count_total), 0) as total_guests,
      COALESCE(SUM(guest_count_foreign), 0) as foreign_guests,
      COALESCE(SUM(rooms_count), 0) as total_rooms
    FROM ops_mice_stays
    WHERE event_id = $1
  `, [eventId]);
  return result.rows[0];
}

async function deleteStay(id) {
  const result = await db.query(
    'DELETE FROM ops_mice_stays WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// 지출증빙 (Expenses)
// ═══════════════════════════════════════════════════════════════════════════

async function createExpense(data) {
  const result = await db.query(`
    INSERT INTO ops_mice_expenses (
      event_id, category, description, vendor_name, vendor_is_local,
      vendor_biz_reg_no, amount, pay_method, paid_at,
      evidence_assets, is_valid, validation_notes, notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    data.eventId,
    data.category,
    data.description,
    data.vendorName,
    data.vendorIsLocal || false,
    data.vendorBizRegNo,
    data.amount,
    data.payMethod || 'TRANSFER',
    data.paidAt,
    JSON.stringify(data.evidenceAssets || {}),
    data.isValid !== false,
    data.validationNotes,
    data.notes
  ]);
  return result.rows[0];
}

async function listExpenses(eventId, { category } = {}) {
  let query = `
    SELECT * FROM ops_mice_expenses
    WHERE event_id = $1
  `;
  const params = [eventId];

  if (category) {
    query += ` AND category = $2`;
    params.push(category);
  }

  query += ` ORDER BY paid_at DESC, created_at DESC`;

  const result = await db.query(query, params);
  return result.rows;
}

async function getExpenseStats(eventId) {
  const result = await db.query(`
    SELECT
      category,
      COUNT(*) as count,
      COALESCE(SUM(amount), 0) as total_amount,
      COUNT(*) FILTER (WHERE vendor_is_local = true) as local_vendor_count
    FROM ops_mice_expenses
    WHERE event_id = $1
    GROUP BY category
    ORDER BY category
  `, [eventId]);

  // 전체 합계
  const totalResult = await db.query(`
    SELECT
      COUNT(*) as total_count,
      COALESCE(SUM(amount), 0) as grand_total,
      COUNT(*) FILTER (WHERE vendor_is_local = true) as local_vendor_total
    FROM ops_mice_expenses
    WHERE event_id = $1
  `, [eventId]);

  return {
    byCategory: result.rows,
    total: totalResult.rows[0]
  };
}

async function deleteExpense(id) {
  const result = await db.query(
    'DELETE FROM ops_mice_expenses WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// 사진대장 (Photos)
// ═══════════════════════════════════════════════════════════════════════════

async function createPhoto(data) {
  const result = await db.query(`
    INSERT INTO ops_mice_photos (
      event_id, photo_asset_id, tag, description, taken_at, location, sort_order
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    data.eventId,
    data.photoAssetId,
    data.tag || 'ETC',
    data.description,
    data.takenAt,
    data.location,
    data.sortOrder || 0
  ]);
  return result.rows[0];
}

async function listPhotos(eventId, { tag } = {}) {
  let query = `
    SELECT p.*, a.original_filename, a.storage_path, a.mime_type
    FROM ops_mice_photos p
    JOIN ops_assets a ON p.photo_asset_id = a.id
    WHERE p.event_id = $1
  `;
  const params = [eventId];

  if (tag) {
    query += ` AND p.tag = $2`;
    params.push(tag);
  }

  query += ` ORDER BY p.sort_order, p.created_at`;

  const result = await db.query(query, params);
  return result.rows;
}

async function getPhotoStats(eventId) {
  const result = await db.query(`
    SELECT
      tag,
      COUNT(*) as count
    FROM ops_mice_photos
    WHERE event_id = $1
    GROUP BY tag
    ORDER BY tag
  `, [eventId]);

  return result.rows;
}

async function deletePhoto(id) {
  const result = await db.query(
    'DELETE FROM ops_mice_photos WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rowCount > 0;
}

// ═══════════════════════════════════════════════════════════════════════════
// 설문 (Survey)
// ═══════════════════════════════════════════════════════════════════════════

async function createSurveyResponse(data) {
  const result = await db.query(`
    INSERT INTO ops_mice_survey_responses (
      event_id, respondent_type, respondent_name, respondent_org, answers
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [
    data.eventId,
    data.respondentType || 'ORGANIZER',
    data.respondentName,
    data.respondentOrg,
    JSON.stringify(data.answers || {})
  ]);
  return result.rows[0];
}

async function listSurveyResponses(eventId) {
  const result = await db.query(`
    SELECT * FROM ops_mice_survey_responses
    WHERE event_id = $1
    ORDER BY created_at DESC
  `, [eventId]);
  return result.rows;
}

async function getSurveyStats(eventId) {
  const result = await db.query(`
    SELECT
      COUNT(*) as response_count,
      respondent_type,
      COUNT(*) as count
    FROM ops_mice_survey_responses
    WHERE event_id = $1
    GROUP BY respondent_type
  `, [eventId]);

  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 에셋 (Assets)
// ═══════════════════════════════════════════════════════════════════════════

async function createAsset(data) {
  const result = await db.query(`
    INSERT INTO ops_assets (
      event_id, kind, original_filename, stored_filename,
      mime_type, size_bytes, storage_path, metadata, uploaded_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [
    data.eventId,
    data.kind || 'ETC',
    data.originalFilename,
    data.storedFilename,
    data.mimeType,
    data.sizeBytes,
    data.storagePath,
    JSON.stringify(data.metadata || {}),
    data.uploadedBy
  ]);
  return result.rows[0];
}

async function getAsset(id) {
  const result = await db.query(
    'SELECT * FROM ops_assets WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

async function listAssets(eventId, { kind } = {}) {
  let query = `SELECT * FROM ops_assets WHERE event_id = $1`;
  const params = [eventId];

  if (kind) {
    query += ` AND kind = $2`;
    params.push(kind);
  }

  query += ` ORDER BY created_at DESC`;

  const result = await db.query(query, params);
  return result.rows;
}

module.exports = {
  // Participants
  createParticipant,
  listParticipants,
  getParticipantStats,
  bulkCreateParticipants,
  deleteParticipant,

  // Stays
  createStay,
  listStays,
  getStayStats,
  deleteStay,

  // Expenses
  createExpense,
  listExpenses,
  getExpenseStats,
  deleteExpense,

  // Photos
  createPhoto,
  listPhotos,
  getPhotoStats,
  deletePhoto,

  // Survey
  createSurveyResponse,
  listSurveyResponses,
  getSurveyStats,

  // Assets
  createAsset,
  getAsset,
  listAssets
};
