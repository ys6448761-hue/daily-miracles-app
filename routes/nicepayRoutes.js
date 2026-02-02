/**
 * ═══════════════════════════════════════════════════════════
 * nicepayRoutes.js
 * 나이스페이 결제 라우터 (Server 승인 모델)
 * ═══════════════════════════════════════════════════════════
 *
 * 엔드포인트:
 * - GET  /pay                    → 결제창 호출 페이지
 * - POST /nicepay/return         → 나이스 인증결과 콜백
 * - GET  /api/payments/verify    → 결제 상태 조회 (Wix용)
 */

const express = require('express');
const path = require('path');
const router = express.Router();

// 서비스 로딩
let nicepayService = null;
try {
  nicepayService = require('../services/nicepayService');
  console.log('✅ nicepayService 로드 성공');
} catch (error) {
  console.error('❌ nicepayService 로드 실패:', error.message);
}

/**
 * GET /pay
 * 결제창 호출 페이지
 * Query: amount (필수)
 */
router.get('/pay', async (req, res) => {
  try {
    const { amount, goods } = req.query;

    // 금액 검증
    const amountNum = parseInt(amount, 10);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).send(`
        <html>
          <head><meta charset="UTF-8"><title>결제 오류</title></head>
          <body style="font-family: sans-serif; padding: 40px; text-align: center;">
            <h2>결제 금액이 필요합니다</h2>
            <p>사용법: /pay?amount=24900</p>
          </body>
        </html>
      `);
    }

    // 서비스 체크
    if (!nicepayService) {
      return res.status(503).send('결제 서비스를 사용할 수 없습니다');
    }

    // 설정 검증
    const config = nicepayService.validateConfig();
    if (!config.isValid) {
      console.error('❌ 나이스페이 설정 누락:', config.missing);
      return res.status(503).send('결제 설정이 완료되지 않았습니다');
    }

    // 결제 생성 (PENDING 저장)
    const goodsName = goods || '하루하루의 기적 서비스';
    const payment = await nicepayService.createPayment(amountNum, goodsName);

    console.log(`📦 결제 페이지 생성: orderId=${payment.orderId}, amount=${amountNum}`);

    // 결제창 HTML 반환
    res.send(generatePaymentPage(payment));

  } catch (error) {
    console.error('❌ 결제창 생성 실패:', error);
    res.status(500).send('결제 페이지 생성 중 오류가 발생했습니다');
  }
});

/**
 * POST /nicepay/return
 * 나이스페이 인증 결과 콜백 (Server 승인 모델)
 */
router.post('/nicepay/return', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    console.log('📥 나이스페이 콜백 수신:', JSON.stringify(req.body, null, 2));

    const {
      authResultCode,
      authResultMsg,
      tid,
      orderId,
      amount,
      signature,
      authToken
    } = req.body;

    if (!nicepayService) {
      return res.status(503).send('결제 서비스를 사용할 수 없습니다');
    }

    // 결제 정보 조회
    const payment = await nicepayService.getPaymentByOrderId(orderId);
    if (!payment) {
      console.error(`❌ 주문 정보 없음: ${orderId}`);
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=ORDER_NOT_FOUND`);
    }

    // 1. 인증 실패 처리
    if (authResultCode !== '0000') {
      console.error(`❌ 인증 실패: ${authResultCode} - ${authResultMsg}`);
      await nicepayService.updatePaymentStatus(orderId, 'FAILED', {
        resultCode: authResultCode,
        resultMsg: authResultMsg
      });
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=AUTH_FAILED&msg=${encodeURIComponent(authResultMsg)}`);
    }

    // 2. 서명 검증
    if (!nicepayService.verifyAuthSignature(authToken, amount, signature)) {
      console.error('❌ 서명 검증 실패');
      await nicepayService.updatePaymentStatus(orderId, 'FAILED', {
        resultCode: 'SIGN_FAIL',
        resultMsg: '서명 검증 실패'
      });
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=SIGNATURE_INVALID`);
    }

    // 3. 금액 검증
    const requestedAmount = parseInt(amount, 10);
    if (payment.amount !== requestedAmount) {
      console.error(`❌ 금액 불일치: DB=${payment.amount}, 요청=${requestedAmount}`);
      await nicepayService.updatePaymentStatus(orderId, 'FAILED', {
        resultCode: 'AMOUNT_MISMATCH',
        resultMsg: '결제 금액 불일치'
      });
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=AMOUNT_MISMATCH`);
    }

    // 4. 승인 API 호출
    const approvalResult = await nicepayService.requestApproval(tid, orderId, amount);

    // 5. 승인 결과 처리
    if (approvalResult.resultCode === '0000') {
      // 성공
      await nicepayService.updatePaymentStatus(orderId, 'PAID', approvalResult);
      const successUrl = nicepayService.buildWixSuccessUrl(orderId, payment.verification_token);
      console.log(`✅ 결제 완료! Redirect: ${successUrl}`);
      return res.redirect(successUrl);
    } else {
      // 승인 실패
      await nicepayService.updatePaymentStatus(orderId, 'FAILED', approvalResult);
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=APPROVAL_FAILED&code=${approvalResult.resultCode}`);
    }

  } catch (error) {
    console.error('❌ 결제 콜백 처리 실패:', error);
    res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=SYSTEM_ERROR`);
  }
});

