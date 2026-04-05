/**
 * generate-og-image.js
 * DreamTown OG 썸네일 생성 — 1200×630 카카오 공유용
 * 실행: node scripts/generate-og-image.js
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const OUTPUT_PATH = path.join(__dirname, '..', 'public', 'images', 'dreamtown-og-v2.jpg');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }

  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

  body {
    width: 1200px;
    height: 630px;
    background: #0D1B2A;
    font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
    overflow: hidden;
    position: relative;
  }

  /* ── 배경 그라디언트 레이어 ── */
  .bg-gradient {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 60% 50% at 75% 50%, rgba(155,135,245,0.18) 0%, transparent 70%),
      radial-gradient(ellipse 40% 60% at 15% 80%, rgba(46,91,255,0.12) 0%, transparent 60%),
      linear-gradient(160deg, #0D1B2A 0%, #101E30 50%, #0D1B2A 100%);
  }

  /* ── 별 파티클 ── */
  .stars {
    position: absolute;
    inset: 0;
  }
  .star-dot {
    position: absolute;
    border-radius: 50%;
    background: white;
    animation: twinkle 3s infinite alternate;
  }
  @keyframes twinkle {
    from { opacity: 0.2; }
    to   { opacity: 0.8; }
  }

  /* ── 여수 바다 실루엣 ── */
  .ocean-line {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 180px;
    background: linear-gradient(180deg,
      transparent 0%,
      rgba(46,91,255,0.08) 40%,
      rgba(14,36,64,0.6) 100%
    );
  }

  /* ── 골든 글로우 (오른쪽 별 빛) ── */
  .glow-right {
    position: absolute;
    right: 120px;
    top: 50%;
    transform: translateY(-50%);
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle,
      rgba(255,215,106,0.22) 0%,
      rgba(155,135,245,0.10) 50%,
      transparent 70%
    );
  }

  /* ── 별 (황금) ── */
  .star-main {
    position: absolute;
    right: 176px;
    top: 50%;
    transform: translateY(-54%);
    width: 148px;
    height: 148px;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 38%,
      #FFF9D6 0%,
      #FFD76A 38%,
      #F5A042 70%,
      rgba(245,160,66,0) 100%
    );
    box-shadow:
      0 0 40px rgba(255,215,106,0.55),
      0 0 80px rgba(255,215,106,0.25),
      0 0 140px rgba(255,215,106,0.12);
  }

  /* ── 아우룸 (황금 거북 점) ── */
  .aurum-dot {
    position: absolute;
    right: 230px;
    top: calc(50% + 52px);
    transform: translateY(-50%);
    width: 28px;
    height: 22px;
    border-radius: 50%;
    background: #FFD76A;
    box-shadow: 0 0 12px rgba(255,215,106,0.8);
    opacity: 0.85;
  }

  /* ── 메인 텍스트 영역 ── */
  .content {
    position: absolute;
    left: 72px;
    top: 50%;
    transform: translateY(-50%);
    max-width: 640px;
  }

  .brand-tag {
    display: inline-block;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.18em;
    color: #9B87F5;
    text-transform: uppercase;
    margin-bottom: 20px;
    opacity: 0.9;
  }

  .main-title {
    font-size: 64px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.1;
    letter-spacing: -0.02em;
    margin-bottom: 18px;
  }

  .sub-title {
    font-size: 24px;
    font-weight: 500;
    color: rgba(255,255,255,0.72);
    line-height: 1.5;
    letter-spacing: -0.01em;
    margin-bottom: 32px;
  }

  .desc {
    font-size: 16px;
    font-weight: 400;
    color: rgba(255,255,255,0.38);
    letter-spacing: 0.02em;
  }

  /* ── 하단 로고/URL ── */
  .bottom-bar {
    position: absolute;
    bottom: 32px;
    left: 72px;
    right: 72px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo-text {
    font-size: 14px;
    font-weight: 700;
    color: rgba(255,255,255,0.30);
    letter-spacing: 0.08em;
  }

  .url-text {
    font-size: 13px;
    color: rgba(255,255,255,0.20);
    letter-spacing: 0.04em;
  }

  /* ── 상단 얇은 퍼플 라인 ── */
  .top-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #9B87F5 0%, #F5A7C6 50%, transparent 100%);
    opacity: 0.7;
  }
</style>
</head>
<body>

<div class="bg-gradient"></div>

<!-- 별 파티클 -->
<div class="stars">
  <div class="star-dot" style="width:2px;height:2px;top:8%;left:12%;animation-delay:0s"></div>
  <div class="star-dot" style="width:1px;height:1px;top:15%;left:28%;animation-delay:0.4s"></div>
  <div class="star-dot" style="width:2px;height:2px;top:22%;left:44%;animation-delay:0.8s"></div>
  <div class="star-dot" style="width:1px;height:1px;top:6%;left:58%;animation-delay:1.2s"></div>
  <div class="star-dot" style="width:3px;height:3px;top:18%;left:70%;animation-delay:0.2s;opacity:0.5"></div>
  <div class="star-dot" style="width:1px;height:1px;top:30%;left:85%;animation-delay:1.6s"></div>
  <div class="star-dot" style="width:2px;height:2px;top:12%;left:92%;animation-delay:0.6s"></div>
  <div class="star-dot" style="width:1px;height:1px;top:40%;left:8%;animation-delay:1.0s"></div>
  <div class="star-dot" style="width:2px;height:2px;top:55%;left:22%;animation-delay:1.4s"></div>
  <div class="star-dot" style="width:1px;height:1px;top:70%;left:35%;animation-delay:0.3s"></div>
  <div class="star-dot" style="width:2px;height:2px;top:80%;left:48%;animation-delay:1.8s;opacity:0.4"></div>
  <div class="star-dot" style="width:1px;height:1px;top:25%;left:75%;animation-delay:0.9s"></div>
  <div class="star-dot" style="width:2px;height:2px;top:8%;left:38%;animation-delay:0.5s"></div>
</div>

<div class="ocean-line"></div>
<div class="glow-right"></div>
<div class="star-main"></div>
<div class="aurum-dot"></div>
<div class="top-line"></div>

<div class="content">
  <div class="brand-tag">Daily Miracles</div>
  <div class="main-title">DreamTown</div>
  <div class="sub-title">여수 바다에서 시작된<br>당신의 별</div>
  <div class="desc">소원이 별이 되는 조용한 입구</div>
</div>

<div class="bottom-bar">
  <div class="logo-text">DREAMTOWN</div>
  <div class="url-text">app.dailymiracles.kr</div>
</div>

</body>
</html>`;

async function generate() {
  console.log('🎨 OG 이미지 생성 시작...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await page.setContent(HTML, { waitUntil: 'networkidle0', timeout: 15000 });

    // 폰트 로딩 대기
    await new Promise(r => setTimeout(r, 1500));

    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    fs.writeFileSync(OUTPUT_PATH, screenshotBuffer);
    console.log(`✅ 저장 완료: ${OUTPUT_PATH}`);
    console.log(`   파일 크기: ${(screenshotBuffer.length / 1024).toFixed(1)} KB`);

  } finally {
    await browser.close();
  }
}

generate().catch(err => {
  console.error('❌ 생성 실패:', err.message);
  process.exit(1);
});
