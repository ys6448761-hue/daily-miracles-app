/**
 * 문의 유형 분류 로직
 *
 * 소원이들의 카카오톡 문의를 자동 분류하여 적절한 응답 템플릿 매칭
 *
 * @module utils/inquiryClassifier
 * @version 1.0.0 - 2025.01.29
 */

/**
 * 문의 유형 정의
 */
const INQUIRY_TYPES = {
  STATUS: {
    id: 'STATUS',
    name: '진행 상태 문의',
    keywords: ['진행', '상태', '언제', '결과', '분석', '완료', '아직', '기다', '메시지', '안와', '언제오'],
    templateId: 'status-check',
    priority: 1,
    autoResponse: true
  },
  RESEND: {
    id: 'RESEND',
    name: 'PDF 재발송 요청',
    keywords: ['다시', '재발송', 'PDF', 'pdf', '못받', '안와요', '재전송', '다시보내', '이메일', 'email', '확인못'],
    templateId: 'pdf-resend',
    priority: 2,
    autoResponse: true
  },
  TRAVEL: {
    id: 'TRAVEL',
    name: '여수여행 문의',
    keywords: ['여수', '여행', '견적', '패키지', '예약', '투어', '소원항해', '항해', '가격', '비용', '일정'],
    templateId: 'travel-inquiry',
    priority: 3,
    autoResponse: true
  },
  PAYMENT: {
    id: 'PAYMENT',
    name: '결제/환불 문의',
    keywords: ['결제', '환불', '취소', '카드', '계좌', '입금', '영수증', '세금계산서'],
    templateId: null,  // 에스컬레이션 필요
    priority: 4,
    autoResponse: false,
    escalate: true,
    escalateReason: '결제/환불은 수동 처리 필요'
  },
  COMPLAINT: {
    id: 'COMPLAINT',
    name: '불만/컴플레인',
    keywords: ['불만', '화나', '짜증', '실망', '안좋', '별로', '최악', '사기', '거짓'],
    templateId: null,
    priority: 0,  // 최우선 에스컬레이션
    autoResponse: false,
    escalate: true,
    escalateReason: '고객 불만 - 즉시 대응 필요',
    alertLevel: 'RED'
  },
  GENERAL: {
    id: 'GENERAL',
    name: '일반 문의',
    keywords: [],  // 기본값
    templateId: 'general-response',
    priority: 99,
    autoResponse: true,
    escalateAfter: true  // 자동응답 후 에스컬레이션
  }
};

/**
 * 키워드 가중치 (복수 매칭 시 점수 계산용)
 */
const KEYWORD_WEIGHTS = {
  exact: 3,      // 정확히 일치
  contains: 1,   // 포함
  similar: 0.5   // 유사 (향후 확장)
};

/**
 * 문의 메시지 분류
 *
 * @param {string} message - 원본 메시지
 * @param {Object} context - 추가 컨텍스트 (선택)
 * @param {string} context.senderPhone - 발신자 전화번호
 * @param {Object} context.sowonData - 소원이 데이터 (있는 경우)
 * @returns {Object} 분류 결과
 */
function classifyInquiry(message, context = {}) {
  if (!message || typeof message !== 'string') {
    return {
      type: 'GENERAL',
      ...INQUIRY_TYPES.GENERAL,
      confidence: 0,
      matchedKeywords: [],
      rawMessage: message
    };
  }

  const normalizedMessage = message.toLowerCase().replace(/\s+/g, '');
  const scores = {};
  const matchedKeywords = {};

  // 각 유형별 점수 계산
  for (const [typeKey, typeConfig] of Object.entries(INQUIRY_TYPES)) {
    if (typeKey === 'GENERAL') continue;  // 기본값은 제외

    scores[typeKey] = 0;
    matchedKeywords[typeKey] = [];

    for (const keyword of typeConfig.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '');

      // 정확히 포함 여부
      if (normalizedMessage.includes(normalizedKeyword)) {
        scores[typeKey] += KEYWORD_WEIGHTS.contains;
        matchedKeywords[typeKey].push(keyword);
      }
    }
  }

  // 최고 점수 유형 찾기
  let bestType = 'GENERAL';
  let bestScore = 0;

  for (const [typeKey, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestType = typeKey;
    } else if (score === bestScore && score > 0) {
      // 동점일 경우 priority가 낮은(더 중요한) 것 선택
      if (INQUIRY_TYPES[typeKey].priority < INQUIRY_TYPES[bestType].priority) {
        bestType = typeKey;
      }
    }
  }

  // 신뢰도 계산 (0-1)
  const maxPossibleScore = INQUIRY_TYPES[bestType]?.keywords?.length || 1;
  const confidence = Math.min(bestScore / Math.max(maxPossibleScore * 0.5, 1), 1);

  const result = {
    type: bestType,
    ...INQUIRY_TYPES[bestType],
    confidence: Math.round(confidence * 100) / 100,
    matchedKeywords: matchedKeywords[bestType] || [],
    allScores: scores,
    rawMessage: message.substring(0, 100),  // 로깅용 (100자 제한)
    classifiedAt: new Date().toISOString()
  };

  // 컨텍스트 추가
  if (context.senderPhone) {
    result.senderPhone = maskPhone(context.senderPhone);
  }
  if (context.sowonData) {
    result.sowonName = context.sowonData.name;
    result.sowonId = context.sowonData.id;
  }

  return result;
}

