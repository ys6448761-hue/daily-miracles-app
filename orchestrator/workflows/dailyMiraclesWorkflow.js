/**
 * ✨ Daily Miracles Workflow
 *
 * 개인+관계 동시 해결 시스템
 *
 * 단계:
 * 1. 입력 검증
 * 2. 개인 프로필 생성 (색깔, 오행 분석)
 * 3. 상대방 프로필 생성 (조건부)
 * 4. 관계 조화 분석 (조건부)
 * 5. 8단계 컨설팅 생성
 * 6. 4주차 액션 플랜 생성
 * 7. PDF 생성 (선택)
 */

const { info, error: logError } = require('../../config/logger');
const path = require('path');

// 관계 분석 엔진 로드
const {
  analyzeCounterparty,
  analyzeRelationshipCompatibility,
  analyzeHeavenlyStemsEarthlyBranches,
  getElementFromColor,
  COLOR_ELEMENT_MAP
} = require('../../public/js/relationship-analyzer');

module.exports = {
  name: 'daily-miracles-analysis',
  description: '개인+관계 동시 해결 분석 워크플로우',

  steps: [
    {
      name: 'validate-input',
      description: '입력 데이터 검증',
      handler: async (context) => {
        const { user, responses } = await context.get('input');

        // 필수 항목 검증
        if (!user || !user.name || !user.birth || !user.concern) {
          throw new Error('사용자 기본 정보가 누락되었습니다');
        }

        if (!responses || !responses.q1 || !responses.q6) {
          throw new Error('필수 질문 응답이 누락되었습니다');
        }

        info('✅ 입력 검증 완료:', { name: user.name, relationshipType: responses.q6 });

        return {
          validated: true,
          hasRelationship: responses.q6 !== '혼자만의 문제'
        };
      }
    },

    {
      name: 'analyze-user-profile',
      description: '사용자 개인 프로필 분석',
      handler: async (context) => {
        const { user, responses } = await context.get('input');

        info('🔍 사용자 프로필 분석 중...');

        // 1. 오행 분석
        const fiveElements = analyzeHeavenlyStemsEarthlyBranches(user.birth);

        // 2. 색깔 성향 분석
        const colorTendency = responses.q1;
        const colorElement = getElementFromColor(colorTendency);

        // 3. 성격 특성 종합
        const personality = {
          color: colorTendency,
          element: colorElement.element,
          traits: colorElement.trait,
          energySource: responses.q2,
          problemSolving: responses.q3,
          changeReadiness: responses.q4,
          peakTime: responses.q5
        };

        // 4. 종합 프로필
        const userProfile = {
          name: user.name,
          birth: user.birth,
          concern: user.concern,
          fiveElements: fiveElements,
          personality: personality,
          summary: generateUserSummary(user, fiveElements, personality)
        };

        info('✅ 사용자 프로필 분석 완료');

        return userProfile;
      }
    },

    {
      name: 'analyze-counterparty',
      description: '상대방 프로필 분석 (조건부)',
      handler: async (context) => {
        const { hasRelationship } = await context.get('validate-input');
        const { responses, counterparty } = await context.get('input');

        if (!hasRelationship) {
          info('ℹ️ 관계 분석 스킵 (개인 문제)');
          return { exists: false };
        }

        info('🔍 상대방 프로필 분석 중...');

        const formData = { responses, counterparty };
        const counterpartyProfile = analyzeCounterparty(formData);

        info('✅ 상대방 프로필 분석 완료');

        return counterpartyProfile;
      }
    },

    {
      name: 'analyze-relationship',
      description: '관계 조화 분석 (조건부)',
      handler: async (context) => {
        const { hasRelationship } = await context.get('validate-input');
        const userProfile = await context.get('analyze-user-profile');
        const counterpartyProfile = await context.get('analyze-counterparty');

        if (!hasRelationship || !counterpartyProfile.exists) {
          info('ℹ️ 관계 조화 분석 스킵');
          return { exists: false };
        }

        info('💞 관계 조화 분석 중...');

        const compatibility = analyzeRelationshipCompatibility(
          userProfile,
          counterpartyProfile
        );

        info('✅ 관계 조화 분석 완료:', {
          score: compatibility.overallScore.score,
          grade: compatibility.overallScore.grade
        });

        return compatibility;
      }
    },

    {
      name: 'generate-consulting',
      description: '8단계 기적 컨설팅 생성',
      handler: async (context) => {
        const userProfile = await context.get('analyze-user-profile');
        const counterpartyProfile = await context.get('analyze-counterparty');
        const relationshipAnalysis = await context.get('analyze-relationship');

        info('💡 8단계 컨설팅 생성 중...');

        const consulting = generateEightStepConsulting(
          userProfile,
          counterpartyProfile,
          relationshipAnalysis
        );

        info('✅ 8단계 컨설팅 생성 완료');

        return consulting;
      }
    },

    {
      name: 'generate-action-plan',
      description: '4주차 액션 플랜 생성',
      handler: async (context) => {
        const userProfile = await context.get('analyze-user-profile');
        const consulting = await context.get('generate-consulting');
        const relationshipAnalysis = await context.get('analyze-relationship');

        info('📅 4주차 액션 플랜 생성 중...');

        const actionPlan = generateFourWeekActionPlan(
          userProfile,
          consulting,
          relationshipAnalysis
        );

        info('✅ 4주차 액션 플랜 생성 완료');

        return actionPlan;
      }
    },

    {
      name: 'finalize-result',
      description: '최종 결과 생성',
      handler: async (context) => {
        const userProfile = await context.get('analyze-user-profile');
        const counterpartyProfile = await context.get('analyze-counterparty');
        const relationshipAnalysis = await context.get('analyze-relationship');
        const consulting = await context.get('generate-consulting');
        const actionPlan = await context.get('generate-action-plan');

        info('📦 최종 결과 패키징 중...');

        const result = {
          userProfile,
          counterpartyProfile,
          relationshipAnalysis,
          consulting,
          actionPlan,
          pdfUrl: null, // TODO: PDF 생성 로직
          timestamp: new Date().toISOString()
        };

        info('✅ Daily Miracles 분석 완료');

        return result;
      }
    }
  ],

  onError: async (error, context) => {
    logError('❌ Daily Miracles 워크플로우 실패:', error.message);
    return { retry: false };
  },

  onComplete: async (result, context) => {
    info('🎉 Daily Miracles 워크플로우 완료', {
      contextId: context.id,
      userName: result.userProfile?.name
    });
  }
};

