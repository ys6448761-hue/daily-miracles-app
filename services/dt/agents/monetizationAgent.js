/**
 * monetizationAgent.js — P0 고도화 (실결제 경로 연결)
 *
 * 트리거: DAY_6_UPSELL_READY
 * 출력: 프론트가 바로 쓸 수 있는 CTA payload + 결제 경로
 *
 * 플랜 분기:
 *   has_payment=false → '30일 여정 시작' 제안 (24,900원)
 *   has_payment=true  → '1년 여정 이어가기' 제안 (연간 플랜)
 *
 * 금지 문구: "결제하기" / "구매하기"
 * 허용 문구: "이어가기" / "계속하기" / "써 내려가기"
 */

const db = require('../../../database/db');
const logService = require('../logService');
const { makeLogger } = require('../../../utils/logger');

const log = makeLogger('monetizationAgent');

// ── 플랜 정의 ──────────────────────────────────────────────────
const PLANS = {
  '30day': {
    offer_type:      '30day_upgrade',
    amount:          24900,
    goods_name:      '소원꿈터 30일 여정',
    headline:        '별이 빛나기 시작했어요',
    body:            '6일간의 기록이 30일의 이야기가 됩니다.\n소원이 성장하는 과정을 끝까지 담아보세요.',
    cta_text:        '30일 여정 이어가기',
    checkout_params: { plan: '30day', amount: 24900 },
  },
  annual: {
    offer_type:      'annual_upgrade',
    amount:          89000,
    goods_name:      '소원꿈터 1년 여정 + 책',
    headline:        '소원이 책이 되는 1년',
    body:            '매일의 기록, 지혜, 성장이 모여 당신만의 책이 완성됩니다.\n지금 시작하면 1년 후 이야기가 책으로 남습니다.',
    cta_text:        '내 이야기를 계속 써 내려가기',
    checkout_params: { plan: 'annual', amount: 89000 },
  },
};

// ── 결제 이력 확인 ─────────────────────────────────────────────
async function checkPaymentHistory(starId) {
  // dt_wishes → user_id 조회 후 nicepay_payments 확인
  const result = await db.query(
    `SELECT np.status
     FROM dt_stars s
     JOIN nicepay_payments np ON np.order_id = (
       SELECT pg_payment_key FROM yeosu_wishes
       WHERE id IN (
         SELECT wish_id FROM dt_stars WHERE id = $1
       ) LIMIT 1
     )
     WHERE s.id = $1
     LIMIT 1`,
    [starId]
  );
  return result.rows.length > 0 && result.rows[0].status === 'PAID';
}

// ── 메인 실행 ──────────────────────────────────────────────────
async function run(starId, input = {}) {
  const { trigger = 'day6' } = input;

  // 별 + 소원 조회
  const starResult = await db.query(
    `SELECT s.star_name, w.wish_text
     FROM dt_stars s JOIN dt_wishes w ON s.wish_id = w.id
     WHERE s.id = $1`,
    [starId]
  );
  const star     = starResult.rows[0];
  const starName = star?.star_name || '별';
  const wishText = star?.wish_text  || '';

  // 플랜 선택 (결제 이력 기반 분기)
  let hasPaid = false;
  try { hasPaid = await checkPaymentHistory(starId); } catch { /* 조회 실패 → 무료 사용자로 처리 */ }

  const planKey = hasPaid ? 'annual' : '30day';
  const plan    = PLANS[planKey];

  // 결제 경로 URL 구성
  // POST /api/dt/engine/upgrade 에서 moid를 생성 후 /pay?moid= 로 리다이렉트
  const paymentTarget = `/api/dt/engine/upgrade?star_id=${starId}&plan=${planKey}`;

  // 프론트 응답 payload
  const offer = {
    offer_ready:     true,
    offer_type:      plan.offer_type,
    headline:        plan.headline,
    body:            plan.body,
    cta_text:        plan.cta_text,
    payment_target:  paymentTarget,
    amount:          plan.amount,
    star_name:       starName,
  };

  // dream_log 기록
  await logService.createLog(starId, 'voyage', {
    agent:        'monetizationAgent',
    trigger,
    offer_type:   plan.offer_type,
    headline:     plan.headline,
    cta_text:     plan.cta_text,
    payment_target: paymentTarget,
    amount:       plan.amount,
    has_paid:     hasPaid,
  });

  log.info('Monetization CTA 생성', {
    star_id:    starId,
    offer_type: plan.offer_type,
    amount:     plan.amount,
    has_paid:   hasPaid,
  });

  return offer;
}

module.exports = { run };
