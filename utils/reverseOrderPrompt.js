/**
 * 역순 프롬프트 전략 구현
 *
 * 【기존 방식】 페르소나 설정 → 이론 주입 → 결과 요청 → 교과서적인 답변
 * 【역순 전략】 초안 먼저 생성 → 프레임워크 로드 → 분석+보완 → 날카로운 콘텐츠
 *
 * @module utils/reverseOrderPrompt
 */

const fs = require('fs');
const path = require('path');

// 프레임워크 캐시
const frameworkCache = new Map();

/**
 * 프레임워크 JSON 파일 로드
 * @param {string} frameworkName - 프레임워크 이름 (확장자 제외)
 * @returns {Object} 프레임워크 데이터
 */
function loadFramework(frameworkName) {
  // 캐시 확인
  if (frameworkCache.has(frameworkName)) {
    return frameworkCache.get(frameworkName);
  }

  const frameworkPath = path.join(__dirname, '../frameworks', `${frameworkName}.json`);

  if (!fs.existsSync(frameworkPath)) {
    throw new Error(`Framework not found: ${frameworkName}`);
  }

  const framework = JSON.parse(fs.readFileSync(frameworkPath, 'utf8'));
  frameworkCache.set(frameworkName, framework);

  return framework;
}

/**
 * 모든 프레임워크 목록 조회
 * @returns {Array} 사용 가능한 프레임워크 목록
 */
function listFrameworks() {
  const frameworksDir = path.join(__dirname, '../frameworks');
  const files = fs.readdirSync(frameworksDir).filter(f => f.endsWith('.json'));

  return files.map(file => ({
    name: file.replace('.json', ''),
    path: path.join(frameworksDir, file)
  }));
}

/**
 * Day별 응원 메시지 목표 반환
 * @param {number} day - 여정 일차 (1-7)
 * @returns {string} 해당 일차의 목표
 */
function getDayGoal(day) {
  const goals = {
    1: '희망의 씨앗 심기 - 시작의 의미 부여',
    2: '자기 인식 깨우기 - 내면 탐색 유도',
    3: '작은 실천 독려 - 행동 촉구',
    4: '중간 점검과 격려 - 지속 동기 부여',
    5: '장애물 극복 응원 - 어려움 인정 + 극복',
    6: '성장 확인 - 변화 인식 도움',
    7: '새로운 시작 축하 - 완주 축하 + 다음 단계'
  };
  return goals[day] || '응원과 격려';
}

/**
 * Step 1: 초안 생성용 프롬프트 빌드
 * @param {Object} context - 컨텍스트 정보
 * @param {number} count - 생성할 초안 개수 (기본 5개)
 * @returns {string} 초안 생성 프롬프트
 */
function buildDraftPrompt(context, count = 5) {
  return `당신은 마케팅 콘텐츠 전문가입니다.

【상황】
${context.situation}

【목표】
${context.goal}

【타겟】
${context.target}

【요청】
위 상황에 맞는 ${context.contentType} 초안을 ${count}개 작성해주세요.
각 초안은 서로 다른 접근 방식을 사용해주세요.
- 다양한 후크 패턴 사용
- 다양한 감정 자극 방식 사용
- 다양한 스토리 구조 사용

【형식】
초안 1:
[내용]

초안 2:
[내용]

초안 3:
[내용]

초안 4:
[내용]

초안 5:
[내용]`;
}

/**
 * Step 2: 프레임워크 기반 분석 프롬프트 빌드
 * @param {string} drafts - 생성된 초안들
 * @param {Object} framework - 적용할 프레임워크
 * @returns {string} 분석 프롬프트
 */