// ═════════════════════════════════════════════════════════
// Helper Functions
// ═════════════════════════════════════════════════════════

/**
 * 사용자 요약 생성
 */
function generateUserSummary(user, fiveElements, personality) {
  const elementDesc = fiveElements.primaryElement !== '알 수 없음'
    ? `${fiveElements.primaryElement} 패턴 그룹`
    : '분석 가능';

  return `${user.name}님은 ${personality.color} 성향으로 ${personality.traits}한 특성을 보입니다. ` +
    `분석 결과 ${elementDesc}에 속하며, ${personality.energySource}에서 에너지를 얻는 편입니다.`;
}

/**
 * 8단계 기적 컨설팅 생성
 */
function generateEightStepConsulting(userProfile, counterpartyProfile, relationshipAnalysis) {
  const hasRelationship = counterpartyProfile.exists;

  return {
    step1: {
      title: '현재 상황 인식',
      content: generateStep1(userProfile, counterpartyProfile),
      actionItems: [
        '현재 고민을 명확히 인식하기',
        '감정과 생각을 구분하기',
        hasRelationship ? '상대방의 입장 생각해보기' : '내면의 목소리 듣기'
      ]
    },
    step2: {
      title: '나의 성향 이해',
      content: generateStep2(userProfile),
      actionItems: [
        `${userProfile.personality.color} 성향의 강점 활용하기`,
        `${userProfile.personality.energySource} 시간 확보하기`,
        '자신의 문제 해결 방식 점검하기'
      ]
    },
    step3: {
      title: hasRelationship ? '상대방 이해하기' : '자기 성찰 깊이 있게',
      content: hasRelationship
        ? generateStep3Relationship(counterpartyProfile, relationshipAnalysis)
        : generateStep3Individual(userProfile),
      actionItems: hasRelationship
        ? [
            '상대방의 성향 존중하기',
            '오해의 원인 파악하기',
            '공감 대화 시도하기'
          ]
        : [
            '내면의 욕구 탐색하기',
            '과거 패턴 분석하기',
            '진짜 원하는 것 찾기'
          ]
    },
    step4: {
      title: '문제의 뿌리 찾기',
      content: generateStep4(userProfile, relationshipAnalysis),
      actionItems: [
        '표면적 문제 vs 근본 원인 구분',
        hasRelationship ? '관계 패턴의 반복 확인' : '내적 갈등의 원인 탐색',
        '변화 가능한 부분 찾기'
      ]
    },
    step5: {
      title: '해결 방향 설정',
      content: generateStep5(userProfile, relationshipAnalysis),
      actionItems: [
        '구체적인 목표 설정하기',
        '단계별 실행 계획 세우기',
        hasRelationship ? '상대와의 소통 방식 개선' : '자기 돌봄 루틴 만들기'
      ]
    },
    step6: {
      title: '실천 전략',
      content: generateStep6(userProfile, relationshipAnalysis),
      actionItems: [
        `${userProfile.personality.peakTime} 시간대 활용하기`,
        '작은 성공 경험 쌓기',
        hasRelationship ? '관계 개선 시도하기' : '새로운 습관 형성하기'
      ]
    },
    step7: {
      title: '장애물 극복',
      content: generateStep7(userProfile, relationshipAnalysis),
      actionItems: [
        '예상되는 어려움 대비하기',
        '감정 조절 방법 익히기',
        '지원 시스템 구축하기'
      ]
    },
    step8: {
      title: '지속 가능한 변화',
      content: generateStep8(userProfile),
      actionItems: [
        '매일 작은 실천 지속하기',
        '진전 상황 점검하기',
        '자신에게 보상하기'
      ]
    }
  };
}

