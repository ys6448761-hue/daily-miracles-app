require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function simpleTest() {
  console.log('🔍 OpenAI API 연결 테스트 시작...');
  console.log('🔑 API 키:', process.env.OPENAI_API_KEY ? 'OK' : '❌ 없음');
  console.log('🔑 API 키 미리보기:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : '없음');

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "안녕! 간단하게 인사만 해줘." }],
      max_tokens: 50
    });

    console.log('✅ API 연결 성공!');
    console.log('🤖 GPT-4 응답:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.error('❌ API 연결 실패:', error.message);
    return false;
  }
}

simpleTest();
