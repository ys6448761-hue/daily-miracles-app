/**
 * 볼타 (Bolta) API 연동 서비스
 *
 * 세금계산서 / 현금영수증 자동 발행
 * 현재: 비활성화 상태 (구조만 준비)
 * 활성화 시점: 실제 매출 발생 후
 *
 * @module services/boltaService
 * @version 1.0.0 - 2025.01.29
 */

// ============================================
// 설정
// ============================================

const BOLTA_CONFIG = {
  enabled: process.env.BOLTA_ENABLED === 'true' || false,
  apiKey: process.env.BOLTA_API_KEY || '',
  secretKey: process.env.BOLTA_SECRET_KEY || '',
  baseUrl: process.env.BOLTA_BASE_URL || 'https://api.bolta.io/v1',
  pricePerInvoice: 90  // 건당 90원
};

// 홈택스 URL
const HOMETAX_URLS = {
  taxInvoice: 'https://www.hometax.go.kr/websquare/websquare.wq?w2xPath=/ui/pp/index_pp.xml&tmIdx=02&tm2lIdx=0206000000&tm3lIdx=0206010000',
  cashReceipt: 'https://www.hometax.go.kr/websquare/websquare.wq?w2xPath=/ui/pp/index_pp.xml&tmIdx=02&tm2lIdx=0206000000&tm3lIdx=0206020000',
  main: 'https://www.hometax.go.kr'
};

// 상대방 유형별 증빙 규칙
const PARTNER_RECEIPT_RULES = {
  'business_taxable': {
    label: '법인/사업자 (과세)',
    defaultReceipt: 'tax_invoice',
    vatRate: 0.10,
    description: '세금계산서 발행 필수',
    requireBusinessNumber: true
  },
  'business_exempt': {
    label: '법인/사업자 (면세)',
    defaultReceipt: 'cash_receipt_expense',
    vatRate: 0,
    description: '현금영수증 (지출증빙) 발행',
    requireBusinessNumber: true
  },
  'individual': {
    label: '개인',
    defaultReceipt: 'cash_receipt_deduction',
    vatRate: 0,
    description: '현금영수증 (소득공제) 발행',
    requireBusinessNumber: false
  },
  'nonprofit': {
    label: '비영리/단체',
    defaultReceipt: 'cash_receipt_expense',
    vatRate: 0,
    description: '현금영수증 (지출증빙) 발행',
    requireBusinessNumber: true
  }
};

// 증빙 유형 정보
const RECEIPT_TYPES = {
  'tax_invoice': {
    label: '세금계산서',
    icon: '📄',
    hometaxUrl: HOMETAX_URLS.taxInvoice,
    deadlineDays: 10  // 익월 10일
  },
  'cash_receipt_deduction': {
    label: '현금영수증 (소득공제)',
    icon: '🧾',
    hometaxUrl: HOMETAX_URLS.cashReceipt,
    deadlineDays: 5   // 5일 이내
  },
  'cash_receipt_expense': {
    label: '현금영수증 (지출증빙)',
    icon: '🧾',
    hometaxUrl: HOMETAX_URLS.cashReceipt,
    deadlineDays: 5
  },
  'none': {
    label: '증빙 불필요',
    icon: '➖',
    hometaxUrl: null,
    deadlineDays: null
  }
};

// ============================================
// 서비스 상태 확인
// ============================================

/**
 * 볼타 서비스 상태 확인
 */
function getServiceStatus() {
  return {
    name: 'Bolta API Service',
    enabled: BOLTA_CONFIG.enabled,
    hasApiKey: !!BOLTA_CONFIG.apiKey,
    baseUrl: BOLTA_CONFIG.baseUrl,
    pricePerInvoice: BOLTA_CONFIG.pricePerInvoice,
    message: BOLTA_CONFIG.enabled
      ? '볼타 API 활성화됨'
      : '볼타 API 비활성화 - 홈택스에서 직접 발행 필요'
  };
}

/**
 * 상대방 유형에 따른 증빙 추천
 */
function recommendReceipt(partnerType) {
  const rule = PARTNER_RECEIPT_RULES[partnerType];
  if (!rule) {
    return {
      receiptType: 'none',
      label: '알 수 없음',
      description: '상대방 유형을 선택해주세요'
    };
  }

  const receiptInfo = RECEIPT_TYPES[rule.defaultReceipt];

  return {
    partnerType,
    partnerLabel: rule.label,
    receiptType: rule.defaultReceipt,
    receiptLabel: receiptInfo.label,
    receiptIcon: receiptInfo.icon,
    vatRate: rule.vatRate,
    description: rule.description,
    requireBusinessNumber: rule.requireBusinessNumber,
    hometaxUrl: receiptInfo.hometaxUrl
  };
}

// ============================================
// 세금계산서 발행 (비활성화)
// ============================================

/**
 * 세금계산서 발행 요청
 * @param {Object} data - 발행 데이터
 * @returns {Object} 발행 결과
 */
