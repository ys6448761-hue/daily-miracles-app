/**
 * Wix 온라인 폼 입력을 내부 conversation 구조로 변환
 * @module wishConverter
 */

const { detectCategory, problemQuestions } = require('../problem_questions');

/**
 * Wix 폼 입력을 conversation 배열로 변환
 *
 * @param {Object} wishInput - Wix 폼 입력
 * @param {string} wishInput.wishSummary - 고민 요약
 * @param {string} wishInput.situation - 구체적 상황
 * @param {string} wishInput.tries - 시도한 것들
 * @param {string} wishInput.constraints - 제약사항
 * @param {string} wishInput.focus - 집중 포인트
 * @returns {Object} { category, categoryName, conversation }
 */
function buildConversationFromWish(wishInput) {
  const { wishSummary, situation, tries, constraints, focus } = wishInput;

  // 1. 카테고리 자동 감지
  const category = detectCategory(wishSummary || '');
  const categoryData = problemQuestions[category];
  const categoryName = categoryData?.category || '대인관계';

  // 2. Conversation 구조 생성
  const conversation = [];

  // Level 1: 기본 문제
  if (wishSummary) {
    conversation.push({
      level: 1,
      question: categoryData.level1.question,
      answer: wishSummary
    });
  }

  // Level 2: 구체적 상황
  if (situation) {
    conversation.push({
      level: 2,
      question: categoryData.level2.question,
      answer: situation
    });
  } else {
    // situation이 없으면 wishSummary 재사용
    conversation.push({
      level: 2,
      question: categoryData.level2.question,
      answer: wishSummary
    });
  }

  // Level 3: 패턴 선택 (AI가 자동 매핑)
  // 실제로는 Claude에게 options 중 하나를 선택하게 할 수 있음
  conversation.push({
    level: 3,
    question: categoryData.level3.question,
    answer: categoryData.level3.options?.[0] || '상황을 분석 중입니다'
  });

  // Level 4: 시도한 대응
  if (tries) {
    conversation.push({
      level: 4,
      question: categoryData.level4.question,
      answer: tries
    });
  } else {
    conversation.push({
      level: 4,
      question: categoryData.level4.question,
      answer: '아직 특별한 시도를 하지 못했습니다'
    });
  }

  // Level 5: 원하는 결과 (focus + constraints 조합)
  let level5Answer = focus || '문제를 해결하고 싶습니다';
  if (constraints) {
    level5Answer += `\n제약사항: ${constraints}`;
  }

  conversation.push({
    level: 5,
    question: categoryData.level5.question,
    answer: level5Answer
  });

  return {
    category,
    categoryName,
    conversation
  };
}

/**
 * Report ID 생성
 */
function generateReportId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `report_${timestamp}_${random}`;
}

module.exports = {
  buildConversationFromWish,
  generateReportId
};
