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

// Solapi 서비스 (카카오 알림톡 + SMS)
let solapiService = null;
try {
  solapiService = require('./solapiService');
  console.log('✅ StorybookQueue: Solapi 서비스 로드 성공');
} catch (error) {
  console.warn('⚠️ StorybookQueue: Solapi 서비스 로드 실패');
}

// CEO 알림 설정
const CEO_PHONE = process.env.CEO_PHONE || process.env.CRO_PHONE;
const ALERT_COOLDOWN_MS = 15 * 60 * 1000; // 15분
const alertHistory = new Map(); // severity:order_id:error_code -> lastAlertTime

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

// Revision 유형
const REVISION_TYPES = {
  REGEN_IMAGE: 'REGEN_IMAGE',   // 이미지 재생성
  EDIT_TEXT: 'EDIT_TEXT',       // 텍스트 수정
  REWRITE_DOC: 'REWRITE_DOC'    // 문서 전체 재작성
};

// Revision 대상 문서
const TARGET_DOCS = {
  STORYBOOK: 'STORYBOOK',
  WEBTOON: 'WEBTOON',
  DECISION_MAP: 'DECISION_MAP',
  ROADMAP: 'ROADMAP'
};

// 티어별 비용 상한
const BUDGET_LIMITS = {
  STARTER: { tokens: 10000, images: 5 },
  PLUS: { tokens: 15000, images: 12 },
  PREMIUM: { tokens: 25000, images: 12 }
};

// 큐 저장소
const jobQueue = [];
const revisionQueue = [];
let isProcessing = false;
let isRevisionProcessing = false;

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

      // 이벤트 기록
      await logEvent(order_id, 'delivery_failed', { channel: 'EMAIL', error: error.message });

      // ═══════════════════════════════════════════════════════════════
      // 카카오톡 폴백 시도 (Phase 2-1)
      // ═══════════════════════════════════════════════════════════════
      if (customer_phone) {
        console.log(`📱 [폴백] 카카오톡 발송 시도: ${customer_phone}`);

        const kakaoResult = await sendKakaoFallback(order, assets, deliveryHash);
        if (kakaoResult.success) {
          return kakaoResult;
        }
      }

      return { success: false, channel: 'EMAIL', error: error.message };
    }
  }

  // 이메일 없이 전화번호만 있는 경우 → 카카오 직접 발송
  if (customer_phone) {
    const deliveryHash = require('crypto')
      .createHash('md5')
      .update(assets.map(a => a.hash).join(','))
      .digest('hex')
      .substring(0, 16);

    return await sendKakaoFallback(order, assets, deliveryHash);
  }

  return { success: false, error: 'NO_DELIVERY_CHANNEL' };
}

/**
 * 카카오톡 폴백 발송 (링크-only)
 */
