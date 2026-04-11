/**
 * dtAiUnlockRoutes.js — AI Unlock 모네타이제이션 API
 *
 * GET  /api/dt/ai-unlock/status           유저 AI 사용 현황 + 상품 목록
 * GET  /api/dt/ai-unlock/products         구매 가능 상품 목록
 * POST /api/dt/ai-unlock/purchase         구매 처리 (결제 완료 후 호출)
 * POST /api/dt/ai-unlock/event            UX 이벤트 기록
 * POST /api/payment/ai-unlock/success     나이스페이 콜백 → 한도 반영
 * GET  /api/admin/dt/ai-unlock/stats      관리자 통계
 */

'use strict';

const express = require('express');
const router  = express.Router();
const db      = require('../database/db');
const aiGateway    = require('../services/aiGateway');
const experimentSvc = require('../services/experimentService');
const { makeLogger } = require('../utils/logger');

const log = makeLogger('dtAiUnlock');

// ── 상품 정보 (DB fallback 포함 하드코딩 — 빠른 응답 보장) ──────────
const PRODUCTS = {
  boost: {
    product_type:  'boost',
    name:          'AI Boost Pack',
    price_krw:     3900,
    calls_granted: 10,
    description:   '추가 AI 분석 +10회, 즉시 적용, 30일 유효',
    tagline:       '지금 바로 더 깊게 분석받을 수 있어요',
    expires_days:  30,
  },
  deep: {
    product_type:  'deep',
    name:          'Deep Insight Pack',
    price_krw:     5900,
    calls_granted: 1,
    description:   '고품질 AI 분석 1회 + 7일 개인화 메시지',
    tagline:       '소원에 맞춘 깊은 통찰을 받아보세요',
    expires_days:  null,
  },
  premium: {
    product_type:  'premium',
    name:          'Premium Journey',
    price_krw:     9900,
    calls_granted: 9999,
    description:   'AI 호출 제한 해제 + 전체 메시지 AI 개인화',
    tagline:       '소원 여정의 모든 순간을 AI와 함께',
    expires_days:  null,
  },
};

// ── 업셀 문구 (step별) ────────────────────────────────────────────────
const UPSELL_COPY = {
  ai_limit_reached: {
    title:    '더 깊은 분석을 원하시나요?',
    body:     '무료 AI 분석이 모두 사용됐어요. 지금 추가하면 더 개인화된 통찰을 받을 수 있어요.',
    cta:      'AI 추가 분석 받기',
    product:  'boost',
  },
  day3_checkin: {
    title:    '지금 더 개인화할 수 있어요',
    body:     '3일째 함께하고 있어요. 소원에 딱 맞는 AI 메시지로 여정을 깊게 만들어 볼까요?',
    cta:      '개인화 시작하기',
    product:  'deep',
  },
  insight_done: {
    title:    '더 깊이 들어가볼까요?',
    body:     '지금 받은 인사이트의 다음 단계가 있어요. Premium에서 더 깊은 여정을 경험하세요.',
    cta:      'Premium으로 더 깊게',
    product:  'premium',
  },
};

// ── GET /status ── 유저 AI 상태 + 업셀 판단 + A/B 실험 ───────────────
// Query params: user_id, days_active (별 생성 후 경과일, 프론트에서 계산)
router.get('/status', async (req, res) => {
  const { user_id, days_active } = req.query;
  const daysActive = parseInt(days_active ?? '0', 10);

  try {
    const [status, variant] = await Promise.all([
      aiGateway.getUserAiStatus(user_id ?? null),
      experimentSvc.assignGroup(user_id ?? null),
    ]);

    const products   = Object.values(PRODUCTS);
    const used       = status.ai_calls_used ?? 0;
    const limit      = status.ai_calls_limit ?? 5;
    const remaining  = Math.max(0, limit - used);
    const limitReached = !status.is_premium && used >= limit;

    // ── 업셀 스테이지 판단 ────────────────────────────────────────────
    let upsell = null;
    let upsellStage = null;

    if (!status.is_premium) {
      if (limitReached) {
        upsellStage = 'limit';
      } else if (variant.upsell_stages.includes('day3') && daysActive >= 3 && daysActive < 7) {
        upsellStage = 'day3';
      } else if (variant.upsell_stages.includes('day1') && daysActive === 1) {
        upsellStage = 'day1';
      }
    }

    if (upsellStage) {
      const copyMap = {
        limit: UPSELL_COPY.ai_limit_reached,
        day3:  UPSELL_COPY.day3_checkin,
        day1:  { ...UPSELL_COPY.ai_limit_reached, title: '소원별이 더 또렷해질 수 있어요', body: '첫 여정을 시작했어요. 지금 AI 분석을 추가하면 소원별이 훨씬 선명해져요.' },
      };
      upsell = {
        ...copyMap[upsellStage],
        cta:   variant.copy_cta,        // A/B 문구 변형
        stage: upsellStage,
        experiment: {
          group:           variant.group,
          button_position: variant.button_position,
          price_exposed:   variant.price_exposed,
        },
      };

      // 노출 이벤트 기록 (비동기)
      Promise.all([
        aiGateway.logAiEvent({
          userId: user_id, eventName: 'upgrade_prompt_shown',
          context: { stage: upsellStage, group: variant.group, used, limit },
        }),
        experimentSvc.logExposure({
          userId: user_id, group: variant.group, stage: upsellStage,
          eventName: 'upgrade_prompt_shown',
          context: { used, limit, days_active: daysActive },
        }),
      ]).catch(() => {});
    }

    res.json({
      ok: true,
      ai_status: {
        tier:          status.ai_tier ?? 'free',
        is_premium:    status.is_premium,
        used,
        limit:         status.is_premium ? null : limit,
        remaining:     status.is_premium ? null : remaining,
        limit_reached: limitReached,
      },
      upsell,
      experiment: {
        group:           variant.group,
        copy_cta:        variant.copy_cta,
        button_position: variant.button_position,
        price_exposed:   variant.price_exposed,
      },
      products,
    });
  } catch (err) {
    log.error('status 조회 실패', { err: err.message });
    res.status(500).json({ error: 'AI 상태 조회 실패' });
  }
});

