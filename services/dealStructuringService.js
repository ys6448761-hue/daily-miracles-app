/**
 * ═══════════════════════════════════════════════════════════════════════════
 * Deal Structuring Service - 견적 확정 워크플로우
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 핵심 기능:
 *   1. 운영모드 자동 결정
 *   2. 승인 필요 여부 판단
 *   3. 자동 승인 룰 적용
 *   4. 책임주체/돈흐름 자동 설정
 *
 * 운영모드 (4종):
 *   - direct: 직영 (우리가 전부 처리)
 *   - agency: 여행사 이관 (여행사가 계약/결제/책임)
 *   - commission: 수수료만 (우리는 수수료만 받음)
 *   - hybrid: 혼합 (일부 직영 + 일부 이관)
 *
 * 워크플로우:
 *   calculated → deal_review → [ceo_approval] → confirmed
 *
 * 작성일: 2026-01-13
 * 설계: 루미 분석 기반
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════════════
// 상수 정의
// ═══════════════════════════════════════════════════════════════════════════

const OPERATION_MODES = {
  DIRECT: 'direct',           // 직영
  AGENCY: 'agency',           // 여행사 이관
  COMMISSION: 'commission',   // 수수료만
  HYBRID: 'hybrid'            // 혼합
};

const APPROVAL_STATUS = {
  PENDING: 'pending',           // 검토 대기
  DEAL_REVIEW: 'deal_review',   // 담당자 검토 중
  CEO_APPROVAL: 'ceo_approval', // CEO 승인 대기
  AUTO_APPROVED: 'auto_approved', // 자동 승인됨
  APPROVED: 'approved',         // 승인됨
  REJECTED: 'rejected'          // 반려됨
};

const APPROVAL_REASONS = {
  INCENTIVE: 'incentive_required',      // 인센티브 신청 필요
  MICE: 'is_mice',                      // MICE 행사
  AGENCY_TRANSFER: 'agency_transfer',   // 여행사 이관
  COMMISSION_ONLY: 'commission_only',   // 수수료만 모드
  HIGH_VALUE: 'high_value',             // 고액 견적 (500만원 이상)
  AMOUNT_OVER_3M: 'amount_over_3m',     // 금액 > 300만원 (자동승인 불가)
  LARGE_GROUP: 'large_group',           // 대규모 단체 (30인 이상)
  PAX_OVER_20: 'pax_over_20',           // 인원 > 20명 (자동승인 불가)
  MODE_NOT_DIRECT: 'mode_not_direct',   // 직영 아닌 운영모드
  CUSTOM_PRICING: 'custom_pricing',     // 맞춤 가격 적용
  RISK_FLAG: 'risk_flag'                // 리스크 플래그
};

// 자동 승인 기준
const AUTO_APPROVE_THRESHOLDS = {
  maxAmount: 3000000,       // 300만원 이하
  maxGuests: 20,            // 20인 이하
  allowedModes: ['direct']  // 직영만 자동 승인
};

// 우리 여행업 등록 여부 (설정 파일에서 로드 가능)
const HAS_OUR_TRAVEL_LICENSE = false;  // TODO: 실제 값으로 변경

// ═══════════════════════════════════════════════════════════════════════════
// 운영모드 결정 로직
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 운영모드 자동 결정
 * @param {Object} quoteData - 견적 데이터
 * @returns {Object} { mode, reason, recommendations }
 */
