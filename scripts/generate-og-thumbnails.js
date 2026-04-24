/**
 * generate-og-thumbnails.js
 * 별 공유 OG 썸네일 3종 생성 (용기 / 쉼 / 정리)
 * 출력: public/og/star-courage.png, star-rest.png, star-clarity.png
 *
 * 실행: node scripts/generate-og-thumbnails.js
 */

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');

const OUT_DIR = path.join(__dirname, '..', 'public', 'og');
fs.mkdirSync(OUT_DIR, { recursive: true });

const W = 800;
const H = 400;

// ── 썸네일 3종 정의 ─────────────────────────────────────────────────────
const THUMBNAILS = [
  {
    file: 'star-courage.png',
    bg1:  '#0B0B2A',
    bg2:  '#1A1060',
    accent: '#9B87F5',
    glow:   'rgba(155,135,245,0.35)',
    text:   '용기를 낸 이 마음이, 별이 됩니다',
    emoji:  '✦',
  },
  {
    file: 'star-rest.png',
    bg1:  '#071520',
    bg2:  '#0D2B3E',
    accent: '#5BC8C0',
    glow:   'rgba(91,200,192,0.3)',
    text:   '잠깐 멈춘 이 순간이, 별이 됩니다',
    emoji:  '◌',
  },
  {
    file: 'star-clarity.png',
    bg1:  '#0F0B20',
    bg2:  '#1E1040',
    accent: '#FFD76A',
    glow:   'rgba(255,215,106,0.3)',
    text:   '정리된 마음 하나가, 별이 됩니다',
    emoji:  '◈',
  },
];

// ── SVG 템플릿 ──────────────────────────────────────────────────────────
function makeSvg({ bg1, bg2, accent, glow, text, emoji }) {
  // 텍스트 길이에 따라 fontSize 조정
  const fontSize = text.length > 18 ? 28 : 32;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <!-- 중앙 글로우 -->
    <radialGradient id="glow" cx="50%" cy="48%" r="45%">
      <stop offset="0%"   stop-color="${glow}" stop-opacity="1"/>
      <stop offset="100%" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <!-- 별 빛 -->
    <filter id="blur">
      <feGaussianBlur stdDeviation="12"/>
    </filter>
  </defs>

  <!-- 배경 -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 별자리 느낌 점들 -->
  ${makeDots(accent)}

  <!-- 중앙 글로우 -->
  <ellipse cx="${W/2}" cy="${H*0.45}" rx="220" ry="130" fill="url(#glow)"/>

  <!-- 중앙 별 심볼 -->
  <text
    x="${W/2}" y="${H*0.42}"
    text-anchor="middle"
    font-size="52"
    fill="${accent}"
    opacity="0.85"
    font-family="serif"
    filter="url(#blur)"
  >${emoji}</text>
  <text
    x="${W/2}" y="${H*0.42}"
    text-anchor="middle"
    font-size="52"
    fill="${accent}"
    opacity="0.95"
    font-family="serif"
  >${emoji}</text>

  <!-- 메인 텍스트 -->
  <text
    x="${W/2}" y="${H*0.62}"
    text-anchor="middle"
    font-size="${fontSize}"
    font-weight="700"
    fill="#FFFFFF"
    opacity="0.92"
    font-family="'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif"
    letter-spacing="1"
  >${text}</text>

  <!-- 하단 브랜드 -->
  <text
    x="${W/2}" y="${H*0.85}"
    text-anchor="middle"
    font-size="13"
    fill="${accent}"
    opacity="0.5"
    font-family="sans-serif"
    letter-spacing="3"
  >DreamTown · 하루하루의 기적</text>

  <!-- 상단 좌측 작은 별들 -->
  <circle cx="60"  cy="60"  r="1.5" fill="${accent}" opacity="0.6"/>
  <circle cx="120" cy="40"  r="1"   fill="${accent}" opacity="0.4"/>
  <circle cx="85"  cy="90"  r="1"   fill="${accent}" opacity="0.3"/>
  <!-- 우측 별들 -->
  <circle cx="${W-60}"  cy="55"  r="1.5" fill="${accent}" opacity="0.5"/>
  <circle cx="${W-110}" cy="75"  r="1"   fill="${accent}" opacity="0.4"/>
  <circle cx="${W-80}"  cy="100" r="1"   fill="${accent}" opacity="0.3"/>
</svg>`;
}

// 배경 랜덤 점들
function makeDots(accent) {
  const positions = [
    [45, 200, 1], [170, 320, 1.2], [300, 80, 0.8],
    [500, 60, 1], [650, 310, 0.9], [730, 150, 1.1],
    [400, 350, 0.7], [220, 160, 0.6], [560, 200, 0.8],
  ];
  return positions.map(([x, y, r]) =>
    `<circle cx="${x}" cy="${y}" r="${r}" fill="${accent}" opacity="0.25"/>`
  ).join('\n  ');
}

// ── 생성 실행 ────────────────────────────────────────────────────────────
(async () => {
  for (const t of THUMBNAILS) {
    const svg    = makeSvg(t);
    const outPath = path.join(OUT_DIR, t.file);

    await sharp(Buffer.from(svg))
      .png({ quality: 95 })
      .toFile(outPath);

    console.log(`✅ ${t.file} 생성 완료 (${W}×${H})`);
  }
  console.log('\n📁 출력 경로:', OUT_DIR);
  console.log('🔗 URL 예시: https://app.dailymiracles.kr/og/star-courage.png');
})();
