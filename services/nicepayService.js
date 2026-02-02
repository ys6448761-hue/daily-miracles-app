/**
 * ═══════════════════════════════════════════════════════════
 * nicepayService.js
 * 나이스페이 결제 서비스 (Server 승인 모델)
 * ═══════════════════════════════════════════════════════════
 *
 * 플로우:
 * 1. createPayment() - 주문 생성 + PENDING 저장
 * 2. verifyAuthSignature() - 인증 결과 서명 검증
 * 3. requestApproval() - 승인 API 호출
 * 4. updatePaymentStatus() - DB 상태 업데이트
 * 5. verifyPayment() - 결제 검증 (Wix용)
 */

const crypto = require('crypto');
const axios = require('axios');

// DB 모듈 로딩
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.warn('⚠️ nicepayService: DB 모듈 로드 실패:', error.message);
}

// 환경변수
const NICEPAY_CLIENT_ID = process.env.NICEPAY_CLIENT_ID || '';
const NICEPAY_SECRET_KEY = process.env.NICEPAY_SECRET_KEY || '';
const NICEPAY_RETURN_URL = process.env.NICEPAY_RETURN_URL || '';
const WIX_SUCCESS_URL = process.env.WIX_SUCCESS_URL || 'https://dailymiracles.kr/payment-success';

// 나이스페이 API 베이스 URL
const NICEPAY_API_BASE = 'https://api.nicepay.co.kr';

/**
 * 주문번호 생성 (PAY-YYYYMMDD-XXXX)
 */
function generateOrderId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${dateStr}-${random}`;
}

/**
 * 검증 토큰 생성 (32바이트 hex)
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * ediDate 생성 (YYYYMMDDHHmmss)
 */
function generateEdiDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * 결제 생성 (PENDING 상태로 DB 저장)
 * @param {number} amount - 결제 금액
 * @param {string} goodsName - 상품명
 * @returns {Object} { orderId, verificationToken, amount }
 */
async function createPayment(amount, goodsName = '하루하루의 기적 서비스') {
  const orderId = generateOrderId();
  const verificationToken = generateVerificationToken();

  if (db) {
    try {
      await db.query(`
        INSERT INTO nicepay_payments (order_id, verification_token, amount, goods_name, status)
        VALUES ($1, $2, $3, $4, 'PENDING')
      `, [orderId, verificationToken, amount, goodsName]);
      console.log(`✅ 결제 생성: ${orderId}, 금액: ${amount}원`);
    } catch (error) {
      console.error('❌ 결제 생성 실패:', error.message);
      throw error;
    }
  } else {
    console.warn('⚠️ DB 없음 - 메모리에만 저장');
  }

  return {
    orderId,
    verificationToken,
    amount,
    goodsName,
    clientId: NICEPAY_CLIENT_ID,
    returnUrl: NICEPAY_RETURN_URL
  };
}

/**
 * 인증 결과 서명 검증
 * signature = sha256(authToken + clientId + amount + secretKey)
 */
function verifyAuthSignature(authToken, amount, signature) {
  if (!NICEPAY_SECRET_KEY) {
    console.warn('⚠️ NICEPAY_SECRET_KEY 미설정');
    return false;
  }

  const data = authToken + NICEPAY_CLIENT_ID + amount + NICEPAY_SECRET_KEY;
  const expected = crypto.createHash('sha256').update(data).digest('hex');

  const isValid = expected === signature;
  console.log(`🔐 서명 검증: ${isValid ? '✅ 통과' : '❌ 실패'}`);

  return isValid;
}

/**
 * 승인 요청 서명 생성
 * signData = sha256(tid + amount + ediDate + secretKey)
 */
function createApprovalSignData(tid, amount, ediDate) {
  const data = tid + amount + ediDate + NICEPAY_SECRET_KEY;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 승인 API 호출
 * POST https://api.nicepay.co.kr/v1/payments/{tid}
 */
async function requestApproval(tid, orderId, amount) {
  const ediDate = generateEdiDate();
  const signData = createApprovalSignData(tid, amount, ediDate);

  // Basic Auth 헤더 생성
  const authString = Buffer.from(`${NICEPAY_CLIENT_ID}:${NICEPAY_SECRET_KEY}`).toString('base64');

  try {
    console.log(`🚀 승인 API 호출: tid=${tid}, orderId=${orderId}, amount=${amount}`);

    const response = await axios.post(
      `${NICEPAY_API_BASE}/v1/payments/${tid}`,
      {
        amount: amount.toString(),
        ediDate,
        signData,
        orderId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        timeout: 30000
      }
    );

    console.log(`✅ 승인 API 응답:`, JSON.stringify(response.data, null, 2));
    return response.data;

  } catch (error) {
    console.error(`❌ 승인 API 실패:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * 결제 상태 업데이트
 */
