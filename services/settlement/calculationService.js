/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 정산 계산 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * AIL-정산-v2-final 계산 로직
 * - Anchor 기반 배분
 * - 쿠폰은 플랫폼 부담
 * - 리믹스 체인 분배
 */

const crypto = require('crypto');
const constants = require('./constantsService');

let db = null;

// ═══════════════════════════════════════════════════════════════════════════
// 정산 계산 (핵심)
// ═══════════════════════════════════════════════════════════════════════════
function calculate(event) {
  const {
    gross_amount,
    coupon_amount = 0,
    remix_chain = [],
    referrer_id = null
  } = event;

  const C = constants.getAll();

  // Step 1: 기본 금액 계산
  const paid = gross_amount - coupon_amount;
  const pg_fee = Math.round(paid * C.PG_FEE_RATE);
  const net_cash = paid - pg_fee;

  // Step 2: Anchor 계산 (쿠폰은 플랫폼 부담 → Gross 기준)
  const anchor = gross_amount - Math.round(gross_amount * C.PG_FEE_RATE);

  // Step 3: 풀별 배분 (Anchor 기준)
  const platform_pool = Math.round(anchor * C.PLATFORM_RATE);
  const creator_pool = Math.round(anchor * C.CREATOR_POOL_RATE);
  const growth_pool = Math.round(anchor * C.GROWTH_POOL_RATE);
  const risk_pool = Math.round(anchor * C.RISK_POOL_RATE);

  // Step 4: 크리에이터 풀 내부 분배
  const creator_original = Math.round(creator_pool * C.CREATOR_ORIGINAL_RATE);
  const creator_remix_total = Math.round(creator_pool * C.CREATOR_REMIX_RATE);
  const creator_curation = Math.round(creator_pool * C.CREATOR_CURATION_RATE);

  // 리믹스 체인 분배 (최대 3단계)
  const remix_shares = [];
  const effective_chain = remix_chain.slice(0, C.REMIX_MAX_DEPTH);

  if (effective_chain.length > 0) {
    const per_remix = Math.round(creator_remix_total / effective_chain.length);
    effective_chain.forEach((creator_id, index) => {
      remix_shares.push({
        creator_id,
        depth: index + 1,
        amount: per_remix,
        share_type: 'remix'
      });
    });
  }

  // Step 5: 성장 풀 분배
  let growth_referrer = 0;
  let growth_campaign = 0;
  let growth_reserve = 0;

  if (referrer_id) {
    // 추천자 있음: 7% + 3% 분배
    growth_referrer = Math.round(growth_pool * (C.GROWTH_REFERRER_RATE / C.GROWTH_POOL_RATE));
    growth_campaign = Math.round(growth_pool * (C.GROWTH_CAMPAIGN_RATE / C.GROWTH_POOL_RATE));
  } else {
    // 추천 없음: 전액 적립
    growth_reserve = growth_pool;
  }

  // Step 6: 플랫폼 실제 수령액
  // 쿠폰은 플랫폼 부담이므로 net_cash에서 타 풀 차감
  const platform_actual = net_cash - creator_pool - growth_pool - risk_pool;

  // Step 7: 검증 - 합계 일치 확인
  const total_distributed = platform_actual + creator_pool + growth_pool + risk_pool;
  const balance_diff = Math.abs(total_distributed - net_cash);
  const balance_check = balance_diff <= 1; // 반올림 오차 1원 허용

  return {
    // 입력값
    input: {
      gross_amount,
      coupon_amount,
      remix_chain: effective_chain,
      referrer_id
    },

    // 기본 계산
    paid_amount: paid,
    pg_fee,
    net_cash,
    anchor_amount: anchor,

    // 풀별 배분
    pools: {
      platform: platform_pool,
      platform_actual,
      creator: creator_pool,
      growth: growth_pool,
      risk: risk_pool
    },

    // 크리에이터 상세
    creator_breakdown: {
      original: creator_original,
      remix_total: creator_remix_total,
      remix_shares,
      curation: creator_curation
    },

    // 성장 상세
    growth_breakdown: {
      referrer_id,
      referrer: growth_referrer,
      campaign: growth_campaign,
      reserve: growth_reserve
    },

    // 검증
    validation: {
      total_distributed,
      balance_diff,
      balance_check
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 역분개 계산 (환불/차지백)
// ═══════════════════════════════════════════════════════════════════════════
function calculateReversal(originalEvent, reversalAmount = null) {
  // 부분 환불이면 비율 적용
  const ratio = reversalAmount
    ? Math.abs(reversalAmount) / originalEvent.gross_amount
    : 1;

  const reversedEvent = {
    gross_amount: -Math.round(originalEvent.gross_amount * ratio),
    coupon_amount: -Math.round((originalEvent.coupon_amount || 0) * ratio),
    remix_chain: originalEvent.remix_chain || [],
    referrer_id: originalEvent.referrer_id
  };

  const result = calculate({
    gross_amount: Math.abs(reversedEvent.gross_amount),
    coupon_amount: Math.abs(reversedEvent.coupon_amount),
    remix_chain: reversedEvent.remix_chain,
    referrer_id: reversedEvent.referrer_id
  });

  // 모든 금액을 음수로 변환
  return {
    ...result,
    is_reversal: true,
    reversal_ratio: ratio,
    paid_amount: -result.paid_amount,
    pg_fee: -result.pg_fee,
    net_cash: -result.net_cash,
    anchor_amount: -result.anchor_amount,
    pools: {
      platform: -result.pools.platform,
      platform_actual: -result.pools.platform_actual,
      creator: -result.pools.creator,
      growth: -result.pools.growth,
      risk: -result.pools.risk
    },
    creator_breakdown: {
      original: -result.creator_breakdown.original,
      remix_total: -result.creator_breakdown.remix_total,
      remix_shares: result.creator_breakdown.remix_shares.map(s => ({
        ...s,
        amount: -s.amount
      })),
      curation: -result.creator_breakdown.curation
    },
    growth_breakdown: {
      ...result.growth_breakdown,
      referrer: -result.growth_breakdown.referrer,
      campaign: -result.growth_breakdown.campaign,
      reserve: -result.growth_breakdown.reserve
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 이벤트 ID 생성
// ═══════════════════════════════════════════════════════════════════════════
function generateEventId(prefix = 'evt') {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}_${random}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 정산 이벤트 저장
// ═══════════════════════════════════════════════════════════════════════════
async function saveEvent(event, calculation) {
  if (!db) throw new Error('DB not initialized');

  const eventId = event.event_id || generateEventId();

  // 1. 이벤트 원장 저장
  await db.query(`
    INSERT INTO settlement_events (
      event_id, event_type,
      gross_amount, coupon_amount, paid_amount, pg_fee, net_cash, anchor_amount,
      template_id, artifact_id, creator_root_id, remix_chain, referrer_id, buyer_user_id,
      original_event_id, occurred_at, status
    ) VALUES (
      $1, $2,
      $3, $4, $5, $6, $7, $8,
      $9, $10, $11, $12, $13, $14,
      $15, $16, 'processed'
    )
    ON CONFLICT (event_id) DO NOTHING
  `, [
    eventId,
    event.event_type || 'PAYMENT',
    calculation.input.gross_amount,
    calculation.input.coupon_amount,
    calculation.paid_amount,
    calculation.pg_fee,
    calculation.net_cash,
    calculation.anchor_amount,
    event.template_id || null,
    event.artifact_id || null,
    event.creator_root_id || null,
    JSON.stringify(calculation.input.remix_chain),
    calculation.input.referrer_id,
    event.buyer_user_id || null,
    event.original_event_id || null,
    event.occurred_at || new Date().toISOString()
  ]);

  // 2. 풀 분배 저장
  await db.query(`
    INSERT INTO settlement_pool_distributions (
      event_id, platform_amount, creator_pool_amount, growth_pool_amount, risk_pool_amount, platform_actual
    ) VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT DO NOTHING
  `, [
    eventId,
    calculation.pools.platform,
    calculation.pools.creator,
    calculation.pools.growth,
    calculation.pools.risk,
    calculation.pools.platform_actual
  ]);

  return {
    event_id: eventId,
    calculation
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 이벤트 조회
// ═══════════════════════════════════════════════════════════════════════════
async function getEvent(eventId) {
  if (!db) throw new Error('DB not initialized');

  const result = await db.query(`
    SELECT se.*, spd.*
    FROM settlement_events se
    LEFT JOIN settlement_pool_distributions spd ON se.event_id = spd.event_id
    WHERE se.event_id = $1
  `, [eventId]);

  return result.rows[0] || null;
}

module.exports = {
  init: (database) => { db = database; },
  calculate,
  calculateReversal,
  generateEventId,
  saveEvent,
  getEvent
};
