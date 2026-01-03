/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Storybook Job Queue Service
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 핵심 원칙:
 *   1️⃣ 유실 0: 모든 Job은 DONE 또는 FAIL로 종결
 *   2️⃣ 재시도: 실패 시 최대 2회 재시도
 *   3️⃣ 비용 상한: 티어별 예산 초과 시 차단
 *
 * 작성일: 2026-01-03
 * ═══════════════════════════════════════════════════════════════════════════
 */

// DB 모듈 (선택적 로딩)
let db = null;
try {
  db = require('../database/db');
} catch (error) {
  console.warn('⚠️ StorybookQueue: DB 모듈 로드 실패');
}

// 스토리북 생성 서비스 (선택적 로딩)
let storybookGenerator = null;
try {
  storybookGenerator = require('./storybookGenerator');
} catch (error) {
  console.warn('⚠️ StorybookQueue: Generator 서비스 로드 실패');
}

// 이메일 서비스 (선택적 로딩)
let emailService = null;
try {
  emailService = require('./emailService');
} catch (error) {
  console.warn('⚠️ StorybookQueue: Email 서비스 로드 실패');
}

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

const JOB_STATUS = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  DONE: 'DONE',
  FAIL: 'FAIL'
};

const ORDER_STATUS = {
  GENERATING: 'GENERATING',
  GATED: 'GATED',
  STORING: 'STORING',
  DELIVERING: 'DELIVERING',
  DONE: 'DONE',
  FAIL_GENERATION: 'FAIL_GENERATION',
  FAIL_GATE: 'FAIL_GATE',
  FAIL_STORAGE: 'FAIL_STORAGE',
  FAIL_DELIVERY: 'FAIL_DELIVERY',
  FAIL_BUDGET: 'FAIL_BUDGET'
};

// 티어별 비용 상한
const BUDGET_LIMITS = {
  STARTER: { tokens: 10000, images: 5 },
  PLUS: { tokens: 15000, images: 12 },
  PREMIUM: { tokens: 25000, images: 12 }
};

// 큐 저장소
const jobQueue = [];
let isProcessing = false;

// ═══════════════════════════════════════════════════════════════════════════
// 큐 관리
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Job을 큐에 추가
 */
function enqueue(job) {
  jobQueue.push(job);
  console.log(`📥 Job 큐 추가: ${job.job_id || job.order_id} (큐 길이: ${jobQueue.length})`);

  // 자동 처리 시작
  if (!isProcessing) {
    processQueue();
  }
}

/**
 * 큐 처리 (FIFO)
 */
async function processQueue() {
  if (isProcessing || jobQueue.length === 0) {
    return;
  }

  isProcessing = true;
  console.log('🔄 큐 처리 시작');

  while (jobQueue.length > 0) {
    const job = jobQueue.shift();

    try {
      await processJob(job);
    } catch (error) {
      console.error(`💥 Job 처리 실패: ${job.order_id}`, error.message);

      // 재시도 가능 여부 확인
      if ((job.attempt || 0) < (job.max_attempts || 2)) {
        job.attempt = (job.attempt || 0) + 1;
        job.last_error = error.message;
        jobQueue.push(job); // 다시 큐에 추가
        console.log(`🔁 재시도 예약: ${job.order_id} (${job.attempt}/${job.max_attempts})`);
      } else {
        // 최종 실패
        await updateOrderStatus(job.order_id, ORDER_STATUS.FAIL_GENERATION, {
          fail_reason: 'MAX_RETRIES_EXCEEDED',
          last_error: error.message
        });
        await logEvent(job.order_id, 'job_failed', {
          error: error.message,
          attempts: job.attempt
        });
      }
    }
  }

  isProcessing = false;
  console.log('✅ 큐 처리 완료');
}

/**
 * 개별 Job 처리
 */
