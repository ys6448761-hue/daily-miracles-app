/**
 * 자동 응답 서비스
 *
 * 소원이들의 카카오톡 문의를 자동 분류하고 적절한 응답 발송
 *
 * @module services/autoResponseService
 * @version 1.0.0 - 2025.01.29
 */

const { classifyInquiry, checkEscalation, INQUIRY_TYPES } = require('../utils/inquiryClassifier');

// 메시지 발송 서비스
let messageProvider;
try {
  messageProvider = require('./messageProvider');
} catch (e) {
  console.warn('[AutoResponse] messageProvider 로드 실패:', e.message);
}

// Slack 알림 서비스 (선택적)
let slackService;
try {
  slackService = require('./slackBotService');
} catch (e) {
  console.warn('[AutoResponse] slackService 로드 실패 - 에스컬레이션 알림 비활성화');
}

// DB 서비스 (소원이 조회용)
let db;
try {
  db = require('../database/db');
} catch (e) {
  console.warn('[AutoResponse] DB 모듈 로드 실패');
}

// ============ 환경 설정 ============
const AUTO_RESPONSE_ENABLED = process.env.AUTO_RESPONSE_ENABLED !== 'false';
const ESCALATION_CHANNEL = process.env.ESCALATION_SLACK_CHANNEL || '#sowon-inquiries';
const URGENT_CHANNEL = process.env.URGENT_SLACK_CHANNEL || '#urgent';

// ============ 템플릿 정의 ============
const RESPONSE_TEMPLATES = {
  'status-check': {
    name: '분석 진행 상태',
    builder: buildStatusCheckResponse
  },
  'pdf-resend': {
    name: 'PDF 재발송',
    builder: buildPdfResendResponse
  },
  'travel-inquiry': {
    name: '여수여행 문의',
    builder: buildTravelInquiryResponse
  },
  'general-response': {
    name: '일반 응답',
    builder: buildGeneralResponse
  }
};

/**
 * 수신 메시지 처리 (메인 핸들러)
 *
 * @param {string} message - 수신 메시지
 * @param {string} senderPhone - 발신자 전화번호
 * @returns {Object} 처리 결과
 */
async function handleIncomingMessage(message, senderPhone) {
  const startTime = Date.now();

  console.log(`[AutoResponse] 메시지 수신:`, {
    phone: maskPhone(senderPhone),
    messagePreview: message.substring(0, 50)
  });

  // 1. 자동응답 활성화 확인
  if (!AUTO_RESPONSE_ENABLED) {
    console.log(`[AutoResponse] 자동응답 비활성화 상태`);
    return {
      handled: false,
      reason: 'AUTO_RESPONSE_DISABLED',
      processingTime: Date.now() - startTime
    };
  }

  // 2. 소원이 정보 조회
  const sowon = await getSowonByPhone(senderPhone);

  // 3. 문의 유형 분류
  const classification = classifyInquiry(message, {
    senderPhone,
    sowonData: sowon
  });

  console.log(`[AutoResponse] 분류 결과:`, {
    type: classification.type,
    confidence: classification.confidence,
    matchedKeywords: classification.matchedKeywords,
    autoResponse: classification.autoResponse
  });

  // 4. 에스컬레이션 체크
  const escalation = checkEscalation(message);

  // 5. 자동 응답 발송
  let responseResult = null;

  if (classification.autoResponse && classification.templateId) {
    responseResult = await sendAutoResponse(
      senderPhone,
      classification.templateId,
      { sowon, classification }
    );
  }

  // 6. 에스컬레이션 처리
  if (escalation.needed) {
    await escalateToTeam(message, senderPhone, sowon, classification, escalation);
  }

  // 7. 로그 저장
  await logAutoResponse(senderPhone, classification, responseResult, escalation);

  return {
    handled: classification.autoResponse,
    type: classification.type,
    templateId: classification.templateId,
    confidence: classification.confidence,
    escalated: escalation.needed,
    responseResult,
    processingTime: Date.now() - startTime
  };
}

/**
 * 자동 응답 발송
 */
