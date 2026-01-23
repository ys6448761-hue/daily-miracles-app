/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 토스페이먼츠 결제 링크 서비스
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 기능:
 *   1. createPaymentLink() - 결제 링크 생성
 *   2. verifyPayment() - 결제 승인 확인
 *   3. getPaymentStatus() - 결제 상태 조회
 *
 * 환경변수:
 *   - TOSS_SECRET_KEY: 토스페이먼츠 시크릿 키
 *   - TOSS_CLIENT_KEY: 토스페이먼츠 클라이언트 키 (프론트용)
 *   - PAYMENT_SUCCESS_URL: 결제 성공 리다이렉트 URL
 *   - PAYMENT_FAIL_URL: 결제 실패 리다이렉트 URL
 *
 * 작성일: 2026-01-09
 * ═══════════════════════════════════════════════════════════════════════════
 */

const https = require('https');

// ═══════════════════════════════════════════════════════════════════════════
// 설정
// ═══════════════════════════════════════════════════════════════════════════

const TOSS_API_BASE = 'https://api.tosspayments.com/v1';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY;

// 기본 URL (환경변수 우선, 없으면 기본값)
const BASE_URL = process.env.APP_BASE_URL || 'https://app.dailymiracles.kr';
const DEFAULT_SUCCESS_URL = process.env.PAYMENT_SUCCESS_URL || `${BASE_URL}/payment/success`;
const DEFAULT_FAIL_URL = process.env.PAYMENT_FAIL_URL || `${BASE_URL}/payment/fail`;

// 결제 링크 유효 시간 (기본 24시간)
const DEFAULT_VALID_HOURS = 24;

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 토스 API 호출
 */
