const express = require('express');
const path = require('path');
const { getStory } = require('../services/dataService');

const router = express.Router();

// 메인 페이지
router.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// 개별 스토리 페이지
router.get('/story/:id', async (req, res) => {
  try {
    const storyId = req.params.id;
    const storyData = await getStory(storyId);

    if (!storyData) {
      return res.status(404).send('<h1>스토리를 찾을 수 없습니다</h1>');
    }

    // 스토리 텍스트를 HTML로 변환
    let storyHtml = storyData.story
      .replace(/## 페이지 (\\d+): (.+)/g, '<h2 class="scene-title">페이지 $1: $2</h2>')
      .replace(/\\*\\*이미지:\\*\\* (.+)/g, '') // 이미지 설명은 제거
      .replace(/\\*\\*스토리:\\*\\*/g, '<div class="story-content">')
      .replace(/---/g, '</div><hr>')
      .replace(/\\n\\n/g, '</p><p>')
      .replace(/\\n/g, '<br>');

    // 마지막 div 태그 닫기
    if (!storyHtml.includes('</div>')) {
      storyHtml += '</div>';
    }

    // 이미지 HTML 생성
    let imagesHtml = '';
    if (storyData.images && storyData.images.length > 0) {
      storyData.images.forEach((imageUrl, index) => {
        if (imageUrl) {
          const isBlankFrame = index === storyData.images.length - 1;
          const pageNumber = isBlankFrame ? 11 : index + 1;
          const caption = isBlankFrame ? "11페이지: 여기에 당신의 미래가 그려집니다" : `페이지 ${pageNumber}`;

          imagesHtml += `
            <div class="image-container ${isBlankFrame ? 'blank-frame' : ''}">
              <img src="${imageUrl}" alt="${caption}" class="story-image">
              <p class="image-caption">${caption}</p>
            </div>
          `;
        }
      });
    }

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${storyData.name}님의 기적 이야기</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Malgun Gothic', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        .title {
            font-size: 2.5rem;
            color: #2c3e50;
            text-align: center;
            margin-bottom: 30px;
        }
        .story-content {
            font-size: 1.1rem;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 15px;
        }
        .image-container {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        .story-image {
            max-width: 100%;
            height: auto;
            border-radius: 10px;
        }
        .image-caption {
            margin-top: 15px;
            color: #7f8c8d;
            font-style: italic;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">${storyData.name}님의 기적 이야기</h1>
        <div class="story-content">${storyHtml}</div>
        ${imagesHtml}
        <div style="text-align: center; margin-top: 50px; color: #7f8c8d;">
            <p>생성 날짜: ${storyData.createdAt.toLocaleDateString('ko-KR')}</p>
            <p>스토리 ID: ${storyId}</p>
        </div>
    </div>
</body>
</html>`;

    res.send(html);

  } catch (error) {
    console.error('스토리 페이지 로드 에러:', error.message);
    res.status(500).send('<h1>서버 오류가 발생했습니다</h1>');
  }
});

module.exports = router;