function determineOperationMode(quoteData) {
  const {
    incentive_required = false,
    is_mice = false,
    is_group = false,
    guest_count = 2,
    total_sell = 0,
    manual_mode  // 수동 지정된 모드
  } = quoteData;

  // 수동 지정된 경우 그대로 사용
  if (manual_mode && Object.values(OPERATION_MODES).includes(manual_mode)) {
    return {
      mode: manual_mode,
      reason: '수동 지정',
      recommendations: []
    };
  }

  const recommendations = [];

  // 1. 인센티브 필요 + 여행업 미등록 → 여행사 이관 강제 추천
  if (incentive_required && !HAS_OUR_TRAVEL_LICENSE) {
    recommendations.push({
      type: 'warning',
      message: '인센티브 신청을 위해 여행사 이관을 권장합니다.',
      suggestedMode: OPERATION_MODES.AGENCY
    });

    return {
      mode: OPERATION_MODES.AGENCY,
      reason: '인센티브 신청 필요 (여행업 미등록)',
      recommendations,
      forced: true
    };
  }

  // 2. MICE + 여행업 미등록 → 여행사 이관 또는 혼합
  if (is_mice && !HAS_OUR_TRAVEL_LICENSE) {
    recommendations.push({
      type: 'warning',
      message: 'MICE 행사는 여행사 협력을 권장합니다.',
      suggestedMode: OPERATION_MODES.HYBRID
    });

    return {
      mode: OPERATION_MODES.HYBRID,
      reason: 'MICE 행사 (여행업 미등록)',
      recommendations
    };
  }

  // 3. 대규모 단체 (30인 이상) → 혼합 권장
  if (guest_count >= 30) {
    recommendations.push({
      type: 'info',
      message: '대규모 단체는 혼합 운영을 권장합니다.',
      suggestedMode: OPERATION_MODES.HYBRID
    });
  }

  // 4. 고액 (500만원 이상) → 검토 권장
  if (total_sell >= 5000000) {
    recommendations.push({
      type: 'info',
      message: '고액 견적입니다. 운영모드를 검토해주세요.'
    });
  }

  // 기본값: 직영
  return {
    mode: OPERATION_MODES.DIRECT,
    reason: '기본 직영 운영',
    recommendations
  };
}

/**
 * 운영모드에 따른 책임주체/돈흐름 자동 설정
 * @param {string} operationMode
 * @returns {Object}
 */
function getResponsibilitySettings(operationMode) {
  const settings = {
    [OPERATION_MODES.DIRECT]: {
      settlement_method: 'full',
      tax_invoice_issuer: 'us',
      payment_receiver: 'us',
      contract_party: 'us',
      refund_liability: 'us'
    },
    [OPERATION_MODES.AGENCY]: {
      settlement_method: 'commission_only',
      tax_invoice_issuer: 'agency',
      payment_receiver: 'agency',
      contract_party: 'agency',
      refund_liability: 'agency'
    },
    [OPERATION_MODES.COMMISSION]: {
      settlement_method: 'commission_only',
      tax_invoice_issuer: 'us',  // 수수료에 대해서만 발행
      payment_receiver: 'agency',
      contract_party: 'agency',
      refund_liability: 'agency'
    },
    [OPERATION_MODES.HYBRID]: {
      settlement_method: 'full',  // 케이스별로 다를 수 있음
      tax_invoice_issuer: 'us',
      payment_receiver: 'us',
      contract_party: 'us',
      refund_liability: 'us'  // 협의 필요
    }
  };

  return settings[operationMode] || settings[OPERATION_MODES.DIRECT];
}

// ═══════════════════════════════════════════════════════════════════════════
// 승인 워크플로우 로직
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 승인 필요 여부 판단
 * @param {Object} quoteData
 * @returns {Object} { required, reasons }
 */
