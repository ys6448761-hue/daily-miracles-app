/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Wish Intake Service - WISH 7문항 대화형 인입 시스템
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * P0-01: Airtable SSOT Sessions/Messages 스키마 + CRUD
 * P0-02: WISH 7문항 대화 플로우
 * P0-03: 🔴/🟡 게이트 + pause_flow
 *
 * 테이블:
 * - Wish Intake Sessions: 세션 관리 (상태 전이)
 * - Wish Intake Messages: 개별 Q&A 저장
 *
 * 작성일: 2026-01-17
 * ═══════════════════════════════════════════════════════════════════════════
 */

const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════════════════
// Slack 알림 서비스 (P0-04)
// ═══════════════════════════════════════════════════════════════════════════

let slackService = null;
try {
  slackService = require('./wishIntakeSlackService');
  console.log('✅ Wish Intake Slack 서비스 로드 성공');
} catch (error) {
  console.warn('⚠️ Wish Intake Slack 서비스 로드 실패 (알림 비활성화):', error.message);
}

// ═══════════════════════════════════════════════════════════════════════════
// 환경 설정
// ═══════════════════════════════════════════════════════════════════════════

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

const TABLES = {
  SESSIONS: process.env.AIRTABLE_TABLE_SESSIONS || 'Wish Intake Sessions',
  MESSAGES: process.env.AIRTABLE_TABLE_MESSAGES || 'Wish Intake Messages'
};

// ═══════════════════════════════════════════════════════════════════════════
// DEC-2026-0117-002: WISH 7문항 정의 (변경 금지)
// ═══════════════════════════════════════════════════════════════════════════

