// ═══════════════════════════════════════════════════════════
// Template Selector Service
// 사용자 특성에 따라 최적의 템플릿 선택
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// Template Configurations
// ═══════════════════════════════════════════════════════════

const TEMPLATES = {
  'classic-elegant': {
    name: 'Classic Elegant',
    description: '우아하고 전통적인 디자인',
    colors: {
      primary: '#9B7EBD',
      secondary: '#D4C5E8',
      background: '#FFFFFF',
      text: '#2C2C2C'
    },
    fonts: {
      heading: 'Playfair Display',
      body: 'Lora'
    },
    style: 'elegant',
    mood: 'calm',
    target: ['30-50세', '여성', '자기계발', '건강', '취미'],
    personality: ['차분한', '섬세한', '전통적인']
  },

  'modern-dynamic': {
    name: 'Modern Dynamic',
    description: '현대적이고 역동적인 디자인',
    colors: {
      primary: '#8B5CF6',
      secondary: '#1F1F1F',
      accent: '#F59E0B',
      background: '#0F0F0F',
      text: '#FFFFFF'
    },
    fonts: {
      heading: 'Inter',
      body: 'Inter'
    },
    style: 'modern',
    mood: 'energetic',
    target: ['20-35세', '남성', '커리어', '비즈니스', '기술'],
    personality: ['적극적인', '혁신적인', '도전적인']
  },

  'warm-friendly': {
    name: 'Warm Friendly',
    description: '따뜻하고 친근한 디자인',
    colors: {
      primary: '#E9A8D0',
      secondary: '#B8E6F0',
      background: '#FFF9F5',
      text: '#4A4A4A'
    },
    fonts: {
      heading: 'Quicksand',
      body: 'Nunito'
    },
    style: 'friendly',
    mood: 'cheerful',
    target: ['전연령', '여성', '관계', '감정', '일상'],
    personality: ['밝은', '사교적인', '따뜻한']
  },

  'professional': {
    name: 'Professional',
    description: '전문적이고 격식있는 디자인',
    colors: {
      primary: '#1E3A5F',
      secondary: '#C9A961',
      background: '#F8F9FA',
      text: '#212529'
    },
    fonts: {
      heading: 'Roboto',
      body: 'Open Sans'
    },
    style: 'professional',
    mood: 'serious',
    target: ['30-60세', '남성', '비즈니스', '커리어', '재무'],
    personality: ['체계적인', '진지한', '목표지향적']
  }
};

// ═══════════════════════════════════════════════════════════
// Category Mapping
// ═══════════════════════════════════════════════════════════

const CATEGORY_TEMPLATES = {
  '건강': ['warm-friendly', 'classic-elegant'],
  '운동': ['modern-dynamic', 'professional'],
  '다이어트': ['warm-friendly', 'classic-elegant'],
  '커리어': ['professional', 'modern-dynamic'],
  '비즈니스': ['professional', 'modern-dynamic'],
  '재무': ['professional', 'modern-dynamic'],
  '학습': ['professional', 'classic-elegant'],
  '자기계발': ['classic-elegant', 'professional'],
  '취미': ['warm-friendly', 'classic-elegant'],
  '관계': ['warm-friendly', 'classic-elegant'],
  '습관': ['warm-friendly', 'modern-dynamic'],
  '기술': ['modern-dynamic', 'professional']
};

// ═══════════════════════════════════════════════════════════
// Age Group Mapping
// ═══════════════════════════════════════════════════════════

const AGE_TEMPLATES = {
  '10대': ['modern-dynamic', 'warm-friendly'],
  '20대': ['modern-dynamic', 'warm-friendly'],
  '30대': ['professional', 'classic-elegant'],
  '40대': ['professional', 'classic-elegant'],
  '50대 이상': ['classic-elegant', 'professional']
};

// ═══════════════════════════════════════════════════════════
// Template Selection Logic
// ═══════════════════════════════════════════════════════════

