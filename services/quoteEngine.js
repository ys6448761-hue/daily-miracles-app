/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 여수 소원항해 견적 시스템 v2.0 - 견적 엔진
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 핵심 기능:
 *   1. calculateQuote(): 견적 계산
 *   2. validatePolicy(): 정책 검증
 *   3. generateQuoteId(): 견적 ID 생성
 *
 * 지역 확장 대비:
 *   - region 파라미터로 지역별 가격 적용
 *   - 기본값: yeosu
 *
 * 작성일: 2026-01-04
 * 설계: 루미 / 코미
 * 승인: 푸르미르 CEO
 * ═══════════════════════════════════════════════════════════════════════════
 */

const priceData = require('../config/quotePriceData');

// ═══════════════════════════════════════════════════════════════════════════
// 유틸리티 함수
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 날짜로 요일 타입 결정
 * @param {Date|string} date
 * @returns {string} dayType
 */
function getDayType(date) {
  const d = new Date(date);
  const dateStr = d.toISOString().split('T')[0];

  // 공휴일 체크
  if (priceData.holidays.includes(dateStr)) {
    return 'holiday';
  }

  const dayOfWeek = d.getDay();
  switch (dayOfWeek) {
    case 0: return 'sun';
    case 1:
    case 2:
    case 3:
    case 4: return 'mon-thu';
    case 5: return 'fri';
    case 6: return 'sat';
    default: return 'mon-thu';
  }
}

/**
 * 주중/주말 판별 (레저용)
 * @param {string} dayType
 * @returns {boolean}
 */
function isWeekend(dayType) {
  return ['fri', 'sat', 'sun', 'holiday'].includes(dayType);
}

/**
 * 견적 ID 생성
 * @returns {string} SW-YYYYMMDD-NNN
 */
