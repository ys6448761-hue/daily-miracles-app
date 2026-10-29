/**
 * Explorer 클릭 기능 검증 (최종판)
 * T-A1: Zone 2 낭만요트·블루요트 <button> 확인 (textContent.includes 매칭)
 * T-A2: 낭만요트 클릭 → aria-pressed=true
 * T-A3: SOUL 게이팅 — 낭만요트 aria-pressed=true 이지만 onTogglePlace 미호출
 * T-A4: Zone 1 낭만요트 지도 마커 → ring 효과
 * T-A5: 오동도(TG_READY) 클릭 → aria-pressed=true + Zone 2 목록 선택됨
 */
const puppeteer = require('../node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QA_URL = 'http://localhost:5000/muyojeong?qa_preview=boundary';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const findBtnContaining = (text) => {
  const btns = [...document.querySelectorAll('button')];
  return btns.find(b => b.textContent.includes(text) && !b.textContent.includes('소울이') && !b.textContent.includes('← 뒤로'));
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
  const results = [];

  try {
    await page.goto(QA_URL, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);

    // === Zone 1 — T-A4: 지도 마커 클릭 테스트 ===
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '지역별 보기')?.click();
    });
    await sleep(1000);
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('원도심'))?.click();
    });
    await sleep(1500);

    const markerClickResult = await page.evaluate(() => {
      const markers = [...document.querySelectorAll('[style*="position: absolute"]')]
        .filter(el => el.title?.includes('낭만요트'));
      if (!markers.length) return { found: false };
      markers[0].click();
      return { found: true, count: markers.length, title: markers[0].title };
    });
    await sleep(300);
    const markerBoxShadow = await page.evaluate(() => {
      const markers = [...document.querySelectorAll('[style*="position: absolute"]')]
        .filter(el => el.title?.includes('낭만요트'));
      return markers[0]?.querySelector('div')?.style?.boxShadow || null;
    });
    results.push({
      id: 'T-A4',
      name: '낭만요트 지도 마커 클릭 → explorer ring (110,184,255)',
      pass: markerClickResult.found && !!markerBoxShadow && markerBoxShadow.includes('110'),
      detail: { markerClickResult, boxShadow: markerBoxShadow },
    });

    // === Zone 2 진입 — 목록 버튼 테스트 ===
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('← 뒤로'))?.click();
    });
    await sleep(800);
    const zone2Clicked = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      // Zone 2: "오동도·엑스포권" 또는 텍스트에 오동도 포함된 zone card
      const z2 = btns.find(b => b.textContent.includes('오동도') && (b.textContent.includes('엑스포') || b.textContent.includes('Zone') || b.textContent.includes('코스')));
      if (z2) { z2.click(); return z2.textContent.trim().slice(0, 40); }
      return 'not_found';
    });
    console.log('Zone 2 clicked:', zone2Clicked);
    await sleep(1500);

    // T-A1: Zone 2 목록에서 낭만요트·블루요트 버튼 확인 (textContent.includes 사용)
    const listCheck = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button')];
      const nangman = btns.find(b => b.textContent.includes('낭만요트') && !b.textContent.includes('소울이') && !b.textContent.includes('뒤로'));
      const blue = btns.find(b => b.textContent.includes('블루요트') && !b.textContent.includes('소울이') && !b.textContent.includes('뒤로'));
      return {
        nangmanFound: !!nangman,
        blueFound: !!blue,
        nangmanTagName: nangman?.tagName,
        blueTagName: blue?.tagName,
        nangmanAriaPressed: nangman?.getAttribute('aria-pressed'),
      };
    });
    results.push({
      id: 'T-A1',
      name: '낭만요트·블루요트 Zone 2 목록 <button> 확인',
      pass: listCheck.nangmanFound && listCheck.blueFound &&
            listCheck.nangmanTagName === 'BUTTON' && listCheck.blueTagName === 'BUTTON',
      detail: listCheck,
    });

    // T-A2/T-A3: 낭만요트 클릭 → explorer 하이라이트, SOUL 미포함
    const beforeOdongdoPressed = await page.evaluate(() => {
      const odongdo = [...document.querySelectorAll('button')].find(b => b.textContent.includes('오동도') && !b.textContent.includes('코스') && !b.textContent.includes('뒤로'));
      return odongdo?.getAttribute('aria-pressed');
    });
    const nangmanClick = await page.evaluate(() => {
      const nangman = [...document.querySelectorAll('button')].find(b => b.textContent.includes('낭만요트') && !b.textContent.includes('소울이') && !b.textContent.includes('뒤로'));
      if (!nangman) return { clicked: false };
      nangman.click();
      return { clicked: true, tagName: nangman.tagName };
    });
    await sleep(300);
    const afterNangman = await page.evaluate(() => {
      const nangman = [...document.querySelectorAll('button')].find(b => b.textContent.includes('낭만요트') && !b.textContent.includes('소울이') && !b.textContent.includes('뒤로'));
      const odongdo = [...document.querySelectorAll('button')].find(b => b.textContent.includes('오동도') && !b.textContent.includes('코스') && !b.textContent.includes('뒤로'));
      return {
        nangmanAriaPressed: nangman?.getAttribute('aria-pressed'),
        odongdoAriaPressed: odongdo?.getAttribute('aria-pressed'),  // should be unchanged (false/null)
      };
    });
    results.push({
      id: 'T-A2',
      name: '낭만요트 클릭 → aria-pressed=true (탐색 하이라이트 토글)',
      pass: nangmanClick.clicked && afterNangman.nangmanAriaPressed === 'true',
      detail: { nangmanClick, afterNangman },
    });
    // SOUL 게이팅: 오동도(TG_READY)는 아직 클릭 전 → 변화 없어야 함
    results.push({
      id: 'T-A3',
      name: 'SOUL 게이팅: 낭만요트 클릭이 오동도 선택에 영향 없음',
      pass: afterNangman.odongdoAriaPressed === beforeOdongdoPressed ||
            (afterNangman.odongdoAriaPressed !== 'true'),
      detail: { beforeOdongdoPressed, afterOdongdoPressed: afterNangman.odongdoAriaPressed },
    });

    // T-A5: 오동도(TG_READY) 클릭 → aria-pressed=true (SOUL selectedPlaces 추가)
    const odongdoClickResult = await page.evaluate(() => {
      const odongdo = [...document.querySelectorAll('button')].find(b => b.textContent.includes('오동도') && !b.textContent.includes('코스') && !b.textContent.includes('뒤로'));
      if (!odongdo) return { clicked: false };
      odongdo.click();
      return { clicked: true, text: odongdo.textContent.trim().slice(0, 15) };
    });
    await sleep(300);
    const odongdoAfter = await page.evaluate(() => {
      const odongdo = [...document.querySelectorAll('button')].find(b => b.textContent.includes('오동도') && !b.textContent.includes('코스') && !b.textContent.includes('뒤로'));
      return { ariaPressed: odongdo?.getAttribute('aria-pressed') };
    });
    results.push({
      id: 'T-A5',
      name: '오동도(TG_READY) 클릭 → aria-pressed=true (SOUL 추가됨)',
      pass: odongdoClickResult.clicked && odongdoAfter.ariaPressed === 'true',
      detail: { odongdoClickResult, odongdoAfter },
    });

  } finally {
    await browser.close();
  }

  console.log('\n=== Explorer 클릭 기능 검증 결과 ===');
  let pass = 0;
  results.forEach(r => {
    const mark = r.pass ? '✅' : '❌';
    console.log(`${mark} ${r.id}: ${r.name}`);
    if (!r.pass) console.log('   Detail:', JSON.stringify(r.detail, null, 2));
    else pass++;
  });
  console.log(`\n총 ${pass}/${results.length} PASS`);
  if (pass < results.length) process.exit(1);
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
