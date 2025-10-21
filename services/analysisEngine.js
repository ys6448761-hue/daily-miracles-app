// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Analysis Engine
// 분석 엔진: 사용자 프로필, 관계 분석, 컨설팅, 액션 플랜
// ═══════════════════════════════════════════════════════════

// ---------- 오행(五行) 시스템 ----------
const FIVE_ELEMENTS = {
  wood: { name: '나무', colors: ['초록', '연두'], traits: ['성장', '유연성', '생명력'] },
  fire: { name: '불', colors: ['빨강', '주황'], traits: ['열정', '에너지', '변화'] },
  earth: { name: '흙', colors: ['노랑', '갈색'], traits: ['안정', '신뢰', '포용'] },
  metal: { name: '금', colors: ['흰색', '회색'], traits: ['정의', '명확함', '강인함'] },
  water: { name: '물', colors: ['파랑', '검정'], traits: ['지혜', '유연성', '깊이'] }
};

// 오행 상생/상극 관계
const ELEMENT_COMPATIBILITY = {
  wood: { generates: 'fire', destroys: 'earth', generatedBy: 'water', destroyedBy: 'metal' },
  fire: { generates: 'earth', destroys: 'metal', generatedBy: 'wood', destroyedBy: 'water' },
  earth: { generates: 'metal', destroys: 'water', generatedBy: 'fire', destroyedBy: 'wood' },
  metal: { generates: 'water', destroys: 'wood', generatedBy: 'earth', destroyedBy: 'fire' },
  water: { generates: 'wood', destroys: 'fire', generatedBy: 'metal', destroyedBy: 'earth' }
};

// ---------- 키워드 매핑 ----------
const WISH_KEYWORDS = {
  communication: ['대화', '소통', '말', '이야기', '듣다', '표현'],
  conflict: ['싸움', '갈등', '다툼', '불화', '분쟁', '충돌'],
  trust: ['믿음', '신뢰', '의심', '배신', '거짓'],
  intimacy: ['친밀', '가까움', '친밀감', '거리감', '멀어짐'],
  understanding: ['이해', '공감', '알아주다', '모르다'],
  growth: ['성장', '발전', '개선', '나아지다', '변화'],
  healing: ['치유', '회복', '극복', '상처', '아픔'],
  balance: ['균형', '조화', '밸런스', '안정']
};

const PERSONALITY_KEYWORDS = {
  warm: ['따뜻', '배려', '친절', '온화', '부드러'],
  rational: ['이성적', '논리적', '분석적', '신중', '계획적'],
  passionate: ['열정적', '적극적', '활발', '에너지'],
  calm: ['차분', '침착', '평온', '고요'],
  creative: ['창의적', '독창적', '예술적', '상상력'],
  practical: ['실용적', '현실적', '구체적', '실천적']
};

// ---------- Priority 1: 핵심 분석 함수 ----------

/**
 * 사용자 프로필 분석
 * @param {Object} userInput - 사용자 입력 데이터
 * @returns {Object} 분석된 사용자 프로필
 */
function analyzeUserProfile(userInput) {
  const startTime = Date.now();

  const wish = userInput.wish || userInput.concern || userInput.problem || '';
  const name = userInput.name || '사용자';
  const responses = userInput.responses || {};

  console.log('[AnalysisEngine] analyzeUserProfile - wish:', wish);

  // 1. 키워드 기반 관심사 추출
  const concerns = extractConcerns(wish);

  // 2. 성격 분석 (응답 기반)
  const personality = analyzePersonality(responses, wish);

  // 3. 오행 분석
  const element = determineElement(personality, wish);

  // 4. 색상 분석
  const colors = FIVE_ELEMENTS[element].colors;

  // 5. 강점/도전과제 추출
  const strengths = extractStrengths(personality, element);
  const challenges = extractChallenges(concerns, wish);

  // 6. 기적지수 계산
  const miracleIndex = calculateMiracleIndex(wish, responses, concerns);

  // 7. 통찰 생성
  const insights = generateInsights(personality, concerns, miracleIndex);

  const profile = {
    name,
    miracleIndex,
    personality,
    colors,
    element: FIVE_ELEMENTS[element].name,
    elementKey: element,
    strengths,
    challenges,
    insights,
    concerns,
    analysisTime: Date.now() - startTime
  };

  console.log('[AnalysisEngine] User profile generated - miracleIndex:', miracleIndex);
  return profile;
}

/**
 * 상대방 프로필 생성
 * @param {Object} data - 사용자 입력 전체 데이터
 * @returns {Object|null} 상대방 프로필 또는 null
 */
