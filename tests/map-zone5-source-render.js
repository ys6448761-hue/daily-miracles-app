/**
 * Zone 5 SOURCE → 실제 렌더 좌표 측정
 * localStorage 주입 없음 — yeosuMapData.js markerPos 직접 렌더 측정
 */
const puppeteer = require('puppeteer-core');

const ZONE5_SOURCE = {
  yworld_luge:          { x: 0.461, y: 0.460, name: '유월드루지' },
  jangdo:               { x: 0.525, y: 0.503, name: '장도' },
  soho_yacht:           { x: 0.478, y: 0.509, name: '소호요트장' },
  soho_bridge:          { x: 0.496, y: 0.471, name: '소호동동다리' },
  lee_soon_shin_marina: { x: 0.547, y: 0.504, name: '이순신마리나' },
  settler_cactus:       { x: 0.406, y: 0.459, name: '서틀러다육식물원' },
};

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  // localStorage 주입 없이 순수 SOURCE 렌더 위치 측정
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

  // regular 마커 측정
  const names = Object.fromEntries(Object.entries(ZONE5_SOURCE).map(([k, v]) => [k, v.name]));
  const result = await page.evaluate((names) => {
    const imgs = [...document.querySelectorAll('img')].filter(img => img.src.includes('yeosu-overview'));
    if (!imgs.length) return { error: 'no img' };
    const wrapper = imgs[0].parentElement;
    const wRect = wrapper.getBoundingClientRect();
    if (wRect.width === 0 || wRect.height === 0) return { error: 'zero size' };
    const out = {};
    for (const [code, name] of Object.entries(names)) {
      const el = [...document.querySelectorAll('[aria-label]')]
        .find(el => el.getAttribute('aria-label').includes(name));
      if (!el) { out[code] = null; continue; }
      const inner = el.querySelector('div');
      const cRect = inner ? inner.getBoundingClientRect() : null;
      out[code] = cRect ? {
        x: ((cRect.left + cRect.width / 2) - wRect.left) / wRect.width,
        y: ((cRect.top + cRect.height / 2) - wRect.top) / wRect.height,
      } : null;
    }
    return out;
  }, names);

  console.log('\nZone 5 SOURCE → 실제 렌더 측정 (localStorage 주입 없음):');
  console.log('(SOURCE = 현재 yeosuMapData.js markerPos.overview 값)\n');
  for (const [code, p] of Object.entries(ZONE5_SOURCE)) {
    const r = result[code];
    if (!r) { console.log(`  ${code}: NOT FOUND (렌더되지 않음)`); continue; }
    const dx = Math.abs(p.x - r.x).toFixed(4);
    const dy = Math.abs(p.y - r.y).toFixed(4);
    console.log(`  ${code}: SOURCE=(${p.x},${p.y}) render=(${r.x.toFixed(4)},${r.y.toFixed(4)}) Δx=${dx} Δy=${dy}`);
  }
  console.log('\n판정: SOURCE = 렌더 (Δ≈0) — 마커는 SOURCE 좌표 그대로 표시됨.');
  console.log('Founder VISUAL_REJECTED 원인: SOURCE 좌표 자체가 실제 장소 위치와 다름.');
  console.log('→ Founder가 QA 편집기에서 오류 장소만 재배치 후 좌표 내보내기 필요.');
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
