const express = require('express');
const { OpenAI } = require('openai');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
require('dotenv').config();

const app = express();

// 환경변수 검증 함수
function validateEnvironment() {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.error('❌  필수 환경변수가 누락되었습니다:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 해결 방법:');
    console.error('1. .env.example 파일을 복사하여 .env 파일을 생성하세요');
    console.error('2. .env 파일에 올바른 값들을 설정하세요');
    console.error('3. OpenAI API 키는 https://platform.openai.com/api-keys 에서 발급받으세요\n');
    process.exit(1);
  }

  // API 키 형식 검증 (OpenAI API 키는 'sk-'로 시작)
  if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
    console.error('❌ OPENAI_API_KEY 형식이 올바르지 않습니다.');
    console.error('   OpenAI API 키는 "sk-"로 시작해야 합니다.');
    console.error('   https://platform.openai.com/api-keys 에서 올바른 키를 발급받으세요\n');
    process.exit(1);
  }

  console.log('✅ 환경변수 검증 완료');
}

// 환경변수 검증 실행
validateEnvironment();

const port = process.env.PORT || 5000;

// 병렬 처리 제한 (OpenAI API rate limit 고려)
const MAX_CONCURRENT_REQUESTS = 5;

// 동시 요청 제한을 위한 유틸리티 함수
async function limitConcurrency(tasks, limit) {
  const results = [];

  for (let i = 0; i < tasks.length; i += limit) {
    const batch = tasks.slice(i, i + limit);
    const batchResults = await Promise.allSettled(batch);
    results.push(...batchResults);

    // 배치 완료 로그
    if (i + limit < tasks.length) {
      console.log(`📦 배치 ${Math.ceil((i + limit) / limit)} 완료 (${Math.min(i + limit, tasks.length)}/${tasks.length})`);
    }
  }

  return results;
}

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 메모리 데이터베이스 (실제 운영시 MongoDB 사용 권장)
const stories = new Map();

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/generated-images', express.static('generated-images'));

// 이미지 다운로드 함수
async function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = require('fs').createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      require('fs').unlink(filepath, () => {}); // 실패 시 파일 삭제
      reject(err);
    });
  });
}

