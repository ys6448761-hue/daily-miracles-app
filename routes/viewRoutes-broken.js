const express = require('express');
const path = require('path');
const { getStory } = require('../services/dataService');

const router = express.Router();

// 메인 페이지
router.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// 개별 스토리 페이지
router.get('/story/:id', (req, res) => {
  const storyId = req.params.id;
  const storyData = getStory(storyId);

  if (!storyData) {
    return res.status(404).send('<h1>스토리를 찾을 수 없습니다</h1>');
  }

  // 스토리 텍스트를 HTML로 변환
  let storyHtml = storyData.story
    .replace(/## 페이지 (\\d+): (.+)/g, '<h2 class="scene-title">페이지 $1: $2</h2>')
    .replace(/\\*\\*이미지:\\*\\* (.+)/g, '') // 이미지 설명은 제거 (실제 이미지로 표시)
    .replace(/\\*\\*스토리:\\*\\*/g, '<div class="story-content">')
    .replace(/---/g, '</div><hr>')
    .replace(/\\n\\n/g, '</p><p>')
    .replace(/\\n/g, '<br>');

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

        imagesHtml += \`
          <div class="image-container \${isBlankFrame ? 'blank-frame' : ''}">
            <img src="\${imageUrl}" alt="\${caption}" class="story-image">
            <p class="image-caption">\${caption}</p>
          </div>
        \`;
      }
    });
  }

  const html = \`
  <!DOCTYPE html>
  <html lang="ko">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>\${storyData.name}님의 기적 이야기</title>
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
              <h1 class="title">\${storyData.name}님의 기적 이야기</h1>
              <p class="subtitle">당신만을 위한 특별한 이야기</p>
          </div>

          <div class="audio-controls">
              <button id="playBtn" class="audio-btn">🎵 스토리 들어보기</button>
              <button id="pauseBtn" class="audio-btn" disabled>⏸️ 일시정지</button>
              <button id="stopBtn" class="audio-btn" disabled>⏹️ 정지</button>
              <div class="audio-status" id="audioStatus">음성으로 들으면 더욱 특별한 경험이 될 거예요! 🎧</div>
          </div>

          <div class="story-content">
              \${storyHtml}
          </div>

          \${imagesHtml}

          <div class="footer">
              <div class="creation-info">
                  <p><strong>생성 정보</strong></p>
                  <p>생성 날짜: \${storyData.createdAt.toLocaleDateString('ko-KR')}</p>
                  <p>스토리 ID: \${storyId}</p>
                  <p>이미지 수: \${storyData.images ? storyData.images.filter(img => img).length : 0}개 (스토리 10개 + 빈 프레임 1개)</p>
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
              let fullText = "\${storyData.name}님의 기적 이야기를 시작합니다. ";

              storyElements.forEach((element, index) => {
                  const pageNum = index + 1;
                  const text = element.innerText || element.textContent;
                  fullText += \\\`페이지 \\\${pageNum}. \\\${text} \\\`;
              });

              fullText += "\${storyData.name}님의 특별한 이야기를 마칩니다. 언제나 기적은 당신 곁에 있어요.";
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
                  audioStatus.textContent = "🎵 \${storyData.name}님의 이야기를 들려드리고 있어요...";
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
  \`;

  res.send(html);
});

module.exports = router;