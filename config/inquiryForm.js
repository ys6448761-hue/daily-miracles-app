/**
 * MVP 1차 폼 설정 (60초 컷)
 * - 고객에게는 상품군만 선택하게 해서 복잡도/이탈 감소
 * - 내부에서만 태그로 분기
 *
 * @version 1.0 - 2025.12.13
 */

// 상품 유형 옵션
const PRODUCT_TYPE_OPTIONS = {
  PASS: {
    label: "투어패스 (추천 포함)",
    tag: "PASS",
    description: "여수 여행 전체를 패키지로 즐기고 싶어요"
  },
  SINGLE: {
    label: "단품 (소원교환)",
    tag: "SINGLE",
    description: "특정 체험이나 장소만 예약하고 싶어요"
  },
  RECOMMEND: {
    label: "모르겠어요 (추천해주세요)",
    tag: "RECOMMEND",
    description: "어떤 게 좋을지 추천받고 싶어요"
  }
};

// 출발 권역 옵션
const REGION_OPTIONS = [
  { value: "seoul", label: "서울" },
  { value: "gyeonggi", label: "경기" },
  { value: "chungcheong", label: "충청" },
  { value: "gyeongsang", label: "경상" },
  { value: "other", label: "기타" }
];

// 희망 일정 옵션
const SCHEDULE_OPTIONS = [
  { value: "this_month", label: "이번 달" },
  { value: "next_month", label: "다음 달" },
  { value: "undecided", label: "미정" }
];

// 인원 옵션
const GROUP_SIZE_OPTIONS = [
  { value: "1", label: "1명 (혼자)" },
  { value: "2", label: "2명" },
  { value: "3-4", label: "3~4명" },
  { value: "5+", label: "5명 이상" }
];

// 1차 폼 질문 정의
const INQUIRY_QUESTIONS = [
  {
    id: "Q1",
    field: "productType",
    question: "어떤 형태의 여행을 원하시나요?",
    type: "select",
    options: Object.values(PRODUCT_TYPE_OPTIONS),
    required: true,
    placeholder: "선택해주세요"
  },
  {
    id: "Q2",
    field: "region",
    question: "어디서 출발하시나요?",
    type: "select",
    options: REGION_OPTIONS,
    required: true,
    placeholder: "출발 지역 선택"
  },
  {
    id: "Q3",
    field: "schedule",
    question: "언제 여행을 계획하고 계신가요?",
    type: "select",
    options: SCHEDULE_OPTIONS,
    required: true,
    placeholder: "희망 일정 선택",
    subField: {
      field: "preferredDate",
      question: "구체적인 날짜가 있으시면 알려주세요",
      type: "date",
      required: false,
      placeholder: "선택사항"
    }
  },
  {
    id: "Q4",
    field: "groupSize",
    question: "몇 분이 함께 하시나요?",
    type: "select",
    options: GROUP_SIZE_OPTIONS,
    required: true,
    placeholder: "인원 선택"
  },
  {
    id: "Q5",
    field: "contact",
    question: "연락 가능한 카카오톡 ID 또는 휴대폰 번호를 알려주세요",
    type: "text",
    required: true,
    placeholder: "예: kakao123 또는 010-1234-5678",
    validation: {
      minLength: 5,
      pattern: "^[a-zA-Z0-9가-힣@._-]+$|^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$"
    }
  },
  {
    id: "Q6",
    field: "request",
    question: "추가로 요청하실 내용이 있으신가요?",
    type: "textarea",
    required: false,
    placeholder: "예: 휠체어 이용, 반려견 동반, 특별한 기념일 등 (선택사항)",
    maxLength: 500
  }
];

/**
 * 상품 유형에서 내부 태그 추출
 * @param {string} productType - 사용자 선택값 (PASS/SINGLE/RECOMMEND 또는 label)
 * @returns {string} 내부 태그
 */
function getTagFromProductType(productType) {
  // 직접 태그로 들어온 경우
  if (["PASS", "SINGLE", "RECOMMEND"].includes(productType)) {
    return productType;
  }

  // label로 들어온 경우
  for (const [key, option] of Object.entries(PRODUCT_TYPE_OPTIONS)) {
    if (option.label === productType || option.label.includes(productType)) {
      return option.tag;
    }
  }

  // 기본값
  return "RECOMMEND";
}

/**
 * 접수번호 생성
 * @returns {string} 접수번호 (예: INQ-20251213-abc123)
 */
function generateInquiryId() {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8);
  return `INQ-${dateStr}-${random}`;
}

/**
 * 1차 폼 입력 검증
 * @param {Object} formData - 폼 입력 데이터
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateInquiryForm(formData) {
  const errors = [];

  // 필수 필드 검증
  const requiredFields = ["productType", "region", "schedule", "groupSize", "contact"];

  for (const field of requiredFields) {
    if (!formData[field] || formData[field].trim() === "") {
      const question = INQUIRY_QUESTIONS.find(q => q.field === field);
      errors.push(`${question?.question || field}은(는) 필수 입력입니다.`);
    }
  }

  // 연락처 형식 검증
  if (formData.contact) {
    const contact = formData.contact.trim();
    const isKakao = /^[a-zA-Z0-9가-힣@._-]{3,30}$/.test(contact);
    const isPhone = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(contact);

    if (!isKakao && !isPhone) {
      errors.push("연락처 형식이 올바르지 않습니다. 카카오톡 ID 또는 휴대폰 번호를 입력해주세요.");
    }
  }

  // 요청사항 길이 검증
  if (formData.request && formData.request.length > 500) {
    errors.push("요청사항은 500자 이내로 입력해주세요.");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  PRODUCT_TYPE_OPTIONS,
  REGION_OPTIONS,
  SCHEDULE_OPTIONS,
  GROUP_SIZE_OPTIONS,
  INQUIRY_QUESTIONS,
  getTagFromProductType,
  generateInquiryId,
  validateInquiryForm
};
