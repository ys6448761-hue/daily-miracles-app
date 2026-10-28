/**
 * MAP V0.1 — Zone Separation & Final Coordinate Verification
 * A: Zone 1 → 6개 마커만 / Zone 2 → 9개 마커만 (권역 분리 확인)
 * B: 15곳 최종 좌표 일치 확인 (Founder 2026-10-29)
 */
const puppeteer = require('../node_modules/puppeteer-core');
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const QA_URL = 'http://localhost:5000/muyojeong?qa_preview=boundary';
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Founder 최종 좌표 2026-10-29
const FINAL_COORDS = {
  // Zone 1 (6곳)
  lee_soon_shin_plaza:  { x: 0.401, y: 0.549, zone: 1, name: '이순신광장' },
  romantic_pojangmacha: { x: 0.613, y: 0.640, zone: 1, name: '낭만포차거리' },
  hamel_lighthouse:     { x: 0.564, y: 0.634, zone: 1, name: '하멜등대' },
  jinamgwan:            { x: 0.391, y: 0.474, zone: 1, name: '진남관' },
  opodae:               { x: 0.476, y: 0.549, zone: 1, name: '오포대' },
  marine_park:          { x: 0.474, y: 0.601, zone: 1, name: '종포해양공원' },
  // Zone 2 (9곳)
  odongdo:              { x: 0.853, y: 0.392, zone: 2, name: '오동도' },
  cablecar:             { x: 0.660, y: 0.544, zone: 2, name: '케이블카' },
  yeosu_expo_park:      { x: 0.558, y: 0.211, zone: 2, name: '엑스포공원' },
  sky_tower:            { x: 0.604, y: 0.137, zone: 2, name: '스카이타워' },
  jaisan_park:          { x: 0.581, y: 0.537, zone: 2, name: '자산공원' },
  aquaplanet:           { x: 0.586, y: 0.326, zone: 2, name: '아쿠아플라넷' },
  nangman_yacht:        { x: 0.657, y: 0.430, zone: 2, name: '낭만요트' },
  blue_yacht:           { x: 0.627, y: 0.414, zone: 2, name: '블루요트' },
  big_o_show:           { x: 0.549, y: 0.285, zone: 2, name: '빅오쇼' },
};

const getMarkersByZone = (markerList, zoneId) =>
  markerList.filter(m => FINAL_COORDS[m.code]?.zone === zoneId);