const WISH_QUESTIONS = [
  {
    id: 'Q1',
    key: 'WISH_1L',
    display: '지금 가장 이루고 싶은 소원을 한 문장으로 적어주세요.',
    guide: '짧아도 괜찮아요. 떠오르는 그대로요.',
    order: 1
  },
  {
    id: 'Q2',
    key: 'WHY_NOW',
    display: '그 소원이 지금 당신에게 중요한 이유는 뭐예요?',
    guide: '사연이 길어도 좋아요. 핵심만 적어도 좋아요.',
    order: 2
  },
  {
    id: 'Q3',
    key: 'CONTEXT_NOW',
    display: '현재 상황을 짧게 알려주세요. 주로 어떤 영역과 관련 있나요?',
    guide: '예: 관계/일·커리어/건강/돈/자기감정',
    order: 3
  },
  {
    id: 'Q4',
    key: 'BLOCKER',
    display: '지금 가장 큰 걸림돌/걱정은 무엇인가요?',
    guide: '현실적인 장애물이든, 마음속 두려움이든 괜찮아요.',
    order: 4
  },
  {
    id: 'Q5',
    key: 'EMOTION_SCALE',
    display: '지금 마음 상태를 0~10점으로 매기면 몇 점이에요? 그리고 한 단어로 표현하면?',
    guide: '예시: "6점, 불안"',
    order: 5
  },
  {
    id: 'Q6',
    key: 'RESOURCE',
    display: '지금 당신에게 도움이 되는 자원/사람/습관이 있나요?',
    guide: '작은 것이라도 좋아요. 없다면 "없음"도 괜찮아요.',
    order: 6
  },
  {
    id: 'Q7',
    key: 'NEXT_24H',
    display: '24시간 안에 할 수 있는 "가장 작은 한 걸음"은 뭐예요?',
    guide: '없다면 "없음"이라고 적어도 괜찮아요.',
    order: 7
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// 세션 상태 정의
// ═══════════════════════════════════════════════════════════════════════════

const SESSION_STATUS = {
  CREATED: 'CREATED',           // 세션 생성됨
  IN_PROGRESS: 'IN_PROGRESS',   // 질문 진행 중
  PAUSED: 'PAUSED',             // 일시 중지 (🔴 감지)
  REVIEW_NEEDED: 'REVIEW_NEEDED', // 검토 필요 (🟡 감지)
  COMPLETED: 'COMPLETED',       // 모든 질문 완료
  SUMMARIZED: 'SUMMARIZED',     // 요약 생성 완료
  CANCELLED: 'CANCELLED'        // 사용자 취소
};

// 상태 전이 규칙
const VALID_TRANSITIONS = {
  [SESSION_STATUS.CREATED]: [SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.CANCELLED],
  [SESSION_STATUS.IN_PROGRESS]: [SESSION_STATUS.PAUSED, SESSION_STATUS.REVIEW_NEEDED, SESSION_STATUS.COMPLETED, SESSION_STATUS.CANCELLED],
  [SESSION_STATUS.PAUSED]: [SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.CANCELLED],
  [SESSION_STATUS.REVIEW_NEEDED]: [SESSION_STATUS.IN_PROGRESS, SESSION_STATUS.PAUSED, SESSION_STATUS.CANCELLED],
  [SESSION_STATUS.COMPLETED]: [SESSION_STATUS.SUMMARIZED],
  [SESSION_STATUS.SUMMARIZED]: [],
  [SESSION_STATUS.CANCELLED]: []
};

// ═══════════════════════════════════════════════════════════════════════════
// DEC-2026-0117-003: 리스크 게이트
// ═══════════════════════════════════════════════════════════════════════════

const RISK_PATTERNS = {
  // 🔴 즉시 중단 패턴
  RED: {
    selfHarm: [
      /죽고\s*싶/,
      /자살/,
      /자해/,
      /목숨/,
      /끝내고\s*싶/,
      /생을\s*마감/
    ],
    violence: [
      /죽이겠/,
      /때리겠/,
      /폭행/,
      /학대/,
      /협박/
    ],
    illegal: [
      /마약/,
      /사기/,
      /불법\s*촬영/,
      /몰카/
    ],
    hate: [
      /혐오/,
      /비하/,
      /폭력\s*선동/
    ]
  },
  // 🟡 검토 필요 패턴
  YELLOW: {
    medical: [
      /진단해\s*줘/,
      /치료해\s*줘/,
      /약\s*추천/,
      /처방/
    ],
    manipulation: [
      /통제/,
      /복수/,
      /협박\s*메시지/,
      /조작/
    ],
    vulnerable: [
      /미성년/,
      /초등학생/,
      /중학생/,
      /고등학생/
    ]
  }
};

// 오탐 방지 패턴
const FALSE_POSITIVE_PATTERNS = [
  /싶지\s*않/,     // 부정문: "죽고 싶지 않다"
  /하지\s*않/,
  /안\s*할/,
  /["'「」].*["'」]/, // 인용문
  /했었/,           // 과거형
  /했다고/
];

// ═══════════════════════════════════════════════════════════════════════════
// Airtable API 헬퍼
// ═══════════════════════════════════════════════════════════════════════════

async function airtableRequest(tableName, method = 'GET', body = null, recordId = null, queryParams = '') {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.warn('[WishIntake] API 키 미설정 - 시뮬레이션 모드');
    return { success: false, simulated: true, reason: 'API_KEY_MISSING' };
  }

  let url = recordId
    ? `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}/${recordId}`
    : `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(tableName)}`;

  if (queryParams) {
    url += `?${queryParams}`;
  }

  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json; charset=utf-8'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
    // PATCH 요청 시 body 로깅 (민감정보 제외)
    if (method === 'PATCH') {
      console.log(`[WishIntake] Airtable PATCH: ${tableName}/${recordId}`, JSON.stringify(body.fields || body));
    }
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      console.error(`[WishIntake] Airtable ${method} 오류:`, data.error);
      return { success: false, error: data.error };
    }

    return { success: true, data };
  } catch (error) {
    console.error(`[WishIntake] Airtable ${method} 실패:`, error.message);
    return { success: false, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ID 생성 유틸
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 세션 ID 생성 (session_yyyymmdd_xxxxx)
 */
function generateSessionId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(4).toString('hex');
  return `session_${date}_${random}`;
}

/**
 * 메시지 ID 생성 (msg_xxxxx)
 */
function generateMessageId() {
  return `msg_${crypto.randomBytes(6).toString('hex')}`;
}

/**
 * Idempotency 키 생성 (channel + user + timestamp)
 */
function generateIdempotencyKey(channel, userId) {
  const timestamp = Math.floor(Date.now() / 1000); // 초 단위
  return crypto.createHash('sha256')
    .update(`${channel}:${userId}:${timestamp}`)
    .digest('hex')
    .substring(0, 32);
}

/**
 * Correlation ID 생성 (세션 전체 추적용)
 */
function generateCorrelationId() {
  return `corr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 리스크 감지 (DEC-003)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 텍스트 리스크 분석
 * @param {string} text - 분석할 텍스트
 * @returns {Object} { level: 'RED'|'YELLOW'|'GREEN', reasons: [], falsePositive: boolean }
 */
function analyzeRisk(text) {
  if (!text || text.trim().length === 0) {
    return { level: 'GREEN', reasons: [], falsePositive: false };
  }

  const normalizedText = text.toLowerCase();
  const reasons = [];

  // 오탐 방지 체크
  const isFalsePositive = FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(normalizedText));

  // 🔴 RED 패턴 체크
  for (const [category, patterns] of Object.entries(RISK_PATTERNS.RED)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        // 오탐 방지: 부정문/인용/과거형이면 YELLOW로 다운그레이드
        if (isFalsePositive) {
          reasons.push(`[${category}] 패턴 감지 (오탐 가능성)`);
          continue;
        }
        reasons.push(`[RED:${category}] ${pattern.toString()}`);
        return { level: 'RED', reasons, falsePositive: false };
      }
    }
  }

  // 🟡 YELLOW 패턴 체크
  for (const [category, patterns] of Object.entries(RISK_PATTERNS.YELLOW)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedText)) {
        reasons.push(`[YELLOW:${category}] ${pattern.toString()}`);
      }
    }
  }

  if (reasons.length > 0) {
    return { level: 'YELLOW', reasons, falsePositive: isFalsePositive };
  }

  return { level: 'GREEN', reasons: [], falsePositive: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// Sessions CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 새 세션 생성
 * @param {Object} params - { channel, userId, userName, source }
 * @returns {Object} 생성된 세션 정보
 */
async function createSession(params) {
  const { channel = 'web', userId, userName = '', source = 'direct' } = params;

  const sessionId = generateSessionId();
  const correlationId = generateCorrelationId();
  const idempotencyKey = generateIdempotencyKey(channel, userId);

  const fields = {
    session_id: sessionId,
    correlation_id: correlationId,
    idempotency_key: idempotencyKey,
    user_id: userId || '',
    user_name: userName,
    channel: channel,
    source: source,
    run_status: SESSION_STATUS.CREATED,
    current_question: 1,
    answered_count: 0,
    progress: 0,
    pause_flow: false,
    risk_level: 'GREEN',
    risk_flags: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log(`[WishIntake] 세션 생성: ${sessionId}`);

  const result = await airtableRequest(TABLES.SESSIONS, 'POST', { fields });

  if (result.simulated) {
    console.log('[WishIntake] [시뮬레이션] 세션 생성됨:', sessionId);

    // Slack 알림: 새 세션 (시뮬레이션)
    if (slackService) {
      slackService.notifyNewSession(fields).catch(err =>
        console.error('[WishIntake] Slack 알림 실패:', err.message)
      );
    }

    return {
      success: true,
      simulated: true,
      session: { ...fields, id: 'sim_' + sessionId }
    };
  }

  if (result.success) {
    const sessionData = {
      id: result.data.id,
      ...result.data.fields
    };

    // Slack 알림: 새 세션
    if (slackService) {
      slackService.notifyNewSession(sessionData).catch(err =>
        console.error('[WishIntake] Slack 알림 실패:', err.message)
      );
    }

    return {
      success: true,
      session: sessionData
    };
  }

  return { success: false, error: result.error };
}

/**
 * 세션 조회 (by session_id)
 * @param {string} sessionId
 */
async function getSession(sessionId) {
  const filterFormula = `{session_id}="${sessionId}"`;
  const result = await airtableRequest(
    TABLES.SESSIONS,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}`
  );

  if (result.simulated) {
    return { success: false, simulated: true };
  }

  if (result.success && result.data.records && result.data.records.length > 0) {
    const record = result.data.records[0];
    return {
      success: true,
      session: {
        id: record.id,
        ...record.fields
      }
    };
  }

  return { success: false, error: 'Session not found' };
}

/**
 * 세션 상태 업데이트
 * @param {string} sessionId
 * @param {string} newStatus
 * @param {Object} additionalFields
 */
async function updateSessionStatus(sessionId, newStatus, additionalFields = {}) {
  // 세션 조회
  const sessionResult = await getSession(sessionId);
  if (!sessionResult.success) {
    return sessionResult;
  }

  const session = sessionResult.session;
  const currentStatus = session.run_status;

  // 상태 전이 유효성 검사
  if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
    console.warn(`[WishIntake] 잘못된 상태 전이: ${currentStatus} → ${newStatus}`);
    return {
      success: false,
      error: `Invalid transition: ${currentStatus} → ${newStatus}`
    };
  }

  const fields = {
    run_status: newStatus,
    updated_at: new Date().toISOString(),
    ...additionalFields
  };

  console.log(`[WishIntake] 세션 상태 변경: ${sessionId} (${currentStatus} → ${newStatus})`);

  return airtableRequest(TABLES.SESSIONS, 'PATCH', { fields }, session.id);
}

