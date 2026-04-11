/**
 * dtSettlementService.js
 *
 * DreamTown 파트너 정산 핵심 로직
 *
 * 정산 정책 우선순위: benefit_config > partner_config > default(20%)
 * 정책 타입:
 *   commission_rate — face_value * rate = commission / net = face - commission
 *   net_amount      — net = 고정값 / commission = face - net
 */

'use strict';

const db = require('../database/db');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtSettlement');

const DEFAULT_COMMISSION_RATE = 0.20;

// ── 핵심: 정산 계산 함수 ──────────────────────────────────────────────
/**
 * 우선순위: benefitConfig > partnerConfig > default
 *
 * @param {{ face_value: number }} item
 * @param {{ settlement_policy_type, commission_rate, settlement_net_amount }|null} partnerConfig
 * @param {{ settlement_policy_type, commission_rate, net_amount }|null} benefitConfig
 * @returns {{ amount, commission_rate, commission_amount, net_amount, policy_type }}
 */
function calculateSettlement(item, partnerConfig, benefitConfig) {
  const face = parseFloat(item.face_value) || 0;

  // 정책 타입 결정 (benefit 우선)
  const policyType =
    benefitConfig?.settlement_policy_type ||
    partnerConfig?.settlement_policy_type ||
    'commission_rate';

  if (policyType === 'net_amount') {
    // net_amount 방식: 고정 입금가 기준
    const net = parseFloat(
      benefitConfig?.net_amount ?? partnerConfig?.settlement_net_amount
    );

    if (!net && net !== 0) {
      throw new Error(
        `net_amount 정책이지만 net_amount 미설정 (partner: ${partnerConfig?.partner_code ?? '?'})`
      );
    }
    if (net > face) {
      throw new Error(
        `net_amount(${net}) > face_value(${face}) — 유효하지 않은 정산 설정`
      );
    }

    const commission = parseFloat((face - net).toFixed(2));
    return {
      amount:            face,
      commission_rate:   null,
      commission_amount: commission,
      net_amount:        parseFloat(net.toFixed(2)),
      policy_type:       'net_amount',
    };
  }

  // commission_rate 방식 (기본)
  const rate = parseFloat(
    benefitConfig?.commission_rate ??
    partnerConfig?.commission_rate ??
    DEFAULT_COMMISSION_RATE
  );
  const commission = parseFloat((face * rate).toFixed(2));
  const net        = parseFloat((face - commission).toFixed(2));

  return {
    amount:            face,
    commission_rate:   rate,
    commission_amount: commission,
    net_amount:        net,
    policy_type:       'commission_rate',
  };
}

// ── 파트너 / 상품 설정 캐시 로드 ─────────────────────────────────────
async function loadConfigs(partnerIds) {
  // 파트너 설정
  const { rows: partnerRows } = await db.query(
    `SELECT partner_code, settlement_policy_type, commission_rate, settlement_net_amount
     FROM partner_configs
     WHERE partner_code = ANY($1::varchar[]) AND is_active = TRUE`,
    [partnerIds]
  );
  const partnerMap = {};
  for (const r of partnerRows) partnerMap[r.partner_code] = r;

  // 상품 단위 설정
  const { rows: benefitRows } = await db.query(
    `SELECT partner_code, benefit_type, settlement_policy_type, commission_rate, net_amount
     FROM benefit_settlement_configs
     WHERE partner_code = ANY($1::varchar[]) AND is_active = TRUE`,
    [partnerIds]
  );
  const benefitMap = {}; // key: `${partner_code}:${benefit_type}`
  for (const r of benefitRows) {
    benefitMap[`${r.partner_code}:${r.benefit_type}`] = r;
  }

  return { partnerMap, benefitMap };
}

// ── 배치 실행 ────────────────────────────────────────────────────────
/**
 * @param {{ periodStart?: Date, periodEnd?: Date }} options
 * @returns {{ created, skipped, items }}
 */