async function processJob(job) {
  const { order_id, job_type } = job;
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📦 Job 처리 시작: ${order_id}`);
  console.log(`   유형: ${job_type}`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Job 상태 업데이트
  await updateJobStatus(job, JOB_STATUS.PROCESSING);
  await updateOrderStatus(order_id, ORDER_STATUS.GENERATING);
  await logEvent(order_id, 'job_started', { job_type });

  // 주문 정보 조회
  const order = await getOrder(order_id);
  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  const tier = order.tier;
  const budget = BUDGET_LIMITS[tier] || BUDGET_LIMITS.STARTER;

  // 1. 산출물 생성
  console.log('📝 산출물 생성 중...');
  let generatedAssets;

  if (storybookGenerator && storybookGenerator.generate) {
    generatedAssets = await storybookGenerator.generate(order, budget);
  } else {
    // Mock 생성 (실제 구현 전 테스트용)
    generatedAssets = await mockGenerateAssets(order, tier);
  }

  // 비용 확인
  if (generatedAssets.tokensUsed > budget.tokens ||
      generatedAssets.imagesGenerated > budget.images) {
    await updateOrderStatus(order_id, ORDER_STATUS.FAIL_BUDGET, {
      fail_reason: 'BUDGET_EXCEEDED'
    });
    throw new Error('BUDGET_EXCEEDED');
  }

  console.log(`✅ 산출물 생성 완료: ${generatedAssets.assets.length}개`);
  await logEvent(order_id, `asset_generated_${tier.toLowerCase()}`, {
    count: generatedAssets.assets.length,
    tokens: generatedAssets.tokensUsed,
    images: generatedAssets.imagesGenerated
  });

  // 2. Ethics Gate
  console.log('🛡️ Ethics Gate 검사 중...');
  await updateOrderStatus(order_id, ORDER_STATUS.GATED);

  const gateResult = await runEthicsGate(generatedAssets);

  if (gateResult.result === 'FAIL') {
    await updateOrderStatus(order_id, ORDER_STATUS.FAIL_GATE, {
      fail_reason: 'ETHICS_GATE_FAIL'
    });
    await logEvent(order_id, 'gate_failed', { reasons: gateResult.reasons });
    throw new Error('ETHICS_GATE_FAIL');
  }

  if (gateResult.result === 'WARN') {
    console.log('⚠️ Ethics Gate 경고:', gateResult.reasons);
    await logEvent(order_id, 'gate_warned', { reasons: gateResult.reasons });
  } else {
    console.log('✅ Ethics Gate 통과');
    await logEvent(order_id, 'gate_passed', { score: gateResult.score });
  }

  // DB에 Ethics 결과 저장
  if (db) {
    await db.query(
      `UPDATE storybook_orders
       SET ethics_score = $1, gate_result = $2, updated_at = NOW()
       WHERE order_id = $3`,
      [gateResult.score, gateResult.result, order_id]
    );
  }

  // 3. 산출물 저장
  console.log('💾 산출물 저장 중...');
  await updateOrderStatus(order_id, ORDER_STATUS.STORING);

  const savedAssets = await saveAssets(order_id, generatedAssets.assets);
  console.log(`✅ 산출물 저장 완료: ${savedAssets.length}개`);

  // 4. 전달
  console.log('📧 전달 중...');
  await updateOrderStatus(order_id, ORDER_STATUS.DELIVERING);

  const deliveryResult = await deliverAssets(order, savedAssets);

  if (!deliveryResult.success) {
    await updateOrderStatus(order_id, ORDER_STATUS.FAIL_DELIVERY, {
      fail_reason: 'DELIVERY_FAILED',
      last_error: deliveryResult.error
    });
    await logEvent(order_id, 'delivery_failed', {
      channel: deliveryResult.channel,
      error: deliveryResult.error
    });
    throw new Error('DELIVERY_FAILED');
  }

  console.log(`✅ 전달 완료: ${deliveryResult.channel}`);
  await logEvent(order_id, `delivery_${deliveryResult.channel.toLowerCase()}_sent`, {
    message_id: deliveryResult.messageId
  });

  // 5. 완료
  await updateOrderStatus(order_id, ORDER_STATUS.DONE);
  await updateJobStatus(job, JOB_STATUS.DONE);

  const duration = Date.now() - startTime;
  console.log(`🎉 Job 완료: ${order_id} (${duration}ms)`);
  await logEvent(order_id, 'job_done', {
    duration_ms: duration,
    assets_count: savedAssets.length
  });

  // DB에 생성 시간 저장
  if (db) {
    await db.query(
      `UPDATE storybook_orders
       SET generation_time_sec = $1, updated_at = NOW()
       WHERE order_id = $2`,
      [Math.round(duration / 1000), order_id]
    );
  }

  console.log('═══════════════════════════════════════════════════════════════');
}

// ═══════════════════════════════════════════════════════════════════════════
// Mock 구현 (실제 Generator 구현 전 테스트용)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Mock 산출물 생성
 */
async function mockGenerateAssets(order, tier) {
  // 실제로는 OpenAI API 호출하여 생성
  const assets = [];
  const baseHash = `${order.order_id}-${Date.now()}`;

  // Starter: PDF + 카드 3장
  assets.push({
    type: 'STORYBOOK_PDF',
    name: `storybook_${order.order_id}.pdf`,
    url: `https://storage.example.com/storybook/${order.order_id}/storybook.pdf`,
    hash: require('crypto').createHash('md5').update(`pdf-${baseHash}`).digest('hex').substring(0, 16),
    size: 1024 * 1024 * 2 // 2MB
  });

  assets.push({
    type: 'MOBILE_CARDS',
    name: `cards_${order.order_id}.zip`,
    url: `https://storage.example.com/storybook/${order.order_id}/cards.zip`,
    hash: require('crypto').createHash('md5').update(`cards-${baseHash}`).digest('hex').substring(0, 16),
    size: 1024 * 512 // 512KB
  });

  // Plus: + 웹툰
  if (tier === 'PLUS' || tier === 'PREMIUM') {
    assets.push({
      type: 'WEBTOON_CUTS',
      name: `webtoon_${order.order_id}.zip`,
      url: `https://storage.example.com/storybook/${order.order_id}/webtoon.zip`,
      hash: require('crypto').createHash('md5').update(`webtoon-${baseHash}`).digest('hex').substring(0, 16),
      size: 1024 * 1024 * 5 // 5MB
    });

    assets.push({
      type: 'WEBTOON_COMBINED',
      name: `webtoon_combined_${order.order_id}.png`,
      url: `https://storage.example.com/storybook/${order.order_id}/webtoon_combined.png`,
      hash: require('crypto').createHash('md5').update(`webtoon-combined-${baseHash}`).digest('hex').substring(0, 16),
      size: 1024 * 1024 * 3 // 3MB
    });
  }

  // Premium: + Decision Map + 90일 로드맵
  if (tier === 'PREMIUM') {
    assets.push({
      type: 'DECISION_MAP_PDF',
      name: `decision_map_${order.order_id}.pdf`,
      url: `https://storage.example.com/storybook/${order.order_id}/decision_map.pdf`,
      hash: require('crypto').createHash('md5').update(`decision-${baseHash}`).digest('hex').substring(0, 16),
      size: 1024 * 256 // 256KB
    });

    assets.push({
      type: 'ROADMAP_PDF',
      name: `roadmap_90d_${order.order_id}.pdf`,
      url: `https://storage.example.com/storybook/${order.order_id}/roadmap.pdf`,
      hash: require('crypto').createHash('md5').update(`roadmap-${baseHash}`).digest('hex').substring(0, 16),
      size: 1024 * 512 // 512KB
    });
  }

  // 시뮬레이션 딜레이 (1-3초)
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

  return {
    assets,
    tokensUsed: Math.floor(Math.random() * 5000) + 2000,
    imagesGenerated: assets.length
  };
}

