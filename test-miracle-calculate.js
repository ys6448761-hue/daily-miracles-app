// 기적지수 계산 API 테스트

console.log('=== 기적지수 계산 API 테스트 ===\n');

const testData = {
  nickname: '희망이',
  birthdate: '1990-05-15',
  todayFeeling: '오늘은 기분이 좋아요. 날씨도 좋고 좋은 일이 생길 것 같아요.',
  recentEvent: '최근에 새로운 프로젝트를 시작했어요. 조금 긴장되지만 설레기도 해요.',
  hopeMessage: '건강하고 행복한 삶을 살고 싶어요. 사랑하는 사람들과 함께요.'
};

console.log('📋 테스트 데이터:');
console.log(JSON.stringify(testData, null, 2));
console.log('\n');

// API 호출 시뮬레이션
console.log('🔧 API 엔드포인트: POST /api/miracle/calculate');
console.log('📍 URL: http://localhost:5000/api/miracle/calculate');
console.log('\n');

console.log('✅ 테스트 케이스:');
console.log('1. 닉네임 포함');
console.log('2. 생년월일 포함');
console.log('3. 긍정적인 감정 표현');
console.log('4. 상세한 답변');
console.log('5. 희망 메시지 포함');
console.log('\n');

console.log('📊 예상 결과:');
console.log('- miracleIndex: 70-85 (긍정적인 답변으로 높은 점수 예상)');
console.log('- predictions: 5개 (1주일~1년)');
console.log('- analysis: 종합 분석 텍스트');
console.log('\n');

console.log('🧪 실제 테스트 방법:');
console.log(`
curl -X POST http://localhost:5000/api/miracle/calculate \\
  -H "Content-Type: application/json" \\
  -d '{
    "nickname": "희망이",
    "birthdate": "1990-05-15",
    "todayFeeling": "오늘은 기분이 좋아요",
    "recentEvent": "새로운 프로젝트를 시작했어요",
    "hopeMessage": "건강하고 행복한 삶을 살고 싶어요"
  }'
`);

console.log('\n=== 테스트 준비 완료 ===');
console.log('서버 실행 후 위 curl 명령어를 실행하세요! 🚀');
