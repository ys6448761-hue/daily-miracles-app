/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Storybook E2E Commerce API Routes
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 핵심 원칙:
 *   1️⃣ 유실 0: 결제된 주문은 반드시 완료/실패/환불로 종결
 *   2️⃣ 중복 0: idempotency 키로 중복 방지
 *   3️⃣ 관측 가능: 전체 흐름 추적 가능
 *   4️⃣ 비용 상한: 티어별 예산 초과 시 차단
 *
 * 엔드포인트:
 *   POST /api/storybook/webhook/payment   - 결제 웹훅 수신
 *   GET  /api/storybook/orders/:orderId   - 주문 상태 조회
 *   GET  /api/storybook/orders/:orderId/assets - 산출물 조회
 *   POST /api/storybook/orders/:orderId/revision - 수정 요청
 *   GET  /api/storybook/orders/:orderId/revisions - 수정 이력 조회
 *   POST /api/storybook/orders/:orderId/download - 다운로드 추적 (Phase 2-2)
 *   GET  /api/storybook/revisions/:revisionId - 수정 상태 조회 (Phase 2-3)
 *   GET  /api/storybook/health            - 헬스체크
 *
 * 작성일: 2026-01-03
 * 설계: 루미 / 코미
 * 승인: 푸르미르 CEO
 * ═══════════════════════════════════════════════════════════════════════════
 */

const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { logEvent: logMarketingEvent, EVENT_TYPES } = require('../services/eventLogger');

// DB 모듈 (선택적 로딩)
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.warn('⚠️ Storybook: DB 모듈 로드 실패 - 메모리 모드로 동작');
}