function generateCounterpartyProfile(data) {
  const startTime = Date.now();

  const responses = data.userInput?.responses || data.responses || {};

  // 상대방 이름 추출 (여러 필드 확인)
  const counterpartyName =
    data.counterpartyName ||
    data.userInput?.counterpartyName ||
    responses.partnerName ||
    responses.counterpartyName ||
    null;

  if (!counterpartyName) {
    console.log('[AnalysisEngine] No counterparty name found - skipping profile');
    return null;
  }

  console.log('[AnalysisEngine] generateCounterpartyProfile - name:', counterpartyName);

  // 관계 유형 추출
  const relationship =
    data.relationship ||
    data.userInput?.relationship ||
    responses.relationship ||
    responses.relationType ||
    '관계';

  // 상대방 특성 추출 (응답 기반)
  const characteristics = extractCounterpartyCharacteristics(responses);

  // 상대방 성격 유추
  const personality = inferCounterpartyPersonality(characteristics, responses);

  // 상대방 오행 결정
  const element = determineCounterpartyElement(personality);
  const colors = FIVE_ELEMENTS[element].colors;

  const profile = {
    name: counterpartyName,
    relationship,
    personality,
    colors,
    element: FIVE_ELEMENTS[element].name,
    elementKey: element,
    characteristics,
    strengths: extractCounterpartyStrengths(characteristics),
    challenges: extractCounterpartyChallenges(characteristics),
    analysisTime: Date.now() - startTime
  };

  console.log('[AnalysisEngine] Counterparty profile generated');
  return profile;
}

/**
 * 관계 분석
 * @param {Object} userProfile - 사용자 프로필
 * @param {Object} counterpartyProfile - 상대방 프로필
 * @returns {Object|null} 관계 분석 결과
 */
function analyzeRelationship(userProfile, counterpartyProfile) {
  if (!counterpartyProfile) {
    console.log('[AnalysisEngine] No counterparty - skipping relationship analysis');
    return null;
  }

  const startTime = Date.now();
  console.log('[AnalysisEngine] analyzeRelationship - elements:',
    userProfile.elementKey, 'vs', counterpartyProfile.elementKey);

  const userElement = userProfile.elementKey;
  const counterpartyElement = counterpartyProfile.elementKey;

  // 1. 오행 상성 분석
  const elementCompatibility = calculateElementCompatibility(userElement, counterpartyElement);

  // 2. 색상 조화도
  const colorCompatibility = calculateColorCompatibility(userProfile.colors, counterpartyProfile.colors);

  // 3. 갈등 패턴 분석
  const conflictPattern = analyzeConflictPattern(userProfile.concerns, elementCompatibility);

  // 4. 근본 원인 파악
  const rootCause = identifyRootCause(userProfile, counterpartyProfile, conflictPattern);

  // 5. 개선 가능성
  const improvementPotential = assessImprovementPotential(
    userProfile.miracleIndex,
    elementCompatibility,
    colorCompatibility
  );

  // 6. 개선 권고사항
  const recommendations = generateRecommendations(
    elementCompatibility,
    conflictPattern,
    userProfile,
    counterpartyProfile
  );

  const analysis = {
    elementCompatibility: elementCompatibility.type,
    elementScore: elementCompatibility.score,
    colorCompatibility,
    conflictPattern,
    rootCause,
    improvementPotential,
    recommendations,
    analysisTime: Date.now() - startTime
  };

  console.log('[AnalysisEngine] Relationship analysis completed - compatibility:',
    elementCompatibility.type);
  return analysis;
}

// ---------- Priority 2: 컨설팅 & 액션 플랜 ----------

/**
 * 8단계 기적 컨설팅 생성
 * @param {Object} userProfile - 사용자 프로필
 * @param {Object} relationshipAnalysis - 관계 분석 결과
 * @returns {Object} 8단계 컨설팅
 */
function generate8StepsConsulting(userProfile, relationshipAnalysis) {
  const startTime = Date.now();
  console.log('[AnalysisEngine] generate8StepsConsulting');

  const concerns = userProfile.concerns;
  const miracleIndex = userProfile.miracleIndex;

  // 기본 8단계 템플릿
  const steps = {
    step1: {
      title: '현재 상황 인정하기',
      content: generateStep1Content(userProfile, concerns)
    },
    step2: {
      title: '내 감정 이해하기',
      content: generateStep2Content(userProfile, concerns)
    },
    step3: {
      title: '상대방 관점 보기',
      content: generateStep3Content(userProfile, relationshipAnalysis)
    },
    step4: {
      title: '갈등의 본질 파악',
      content: generateStep4Content(relationshipAnalysis, concerns)
    },
    step5: {
      title: '소통 방식 개선',
      content: generateStep5Content(userProfile, relationshipAnalysis)
    },
    step6: {
      title: '작은 변화 시작',
      content: generateStep6Content(userProfile)
    },
    step7: {
      title: '신뢰 회복하기',
      content: generateStep7Content(relationshipAnalysis)
    },
    step8: {
      title: '관계의 새로운 시작',
      content: generateStep8Content(userProfile, miracleIndex)
    }
  };

  console.log('[AnalysisEngine] 8-step consulting generated in', Date.now() - startTime, 'ms');
  return steps;
}

/**
 * 4주차 액션 플랜 생성
 * @param {Object} userProfile - 사용자 프로필
 * @returns {Object} 4주차 액션 플랜
 */
function generateActionPlan(userProfile) {
  const startTime = Date.now();
  console.log('[AnalysisEngine] generateActionPlan');

  const element = userProfile.elementKey;
  const concerns = userProfile.concerns;

  const plan = {
    week1: generateWeek1Plan(userProfile, element),
    week2: generateWeek2Plan(userProfile, concerns),
    week3: generateWeek3Plan(userProfile, element),
    week4: generateWeek4Plan(userProfile)
  };

  console.log('[AnalysisEngine] 4-week action plan generated in', Date.now() - startTime, 'ms');
  return plan;
}

