/**
 * MAP V0.1 — 15곳 파이프라인 완전 감사
 * 단계별 실제 개수 및 위치 비교
 * Step 5: 지도 렌더링 실제 위치 (Zone 1 QA Preview)
 * Step 6: QA 드래그 편집기 후보 목록 버튼 수
 */
const puppeteer = require('../node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QA_URL = 'http://localhost:5000/muyojeong?qa_preview=boundary';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 소스 기준값 (yeosuMapData.js markerPos)
const SOURCE_COORDS = {
  lee_soon_shin_plaza:  { x: 0.391, y: 0.544, zone: 1, name: '이순신광장' },
  romantic_pojangmacha: { x: 0.612, y: 0.642, zone: 1, name: '낭만포차거리' },
  hamel_lighthouse:     { x: 0.563, y: 0.620, zone: 1, name: '하멜등대' },
  jinamgwan:            { x: 0.380, y: 0.470, zone: 1, name: '진남관' },
  opodae:               { x: 0.453, y: 0.530, zone: 1, name: '오포대' },
  marine_park:          { x: 0.447, y: 0.577, zone: 1, name: '종포해양공원' },
  odongdo:              { x: 0.859, y: 0.397, zone: 2, name: '오동도' },
  cablecar:             { x: 0.657, y: 0.529, zone: 2, name: '케이블카' },
  yeosu_expo_park:      { x: 0.551, y: 0.195, zone: 2, name: '엑스포공원' },
  sky_tower:            { x: 0.604, y: 0.152, zone: 2, name: '스카이타워' },
  jaisan_park:          { x: 0.586, y: 0.535, zone: 2, name: '자산공원' },
  aquaplanet:           { x: 0.563, y: 0.334, zone: 2, name: '아쿠아플라넷' },
  nangman_yacht:        { x: 0.643, y: 0.419, zone: 2, name: '낭만요트' },
  blue_yacht:           { x: 0.607, y: 0.435, zone: 2, name: '블루요트' },
  big_o_show:           { x: 0.529, y: 0.296, zone: 2, name: '빅오쇼' },
};

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

    // 지역별 보기 → Zone 1 진입
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '지역별 보기')?.click();
    });
    await sleep(1000);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('원도심'))?.click();
    });
    await sleep(1500);

    // Step 5: 실제 렌더링된 마커 위치 수집
    const renderedMarkers = await page.evaluate(() => {
      return [...document.querySelectorAll('[style*="position: absolute"]')]
        .filter(el => el.title && !el.title.includes('[QA]') && !el.title.includes('정확도') && el.style.left)
        .map(el => ({
          title: el.title,
          left: parseFloat(el.style.left) / 100,
          top: parseFloat(el.style.top) / 100,
        }));
    });

    // Step 6: QA 편집기 시작 → 후보 목록 버튼 수 확인
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '시작')?.click();
    });
    await sleep(500);

    const placementTargetBtns = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      // Zone 1·2 구분 헤더 아래 장소 버튼들
      return btns
        .filter(b => {
          const txt = b.textContent.trim();
          return txt.length > 1 && txt.length < 20 &&
            !['시작', '종료', '뒤로', '추천', '코스', '→', '←', '2시간', '반나절', '하루', '소울이', '가볍게', '그냥', '부모님', '아이와', '차량', '여행코스', '목록으로', '초안 삭제'].some(k => txt.includes(k));
        })
        .map(b => b.textContent.trim().replace(/✓/g, '').trim());
    });

    // 결과 출력
    console.log('\n=== MAP V0.1 15곳 파이프라인 감사 ===\n');
    console.log('## Step 1: YEOSU_PLACES 소스 markerPos 보유 수');
    console.log(`   소스 기준: ${Object.keys(SOURCE_COORDS).length}곳`);

    console.log('\n## Step 5: 브라우저 실제 렌더링 마커');
    console.log(`   렌더링 마커 수: ${renderedMarkers.length}개`);

    console.log('\n## Step 6: QA 편집기 후보 목록');
    console.log(`   버튼 수: ${placementTargetBtns.length}개`);
    console.log(`   목록: ${placementTargetBtns.join(', ')}`);

    console.log('\n## 15곳 위치 대조표');
    console.log('place_id | 소스 x,y | 렌더 x,y | 일치 | 표시여부');
    console.log('---------|----------|----------|------|--------');

    let mismatches = 0;
    let missing = 0;

    for (const [code, src] of Object.entries(SOURCE_COORDS)) {
      const rendered = renderedMarkers.find(m => m.title.includes(src.name));
      if (!rendered) {
        console.log(`${code.padEnd(22)} | ${src.x},${src.y} | NOT_FOUND | ❌ | 미표시`);
        missing++;
      } else {
        const rxRound = Math.round(rendered.left * 1000) / 1000;
        const ryRound = Math.round(rendered.top * 1000) / 1000;
        const match = Math.abs(rendered.left - src.x) < 0.002 && Math.abs(rendered.top - src.y) < 0.002;
        console.log(`${code.padEnd(22)} | ${src.x},${src.y} | ${rxRound},${ryRound} | ${match ? '✅' : '⚠️ MISMATCH'} | 표시`);
        if (!match) mismatches++;
      }
    }

    console.log(`\n총 ${Object.keys(SOURCE_COORDS).length}곳 중 미표시: ${missing}개, 좌표 불일치: ${mismatches}개`);

    if (missing === 0 && mismatches === 0) {
      console.log('\n✅ MAP_V01_15_MARKER_PIPELINE_VERIFIED — 15곳 전체 소스 일치, 렌더링 정상');
    } else {
      console.log('\n❌ MAP_V01_MARKER_PIPELINE_HOLD — 누락 또는 불일치 발견');
    }

    // 11개 제한 검사
    console.log('\n## 11개 제한 검사');
    if (renderedMarkers.length === 11) {
      console.log('❌ 렌더링 마커 11개 — 11개 제한 존재 가능성');
    } else if (renderedMarkers.length === 15) {
      console.log('✅ 렌더링 마커 15개 — 11개 제한 없음');
    } else {
      console.log(`⚠️ 렌더링 마커 ${renderedMarkers.length}개 — 예상 외 수량`);
    }

  } finally {
    await browser.close();
  }
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