// Job 큐 서비스 (선택적 로딩)
let storybookQueue = null;
try {
  storybookQueue = require('../services/storybookQueue');
} catch (error) {
  console.warn('⚠️ Storybook: Queue 서비스 로드 실패');
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

const TIERS = {
  STARTER: { price: 24900, name: '스타터' },
  PLUS: { price: 49900, name: '플러스' },
  PREMIUM: { price: 99000, name: '프리미엄' }
};

const ORDER_STATUS = {
  CREATED: 'CREATED',
  PAID: 'PAID',
  QUEUED: 'QUEUED',
  GENERATING: 'GENERATING',
  GATED: 'GATED',
  STORING: 'STORING',
  DELIVERING: 'DELIVERING',
  DONE: 'DONE',
  // 실패 상태
  FAIL_PAYMENT_VERIFY: 'FAIL_PAYMENT_VERIFY',
  FAIL_GENERATION: 'FAIL_GENERATION',
  FAIL_GATE: 'FAIL_GATE',
  FAIL_STORAGE: 'FAIL_STORAGE',
  FAIL_DELIVERY: 'FAIL_DELIVERY',
  FAIL_BUDGET: 'FAIL_BUDGET',
  SECURITY_FAIL: 'SECURITY_FAIL'
};

// 인메모리 저장소 (DB 없을 때 폴백)
const memoryStore = {
  orders: new Map(),
  jobs: new Map(),
  assets: new Map(),
  deliveries: new Map(),
  checkouts: new Map(),  // 체크아웃 세션 추적
  events: []
};

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 주문 ID 생성 (이미 있으면 그대로 사용)
 */
function generateOrderId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * 해시 생성 (중복 방지용)
 */
function generateHash(data) {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex').substring(0, 16);
}

/**
 * 웹훅 서명 검증
 */
function verifyWebhookSignature(payload, signature, secret) {
  if (!secret) {
    console.warn('⚠️ WEBHOOK_SECRET 미설정 - 서명 검증 건너뜀');
    return true; // 개발 환경에서는 허용
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature || '', 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  );
}

/**
 * 이벤트 기록
 */
async function logEvent(orderId, eventName, payload = {}) {
  const event = {
    order_id: orderId,
    event_name: eventName,
    payload,
    created_at: new Date().toISOString()
  };

  if (db) {
    try {
      await db.query(
        `INSERT INTO storybook_events (order_id, event_name, payload, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [orderId, eventName, JSON.stringify(payload)]
      );
    } catch (error) {
      console.error('이벤트 기록 실패:', error.message);
    }
  }

  memoryStore.events.push(event);
  console.log(`📊 Event: ${eventName}`, orderId ? `(${orderId})` : '');
}

/**
 * 주문 상태 업데이트
 */
async function updateOrderStatus(orderId, status, extra = {}) {
  if (db) {
    try {
      const setClauses = ['status = $2', 'updated_at = NOW()'];
      const values = [orderId, status];
      let paramIndex = 3;

      if (extra.fail_reason) {
        setClauses.push(`fail_reason = $${paramIndex++}`);
        values.push(extra.fail_reason);
      }
      if (extra.last_error) {
        setClauses.push(`last_error = $${paramIndex++}`);
        values.push(extra.last_error);
      }
      if (status === ORDER_STATUS.PAID && !extra.paid_at) {
        setClauses.push(`paid_at = NOW()`);
      }
      if (status === ORDER_STATUS.DONE) {
        setClauses.push(`delivered_at = NOW()`);
      }

      await db.query(
        `UPDATE storybook_orders SET ${setClauses.join(', ')} WHERE order_id = $1`,
        values
      );
    } catch (error) {
      console.error('주문 상태 업데이트 실패:', error.message);
    }
  }

  // 메모리 저장소 업데이트
  const order = memoryStore.orders.get(orderId);
  if (order) {
    order.status = status;
    order.updated_at = new Date().toISOString();
    Object.assign(order, extra);
  }

  await logEvent(orderId, `status_${status.toLowerCase()}`, extra);
}

// ═══════════════════════════════════════════════════════════════════════════
// 0. 체크아웃 세션 시작 (checkout_abandon 추적용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/storybook/checkout/initiate
 *
 * 체크아웃 시작을 기록합니다. 결제 완료되지 않으면 checkout_abandon으로 집계됩니다.
 *
 * Body:
 *   {
 *     "tier": "STARTER|PLUS|PREMIUM",
 *     "user_id": "USER-123",
 *     "wish_id": "WISH-456",
 *     "cart_value": 24900
 *   }
 */
router.post('/checkout/initiate', async (req, res) => {
  try {
    const { tier, user_id, wish_id, cart_value } = req.body;

    // 체크아웃 세션 ID 생성
    const checkoutId = `CHK-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

    const checkoutSession = {
      checkout_id: checkoutId,
      tier: tier || 'STARTER',
      user_id: user_id || null,
      wish_id: wish_id || null,
      cart_value: cart_value || TIERS[tier]?.price || 0,
      status: 'initiated',
      initiated_at: new Date().toISOString(),
      completed_at: null
    };

    // 메모리에 저장
    memoryStore.checkouts.set(checkoutId, checkoutSession);

    // 마케팅 이벤트 로깅: checkout_initiate
    logMarketingEvent(EVENT_TYPES.CHECKOUT_INITIATE, {
      checkout_id: checkoutId,
      user_id: checkoutSession.user_id,
      wish_id: checkoutSession.wish_id,
      tier: checkoutSession.tier,
      cart_value: checkoutSession.cart_value
    }, { source: 'storybookRoutes' }).catch(err => {
      console.error('[Event] checkout_initiate 로깅 실패:', err.message);
    });

    console.log(`🛒 체크아웃 시작: ${checkoutId} (${tier}, ${cart_value || TIERS[tier]?.price}원)`);

    res.json({
      success: true,
      checkout_id: checkoutId,
      message: '체크아웃 세션이 시작되었습니다'
    });

  } catch (error) {
    console.error('❌ 체크아웃 시작 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/storybook/checkout/abandon
 *
 * 체크아웃 이탈을 명시적으로 기록합니다 (페이지 이탈 시 호출).
 */
router.post('/checkout/abandon', async (req, res) => {
  try {
    const { checkout_id } = req.body;

    const session = memoryStore.checkouts.get(checkout_id);

    if (session && session.status === 'initiated') {
      session.status = 'abandoned';
      session.abandoned_at = new Date().toISOString();

      // 마케팅 이벤트 로깅
      logMarketingEvent(EVENT_TYPES.CHECKOUT_ABANDON, {
        checkout_id: session.checkout_id,
        user_id: session.user_id,
        wish_id: session.wish_id,
        tier: session.tier,
        cart_value: session.cart_value,
        time_to_abandon_ms: Date.now() - new Date(session.initiated_at).getTime()
      }, { source: 'storybookRoutes' }).catch(err => {
        console.error('[Event] checkout_abandon 로깅 실패:', err.message);
      });

      console.log(`🚪 체크아웃 이탈: ${checkout_id}`);

      res.json({
        success: true,
        message: '체크아웃 이탈이 기록되었습니다'
      });
    } else {
      res.json({
        success: false,
        message: '유효한 체크아웃 세션이 아닙니다'
      });
    }

  } catch (error) {
    console.error('❌ 체크아웃 이탈 기록 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. 결제 웹훅 수신
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/storybook/webhook/payment
 *
 * 결제 성공 웹훅을 수신하고 주문을 생성합니다.
 *
 * Headers:
 *   X-Signature: 서명 (필수 검증)
 *
 * Body:
 *   {
 *     "event": "payment.success",
 *     "payment_id": "PAY-123",
 *     "order_id": "ORD-ABC", // 선택 (없으면 자동 생성)
 *     "tier": "STARTER|PLUS|PREMIUM",
 *     "amount": 24900,
 *     "customer_email": "user@example.com",
 *     "customer_phone": "01012345678",
 *     "user_id": "USER-123",
 *     "wish_id": "WISH-456"
 *   }
 */
router.post('/webhook/payment', async (req, res) => {
  const startTime = Date.now();
  console.log('════════════════════════════════════════════════════════════');
  console.log('💳 결제 웹훅 수신');
  console.log('════════════════════════════════════════════════════════════');

  try {
    const {
      event,
      payment_id,
      order_id: providedOrderId,
      checkout_id,
      tier,
      amount,
      customer_email,
      customer_phone,
      user_id,
      wish_id
    } = req.body;

    const signature = req.headers['x-signature'];

    // 1. 서명 검증
    const webhookSecret = process.env.STORYBOOK_WEBHOOK_SECRET;
    if (webhookSecret && !verifyWebhookSignature(req.body, signature, webhookSecret)) {
      console.error('❌ 서명 검증 실패');
      await logEvent(null, 'pay_failed', { reason: 'SIGNATURE_INVALID' });
      return res.status(401).json({
        success: false,
        error: 'SIGNATURE_INVALID',
        message: '웹훅 서명 검증 실패'
      });
    }
    console.log('✅ 서명 검증 통과');

    // 2. 필수 필드 검증
    if (!payment_id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PAYMENT_ID',
        message: 'payment_id 필수'
      });
    }
    if (!tier || !TIERS[tier]) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_TIER',
        message: '유효한 tier 필수 (STARTER, PLUS, PREMIUM)'
      });
    }
    if (!customer_email) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_EMAIL',
        message: 'customer_email 필수'
      });
    }

    // 3. 중복 결제 확인 (idempotency)
    let existingOrder = null;

    if (db) {
      try {
        const result = await db.query(
          'SELECT * FROM storybook_orders WHERE payment_id = $1',
          [payment_id]
        );
        existingOrder = result.rows[0];
      } catch (error) {
        console.error('중복 확인 실패:', error.message);
      }
    } else {
      // 메모리에서 확인
      for (const [, order] of memoryStore.orders) {
        if (order.payment_id === payment_id) {
          existingOrder = order;
          break;
        }
      }
    }

    if (existingOrder) {
      console.log(`⚠️ 중복 웹훅 감지: payment_id=${payment_id}, order_id=${existingOrder.order_id}`);
      return res.status(200).json({
        success: true,
        duplicate: true,
        order_id: existingOrder.order_id,
        status: existingOrder.status,
        message: '이미 처리된 결제입니다 (중복 웹훅)'
      });
    }

    // 4. 주문 생성
    const orderId = providedOrderId || generateOrderId();
    const expectedAmount = TIERS[tier].price;

    // 금액 검증 (허용 오차 없음)
    if (amount && amount !== expectedAmount) {
      console.warn(`⚠️ 금액 불일치: 예상=${expectedAmount}, 실제=${amount}`);
    }

    const order = {
      order_id: orderId,
      payment_id,
      user_id: user_id || null,
      customer_email,
      customer_phone: customer_phone || null,
      wish_id: wish_id || null,
      tier,
      amount: amount || expectedAmount,
      status: ORDER_STATUS.PAID,
      credits_remaining: getInitialCredits(tier),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      paid_at: new Date().toISOString()
    };

    // DB 저장
    if (db) {
      try {
        await db.query(
          `INSERT INTO storybook_orders
           (order_id, payment_id, user_id, customer_email, customer_phone, wish_id,
            tier, amount, status, credits_remaining, created_at, updated_at, paid_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), NOW())`,
          [
            orderId, payment_id, order.user_id, customer_email, customer_phone, wish_id,
            tier, order.amount, ORDER_STATUS.PAID, JSON.stringify(order.credits_remaining)
          ]
        );
        console.log(`✅ DB 주문 저장 완료: ${orderId}`);
      } catch (error) {
        console.error('DB 저장 실패:', error.message);
        // 중복 키 오류인 경우
        if (error.code === '23505') {
          return res.status(200).json({
            success: true,
            duplicate: true,
            order_id: orderId,
            message: '이미 처리된 주문입니다'
          });
        }
        throw error;
      }
    }

    // 메모리 저장
    memoryStore.orders.set(orderId, order);

    // 5. 이벤트 기록
    await logEvent(orderId, 'pay_success', { tier, amount: order.amount, payment_id });

    // 5-1. 마케팅 이벤트 로깅: checkout_complete
    logMarketingEvent(EVENT_TYPES.CHECKOUT_COMPLETE, {
      checkout_id: checkout_id || null,  // 퍼널 연결 키 (필수)
      order_id: orderId,
      payment_id: payment_id,
      user_id: order.user_id,
      wish_id: wish_id,
      tier: tier,
      amount: order.amount,
      customer_email: customer_email ? customer_email.substring(0, 3) + '***' : null,
      customer_phone: customer_phone ? customer_phone.substring(0, 3) + '****' : null
    }, { source: 'storybookRoutes' }).catch(err => {
      console.error('[Event] checkout_complete 로깅 실패:', err.message);
    });

    // 6. Job 큐에 등록
    const jobId = await queueGenerationJob(orderId, tier);

    const duration = Date.now() - startTime;
    console.log(`✅ 결제 처리 완료 (${duration}ms): ${orderId}`);
    console.log('════════════════════════════════════════════════════════════');

    return res.status(201).json({
      success: true,
      order_id: orderId,
      payment_id,
      tier,
      status: ORDER_STATUS.QUEUED,
      job_id: jobId,
      message: '결제 확인 완료. 산출물 생성이 시작됩니다.',
      estimated_time: getEstimatedTime(tier)
    });

  } catch (error) {
    console.error('💥 결제 웹훅 처리 실패:', error);
    await logEvent(null, 'pay_failed', { error: error.message });

    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '결제 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * 티어별 초기 크레딧
 */
function getInitialCredits(tier) {
  switch (tier) {
    case 'PLUS':
      return { regen_images: 3, edit_text: 1, rewrite_doc: 0 };
    case 'PREMIUM':
      return { regen_images: 8, edit_text: 3, rewrite_doc: 1 };
    default:
      return {};
  }
}

/**
 * 티어별 예상 시간
 */
function getEstimatedTime(tier) {
  switch (tier) {
    case 'STARTER': return '3~5분';
    case 'PLUS': return '5~8분';
    case 'PREMIUM': return '8~12분';
    default: return '5분';
  }
}

/**
 * 생성 Job 큐에 등록
 */
async function queueGenerationJob(orderId, tier) {
  const jobType = `GENERATE_${tier}`;
  const jobId = `JOB-${Date.now().toString(36).toUpperCase()}`;

  const job = {
    job_id: jobId,
    order_id: orderId,
    job_type: jobType,
    status: 'QUEUED',
    attempt: 0,
    max_attempts: 2,
    created_at: new Date().toISOString()
  };

  // DB 저장
  if (db) {
    try {
      await db.query(
        `INSERT INTO storybook_jobs (order_id, job_type, status, attempt, created_at)
         VALUES ($1, $2, 'QUEUED', 0, NOW())`,
        [orderId, jobType]
      );
    } catch (error) {
      console.error('Job 저장 실패:', error.message);
    }
  }

  // 메모리 저장
  memoryStore.jobs.set(jobId, job);

  // 주문 상태 업데이트
  await updateOrderStatus(orderId, ORDER_STATUS.QUEUED);

  // 이벤트 기록
  await logEvent(orderId, 'job_queued', { job_id: jobId, job_type: jobType });

  // 실제 큐 워커에 등록 (있으면)
  if (storybookQueue && storybookQueue.enqueue) {
    storybookQueue.enqueue(job);
  }

  return jobId;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. 주문 상태 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/storybook/orders/:orderId
 *
 * 주문 상태와 타임라인을 조회합니다.
 */
router.get('/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;

  try {
    let order = null;
    let timeline = [];

    if (db) {
      // DB에서 조회
      const orderResult = await db.query(
        'SELECT * FROM storybook_orders WHERE order_id = $1',
        [orderId]
      );
      order = orderResult.rows[0];

      if (order) {
        // 이벤트에서 타임라인 구성
        const eventsResult = await db.query(
          `SELECT event_name, created_at, payload
           FROM storybook_events
           WHERE order_id = $1
           ORDER BY created_at ASC`,
          [orderId]
        );
        timeline = eventsResult.rows.map(e => ({
          event: e.event_name,
          at: e.created_at,
          data: e.payload
        }));
      }
    } else {
      // 메모리에서 조회
      order = memoryStore.orders.get(orderId);
      if (order) {
        timeline = memoryStore.events
          .filter(e => e.order_id === orderId)
          .map(e => ({ event: e.event_name, at: e.created_at, data: e.payload }));
      }
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 산출물 조회
    let assets = [];
    if (db) {
      const assetsResult = await db.query(
        'SELECT asset_type, file_url, expires_at FROM storybook_assets WHERE order_id = $1',
        [orderId]
      );
      assets = assetsResult.rows;
    } else {
      assets = Array.from(memoryStore.assets.values())
        .filter(a => a.order_id === orderId);
    }

    return res.json({
      success: true,
      order: {
        order_id: order.order_id,
        tier: order.tier,
        status: order.status,
        amount: order.amount,
        customer_email: maskEmail(order.customer_email),
        credits_remaining: order.credits_remaining,
        created_at: order.created_at,
        paid_at: order.paid_at,
        delivered_at: order.delivered_at
      },
      assets: assets.map(a => ({
        type: a.asset_type,
        url: a.file_url,
        expires_at: a.expires_at
      })),
      timeline
    });

  } catch (error) {
    console.error('주문 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '주문 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * 이메일 마스킹
 */
function maskEmail(email) {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.substring(0, 2)}***@${domain}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. 산출물 조회
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/storybook/orders/:orderId/assets
 *
 * 주문의 산출물 목록을 조회합니다.
 */
router.get('/orders/:orderId/assets', async (req, res) => {
  const { orderId } = req.params;

  try {
    let assets = [];

    if (db) {
      const result = await db.query(
        `SELECT asset_type, file_url, file_name, file_size_bytes, expires_at, created_at
         FROM storybook_assets
         WHERE order_id = $1
         ORDER BY created_at ASC`,
        [orderId]
      );
      assets = result.rows;
    } else {
      assets = Array.from(memoryStore.assets.values())
        .filter(a => a.order_id === orderId);
    }

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'NO_ASSETS',
        message: '아직 생성된 산출물이 없습니다'
      });
    }

    // 이벤트 기록 (다운로드 클릭)
    await logEvent(orderId, 'assets_viewed', { count: assets.length });

    // 마케팅 이벤트: story_viewed (가치 이벤트)
    logMarketingEvent(EVENT_TYPES.STORY_VIEWED, {
      story_id: orderId,
      view_context: 'my',
      assets_count: assets.length
    }, { source: 'storybookRoutes' }).catch(err => {
      console.error('[Event] story_viewed 로깅 실패:', err.message);
    });

    return res.json({
      success: true,
      order_id: orderId,
      assets: assets.map(a => ({
        type: a.asset_type,
        name: a.file_name,
        url: a.file_url,
        size: a.file_size_bytes,
        expires_at: a.expires_at
      }))
    });

  } catch (error) {
    console.error('산출물 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '산출물 조회 중 오류가 발생했습니다'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3.5 다운로드 클릭 추적 (Phase 2-2)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/storybook/orders/:orderId/download
 *
 * 다운로드 클릭을 추적합니다 (Activation KPI).
 *
 * Body:
 *   {
 *     "asset_type": "STORYBOOK_PDF"
 *   }
 */
router.post('/orders/:orderId/download', async (req, res) => {
  const { orderId } = req.params;
  const { asset_type } = req.body;

  try {
    // 이벤트 기록
    await logEvent(orderId, 'download_clicked', {
      asset_type,
      timestamp: new Date().toISOString()
    });

    // DB에 다운로드 기록 (선택적)
    if (db) {
      try {
        await db.query(
          `INSERT INTO storybook_events (order_id, event_name, payload, created_at)
           VALUES ($1, 'download_clicked', $2, NOW())`,
          [orderId, JSON.stringify({ asset_type })]
        );
      } catch (e) {
        // 중복 허용 (같은 파일 여러 번 다운로드 가능)
      }
    }

    return res.json({
      success: true,
      order_id: orderId,
      asset_type,
      tracked: true
    });

  } catch (error) {
    console.error('다운로드 추적 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 3.6 공유 기능 (Phase 2-3: 가치 이벤트)
// ═══════════════════════════════════════════════════════════════════════════

// 메모리 공유 토큰 저장소
const shareTokens = new Map();

/**
 * 공유 토큰 생성
 */
function generateShareToken() {
  return crypto.randomBytes(8).toString('base64url');
}

/**
 * POST /api/storybook/orders/:orderId/share
 *
 * 공유 링크를 생성합니다.
 *
 * Body:
 *   {
 *     "user_id": "optional"
 *   }
 *
 * Response:
 *   {
 *     "success": true,
 *     "share_token": "abc123",
 *     "share_url": "/s/abc123",
 *     "expires_at": "2026-01-11T..."
 *   }
 */
router.post('/orders/:orderId/share', async (req, res) => {
  const { orderId } = req.params;
  const { user_id } = req.body;

  try {
    // 주문 확인
    let order = null;
    if (db) {
      const result = await db.query(
        'SELECT order_id, user_id, tier, status FROM storybook_orders WHERE order_id = $1',
        [orderId]
      );
      order = result.rows[0];
    } else {
      order = memoryStore.orders.get(orderId);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 공유 토큰 생성
    const shareToken = generateShareToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 유효

    const shareData = {
      token: shareToken,
      order_id: orderId,
      user_id: user_id || order.user_id,
      created_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString(),
      view_count: 0
    };

    // 메모리 저장
    shareTokens.set(shareToken, shareData);

    // DB 저장 (storybook_shares 테이블이 있으면)
    if (db) {
      try {
        await db.query(
          `INSERT INTO storybook_shares (share_token, order_id, user_id, expires_at, created_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (share_token) DO NOTHING`,
          [shareToken, orderId, shareData.user_id, expiresAt]
        );
      } catch (e) {
        // 테이블이 없을 수 있음 - 무시
      }
    }

    // 이벤트 기록
    await logEvent(orderId, 'share_created', { share_token: shareToken });

    // 마케팅 이벤트: share_created (가치 이벤트)
    logMarketingEvent(EVENT_TYPES.SHARE_CREATED, {
      user_id: shareData.user_id,
      story_id: orderId,
      share_token: shareToken,
      expires_at: expiresAt.toISOString()
    }, { source: 'storybookRoutes' }).catch(err => {
      console.error('[Event] share_created 로깅 실패:', err.message);
    });

    return res.json({
      success: true,
      share_token: shareToken,
      share_url: `/s/${shareToken}`,
      expires_at: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('공유 링크 생성 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '공유 링크 생성 중 오류가 발생했습니다'
    });
  }
});

/**
 * GET /api/storybook/share/:token
 *
 * 공유된 스토리를 조회합니다.
 */
router.get('/share/:token', async (req, res) => {
  const { token } = req.params;
  const referrer = req.get('Referer') || null;

  try {
    // 토큰 조회
    let shareData = shareTokens.get(token);

    // DB 조회
    if (!shareData && db) {
      try {
        const result = await db.query(
          `SELECT share_token, order_id, user_id, expires_at, view_count, created_at
           FROM storybook_shares
           WHERE share_token = $1`,
          [token]
        );
        if (result.rows[0]) {
          shareData = {
            token: result.rows[0].share_token,
            order_id: result.rows[0].order_id,
            user_id: result.rows[0].user_id,
            expires_at: result.rows[0].expires_at,
            view_count: result.rows[0].view_count || 0,
            created_at: result.rows[0].created_at
          };
        }
      } catch (e) {
        // 테이블이 없을 수 있음
      }
    }

    if (!shareData) {
      return res.status(404).json({
        success: false,
        error: 'SHARE_NOT_FOUND',
        message: '공유 링크를 찾을 수 없습니다'
      });
    }

    // 만료 확인
    if (new Date(shareData.expires_at) < new Date()) {
      return res.status(410).json({
        success: false,
        error: 'SHARE_EXPIRED',
        message: '공유 링크가 만료되었습니다'
      });
    }

    // 산출물 조회
    let assets = [];
    if (db) {
      const result = await db.query(
        `SELECT asset_type, file_url, file_name FROM storybook_assets WHERE order_id = $1`,
        [shareData.order_id]
      );
      assets = result.rows;
    } else {
      assets = Array.from(memoryStore.assets.values())
        .filter(a => a.order_id === shareData.order_id);
    }

    // 조회수 증가
    shareData.view_count = (shareData.view_count || 0) + 1;
    shareTokens.set(token, shareData);

    if (db) {
      try {
        await db.query(
          `UPDATE storybook_shares SET view_count = view_count + 1 WHERE share_token = $1`,
          [token]
        );
      } catch (e) {
        // 무시
      }
    }

    // 이벤트 기록
    await logEvent(shareData.order_id, 'share_opened', {
      share_token: token,
      view_count: shareData.view_count,
      referrer
    });

    // 마케팅 이벤트: share_opened (가치 이벤트)
    logMarketingEvent(EVENT_TYPES.SHARE_OPENED, {
      share_token: token,
      story_id: shareData.order_id,
      referrer: referrer,
      view_count: shareData.view_count
    }, { source: 'storybookRoutes' }).catch(err => {
      console.error('[Event] share_opened 로깅 실패:', err.message);
    });

    return res.json({
      success: true,
      share_token: token,
      order_id: shareData.order_id,
      view_count: shareData.view_count,
      assets: assets.map(a => ({
        type: a.asset_type,
        name: a.file_name,
        url: a.file_url
      }))
    });

  } catch (error) {
    console.error('공유 링크 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '공유 링크 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * GET /api/storybook/admin/download-stats
 *
 * 다운로드 통계 조회 (관리자용)
 */
router.get('/admin/download-stats', async (req, res) => {
  try {
    let stats = {
      total_downloads: 0,
      by_asset_type: {},
      download_rate: 0
    };

    if (db) {
      // 총 다운로드 수
      const downloadResult = await db.query(
        `SELECT COUNT(*) FROM storybook_events WHERE event_name = 'download_clicked'`
      );
      stats.total_downloads = parseInt(downloadResult.rows[0].count);

      // 자산 유형별 다운로드
      const byTypeResult = await db.query(
        `SELECT payload->>'asset_type' as asset_type, COUNT(*) as count
         FROM storybook_events
         WHERE event_name = 'download_clicked'
         GROUP BY payload->>'asset_type'`
      );
      for (const row of byTypeResult.rows) {
        stats.by_asset_type[row.asset_type] = parseInt(row.count);
      }

      // 다운로드율 (delivery_success 대비)
      const deliveryResult = await db.query(
        `SELECT COUNT(DISTINCT order_id) FROM storybook_deliveries WHERE status = 'SENT'`
      );
      const deliveredOrders = parseInt(deliveryResult.rows[0].count);

      const downloadedResult = await db.query(
        `SELECT COUNT(DISTINCT order_id) FROM storybook_events WHERE event_name = 'download_clicked'`
      );
      const downloadedOrders = parseInt(downloadedResult.rows[0].count);

      if (deliveredOrders > 0) {
        stats.download_rate = Math.round((downloadedOrders / deliveredOrders) * 100);
      }
    }

    return res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('다운로드 통계 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. 수정 요청 (크레딧 사용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/storybook/orders/:orderId/revision
 *
 * 수정을 요청합니다 (크레딧 차감).
 *
 * Body:
 *   {
 *     "target_doc": "WEBTOON",
 *     "revision_type": "REGEN_IMAGE",
 *     "user_request": "3번 컷 표정을 밝게 해주세요"
 *   }
 */
router.post('/orders/:orderId/revision', async (req, res) => {
  const { orderId } = req.params;
  const { target_doc, revision_type, user_request } = req.body;

  try {
    // 주문 조회
    let order = null;
    if (db) {
      const result = await db.query(
        'SELECT * FROM storybook_orders WHERE order_id = $1',
        [orderId]
      );
      order = result.rows[0];
    } else {
      order = memoryStore.orders.get(orderId);
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'ORDER_NOT_FOUND',
        message: '주문을 찾을 수 없습니다'
      });
    }

    // 주문 완료 확인
    if (order.status !== ORDER_STATUS.DONE) {
      return res.status(400).json({
        success: false,
        error: 'ORDER_NOT_COMPLETED',
        message: '주문이 완료되지 않았습니다'
      });
    }

    // 크레딧 확인
    const credits = typeof order.credits_remaining === 'string'
      ? JSON.parse(order.credits_remaining)
      : order.credits_remaining || {};

    const creditKey = getCreditKey(revision_type);
    if (!creditKey || (credits[creditKey] || 0) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'NO_CREDITS',
        message: '수정 크레딧이 부족합니다',
        credits_remaining: credits
      });
    }

    // 크레딧 차감
    credits[creditKey] = (credits[creditKey] || 0) - 1;

    // DB 업데이트
    if (db) {
      await db.query(
        'UPDATE storybook_orders SET credits_remaining = $1, updated_at = NOW() WHERE order_id = $2',
        [JSON.stringify(credits), orderId]
      );
    }

    // 메모리 업데이트
    if (memoryStore.orders.has(orderId)) {
      memoryStore.orders.get(orderId).credits_remaining = credits;
    }

    // 수정 요청 생성
    const revisionId = `REV-${Date.now().toString(36).toUpperCase()}`;

    if (db) {
      await db.query(
        `INSERT INTO storybook_revisions
         (revision_id, order_id, target_doc, revision_type, user_request, status, credits_debited, created_at)
         VALUES ($1, $2, $3, $4, $5, 'QUEUED', $6, NOW())`,
        [revisionId, orderId, target_doc, revision_type, user_request, JSON.stringify({ [creditKey]: 1 })]
      );
    }

    // 이벤트 기록
    await logEvent(orderId, 'revision_requested', {
      revision_id: revisionId,
      target_doc,
      revision_type,
      credits_debited: { [creditKey]: 1 }
    });

    // Revision Job 큐에 추가 (Phase 2-3)
    if (storybookQueue && storybookQueue.enqueueRevision) {
      storybookQueue.enqueueRevision({
        revision_id: revisionId,
        order_id: orderId,
        target_doc,
        revision_type,
        user_request
      });
    }

    return res.json({
      success: true,
      revision_id: revisionId,
      target_doc,
      revision_type,
      credits_debited: { [creditKey]: 1 },
      credits_remaining: credits,
      estimated_time: '2~5분',
      status: 'QUEUED',
      message: '수정 요청이 접수되었습니다. 잠시 후 완료 알림을 보내드립니다.'
    });

  } catch (error) {
    console.error('수정 요청 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '수정 요청 처리 중 오류가 발생했습니다'
    });
  }
});

/**
 * GET /api/storybook/revisions/:revisionId
 *
 * 수정 요청 상태 조회
 */
router.get('/revisions/:revisionId', async (req, res) => {
  const { revisionId } = req.params;

  try {
    let revision = null;

    if (db) {
      const result = await db.query(
        `SELECT r.*, o.tier, o.customer_email
         FROM storybook_revisions r
         JOIN storybook_orders o ON r.order_id = o.order_id
         WHERE r.revision_id = $1`,
        [revisionId]
      );
      revision = result.rows[0];
    }

    if (!revision) {
      return res.status(404).json({
        success: false,
        error: 'REVISION_NOT_FOUND',
        message: '수정 요청을 찾을 수 없습니다'
      });
    }

    // 수정된 산출물 조회
    let revisedAsset = null;
    if (revision.status === 'DONE' && db) {
      const assetResult = await db.query(
        `SELECT asset_type, file_url, created_at
         FROM storybook_assets
         WHERE order_id = $1
           AND metadata::text LIKE $2
         ORDER BY created_at DESC
         LIMIT 1`,
        [revision.order_id, `%${revisionId}%`]
      );
      revisedAsset = assetResult.rows[0];
    }

    return res.json({
      success: true,
      revision: {
        revision_id: revision.revision_id,
        order_id: revision.order_id,
        target_doc: revision.target_doc,
        revision_type: revision.revision_type,
        user_request: revision.user_request,
        status: revision.status,
        credits_debited: revision.credits_debited,
        created_at: revision.created_at,
        completed_at: revision.completed_at
      },
      revised_asset: revisedAsset ? {
        type: revisedAsset.asset_type,
        url: revisedAsset.file_url,
        created_at: revisedAsset.created_at
      } : null
    });

  } catch (error) {
    console.error('수정 상태 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '수정 상태 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * GET /api/storybook/orders/:orderId/revisions
 *
 * 주문의 수정 이력 조회
 */
router.get('/orders/:orderId/revisions', async (req, res) => {
  const { orderId } = req.params;

  try {
    let revisions = [];

    if (db) {
      const result = await db.query(
        `SELECT revision_id, target_doc, revision_type, user_request, status, credits_debited, created_at, completed_at
         FROM storybook_revisions
         WHERE order_id = $1
         ORDER BY created_at DESC`,
        [orderId]
      );
      revisions = result.rows;
    }

    return res.json({
      success: true,
      order_id: orderId,
      count: revisions.length,
      revisions: revisions.map(r => ({
        revision_id: r.revision_id,
        target_doc: r.target_doc,
        revision_type: r.revision_type,
        user_request: r.user_request?.substring(0, 100),
        status: r.status,
        credits_debited: r.credits_debited,
        created_at: r.created_at,
        completed_at: r.completed_at
      }))
    });

  } catch (error) {
    console.error('수정 이력 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: '수정 이력 조회 중 오류가 발생했습니다'
    });
  }
});

/**
 * 수정 유형별 크레딧 키
 */
function getCreditKey(revisionType) {
  switch (revisionType) {
    case 'REGEN_IMAGE':
      return 'regen_images';
    case 'EDIT_TEXT':
      return 'edit_text';
    case 'REWRITE_DOC':
      return 'rewrite_doc';
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. 관리자 API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/storybook/admin/orders
 *
 * 전체 주문 목록 조회 (관리자용)
 */
router.get('/admin/orders', async (req, res) => {
  const { status, tier, limit = 50, offset = 0 } = req.query;

  try {
    let orders = [];

    if (db) {
      let query = 'SELECT * FROM storybook_orders WHERE 1=1';
      const params = [];
      let paramIndex = 1;

      if (status) {
        query += ` AND status = $${paramIndex++}`;
        params.push(status);
      }
      if (tier) {
        query += ` AND tier = $${paramIndex++}`;
        params.push(tier);
      }

      query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
      params.push(parseInt(limit), parseInt(offset));

      const result = await db.query(query, params);
      orders = result.rows;
    } else {
      orders = Array.from(memoryStore.orders.values())
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    }

    return res.json({
      success: true,
      count: orders.length,
      orders: orders.map(o => ({
        order_id: o.order_id,
        tier: o.tier,
        status: o.status,
        amount: o.amount,
        customer_email: maskEmail(o.customer_email),
        fail_reason: o.fail_reason,
        created_at: o.created_at,
        delivered_at: o.delivered_at
      }))
    });

  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/storybook/admin/stats
 *
 * 통계 조회 (관리자용)
 */
router.get('/admin/stats', async (req, res) => {
  try {
    let stats = {
      total_orders: 0,
      by_status: {},
      by_tier: {},
      total_revenue: 0,
      success_rate: 0
    };

    if (db) {
      // 전체 주문 수
      const totalResult = await db.query('SELECT COUNT(*) FROM storybook_orders');
      stats.total_orders = parseInt(totalResult.rows[0].count);

      // 상태별
      const statusResult = await db.query(
        'SELECT status, COUNT(*) FROM storybook_orders GROUP BY status'
      );
      for (const row of statusResult.rows) {
        stats.by_status[row.status] = parseInt(row.count);
      }

      // 티어별
      const tierResult = await db.query(
        'SELECT tier, COUNT(*), SUM(amount) as revenue FROM storybook_orders GROUP BY tier'
      );
      for (const row of tierResult.rows) {
        stats.by_tier[row.tier] = {
          count: parseInt(row.count),
          revenue: parseInt(row.revenue)
        };
        stats.total_revenue += parseInt(row.revenue);
      }

      // 성공률
      const doneCount = stats.by_status['DONE'] || 0;
      const failCount = Object.keys(stats.by_status)
        .filter(s => s.startsWith('FAIL_'))
        .reduce((sum, s) => sum + (stats.by_status[s] || 0), 0);

      if (doneCount + failCount > 0) {
        stats.success_rate = Math.round((doneCount / (doneCount + failCount)) * 100);
      }

    } else {
      // 메모리에서 계산
      const orders = Array.from(memoryStore.orders.values());
      stats.total_orders = orders.length;

      for (const order of orders) {
        stats.by_status[order.status] = (stats.by_status[order.status] || 0) + 1;
        if (!stats.by_tier[order.tier]) {
          stats.by_tier[order.tier] = { count: 0, revenue: 0 };
        }
        stats.by_tier[order.tier].count++;
        stats.by_tier[order.tier].revenue += order.amount;
        stats.total_revenue += order.amount;
      }
    }

    return res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('통계 조회 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. 헬스체크
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/storybook/health
 */
router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    db: db ? 'connected' : 'memory_mode',
    queue: storybookQueue ? 'available' : 'unavailable',
    memory_orders: memoryStore.orders.size,
    memory_events: memoryStore.events.length
  };

  if (db) {
    try {
      await db.query('SELECT 1');
      health.db = 'connected';
    } catch (error) {
      health.db = 'error';
      health.db_error = error.message;
    }
  }

  return res.json(health);
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. 테스트용 엔드포인트 (개발 환경)
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// 8. 마이그레이션 엔드포인트 (관리자용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/storybook/admin/migrate
 *
 * DB 스키마 마이그레이션 (관리자용)
 */
router.post('/admin/migrate', async (req, res) => {
  const { secret } = req.body;

  // 간단한 비밀키 검증
  if (secret !== (process.env.ADMIN_SECRET || 'storybook-migrate-2026')) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
  }

  if (!db) {
    return res.status(500).json({ success: false, error: 'DB_NOT_CONNECTED' });
  }

  try {
    console.log('🚀 스토리북 스키마 마이그레이션 시작...');

    // 스키마 SQL 직접 실행
    const schemaSql = `
      -- orders 테이블
      CREATE TABLE IF NOT EXISTS storybook_orders (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        payment_id VARCHAR(64) NOT NULL,
        user_id VARCHAR(64),
        customer_email VARCHAR(128) NOT NULL,
        customer_phone VARCHAR(20),
        wish_id VARCHAR(64),
        tier VARCHAR(16) NOT NULL CHECK (tier IN ('STARTER', 'PLUS', 'PREMIUM')),
        amount INTEGER NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
        fail_reason VARCHAR(64),
        last_error TEXT,
        ethics_score INTEGER,
        gate_result VARCHAR(16),
        workflow_version VARCHAR(20),
        generation_time_sec INTEGER,
        credits_remaining JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        paid_at TIMESTAMP,
        delivered_at TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_orders_order_id ON storybook_orders(order_id);
      CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_orders_payment_id ON storybook_orders(payment_id);
      CREATE INDEX IF NOT EXISTS ix_storybook_orders_status ON storybook_orders(status);

      -- jobs 테이블
      CREATE TABLE IF NOT EXISTS storybook_jobs (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        job_type VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'QUEUED',
        attempt INTEGER NOT NULL DEFAULT 0,
        max_attempts INTEGER NOT NULL DEFAULT 2,
        last_error TEXT,
        tokens_used INTEGER DEFAULT 0,
        images_generated INTEGER DEFAULT 0,
        cost_estimate DECIMAL(10,2),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        started_at TIMESTAMP,
        finished_at TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS ix_storybook_jobs_order_id ON storybook_jobs(order_id);
      CREATE INDEX IF NOT EXISTS ix_storybook_jobs_status ON storybook_jobs(status);

      -- assets 테이블
      CREATE TABLE IF NOT EXISTS storybook_assets (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        asset_type VARCHAR(32) NOT NULL,
        file_url TEXT NOT NULL,
        file_name VARCHAR(256),
        file_size_bytes INTEGER,
        asset_hash VARCHAR(64) NOT NULL,
        expires_at TIMESTAMP,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_assets_order_hash ON storybook_assets(order_id, asset_hash);
      CREATE INDEX IF NOT EXISTS ix_storybook_assets_order_id ON storybook_assets(order_id);

      -- deliveries 테이블
      CREATE TABLE IF NOT EXISTS storybook_deliveries (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL,
        channel VARCHAR(16) NOT NULL,
        asset_hash VARCHAR(64) NOT NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
        error_code VARCHAR(64),
        error_message TEXT,
        message_id VARCHAR(128),
        recipient VARCHAR(128),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        opened_at TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_deliveries_unique ON storybook_deliveries(order_id, channel, asset_hash);
      CREATE INDEX IF NOT EXISTS ix_storybook_deliveries_order_id ON storybook_deliveries(order_id);

      -- events 테이블
      CREATE TABLE IF NOT EXISTS storybook_events (
        id BIGSERIAL PRIMARY KEY,
        order_id VARCHAR(64),
        job_id BIGINT,
        event_name VARCHAR(64) NOT NULL,
        payload JSONB DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS ix_storybook_events_name ON storybook_events(event_name);
      CREATE INDEX IF NOT EXISTS ix_storybook_events_order_id ON storybook_events(order_id);

      -- revisions 테이블
      CREATE TABLE IF NOT EXISTS storybook_revisions (
        id BIGSERIAL PRIMARY KEY,
        revision_id VARCHAR(64) NOT NULL,
        order_id VARCHAR(64) NOT NULL,
        target_doc VARCHAR(32) NOT NULL,
        revision_type VARCHAR(32) NOT NULL,
        user_request TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'QUEUED',
        credits_debited JSONB,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMP
      );
      CREATE UNIQUE INDEX IF NOT EXISTS ux_storybook_revisions_id ON storybook_revisions(revision_id);
      CREATE INDEX IF NOT EXISTS ix_storybook_revisions_order_id ON storybook_revisions(order_id);
    `;

    await db.query(schemaSql);

    // 테이블 확인
    const tableCheck = await db.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name LIKE 'storybook_%'
      ORDER BY table_name
    `);

    console.log('✅ 마이그레이션 완료!');

    return res.json({
      success: true,
      message: '스키마 마이그레이션 완료',
      tables: tableCheck.rows.map(r => r.table_name)
    });

  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
    return res.status(500).json({
      success: false,
      error: 'MIGRATION_FAILED',
      message: error.message
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  /**
   * POST /api/storybook/test/simulate-payment
   *
   * 결제 시뮬레이션 (테스트용)
   */
  router.post('/test/simulate-payment', async (req, res) => {
    const { tier = 'STARTER', email = 'test@example.com' } = req.body;

    // 가상 결제 데이터 생성
    const paymentData = {
      event: 'payment.success',
      payment_id: `TEST-${Date.now()}`,
      tier: tier.toUpperCase(),
      amount: TIERS[tier.toUpperCase()]?.price || 24900,
      customer_email: email,
      customer_phone: '01012345678',
      user_id: 'TEST-USER',
      wish_id: 'TEST-WISH'
    };

    // 내부적으로 웹훅 처리
    req.body = paymentData;
    req.headers['x-signature'] = 'test-skip';

    console.log('🧪 테스트 결제 시뮬레이션:', paymentData);

    // 웹훅 라우터 재호출하는 대신 직접 처리
    const orderId = generateOrderId();
    const order = {
      order_id: orderId,
      payment_id: paymentData.payment_id,
      user_id: paymentData.user_id,
      customer_email: paymentData.customer_email,
      customer_phone: paymentData.customer_phone,
      wish_id: paymentData.wish_id,
      tier: paymentData.tier,
      amount: paymentData.amount,
      status: ORDER_STATUS.PAID,
      credits_remaining: getInitialCredits(paymentData.tier),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      paid_at: new Date().toISOString()
    };

    memoryStore.orders.set(orderId, order);
    await logEvent(orderId, 'pay_success', { tier: paymentData.tier, test: true });

    const jobId = await queueGenerationJob(orderId, paymentData.tier);

    return res.json({
      success: true,
      test: true,
      order_id: orderId,
      job_id: jobId,
      tier: paymentData.tier,
      message: '테스트 결제가 시뮬레이션되었습니다'
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// DreamTown 스토리북 생성 (포스트카드 → 슬라이드 흐름)
// ═══════════════════════════════════════════════════════════════════════════

const LOCATION_ORDER = ['cablecar', 'cafe', 'hamel', 'stay'];

const EMOTION_FLOW_TEXT = {
  'confusion→confusion':       ['길을 잃은 채로 걸었어요', '그래도 멈추지 않았어요'],
  'confusion→calm':            ['처음엔 아무것도 보이지 않았어요', '조금씩 고요해졌어요'],
  'confusion→fragile_hope':    ['어디로 가야 할지 몰랐지만', '다시 믿고 싶어졌어요'],
  'confusion→curiosity':       ['흔들리며 시작했지만', '조금씩 궁금해졌어요'],
  'confusion→pause':           ['모든 게 뒤엉켰던 순간', '잠시 멈춰 숨을 골랐어요'],
  'calm→calm':                 ['조용히 걸어왔어요', '그 걸음이 여기까지 닿았어요'],
  'calm→fragile_hope':         ['고요한 마음으로 걸었어요', '끝에서 작은 빛을 만났어요'],
  'calm→curiosity':            ['천천히, 서두르지 않고', '새로운 게 보이기 시작했어요'],
  'calm→confusion':            ['잔잔하게 흘렀지만', '어느 순간 길이 흐릿해졌어요'],
  'calm→pause':                ['모든 걸 내려놓고 걸었어요', '잠시 여기 머물렀어요'],
  'fragile_hope→fragile_hope': ['작은 희망을 안고 왔어요', '아직 사라지지 않았어요'],
  'fragile_hope→calm':         ['떨리는 마음으로 시작했지만', '어느새 안정되었어요'],
  'fragile_hope→curiosity':    ['희미한 빛을 따라왔어요', '조금 더 알고 싶어졌어요'],
  'fragile_hope→confusion':    ['믿고 싶었지만', '다시 안개 속에 섰어요'],
  'fragile_hope→pause':        ['작은 희망을 붙들고', '잠시 숨을 고르는 중이에요'],
  'curiosity→curiosity':       ['궁금한 것들을 따라왔어요', '아직 답이 보이지 않아요'],
  'curiosity→calm':            ['많은 걸 물으며 걸었어요', '결국 고요가 남았어요'],
  'curiosity→fragile_hope':    ['찾고 싶은 게 있었어요', '아직 찾는 중이에요'],
  'curiosity→confusion':       ['알고 싶어서 걸었지만', '더 복잡해진 것 같아요'],
  'curiosity→pause':           ['많은 걸 보고 들었어요', '잠시 멈추고 싶어졌어요'],
  'pause→pause':               ['멈춰 있어도 괜찮아요', '여기도 길이에요'],
  'pause→calm':                ['충분히 쉬었어요', '이제 조금 가벼워졌어요'],
  'pause→fragile_hope':        ['한동안 서 있었지만', '다시 한 걸음을 내딛고 싶어요'],
  'pause→curiosity':           ['멈춰서 바라봤어요', '그러자 새로운 게 눈에 들어왔어요'],
  'pause→confusion':           ['쉬고 싶었지만', '마음은 여전히 흔들렸어요'],
};

const CLOSING_TEXT = {
  confusion:    '다시 시작해도 괜찮아요',
  calm:         '이 고요함을 기억하세요',
  fragile_hope: '그 빛은 아직 여기 있어요',
  curiosity:    '궁금한 건 계속 따라가도 돼요',
  pause:        '멈춤도 여정의 일부예요',
};

function buildStorybook(sorted, mainStar, flowLine1, flowLine2, closingText, isFull) {
  const toSlide = s => ({ type: 'image', location: s.location, image_url: s.image_url, emotion: s.emotion });
  const mainSlide = { type: 'image', role: 'main_star', location: mainStar.location, image_url: mainStar.image_url, emotion: mainStar.emotion };

  if (isFull) {
    return [
      ...sorted.slice(0, 4).map(toSlide),
      { type: 'text', content: `${flowLine1}\n${flowLine2}` },
      mainSlide,
      { type: 'text', content: '당신의 별은 여기까지 왔어요' },
      toSlide(sorted[sorted.length - 1]),
      { type: 'text', content: closingText },
    ];
  }

  // compact (2-3 cards)
  return [
    ...sorted.map(toSlide),
    { type: 'text', content: `${flowLine1}\n${flowLine2}` },
    mainSlide,
    { type: 'text', content: closingText },
  ];
}

/**
 * POST /api/storybook/generate
 *
 * DreamTown 포스트카드 → 스토리북 슬라이드 변환
 * Body: { stars: [{ location, emotion, image_url }] }
 */
router.post('/generate', async (req, res) => {
  try {
    const { stars = [], ref_access_key } = req.body;

    if (!Array.isArray(stars) || stars.length < 2) {
      return res.status(400).json({ success: false, error: '최소 2개의 카드가 필요합니다' });
    }

    // 1. location 기준 정렬 (cablecar → cafe → hamel → stay)
    const sorted = [...stars].sort((a, b) => {
      const ai = LOCATION_ORDER.indexOf(a.location);
      const bi = LOCATION_ORDER.indexOf(b.location);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    // 2. 감정 흐름 추출
    const firstEmotion = sorted[0].emotion;
    const lastEmotion  = sorted[sorted.length - 1].emotion;
    const [flowLine1, flowLine2] = EMOTION_FLOW_TEXT[`${firstEmotion}→${lastEmotion}`]
      || ['처음엔 흔들렸지만', '조금씩 또렷해졌어요'];

    // 3. 대표 이미지 선택 (hamel > stay > 마지막)
    const mainStar =
      sorted.find(s => s.location === 'hamel') ||
      sorted.find(s => s.location === 'stay')  ||
      sorted[sorted.length - 1];

    const closingText = CLOSING_TEXT[lastEmotion] || '다시 시작해도 괜찮아요';
    const isFull      = sorted.length >= 4;
    const slides      = buildStorybook(sorted, mainStar, flowLine1, flowLine2, closingText, isFull);
    const meta = {
      card_count:     sorted.length,
      first_emotion:  firstEmotion,
      last_emotion:   lastEmotion,
      flow_type:      isFull ? 'full' : 'compact',
      ref_access_key: ref_access_key || null,
    };

    // 스토리북 저장 → 공유 링크 발급 (migration 162)
    let storybookId  = null;
    let share_url    = null;
    if (db) {
      try {
        // ref_access_key의 journey_id 조회
        let journey_id = null;
        if (ref_access_key) {
          const { rows: jr } = await db.query(
            'SELECT journey_id FROM stars WHERE access_key = $1', [ref_access_key]
          ).catch(() => ({ rows: [] }));
          journey_id = jr[0]?.journey_id || null;
        }
        const { rows: sbRows } = await db.query(
          `INSERT INTO storybooks (access_key, journey_id, slides, meta)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [ref_access_key || null, journey_id, JSON.stringify(slides), JSON.stringify(meta)]
        );
        storybookId = sbRows[0]?.id;
        if (storybookId) {
          share_url = `/storybook/${storybookId}`;
          // storybook_items 저장 (migration 166)
          const itemValues = slides.map((s, i) => [
            storybookId, i, s.type, s.role || null,
            s.location || null, s.emotion || null, s.image_url || null, s.content || null,
          ]);
          Promise.all(itemValues.map(v =>
            db.query(
              `INSERT INTO storybook_items
                 (storybook_id, slide_order, type, role, location, emotion, image_url, content)
               VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
              v
            )
          )).catch(() => {});
        }
      } catch (_) { /* migration 162/166 미실행 시 무시 */ }
    }

    return res.json({ success: true, id: storybookId, share_url, meta, storybook: slides });
  } catch (err) {
    console.error('[storybook] /generate error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /s/:id — 저장된 스토리북 조회 (공유 링크용) ───────────────
router.get('/s/:id', async (req, res) => {
  const { id } = req.params;
  if (!db) return res.status(503).json({ success: false, error: 'DB unavailable' });
  try {
    const { rows } = await db.query(
      'SELECT id, access_key, journey_id, slides, meta, created_at FROM storybooks WHERE id = $1',
      [id]
    );
    if (!rows.length) return res.status(404).json({ success: false, error: 'not found' });
    const row = rows[0];
    return res.json({
      success:    true,
      id:         row.id,
      access_key: row.access_key,
      journey_id: row.journey_id,
      meta:       row.meta,
      storybook:  row.slides,
      created_at: row.created_at,
      share_url:  `/storybook/${id}`,
    });
  } catch (err) {
    if (err.code === '42P01') return res.status(404).json({ success: false, error: 'not found' });
    console.error('[storybook] GET /s/:id error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
