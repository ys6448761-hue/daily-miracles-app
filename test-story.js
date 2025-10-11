// test-story.js - 실제 개인화 스토리 생성 테스트
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 테스트용 개인 정보
const testChild = {
  name: "지민",
  age: 8,
  hobby: "그림 그리기와 책 읽기",
  dreamJob: "화가",
  personality: "상상력이 풍부하고 호기심이 많은",
  favoriteColor: "보라색",
  favoriteAnimal: "고양이",
  specialMemory: "할머니와 함께 꽃밭에서 그림을 그렸던 날"
};

// 개선된 스토리 프롬프트
function createStoryPrompt(child) {
  return `당신은 한국의 감성과 지브리 스타일을 결합한 아동용 스토리북 작가입니다.

**주인공 정보:**
- 이름: ${child.name} (${child.age}세)
- 성격: ${child.personality}
- 취미: ${child.hobby}
- 꿈: ${child.dreamJob}
- 좋아하는 색깔: ${child.favoriteColor}
- 좋아하는 동물: ${child.favoriteAnimal}
- 특별한 기억: ${child.specialMemory}

**스토리 제작 가이드라인:**
1. 지브리 애니메이션의 따뜻하고 환상적인 분위기
2. 한국의 사계절과 자연을 배경으로 활용 (벚꽃, 단풍, 눈 등)
3. 아이의 꿈과 성장, 가족의 사랑을 중심 주제로
4. 8-12세 아이들이 이해하기 쉬운 따뜻한 언어 사용
5. 총 5개 장면으로 구성

**각 장면 형식:**
## 장면 [번호]: [제목]

**이미지 설명:** [지브리 스타일의 구체적이고 아름다운 장면 묘사]

**스토리:**
[2-3문단의 따뜻하고 감동적인 이야기]

---

이런 형식으로 5개 장면을 만들어주세요. 마지막 장면에서는 따뜻한 결말과 아이에게 주는 사랑스러운 메시지를 담아주세요.`;
}

async function generatePersonalizedStory() {
  console.log('✨ 개인화 스토리북 생성 테스트 시작');
  console.log('=' .repeat(50));
  console.log(`📝 주인공: ${testChild.name} (${testChild.age}세)`);
  console.log(`🎨 특징: ${testChild.personality}`);
  console.log(`💭 꿈: ${testChild.dreamJob}`);
  console.log('=' .repeat(50));

  try {
    const prompt = createStoryPrompt(testChild);
    console.log('⏳ AI가 특별한 이야기를 만들고 있어요...');
    
    const startTime = Date.now();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 정서와 지브리 애니메이션의 감성을 결합한 전문 아동 스토리북 작가입니다. 아이들의 꿈과 성장을 다루는 따뜻하고 감동적인 이야기를 만들어주세요."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    
    console.log(`✅ 스토리 생성 완료! (${duration}초 소요)`);
    
    const story = completion.choices[0].message.content;
    const usage = completion.usage;
    const estimatedCost = Math.round(usage.total_tokens * 0.03 / 1000 * 1300);
    
    console.log('\n' + '🌟'.repeat(50));
    console.log(`📖 ${testChild.name}님만을 위한 특별한 이야기`);
    console.log('🌟'.repeat(50));
    console.log(story);
    console.log('🌟'.repeat(50));
    
    console.log('\n📊 생성 정보:');
    console.log(`⏱️  소요 시간: ${duration}초`);
    console.log(`🔢 사용 토큰: ${usage.total_tokens}`);
    console.log(`💰 예상 비용: ₩${estimatedCost}원`);
    
    console.log('\n🎉 스토리북 생성 성공!');
    console.log('💡 다음 단계: 웹 서버 실행해서 실제 서비스 테스트');
    
    return {
      success: true,
      story: story,
      duration: duration,
      cost: estimatedCost,
      tokens: usage.total_tokens
    };

  } catch (error) {
    console.error('❌ 스토리 생성 실패:', error.message);
    return { success: false, error: error.message };
  }
}

// 실행
generatePersonalizedStory();