// ── GET /products ── 상품 목록 ────────────────────────────────────────
router.get('/products', async (req, res) => {
  try {
    // DB에서 조회 시도, 실패 시 하드코딩 반환
    const { rows } = await db.query(
      `SELECT * FROM dt_ai_products WHERE is_active = true ORDER BY price_krw`
    ).catch(() => ({ rows: [] }));

    const products = rows.length > 0 ? rows : Object.values(PRODUCTS);
    res.json({ ok: true, products });
  } catch (err) {
    res.json({ ok: true, products: Object.values(PRODUCTS) });
  }
});

// ── POST /purchase ── 구매 처리 (결제 완료 콜백) ─────────────────────
// Body: { user_id, product_type, pg_order_id?, pg_tid? }
router.post('/purchase', async (req, res) => {
  const { user_id, product_type, pg_order_id, pg_tid } = req.body ?? {};

  if (!user_id || !product_type) {
    return res.status(400).json({ error: 'user_id, product_type 필요' });
  }
  if (!PRODUCTS[product_type]) {
    return res.status(400).json({ error: `허용되지 않는 product_type: ${product_type}` });
  }

  const product = PRODUCTS[product_type];

  try {
    // 멱등성 보장: 동일 pg_order_id 중복 처리 방지
    if (pg_order_id) {
      const { rows: existing } = await db.query(
        `SELECT id FROM dt_ai_purchases WHERE pg_order_id = $1 AND status = 'completed' LIMIT 1`,
        [pg_order_id]
      );
      if (existing.length > 0) {
        return res.json({ ok: true, message: '이미 처리된 주문', idempotent: true });
      }
    }

    // 트랜잭션: purchases 기록 + users 한도 업데이트
    const client = await db.pool?.connect?.() ?? null;
    const runTx = async (qFn) => {
      if (client) {
        await client.query('BEGIN');
        try {
          const r = await qFn(s => client.query(s[0], s[1]));
          await client.query('COMMIT');
          return r;
        } catch (e) { await client.query('ROLLBACK'); throw e; }
        finally { client.release?.(); }
      }
      // pool.connect 없으면 단순 순차 실행
      return qFn(s => db.query(s[0], s[1]));
    };

    const expiresAt = product.expires_days
      ? new Date(Date.now() + product.expires_days * 86400 * 1000)
      : null;

    await runTx(async (q) => {
      // 0. 유저가 없으면 생성 (외부 유입 or 비회원 결제 대비)
      await q([
        `INSERT INTO dt_users (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`,
        [user_id]
      ]);

      // 1. 구매 기록
      await q([
        `INSERT INTO dt_ai_purchases
           (user_id, product_type, price_krw, calls_granted, pg_order_id, pg_tid, status, applied_at, expires_at)
         VALUES ($1,$2,$3,$4,$5,$6,'completed',NOW(),$7)`,
        [user_id, product_type, product.price_krw, product.calls_granted, pg_order_id ?? null, pg_tid ?? null, expiresAt]
      ]);

      // 2. 유저 한도 업데이트
      if (product_type === 'premium') {
        await q([
          `UPDATE dt_users SET
             is_premium = true,
             ai_calls_limit = 9999,
             ai_tier = 'premium',
             updated_at = NOW()
           WHERE id = $1`,
          [user_id]
        ]);
      } else if (product_type === 'boost') {
        await q([
          `UPDATE dt_users SET
             ai_calls_limit = ai_calls_limit + $1,
             ai_tier = CASE WHEN ai_tier = 'free' THEN 'boost' ELSE ai_tier END,
             ai_boost_expires_at = $2,
             updated_at = NOW()
           WHERE id = $3`,
          [product.calls_granted, expiresAt, user_id]
        ]);
      } else if (product_type === 'deep') {
        await q([
          `UPDATE dt_users SET
             ai_calls_limit = ai_calls_limit + $1,
             ai_tier = CASE WHEN ai_tier = 'free' THEN 'deep' ELSE ai_tier END,
             updated_at = NOW()
           WHERE id = $2`,
          [product.calls_granted, user_id]
        ]);
      }
    });

    // 이벤트 기록
    const eventName = product_type === 'premium' ? 'premium_activated' : 'ai_boost_applied';
    await aiGateway.logAiEvent({
      userId: user_id, eventName: 'purchase_completed',
      productType: product_type,
      context: { calls_granted: product.calls_granted, price_krw: product.price_krw, pg_order_id },
    });
    await aiGateway.logAiEvent({ userId: user_id, eventName, productType: product_type });

    // 업데이트된 상태 반환
    const newStatus = await aiGateway.getUserAiStatus(user_id);

    log.info('AI 구매 처리', { user_id, product_type, calls_granted: product.calls_granted });

    res.status(201).json({
      ok: true,
      product_type,
      calls_granted: product.calls_granted,
      ai_status: {
        tier:       newStatus.ai_tier,
        is_premium: newStatus.is_premium,
        limit:      newStatus.ai_calls_limit,
        used:       newStatus.ai_calls_used,
        remaining:  Math.max(0, newStatus.ai_calls_limit - newStatus.ai_calls_used),
      },
    });

  } catch (err) {
    log.error('구매 처리 실패', { err: err.message });
    res.status(500).json({ error: '구매 처리 실패' });
  }
});