// ---------- Priority 3: 위험신호 감지 ----------

/**
 * 위험신호 감지
 * @param {Object} relationshipAnalysis - 관계 분석 결과
 * @returns {Array} 위험신호 목록
 */
function detectWarningSignals(relationshipAnalysis) {
  if (!relationshipAnalysis) {
    return [];
  }

  const startTime = Date.now();
  console.log('[AnalysisEngine] detectWarningSignals');

  const signals = [];

  // 1. 상극 관계 심각도 확인
  if (relationshipAnalysis.elementCompatibility === '상극' &&
      relationshipAnalysis.elementScore < 40) {
    signals.push({
      signal: '깊은 갈등 패턴',
      severity: '높음',
      action: '전문가 상담을 권장합니다. 혼자 해결하기 어려운 단계일 수 있습니다.'
    });
  }

  // 2. 갈등 패턴 분석
  const conflictPattern = relationshipAnalysis.conflictPattern;
  if (conflictPattern.includes('단절') || conflictPattern.includes('회피')) {
    signals.push({
      signal: '의사소통 단절',
      severity: '높음',
      action: '대화 시간을 정기적으로 확보하세요. 하루 10분이라도 괜찮습니다.'
    });
  }

  // 3. 색상 조화도 낮음
  if (relationshipAnalysis.colorCompatibility < 50) {
    signals.push({
      signal: '감정적 불균형',
      severity: '중간',
      action: '서로의 감정을 존중하는 연습이 필요합니다. 공감 대화를 시작해보세요.'
    });
  }

  // 4. 근본 원인 심각성
  if (relationshipAnalysis.rootCause.includes('가치관') ||
      relationshipAnalysis.rootCause.includes('신뢰')) {
    signals.push({
      signal: relationshipAnalysis.rootCause,
      severity: '중간',
      action: '서로의 핵심 가치를 이해하는 대화가 필요합니다.'
    });
  }

  // 5. 개선 가능성 낮음
  if (relationshipAnalysis.improvementPotential === '낮음') {
    signals.push({
      signal: '개선 의지 부족',
      severity: '중간',
      action: '먼저 자신의 변화부터 시작하세요. 상대방의 변화는 그 다음입니다.'
    });
  }

  // 기본 신호 (최소 1개 이상)
  if (signals.length === 0) {
    signals.push({
      signal: '지속적인 관찰 필요',
      severity: '낮음',
      action: '현재는 안정적이지만, 정기적으로 관계를 점검하세요.'
    });
  }

  console.log('[AnalysisEngine] Warning signals detected:', signals.length, 'in', Date.now() - startTime, 'ms');
  return signals;
}

// ═══════════════════════════════════════════════════════════
// 헬퍼 함수들 (Internal Logic)
// ═══════════════════════════════════════════════════════════

// ---------- 관심사 추출 ----------
function extractConcerns(wish) {
  const concerns = [];

  for (const [key, keywords] of Object.entries(WISH_KEYWORDS)) {
    if (keywords.some(kw => wish.includes(kw))) {
      concerns.push(key);
    }
  }

  return concerns.length > 0 ? concerns : ['general'];
}

// ---------- 성격 분석 ----------
function analyzePersonality(responses, wish) {
  const text = wish + ' ' + JSON.stringify(responses);
  const traits = [];

  for (const [trait, keywords] of Object.entries(PERSONALITY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      traits.push(trait);
    }
  }

  // 기본 성격
  if (traits.length === 0) {
    return '따뜻하고 배려심 많은 성격';
  }

  const traitMap = {
    warm: '따뜻하고 배려심 많은',
    rational: '이성적이고 신중한',
    passionate: '열정적이고 적극적인',
    calm: '차분하고 침착한',
    creative: '창의적이고 독창적인',
    practical: '실용적이고 현실적인'
  };

  return traits.map(t => traitMap[t]).join(', ') + ' 성격';
}

// ---------- 오행 결정 ----------
function determineElement(personality, wish) {
  // 키워드 기반 오행 매핑
  if (personality.includes('열정') || wish.includes('변화') || wish.includes('에너지')) {
    return 'fire';
  }
  if (personality.includes('차분') || wish.includes('지혜') || wish.includes('깊이')) {
    return 'water';
  }
  if (personality.includes('창의') || wish.includes('성장') || wish.includes('발전')) {
    return 'wood';
  }
  if (personality.includes('신중') || wish.includes('명확') || wish.includes('정의')) {
    return 'metal';
  }
  // 기본값
  return 'earth';
}

// ---------- 강점 추출 ----------
function extractStrengths(personality, element) {
  const baseStrengths = FIVE_ELEMENTS[element].traits;

  const additionalStrengths = {
    warm: '공감 능력',
    rational: '문제 해결 능력',
    passionate: '추진력',
    calm: '인내심',
    creative: '창의적 사고',
    practical: '실행력'
  };

  const strengths = [...baseStrengths];

  for (const [trait, strength] of Object.entries(additionalStrengths)) {
    if (personality.includes(trait)) {
      strengths.push(strength);
      if (strengths.length >= 3) break;
    }
  }

  return strengths.slice(0, 3);
}