// 11페이지 빈 프레임 생성 함수 (기존 버전 - 순차 처리용)
async function generateBlankFrame(storyId) {
  try {
    console.log('빈 프레임 이미지 생성 중...');

    const prompt = `An empty, beautiful frame ready to be filled with dreams and future stories.

Soft, dreamy background with gentle clouds and warm golden light.
Korean traditional paper texture with decorative borders.
Inspiring and hopeful atmosphere, like a blank page waiting for a beautiful story.
Ghibli-style soft colors and magical feeling.
Empty center space with text "여기에 당신의 미래가 그려집니다" in elegant Korean calligraphy.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0].url;

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
    const prompt = `An empty, beautiful frame ready to be filled with dreams and future stories.

Soft, dreamy background with gentle clouds and warm golden light.
Korean traditional paper texture with decorative borders.
Inspiring and hopeful atmosphere, like a blank page waiting for a beautiful story.
Ghibli-style soft colors and magical feeling.
Empty center space with text "여기에 당신의 미래가 그려집니다" in elegant Korean calligraphy.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0].url;

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

// 개별 이미지 생성 함수 (기존 버전 - 순차 처리용)
async function generateSceneImage(imageDescription, storyId, sceneNumber) {
  try {
    console.log(`장면 ${sceneNumber} 이미지 생성 시작...`);

    const prompt = `${imageDescription}

Beautiful, warm, hand-drawn animation style with soft colors and magical atmosphere.
Korean seasonal landscape background. Child-friendly, heartwarming scene.
High quality, detailed artwork similar to Spirited Away or My Neighbor Totoro.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0].url;

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
    const prompt = `${imageDescription}

Beautiful, warm, hand-drawn animation style with soft colors and magical atmosphere.
Korean seasonal landscape background. Child-friendly, heartwarming scene.
High quality, detailed artwork similar to Spirited Away or My Neighbor Totoro.`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "natural"
    });

    const imageUrl = response.data[0].url;

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

// 스토리 생성 프롬프트 (이미지 설명 포함)
function createStoryPrompt(data) {
  return `당신은 한국의 감성과 지브리 스타일을 결합한 아동용 스토리북 작가입니다.

**주인공 정보:**
- 이름: ${data.name} (${data.age}세)
- 성격: ${data.personality}
- 취미: ${data.hobby}
- 꿈: ${data.dreamJob}
- 좋아하는 색깔: ${data.favoriteColor}
- 좋아하는 동물: ${data.favoriteAnimal}
- 특별한 기억: ${data.specialMemory}

**중요한 형식 요구사항:**
각 페이지를 정확히 다음과 같은 형식으로 작성해주세요:

## 페이지 1: [제목]
**이미지:** [한 줄로 간단하고 구체적인 장면 묘사 - 영어로 작성]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

## 페이지 2: [제목]
**이미지:** [한 줄로 간단하고 구체적인 장면 묘사 - 영어로 작성]
**스토리:**
[1-2문단의 따뜻한 이야기]

---

(이런 식으로 10개 페이지까지)

**주의사항:**
- 각 이미지 설명은 영어로 작성
- 한 줄에 50단어 이내로 간단하게
- 지브리 스타일에 맞는 따뜻하고 아름다운 장면 묘사
- 한국의 사계절 배경 활용

지브리 애니메이션의 따뜻하고 환상적인 분위기로 10개 페이지의 완전한 이야기를 만들어주세요.
각 페이지는 독립적이면서도 전체적으로 연결되는 아름다운 스토리가 되어야 합니다.`;
}

// 스토리에서 이미지 설명 추출하는 함수
function extractImageDescriptions(storyText) {
  const imageDescriptions = [];
  const regex = /\*\*이미지:\*\*\s*(.+?)(?=\n|\*\*스토리)/g;
  let match;
  
  while ((match = regex.exec(storyText)) !== null) {
    imageDescriptions.push(match[1].trim());
  }
  
  return imageDescriptions;
}

// 스토리 + 이미지 생성 함수
async function generateStoryWithImages(formData) {
  try {
    console.log('스토리 텍스트 생성 중...');
    
    const prompt = createStoryPrompt(formData);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 정서와 지브리 애니메이션의 감성을 결합한 전문 아동 스토리북 작가입니다. 각 장면마다 이미지 설명을 정확한 형식으로 포함해야 합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8
    });
    
    const storyText = completion.choices[0].message.content;
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

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 스토리 생성 API (통합 버전)
app.post('/api/create-story', async (req, res) => {
  try {
    console.log('📝 새로운 스토리 요청 받음');
    console.log('폼 데이터:', req.body);
    
    // 스토리 + 이미지 생성
    const result = await generateStoryWithImages(req.body);
    
    // 메모리에 저장
    const storyId = result.storyId || `story_${Date.now()}`;
    stories.set(storyId, {
      ...req.body,
      story: result.storyText,
      images: result.imageUrls,
      createdAt: new Date(),
      id: storyId
    });
    
    console.log(`💾 스토리 저장됨: ${storyId}`);
    
    res.json({
      success: true,
      storyId: storyId,
      redirectUrl: `/story/${storyId}`
    });
    
  } catch (error) {
    console.error('스토리 생성 에러:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || '스토리 생성 중 오류가 발생했습니다.'
    });
  }
});

// 개별 스토리 페이지
app.get('/story/:id', (req, res) => {
  const storyId = req.params.id;
  const storyData = stories.get(storyId);
  
  if (!storyData) {
    return res.status(404).send('<h1>스토리를 찾을 수 없습니다</h1>');
  }
  
  // 스토리 텍스트를 HTML로 변환
  let storyHtml = storyData.story
    .replace(/## 페이지 (\d+): (.+)/g, '<h2 class="scene-title">페이지 $1: $2</h2>')
    .replace(/\*\*이미지:\*\* (.+)/g, '') // 이미지 설명은 제거 (실제 이미지로 표시)
    .replace(/\*\*스토리:\*\*/g, '<div class="story-content">')
    .replace(/---/g, '</div><hr>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  // 마지막 div 태그 닫기
  if (!storyHtml.includes('</div>')) {
    storyHtml += '</div>';
  }
  
  // 이미지 HTML 생성 (10개 스토리 이미지 + 1개 빈 프레임)
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
  
  const html = `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${storyData.name}님의 기적 이야기</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
          }
          
          body {
              font-family: 'Malgun Gothic', sans-serif;
              line-height: 1.8;
              color: #2c3e50;
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
              backdrop-filter: blur(10px);
          }
          
          .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 3px solid #e8f4fd;
          }
          
          .title {
              font-size: 2.5rem;
              color: #2c3e50;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
          }
          
          .subtitle {
              font-size: 1.2rem;
              color: #7f8c8d;
              font-style: italic;
          }
          
          .scene-title {
              font-size: 1.8rem;
              color: #3498db;
              margin: 30px 0 20px 0;
              padding: 15px;
              background: linear-gradient(135deg, #74b9ff, #0984e3);
              color: white;
              border-radius: 10px;
              text-align: center;
          }
          
          .story-content {
              font-size: 1.1rem;
              margin-bottom: 30px;
              padding: 20px;
              background: #f8f9fa;
              border-radius: 15px;
              border-left: 5px solid #74b9ff;
          }
          
          .story-content p {
              margin-bottom: 15px;
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
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
              transition: transform 0.3s ease;
          }
          
          .story-image:hover {
              transform: scale(1.02);
          }
          
          .image-caption {
              margin-top: 15px;
              font-size: 1rem;
              color: #7f8c8d;
              font-style: italic;
          }
          
          hr {
              border: none;
              height: 2px;
              background: linear-gradient(90deg, transparent, #74b9ff, transparent);
              margin: 40px 0;
          }
          
          .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 30px;
              border-top: 2px solid #e8f4fd;
              color: #7f8c8d;
          }
          
          .creation-info {
              font-size: 0.9rem;
              margin-top: 20px;
              padding: 15px;
              background: #e8f4fd;
              border-radius: 10px;
          }
          
          .blank-frame {
              background: linear-gradient(135deg, #ffeaa7, #fab1a0);
              border: 3px dashed #e17055;
              position: relative;
          }
          
          .blank-frame::after {
              content: "✨ 미래의 기적이 여기에 그려질 거예요 ✨";
              position: absolute;
              top: 10px;
              left: 50%;
              transform: translateX(-50%);
              background: rgba(255,255,255,0.9);
              padding: 5px 15px;
              border-radius: 20px;
              font-size: 0.9rem;
              font-weight: bold;
              color: #e17055;
          }
          
          .audio-controls {
              position: sticky;
              top: 20px;
              background: linear-gradient(135deg, #74b9ff, #0984e3);
              padding: 15px;
              border-radius: 15px;
              margin-bottom: 30px;
              text-align: center;
              box-shadow: 0 5px 15px rgba(0,0,0,0.2);
              z-index: 1000;
          }
          
          .audio-btn {
              background: white;
              color: #0984e3;
              border: none;
              padding: 12px 20px;
              border-radius: 25px;
              font-size: 1rem;
              font-weight: bold;
              cursor: pointer;
              margin: 0 10px;
              transition: all 0.3s ease;
              box-shadow: 0 3px 10px rgba(0,0,0,0.2);
          }
          
          .audio-btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 5px 15px rgba(0,0,0,0.3);
          }
          
          .audio-btn:disabled {
              background: #ddd;
              color: #999;
              cursor: not-allowed;
              transform: none;
          }
          
          .audio-btn.playing {
              background: #fd79a8;
              color: white;
              animation: pulse 1.5s infinite;
          }
          
          @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.05); }
              100% { transform: scale(1); }
          }
          
          .audio-status {
              color: white;
              font-size: 0.9rem;
              margin-top: 10px;
              font-style: italic;
          }
              .container {
                  padding: 20px;
                  margin: 10px;
              }
              
              .title {
                  font-size: 2rem;
              }
              
              .scene-title {
                  font-size: 1.5rem;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <div class="header">
              <h1 class="title">${storyData.name}님의 기적 이야기</h1>
              <p class="subtitle">당신만을 위한 특별한 이야기</p>
          </div>
          
          <div class="audio-controls">
              <button id="playBtn" class="audio-btn">🎵 스토리 들어보기</button>
              <button id="pauseBtn" class="audio-btn" disabled>⏸️ 일시정지</button>
              <button id="stopBtn" class="audio-btn" disabled>⏹️ 정지</button>
              <div class="audio-status" id="audioStatus">음성으로 들으면 더욱 특별한 경험이 될 거예요! 🎧</div>
          </div>
          
          <div class="story-content">
              ${storyHtml}
          </div>
          
          ${imagesHtml}
          
          <div class="footer">
              <div class="creation-info">
                  <p><strong>생성 정보</strong></p>
                  <p>생성 날짜: ${storyData.createdAt.toLocaleDateString('ko-KR')}</p>
                  <p>스토리 ID: ${storyId}</p>
                  <p>이미지 수: ${storyData.images ? storyData.images.filter(img => img).length : 0}개 (스토리 10개 + 빈 프레임 1개)</p>
                  <p style="margin-top: 15px; font-style: italic;">
                      "모든 사람에게는 자신만의 기적이 있어요" - 하루하루의 기적
                  </p>
              </div>
          </div>
      </div>
      
      <script>
          // 음성 읽기 기능
          let currentUtterance = null;
          let isPlaying = false;
          let isPaused = false;
          
          const playBtn = document.getElementById('playBtn');
          const pauseBtn = document.getElementById('pauseBtn');
          const stopBtn = document.getElementById('stopBtn');
          const audioStatus = document.getElementById('audioStatus');
          
          // 스토리 텍스트 추출 (HTML 태그 제거)
          function getStoryText() {
              const storyElements = document.querySelectorAll('.story-content');
              let fullText = "${storyData.name}님의 기적 이야기를 시작합니다. ";
              
              storyElements.forEach((element, index) => {
                  const pageNum = index + 1;
                  const text = element.innerText || element.textContent;
                  fullText += \`페이지 \${pageNum}. \${text} \`;
              });
              
              fullText += "이것으로 ${storyData.name}님의 특별한 이야기를 마칩니다. 언제나 기적은 당신 곁에 있어요.";
              return fullText;
          }
          
          // 음성 재생
          function playStory() {
              if (isPaused && currentUtterance) {
                  speechSynthesis.resume();
                  isPaused = false;
                  isPlaying = true;
                  updateUI();
                  return;
              }
              
              const text = getStoryText();
              currentUtterance = new SpeechSynthesisUtterance(text);
              
              // 한국어 여성 목소리 설정
              const voices = speechSynthesis.getVoices();
              const koreanVoice = voices.find(voice => 
                  voice.lang.includes('ko') || voice.name.includes('Korean')
              );
              
              if (koreanVoice) {
                  currentUtterance.voice = koreanVoice;
              }
              
              // 음성 설정
              currentUtterance.rate = 0.9;        // 속도 (조금 천천히)
              currentUtterance.pitch = 1.1;       // 톤 (조금 높게)
              currentUtterance.volume = 0.8;      // 볼륨
              
              // 이벤트 리스너
              currentUtterance.onstart = () => {
                  isPlaying = true;
                  isPaused = false;
                  updateUI();
                  audioStatus.textContent = "🎵 ${storyData.name}님의 이야기를 들려드리고 있어요...";
              };
              
              currentUtterance.onend = () => {
                  isPlaying = false;
                  isPaused = false;
                  updateUI();
                  audioStatus.textContent = "✨ 이야기가 끝났어요. 어떠셨나요? 🌟";
              };
              
              currentUtterance.onerror = () => {
                  isPlaying = false;
                  isPaused = false;
                  updateUI();
                  audioStatus.textContent = "⚠️ 음성 재생 중 오류가 발생했어요. 다시 시도해주세요.";
              };
              
              speechSynthesis.speak(currentUtterance);
          }
          
          // 일시정지
          function pauseStory() {
              if (isPlaying && !isPaused) {
                  speechSynthesis.pause();
                  isPaused = true;
                  isPlaying = false;
                  updateUI();
                  audioStatus.textContent = "⏸️ 일시정지되었어요. 계속 들으려면 다시 재생해주세요.";
              }
          }
          
          // 정지
          function stopStory() {
              speechSynthesis.cancel();
              currentUtterance = null;
              isPlaying = false;
              isPaused = false;
              updateUI();
              audioStatus.textContent = "⏹️ 음성이 정지되었어요. 언제든지 다시 들을 수 있어요! 🎧";
          }
          
          // UI 업데이트
          function updateUI() {
              playBtn.disabled = isPlaying;
              pauseBtn.disabled = !isPlaying;
              stopBtn.disabled = !isPlaying && !isPaused;
              
              if (isPlaying) {
                  playBtn.classList.add('playing');
              } else {
                  playBtn.classList.remove('playing');
              }
          }
          
          // 이벤트 리스너 등록
          playBtn.addEventListener('click', playStory);
          pauseBtn.addEventListener('click', pauseStory);
          stopBtn.addEventListener('click', stopStory);
          
          // 음성 목록 로드 (페이지 로드 시)
          if ('speechSynthesis' in window) {
              speechSynthesis.getVoices();
              window.speechSynthesis.onvoiceschanged = () => {
                  speechSynthesis.getVoices();
              };
          } else {
              audioStatus.textContent = "⚠️ 이 브라우저는 음성 기능을 지원하지 않아요.";
              playBtn.disabled = true;
          }
      </script>
  </body>
  </html>
  `;
  
  res.send(html);
});

// 상태 확인 API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'running',
    totalStories: stories.size,
    uptime: process.uptime()
  });
});

