/**
 * Aurora5 - Analysis Service
 * Claude API를 사용한 7일 미션 분석
 *
 * @version 1.0
 */

const OpenAI = require('openai');

// OpenAI 클라이언트 (Claude 호환)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Claude API (Anthropic 직접 사용 시)
let anthropic = null;
try {
  const Anthropic = require('@anthropic-ai/sdk');
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
} catch (e) {
  console.log('Anthropic SDK not installed, using OpenAI');
}

/**
 * 7일 미션 분석 생성
 * @param {Object} normalizedPayload - 정규화된 페이로드
 * @returns {Object} 분석 결과 JSON
 */
async function generateMissionAnalysis(normalizedPayload) {
  const { nickname, wish, problem, context } = normalizedPayload;
  const userGoal = wish || problem || '목표를 이루고 싶어요';

  const systemPrompt = `당신은 "하루하루의 기적" 7일 여정 설계 전문가입니다.
사용자의 소원/목표를 받아 7일간 실천 가능한 작은 미션으로 분해합니다.

중요 원칙:
1. 각 미션은 5-10분 내 완료 가능해야 함
2. 첫날은 가장 쉽고, 점진적으로 도전적으로
3. 동양학/사주/운세 느낌 단어 절대 금지
4. 따뜻하고 현실적인 조언
5. 체크인 질문은 예/아니오로 답할 수 있게`;

  const userPrompt = `사용자 정보:
- 닉네임: ${nickname}
- 소원/목표: ${userGoal}
${context.situation ? `- 현재 상황: ${context.situation}` : ''}
${context.constraints ? `- 제약사항: ${context.constraints}` : ''}
${context.importance ? `- 중요도: ${context.importance}/5` : ''}

위 정보를 바탕으로 7일 미션을 설계해주세요.

반드시 아래 JSON 형식으로만 응답하세요:

{
  "promise": "사용자가 7일 동안 지킬 한 문장 약속 (200자 이내)",
  "todayAction": "오늘 바로 할 수 있는 첫걸음 (200자 이내)",
  "missions": [
    {
      "day": 1,
      "title": "약속 세우기",
      "task": "구체적인 오늘의 미션 설명",
      "minutes": 5,
      "checkinPrompt": "오늘 미션을 완료했나요?"
    },
    {
      "day": 2,
      "title": "장애물 고르기",
      "task": "가장 큰 장애물 하나를 적어보세요",
      "minutes": 5,
      "checkinPrompt": "장애물을 적었나요?"
    },
    {
      "day": 3,
      "title": "10분 행동",
      "task": "목표를 위해 딱 10분만 행동해보세요",
      "minutes": 10,
      "checkinPrompt": "10분 행동을 했나요?"
    },
    {
      "day": 4,
      "title": "도움 요청",
      "task": "한 사람에게 도움이나 응원을 요청해보세요",
      "minutes": 10,
      "checkinPrompt": "누군가에게 이야기했나요?"
    },
    {
      "day": 5,
      "title": "환경 세팅",
      "task": "목표 달성을 돕는 환경을 하나 만들어보세요",
      "minutes": 5,
      "checkinPrompt": "환경을 바꿨나요?"
    },
    {
      "day": 6,
      "title": "다음 단계",
      "task": "7일 이후 계속할 작은 습관을 정해보세요",
      "minutes": 10,
      "checkinPrompt": "다음 단계를 정했나요?"
    },
    {
      "day": 7,
      "title": "완주 정리",
      "task": "7일간의 여정을 돌아보고 한 줄로 정리해보세요",
      "minutes": 10,
      "checkinPrompt": "7일 여정을 완주했나요?"
    }
  ]
}

중요: JSON만 출력하세요. 다른 텍스트 없이 오직 JSON만!`;

  try {
    let rawText;

    // Anthropic API 사용 (우선)
    if (anthropic && process.env.ANTHROPIC_API_KEY) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [
          { role: 'user', content: userPrompt }
        ],
        system: systemPrompt
      });
      rawText = response.content[0].text;
    }
    // OpenAI API 사용 (대안)
    else {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      rawText = response.choices[0].message.content;
    }

    // JSON 파싱
    const analysis = parseAnalysisResponse(rawText);

    // 검증
    validateAnalysis(analysis);

    console.log(`✅ Analysis generated for: ${nickname}`);
    return analysis;

  } catch (error) {
    console.error('❌ Analysis generation failed:', error);
    throw error;
  }
}

