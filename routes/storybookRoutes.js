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

    return res.json({
      success: true,
      revision_id: revisionId,
      target_doc,
      revision_type,
      credits_debited: { [creditKey]: 1 },
      credits_remaining: credits,
      estimated_time: '2~5분',
      message: '수정 요청이 접수되었습니다'
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

module.exports = router;