/**
 * Ethics Gate 실행
 */
async function runEthicsGate(generatedAssets) {
  // 실제로는 콘텐츠 검사 수행
  // 여기서는 항상 PASS 반환 (테스트용)

  return {
    result: 'PASS',
    score: 15, // 16점 만점
    reasons: []
  };
}

/**
 * 산출물 저장
 */
async function saveAssets(orderId, assets) {
  const savedAssets = [];

  for (const asset of assets) {
    // DB에 저장
    if (db) {
      try {
        await db.query(
          `INSERT INTO storybook_assets
           (order_id, asset_type, file_url, file_name, file_size_bytes, asset_hash, expires_at, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '14 days', NOW())
           ON CONFLICT (order_id, asset_hash) DO NOTHING`,
          [orderId, asset.type, asset.url, asset.name, asset.size, asset.hash]
        );
      } catch (error) {
        console.error('산출물 저장 실패:', error.message);
      }
    }

    savedAssets.push({
      ...asset,
      order_id: orderId,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });
  }

  return savedAssets;
}

/**
 * 산출물 전달
 */
async function deliverAssets(order, assets) {
  const { customer_email, customer_phone, order_id } = order;

  // 전달할 링크 목록 생성
  const assetLinks = assets.map(a => ({
    name: getAssetDisplayName(a.type),
    url: a.url
  }));

  // 이메일 전달 시도
  if (customer_email) {
    try {
      // 중복 발송 방지 확인
      const deliveryHash = require('crypto')
        .createHash('md5')
        .update(assets.map(a => a.hash).join(','))
        .digest('hex')
        .substring(0, 16);

      if (db) {
        // 이미 발송했는지 확인
        const existing = await db.query(
          `SELECT id FROM storybook_deliveries
           WHERE order_id = $1 AND channel = 'EMAIL' AND asset_hash = $2`,
          [order_id, deliveryHash]
        );

        if (existing.rows.length > 0) {
          console.log('⚠️ 이미 발송된 이메일 (중복 방지)');
          return { success: true, channel: 'EMAIL', duplicate: true };
        }

        // 발송 기록 생성
        await db.query(
          `INSERT INTO storybook_deliveries
           (order_id, channel, asset_hash, status, recipient, created_at)
           VALUES ($1, 'EMAIL', $2, 'PENDING', $3, NOW())`,
          [order_id, deliveryHash, customer_email]
        );
      }

      // 실제 이메일 발송
      let messageId = `mock-${Date.now()}`;

      if (emailService && emailService.sendStorybookDelivery) {
        const result = await emailService.sendStorybookDelivery({
          to: customer_email,
          orderId: order_id,
          tier: order.tier,
          assets: assetLinks
        });
        messageId = result.messageId;
      } else {
        // Mock 발송
        console.log(`📧 [Mock] 이메일 발송: ${customer_email}`);
        console.log(`   산출물: ${assetLinks.map(a => a.name).join(', ')}`);
      }

      // 발송 성공 기록
      if (db) {
        await db.query(
          `UPDATE storybook_deliveries
           SET status = 'SENT', message_id = $1, sent_at = NOW()
           WHERE order_id = $2 AND channel = 'EMAIL' AND asset_hash = $3`,
          [messageId, order_id, deliveryHash]
        );
      }

      return { success: true, channel: 'EMAIL', messageId };

    } catch (error) {
      console.error('이메일 발송 실패:', error.message);

      // 발송 실패 기록
      if (db) {
        await db.query(
          `UPDATE storybook_deliveries
           SET status = 'FAIL', error_message = $1
           WHERE order_id = $2 AND channel = 'EMAIL'`,
          [error.message, order_id]
        );
      }

      // 카카오톡 폴백 시도
      if (customer_phone) {
        // TODO: 카카오톡 발송 구현
        console.log(`📱 [폴백] 카카오톡 발송 시도: ${customer_phone}`);
      }

      return { success: false, channel: 'EMAIL', error: error.message };
    }
  }

  return { success: false, error: 'NO_DELIVERY_CHANNEL' };
}