async function runBatch(options = {}) {
  const periodEnd   = options.periodEnd   ?? new Date();
  const periodStart = options.periodStart ?? new Date(periodEnd - 30 * 24 * 60 * 60 * 1000);

  log.info('정산 배치 시작', {
    periodStart: periodStart.toISOString(),
    periodEnd:   periodEnd.toISOString(),
  });

  // 미정산 리뎀션 조회
  const { rows: redemptions } = await db.query(
    `SELECT
       br.id         AS redemption_id,
       br.credential_id,
       br.partner_id,
       br.redeemed_at,
       bc.benefit_type,
       bc.benefit_name,
       bc.face_value
     FROM benefit_redemptions br
     JOIN benefit_credentials bc ON bc.id = br.credential_id
     WHERE br.status            = 'completed'
       AND br.settlement_status = 'pending'
       AND br.redeemed_at >= $1
       AND br.redeemed_at <  $2
     ORDER BY br.partner_id, br.redeemed_at`,
    [periodStart, periodEnd]
  );

  if (redemptions.length === 0) {
    log.info('정산 대상 없음');
    return { created: 0, skipped: 0, items: 0 };
  }

  // 파트너 / 상품 설정 일괄 로드
  const partnerIds = [...new Set(redemptions.map(r => r.partner_id))];
  const { partnerMap, benefitMap } = await loadConfigs(partnerIds);

  // 파트너별 그룹핑
  const grouped = {};
  for (const r of redemptions) {
    if (!grouped[r.partner_id]) grouped[r.partner_id] = [];
    grouped[r.partner_id].push(r);
  }

  let created = 0, skipped = 0, totalItems = 0;

  for (const [partnerId, items] of Object.entries(grouped)) {
    try {
      const result = await createSettlementForPartner({
        partnerId, items, periodStart, periodEnd,
        partnerConfig: partnerMap[partnerId] ?? null,
        benefitMap,
      });
      if (result.skipped) { skipped++; }
      else { created++; totalItems += result.itemCount; }
    } catch (err) {
      log.error('파트너 정산 생성 실패', { partnerId, err: err.message });
    }
  }

  log.info('정산 배치 완료', { created, skipped, totalItems });
  return { created, skipped, items: totalItems };
}

