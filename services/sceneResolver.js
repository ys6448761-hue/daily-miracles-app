/**
 * Scene Resolver
 * Experience 자격 배열에서 소원그림 생성에 사용할 Scene을 결정
 *
 * 규칙:
 * - 우선순위: CABLECAR_PHOTO > CABLECAR_TICKET > AQUA_ADDON > CRUISE > STARLIGHT
 * - 검증된 experiences만 처리
 * - 빈 배열이나 검증 실패 → YEOSU_ORIGIN (기본값)
 */

const {
  ExperiencePriority,
  ExperienceToScene
} = require('../config/experienceIdentity');

/**
 * experiences 배열에서 최우선 Experience 선택
 * @param {Array} experiences - Experience 객체 배열
 * @param {string} [requestId] - 로깅용 request ID
 * @returns {Object} { scene: string, appliedExperience: Object|null }
 */
function resolveScene(experiences, requestId = 'unknown') {
  const rid = requestId;

  // 입력 검증
  if (!Array.isArray(experiences) || experiences.length === 0) {
    console.log(`[SceneResolver] [${rid}] No experiences provided, defaulting to YEOSU_ORIGIN`);
    return {
      scene: 'YEOSU_ORIGIN',
      appliedExperience: null,
      reason: 'empty_experiences'
    };
  }

  // 우선순위로 정렬
  const sorted = experiences
    .filter(exp => exp && exp.type)  // null/undefined 제외
    .sort((a, b) => {
      const priorityA = ExperiencePriority[a.type] || 0;
      const priorityB = ExperiencePriority[b.type] || 0;
      return priorityB - priorityA;
    });

  if (sorted.length === 0) {
    console.log(`[SceneResolver] [${rid}] No valid experiences after filtering`);
    return {
      scene: 'YEOSU_ORIGIN',
      appliedExperience: null,
      reason: 'no_valid_experiences'
    };
  }

  const topExperience = sorted[0];
  const scene = ExperienceToScene[topExperience.type] || 'YEOSU_ORIGIN';

  console.log(
    `[SceneResolver] [${rid}] Resolved scene: ${scene} (type=${topExperience.type}, source=${topExperience.source})` +
    (topExperience.order_id ? ` order_id=${topExperience.order_id}` : '')
  );

  return {
    scene,
    appliedExperience: topExperience,
    reason: 'resolved_from_priority'
  };
}

/**
 * Scene을 Prompt Builder 함수명으로 변환
 * @param {string} scene - Scene ID
 * @returns {string} - buildXxxWishPrompt 함수명
 */
function sceneToPromptBuilder(scene) {
  const builders = {
    'YEOSU_ORIGIN': 'buildYeosuWishPrompt',
    'AQUA_SCENE': 'buildAquaWishPrompt',
    'CABLECAR_SCENE': 'buildCablecarWishPrompt',
    'CRUISE_SCENE': 'buildCruiseWishPrompt',
    'CABLECAR_PHOTO_SCENE': 'buildCablecarPhotoWishPrompt'
  };

  return builders[scene] || builders['YEOSU_ORIGIN'];
}

module.exports = {
  resolveScene,
  sceneToPromptBuilder
};
