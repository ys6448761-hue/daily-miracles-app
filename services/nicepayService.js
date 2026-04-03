/**
 * ═══════════════════════════════════════════════════════════
 * nicepayService.js
 * 나이스페이 결제 서비스 (인증결제 웹 방식)
 * ═══════════════════════════════════════════════════════════
 *
 * 나이스페이 "인증결제 웹" 연동
 * - SDK: https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js (nicepayRoutes.js HTML 실제 사용)
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
const NICEPAY_MID = (process.env.NICEPAY_MID || process.env.NICEPAY_CLIENT_ID || '').trim();
const NICEPAY_MERCHANT_KEY = (process.env.NICEPAY_MERCHANT_KEY || process.env.NICEPAY_SECRET_KEY || '').trim();
const NICEPAY_RETURN_URL = (process.env.NICEPAY_RETURN_URL || '').trim();
const WIX_SUCCESS_URL = (process.env.WIX_SUCCESS_URL || 'https://app.dailymiracles.kr/nicepay/success').trim();

// 나이스페이 API 베이스 URL (공식 매뉴얼: dc1-api 또는 dc2-api)
const NICEPAY_API_BASE = 'https://dc1-api.nicepay.co.kr';

// ═══════════════════════════════════════════════════════════
// [NicePay] 시작 시 환경변수 검증 로그 (MerchantKey 값은 출력 안함)
// ═══════════════════════════════════════════════════════════
console.log('\n' + '┌' + '─'.repeat(58) + '┐');
console.log('│' + ' '.repeat(15) + 'NicePay 환경변수 검증' + ' '.repeat(22) + '│');
console.log('├' + '─'.repeat(58) + '┤');
console.log(`│  NICEPAY_MID:           ${NICEPAY_MID ? `✅ ${NICEPAY_MID}` : '❌ 미설정'}`.padEnd(59) + '│');
console.log(`│  NICEPAY_MERCHANT_KEY:  ${NICEPAY_MERCHANT_KEY ? `✅ 설정됨 (${NICEPAY_MERCHANT_KEY.length}자)` : '❌ 미설정'}`.padEnd(59) + '│');
console.log(`│  NICEPAY_RETURN_URL:    ${NICEPAY_RETURN_URL ? '✅ ' + NICEPAY_RETURN_URL.substring(0, 30) + '...' : '❌ 미설정'}`.padEnd(59) + '│');
console.log(`│  WIX_SUCCESS_URL:       ${WIX_SUCCESS_URL}`.padEnd(59) + '│');
console.log(`│  NICEPAY_API_BASE:      ${NICEPAY_API_BASE}`.padEnd(59) + '│');
console.log('└' + '─'.repeat(58) + '┘\n');

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
 * SHA256(EdiDate + MID + Amt + MerchantKey) - 순서 중요!
 */