// ── 파트너별 정산 생성 ────────────────────────────────────────────────
async function createSettlementForPartner({
  partnerId, items, periodStart, periodEnd,
  partnerConfig, benefitMap,
}) {
  // 중복 체크
  const dup = await db.query(
    `SELECT id FROM dt_settlements
     WHERE partner_id = $1 AND period_start = $2 AND period_end = $3`,
    [partnerId, periodStart, periodEnd]
  );
  if (dup.rowCount > 0) {
    log.info('중복 정산 스킵', { partnerId });
    return { skipped: true };
  }

  // 각 항목 계산 (정책 우선순위 적용)
  let totalAmount = 0, totalCommission = 0;
  const itemPayloads = [];
  const calcErrors = [];

  for (const r of items) {
    const benefitConfig = benefitMap[`${partnerId}:${r.benefit_type}`] ?? null;
    try {
      const calc = calculateSettlement(r, partnerConfig, benefitConfig);
      totalAmount     += calc.amount;
      totalCommission += calc.commission_amount;
      itemPayloads.push({ ...r, calc });
    } catch (err) {
      calcErrors.push({ credential_id: r.credential_id, error: err.message });
      log.error('항목 계산 오류 — 항목 제외', {
        credential_id: r.credential_id,
        benefit_type:  r.benefit_type,
        err: err.message,
      });
    }
  }

  if (itemPayloads.length === 0) {
    throw new Error(`모든 항목 계산 실패 (partner: ${partnerId}) — ${calcErrors[0]?.error}`);
  }

  totalAmount     = parseFloat(totalAmount.toFixed(2));
  totalCommission = parseFloat(totalCommission.toFixed(2));
  const netAmount = parseFloat((totalAmount - totalCommission).toFixed(2));

  // 대표 commission_rate: net_amount 혼합이면 null
  const allRate = itemPayloads[0]?.calc.commission_rate;
  const summaryRate = itemPayloads.every(i => i.calc.commission_rate === allRate)
    ? allRate
    : null;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [settlement] } = await client.query(
      `INSERT INTO dt_settlements
         (partner_id, period_start, period_end,
          total_count, total_amount, commission_rate, commission_amount, net_amount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [partnerId, periodStart, periodEnd,
       itemPayloads.length, totalAmount, summaryRate, totalCommission, netAmount]
    );
    const settlementId = settlement.id;

    for (const item of itemPayloads) {
      const { calc } = item;
      await client.query(
        `INSERT INTO dt_settlement_items
           (settlement_id, credential_id, redemption_id,
            benefit_type, benefit_name, face_value,
            commission_rate, commission_amount, net_amount,
            policy_type, redeemed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (credential_id) DO NOTHING`,
        [
          settlementId, item.credential_id, item.redemption_id,
          item.benefit_type, item.benefit_name, item.face_value,
          calc.commission_rate, calc.commission_amount, calc.net_amount,
          calc.policy_type, item.redeemed_at,
        ]
      );
    }

    // benefit_redemptions 상태 업데이트
    await client.query(
      `UPDATE benefit_redemptions
       SET settlement_status = 'included', settlement_id = $1, updated_at = NOW()
       WHERE id = ANY($2::uuid[])`,
      [settlementId, itemPayloads.map(i => i.redemption_id)]
    );

    // benefit_credentials settlement_status 업데이트
    await client.query(
      `UPDATE benefit_credentials
       SET settlement_status = 'SETTLED', settled_at = NOW(), updated_at = NOW()
       WHERE id = ANY($1::uuid[])`,
      [itemPayloads.map(i => i.credential_id)]
    );

    await client.query('COMMIT');
    log.info('정산 생성', {
      partnerId, settlementId,
      count: itemPayloads.length, totalAmount, netAmount,
      calcErrors: calcErrors.length,
    });
    return { skipped: false, settlementId, itemCount: itemPayloads.length, calcErrors };

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// ── 조회 ─────────────────────────────────────────────────────────────
async function listSettlements({ partnerId, status, limit = 50, offset = 0 } = {}) {
  const conditions = [], params = [];
  if (partnerId) { params.push(partnerId); conditions.push(`partner_id = $${params.length}`); }
  if (status)    { params.push(status);    conditions.push(`status = $${params.length}`); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit, offset);

  const { rows } = await db.query(
    `SELECT id, partner_id, period_start, period_end,
            total_count, total_amount, commission_rate,
            commission_amount, net_amount, status,
            approved_at, paid_at, created_at
     FROM dt_settlements ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return rows;
}

async function getSettlementDetail(settlementId) {
  const { rows: [settlement] } = await db.query(
    `SELECT * FROM dt_settlements WHERE id = $1`,
    [settlementId]
  );
  if (!settlement) return null;

  const { rows: items } = await db.query(
    `SELECT si.*, bc.credential_code
     FROM dt_settlement_items si
     JOIN benefit_credentials bc ON bc.id = si.credential_id
     WHERE si.settlement_id = $1
     ORDER BY si.redeemed_at`,
    [settlementId]
  );
  return { ...settlement, items };
}

async function approveSettlement(settlementId) {
  const { rows: [row] } = await db.query(
    `UPDATE dt_settlements
     SET status = 'approved', approved_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING id, status`,
    [settlementId]
  );
  if (!row) throw new Error('pending 상태의 정산만 승인 가능합니다');
  return row;
}

async function paySettlement(settlementId) {
  const { rows: [row] } = await db.query(
    `UPDATE dt_settlements
     SET status = 'paid', paid_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND status = 'approved'
     RETURNING id, status, paid_at`,
    [settlementId]
  );
  if (!row) throw new Error('approved 상태의 정산만 지급 처리 가능합니다');
  return row;
}

async function getStats() {
  const { rows: [stats] } = await db.query(
    `SELECT
       COUNT(*)                                    AS total_settlements,
       COUNT(*) FILTER (WHERE status='pending')    AS pending_count,
       COUNT(*) FILTER (WHERE status='approved')   AS approved_count,
       COUNT(*) FILTER (WHERE status='paid')       AS paid_count,
       COALESCE(SUM(total_amount),  0)             AS total_amount,
       COALESCE(SUM(net_amount) FILTER (WHERE status IN ('approved','paid')), 0) AS payable_amount,
       COALESCE(SUM(net_amount) FILTER (WHERE status='paid'), 0)                 AS paid_amount
     FROM dt_settlements`
  );
  return stats;
}

module.exports = {
  runBatch,
  calculateSettlement,   // 테스트/외부 사용 가능하도록 export
  listSettlements,
  getSettlementDetail,
  approveSettlement,
  paySettlement,
  getStats,
};
