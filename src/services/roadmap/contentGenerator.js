// ═══════════════════════════════════════════════════════════
// Content Generator Service
// OpenAI를 사용한 맞춤형 콘텐츠 생성
// ═══════════════════════════════════════════════════════════

const openaiService = require('../openaiService');

// ═══════════════════════════════════════════════════════════
// Content Generation Prompts
// ═══════════════════════════════════════════════════════════

function buildRoadmapPrompt(userData) {
  return `당신은 30일 기적 로드맵을 만드는 전문가입니다.

사용자 정보:
- 이름: ${userData.name}
- 소원: ${userData.wish}
- 카테고리: ${userData.category || '자기계발'}
- 나이: ${userData.age || '알 수 없음'}
- 성별: ${userData.gender || '알 수 없음'}

이 사용자를 위한 30일 로드맵을 만들어주세요. 다음 형식의 JSON으로 답변해주세요:

{
  "miracleScore": 80-95 사이의 숫자,
  "week1": {
    "title": "시작",
    "intro": "1주차 소개 (1-2문장)",
    "goals": ["목표1", "목표2", "목표3"],
    "advice": "개인화된 조언 (2-3문장)",
    "daily": {
      "mon": "월요일 할 일",
      "tue": "화요일 할 일",
      "wed": "수요일 할 일",
      "thu": "목요일 할 일",
      "fri": "금요일 할 일",
      "weekend": "주말 할 일"
    }
  },
  "week2": { ... 동일한 구조 },
  "week3": { ... 동일한 구조 },
  "week4": { ... 동일한 구조 },
  "morningRoutine": "아침 루틴 (3-4문장)",
  "eveningReview": "저녁 점검 (3-4문장)",
  "stories": [
    {
      "title": "성공 사례 제목",
      "content": "성공 사례 내용 (3-4문장)"
    },
    { ... 총 3개 }
  ]
}

중요:
- 각 주차는 점진적으로 난이도가 올라가야 합니다
- 구체적이고 실행 가능한 목표를 제시하세요
- 사용자의 소원과 직접 관련된 내용만 포함하세요
- 긍정적이고 격려하는 톤을 사용하세요
- 성공 사례는 같은 카테고리의 실제 성공담처럼 작성하세요
- 반드시 JSON 형식으로만 답변하세요 (다른 텍스트 없이)`;
}

// ═══════════════════════════════════════════════════════════
// Fast Content Generation
// ═══════════════════════════════════════════════════════════