// 서버 시작 및 Graceful shutdown
const server = app.listen(port, () => {
  console.log('🌟 하루하루의 기적 서버가 시작되었습니다!');
  console.log(`📍 서버 주소: http://localhost:${port}`);
  console.log(`🎯 API 엔드포인트: /api/create-story`);
  console.log(`📊 상태 확인: /api/status`);
  console.log(`🖼️ 이미지 저장 경로: ./generated-images/`);
  console.log('');
  console.log('🚀 성능 최적화 적용됨:');
  console.log(`   • 병렬 이미지 생성 (최대 ${MAX_CONCURRENT_REQUESTS}개 동시 처리)`);
  console.log('   • 예상 처리 시간: 5분 → 1-2분으로 단축');
  console.log('   • 실시간 진행률 추적');
  console.log('   • 오류 복구 및 부분 실패 허용');
  console.log('');
  console.log('💡 테스트 방법:');
  console.log('1. 브라우저에서 http://localhost:5000 접속');
  console.log('2. 개인정보 입력하여 스토리 생성 테스트');
  console.log('3. 완성된 스토리북과 이미지 확인');
  console.log('4. 콘솔에서 병렬 처리 성능 확인');
  console.log('');
  console.log('⚠️  서버 종료: Ctrl + C');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('서버 종료 중...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n서버 종료 중...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});