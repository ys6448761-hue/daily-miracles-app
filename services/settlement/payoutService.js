/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 정산 지급 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 배치 지급 처리
 * 최소 지급액 검증
 * 이월/차감 관리
 */

const constants = require('./constantsService');

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 지급 배치 생성
// ═══════════════════════════════════════════════════════════════════════════
async function createPayoutBatch(batchDate = null) {
  if (!db) throw new Error('DB not initialized');

  const date = batchDate || new Date().toISOString().split('T')[0];
  const C = constants.getAll();

  // 배치 생성
  const batchResult = await db.query(`
    INSERT INTO settlement_payout_batches (batch_date, min_payout, status)
    VALUES ($1, $2, 'draft')
    RETURNING id
  `, [date, C.MIN_PAYOUT]);

  const batchId = batchResult.rows[0].id;

  // 지급 대상 크리에이터 집계
  const eligibleCreators = await db.query(`
    SELECT
      creator_id,
      SUM(share_amount) as total_amount
    FROM settlement_creator_shares
    WHERE payout_status = 'released'
    GROUP BY creator_id
    HAVING SUM(share_amount) >= $1
  `, [C.MIN_PAYOUT]);

  let totalCreators = 0;
  let totalAmount = 0;

  for (const creator of eligibleCreators.rows) {
    // 개별 지급 레코드 생성
    await db.query(`
      INSERT INTO settlement_payouts (batch_id, creator_id, gross_amount, net_amount, status)
      VALUES ($1, $2, $3, $3, 'pending')
    `, [batchId, creator.creator_id, creator.total_amount]);

    totalCreators++;
    totalAmount += parseInt(creator.total_amount);
  }

  // 최소 금액 미달 크리에이터는 이월
  const deferredCreators = await db.query(`
    SELECT
      creator_id,
      SUM(share_amount) as total_amount
    FROM settlement_creator_shares
    WHERE payout_status = 'released'
    GROUP BY creator_id
    HAVING SUM(share_amount) < $1
  `, [C.MIN_PAYOUT]);

  for (const creator of deferredCreators.rows) {
    await db.query(`
      INSERT INTO settlement_payouts (batch_id, creator_id, gross_amount, net_amount, status, deferred_reason)
      VALUES ($1, $2, $3, 0, 'deferred', $4)
    `, [
      batchId,
      creator.creator_id,
      creator.total_amount,
      `최소 지급액(${C.MIN_PAYOUT}원) 미달 - 다음 달 이월`
    ]);
  }

  // 배치 업데이트
  await db.query(`
    UPDATE settlement_payout_batches
    SET total_creators = $1, total_amount = $2
    WHERE id = $3
  `, [totalCreators, totalAmount, batchId]);

  return {
    batch_id: batchId,
    batch_date: date,
    total_creators: totalCreators,
    total_amount: totalAmount,
    deferred_count: deferredCreators.rowCount
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 배치 확정
// ═══════════════════════════════════════════════════════════════════════════
async function confirmBatch(batchId) {
  if (!db) throw new Error('DB not initialized');

  // 배치 상태 확인
  const batch = await db.query(`
    SELECT * FROM settlement_payout_batches WHERE id = $1
  `, [batchId]);

  if (!batch.rows[0]) {
    throw new Error('Batch not found');
  }

  if (batch.rows[0].status !== 'draft') {
    throw new Error('Batch already confirmed or processing');
  }

  // 배치 확정
  await db.query(`
    UPDATE settlement_payout_batches
    SET status = 'confirmed', confirmed_at = NOW()
    WHERE id = $1
  `, [batchId]);

  // 관련 정산 내역 상태 업데이트
  await db.query(`
    UPDATE settlement_creator_shares
    SET payout_status = 'pending',
        payout_batch_id = $1
    WHERE payout_status = 'released'
      AND creator_id IN (
        SELECT creator_id FROM settlement_payouts
        WHERE batch_id = $1 AND status = 'pending'
      )
  `, [batchId]);

  return { batch_id: batchId, status: 'confirmed' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 지급 처리 (개별)
// ═══════════════════════════════════════════════════════════════════════════
async function processPayout(payoutId, transferInfo = {}) {
  if (!db) throw new Error('DB not initialized');

  const { bank_code, account_number, account_holder } = transferInfo;

  // 지급 완료 처리
  await db.query(`
    UPDATE settlement_payouts
    SET status = 'completed',
        bank_code = $2,
        account_number = $3,
        account_holder = $4,
        transferred_at = NOW()
    WHERE id = $1
  `, [payoutId, bank_code, account_number, account_holder]);

  // 정산 내역 상태 업데이트
  const payout = await db.query(`
    SELECT creator_id, batch_id FROM settlement_payouts WHERE id = $1
  `, [payoutId]);

  if (payout.rows[0]) {
    await db.query(`
      UPDATE settlement_creator_shares
      SET payout_status = 'paid'
      WHERE payout_batch_id = $1 AND creator_id = $2
    `, [payout.rows[0].batch_id, payout.rows[0].creator_id]);
  }

  return { payout_id: payoutId, status: 'completed' };
}

// ═══════════════════════════════════════════════════════════════════════════
// 차감 처리 (환불 회수)
// ═══════════════════════════════════════════════════════════════════════════
async function processDeduction(creatorId, amount, reason, eventId = null) {
  if (!db) throw new Error('DB not initialized');

  const C = constants.getAll();

  // 월 차감 한도 확인
  const monthlyDeducted = await db.query(`
    SELECT COALESCE(SUM(deduction_amount), 0) as total
    FROM settlement_payouts
    WHERE creator_id = $1
      AND status = 'completed'
      AND transferred_at >= DATE_TRUNC('month', CURRENT_DATE)
  `, [creatorId]);

  const summary = await db.query(`
    SELECT COALESCE(SUM(share_amount), 0) as total
    FROM settlement_creator_shares
    WHERE creator_id = $1
  `, [creatorId]);

  const totalEarned = parseInt(summary.rows[0].total) || 0;
  const alreadyDeducted = parseInt(monthlyDeducted.rows[0].total) || 0;
  const maxDeduction = Math.round(totalEarned * C.MAX_MONTHLY_DEDUCTION_RATE);
  const remainingLimit = maxDeduction - alreadyDeducted;

  const actualDeduction = Math.min(amount, remainingLimit);
  const deferredAmount = amount - actualDeduction;

  // 차감 기록
  if (actualDeduction > 0) {
    await db.query(`
      INSERT INTO settlement_payouts (creator_id, gross_amount, deduction_amount, net_amount, status, deferred_reason)
      VALUES ($1, 0, $2, -$2, 'completed', $3)
    `, [creatorId, actualDeduction, reason]);
  }

  return {
    creator_id: creatorId,
    requested_amount: amount,
    actual_deduction: actualDeduction,
    deferred_amount: deferredAmount,
    monthly_limit: maxDeduction,
    remaining_limit: remainingLimit - actualDeduction
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 배치 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getBatch(batchId) {
  if (!db) throw new Error('DB not initialized');

  const batch = await db.query(`
    SELECT * FROM settlement_payout_batches WHERE id = $1
  `, [batchId]);

  if (!batch.rows[0]) return null;

  const payouts = await db.query(`
    SELECT * FROM settlement_payouts WHERE batch_id = $1 ORDER BY creator_id
  `, [batchId]);

  return {
    ...batch.rows[0],
    payouts: payouts.rows
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 배치 목록
// ═══════════════════════════════════════════════════════════════════════════
async function listBatches(options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { limit = 20, offset = 0, status = null } = options;

  let query = 'SELECT * FROM settlement_payout_batches WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY batch_date DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 지급 통계
// ═══════════════════════════════════════════════════════════════════════════
async function getPayoutStats() {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COUNT(*) FILTER (WHERE status = 'deferred') as deferred_count,
      SUM(net_amount) FILTER (WHERE status = 'completed') as total_paid,
      SUM(gross_amount) FILTER (WHERE status = 'pending') as pending_amount,
      SUM(gross_amount) FILTER (WHERE status = 'deferred') as deferred_amount
    FROM settlement_payouts
  `);

  return result.rows[0];
}

module.exports = {
  init: (database) => { db = database; },
  createPayoutBatch,
  confirmBatch,
  processPayout,
  processDeduction,
  getBatch,
  listBatches,
  getPayoutStats
};
