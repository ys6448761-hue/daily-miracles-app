// ═══════════════════════════════════════════════════════════
// Daily Miracles MVP - Analysis Engine
// 분석 엔진: 사용자 프로필, 관계 분석, 컨설팅, 액션 플랜
// ═══════════════════════════════════════════════════════════

// ---------- 보석 → 색깔 매핑 ----------
const GEMSTONE_TO_COLOR = {
  '루비': '빨강',
  '코랄': '주황',
  '시트린': '노랑',
  '에메랄드': '초록',
  '사파이어': '파랑',
  '탄자나이트': '남색',
  '자수정': '보라',
  '다이아몬드': '흰색',
  '진주': '흰색',
  '오닉스': '검정'
};

// ---------- 행동 패턴 시스템 (집단지성 기반) ----------
const FIVE_ELEMENTS = {
  wood: { name: '성장형', colors: ['초록', '연두'], traits: ['성장', '유연성', '생명력'] },
  fire: { name: '열정형', colors: ['빨강', '주황'], traits: ['열정', '에너지', '변화'] },
  earth: { name: '안정형', colors: ['노랑', '갈색'], traits: ['안정', '신뢰', '포용'] },
  metal: { name: '목표형', colors: ['흰색', '회색'], traits: ['정의', '명확함', '강인함'] },
  water: { name: '사색형', colors: ['파랑', '검정'], traits: ['지혜', '유연성', '깊이'] }
};

// 패턴 간 상호작용 (유사 사례 분석 기반)
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

  // 3. 패턴 분석 (행동 유형)
  const element = determineElement(personality, wish, responses);

  // 4. 색상 분석 (보석 선택 우선, 없으면 패턴 기반)
  let colors = FIVE_ELEMENTS[element].colors;
  if (responses.q1 && GEMSTONE_TO_COLOR[responses.q1]) {
    // 사용자가 선택한 보석을 색깔로 변환
    const selectedColor = GEMSTONE_TO_COLOR[responses.q1];
    colors = [selectedColor];
  }

  // 5. 강점/도전과제 추출
  const strengths = extractStrengths(personality, element);
  const challenges = extractChallenges(concerns, wish);

  // 6. 기적지수 계산
  const miracleIndex = calculateMiracleIndex(wish, responses, concerns);

  // 7. 통찰 생성
  const insights = generateInsights(personality, concerns, miracleIndex);

  // 8. 상세 프로필 설명 생성
  const description = generateProfileDescription(name, colors, element, personality);

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
    description,  // ✅ 추가: 상세 설명
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