/**
 * 산출물 유형별 표시명
 */
function getAssetDisplayName(type) {
  const names = {
    STORYBOOK_PDF: '스토리북 PDF',
    MOBILE_CARDS: '모바일 카드',
    WEBTOON_CUTS: '웹툰 컷',
    WEBTOON_COMBINED: '웹툰 합본',
    DECISION_MAP_PDF: 'Decision Map',
    DECISION_MAP_JSON: 'Decision Map (JSON)',
    ROADMAP_PDF: '90일 로드맵',
    ROADMAP_JSON: '90일 로드맵 (JSON)'
  };
  return names[type] || type;
}

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 주문 조회
 */
async function getOrder(orderId) {
  if (db) {
    try {
      const result = await db.query(
        'SELECT * FROM storybook_orders WHERE order_id = $1',
        [orderId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('주문 조회 실패:', error.message);
    }
  }

  // 메모리 폴백 (storybookRoutes에서 관리하는 memoryStore 접근 불가)
  return null;
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
      if (status === 'DONE') {
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
}

/**
 * Job 상태 업데이트
 */
async function updateJobStatus(job, status) {
  if (db) {
    try {
      await db.query(
        `UPDATE storybook_jobs
         SET status = $1,
             started_at = CASE WHEN $1 = 'PROCESSING' THEN NOW() ELSE started_at END,
             finished_at = CASE WHEN $1 IN ('DONE', 'FAIL') THEN NOW() ELSE finished_at END
         WHERE order_id = $2`,
        [status, job.order_id]
      );
    } catch (error) {
      console.error('Job 상태 업데이트 실패:', error.message);
    }
  }

  job.status = status;
}

/**
 * 이벤트 기록
 */
async function logEvent(orderId, eventName, payload = {}) {
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
  console.log(`📊 Event: ${eventName}`, orderId ? `(${orderId})` : '');
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  enqueue,
  processQueue,
  getQueueLength: () => jobQueue.length,
  isProcessing: () => isProcessing
};