/**
 * AI 응답 파싱
 */
function parseAnalysisResponse(rawText) {
  try {
    // JSON 블록 추출 시도
    const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // 직접 JSON 파싱
    const jsonStart = rawText.indexOf('{');
    const jsonEnd = rawText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return JSON.parse(rawText.slice(jsonStart, jsonEnd + 1));
    }

    throw new Error('No valid JSON found in response');

  } catch (error) {
    console.error('Parse error:', error);
    console.error('Raw text:', rawText);

    // 기본 응답 반환
    return getDefaultAnalysis();
  }
}

/**
 * 분석 결과 검증
 */
function validateAnalysis(analysis) {
  if (!analysis.promise || typeof analysis.promise !== 'string') {
    throw new Error('Missing or invalid promise');
  }

  if (!analysis.todayAction || typeof analysis.todayAction !== 'string') {
    throw new Error('Missing or invalid todayAction');
  }

  if (!Array.isArray(analysis.missions) || analysis.missions.length !== 7) {
    throw new Error('Missions must be an array of 7 items');
  }

  analysis.missions.forEach((mission, i) => {
    if (mission.day !== i + 1) {
      throw new Error(`Mission ${i + 1} has incorrect day: ${mission.day}`);
    }
    if (!mission.title || !mission.task || !mission.checkinPrompt) {
      throw new Error(`Mission ${i + 1} is missing required fields`);
    }
  });

  return true;
}

/**
 * 기본 분석 결과 (폴백)
 */
function getDefaultAnalysis() {
  return {
    promise: "매일 5분, 나를 위한 시간을 갖겠습니다",
    todayAction: "오늘 하루 목표를 종이에 적어보세요",
    missions: [
      { day: 1, title: "약속 세우기", task: "7일간 지킬 나만의 약속을 한 문장으로 적어보세요", minutes: 5, checkinPrompt: "약속을 적었나요?" },
      { day: 2, title: "장애물 발견", task: "목표를 막는 가장 큰 장애물 하나를 적어보세요", minutes: 5, checkinPrompt: "장애물을 찾았나요?" },
      { day: 3, title: "10분 실행", task: "목표를 위해 딱 10분만 행동해보세요", minutes: 10, checkinPrompt: "10분 행동했나요?" },
      { day: 4, title: "도움 요청", task: "한 사람에게 응원을 요청해보세요", minutes: 10, checkinPrompt: "누군가에게 말했나요?" },
      { day: 5, title: "환경 만들기", task: "목표 달성을 돕는 작은 환경 변화를 만드세요", minutes: 5, checkinPrompt: "환경을 바꿨나요?" },
      { day: 6, title: "다음 계획", task: "7일 이후 계속할 작은 습관을 정하세요", minutes: 10, checkinPrompt: "습관을 정했나요?" },
      { day: 7, title: "완주 정리", task: "7일간의 여정을 한 줄로 정리해보세요", minutes: 10, checkinPrompt: "완주했나요?" }
    ]
  };
}

/**
 * 분석 결과를 텍스트로 변환 (SMS/카톡용)
 */
function analysisToText(analysis, nickname) {
  let text = `🌟 ${nickname}님의 7일 여정\n\n`;
  text += `📝 약속: ${analysis.promise}\n\n`;
  text += `🚀 오늘의 첫걸음: ${analysis.todayAction}\n\n`;
  text += `━━━━━━━━━━━━━━\n`;
  text += `7일 미션 미리보기:\n`;

  analysis.missions.slice(0, 3).forEach(m => {
    text += `Day ${m.day}: ${m.title}\n`;
  });

  text += `...\n`;
  text += `━━━━━━━━━━━━━━\n`;
  text += `매일 오전 9시, 오늘의 미션이 도착합니다!`;

  return text;
}

module.exports = {
  generateMissionAnalysis,
  parseAnalysisResponse,
  validateAnalysis,
  getDefaultAnalysis,
  analysisToText
};