/**
 * 4주차 액션 플랜 생성
 */
function generateFourWeekActionPlan(userProfile, consulting, relationshipAnalysis) {
  const hasRelationship = relationshipAnalysis.exists;

  return {
    week1: {
      theme: '인식과 이해',
      focus: '현재 상황과 나의 성향 파악',
      dailyActions: [
        { day: 1, task: '현재 고민을 노트에 상세히 기록하기', duration: '약 10분 정도' },
        { day: 2, task: `나의 ${userProfile.personality.color} 성향 강점 3~4가지 찾기`, duration: '약 15분 정도' },
        { day: 3, task: hasRelationship ? '상대방의 장점 5가지 정도 적어보기' : '내 감정의 패턴 관찰하기', duration: '약 10분 정도' },
        { day: 4, task: '문제가 언제부터 시작되었는지 되돌아보기', duration: '약 15분 정도' },
        { day: 5, task: hasRelationship ? '상대방 입장에서 편지 써보기' : '내면의 대화 나누기', duration: '약 20분 정도' },
        { day: 6, task: '이번 주 깨달은 점 3가지 정도 정리', duration: '약 15분 정도' },
        { day: 7, task: '휴식 및 회고 - 다음 주 준비', duration: '약 30분 정도' }
      ],
      checkpoints: [
        '고민의 핵심을 명확히 파악했는가?',
        '나의 성향을 이해하게 되었는가?',
        hasRelationship ? '상대방을 새롭게 이해하게 되었는가?' : '내면의 목소리를 들었는가?'
      ]
    },
    week2: {
      theme: '분석과 계획',
      focus: '문제의 뿌리를 찾고 해결 방향 설정',
      dailyActions: [
        { day: 8, task: '문제의 표면 vs 근본 원인 구분하기', duration: '약 15분 정도' },
        { day: 9, task: hasRelationship ? '관계의 갈등 패턴 분석하기' : '반복되는 내적 갈등 찾기', duration: '약 15분 정도' },
        { day: 10, task: '변화 가능한 것과 불가능한 것 구분', duration: '약 10분 정도' },
        { day: 11, task: '30일 정도 후 이루고 싶은 구체적 목표 설정', duration: '약 20분 정도' },
        { day: 12, task: '목표 달성을 위한 5단계 정도 계획 세우기', duration: '약 20분 정도' },
        { day: 13, task: hasRelationship ? '상대와의 대화 시나리오 작성' : '자기 돌봄 계획 만들기', duration: '약 20분 정도' },
        { day: 14, task: '2주차 점검 및 계획 수정', duration: '약 30분 정도' }
      ],
      checkpoints: [
        '문제의 진짜 원인을 찾았는가?',
        '실현 가능한 목표를 세웠는가?',
        '구체적인 실행 계획이 있는가?'
      ]
    },
    week3: {
      theme: '실천과 적용',
      focus: '작은 행동으로 변화 시작하기',
      dailyActions: [
        { day: 15, task: `${userProfile.personality.peakTime} 시간에 첫 실천 시작`, duration: '약 30분 정도' },
        { day: 16, task: hasRelationship ? '상대방에게 긍정적 메시지 전하기' : '자신에게 격려 편지 쓰기', duration: '약 15분 정도' },
        { day: 17, task: '오늘의 작은 성공 기록하기', duration: '약 10분 정도' },
        { day: 18, task: hasRelationship ? '갈등 상황 시 새로운 대응 시도' : '어려운 감정 다루기 연습', duration: '약 20분 정도' },
        { day: 19, task: '계획대로 안 된 부분 분석 및 조정', duration: '약 15분 정도' },
        { day: 20, task: hasRelationship ? '상대와 30분 정도 진솔한 대화 시도' : '30분 정도 자기성찰 시간', duration: '약 30분 정도' },
        { day: 21, task: '3주차 변화 점검 - 사전/사후 비교', duration: '약 30분 정도' }
      ],
      checkpoints: [
        '매일 실천을 지속하고 있는가?',
        hasRelationship ? '관계에서 변화가 느껴지는가?' : '내면의 변화가 느껴지는가?',
        '어려움이 생겼을 때 잘 대처했는가?'
      ]
    },
    week4: {
      theme: '정착과 지속',
      focus: '변화를 습관으로 만들고 유지하기',
      dailyActions: [
        { day: 22, task: '지난 3주간의 변화 정리하기', duration: '약 20분 정도' },
        { day: 23, task: hasRelationship ? '관계 개선 정도 평가하기' : '자기 성장 정도 평가하기', duration: '약 15분 정도' },
        { day: 24, task: '앞으로도 지속할 루틴 3가지 정도 선정', duration: '약 15분 정도' },
        { day: 25, task: '장애물이 생겼을 때 대처 매뉴얼 작성', duration: '약 20분 정도' },
        { day: 26, task: hasRelationship ? '상대와 함께 미래 계획 대화' : '다음 30일 정도 목표 설정', duration: '약 30분 정도' },
        { day: 27, task: '나를 응원하는 사람들에게 감사 표현', duration: '약 15분 정도' },
        { day: 28, task: '30일 여정 축하 및 보상하기', duration: '약 60분 정도' },
        { day: 29, task: '학습한 것들 정리 및 공유', duration: '약 30분 정도' },
        { day: 30, task: '새로운 30일 기적 시작 준비', duration: '약 30분 정도' }
      ],
      checkpoints: [
        '목표를 얼마나 달성했는가?',
        '지속 가능한 습관이 형성되었는가?',
        '다음 단계로 나아갈 준비가 되었는가?'
      ]
    },
    summary: {
      totalDuration: '약 30일 정도',
      dailyTimeCommitment: '평균적으로 약 15~30분 정도',
      keyPrinciples: [
        '매일 작은 실천이 보통 큰 변화를 만듭니다',
        hasRelationship ? '상대를 바꾸기보다 나를 먼저 바꾸는 것이 일반적으로 효과적입니다' : '자신을 비난하지 말고 이해하는 것이 중요합니다',
        '완벽하지 않아도 계속 나아가는 것이 중요합니다',
        '진전이 더딜 때도 포기하지 않는 것이 대체로 도움이 됩니다'
      ]
    }
  };
}