/**
 * 세션 진행 상황 업데이트
 * @param {string} sessionId
 * @param {number} currentQuestion - 현재 질문 번호 (1-7)
 * @param {number} answeredCount - 답변한 질문 수
 */
async function updateSessionProgress(sessionId, currentQuestion, answeredCount) {
  const sessionResult = await getSession(sessionId);
  if (!sessionResult.success) {
    console.error('[WishIntake] updateSessionProgress: 세션 조회 실패', sessionId);
    return sessionResult;
  }

  const progress = Math.round((answeredCount / 7) * 100) / 100;
  const isCompleted = answeredCount >= 7 || currentQuestion > 7;

  console.log(`[WishIntake] 진행 업데이트: ${sessionId} - Q${currentQuestion}, answered=${answeredCount}, completed=${isCompleted}`);

  const fields = {
    current_question: Math.min(currentQuestion, 7),
    answered_count: answeredCount,
    progress: progress,
    updated_at: new Date().toISOString()
  };

  // 완료 시 상태 자동 전이
  if (isCompleted && sessionResult.session.run_status === SESSION_STATUS.IN_PROGRESS) {
    fields.run_status = SESSION_STATUS.COMPLETED;
    // Note: completed_at 필드는 Airtable에 없으므로 updated_at로 대체
    console.log(`[WishIntake] ✅ 세션 완료 처리: ${sessionId}`);

    // Slack 알림: 세션 완료
    if (slackService) {
      const completedSession = {
        ...sessionResult.session,
        ...fields
      };
      slackService.notifySessionCompleted(completedSession, null).catch(err =>
        console.error('[WishIntake] Slack 완료 알림 실패:', err.message)
      );
    }
  }

  const result = await airtableRequest(TABLES.SESSIONS, 'PATCH', { fields }, sessionResult.session.id);

  if (!result.success && !result.simulated) {
    console.error('[WishIntake] ❌ 세션 업데이트 실패:', result.error);
  }

  return result;
}