function generateQuoteId() {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SW-${dateStr}-${random}`;
}

/**
 * 견적 유효 기간 계산
 * @returns {string}
 */
function getValidUntil() {
  const now = new Date();
  now.setDate(now.getDate() + priceData.policies.quoteValidDays);
  return now.toISOString().split('T')[0];
}

/**
 * 날짜까지 남은 일수
 * @param {Date|string} date
 * @returns {number}
 */
function getDaysUntil(date) {
  const target = new Date(date);
  const now = new Date();
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}

/**
 * 지역 데이터 가져오기
 * @param {string} regionCode
 * @returns {Object}
 */
function getRegionData(regionCode = 'yeosu') {
  return priceData.regions[regionCode] || priceData.regions[priceData.meta.defaultRegion];
}

/**
 * Active 버전의 소원항해단 가격 가져오기
 * @param {Object} region
 * @returns {Object}
 */
function getActiveWishVoyagePrices(region) {
  const activeVersion = region.wishVoyage.versions.find(v => v.status === 'active');
  return activeVersion ? activeVersion.items : {};
}

/**
 * 운영비 계산 (단체 할인 적용)
 * @param {number} guestCount
 * @param {Object} fees
 * @returns {{ total, perPerson, negotiable, note }}
 */
function calculateOperationFee(guestCount, fees) {
  // 단체 할인 룰 확인
  const discountRule = fees.group_discount_rules.find(
    rule => guestCount >= rule.min && (rule.max === null || guestCount <= rule.max)
  );

  if (discountRule) {
    if (discountRule.operation_fee_per_person === null) {
      return { total: null, perPerson: null, negotiable: true, note: discountRule.note };
    }
    return {
      total: discountRule.operation_fee_per_person * guestCount,
      perPerson: discountRule.operation_fee_per_person,
      negotiable: false,
      note: discountRule.note
    };
  }

  // 기본 운영비
  return {
    total: fees.operation_fee_per_person * guestCount,
    perPerson: fees.operation_fee_per_person,
    negotiable: false,
    note: null
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 정책 검증
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 정책 검증
 * @param {Object} options
 * @returns {{ valid, errorCode?, message?, suggestion? }}
 */
function validatePolicy(options) {
  const { guestCount, hotel, region: regionCode = 'yeosu' } = options;
  const region = getRegionData(regionCode);

  // 1. 인원 수 체크 (최소 2인)
  if (!guestCount || guestCount < 2) {
    return {
      valid: false,
      errorCode: 'MIN_GUESTS',
      message: '최소 2인 이상 예약 가능합니다.',
      suggestion: '인원 수를 확인해주세요.'
    };
  }

  // 2. 호텔 유효성 체크
  if (hotel) {
    const hotelData = region.hotels[hotel];
    if (!hotelData) {
      return {
        valid: false,
        errorCode: 'INVALID_HOTEL',
        message: '유효하지 않은 호텔입니다.',
        suggestion: '호텔 옵션을 확인해주세요.'
      };
    }

    // 호텔 인원 제한 체크
    const { minGuests, maxGuests } = hotelData.policy;
    if (guestCount < minGuests || guestCount > maxGuests) {
      return {
        valid: false,
        errorCode: 'HOTEL_GUEST_LIMIT',
        message: `${hotelData.name}은(는) ${minGuests}~${maxGuests}인만 예약 가능합니다.`,
        suggestion: maxGuests < guestCount ? '다른 호텔을 선택해주세요.' : '인원 수를 확인해주세요.'
      };
    }
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════
// 견적 계산
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 견적 계산 메인 함수
 * @param {Object} options
 * @returns {Object} 견적 결과
 */
function calculateQuote(options) {
  const {
    guestCount,
    dayType: inputDayType,
    hotel,
    leisure,
    hasWishVoyage = false,
    wishVoyageType = 'basic',
    travelDate,
    region: regionCode = 'yeosu',
    includeAgencyCharge = false  // B2B용
  } = options;

  // 지역 데이터
  const region = getRegionData(regionCode);

  // 요일 타입 결정
  const dayType = travelDate ? getDayType(travelDate) : inputDayType;

  // 정책 검증
  const policyResult = validatePolicy({ guestCount, hotel, region: regionCode });
  if (!policyResult.valid) {
    return {
      success: false,
      error: policyResult.errorCode,
      message: policyResult.message,
      suggestion: policyResult.suggestion
    };
  }

  // 단체 여부
  const isGroup = guestCount >= priceData.policies.groupThreshold;

  // 가격 계산
  const breakdown = [];
  let totalCost = 0;
  let totalSell = 0;
  let totalList = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // 1. 호텔 가격
  // ─────────────────────────────────────────────────────────────────────────
  if (hotel && region.hotels[hotel]) {
    const hotelData = region.hotels[hotel];
    const hotelPrice = hotelData.pricing[dayType]?.[guestCount];

    if (hotelPrice) {
      breakdown.push({
        category: 'hotel',
        code: hotel,
        name: hotelData.name,
        roomType: hotelData.roomTypes[guestCount] || '객실',
        guests: guestCount,
        dayType: dayType,
        cost: hotelPrice.cost,
        sell: hotelPrice.sell,
        list: hotelPrice.list,
        quantity: 1
      });
      totalCost += hotelPrice.cost;
      totalSell += hotelPrice.sell;
      totalList += hotelPrice.list;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. 레저 가격 (1인당 × 인원)
  // ─────────────────────────────────────────────────────────────────────────
  if (leisure && region.leisure[leisure]) {
    const leisureData = region.leisure[leisure];
    const priceType = isWeekend(dayType) ? 'weekend' : 'weekday';
    const leisurePrice = leisureData[priceType];

    if (leisurePrice) {
      // variant 결정 (요트/유람선: weekday vs weekend_fireworks)
      let variant = null;
      if (leisureData.variant) {
        variant = typeof leisureData.variant === 'object'
          ? leisureData.variant[priceType]
          : leisureData.variant;
      }

      // cost 계산 (null이면 0으로 처리, manual_confirm_required 플래그)
      const unitCost = leisurePrice.cost ?? 0;
      const manualConfirm = leisureData.manual_confirm_required || leisurePrice.cost === null;

      breakdown.push({
        category: 'leisure',
        code: leisure,
        name: leisureData.name,
        perPerson: leisurePrice.sell,
        guests: guestCount,
        dayType: dayType,
        ...(variant && { variant }),  // weekday | weekend_fireworks
        ...(leisureData.costChannel && { costChannel: leisureData.costChannel }),
        cost: unitCost * guestCount,
        sell: leisurePrice.sell * guestCount,
        list: leisurePrice.list * guestCount,
        quantity: guestCount,
        ...(manualConfirm && { manual_confirm_required: true })
      });
      totalCost += unitCost * guestCount;
      totalSell += leisurePrice.sell * guestCount;
      totalList += leisurePrice.list * guestCount;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. 소원항해단 가격 (1인당 × 인원)
  // ─────────────────────────────────────────────────────────────────────────
  let wishVoyageLocation = null;
  if (hasWishVoyage) {
    const activeVersion = region.wishVoyage.versions.find(v => v.status === 'active');
    const wishVoyagePrices = activeVersion ? activeVersion.items : {};
    const voyagePrice = wishVoyagePrices[wishVoyageType];

    if (voyagePrice) {
      // 타입별 이름 설정
      const typeNames = {
        basic: '기본',
        online: '온라인 구매자',
        experience: '체험'
      };

      // [정책 P0] experience 장소 정책 적용
      if (wishVoyageType === 'experience' && activeVersion?.locationPolicy) {
        const isWeekendDay = isWeekend(dayType);
        wishVoyageLocation = isWeekendDay
          ? activeVersion.locationPolicy.weekend    // gallery_or_mongdol (ship 금지)
          : activeVersion.locationPolicy.weekday;   // ship_or_gallery
      }

      // cost 계산 (null이면 0으로 처리, manual_confirm_required 플래그)
      const unitCost = voyagePrice.cost ?? 0;
      const manualConfirm = voyagePrice.manual_confirm_required || voyagePrice.cost === null;

      breakdown.push({
        category: 'wishVoyage',
        code: wishVoyageType,
        name: `소원항해단 (${typeNames[wishVoyageType] || wishVoyageType})`,
        perPerson: voyagePrice.sell,
        guests: guestCount,
        cost: unitCost * guestCount,
        sell: voyagePrice.sell * guestCount,
        list: voyagePrice.list * guestCount,
        quantity: guestCount,
        ...(wishVoyageLocation && { location: wishVoyageLocation }),
        ...(manualConfirm && { manual_confirm_required: true })
      });
      totalCost += unitCost * guestCount;
      totalSell += voyagePrice.sell * guestCount;
      totalList += voyagePrice.list * guestCount;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 운영비 (단체 할인 적용)
  // ─────────────────────────────────────────────────────────────────────────
  const operationFee = calculateOperationFee(guestCount, region.fees);

  if (!operationFee.negotiable) {
    breakdown.push({
      category: 'operation',
      code: 'operation_fee',
      name: '여행 운영비 (플래너/운영)',
      perPerson: operationFee.perPerson,
      guests: guestCount,
      cost: 0,  // 운영비는 마진으로 포함
      sell: operationFee.total,
      list: operationFee.total,
      quantity: guestCount,
      note: operationFee.note
    });
    totalSell += operationFee.total;
    totalList += operationFee.total;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 여행사 차지 (B2B용, 선택적)
  // ─────────────────────────────────────────────────────────────────────────
  if (includeAgencyCharge) {
    const agencyTotal = region.fees.agency_charge_per_person * guestCount;
    breakdown.push({
      category: 'agency',
      code: 'agency_charge',
      name: '여행사 차지',
      perPerson: region.fees.agency_charge_per_person,
      guests: guestCount,
      cost: 0,
      sell: agencyTotal,
      list: agencyTotal,
      quantity: guestCount
    });
    totalSell += agencyTotal;
    totalList += agencyTotal;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. 무료 혜택 수집 (display용, 가격 차감 X)
  // ─────────────────────────────────────────────────────────────────────────
  const freeBenefits = region.benefits
    .filter(benefit => {
      if (benefit.condition === 'always') return true;
      if (benefit.condition === 'hasWishVoyage' && hasWishVoyage) return true;
      return false;
    })
    .map(benefit => ({
      key: benefit.key,
      label: benefit.label,
      value: benefit.value,
      totalValue: benefit.value * guestCount,
      items: benefit.items,
      displayText: benefit.displayText
    }));

  // ─────────────────────────────────────────────────────────────────────────
  // 7. 바우처 정보 (display용)
  // ─────────────────────────────────────────────────────────────────────────
  const voucher = {
    mode: region.voucher.defaultMode,
    split: region.voucher.split,
    totalSplitValue: Object.values(region.voucher.split).reduce((a, b) => a + b, 0) * guestCount,
    validityDays: region.voucher.validityDaysAfterCheckout
  };

  // 총 마진 및 할인
  const totalMargin = totalSell - totalCost;
  const totalSavings = totalList - totalSell;

  // ─────────────────────────────────────────────────────────────────────────
  // 결과 반환
  // ─────────────────────────────────────────────────────────────────────────
  return {
    success: true,
    quoteId: generateQuoteId(),
    priceVersion: priceData.meta.priceVersion,  // v1.1
    region: regionCode,
    isGroup: isGroup,
    guestCount: guestCount,
    dayType: dayType,

    pricing: {
      totalCost: totalCost,
      totalSell: totalSell,
      totalList: totalList,
      totalMargin: totalMargin,
      totalSavings: totalSavings,
      operationFee: operationFee.negotiable ? null : operationFee.total
    },

    breakdown: breakdown,
    freeBenefits: freeBenefits,
    voucher: voucher,

    validUntil: getValidUntil(),

    // experience 장소 정책 (P0)
    ...(wishVoyageLocation && {
      wishVoyageLocation: wishVoyageLocation
    }),

    // 단체 추가 정보
    ...(isGroup && {
      groupInfo: {
        message: '단체 맞춤 설계 중',
        subtitle: `${guestCount}명의 특별한 여행을 준비합니다!`,
        notice: '정확한 금액은 담당자 상담 후 확정됩니다.',
        priceRange: calculatePriceRange(totalSell),
        cta: '맞춤 상담 요청하기'
      }
    }),

    // 협의 필요 시
    ...(operationFee.negotiable && {
      negotiable: true,
      negotiableReason: '13인 이상 단체는 맞춤 견적이 필요합니다.'
    })
  };
}

/**
 * 단체 가격 범위 계산 (±10%)
 */
function calculatePriceRange(basePrice) {
  const min = Math.round(basePrice * 0.9);
  const max = Math.round(basePrice * 1.1);
  return `${min.toLocaleString()}원 ~ ${max.toLocaleString()}원`;
}

// ═══════════════════════════════════════════════════════════════════════════
// 리드 스코어링
// ═══════════════════════════════════════════════════════════════════════════

/**
 * 리드 스코어 계산
 * @param {Object} quoteData
 * @returns {{ score, grade }}
 */
function calculateLeadScore(quoteData) {
  let score = 0;

  // 1. 출발일 기준
  if (quoteData.travelDate) {
    const daysUntil = getDaysUntil(quoteData.travelDate);
    if (daysUntil <= 7) score += 30;
    else if (daysUntil <= 14) score += 20;
    else if (daysUntil <= 30) score += 10;
  }

  // 2. 소원항해단 선택
  if (quoteData.hasWishVoyage) score += 20;

  // 3. 단체 여부
  if (quoteData.isGroup) score += 20;

  // 4. 금액 기준
  const totalSell = quoteData.pricing?.totalSell || quoteData.totalSell || 0;
  if (totalSell >= 500000) score += 20;
  else if (totalSell >= 300000) score += 10;

  // 등급 결정
  let grade;
  if (score >= priceData.policies.leadScore.hot) {
    grade = 'hot';
  } else if (score >= priceData.policies.leadScore.warm) {
    grade = 'warm';
  } else {
    grade = 'cold';
  }

  return { score, grade };
}

/**
 * 자동 태그 생성
 * @param {Object} quoteData
 * @returns {string[]}
 */
function generateAutoTags(quoteData) {
  const tags = [];

  if (quoteData.isGroup) tags.push('단체');
  if (quoteData.hasWishVoyage) tags.push('소원항해단');
  if (['sat', 'sun', 'holiday'].includes(quoteData.dayType)) tags.push('주말여행');
  if (quoteData.travelDate) {
    const daysUntil = getDaysUntil(quoteData.travelDate);
    if (daysUntil <= 7) tags.push('급한예약');
  }

  return tags;
}

// ═══════════════════════════════════════════════════════════════════════════
// 모듈 내보내기
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // 핵심 함수
  generateQuoteId,
  validatePolicy,
  calculateQuote,

  // CRM 함수
  calculateLeadScore,
  generateAutoTags,

  // 유틸리티
  getDayType,
  isWeekend,
  getDaysUntil,
  getValidUntil,
  getRegionData,
  getActiveWishVoyagePrices,
  calculateOperationFee
};