/**
 * GET /api/payments/verify
 * 결제 상태 조회 (Wix용)
 * Query: orderId, vt
 */
router.get('/api/payments/verify', async (req, res) => {
  try {
    const { orderId, vt } = req.query;

    if (!orderId || !vt) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMS',
        message: 'orderId와 vt 파라미터가 필요합니다'
      });
    }

    if (!nicepayService) {
      return res.status(503).json({
        success: false,
        error: 'SERVICE_UNAVAILABLE',
        message: '결제 서비스를 사용할 수 없습니다'
      });
    }

    const result = await nicepayService.verifyPayment(orderId, vt);
    res.json(result);

  } catch (error) {
    console.error('❌ 결제 검증 실패:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: error.message
    });
  }
});

/**
 * 결제창 HTML 생성
 */
function generatePaymentPage(payment) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>결제 - 하루하루의 기적</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #9B87F5 0%, #F5A7C6 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 20px;
      padding: 40px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }
    .logo {
      font-size: 48px;
      margin-bottom: 20px;
    }
    h1 {
      color: #333;
      font-size: 22px;
      margin-bottom: 10px;
    }
    .order-info {
      background: #FFF5F7;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-info .label {
      color: #888;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .order-info .value {
      color: #333;
      font-size: 16px;
      font-weight: 600;
    }
    .amount {
      font-size: 32px;
      font-weight: 700;
      color: #9B87F5;
      margin: 20px 0;
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;
      margin-top: 20px;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #9B87F5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .loading-text {
      color: #666;
      font-size: 14px;
    }
    .error {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      padding: 15px;
      margin-top: 20px;
      color: #c00;
      display: none;
    }
  </style>
  <!-- 나이스페이 SDK -->
  <script src="https://pay.nicepay.co.kr/v1/js/"></script>
</head>
<body>
  <div class="container">
    <div class="logo">✨</div>
    <h1>${payment.goodsName}</h1>

    <div class="order-info">
      <div class="label">주문번호</div>
      <div class="value">${payment.orderId}</div>
    </div>

    <div class="amount">${payment.amount.toLocaleString()}원</div>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <div class="loading-text">결제창을 불러오는 중...</div>
    </div>

    <div class="error" id="error"></div>
  </div>

  <script>
    // 결제 요청
    function requestPayment() {
      try {
        AUTHNICE.requestPay({
          clientId: '${payment.clientId}',
          method: 'card',
          orderId: '${payment.orderId}',
          amount: ${payment.amount},
          goodsName: '${payment.goodsName}',
          returnUrl: '${payment.returnUrl}',
          fnError: function(result) {
            console.error('결제창 오류:', result);
            document.getElementById('loading').style.display = 'none';
            const errorEl = document.getElementById('error');
            errorEl.style.display = 'block';
            errorEl.textContent = result.errorMsg || '결제창을 불러올 수 없습니다';
          }
        });
      } catch (err) {
        console.error('결제 요청 실패:', err);
        document.getElementById('loading').style.display = 'none';
        const errorEl = document.getElementById('error');
        errorEl.style.display = 'block';
        errorEl.textContent = '결제 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.';
      }
    }

    // 페이지 로드 시 결제창 호출
    window.onload = function() {
      setTimeout(requestPayment, 500);
    };
  </script>
</body>
</html>
`;
}

module.exports = router;