function callTossAPI(method, path, data = null) {
  return new Promise((resolve, reject) => {
    if (!TOSS_SECRET_KEY) {
      return reject(new Error('TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다'));
    }

    // Basic 인증 (secretKey:)
    const auth = Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64');

    const options = {
      hostname: 'api.tosspayments.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject({
              statusCode: res.statusCode,
              code: parsed.code,
              message: parsed.message
            });
          }
        } catch (e) {
          reject(new Error(`응답 파싱 실패: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

/**
 * 결제용 Order ID 생성
 * 형식: PAY-YYYYMMDD-XXXX
 */
function generatePaymentOrderId(quoteId) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY-${date}-${random}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 메인 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 결제 링크 생성
 *
 * @param {Object} options
 * @param {string} options.quoteId - 견적 ID
 * @param {number} options.amount - 결제 금액
 * @param {string} options.orderName - 주문명 (예: "여수 소원항해 2박3일")
 * @param {string} [options.customerName] - 고객명
 * @param {string} [options.customerPhone] - 고객 전화번호
 * @param {string} [options.customerEmail] - 고객 이메일
 * @param {number} [options.validHours] - 링크 유효시간 (시간)
 * @param {string} [options.paymentType] - deposit (예약금) | full (전액)
 *
 * @returns {Promise<Object>} { success, paymentLinkId, paymentLink, expiredAt, ... }
 */
async function createPaymentLink(options) {
  const {
    quoteId,
    amount,
    orderName,
    customerName,
    customerPhone,
    customerEmail,
    validHours = DEFAULT_VALID_HOURS,
    paymentType = 'deposit'
  } = options;

  // 필수값 검증
  if (!quoteId || !amount || !orderName) {
    return {
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'quoteId, amount, orderName은 필수입니다'
    };
  }

  // 테스트 모드 체크
  const isTestMode = !TOSS_SECRET_KEY || TOSS_SECRET_KEY.startsWith('test_');

  if (!TOSS_SECRET_KEY) {
    console.warn('[TossPayments] 시크릿 키 없음 - 테스트 링크 반환');
    return {
      success: true,
      testMode: true,
      paymentLinkId: `TEST-${quoteId}`,
      paymentLink: `${BASE_URL}/payment/test?quoteId=${quoteId}&amount=${amount}`,
      orderId: generatePaymentOrderId(quoteId),
      amount,
      orderName,
      expiredAt: new Date(Date.now() + validHours * 60 * 60 * 1000).toISOString(),
      message: '테스트 모드: TOSS_SECRET_KEY를 설정하세요'
    };
  }

  try {
    // 결제 링크 요청 데이터
    const orderId = generatePaymentOrderId(quoteId);

    const requestData = {
      amount,
      orderId,
      orderName,
      successUrl: `${DEFAULT_SUCCESS_URL}?quoteId=${quoteId}&paymentType=${paymentType}`,
      failUrl: `${DEFAULT_FAIL_URL}?quoteId=${quoteId}`,
      validHours,
      // 고객 정보 (선택)
      ...(customerEmail && { customerEmail }),
      ...(customerName && { customerName }),
      ...(customerPhone && { customerMobilePhone: customerPhone })
    };

    console.log(`[TossPayments] 결제 링크 생성 요청: ${quoteId}`, {
      amount,
      orderName,
      validHours
    });

    // API 호출
    const response = await callTossAPI('POST', '/payment-links', requestData);

    console.log(`[TossPayments] 결제 링크 생성 완료: ${response.paymentLinkId}`);

    return {
      success: true,
      testMode: isTestMode,
      paymentLinkId: response.paymentLinkId,
      paymentLink: response.paymentLink,
      orderId,
      amount,
      orderName,
      expiredAt: response.expiredAt,
      createdAt: response.createdAt
    };

  } catch (error) {
    console.error('[TossPayments] 결제 링크 생성 실패:', error);

    return {
      success: false,
      error: error.code || 'API_ERROR',
      message: error.message || '결제 링크 생성 중 오류가 발생했습니다',
      statusCode: error.statusCode
    };
  }
}

/**
 * 결제 승인 (웹훅 또는 리다이렉트 후 호출)
 *
 * @param {Object} options
 * @param {string} options.paymentKey - 토스에서 받은 paymentKey
 * @param {string} options.orderId - 주문 ID
 * @param {number} options.amount - 결제 금액
 *
 * @returns {Promise<Object>}
 */
async function confirmPayment(options) {
  const { paymentKey, orderId, amount } = options;

  if (!paymentKey || !orderId || !amount) {
    return {
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'paymentKey, orderId, amount는 필수입니다'
    };
  }

  try {
    console.log(`[TossPayments] 결제 승인 요청: ${orderId}`);

    const response = await callTossAPI('POST', '/payments/confirm', {
      paymentKey,
      orderId,
      amount
    });

    console.log(`[TossPayments] 결제 승인 완료: ${orderId}, status=${response.status}`);

    return {
      success: true,
      paymentKey: response.paymentKey,
      orderId: response.orderId,
      orderName: response.orderName,
      status: response.status,
      method: response.method,
      totalAmount: response.totalAmount,
      approvedAt: response.approvedAt,
      receipt: response.receipt,
      card: response.card,
      virtualAccount: response.virtualAccount,
      transfer: response.transfer
    };

  } catch (error) {
    console.error('[TossPayments] 결제 승인 실패:', error);

    return {
      success: false,
      error: error.code || 'CONFIRM_ERROR',
      message: error.message || '결제 승인 중 오류가 발생했습니다'
    };
  }
}

/**
 * 결제 상태 조회
 *
 * @param {string} paymentKey - 결제 키
 * @returns {Promise<Object>}
 */
async function getPaymentStatus(paymentKey) {
  if (!paymentKey) {
    return {
      success: false,
      error: 'MISSING_PAYMENT_KEY'
    };
  }

  try {
    const response = await callTossAPI('GET', `/payments/${paymentKey}`);

    return {
      success: true,
      paymentKey: response.paymentKey,
      orderId: response.orderId,
      orderName: response.orderName,
      status: response.status,
      method: response.method,
      totalAmount: response.totalAmount,
      approvedAt: response.approvedAt,
      requestedAt: response.requestedAt
    };

  } catch (error) {
    console.error('[TossPayments] 결제 조회 실패:', error);

    return {
      success: false,
      error: error.code || 'QUERY_ERROR',
      message: error.message
    };
  }
}

/**
 * 결제 취소
 *
 * @param {Object} options
 * @param {string} options.paymentKey - 결제 키
 * @param {string} options.cancelReason - 취소 사유
 * @param {number} [options.cancelAmount] - 부분 취소 금액 (미입력시 전액)
 *
 * @returns {Promise<Object>}
 */
async function cancelPayment(options) {
  const { paymentKey, cancelReason, cancelAmount } = options;

  if (!paymentKey || !cancelReason) {
    return {
      success: false,
      error: 'MISSING_REQUIRED_FIELDS',
      message: 'paymentKey, cancelReason은 필수입니다'
    };
  }

  try {
    console.log(`[TossPayments] 결제 취소 요청: ${paymentKey}`);

    const requestData = {
      cancelReason,
      ...(cancelAmount && { cancelAmount })
    };

    const response = await callTossAPI('POST', `/payments/${paymentKey}/cancel`, requestData);

    console.log(`[TossPayments] 결제 취소 완료: ${paymentKey}`);

    return {
      success: true,
      paymentKey: response.paymentKey,
      orderId: response.orderId,
      status: response.status,
      cancels: response.cancels
    };

  } catch (error) {
    console.error('[TossPayments] 결제 취소 실패:', error);

    return {
      success: false,
      error: error.code || 'CANCEL_ERROR',
      message: error.message
    };
  }
}

/**
 * 예약금 계산 (총액의 30%)
 *
 * @param {number} totalAmount - 총 결제 금액
 * @param {Object} [options]
 * @param {number} [options.minDeposit] - 최소 예약금 (기본 50,000원)
 * @param {number} [options.maxDeposit] - 최대 예약금 (기본 500,000원)
 * @param {number} [options.rate] - 예약금 비율 (기본 0.3)
 *
 * @returns {Object} { deposit, balance, rate }
 */
function calculateDeposit(totalAmount, options = {}) {
  const {
    minDeposit = 50000,
    maxDeposit = 500000,
    rate = 0.3
  } = options;

  let deposit = Math.round(totalAmount * rate);

  // 최소/최대 적용
  deposit = Math.max(minDeposit, Math.min(maxDeposit, deposit));

  // 총액보다 크면 총액으로
  if (deposit > totalAmount) {
    deposit = totalAmount;
  }

  return {
    deposit,
    balance: totalAmount - deposit,
    rate,
    appliedRate: totalAmount > 0 ? deposit / totalAmount : 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 메인 함수
  createPaymentLink,
  confirmPayment,
  getPaymentStatus,
  cancelPayment,

  // 유틸리티
  calculateDeposit,
  generatePaymentOrderId,

  // 상수
  TOSS_CLIENT_KEY,
  BASE_URL,
  DEFAULT_SUCCESS_URL,
  DEFAULT_FAIL_URL
};