/**
 * 세션 pause_flow 설정 (🔴 감지 시)
 * @param {string} sessionId
 * @param {string} reason - 중단 사유
 */
async function pauseSession(sessionId, reason) {
  const sessionResult = await getSession(sessionId);
  if (!sessionResult.success) {
    return sessionResult;
  }

  const fields = {
    run_status: SESSION_STATUS.PAUSED,
    pause_flow: true,
    risk_level: 'RED',
    risk_flags: reason,
    paused_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  console.log(`[WishIntake] 🔴 세션 중단: ${sessionId} - ${reason}`);

  return airtableRequest(TABLES.SESSIONS, 'PATCH', { fields }, sessionResult.session.id);
}

// ═══════════════════════════════════════════════════════════════════════════
// Messages CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 메시지(Q&A) 저장
 * @param {Object} params - { sessionId, questionKey, questionText, answerText, ... }
 */
async function saveMessage(params) {
  const {
    sessionId,
    questionId,
    questionKey,
    questionText,
    answerText = '',
    skipped = false
  } = params;

  const messageId = generateMessageId();

  // 리스크 분석 (답변 텍스트)
  const riskResult = analyzeRisk(answerText);

  const fields = {
    message_id: messageId,
    session_id: sessionId,
    question_id: questionId,
    question_key: questionKey,
    question_text: questionText,
    answer_raw_text: answerText,
    answer_final_text: answerText, // MVP에서는 동일
    skipped: skipped,
    risk_level: riskResult.level,
    risk_flags: riskResult.reasons.join('; '),
    created_at: new Date().toISOString()
  };

  console.log(`[WishIntake] 메시지 저장: ${sessionId}/${questionId} (${riskResult.level})`);
  console.log(`[WishIntake] 📝 answer 원문: "${answerText}"`);

  const result = await airtableRequest(TABLES.MESSAGES, 'POST', { fields });

  // 🔴 RED 감지 시 세션 중단
  if (riskResult.level === 'RED') {
    await pauseSession(sessionId, riskResult.reasons.join('; '));

    // Safety Event 기록
    const airtableService = require('./airtableService');
    await airtableService.createAlert('🔴', 'SAFETY_EVENT',
      `RED 리스크 감지: ${sessionId}`,
      { sessionId, questionId, reasons: riskResult.reasons }
    );

    // Slack 알림: 🔴 긴급 검토
    if (slackService) {
      const sessionForAlert = await getSession(sessionId);
      if (sessionForAlert.success) {
        slackService.notifyReviewNeeded(sessionForAlert.session, {
          level: 'RED',
          reasons: riskResult.reasons,
          flags: riskResult.reasons.join('; ')
        }).catch(err => console.error('[WishIntake] Slack 알림 실패:', err.message));
      }
    }
  }

  // 🟡 YELLOW 감지 시 검토 필요 표시
  if (riskResult.level === 'YELLOW') {
    const sessionResult = await getSession(sessionId);
    if (sessionResult.success && sessionResult.session.run_status !== SESSION_STATUS.PAUSED) {
      await airtableRequest(TABLES.SESSIONS, 'PATCH', {
        fields: {
          risk_level: 'YELLOW',
          risk_flags: (sessionResult.session.risk_flags || '') + '; ' + riskResult.reasons.join('; '),
          updated_at: new Date().toISOString()
        }
      }, sessionResult.session.id);

      // Slack 알림: 🟡 검토 필요
      if (slackService) {
        slackService.notifyReviewNeeded(sessionResult.session, {
          level: 'YELLOW',
          reasons: riskResult.reasons,
          flags: riskResult.reasons.join('; ')
        }).catch(err => console.error('[WishIntake] Slack 알림 실패:', err.message));
      }
    }
  }

  if (result.simulated) {
    return {
      success: true,
      simulated: true,
      message: { ...fields, id: 'sim_' + messageId },
      risk: riskResult
    };
  }

  if (result.success) {
    return {
      success: true,
      message: {
        id: result.data.id,
        ...result.data.fields
      },
      risk: riskResult
    };
  }

  return { success: false, error: result.error };
}

/**
 * 세션의 모든 메시지 조회
 * @param {string} sessionId
 */
async function getSessionMessages(sessionId) {
  const filterFormula = `{session_id}="${sessionId}"`;
  const result = await airtableRequest(
    TABLES.MESSAGES,
    'GET',
    null,
    null,
    `filterByFormula=${encodeURIComponent(filterFormula)}&sort[0][field]=question_id&sort[0][direction]=asc`
  );

  if (result.simulated) {
    return { success: false, simulated: true, messages: [] };
  }

  if (result.success) {
    return {
      success: true,
      messages: (result.data.records || []).map(r => ({
        id: r.id,
        ...r.fields
      }))
    };
  }

  return { success: false, error: result.error };
}

// ═══════════════════════════════════════════════════════════════════════════
// 대화 플로우 (P0-02)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 다음 질문 가져오기
 * @param {string} sessionId
 * @returns {Object} { question, isLast, progress }
 */
async function getNextQuestion(sessionId) {
  const sessionResult = await getSession(sessionId);
  if (!sessionResult.success) {
    return { success: false, error: 'Session not found' };
  }

  const session = sessionResult.session;

  // pause_flow 체크
  if (session.pause_flow) {
    return {
      success: false,
      paused: true,
      reason: '세션이 일시 중지되었습니다. 관리자 확인이 필요합니다.'
    };
  }

  const currentQ = session.current_question || 1;

  if (currentQ > 7) {
    return {
      success: true,
      completed: true,
      progress: 1,
      message: '모든 질문이 완료되었습니다.'
    };
  }

  const question = WISH_QUESTIONS[currentQ - 1];

  return {
    success: true,
    question: {
      ...question,
      number: currentQ,
      total: 7
    },
    progress: session.progress || 0,
    isLast: currentQ === 7
  };
}

/**
 * 답변 제출 및 다음 진행
 * @param {string} sessionId
 * @param {string} answerText - 답변 (빈 문자열 허용 = 스킵)
 */
async function submitAnswer(sessionId, answerText) {
  const sessionResult = await getSession(sessionId);
  if (!sessionResult.success) {
    return { success: false, error: 'Session not found' };
  }

  const session = sessionResult.session;

  // pause_flow 체크
  if (session.pause_flow) {
    return {
      success: false,
      paused: true,
      reason: '세션이 중지되었습니다.'
    };
  }

  const currentQ = session.current_question || 1;
  if (currentQ > 7) {
    return { success: false, error: 'Session already completed' };
  }

  const question = WISH_QUESTIONS[currentQ - 1];
  const skipped = !answerText || answerText.trim() === '';

  // 메시지 저장 (리스크 분석 포함)
  const messageResult = await saveMessage({
    sessionId,
    questionId: question.id,
    questionKey: question.key,
    questionText: question.display,
    answerText: answerText || '',
    skipped
  });

  // 🔴 감지 시 즉시 반환
  if (messageResult.risk?.level === 'RED') {
    return {
      success: true,
      paused: true,
      reason: 'safety_detected',
      message: '안전을 위해 잠시 멈춥니다. 전문 상담이 필요하시면 1393(정신건강위기상담전화)에 연락해 주세요.'
    };
  }

  // 진행 상황 업데이트
  const newAnsweredCount = (session.answered_count || 0) + 1;
  await updateSessionProgress(sessionId, currentQ + 1, newAnsweredCount);

  // 다음 질문 반환
  if (currentQ >= 7) {
    return {
      success: true,
      completed: true,
      progress: 1,
      message: '모든 질문에 답해주셨습니다. 잠시 후 결과를 보여드릴게요.',
      risk: messageResult.risk
    };
  }

  const nextQuestion = WISH_QUESTIONS[currentQ]; // 0-indexed이므로 currentQ가 다음

  return {
    success: true,
    nextQuestion: {
      ...nextQuestion,
      number: currentQ + 1,
      total: 7
    },
    progress: newAnsweredCount / 7,
    risk: messageResult.risk
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// P0-05: 세션 요약 생성
// ═══════════════════════════════════════════════════════════════════════════

// OpenAI 클라이언트 (lazy init)
let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('✅ OpenAI 클라이언트 초기화 (요약용)');
  }
  return openai;
}

/**
 * 요약 생성 프롬프트
 */
const SUMMARY_PROMPT = `당신은 소원 상담 요약 전문가입니다. 아래 7문항 답변을 바탕으로 두 가지 형식의 요약을 생성하세요.

## 답변 데이터
{{QA_DATA}}

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:

{
  "summary_short": "사용자에게 보여줄 따뜻한 요약 (3-5줄, 존댓말, 공감적 톤)",
  "summary_structured": {
    "wish_1liner": "소원 핵심 한 문장",
    "themes": ["관련 테마 1", "관련 테마 2"],
    "blockers": ["주요 걸림돌/걱정"],
    "emotion": {
      "score": 0,
      "word": "감정 단어"
    },
    "resources": ["활용 가능 자원"],
    "next_action": "24시간 내 작은 행동"
  }
}`;

/**
 * Q&A 데이터를 텍스트로 포맷
 */
function formatQAForPrompt(messages) {
  return messages.map(m => {
    const q = WISH_QUESTIONS.find(q => q.id === m.question_id);
    const questionLabel = q ? q.key : m.question_id;
    const answer = m.answer_final_text || '(미응답)';
    return `[${questionLabel}] ${m.question_text}\n→ ${answer}`;
  }).join('\n\n');
}

/**
 * 세션 요약 생성 (OpenAI GPT-4 사용)
 * @param {string} sessionId
 * @returns {Object} { success, summary_short, summary_structured }
 */
async function generateSessionSummary(sessionId) {
  const client = getOpenAI();

  // OpenAI 미설정 시 기본 요약 반환
  if (!client) {
    console.warn('[WishIntake] OpenAI 미설정 - 기본 요약 생성');
    return generateFallbackSummary(sessionId);
  }

  try {
    // 세션 메시지 조회
    const messagesResult = await getSessionMessages(sessionId);
    if (!messagesResult.success || messagesResult.messages.length === 0) {
      return { success: false, error: 'No messages found for summary' };
    }

    const qaData = formatQAForPrompt(messagesResult.messages);
    const prompt = SUMMARY_PROMPT.replace('{{QA_DATA}}', qaData);

    console.log(`[WishIntake] 요약 생성 중: ${sessionId}`);

    const completion = await client.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: '당신은 소원 상담 요약 전문가입니다. 반드시 JSON 형식으로만 응답하세요.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1000,
      temperature: 0.7
    });

    const responseText = completion.choices[0].message.content;

    // JSON 파싱
    let parsed;
    try {
      // JSON 블록 추출 (```json ... ``` 또는 직접 JSON)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[WishIntake] JSON 파싱 실패:', parseError.message);
      return generateFallbackSummary(sessionId);
    }

    console.log(`[WishIntake] 요약 생성 완료: ${sessionId}`);

    return {
      success: true,
      summary_short: parsed.summary_short,
      summary_structured: parsed.summary_structured
    };

  } catch (error) {
    console.error('[WishIntake] 요약 생성 오류:', error.message);
    return generateFallbackSummary(sessionId);
  }
}

