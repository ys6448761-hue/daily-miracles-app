/**
 * ShortsTemplateRegistry.js
 * YouTube Shorts 템플릿 SSOT — 4종 정의
 *
 * 설계 원칙:
 *  - 신규 엔진 없음: HERO 세트(constants.js) + durationPreset 'short' 재사용
 *  - 각 템플릿은 1씬 = 3 keyframe = 1 Short (9:16, ~6초)
 *  - templateId가 유일 키 (외부 참조 시 이 파일이 SSOT)
 *
 * 템플릿 목록:
 *   single_wish    — 소원 하나를 주인공이 별로 담는 장면
 *   triple_wish    — 세 개의 소원이 흐르는 광장 장면
 *   question_prompt — "당신의 소원은?" 질문형 CTA
 *   brand_close    — 브랜드 클로징 범퍼 (드림타운 로고 컨셉)
 */

const SHORTS_TEMPLATES = {

  single_wish: {
    templateId:   'single_wish',
    name:         '소원 별 만들기',
    description:  '소원 하나를 주인공이 별로 담는 장면 — 전환 CTA 유도',
    heroSeed:     'HERO1',
    mood:         'calm, hopeful',
    durationPreset: 'short',
    aspectRatio:  '9:16',
    hashtags:     ['#드림타운', '#소원', '#소원별', '#shorts'],
    ctaText:      '당신의 소원도 별이 될 수 있어요 → 링크',
    titleTemplate: (wishText) =>
      wishText
        ? `"${wishText.slice(0, 20)}" — 이 소원이 별이 되는 순간`
        : '소원 하나가 별이 되는 순간',
    descTemplate: (wishText) =>
      wishText
        ? `"${wishText.slice(0, 40)}" 이 소원, DreamTown에서 별이 되었어요. 당신의 소원도 함께해요.`
        : '당신의 소원은 혼자가 아닙니다. DreamTown에서 별이 되세요.',
  },

  triple_wish: {
    templateId:   'triple_wish',
    name:         '세 소원 흐름',
    description:  '광장에서 세 개의 소원이 흐르는 장면 — 커뮤니티 분위기 전달',
    heroSeed:     'HERO3',
    mood:         'fresh, uplifting',
    durationPreset: 'short',
    aspectRatio:  '9:16',
    hashtags:     ['#드림타운', '#소원광장', '#소원별셋', '#shorts'],
    ctaText:      '지금 광장에서 소원별을 만나보세요 → 링크',
    titleTemplate: () => '오늘 광장에 별 셋이 떴어요',
    descTemplate: () =>
      '드림타운 광장에는 오늘도 소원별이 탄생하고 있어요. 당신의 소원도 빛날 수 있어요.',
  },

  question_prompt: {
    templateId:   'question_prompt',
    name:         '소원 질문형 CTA',
    description:  '"당신의 소원은 무엇인가요?" 질문으로 참여 유도',
    heroSeed:     'HERO2',
    mood:         'calm, reflective',
    durationPreset: 'short',
    aspectRatio:  '9:16',
    hashtags:     ['#드림타운', '#소원질문', '#오늘의소원', '#shorts'],
    ctaText:      '댓글에 당신의 소원을 남겨보세요 ✨',
    titleTemplate: () => '당신의 소원은 무엇인가요?',
    descTemplate: () =>
      '조용히, 그러나 확실하게 — 오늘 하나의 소원을 별로 만들어보세요. DreamTown이 함께합니다.',
  },

  brand_close: {
    templateId:   'brand_close',
    name:         '브랜드 클로징',
    description:  '드림타운 브랜드 클로징 범퍼 — 노을 장면 + 슬로건',
    heroSeed:     'HERO4',
    mood:         'warm, romantic, hopeful',
    durationPreset: 'short',
    aspectRatio:  '9:16',
    hashtags:     ['#드림타운', '#DreamTown', '#소원', '#shorts'],
    ctaText:      'DreamTown — 당신의 소원은 혼자가 아닙니다',
    titleTemplate: () => 'DreamTown — 당신의 소원은 혼자가 아닙니다',
    descTemplate: () =>
      'DreamTown. 소원이 별이 되는 곳. 지금 함께하세요.',
  },
};

/**
 * 템플릿 조회
 * @param {string} templateId
 * @returns {Object} 템플릿 정의
 * @throws {Error} 존재하지 않는 templateId
 */
function getTemplate(templateId) {
  const t = SHORTS_TEMPLATES[templateId];
  if (!t) {
    const valid = Object.keys(SHORTS_TEMPLATES).join(', ');
    throw new Error(`Unknown templateId: "${templateId}". Valid: ${valid}`);
  }
  return t;
}

/**
 * 전체 템플릿 목록 (id + name + description만 노출)
 * @returns {Array<{ templateId, name, description, heroSeed, mood, hashtags, ctaText }>}
 */
function listTemplates() {
  return Object.values(SHORTS_TEMPLATES).map(({ templateId, name, description, heroSeed, mood, hashtags, ctaText }) => ({
    templateId, name, description, heroSeed, mood, hashtags, ctaText,
  }));
}

module.exports = { SHORTS_TEMPLATES, getTemplate, listTemplates };
