const express = require('express');
const { generateStoryWithImages } = require('../services/storyService');
const { saveStory, getStory, getStoriesCount, getDatabaseStats } = require('../services/dataService');

const router = express.Router();

// 스토리 생성 API (통합 버전)
router.post('/create-story', async (req, res) => {
  try {
    console.log('📝 새로운 스토리 요청 받음');

    // 스토리 + 이미지 생성
    const result = await generateStoryWithImages(req.body);

    // 데이터베이스에 저장
    const storyId = result.storyId || `story_${Date.now()}`;
    const savedStoryId = await saveStory(storyId, {
      ...req.body,
      story: result.storyText,
      images: result.imageUrls
    });

    console.log(`💾 스토리 저장됨: ${savedStoryId}`);

    res.json({
      success: true,
      storyId: savedStoryId,
      redirectUrl: `/story/${savedStoryId}`
    });

  } catch (error) {
    console.error('스토리 생성 에러:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || '스토리 생성 중 오류가 발생했습니다.'
    });
  }
});

// 상태 확인 API
router.get('/status', async (req, res) => {
  try {
    const stats = await getDatabaseStats();
    res.json({
      status: 'running',
      totalStories: stats.totalStories,
      totalImages: stats.totalImages,
      uptime: process.uptime(),
      database: {
        type: 'SQLite',
        oldestStory: stats.oldestStory,
        newestStory: stats.newestStory
      }
    });
  } catch (error) {
    console.error('상태 조회 에러:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

module.exports = router;