// 애플리케이션 상수 정의
const MAX_CONCURRENT_REQUESTS = 5;

const STORY_PROMPT_TEMPLATE = `당신은 한국의 감성과 지브리 스타일을 결합한 아동용 스토리북 작가입니다.

**주인공 정보:**
- 이름: {name} ({age}세)
- 성격: {personality}
- 취미: {hobby}
- 꿈: {dreamJob}
- 좋아하는 색깔: {favoriteColor}
- 좋아하는 동물: {favoriteAnimal}
- 특별한 기억: {specialMemory}

**중요한 형식 요구사항:**
각 페이지를 정확히 다음과 같은 형식으로 작성해주세요:

## 페이지 1: [제목]
**이미지:** [한 줄로 간단하고 구체적인 장면 묘사 - 영어로 작성]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

## 페이지 2: [제목]
**이미지:** [한 줄로 간단하고 구체적인 장면 묘사 - 영어로 작성]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

(이런 식으로 10개 페이지까지)

**주의사항:**
- 각 이미지 설명은 영어로 작성
- 한 줄에 50단어 이내로 간단하게
- 지브리 스타일에 맞는 따뜻하고 아름다운 장면 묘사
- 한국의 사계절 배경 활용

지브리 애니메이션의 따뜻하고 환상적인 분위기로 10개 페이지의 완전한 이야기를 만들어주세요.
각 페이지는 독립적이면서도 전체적으로 연결되는 아름다운 스토리가 되어야 합니다.`;

const IMAGE_STYLE_PROMPT = `
Beautiful, warm, hand-drawn animation style with soft colors and magical atmosphere.
Korean seasonal landscape background. Child-friendly, heartwarming scene.
High quality, detailed artwork similar to Spirited Away or My Neighbor Totoro.`;

const BLANK_FRAME_PROMPT = `An empty, beautiful frame ready to be filled with dreams and future stories.

Soft, dreamy background with gentle clouds and warm golden light.
Korean traditional paper texture with decorative borders.
Inspiring and hopeful atmosphere, like a blank page waiting for a beautiful story.
Ghibli-style soft colors and magical feeling.
Empty center space with text "여기에 당신의 미래가 그려집니다" in elegant Korean calligraphy.`;

module.exports = {
  MAX_CONCURRENT_REQUESTS,
  STORY_PROMPT_TEMPLATE,
  IMAGE_STYLE_PROMPT,
  BLANK_FRAME_PROMPT
};