function buildAnalysisPrompt(drafts, framework) {
  // 원칙 텍스트 구성
  let principlesText = '';

  if (framework.principles) {
    principlesText = framework.principles
      .map(p => `- ${p.name}: ${p.description}`)
      .join('\n');
  } else if (framework.categories) {
    // hook-patterns 같은 카테고리 기반 프레임워크
    principlesText = Object.entries(framework.categories)
      .map(([key, cat]) => `- ${cat.name}: ${cat.patterns?.length || 0}개 패턴`)
      .join('\n');
  }

  // 예시 텍스트 구성
  let exampleText = '';
  if (framework.principles?.[0]?.example) {
    const ex = framework.principles[0].example;
    exampleText = `
【구체적 사례】
상황: ${ex.situation}
Before: ${ex.before || ex.action || ''}
After: ${ex.after || ex.result || ''}`;
  }

  return `【프레임워크: ${framework.name}】
${principlesText}
${exampleText}

【분석 대상 초안들】
${drafts}

【요청】
1. 각 초안을 위 프레임워크 원리 기준으로 분석해주세요.
2. 어떤 원리가 잘 적용되어 있고, 어떤 원리가 부족한지 평가해주세요.
3. 가장 잠재력 있는 초안을 선택하고, 부족한 원리를 보완해서 최종 버전을 작성해주세요.

【형식】
## 분석
- 초안 1: [적용된 원리] / [부족한 원리]
- 초안 2: [적용된 원리] / [부족한 원리]
- 초안 3: [적용된 원리] / [부족한 원리]
- 초안 4: [적용된 원리] / [부족한 원리]
- 초안 5: [적용된 원리] / [부족한 원리]

## 선택: 초안 [번호]
선택 이유: [이유]

## 최종 보완 버전
[보완된 최종 콘텐츠]

## 적용된 원리 요약
[어떤 원리들이 최종본에 적용되었는지]`;
}

/**
 * 복합 분석 프롬프트 빌드 (여러 프레임워크 동시 적용)
 * @param {string} drafts - 생성된 초안들
 * @param {Array<string>} frameworkNames - 적용할 프레임워크 이름들
 * @returns {string} 복합 분석 프롬프트
 */
function buildMultiFrameworkAnalysisPrompt(drafts, frameworkNames) {
  const frameworks = frameworkNames.map(name => loadFramework(name));

  let combinedPrinciples = '';
  frameworks.forEach((fw, idx) => {
    combinedPrinciples += `\n### ${idx + 1}. ${fw.name}\n`;
    if (fw.principles) {
      combinedPrinciples += fw.principles
        .slice(0, 3) // 각 프레임워크에서 상위 3개만
        .map(p => `- ${p.name}: ${p.description}`)
        .join('\n');
    }
  });

  return `【복합 프레임워크 분석】
${combinedPrinciples}

【분석 대상 초안들】
${drafts}

【요청】
1. 각 초안을 모든 프레임워크 원리 기준으로 종합 분석해주세요.
2. 가장 잠재력 있는 초안을 선택하세요.
3. 모든 프레임워크의 장점을 결합하여 최종 버전을 작성해주세요.

【형식】
## 종합 분석
[각 초안별 분석]

## 선택: 초안 [번호]

## 최종 보완 버전
[모든 프레임워크 원리를 적용한 최종 콘텐츠]`;
}

/**
 * 응원 메시지 생성용 컨텍스트 빌더
 * @param {Object} sowonData - 소원이 데이터
 * @param {number} day - 여정 일차
 * @returns {Object} 역순 전략용 컨텍스트
 */
function buildEncouragementContext(sowonData, day) {
  return {
    situation: `소원이 ${sowonData.name || ''}님의 상황: ${sowonData.concern || sowonData.wish || '삶의 변화를 원함'}`,
    goal: `Day ${day} 응원 메시지 - ${getDayGoal(day)}`,
    target: `${sowonData.ageGroup || '30대'} ${sowonData.gender || ''}, ${sowonData.situation || '일상에서 작은 기적을 찾는 중'}`,
    contentType: '응원 메시지 (카카오톡용, 5줄 이내)'
  };
}

/**
 * 마케팅 콘텐츠 생성용 컨텍스트 빌더
 * @param {Object} options - 옵션
 * @returns {Object} 역순 전략용 컨텍스트
 */
