// 하루하루의 기적 - 5단계 질문 시스템 테스트
// Version 1.0 - 2025.10.11

const { problemQuestions, detectCategory } = require('./problem_questions.js');

console.log("=".repeat(60));
console.log("🎯 하루하루의 기적 - 문제해결 질문 시스템 테스트");
console.log("=".repeat(60));
console.log("");

// ============================================
// 테스트 1: 카테고리 자동 감지
// ============================================
console.log("📌 테스트 1: 카테고리 자동 감지");
console.log("-".repeat(60));

const testCases = [
  "상사가 저를 무시해요",
  "남자친구와 헤어질까 고민이에요",
  "부모님과 대화가 안 돼요",
  "우울하고 불안해요",
  "빚 때문에 힘들어요",
  "진로를 못 정하겠어요",
  "공부가 안 돼요",
  "자신감이 없어요",
  "게임을 끊고 싶어요",
  "친구가 저를 따돌려요"
];

testCases.forEach((input, index) => {
  const category = detectCategory(input);
  console.log(`${index + 1}. 입력: "${input}"`);
  console.log(`   → 감지: ${category} (${problemQuestions[category].category})`);
  console.log("");
});

// ============================================
// 테스트 2: 질문 구조 확인
// ============================================
console.log("=".repeat(60));
console.log("📌 테스트 2: 직장 카테고리 질문 구조");
console.log("-".repeat(60));

const workQuestions = problemQuestions["직장"];
console.log(`카테고리: ${workQuestions.category}`);
console.log("");
console.log(`Level 1: ${workQuestions.level1.question}`);
console.log(`Level 2: ${workQuestions.level2.question}`);
console.log(`Level 3: ${workQuestions.level3.question}`);
console.log("선택지:");
workQuestions.level3.options.forEach((opt, idx) => {
  console.log(`  ${idx + 1}. ${opt}`);
});
console.log(`Level 4: ${workQuestions.level4.question}`);
console.log(`Level 5: ${workQuestions.level5.question}`);
console.log("");

// ============================================
// 테스트 3: 실제 사용자 플로우 시뮬레이션
// ============================================
console.log("=".repeat(60));
console.log("📌 테스트 3: 실제 사용자 플로우 시뮬레이션");
console.log("-".repeat(60));
console.log("");

const userInput = "동료가 저를 따돌려요";
const category = detectCategory(userInput);
const questions = problemQuestions[category];

console.log(`👤 사용자 초기 입력: "${userInput}"`);
console.log(`🤖 AI 감지 카테고리: ${category} (${questions.category})`);
console.log("");

console.log("💬 대화 시작:");
console.log("-".repeat(60));

console.log(`\n[AI] ${questions.level1.question}`);
console.log(`[사용자] 동료가 프로젝트에서 저만 빼고 회의해요`);

console.log(`\n[AI] ${questions.level2.question}`);
console.log(`[사용자] 3개월 전부터 중요한 회의에 저만 초대 안 받아요`);

console.log(`\n[AI] ${questions.level3.question}`);
questions.level3.options.forEach((opt, idx) => {
  console.log(`     ${opt}`);
});
console.log(`[사용자] B번이요 (동료와 의견 충돌이나 소통 문제가 계속됨)`);

console.log(`\n[AI] ${questions.level4.question}`);
console.log(`[사용자] 처음엔 무시했는데 이제는 직접 물어봤어요`);

console.log(`\n[AI] ${questions.level5.question}`);
console.log(`[사용자] 팀에서 인정받고 원활하게 협업하고 싶어요`);

console.log("");
console.log("-".repeat(60));
console.log("✅ 5단계 질문 완료!");
console.log("");

// ============================================
// 테스트 4: 모든 카테고리 확인
// ============================================
console.log("=".repeat(60));
console.log("📌 테스트 4: 전체 카테고리 목록");
console.log("-".repeat(60));

const categories = Object.keys(problemQuestions);
console.log(`총 ${categories.length}개 카테고리:`);
console.log("");

categories.forEach((key, index) => {
  const cat = problemQuestions[key];
  console.log(`${index + 1}. ${key} → ${cat.category}`);
  console.log(`   Level 3 선택지 수: ${cat.level3.options.length}개`);
});

console.log("");
console.log("=".repeat(60));
console.log("🎉 모든 테스트 완료!");
console.log("=".repeat(60));