function checkApprovalRequired(quoteData) {
  const reasons = [];

  const {
    operation_mode = OPERATION_MODES.DIRECT,
    incentive_required = false,
    is_mice = false,
    guest_count = 2,
    total_sell = 0,
    has_custom_pricing = false,
    risk_flags = []
  } = quoteData;

  // 1. 인센티브 필요
  if (incentive_required) {
    reasons.push({
      code: APPROVAL_REASONS.INCENTIVE,
      message: '인센티브 신청이 필요합니다',
      severity: 'high'
    });
  }

  // 2. MICE 행사
  if (is_mice) {
    reasons.push({
      code: APPROVAL_REASONS.MICE,
      message: 'MICE 행사입니다',
      severity: 'high'
    });
  }

  // 3. 여행사 이관/수수료 모드
  if ([OPERATION_MODES.AGENCY, OPERATION_MODES.COMMISSION].includes(operation_mode)) {
    reasons.push({
      code: operation_mode === OPERATION_MODES.AGENCY
        ? APPROVAL_REASONS.AGENCY_TRANSFER
        : APPROVAL_REASONS.COMMISSION_ONLY,
      message: `운영모드: ${operation_mode}`,
      severity: 'medium'
    });
  }

  // 3-1. 직영 아닌 모드 (hybrid 포함) - 자동승인 불가 트리거
  if (operation_mode !== OPERATION_MODES.DIRECT) {
    // AGENCY/COMMISSION은 이미 위에서 추가됨, hybrid만 별도 추가
    if (operation_mode === OPERATION_MODES.HYBRID) {
      reasons.push({
        code: APPROVAL_REASONS.MODE_NOT_DIRECT,
        message: `운영모드: ${operation_mode} (직영 아님)`,
        severity: 'medium'
      });
    }
  }

  // 4. 금액 트리거 (자동승인 기준: 300만원)
  if (total_sell > AUTO_APPROVE_THRESHOLDS.maxAmount) {
    // 500만원 이상은 high_value, 300만~500만원은 amount_over_3m
    if (total_sell >= 5000000) {
      reasons.push({
        code: APPROVAL_REASONS.HIGH_VALUE,
        message: `고액 견적: ${total_sell.toLocaleString()}원`,
        severity: 'high'
      });
    } else {
      reasons.push({
        code: APPROVAL_REASONS.AMOUNT_OVER_3M,
        message: `금액 초과: ${total_sell.toLocaleString()}원 (자동승인 기준 300만원 초과)`,
        severity: 'medium'
      });
    }
  }

  // 5. 인원 트리거 (자동승인 기준: 20명)
  if (guest_count > AUTO_APPROVE_THRESHOLDS.maxGuests) {
    // 30인 이상은 large_group, 21~29명은 pax_over_20
    if (guest_count >= 30) {
      reasons.push({
        code: APPROVAL_REASONS.LARGE_GROUP,
        message: `대규모 단체: ${guest_count}인`,
        severity: 'high'
      });
    } else {
      reasons.push({
        code: APPROVAL_REASONS.PAX_OVER_20,
        message: `인원 초과: ${guest_count}명 (자동승인 기준 20명 초과)`,
        severity: 'medium'
      });
    }
  }

  // 6. 맞춤 가격 적용
  if (has_custom_pricing) {
    reasons.push({
      code: APPROVAL_REASONS.CUSTOM_PRICING,
      message: '맞춤 가격이 적용되었습니다',
      severity: 'low'
    });
  }

  // 7. 리스크 플래그
  if (risk_flags && risk_flags.length > 0) {
    reasons.push({
      code: APPROVAL_REASONS.RISK_FLAG,
      message: `리스크 플래그: ${risk_flags.join(', ')}`,
      severity: 'high'
    });
  }

  return {
    required: reasons.length > 0,
    reasons,
    highSeverityCount: reasons.filter(r => r.severity === 'high').length
  };
}

/**
 * 자동 승인 가능 여부 확인
 * @param {Object} quoteData
 * @returns {Object} { canAutoApprove, reason }
 */
function checkAutoApprove(quoteData) {
  const {
    operation_mode = OPERATION_MODES.DIRECT,
    total_sell = 0,
    guest_count = 2,
    incentive_required = false,
    is_mice = false,
    risk_flags = []
  } = quoteData;

  // 자동 승인 조건
  const conditions = {
    modeAllowed: AUTO_APPROVE_THRESHOLDS.allowedModes.includes(operation_mode),
    amountOk: total_sell <= AUTO_APPROVE_THRESHOLDS.maxAmount,
    guestsOk: guest_count <= AUTO_APPROVE_THRESHOLDS.maxGuests,
    noIncentive: !incentive_required,
    noMice: !is_mice,
    noRisk: !risk_flags || risk_flags.length === 0
  };

  const allPassed = Object.values(conditions).every(v => v === true);

  if (allPassed) {
    return {
      canAutoApprove: true,
      reason: '자동 승인 조건 충족'
    };
  }

  // 실패 사유
  const failedConditions = Object.entries(conditions)
    .filter(([_, passed]) => !passed)
    .map(([key, _]) => key);

  return {
    canAutoApprove: false,
    reason: `자동 승인 불가: ${failedConditions.join(', ')}`
  };
}

/**
 * Deal Structuring 처리 (견적 → 확정 준비)
 * @param {Object} quoteData
 * @returns {Object} 처리 결과
 */
