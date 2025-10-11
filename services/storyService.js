const { generateStoryText } = require('./openaiService');
const { generateSceneImageWithIndex, generateBlankFrameWithIndex } = require('./imageService');
const { extractImageDescriptions } = require('../utils/textUtils');
const { limitConcurrency } = require('../utils/concurrency');
const { STORY_PROMPT_TEMPLATE, MAX_CONCURRENT_REQUESTS } = require('../config/constants');

// 스토리 생성 프롬프트 (이미지 설명 포함)
function createStoryPrompt(data) {
  return STORY_PROMPT_TEMPLATE
    .replace('{name}', data.name)
    .replace('{age}', data.age)
    .replace('{personality}', data.personality)
    .replace('{hobby}', data.hobby)
    .replace('{dreamJob}', data.dreamJob)
    .replace('{favoriteColor}', data.favoriteColor)
    .replace('{favoriteAnimal}', data.favoriteAnimal)
    .replace('{specialMemory}', data.specialMemory);
}

// 스토리 + 이미지 생성 함수
async function generateStoryWithImages(formData) {
  try {
    console.log('스토리 텍스트 생성 중...');

    const prompt = createStoryPrompt(formData);
    const storyText = await generateStoryText(prompt);

    console.log('✅ 스토리 텍스트 생성 완료');

    // 이미지 설명 추출
    const imageDescriptions = extractImageDescriptions(storyText);
    console.log(`📝 추출된 이미지 설명: ${imageDescriptions.length}개`);

    if (imageDescriptions.length === 0) {
      console.log('⚠️ 이미지 설명을 찾을 수 없음, 텍스트만 반환');
      return {
        storyText,
        imageUrls: [],
        error: '이미지 설명을 추출할 수 없었습니다.'
      };
    }

    // 스토리 ID 생성
    const storyId = `story_${Date.now()}`;

    // 이미지 생성 (병렬 처리) - 10개 페이지 + 빈 페이지
    console.log('🎨 이미지 생성 시작... (총 11개) - 병렬 처리로 빠르게!');
    const startTime = Date.now();

    // 병렬 이미지 생성을 위한 Promise 배열 생성
    const imagePromises = [];

    // 1-10페이지: 스토리 이미지 생성 (병렬)
    const maxStoryImages = Math.min(imageDescriptions.length, 10);
    for (let i = 0; i < maxStoryImages; i++) {
      const promise = generateSceneImageWithIndex(imageDescriptions[i], storyId, i + 1, i);
      imagePromises.push(promise);
    }

    // 11페이지: 빈 프레임 이미지 생성 (동시에 시작)
    const blankFramePromise = generateBlankFrameWithIndex(storyId, maxStoryImages);
    imagePromises.push(blankFramePromise);

    console.log(`📊 ${imagePromises.length}개 이미지 병렬 생성 중... (최대 ${MAX_CONCURRENT_REQUESTS}개씩 동시 처리)`);

    // 진행률 추적을 위한 변수들
    let completedCount = 0;
    const totalCount = imagePromises.length;

    // 각 Promise에 진행률 추적 추가
    const trackedPromises = imagePromises.map((promise, index) => {
      return promise.then(result => {
        completedCount++;
        const percentage = ((completedCount / totalCount) * 100).toFixed(1);
        console.log(`🔄 진행률: ${completedCount}/${totalCount} (${percentage}%) 완료`);
        return result;
      }).catch(error => {
        completedCount++;
        const percentage = ((completedCount / totalCount) * 100).toFixed(1);
        console.log(`⚠️  진행률: ${completedCount}/${totalCount} (${percentage}%) - 오류 포함`);
        throw error;
      });
    });

    // 동시 요청 수를 제한하여 병렬 처리 (API 제한 고려)
    const imageResults = await limitConcurrency(trackedPromises, MAX_CONCURRENT_REQUESTS);

    // 결과 처리 및 순서 정렬
    const imageUrls = new Array(imageResults.length);
    let successCount = 0;
    let failedCount = 0;

    imageResults.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        imageUrls[result.value.originalIndex] = result.value.url;
        successCount++;
      } else {
        console.error(`이미지 생성 실패 (인덱스 ${index}):`, result.reason?.message || '알 수 없는 오류');
        imageUrls[index] = null;
        failedCount++;
      }
    });

    const endTime = Date.now();
    const totalTime = ((endTime - startTime) / 1000).toFixed(1);
    const averageTimePerImage = (totalTime / totalCount).toFixed(1);

    console.log('🎉 병렬 이미지 생성 완료!');
    console.log(`⏱️  총 소요 시간: ${totalTime}초 (평균 ${averageTimePerImage}초/이미지)`);
    console.log(`✅ 성공: ${successCount}개 | ❌ 실패: ${failedCount}개`);

    // 성능 개선 정보 표시
    const estimatedSequentialTime = totalCount * 30; // 순차 처리 시 예상 시간 (30초/이미지)
    const timeImprovement = ((estimatedSequentialTime - parseInt(totalTime)) / estimatedSequentialTime * 100).toFixed(1);

    if (totalTime < estimatedSequentialTime) {
      console.log(`🚀 성능 개선: 순차 처리 대비 약 ${timeImprovement}% 빠름 (예상 ${estimatedSequentialTime}초 → 실제 ${totalTime}초)`);
    }

    if (failedCount > 0) {
      console.log('⚠️  일부 이미지 생성에 실패했지만 스토리는 계속 제공됩니다.');
    }

    return {
      storyText,
      imageUrls: imageUrls.filter(url => url !== null), // null 제거
      storyId
    };

  } catch (error) {
    console.error('스토리 생성 실패:', error.message);
    throw error;
  }
}

module.exports = {
  generateStoryWithImages
};