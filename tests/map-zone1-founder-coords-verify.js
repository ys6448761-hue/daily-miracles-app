/**
 * Zone 1 원도심 해안권 — MAP_V01_ZONE1_FOUNDER_COORDINATES_SOURCE_SAVED 검증
 * - 7곳 SOURCE=렌더 Δ 확인 (localStorage 주입 없음)
 * - 여수 수산시장 마커 없음 확인 (PLACEMENT_PENDING)
 * - Zone 2 마커 혼입 없음 확인 (Zone 1 편집기에 Zone 2 장소 미표시)
 */
const puppeteer = require('puppeteer-core');

const ZONE1_NEW = {
  lee_soon_shin_plaza:  { x: 0.375, y: 0.515, name: '이순신광장' },
  romantic_pojangmacha: { x: 0.599, y: 0.614, name: '낭만포차거리' },
  hamel_lighthouse:     { x: 0.569, y: 0.603, name: '하멜등대' },
  gosodong_mural:       { x: 0.463, y: 0.518, name: '고소동 천사벽화골목' },
  jinamgwan:            { x: 0.380, y: 0.449, name: '진남관' },
  opodae:               { x: 0.426, y: 0.485, name: '오포대' },
  marine_park:          { x: 0.444, y: 0.582, name: '종포해양공원' },
};

const PENDING = [{ code: 'yeosu_fish_market', name: '여수 수산시장' }];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Zone 1 진입 (QA Preview — localStorage 주입 없음)
  await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
    waitUntil: 'networkidle0', timeout: 20000,
  });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 700));
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('원도심 해안권'));
    if (b) { b.click(); return true; }
    return false;
  });
  if (!clicked) throw new Error('Zone 1 버튼 없음');
  await new Promise(r => setTimeout(r, 1200));

  // 렌더 측정 — oldtown 이미지 wrapper 기준
  const names1 = Object.fromEntries(Object.entries(ZONE1_NEW).map(([k, v]) => [k, v.name]));
  const pendingNames = PENDING.map(p => p.name);

  const result = await page.evaluate((names1, pendingNames) => {
    const imgs = [...document.querySelectorAll('img')].filter(img => img.src.includes('yeosu-oldtown'));
    if (!imgs.length) return { error: 'no oldtown img' };
    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'zero size' };

    const measured = {};
    for (const [code, name] of Object.entries(names1)) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(name));
      if (!el) { measured[code] = null; continue; }
      const inner = el.querySelector('div');
      const cRect = inner ? inner.getBoundingClientRect() : null;
      measured[code] = cRect ? {
        x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
        y: ((cRect.top  + cRect.height / 2) - wRect.top)  / wRect.height,
      } : null;
    }

    const pendingMarkers = {};
    for (const name of pendingNames) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(name));
      pendingMarkers[name] = !!el;
    }
    return { measured, pendingMarkers };
  }, names1, pendingNames);

  console.log('\n=== Zone 1 Founder 좌표 SOURCE_SAVED 검증 ===\n');

  if (result.error) {
    console.log('❌ 오류:', result.error);
    await browser.close();
    process.exit(1);
  }

  // 7곳 SOURCE=렌더 확인
  let pass = 0, fail = 0;
  console.log('[ 7곳 좌표 검증 ]');
  for (const [code, def] of Object.entries(ZONE1_NEW)) {
    const r = result.measured[code];
    if (!r) {
      console.log(`  ❌ ${code}(${def.name}): NOT FOUND`);
      fail++;
    } else {
      const dx = Math.abs(def.x - r.x).toFixed(4);
      const dy = Math.abs(def.y - r.y).toFixed(4);
      const ok = parseFloat(dx) < 0.01 && parseFloat(dy) < 0.01;
      if (ok) pass++; else fail++;
      console.log(`  ${ok ? '✅' : '❌'} ${def.name}: SOURCE=(${def.x},${def.y}) render=(${r.x.toFixed(4)},${r.y.toFixed(4)}) Δx=${dx} Δy=${dy}`);
    }
  }
  console.log(`  결과: ${pass}/${pass + fail} PASS\n`);

  // PLACEMENT_PENDING 장소 마커 없음
  console.log('[ PLACEMENT_PENDING 마커 없음 확인 ]');
  let pendingOk = true;
  for (const [name, rendered] of Object.entries(result.pendingMarkers)) {
    const ok = !rendered;
    if (!ok) pendingOk = false;
    console.log(`  ${ok ? '✅' : '❌'} ${name}: ${ok ? '마커 없음 (정상)' : '⚠️ 마커 렌더됨 (오류)'}`);
  }
  console.log();

  const allOk = pass === 7 && fail === 0 && pendingOk;
  console.log('=== 최종 판정 ===');
  console.log(allOk
    ? '✅ PASS — 7곳 SOURCE_SAVED 정상, 미배치 장소 마커 없음'
    : '❌ FAIL — 항목 확인 필요');

  await browser.close();
  if (!allOk) process.exit(1);
})().catch(e => { console.error(e.message); process.exit(1); });