// ---------- 도전과제 추출 ----------
function extractChallenges(concerns, wish) {
  const challengeMap = {
    communication: '명확한 의사 표현',
    conflict: '감정 조절',
    trust: '신뢰 회복',
    intimacy: '정서적 연결',
    understanding: '상대방 관점 이해',
    growth: '변화 수용',
    healing: '과거 치유',
    balance: '균형 잡기'
  };

  const challenges = concerns.map(c => challengeMap[c] || '관계 개선').slice(0, 3);

  // 최소 3개 보장
  while (challenges.length < 3) {
    challenges.push('지속적인 노력');
  }

  return challenges;
}

// ---------- 기적지수 계산 ----------
function calculateMiracleIndex(wish, responses, concerns) {
  let score = 50; // 기본 점수

  // 1. 구체성 (+0~15점)
  if (wish.length > 20) score += 10;
  if (wish.length > 50) score += 5;

  // 2. 응답 성실도 (+0~15점)
  const responseCount = Object.keys(responses).length;
  score += Math.min(responseCount * 2, 15);

  // 3. 긍정성 (+0~10점)
  const positiveWords = ['원해', '바라', '좋아', '개선', '발전', '성장', '행복'];
  if (positiveWords.some(w => wish.includes(w))) score += 10;

  // 4. 관심사 다양성 (+0~10점)
  score += Math.min(concerns.length * 3, 10);

  // 범위 제한 (0-100)
  return Math.max(0, Math.min(100, score));
}

// ---------- 통찰 생성 ----------
function generateInsights(personality, concerns, miracleIndex) {
  const level = miracleIndex >= 75 ? 'high' : miracleIndex >= 50 ? 'medium' : 'low';

  const insights = {
    high: `당신은 ${personality}으로, 관계 개선을 위한 강한 의지를 가지고 있습니다. 이미 훌륭한 출발점에 서 있으며, 작은 실천만으로도 큰 변화를 경험할 수 있습니다.`,
    medium: `당신은 ${personality}으로, 관계를 개선하고 싶은 마음이 있습니다. 지금부터 시작하는 작은 변화들이 모여 기적을 만들어갈 것입니다.`,
    low: `당신은 ${personality}으로, 지금은 힘든 시기일 수 있습니다. 하지만 이 어려움을 인정하는 것 자체가 첫 번째 용기입니다. 천천히, 하나씩 시작해보세요.`
  };

  return insights[level];
}

// ---------- 상대방 특성 추출 ----------
function extractCounterpartyCharacteristics(responses) {
  const characteristics = [];

  // 응답에서 상대방 관련 키워드 추출
  const text = JSON.stringify(responses);

  if (text.includes('바쁨') || text.includes('일')) characteristics.push('성실함');
  if (text.includes('화') || text.includes('짜증')) characteristics.push('감정 표현');
  if (text.includes('조용') || text.includes('말없')) characteristics.push('내향적');
  if (text.includes('활발') || text.includes('적극')) characteristics.push('외향적');

  // 기본 특성
  if (characteristics.length === 0) {
    characteristics.push('독립적', '신중함');
  }

  return characteristics.slice(0, 3);
}

// ---------- 상대방 성격 유추 ----------
function inferCounterpartyPersonality(characteristics, responses) {
  const text = JSON.stringify(characteristics);

  if (text.includes('성실') || text.includes('신중')) {
    return '신중하고 계획적인 성격';
  }
  if (text.includes('외향') || text.includes('적극')) {
    return '활발하고 사교적인 성격';
  }
  if (text.includes('내향') || text.includes('조용')) {
    return '차분하고 사려 깊은 성격';
  }

  return '독립적이고 주관이 뚜렷한 성격';
}

// ---------- 상대방 오행 결정 ----------
function determineCounterpartyElement(personality) {
  if (personality.includes('활발') || personality.includes('사교')) return 'fire';
  if (personality.includes('차분') || personality.includes('사려')) return 'water';
  if (personality.includes('계획') || personality.includes('신중')) return 'metal';
  if (personality.includes('안정') || personality.includes('포용')) return 'earth';
  return 'wood';
}

// ---------- 상대방 강점 ----------
function extractCounterpartyStrengths(characteristics) {
  const strengthMap = {
    '성실함': '책임감',
    '감정 표현': '솔직함',
    '내향적': '깊은 사고력',
    '외향적': '사교성',
    '독립적': '자립성'
  };

  const strengths = characteristics.map(c => strengthMap[c] || c);
  while (strengths.length < 3) {
    strengths.push('성실함');
  }

  return strengths.slice(0, 3);
}

// ---------- 상대방 도전과제 ----------
function extractCounterpartyChallenges(characteristics) {
  const challengeMap = {
    '성실함': '융통성 부족',
    '감정 표현': '감정 조절',
    '내향적': '표현의 어려움',
    '외향적': '경청의 어려움',
    '독립적': '협력의 어려움'
  };

  const challenges = characteristics.map(c => challengeMap[c] || '변화 수용');
  while (challenges.length < 3) {
    challenges.push('균형 찾기');
  }

  return challenges.slice(0, 3);
}