async function collectMarkers(page) {
  return page.evaluate(() => {
    return [...document.querySelectorAll('[style*="position: absolute"]')]
      .filter(el => el.title && !el.title.includes('[QA]') && !el.title.includes('정확도') && el.style.left)
      .map(el => ({
        title: el.title,
        left: parseFloat(el.style.left) / 100,
        top:  parseFloat(el.style.top)  / 100,
        code: el.getAttribute('data-code') || '',
      }));
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--incognito'],
  });
  const page = (await browser.pages())[0];
  await page.setViewport({ width: 390, height: 844 });
  await page.setCacheEnabled(false);

  const results = { zone1: null, zone2: null };
  const passed = [];
  const failed = [];

  try {
    // ── Zone 1 ──────────────────────────────────────────────
    await page.goto(QA_URL, { waitUntil: 'networkidle2', timeout: 20000 });
    await sleep(2000);
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === '지역별 보기')?.click()
    );
    await sleep(800);
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('원도심'))?.click()
    );
    await sleep(1500);

    const zone1Markers = await collectMarkers(page);
    results.zone1 = zone1Markers;

    // ── Zone 1 뒤로 → Zone 2 ────────────────────────────────
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('뒤로'))?.click()
    );
    await sleep(1000);
    await page.evaluate(() =>
      Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('오동도'))?.click()
    );
    await sleep(2500);

    const zone2Markers = await collectMarkers(page);
    results.zone2 = zone2Markers;

    // ── 분석 ─────────────────────────────────────────────────
    console.log('\n=== MAP V0.1 Zone Separation & Final Coordinate Verification ===\n');

    // T-Z1: Zone 1 마커 수 = 6
    const z1Count = zone1Markers.length;
    const t_z1_count = z1Count === 6;
    console.log(`T-Z1 Zone 1 마커 수 = 6: ${t_z1_count ? '✅ PASS' : '❌ FAIL'} (실제: ${z1Count}개)`);
    t_z1_count ? passed.push('T-Z1') : failed.push(`T-Z1 (${z1Count}개)`);

    // T-Z2: Zone 2 마커 수 = 9
    const z2Count = zone2Markers.length;
    const t_z2_count = z2Count === 9;
    console.log(`T-Z2 Zone 2 마커 수 = 9: ${t_z2_count ? '✅ PASS' : '❌ FAIL'} (실제: ${z2Count}개)`);
    t_z2_count ? passed.push('T-Z2') : failed.push(`T-Z2 (${z2Count}개)`);

    // T-Z3: Zone 1에 Zone 2 마커 없음
    const zone2NamesInZone1 = zone1Markers.filter(m =>
      ['오동도','케이블카','엑스포공원','스카이타워','자산공원','아쿠아플라넷','낭만요트','블루요트','빅오쇼'].some(n => m.title.includes(n))
    );
    const t_z3 = zone2NamesInZone1.length === 0;
    console.log(`T-Z3 Zone 1에 Zone 2 마커 없음: ${t_z3 ? '✅ PASS' : '❌ FAIL'} (Zone2@Zone1: ${zone2NamesInZone1.length}개)`);
    t_z3 ? passed.push('T-Z3') : failed.push(`T-Z3 (${zone2NamesInZone1.map(m=>m.title).join(',')})`);

    // T-Z4: Zone 2에 Zone 1 마커 없음
    const zone1NamesInZone2 = zone2Markers.filter(m =>
      ['이순신광장','낭만포차거리','하멜등대','진남관','오포대','종포해양공원'].some(n => m.title.includes(n))
    );
    const t_z4 = zone1NamesInZone2.length === 0;
    console.log(`T-Z4 Zone 2에 Zone 1 마커 없음: ${t_z4 ? '✅ PASS' : '❌ FAIL'} (Zone1@Zone2: ${zone1NamesInZone2.length}개)`);
    t_z4 ? passed.push('T-Z4') : failed.push(`T-Z4 (${zone1NamesInZone2.map(m=>m.title).join(',')})`);

    // T-C1~C15: 최종 좌표 일치
    console.log('\n── 좌표 대조 ──');
    const allMarkers = [...zone1Markers, ...zone2Markers];
    for (const [code, src] of Object.entries(FINAL_COORDS)) {
      const rendered = allMarkers.find(m => m.title.includes(src.name));
      const tid = `T-C-${code.slice(0,6)}`;
      if (!rendered) {
        console.log(`${tid} ${src.name}: ❌ FAIL — 미렌더링`);
        failed.push(`${tid}(미렌더링)`);
      } else {
        const xOk = Math.abs(rendered.left - src.x) < 0.003;
        const yOk = Math.abs(rendered.top  - src.y) < 0.003;
        const match = xOk && yOk;
        const rx = Math.round(rendered.left * 1000) / 1000;
        const ry = Math.round(rendered.top  * 1000) / 1000;
        console.log(`${tid} ${src.name}: ${match ? '✅' : '❌'} src(${src.x},${src.y}) render(${rx},${ry})`);
        match ? passed.push(tid) : failed.push(`${tid}(src:${src.x},${src.y} render:${rx},${ry})`);
      }
    }

    // ── 결과 요약 ────────────────────────────────────────────
    console.log(`\n총 ${passed.length + failed.length}개 중 PASS: ${passed.length} / FAIL: ${failed.length}`);
    if (failed.length === 0) {
      console.log('\n✅ MAP_V01_ZONE_SEPARATION_VERIFIED — 권역 분리 + 좌표 정합 완료');
    } else {
      console.log('\n❌ HOLD — 실패 항목:', failed.join(', '));
    }

  } finally {
    await browser.close();
  }
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