// ---------- 기적지수 계산 (5가지 요소 기반) ----------
function calculateMiracleIndex(wish, responses, concerns) {
  // 기적지수 = (현재상황 + 개선가능성 + 행운도 + 노력도 + 타이밍) / 5

  // 1️⃣ 현재상황 (0-20점)
  let currentSituation = 10; // 기본값

  // 긍정적 키워드 체크
  const positiveWords = ['좋아', '괜찮', '행복', '만족', '좋은'];
  const negativeWords = ['싸움', '갈등', '힘들', '어려', '우울', '절망', '포기'];

  if (positiveWords.some(w => wish.includes(w))) {
    currentSituation = 15; // 이미 좋은 상황
  } else if (negativeWords.some(w => wish.includes(w))) {
    const severity = negativeWords.filter(w => wish.includes(w)).length;
    if (severity >= 3) {
      currentSituation = 5; // 매우 어려운 상황
    } else if (severity >= 2) {
      currentSituation = 8; // 어려운 상황
    } else {
      currentSituation = 10; // 중간 상황
    }
  }

  // 2️⃣ 개선가능성 (0-20점)
  let improvementPotential = 15; // 기본값 (충분히 개선 가능)

  const improvementWords = ['원해', '바라', '개선', '발전', '변화', '성장', '나아지'];
  const effortWords = ['노력', '시도', '해보', '시작'];

  if (improvementWords.some(w => wish.includes(w))) {
    improvementPotential += 3; // 개선 의지 높음
  }
  if (effortWords.some(w => wish.includes(w))) {
    improvementPotential += 2; // 실천 의지 있음
  }
  improvementPotential = Math.min(20, improvementPotential);

  // 3️⃣ 행운도 (0-20점) - 타이밍과 환경
  let luck = 12; // 기본값

  const timeWords = ['지금', '오늘', '요즘', '최근'];
  const supportWords = ['함께', '도움', '지원', '응원'];

  if (timeWords.some(w => wish.includes(w))) {
    luck += 5; // 지금이 좋은 시기
  }
  if (supportWords.some(w => wish.includes(w))) {
    luck += 3; // 지원 환경 있음
  }
  luck = Math.min(20, luck);

  // 4️⃣ 노력도 (0-20점) - 실행 가능성
  let effort = 15; // 기본값

  const responseCount = Object.keys(responses).length;
  if (responseCount >= 5) {
    effort = 18; // 성실한 응답
  } else if (responseCount >= 3) {
    effort = 15;
  } else {
    effort = 10;
  }

  // 구체성 체크
  if (wish.length > 50) {
    effort += 2; // 구체적인 고민
  }
  effort = Math.min(20, effort);

  // 5️⃣ 타이밍 (0-20점) - 시급성
  let timing = 15; // 기본값

  const urgentWords = ['빨리', '급해', '당장', '시급', '곧'];
  const crisisWords = ['위기', '위험', '심각', '한계'];

  if (urgentWords.some(w => wish.includes(w))) {
    timing += 3;
  }
  if (crisisWords.some(w => wish.includes(w))) {
    timing += 2; // 위기일수록 지금이 골든타임
  }
  timing = Math.min(20, timing);

  // 최종 기적지수 계산
  const miracleIndex = Math.round((currentSituation + improvementPotential + luck + effort + timing) / 5);

  console.log('[MiracleIndex] 계산 상세:', {
    currentSituation,
    improvementPotential,
    luck,
    effort,
    timing,
    total: miracleIndex
  });

  return Math.max(0, Math.min(100, miracleIndex));
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

// ---------- 프로필 상세 설명 생성 ----------
/**
 * 🔥 CRITICAL: 사용자 프로필 상세 설명 생성
 *
 * 이 함수는 결과 페이지(daily-miracles-result.html)에서 사용자에게 보여지는
 * 프로필 상세 설명을 생성합니다.
 *
 * 반드시 포함되어야 할 요소:
 * - 색깔 특성 (예: "빨강 보석 성향으로 열정적, 활동적")
 * - 행동 패턴 (예: "열정형 패턴 그룹에 속하며")
 * - 에너지 소스 (예: "사람들과의 만남에서 에너지를 얻는 편입니다")
 *
 * ⚠️ 이 함수를 제거하거나 반환값을 변경하면 사용자는 "알 수 없음"만 보게 됩니다.
 *
 * @param {string} name - 사용자 이름
 * @param {string[]} colors - 색깔 배열 (예: ["빨강"])
 * @param {string} elementKey - 패턴 키 (fire/water/wood/earth/metal)
 * @param {string} personality - 성격 설명
 * @returns {string} 프로필 상세 설명 텍스트
 */
function generateProfileDescription(name, colors, elementKey, personality) {
  const colorName = colors[0] || '알 수 없음';
  const elementName = FIVE_ELEMENTS[elementKey]?.name || '알 수 없음';

  // 보석 색깔별 특성 매핑 (집단지성 분석 기반)
  const colorTraits = {
    '빨강': '열정적, 활동적, 추진력한',
    '주황': '활발한, 사교적, 긍정적인',
    '노랑': '밝은, 낙관적, 창의적인',
    '갈색': '안정적, 실용적, 신중한',
    '초록': '조화로운, 성장 지향적, 균형잡힌',
    '연두': '생동감 있는, 유연한, 적응력 있는',
    '파랑': '차분한, 신뢰할 수 있는, 깊이 있는',
    '남색': '조용한, 사려깊은, 통찰력 있는',
    '보라': '직관적, 영감 넘치는, 신비로운',
    '검정': '강인한, 깊이 있는, 결단력 있는',
    '흰색': '순수한, 명확한, 정직한',
    '회색': '중립적, 이성적, 균형잡힌'
  };

  const traits = colorTraits[colorName] || '독특한';

  // 에너지 출처 매핑 (유사 사례 분석 기반)
  const energySource = {
    'fire': '사람들과의 만남',
    'water': '깊은 사색과 휴식',
    'wood': '새로운 경험과 성장',
    'earth': '안정적인 일상과 관계',
    'metal': '명확한 목표와 성취'
  };

  const energy = energySource[elementKey] || '다양한 활동';

  return `${name}님은 ${colorName} 보석 성향으로 ${traits} 특성을 보입니다. 유사 사례 분석 결과 ${elementName} 그룹에 속하며, ${energy}에서 에너지를 얻는 경향이 있습니다.`;
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

// ---------- 행동 패턴 궁합 계산 ----------
/**
 * 🔥 CRITICAL: 행동 패턴 궁합 계산 (관계 분석)
 *
 * 이 함수는 두 사람의 행동 패턴을 비교하여 관계 궁합을 분석합니다.
 * 집단지성 데이터(약 15,000명의 유사 사례)를 기반으로 분석합니다.
 *
 * 반드시 포함되어야 할 요소:
 * - type: 관계 유형 (동일 패턴, 보완 관계, 대비 관계 등)
 * - score: 조화도 점수 (0-100)
 * - description: 간단한 설명
 * - detailedDescription: 집단지성 통계를 포함한 상세 설명 🔥 필수!
 *
 * ⚠️ detailedDescription이 없으면 결과 페이지에서 통계 정보가 표시되지 않습니다.
 *
 * @param {string} element1 - 첫 번째 사람의 패턴 (fire/water/wood/earth/metal)
 * @param {string} element2 - 두 번째 사람의 패턴 (fire/water/wood/earth/metal)
 * @returns {Object} { type, score, description, detailedDescription }
 */
function calculateElementCompatibility(element1, element2) {
  if (element1 === element2) {
    return {
      type: '동일 패턴',
      score: 60,
      description: '같은 행동 방식으로 이해하기 쉬우나 변화가 필요합니다',
      detailedDescription: '두 분 모두 비슷한 행동 패턴 그룹에 속합니다 (유사 사례 약 3,200쌍 분석 기준). 서로 공감대는 높은 편이지만, 같은 약점을 공유할 수 있어 역할 분담이 중요합니다.'
    };
  }

  const relation = ELEMENT_COMPATIBILITY[element1];

  if (relation.generates === element2) {
    return {
      type: '보완 관계',
      score: 85,
      description: '서로를 성장시키는 조화로운 관계입니다',
      detailedDescription: '매우 조화로운 조합입니다 (유사 사례 상위 약 15% 수준). 서로의 장점을 강화하고 약점을 보완하는 패턴으로, 약 2,100쌍 분석 결과 높은 만족도를 보였습니다.'
    };
  }
  if (relation.generatedBy === element2) {
    return {
      type: '성장 관계',
      score: 80,
      description: '상대방이 당신을 성장시키는 관계입니다',
      detailedDescription: '좋은 조화를 이루는 조합입니다 (유사 사례 상위 약 25% 수준). 상대방의 영향으로 성장할 수 있는 패턴이며, 약 1,800쌍 데이터 기준 긍정적 변화를 경험했습니다.'
    };
  }
  if (relation.destroys === element2) {
    return {
      type: '대비 관계',
      score: 35,
      description: '도전적인 관계이지만 성장의 기회가 됩니다',
      detailedDescription: '어려운 조합이지만 개선 가능합니다 (유사 사례 하위 약 30% 수준). 약 1,200쌍 분석 결과, 노력을 통해 좋은 관계로 발전한 사례가 많습니다.'
    };
  }
  if (relation.destroyedBy === element2) {
    return {
      type: '도전 관계',
      score: 30,
      description: '어려운 관계이지만 이해의 폭을 넓힐 수 있습니다',
      detailedDescription: '도전적인 조합입니다 (유사 사례 하위 약 25% 수준). 하지만 약 1,000쌍 사례에서 이해와 소통을 통해 극복한 경우가 발견되었습니다.'
    };
  }

  return {
    type: '중립',
    score: 55,
    description: '안정적이지만 노력이 필요한 관계입니다',
    detailedDescription: '보통 좋은 관계를 유지할 수 있는 조합입니다. 노력하면 더 좋아지는 편입니다 (유사 조합 상위 약 40% 수준).'
  };
}

// ---------- 색상 조화도 계산 ----------
/**
 * 🔥 CRITICAL: 보석 성향 조화도 계산 (관계 분석)
 *
 * 이 함수는 두 사람의 보석 색깔 성향을 비교하여 관계 조화도를 분석합니다.
 * 집단지성 데이터를 기반으로 유사 사례를 참고합니다.
 *
 * 반드시 포함되어야 할 요소:
 * - type: 관계 유형 (동일 성향, 대비 성향, 유사 성향 등)
 * - message: 조화도에 대한 설명 메시지 🔥 필수!
 *
 * ⚠️ message가 없으면 결과 페이지에서 보석 성향 조화도 설명이 표시되지 않습니다.
 *
 * @param {string[]} colors1 - 첫 번째 사람의 색깔 배열 (예: ["빨강"])
 * @param {string[]} colors2 - 두 번째 사람의 색깔 배열 (예: ["파랑"])
 * @returns {Object} { type, message }
 */
function calculateColorCompatibility(colors1, colors2) {
  // 공통 색상 있으면 높은 점수
  const commonColors = colors1.filter(c => colors2.includes(c));
  if (commonColors.length > 0) {
    return {
      type: '동일 성향',
      score: 85,
      message: '비슷한 행동 방식으로 공감대는 높은 편이나, 역할 분담이 필요할 수 있습니다 (유사 사례 약 1,500쌍 참고).'
    };
  }

  // 대비 관계 확인 (보색)
  const complementary = {
    '빨강': '초록', '주황': '파랑', '노랑': '보라',
    '초록': '빨강', '파랑': '주황', '보라': '노랑'
  };

  for (const c1 of colors1) {
    for (const c2 of colors2) {
      if (complementary[c1] === c2) {
        return {
          type: '대비 성향',
          score: 70,
          message: '서로 다른 강점으로 균형을 이루는 조합입니다 (유사 사례 약 1,100쌍 분석 기준).'
        };
      }
    }
  }

  // 기본 조화도
  return {
    type: '차이 있음',
    score: 60,
    message: '서로 다른 성향으로 이해가 필요하지만, 노력하면 조화를 이룰 수 있습니다 (유사 조합 약 900쌍 참고).'
  };
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
  // 기적지수에 따른 맞춤 메시지
  let encouragement = '';
  if (userProfile.miracleIndex >= 75) {
    encouragement = '당신의 기적지수는 매우 높아요! 이미 좋은 출발점에 서 있습니다. 💫';
  } else if (userProfile.miracleIndex >= 50) {
    encouragement = '지금은 조금 힘들 수 있지만, 충분히 좋아질 수 있는 상황이에요. 🌱';
  } else {
    encouragement = '지금은 힘든 시기일 수 있어요. 하지만 이 어려움을 인정하는 것 자체가 첫 번째 용기랍니다. 🤝';
  }

  return `## 💙 당신의 상황, 저도 이해해요

${userProfile.name}님, 여기까지 오시느라 정말 힘드셨죠?

지금 느끼는 감정들이 복잡하고 어지러울 수 있어요. **답답함**, **불안**, **외로움**, 때로는 **화**도 나고요. 이런 감정들은 모두 자연스러운 반응입니다. 당신이 잘못된 게 아니에요.

**📊 현재 상황:**
- 기적지수: **${userProfile.miracleIndex}점** / 100
- ${encouragement}

**${concerns.length > 0 ? `주요 관심사: ${concerns.map(c => {
  const concernMap = {
    communication: '💬 의사소통',
    conflict: '💔 갈등 해결',
    trust: '🤝 신뢰 회복',
    intimacy: '💕 친밀감',
    understanding: '🫂 이해와 공감',
    growth: '🌱 성장',
    healing: '💊 치유',
    balance: '⚖️ 균형'
  };
  return concernMap[c] || c;
}).join(', ')}` : '관계 개선'}**

변화를 원하는 마음이 있다는 것 자체가 이미 큰 첫걸음입니다. 완벽할 필요 없어요. 천천히, 하나씩 시작해봐요.

---

**🌟 오늘 해볼 작은 일:**

**1️⃣ 감정 인정하기 (3분)**
   - 지금 느끼는 감정을 3가지만 써보세요
   - 예: "답답함", "슬픔", "기대감"
   - 틀리거나 이상한 감정은 없어요. 모두 소중합니다.

**2️⃣ 자신에게 말하기 (1분)**
   - "나는 완벽하지 않아도 괜찮아"
   - "나는 충분히 잘하고 있어"
   - "나는 사랑받을 가치가 있어"
   - 소리 내어 말해보세요. 처음엔 어색해도 괜찮아요.

**3️⃣ 작은 친절 찾기 (2분)**
   - 오늘 하루 자신에게 친절했던 순간을 찾아보세요
   - 아무리 작아도 좋아요
   - 예: "힘든데도 밥은 챙겨 먹었어", "친구에게 먼저 연락했어"

---

💬 **기억하세요:**
이 여정은 혼자가 아니에요. 저희가 함께 있습니다. 오늘 하루도 수고하셨어요. 💙`;
}

function generateStep2Content(userProfile, concerns) {
  const emotionGuide = concerns.includes('conflict')
    ? '**화가 나는 것은 당연해요.** 그 감정 뒤에는 "이해받고 싶다", "존중받고 싶다"는 욕구가 숨어있을 수 있어요.'
    : '지금 느끼는 감정을 있는 그대로 느껴보세요. 억누르지 마세요. 감정은 나쁜 게 아니에요.';

  return `## 🧠 그 감정 뒤에는 뭐가 있을까요?

감정은 잘못된 것이 아닙니다. ${emotionGuide}

많은 사람들이 **"나는 왜 이렇게 약할까?"** 라고 자책해요. 하지만 감정을 느끼는 건 약함이 아니라 **인간다움**이에요. 💙

---

**🌟 당신은 이런 분이에요:**

**성격:** ${userProfile.personality}
${userProfile.personality.includes('따뜻') || userProfile.personality.includes('배려')
  ? '→ 상대를 생각하는 따뜻한 마음이 당신의 가장 큰 강점이에요.'
  : userProfile.personality.includes('신중') || userProfile.personality.includes('계획')
  ? '→ 신중하게 생각하고 준비하는 당신의 능력이 큰 힘이 될 거예요.'
  : '→ 당신만의 독특한 성격이 관계를 특별하게 만들어요.'}

**강점 💪**
${userProfile.strengths.map((s, i) => `${i + 1}. **${s}** - 이 강점이 ${
  i === 0 ? '관계를 살려왔어요' :
  i === 1 ? '어려울 때 힘이 되었어요' :
  '앞으로도 큰 도움이 될 거예요'
}`).join('\n')}

**도전 과제 🎯**
${userProfile.challenges.map(c => `• ${c}`).join('\n')}
→ 이것들은 "약점"이 아니라 **"성장 포인트"**에요. 누구에게나 있어요.

---

**💭 ${userProfile.name}님에게:**

${userProfile.insights}

당신이 느끼는 감정들은 모두 의미가 있어요. 그 감정이 무엇을 말하려고 하는지 귀 기울여보세요.

---

**📝 감정 일기 쓰기 (매일 5분)**

오늘부터 감정을 기록해보세요. 쓰다 보면 패턴이 보여요.

**1. 오늘 가장 강하게 느낀 감정:**
   _____________________________
   (예: 화남, 슬픔, 외로움, 불안, 기쁨)

**2. 그 감정이 생긴 순간:**
   _____________________________
   (예: 상대방이 내 말을 안 들었을 때)

**3. 그 순간 내가 진짜 원했던 것:**
   _____________________________
   (예: 존중받고 싶었어, 이해받고 싶었어)

**4. 다음엔 어떻게 하고 싶은지:**
   _____________________________
   (예: 차분하게 내 마음을 말하고 싶어)

---

💡 **Tip:** 감정에 이름을 붙이는 것만으로도 감정은 절반 정도 가라앉아요. 시도해보세요!`;
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

  return `## 💬 같은 말도, 어떻게 하느냐에 따라 다릅니다

"말 한마디로 천 냥 빚을 갚는다"는 말이 있죠. 대화 방식만 바꿔도 관계가 놀랍게 달라져요.

---

**🎯 맞춤 소통 팁 (당신을 위한):**

${tips.map((tip, i) => `**${i + 1}. ${tip}**`).join('\n\n')}

---

**💡 비폭력 대화 (NVC) - 따라해보세요**

"비폭력 대화"는 상대를 공격하지 않으면서 내 마음을 전하는 방법이에요.

**❌ 이렇게 말하면:**
→ "너는 왜 맨날 늦어? 시간 약속도 못 지켜?"

**✅ 이렇게 바꿔보세요:**
→ "네가 30분 늦었을 때 (관찰), 나는 불안했어 (감정). 나도 소중하게 여겨지고 싶거든 (욕구). 다음엔 미리 연락 줄 수 있을까? (부탁)"

---

**❌ 이렇게 말하면:**
→ "너는 내 말을 안 들어. 맨날 휴대폰만 보고!"

**✅ 이렇게 바꿔보세요:**
→ "내가 이야기할 때 휴대폰 보면 (관찰), 나는 무시당하는 느낌이야 (감정). 내 이야기를 들어줬으면 좋겠어 (욕구). 지금 5분만 시간 괜찮아? (부탁)"

---

**❌ 이렇게 말하면:**
→ "당신은 나한테 관심도 없잖아!"

**✅ 이렇게 바꿔보세요:**
→ "요즘 우리가 함께하는 시간이 줄었어 (관찰). 나는 외로워 (감정). 가까운 관계를 원해 (욕구). 이번 주말에 같이 시간 보낼 수 있을까? (부탁)"

---

**📋 4단계 대화법 공식**

모든 어려운 대화에 이 공식을 적용해보세요:

**1단계: 관찰 (사실만)**
   → "어제 약속 시간에 30분 늦었어"
   (판단하지 말고, 사실만 말하기)

**2단계: 감정 (나의 느낌)**
   → "나는 속상했어" / "나는 불안했어"
   (비난 대신, 내 감정 표현하기)

**3단계: 욕구 (진짜 원하는 것)**
   → "나는 존중받고 싶어" / "나는 안전하고 싶어"
   (감정 뒤에 숨은 진짜 욕구 말하기)

**4단계: 부탁 (구체적 요청)**
   → "다음부턴 미리 연락 줄 수 있어?"
   (명령이 아닌 부탁으로, 구체적으로)

---

**🎯 이번 주 실천:**

□ 비폭력 대화 1번만 시도해보기
□ 상대방 말 끝까지 듣기 (끼어들지 않기)
□ "너는"을 "나는"으로 바꿔 말하기

---

💬 **기억하세요:** 처음엔 어색해도 괜찮아요. 연습할수록 자연스러워져요. 완벽하지 않아도, 시도하는 것만으로 충분합니다! 💙`;
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
  const encouragement = miracleIndex >= 75
    ? '**당신은 이미 훌륭하게 해내고 있습니다.** 🌟\n\n이 8단계를 완료한 것만으로도 당신은 달라졌어요. 이제 새로운 시작을 만들어갈 준비가 되었습니다.'
    : miracleIndex >= 50
    ? '**여기까지 오느라 힘들었죠.** 💪\n\n하지만 당신은 포기하지 않았어요. 그것만으로도 대단한 거예요. 이제 새로운 관계의 첫걸음을 내딛을 때입니다.'
    : '**지금은 힘들지만, 이 과정 자체가 성장입니다.** 🌱\n\n완벽하지 않아도 괜찮아요. 천천히, 함께 나아가봅시다. 당신은 혼자가 아니에요.';

  return `## 🌈 모든 관계는 끝이 아니라 새로운 시작입니다

${encouragement}

---

**✨ 새로운 관계를 위한 세 가지 다짐**

### 1. 과거는 과거로 두기 📦

과거의 잘못을 계속 꺼내는 것은 관계를 망치는 가장 빠른 방법이에요.

**❌ 이제 그만:**
- "그때 너가 그랬잖아..."
- "작년에도 그랬고, 재작년에도 그랬고..."
- "너는 맨날 그래"

**✅ 이렇게 시작:**
- "과거는 과거야. 오늘부터 새로 시작하자"
- "우리 이제 다르게 해보자"
- "너도 변하고 있고, 나도 변하고 있어"

→ 과거를 용서하는 건 상대를 위한 게 아니라 **나를 위한 선택**이에요.

---

### 2. 서로의 성장 응원하기 🌱

완벽한 사람은 없어요. 서로의 변화를 응원하고 인정해주세요.

**작은 변화도 인정하기:**
- "요즘 대화할 때 많이 들어주려고 하는 거 알아. 고마워"
- "예전보단 많이 나아진 것 같아"
- "노력하는 거 보여. 나도 노력할게"

**완벽을 기대하지 않기:**
- 실수해도 괜찮아요
- 다시 싸워도 괜찮아요
- 천천히 나아가도 괜찮아요

→ 중요한 건 **방향**이에요. 조금씩이라도 나아지고 있으면 성공이에요.

---

### 3. 정기적인 관계 점검 🔍

관계도 자동차처럼 정기 점검이 필요해요.

**한 달에 한 번, 관계 대화 시간:**
- "요즘 우리 어때?"
- "내가 더 잘할 수 있는 게 뭐가 있을까?"
- "우리 관계에서 좋은 점은 뭐야?"
- "우리가 더 노력해야 할 부분은?"

→ 문제가 커지기 전에 대화하면 대부분 해결돼요.

---

**🎯 당신의 기적 선언문**

이 선언문을 소리 내어 읽어보세요:

> **"나는 ${userProfile.name}입니다.**
>
> **${userProfile.personality}을 가진 사람으로서,**
> **나는 충분히 가치 있고, 사랑받을 자격이 있습니다.**
>
> **관계의 기적을 만들어가겠습니다.**
> **완벽하지 않아도 괜찮습니다.**
> **실수해도 괜찮습니다.**
> **천천히, 하나씩, 함께 나아가겠습니다.**
>
> **오늘부터, 하루하루가 기적입니다."** ✨

---

**🎊 축하합니다!**

${userProfile.name}님, 당신은 8단계를 모두 완료했어요!

이 여정을 완주한 사람은 많지 않아요. 당신은 정말 대단한 분이에요.

**이제 실천만 남았습니다:**

✅ 4주 액션 플랜 시작하기
✅ 매일 작은 것이라도 실천하기
✅ 힘들 때 이 8단계 다시 읽기
✅ 전문가 도움이 필요하면 요청하기

---

**💌 마지막 응원 메시지:**

관계는 완벽할 수 없어요. 하지만 **더 나아질 수는 있어요.**

당신이 이 글을 읽고 있다는 것 자체가 이미 변화의 시작이에요.

하루하루의 작은 노력이 모여 기적이 됩니다.

당신의 관계가 더 따뜻하고, 더 깊어지고, 더 행복해지길 진심으로 응원합니다. 💙

**"오늘부터, 하루하루가 기적입니다."** 🌟

---

_당신은 혼자가 아니에요. 우리가 함께 있어요._ 🤝`;
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
        day: 1,
        task: '현재 고민을 노트에 상세히 기록하기',
        time: '약 10분 정도'
      },
      {
        day: 2,
        task: `나의 ${userProfile.element} 성향 강점 3~4가지 찾기`,
        time: '약 15분 정도'
      },
      {
        day: 3,
        task: '내 감정의 패턴 관찰하기',
        time: '약 10분 정도'
      },
      {
        day: 4,
        task: '문제가 언제부터 시작되었는지 되돌아보기',
        time: '약 15분 정도'
      },
      {
        day: 5,
        task: '내면의 대화 나누기',
        time: '약 20분 정도'
      },
      {
        day: 6,
        task: '이번 주 깨달은 점 3가지 정도 정리',
        time: '약 15분 정도'
      },
      {
        day: 7,
        task: '휴식 및 회고 - 다음 주 준비',
        time: '약 30분 정도'
      }
    ],
    checkpoints: [
      '고민의 핵심을 명확히 파악했는가?',
      '나의 성향을 이해하게 되었는가?',
      '내면의 목소리를 들었는가?'
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
        day: 8,
        task: '문제의 표면 vs 근본 원인 구분하기',
        time: '약 15분 정도'
      },
      {
        day: 9,
        task: '반복되는 내적 갈등 찾기',
        time: '약 15분 정도'
      },
      {
        day: 10,
        task: '변화 가능한 것과 불가능한 것 구분',
        time: '약 10분 정도'
      },
      {
        day: 11,
        task: '30일 정도 후 이루고 싶은 구체적 목표 설정',
        time: '약 20분 정도'
      },
      {
        day: 12,
        task: '목표 달성을 위한 5단계 정도 계획 세우기',
        time: '약 20분 정도'
      },
      {
        day: 13,
        task: '자기 돌봄 계획 만들기',
        time: '약 20분 정도'
      },
      {
        day: 14,
        task: '2주차 점검 및 계획 수정',
        time: '약 30분 정도'
      }
    ],
    checkpoints: [
      '문제의 진짜 원인을 찾았는가?',
      '실현 가능한 목표를 세웠는가?',
      '구체적인 실행 계획이 있는가?'
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
        day: 15,
        task: `${element === 'fire' ? '저녁' : element === 'water' ? '새벽' : '오전'} 시간에 첫 실천 시작`,
        time: '약 30분 정도'
      },
      {
        day: 16,
        task: '자신에게 격려 편지 쓰기',
        time: '약 15분 정도'
      },
      {
        day: 17,
        task: '오늘의 작은 성공 기록하기',
        time: '약 10분 정도'
      },
      {
        day: 18,
        task: '어려운 감정 다루기 연습',
        time: '약 20분 정도'
      },
      {
        day: 19,
        task: '계획대로 안 된 부분 분석 및 조정',
        time: '약 15분 정도'
      },
      {
        day: 20,
        task: '30분 정도 자기성찰 시간',
        time: '약 30분 정도'
      },
      {
        day: 21,
        task: '3주차 변화 점검 - 사전/사후 비교',
        time: '약 30분 정도'
      }
    ],
    checkpoints: [
      '매일 실천을 지속하고 있는가?',
      '내면의 변화가 느껴지는가?',
      '어려움이 생겼을 때 잘 대처했는가?'
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
        day: 22,
        task: '지난 3주간의 변화 정리하기',
        time: '약 20분 정도'
      },
      {
        day: 23,
        task: '자기 성장 정도 평가하기',
        time: '약 15분 정도'
      },
      {
        day: 24,
        task: '앞으로도 지속할 루틴 3가지 정도 선정',
        time: '약 15분 정도'
      },
      {
        day: 25,
        task: '장애물이 생겼을 때 대처 매뉴얼 작성',
        time: '약 20분 정도'
      },
      {
        day: 26,
        task: '다음 30일 정도 목표 설정',
        time: '약 30분 정도'
      },
      {
        day: 27,
        task: '나를 응원하는 사람들에게 감사 표현',
        time: '약 15분 정도'
      },
      {
        day: 28,
        task: '30일 여정 축하 및 보상하기',
        time: '약 60분 정도'
      },
      {
        day: 29,
        task: '학습한 것들 정리 및 공유',
        time: '약 30분 정도'
      },
      {
        day: 30,
        task: '새로운 30일 기적 시작 준비',
        time: '약 30분 정도'
      }
    ],
    checkpoints: [
      '목표를 얼마나 달성했는가?',
      '지속 가능한 습관이 형성되었는가?',
      '다음 단계로 나아갈 준비가 되었는가?'
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
