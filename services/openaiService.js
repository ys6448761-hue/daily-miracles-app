const { OpenAI } = require('openai');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 스토리 텍스트 생성
async function generateStoryText(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "당신은 한국의 정서와 지브리 애니메이션의 감성을 결합한 전문 아동 스토리북 작가입니다. 각 장면마다 이미지 설명을 정확한 형식으로 포함해야 합니다."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 2000,
    temperature: 0.8
  });

  return completion.choices[0].message.content;
}

// 개별 이미지 생성
async function generateImage(prompt) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: prompt,
    n: 1,
    size: "1024x1024",
    quality: "standard",
    style: "natural"
  });

  return response.data[0].url;
}

module.exports = {
  generateStoryText,
  generateImage
};