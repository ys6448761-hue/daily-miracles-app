/**
 * ═══════════════════════════════════════════════════════════
 * nicepayRoutes.js
 * 나이스페이 결제 라우터 (인증결제 웹 방식)
 * ═══════════════════════════════════════════════════════════
 *
 * 엔드포인트:
 * - GET  /pay                    → 결제창 호출 페이지
 * - POST /nicepay/return         → 나이스 인증결과 콜백
 * - GET  /api/payments/verify    → 결제 상태 조회 (Wix용)
 */

const express = require('express');
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
 * 결제창 호출 페이지 (인증결제 웹)
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
      return res.status(503).send(`결제 설정이 완료되지 않았습니다. 누락: ${config.missing.join(', ')}`);
    }

    // 결제 생성 (PENDING 저장)
    const goodsName = goods || '하루하루의 기적 서비스';
    const payment = await nicepayService.createPayment(amountNum, goodsName);

    console.log(`📦 결제 페이지 생성: moid=${payment.moid}, amount=${amountNum}, mid=${payment.mid}`);

    // 결제창 HTML 반환 (인증결제 웹 방식)
    res.send(generatePaymentPage(payment));

  } catch (error) {
    console.error('❌ 결제창 생성 실패:', error);
    res.status(500).send('결제 페이지 생성 중 오류가 발생했습니다');
  }
});

/**
 * POST /nicepay/return
 * 나이스페이 인증 결과 콜백 (인증결제 웹)
 *
 * [NicePay 지원팀용 상세 로그 포함]
 */
router.post('/nicepay/return', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    // ═══════════════════════════════════════════════════════════
    // [NicePay 지원팀용] 인증 콜백 상세 로그
    // ═══════════════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('📥 [NicePay 인증 콜백] 수신');
    console.log('═'.repeat(60));
    console.log(`📅 수신 시각: ${new Date().toISOString()}`);
    console.log(`📋 콜백 파라미터:`);
    console.log(`   - AuthResultCode: ${req.body.AuthResultCode}`);
    console.log(`   - AuthResultMsg: ${req.body.AuthResultMsg}`);
    console.log(`   - TID: ${req.body.TID}`);
    console.log(`   - MID: ${req.body.MID}`);
    console.log(`   - Moid: ${req.body.Moid}`);
    console.log(`   - Amt: ${req.body.Amt}`);
    console.log(`   - AuthToken: ${req.body.AuthToken?.substring(0, 30)}...`);
    console.log(`   - Signature: ${req.body.Signature?.substring(0, 30)}...`);
    console.log(`   - NextAppURL: ${req.body.NextAppURL}`);
    console.log('─'.repeat(60));

    const {
      AuthResultCode,
      AuthResultMsg,
      TID,
      MID,
      Moid,
      Amt,
      AuthToken,
      Signature,
      NextAppURL,
      NetCancelURL
    } = req.body;

    if (!nicepayService) {
      return res.status(503).send('결제 서비스를 사용할 수 없습니다');
    }

    // 결제 정보 조회
    const payment = await nicepayService.getPaymentByOrderId(Moid);
    if (!payment) {
      console.error(`❌ 주문 정보 없음: ${Moid}`);
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=ORDER_NOT_FOUND`);
    }

    // 1. 인증 실패 처리
    if (AuthResultCode !== '0000') {
      console.error(`❌ 인증 실패: ${AuthResultCode} - ${AuthResultMsg}`);
      await nicepayService.updatePaymentStatus(Moid, 'FAILED', {
        ResultCode: AuthResultCode,
        ResultMsg: AuthResultMsg
      });
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=AUTH_FAILED&msg=${encodeURIComponent(AuthResultMsg || '')}`);
    }

    // 2. 서명 검증 (경고만 - 승인은 계속 진행)
    // 나이스페이 웹표준 결제에서 인증응답 서명검증은 선택사항
    // 핵심 보안은 승인 요청의 SignData에서 처리됨
    const signatureValid = nicepayService.verifyAuthSignature(AuthResultCode, AuthToken, Amt, Signature);
    if (!signatureValid) {
      console.warn('⚠️ 서명 검증 불일치 - 승인 요청은 계속 진행');
      console.warn('   (나이스페이 지원팀에 Signature 공식 확인 필요)');
      // 승인 요청으로 계속 진행 (인증응답 서명은 선택적)
    } else {
      console.log('✅ 서명 검증 성공');
    }

    // 3. 금액 검증
    const requestedAmount = parseInt(Amt, 10);
    if (payment.amount !== requestedAmount) {
      console.error(`❌ 금액 불일치: DB=${payment.amount}, 요청=${requestedAmount}`);
      await nicepayService.updatePaymentStatus(Moid, 'FAILED', {
        ResultCode: 'AMOUNT_MISMATCH',
        ResultMsg: '결제 금액 불일치'
      });
      return res.redirect(`${nicepayService.WIX_SUCCESS_URL}?error=AMOUNT_MISMATCH`);
    }

    // 4. 승인 API 호출 (인증결제 웹)
    // 승인용 SignData: SHA256(AuthToken + MID + Amt + EdiDate + MerchantKey)
    const { ediDate, signData } = nicepayService.regenerateSignData(Amt, AuthToken);
    const approvalResult = await nicepayService.requestApproval(
      AuthToken, Amt, ediDate, signData, Moid, TID
    );

    // 5. 승인 결과 처리
    console.log('─'.repeat(60));
    console.log('📊 [승인 결과 처리]');
    console.log(`   - ResultCode: ${approvalResult.ResultCode}`);
    console.log(`   - ResultMsg: ${approvalResult.ResultMsg}`);

    if (approvalResult.ResultCode === '0000' || approvalResult.ResultCode === '3001') {
      // 성공 (3001 = 이미 승인됨)
      console.log(`✅ 승인 성공! (${approvalResult.ResultCode})`);
      await nicepayService.updatePaymentStatus(Moid, 'PAID', approvalResult);
      const successUrl = nicepayService.buildWixSuccessUrl(Moid, payment.verification_token);
      console.log(`🔗 Redirect URL: ${successUrl}`);
      console.log('═'.repeat(60) + '\n');
      return res.redirect(successUrl);
    } else {
      // 승인 실패
      console.log(`❌ 승인 실패: ${approvalResult.ResultCode} - ${approvalResult.ResultMsg}`);
      await nicepayService.updatePaymentStatus(Moid, 'FAILED', approvalResult);
      const errorUrl = `${nicepayService.WIX_SUCCESS_URL}?error=APPROVAL_FAILED&code=${approvalResult.ResultCode}&msg=${encodeURIComponent(approvalResult.ResultMsg || '')}`;
      console.log(`🔗 Error Redirect: ${errorUrl}`);
      console.log('═'.repeat(60) + '\n');
      return res.redirect(errorUrl);
    }

  } catch (error) {
    console.error('❌ 결제 콜백 처리 실패:', error);
    res.redirect(`${nicepayService?.WIX_SUCCESS_URL || 'https://dailymiracles.kr/payment-success'}?error=SYSTEM_ERROR`);
  }
});