async function issueTaxInvoice(data) {
  const {
    transactionId,
    supplierInfo,     // 공급자 정보
    receiverInfo,     // 공급받는자 정보
    supplyAmount,     // 공급가액
    vatAmount,        // 부가세
    totalAmount,      // 합계
    itemName,         // 품목명
    issueDate,        // 작성일
    memo
  } = data;

  // 서비스 비활성화 상태
  if (!BOLTA_CONFIG.enabled) {
    return {
      success: false,
      status: 'disabled',
      message: '볼타 API가 비활성화되어 있습니다. 홈택스에서 직접 발행해주세요.',
      hometaxUrl: HOMETAX_URLS.taxInvoice,
      guide: [
        '1. 홈택스 접속 → 전자세금계산서 발급',
        '2. 공급받는자 정보 입력',
        '3. 품목 및 금액 입력',
        '4. 발급 완료 후 기적 금고에서 상태 업데이트'
      ],
      transactionId
    };
  }

  // 볼타 API 활성화 시 실제 호출 (TODO)
  try {
    /*
    const response = await fetch(`${BOLTA_CONFIG.baseUrl}/tax-invoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BOLTA_CONFIG.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        supplier: supplierInfo,
        receiver: receiverInfo,
        supply_amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: totalAmount,
        item_name: itemName,
        issue_date: issueDate,
        memo
      })
    });

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        status: 'issued',
        receiptNumber: result.invoice_number,
        issuedAt: new Date().toISOString(),
        provider: 'bolta',
        cost: BOLTA_CONFIG.pricePerInvoice
      };
    }
    */

    return {
      success: false,
      status: 'not_implemented',
      message: '볼타 API 연동이 아직 구현되지 않았습니다.'
    };

  } catch (error) {
    return {
      success: false,
      status: 'error',
      message: error.message,
      transactionId
    };
  }
}

// ============================================
// 현금영수증 발행 (비활성화)
// ============================================

/**
 * 현금영수증 발행 요청
 * @param {Object} data - 발행 데이터
 * @returns {Object} 발행 결과
 */
async function issueCashReceipt(data) {
  const {
    transactionId,
    receiptType,      // deduction(소득공제) / expense(지출증빙)
    identityType,     // phone/card/business_number
    identityNumber,   // 전화번호/카드번호/사업자번호
    amount,
    itemName,
    issueDate
  } = data;

  // 서비스 비활성화 상태
  if (!BOLTA_CONFIG.enabled) {
    return {
      success: false,
      status: 'disabled',
      message: '볼타 API가 비활성화되어 있습니다. 홈택스에서 직접 발행해주세요.',
      hometaxUrl: HOMETAX_URLS.cashReceipt,
      guide: [
        '1. 홈택스 접속 → 현금영수증 발급',
        receiptType === 'deduction'
          ? '2. 소득공제용 선택 → 휴대폰번호 입력'
          : '2. 지출증빙용 선택 → 사업자번호 입력',
        '3. 금액 입력 후 발급',
        '4. 발급 완료 후 기적 금고에서 상태 업데이트'
      ],
      transactionId
    };
  }

  // 볼타 API 활성화 시 실제 호출 (TODO)
  try {
    return {
      success: false,
      status: 'not_implemented',
      message: '볼타 API 연동이 아직 구현되지 않았습니다.'
    };
  } catch (error) {
    return {
      success: false,
      status: 'error',
      message: error.message,
      transactionId
    };
  }
}

// ============================================
// 발행 상태 조회 (비활성화)
// ============================================

/**
 * 발행 상태 조회
 * @param {string} receiptNumber - 발행 번호
 * @returns {Object} 상태 정보
 */
async function getReceiptStatus(receiptNumber) {
  if (!BOLTA_CONFIG.enabled) {
    return {
      success: false,
      status: 'disabled',
      message: '볼타 API가 비활성화되어 있습니다.'
    };
  }

  // TODO: 실제 API 호출
  return {
    success: false,
    status: 'not_implemented',
    message: '볼타 API 연동이 아직 구현되지 않았습니다.'
  };
}

// ============================================
// 발행 기한 계산
// ============================================

/**
 * 증빙 발행 기한 계산
 * @param {Date} transactionDate - 거래일
 * @param {string} receiptType - 증빙 유형
 * @returns {Object} 기한 정보
 */
function calculateDeadline(transactionDate, receiptType) {
  const txDate = new Date(transactionDate);
  const receiptInfo = RECEIPT_TYPES[receiptType];

  if (!receiptInfo || !receiptInfo.deadlineDays) {
    return {
      hasDeadline: false,
      deadline: null,
      daysRemaining: null,
      isUrgent: false,
      isOverdue: false
    };
  }

  // 세금계산서: 익월 10일
  let deadline;
  if (receiptType === 'tax_invoice') {
    deadline = new Date(txDate.getFullYear(), txDate.getMonth() + 1, 10);
  } else {
    // 현금영수증: 거래일로부터 N일
    deadline = new Date(txDate);
    deadline.setDate(deadline.getDate() + receiptInfo.deadlineDays);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    hasDeadline: true,
    deadline: deadline.toISOString().split('T')[0],
    daysRemaining,
    isUrgent: daysRemaining > 0 && daysRemaining <= 5,
    isOverdue: daysRemaining < 0
  };
}

// ============================================
// 모듈 내보내기
// ============================================

module.exports = {
  // 설정
  BOLTA_CONFIG,
  PARTNER_RECEIPT_RULES,
  RECEIPT_TYPES,
  HOMETAX_URLS,

  // 서비스 상태
  getServiceStatus,
  recommendReceipt,

  // 발행 API (비활성화)
  issueTaxInvoice,
  issueCashReceipt,
  getReceiptStatus,

  // 유틸리티
  calculateDeadline
};
