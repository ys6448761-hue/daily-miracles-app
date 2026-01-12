/**
 * ═══════════════════════════════════════════════════════════
 * P0 30일 프로그램 결제 라우터
 * Spec ID: P0-PAYMENT-30DAY-ENTITLEMENT
 * ═══════════════════════════════════════════════════════════
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();

// ───────────────────────────────────────────────────────────
// 1) 상품 정본 상수 (서버 단일 소스)
// ───────────────────────────────────────────────────────────
const PRODUCTS = {
  PRG_STARTER_7: {
    sku: 'PRG_STARTER_7',
    name: '소원 스타터 7',
    description: '7일 소원실현 스타터 프로그램',
    price: 9900,
    duration: 7,
    entitlementKey: 'starter_7',
    isEntry: true  // 엔트리 상품 표시
  },
  PRG_WISH_30: {
    sku: 'PRG_WISH_30',
    name: '소원실현 30',
    description: '30일 소원실현 프로그램',
    price: 29900,
    duration: 30,
    entitlementKey: 'wish_30'
  },
  PRG_SOLVE_30: {
    sku: 'PRG_SOLVE_30',
    name: '문제해결 30',
    description: '30일 문제해결 프로그램',
    price: 29900,
    duration: 30,
    entitlementKey: 'solve_30'
  },
  PRG_DUAL_30: {
    sku: 'PRG_DUAL_30',
    name: '듀얼 30 (소원+해결)',
    description: '30일 소원실현 + 문제해결 통합 프로그램',
    price: 49900,
    duration: 30,
    entitlementKey: 'dual_30'
  }
};

// 업그레이드 크레딧 상수
const UPGRADE_CREDIT = {
  fromSku: 'PRG_STARTER_7',
  amount: 9900,
  validHours: 24,
  toSkus: ['PRG_WISH_30', 'PRG_SOLVE_30', 'PRG_DUAL_30']
};

// DB 모듈
let db = null;
try {
  db = require('../database/db');
  console.log('✅ [Program] DB 연결 성공');
} catch (error) {
  console.error('❌ [Program] DB 연결 실패:', error.message);
}

// Toss 결제 서비스 (기존 모듈 재사용)
let tossService = null;
try {
  tossService = require('../services/tossPaymentsService');
  console.log('✅ [Program] Toss 결제 서비스 로드 성공');
} catch (error) {
  console.warn('⚠️ [Program] Toss 결제 서비스 로드 실패:', error.message);
}

// ───────────────────────────────────────────────────────────
// Helper: 주문 ID 생성 (PAY-YYYYMMDD-XXXX)
// ───────────────────────────────────────────────────────────
function generateOrderId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PAY-${dateStr}-${random}`;
}

// ───────────────────────────────────────────────────────────
// Helper: Guest Access Token 생성 (64 hex)
// ───────────────────────────────────────────────────────────
function generateGuestToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ───────────────────────────────────────────────────────────
// Helper: 24시간 내 스타터 구매 이력으로 업그레이드 크레딧 확인
// ───────────────────────────────────────────────────────────
async function checkUpgradeCredit(trialToken, customerEmail, req) {
  if (!db) return { hasCredit: false };

  try {
    // JWT에서 user_id 추출
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';
        const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
        userId = decoded.userId || null;
      } catch (e) {
        // JWT 검증 실패
      }
    }

    // 24시간 내 starter_7 구매 이력 조회
    // 조건: (user_id 일치) OR (trial_token 일치) OR (email 일치)
    const query = `
      SELECT order_id, paid_at, guest_access_token, trial_token
      FROM program_orders
      WHERE sku = $1
        AND status = 'PAID'
        AND paid_at > CURRENT_TIMESTAMP - INTERVAL '${UPGRADE_CREDIT.validHours} hours'
        AND (
          (user_id IS NOT NULL AND user_id = $2::uuid)
          OR (trial_token IS NOT NULL AND trial_token = $3::text)
          OR (customer_email = $4::text)
        )
      ORDER BY paid_at DESC
      LIMIT 1
    `;

    const result = await db.query(query, [
      UPGRADE_CREDIT.fromSku,
      userId || '00000000-0000-0000-0000-000000000000',  // dummy UUID for null
      trialToken || '',
      customerEmail || ''
    ]);

    if (result.rows.length > 0) {
      const starterOrder = result.rows[0];
      console.log(`✅ [Credit] 스타터 구매 이력 발견: ${starterOrder.order_id}, 결제: ${starterOrder.paid_at}`);
      return {
        hasCredit: true,
        starterOrderId: starterOrder.order_id,
        paidAt: starterOrder.paid_at
      };
    }

    return { hasCredit: false };

  } catch (error) {
    console.error('⚠️ [Credit] 크레딧 조회 오류:', error.message);
    return { hasCredit: false };
  }
}

// ───────────────────────────────────────────────────────────
// GET /api/program/products - 상품 목록 조회
// ───────────────────────────────────────────────────────────
router.get('/products', (req, res) => {
  const products = Object.values(PRODUCTS).map(p => ({
    sku: p.sku,
    name: p.name,
    description: p.description,
    price: p.price,
    priceFormatted: p.price.toLocaleString() + '원',
    duration: p.duration
  }));

  res.json({
    success: true,
    products
  });
});

// ───────────────────────────────────────────────────────────
// POST /api/program/checkout - 결제 생성
// ───────────────────────────────────────────────────────────
router.post('/checkout', async (req, res) => {
  try {
    const { sku, customer_email, customer_phone, trial_token } = req.body;

    // 1) 필수 입력 검증
    if (!sku) {
      return res.status(400).json({
        success: false,
        error: 'missing_sku',
        message: '상품 SKU가 필요합니다'
      });
    }

    if (!customer_email) {
      return res.status(400).json({
        success: false,
        error: 'missing_email',
        message: '이메일은 필수입니다'
      });
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer_email)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_email',
        message: '올바른 이메일 형식이 아닙니다'
      });
    }

    // 2) 상품 검증 (서버 상수에서 가격 결정)
    const product = PRODUCTS[sku];
    if (!product) {
      return res.status(400).json({
        success: false,
        error: 'invalid_sku',
        message: '유효하지 않은 상품입니다'
      });
    }

    // 3) DB 필수 확인
    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'db_unavailable',
        message: '결제 서비스를 사용할 수 없습니다'
      });
    }

    // 4) 주문 ID 생성
    const orderId = generateOrderId();
    const orderName = `${product.name} - ${orderId}`;
    let amount = product.price;
    let appliedCredit = 0;

    // 4.5) 24시간 업그레이드 크레딧 계산
    if (UPGRADE_CREDIT.toSkus.includes(sku)) {
      // 업그레이드 대상 상품인 경우, starter_7 구매 이력 확인
      const creditResult = await checkUpgradeCredit(trial_token, customer_email, req);
      if (creditResult.hasCredit) {
        appliedCredit = UPGRADE_CREDIT.amount;
        amount = Math.max(0, product.price - appliedCredit);
        console.log(`✅ [Program] 업그레이드 크레딧 적용: ${appliedCredit}원 할인, 최종 ${amount}원`);
      }
    }

    // 5) JWT에서 user_id 추출 (있으면)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'daily-miracles-secret-key-change-in-production';
        const decoded = jwt.verify(authHeader.substring(7), JWT_SECRET);
        userId = decoded.userId || null;
      } catch (e) {
        // JWT 검증 실패 - 비회원으로 처리
      }
    }

    // 6) program_orders에 CREATED 저장
    await db.query(
      `INSERT INTO program_orders
       (order_id, sku, amount, order_name, customer_email, customer_phone, user_id, trial_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'CREATED')`,
      [orderId, sku, amount, orderName, customer_email, customer_phone || null, userId, trial_token || null]
    );

    console.log(`✅ [Program] 주문 생성: ${orderId}, SKU: ${sku}, 금액: ${amount}`);

    // 7) Toss 결제 정보 생성
    let paymentInfo = null;
    if (tossService && tossService.createPayment) {
      try {
        paymentInfo = await tossService.createPayment({
          orderId,
          orderName,
          amount,
          customerEmail: customer_email,
          customerName: customer_email.split('@')[0]
        });
      } catch (pgError) {
        console.error('⚠️ [Program] PG 결제 생성 실패:', pgError.message);
      }
    }

    // 8) 응답
    const response = {
      success: true,
      order: {
        orderId,
        orderName,
        sku,
        amount,
        amountFormatted: amount.toLocaleString() + '원',
        originalPrice: product.price,
        originalPriceFormatted: product.price.toLocaleString() + '원'
      },
      payment: paymentInfo || {
        // 테스트용 결제 정보 (Toss 미연동 시)
        clientKey: process.env.TOSS_CLIENT_KEY || 'test_ck_xxx',
        successUrl: `${process.env.APP_BASE_URL || 'https://daily-miracles-app.onrender.com'}/api/program/payment/success`,
        failUrl: `${process.env.APP_BASE_URL || 'https://daily-miracles-app.onrender.com'}/api/program/payment/fail`
      }
    };

    // 크레딧 적용 시 정보 추가
    if (appliedCredit > 0) {
      response.credit = {
        applied: true,
        amount: appliedCredit,
        amountFormatted: appliedCredit.toLocaleString() + '원',
        reason: '스타터 7 → 30일 업그레이드 크레딧'
      };
    }

    res.json(response);

  } catch (error) {
    console.error('💥 [Program] Checkout 오류:', error);
    res.status(500).json({
      success: false,
      error: 'checkout_failed',
      message: '결제 생성 중 오류가 발생했습니다'
    });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/program/payment/success - 결제 성공 처리
// ───────────────────────────────────────────────────────────
router.get('/payment/success', async (req, res) => {
  try {
    const { orderId, paymentKey, amount } = req.query;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: 'missing_order_id',
        message: '주문 ID가 필요합니다'
      });
    }

    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'db_unavailable',
        message: '결제 처리를 할 수 없습니다'
      });
    }

    // 1) 주문 조회
    const orderResult = await db.query(
      `SELECT * FROM program_orders WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'order_not_found',
        message: '주문을 찾을 수 없습니다'
      });
    }

    const order = orderResult.rows[0];

    // 2) 이미 처리된 주문인지 확인
    if (order.status === 'PAID') {
      return res.redirect('/program/success?orderId=' + orderId);
    }

    // 3) 금액 검증
    if (amount && parseInt(amount) !== order.amount) {
      console.error(`❌ [Program] 금액 불일치: order=${order.amount}, pg=${amount}`);
      return res.status(400).json({
        success: false,
        error: 'amount_mismatch',
        message: '결제 금액이 일치하지 않습니다'
      });
    }

    // 4) PG 결제 검증 (Toss)
    if (tossService && tossService.confirmPayment && paymentKey) {
      try {
        await tossService.confirmPayment({
          orderId,
          paymentKey,
          amount: order.amount
        });
      } catch (pgError) {
        console.error('❌ [Program] PG 검증 실패:', pgError.message);
        // 테스트 환경에서는 계속 진행
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({
            success: false,
            error: 'payment_verification_failed',
            message: '결제 검증에 실패했습니다'
          });
        }
      }
    }

    // 5) 주문 상태 업데이트 (PAID)
    await db.query(
      `UPDATE program_orders
       SET status = 'PAID',
           pg_payment_key = $1,
           paid_at = CURRENT_TIMESTAMP
       WHERE order_id = $2`,
      [paymentKey || 'manual', orderId]
    );

    // 6) Entitlement 발급
    const product = PRODUCTS[order.sku];
    const entitlementKey = product ? product.entitlementKey : order.sku.toLowerCase();
    const duration = product ? product.duration : 30;

    let subjectType, subjectId, guestToken = null;

    if (order.user_id) {
      // 회원
      subjectType = 'user';
      subjectId = order.user_id;
    } else if (order.trial_token) {
      // Trial 토큰 보유
      subjectType = 'trial';
      subjectId = order.trial_token;
    } else {
      // 비회원 - guest_access_token 생성
      subjectType = 'guest';
      guestToken = generateGuestToken();
      subjectId = guestToken;

      // 주문에 guest_access_token 저장
      await db.query(
        `UPDATE program_orders SET guest_access_token = $1 WHERE order_id = $2`,
        [guestToken, orderId]
      );
    }

    // Entitlement 저장
    await db.query(
      `INSERT INTO entitlements
       (subject_type, subject_id, entitlement_key, start_at, end_at, source_order_id)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '${duration} days', $4)
       ON CONFLICT (source_order_id, entitlement_key) DO NOTHING`,
      [subjectType, subjectId, entitlementKey, orderId]
    );

    console.log(`✅ [Program] 결제 완료 & 권한 발급: ${orderId}, ${subjectType}:${subjectId}, ${entitlementKey}`);

    // 7) 리다이렉트 또는 JSON 응답
    const redirectUrl = `/program/success.html?orderId=${orderId}${guestToken ? '&token=' + guestToken : ''}`;

    // Accept 헤더에 따라 응답 형식 결정
    if (req.accepts('html')) {
      res.redirect(redirectUrl);
    } else {
      res.json({
        success: true,
        message: '결제가 완료되었습니다',
        order: {
          orderId,
          status: 'PAID'
        },
        entitlement: {
          key: entitlementKey,
          subjectType,
          duration
        },
        accessToken: guestToken || order.trial_token || null
      });
    }

  } catch (error) {
    console.error('💥 [Program] 결제 성공 처리 오류:', error);
    res.status(500).json({
      success: false,
      error: 'payment_success_failed',
      message: '결제 완료 처리 중 오류가 발생했습니다'
    });
  }
});

// ───────────────────────────────────────────────────────────
// POST /api/program/payment/success - 결제 성공 (POST 방식)
// ───────────────────────────────────────────────────────────
router.post('/payment/success', async (req, res) => {
  // GET과 동일한 로직 사용 (req.query 대신 req.body 사용)
  req.query = { ...req.query, ...req.body };
  return router.handle(req, res);
});

// ───────────────────────────────────────────────────────────
// GET /api/program/payment/fail - 결제 실패 처리
// ───────────────────────────────────────────────────────────
router.get('/payment/fail', async (req, res) => {
  const { orderId, code, message } = req.query;

  console.log(`❌ [Program] 결제 실패: ${orderId}, code=${code}, message=${message}`);

  if (db && orderId) {
    try {
      await db.query(
        `UPDATE program_orders SET status = 'FAILED' WHERE order_id = $1 AND status = 'CREATED'`,
        [orderId]
      );
    } catch (e) {
      console.error('⚠️ [Program] 실패 상태 업데이트 오류:', e.message);
    }
  }

  if (req.accepts('html')) {
    res.redirect(`/program/fail.html?orderId=${orderId || ''}&message=${encodeURIComponent(message || '결제가 실패했습니다')}`);
  } else {
    res.json({
      success: false,
      error: code || 'payment_failed',
      message: message || '결제가 실패했습니다',
      orderId
    });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/program/order/:orderId - 주문 상태 조회
// ───────────────────────────────────────────────────────────
router.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!db) {
      return res.status(500).json({
        success: false,
        error: 'db_unavailable'
      });
    }

    const result = await db.query(
      `SELECT order_id, sku, amount, order_name, status, created_at, paid_at
       FROM program_orders WHERE order_id = $1`,
      [orderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'order_not_found',
        message: '주문을 찾을 수 없습니다'
      });
    }

    res.json({
      success: true,
      order: result.rows[0]
    });

  } catch (error) {
    console.error('💥 [Program] 주문 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: 'query_failed'
    });
  }
});

// ───────────────────────────────────────────────────────────
// GET /api/program/entitlement/check - 권한 확인 (테스트용)
// ───────────────────────────────────────────────────────────
router.get('/entitlement/check', async (req, res) => {
  try {
    const { token, type } = req.query;

    if (!token || !db) {
      return res.status(400).json({
        success: false,
        hasEntitlement: false
      });
    }

    const subjectType = type || 'guest';
    const result = await db.query(
      `SELECT * FROM entitlements
       WHERE subject_id = $1 AND subject_type = $2 AND is_active = true AND end_at > CURRENT_TIMESTAMP`,
      [token, subjectType]
    );

    res.json({
      success: true,
      hasEntitlement: result.rows.length > 0,
      entitlements: result.rows.map(e => ({
        key: e.entitlement_key,
        endAt: e.end_at
      }))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
module.exports.PRODUCTS = PRODUCTS;