/**
 * 폴백 요약 생성 (OpenAI 실패 시)
 */
async function generateFallbackSummary(sessionId) {
  const messagesResult = await getSessionMessages(sessionId);
  const messages = messagesResult.success ? messagesResult.messages : [];

  // Q1 답변에서 소원 추출
  const wishMsg = messages.find(m => m.question_key === 'WISH_1L');
  const wish1Liner = wishMsg?.answer_final_text || '(소원 미입력)';

  // 기본 요약 생성
  const summaryShort = `당신의 소원: "${wish1Liner}"\n\n7문항 답변을 모두 완료하셨습니다. 곧 맞춤 로드맵을 준비해 드릴게요.`;

  const summaryStructured = {
    wish_1liner: wish1Liner,
    themes: [],
    blockers: [],
    emotion: { score: 5, word: '중립' },
    resources: [],
    next_action: '(분석 대기)'
  };

  return {
    success: true,
    fallback: true,
    summary_short: summaryShort,
    summary_structured: summaryStructured
  };
}

/**
 * 요약 저장 및 상태 전이
 * @param {string} sessionId
 * @param {string} summaryShort
 * @param {Object} summaryStructured
 */
async function saveSessionSummary(sessionId, summaryShort, summaryStructured) {
  const sessionResult = await getSession(sessionId);
  if (!sessionResult.success) {
    return { success: false, error: 'Session not found' };
  }

  const fields = {
    summary_short: summaryShort,
    summary_structured: JSON.stringify(summaryStructured, null, 2),
    run_status: SESSION_STATUS.SUMMARIZED,
    updated_at: new Date().toISOString()
  };

  console.log(`[WishIntake] 요약 저장: ${sessionId}`);

  const result = await airtableRequest(TABLES.SESSIONS, 'PATCH', { fields }, sessionResult.session.id);

  if (result.success || result.simulated) {
    // Slack 알림: 요약 포함 완료
    if (slackService) {
      const completedSession = {
        ...sessionResult.session,
        ...fields
      };
      slackService.notifySessionCompleted(completedSession, {
        wish_1liner: summaryStructured.wish_1liner
      }).catch(err => console.error('[WishIntake] Slack 요약 알림 실패:', err.message));
    }
  }

  return result;
}