// ---------- 오행 상성 계산 ----------
function calculateElementCompatibility(element1, element2) {
  if (element1 === element2) {
    return { type: '중립', score: 60, description: '같은 속성으로 이해하기 쉬우나 변화가 필요합니다' };
  }

  const relation = ELEMENT_COMPATIBILITY[element1];

  if (relation.generates === element2) {
    return { type: '상생', score: 85, description: '서로를 성장시키는 조화로운 관계입니다' };
  }
  if (relation.generatedBy === element2) {
    return { type: '상생', score: 80, description: '상대방이 당신을 성장시키는 관계입니다' };
  }
  if (relation.destroys === element2) {
    return { type: '상극', score: 35, description: '도전적인 관계이지만 성장의 기회가 됩니다' };
  }
  if (relation.destroyedBy === element2) {
    return { type: '상극', score: 30, description: '어려운 관계이지만 이해의 폭을 넓힐 수 있습니다' };
  }

  return { type: '중립', score: 55, description: '안정적이지만 노력이 필요한 관계입니다' };
}

// ---------- 색상 조화도 계산 ----------
function calculateColorCompatibility(colors1, colors2) {
  // 공통 색상 있으면 높은 점수
  const commonColors = colors1.filter(c => colors2.includes(c));
  if (commonColors.length > 0) return 85;

  // 보색 관계 확인
  const complementary = {
    '빨강': '초록', '주황': '파랑', '노랑': '보라',
    '초록': '빨강', '파랑': '주황', '보라': '노랑'
  };

  for (const c1 of colors1) {
    for (const c2 of colors2) {
      if (complementary[c1] === c2) return 70; // 보색은 중간 조화
    }
  }

  // 기본 조화도
  return 60;
}

// ---------- 갈등 패턴 분석 ----------
function analyzeConflictPattern(concerns, elementCompatibility) {
  if (concerns.includes('communication')) {
    return '의사소통 미흡 - 서로의 표현 방식이 다릅니다';
  }
  if (concerns.includes('conflict')) {
    return '감정 충돌 - 해결되지 않은 감정이 쌓여있습니다';
  }
  if (concerns.includes('trust')) {
    return '신뢰 손상 - 과거 상처가 현재에 영향을 주고 있습니다';
  }
  if (concerns.includes('intimacy')) {
    return '정서적 거리감 - 가까워지기 어려운 패턴이 있습니다';
  }

  if (elementCompatibility.type === '상극') {
    return '가치관 차이 - 근본적인 관점의 차이가 있습니다';
  }

  return '일시적 불균형 - 현재 상황에서 오는 어려움입니다';
}

// ---------- 근본 원인 파악 ----------
function identifyRootCause(userProfile, counterpartyProfile, conflictPattern) {
  if (conflictPattern.includes('의사소통')) {
    return '표현 방식의 차이 - 서로 다른 언어로 말하고 있습니다';
  }
  if (conflictPattern.includes('신뢰')) {
    return '과거 경험의 영향 - 치유되지 않은 상처가 있습니다';
  }
  if (conflictPattern.includes('가치관')) {
    return '근본적 가치관 차이 - 중요하게 생각하는 것이 다릅니다';
  }
  if (conflictPattern.includes('거리감')) {
    return '친밀감에 대한 두려움 - 가까워지는 것이 불편합니다';
  }

  return '상황적 스트레스 - 외부 요인이 관계에 영향을 줍니다';
}

// ---------- 개선 가능성 평가 ----------
function assessImprovementPotential(miracleIndex, elementCompatibility, colorCompatibility) {
  const totalScore = (miracleIndex + elementCompatibility.score + colorCompatibility) / 3;

  if (totalScore >= 70) return '높음';
  if (totalScore >= 50) return '중간';
  return '낮음';
}

// ---------- 개선 권고사항 생성 ----------
function generateRecommendations(elementCompatibility, conflictPattern, userProfile, counterpartyProfile) {
  const recommendations = [];

  // 1. 오행 기반 조언
  if (elementCompatibility.type === '상극') {
    recommendations.push(`서로의 차이를 인정하세요. ${userProfile.element}와 ${counterpartyProfile.element}은 다르지만, 그 차이가 성장의 기회입니다.`);
  } else if (elementCompatibility.type === '상생') {
    recommendations.push(`좋은 궁합입니다. ${userProfile.element}와 ${counterpartyProfile.element}의 조화를 더욱 발전시켜보세요.`);
  }

  // 2. 갈등 패턴 기반 조언
  if (conflictPattern.includes('의사소통')) {
    recommendations.push('매일 10분, 서로의 하루를 나누는 시간을 가져보세요. 판단 없이 들어주는 것이 중요합니다.');
  } else if (conflictPattern.includes('신뢰')) {
    recommendations.push('작은 약속부터 지켜가며 신뢰를 회복하세요. 시간이 필요한 과정입니다.');
  } else {
    recommendations.push('서로에게 감사한 점 하나씩 표현해보세요. 긍정적인 에너지가 관계를 변화시킵니다.');
  }

  // 3. 실천 조언
  recommendations.push('혼자서 변화하려 하지 마세요. 전문가의 도움을 받는 것도 용기입니다.');

  return recommendations;
}

// ═══════════════════════════════════════════════════════════
// 8단계 컨설팅 상세 내용 생성
// ═══════════════════════════════════════════════════════════