async function updatePaymentStatus(orderId, status, approvalData = {}) {
  if (!db) {
    console.warn('⚠️ DB 없음 - 상태 업데이트 스킵');
    return;
  }

  try {
    const updateFields = {
      status,
      result_code: approvalData.resultCode || null,
      result_msg: approvalData.resultMsg || null,
      tid: approvalData.tid || null,
      payment_method: approvalData.payMethod || null,
      card_name: approvalData.cardName || approvalData.fnName || null,
      card_no: approvalData.cardNo || null,
      paid_at: status === 'PAID' ? new Date() : null,
      updated_at: new Date()
    };

    await db.query(`
      UPDATE nicepay_payments SET
        status = $1,
        result_code = $2,
        result_msg = $3,
        tid = $4,
        payment_method = $5,
        card_name = $6,
        card_no = $7,
        paid_at = $8,
        updated_at = $9
      WHERE order_id = $10
    `, [
      updateFields.status,
      updateFields.result_code,
      updateFields.result_msg,
      updateFields.tid,
      updateFields.payment_method,
      updateFields.card_name,
      updateFields.card_no,
      updateFields.paid_at,
      updateFields.updated_at,
      orderId
    ]);

    console.log(`✅ 결제 상태 업데이트: ${orderId} → ${status}`);
  } catch (error) {
    console.error('❌ 결제 상태 업데이트 실패:', error.message);
    throw error;
  }
}

/**
 * 결제 검증 (Wix용)
 * orderId + vt(verification_token) 으로 결제 상태 확인
 */
async function verifyPayment(orderId, verificationToken) {
  if (!db) {
    return { success: false, error: 'DB_NOT_AVAILABLE' };
  }

  try {
    const result = await db.query(`
      SELECT order_id, amount, status, paid_at, card_name, card_no, goods_name
      FROM nicepay_payments
      WHERE order_id = $1 AND verification_token = $2
    `, [orderId, verificationToken]);

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'PAYMENT_NOT_FOUND',
        message: '결제 정보를 찾을 수 없습니다'
      };
    }

    const payment = result.rows[0];
    return {
      success: true,
      payment: {
        orderId: payment.order_id,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paid_at,
        cardName: payment.card_name,
        cardNo: payment.card_no,
        goodsName: payment.goods_name
      }
    };
  } catch (error) {
    console.error('❌ 결제 검증 실패:', error.message);
    return { success: false, error: 'DB_ERROR', message: error.message };
  }
}

/**
 * 주문 정보 조회 (orderId로)
 */
async function getPaymentByOrderId(orderId) {
  if (!db) return null;

  try {
    const result = await db.query(`
      SELECT * FROM nicepay_payments WHERE order_id = $1
    `, [orderId]);

    return result.rows[0] || null;
  } catch (error) {
    console.error('❌ 결제 조회 실패:', error.message);
    return null;
  }
}

/**
 * Wix 성공 페이지 URL 생성
 */
function buildWixSuccessUrl(orderId, verificationToken) {
  return `${WIX_SUCCESS_URL}?orderId=${encodeURIComponent(orderId)}&vt=${encodeURIComponent(verificationToken)}`;
}

/**
 * 설정 검증
 */
function validateConfig() {
  const missing = [];
  if (!NICEPAY_CLIENT_ID) missing.push('NICEPAY_CLIENT_ID');
  if (!NICEPAY_SECRET_KEY) missing.push('NICEPAY_SECRET_KEY');
  if (!NICEPAY_RETURN_URL) missing.push('NICEPAY_RETURN_URL');

  return {
    isValid: missing.length === 0,
    missing
  };
}

module.exports = {
  createPayment,
  verifyAuthSignature,
  requestApproval,
  updatePaymentStatus,
  verifyPayment,
  getPaymentByOrderId,
  buildWixSuccessUrl,
  validateConfig,
  // 상수 노출 (라우터에서 사용)
  NICEPAY_CLIENT_ID,
  NICEPAY_RETURN_URL,
  WIX_SUCCESS_URL
};
