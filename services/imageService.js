const path = require('path');
const fs = require('fs').promises;
const { generateImage } = require('./openaiService');
const { downloadImage } = require('../utils/fileUtils');
const { IMAGE_STYLE_PROMPT, BLANK_FRAME_PROMPT } = require('../config/constants');

// 개별 이미지 생성 함수 (기존 버전 - 순차 처리용)
async function generateSceneImage(imageDescription, storyId, sceneNumber) {
  try {
    console.log(`장면 ${sceneNumber} 이미지 생성 시작...`);

    const prompt = `${imageDescription}${IMAGE_STYLE_PROMPT}`;
    const imageUrl = await generateImage(prompt);

    // generated-images 폴더가 없으면 생성
    const dir = 'generated-images';
    await fs.mkdir(dir, { recursive: true });

    // 이미지 다운로드
    const filename = `${storyId}_scene_${sceneNumber}.png`;
    const filepath = path.join(dir, filename);

    await downloadImage(imageUrl, filepath);

    console.log(`장면 ${sceneNumber} 이미지 생성 완료: ${filename}`);
    return `/generated-images/${filename}`;

  } catch (error) {
    console.error(`장면 ${sceneNumber} 이미지 생성 실패:`, error.message);
    return null; // 이미지 생성 실패해도 스토리는 계속 진행
  }
}

// 병렬 처리용 개별 이미지 생성 함수 (인덱스 포함)
async function generateSceneImageWithIndex(imageDescription, storyId, sceneNumber, originalIndex) {
  try {
    const prompt = `${imageDescription}${IMAGE_STYLE_PROMPT}`;
    const imageUrl = await generateImage(prompt);

    // generated-images 폴더가 없으면 생성
    const dir = 'generated-images';
    await fs.mkdir(dir, { recursive: true });

    // 이미지 다운로드
    const filename = `${storyId}_scene_${sceneNumber}.png`;
    const filepath = path.join(dir, filename);

    await downloadImage(imageUrl, filepath);

    console.log(`✅ 장면 ${sceneNumber} 이미지 생성 완료: ${filename}`);
    return {
      url: `/generated-images/${filename}`,
      originalIndex: originalIndex
    };

  } catch (error) {
    console.error(`❌ 장면 ${sceneNumber} 이미지 생성 실패:`, error.message);
    throw new Error(`장면 ${sceneNumber} 생성 실패: ${error.message}`);
  }
}

// 11페이지 빈 프레임 생성 함수 (기존 버전 - 순차 처리용)
async function generateBlankFrame(storyId) {
  try {
    console.log('빈 프레임 이미지 생성 중...');

    const imageUrl = await generateImage(BLANK_FRAME_PROMPT);

    // 빈 프레임 이미지 다운로드
    const dir = 'generated-images';
    await fs.mkdir(dir, { recursive: true });

    const filename = `${storyId}_blank_frame.png`;
    const filepath = path.join(dir, filename);

    await downloadImage(imageUrl, filepath);

    console.log(`✨ 빈 프레임 생성 완료: ${filename}`);
    return `/generated-images/${filename}`;

  } catch (error) {
    console.error('빈 프레임 생성 실패:', error.message);
    return null;
  }
}

// 병렬 처리용 빈 프레임 생성 함수 (인덱스 포함)
async function generateBlankFrameWithIndex(storyId, originalIndex) {
  try {
    const imageUrl = await generateImage(BLANK_FRAME_PROMPT);

    // 빈 프레임 이미지 다운로드
    const dir = 'generated-images';
    await fs.mkdir(dir, { recursive: true });

    const filename = `${storyId}_blank_frame.png`;
    const filepath = path.join(dir, filename);

    await downloadImage(imageUrl, filepath);

    console.log(`✨ 빈 프레임 생성 완료: ${filename}`);
    return {
      url: `/generated-images/${filename}`,
      originalIndex: originalIndex
    };

  } catch (error) {
    console.error('❌ 빈 프레임 생성 실패:', error.message);
    throw new Error(`빈 프레임 생성 실패: ${error.message}`);
  }
}

module.exports = {
  generateSceneImage,
  generateSceneImageWithIndex,
  generateBlankFrame,
  generateBlankFrameWithIndex
};