function generateSignData(amt, ediDate) {
  const data = ediDate + NICEPAY_MID + amt + NICEPAY_MERCHANT_KEY;
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
 * SHA256(AuthToken + MID + Amt + MerchantKey) - AuthResultCode 제외!
 *
 * [NicePay 지원팀용 상세 로그 - raw 문자열 포함]
 */
function verifyAuthSignature(authResultCode, authToken, amt, signature) {
  console.log('\n' + '═'.repeat(70));
  console.log('🔐 [서명 검증] 상세 디버그');
  console.log('═'.repeat(70));

  if (!NICEPAY_MERCHANT_KEY) {
    console.error('❌ NICEPAY_MERCHANT_KEY 환경변수 미설정!');
    console.log('═'.repeat(70) + '\n');
    return false;
  }

  // ═══════════════════════════════════════════════════════════
  // 1. 입력값 상세 출력 (타입, 길이 포함)
  // ═══════════════════════════════════════════════════════════
  console.log('┌─────────────────────────────────────────────────────────────────');
  console.log('│ 📋 입력값 상세 (타입, 길이 포함)');
  console.log('├─────────────────────────────────────────────────────────────────');
  console.log(`│  [1] AuthToken      : "${authToken}" (${typeof authToken}, ${String(authToken).length}자)`);
  console.log(`│  [2] MID            : "${NICEPAY_MID}" (${typeof NICEPAY_MID}, ${NICEPAY_MID.length}자)`);
  console.log(`│  [3] Amt            : "${amt}" (${typeof amt}, ${String(amt).length}자)`);
  console.log(`│  [4] MerchantKey    : (${typeof NICEPAY_MERCHANT_KEY}, ${NICEPAY_MERCHANT_KEY.length}자)`);
  console.log('└─────────────────────────────────────────────────────────────────');

  // ═══════════════════════════════════════════════════════════
  // 2. Raw 문자열 구성 (마스킹 버전)
  // ═══════════════════════════════════════════════════════════
  const maskedKey = '*'.repeat(NICEPAY_MERCHANT_KEY.length);
  const rawStringMasked = authToken + NICEPAY_MID + amt + maskedKey;

  console.log('┌─────────────────────────────────────────────────────────────────');
  console.log('│ 📝 SHA256 해시 대상 (Raw String, Key는 * 마스킹)');
  console.log('├─────────────────────────────────────────────────────────────────');
  console.log(`│  연결 순서: AuthToken + MID + Amt + MerchantKey (AuthResultCode 제외)`);
  console.log('│');
  console.log(`│  Raw String (${rawStringMasked.length}자):`);
  console.log(`│  "${rawStringMasked}"`);
  console.log('└─────────────────────────────────────────────────────────────────');

  // ═══════════════════════════════════════════════════════════
  // 3. SHA256 계산 (AuthToken + MID + Amt + MerchantKey)
  // ═══════════════════════════════════════════════════════════
  const data = authToken + NICEPAY_MID + amt + NICEPAY_MERCHANT_KEY;
  const expected = crypto.createHash('sha256').update(data, 'utf8').digest('hex').toLowerCase();
  const receivedLower = (signature || '').trim().toLowerCase();

  console.log('┌─────────────────────────────────────────────────────────────────');
  console.log('│ 🔢 SHA256 Digest 비교');
  console.log('├─────────────────────────────────────────────────────────────────');
  console.log(`│  계산된 digest (expected):`);
  console.log(`│  ${expected}`);
  console.log('│');
  console.log(`│  수신된 signature (received):`);
  console.log(`│  ${receivedLower}`);
  console.log('└─────────────────────────────────────────────────────────────────');

  const isValid = expected === receivedLower;

  // ═══════════════════════════════════════════════════════════
  // 4. 결과 및 진단
  // ═══════════════════════════════════════════════════════════
  console.log('┌─────────────────────────────────────────────────────────────────');
  if (isValid) {
    console.log('│ ✅ 서명 검증 성공!');
  } else {
    console.log('│ ❌ 서명 검증 실패!');
    console.log('├─────────────────────────────────────────────────────────────────');
    console.log('│ 🔍 진단 체크리스트:');
    console.log(`│    - MerchantKey 길이: ${NICEPAY_MERCHANT_KEY.length}자 (정상: 64자)`);
    console.log(`│    - MerchantKey 첫 4자: "${NICEPAY_MERCHANT_KEY.substring(0, 4)}"`);
    console.log(`│    - MerchantKey 끝 4자: "${NICEPAY_MERCHANT_KEY.substring(NICEPAY_MERCHANT_KEY.length - 4)}"`);
    console.log(`│    - 공백 포함 여부: ${/\s/.test(NICEPAY_MERCHANT_KEY) ? '⚠️ 있음!' : '없음'}`);
    console.log(`│    - 줄바꿈 포함 여부: ${/[\r\n]/.test(NICEPAY_MERCHANT_KEY) ? '⚠️ 있음!' : '없음'}`);
  }
  console.log('└─────────────────────────────────────────────────────────────────');
  console.log('═'.repeat(70) + '\n');

  return isValid;
}

/**
 * 승인 API 호출 (인증결제 웹)
 * NextAppURL을 우선 사용, 없으면 NICEPAY_API_BASE 사용
 *
 * [NicePay 지원팀용 로그 포함]
 */
async function requestApproval(authToken, amt, ediDate, signData, moid, tid, nextAppUrl) {
  // NextAppURL 우선 사용 (dc1/dc2 IDC 분산 대응)
  const approvalUrl = nextAppUrl || `${NICEPAY_API_BASE}/webapi/pay_process.jsp`;

  // 승인용 SignData 로깅 (plaintext 길이 + sha 출력)
  const signPlaintext = authToken + NICEPAY_MID + amt + ediDate + NICEPAY_MERCHANT_KEY;
  const maskedPlaintext = authToken + NICEPAY_MID + amt + ediDate + '*'.repeat(NICEPAY_MERCHANT_KEY.length);

  // ═══════════════════════════════════════════════════════════
  // [NicePay 지원팀용] 승인 요청 상세 로그
  // ═══════════════════════════════════════════════════════════
  console.log('\n' + '═'.repeat(60));
  console.log('🚀 [NicePay 승인 요청] 시작');
  console.log('═'.repeat(60));
  console.log(`📍 NextAppURL (콜백): ${nextAppUrl || '(없음)'}`);
  console.log(`📍 최종 승인 URL: ${approvalUrl}`);
  console.log(`📋 요청 파라미터:`);
  console.log(`   - TID: ${tid}`);
  console.log(`   - AuthToken: ${authToken?.substring(0, 30)}...`);
  console.log(`   - MID: ${NICEPAY_MID}`);
  console.log(`   - Amt: ${amt}`);
  console.log(`   - EdiDate: ${ediDate}`);
  console.log(`   - SignData: ${signData?.substring(0, 30)}...`);
  console.log(`   - Moid: ${moid}`);
  console.log(`   - CharSet: utf-8`);
  console.log('─'.repeat(60));
  console.log(`📝 승인 SignData plaintext (${maskedPlaintext.length}자, Key 마스킹):`);
  console.log(`   "${maskedPlaintext.substring(0, 80)}..."`);
  console.log('─'.repeat(60));

  try {
    // URL encoded form data
    const params = new URLSearchParams();
    params.append('TID', tid);
    params.append('AuthToken', authToken);
    params.append('MID', NICEPAY_MID);
    params.append('Amt', amt);
    params.append('EdiDate', ediDate);
    params.append('SignData', signData);
    params.append('CharSet', 'utf-8');

    const startTime = Date.now();

    const response = await axios.post(
      approvalUrl,
      params.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
        },
        timeout: 30000
      }
    );

    const elapsed = Date.now() - startTime;

    // ═══════════════════════════════════════════════════════════
    // [NicePay 지원팀용] 승인 응답 상세 로그
    // ═══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.log(`✅ [NicePay 승인 응답] (${elapsed}ms)`);
    console.log(`   - ResultCode: ${response.data?.ResultCode}`);
    console.log(`   - ResultMsg: ${response.data?.ResultMsg}`);
    console.log(`   - TID: ${response.data?.TID}`);
    console.log(`   - Amt: ${response.data?.Amt}`);
    console.log(`   - PayMethod: ${response.data?.PayMethod}`);
    console.log(`   - CardName: ${response.data?.CardName || 'N/A'}`);
    console.log(`   - CardNo: ${response.data?.CardNo || 'N/A'}`);
    console.log('═'.repeat(60) + '\n');

    return response.data;

  } catch (error) {
    // ═══════════════════════════════════════════════════════════
    // [NicePay 지원팀용] 승인 에러 상세 로그
    // ═══════════════════════════════════════════════════════════
    console.log('─'.repeat(60));
    console.error(`❌ [NicePay 승인 에러]`);
    console.error(`   - Error Type: ${error.name}`);
    console.error(`   - Error Message: ${error.message}`);
    if (error.response) {
      console.error(`   - HTTP Status: ${error.response.status}`);
      console.error(`   - Response Data:`, JSON.stringify(error.response.data, null, 2));
    }
    console.log('═'.repeat(60) + '\n');

    // 에러 응답도 처리 가능하도록 반환
    if (error.response?.data) {
      return error.response.data;
    }

    return {
      ResultCode: 'E999',
      ResultMsg: `승인 API 통신 실패: ${error.message}`
    };
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
  const url = `${WIX_SUCCESS_URL}?orderId=${encodeURIComponent(orderId)}&vt=${encodeURIComponent(verificationToken)}`;
  console.log(`📍 [buildWixSuccessUrl] WIX_SUCCESS_URL="${WIX_SUCCESS_URL}"`);
  console.log(`📍 [buildWixSuccessUrl] 생성된 URL="${url}"`);
  return url;
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
 * 승인 API용 SignData 생성
 * SHA256(AuthToken + MID + Amt + EdiDate + MerchantKey) - 승인 요청 전용
 */
function generateApprovalSignData(authToken, amt, ediDate) {
  const data = authToken + NICEPAY_MID + amt + ediDate + NICEPAY_MERCHANT_KEY;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * EdiDate 및 승인용 SignData 재생성 (콜백에서 사용)
 */
function regenerateSignData(amt, authToken) {
  const ediDate = generateEdiDate();
  // authToken이 있으면 승인용 SignData, 없으면 일반 SignData
  const signData = authToken
    ? generateApprovalSignData(authToken, amt, ediDate)
    : generateSignData(amt, ediDate);
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