function generateStep1Content(userProfile, concerns) {
  return `${userProfile.name}님, 지금 느끼는 어려움을 인정하는 것부터 시작해봅시다.

**현재 상황:**
- 당신이 느끼는 주요 관심사: ${concerns.join(', ')}
- 기적지수: ${userProfile.miracleIndex}/100

이 어려움을 인정하고 여기까지 온 것 자체가 큰 용기입니다. 완벽하지 않아도 괜찮습니다.

**오늘 해볼 일:**
1. 지금 느끼는 감정을 3가지만 써보세요 (예: 답답함, 슬픔, 기대감)
2. "나는 완벽하지 않아도 괜찮다"고 소리내어 말해보세요
3. 오늘 하루 자신에게 친절했던 순간을 찾아보세요`;
}

function generateStep2Content(userProfile, concerns) {
  const emotionGuide = concerns.includes('conflict')
    ? '화가 나는 것은 당연합니다. 그 감정 뒤에 무엇이 있을까요?'
    : '지금 느끼는 감정을 있는 그대로 느껴보세요.';

  return `감정은 잘못된 것이 아닙니다. ${emotionGuide}

**감정 이해하기:**
- 당신의 성격: ${userProfile.personality}
- 주요 강점: ${userProfile.strengths.join(', ')}
- 도전 과제: ${userProfile.challenges.join(', ')}

${userProfile.insights}

**감정 일기 쓰기 (매일 5분):**
1. 오늘 가장 강하게 느낀 감정: __________
2. 그 감정이 생긴 순간: __________
3. 그 순간 내가 원했던 것: __________
4. 다음엔 어떻게 하고 싶은지: __________`;
}

function generateStep3Content(userProfile, relationshipAnalysis) {
  if (!relationshipAnalysis) {
    return `상대방도 나와 같은 인간입니다. 완벽하지 않고, 어려움을 겪고 있을 수 있습니다.

**상대방 이해하기:**
1. 상대방도 최선을 다하고 있을 수 있습니다
2. 나와 다른 표현 방식을 가지고 있을 수 있습니다
3. 상대방의 입장에서 생각해보는 연습을 해보세요

**실천 방법:**
- "만약 내가 상대방이라면..." 하고 생각해보기
- 상대방의 하루를 상상해보기
- 상대방이 힘들어하는 것 찾아보기`;
  }

  return `상대방도 ${relationshipAnalysis.rootCause}로 인해 어려움을 겪고 있을 수 있습니다.

**관계 분석:**
- 오행 궁합: ${relationshipAnalysis.elementCompatibility} (${relationshipAnalysis.elementScore}/100)
- 감정 조화: ${relationshipAnalysis.colorCompatibility}/100
- 갈등 패턴: ${relationshipAnalysis.conflictPattern}

**상대방 관점에서 보기:**
1. 상대방의 강점 3가지를 떠올려보세요
2. 상대방이 요즘 힘들어하는 것은 무엇일까요?
3. 내가 상대방에게 해줄 수 있는 작은 것은 무엇일까요?`;
}

function generateStep4Content(relationshipAnalysis, concerns) {
  const rootCause = relationshipAnalysis?.rootCause || '상황적 스트레스';
  const conflictPattern = relationshipAnalysis?.conflictPattern || '일시적 불균형';

  return `표면적인 갈등 뒤에는 항상 더 깊은 이유가 있습니다.

**갈등의 본질:**
- 근본 원인: ${rootCause}
- 갈등 패턴: ${conflictPattern}

이 갈등은 '누가 옳고 그른가'의 문제가 아니라, '우리가 어떻게 다른가'의 문제입니다.

**본질 파악하기:**
1. 반복되는 다툼의 주제는 무엇인가요?
2. 그 주제 뒤에 숨은 진짜 욕구는 무엇일까요?
   - 예: "청소 안 해" → 진짜 욕구: "나를 존중해줬으면"
3. 상대방의 진짜 욕구는 무엇일까요?

**오늘의 질문:**
"우리는 왜 자꾸 같은 이야기로 다투게 될까?"`;
}

function generateStep5Content(userProfile, relationshipAnalysis) {
  const tips = relationshipAnalysis?.recommendations || [
    '서로의 언어를 배워가는 시간이 필요합니다',
    '비난 대신 감정을 표현해보세요',
    '들어주는 것만으로도 큰 위로가 됩니다'
  ];

  return `같은 말도 어떻게 하느냐에 따라 완전히 다르게 들립니다.

**소통 개선 팁:**
${tips.map((tip, i) => `${i + 1}. ${tip}`).join('\n')}

**비폭력 대화 (NVC) 연습:**

❌ "너는 왜 맨날 늦어?"
✅ "네가 늦으면 나는 불안해. 미리 알려줄 수 있을까?"

❌ "너는 내 말을 안 들어"
✅ "내 이야기를 들어줬으면 좋겠어. 지금 시간 괜찮아?"

**4단계 대화법:**
1. 관찰: "어제 약속 시간에 30분 늦었어"
2. 감정: "나는 속상했어"
3. 욕구: "나는 존중받고 싶어"
4. 부탁: "다음부턴 미리 연락 줄 수 있어?"`;
}

