/**
 * ═══════════════════════════════════════════════════════════
 * nicepayService.js
 * 나이스페이 결제 서비스 (인증결제 웹 방식)
 * ═══════════════════════════════════════════════════════════
 *
 * 나이스페이 "인증결제 웹" 연동
 * - SDK: https://web.nicepay.co.kr/v3/webstd/js/nicepay-3.0.js
 * - SignData: SHA256(MID + Amt + EdiDate + MerchantKey)
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

// 환경변수 (인증결제 웹용)
const NICEPAY_MID = process.env.NICEPAY_MID || process.env.NICEPAY_CLIENT_ID || '';
const NICEPAY_MERCHANT_KEY = process.env.NICEPAY_MERCHANT_KEY || process.env.NICEPAY_SECRET_KEY || '';
const NICEPAY_RETURN_URL = process.env.NICEPAY_RETURN_URL || '';
const WIX_SUCCESS_URL = process.env.WIX_SUCCESS_URL || 'https://dailymiracles.kr/payment-success';

// 나이스페이 API 베이스 URL
const NICEPAY_API_BASE = 'https://webapi.nicepay.co.kr';

/**
 * 주문번호 생성 (Moid)
 * 나이스페이 규칙: 영문/숫자 최대 64자
 */
function generateOrderId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = date.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY${dateStr}${timeStr}${random}`;
}

/**
 * 검증 토큰 생성 (Wix 검증용)
 */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * EdiDate 생성 (YYYYMMDDHHmmss)
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
 * SignData 생성 (인증결제 웹)
 * SHA256(MID + Amt + EdiDate + MerchantKey)
 */
function generateSignData(amt, ediDate) {
  const data = NICEPAY_MID + amt + ediDate + NICEPAY_MERCHANT_KEY;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 결제 생성 (PENDING 상태로 DB 저장)
 */
async function createPayment(amount, goodsName = '하루하루의 기적 서비스') {
  const orderId = generateOrderId();
  const verificationToken = generateVerificationToken();
  const ediDate = generateEdiDate();
  const signData = generateSignData(amount.toString(), ediDate);

  if (db) {
    try {
      await db.query(`
        INSERT INTO nicepay_payments (order_id, verification_token, amount, goods_name, status)
        VALUES ($1, $2, $3, $4, 'PENDING')
      `, [orderId, verificationToken, amount, goodsName]);
      console.log(`✅ 결제 생성: ${orderId}, 금액: ${amount}원, MID: ${NICEPAY_MID}`);
    } catch (error) {
      console.error('❌ 결제 생성 실패:', error.message);
      throw error;
    }
  }

  return {
    // 필수 파라미터 (인증결제 웹)
    mid: NICEPAY_MID,
    moid: orderId,
    amt: amount.toString(),
    goodsName,
    ediDate,
    signData,
    returnUrl: NICEPAY_RETURN_URL,
    // 내부용
    orderId,
    verificationToken,
    amount
  };
}

/**
 * 인증 결과 서명 검증 (인증결제 웹)
 * SHA256(AuthResultCode + AuthToken + MID + Amt + MerchantKey)
 */
function verifyAuthSignature(authResultCode, authToken, amt, signature) {
  if (!NICEPAY_MERCHANT_KEY) {
    console.warn('⚠️ NICEPAY_MERCHANT_KEY 미설정');
    return false;
  }

  const data = authResultCode + authToken + NICEPAY_MID + amt + NICEPAY_MERCHANT_KEY;
  const expected = crypto.createHash('sha256').update(data).digest('hex');

  const isValid = expected === signature;
  console.log(`🔐 서명 검증: ${isValid ? '✅ 통과' : '❌ 실패'}`);
  console.log(`   expected: ${expected.substring(0, 20)}...`);
  console.log(`   received: ${signature?.substring(0, 20)}...`);

  return isValid;
}

/**
 * 승인 API 호출 (인증결제 웹)
 * POST https://webapi.nicepay.co.kr/webapi/pay_process.jsp
 */
async function requestApproval(authToken, amt, ediDate, signData, moid, tid) {
  try {
    console.log(`🚀 승인 API 호출: tid=${tid}, moid=${moid}, amt=${amt}`);

    // URL encoded form data
    const params = new URLSearchParams();
    params.append('TID', tid);
    params.append('AuthToken', authToken);
    params.append('MID', NICEPAY_MID);
    params.append('Amt', amt);
    params.append('EdiDate', ediDate);
    params.append('SignData', signData);
    params.append('CharSet', 'utf-8');

    const response = await axios.post(
      `${NICEPAY_API_BASE}/webapi/pay_process.jsp`,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
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
      status,
      approvalData.ResultCode || approvalData.resultCode || null,
      approvalData.ResultMsg || approvalData.resultMsg || null,
      approvalData.TID || approvalData.tid || null,
      approvalData.PayMethod || approvalData.payMethod || null,
      approvalData.CardName || approvalData.cardName || null,
      approvalData.CardNo || approvalData.cardNo || null,
      status === 'PAID' ? new Date() : null,
      new Date(),
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
 * 주문 정보 조회
 */
async function getPaymentByOrderId(orderId) {
  if (!db) return null;

  try {
    const result = await db.query(
      'SELECT * FROM nicepay_payments WHERE order_id = $1',
      [orderId]
    );
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
  if (!NICEPAY_MID) missing.push('NICEPAY_MID (또는 NICEPAY_CLIENT_ID)');
  if (!NICEPAY_MERCHANT_KEY) missing.push('NICEPAY_MERCHANT_KEY (또는 NICEPAY_SECRET_KEY)');
  if (!NICEPAY_RETURN_URL) missing.push('NICEPAY_RETURN_URL');

  return {
    isValid: missing.length === 0,
    missing,
    mid: NICEPAY_MID ? `${NICEPAY_MID.substring(0, 6)}***` : 'NOT_SET'
  };
}

/**
 * EdiDate 및 SignData 재생성 (콜백에서 사용)
 */
function regenerateSignData(amt) {
  const ediDate = generateEdiDate();
  const signData = generateSignData(amt, ediDate);
  return { ediDate, signData };
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
  regenerateSignData,
  generateEdiDate,
  generateSignData,
  // 상수 노출
  NICEPAY_MID,
  NICEPAY_RETURN_URL,
  WIX_SUCCESS_URL
};
