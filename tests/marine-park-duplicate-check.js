/**
 * marine_park 중복 마커 검증 — 새 브라우저 세션 (incognito), 캐시 없음
 * 목적: 코드 수정(d67df29) 후 종포해양공원이 단일 마커인지 확인
 * 네비게이션: 지역별 보기 → 원도심·해안권(Zone 1)
 */
const puppeteer = require('../node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QA_URL = 'http://localhost:5000/muyojeong?qa_preview=boundary';
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
  });
  const pages = await browser.pages();
  const page = pages[0];
  await page.setViewport({ width: 390, height: 844 });
  await page.setCacheEnabled(false);

  try {
    await page.goto(QA_URL, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // Step 1: 지역별 보기 진입
    const step1 = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '지역별 보기');
      if (btn) { btn.click(); return 'clicked'; }
      return 'not_found';
    });
    console.log('Step 1 (지역별 보기):', step1);
    await sleep(1000);

    // Step 2: Zone 1 원도심 클릭
    const step2 = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent.includes('원도심'));
      if (btn) { btn.click(); return btn.textContent.trim().slice(0, 30); }
      const allBtnTexts = btns.map(b => b.textContent.trim().slice(0, 20)).join(' | ');
      return `not_found. buttons: ${allBtnTexts}`;
    });
    console.log('Step 2 (Zone 1):', step2);
    await sleep(1500);

    // Step 3: 마커 분석 — 지도 영역 내 종포해양공원 마커 카운트
    const analysis = await page.evaluate(() => {
      // 지도 컨테이너: position:relative이고 이미지가 있는 div
      // 마커: position:absolute이고 title 있는 div
      const mapMarkers = [...document.querySelectorAll('[style*="position: absolute"]')]
        .filter(el => {
          const title = el.title || el.getAttribute('aria-label') || '';
          return title.includes('종포해양공원');
        });

      const allTitledMarkers = [...document.querySelectorAll('[style*="position: absolute"]')]
        .filter(el => el.title && !el.title.startsWith('[QA]'));

      // 하단 목록의 종포해양공원 텍스트 요소 (마커 아님)
      const listItems = [...document.querySelectorAll('*')]
        .filter(el => el.children.length === 0 && el.textContent.trim() === '종포해양공원');

      return {
        marineMarkerCount: mapMarkers.length,
        marineMarkerPositions: mapMarkers.map(e => ({
          left: e.style.left,
          top: e.style.top,
          title: e.title,
          tagName: e.tagName,
        })),
        allMapMarkerCount: allTitledMarkers.length,
        allMapMarkerTitles: allTitledMarkers.map(e => e.title),
        listItemsCount: listItems.length,
      };
    });

    console.log('\n=== marine_park 중복 검증 결과 ===');
    console.log('종포해양공원 지도 마커 수:', analysis.marineMarkerCount);
    console.log('종포해양공원 마커 위치:', JSON.stringify(analysis.marineMarkerPositions, null, 2));
    console.log('하단 목록 텍스트 항목 수:', analysis.listItemsCount);
    console.log('전체 지도 마커 수:', analysis.allMapMarkerCount);
    console.log('전체 마커 title 목록:', analysis.allMapMarkerTitles);

    if (analysis.allMapMarkerCount === 0) {
      console.log('\n⚠️  INCONCLUSIVE — Zone 미진입 또는 마커 렌더링 미감지');
      // body text 일부 확인
      const bodySnip = await page.evaluate(() => document.body.innerText.slice(0, 600));
      console.log('Body text:', bodySnip);
    } else if (analysis.marineMarkerCount === 0) {
      console.log('\n⚠️  종포해양공원 마커 0개 (전체 마커는 있음) — markerPos 확인 필요');
    } else if (analysis.marineMarkerCount === 1) {
      console.log('\n✅ PASS — 종포해양공원 마커 1개, 중복 없음');
    } else {
      console.log(`\n❌ FAIL — 종포해양공원 마커 ${analysis.marineMarkerCount}개 (중복 확인됨!)`);
    }

  } finally {
    await browser.close();
  }
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