// Step 생성 함수들 (간소화된 버전)
function generateStep1(user, counterparty) {
  if (counterparty.exists) {
    return `${user.name}님은 현재 "${user.concern}"이라는 고민을 안고 계십니다. ` +
      `${counterparty.relationshipType} 관계에서 어려움을 겪고 있으며, ` +
      `이는 단순한 문제가 아닌 서로의 성향 차이에서 비롯된 것일 수 있습니다.`;
  }
  return `${user.name}님은 현재 "${user.concern}"이라는 고민을 안고 계십니다. ` +
    `이는 개인적인 성장과 변화가 필요한 시점임을 의미합니다.`;
}

function generateStep2(user) {
  return `${user.name}님은 ${user.personality.color} 성향으로, ${user.personality.traits}한 특성을 가지고 있습니다. ` +
    `${user.personality.energySource}에서 에너지를 얻으며, ${user.personality.problemSolving} 방식으로 문제를 해결합니다. ` +
    `이러한 성향을 이해하고 활용하는 것이 첫걸음입니다.`;
}

function generateStep3Relationship(counterparty, analysis) {
  if (!counterparty.exists) return '';
  return `상대방은 ${counterparty.personality.description} 성향을 보입니다. ` +
    `패턴 조합 분석 결과 ${analysis.elementCompatibility.type}(약 ${analysis.elementCompatibility.score}점 정도)으로 나타났으며, ` +
    `${analysis.elementCompatibility.description}`;
}