async function generateRoadmapContent(userData) {
  const startTime = Date.now();

  try {
    console.log(`✨ 콘텐츠 생성 시작: ${userData.name}님의 "${userData.wish}"`);

    const prompt = buildRoadmapPrompt(userData);

    // OpenAI API 호출
    const response = await openaiService.callAPI({
      model: 'gpt-4o-mini', // 빠른 모델 사용
      messages: [
        {
          role: 'system',
          content: '당신은 30일 기적 로드맵을 만드는 전문가입니다. 항상 JSON 형식으로만 답변합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 3000
    });

    // JSON 파싱
    let content;
    try {
      const jsonText = extractJSON(response);
      content = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON 파싱 실패, 기본 콘텐츠 사용');
      content = getDefaultContent(userData);
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ 콘텐츠 생성 완료: ${elapsed}ms`);

    return {
      success: true,
      content: content,
      time: elapsed
    };

  } catch (error) {
    console.error('❌ 콘텐츠 생성 실패:', error);

    // 폴백: 기본 콘텐츠 반환
    return {
      success: false,
      content: getDefaultContent(userData),
      time: Date.now() - startTime,
      error: error.message
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function extractJSON(text) {
  // JSON 추출 (마크다운 코드 블록 제거 등)
  let json = text.trim();

  // 코드 블록 제거
  json = json.replace(/```json\n/g, '');
  json = json.replace(/```\n/g, '');
  json = json.replace(/```/g, '');

  // 앞뒤 공백 제거
  json = json.trim();

  return json;
}

function getDefaultContent(userData) {
  // 기본 폴백 콘텐츠
  const wish = userData.wish || '목표 달성';

  return {
    miracleScore: 85,
    week1: {
      title: '시작',
      intro: `${wish}을(를) 위한 첫 걸음을 내딛습니다. 작은 습관부터 시작해보세요.`,
      goals: [
        '현재 상태 점검하기',
        '구체적인 목표 설정하기',
        '실행 계획 수립하기'
      ],
      advice: `${wish}은(는) 하루아침에 이루어지지 않습니다. 매일 조금씩 나아가는 것이 중요합니다. 완벽하지 않아도 괜찮습니다. 시작하는 것 자체가 성공입니다.`,
      daily: {
        mon: '현재 상태 분석 및 기록',
        tue: '목표를 명확히 정의하기',
        wed: '주간 계획 세우기',
        thu: '첫 번째 행동 실행',
        fri: '진행 상황 점검',
        weekend: '다음 주 준비 및 휴식'
      }
    },
    week2: {
      title: '가속',
      intro: '이제 리듬을 타기 시작할 때입니다. 더 적극적으로 도전해보세요.',
      goals: [
        '습관 강화하기',
        '새로운 시도 추가하기',
        '진행 상황 점검하기'
      ],
      advice: '1주차에서 배운 것들을 바탕으로 더 나아가세요. 작은 성공들을 축하하며, 동기를 유지하세요.',
      daily: {
        mon: '1주차 복습 및 개선점 파악',
        tue: '강도 높이기',
        wed: '새로운 도전 추가',
        thu: '중간 점검',
        fri: '주간 성과 정리',
        weekend: '재충전 및 다음 주 계획'
      }
    },
    week3: {
      title: '심화',
      intro: '중간 지점입니다. 지금까지의 성과를 돌아보고 더 깊이 파고들어보세요.',
      goals: [
        '고급 기술 적용하기',
        '장애물 극복하기',
        '전문성 키우기'
      ],
      advice: '지금이 가장 중요한 시기입니다. 포기하고 싶을 수 있지만, 이 시기를 넘기면 큰 성장을 경험할 것입니다.',
      daily: {
        mon: '심화 학습 시작',
        tue: '응용 연습',
        wed: '어려운 과제 도전',
        thu: '피드백 받고 조정',
        fri: '주간 성과 분석',
        weekend: '종합 리뷰'
      }
    },
    week4: {
      title: '완성',
      intro: '마지막 주입니다! 목표를 향한 마지막 도약을 준비하세요.',
      goals: [
        '최종 목표 달성하기',
        '결과 정리하기',
        '지속 계획 세우기'
      ],
      advice: '거의 다 왔습니다! 30일간의 여정을 마무리하면서, 이 습관을 어떻게 계속 유지할지 계획하세요.',
      daily: {
        mon: '최종 점검',
        tue: '완성도 높이기',
        wed: '마무리 작업',
        thu: '최종 확인',
        fri: '성과 정리 및 축하',
        weekend: '다음 30일 계획 수립'
      }
    },
    morningRoutine: `매일 아침 일어나면 오늘의 목표를 확인하세요. 간단한 스트레칭이나 명상으로 하루를 시작하고, ${wish}을(를) 위해 오늘 할 한 가지를 정하세요. 긍정적인 마음으로 시작하는 것이 중요합니다.`,
    eveningReview: `저녁에는 오늘 하루를 돌아보는 시간을 가지세요. 잘한 점 3가지를 적고, 개선할 점 1가지를 생각해보세요. 내일을 위한 간단한 계획을 세우고 충분한 휴식을 취하세요. 작은 진전도 성공입니다.`,
    stories: [
      {
        title: `${userData.category || '자기계발'} 목표를 달성한 김지수님`,
        content: '처음에는 불가능해 보였지만, 30일 동안 매일 조금씩 실천했더니 놀라운 변화가 있었습니다. 가장 중요한 것은 완벽하지 않아도 매일 시도하는 것이었습니다. 지금은 제 삶이 완전히 달라졌어요!'
      },
      {
        title: '꾸준함으로 성공한 박민준님',
        content: '2주차에 포기하고 싶었지만, Aurora 5의 응원으로 계속할 수 있었습니다. 3주차를 넘기니 습관이 되었고, 이제는 자연스럽게 실천하고 있습니다. 30일이 제 인생의 전환점이 되었습니다.'
      },
      {
        title: '작은 실천이 만든 큰 변화, 이서연님',
        content: '처음엔 하루 5분부터 시작했습니다. 작다고 생각했지만, 30일이 쌓이니 큰 변화가 되었어요. 이제는 제 삶의 일부가 되었고, 다른 목표도 도전하고 있습니다. 시작하길 정말 잘했어요!'
      }
    ]
  };
}

// ═══════════════════════════════════════════════════════════
// Miracle Score Calculation
// ═══════════════════════════════════════════════════════════

function calculateMiracleScore(userData) {
  let score = 70; // 기본 점수

  // 1. 목표의 명확성 (+10)
  if (userData.wish && userData.wish.length > 10) {
    score += 10;
  }

  // 2. 카테고리 적합성 (+5)
  if (userData.category) {
    score += 5;
  }

  // 3. 나이 보너스 (+5)
  if (userData.age) {
    if (userData.age >= 20 && userData.age <= 40) {
      score += 5; // 실행력이 높은 연령대
    } else {
      score += 3;
    }
  }

  // 4. 긍정적인 태도 (+5)
  if (userData.emotion &&
      (userData.emotion.includes('적극') ||
       userData.emotion.includes('긍정') ||
       userData.emotion.includes('열정'))) {
    score += 5;
  }

  // 최대 95로 제한
  return Math.min(score, 95);
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

module.exports = {
  generateRoadmapContent,
  calculateMiracleScore,
  getDefaultContent
};
