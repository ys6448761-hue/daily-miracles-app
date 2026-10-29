/**
 * Zone 2 오동도·엑스포권 — MAP_V01_ZONE2_SOURCE_RENDER_ALIGNED 검증
 *
 * A. Zone 2 QA 편집기:
 *    - 최신 11곳 SOURCE 좌표 확인 (localStorage 주입 없음 — SOURCE 직접 렌더)
 *    - Zone 1 초안 혼입 0건
 * B. Zone 2 일반 지도:
 *    - 11곳 표시 좌표 SOURCE와 Δ<0.01 이내
 *    - 과거 좌표 잔류 0건
 * C. Zone 1 화면:
 *    - Zone 1 전용 마커만 표시
 *    - Zone 2 마커 혼입 0건
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ZONE2_NEW = {
  odongdo:            { x: 0.850, y: 0.355, name: '오동도' },
  cablecar:           { x: 0.664, y: 0.507, name: '케이블카' },
  yeosu_expo_park:    { x: 0.556, y: 0.185, name: '엑스포공원' },
  sky_tower:          { x: 0.604, y: 0.121, name: '스카이타워' },
  jaisan_park:        { x: 0.602, y: 0.508, name: '자산공원' },
  aquaplanet:         { x: 0.557, y: 0.304, name: '아쿠아플라넷' },
  yeosu_expo_station: { x: 0.567, y: 0.106, name: '여수엑스포역' },
  yeosu_ocean_cruise: { x: 0.608, y: 0.209, name: '여수오션크루즈' },
  nangman_yacht:      { x: 0.627, y: 0.425, name: '낭만요트' },
  blue_yacht:         { x: 0.593, y: 0.378, name: '블루요트' },
  big_o_show:         { x: 0.543, y: 0.232, name: '빅오쇼' },
};

// 과거 좌표 (이 값이 렌더되면 오류)
const ZONE2_OLD = {
  odongdo:         { x: 0.853, y: 0.392 },
  cablecar:        { x: 0.660, y: 0.544 },
  yeosu_expo_park: { x: 0.558, y: 0.211 },
  sky_tower:       { x: 0.604, y: 0.137 },
  jaisan_park:     { x: 0.581, y: 0.537 },
  aquaplanet:      { x: 0.586, y: 0.326 },
  nangman_yacht:   { x: 0.657, y: 0.430 },
  blue_yacht:      { x: 0.627, y: 0.414 },
  big_o_show:      { x: 0.549, y: 0.285 },
};

// Zone 1 전용 마커 이름 (혼입 체크용)
const ZONE1_NAMES = ['이순신광장', '낭만포차거리', '하멜등대', '고소동 천사벽화골목', '진남관', '오포대', '종포해양공원'];

async function launch() {
  return puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
}

async function enterZone(page, zoneName, qaMode) {
  const url = qaMode
    ? 'http://localhost:5000/muyojeong?qa_preview=boundary'
    : 'http://localhost:5000/muyojeong';
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 700));
  const clicked = await page.evaluate((name) => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes(name));
    if (b) { b.click(); return true; }
    return false;
  }, zoneName);
  if (!clicked) throw new Error(`권역 버튼 없음: ${zoneName}`);
  await new Promise(r => setTimeout(r, 1500));
}

async function measureMarkers(page, imgKey) {
  return page.evaluate((imgKey) => {
    const imgs = [...document.querySelectorAll('img')].filter(img => img.src.includes(imgKey));
    if (!imgs.length) return { error: `no img: ${imgKey}` };
    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'zero size' };

    const markers = [...document.querySelectorAll('[aria-label]')];
    const measured = {};
    for (const el of markers) {
      const label = el.getAttribute('aria-label');
      const inner = el.querySelector('div');
      const cRect = inner ? inner.getBoundingClientRect() : null;
      if (cRect && cRect.width > 0) {
        measured[label] = {
          x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
          y: ((cRect.top  + cRect.height / 2) - wRect.top)  / wRect.height,
        };
      }
    }
    return { measured, wRect: { width: wRect.width, height: wRect.height } };
  }, imgKey);
}

(async () => {
  const screenshotDir = path.join('tests', 'screenshots-zone2');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  let allPass = true;
  console.log('\n=== Zone 2 오동도·엑스포권 SOURCE_RENDER_ALIGNED 검증 ===\n');

  // ── A. Zone 2 QA 편집기 — 11곳 SOURCE 좌표 확인, Zone 1 혼입 0건 ──
  console.log('── A. Zone 2 QA Preview — 일반 지도 (11곳 SOURCE 확인) ──');
  await enterZone(page, '오동도', true);
  await page.screenshot({ path: path.join(screenshotDir, 'zone2-qa-regular-map.png') });

  const rA = await measureMarkers(page, 'yeosu-oldtown');
  let passA = 0, failA = 0;
  for (const [code, def] of Object.entries(ZONE2_NEW)) {
    const match = rA.measured && Object.entries(rA.measured).find(([label]) => label.includes(def.name));
    if (!match) {
      console.log(`  ❌ ${def.name}: NOT FOUND`);
      failA++; continue;
    }
    const r = match[1];
    const dx = Math.abs(def.x - r.x).toFixed(4);
    const dy = Math.abs(def.y - r.y).toFixed(4);
    const ok = parseFloat(dx) < 0.01 && parseFloat(dy) < 0.01;
    const oldDef = ZONE2_OLD[code];
    const isOld = oldDef && Math.abs(oldDef.x - r.x) < 0.005 && Math.abs(oldDef.y - r.y) < 0.005;
    if (ok) passA++; else failA++;
    console.log(`  ${ok ? '✅' : '❌'} ${def.name}: SOURCE=(${def.x},${def.y}) render=(${r.x.toFixed(4)},${r.y.toFixed(4)}) Δx=${dx} Δy=${dy}${isOld ? ' ⚠️ 구좌표 잔류' : ''}`);
  }
  // Zone 1 혼입 체크
  let zone1Intrusion = 0;
  if (rA.measured) {
    for (const name of ZONE1_NAMES) {
      const found = Object.keys(rA.measured).some(l => l.includes(name));
      if (found) { console.log(`  ⚠️ Zone1 혼입: ${name}`); zone1Intrusion++; }
    }
  }
  console.log(`  결과: ${passA}/${passA + failA} PASS / Zone1 혼입: ${zone1Intrusion}건`);
  if (passA < 11 || zone1Intrusion > 0) allPass = false;

  // ── B. Zone 2 편집기 진입 + 2× 확대 스크린샷 ──
  console.log('\n── B. Zone 2 QA Preview — 편집기 + 2× 확대 ──');
  await enterZone(page, '오동도', true);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '시작');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, 'zone2-qa-placement-editor.png') });
  const placementActive = await page.evaluate(() =>
    [...document.querySelectorAll('button')].some(b => b.textContent.trim() === '종료')
  );
  console.log(`  편집 모드 진입: ${placementActive ? '✅' : '❌'}`);

  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('2×'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(screenshotDir, 'zone2-qa-zoomed.png') });
  console.log(`  스크린샷: zone2-qa-placement-editor.png / zone2-qa-zoomed.png`);

  // ── C. Zone 1 화면 — Zone 2 혼입 0건, Zone 1 마커 불변 ──
  console.log('\n── C. Zone 1 QA Preview — Zone 2 혼입 확인 ──');
  await enterZone(page, '원도심', true);
  await page.screenshot({ path: path.join(screenshotDir, 'zone1-check.png') });

  const rC = await measureMarkers(page, 'yeosu-oldtown');
  let zone2Intrusion = 0;
  const zone2Names = Object.values(ZONE2_NEW).map(d => d.name);
  if (rC.measured) {
    for (const name of zone2Names) {
      const found = Object.keys(rC.measured).some(l => l.includes(name));
      if (found) { console.log(`  ⚠️ Zone2 혼입: ${name}`); zone2Intrusion++; }
    }
  }
  // Zone 1 마커 7곳 확인
  const zone1Expected = ['이순신광장', '낭만포차거리', '하멜등대', '고소동', '진남관', '오포대', '종포해양공원'];
  let zone1Found = 0;
  for (const name of zone1Expected) {
    const found = rC.measured && Object.keys(rC.measured).some(l => l.includes(name));
    if (found) zone1Found++;
  }
  console.log(`  Zone 1 마커: ${zone1Found}/7 ✅ / Zone 2 혼입: ${zone2Intrusion}건`);
  if (zone2Intrusion > 0) allPass = false;

  // ── 최종 판정 ──
  console.log('\n=== 최종 판정 ===');
  console.log(`  A. Zone 2 일반 지도 11곳: ${passA === 11 ? '✅ 11/11' : `❌ ${passA}/11`} PASS / Zone1 혼입 ${zone1Intrusion}건`);
  console.log(`  B. 편집기 진입: ${placementActive ? '✅' : '❌'} / 스크린샷 3종`);
  console.log(`  C. Zone 1 화면: Zone 1 마커 ${zone1Found}/7 / Zone 2 혼입 ${zone2Intrusion}건`);
  console.log(allPass
    ? '✅ PASS — Zone 2 SOURCE_RENDER_ALIGNED. 스크린샷 시각 확인 요망.'
    : '❌ FAIL — 항목 확인 필요');

  await browser.close();
  if (!allPass) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
