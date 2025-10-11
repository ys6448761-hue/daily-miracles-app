// server.js - 스토리북 생성 웹 서버
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// OpenAI 설정
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// 파일 업로드 설정
const storage = multer.diskStorage({
  destination: 'uploads/photos/',
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('jpg, png 파일만 업로드 가능합니다.'));
    }
  }
});

// 메모리 기반 데이터베이스
let storybooks = [];

// 스토리 생성 프롬프트
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

지브리 애니메이션의 따뜻하고 환상적인 분위기로, 한국의 사계절을 배경으로 하는 5개 장면의 이야기를 만들어주세요.

각 장면은 다음 형식으로 작성해주세요:
## 장면 N: [제목]
**이미지 설명:** [지브리 스타일의 구체적인 장면 묘사]
**스토리:** [2-3문단의 따뜻한 이야기]

마지막에는 아이에게 주는 따뜻한 메시지를 포함해주세요.`;
}

// 스토리 생성 함수
async function generateStory(formData) {
  try {
    const prompt = createStoryPrompt(formData);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "당신은 한국의 정서와 지브리 애니메이션의 감성을 결합한 전문 아동 스토리북 작가입니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.8,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    return {
      story: completion.choices[0].message.content,
      usage: completion.usage
    };

  } catch (error) {
    throw new Error(`스토리 생성 실패: ${error.message}`);
  }
}

// 스토리북 신청 API
app.post('/api/storybook', upload.single('photo'), async (req, res) => {
  try {
    console.log('새로운 스토리북 신청:', req.body);

    const formData = req.body;
    const storybookId = uuidv4();

    // 스토리북 기본 정보 저장
    const storybookData = {
      id: storybookId,
      ...formData,
      photo: req.file ? `/uploads/photos/${req.file.filename}` : null,
      status: 'generating',
      createdAt: new Date().toISOString(),
      story: null
    };

    storybooks.push(storybookData);

    // 클라이언트에 즉시 응답
    res.json({
      success: true,
      message: '스토리북 신청이 접수되었습니다!',
      storybookId: storybookId,
      pageUrl: `/stories/${storybookId}`
    });

    // 백그라운드에서 스토리 생성
    try {
      console.log('AI 스토리 생성 시작...');
      const result = await generateStory(formData);
      
      const storybook = storybooks.find(s => s.id === storybookId);
      if (storybook) {
        storybook.story = result.story;
        storybook.status = 'completed';
        storybook.completedAt = new Date().toISOString();
        
        console.log(`${formData.name}님의 스토리북 완성!`);
      }

    } catch (error) {
      console.error('스토리 생성 실패:', error);
      
      const storybook = storybooks.find(s => s.id === storybookId);
      if (storybook) {
        storybook.status = 'failed';
        storybook.error = error.message;
      }
    }

  } catch (error) {
    console.error('API 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 스토리북 상태 확인
app.get('/api/storybook/:id/status', (req, res) => {
  const storybook = storybooks.find(s => s.id === req.params.id);
  
  if (!storybook) {
    return res.status(404).json({
      success: false,
      error: '스토리북을 찾을 수 없습니다.'
    });
  }

  res.json({
    success: true,
    status: storybook.status,
    progress: storybook.status === 'generating' ? 
      'AI가 특별한 이야기를 만들고 있어요...' : 
      storybook.status === 'completed' ? 
      '스토리북이 완성되었어요!' :
      '생성 중 오류가 발생했습니다.'
  });
});

// 개인 스토리 페이지
app.get('/stories/:id', (req, res) => {
  const storybook = storybooks.find(s => s.id === req.params.id);
  
  if (!storybook) {
    return res.status(404).send(`
      <html>
        <head><title>스토리를 찾을 수 없습니다</title><meta charset="utf-8"></head>
        <body style="text-align: center; font-family: Arial, sans-serif; padding: 50px;">
          <h1>스토리를 찾을 수 없어요</h1>
          <p>요청하신 스토리북이 존재하지 않습니다.</p>
          <a href="/">홈으로 돌아가기</a>
        </body>
      </html>
    `);
  }

  // 생성 중인 경우
  if (storybook.status === 'generating') {
    return res.send(`
      <html>
        <head>
          <title>${storybook.name}님의 스토리북</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; }
            .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="spinner"></div>
          <h2>${storybook.name}님만을 위한 특별한 이야기를 만들고 있어요...</h2>
          <p>잠시만 기다려주세요!</p>
          <script>setTimeout(() => location.reload(), 10000);</script>
        </body>
      </html>
    `);
  }

  // 완성된 스토리
  if (storybook.status === 'completed') {
    return res.send(`
      <html>
        <head>
          <title>${storybook.name}님의 스토리북</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: 'Noto Sans KR', sans-serif; line-height: 1.6; margin: 0; padding: 20px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
            .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            h1 { color: #4a90e2; text-align: center; font-size: 2.5em; margin-bottom: 30px; }
            .story-content { font-size: 1.1em; color: #333; }
            .story-content h2 { color: #e74c3c; margin-top: 40px; }
            .photo { text-align: center; margin: 20px 0; }
            .photo img { max-width: 200px; border-radius: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${storybook.name}님의 특별한 이야기</h1>
            ${storybook.photo ? `<div class="photo"><img src="${storybook.photo}" alt="${storybook.name}"></div>` : ''}
            <div class="story-content">
              ${storybook.story.replace(/\n/g, '<br>')}
            </div>
            <hr style="margin: 40px 0;">
            <p style="text-align: center; color: #888;">
              ${new Date(storybook.completedAt).toLocaleDateString('ko-KR')}에 만들어진 ${storybook.name}님만의 특별한 이야기
            </p>
          </div>
        </body>
      </html>
    `);
  }

  // 실패한 경우
  return res.send(`
    <html>
      <head><title>스토리 생성 실패</title><meta charset="utf-8"></head>
      <body style="text-align: center; font-family: Arial, sans-serif; padding: 50px;">
        <h1>스토리 생성에 실패했어요</h1>
        <p>죄송합니다. 기술적인 문제가 발생했습니다.</p>
        <a href="/">다시 시도하기</a>
      </body>
    </html>
  `);
});

// 관리자 API
app.get('/api/admin/storybooks', (req, res) => {
  res.json({
    success: true,
    storybooks: storybooks.map(sb => ({
      ...sb,
      story: sb.story ? `${sb.story.substring(0, 100)}...` : null
    })),
    stats: {
      total: storybooks.length,
      completed: storybooks.filter(sb => sb.status === 'completed').length,
      generating: storybooks.filter(sb => sb.status === 'generating').length,
      failed: storybooks.filter(sb => sb.status === 'failed').length
    }
  });
});

app.listen(PORT, () => {
  console.log(`
🌟 하루하루의 기적 - 스토리북 서비스 시작
=====================================
🌐 서버 주소: http://localhost:${PORT}
📱 관리자: http://localhost:${PORT}/admin
🔑 OpenAI API: 연결됨
=====================================
준비 완료! 브라우저에서 접속해보세요.
  `);
});