function buildMarketingContext(options) {
  return {
    situation: options.situation || '하루하루의 기적 서비스 홍보',
    goal: options.goal || '서비스 가입 유도',
    target: options.target || '30-40대, 삶의 변화를 원하는 사람들',
    contentType: options.contentType || '마케팅 카피'
  };
}

/**
 * 전체 역순 프롬프트 체인 실행 (LLM 호출 제외, 프롬프트만 반환)
 * @param {Object} context - 컨텍스트
 * @param {string} frameworkName - 프레임워크 이름
 * @returns {Object} 각 단계별 프롬프트
 */
function prepareReverseOrderChain(context, frameworkName = 'stick-principles') {
  const framework = loadFramework(frameworkName);

  return {
    step1_draftPrompt: buildDraftPrompt(context),
    step2_framework: framework,
    step2_analysisPromptBuilder: (drafts) => buildAnalysisPrompt(drafts, framework),
    context,
    frameworkName
  };
}

/**
 * 품질 비교 테스트용 - 기존 방식 프롬프트 생성
 * @param {Object} sowonData - 소원이 데이터
 * @param {number} day - 일차
 * @returns {string} 기존 방식 프롬프트
 */
function buildLegacyPrompt(sowonData, day) {
  return `당신은 따뜻하고 전문적인 코칭 전문가입니다.
소원이 ${sowonData.name || ''}님에게 Day ${day} 응원 메시지를 작성해주세요.
상황: ${sowonData.concern || sowonData.wish || '삶의 변화를 원함'}
톤: 따뜻하지만 전문적으로
길이: 카카오톡용 5줄 이내`;
}

/**
 * 두 방식 비교용 테스트 세트 생성
 * @param {Object} sowonData - 소원이 데이터
 * @param {number} day - 일차
 * @returns {Object} 비교 테스트 세트
 */
function createComparisonTestSet(sowonData, day) {
  const context = buildEncouragementContext(sowonData, day);
  const chain = prepareReverseOrderChain(context, 'stick-principles');

  return {
    legacy: {
      name: '기존 방식',
      prompt: buildLegacyPrompt(sowonData, day),
      steps: 1
    },
    reverseOrder: {
      name: '역순 전략',
      step1: chain.step1_draftPrompt,
      step2Builder: chain.step2_analysisPromptBuilder,
      framework: chain.frameworkName,
      steps: 2
    },
    metadata: {
      sowon: sowonData.name,
      day,
      goal: getDayGoal(day)
    }
  };
}

// 금지어 체크 유틸리티
function loadForbiddenWords() {
  try {
    const forbiddenPath = path.join(__dirname, '../skills/design-system/forbidden-words.json');
    if (fs.existsSync(forbiddenPath)) {
      return JSON.parse(fs.readFileSync(forbiddenPath, 'utf8'));
    }
  } catch (e) {
    console.warn('forbidden-words.json 로드 실패:', e.message);
  }
  return null;
}

/**
 * 콘텐츠 금지어 검사
 * @param {string} content - 검사할 콘텐츠
 * @returns {Object} 검사 결과
 */
function checkForbiddenWords(content) {
  const forbidden = loadForbiddenWords();
  if (!forbidden) return { passed: true, violations: [] };

  const violations = [];

  Object.entries(forbidden.categories).forEach(([category, data]) => {
    data.words.forEach(word => {
      if (content.includes(word)) {
        violations.push({
          word,
          category,
          severity: data.severity,
          suggestion: forbidden.replacement_suggestions?.[word]
        });
      }
    });
  });

  return {
    passed: violations.length === 0,
    violations
  };
}

module.exports = {
  // 프레임워크 관리
  loadFramework,
  listFrameworks,

  // 프롬프트 빌더
  buildDraftPrompt,
  buildAnalysisPrompt,
  buildMultiFrameworkAnalysisPrompt,

  // 컨텍스트 빌더
  buildEncouragementContext,
  buildMarketingContext,
  getDayGoal,

  // 체인 실행
  prepareReverseOrderChain,

  // 테스트/비교
  buildLegacyPrompt,
  createComparisonTestSet,

  // 품질 체크
  checkForbiddenWords
};