/**
 * 세션 요약 전체 플로우 (생성 + 저장)
 * P1: 저장 실패해도 요약은 반환 (fallback)
 * @param {string} sessionId
 */
async function processSessionSummary(sessionId) {
  // 1. 요약 생성
  const summaryResult = await generateSessionSummary(sessionId);
  if (!summaryResult.success) {
    return summaryResult;
  }

  // 2. 요약 저장 시도
  const saveResult = await saveSessionSummary(
    sessionId,
    summaryResult.summary_short,
    summaryResult.summary_structured
  );

  // P1: 저장 실패해도 요약은 반환
  if (!saveResult.success && !saveResult.simulated) {
    console.warn(`[WishIntake] ⚠️ 요약 저장 실패했지만 응답 반환: ${sessionId}`);
    return {
      success: true,  // 요약 생성은 성공
      summary_short: summaryResult.summary_short,
      summary_structured: summaryResult.summary_structured,
      fallback: summaryResult.fallback || false,
      saveFailed: true,  // 저장 실패 플래그
      saveError: saveResult.error
    };
  }

  return {
    success: true,
    summary_short: summaryResult.summary_short,
    summary_structured: summaryResult.summary_structured,
    fallback: summaryResult.fallback || false,
    saveFailed: false
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 상수
  WISH_QUESTIONS,
  SESSION_STATUS,
  TABLES,

  // ID 생성
  generateSessionId,
  generateMessageId,
  generateIdempotencyKey,
  generateCorrelationId,

  // 리스크 분석 (DEC-003)
  analyzeRisk,
  RISK_PATTERNS,

  // Sessions CRUD
  createSession,
  getSession,
  updateSessionStatus,
  updateSessionProgress,
  pauseSession,

  // Messages CRUD
  saveMessage,
  getSessionMessages,

  // 대화 플로우
  getNextQuestion,
  submitAnswer,

  // 요약 생성 (P0-05)
  generateSessionSummary,
  saveSessionSummary,
  processSessionSummary
};