async function sendAutoResponse(phone, templateId, context) {
  const template = RESPONSE_TEMPLATES[templateId];

  if (!template) {
    console.warn(`[AutoResponse] 알 수 없는 템플릿: ${templateId}`);
    return { success: false, reason: 'UNKNOWN_TEMPLATE' };
  }

  try {
    // 템플릿 내용 빌드
    const content = await template.builder(context);

    // SMS 발송 (알림톡 템플릿 미등록 시 SMS fallback)
    if (messageProvider && messageProvider.sendSensSMS) {
      const result = await messageProvider.sendSensSMS(phone, content);

      console.log(`[AutoResponse] 응답 발송 결과:`, {
        templateId,
        success: result.success,
        messageId: result.messageId
      });

      return result;
    }

    console.warn(`[AutoResponse] messageProvider 사용 불가`);
    return { success: false, reason: 'MESSAGE_PROVIDER_UNAVAILABLE' };

  } catch (error) {
    console.error(`[AutoResponse] 응답 발송 에러:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * 팀에게 에스컬레이션
 */
async function escalateToTeam(message, phone, sowon, classification, escalation) {
  const channel = escalation.alertLevel === 'RED' ? URGENT_CHANNEL : ESCALATION_CHANNEL;

  const alertText = `📬 ${escalation.alertLevel === 'RED' ? '🔴 긴급! ' : ''}새 문의 도착!

소원이: ${sowon?.name || '미등록'}
전화: ${maskPhone(phone)}
유형: ${INQUIRY_TYPES[classification.type]?.name || classification.type}

💬 내용:
"${message.substring(0, 200)}${message.length > 200 ? '...' : ''}"

📌 사유: ${escalation.reason}
${escalation.afterAutoResponse ? '(자동응답 발송 완료)' : '(자동응답 불가 - 수동 대응 필요)'}

24시간 내 응답 필요!`;

  console.log(`[AutoResponse] 에스컬레이션:`, {
    channel,
    alertLevel: escalation.alertLevel,
    type: classification.type
  });

  // Slack 알림
  if (slackService && slackService.sendNotification) {
    try {
      await slackService.sendNotification({
        channel,
        text: alertText
      });
    } catch (e) {
      console.error(`[AutoResponse] Slack 알림 실패:`, e.message);
    }
  }

  // 긴급 알림 (RED인 경우)
  if (escalation.alertLevel === 'RED' && messageProvider) {
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      await messageProvider.sendSensSMS(adminPhone, `[긴급] RED 문의!
${sowon?.name || '미등록'}
"${message.substring(0, 50)}..."
즉시 확인 필요!`);
    }
  }
}

/**
 * 응답 로그 저장
 */
async function logAutoResponse(phone, classification, responseResult, escalation) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    phone: maskPhone(phone),
    classification: {
      type: classification.type,
      confidence: classification.confidence
    },
    autoResponse: {
      sent: !!responseResult?.success,
      templateId: classification.templateId
    },
    escalation: {
      needed: escalation.needed,
      alertLevel: escalation.alertLevel
    }
  };

  console.log(`[AutoResponse] 처리 로그:`, logEntry);

  // DB 저장 (선택적)
  if (db) {
    try {
      await db.query(`
        INSERT INTO marketing_events (event_type, event_date, payload, source)
        VALUES ($1, CURRENT_DATE, $2, $3)
      `, [
        'auto_response',
        JSON.stringify(logEntry),
        'autoResponseService'
      ]);
    } catch (e) {
      console.warn(`[AutoResponse] 로그 저장 실패:`, e.message);
    }
  }
}

/**
 * 소원이 정보 조회 (전화번호로)
 */
async function getSowonByPhone(phone) {
  if (!db || !phone) return null;

  try {
    const normalizedPhone = phone.replace(/[^0-9]/g, '');
    const result = await db.query(`
      SELECT id, name, email, traffic_light, miracle_score, created_at
      FROM wishes
      WHERE phone = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [normalizedPhone]);

    return result.rows[0] || null;
  } catch (e) {
    console.warn(`[AutoResponse] 소원이 조회 실패:`, e.message);
    return null;
  }
}

/**
 * 미응답 문의 체크 (스케줄러용)
 */