function generateStep3Individual(user) {
  return `자신의 내면을 깊이 들여다보는 시간이 필요합니다. ` +
    `${user.personality.changeReadiness} 태도로 변화에 임하고 있으며, ` +
    `이는 성장의 출발점이 됩니다.`;
}

function generateStep4(user, analysis) {
  if (analysis.exists && analysis.conflictAnalysis.rootCauses.length > 0) {
    const mainCause = analysis.conflictAnalysis.rootCauses[0];
    return `문제의 근본 원인은 "${mainCause.cause}"입니다. ${mainCause.description}`;
  }
  return `표면적으로 보이는 문제 뒤에는 더 깊은 원인이 있습니다. ` +
    `${user.concern}의 뿌리를 찾는 것이 해결의 시작입니다.`;
}

function generateStep5(user, analysis) {
  if (analysis.exists && analysis.overallScore) {
    return `현재 관계 조화도는 ${analysis.overallScore.grade}등급(약 ${analysis.overallScore.score}점 정도)입니다. ` +
      `${analysis.overallScore.message} 구체적인 개선 방향을 설정하겠습니다.`;
  }
  return `${user.concern}을 해결하기 위한 명확한 목표와 방향을 설정합니다. ` +
    `${user.personality.changeReadiness} 자세로 한 걸음씩 나아갑니다.`;
}

function generateStep6(user, analysis) {
  return `${user.personality.peakTime} 시간대가 가장 집중력이 높으므로 이 시간을 활용하세요. ` +
    `${user.personality.problemSolving} 방식에 맞춰 실천 전략을 세웁니다.`;
}

function generateStep7(user, analysis) {
  if (analysis.exists && analysis.conflictAnalysis.rootCauses.length > 0) {
    const solutions = analysis.conflictAnalysis.rootCauses.map(c => c.solution).join(' ');
    return `예상되는 어려움: ${solutions}`;
  }
  return `변화 과정에서 어려움이 생길 수 있습니다. ` +
    `${user.personality.changeReadiness} 태도를 유지하며 유연하게 대처합니다.`;
}

function generateStep8(user) {
  return `30일간의 여정이 끝나도 변화는 계속됩니다. ` +
    `${user.personality.energySource}를 통해 에너지를 충전하며, ` +
    `${user.personality.color} 성향의 강점을 계속 활용하세요.`;
}