/**
 * 여러 메시지 일괄 분류
 *
 * @param {Array<Object>} messages - 메시지 배열 [{text, phone, ...}]
 * @returns {Array<Object>} 분류 결과 배열
 */
function classifyBatch(messages) {
  return messages.map(msg => classifyInquiry(msg.text || msg.message, {
    senderPhone: msg.phone,
    sowonData: msg.sowonData
  }));
}

/**
 * 특정 유형 여부 빠른 체크
 *
 * @param {string} message - 메시지
 * @param {string} type - 유형 (STATUS, RESEND, TRAVEL, PAYMENT, COMPLAINT, GENERAL)
 * @returns {boolean}
 */
function isType(message, type) {
  const result = classifyInquiry(message);
  return result.type === type;
}

/**
 * 에스컬레이션 필요 여부 확인
 *
 * @param {string} message - 메시지
 * @returns {Object} { needed: boolean, reason: string, alertLevel: string }
 */
function checkEscalation(message) {
  const result = classifyInquiry(message);

  if (result.escalate) {
    return {
      needed: true,
      reason: result.escalateReason,
      alertLevel: result.alertLevel || 'YELLOW',
      type: result.type
    };
  }

  if (result.escalateAfter) {
    return {
      needed: true,
      reason: '자동응답 후 수동 확인 필요',
      alertLevel: 'GREEN',
      type: result.type,
      afterAutoResponse: true
    };
  }

  return { needed: false };
}

/**
 * 유형별 통계 집계
 *
 * @param {Array<Object>} classifiedResults - 분류된 결과 배열
 * @returns {Object} 통계
 */
function getStatistics(classifiedResults) {
  const stats = {
    total: classifiedResults.length,
    byType: {},
    autoResponseRate: 0,
    escalationRate: 0,
    avgConfidence: 0
  };

  let autoResponseCount = 0;
  let escalationCount = 0;
  let totalConfidence = 0;

  for (const result of classifiedResults) {
    // 유형별 카운트
    stats.byType[result.type] = (stats.byType[result.type] || 0) + 1;

    // 자동응답 가능 카운트
    if (result.autoResponse) {
      autoResponseCount++;
    }

    // 에스컬레이션 카운트
    if (result.escalate) {
      escalationCount++;
    }

    // 신뢰도 합계
    totalConfidence += result.confidence || 0;
  }

  stats.autoResponseRate = Math.round((autoResponseCount / stats.total) * 100);
  stats.escalationRate = Math.round((escalationCount / stats.total) * 100);
  stats.avgConfidence = Math.round((totalConfidence / stats.total) * 100) / 100;

  return stats;
}

/**
 * 전화번호 마스킹
 */
function maskPhone(phone) {
  if (!phone || phone.length < 8) return '****';
  return `${phone.substring(0, 3)}****${phone.slice(-4)}`;
}

/**
 * 사용 가능한 유형 목록 조회
 */
function getInquiryTypes() {
  return Object.entries(INQUIRY_TYPES).map(([key, config]) => ({
    type: key,
    name: config.name,
    templateId: config.templateId,
    autoResponse: config.autoResponse,
    escalate: config.escalate || false
  }));
}

module.exports = {
  INQUIRY_TYPES,
  classifyInquiry,
  classifyBatch,
  isType,
  checkEscalation,
  getStatistics,
  getInquiryTypes
};