function generateStep6Content(userProfile) {
  const element = userProfile.elementKey;
  const elementActions = {
    wood: ['식물 키우기', '산책하기', '성장 일기 쓰기'],
    fire: ['운동하기', '좋아하는 음악 듣기', '에너지 발산하기'],
    earth: ['요리하기', '정리정돈하기', '안정감 찾기'],
    metal: ['명상하기', '독서하기', '생각 정리하기'],
    water: ['목욕하기', '조용한 시간 갖기', '감정 흘려보내기']
  };

  const actions = elementActions[element] || ['자신 돌아보기'];

  return `큰 변화는 작은 실천에서 시작됩니다.

**당신의 원소 (${userProfile.element})에 맞는 작은 실천:**
${actions.map((action, i) => `${i + 1}. ${action}`).join('\n')}

**이번 주 작은 변화 (하나만 선택):**

□ 하루 10분 명상
□ 감사 일기 (하루 3가지)
□ 상대방에게 감사 표현 (하루 1번)
□ 나만의 시간 갖기 (하루 30분)
□ 긍정적인 말 사용하기

**기억하세요:**
완벽하게 하려고 하지 마세요. 시작하는 것만으로 충분합니다.
실패해도 괜찮아요. 다시 시작하면 됩니다.`;
}

function generateStep7Content(relationshipAnalysis) {
  const potential = relationshipAnalysis?.improvementPotential || '중간';
  const message = {
    높음: '관계 회복 가능성이 높습니다. 서로의 노력이 곧 결실을 맺을 것입니다.',
    중간: '시간이 필요하지만 충분히 회복 가능합니다. 조급해하지 마세요.',
    낮음: '어려운 상황이지만, 포기하지 않는 한 희망은 있습니다.'
  };

  return `신뢰는 한 번에 회복되지 않습니다. 작은 약속을 지켜가며 쌓아가는 것입니다.

**현재 상황: ${message[potential]}**

**신뢰 회복 3단계:**

**1단계: 작은 약속 지키기 (1주차)**
- "오늘 저녁 7시에 연락할게" → 정확히 7시에 연락
- "설거지 내가 할게" → 바로 실천
- 작은 약속일수록 중요합니다

**2단계: 일관성 유지하기 (2-3주차)**
- 같은 시간에 같은 행동 반복
- 감정 기복 줄이기
- 예측 가능한 사람 되기

**3단계: 솔직하게 말하기 (4주차~)**
- 거짓말 대신 "지금은 말하기 어려워"
- 실수했을 때 바로 인정하기
- 변명 대신 사과하기

**신뢰 저금통:**
매일 작은 신뢰를 쌓아가세요. 한 번의 큰 배신보다 백 번의 작은 약속이 더 중요합니다.`;
}

function generateStep8Content(userProfile, miracleIndex) {
  const encouragement = miracleIndex >= 70
    ? '당신은 이미 훌륭하게 해내고 있습니다. 이제 새로운 시작을 만들어갈 준비가 되었습니다.'
    : miracleIndex >= 50
    ? '여기까지 오느라 힘들었죠. 이제 새로운 관계의 첫걸음을 내딛을 때입니다.'
    : '지금은 힘들지만, 이 과정 자체가 성장입니다. 천천히, 함께 나아가봅시다.';

  return `모든 관계는 끝이 아니라 새로운 시작입니다.

${encouragement}

**새로운 관계를 위한 다짐:**

1. **과거는 과거로 두기**
   - 과거의 잘못을 계속 꺼내지 않기
   - "그때 너가..."는 이제 그만
   - 오늘부터 새롭게 시작하기

2. **서로의 성장 응원하기**
   - 상대방의 변화 인정해주기
   - 완벽을 기대하지 않기
   - 함께 성장하는 파트너 되기

3. **정기적인 관계 점검**
   - 한 달에 한 번, 관계 대화 시간 갖기
   - "요즘 우리 어때?" 물어보기
   - 문제가 커지기 전에 대화하기

**당신의 기적 선언문:**

"나는 ${userProfile.name}(으)로서,
${userProfile.personality}을 가진 사람으로서,
관계의 기적을 만들어갈 것입니다.

완벽하지 않아도 괜찮습니다.
천천히, 하나씩, 함께 나아가겠습니다.

오늘부터, 하루하루가 기적입니다."

**축하합니다! 🎉**
당신은 8단계를 모두 완료했습니다. 이제 실천만 남았습니다.`;
}

// ═══════════════════════════════════════════════════════════
// 4주차 액션 플랜 상세 내용
// ═══════════════════════════════════════════════════════════

function generateWeek1Plan(userProfile, element) {
  return {
    title: '나 자신 이해하기',
    goal: '자신의 감정과 욕구를 정확히 파악하기',
    dailyActions: [
      {
        day: '월요일',
        task: '내 강점 3가지 적어보기',
        examples: userProfile.strengths,
        time: '3분'
      },
      {
        day: '화요일',
        task: '오늘 느낀 감정 3가지 적기',
        examples: ['기쁨', '답답함', '기대감'],
        time: '5분'
      },
      {
        day: '수요일',
        task: '내가 관계에서 원하는 것 명확히 하기',
        examples: ['존중', '이해', '함께하는 시간'],
        time: '5분'
      },
      {
        day: '목요일',
        task: `${userProfile.element} 속성 활동하기`,
        examples: element === 'water' ? ['목욕', '물가 산책'] : ['산책', '운동'],
        time: '10분'
      },
      {
        day: '금요일',
        task: '이번 주 나에게 칭찬하기',
        examples: ['작은 실천 인정하기', '노력 인정하기'],
        time: '3분'
      },
      {
        day: '주말',
        task: '나만의 시간 갖기',
        examples: ['좋아하는 일 하기', '쉬기', '취미 생활'],
        time: '30분'
      }
    ],
    reflection: '이번 주는 나를 이해하는 시간이었습니다. 나를 알아야 상대방도 이해할 수 있습니다.'
  };
}

