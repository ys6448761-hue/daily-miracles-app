/**
 * Zone 5 장소·좌표 정정 후 검증
 * - localStorage 주입 없음 (SOURCE 직접 렌더)
 * - ungcheon_park markerPos 없음 → 마커 렌더 0건 확인
 * - lee_soon_shin_marina hidden:true → 마커 렌더 0건 확인
 * - 5곳 새 좌표 SOURCE=렌더 확인
 */
const puppeteer = require('puppeteer-core');

const ZONE5_NEW = {
  yworld_luge:  { x: 0.458, y: 0.444, name: '유월드루지' },
  jangdo:       { x: 0.521, y: 0.471, name: '장도' },
  soho_yacht:   { x: 0.476, y: 0.509, name: '소호요트장' },
  soho_bridge:  { x: 0.480, y: 0.483, name: '소호동동다리' },
  settler_cactus: { x: 0.404, y: 0.442, name: '서틀러다육식물원' },
};

const EXCLUDED = [
  { code: 'lee_soon_shin_marina', name: '이순신마리나' },
  { code: 'ungcheon_park', name: '웅천친수공원' },
];

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // Zone 5 진입 (localStorage 주입 없음)
  await page.goto('http://localhost:5000/muyojeong?qa_preview=boundary', {
    waitUntil: 'networkidle0', timeout: 20000,
  });
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === '지역별 보기');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 800));
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.includes('소호'));
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 1200));

  // 렌더 측정
  const names5 = Object.fromEntries(Object.entries(ZONE5_NEW).map(([k, v]) => [k, v.name]));
  const excNames = EXCLUDED.map(e => e.name);

  const result = await page.evaluate((names5, excNames) => {
    const imgs = [...document.querySelectorAll('img')].filter(img => img.src.includes('yeosu-overview'));
    if (!imgs.length) return { error: 'no img' };
    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'zero size' };

    const measured = {};
    for (const [code, name] of Object.entries(names5)) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(name));
      if (!el) { measured[code] = null; continue; }
      const inner = el.querySelector('div');
      const cRect = inner ? inner.getBoundingClientRect() : null;
      measured[code] = cRect ? {
        x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
        y: ((cRect.top + cRect.height / 2) - wRect.top) / wRect.height,
      } : null;
    }

    const excluded = {};
    for (const name of excNames) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(name));
      excluded[name] = !!el;
    }
    return { measured, excluded };
  }, names5, excNames);

  console.log('\n=== Zone 5 장소·좌표 정정 검증 ===\n');

  // 5곳 SOURCE=렌더 확인
  let pass = 0, fail = 0;
  console.log('[ 5곳 좌표 검증 ]');
  for (const [code, p] of Object.entries(ZONE5_NEW)) {
    const r = result.measured[code];
    if (!r) {
      console.log(`  ❌ ${code}: NOT FOUND`);
      fail++;
    } else {
      const dx = Math.abs(p.x - r.x).toFixed(4);
      const dy = Math.abs(p.y - r.y).toFixed(4);
      const ok = parseFloat(dx) < 0.01 && parseFloat(dy) < 0.01;
      if (ok) pass++; else fail++;
      console.log(`  ${ok ? '✅' : '❌'} ${code}: SOURCE=(${p.x},${p.y}) render=(${r.x.toFixed(4)},${r.y.toFixed(4)}) Δx=${dx} Δy=${dy}`);
    }
  }
  console.log(`\n  결과: ${pass}/${pass + fail} PASS\n`);

  // 제외 장소 렌더 0건 확인
  console.log('[ 제외 장소 마커 없음 확인 ]');
  for (const [name, rendered] of Object.entries(result.excluded)) {
    const ok = !rendered;
    console.log(`  ${ok ? '✅' : '❌'} ${name}: ${ok ? '마커 없음 (정상)' : '⚠️ 마커 렌더됨 (확인 필요)'}`);
  }

  console.log('\n=== 최종 판정 ===');
  const excludeOk = Object.values(result.excluded).every(v => !v);
  const allOk = pass === 5 && excludeOk;
  console.log(allOk ? '✅ PASS — 5곳 좌표 정상, 제외 장소 마커 없음' : '❌ FAIL — 항목 확인 필요');

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