function selectTemplate(userData) {
  const scores = {
    'classic-elegant': 0,
    'modern-dynamic': 0,
    'warm-friendly': 0,
    'professional': 0
  };

  // 1. 카테고리 기반 점수
  if (userData.category) {
    const categoryMatch = CATEGORY_TEMPLATES[userData.category];
    if (categoryMatch) {
      categoryMatch.forEach((template, index) => {
        scores[template] += (3 - index) * 2; // 첫 번째: +4, 두 번째: +2
      });
    }
  }

  // 2. 나이 기반 점수
  if (userData.age) {
    const ageGroup = getAgeGroup(userData.age);
    const ageMatch = AGE_TEMPLATES[ageGroup];
    if (ageMatch) {
      ageMatch.forEach((template, index) => {
        scores[template] += (3 - index) * 1.5; // 첫 번째: +3, 두 번째: +1.5
      });
    }
  }

  // 3. 성별 기반 점수 (가벼운 가중치)
  if (userData.gender === '여성') {
    scores['classic-elegant'] += 1;
    scores['warm-friendly'] += 1;
  } else if (userData.gender === '남성') {
    scores['modern-dynamic'] += 1;
    scores['professional'] += 1;
  }

  // 4. 감정/톤 기반 점수
  if (userData.emotion) {
    const emotion = userData.emotion.toLowerCase();
    if (emotion.includes('차분') || emotion.includes('평온')) {
      scores['classic-elegant'] += 2;
    }
    if (emotion.includes('활발') || emotion.includes('적극')) {
      scores['modern-dynamic'] += 2;
    }
    if (emotion.includes('따뜻') || emotion.includes('친근')) {
      scores['warm-friendly'] += 2;
    }
    if (emotion.includes('진지') || emotion.includes('체계')) {
      scores['professional'] += 2;
    }
  }

  // 5. 소원 내용 분석
  if (userData.wish) {
    const wish = userData.wish.toLowerCase();

    // 비즈니스/커리어 키워드
    if (wish.includes('승진') || wish.includes('사업') || wish.includes('매출')) {
      scores['professional'] += 3;
      scores['modern-dynamic'] += 2;
    }

    // 건강/웰빙 키워드
    if (wish.includes('건강') || wish.includes('다이어트') || wish.includes('운동')) {
      scores['warm-friendly'] += 2;
      scores['classic-elegant'] += 1;
    }

    // 학습/성장 키워드
    if (wish.includes('공부') || wish.includes('자격증') || wish.includes('학습')) {
      scores['professional'] += 2;
      scores['classic-elegant'] += 2;
    }

    // 관계/감정 키워드
    if (wish.includes('관계') || wish.includes('소통') || wish.includes('행복')) {
      scores['warm-friendly'] += 3;
    }
  }

  // 6. 최고 점수 템플릿 선택
  let maxScore = 0;
  let selectedTemplate = 'classic-elegant'; // 기본값

  for (const [template, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      selectedTemplate = template;
    }
  }

  console.log('📊 템플릿 점수:', scores);
  console.log(`✅ 선택된 템플릿: ${selectedTemplate} (점수: ${maxScore})`);

  return {
    template: selectedTemplate,
    scores: scores,
    info: TEMPLATES[selectedTemplate]
  };
}

// ═══════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════

function getAgeGroup(age) {
  if (age < 20) return '10대';
  if (age < 30) return '20대';
  if (age < 40) return '30대';
  if (age < 50) return '40대';
  return '50대 이상';
}

function getTemplateInfo(templateName) {
  return TEMPLATES[templateName] || null;
}

function getAllTemplates() {
  return Object.keys(TEMPLATES);
}

// ═══════════════════════════════════════════════════════════
// Template Distribution (A/B Testing용)
// ═══════════════════════════════════════════════════════════

function selectRandomTemplate() {
  const templates = Object.keys(TEMPLATES);
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

function selectTemplateByDistribution(userId) {
  // 사용자 ID 기반 일관된 분배
  const templates = Object.keys(TEMPLATES);
  const hash = hashCode(userId);
  const index = Math.abs(hash) % templates.length;
  return templates[index];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// ═══════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════

module.exports = {
  selectTemplate,
  getTemplateInfo,
  getAllTemplates,
  selectRandomTemplate,
  selectTemplateByDistribution,
  TEMPLATES
};
