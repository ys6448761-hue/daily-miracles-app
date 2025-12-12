/**
 * Claude API를 사용한 문제 분석 서비스
 * @module claudeAnalysisService
 */

const OpenAI = require('openai');

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Claude API로 문제를 깊이 있게 분석
 *
 * @param {Object} params
 * @param {string} params.category - 카테고리
 * @param {string} params.categoryName - 카테고리 이름
 * @param {Array} params.conversation - 대화 내역
 * @param {string} params.nickname - 사용자 닉네임
 * @returns {Promise<Object>} 분석 결과
 */
async function analyzeWithClaude({ category, categoryName, conversation, nickname }) {
  try {
    // Conversation 데이터 추출
    const level1 = conversation.find(c => c.level === 1)?.answer || '';
    const level2 = conversation.find(c => c.level === 2)?.answer || '';
    const level3 = conversation.find(c => c.level === 3)?.answer || '';
    const level4 = conversation.find(c => c.level === 4)?.answer || '';
    const level5 = conversation.find(c => c.level === 5)?.answer || '';

    // Claude 프롬프트 생성
    const prompt = buildAnalysisPrompt({
      nickname,
      category: categoryName,
      level1,
      level2,
      level3,
      level4,
      level5
    });

    // OpenAI API 호출 (GPT-4)
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '당신은 심리 상담 전문가이자 문제 해결 컨설턴트입니다. 사용자의 고민을 깊이 분석하고, 구체적이고 실행 가능한 해결책을 제시합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const rawText = response.choices[0].message.content;

    // 응답 파싱 (JSON 형식으로 요청했으므로)
    const analysis = parseAnalysisResponse(rawText);

    return analysis;

  } catch (error) {
    console.error('Claude API 호출 오류:', error);
    throw new Error('분석 생성 중 오류가 발생했습니다.');
  }
}

/**
 * 분석 프롬프트 생성
 */
function buildAnalysisPrompt({ nickname, category, level1, level2, level3, level4, level5 }) {
  return `
# 문제 분석 요청

**사용자**: ${nickname}
**카테고리**: ${category}

## 대화 내역
1. **기본 문제**: ${level1}
2. **구체적 상황**: ${level2}
3. **문제 패턴**: ${level3}
4. **시도한 대응**: ${level4}
5. **원하는 결과**: ${level5}

---

위 정보를 바탕으로, 다음 형식의 JSON으로 분석 결과를 작성해주세요:

\`\`\`json
{
  "summary": "한 문장으로 핵심 요약 (40자 이내)",
  "coreIssue": "문제의 핵심 (100자 이내)",
  "emotionalPattern": "감정 패턴 분석 (100자 이내)",
  "rootCause": "근본 원인 (100자 이내)",
  "insights": [
    "인사이트 1 (구체적이고 공감 가능하게)",
    "인사이트 2",
    "인사이트 3"
  ],
  "options": [
    {
      "title": "선택지 1 제목",
      "description": "선택지 상세 설명 (150자 이내)",
      "pros": ["장점 1", "장점 2"],
      "cons": ["단점 1"],
      "difficulty": "쉬움"
    },
    {
      "title": "선택지 2 제목",
      "description": "선택지 상세 설명",
      "pros": ["장점 1", "장점 2"],
      "cons": ["단점 1"],
      "difficulty": "보통"
    }
  ],
  "nextActions": [
    {
      "action": "구체적인 행동 1 (명령형)",
      "why": "이 행동이 필요한 이유",
      "how": "구체적인 실행 방법",
      "timeline": "이번 주"
    },
    {
      "action": "구체적인 행동 2",
      "why": "이유",
      "how": "방법",
      "timeline": "1개월"
    }
  ],
  "warnings": [
    "조심해야 할 신호 1",
    "조심해야 할 신호 2"
  ]
}
\`\`\`

**중요**:
- 공감적이면서도 구체적으로 작성
- 실행 가능한 행동 위주
- 부정적 표현보다는 긍정적 방향 제시
- JSON 형식을 정확히 지켜주세요
`;
}

/**
 * Claude 응답 파싱
 */
function parseAnalysisResponse(rawText) {
  try {
    // JSON 블록 추출
    const jsonMatch = rawText.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }

    // JSON 블록이 없으면 전체를 파싱 시도
    return JSON.parse(rawText);

  } catch (error) {
    console.error('분석 결과 파싱 오류:', error);

    // 기본 응답 반환
    return {
      summary: '문제 분석이 완료되었습니다.',
      coreIssue: '추가 정보가 필요합니다.',
      emotionalPattern: '현재 상황에 대한 스트레스를 경험하고 있습니다.',
      rootCause: '근본 원인을 파악 중입니다.',
      insights: [
        '현재 상황을 객관적으로 바라보는 것이 중요합니다.',
        '작은 변화부터 시작해보세요.',
        '도움을 요청하는 것을 두려워하지 마세요.'
      ],
      options: [
        {
          title: '선택지 1: 현재 상황 정리하기',
          description: '지금까지의 상황을 글로 정리해보세요.',
          pros: ['생각 정리', '객관적 시각'],
          cons: ['시간 소요'],
          difficulty: '쉬움'
        }
      ],
      nextActions: [
        {
          action: '오늘 30분 시간 내어 상황 정리하기',
          why: '객관적 관점을 가질 수 있습니다',
          how: '노트에 시간 순서대로 상황을 적어보세요',
          timeline: '오늘'
        }
      ],
      warnings: []
    };
  }
}

module.exports = {
  analyzeWithClaude
};