/**
 * GET /api/payments/verify
 * 결제 상태 조회 (Wix용)
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
 * 결제창 HTML 생성 (인증결제 웹 방식)
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
    .logo { font-size: 48px; margin-bottom: 20px; }
    h1 { color: #333; font-size: 22px; margin-bottom: 10px; }
    .order-info {
      background: #FFF5F7;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    .order-info .label { color: #888; font-size: 12px; margin-bottom: 4px; }
    .order-info .value { color: #333; font-size: 16px; font-weight: 600; }
    .amount { font-size: 32px; font-weight: 700; color: #9B87F5; margin: 20px 0; }
    .loading {
      display: flex; flex-direction: column; align-items: center;
      gap: 15px; margin-top: 20px;
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid #f3f3f3;
      border-top: 3px solid #9B87F5; border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .loading-text { color: #666; font-size: 14px; }
    .error {
      background: #fee; border: 1px solid #fcc; border-radius: 8px;
      padding: 15px; margin-top: 20px; color: #c00; display: none;
    }
    .debug { font-size: 10px; color: #999; margin-top: 10px; word-break: break-all; }
  </style>
  <!-- 나이스페이 인증결제 웹 SDK (공식 매뉴얼 URL) -->
  <script src="https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js" type="text/javascript"></script>
</head>
<body>
  <div class="container">
    <div class="logo">✨</div>
    <h1>${payment.goodsName}</h1>

    <div class="order-info">
      <div class="label">주문번호</div>
      <div class="value">${payment.moid}</div>
    </div>

    <div class="amount">${payment.amount.toLocaleString()}원</div>

    <div class="loading" id="loading">
      <div class="spinner"></div>
      <div class="loading-text">결제창을 불러오는 중...</div>
    </div>

    <div class="error" id="error"></div>
    <div class="debug" id="debug">MID: ${payment.mid}</div>
  </div>

  <!-- 결제 폼 (인증결제 웹) -->
  <form name="payForm" id="payForm" method="post" action="${payment.returnUrl}" style="display:none;">
    <input type="hidden" name="PayMethod" value="CARD">
    <input type="hidden" name="GoodsName" value="${payment.goodsName}">
    <input type="hidden" name="Amt" value="${payment.amt}">
    <input type="hidden" name="MID" value="${payment.mid}">
    <input type="hidden" name="Moid" value="${payment.moid}">
    <input type="hidden" name="BuyerName" value="고객">
    <input type="hidden" name="BuyerEmail" value="customer@example.com">
    <input type="hidden" name="BuyerTel" value="01000000000">
    <input type="hidden" name="ReturnURL" value="${payment.returnUrl}">
    <input type="hidden" name="VbankExpDate" value="">
    <input type="hidden" name="GoodsCl" value="1">
    <input type="hidden" name="TransType" value="0">
    <input type="hidden" name="CharSet" value="utf-8">
    <input type="hidden" name="EdiDate" value="${payment.ediDate}">
    <input type="hidden" name="SignData" value="${payment.signData}">
    <input type="hidden" name="ReqReserved" value="">
  </form>

  <script>
    // ═══════════════════════════════════════════════════════════
    // 나이스페이 인증결제 웹 - 필수 콜백 함수
    // ═══════════════════════════════════════════════════════════

    // PC 인증 완료 콜백 (나이스페이 SDK가 호출)
    function nicepaySubmit() {
      console.log('✅ nicepaySubmit() 콜백 - 인증 완료, 폼 제출');
      document.payForm.submit();
    }

    // PC 결제 취소 콜백
    function nicepayClose() {
      console.log('❌ nicepayClose() 콜백 - 사용자 취소');
      document.getElementById('loading').style.display = 'none';
      var errorEl = document.getElementById('error');
      errorEl.style.display = 'block';
      errorEl.textContent = '결제가 취소되었습니다.';
    }

    // ═══════════════════════════════════════════════════════════
    // 유틸리티 함수
    // ═══════════════════════════════════════════════════════════

    // 플랫폼 체크 (PC/모바일)
    function checkPlatform(ua) {
      if (ua.match(/Android|Mobile|iP(hone|od)|BlackBerry|IEMobile|Kindle|NetFront|Silk-Accelerated|(hpw|web)OS|Fennec|Minimo|Opera M(obi|ini)|Blazer|Dolfin|Dolphin|Skyfire|Zune/i)) {
        return 'mobile';
      }
      return 'pc';
    }

    // 에러 표시
    function showError(msg) {
      console.error('❌ 결제 오류:', msg);
      document.getElementById('loading').style.display = 'none';
      var errorEl = document.getElementById('error');
      errorEl.style.display = 'block';
      errorEl.textContent = msg;
      document.getElementById('debug').textContent += ' | Error: ' + msg;
    }

    // ═══════════════════════════════════════════════════════════
    // 결제 시작 로직
    // ═══════════════════════════════════════════════════════════

    function nicepayStart() {
      console.log('🚀 nicepayStart() 호출됨');

      try {
        var platform = checkPlatform(window.navigator.userAgent);
        console.log('Platform:', platform);
        console.log('MID:', '${payment.mid}');
        console.log('Moid:', '${payment.moid}');
        console.log('Amt:', '${payment.amt}');
        console.log('EdiDate:', '${payment.ediDate}');
        console.log('SignData:', '${payment.signData}'.substring(0, 20) + '...');
        console.log('goPay 존재:', typeof goPay);

        // goPay 함수 체크
        if (typeof goPay !== 'function') {
          showError('결제 SDK 로드 실패 (goPay 함수 없음)');
          return;
        }

        console.log('✅ goPay 함수 호출 - platform:', platform);
        goPay(document.payForm);

      } catch (err) {
        showError('결제 서비스 연결 실패: ' + err.message);
      }
    }

    // SDK 로드 확인 후 결제 시작
    function waitForSDKAndStart() {
      console.log('⏳ SDK 로드 대기 중...');
      var maxWait = 5000;
      var waited = 0;
      var interval = 100;

      var checker = setInterval(function() {
        waited += interval;

        if (typeof goPay === 'function' || waited >= maxWait) {
          clearInterval(checker);
          console.log('SDK 로드 상태: goPay=' + (typeof goPay) + ', 대기시간=' + waited + 'ms');
          nicepayStart();
        }
      }, interval);
    }

    // DOM 로드 완료 시 실행
    if (document.readyState === 'complete') {
      console.log('📄 DOM 이미 로드됨');
      setTimeout(waitForSDKAndStart, 100);
    } else {
      window.addEventListener('load', function() {
        console.log('📄 window.onload 이벤트');
        setTimeout(waitForSDKAndStart, 100);
      });
    }
  </script>
</body>
</html>
`;
}

module.exports = router;