async function checkUnansweredInquiries(hoursThreshold = 24) {
  if (!db) {
    console.warn(`[AutoResponse] DB 없음 - 미응답 체크 스킵`);
    return { unanswered: [], count: 0 };
  }

  try {
    // 에스컬레이션 로그 중 미처리 건 조회
    const result = await db.query(`
      SELECT payload
      FROM marketing_events
      WHERE event_type = 'auto_response'
        AND created_at > NOW() - INTERVAL '${hoursThreshold} hours'
        AND payload->>'escalation'->>'needed' = 'true'
      ORDER BY created_at DESC
    `);

    const unanswered = result.rows.map(r => JSON.parse(r.payload));

    if (unanswered.length > 0) {
      console.log(`[AutoResponse] 미응답 문의 ${unanswered.length}건 발견`);

      // 긴급 알림
      if (slackService) {
        await slackService.sendNotification({
          channel: URGENT_CHANNEL,
          text: `🚨 미응답 문의 ${unanswered.length}건!
@channel 확인 필요`
        });
      }
    }

    return { unanswered, count: unanswered.length };
  } catch (e) {
    console.error(`[AutoResponse] 미응답 체크 에러:`, e.message);
    return { unanswered: [], count: 0, error: e.message };
  }
}

// ============ 템플릿 빌더 함수들 ============

/**
 * 분석 진행 상태 응답
 */
async function buildStatusCheckResponse(context) {
  const { sowon } = context;
  const name = sowon?.name || '고객';

  // 상태 확인 (DB에서 조회 가능)
  let status = '분석 중';
  let estimatedTime = '24시간 이내';

  if (sowon?.traffic_light === 'GREEN') {
    status = '분석 완료';
    estimatedTime = '이미 완료됨';
  }

  return `[하루하루의 기적] 분석 진행 안내

안녕하세요, ${name}님!

현재 분석 상태: ${status}
예상 완료 시간: ${estimatedTime}

분석이 완료되면 카카오톡으로 안내드리겠습니다.
궁금한 점이 있으시면 언제든 문의해주세요!

- 하루하루의 기적 드림
문의: 1899-6117`;
}

/**
 * PDF 재발송 응답
 */
async function buildPdfResendResponse(context) {
  const { sowon } = context;
  const name = sowon?.name || '고객';
  const email = sowon?.email ? `(${sowon.email})` : '';

  return `[하루하루의 기적] PDF 재발송 안내

안녕하세요, ${name}님!

요청하신 분석 결과 PDF를 재발송해드렸습니다.
이메일${email}을 확인해주세요.

※ 스팸함도 함께 확인 부탁드립니다!
※ 10분 내 수신되지 않으면 다시 문의해주세요.

- 하루하루의 기적 드림
문의: 1899-6117`;
}

/**
 * 여수여행 문의 응답
 */
async function buildTravelInquiryResponse(context) {
  const { sowon } = context;
  const name = sowon?.name || '고객';

  return `[하루하루의 기적] 여수기적여행 안내

안녕하세요, ${name}님!

여수기적여행에 관심 가져주셔서 감사합니다!

📍 인기 패키지: 소원3합 패키지
💰 가격: 1인 15만원~
📅 예약 가능: 상시 (주말 인기)

자세한 견적을 원하시면 아래 정보를 알려주세요:
- 희망 날짜
- 인원수
- 선호 숙소 타입

담당자가 24시간 내 연락드리겠습니다!

- 여수 소원항해
문의: 1899-6117`;
}

/**
 * 일반 응답
 */
async function buildGeneralResponse(context) {
  const { sowon } = context;
  const name = sowon?.name || '고객';

  return `[하루하루의 기적] 문의 접수 안내

안녕하세요, ${name}님!

문의가 접수되었습니다.
담당자가 확인 후 빠르게 답변드리겠습니다.

평균 응답 시간: 24시간 이내

급한 문의는 전화로 연락 부탁드립니다.
📞 1899-6117

- 하루하루의 기적 드림`;
}

/**
 * 전화번호 마스킹
 */
function maskPhone(phone) {
  if (!phone || phone.length < 8) return '****';
  return `${phone.substring(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 서비스 상태 확인
 */
function getServiceStatus() {
  return {
    enabled: AUTO_RESPONSE_ENABLED,
    messageProviderAvailable: !!messageProvider,
    slackAvailable: !!slackService,
    dbAvailable: !!db,
    templates: Object.keys(RESPONSE_TEMPLATES)
  };
}

module.exports = {
  handleIncomingMessage,
  sendAutoResponse,
  escalateToTeam,
  checkUnansweredInquiries,
  getSowonByPhone,
  getServiceStatus,
  RESPONSE_TEMPLATES
};
