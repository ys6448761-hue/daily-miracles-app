/**
 * ShortsManifestBuilder.js
 * templateId + wishText → Shorts 씬 매니페스트 빌드
 *
 * 설계 원칙:
 *  - Hero8/Storyboard 씬 구조와 동일 (StoryboardBatchRunner 직접 재사용 가능)
 *  - 1 Short = 1 씬 = 3 keyframe
 *  - manifestId는 생성 시점 UUID — 중복 없음
 */

const { randomUUID } = require('crypto');
const { getTemplate } = require('./ShortsTemplateRegistry');

/**
 * Shorts 매니페스트 빌드
 *
 * @param {Object} options
 * @param {string}  options.templateId  - 'single_wish' | 'triple_wish' | 'question_prompt' | 'brand_close'
 * @param {string}  [options.wishText]  - 소원 텍스트 (titleTemplate / descTemplate에 반영)
 * @param {string}  [options.heroId]    - HERO1~HERO5 오버라이드 (없으면 템플릿 기본값)
 * @param {string}  [options.mood]      - mood 오버라이드
 * @returns {{
 *   manifestId: string,
 *   templateId: string,
 *   title: string,
 *   durationPreset: string,
 *   aspectRatio: string,
 *   scenes: Array<{ sceneId: string, text: string, promptSeed: string, mood: string }>,
 *   shorts_metadata: { title: string, description: string, hashtags: string[], ctaText: string }
 * }}
 */
function buildManifest({ templateId, wishText = '', heroId, mood } = {}) {
  if (!templateId) throw new Error('templateId is required');

  const tpl = getTemplate(templateId);

  const resolvedHero = heroId || tpl.heroSeed;
  const resolvedMood = mood   || tpl.mood;
  const title        = tpl.titleTemplate(wishText);
  const description  = tpl.descTemplate(wishText);

  // scene text: wishText 있으면 포함, 없으면 hero의 기본 topic으로 fallback
  const sceneText = wishText
    ? `${wishText.slice(0, 60)}`
    : title;

  return {
    manifestId:     randomUUID(),
    templateId,
    title,
    durationPreset: tpl.durationPreset,   // 'short' (6s)
    aspectRatio:    tpl.aspectRatio,      // '9:16'
    scenes: [
      {
        sceneId:    'main',
        text:       sceneText,
        promptSeed: resolvedHero,
        mood:       resolvedMood,
      },
    ],
    shorts_metadata: {
      title,
      description,
      hashtags:  tpl.hashtags,
      ctaText:   tpl.ctaText,
      aspectRatio: tpl.aspectRatio,
      durationPreset: tpl.durationPreset,
    },
  };
}

/**
 * 샘플 3종 매니페스트 생성 (sample endpoint용)
 * @returns {Array<Object>} 3개 매니페스트 배열
 */
function buildSampleManifests() {
  return [
    buildManifest({ templateId: 'single_wish',     heroId: 'HERO1' }),
    buildManifest({ templateId: 'question_prompt', heroId: 'HERO2' }),
    buildManifest({ templateId: 'brand_close',     heroId: 'HERO4' }),
  ];
}

module.exports = { buildManifest, buildSampleManifests };