function generateWeek2Plan(userProfile, concerns) {
  const focusArea = concerns.includes('communication') ? '대화' : '관찰';

  return {
    title: '상대방 이해하기',
    goal: '상대방의 관점과 감정을 이해하기',
    dailyActions: [
      {
        day: '월요일',
        task: '상대방의 강점 3가지 떠올리기',
        examples: ['성실함', '배려심', '책임감'],
        time: '3분'
      },
      {
        day: '화요일',
        task: '상대방이 요즘 힘들어하는 것 관찰하기',
        examples: ['일 스트레스', '피곤함', '고민'],
        time: '5분'
      },
      {
        day: '수요일',
        task: '상대방의 입장에서 생각해보기',
        examples: ['만약 내가 상대방이라면...', '그 입장에선 이해가 돼'],
        time: '5분'
      },
      {
        day: '목요일',
        task: `${focusArea} 시간 갖기`,
        examples: ['10분 대화', '관심사 물어보기'],
        time: '10분'
      },
      {
        day: '금요일',
        task: '감사한 점 하나 표현하기',
        examples: ['"오늘 설거지 해줘서 고마워"', '"어제 위로해줘서 고마워"'],
        time: '1분'
      },
      {
        day: '주말',
        task: '함께 시간 보내기',
        examples: ['산책', '영화', '대화'],
        time: '1시간'
      }
    ],
    reflection: '상대방을 이해하려는 노력 자체가 관계를 변화시킵니다.'
  };
}

function generateWeek3Plan(userProfile, element) {
  return {
    title: '소통 연습하기',
    goal: '건강한 대화 패턴 만들기',
    dailyActions: [
      {
        day: '월요일',
        task: '비폭력 대화(NVC) 한 번 시도하기',
        examples: ['"나는 ~해서 ~했어"', '"~해줄 수 있어?"'],
        time: '5분'
      },
      {
        day: '화요일',
        task: '상대방 말 끝까지 듣기',
        examples: ['끼어들지 않기', '고개 끄덕이며 듣기'],
        time: '10분'
      },
      {
        day: '수요일',
        task: '내 감정을 솔직하게 표현하기',
        examples: ['"나는 지금 속상해"', '"나는 외로워"'],
        time: '3분'
      },
      {
        day: '목요일',
        task: '상대방에게 질문하기',
        examples: ['"요즘 어때?"', '"힘든 거 있어?"'],
        time: '5분'
      },
      {
        day: '금요일',
        task: '긍정적인 말 3번 하기',
        examples: ['"잘했어"', '"고마워"', '"사랑해"'],
        time: '1분씩'
      },
      {
        day: '주말',
        task: '깊은 대화 시간 갖기',
        examples: ['우리 관계 이야기', '미래 계획', '서로의 꿈'],
        time: '30분'
      }
    ],
    reflection: '좋은 소통은 기술이 아니라 마음입니다. 진심이 통합니다.'
  };
}

function generateWeek4Plan(userProfile) {
  return {
    title: '새로운 시작 만들기',
    goal: '변화를 유지하고 새로운 관계 패턴 정착시키기',
    dailyActions: [
      {
        day: '월요일',
        task: '지난 3주 돌아보기',
        examples: ['무엇이 변했나요?', '무엇이 좋았나요?'],
        time: '10분'
      },
      {
        day: '화요일',
        task: '작은 약속 하나 지키기',
        examples: ['시간 약속', '심부름', '연락'],
        time: '5분'
      },
      {
        day: '수요일',
        task: '함께할 새로운 활동 제안하기',
        examples: ['산책', '요리', '운동', '취미'],
        time: '5분'
      },
      {
        day: '목요일',
        task: '관계에서 감사한 점 5가지 적기',
        examples: ['함께 웃은 순간', '위로받은 순간', '사랑느낀 순간'],
        time: '10분'
      },
      {
        day: '금요일',
        task: '다음 달 목표 세우기',
        examples: ['한 달 후 우리 관계', '계속할 것', '새로 시작할 것'],
        time: '10분'
      },
      {
        day: '주말',
        task: '축하하기! 4주 완주 기념',
        examples: ['맛있는 것 먹기', '선물 주기', '특별한 시간'],
        time: '자유'
      }
    ],
    reflection: `축하합니다, ${userProfile.name}님! 4주간의 여정을 완료했습니다. 이제 이 변화를 일상으로 만들어가세요. 하루하루가 기적입니다.`
  };
}

// ═══════════════════════════════════════════════════════════
// Module Exports
// ═══════════════════════════════════════════════════════════

module.exports = {
  analyzeUserProfile,
  generateCounterpartyProfile,
  analyzeRelationship,
  generate8StepsConsulting,
  generateActionPlan,
  detectWarningSignals
};
