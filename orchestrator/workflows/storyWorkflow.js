/**
 * 📖 Story Workflow
 *
 * 개인화된 스토리 생성 워크플로우
 *
 * 단계:
 * 1. 입력 검증
 * 2. 스토리 텍스트 생성
 * 3. 이미지 생성 (병렬)
 * 4. 데이터베이스 저장
 */

const { info } = require('../../config/logger');

module.exports = {
  name: 'create-story',
  description: '개인화된 스토리 생성 워크플로우',

  steps: [
    {
      name: 'validate-input',
      description: '입력 데이터 검증',
      handler: async (context) => {
        const input = await context.get('input');

        // 필수 필드 검증
        const required = ['name', 'age', 'personality', 'hobby', 'dreamJob',
                         'favoriteColor', 'favoriteAnimal', 'specialMemory'];

        const missing = required.filter(field => !input[field]);

        if (missing.length > 0) {
          throw new Error(`필수 입력값 누락: ${missing.join(', ')}`);
        }

        info('✅ 입력 검증 완료', {
          name: input.name,
          age: input.age
        });

        return { validated: true, input };
      }
    },

    {
      name: 'generate-story-and-images',
      description: '스토리 및 이미지 생성',
      parallel: true, // 병렬 실행 가능
      handler: async (context) => {
        const { generateStoryWithImages } = require('../../services/storyService');
        const { input } = await context.get('validate-input');

        info('🎨 스토리 생성 시작', { name: input.name });

        // 스토리 + 이미지 생성 (내부적으로 이미 병렬 처리됨)
        const result = await generateStoryWithImages(input);

        info('✅ 스토리 생성 완료', {
          textLength: result.storyText.length,
          images: result.imageUrls.length
        });

        return result;
      },
      retry: true // 실패 시 재시도
    },

    {
      name: 'save-to-database',
      description: '데이터베이스에 저장',
      handler: async (context) => {
        try {
          const { saveStory } = require('../../services/dataService');
          const storyData = await context.get('generate-story-and-images');
          const { input } = await context.get('validate-input');

          info('💾 데이터베이스 저장 중...');

          // 데이터베이스에 저장 (올바른 파라미터 순서)
          const storyId = await saveStory(storyData.storyId, {
            ...input,
            story: storyData.storyText,
            images: storyData.imageUrls
          });

          info('✅ 데이터베이스 저장 완료');

          return {
            success: true,
            storyId: storyId
          };
        } catch (error) {
          // 데이터베이스 저장 실패해도 스토리는 제공
          console.warn('⚠️  데이터베이스 저장 실패 (스토리는 계속 제공):', error.message);

          const storyData = await context.get('generate-story-and-images');

          return {
            success: true,
            storyId: storyData.storyId,
            dbSaveFailed: true
          };
        }
      }
    }
  ],

  // 에러 핸들러
  onError: async (error, context) => {
    const contextId = context.id;

    console.error('❌ 스토리 워크플로우 실패:', {
      contextId,
      error: error.message
    });

    // API 제한 에러인 경우 재시도
    if (error.message.includes('rate limit') || error.message.includes('quota')) {
      return {
        retry: true,
        delay: 10000 // 10초 대기
      };
    }

    // 그 외 에러는 재시도하지 않음
    return { retry: false };
  },

  // 완료 핸들러
  onComplete: async (result, context) => {
    const duration = context.duration;

    info('🎉 스토리 워크플로우 완료', {
      contextId: context.id,
      duration: `${duration}ms`,
      storyId: result['save-to-database']?.storyId
    });

    // Notion에 성공 알림 (선택적)
    try {
      // TODO: Notion 통합
      // const notionService = require('../../automation/notion/...');
      // await notionService.notify({ ... });
    } catch (error) {
      // Notion 알림 실패는 무시
      console.warn('Notion 알림 실패:', error.message);
    }
  }
};
