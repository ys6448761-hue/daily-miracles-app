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

// 5각형 별 SVG 폴리곤 포인트 계산
// cx=880, cy=315, outerR=115, innerR=48
function starPoints(cx, cy, outerR, innerR, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / points) * i - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
  }
  return pts.join(' ');
}

const STAR_PTS  = starPoints(880, 315, 115, 48);
const STAR_PTS2 = starPoints(880, 315, 130, 56); // 글로우용 (살짝 큰)

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

  .bg-gradient {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 55% 55% at 76% 50%, rgba(155,135,245,0.14) 0%, transparent 65%),
      radial-gradient(ellipse 35% 50% at 12% 80%, rgba(46,91,255,0.10) 0%, transparent 60%),
      linear-gradient(160deg, #0D1B2A 0%, #0F1F30 50%, #0D1B2A 100%);
  }

  /* 배경 별 파티클 */
  .star-dot {
    position: absolute;
    border-radius: 50%;
    background: white;
  }

  /* 상단 라인 */
  .top-line {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, #9B87F5 0%, #F5A7C6 55%, transparent 100%);
    opacity: 0.7;
  }

  /* 텍스트 영역 */
  .content {
    position: absolute;
    left: 72px;
    top: 50%;
    transform: translateY(-50%);
    max-width: 580px;
  }
  .brand-tag {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.20em;
    color: #9B87F5;
    text-transform: uppercase;
    margin-bottom: 22px;
    opacity: 0.9;
  }
  .main-title {
    font-size: 68px;
    font-weight: 800;
    color: #FFFFFF;
    line-height: 1.08;
    letter-spacing: -0.02em;
    margin-bottom: 20px;
  }
  .sub-title {
    font-size: 23px;
    font-weight: 500;
    color: rgba(255,255,255,0.70);
    line-height: 1.55;
    letter-spacing: -0.01em;
    margin-bottom: 28px;
  }
  .desc {
    font-size: 15px;
    color: rgba(255,255,255,0.36);
    letter-spacing: 0.03em;
  }

  /* 하단 바 */
  .bottom-bar {
    position: absolute;
    bottom: 30px;
    left: 72px; right: 72px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .logo-text {
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.28);
    letter-spacing: 0.10em;
  }
  .url-text {
    font-size: 12px;
    color: rgba(255,255,255,0.18);
    letter-spacing: 0.04em;
  }
</style>
</head>
<body>

<div class="bg-gradient"></div>
<div class="top-line"></div>

<!-- 배경 별 파티클 -->
<div class="star-dot" style="width:2px;height:2px;top:7%;left:11%;opacity:0.5"></div>
<div class="star-dot" style="width:1px;height:1px;top:14%;left:27%;opacity:0.4"></div>
<div class="star-dot" style="width:2px;height:2px;top:21%;left:43%;opacity:0.3"></div>
<div class="star-dot" style="width:1px;height:1px;top:5%;left:57%;opacity:0.45"></div>
<div class="star-dot" style="width:2px;height:2px;top:10%;left:69%;opacity:0.35"></div>
<div class="star-dot" style="width:1px;height:1px;top:30%;left:84%;opacity:0.4"></div>
<div class="star-dot" style="width:2px;height:2px;top:75%;left:18%;opacity:0.3"></div>
<div class="star-dot" style="width:1px;height:1px;top:82%;left:38%;opacity:0.4"></div>
<div class="star-dot" style="width:2px;height:2px;top:20%;left:91%;opacity:0.3"></div>
<div class="star-dot" style="width:1px;height:1px;top:60%;left:76%;opacity:0.35"></div>

<!-- SVG 별 -->
<svg
  style="position:absolute;top:0;left:0;width:1200px;height:630px;overflow:visible"
  viewBox="0 0 1200 630"
  xmlns="http://www.w3.org/2000/svg"
>
  <defs>
    <!-- 별 글로우 필터 -->
    <filter id="starGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="18" result="blur1"/>
      <feGaussianBlur stdDeviation="8"  result="blur2"/>
      <feMerge>
        <feMergeNode in="blur1"/>
        <feMergeNode in="blur2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 별 그라디언트 -->
    <radialGradient id="starFill" cx="38%" cy="30%" r="65%">
      <stop offset="0%"   stop-color="#FFFBEA"/>
      <stop offset="35%"  stop-color="#FFD76A"/>
      <stop offset="75%"  stop-color="#F5A742"/>
      <stop offset="100%" stop-color="#E8891A"/>
    </radialGradient>

    <!-- 글로우 레이어 그라디언트 -->
    <radialGradient id="glowFill" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="#FFD76A" stop-opacity="0.30"/>
      <stop offset="50%"  stop-color="#9B87F5" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="#FFD76A" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- 외곽 글로우 원 -->
  <circle cx="880" cy="315" r="175" fill="url(#glowFill)"/>

  <!-- 별 그림자/후광 (흐릿한 큰 별) -->
  <polygon
    points="${STAR_PTS2}"
    fill="#FFD76A"
    opacity="0.18"
    filter="url(#starGlow)"
  />

  <!-- 메인 별 -->
  <polygon
    points="${STAR_PTS}"
    fill="url(#starFill)"
    filter="url(#starGlow)"
  />
</svg>

<!-- 텍스트 -->
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
    await new Promise(r => setTimeout(r, 1500));

    const buf = await page.screenshot({
      type: 'jpeg',
      quality: 92,
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    });

    fs.writeFileSync(OUTPUT_PATH, buf);
    console.log(`✅ 저장 완료: ${OUTPUT_PATH}`);
    console.log(`   파일 크기: ${(buf.length / 1024).toFixed(1)} KB`);

  } finally {
    await browser.close();
  }
}

generate().catch(err => {
  console.error('❌ 생성 실패:', err.message);
  process.exit(1);
});
