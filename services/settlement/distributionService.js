/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 정산 분배 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 크리에이터/성장/리스크 풀 분배 처리
 * Hold 기간 관리
 */

const constants = require('./constantsService');

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 크리에이터 몫 저장
// ═══════════════════════════════════════════════════════════════════════════
async function saveCreatorShares(eventId, calculation, creatorRootId) {
  if (!db) throw new Error('DB not initialized');

  const C = constants.getAll();
  const holdUntil = new Date();
  holdUntil.setDate(holdUntil.getDate() + C.HOLD_DAYS);

  const shares = [];

  // 1. 원저작자 몫
  if (creatorRootId && calculation.creator_breakdown.original > 0) {
    shares.push({
      creator_id: creatorRootId,
      share_type: 'original',
      share_amount: calculation.creator_breakdown.original,
      remix_depth: null
    });
  }

  // 2. 리믹스 기여자 몫
  for (const remix of calculation.creator_breakdown.remix_shares) {
    if (remix.amount !== 0) {
      shares.push({
        creator_id: remix.creator_id,
        share_type: 'remix',
        share_amount: remix.amount,
        remix_depth: remix.depth
      });
    }
  }

  // 3. 큐레이션 몫 (추후 큐레이터 ID 연결)
  // TODO: 큐레이터 시스템 구현 시 연동

  // DB 저장
  for (const share of shares) {
    await db.query(`
      INSERT INTO settlement_creator_shares (
        event_id, creator_id, share_type, share_amount, remix_depth, hold_until, payout_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      eventId,
      share.creator_id,
      share.share_type,
      share.share_amount,
      share.remix_depth,
      holdUntil,
      share.share_amount >= 0 ? 'held' : 'pending' // 환불은 즉시 처리
    ]);
  }

  return shares;
}

// ═══════════════════════════════════════════════════════════════════════════
// 성장 풀 몫 저장
// ═══════════════════════════════════════════════════════════════════════════
async function saveGrowthShares(eventId, calculation) {
  if (!db) throw new Error('DB not initialized');

  const growth = calculation.growth_breakdown;

  await db.query(`
    INSERT INTO settlement_growth_shares (
      event_id, referrer_id, referrer_amount, campaign_amount, reserve_amount
    ) VALUES ($1, $2, $3, $4, $5)
  `, [
    eventId,
    growth.referrer_id,
    growth.referrer,
    growth.campaign,
    growth.reserve
  ]);

  return growth;
}

// ═══════════════════════════════════════════════════════════════════════════
// 리스크 풀 입금
// ═══════════════════════════════════════════════════════════════════════════
async function depositToRiskPool(eventId, amount, reason = null) {
  if (!db) throw new Error('DB not initialized');

  // 현재 잔액 조회
  const balanceResult = await db.query(`
    SELECT COALESCE(SUM(
      CASE WHEN pool_action = 'deposit' THEN amount
           WHEN pool_action = 'withdraw' THEN -amount
           ELSE 0 END
    ), 0) as balance
    FROM settlement_risk_pool
  `);

  const currentBalance = parseInt(balanceResult.rows[0].balance) || 0;
  const newBalance = currentBalance + amount;

  await db.query(`
    INSERT INTO settlement_risk_pool (event_id, amount, pool_action, balance_after, reason)
    VALUES ($1, $2, $3, $4, $5)
  `, [
    eventId,
    Math.abs(amount),
    amount >= 0 ? 'deposit' : 'withdraw',
    newBalance,
    reason
  ]);

  return { previous_balance: currentBalance, new_balance: newBalance };
}

// ═══════════════════════════════════════════════════════════════════════════
// Hold 해제 (14일 경과)
// ═══════════════════════════════════════════════════════════════════════════
async function releaseHeldShares() {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    UPDATE settlement_creator_shares
    SET payout_status = 'released'
    WHERE payout_status = 'held'
      AND hold_until <= CURRENT_DATE
    RETURNING id, creator_id, share_amount
  `);

  return {
    released_count: result.rowCount,
    shares: result.rows
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 크리에이터별 정산 요약
// ═══════════════════════════════════════════════════════════════════════════
async function getCreatorSummary(creatorId) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      COUNT(*) as total_events,
      SUM(share_amount) as total_earned,
      SUM(share_amount) FILTER (WHERE payout_status = 'paid') as total_paid,
      SUM(share_amount) FILTER (WHERE payout_status IN ('pending', 'held', 'released')) as pending_amount,
      SUM(share_amount) FILTER (WHERE payout_status = 'held') as held_amount,
      SUM(share_amount) FILTER (WHERE payout_status = 'released') as releasable_amount,
      SUM(share_amount) FILTER (WHERE share_type = 'original') as original_earned,
      SUM(share_amount) FILTER (WHERE share_type = 'remix') as remix_earned,
      SUM(share_amount) FILTER (WHERE share_type = 'curation') as curation_earned
    FROM settlement_creator_shares
    WHERE creator_id = $1
  `, [creatorId]);

  return result.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 크리에이터 정산 내역
// ═══════════════════════════════════════════════════════════════════════════
async function getCreatorHistory(creatorId, options = {}) {
  if (!db) throw new Error('DB not initialized');

  const { limit = 50, offset = 0, status = null } = options;

  let query = `
    SELECT
      scs.*,
      se.event_type,
      se.occurred_at,
      se.gross_amount,
      se.template_id,
      se.artifact_id
    FROM settlement_creator_shares scs
    JOIN settlement_events se ON scs.event_id = se.event_id
    WHERE scs.creator_id = $1
  `;

  const params = [creatorId];
  let paramIndex = 2;

  if (status) {
    query += ` AND scs.payout_status = $${paramIndex++}`;
    params.push(status);
  }

  query += ` ORDER BY se.occurred_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
}

// ═══════════════════════════════════════════════════════════════════════════
// 추천자 정산 요약
// ═══════════════════════════════════════════════════════════════════════════
async function getReferrerSummary(referrerId) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT
      COUNT(*) as total_referrals,
      SUM(referrer_amount) as total_earned,
      SUM(referrer_amount) FILTER (WHERE payout_status = 'paid') as total_paid,
      SUM(referrer_amount) FILTER (WHERE payout_status = 'pending') as pending_amount
    FROM settlement_growth_shares
    WHERE referrer_id = $1
  `, [referrerId]);

  return result.rows[0] || null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 리스크 풀 잔액
// ═══════════════════════════════════════════════════════════════════════════
async function getRiskPoolBalance() {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT balance_after as balance
    FROM settlement_risk_pool
    ORDER BY created_at DESC
    LIMIT 1
  `);

  return parseInt(result.rows[0]?.balance) || 0;
}

module.exports = {
  init: (database) => { db = database; },
  saveCreatorShares,
  saveGrowthShares,
  depositToRiskPool,
  releaseHeldShares,
  getCreatorSummary,
  getCreatorHistory,
  getReferrerSummary,
  getRiskPoolBalance
};
