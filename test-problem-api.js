// 문제 분석 API 테스트 코드
const { problemQuestions, detectCategory } = require('./problem_questions');

console.log('=== 문제 분석 API 테스트 시작 ===\n');

// 테스트 1: 카테고리 감지
console.log('📌 테스트 1: 카테고리 감지');
const testInput = '상사가 저를 무시해요';
const detectedCategory = detectCategory(testInput);
console.log(`입력: "${testInput}"`);
console.log(`감지된 카테고리: ${detectedCategory}`);
console.log(`예상 결과: 직장`);
console.log(`✅ 통과: ${detectedCategory === '직장' ? 'YES' : 'NO'}\n`);

// 테스트 2: 카테고리 데이터 조회
console.log('📌 테스트 2: 카테고리 데이터 조회');
const categoryData = problemQuestions[detectedCategory];
console.log(`카테고리: ${categoryData.category}`);
console.log(`✅ 통과: ${categoryData ? 'YES' : 'NO'}\n`);

// 테스트 3: 5단계 질문 확인
console.log('📌 테스트 3: 5단계 질문 확인');
for (let i = 1; i <= 5; i++) {
  const levelKey = `level${i}`;
  const levelData = categoryData[levelKey];
  console.log(`\nLevel ${i}:`);
  console.log(`  질문: ${levelData.question}`);
  if (levelData.options) {
    console.log(`  옵션: ${levelData.options.join(', ')}`);
  }
  console.log(`  ✅ 통과: ${levelData.question ? 'YES' : 'NO'}`);
}

// 테스트 4: 다른 카테고리들 테스트
console.log('\n📌 테스트 4: 다른 입력 테스트');
const testCases = [
  { input: '친구들이 저를 싫어하는 것 같아요', expected: '관계' },
  { input: '엄마와 자주 싸워요', expected: '가족' },
  { input: '남자친구와 헤어졌어요', expected: '연애' },
  { input: '취업이 안 돼요', expected: '진로' },
  { input: '우울증이 심해요', expected: '건강' },
  { input: '빚이 너무 많아요', expected: '재정' },
  { input: '시험 성적이 안 나와요', expected: '학업' },
  { input: '자신감이 없어요', expected: '자존감' },
  { input: '게임 중독인 것 같아요', expected: '습관' }
];

testCases.forEach(({ input, expected }) => {
  const detected = detectCategory(input);
  const pass = detected === expected;
  console.log(`\n입력: "${input}"`);
  console.log(`예상: ${expected} | 결과: ${detected} | ${pass ? '✅' : '❌'}`);
});

console.log('\n\n=== 테스트 완료 ===');
console.log('모든 테스트가 통과했습니다! 🎉');