function processDealStructuring(quoteData) {
  // 1. 운영모드 결정
  const modeResult = determineOperationMode(quoteData);

  // 2. 책임주체 설정
  const responsibilitySettings = getResponsibilitySettings(modeResult.mode);

  // 3. 승인 필요 여부 확인
  const approvalCheck = checkApprovalRequired({
    ...quoteData,
    operation_mode: modeResult.mode
  });

  // 4. 자동 승인 가능 여부
  const autoApproveCheck = checkAutoApprove({
    ...quoteData,
    operation_mode: modeResult.mode
  });

  // 5. 워크플로우 상태 결정
  let approvalStatus = APPROVAL_STATUS.PENDING;
  let nextStep = null;

  if (!approvalCheck.required) {
    // 승인 불필요 → 바로 확정 가능
    approvalStatus = APPROVAL_STATUS.AUTO_APPROVED;
    nextStep = 'confirm';
  } else if (autoApproveCheck.canAutoApprove) {
    // 자동 승인 가능
    approvalStatus = APPROVAL_STATUS.AUTO_APPROVED;
    nextStep = 'confirm';
  } else if (approvalCheck.highSeverityCount > 0) {
    // 고위험 → CEO 승인 필요
    approvalStatus = APPROVAL_STATUS.CEO_APPROVAL;
    nextStep = 'ceo_review';
  } else {
    // 일반 → 담당자 검토
    approvalStatus = APPROVAL_STATUS.DEAL_REVIEW;
    nextStep = 'manager_review';
  }

  return {
    success: true,

    // 운영모드
    operation_mode: modeResult.mode,
    operation_mode_reason: modeResult.reason,
    operation_mode_forced: modeResult.forced || false,
    recommendations: modeResult.recommendations,

    // 책임주체/돈흐름
    ...responsibilitySettings,

    // 승인 워크플로우
    requires_approval: approvalCheck.required,
    approval_reasons: approvalCheck.reasons,
    approval_status: approvalStatus,
    can_auto_approve: autoApproveCheck.canAutoApprove,

    // 다음 단계
    next_step: nextStep,
    next_step_message: getNextStepMessage(nextStep),

    // 담당자 알림 카드용 요약
    summary_card: generateSummaryCard({
      operation_mode: modeResult.mode,
      ...responsibilitySettings,
      approval_status: approvalStatus,
      approval_reasons: approvalCheck.reasons,
      guest_count: quoteData.guest_count,
      total_sell: quoteData.total_sell
    })
  };
}

/**
 * 다음 단계 메시지
 */
function getNextStepMessage(nextStep) {
  const messages = {
    confirm: '바로 확정 가능합니다.',
    manager_review: '담당자 검토가 필요합니다.',
    ceo_review: 'CEO 승인이 필요합니다.'
  };
  return messages[nextStep] || '검토가 필요합니다.';
}

/**
 * 담당자 알림 카드 생성
 */
