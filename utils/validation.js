// 환경변수 검증 함수
function validateEnvironment() {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌  필수 환경변수가 누락되었습니다:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 해결 방법:');
    console.error('1. .env.example 파일을 복사하여 .env 파일을 생성하세요');
    console.error('2. .env 파일에 올바른 값들을 설정하세요');
    console.error('3. OpenAI API 키는 https://platform.openai.com/api-keys 에서 발급받으세요\n');
    process.exit(1);
  }

  // API 키 형식 검증 (OpenAI API 키는 'sk-'로 시작)
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('❌ OPENAI_API_KEY 형식이 올바르지 않습니다.');
    console.error('   OpenAI API 키는 "sk-"로 시작해야 합니다.');
    console.error('   https://platform.openai.com/api-keys 에서 올바른 키를 발급받으세요\n');
    process.exit(1);
  }

  console.log('✅ 환경변수 검증 완료');
}

module.exports = {
  validateEnvironment
};