/**
 * ═══════════════════════════════════════════════════════════════════════════
 * 브랜드 에센스 PDF 생성 스크립트
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 실행: node scripts/generate-brand-essence-pdf.js
 * 출력: output/brand-essence.pdf
 */

const puppeteer = require('puppeteer-core');
const fs = require('fs').promises;
const path = require('path');

// Chrome 실행 경로 찾기
function findChromePath() {
  const possiblePaths = [
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
    // Edge (Windows)
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  ];

  const fs_sync = require('fs');
  for (const p of possiblePaths) {
    if (fs_sync.existsSync(p)) {
      return p;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// 브랜드 에센스 HTML 템플릿
// ═══════════════════════════════════════════════════════════════════════════

const BRAND_ESSENCE_HTML = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>하루하루의 기적 - 브랜드 에센스</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 100%);
      min-height: 100vh;
      color: #333;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 15mm 20mm;
      background: linear-gradient(135deg, #FFF5F7 0%, #FFFFFF 50%, #FFF5F7 100%);
    }

    /* 헤더 */
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 3px solid;
      border-image: linear-gradient(90deg, #9B87F5, #F5A7C6) 1;
    }

    .brand-name {
      font-size: 28pt;
      font-weight: 700;
      background: linear-gradient(135deg, #9B87F5, #F5A7C6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 5px;
    }

    .brand-name-en {
      font-size: 12pt;
      color: #6E59A5;
      font-weight: 400;
      letter-spacing: 2px;
    }

    .doc-title {
      margin-top: 10px;
      font-size: 14pt;
      font-weight: 600;
      color: #9B87F5;
    }

    /* 한 줄 정의 */
    .tagline-box {
      background: linear-gradient(135deg, #9B87F5, #F5A7C6);
      border-radius: 12px;
      padding: 15px 20px;
      text-align: center;
      margin-bottom: 20px;
      box-shadow: 0 4px 20px rgba(155, 135, 245, 0.3);
    }

    .tagline {
      font-size: 16pt;
      font-weight: 600;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* 섹션 공통 */
    .section {
      margin-bottom: 18px;
    }

    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #6E59A5;
      margin-bottom: 10px;
      padding-left: 10px;
      border-left: 4px solid #9B87F5;
    }

    /* 3대 메시지 카드 */
    .message-cards {
      display: flex;
      gap: 12px;
    }

    .message-card {
      flex: 1;
      background: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 12px rgba(155, 135, 245, 0.1);
      border: 1px solid #E5E5E5;
    }

    .message-card:nth-child(1) { border-top: 4px solid #9B87F5; }
    .message-card:nth-child(2) { border-top: 4px solid #F5A7C6; }
    .message-card:nth-child(3) { border-top: 4px solid #6E59A5; }

    .message-number {
      font-size: 24pt;
      font-weight: 700;
      color: #9B87F5;
      opacity: 0.3;
      margin-bottom: 5px;
    }

    .message-title {
      font-size: 11pt;
      font-weight: 600;
      color: #333;
      margin-bottom: 10px;
      line-height: 1.4;
    }

    .message-table {
      width: 100%;
      font-size: 8pt;
    }

    .message-table td {
      padding: 3px 0;
      vertical-align: top;
    }

    .do-col {
      color: #16a34a;
      width: 48%;
    }

    .dont-col {
      color: #dc2626;
      width: 48%;
      opacity: 0.7;
      text-decoration: line-through;
    }

    .message-keyword {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #E5E5E5;
      font-size: 8pt;
      color: #9B87F5;
    }

    /* 팀 섹션 */
    .team-box {
      background: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 2px 12px rgba(155, 135, 245, 0.1);
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
    }

    .team-member {
      text-align: center;
      padding: 10px 5px;
      background: #FFF5F7;
      border-radius: 8px;
    }

    .team-emoji {
      font-size: 20pt;
      margin-bottom: 5px;
    }

    .team-name {
      font-size: 10pt;
      font-weight: 600;
      color: #6E59A5;
    }

    .team-role {
      font-size: 7pt;
      color: #999;
      margin-top: 3px;
    }

    /* 컬러 섹션 */
    .color-row {
      display: flex;
      gap: 10px;
    }

    .color-item {
      flex: 1;
      display: flex;
      align-items: center;
      background: white;
      border-radius: 8px;
      padding: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .color-swatch {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      margin-right: 10px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .color-info {
      flex: 1;
    }

    .color-name {
      font-size: 9pt;
      font-weight: 600;
      color: #333;
    }

    .color-code {
      font-size: 8pt;
      color: #999;
      font-family: monospace;
    }

    .color-meaning {
      font-size: 7pt;
      color: #6E59A5;
      margin-top: 2px;
    }

    /* 약속 박스 */
    .promise-box {
      background: linear-gradient(135deg, #9B87F5 0%, #6E59A5 100%);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      color: white;
      box-shadow: 0 4px 20px rgba(110, 89, 165, 0.3);
    }

    .promise-text {
      font-size: 11pt;
      line-height: 1.8;
      font-weight: 400;
    }

    .promise-signature {
      margin-top: 12px;
      font-size: 9pt;
      opacity: 0.8;
    }

    /* 체크리스트 */
    .checklist-box {
      background: #FFF5F7;
      border-radius: 8px;
      padding: 12px 15px;
      border: 1px dashed #F5A7C6;
    }

    .checklist-title {
      font-size: 9pt;
      font-weight: 600;
      color: #6E59A5;
      margin-bottom: 8px;
    }

    .checklist-items {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 5px;
    }

    .checklist-item {
      font-size: 8pt;
      color: #666;
      display: flex;
      align-items: center;
    }

    .checklist-item::before {
      content: '☐';
      margin-right: 6px;
      color: #9B87F5;
    }

    /* 푸터 */
    .footer {
      margin-top: 15px;
      text-align: center;
      font-size: 8pt;
      color: #999;
      padding-top: 10px;
      border-top: 1px solid #E5E5E5;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- 헤더 -->
    <div class="header">
      <div class="brand-name">하루하루의 기적</div>
      <div class="brand-name-en">DAILY MIRACLES</div>
      <div class="doc-title">Brand Essence</div>
    </div>

    <!-- 한 줄 정의 -->
    <div class="tagline-box">
      <div class="tagline">"과학적 근거 + 현실적 희망 + 따뜻한 동행"</div>
    </div>

    <!-- 3대 핵심 메시지 -->
    <div class="section">
      <div class="section-title">3대 핵심 메시지</div>
      <div class="message-cards">
        <!-- 메시지 1 -->
        <div class="message-card">
          <div class="message-number">01</div>
          <div class="message-title">당신의 소원은<br/>과학적으로 이룰 수 있어요</div>
          <table class="message-table">
            <tr>
              <td class="do-col">✓ 심리학 기반 분석</td>
              <td class="dont-col">✗ 점술/사주</td>
            </tr>
            <tr>
              <td class="do-col">✓ 자기효능감 이론</td>
              <td class="dont-col">✗ 운세/관상</td>
            </tr>
            <tr>
              <td class="do-col">✓ 데이터 인사이트</td>
              <td class="dont-col">✗ 미신적 예언</td>
            </tr>
          </table>
          <div class="message-keyword">핵심어: 기적지수, 잠재력 분석, 성장 기회</div>
        </div>

        <!-- 메시지 2 -->
        <div class="message-card">
          <div class="message-number">02</div>
          <div class="message-title">작은 실천이<br/>큰 기적이 됩니다</div>
          <table class="message-table">
            <tr>
              <td class="do-col">✓ 의미 있는 변화</td>
              <td class="dont-col">✗ 100% 성공</td>
            </tr>
            <tr>
              <td class="do-col">✓ 작은 한 걸음</td>
              <td class="dont-col">✗ 반드시 이루어짐</td>
            </tr>
            <tr>
              <td class="do-col">✓ 하루하루 씨앗</td>
              <td class="dont-col">✗ 대박 예언</td>
            </tr>
          </table>
          <div class="message-keyword">도구: 30일 로드맵, 매일 응원 메시지</div>
        </div>

        <!-- 메시지 3 -->
        <div class="message-card">
          <div class="message-number">03</div>
          <div class="message-title">혼자가 아니에요,<br/>함께 응원할게요</div>
          <table class="message-table">
            <tr>
              <td class="do-col">✓ 진심 어린 응원</td>
              <td class="dont-col">✗ 기계적 안내</td>
            </tr>
            <tr>
              <td class="do-col">✓ 전문 팀 동행</td>
              <td class="dont-col">✗ 일방적 정보</td>
            </tr>
            <tr>
              <td class="do-col">✓ 끝까지 함께</td>
              <td class="dont-col">✗ 시작만 도움</td>
            </tr>
          </table>
          <div class="message-keyword">Aurora 5 팀이 함께합니다</div>
        </div>
      </div>
    </div>

    <!-- Aurora 5 팀 -->
    <div class="section">
      <div class="section-title">Aurora 5 팀</div>
      <div class="team-box">
        <div class="team-grid">
          <div class="team-member">
            <div class="team-emoji">💜</div>
            <div class="team-name">코미</div>
            <div class="team-role">COO · 총괄 조율</div>
          </div>
          <div class="team-member">
            <div class="team-emoji">💗</div>
            <div class="team-name">재미</div>
            <div class="team-role">CRO · 소원이 응대</div>
          </div>
          <div class="team-member">
            <div class="team-emoji">💫</div>
            <div class="team-name">루미</div>
            <div class="team-role">Analyst · 데이터 분석</div>
          </div>
          <div class="team-member">
            <div class="team-emoji">🔮</div>
            <div class="team-name">여의보주</div>
            <div class="team-role">QA · 품질 검수</div>
          </div>
          <div class="team-member">
            <div class="team-emoji">⚡</div>
            <div class="team-name">Claude Code</div>
            <div class="team-role">Tech · 기술 구현</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 브랜드 컬러 -->
    <div class="section">
      <div class="section-title">브랜드 컬러 = 브랜드 감정</div>
      <div class="color-row">
        <div class="color-item">
          <div class="color-swatch" style="background: #9B87F5;"></div>
          <div class="color-info">
            <div class="color-name">메인 퍼플</div>
            <div class="color-code">#9B87F5</div>
            <div class="color-meaning">신뢰, 전문성, 가능성</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-swatch" style="background: #F5A7C6;"></div>
          <div class="color-info">
            <div class="color-name">핑크/코랄</div>
            <div class="color-code">#F5A7C6</div>
            <div class="color-meaning">따뜻함, 응원, 희망</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-swatch" style="background: #6E59A5;"></div>
          <div class="color-info">
            <div class="color-name">딥퍼플</div>
            <div class="color-code">#6E59A5</div>
            <div class="color-meaning">깊이, 진정성, 확신</div>
          </div>
        </div>
        <div class="color-item">
          <div class="color-swatch" style="background: linear-gradient(135deg, #9B87F5, #F5A7C6);"></div>
          <div class="color-info">
            <div class="color-name">그라데이션</div>
            <div class="color-code">→</div>
            <div class="color-meaning">전문성에서 따뜻함으로</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 소원이와의 약속 -->
    <div class="section">
      <div class="section-title">소원이와의 약속</div>
      <div class="promise-box">
        <div class="promise-text">
          "당신의 소원을 믿습니다.<br/>
          과학적으로 분석하고, 현실적인 길을 안내하며,<br/>
          끝까지 함께 걷겠습니다."
        </div>
        <div class="promise-signature">— 하루하루의 기적 팀 일동</div>
      </div>
    </div>

    <!-- 체크리스트 -->
    <div class="section">
      <div class="checklist-box">
        <div class="checklist-title">📋 콘텐츠 작성 전 빠른 체크</div>
        <div class="checklist-items">
          <div class="checklist-item">점술/사주 용어 미사용</div>
          <div class="checklist-item">브랜드 컬러 사용</div>
          <div class="checklist-item">과도한 약속 금지</div>
          <div class="checklist-item">따뜻하지만 전문적인 톤</div>
        </div>
      </div>
    </div>

    <!-- 푸터 -->
    <div class="footer">
      하루하루의 기적 | Daily Miracles | Brand Essence v1.0 | 2025-01-30
    </div>
  </div>
</body>
</html>
`;

// ═══════════════════════════════════════════════════════════════════════════
// PDF 생성 함수
// ═══════════════════════════════════════════════════════════════════════════

async function generateBrandEssencePdf() {
  console.log('🎨 브랜드 에센스 PDF 생성 시작...\n');

  // output 디렉토리 생성
  const outputDir = path.join(__dirname, '..', 'output');
  try {
    await fs.mkdir(outputDir, { recursive: true });
  } catch (err) {
    // 이미 존재하면 무시
  }

  let browser;
  try {
    // Chrome 경로 찾기
    const chromePath = findChromePath();
    if (!chromePath) {
      throw new Error('Chrome 또는 Edge 브라우저를 찾을 수 없습니다.');
    }
    console.log(`🌐 브라우저 경로: ${chromePath}`);

    // Puppeteer 실행
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // HTML 설정
    await page.setContent(BRAND_ESSENCE_HTML, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // 폰트 로딩 대기
    await page.evaluateHandle('document.fonts.ready');

    // 추가 대기 (폰트 완전 로딩)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // PDF 생성
    const pdfPath = path.join(outputDir, 'brand-essence.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0'
      }
    });

    console.log('✅ PDF 생성 완료!');
    console.log(`📄 파일 위치: ${pdfPath}\n`);

    return pdfPath;

  } catch (error) {
    console.error('❌ PDF 생성 실패:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 실행
// ═══════════════════════════════════════════════════════════════════════════

generateBrandEssencePdf()
  .then(() => {
    console.log('🎉 브랜드 에센스 PDF가 output/brand-essence.pdf에 저장되었습니다!');
    process.exit(0);
  })
  .catch(err => {
    console.error('오류 발생:', err);
    process.exit(1);
  });