function generateSummaryCard(data) {
  const modeLabels = {
    direct: '직영',
    agency: '여행사 이관',
    commission: '수수료만',
    hybrid: '혼합'
  };

  const partyLabels = {
    us: '우리',
    agency: '여행사'
  };

  return {
    title: `견적 검토 (${modeLabels[data.operation_mode]})`,
    fields: [
      { label: '운영모드', value: modeLabels[data.operation_mode], highlight: true },
      { label: '결제수령', value: partyLabels[data.payment_receiver] },
      { label: '세금계산서', value: partyLabels[data.tax_invoice_issuer] },
      { label: '계약주체', value: partyLabels[data.contract_party] },
      { label: '환불책임', value: partyLabels[data.refund_liability] },
      { label: '인원', value: `${data.guest_count}명` },
      { label: '금액', value: `${(data.total_sell || 0).toLocaleString()}원` }
    ],
    warnings: data.approval_reasons?.map(r => r.message) || [],
    status: data.approval_status
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 인센티브/MICE 플래그 로직 (P1 대비)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 인센티브 필수 서류/기한 플래그 생성
 * @param {Object} options
 * @returns {Object}
 */
function generateIncentiveFlags(options) {
  const { travel_date, incentive_type = 'group_tour' } = options;

  if (!travel_date) {
    return { documents: [], deadlines: [] };
  }

  const travelDate = new Date(travel_date);

  // 필수 서류 (단체관광 인센티브 기준)
  const documents = [
    { code: 'participant_list', name: '참가자 명단', required: true },
    { code: 'itinerary', name: '여행 일정표', required: true },
    { code: 'bus_contract', name: '버스 계약서', required: true },
    { code: 'accommodation_confirm', name: '숙박 확인서', required: true },
    { code: 'meal_receipt', name: '식사 영수증', required: false }
  ];

  // 기한 플래그
  const deadlines = [];

  // 사전 협의: 방문 15일 전
  const preConsultDate = new Date(travelDate);
  preConsultDate.setDate(preConsultDate.getDate() - 15);
  deadlines.push({
    type: 'pre_consultation',
    label: '사전 협의 완료',
    date: preConsultDate.toISOString().split('T')[0],
    days_before: 15,
    status: 'pending'
  });

  // 서류 제출: 방문 3일 전
  const docSubmitDate = new Date(travelDate);
  docSubmitDate.setDate(docSubmitDate.getDate() - 3);
  deadlines.push({
    type: 'document_submit',
    label: '서류 제출',
    date: docSubmitDate.toISOString().split('T')[0],
    days_before: 3,
    status: 'pending'
  });

  // 사후 신청: 방문 후 7일 이내
  const postApplyDate = new Date(travelDate);
  postApplyDate.setDate(postApplyDate.getDate() + 7);
  deadlines.push({
    type: 'post_application',
    label: '사후 신청 마감',
    date: postApplyDate.toISOString().split('T')[0],
    days_after: 7,
    status: 'pending'
  });

  return {
    documents,
    deadlines,
    incentive_type,
    applicant_recommendation: HAS_OUR_TRAVEL_LICENSE ? 'us' : 'agency'
  };
}

/**
 * MICE 필수 서류/기한 플래그 생성
 * @param {Object} options
 * @returns {Object}
 */
function generateMiceFlags(options) {
  const { travel_date, mice_type = 'meeting' } = options;

  if (!travel_date) {
    return { documents: [], deadlines: [] };
  }

  const travelDate = new Date(travel_date);

  // MICE 필수 서류
  const documents = [
    { code: 'event_proposal', name: '행사 기획안', required: true },
    { code: 'participant_list', name: '참가자 명단', required: true },
    { code: 'venue_contract', name: '장소 계약서', required: true },
    { code: 'budget_plan', name: '예산 계획서', required: true },
    { code: 'sponsorship_docs', name: '후원 관련 서류', required: false }
  ];

  // 기한 (MICE는 보통 더 긴 리드타임)
  const deadlines = [];

  // 사전 협의: 방문 30일 전
  const preConsultDate = new Date(travelDate);
  preConsultDate.setDate(preConsultDate.getDate() - 30);
  deadlines.push({
    type: 'pre_consultation',
    label: 'MICE 사전 협의',
    date: preConsultDate.toISOString().split('T')[0],
    days_before: 30,
    status: 'pending'
  });

  // 최종 확정: 방문 7일 전
  const finalConfirmDate = new Date(travelDate);
  finalConfirmDate.setDate(finalConfirmDate.getDate() - 7);
  deadlines.push({
    type: 'final_confirmation',
    label: '최종 인원/일정 확정',
    date: finalConfirmDate.toISOString().split('T')[0],
    days_before: 7,
    status: 'pending'
  });

  return {
    documents,
    deadlines,
    mice_type,
    notes: 'MICE 행사는 별도 담당자 배정이 필요합니다.'
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 상수
  OPERATION_MODES,
  APPROVAL_STATUS,
  APPROVAL_REASONS,

  // 핵심 함수
  determineOperationMode,
  getResponsibilitySettings,
  checkApprovalRequired,
  checkAutoApprove,
  processDealStructuring,

  // 유틸리티
  generateSummaryCard,
  getNextStepMessage,

  // 인센티브/MICE (P1)
  generateIncentiveFlags,
  generateMiceFlags,

  // 설정
  HAS_OUR_TRAVEL_LICENSE,
  AUTO_APPROVE_THRESHOLDS
};
