'use strict';

/**
 * dtPaymentService.js
 * DreamTown Day 8 결제 서비스
 *
 * 흐름: Day8 Continue → requestPayment → nicepay 결제창 → callback → activatePlan
 * 원칙: 결제 성공 전 절대 flow 전환 금지
 */

const db           = require('../../database/db');
const nicepayService = require('../nicepayService');
const planSvc      = require('./userPlanService');
const eventSvc     = require('./userEventService');
const { makeLogger } = require('../../utils/logger');
const log = makeLogger('dtPayment');

const FLOW_PLAN_AMOUNT = 9900;
const FLOW_PLAN_NAME   = '하루하루의 기적 Flow 플랜';

// ── 결제 요청 생성 ─────────────────────────────────────────────
async function requestPayment(userId) {
  // 1. nicepay_payments 레코드 생성 (orderId 발급)
  const payment = await nicepayService.createPayment(FLOW_PLAN_AMOUNT, FLOW_PLAN_NAME);
  const { orderId } = payment;

  // 2. payments 테이블에도 동일 orderId로 저장 (user_id + plan_type 연결)
  await db.query(
    `INSERT INTO dt_payments (user_id, plan_type, order_id, amount, status)
     VALUES ($1, 'flow', $2, $3, 'ready')`,
    [userId, orderId, FLOW_PLAN_AMOUNT]
  );

  // 3. 이벤트 기록
  eventSvc.logEvent({
    userId,
    eventType: eventSvc.EVENTS.PAYMENT_REQUESTED,
    metadata:  { order_id: orderId, amount: FLOW_PLAN_AMOUNT, plan_type: 'flow' },
  }).catch(() => {});

  log.info('Day8 결제 요청 생성', { userId, orderId });

  return {
    order_id:    orderId,
    redirect_url: `/pay?moid=${encodeURIComponent(orderId)}`,
    amount:      FLOW_PLAN_AMOUNT,
    plan_type:   'flow',
    // nicepay 파라미터 (프론트에서 직접 결제창 호출 시 사용 가능)
    mid:       payment.mid,
    goods_name: FLOW_PLAN_NAME,
  };
}

// ── 결제 성공 처리 (nicepay callback에서 호출) ─────────────────
async function activatePlan(orderId, tid) {
  // payments 테이블에서 user_id 조회
  const { rows } = await db.query(
    `SELECT user_id, plan_type, status FROM dt_payments WHERE order_id = $1`,
    [orderId]
  );
  if (rows.length === 0) return false; // Day 8 결제 아님

  const { user_id, plan_type, status } = rows[0];
  if (status === 'paid') {
    log.warn('중복 콜백 — 이미 paid 처리됨', { orderId });
    return true;
  }

  // payments 상태 업데이트
  await db.query(
    `UPDATE dt_payments SET status='paid', tid=$1, paid_at=NOW() WHERE order_id=$2`,
    [tid || null, orderId]
  );

  // plan_type = flow 전환
  await planSvc.updatePlan(user_id, plan_type);

  // 이벤트 기록
  eventSvc.logEvent({
    userId:    user_id,
    eventType: eventSvc.EVENTS.PAYMENT_SUCCESS,
    metadata:  { order_id: orderId, tid, plan_type },
  }).catch(() => {});

  log.info('Day8 플랜 활성화 완료', { user_id, plan_type, orderId });
  return true;
}

// ── 결제 실패/취소 처리 ────────────────────────────────────────
async function handleFailed(orderId, status = 'failed') {
  const { rowCount } = await db.query(
    `UPDATE dt_payments SET status=$1 WHERE order_id=$2 AND status='ready'`,
    [status, orderId]
  );
  if (rowCount === 0) return false;

  // user_id 조회 후 이벤트 기록
  const { rows } = await db.query(
    `SELECT user_id FROM dt_payments WHERE order_id=$1`, [orderId]
  );
  if (rows.length > 0) {
    eventSvc.logEvent({
      userId:    rows[0].user_id,
      eventType: eventSvc.EVENTS.PAYMENT_FAILED,
      metadata:  { order_id: orderId, status },
    }).catch(() => {});
  }

  return true;
}

module.exports = { requestPayment, activatePlan, handleFailed };
