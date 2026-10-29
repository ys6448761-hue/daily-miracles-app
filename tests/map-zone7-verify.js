/**
 * Zone 7 섬섬길 — MAP_V01_ZONE7_LAYOUT_SOURCE_SAVED 검증
 * - 지도 마커: 사도·하화도·금오도·개도 4곳 (PROVISIONAL)
 * - 지도 마커 없음: 거문도·백도 (offMap)
 * - "지도 범위 밖의 섬" 목록: 거문도·백도 2곳
 * - SOURCE=렌더 Δ 확인 (4곳)
 */
const puppeteer = require('puppeteer-core');

const ZONE7_MARKERS = {
  sado_island:    { x: 0.311, y: 0.813, name: '사도' },
  hahwado_island: { x: 0.425, y: 0.810, name: '하화도' },
  geumo_island:   { x: 0.662, y: 0.877, name: '금오도' },
  gaedo_island:   { x: 0.512, y: 0.828, name: '개도' },
};
const OFFMAP_NAMES = ['거문도', '백도'];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Zone 7 진입 (localStorage 주입 없음 — SOURCE 직접 렌더)
  await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
    waitUntil: 'networkidle0', timeout: 20000,
  });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('섬섬길'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  const result = await page.evaluate((markerDefs, offMapNames) => {
    // overview 이미지 wrapper 찾기
    const imgs = [...document.querySelectorAll('img')].filter(img => img.src.includes('yeosu-overview'));
    if (!imgs.length) return { error: 'no overview img' };
    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'zero size' };

    // 4곳 마커 측정
    const measured = {};
    for (const [code, def] of Object.entries(markerDefs)) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(def.name));
      if (!el) { measured[code] = null; continue; }
      const inner = el.querySelector('div');
      const cRect = inner ? inner.getBoundingClientRect() : null;
      measured[code] = cRect ? {
        x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
        y: ((cRect.top  + cRect.height / 2) - wRect.top)  / wRect.height,
      } : null;
    }

    // 거문도·백도 마커 없음 확인
    const offMapMarkers = {};
    for (const name of offMapNames) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(name));
      offMapMarkers[name] = !!el;
    }

    // "지도 범위 밖의 섬" 섹션 및 항목 확인
    const allText = document.body.innerText;
    const sectionExists = allText.includes('지도 범위 밖의 섬');
    const offMapListItems = {};
    for (const name of offMapNames) {
      // span 요소에서 name 텍스트 포함 확인 (마커 aria-label과 구분)
      const spans = [...document.querySelectorAll('span')].filter(s => s.textContent.trim() === name);
      offMapListItems[name] = spans.length > 0;
    }

    return { measured, offMapMarkers, sectionExists, offMapListItems };
  }, ZONE7_MARKERS, OFFMAP_NAMES);

  console.log('\n=== Zone 7 섬섬길 — MAP_V01_ZONE7_LAYOUT_SOURCE_SAVED 검증 ===\n');

  if (result.error) {
    console.log('❌ 오류:', result.error);
    await browser.close();
    process.exit(1);
  }

  // 4곳 SOURCE=렌더 확인
  let markerPass = 0, markerFail = 0;
  console.log('[ 지도 마커 4곳 좌표 검증 ]');
  for (const [code, def] of Object.entries(ZONE7_MARKERS)) {
    const r = result.measured[code];
    if (!r) {
      console.log(`  ❌ ${code}(${def.name}): 마커 NOT FOUND`);
      markerFail++;
    } else {
      const dx = Math.abs(def.x - r.x).toFixed(4);
      const dy = Math.abs(def.y - r.y).toFixed(4);
      const ok = parseFloat(dx) < 0.01 && parseFloat(dy) < 0.01;
      if (ok) markerPass++; else markerFail++;
      console.log(`  ${ok ? '✅' : '❌'} ${code}(${def.name}): SOURCE=(${def.x},${def.y}) render=(${r.x.toFixed(4)},${r.y.toFixed(4)}) Δx=${dx} Δy=${dy}`);
    }
  }
  console.log(`  결과: ${markerPass}/${markerPass + markerFail} PASS\n`);

  // 거문도·백도 마커 없음 확인
  console.log('[ 거문도·백도 지도 마커 없음 확인 ]');
  let offMapMarkerOk = true;
  for (const [name, rendered] of Object.entries(result.offMapMarkers)) {
    const ok = !rendered;
    if (!ok) offMapMarkerOk = false;
    console.log(`  ${ok ? '✅' : '❌'} ${name}: ${ok ? '마커 없음 (정상)' : '⚠️ 마커 렌더됨 (오류)'}`);
  }
  console.log();

  // "지도 범위 밖의 섬" 섹션 확인
  console.log('[ "지도 범위 밖의 섬" 섹션 확인 ]');
  console.log(`  ${result.sectionExists ? '✅' : '❌'} 섹션 타이틀 존재: ${result.sectionExists}`);
  let offMapListOk = true;
  for (const [name, exists] of Object.entries(result.offMapListItems)) {
    if (!exists) offMapListOk = false;
    console.log(`  ${exists ? '✅' : '❌'} ${name} 목록 항목: ${exists}`);
  }
  console.log();

  const allOk = markerPass === 4 && markerFail === 0 && offMapMarkerOk && result.sectionExists && offMapListOk;
  console.log('=== 최종 판정 ===');
  console.log(allOk
    ? '✅ PASS — 4곳 마커 정상, 거문도·백도 마커 없음, 지도 범위 밖 목록 정상'
    : '❌ FAIL — 항목 확인 필요');

  await browser.close();
  if (!allOk) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