async function sendKakaoFallback(order, assets, deliveryHash) {
  const { customer_phone, order_id, tier } = order;

  // 전달할 링크 목록 생성
  const assetLinks = assets.map(a => ({
    name: getAssetDisplayName(a.type),
    url: a.url
  }));

  try {
    // 중복 발송 방지 확인
    if (db) {
      const existing = await db.query(
        `SELECT id FROM storybook_deliveries
         WHERE order_id = $1 AND channel = 'KAKAO' AND asset_hash = $2`,
        [order_id, deliveryHash]
      );

      if (existing.rows.length > 0) {
        console.log('⚠️ 이미 발송된 카카오톡 (중복 방지)');
        return { success: true, channel: 'KAKAO', duplicate: true };
      }

      // 발송 기록 생성
      await db.query(
        `INSERT INTO storybook_deliveries
         (order_id, channel, asset_hash, status, recipient, created_at)
         VALUES ($1, 'KAKAO', $2, 'PENDING', $3, NOW())`,
        [order_id, deliveryHash, customer_phone]
      );
    }

    // 카카오톡 메시지 구성 (링크-only)
    const tierName = { STARTER: '스타터', PLUS: '플러스', PREMIUM: '프리미엄' }[tier] || tier;
    const linkList = assetLinks.map(a => `• ${a.name}: ${a.url}`).join('\n');

    const messageText = `[하루하루의 기적] 스토리북 완성!

주문번호: ${order_id}
상품: ${tierName}

📥 다운로드 링크:
${linkList}

※ 링크는 14일간 유효합니다.
문의: 1899-6117`;

    let messageId = `kakao-mock-${Date.now()}`;

    if (solapiService && solapiService.sendSMS) {
      // SMS로 발송 (알림톡 템플릿 없는 경우)
      const result = await solapiService.sendSMS(customer_phone, messageText);
      messageId = result.messageId || result.groupId || messageId;
      console.log(`📱 카카오/SMS 발송 성공: ${messageId}`);
    } else {
      // Mock 발송
      console.log(`📱 [Mock] 카카오톡 발송: ${customer_phone}`);
      console.log(`   산출물: ${assetLinks.map(a => a.name).join(', ')}`);
    }

    // 발송 성공 기록
    if (db) {
      await db.query(
        `UPDATE storybook_deliveries
         SET status = 'SENT', message_id = $1, sent_at = NOW()
         WHERE order_id = $2 AND channel = 'KAKAO' AND asset_hash = $3`,
        [messageId, order_id, deliveryHash]
      );
    }

    // 이벤트 기록
    await logEvent(order_id, 'delivery_kakao_sent', { message_id: messageId });

    return { success: true, channel: 'KAKAO', messageId };

  } catch (error) {
    console.error('카카오톡 발송 실패:', error.message);

    // 발송 실패 기록
    if (db) {
      await db.query(
        `UPDATE storybook_deliveries
         SET status = 'FAIL', error_message = $1
         WHERE order_id = $2 AND channel = 'KAKAO'`,
        [error.message, order_id]
      );
    }

    // 이벤트 기록
    await logEvent(order_id, 'delivery_failed', { channel: 'KAKAO', error: error.message });

    return { success: false, channel: 'KAKAO', error: error.message };
  }
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
// RED 알림 시스템 (SEV1) - Phase 2-1
// ═══════════════════════════════════════════════════════════════════════════

/**
 * RED 알림 발송 (SEV1)
 *
 * 발송 조건:
 *   - FAIL_* 상태로 종결
 *   - Gate FAIL
 *   - 결제 후 SLA*2 초과 미종결
 *
 * 피로도 제어:
 *   - severity:order_id:error_code 기준 15분 쿨다운
 *   - 동일 에러 반복 시 추가 알림 없음
 */
async function sendRedAlert(orderId, errorCode, details = {}) {
  // CEO 전화번호 확인
  if (!CEO_PHONE) {
    console.warn('⚠️ CEO_PHONE 미설정 - RED 알림 건너뜀');
    return { success: false, reason: 'NO_CEO_PHONE' };
  }

  // 피로도 제어: 쿨다운 확인
  const alertKey = `SEV1:${orderId}:${errorCode}`;
  const lastAlertTime = alertHistory.get(alertKey);

  if (lastAlertTime && (Date.now() - lastAlertTime) < ALERT_COOLDOWN_MS) {
    console.log(`⏸️ RED 알림 쿨다운 중: ${alertKey}`);
    return { success: false, reason: 'COOLDOWN', key: alertKey };
  }

  try {
    // 알림 메시지 구성
    const alertText = `🔴 [스토리북 SEV1 알림]

주문: ${orderId}
에러: ${errorCode}
시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

상세:
${JSON.stringify(details, null, 2).substring(0, 200)}

📊 대시보드 확인:
https://daily-miracles-app.onrender.com/api/storybook/orders/${orderId}`;

    let messageId = `alert-mock-${Date.now()}`;

    if (solapiService && solapiService.sendSMS) {
      const result = await solapiService.sendSMS(CEO_PHONE, alertText);
      messageId = result.messageId || result.groupId || messageId;
      console.log(`🔴 RED 알림 발송 완료: ${messageId}`);
    } else {
      console.log(`🔴 [Mock] RED 알림 발송: ${CEO_PHONE}`);
      console.log(`   주문: ${orderId}, 에러: ${errorCode}`);
    }

    // 쿨다운 기록
    alertHistory.set(alertKey, Date.now());

    // 이벤트 기록
    await logEvent(orderId, 'red_alert_sent', {
      error_code: errorCode,
      message_id: messageId,
      to: CEO_PHONE.substring(0, 3) + '****'
    });

    return { success: true, messageId };

  } catch (error) {
    console.error('RED 알림 발송 실패:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * FAIL 상태 발생 시 RED 알림 트리거
 */
async function triggerFailAlert(orderId, status, extra = {}) {
  // FAIL_* 상태만 처리
  if (!status.startsWith('FAIL_')) {
    return;
  }

  const errorCode = extra.fail_reason || status;
  await sendRedAlert(orderId, errorCode, {
    status,
    fail_reason: extra.fail_reason,
    last_error: extra.last_error
  });
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

  // FAIL_* 상태 시 RED 알림 트리거
  if (status.startsWith('FAIL_')) {
    await triggerFailAlert(orderId, status, extra);
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
// Phase 2-3: Revision 처리
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Revision Job을 큐에 추가
 */
function enqueueRevision(revision) {
  revisionQueue.push(revision);
  console.log(`📥 Revision 큐 추가: ${revision.revision_id} (큐 길이: ${revisionQueue.length})`);

  // 자동 처리 시작
  if (!isRevisionProcessing) {
    processRevisionQueue();
  }
}

/**
 * Revision 큐 처리 (FIFO)
 */
async function processRevisionQueue() {
  if (isRevisionProcessing || revisionQueue.length === 0) {
    return;
  }

  isRevisionProcessing = true;
  console.log('🔄 Revision 큐 처리 시작');

  while (revisionQueue.length > 0) {
    const revision = revisionQueue.shift();

    try {
      await processRevisionJob(revision);
    } catch (error) {
      console.error(`💥 Revision 처리 실패: ${revision.revision_id}`, error.message);

      // Revision 실패 처리
      await updateRevisionStatus(revision.revision_id, 'FAIL', error.message);
      await logEvent(revision.order_id, 'revision_failed', {
        revision_id: revision.revision_id,
        error: error.message
      });
    }
  }

  isRevisionProcessing = false;
  console.log('✅ Revision 큐 처리 완료');
}

/**
 * 개별 Revision 처리
 */
async function processRevisionJob(revision) {
  const { revision_id, order_id, target_doc, revision_type, user_request } = revision;
  const startTime = Date.now();

  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`🔧 Revision 처리 시작: ${revision_id}`);
  console.log(`   주문: ${order_id}`);
  console.log(`   대상: ${target_doc} / 유형: ${revision_type}`);
  console.log(`   요청: ${user_request?.substring(0, 50)}...`);
  console.log('═══════════════════════════════════════════════════════════════');

  // Revision 상태: PROCESSING
  await updateRevisionStatus(revision_id, 'PROCESSING');
  await logEvent(order_id, 'revision_started', {
    revision_id,
    target_doc,
    revision_type
  });

  // 주문 정보 조회
  const order = await getOrder(order_id);
  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }

  // 1. Revision 실행 (유형별 처리)
  let revisedAsset;
  switch (revision_type) {
    case REVISION_TYPES.REGEN_IMAGE:
      revisedAsset = await executeRegenImage(order, target_doc, user_request);
      break;
    case REVISION_TYPES.EDIT_TEXT:
      revisedAsset = await executeEditText(order, target_doc, user_request);
      break;
    case REVISION_TYPES.REWRITE_DOC:
      revisedAsset = await executeRewriteDoc(order, target_doc, user_request);
      break;
    default:
      throw new Error(`UNKNOWN_REVISION_TYPE: ${revision_type}`);
  }

  console.log('✅ Revision 생성 완료');

  // 2. 새 산출물 저장
  const savedAssets = await saveAssets(order_id, [revisedAsset]);
  console.log(`✅ 수정된 산출물 저장 완료`);

  // 3. 수정 완료 알림 발송 (이메일)
  await sendRevisionNotification(order, revisedAsset, revision_id);
  console.log('✅ 수정 완료 알림 발송');

  // 4. 완료 처리
  await updateRevisionStatus(revision_id, 'DONE');

  const duration = Date.now() - startTime;
  console.log(`🎉 Revision 완료: ${revision_id} (${duration}ms)`);
  await logEvent(order_id, 'revision_completed', {
    revision_id,
    target_doc,
    revision_type,
    duration_ms: duration
  });

  console.log('═══════════════════════════════════════════════════════════════');
  return { success: true, revision_id, duration };
}

/**
 * Revision 상태 업데이트
 */
async function updateRevisionStatus(revisionId, status, error = null) {
  if (db) {
    try {
      const completedAt = status === 'DONE' || status === 'FAIL' ? 'NOW()' : 'NULL';
      await db.query(
        `UPDATE storybook_revisions
         SET status = $1, completed_at = ${completedAt}
         WHERE revision_id = $2`,
        [status, revisionId]
      );
    } catch (err) {
      console.error('Revision 상태 업데이트 실패:', err.message);
    }
  }
}

/**
 * 이미지 재생성 실행
 */
async function executeRegenImage(order, targetDoc, userRequest) {
  console.log(`📸 이미지 재생성: ${targetDoc}`);

  // Mock 구현 (실제로는 OpenAI DALL-E 호출)
  await sleep(800); // 생성 시뮬레이션

  const assetType = getAssetTypeForDoc(targetDoc);
  const hash = `regen-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  return {
    type: assetType,
    url: `https://storage.example.com/storybook/${order.order_id}/revised_${targetDoc.toLowerCase()}_${Date.now()}.png`,
    hash: hash,
    metadata: {
      revision_type: 'REGEN_IMAGE',
      user_request: userRequest,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * 텍스트 수정 실행
 */
async function executeEditText(order, targetDoc, userRequest) {
  console.log(`📝 텍스트 수정: ${targetDoc}`);

  // Mock 구현 (실제로는 OpenAI GPT 호출)
  await sleep(600);

  const assetType = getAssetTypeForDoc(targetDoc);
  const hash = `edit-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  return {
    type: assetType,
    url: `https://storage.example.com/storybook/${order.order_id}/edited_${targetDoc.toLowerCase()}_${Date.now()}.pdf`,
    hash: hash,
    metadata: {
      revision_type: 'EDIT_TEXT',
      user_request: userRequest,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * 문서 전체 재작성 실행
 */
async function executeRewriteDoc(order, targetDoc, userRequest) {
  console.log(`📄 문서 재작성: ${targetDoc}`);

  // Mock 구현 (실제로는 전체 파이프라인 재실행)
  await sleep(1200);

  const assetType = getAssetTypeForDoc(targetDoc);
  const hash = `rewrite-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  return {
    type: assetType,
    url: `https://storage.example.com/storybook/${order.order_id}/rewritten_${targetDoc.toLowerCase()}_${Date.now()}.pdf`,
    hash: hash,
    metadata: {
      revision_type: 'REWRITE_DOC',
      user_request: userRequest,
      generated_at: new Date().toISOString()
    }
  };
}

/**
 * 대상 문서에 맞는 asset type 반환
 */
function getAssetTypeForDoc(targetDoc) {
  switch (targetDoc) {
    case 'STORYBOOK':
      return 'STORYBOOK_PDF';
    case 'WEBTOON':
      return 'WEBTOON_COMBINED';
    case 'DECISION_MAP':
      return 'DECISION_MAP_PDF';
    case 'ROADMAP':
      return 'ROADMAP_PDF';
    default:
      return 'STORYBOOK_PDF';
  }
}

/**
 * 수정 완료 알림 발송
 */
async function sendRevisionNotification(order, asset, revisionId) {
  const { customer_email, customer_phone, order_id } = order;

  // 이메일 발송 시도
  if (emailService && customer_email) {
    try {
      const emailResult = await emailService.sendRevisionComplete({
        to: customer_email,
        orderId: order_id,
        revisionId,
        downloadUrl: asset.url
      });
      console.log(`📧 수정 완료 이메일 발송: ${customer_email}`);
      return;
    } catch (error) {
      console.error('이메일 발송 실패:', error.message);
    }
  }

  // 카카오/SMS 폴백
  if (solapiService && customer_phone) {
    try {
      const message = `[하루하루의 기적]\n수정이 완료되었습니다!\n\n주문번호: ${order_id}\n수정번호: ${revisionId}\n\n📥 다운로드:\n${asset.url}\n\n※ 링크는 14일간 유효합니다.`;

      const smsResult = await solapiService.sendSMS({
        to: customer_phone,
        text: message
      });

      console.log(`📱 수정 완료 SMS 발송: ${customer_phone.substring(0, 3)}****`);
      await logEvent(order_id, 'revision_notification_sent', {
        channel: 'SMS',
        revision_id: revisionId
      });
    } catch (error) {
      console.error('SMS 발송 실패:', error.message);
    }
  }
}

/**
 * Revision 조회
 */
async function getRevision(revisionId) {
  if (db) {
    try {
      const result = await db.query(
        'SELECT * FROM storybook_revisions WHERE revision_id = $1',
        [revisionId]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Revision 조회 실패:', error.message);
    }
  }
  return null;
}

/**
 * 대기 함수
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  enqueue,
  processQueue,
  getQueueLength: () => jobQueue.length,
  isProcessing: () => isProcessing,
  // Phase 2-1 추가
  sendRedAlert,
  triggerFailAlert,
  sendKakaoFallback,
  // Phase 2-3 추가: Revision
  enqueueRevision,
  processRevisionQueue,
  getRevision,
  getRevisionQueueLength: () => revisionQueue.length,
  isRevisionProcessing: () => isRevisionProcessing
};