// ── POST /event ── UX 이벤트 기록 + 실험 노출 로그 ───────────────────
// Body: { user_id, star_id?, event_name, product_type?, stage?, group?, context? }
router.post('/event', async (req, res) => {
  const { user_id, star_id, event_name, product_type, stage, group, context } = req.body ?? {};
  const ALLOWED = ['ai_limit_reached','upgrade_prompt_shown','upgrade_clicked','purchase_completed','ai_boost_applied','premium_activated'];
  if (!ALLOWED.includes(event_name)) {
    return res.status(400).json({ error: `허용되지 않는 event_name: ${event_name}` });
  }
  try {
    const tasks = [
      aiGateway.logAiEvent({ userId: user_id, starId: star_id, eventName: event_name, productType: product_type, context }),
    ];

    // 실험 관련 이벤트면 experiment_exposures에도 기록
    if (stage && group) {
      tasks.push(
        experimentSvc.logExposure({
          userId: user_id, group, stage, eventName: event_name,
          productType: product_type,
          context: { ...(context ?? {}), star_id },
        })
      );
    }

    await Promise.all(tasks);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: '이벤트 저장 실패' });
  }
});

// ── POST /payment/success ── 나이스페이 콜백 호환 ────────────────────
// 기존 nicepayRoutes.js와 분리 — AI 전용 콜백 처리
router.post('/payment-success', async (req, res) => {
  const { user_id, product_type, orderId, tid } = req.body ?? {};
  req.body = { user_id, product_type, pg_order_id: orderId, pg_tid: tid };
  // /purchase 핸들러 재사용
  const purchaseHandler = router.stack.find(l => l.route?.path === '/purchase')?.route?.stack?.[0]?.handle;
  if (purchaseHandler) return purchaseHandler(req, res);
  res.status(500).json({ error: 'handler not found' });
});

// ── GET /admin/stats ── 관리자 통계 ──────────────────────────────────
router.get('/admin/stats', async (req, res) => {
  const adminKey = req.headers['x-admin-key'] ?? req.query.admin_key;
  if (adminKey !== (process.env.ADMIN_API_KEY ?? 'dt-admin-2025')) {
    return res.status(401).json({ error: '관리자 인증 필요' });
  }

  try {
    const [aiStats, purchaseStats, eventStats, tierStats, experimentStats] = await Promise.all([
      aiGateway.getStats({ days: 30 }),
      db.query(`
        SELECT product_type,
               COUNT(*) AS count,
               SUM(price_krw) AS revenue_krw,
               SUM(calls_granted) AS total_calls_granted
        FROM dt_ai_purchases WHERE status = 'completed'
          AND created_at >= NOW() - INTERVAL '30 days'
        GROUP BY product_type ORDER BY product_type
      `),
      db.query(`
        SELECT event_name, COUNT(*) AS count
        FROM dt_ai_events
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY event_name ORDER BY count DESC
      `),
      db.query(`
        SELECT ai_tier, COUNT(*) AS user_count,
               SUM(CASE WHEN is_premium THEN 1 ELSE 0 END) AS premium_count
        FROM dt_users GROUP BY ai_tier
      `),
      experimentSvc.getExperimentStats(),
    ]);

    res.json({
      ok: true,
      period: '30d',
      ai_usage:   aiStats,
      purchases:  purchaseStats.rows,
      events:     eventStats.rows,
      tiers:      tierStats.rows,
      experiment: experimentStats,
    });
  } catch (err) {
    log.error('관리자 통계 조회 실패', { err: err.message });
    res.status(500).json({ error: '통계 조회 실패' });
  }
});

module.exports = router;
